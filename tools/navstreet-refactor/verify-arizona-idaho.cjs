const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const project = path.resolve(process.argv[2] || '.');
const ts = require(require.resolve('typescript', {paths:[project,path.join(project,'functions')]}));
const compile = source => ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function loadFile(file) { const module={exports:{}}; vm.runInNewContext(compile(fs.readFileSync(file,'utf8')),{module,exports:module.exports,require:name=>loadFile(path.resolve(path.dirname(file),name+'.ts')),Set,Date,Intl});return module.exports; }
const backend = file => require(path.join(project,'functions/lib',file+'.js'));
const registry = backend('offers/state-contracts/state-contract-registry');
const gates = loadFile(path.join(project,'src/app/core/configuration/listing-disclosure-gates.ts'));
const normalized = x => JSON.parse(JSON.stringify(x));
const cases=[['AZ','arizona','Arizona','Maricopa','America/Phoenix'],['ID','idaho','Idaho','Ada','America/Boise']];
const party = role => ({partyUid:role,userUid:role,role,legalName:'Test '+role,email:role+'@example.com',phone:'5555550100',requiredSigner:true,identityVerification:{status:'verified'},signature:{status:'pending'}});
const property = (code,county) => ({listingUid:'sample',addressLine1:'100 Test St',city:'Test City',state:code,zipCode:'00000',county,legalDescription:'Test Lot 1',propertyType:'single_family',yearBuilt:2000,listPriceInCents:35000000});
(async()=>{
 let parity=0;
 for(const [code,slug,name,county,tz] of cases){
  const pkg=registry.requireStateContractPackage(code);
  const frontZones=loadFile(path.join(project,'src/app/core/domains/offers/state-contracts',slug,slug+'-property-time-zone.ts'));
  const backZones=backend('offers/state-contracts/'+slug+'/'+slug+'-property-time-zone');
  const counties=frontZones[code==='AZ'?'ARIZONA_COUNTIES':'IDAHO_COUNTIES'];
  for(const countyName of counties){
   const blocked=code==='AZ'?['Apache','Coconino','Navajo'].includes(countyName):countyName==='Idaho';
   const resolver='resolve'+name+'PropertyTimeZone';
   if(blocked){assert.throws(()=>frontZones[resolver](countyName),/property-level/);assert.throws(()=>backZones[resolver](countyName),/property-level/);}
   else {assert.equal(frontZones[resolver](countyName),backZones[resolver](countyName));assert.equal(frontZones[resolver](' '+countyName+' County '),backZones[resolver](countyName));}
  }
  assert.throws(()=>frontZones['resolve'+name+'PropertyTimeZone']('unknown'));
  assert.throws(()=>backZones['resolve'+name+'PropertyTimeZone'](null));
  const offset=(zone,date)=>new Intl.DateTimeFormat('en-US',{timeZone:zone,timeZoneName:'longOffset'}).format(new Date(date));
  if(code==='AZ'){assert(offset(tz,'2026-01-01T12:00Z').includes('GMT-07:00'));assert(offset(tz,'2026-07-01T12:00Z').includes('GMT-07:00'));}
  else {assert(offset(tz,'2026-01-01T12:00Z').includes('GMT-07:00'));assert(offset(tz,'2026-07-01T12:00Z').includes('GMT-06:00'));}

  assert.equal(pkg.agreementTemplate.templateUid,'navstreet-'+code.toLowerCase()+'-residential-2026');
  const frontValidator=loadFile(path.join(project,'src/app/features/offers/states',slug,'validators',slug+'-offer.validator.ts'));
  const validator=new frontValidator[name+'OfferValidator']();
  const frontRegistration=loadFile(path.join(project,'src/app/features/offers/engine/state-offer-registry.ts')).getEnabledStateOfferRegistration(code);
  const configured=loadFile(path.join(project,'src/app/core/configuration/states.config.ts')).STATES.find(s=>s.abbreviation===code);
  assert.equal(Boolean(frontRegistration),pkg.offerCreationEnabled,'Frontend/backend launch gates agree');
  assert.equal(configured.isActive,pkg.offerCreationEnabled,'State picker and offer launch gates agree');
  if (!pkg.offerCreationEnabled) assert.throws(()=>registry.requireEnabledStateContractPackage(code),/not yet available/);
  else assert.equal(registry.requireEnabledStateContractPackage(code),pkg);
  const contractType=pkg.contractTypes[0], listingData={sellerStatements:{ownersAssociationApplies:false,leasesExist:false,leadBasedPaintApplies:false}};
  const initial=pkg.createInitialOfferTerms({contractType,property:property(code,county),listingData,buyer:party('buyer'),seller:party('seller')});
  assert.equal(initial.stateCode,code);assert.equal(initial.delivery.timeZone,tz);
  assert.equal(initial.disclosures.propertyConditionStatus,'unselected');assert.equal(initial.delivery.electronicDeliveryAuthorized,null);
  assert.throws(()=>pkg.createInitialOfferTerms({contractType,property:{...property(code,county),propertyType:'condo'},listingData}));
  assert.throws(()=>pkg.createInitialOfferTerms({contractType,property:property(code,county),listingData:{construction:{newConstruction:true}}}));
  assert.throws(()=>pkg.createInitialOfferTerms({contractType:'wrong',property:property(code,county),listingData}));
  const gate=backend('offers/'+slug+'-listing-disclosure-gate');
  for(const yearBuilt of [undefined,null,1900,1977,1978,2026])for(const leadBasedPaintApplies of [null,false,true])for(const ownersAssociationApplies of [null,false,true]){
    const facts={yearBuilt,leadBasedPaintApplies,ownersAssociationApplies};
    assert.deepEqual(normalized(gates.getListingUploadGateDocumentTypes(code,facts,Date.now())),gate[slug+'RequiredDisclosureTypes']({yearBuilt,sellerStatements:{leadBasedPaintApplies,ownersAssociationApplies}}));parity++;
  }
  const reference={id:'sample',collection:()=>({doc:type=>({type})})};
  const valid=type=>({currentDocument:{listingUid:'sample',stateAbbreviation:code,storagePath:'files/'+type,versionId:'v1'}});
  const transaction=bad=>({get:async ref=>({data:()=>ref.type===bad?undefined:valid(ref.type)})});
  await gate['assert'+name+'ListingDisclosures'](transaction(),reference,{yearBuilt:2000,sellerStatements:{ownersAssociationApplies:false}});
  await assert.rejects(gate['assert'+name+'ListingDisclosures'](transaction(slug+'-statutory-packet'),reference,{yearBuilt:2000}),/seller must upload/);
  await assert.rejects(gate['assert'+name+'ListingDisclosures']({get:async()=>({data:()=>({currentDocument:{...valid('x').currentDocument,stateAbbreviation:'XX'}})})},reference,{yearBuilt:2000}),/seller must upload/);
  const terms=structuredClone(initial);
  Object.assign(terms.purchase,{hasEarnestMoney:false,financingType:'cash',loanAmountInCents:0});
  Object.assign(terms.conditions,{financing:false,appraisal:false,additionalEarnestMoney:false});
  terms.deadlines.settlementDate='2099-12-01';
  Object.assign(terms.settlement,{titlePolicyPayer:'seller',closingAgentName:'Test Title',specialAssessmentPayer:'seller'});
  Object.assign(terms.disclosures,{propertyConditionStatus:'received',statutoryPacketStatus:'received',hoaDocumentsStatus:'not_applicable',leadPaintStatus:'built_1978_or_later',taxNoticeAcknowledged:true,radonNoticeAcknowledged:true,leaseStatementAcknowledged:true});
  terms.delivery.expiresAt='2099-10-01T12:00:00Z';terms.delivery.electronicDeliveryAuthorized=true;
  const version={Uid:'version',offerUid:'offer',stateCode:code,status:'draft',immutable:false,expiresAt:terms.delivery.expiresAt,terms,buyers:[party('buyer')],sellers:[party('seller')],initiatedBy:'buyer',initiatedByUid:'buyer'};
  const offer={Uid:'offer',stateCode:code,listingUid:'sample',currentVersionUid:'version'};
  pkg.validateSubmission({offer,version});pkg.validateBeforeSigning({offer,version});
  assert.equal(validator.validate(terms,version.buyers,version.sellers,{mode:'submit'}).valid,true);
  const mutate=fn=>{const v=structuredClone(version);fn(v.terms);assert.throws(()=>pkg.validateSubmission({offer,version:v}));};
  if(code==='AZ') mutate(t=>t.disclosures.propertyConditionStatus='pending'); else {const v=structuredClone(version);v.terms.disclosures.propertyConditionStatus='pending';pkg.validateSubmission({offer,version:v});pkg.validateBeforeSigning({offer,version:v});assert(validator.validate(v.terms,v.buyers,v.sellers,{mode:'submit'}).valid);}mutate(t=>t.disclosures.statutoryPacketStatus='pending');mutate(t=>t.delivery.electronicDeliveryAuthorized=false);mutate(t=>t.purchase.financingType='fha');
  mutate(t=>{t.purchase.hasEarnestMoney=true;t.purchase.earnestMoneyInCents=999999999;t.purchase.earnestMoneyHolder='Test';});
  mutate(t=>t.deadlines.settlementDate='2099-02-31');
  const hostile=structuredClone(terms);hostile.stateCode='XX';hostile.property.state='XX';hostile.legalDescription='Tampered';hostile.delivery.timeZone='UTC';hostile.disclosures.sellerReportsHoa=true;
  const sanitized=pkg.sanitizeDraftTerms({requestedTerms:hostile,currentTerms:terms,initiatedBy:'buyer'});
  assert.equal(sanitized.stateCode,code);assert.equal(sanitized.property.state,code);assert.equal(sanitized.legalDescription,terms.legalDescription);assert.equal(sanitized.delivery.timeZone,tz);assert.equal(sanitized.disclosures.sellerReportsHoa,false);
  const sellerRequest=structuredClone(terms);sellerRequest.disclosures.propertyConditionStatus='pending';sellerRequest.disclosures.statutoryPacketStatus='pending';sellerRequest.delivery.electronicDeliveryAuthorized=false;
  const counter=pkg.sanitizeDraftTerms({requestedTerms:sellerRequest,currentTerms:terms,initiatedBy:'seller'});
  assert.deepEqual(counter.disclosures,terms.disclosures);assert.equal(counter.delivery.electronicDeliveryAuthorized,false,'Each initiator must expressly consent');
  const {PDFDocument}=require(require.resolve('pdf-lib',{paths:[path.join(project,'functions')]}));
  const pdfInput={offer:{...offer,referenceNumber:'TEST-'+code},version:{...version,versionNumber:1,createdAt:{toDate:()=>new Date('2026-10-09T12:00:00Z')}},documentTitle:'Fictional '+name+' agreement',generatedAt:new Date('2026-10-09T12:00:00Z'),documentStatus:'prototype'};
  const before=JSON.stringify(pdfInput);
  const pending=await pkg.generateAgreement(pdfInput);fs.writeFileSync(path.join(project,'../deliverables/NavStreet-'+name+'-Agreement-Sample.pdf'),pending.buffer);assert.equal((await PDFDocument.load(pending.buffer)).getPageCount(),pending.pageCount);assert.equal(JSON.stringify(pdfInput),before);
  const signedAt={toDate:()=>new Date('2026-10-10T12:00:00Z')};
  const signedInput={...pdfInput,documentStatus:'approved',version:{...pdfInput.version,buyers:pdfInput.version.buyers.map(p=>({...p,signature:{status:'signed',signedAt}})),sellers:pdfInput.version.sellers.map(p=>({...p,signature:{status:'signed',signedAt}}))}};
  const signedBefore=JSON.stringify(signedInput);const signed=await pkg.generateAgreement(signedInput);assert.equal((await PDFDocument.load(signed.buffer)).getPageCount(),signed.pageCount);assert.equal(JSON.stringify(signedInput),signedBefore);
  const longInput={...pdfInput,version:{...pdfInput.version,terms:{...terms,additionalTerms:('Negotiated text retained in every overflow page. ').repeat(100)}}};
  const long=await pkg.generateAgreement(longInput);assert.equal((await PDFDocument.load(long.buffer)).getPageCount(),long.pageCount);assert(long.pageCount>=pending.pageCount);
  const required=pkg.requiredListingDisclosures({offer,version});assert(required.includes(slug+'-seller-disclosure'));assert(required.includes(slug+'-statutory-packet'));
  console.log('PASS:',code,'draft identity, disclosures, trusted facts, submission guards and counteroffer receipt protection.');
 }
 console.log('PASS: '+parity+' Arizona/Idaho disclosure policy parity cases.');
})().catch(error=>{console.error(error);process.exitCode=1;});
