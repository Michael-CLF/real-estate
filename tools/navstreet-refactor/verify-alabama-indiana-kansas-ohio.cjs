const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const project=path.resolve(process.argv[2]||'.');
const ts=require(require.resolve('typescript',{paths:[project,path.join(project,'functions')]}));
const compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
let angularForms;
function load(file){const module={exports:{}};vm.runInNewContext(compile(fs.readFileSync(file,'utf8')),{module,exports:module.exports,require:n=>n==='@angular/forms'?angularForms:load(path.resolve(path.dirname(file),n+'.ts')),Date,Set,Intl});return module.exports;}
const backend=f=>require(path.join(project,'functions/lib',f+'.js'));
const registry=backend('offers/state-contracts/state-contract-registry');
const gates=load(path.join(project,'src/app/core/configuration/listing-disclosure-gates.ts'));
const normalize=x=>JSON.parse(JSON.stringify(x));
const cases=[['AL','alabama','Alabama','Jefferson','America/Chicago'],['IN','indiana','Indiana','Marion','America/Indiana/Indianapolis'],['KS','kansas','Kansas','Johnson','America/Chicago'],['OH','ohio','Ohio','Franklin','America/New_York']];
const facts=code=>({ownersAssociationApplies:false,leasesExist:false,leadBasedPaintApplies:false,...(code==='AL'?{alabama:{usesEasternTime:false,hiddenHealthSafetyKnown:false}}:code==='IN'?{indiana:{usesCentralTime:false,disclosureExemptionClaimed:false}}:code==='KS'?{kansas:{usesMountainTime:false,elevatedRadonKnown:false}}:{ohio:{disclosureExemptionClaimed:false}})});
const alt=code=>({AL:'America/New_York',IN:'America/Chicago',KS:'America/Denver',OH:'America/New_York'})[code];
const zoneKey=code=>({AL:'usesEasternTime',IN:'usesCentralTime',KS:'usesMountainTime'})[code];
const party=role=>({partyUid:role,userUid:role,role,legalName:'Test '+role,email:role+'@example.com',phone:'5555550100',requiredSigner:true,identityVerification:{status:'verified'},signature:{status:'pending'}});
const property=(code,county)=>({listingUid:'sample',addressLine1:'100 Test St',city:'Test City',state:code,zipCode:'00000',county,legalDescription:'Fictional Test Lot 1',propertyType:'single_family',yearBuilt:2000,listPriceInCents:35000000});
(async()=>{
 await import(require('node:url').pathToFileURL(require.resolve('@angular/compiler',{paths:[project]})).href);
 angularForms=await import(require('node:url').pathToFileURL(require.resolve('@angular/forms',{paths:[project]})).href);
 const listingRegistry=load(path.join(project,'src/app/core/domains/listings/state-packages/state-listing.registry.ts'));
 const validateAnswers=load(path.join(project,'src/app/core/domains/listings/state-packages/listing-question-validation.ts')).validateStateListingQuestionAnswers;
 const backendListings=backend('listings/state-listing-packages/state-listing.registry');
 const {FormBuilder}=angularForms;
 let parity=0;
 const output=path.join(project,'tmp/navstreet-next-four-state-pdfs');fs.mkdirSync(output,{recursive:true});
 const {PDFDocument}=require(require.resolve('pdf-lib',{paths:[path.join(project,'functions')]}));
 for(const [code,slug,name,county,tz] of cases){
  const camel=slug,listingPkg=listingRegistry.getStateListingPackage(code);
  const factory=listingRegistry.getStateListingFormFactory('sellerStatements.'+camel),form=factory(new FormBuilder());
  const defaults=form.getRawValue();assert(Object.values(defaults).every(v=>v===null));
  assert.throws(()=>validateAnswers(listingPkg,{sellerStatements:{[camel]:defaults}}));
  for(const answer of [false,true]){
   const answers=Object.fromEntries(Object.keys(defaults).map(k=>[k,answer]));form.patchValue(answers);assert.deepEqual(normalize(form.getRawValue()),answers);
   validateAnswers(listingPkg,{sellerStatements:{[camel]:answers}});
   const mapped=listingPkg.mapSellerStatements({[camel]:answers});assert.deepEqual(normalize(mapped[camel]),answers);
   const restored=listingRegistry.restoreStateListingSellerStatements(mapped);assert.deepEqual(normalize(restored[camel]),answers);
   backendListings.validateStateSellerStatements('sample',code,{...facts(code),[camel]:answers});
  }
  form.reset();assert.deepEqual(normalize(form.getRawValue()),normalize(defaults));
  for(const key of Object.keys(defaults)){
   const incomplete={...facts(code),[camel]:{...facts(code)[camel],[key]:null}};
   assert.throws(()=>backendListings.validateStateSellerStatements('sample',code,incomplete));
   assert.throws(()=>validateAnswers(listingPkg,{sellerStatements:incomplete}));
  }
  const pkg=registry.requireEnabledStateContractPackage(code),contractType=pkg.contractTypes[0];
  const front=load(path.join(project,'src/app/features/offers/engine/state-offer-registry.ts')).getEnabledStateOfferRegistration(code);
  const configured=load(path.join(project,'src/app/core/configuration/states.config.ts')).STATES.find(s=>s.abbreviation===code);
  assert(front&&front.offerCreationEnabled);assert(configured.isActive);assert.equal(pkg.stateCode,code);
  const resolve='resolve'+name+'PropertyTimeZone',zones=load(path.join(project,'src/app/core/domains/offers/state-contracts',slug,slug+'-property-time-zone.ts')),backZones=backend('offers/state-contracts/'+slug+'/'+slug+'-property-time-zone');
  for(const option of [false,true,tz,alt(code)]){
   if(code!=='OH'){assert.equal(zones[resolve](county,option),backZones[resolve](county,option));assert.equal(zones[resolve](county,true),alt(code));assert.throws(()=>zones[resolve](county),/Confirm/);}
   else assert.equal(zones[resolve](county,option),tz);
  }
  assert.throws(()=>zones[resolve](null));assert.throws(()=>backZones[resolve](''));
  const listingData={yearBuilt:2000,sellerStatements:facts(code)};
  const make=listing=>pkg.createInitialOfferTerms({contractType,property:property(code,county),listingData:listing,buyer:party('buyer'),seller:party('seller')});
  const initial=make(listingData);assert.equal(initial.delivery.timeZone,tz);
  assert.throws(()=>pkg.createInitialOfferTerms({contractType,property:{...property(code,county),propertyType:'condo'},listingData}));
  assert.throws(()=>make({...listingData,construction:{newConstruction:true}}));
  assert.throws(()=>pkg.createInitialOfferTerms({contractType:'wrong',property:property(code,county),listingData}));
  if(code!=='OH'){
   const camel=slug;assert.throws(()=>make({sellerStatements:{...facts(code),[camel]:{}}}),/Confirm/);
   assert.equal(make({sellerStatements:{...facts(code),[camel]:{...facts(code)[camel],[zoneKey(code)]:true}}}).delivery.timeZone,alt(code));
  }
  const gate=backend('offers/'+slug+'-listing-disclosure-gate'),requiredTypes=gate[(slug)+'RequiredDisclosureTypes'];
  for(const yearBuilt of [undefined,null,1900,1977,1978,2026])for(const leadBasedPaintApplies of [null,false,true])for(const known of [null,false,true]){
   const stateFacts={...facts(code)[slug],hiddenHealthSafetyKnown:known,elevatedRadonKnown:known};
   const f={yearBuilt,leadBasedPaintApplies,[slug]:stateFacts};
   const expected=[...(code==='IN'?['indiana-seller-disclosure']:[]),...((code==='AL'||code==='KS')&&known!==false?[slug+'-statutory-packet']:[]),...(yearBuilt==null||yearBuilt<1978?['lead-based-paint']:[])];
   assert.deepEqual(normalize(gates.getListingUploadGateDocumentTypes(code,f,Date.now())),expected);
   assert.deepEqual(requiredTypes({yearBuilt,sellerStatements:{leadBasedPaintApplies,[slug]:stateFacts}}),expected);parity++;
  }
  const reference={id:'sample',collection:()=>({doc:type=>({type})})};
  const valid=type=>({currentDocument:{listingUid:'sample',stateAbbreviation:code,storagePath:'files/'+type,versionId:'v1'}});
  const transaction=bad=>({get:async ref=>({data:()=>ref.type===bad?undefined:valid(ref.type)})});
  await gate['assert'+name+'ListingDisclosures'](transaction(),reference,listingData);
  const required=requiredTypes(listingData);
  for(const type of required){await assert.rejects(gate['assert'+name+'ListingDisclosures'](transaction(type),reference,listingData),/seller must upload/);}
  if(required.length)await assert.rejects(gate['assert'+name+'ListingDisclosures']({get:async()=>({data:()=>({currentDocument:{...valid('x').currentDocument,stateAbbreviation:'XX'}})})},reference,listingData),/seller must upload/);
  assert(!required.includes(slug+'-association-documents'),'Optional association reports must not universally block offers');
  const terms=structuredClone(initial);
  Object.assign(terms.purchase,{hasEarnestMoney:false,financingType:'cash',loanAmountInCents:0});Object.assign(terms.conditions,{financing:false,appraisal:false,additionalEarnestMoney:false});
  terms.deadlines.settlementDate='2099-12-01';Object.assign(terms.settlement,{titlePolicyPayer:'seller',closingAgentName:'Test Title',specialAssessmentPayer:'seller'});
  Object.assign(terms.disclosures,{propertyConditionStatus:'received',statutoryPacketStatus:'received',hoaDocumentsStatus:'not_applicable',leadPaintStatus:'built_1978_or_later',taxNoticeAcknowledged:true,radonNoticeAcknowledged:true,leaseStatementAcknowledged:true});
  if(code==='IN') terms.documentVersions={'indiana-seller-disclosure':'v1','indiana-statutory-packet':'v1'};
  terms.delivery.expiresAt='2099-10-01T12:00:00Z';terms.delivery.electronicDeliveryAuthorized=true;
  const version={Uid:'version',offerUid:'offer',stateCode:code,status:'draft',immutable:false,expiresAt:terms.delivery.expiresAt,terms,buyers:[party('buyer')],sellers:[party('seller')],initiatedBy:'buyer',initiatedByUid:'buyer'},offer={Uid:'offer',stateCode:code,listingUid:'sample',currentVersionUid:'version'};
  const validator=new (load(path.join(project,'src/app/features/offers/states',slug,'validators',slug+'-offer.validator.ts')))[name+'OfferValidator']();
  const validate=v=>{pkg.validateSubmission({offer,version:v});pkg.validateBeforeSigning({offer,version:v,signerRole:"buyer"});assert.equal(validator.validate(v.terms,v.buyers,v.sellers,{mode:'submit'}).valid,true);};validate(version);
  const financed=structuredClone(version);Object.assign(financed.terms.purchase,{financingType:'conventional',loanAmountInCents:28000000});Object.assign(financed.terms.conditions,{financing:true,appraisal:true});validate(financed);
  const deposit=structuredClone(version);Object.assign(deposit.terms.purchase,{hasEarnestMoney:true,earnestMoneyInCents:500000,earnestMoneyHolder:'Test Escrow'});validate(deposit);
  for(const zone of code!=='OH'?[tz,alt(code)]:[tz]){
   const v=structuredClone(version);v.terms.delivery.timeZone=zone;
   const effectiveAt=new Date('2026-10-31T23:30:00Z');v.terms.deadlines.inspectionPeriodDays=2;
   const result=pkg.createContractMilestones({version:v,effectiveAt});assert.equal(result.timeZone,zone);assert.equal(result.dueDiligenceEndsAt,'2026-11-02');
  }
  const reject=change=>{const v=structuredClone(version);change(v.terms);assert.throws(()=>pkg.validateSubmission({offer,version:v}));assert.equal(validator.validate(v.terms,v.buyers,v.sellers,{mode:'submit'}).valid,false);};
  reject(t=>t.delivery.electronicDeliveryAuthorized=false);reject(t=>t.delivery.timeZone='UTC');reject(t=>t.purchase.financingType='fha');reject(t=>t.deadlines.settlementDate='2099-02-31');reject(t=>{t.property.yearBuilt=1977;t.disclosures.leadPaintStatus='pending';});
  for(const key of ['propertyConditionStatus','statutoryPacketStatus']){
   const v=structuredClone(version);v.terms.disclosures[key]='pending';
   if(code==='IN'&&key==='propertyConditionStatus'){
    assert.throws(()=>pkg.validateSubmission({offer,version:v}),/Review the uploaded/);
    assert.equal(validator.validate(v.terms,v.buyers,v.sellers,{mode:'submit'}).valid,false);
    const adapter=load(path.join(project,'src/app/features/offers/states/indiana/display/indiana-offer-display.adapter.ts')).indianaOfferDisplayAdapter;
    assert(adapter.display(v.terms).sellerSigningBlockReason);
    for(const signerRole of ['buyer','seller']) assert.throws(()=>pkg.validateBeforeSigning({offer,version:v,signerRole}),/does not record buyer review/);
   }else validate(v);
  }
  if(code==='AL'||code==='KS'){
   const key=code==='AL'?'hiddenHealthSafetyKnown':'elevatedRadonKnown';
   const listing={yearBuilt:2000,sellerStatements:{...facts(code),[slug]:{...facts(code)[slug],[key]:true}}};
   assert(requiredTypes(listing).includes(slug+'-statutory-packet'));assert.equal(make(listing).disclosures.requiredKnownFacts,true);
   const v=structuredClone(version);v.terms.disclosures.requiredKnownFacts=true;v.terms.disclosures.statutoryPacketStatus='pending';assert.throws(()=>pkg.validateSubmission({offer,version:v}));assert.throws(()=>pkg.validateBeforeSigning({offer,version:v}));assert.equal(validator.validate(v.terms,v.buyers,v.sellers,{mode:'submit'}).valid,false);
  } else {
   reject(t=>t.disclosures.propertyConditionStatus='exempt');
   const v=structuredClone(version);v.terms.disclosures.disclosureExemptionClaimed=true;v.terms.disclosures.propertyConditionStatus='exempt';validate(v);assert(pkg.requiredListingDisclosures({offer,version:v}).includes(slug+'-seller-disclosure'));
  }
  const hostile=structuredClone(terms);hostile.stateCode='XX';hostile.property.state='XX';hostile.legalDescription='Tampered';hostile.delivery.timeZone='UTC';hostile.disclosures.sellerReportsHoa=true;hostile.disclosures.requiredKnownFacts=true;hostile.disclosures.disclosureExemptionClaimed=true;
  const sanitized=pkg.sanitizeDraftTerms({requestedTerms:hostile,currentTerms:terms,initiatedBy:'buyer'});assert.equal(sanitized.stateCode,code);assert.equal(sanitized.property.state,code);assert.equal(sanitized.legalDescription,terms.legalDescription);assert.equal(sanitized.delivery.timeZone,tz);assert.equal(sanitized.disclosures.sellerReportsHoa,false);
  if(code==='AL'||code==='KS')assert.equal(sanitized.disclosures.requiredKnownFacts,false);else assert.equal(sanitized.disclosures.disclosureExemptionClaimed,false);
  const seller=structuredClone(terms);seller.disclosures.propertyConditionStatus='pending';seller.disclosures.statutoryPacketStatus='pending';seller.delivery.electronicDeliveryAuthorized=false;
  const counter=pkg.sanitizeDraftTerms({requestedTerms:seller,currentTerms:terms,initiatedBy:'seller'});assert.deepEqual(counter.disclosures,terms.disclosures);assert.equal(counter.delivery.electronicDeliveryAuthorized,false);
  const pdfInput={offer:{...offer,referenceNumber:'TEST-'+code},version:{...version,versionNumber:1,createdAt:{toDate:()=>new Date('2026-10-10T12:00Z')}},documentTitle:'Fictional test agreement',generatedAt:new Date('2026-10-10T12:00Z'),documentStatus:'prototype'};
  const before=JSON.stringify(pdfInput),pdf=await pkg.generateAgreement(pdfInput);assert.equal(JSON.stringify(pdfInput),before);assert.equal((await PDFDocument.load(pdf.buffer)).getPageCount(),pdf.pageCount);fs.writeFileSync(path.join(output,code+'-pending.pdf'),pdf.buffer);
  const signedInput={...pdfInput,documentStatus:'approved',version:{...pdfInput.version,buyers:version.buyers.map(p=>({...p,signature:{status:'signed',signedAt:{toDate:()=>new Date('2026-10-10T13:00Z')}}})),sellers:version.sellers.map(p=>({...p,signature:{status:'signed',signedAt:{toDate:()=>new Date('2026-10-10T13:00Z')}}}))}};
  const signedBefore=JSON.stringify(signedInput),signed=await pkg.generateAgreement(signedInput);assert.equal(JSON.stringify(signedInput),signedBefore);assert.equal((await PDFDocument.load(signed.buffer)).getPageCount(),signed.pageCount);fs.writeFileSync(path.join(output,code+'-signed.pdf'),signed.buffer);
  const longInput={...pdfInput,version:{...pdfInput.version,versionNumber:2,terms:{...terms,additionalTerms:('Overflow marker preserved. ').repeat(500)}}};const long=await pkg.generateAgreement(longInput);assert(long.pageCount>pdf.pageCount);fs.writeFileSync(path.join(output,code+'-overflow.pdf'),long.buffer);
  const legalInput={...pdfInput,version:{...pdfInput.version,versionNumber:3,terms:{...terms,legalDescription:'LONGLEGAL '+('LegalDescriptionToken ').repeat(220)}}};const legal=await pkg.generateAgreement(legalInput);assert(legal.pageCount>pdf.pageCount);fs.writeFileSync(path.join(output,code+'-long-legal.pdf'),legal.buffer);
  const source=fs.readFileSync(path.join(project,'functions/src/offers/state-contracts',slug,slug+'-offer-pdf.service.ts'),'utf8');assert(!source.includes('55-2509'));assert(!source.includes('Idaho'));assert(!source.includes('55-25'));
  if(code==='KS'){assert(source.includes('Every buyer of residential real property is notified'));assert(source.includes('Kansas law requires persons who are convicted'));} 
  console.log('PASS:',code,'launch, listing gates, trusted facts, property time zone, submission, counteroffers and pending/signed/overflow PDF generation.');
 }
 console.log('PASS:',parity,'four-state frontend/backend disclosure gate parity cases.');
})().catch(error=>{console.error(error);process.exitCode=1;});
