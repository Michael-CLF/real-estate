const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const project=path.resolve(process.argv[2]||'.');
const cases=require('./fixtures/fixed-form-text-cases.cjs');
const {createCompletedContractFixture}=require('./fixtures/completed-contracts.cjs');
const registry=require(path.join(project,'functions/lib/offers/state-contracts/state-contract-registry.js'));
const {fixedFormText}=require(path.join(project,'functions/lib/offers/state-contracts/fixed-form-text-continuation.js'));
const {PDFDocument,StandardFonts,decodePDFRawStream}=require(require.resolve('pdf-lib',{paths:[path.join(project,'functions')]}));
const tx=require(path.join(project,'functions/lib/offers/state-contracts/texas/contracts/one-to-four-family-resale/trec-20-19-template.js')).TREC_20_19_TEMPLATE.fields;
const out=path.join(project,'tmp/navstreet-remaining-fixed-text');fs.mkdirSync(out,{recursive:true});
const normalize=s=>s.trim().replace(/\s+/g,' ');
function set(terms,key,value){const parts=key.split('.'),last=parts.pop();let section=terms;for(const part of parts)section=section[part];section[last]=value;}
function fields(form){return Object.fromEntries(form.getFields().filter(f=>typeof f.getText==='function').map(f=>[f.getName(),f.getText()||'']));}
function text(pdf,start){
 return pdf.getPages().slice(start).flatMap(p=>p.node.Contents().asArray().flatMap(ref=>{
  const s=Buffer.from(decodePDFRawStream(pdf.context.lookup(ref)).decode()).toString('latin1');
  return [...s.matchAll(/<([0-9A-F]+)>\s*Tj/gi)].map(m=>Buffer.from(m[1],'hex').toString('latin1'));
 })).join(' ');
}
(async()=>{
 let pdfs=0,comparisons=0;
 const now=new Date(),baselines={};
 for(const code of ['TX','OK']){
  const fixture=createCompletedContractFixture(project,code,now);
  const result=await registry.requireStateContractPackage(code).generateAgreement({...fixture,generatedAt:now,documentStatus:'approved',documentTitle:'Baseline'});
  const pdf=await PDFDocument.load(result.buffer);baselines[code]={fields:fields(pdf.getForm()),pages:pdf.getPageCount()};
 }
 for(const c of cases) {
  const names=c.code==='TX'?c.names.map(name=>tx[name]):c.names;
  // The former TX and OK word splitters have this same in-capacity behavior.
  for(let n=0;n<=500;n++){
   const value=Array(n).fill('word').join(' '),old=[];let line='';
   for(const word of value.split(/\s+/).filter(Boolean)){
    const candidate=line?line+' '+word:word;
    if(line&&candidate.length>c.width){old.push(line);line=word;}else line=candidate;
   }if(line)old.push(line);
   const prepared=fixedFormText(value,names.length,c.width);
   if(old.length<=names.length)assert.deepEqual(prepared.fields,old);
   else assert.equal(prepared.continuation,value);
   comparisons++;
  }
  const long='START '+Array(c.id==='trust-holder'?48:68).fill('word').join(' ')+' '+c.id.toUpperCase()+' END';
  for(const [scenario,value]of [['short','Short sample '+c.id+' END'],['boundary',Array(Math.floor(c.width/5)*names.length).fill('word').join(' ')],['overflow',long],['empty','']]){
   const fixture=createCompletedContractFixture(project,c.code,now),pkg=registry.requireStateContractPackage(c.code);
   set(fixture.version.terms,c.fieldPath,value);
   if(c.required&&scenario==='empty')assert.throws(()=>pkg.validateSubmission(fixture));
   else pkg.validateSubmission(fixture);
   const snapshot=JSON.stringify(fixture);
   const result=await pkg.generateAgreement({...fixture,generatedAt:now,documentStatus:'approved',documentTitle:c.code+' '+c.id+' '+scenario});
   assert.equal(JSON.stringify(fixture),snapshot);
   const pdf=await PDFDocument.load(result.buffer),actual=fields(pdf.getForm()),expected=fixedFormText(value,names.length,c.width);
   assert.equal(pdf.getPageCount(),result.pageCount);
   const font=await pdf.embedFont(StandardFonts.Helvetica);
   const clipped=expected.fields.some((value,index)=>{const f=pdf.getForm().getTextField(names[index]);const size=Number((f.acroField.getDefaultAppearance()||'').match(/([0-9.]+)\s+Tf/)?.[1])||9;return font.widthOfTextAtSize(value,size)>Math.min(...f.acroField.getWidgets().map(w=>w.getRectangle().width-4));});
   if(expected.continuation||clipped){assert(actual[names[0]].startsWith('See '));names.slice(1).forEach(name=>assert.equal(actual[name],''));}
   else assert.equal(normalize(names.map(name=>actual[name]).join(' ')),normalize(expected.fields.join(' ')));
   for(const [name,stored]of Object.entries(baselines[c.code].fields))if(!names.includes(name))assert.equal(actual[name],stored,c.id+': unrelated field changed');
   if(expected.continuation||clipped){
    assert(pdf.getPageCount()>baselines[c.code].pages,c.id+': missing continuation');
    assert(normalize(text(pdf,baselines[c.code].pages)).includes(normalize(value)),c.id+': complete text missing from appended page content');
   }else assert.equal(pdf.getPageCount(),baselines[c.code].pages);
   fs.writeFileSync(path.join(out,c.code+'-'+c.id+'-'+scenario+'.pdf'),result.buffer);pdfs++;
  }
 }
 assert.equal(pdfs,32);
 console.log('PASS: '+comparisons+' splitter comparisons and '+pdfs+' PDFs for eight TX/OK field groups; complete overflow text, short/boundary/empty mapping, unrelated fields, required-holder rejection and unchanged inputs.');
 console.log('This covers multiline fields only; single-field appearance capacity and live signing remain outside this check.');
})().catch(error=>{console.error(error);process.exitCode=1;});
