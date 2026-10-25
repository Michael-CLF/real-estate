const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const project=path.resolve(process.argv[2]||'.');
const ts=require(require.resolve('typescript',{paths:[project,path.join(project,'functions')]}));
const cache=new Map();
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file);const module={exports:{}};cache.set(file,module.exports);vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module,exports:module.exports,require:n=>load(path.resolve(path.dirname(file),n+'.ts')),Set,Date,Intl,Map,Object,Number,Array,Boolean,JSON,Error});cache.set(file,module.exports);return module.exports;}
const helper=require(path.join(project,'functions/lib/offers/state-contracts/hoa-applicability-policy.js'));
assert.equal(fs.readFileSync(path.join(project,'functions/src/offers/state-contracts/hoa-applicability-policy.ts'),'utf8').replace(/\r/g,''),fs.readFileSync(path.join(project,'src/app/core/domains/offers/hoa-applicability-policy.ts'),'utf8').replace(/\r/g,''));
const {createCompletedContractFixture}=require('./fixtures/completed-contracts.cjs');
const registry=require(path.join(project,'functions/lib/offers/state-contracts/state-contract-registry.js'));
const directories=fs.readdirSync(path.join(project,'functions/src/offers/state-contracts'),{withFileTypes:true}).filter(d=>d.isDirectory()).map(d=>d.name);
const output=path.join(project,'tmp/navstreet-hoa-pdfs');fs.mkdirSync(output,{recursive:true});
const read=helper.readHoaPath,set=helper.setHoaPath;
const statements={ownershipStatus:'owned_at_least_one_year',fuelTankPresent:false,leadBasedPaintApplies:false,ownersAssociationApplies:false,leasesExist:false,generalLeasesExist:false,utahMethamphetamineContamination:false,residentialLeasesExist:false,fixtureLeasesExist:false,naturalResourceLeasesExist:false,contractFacts:{isCondominium:false,isDeveloperSale:false,isLeasehold:false,dwellingUnitCount:null}};
for(const state of ['alaska','connecticut','vermont','virginia','oregon','missouri','nebraska','newHampshire','alabama','indiana','kansas','ohio','delaware','washington','iowa','montana','maryland','newMexico','southDakota','wyoming','southCarolina','maine','mississippi','arkansas','illinois'])statements[state]={usesAleutianTime:false,affirmativeNoticesApply:false,usesMountainTime:false,usesEasternTime:false,usesCentralTime:false,hiddenHealthSafetyKnown:false,elevatedRadonKnown:false,beachfrontApplies:false,futureVacationBookingsExist:false};
const person=role=>({partyUid:role,userUid:role,role,legalName:'Sample '+role,firstName:'Sample',lastName:role,email:role+'@example.com',phone:'9195550100',mailingAddress:{addressLine1:'100 Sample St',city:'Sample City',state:'NC',zipCode:'27587',country:'US'},sequence:1,primaryParty:true,requiredSigner:true,identityVerification:{status:'verified'},signature:{status:'not_started'},electronicTransactionsConsentAccepted:true});
// Read the exact compiled declaration consumed by the package. Canonical/binding
// verification separately ensures this is the state's own generated module.
function config(file){
  const slug=path.basename(path.dirname(file));
  return require(path.join(project,'functions/lib/offers/state-contracts',slug,slug+'-policy-mappings.generated.js')).HOA_POLICY;
}
(async()=>{
 let count=0,pdfs=0;
 for(const slug of directories){
  const file=path.join(project,'functions/src/offers/state-contracts',slug,slug+'-state-contract.package.ts');if(!fs.existsSync(file))continue;
  const pkg=Object.values(require(path.join(project,'functions/lib/offers/state-contracts',slug,slug+'-state-contract.package.js'))).find(x=>x?.createInitialOfferTerms);if(!pkg?.offerCreationEnabled)continue;
  const policy=config(file),code=pkg.stateCode;count++;assert.equal(pkg.hoaPolicyIntegrated,true);assert.equal(registry.requireStateContractPackage(code),pkg);
  const property={listingUid:'sample',addressLine1:'100 Sample St',city:'Sample City',state:code,zipCode:'27587',county:({CO:'Denver',MN:'Hennepin',MI:'Wayne',AZ:'Maricopa',ID:'Ada',MO:'Jackson',OR:'Multnomah',NH:'Hillsborough'}[code]||'Sample County'),propertyType:'single_family',yearBuilt:1980,listPriceInCents:35000000,legalDescription:'FICTIONAL TEST LOT 1'};
  const input={contractType:pkg.contractTypes[0],property,buyer:person('buyer'),seller:person('seller'),listingData:{propertyType:'single_family',yearBuilt:1980,sellerStatements:{...statements},coloradoPropertyFacts:{metroDistrict:'not_applicable',waterSource:'Municipal water'}}};
  if(['AK','CT','VT','VA','KY','RI','TN','WV'].includes(code)){input.property.contractFacts={isCondominium:false,isDeveloperSale:false,isLeasehold:false};input.listingData.sellerStatements.contractFacts={...input.property.contractFacts};}
  const terms=pkg.createInitialOfferTerms(input);
  if(policy.sellerFactPath){
   assert.equal(read(terms,policy.sellerFactPath),false,code+' trusted seller answer');
   if(policy.documentStatusPath)assert.equal(read(terms,policy.documentStatusPath),'not_applicable',code+' initial status');
   for(const fact of [true,null,undefined]){let t=set(terms,policy.sellerFactPath,fact);if(policy.documentStatusPath)t=set(t,policy.documentStatusPath,'unselected');assert.equal(helper.sellerReportsNoHoa(t,policy),false,code+' no inferred exclusion');assert.deepEqual(helper.normalizeHoaTerms(t,policy),t);}
   for(const type of ['condo','single_family']){let t=set(terms,'property.propertyType',type);t=set(t,'property.contractFacts.isCondominium',true);assert.equal(helper.sellerReportsNoHoa(t,policy),false,code+' condominium conflict');}
   if(policy.documentStatusPath){const received=set(terms,policy.documentStatusPath,'received');assert.equal(read(helper.normalizeHoaTerms(received,policy),policy.documentStatusPath),'received');}
  }else assert.equal(policy.auditedNoReceiptQuestion,true,code+' must explicitly audit a package without a receipt question');
  const frontPath=path.join(project,'src/app/features/offers/states',slug,slug+'-offer-package.ts');
  if(fs.existsSync(frontPath)){
   const front=Object.values(load(frontPath)).find(x=>x?.stateCode===code);assert.equal(front.hoaPolicyIntegrated,true,code+' frontend integration');let t=terms;if(policy.documentStatusPath)t=set(t,policy.documentStatusPath,'unselected');
   const prepared=front.prepareTerms(t),qs=front.getSections(prepared).flatMap(s=>[...s.questions,...(s.questionGroups||[]).flatMap(g=>g.questions)]);
   if(policy.documentStatusPath || (policy.sellerFactPath && !policy.auditedNoReceiptQuestion)){
    assert(!qs.some(q=>q.fieldPath && (q.fieldPath===policy.documentStatusPath || q.fieldPath===policy.sellerFactPath)),code+' no duplicate input');assert(qs.some(q=>q.type==='information' && q.label===helper.NO_HOA_SELLER_STATEMENT),code+' attributed seller statement');assert(qs.some(q=>q.type==='information' && q.label===helper.NO_HOA_SELLER_STATEMENT && q.readOnly===true),code+' locked gray seller statement');
   }
   if(['ME','MS','AR','IL'].includes(code)){
    const condoPhrase=({ME:'33 M.R.S. 1604-108',MS:'Miss. Code 89-9',AR:'Ark. Code 18-13',IL:'765 ILCS 605/22.1'})[code];
    assert(!qs.some(q=>((q.label||'')+' '+(q.helpText||'')).includes(condoPhrase)),code+' residential no-association questions omit condo-only guidance');
    const condo=set(set(set(t,'contractType','navstreet_'+slug+'_condominium_resale_2026'),'property.contractFacts.isCondominium',true),policy.sellerFactPath,true);
    assert(front.getSections(condo).flatMap(s=>s.questions).some(q=>((q.label||'')+' '+(q.helpText||'')).includes(condoPhrase)),code+' actual condo keeps state-specific guidance');
   }
   if(policy.documentStatusPath){const yes=set(set(t,policy.sellerFactPath,true),policy.documentStatusPath,'unselected');const yesQuestions=front.getSections(yes).flatMap(s=>[...s.questions,...(s.questionGroups||[]).flatMap(g=>g.questions)]);assert(yesQuestions.some(q=>q.fieldPath===policy.documentStatusPath),code+' HOA yes retains questions');for(const q of yesQuestions.filter(q=>q.fieldPath===policy.documentStatusPath&&q.type==='single_choice'))assert(!q.options.some(option=>/^seller reports no (?:homeowners? |owners? )?association\.?$/i.test(option.label.trim())),code+' buyer cannot contradict seller via no-association choice');}
  }
  let legacy=structuredClone(terms);if(policy.documentStatusPath)legacy=set(legacy,policy.documentStatusPath,'unselected');
  const version={Uid:'v',offerUid:'o',stateCode:code,status:'draft',immutable:false,initiatedBy:'buyer',initiatedByUid:'buyer',versionNumber:1,terms:legacy,buyers:[person('buyer')],sellers:[person('seller')]};
  const before=JSON.stringify(version);const prepared=pkg.prepareSubmissionTerms({offer:{},version,listingData:input.listingData});assert.equal(JSON.stringify(version),before,code+' pure preparation');
  if(policy.documentStatusPath)assert.equal(read(prepared,policy.documentStatusPath),'not_applicable');
  for(const changes of [{immutable:true},{buyers:[{...person('buyer'),signature:{status:'signed'}}]},{initiatedBy:'seller'}]){const v={...version,...changes};assert.deepEqual(pkg.prepareSubmissionTerms({offer:{},version:v,listingData:input.listingData}),v.terms,code+' historic/counter preserved');}
  if(policy.sellerFactPath){
   let received=set(terms,policy.sellerFactPath,true);if(policy.documentStatusPath)received=set(received,policy.documentStatusPath,'received');
   for(const evidence of policy.evidencePaths||[])received=set(received,evidence,'original-association-document');
   received.documentVersions=Object.fromEntries(policy.documentTypes.map(type=>[type,'immutable-reviewed-version']));
   let requested=set(received,policy.sellerFactPath,false);if(policy.documentStatusPath)requested=set(requested,policy.documentStatusPath,'pending');requested.documentVersions={};
   for(const evidence of policy.evidencePaths||[])requested=set(requested,evidence,'changed-association-document');
   const seller=pkg.sanitizeDraftTerms({currentTerms:received,requestedTerms:requested,initiatedBy:'seller'});
   assert.equal(read(seller,policy.sellerFactPath),true,code+' counter seller fact');if(policy.documentStatusPath)assert.equal(read(seller,policy.documentStatusPath),'received',code+' counter receipt');
   for(const type of policy.documentTypes)assert.equal(seller.documentVersions[type],'immutable-reviewed-version');
   for(const evidence of policy.evidencePaths||[])assert.equal(read(seller,evidence),'original-association-document');
   const buyer=pkg.sanitizeDraftTerms({currentTerms:received,requestedTerms:requested,initiatedBy:'buyer'});assert.equal(read(buyer,policy.sellerFactPath),true,code+' client cannot forge no HOA');
  }
  // Generate native agreements without changing their templates or historic generators.
  let fixture;
  if(['NC','TX','OK','UT','WI','FL','LA','CO','CA','SC'].includes(code))fixture=createCompletedContractFixture(project,code);else{const t=structuredClone(terms);Object.assign(t.purchase,{hasEarnestMoney:false,financingType:'cash',loanAmountInCents:0});Object.assign(t.conditions,{financing:false,appraisal:false,additionalEarnestMoney:false});Object.assign(t.deadlines,{settlementDate:'2099-12-01',sellerDisclosureDate:'',inspectionPeriodDays:15});Object.assign(t.settlement,{titlePolicyPayer:'seller',closingAgentName: '',specialAssessmentPayer:'seller',hoaTransferFeePayer:'seller'});Object.assign(t.disclosures,{propertyConditionStatus:'received',statutoryPacketStatus:'received',taxNoticeAcknowledged:true,radonNoticeAcknowledged:true,leaseStatementAcknowledged:true});if(code==='IA'){t.settlement.titleEvidenceSelection='abstract_opinion';t.documentVersions={'iowa-seller-disclosure':'condition-v1'};}t.delivery.expiresAt='2099-10-01T12:00:00Z';t.delivery.electronicDeliveryAuthorized=true;fixture={offer:{Uid:'o',stateCode:code,referenceNumber:'NS-HOA-'+code,currentVersionUid:'v',listingUid:'sample'},version:{...version,terms:t,expiresAt:t.delivery.expiresAt}};}
  if(['AK','CT','VT','VA','KY','RI','TN','WV','ME','MS','AR','IL','GA','NV','ND','PA'].includes(code)){const t=fixture.version.terms;t.disclosures.buyerUsesBroker=false;t.documentVersions={...(t.documentVersions||{}),[slug+'-seller-disclosure']:'condition-v1',[slug+'-statutory-packet']:'packet-v1'};}
  pkg.validateSubmission(fixture);pkg.validateBeforeSigning?.(fixture);
  if(policy.documentStatusPath){const receipt=set(fixture.version.terms,policy.documentStatusPath,'received');const saved=JSON.stringify(receipt);pkg.validateSubmission({...fixture,version:{...fixture.version,terms:receipt}});assert.equal(JSON.stringify(receipt),saved,code+' optional actual receipt is not rewritten or blocked');}
  if(['NV','ND'].includes(code))await require('./fixtures/reviewed-notice-pdfs.cjs').stubReviewedNotice(project,code);
  const result=await pkg.generateAgreement({...fixture,documentTitle:pkg.agreementTemplate.templateName,documentStatus:'prototype',generatedAt:new Date()});
  fs.writeFileSync(path.join(output,code+'.pdf'),result.bytes||result.buffer||result.pdfBytes||result);pdfs++;
 }
 assert.equal(count,46);assert.equal(pdfs,46);console.log('PASS: all 46 package HOA policies; strict seller facts, no duplicate questions, condominium conflicts, restored drafts, signed/counter preservation, forged-answer rejection and 46 native PDFs.');
})().catch(e=>{console.error(e);process.exitCode=1});
