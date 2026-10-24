const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const project=path.resolve(process.argv[2]||'.');
const ts=require(require.resolve('typescript',{paths:[project,path.join(project,'functions')]}));
function load(file){const module={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module,exports:module.exports,require:n=>load(path.resolve(path.dirname(file),n+'.ts')),Date,Intl,Set,Object,Number});return module.exports;}
const backend=f=>require(path.join(project,'functions/lib',f+'.js'));
const registry=backend('offers/state-contracts/state-contract-registry');
const {PDFDocument}=require(require.resolve('pdf-lib',{paths:[project,path.join(project,'functions')]}));
const normal=x=>JSON.parse(JSON.stringify(x));
const party=role=>({partyUid:role,userUid:role,role,legalName:'Fictional '+role,email:role+'@example.com',phone:'5555550100',requiredSigner:true,identityVerification:{status:'verified'},signature:{status:'pending'}});
(async()=>{
 const out=path.join(project,'tmp/navstreet-condominium-batch');fs.mkdirSync(out,{recursive:true});
 for(const [code,s,C,county] of [['MN','minnesota','Minnesota','Hennepin'],['AZ','arizona','Arizona','Maricopa']]){
  const front=path.join(project,'src/app/core/domains/offers/state-contracts',s),feature=path.join(project,'src/app/features/offers/states',s),pkg=registry.requireEnabledStateContractPackage(code);
  const selector=load(path.join(front,s+'-contract-selection.ts')),server=backend('offers/state-contracts/'+s+'/'+s+'-contract-selection');
  const facts={isCondominium:true,isDeveloperSale:false,isLeasehold:false,dwellingUnitCount:null},condo='navstreet_'+s+'_condominium_resale_2026',house='navstreet_'+s+'_residential_sale_2026';
  for(const type of ['condo','townhome','single_family','pud']){assert.equal(selector['select'+C+'Contract'](type,facts),condo);assert.equal(server['select'+C+'Contract'](type,facts),condo);}
  for(const f of [undefined,{...facts,isLeasehold:true},{...facts,isDeveloperSale:true},{...facts,isCondominium:null}])assert.throws(()=>selector['select'+C+'Contract']('condo',f));
  for(const type of ['land','multi_family','mobile'])assert.throws(()=>server['select'+C+'Contract'](type,facts));
  const property={listingUid:'sample',addressLine1:'100 Fictional St',city:'Test City',state:code,zipCode:'00000',county,legalDescription:'FICTIONAL condominium unit 101 and recorded appurtenant interests',propertyType:'townhome',contractFacts:facts,yearBuilt:2000,listPriceInCents:35000000};
  const listingData={propertyType:'townhome',yearBuilt:2000,sellerStatements:{contractFacts:facts,ownersAssociationApplies:false,leasesExist:false,leadBasedPaintApplies:false}};
  const input={contractType:condo,property,listingData,buyer:party('buyer'),seller:party('seller')};
  const initial=pkg.createInitialOfferTerms(input);assert.equal(initial.contractType,condo);assert.equal(initial.disclosures.sellerReportsHoa,true);assert.deepEqual(initial.documentVersions,{});
  assert.throws(()=>pkg.createInitialOfferTerms({...input,contractType:house}));
  const terms=structuredClone(initial);
  Object.assign(terms.condominium,{projectName:'Fictional Condominium',unitDesignation:'Unit 101',commonElements:'Recorded 1/10 undivided interest; patio limited common element',parkingStorage:'Parking P1 and storage S1 as stated in declaration',rightsAcknowledged:true});
  Object.assign(terms.purchase,{hasEarnestMoney:false,financingType:'cash',loanAmountInCents:0});Object.assign(terms.conditions,{financing:false,appraisal:false,additionalEarnestMoney:false});terms.deadlines.settlementDate='2099-12-01';
  Object.assign(terms.settlement,{titlePolicyPayer:'seller',closingAgentName: '',specialAssessmentPayer:'seller',hoaTransferFeePayer:'seller'});
  Object.assign(terms.disclosures,{propertyConditionStatus:'received',statutoryPacketStatus:'received',hoaDocumentsStatus:'received',leadPaintStatus:'built_1978_or_later',taxNoticeAcknowledged:true,radonNoticeAcknowledged:true,leaseStatementAcknowledged:true});
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:initial.delivery.timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  if(code==='MN')Object.assign(terms.disclosures,{associationCertificateDate:today,associationPacketReceivedDate:today});
  terms.delivery.expiresAt='2099-10-01T12:00:00Z';terms.delivery.electronicDeliveryAuthorized=true;
  const docs=['seller-disclosure','statutory-packet','association-documents'].map(type=>({documentType:s+'-'+type,listingUid:'sample',stateAbbreviation:code,versionId:'reviewed-v1',storagePath:'fictional/'+type}));
  const pin=load(path.join(feature,'services',s+'-reviewed-document-versions.ts'))['pin'+C+'ReviewedDocumentVersions'];
  const pinned=pin(initial,terms,docs);assert.equal(pinned.documentVersions[s+'-association-documents'],'reviewed-v1');
  const replaced=docs.map(d=>({...d,versionId:'replacement-v2'}));assert.equal(pin(pinned,pinned,replaced).documentVersions[s+'-association-documents'],'reviewed-v1');
  const pending=structuredClone(pinned);pending.disclosures.hoaDocumentsStatus='pending';const unpinned=pin(pinned,pending,replaced);assert.equal(unpinned.documentVersions[s+'-association-documents'],undefined);assert.equal(pin(unpinned,pinned,replaced).documentVersions[s+'-association-documents'],'replacement-v2');
  const version={Uid:'version',offerUid:'offer',stateCode:code,status:'draft',immutable:false,expiresAt:pinned.delivery.expiresAt,terms:pinned,buyers:[party('buyer')],sellers:[party('seller')],initiatedBy:'buyer',initiatedByUid:'buyer',versionNumber:1};
  const offer={Uid:'offer',referenceNumber:'FICTIONAL-'+code,stateCode:code,listingUid:'sample',currentVersionUid:'version'};
  pkg.validateSubmission({offer,version});pkg.validateBeforeSigning({offer,version});pkg.assertListingContractCompatible(listingData,version);
  const Validator=load(path.join(feature,'validators',s+'-offer.validator.ts'))[C+'OfferValidator'];assert.equal(new Validator().validate(pinned,version.buyers,version.sellers,{mode:'submit'}).valid,true);
  for(const mutate of [t=>t.condominium.rightsAcknowledged=false,t=>t.disclosures.hoaDocumentsStatus='pending',t=>t.documentVersions={},t=>t.contractType=house]){const v=structuredClone(version);mutate(v.terms);assert.throws(()=>pkg.validateSubmission({offer,version:v}));}
  const withoutExtraRecords=structuredClone(version);for(const field of ['projectName','unitDesignation','commonElements','parkingStorage'])withoutExtraRecords.terms.condominium[field]='';pkg.validateSubmission({offer,version:withoutExtraRecords});
  assert.throws(()=>pkg.assertListingContractCompatible({...listingData,sellerStatements:{...listingData.sellerStatements,contractFacts:{...facts,isCondominium:false}}},version));
  const hostile=structuredClone(pinned);hostile.condominium.unitDesignation='changed';hostile.disclosures.hoaDocumentsStatus='pending';hostile.documentVersions[s+'-association-documents']='tampered';
  const counter=pkg.sanitizeDraftTerms({requestedTerms:hostile,currentTerms:pinned,initiatedBy:'seller'});assert.deepEqual(counter.condominium,pinned.condominium);assert.deepEqual(counter.documentVersions,pinned.documentVersions);assert.equal(counter.disclosures.hoaDocumentsStatus,'received');
  const sanitized=pkg.sanitizeDraftTerms({requestedTerms:{...pinned,documentVersions:{'forged-type':'bad',[s+'-association-documents']:'path/escape'}},currentTerms:pinned,initiatedBy:'buyer'});assert.deepEqual(sanitized.documentVersions,{});assert.equal(sanitized.contractType,condo);
  const gate=backend('offers/'+s+'-listing-disclosure-gate');const required=gate[s+'RequiredDisclosureTypes'](listingData);assert(required.includes(s+'-association-documents'));
  const frontGates=load(path.join(project,'src/app/core/configuration/listing-disclosure-gates.ts'));assert.deepEqual(normal(frontGates.getListingUploadGateDocumentTypes(code,{...listingData.sellerStatements,propertyType:'townhome',yearBuilt:2000},Date.now())),required);
  assert.equal(pkg.getAgreementTemplate(pinned).templateUid,'navstreet-'+code.toLowerCase()+'-condominium-2026');assert.notEqual(pkg.getAgreementTemplate(pinned).templateUid,pkg.agreementTemplate.templateUid);
  assert.equal(pkg.listingDisclosurePolicy.reviewedVersions({version})[s+'-association-documents'],'reviewed-v1');
  const entry=fs.readFileSync(path.join(feature,s+'-offer-entry',s+'-offer-entry.component.ts'),'utf8');assert.equal((entry.match(/this\.pendingDraftChange = this\.prepareDraftChange\(change\)/g)||[]).length,2);
  const sections=load(path.join(feature,'questions',s+'-condominium.sections.ts'))['get'+C+'CondominiumSections'](pinned,[{id:'disclosures',questions:[]}]);assert.equal(sections[0].questions.length,1);
  for(const kind of ['pending','signed','overflow']){
   const v=structuredClone(version);if(kind==='pending')v.terms=initial;if(kind==='signed')for(const p of [...v.buyers,...v.sellers])p.signature={status:'signed',signedAt:{toDate:()=>new Date()},typedName:p.legalName};if(kind==='overflow'){v.terms.additionalTerms='Fictional overflow text remains visible. '.repeat(125);v.terms.condominium.commonElements='Common interest investigation text. '.repeat(85)+'END_COMMON_ELEMENTS';v.terms.condominium.parkingStorage='Parking and storage investigation text. '.repeat(72)+'END_PARKING_STORAGE';}
   const result=await pkg.generateAgreement({offer,version:v,documentTitle:pkg.getAgreementTemplate(v.terms).templateName,generatedAt:new Date()});const file=path.join(out,code+'-'+kind+'.pdf');fs.writeFileSync(file,result.buffer);
   assert.equal((await PDFDocument.load(result.buffer)).getPageCount(),result.pageCount);assert(result.pageCount>=2);
  }
  console.log('PASS',code,'condominium selection, mirrored validation, changed-listing rejection, immutable review pins, counteroffer protection, gates, identity and three PDFs.');
 }
})().catch(error=>{console.error(error);process.exit(1)});
