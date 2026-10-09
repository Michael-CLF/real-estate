const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const project=path.resolve(process.argv[2]||'.');
const {createCompletedContractFixture}=require('./fixtures/completed-contracts.cjs');
const pkg=require(path.join(project,'functions/lib/offers/state-contracts/state-contract-registry.js')).requireStateContractPackage('OK');
const {PDFDocument,StandardFonts,decodePDFRawStream}=require(require.resolve('pdf-lib',{paths:[path.join(project,'functions')]}));
const out=path.join(project,'tmp/navstreet-ok-single-text');fs.mkdirSync(out,{recursive:true});
const cases=[
 {id:'legal-description',name:'Text Field 74',parts:['legalDescription'],required:true},
 {id:'possession',name:'Text Field 90',parts:['closing','possessionTerms']},
 {id:'investigations',name:'Text Field 99',parts:['timePeriods','additionalInvestigations']},
];
function textFields(pdf){return Object.fromEntries(pdf.getForm().getFields().filter(f=>typeof f.getText==='function').map(f=>[f.getName(),f.getText()||'']));}
function drawnText(pdf,start){return pdf.getPages().slice(start).flatMap(p=>p.node.Contents().asArray().flatMap(ref=>{
 const s=Buffer.from(decodePDFRawStream(pdf.context.lookup(ref)).decode()).toString('latin1');
 return [...s.matchAll(/<([0-9A-F]+)>\s*Tj/gi)].map(m=>Buffer.from(m[1],'hex').toString('latin1'));
})).join('\n');}
(async()=>{
 const now=new Date(),base=createCompletedContractFixture(project,'OK',now);
 const input=f=>({...f,generatedAt:now,documentStatus:'approved',documentTitle:'Oklahoma single-field check'});
 const original=await pkg.generateAgreement(input(base)),baseline=await PDFDocument.load(original.buffer),font=await baseline.embedFont(StandardFonts.Helvetica),stored=textFields(baseline);
 let count=0;
 for(const c of cases){
  const field=baseline.getForm().getTextField(c.name),width=Math.min(...field.acroField.getWidgets().map(w=>w.getRectangle().width-4));
  const size=Number((field.acroField.getDefaultAppearance()||'').match(/([0-9.]+)\s+Tf/)?.[1])||9;
  const fit=Math.floor(width/font.widthOfTextAtSize('W',size));
  for(const [scenario,value,continuation]of [
   ['short','Short sample '+c.id+' END',false],
   ['boundary','W'.repeat(fit),false],
   ['overflow','W'.repeat(fit+1),true],
   ['long','START '+Array(100).fill('sample').join(' ')+' '+c.id+' COMPLETE END',true],
   ['multiline','First sample line\nSecond sample line END',true],
   ['empty','',false],
   ['missing',undefined,false],
  ]){
   const fixture=createCompletedContractFixture(project,'OK',now);let section=fixture.version.terms;
   for(const key of c.parts.slice(0,-1))section=section[key];if(scenario==='missing')delete section[c.parts.at(-1)];else section[c.parts.at(-1)]=value;
   if(c.required&&(scenario==='empty'||scenario==='missing'))assert.throws(()=>pkg.validateSubmission(fixture));else pkg.validateSubmission(fixture);
   const before=JSON.stringify(fixture),result=await pkg.generateAgreement(input(fixture));
   assert.equal(JSON.stringify(fixture),before);
   const pdf=await PDFDocument.load(result.buffer),actual=textFields(pdf);
   assert.equal(pdf.getPageCount(),result.pageCount);
   for(const [name,text]of Object.entries(stored))if(name!==c.name)assert.equal(actual[name],text,c.id+': unrelated field changed');
   if(continuation){
    assert.equal(actual[c.name],'See appended continuation page.');
    assert(pdf.getPageCount()>original.pageCount);
    const rendered=drawnText(pdf,original.pageCount).replace(/\s+/g,'');
    assert(rendered.includes(value.replace(/\s+/g,'')),c.id+': missing continuation content');
    assert(font.widthOfTextAtSize(actual[c.name],size)<=width,c.id+': reference clips');
   }else{assert.equal(actual[c.name],value??'');assert.equal(pdf.getPageCount(),original.pageCount);}
   fs.writeFileSync(path.join(out,'OK-'+c.id+'-'+scenario+'.pdf'),result.buffer);count++;
  }
 }
 assert.equal(count,21);
 console.log('PASS: '+count+' Oklahoma legal-description/possession/investigation PDFs; exact width boundary, overflow and multiline text preservation, unchanged short/empty values, unrelated fields and required legal-description rejection.');
 console.log('Other single fields, cached documents and live signing remain outside this check.');
})().catch(error=>{console.error(error);process.exitCode=1;});
