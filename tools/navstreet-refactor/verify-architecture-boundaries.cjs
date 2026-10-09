const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const project=path.resolve(process.argv[2]||'.'),functionsRoot=path.join(project,'functions'),ts=require(require.resolve('typescript',{paths:[functionsRoot]}));
const registry=require(path.join(functionsRoot,'lib/offers/state-contracts/state-contract-registry.js'));
const codes=['NC','TX','OK','UT','WI','FL','LA','CO','CA','SC'];
function source(name){return fs.readFileSync(path.join(project,name),'utf8');}
const loaded=new Map();function load(file){file=path.resolve(file);if(loaded.has(file))return loaded.get(file);const mod={exports:{}};loaded.set(file,mod.exports);
 const compiled=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(compiled,{module:mod,exports:mod.exports,require:name=>load(path.resolve(path.dirname(file),name+'.ts'))});return mod.exports;}
const select=load(path.join(project,'src/app/features/offers/engine/listing-document-policy.registry.ts')).selectOfferListingDocuments;
const types=['lead-based-paint','texas-residential-leases','texas-fixture-leases','texas-natural-resource-leases','texas-future-leases','texas-other','california-transfer-disclosure'];
let comparisons=0;
for(const residentialLeasesExist of [undefined,null,false,true])for(const fixtureLeasesExist of [undefined,null,false,true])for(const naturalResourceLeasesExist of [undefined,null,false,true])
 for(const section of ['leases','disclosures','property','missing']){
  const terms={leases:{residentialLeasesExist,fixtureLeasesExist,naturalResourceLeasesExist}},documents=types.map(documentType=>({documentType}));
  const old=documents.filter(d=>section==='leases'?({'texas-residential-leases':residentialLeasesExist,'texas-fixture-leases':fixtureLeasesExist,'texas-natural-resource-leases':naturalResourceLeasesExist}[d.documentType]===true):
   section==='disclosures'?(!d.documentType.startsWith('texas-')||!d.documentType.endsWith('-leases')):false);
  assert.deepEqual(Array.from(select(section,terms,documents),d=>d.documentType),old.map(d=>d.documentType));comparisons++;
 }
const listingRegistry=source('functions/src/listings/state-listing-packages/state-listing.registry.ts');assert(!listingRegistry.includes("statePackage.stateCode === 'SC'"));assert(listingRegistry.includes('validateAdditionalSellerStatements'));
const shell=source('src/app/features/offers/engine/offer-wizard-shell/offer-wizard-shell.component.ts');assert(!/texas-|leases\.(residential|fixture|natural)/.test(shell));
for(const name of ['create-offer-draft','submit-offer','save-offer-draft','create-counteroffer']){
 const text=source('functions/src/offers/'+name+'.ts');assert(!/import[^;]+(?:assert(?:Florida|Louisiana|Colorado)ListingDisclosures|read(?:California|SouthCarolina)ListingDisclosures)/.test(text),name+': direct state disclosure import');
 assert(text.includes('listingDisclosurePolicy'),name+': package hook missing');
}
for(const code of codes){
 const pkg=registry.requireStateContractPackage(code),policy=pkg.listingDisclosurePolicy;
 const gateNames={FL:['florida','Florida'],LA:['louisiana','Louisiana'],CO:['colorado','Colorado']};
 if(gateNames[code]){
  const [slug,name]=gateNames[code],fn=require(path.join(functionsRoot,'lib/offers/'+slug+'-listing-disclosure-gate.js'))['assert'+name+'ListingDisclosures'];
  assert.equal(policy.assertReady,fn);
  assert.equal(policy.assertCounterofferReady,code==='FL'?undefined:fn);
 }
 if(['CA','SC'].includes(code)){
  const slug=code==='CA'?'california':'south-carolina',fnName=code==='CA'?'readCaliforniaListingDisclosures':'readSouthCarolinaListingDisclosures';
  assert.equal(policy.readVersions,require(path.join(functionsRoot,'lib/offers/state-contracts/'+slug+'/'+slug+'-state-contract.package.js'))[fnName]);
  assert.equal(policy.supportsUnsignedRevision,true);
  const versions={sample:'v1'};assert.equal(policy.reviewedVersions({version:{terms:{documentVersions:versions}}}),versions);
 }else assert.equal(policy?.supportsUnsignedRevision,undefined);
 assert.equal(typeof pkg.getAgreementSummary,'function');assert.equal(typeof pkg.generateAgreement,'function');
}
(async()=>{
 for(const code of ['CA','SC']){
  const pkg=registry.requireStateContractPackage(code),reference={id:'listing',collection:()=>({doc:id=>({id})})},transaction={get:async()=>({data:()=>({})})},listing={sellerUid:'seller'};
  const expected=await pkg.listingDisclosurePolicy.readVersions(transaction,reference,listing);
  const actual=await pkg.listingDisclosurePolicy.initialListingData(transaction,reference,listing);
  assert.deepEqual(actual,{[code==='CA'?'californiaReadiness':'southCarolinaDocuments']:expected});
 }
 console.log('PASS: '+comparisons+' original document-selection comparisons; package-owned FL/LA/CO gate identity and CA/SC readers/initial facts/reviewed versions/unsigned capabilities, ten-state PDF/summary hooks and shared dispatch boundaries.');
 console.log('Legacy draft repair and bespoke listing controls remain documented compatibility seams; this is not a live Firebase test.');
})().catch(e=>{console.error(e);process.exitCode=1;});
