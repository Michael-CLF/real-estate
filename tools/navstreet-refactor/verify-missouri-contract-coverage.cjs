const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const project=path.resolve(process.argv[2]||'.');
const ts=require(require.resolve('typescript',{paths:[project,path.join(project,'functions')]}));
const compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const load=file=>{const module={exports:{}};vm.runInNewContext(compile(fs.readFileSync(file,'utf8')),{module,exports:module.exports,require:n=>load(path.resolve(path.dirname(file),n+'.ts')),Date,Set,Intl,Object,Number});return module.exports;};
const back=f=>require(path.join(project,'functions/lib',f+'.js'));
const frontRoot=path.join(project,'src/app/core/domains/offers/state-contracts/missouri');
const front=load(path.join(frontRoot,'missouri-contract-selection.ts')),server=back('offers/state-contracts/missouri/missouri-contract-selection');
const registry=back('offers/state-contracts/state-contract-registry'),pkg=registry.requireEnabledStateContractPackage('MO');
const frontRegistry=load(path.join(project,'src/app/features/offers/engine/state-offer-registry.ts'));
const normalized=x=>x===undefined?undefined:JSON.parse(JSON.stringify(x));
const facts={isCondominium:false,isDeveloperSale:false,isLeasehold:false,dwellingUnitCount:null};
const party=role=>({partyUid:role,userUid:role,role,legalName:'Test '+role,email:role+'@example.com',phone:'5555550100',requiredSigner:true,identityVerification:{status:'verified'},signature:{status:'pending'}});
const property=type=>({listingUid:'sample',addressLine1:'100 Fictional St',city:'Test City',state:'MO',zipCode:'64000',county:'Jackson',legalDescription:'FICTIONAL TEST LEGAL DESCRIPTION',propertyType:type,yearBuilt:2000,listPriceInCents:35000000});
(async()=>{
 const states=['NC','TX','OK','UT','WI','FL','LA','CO','CA','SC','MI','MN','AZ','ID','OR','MO','NE','NH','AL','IN','KS','OH','DE','WA','IA','MT','MD','NM','SD','WY'];let coverage=0;
 for(const state of states){const registration=frontRegistry.getEnabledStateOfferRegistration(state),backend=registry.requireEnabledStateContractPackage(state);assert.deepEqual(normalized(registration.supportedPropertyTypes),normalized(backend.supportedPropertyTypes));
  for(const type of ['single_family','townhome','pud','condo','multi_family','land','mobile']){const f={...facts,isCondominium:type==='condo',dwellingUnitCount:type==='multi_family'?4:null};assert.equal(frontRegistry.getListingContractCoverageMessage(state,type,f)===null,registration.supportedPropertyTypes.includes(type));coverage++;}
  if(backend.assertListingContractCompatible && state!=='MO') {
   backend.assertListingContractCompatible({propertyType:'single_family',sellerStatements:{contractFacts:facts}},{terms:{contractType:'navstreet_'+({MN:'minnesota',AZ:'arizona',WA:'washington',MT:'montana',MD:'maryland',NM:'new_mexico',SD:'south_dakota',WY:'wyoming'}[state]||'unused')+'_residential_sale_2026'}});
   assert.throws(()=>backend.assertListingContractCompatible({propertyType:'single_family',sellerStatements:{contractFacts:{...facts,isDeveloperSale:true}}},{}));
   assert.throws(()=>backend.assertListingContractCompatible({propertyType:'single_family',sellerStatements:{contractFacts:{...facts,isLeasehold:true}}},{}));
   if(!backend.supportedPropertyTypes.includes('condo'))assert.throws(()=>backend.assertListingContractCompatible({propertyType:'townhome',sellerStatements:{contractFacts:{...facts,isCondominium:true}}},{}));
  }
  assert(frontRegistry.getListingContractCoverageMessage(state,'single_family',{...facts,isDeveloperSale:true}));assert(frontRegistry.getListingContractCoverageMessage(state,'single_family',{...facts,isLeasehold:true}));
 }
 for(const f of [undefined,{...facts,isCondominium:null},{...facts,isDeveloperSale:true},{...facts,isLeasehold:true}])for(const selector of [front,server])assert.throws(()=>selector.selectMissouriContract('townhome',f));
 for(const count of [null,1,5,2.5,'3'])for(const selector of [front,server])assert.throws(()=>selector.selectMissouriContract('multi_family',{...facts,dwellingUnitCount:count}));
 assert.equal(front.selectMissouriContract('townhome',{...facts,isCondominium:true}),'navstreet_missouri_condominium_resale_2026');
 assert(frontRegistry.getListingContractCoverageMessage('TX','multi_family',{...facts,dwellingUnitCount:5}));assert(frontRegistry.getListingContractCoverageMessage('TX','townhome',{...facts,isCondominium:true}));
 const co=registry.requireEnabledStateContractPackage('CO');
 const coProperty={...property('pud'),state:'CO',county:'Denver'};
 const coTerms=co.createInitialOfferTerms({contractType:'navstreet_colorado_residential_2026',property:coProperty,listingData:{sellerStatements:{ownersAssociationApplies:true},hoa:{hasHoa:true}},buyer:party('buyer'),seller:party('seller')});assert.equal(coTerms.property.propertyType,'pud');
 const frontCo=load(path.join(project,'src/app/core/domains/offers/state-contracts/colorado/services/colorado-initial-offer-terms.factory.ts')).createColoradoInitialOfferTerms({contractType:'navstreet_colorado_residential_2026',property:coProperty,expiresAt:'2099-10-01T12:00:00Z',timeZone:'America/Denver'});assert.equal(frontCo.property.propertyType,'pud');
 const validator=new (load(path.join(project,'src/app/features/offers/states/missouri/validators/missouri-offer.validator.ts'))).MissouriOfferValidator();
 const updater=load(path.join(project,'src/app/features/offers/states/missouri/services/missouri-offer-terms-updater.ts'));
 const pin=load(path.join(project,'src/app/features/offers/states/missouri/services/missouri-reviewed-document-versions.ts')).pinMissouriReviewedDocumentVersions;
 const sections=load(path.join(project,'src/app/features/offers/states/missouri/questions/missouri-special-property.sections.ts'));
 const baseSections=load(path.join(project,'src/app/features/offers/states/missouri/questions/missouri-residential-sale.sections.ts')).MISSOURI_RESIDENTIAL_SALE_SECTIONS;
 const output=path.join(project,'tmp/navstreet-missouri-variant-pdfs');fs.mkdirSync(output,{recursive:true});
 const {PDFDocument}=require(require.resolve('pdf-lib',{paths:[path.join(project,'functions')]}));
 for(const type of ['single_family','condo','land','multi_family']){
  const ownership={...facts,isCondominium:type==='condo',dwellingUnitCount:type==='multi_family'?3:null};const contractType=server.selectMissouriContract(type,ownership);assert.equal(front.selectMissouriContract(type,ownership),contractType);
  const listingData={propertyType:type,yearBuilt:type==='land'?undefined:2000,sellerStatements:{contractFacts:ownership,ownersAssociationApplies:type==='condo',leasesExist:type==='multi_family',leadBasedPaintApplies:false,missouri:{methProductionKnown:false,drugConvictionKnown:false}}};
  const terms=pkg.createInitialOfferTerms({contractType,property:property(type),listingData,buyer:party('buyer'),seller:party('seller')});
  const frontInitial=load(path.join(frontRoot,'services/missouri-initial-offer-terms.factory.ts')).createMissouriInitialOfferTerms({contractType,property:{...property(type),contractFacts:ownership},expiresAt:'2099-10-01T12:00:00Z',timeZone:'America/Chicago'});assert.equal(frontInitial.contractType,contractType);assert.deepEqual(normalized(frontInitial.specialProperty),normalized(terms.specialProperty));
  Object.assign(terms.purchase,{hasEarnestMoney:false,financingType:'cash',loanAmountInCents:0});Object.assign(terms.conditions,{financing:false,appraisal:false,additionalEarnestMoney:false});terms.deadlines.settlementDate='2099-12-01';Object.assign(terms.settlement,{titlePolicyPayer:'seller',closingAgentName:'Test Title',specialAssessmentPayer:'seller',hoaTransferFeePayer:'seller'});
  Object.assign(terms.disclosures,{propertyConditionStatus:'pending',statutoryPacketStatus:'pending',hoaDocumentsStatus:type==='condo'?'pending':'not_applicable',leadPaintStatus:type==='land'?'not_applicable':'built_1978_or_later',taxNoticeAcknowledged:true,radonNoticeAcknowledged:true,leaseStatementAcknowledged:true});
  terms.delivery.expiresAt='2099-10-01T12:00:00Z';terms.delivery.electronicDeliveryAuthorized=true;
  if(terms.specialProperty && type!=='condo')Object.assign(terms.specialProperty,{projectName:'Fictional Condominium',unitDesignation:'Unit 3',commonElements:'Appurtenant interests per recorded declaration',parkingStorage:'Space 3 per declaration',resaleCertificateStatus:'pending',condominiumRightsAcknowledged:true,intendedUse:'Residential use, subject to independent feasibility review',surveyRequired:true,landReviewAcknowledged:true,tenantDocumentsStatus:type==='multi_family'?'pending':'not_applicable',tenancyTransferAcknowledged:true});
  const version={Uid:'version',offerUid:'offer',stateCode:'MO',status:'draft',immutable:false,expiresAt:terms.delivery.expiresAt,terms,buyers:[party('buyer')],sellers:[party('seller')],initiatedBy:'buyer',initiatedByUid:'buyer',versionNumber:1};const offer={Uid:'offer',stateCode:'MO',listingUid:'sample',currentVersionUid:'version',referenceNumber:'NS-MO-TEST'};
  const validate=v=>{pkg.validateSubmission({offer,version:v});pkg.validateBeforeSigning({offer,version:v});const result=validator.validate(v.terms,v.buyers,v.sellers,{mode:'submit'});assert.equal(result.valid,true,JSON.stringify(result.errors));};validate(version);pkg.assertListingContractCompatible(listingData,version);
  assert.throws(()=>pkg.assertListingContractCompatible({...listingData,sellerStatements:{...listingData.sellerStatements,contractFacts:{...ownership,isDeveloperSale:true}}},version));
  const selected=sections.getMissouriSections(terms,baseSections);if(['land','multi_family'].includes(type))assert(selected.flatMap(s=>s.questions).some(q=>q.fieldPath?.startsWith('specialProperty.')));
  const hostile=structuredClone(terms);hostile.contractType='wrong';hostile.property.contractFacts={...ownership,isDeveloperSale:true};hostile.legalDescription='tampered';const sanitized=pkg.sanitizeDraftTerms({requestedTerms:hostile,currentTerms:terms,initiatedBy:'buyer'});assert.equal(sanitized.contractType,contractType);assert.deepEqual(sanitized.property,terms.property);assert.equal(sanitized.legalDescription,terms.legalDescription);
  if(terms.specialProperty){hostile.specialProperty.projectName='changed';const counter=pkg.sanitizeDraftTerms({requestedTerms:hostile,currentTerms:terms,initiatedBy:'seller'});assert.deepEqual(counter.specialProperty,terms.specialProperty);assert.throws(()=>updater.updateMissouriOfferTerms(terms,'specialProperty.__proto__.pollution','x'));}
  if(type==='condo'){
   // No seller-supplied supplementary details or certificate answers are needed to submit/sign.
   assert.equal(terms.specialProperty.projectName,'');assert.equal(terms.specialProperty.condominiumRightsAcknowledged,null);
   for(const status of ['unselected','pending']) {
    const blank=structuredClone(version);blank.terms.specialProperty.resaleCertificateStatus=status;blank.terms.disclosures.hoaDocumentsStatus='unselected';
    validate(blank);assert(!pkg.requiredListingDisclosures({offer,version:blank}).includes('missouri-condominium-resale-certificate'));
    const savedBlank=pkg.sanitizeDraftTerms({currentTerms:blank.terms,requestedTerms:blank.terms,initiatedBy:'buyer'});validate({...blank,terms:savedBlank});
    assert.equal(savedBlank.specialProperty.resaleCertificateStatus,status);assert.equal(savedBlank.specialProperty.condominiumRightsAcknowledged,null);
   }
   assert(!selected.flatMap(s=>s.questions).some(q=>q.fieldPath?.startsWith('specialProperty.') || q.fieldPath==='disclosures.hoaDocumentsStatus'),'No supplementary condo or certificate questions should remain');
   assert.equal(pkg.getAgreementTemplate(terms).templateVersion,'2026-10-19');
   const legacy=structuredClone(terms);delete legacy.condominiumOfferEntryRevision;assert.equal(pkg.getAgreementTemplate(legacy).templateVersion,'2026-10-12');
   const legacyCounter=pkg.sanitizeDraftTerms({currentTerms:legacy,requestedTerms:terms,initiatedBy:'seller'});assert.equal(legacyCounter.condominiumOfferEntryRevision,undefined);
   const receivedCounter=structuredClone(terms);Object.assign(receivedCounter.specialProperty,{resaleCertificateStatus:'received',certificateReceivedDate:'2026-01-01',condominiumRightsAcknowledged:true});receivedCounter.documentVersions={'missouri-condominium-resale-certificate':'reviewed-version'};
   const altered=structuredClone(receivedCounter);Object.assign(altered.specialProperty,{resaleCertificateStatus:'pending',certificateReceivedDate:'',condominiumRightsAcknowledged:false});altered.documentVersions={};
   const protectedCounter=pkg.sanitizeDraftTerms({currentTerms:receivedCounter,requestedTerms:altered,initiatedBy:'seller'});assert.deepEqual(protectedCounter.specialProperty,receivedCounter.specialProperty);assert.deepEqual(protectedCounter.documentVersions,receivedCounter.documentVersions);
   const received=structuredClone(version);received.terms.specialProperty.resaleCertificateStatus='received';received.terms.specialProperty.certificateReceivedDate='2026-01-01';validate(received);assert(pkg.requiredListingDisclosures({offer,version:received}).includes('missouri-condominium-resale-certificate'));assert(!pkg.requiredListingDisclosures({offer,version:received}).includes('missouri-association-documents'));
   const synchronized=updater.updateMissouriOfferTerms(terms,'specialProperty.resaleCertificateStatus','received');assert.equal(synchronized.disclosures.hoaDocumentsStatus,'received');
   const document={documentType:'missouri-condominium-resale-certificate',listingUid:'sample',stateAbbreviation:'MO',versionId:'version-one'};
   const pinned=pin(terms,synchronized,[document]);assert.equal(pinned.documentVersions['missouri-condominium-resale-certificate'],'version-one');
   const later=pin(pinned,pinned,[{...document,versionId:'version-two'}]);assert.equal(later.documentVersions['missouri-condominium-resale-certificate'],'version-one');
   const pending=updater.updateMissouriOfferTerms(pinned,'specialProperty.resaleCertificateStatus','pending');const cleared=pin(pinned,pending,[document]);assert(!cleared.documentVersions['missouri-condominium-resale-certificate']);
   const renewed=pin(cleared,synchronized,[{...document,versionId:'version-two'}]);assert.equal(renewed.documentVersions['missouri-condominium-resale-certificate'],'version-two');
   const saved=pkg.sanitizeDraftTerms({currentTerms:terms,requestedTerms:pinned,initiatedBy:'buyer'});assert.equal(saved.documentVersions['missouri-condominium-resale-certificate'],'version-one');
   assert.equal(pkg.listingDisclosurePolicy.reviewedVersions({version:{terms:saved}})['missouri-condominium-resale-certificate'],'version-one');
   received.terms.specialProperty.certificateReceivedDate='2099-01-01';assert.throws(()=>pkg.validateSubmission({offer,version:received}));assert.equal(validator.validate(received.terms,received.buyers,received.sellers,{mode:'submit'}).valid,false);
  }
  if(type==='multi_family'){const received=structuredClone(version);received.terms.specialProperty.tenantDocumentsStatus='received';validate(received);assert(pkg.requiredListingDisclosures({offer,version:received}).includes('missouri-tenant-records'));}
  const metadata=pkg.getAgreementTemplate(terms);assert.equal(metadata.templateName,server.MISSOURI_CONTRACT_NAMES[contractType]);assert(registry.getStateContractRegistration('MO').agreementTemplates.some(x=>x.templateUid===metadata.templateUid));
  const input={offer,version,documentTitle:metadata.templateName,generatedAt:new Date('2026-10-12T12:00:00Z'),documentStatus:'approved'};
  for(const stage of ['pending','signed','overflow']){const v=structuredClone(version);if(stage==='signed')for(const p of [...v.buyers,...v.sellers])p.signature={status:'signed',signedAt:require(require.resolve('firebase-admin/firestore',{paths:[path.join(project,'functions')]})).Timestamp.fromDate(new Date('2026-10-12T12:00:00Z'))};if(stage==='overflow'){v.terms.additionalTerms=('Overflow terms preserved. ').repeat(350);if(v.terms.specialProperty)v.terms.specialProperty.parkingStorage=('Parking rights retained. ').repeat(100);}
   const pdf=await pkg.generateAgreement({...input,version:v});assert.equal((await PDFDocument.load(pdf.buffer)).getPageCount(),pdf.pageCount);fs.writeFileSync(path.join(output,type+'-'+stage+'.pdf'),pdf.buffer);
  }
 }
 pkg.assertListingContractCompatible({propertyType:'single_family',sellerStatements:{}},{terms:{contractType:'navstreet_missouri_residential_sale_2026'}});
 const entrySource=fs.readFileSync(path.join(project,'src/app/features/offers/states/missouri/missouri-offer-entry/missouri-offer-entry.component.ts'),'utf8');assert.equal((entrySource.match(/this.pendingDraftChange = this.prepareDraftChange\(change\)/g)||[]).length,2,'Both autosave and final submission must preserve reviewed versions');
 const gate=back('offers/missouri-listing-disclosure-gate');assert.deepEqual(gate.missouriRequiredDisclosureTypes({propertyType:'land',sellerStatements:{leadBasedPaintApplies:false,missouri:{methProductionKnown:false,drugConvictionKnown:false}}}),[]);
 console.log('PASS:',coverage,'state/property declaration comparisons; ownership/transaction/unit-count guards; four Missouri agreement paths; submission/signing parity; blank condominium details and unanswered certificate accepted; removed condo questions; legacy/new template metadata; pending vs actual receipt; protected counteroffers; sanitization; 12 pending/signed/overflow PDFs.');
})().catch(error=>{console.error(error);process.exitCode=1;});
