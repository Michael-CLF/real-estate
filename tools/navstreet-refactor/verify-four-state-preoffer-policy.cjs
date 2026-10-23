const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const project=path.resolve(process.argv[2]||'.'),ts=require(require.resolve('typescript',{paths:[project]})),cache=new Map();
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file);const module={exports:{}};cache.set(file,module.exports);vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module,exports:module.exports,require:n=>load(path.resolve(path.dirname(file),n+'.ts')),Set,Map,Date,Intl,console});cache.set(file,module.exports);return module.exports;}
const front=f=>load(path.join(project,'src/app',f+'.ts')),back=f=>require(path.join(project,'functions/lib',f+'.js'));
const gates=front('core/configuration/listing-disclosure-gates'),catalog=front('core/configuration/state-disclosures.config'),registry=back('offers/state-contracts/state-contract-registry');
const facts={isCondominium:false,isDeveloperSale:false,isLeasehold:false};
const listing=(code,year,conditionExempt=false,radonExempt=false)=>({propertyType:'single_family',yearBuilt:year,sellerStatements:{contractFacts:facts,ownersAssociationApplies:false,generalLeasesExist:false,leasesExist:false,leadBasedPaintApplies:year<1978,[{ME:'maine',MS:'mississippi',AR:'arkansas',IL:'illinois'}[code]]:{disclosureExemptionClaimed:conditionExempt,radonExemptionClaimed:radonExempt}}});
const person=role=>({partyUid:role,userUid:role,role,legalName:'Fictional '+role,email:role+'@example.com',phone:'5555550100',requiredSigner:true,identityVerification:{status:'verified'},signature:{status:'pending'}});
let checks=0;const check=(x,message)=>{assert(x,message);checks++;};
function fixture(code,l){const pkg=registry.requireEnabledStateContractPackage(code),t=pkg.createInitialOfferTerms({contractType:pkg.contractTypes[0],property:{listingUid:'sample',state:code,county:'Test County',propertyType:'single_family',yearBuilt:2000,addressLine1:'100 Fictional St',city:'Test City',zipCode:'00000',legalDescription:'Fictional Lot 1',listPriceInCents:35000000,contractFacts:facts},listingData:l});Object.assign(t.purchase,{hasEarnestMoney:false,financingType:'cash',loanAmountInCents:0});Object.assign(t.conditions,{financing:false,appraisal:false,additionalEarnestMoney:false});t.deadlines.settlementDate='2099-12-01';Object.assign(t.settlement,{specialAssessmentPayer:'seller',titlePolicyPayer:'seller'});Object.assign(t.delivery,{expiresAt:'2099-10-01T12:00:00Z',electronicDeliveryAuthorized:true});return {pkg,t,offer:{Uid:'offer',listingUid:'sample',stateCode:code,currentVersionUid:'v'},version:{Uid:'v',offerUid:'offer',stateCode:code,terms:t,initiatedBy:'buyer',initiatedByUid:'buyer',versionNumber:1,buyers:[person('buyer')],sellers:[person('seller')],immutable:false,status:'draft',expiresAt:t.delivery.expiresAt}};}
(async()=>{
for(const [code,slug] of [['ME','maine'],['MS','mississippi'],['AR','arkansas'],['IL','illinois']]){
 const gate=back('offers/'+slug+'-listing-disclosure-gate'),required=gate[slug+'RequiredDisclosureTypes'];
 for(const year of [1977,1978,2000])for(const exempt of [false,true])for(const radonExempt of [false,true])for(const type of ['single_family','condo','townhome','pud']){
  const l=listing(code,year,exempt,radonExempt);l.propertyType=type;l.sellerStatements.contractFacts={...facts,isCondominium:type==='condo'};const expected=[...(!exempt&&['ME','IL'].includes(code)?[slug+'-seller-disclosure']:[]),...(code==='IL'&&!radonExempt?['illinois-statutory-packet']:[]),...(year<1978?['lead-based-paint']:[])];
  check(JSON.stringify(required(l))===JSON.stringify(expected),code+' exact server gates');check(JSON.stringify(gates.getListingUploadGateDocumentTypes(code,{...l.sellerStatements,yearBuilt:year,propertyType:type}))===JSON.stringify(expected),code+' client parity');
  for(const item of catalog.getStateDisclosureRequirements(code))check(catalog.isDisclosureRequiredForListing(code,item,{...l.sellerStatements,yearBuilt:year,propertyType:type})===expected.includes(item.documentType),code+' required badge/count parity '+item.documentType);
 }
 const l=listing(code,2000),f=fixture(code,l);const ui=front('features/offers/states/'+slug+'/'+slug+'-offer-package')[slug.toUpperCase()+'_OFFER_PACKAGE'];
 if(code==='MS'||code==='AR'){f.pkg.validateSubmission(f);for(const signerRole of ['buyer','seller'])f.pkg.validateBeforeSigning({...f,signerRole});check(ui.validate(f.t,f.version.buyers,f.version.sellers,{mode:'submit'}).valid,code+' optional records cannot block');}
 if(code==='MS'){
  const listingPackage=back('listings/state-listing-packages/mississippi-listing.package').mississippiListingPackage;check(!listingPackage.validateAdditionalSellerStatements,'MS has no broker or state exception questionnaire');
  check(!Object.keys(f.t.disclosures).some(x=>/broker|licens/i.test(x)),'No broker fields in new terms');check(!ui.getSections(f.t).flatMap(s=>s.questions).some(q=>/broker|licens/i.test(q.fieldPath??'')),'No offer broker questions');
  const forged=structuredClone(f.t);forged.disclosures.buyerUsesBroker=true;forged.disclosures.sellerBrokerInvolved=true;const clean=f.pkg.sanitizeDraftTerms({currentTerms:f.t,requestedTerms:forged,initiatedBy:'buyer'});check(!Object.keys(clean.disclosures).some(x=>/broker|licens/i.test(x)),'Ignore unsupported forged license answers');
 }
 if(code==='ME'||code==='IL'){
  assert.throws(()=>f.pkg.validateSubmission(f));check(!ui.validate(f.t,f.version.buyers,f.version.sellers,{mode:'draft'}).valid,'Required receipt disables Continue before final submit');f.t.disclosures.propertyConditionStatus='received';f.t.documentVersions[slug+'-seller-disclosure']='condition-v1';
  if(code==='IL'){
   assert.throws(()=>f.pkg.validateSubmission(f));for(const signerRole of ['buyer','seller'])assert.throws(()=>f.pkg.validateBeforeSigning({...f,signerRole}));
   f.t.disclosures.statutoryPacketStatus='received';f.t.disclosures.radonNoticeAcknowledged=true;assert.throws(()=>f.pkg.validateSubmission(f));f.t.documentVersions['illinois-statutory-packet']='radon-v1';
   const invalid=structuredClone({offer:f.offer,version:f.version});invalid.version.terms.disclosures.radonNoticeAcknowledged=false;assert.throws(()=>f.pkg.validateSubmission(invalid));
  }
  f.pkg.validateSubmission(f);for(const signerRole of ['buyer','seller'])f.pkg.validateBeforeSigning({...f,signerRole});check(ui.validate(f.t,f.version.buyers,f.version.sellers,{mode:'submit'}).valid,'Receipt completed: sign/send permitted');
 }
 const types=required(l),reference={id:'sample',collection:()=>({doc:type=>({type})})};
 const tx=missing=>({get:async ref=>({data:()=>ref.type===missing?undefined:{currentDocument:{listingUid:'sample',stateAbbreviation:code,documentType:ref.type,versionId:'v1',storagePath:'listing-disclosures/seller/sample/'+ref.type+'/v1.pdf'}}})});
 await gate['assert'+codeToName(code)+'ListingDisclosures'](tx(),reference,l);for(const missing of types){await assert.rejects(gate['assert'+codeToName(code)+'ListingDisclosures'](tx(missing),reference,l));checks++;}
}
check(!fs.readFileSync(path.join(project,'functions/src/index.ts'),'utf8').includes('recordIllinoisDisclosureReceipt'),'No unnecessary later-receipt endpoint');
console.log('PASS: '+checks+' pre-offer policy assertions; four property types; Maine condition and Illinois condition/radon upload gates; independent exceptions; no Mississippi license questions or blocks; required progress badges; immutable pins and buyer/seller signing.');
})().catch(e=>{console.error(e);process.exitCode=1});
function codeToName(code){return {ME:'Maine',MS:'Mississippi',AR:'Arkansas',IL:'Illinois'}[code];}
