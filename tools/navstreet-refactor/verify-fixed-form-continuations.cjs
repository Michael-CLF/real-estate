const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const project=path.resolve(process.argv[2]||'.');
const {createCompletedContractFixture}=require('./fixtures/completed-contracts.cjs');
const registry=require(path.join(project,'functions/lib/offers/state-contracts/state-contract-registry.js'));
const {fixedFormText,wrapContinuationText}=require(path.join(project,'functions/lib/offers/state-contracts/fixed-form-text-continuation.js'));
const {PDFDocument,StandardFonts}=require(require.resolve('pdf-lib',{paths:[path.join(project,'functions')]}));
const tx=require(path.join(project,'functions/lib/offers/state-contracts/texas/contracts/one-to-four-family-resale/trec-20-19-template.js')).TREC_20_19_TEMPLATE.fields;
const out=path.join(project,'tmp/navstreet-fixed-form-continuations');fs.mkdirSync(out,{recursive:true});
const normalize=s=>s.trim().replace(/\s+/g,' ');
let comparisons=0;
function oldLines(value,count) {
 const lines=[];let line='';
 for(const word of value.trim().split(/\s+/u).filter(Boolean)) {
  const candidate=line?line+' '+word:word;
  if(line&&candidate.length>105){lines.push(line);line=word;}else line=candidate;
 }
 if(line)lines.push(line);
 return lines.slice(0,count);
}
(async()=>{
 const sample=await PDFDocument.create(),font=await sample.embedFont(StandardFonts.Helvetica);
 for(const count of [3,4]) for(let length=0;length<=1000;length++) {
  const text=Array.from({length},(_,i)=>'word'+i).join(' ');
  const result=fixedFormText(text,count);
  if(result.continuation)assert.equal(result.continuation,text);
  else assert.deepEqual(result.fields,oldLines(text,count));
  comparisons++;
 }
 for(const text of ['one two\nthree four','X'.repeat(5000),'START '+Array(650).fill('sample content').join(' ')+' END']) {
  const lines=wrapContinuationText(text,font,516,10);
  assert.equal(lines.join('').replace(/\s/g,''),text.replace(/\s/g,''));
  for(const line of lines)assert(font.widthOfTextAtSize(line,10)<=516+.001);
 }
 let pdfs=0;
 for(const code of ['TX','OK']) {
  const count=code==='TX'?3:4,pkg=registry.requireStateContractPackage(code),now=new Date();
  const fieldNames=code==='TX'?[tx.specialProvisionsLine1,tx.specialProvisionsLine2,tx.specialProvisionsLine3]:
   ['Text Field 116','Text Field 117','Text Field 118','Text Field 119'];
  let ordinaryPages;
  for(const [scenario,text,included]of [
   ['short','Complete short provisions END',true],
   ['boundary',Array(count*21).fill('word').join(' '),true],
   ['long','START '+Array(650).fill('sample').join(' ')+' COMPLETE END',true],
   ['unbroken','X'.repeat(2500)+'END',true],
   ['excluded','Excluded provisions must not print END',false],
  ]) {
   const fixture=createCompletedContractFixture(project,code,now);
   const section=code==='TX'?fixture.version.terms.specialProvisions:fixture.version.terms.additionalProvisions;
   section.included=included;section.partyProvidedText=text;if(code==='TX')section.preparedBy='buyer';
   pkg.validateSubmission(fixture);
   const before=JSON.stringify(fixture);
   const pdf=await pkg.generateAgreement({...fixture,generatedAt:now,documentStatus:'approved',documentTitle:code+' '+scenario+' continuation check'});
   assert.equal(JSON.stringify(fixture),before);
   const parsed=await PDFDocument.load(pdf.buffer),form=parsed.getForm();
   assert.equal(parsed.getPageCount(),pdf.pageCount);
   const printed=normalize(fieldNames.map(name=>form.getTextField(name).getText()||'').join(' '));
   const expected=fixedFormText(included?text:undefined,count);
   const font=await parsed.embedFont(StandardFonts.Helvetica);
   const clipped=expected.fields.some((value,index)=>{const f=form.getTextField(fieldNames[index]);const size=Number((f.acroField.getDefaultAppearance()||'').match(/([0-9.]+)\s+Tf/)?.[1])||9;return font.widthOfTextAtSize(value,size)>Math.min(...f.acroField.getWidgets().map(w=>w.getRectangle().width-4));});
   if(expected.continuation||clipped){assert(printed.startsWith('See '));fieldNames.slice(1).forEach(name=>assert.equal(form.getTextField(name).getText()||'',''));}
   else assert.equal(printed,normalize(expected.fields.join(' ')));
   if(scenario==='short')ordinaryPages=pdf.pageCount;
   if(expected.continuation||clipped)assert(pdf.pageCount>ordinaryPages,code+': continuation page missing');
   else assert.equal(pdf.pageCount,ordinaryPages,code+': unexpected continuation page');
   fs.writeFileSync(path.join(out,code+'-'+scenario+'.pdf'),pdf.buffer);pdfs++;
  }
 }
 console.log('PASS: '+comparisons+' fixed-field fit/overflow comparisons, normal/long-token wrap preservation and '+pdfs+' TX/OK continuation PDFs, canonical fields, page counts and input retention.');
 console.log('Scope: TX special provisions and OK additional provisions only. Other fixed-form fields and visible signatures remain separate work.');
})().catch(error=>{console.error(error);process.exitCode=1;});
