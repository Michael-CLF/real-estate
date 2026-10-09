const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {CODES,createCompletedContractFixture}=require('./fixtures/completed-contracts.cjs');
const project=path.resolve(process.argv[2]||'.');
const registry=require(path.join(project,'functions/lib/offers/state-contracts/state-contract-registry.js'));
const {createCounterofferTerms,resetPartySignatures}=require(path.join(project,'functions/lib/offers/counteroffer-draft-data.js'));
const {prependNavStreetContractSummary}=require(path.join(project,'functions/lib/offers/state-contracts/navstreet-pdf-layout.js'));
const {PDFDocument}=require(require.resolve('pdf-lib',{paths:[path.join(project,'functions')]}));
const out=path.resolve(process.argv[3]||path.join(project,'tmp/navstreet-completed-contracts'));fs.mkdirSync(out,{recursive:true});
const clone=value=>structuredClone(value);const now=new Date();let validated=0,rejections=0,pdfs=0;
(async()=>{
 for(const code of CODES) {
  const pkg=registry.requireStateContractPackage(code);const initial=createCompletedContractFixture(project,code,now);
  const before=JSON.stringify(initial);pkg.validateSubmission(initial);validated++;
  assert.equal(JSON.stringify(initial),before,`${code}: submission validator mutated fixture`);
  for(const change of [
    input=>{input.version.terms.delivery.electronicDeliveryAuthorized=false;},
    input=>{input.version.buyers[0].identityVerification.status='not_started';},
    input=>{input.version.terms.delivery.expiresAt='invalid';input.version.expiresAt='invalid';},
    input=>{if(code==='TX')input.version.terms.salesPrice.salesPriceInCents=0;else input.version.terms.purchase.purchasePriceInCents=0;},
  ]) {const bad=clone(initial);change(bad);assert.throws(()=>pkg.validateSubmission(bad),`${code}: incomplete fixture was accepted`);rejections++;}
  const counter=clone(initial);counter.version.terms=createCounterofferTerms(initial.version.terms);
  counter.version.buyers=resetPartySignatures(initial.version.buyers);counter.version.sellers=resetPartySignatures(initial.version.sellers);
  assert.equal(counter.version.terms.delivery.expiresAt,'');assert.equal(counter.version.terms.delivery.electronicDeliveryAuthorized,false);
  for(const party of [...counter.version.buyers,...counter.version.sellers]){
    assert.equal(party.signature.status,'not_started');assert.equal(party.electronicTransactionsConsentAccepted,false);
  }
  counter.version.Uid='sample-counteroffer';counter.offer.currentVersionUid=counter.version.Uid;
  counter.version.versionNumber=2;counter.version.initiatedBy='seller';counter.version.initiatedByUid='seller';
  counter.version.expiresAt='';assert.throws(()=>pkg.validateSubmission(counter),`${code}: uncompleted counteroffer accepted`);rejections++;
  const t=counter.version.terms;
  if(code==='TX'){t.salesPrice.salesPriceInCents=36000000;t.salesPrice.cashPortionInCents=36000000;}
  else{t.purchase.purchasePriceInCents=36000000;if(code==='CO')t.purchase.cashAtClosingInCents=35900000;}
  t.delivery.expiresAt=new Date(now.getTime()+60*3600000).toISOString();t.delivery.electronicDeliveryAuthorized=true;
  counter.version.expiresAt=t.delivery.expiresAt;
  for(const party of [...counter.version.buyers,...counter.version.sellers])party.electronicTransactionsConsentAccepted=true;
  pkg.validateSubmission(counter);validated++;
  assert.equal(JSON.stringify(initial),before,`${code}: counteroffer altered source`);
  const invalidCounter=clone(counter);invalidCounter.version.sellers[0].identityVerification.status='not_started';
  assert.throws(()=>pkg.validateSubmission(invalidCounter),`${code}: unverified seller counteroffer accepted`);rejections++;
  for(const [scenario,fixture]of [['initial',initial],['counteroffer',counter]]) {
    const snapshot=JSON.stringify(fixture);
    const input={...fixture,documentTitle:`Sample ${code} completed ${scenario} agreement`,generatedAt:now,documentStatus:'prototype'};
    const agreement=await pkg.generateAgreement(input);
    assert.equal((await PDFDocument.load(agreement.buffer)).getPageCount(),agreement.pageCount,`${code}/${scenario}: agreement page count`);
    const summary=pkg.getAgreementSummary(input);
    const pdf=await prependNavStreetContractSummary(input,summary,agreement);
    const parsed=await PDFDocument.load(pdf.buffer);assert.equal(parsed.getPageCount(),pdf.pageCount);
    assert(pdf.pageCount>agreement.pageCount);assert.equal(pdf.buffer.subarray(0,5).toString(),'%PDF-');
    assert.equal(JSON.stringify(fixture),snapshot,`${code}/${scenario}: rendering mutated fixture`);
    fs.writeFileSync(path.join(out,`${code}-${scenario}.pdf`),pdf.buffer);pdfs++;
    console.log(`${code} ${scenario}: validator passed, ${pdf.pageCount} PDF pages`);
  }
 }
 console.log(`PASS: ${validated} ten-state completed initial/counteroffer submissions, ${rejections} incomplete/identity rejection checks and ${pdfs} generated PDFs.`);
 console.log('Cash fixtures cover the first registered contract only. They do not fetch attached disclosures, perform live signing or certify legal sufficiency.');
})().catch(error=>{console.error(error);process.exitCode=1;});
