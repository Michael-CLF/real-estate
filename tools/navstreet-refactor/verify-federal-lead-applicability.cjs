// Federal boundary and end-to-end package integration. State schemas stay in their packages.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const project=path.resolve(process.argv[2]||'.');
// Relative fixture deadlines must remain future dates whenever this check runs.
const verificationNow=new Date();
const ts=require(require.resolve('typescript',{paths:[project,path.join(project,'functions')]}));
const cache=new Map();
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file);const module={exports:{}};cache.set(file,module.exports);vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module,exports:module.exports,require:n=>load(path.resolve(path.dirname(file),n+'.ts')),Set,Date,Intl,Map,Object,Number,Array,Boolean,JSON,Error});cache.set(file,module.exports);return module.exports;}
const back=f=>require(path.join(project,'functions/lib',f+'.js'));
const norm=x=>JSON.parse(JSON.stringify(x));
const helper=load(path.join(project,'src/app/core/domains/offers/federal-lead-policy.ts'));
assert.equal(fs.readFileSync(path.join(project,'src/app/core/domains/offers/federal-lead-policy.ts'),'utf8').replace(/\r/g,''),fs.readFileSync(path.join(project,'functions/src/offers/state-contracts/federal-lead-policy.ts'),'utf8').replace(/\r/g,''),'Frontend/backend federal rules must match');
const gates=load(path.join(project,'src/app/core/configuration/listing-disclosure-gates.ts'));
const requirements=load(path.join(project,'src/app/core/configuration/state-disclosures.config.ts'));
const documents=load(path.join(project,'src/app/features/offers/engine/listing-document-policy.registry.ts'));
const registry=back('offers/state-contracts/state-contract-registry');
const {createCompletedContractFixture}=require('./fixtures/completed-contracts.cjs');
const base10=new Set(['NC','TX','OK','UT','WI','FL','LA','CO','CA','SC']);
const facts={isCondominium:false,isDeveloperSale:false,isLeasehold:false,dwellingUnitCount:null};
const party=role=>({partyUid:role,userUid:role,role,legalName:'Test '+role,email:role+'@example.com',phone:'5555550100',mailingAddress:{addressLine1:'100 Test St',city:'Test City',state:'NC',zipCode:'27587',country:'US'},requiredSigner:true,identityVerification:{status:'verified'},signature:{status:'not_started'}});
const statements={contractFacts:facts,ownershipStatus:'owned_at_least_one_year',leadBasedPaintApplies:true,ownersAssociationApplies:false,leasesExist:false,generalLeasesExist:false,fuelTankPresent:false,residentialLeasesExist:false,fixtureLeasesExist:false,naturalResourceLeasesExist:false,methamphetamineContaminationKnown:false};
for(const state of ['oregon','missouri','nebraska','newHampshire','alabama','indiana','kansas','ohio','delaware','washington','iowa','montana','maryland','newMexico','southDakota','wyoming','southCarolina','maine','mississippi','arkansas','illinois'])statements[state]=new Proxy({}, {get:()=>false});
function listingFacts(){const s={...statements};for(const [k,v]of Object.entries(s))if(v && typeof v==='object' && k!=='contractFacts')s[k]={usesMountainTime:false,usesEasternTime:false,usesCentralTime:false,methProductionKnown:false,drugConvictionKnown:false,hiddenHealthSafetyKnown:false,elevatedRadonKnown:false,disclosureExemptionClaimed:false,radonTestsKnown:false,drugContaminationKnown:false,appurtenantWaterRightsKnown:false,domesticWellApplies:false,uncertifiedWoodDevicePresent:false,historicSpecialAssessmentApplies:false,deferredWaterSewerCharges:false,superfundNearby:false,otherPropertyNoticeApplies:false,rentalLeadObligationApplies:false,privateWellApplies:false,onsiteSewageApplies:false,groundRentApplies:false,drugLabContaminationKnown:false,privateTransferFeeKnown:false,utilityTariffChargesKnown:false,beachfrontApplies:false,futureVacationBookingsExist:false};return s;}
const stateDirs=fs.readdirSync(path.join(project,'functions/src/offers/state-contracts'),{withFileTypes:true}).filter(d=>d.isDirectory()).map(d=>d.name).filter(slug=>fs.existsSync(path.join(project,'functions/lib/offers/state-contracts',slug,slug+'-state-contract.package.js')));
const submissionSource=fs.readFileSync(path.join(project,'functions/src/offers/submit-offer.ts'),'utf8');assert(submissionSource.indexOf('verifySubmissionAccess(')<submissionSource.indexOf('stateContractPackage.prepareSubmissionTerms'));assert(submissionSource.includes('{terms:version.terms}'),'Canonical terms must be stored in the same transaction that freezes the version');
const output=path.join(project,'tmp/navstreet-federal-lead-pdfs');fs.mkdirSync(output,{recursive:true});
function clone(value){return structuredClone(value);}
(async()=>{
 let count=0,pdfs=0;
 for(const slug of stateDirs){
  const exported=back('offers/state-contracts/'+slug+'/'+slug+'-state-contract.package');const pkg=Object.values(exported).find(v=>v?.stateCode && v?.createInitialOfferTerms);if(!pkg?.offerCreationEnabled)continue;
  const code=pkg.stateCode;assert.equal(pkg.federalLeadPolicyIntegrated,true);assert.equal(registry.requireStateContractPackage(code),pkg);
  const property={listingUid:'sample',addressLine1:'100 Fictional St',city:'Test City',state:code,zipCode:'27587',county:({CO:'Denver',MN:'Hennepin',MI:'Wayne',AZ:'Maricopa',ID:'Ada',MO:'Jackson',OR:'Multnomah',NH:'Hillsborough'}[code]||'Sample County'),legalDescription:'FICTIONAL TEST LOT 1',propertyType:'single_family',yearBuilt:1980,listPriceInCents:35000000};
  const input={contractType:pkg.contractTypes[0],property,listingData:{propertyType:'single_family',yearBuilt:1980,sellerStatements:listingFacts(),coloradoPropertyFacts:{metroDistrict:'not_applicable',waterSource:'Municipal water'}},buyer:party('buyer'),seller:party('seller')};
  const initial=pkg.createInitialOfferTerms(input);const before=JSON.stringify(initial);assert.throws(()=>pkg.prepareSubmissionTerms({listingData:{...input.listingData,yearBuilt:1977},offer:{},version:{terms:initial,status:'draft',immutable:false,initiatedBy:'buyer'}}),code+' corrected construction year must not bypass federal applicability');
  const frontFile=path.join(project,'src/app/features/offers/states',slug,slug+'-offer-package.ts');const front=fs.existsSync(frontFile)?Object.values(load(frontFile)).find(v=>v?.stateCode===code):null;
  assert(front || code==='NC',code+' needs a frontend package');
  for(const yearBuilt of [1977,1978,1980,2026]){
   const p={...property,yearBuilt};assert.equal(helper.isFederalLeadExcluded(p),yearBuilt>=1978);
   if(yearBuilt>=1978)assert.equal(gates.isListingLeadUploadRequired(code,{...p,leadBasedPaintApplies:true}),false,code+' stale flag cutoff');
   const lead=requirements.getStateDisclosureRequirements(code).find(r=>r.documentType==='lead-based-paint');assert(lead,code+' lead metadata missing');
   assert.equal(requirements.isDisclosureVisibleForListing(lead,p),yearBuilt<1978);assert.equal(requirements.isDisclosureRequiredForListing(code,lead,p),yearBuilt<1978);
   const t=pkg.createInitialOfferTerms({...input,property:p,listingData:{...input.listingData,yearBuilt}});
   const version={Uid:'v',offerUid:'o',stateCode:code,status:'draft',immutable:false,terms:t,buyers:[party('buyer')],sellers:[party('seller')],initiatedBy:'buyer',versionNumber:1};const offer={Uid:'o',stateCode:code,referenceNumber:'NS-LEAD-'+code};
   if(front){const prepared=front.prepareTerms(t);const qs=front.getSections(prepared).flatMap(s=>s.questions);const leadQuestions=qs.filter(q=>q.fieldPath && /lead(?:Paint|BasedPaint|Inspection|Exemption|Disclosure|Termination)/i.test(q.fieldPath));assert.equal(leadQuestions.length===0,yearBuilt>=1978,code+' questions '+yearBuilt);if(yearBuilt>=1978)assert(!qs.some(q=>q.options?.some(o=>o.value==='lead-based-paint')));}
   if(yearBuilt>=1978){
    assert(!pkg.requiredListingDisclosures?.({offer,version})?.includes('lead-based-paint'),code+' required lead attachment');
    const requested=clone(t);requested.property.yearBuilt=1900;const sanitized=pkg.sanitizeDraftTerms({currentTerms:t,requestedTerms:requested,initiatedBy:'buyer'});assert.equal(sanitized.property.yearBuilt,yearBuilt,code+' trusted snapshot');
    assert.deepEqual(norm(documents.selectOfferListingDocuments('disclosures',t,[{documentType:'lead-based-paint'}])),[]);
   }
  }
  // Existing seller-counter evidence, including exact reviewed-version pins, is immutable to the seller.
  const historic=clone(initial);if(historic.disclosures && 'leadPaintStatus' in historic.disclosures){Object.assign(historic.disclosures,{leadPaintStatus:'received',leadInspectionSelection:'ten_days',leadInspectionDays:10});historic.documentVersions={...(historic.documentVersions||{}),'lead-based-paint':'reviewed-lead-version'};const altered=clone(historic);altered.disclosures.leadPaintStatus='exempt';altered.documentVersions={};const counter=pkg.sanitizeDraftTerms({currentTerms:historic,requestedTerms:altered,initiatedBy:'seller'});assert.equal(counter.disclosures.leadPaintStatus,'received');assert.equal(counter.documentVersions['lead-based-paint'],'reviewed-lead-version');if(pkg.requiredListingDisclosures)assert(pkg.requiredListingDisclosures({offer:{},version:{terms:historic,immutable:true,buyers:[],sellers:[]}}).includes('lead-based-paint'),code+' signed-version attachment retention');}
  if(code==='TX' || code==='NC') {
   const legacy=clone(initial),group=code==='TX'?legacy.disclosures:legacy.sellerStatements;
   group.leadBasedPaintApplies=true;const key=code==='TX'?'leadBasedPaintAddendumDocumentUid':'leadBasedPaintDisclosureDocumentUid';group[key]='original-lead-record';
   if(code==='TX'){const row=legacy.addenda.find(row=>row.formId==='lead-based-paint');if(row)row.included=true;}
   const changed=clone(legacy);(code==='TX'?changed.disclosures:changed.sellerStatements).leadBasedPaintApplies=false;
   const counter=pkg.sanitizeDraftTerms({currentTerms:legacy,requestedTerms:changed,initiatedBy:'seller'}),retained=code==='TX'?counter.disclosures:counter.sellerStatements;
   assert.equal(retained.leadBasedPaintApplies,true);assert.equal(retained[key],'original-lead-record');
   if(code==='TX')assert.deepEqual(counter.addenda.filter(row=>row.formId==='lead-based-paint'),legacy.addenda.filter(row=>row.formId==='lead-based-paint'));
  }
  let fixture;
  if(base10.has(code))fixture=createCompletedContractFixture(project,code,verificationNow,'cash');
  else{
   const t=clone(initial);Object.assign(t.purchase,{hasEarnestMoney:false,financingType:'cash',loanAmountInCents:0});Object.assign(t.conditions,{financing:false,appraisal:false,additionalEarnestMoney:false});Object.assign(t.deadlines,{settlementDate:'2099-12-01',sellerDisclosureDate:'',inspectionPeriodDays:15});Object.assign(t.settlement,{titlePolicyPayer:'seller',closingAgentName:'Test Title',specialAssessmentPayer:'seller',hoaTransferFeePayer:'seller'});Object.assign(t.disclosures,{propertyConditionStatus:'received',statutoryPacketStatus:'received',hoaDocumentsStatus:'not_applicable',taxNoticeAcknowledged:true,radonNoticeAcknowledged:true,leaseStatementAcknowledged:true});if(code==='IA'){t.settlement.titleEvidenceSelection='abstract_opinion';t.documentVersions={'iowa-seller-disclosure':'condition-v1'};}t.delivery.expiresAt='2099-10-01T12:00:00Z';t.delivery.electronicDeliveryAuthorized=true;
   fixture={offer:{Uid:'o',stateCode:code,referenceNumber:'NS-LEAD-'+code,currentVersionUid:'v',listingUid:'sample'},version:{Uid:'v',offerUid:'o',stateCode:code,status:'draft',immutable:false,terms:t,buyers:[party('buyer')],sellers:[party('seller')],initiatedBy:'buyer',initiatedByUid:'buyer',versionNumber:1,expiresAt:t.delivery.expiresAt}};
  }
  if(['ME','MS','AR','IL'].includes(code)){const t=fixture.version.terms;Object.assign(t.disclosures,{buyerUsesBroker:false});t.documentVersions={...(t.documentVersions||{}),[slug+'-seller-disclosure']:'condition-v1',[slug+'-statutory-packet']:'packet-v1'};}
  fixture.version.terms.property.yearBuilt=1980;if(code==='TX')Object.assign(fixture.version.terms.earnestMoneyAndOption,{optionPeriodDays:10,optionFeeInCents:10000});if(code==='OK')fixture.version.terms.disclosures.propertyConditionStatus='disclosure_received';
  // Leave lead answers entirely unanswered; the state integration must derive non-applicability.
  const t=fixture.version.terms;if(t.disclosures){if('leadPaintStatus'in t.disclosures)t.disclosures.leadPaintStatus='unselected';if('leadBasedPaintStatus'in t.disclosures)t.disclosures.leadBasedPaintStatus='unselected';if('leadBasedPaintApplies'in t.disclosures)t.disclosures.leadBasedPaintApplies=true;}
  const raw=JSON.stringify(fixture);pkg.validateSubmission(fixture);pkg.validateBeforeSigning?.(fixture);assert.equal(JSON.stringify(fixture),raw,code+' validation mutated version');
  const projected=pkg.prepareSubmissionTerms(fixture);assert.equal(JSON.stringify(fixture),raw,code+' submission preparation mutated source');
  assert.equal(pkg.prepareSubmissionTerms({...fixture,version:{...fixture.version,immutable:true,status:'awaiting_signatures'}}),t,code+' immutable version must not be rewritten');
  assert.equal(pkg.prepareSubmissionTerms({...fixture,version:{...fixture.version,initiatedBy:'seller'}}),t,code+' seller receipt evidence must not be replaced at submission');
  assert.equal(pkg.prepareSubmissionTerms({...fixture,version:{...fixture.version,buyers:[{signature:{status:'signed'}}]}}),t,code+' signed evidence must never be rewritten even in a malformed draft');
  if(projected.disclosures?.leadPaintStatus)assert(['built_1978_or_later','not_applicable'].includes(projected.disclosures.leadPaintStatus));
  const prepared=pkg.sanitizeDraftTerms({currentTerms:t,requestedTerms:t,initiatedBy:'buyer'});
  // Saving must normalize the lead fields without pretending a packet was received.
  if(prepared.disclosures?.leadPaintStatus)assert(['built_1978_or_later','not_applicable'].includes(prepared.disclosures.leadPaintStatus));
  if(front){const result=front.validate(front.prepareTerms(prepared),fixture.version.buyers,fixture.version.sellers,{mode:'submit',currentDateTime:verificationNow});assert.equal(result.valid,true,code+' '+JSON.stringify(result.errors));}
  const metadata=pkg.getAgreementTemplate?.(prepared)||pkg.agreementTemplate;
  const pdf=await pkg.generateAgreement({...fixture,version:{...fixture.version,terms:prepared},documentTitle:metadata.templateName,generatedAt:verificationNow,documentStatus:'prototype'});assert(pdf.buffer.length>1000);fs.writeFileSync(path.join(output,code+'-1980.pdf'),pdf.buffer);pdfs++;
  assert.equal(JSON.stringify(initial),before);count++;console.log(code+': cutoff, questions, trusted year, submission/signing, seller evidence and PDF passed');
 }
 assert.equal(count,stateDirs.length,'Every configured package must be exercised');
 for(const yearBuilt of [undefined,null,NaN,Infinity,'1980',1978.5])assert.equal(helper.isFederalLeadExcluded({yearBuilt}),false,'Invalid historical year must not grant exemption');
 console.log('PASS:',count,'state packages; 1977/1978/1980/2026 boundaries; automatic applicability; no EPA questions/required attachments for newer homes;',pdfs,'PDFs.');
})().catch(error=>{console.error(error);process.exitCode=1;});
