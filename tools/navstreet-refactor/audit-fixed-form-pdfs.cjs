// Diagnostic audit: known gaps are reported, never represented as production-readiness passes.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createCompletedContractFixture}=require('./fixtures/completed-contracts.cjs');
const project=path.resolve(process.argv[2]||'.');
const registry=require(path.join(project,'functions/lib/offers/state-contracts/state-contract-registry.js'));
const {PDFDocument}=require(require.resolve('pdf-lib',{paths:[path.join(project,'functions')]}));
const {Timestamp}=require(require.resolve('firebase-admin/firestore',{paths:[path.join(project,'functions')]}));
const tx=require(path.join(project,'functions/lib/offers/state-contracts/texas/contracts/one-to-four-family-resale/trec-20-19-template.js')).TREC_20_19_TEMPLATE.fields;
const normalize=s=>s.trim().replace(/\s+/g,' ');
const report={capacity:[],signatureFields:[],limitations:['No live signing, disclosure fetch or text appearance/layout assertion. Canonical PDF field values are checked.']};
const now=new Date();
async function render(code,fixture) {
 const before=JSON.stringify(fixture),pkg=registry.requireStateContractPackage(code);
 pkg.validateSubmission(fixture);
 const pdf=await pkg.generateAgreement({...fixture,generatedAt:now,documentStatus:'approved',documentTitle:'Fixed form diagnostic '+code});
 assert.equal(JSON.stringify(fixture),before,code+': rendering changed input');
 const parsed=await PDFDocument.load(pdf.buffer);assert.equal(parsed.getPageCount(),pdf.pageCount);
 const form=parsed.getForm(),values={};
 for(const field of form.getFields())if(typeof field.getText==='function')values[field.getName()]=field.getText()||'';
 return {form,values,pageCount:pdf.pageCount};
}
(async()=>{
 for(const code of ['TX','OK']) {
  const names=code==='TX'?[tx.specialProvisionsLine1,tx.specialProvisionsLine2,tx.specialProvisionsLine3]:
   ['Text Field 116','Text Field 117','Text Field 118','Text Field 119'];
  for(const [scenario,text,included]of [
   ['excluded','Excluded text must stay absent',false],
   ['short','Agreed sample provision BEGIN retained text END',true],
   ['boundary',Array(names.length*21).fill('word').join(' '),true],
   ['overflow','BEGIN '+Array(160).fill('sample').join(' ')+' END',true],
  ]) {
   const fixture=createCompletedContractFixture(project,code,now);
   const section=code==='TX'?fixture.version.terms.specialProvisions:fixture.version.terms.additionalProvisions;
   section.included=included;section.partyProvidedText=text;if(code==='TX')section.preparedBy='buyer';
   const {form,pageCount}=await render(code,fixture);
   const printed=normalize(names.map(name=>form.getTextField(name).getText()||'').join(' '));
   if(!included)assert.equal(printed,'',code+': excluded provisions printed');
   if(scenario==='short'||scenario==='boundary')assert.equal(printed,normalize(text),code+': in-capacity text lost');
   const continuation=printed.includes('See appended continuation page');
   const loss=included&&!continuation&&printed!==normalize(text);
   report.capacity.push({code,scenario,inputCharacters:normalize(text).length,storedFieldCharacters:printed.length,completeInFields:!included||printed===normalize(text),continuationReference:continuation,pageCount,omittedTail:loss?normalize(text).slice(printed.length).trim():''});
   if(continuation)console.log(code+' '+scenario+': complete provisions referenced on appended continuation page.');
   if(loss)console.log('GAP: '+code+' '+scenario+' provisions omit '+(normalize(text).length-printed.length)+' characters from PDF fields.');
  }
  const fixture=createCompletedContractFixture(project,code,now);
  const pending=await render(code,fixture);
  for(const party of [...fixture.version.buyers,...fixture.version.sellers])
   party.signature={status:'signed',signedAt:Timestamp.fromDate(now),typedSignature:party.legalName};
  const signed=await render(code,fixture);
  const changed=Object.keys(signed.values).filter(name=>signed.values[name]!==pending.values[name]);
  const visibleTypedSignature=Object.values(signed.values).some(value=>value.includes('/s/')||value.includes('Electronically signed'));
  report.signatureFields.push({code,changedFields:changed.map(name=>({name,before:pending.values[name],after:signed.values[name]})),visibleTypedSignatureInFields:visibleTypedSignature,appendedSignatureRecordPages:signed.pageCount-pending.pageCount});
  console.log(code+': '+changed.length+' original form text fields change for signed snapshots; appended signature record pages: '+(signed.pageCount-pending.pageCount)+'.');
 }
 const out=path.join(project,'tmp/navstreet-fixed-form-audit.json');
 fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
 console.log('Audit finished: short/boundary/excluded field assertions passed. Review GAP lines; completion is not a passed overflow or live-signing check. Report: '+out);
})().catch(error=>{console.error(error);process.exitCode=1;});
