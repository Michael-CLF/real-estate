const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const project=path.resolve(process.argv[2]||'.');
const {createCompletedContractFixture}=require('./fixtures/completed-contracts.cjs');
const registry=require(path.join(project,'functions/lib/offers/state-contracts/state-contract-registry.js'));
const {PDFDocument,decodePDFRawStream}=require(require.resolve('pdf-lib',{paths:[path.join(project,'functions')]}));
const {Timestamp}=require(require.resolve('firebase-admin/firestore',{paths:[path.join(project,'functions')]}));
const out=path.join(project,'tmp/navstreet-fixed-form-signatures');fs.mkdirSync(out,{recursive:true});
function recordText(pdf,start) {
 return pdf.getPages().slice(start).flatMap(page=>{
  const streams=page.node.Contents().asArray();
  return streams.flatMap(ref=>{
   const source=Buffer.from(decodePDFRawStream(pdf.context.lookup(ref)).decode()).toString('latin1');
   return [...source.matchAll(/<([0-9A-F]+)>\s*Tj/gi)].map(match=>Buffer.from(match[1],'hex').toString('latin1'));
  });
 }).join('\n');
}
(async()=>{
 let generated=0;
 for(const code of ['TX','OK']) {
  const pkg=registry.requireStateContractPackage(code),now=new Date();
  let pendingPages;
  for(const scenario of ['pending','buyer-signed','fully-signed','many-parties','long-names']) {
   const fixture=createCompletedContractFixture(project,code,now);pkg.validateSubmission(fixture);
   if(scenario==='many-parties') {
    for(const role of ['buyers','sellers'])for(let i=2;i<=8;i++){
     const party=structuredClone(fixture.version[role][0]);
     party.partyUid+='-'+i;party.userUid+='-'+i;party.legalName+=' '+i;party.primaryParty=false;
     fixture.version[role].push(party);
    }
   }
   if(scenario==='long-names')for(const party of [...fixture.version.buyers,...fixture.version.sellers])
    party.legalName+=' '+Array(24).fill('Longname').join(' ');
   for(const party of [...fixture.version.buyers,...fixture.version.sellers]) {
    if(scenario!=='pending'&&(scenario!=='buyer-signed'||party.role==='buyer'))party.signature={
     status:'signed',signedAt:Timestamp.fromDate(new Date(party.role==='buyer'?'2026-01-15T18:00:00Z':'2026-07-15T18:00:00Z'))
    };
   }
   const before=JSON.stringify(fixture);
   const result=await pkg.generateAgreement({...fixture,generatedAt:now,documentStatus:'approved',documentTitle:code+' '+scenario+' signature check'});
   assert.equal(JSON.stringify(fixture),before);
   const pdf=await PDFDocument.load(result.buffer);assert.equal(pdf.getPageCount(),result.pageCount);
   if(scenario==='pending')pendingPages=pdf.getPageCount();
   else {
    assert(pdf.getPageCount()>pendingPages,code+': signature record missing');
    const text=recordText(pdf,pendingPages),compact=s=>s.replace(/\s+/g,'');
    for(const party of [...fixture.version.buyers,...fixture.version.sellers]){
     assert(compact(text).includes(compact(party.legalName)),code+': missing party');
     if(party.signature.status==='signed')assert(compact(text).includes(compact('/s/ '+party.legalName)),code+': missing signature');
    }
    assert(text.includes('CST'),code+': winter state time missing');
    if(scenario!=='buyer-signed')assert(text.includes('CDT'),code+': summer state time missing');
    else assert(text.includes('Electronic signature: Pending'),code+': pending seller represented as signed');
    if(scenario==='many-parties')assert(pdf.getPageCount()>pendingPages+1,code+': pagination not exercised');
   }
   fs.writeFileSync(path.join(out,code+'-'+scenario+'.pdf'),result.buffer);generated++;
  }
  const missing=createCompletedContractFixture(project,code,now);missing.version.buyers[0].signature={status:'signed'};
  await assert.rejects(()=>pkg.generateAgreement({...missing,generatedAt:now,documentStatus:'approved',documentTitle:'Missing timestamp'}),/stored signature timestamp/);
 }
 console.log('PASS: '+generated+' TX/OK PDFs; pending, partial, full, sixteen-party pagination and wrapped names; visible signature/name text, CST/CDT timestamps, input retention and missing-timestamp rejection.');
 console.log('Original signing PDFs and cached accepted PDFs stay immutable. Live signature authorization and delivery are not exercised by these synthetic snapshots.');
})().catch(error=>{console.error(error);process.exitCode=1;});
