const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {CODES,createCompletedContractFixture}=require('./fixtures/completed-contracts.cjs');
const project=path.resolve(process.argv[2]||'.');
const registry=require(path.join(project,'functions/lib/offers/state-contracts/state-contract-registry.js'));
const {Timestamp}=require(require.resolve('firebase-admin/firestore',{paths:[path.join(project,'functions')]}));
const {PDFDocument}=require(require.resolve('pdf-lib',{paths:[path.join(project,'functions')]}));
const {prependNavStreetContractSummary}=require(path.join(project,'functions/lib/offers/state-contracts/navstreet-pdf-layout.js'));
const out=path.resolve(process.argv[3]||path.join(project,'tmp/navstreet-signed-contracts'));
fs.mkdirSync(out,{recursive:true});
const now=new Date();let count=0;
const longText=label=>label+' '+Array.from({length:24},(_,i)=>'Recorded sample reference '+(i+1)+' describes the boundary and agreed property details.').join(' ')+' '+label+' END';
(async()=>{
 for(const code of CODES) {
  const pkg=registry.requireStateContractPackage(code);
  for(const scenario of ['pending','buyer-signed','fully-signed','long-content']) {
   // Fixed-field TX/OK forms need separate capacity tests; no invented continuation attachment here.
   if(scenario==='long-content'&&['TX','OK'].includes(code))continue;
   const fixture=createCompletedContractFixture(project,code,now,'financed');
   if(scenario==='long-content') {
    const legal=longText('LEGAL '+code);
    if(code==='NC')fixture.version.terms.property.legalDescription=legal;
    else fixture.version.terms.legalDescription=legal;
    if('additionalTerms' in fixture.version.terms)fixture.version.terms.additionalTerms=longText('ADDITIONAL '+code);
   }
   pkg.validateSubmission(fixture);
   for(const [role,parties]of [['buyer',fixture.version.buyers],['seller',fixture.version.sellers]]) {
    for(const party of parties) {
     const signed=scenario==='fully-signed'||scenario==='long-content'||scenario==='buyer-signed'&&role==='buyer';
     if(signed)party.signature={status:'signed',signedAt:Timestamp.fromDate(new Date(now.getTime()+(role==='seller'?60000:0))),typedSignature:party.legalName};
    }
   }
   const snapshot=JSON.stringify(fixture);
   const input={...fixture,documentTitle:'Sample '+code+' '+scenario+' contract',generatedAt:now,documentStatus:'approved'};
   const agreement=await pkg.generateAgreement(input);
   const pdf=await prependNavStreetContractSummary(input,pkg.getAgreementSummary(input),agreement);
   const parsed=await PDFDocument.load(pdf.buffer);
   assert.equal(parsed.getPageCount(),pdf.pageCount);
   assert(pdf.pageCount>agreement.pageCount);
   assert.equal(JSON.stringify(fixture),snapshot,code+'/'+scenario+': PDF mutated signature or terms');
   fs.writeFileSync(path.join(out,code+'-'+scenario+'.pdf'),pdf.buffer);count++;
   console.log(code+' '+scenario+': '+pdf.pageCount+' pages');
  }
 }
 assert.equal(count,38);
 console.log('PASS: 30 ten-state pending/partial/full signature PDFs and eight long-content PDFs; page counts and unchanged input snapshots.');
 console.log('Signature snapshots are synthetic, not live signing. TX/OK signature overlays and fixed-field text capacity, uploaded attachments, and maximum accepted field lengths remain separate checks. Visual/text extraction review is required to assess rendered content.');
})().catch(error=>{console.error(error);process.exitCode=1;});
