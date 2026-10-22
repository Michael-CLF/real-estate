const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const project=path.resolve(process.argv[2]||'.');
const ts=require(require.resolve('typescript',{paths:[project,path.join(project,'functions')]}));
function load(file){const module={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module,exports:module.exports,require:n=>load(path.resolve(path.dirname(file),n+'.ts')),Date,Intl,Set,Object,Number,Map,Array});return module.exports;}
const back='functions/lib/offers/state-contracts/montana',front='src/app/core/domains/offers/state-contracts/montana',ui='src/app/features/offers/states/montana';
const pkg=require(path.join(project,back,'montana-state-contract.package.js')).montanaStateContractPackage;
const selector=load(path.join(project,front,'montana-contract-selection.ts'));
const normal=x=>JSON.parse(JSON.stringify(x));
const party=role=>({partyUid:role,userUid:role,role,legalName:'Fictional '+role,email:role+'@example.com',phone:'5555550100',requiredSigner:true,identityVerification:{status:'verified'},signature:{status:'pending'}});
const facts={isCondominium:true,isDeveloperSale:false,isLeasehold:false,dwellingUnitCount:null};
const condo='navstreet_montana_condominium_resale_2026',house='navstreet_montana_residential_sale_2026';
function fixture(type='condo',ownership=facts,year=1980){
 const property={listingUid:'sample',addressLine1:'100 Fictional St',city:'Bozeman',state:'MT',zipCode:'59718',county:'Gallatin',legalDescription:'FICTIONAL UNIT 101 TOGETHER WITH APPURTENANT INTERESTS',propertyType:type,yearBuilt:year,listPriceInCents:35000000,contractFacts:ownership};
 const listing={propertyType:type,yearBuilt:year,sellerStatements:{contractFacts:ownership,ownersAssociationApplies:true,leasesExist:false,generalLeasesExist:false,montana:{disclosureExemptionClaimed:false,radonTestsKnown:false,drugContaminationKnown:false,appurtenantWaterRightsKnown:false}}};
 const contractType=selector.selectMontanaContract(type,ownership);
 const terms=pkg.createInitialOfferTerms({contractType,property,listingData:listing,buyer:party('buyer'),seller:party('seller')});
 // Historical template checks deliberately exercise preserved revision 2026-10-22.
 delete terms.condominiumAcceptancePolicy;
 Object.assign(terms.purchase,{hasEarnestMoney:false,financingType:'cash',loanAmountInCents:0});Object.assign(terms.conditions,{financing:false,appraisal:false,additionalEarnestMoney:false});
 Object.assign(terms.deadlines,{settlementDate:'2099-12-01',sellerDisclosureDate:'',inspectionPeriodDays:15});Object.assign(terms.settlement,{titlePolicyPayer:'seller',closingAgentName:'Fictional Title',specialAssessmentPayer:'seller',hoaTransferFeePayer:'seller'});
 Object.assign(terms.disclosures,{propertyConditionStatus:'received',statutoryPacketStatus:'pending',hoaDocumentsStatus:'received',taxNoticeAcknowledged:true,radonNoticeAcknowledged:true,leaseStatementAcknowledged:true});terms.documentVersions={'montana-seller-disclosure':'condition-v1','montana-association-documents':'association-v1'};terms.condominiumReceiptAt=new Date(Date.now()-73*60*60*1000).toISOString();terms.delivery.expiresAt='2099-10-01T12:00:00Z';terms.delivery.electronicDeliveryAuthorized=true;
 const version={Uid:'version',offerUid:'offer',stateCode:'MT',status:'draft',immutable:false,expiresAt:terms.delivery.expiresAt,terms,buyers:[party('buyer')],sellers:[party('seller')],initiatedBy:'buyer',initiatedByUid:'buyer',versionNumber:1};
 const offer={Uid:'offer',referenceNumber:'FICTIONAL-MT',stateCode:'MT',listingUid:'sample',currentVersionUid:'version'};return {offer,version,listing};
}
(async()=>{
 for(const type of ['condo','townhome','single_family','pud']){const f=fixture(type);assert.equal(f.version.terms.contractType,condo);pkg.validateSubmission(f);pkg.validateBeforeSigning(f);pkg.assertListingContractCompatible(f.listing,f.version);}
 for(const f of [undefined,{...facts,isCondominium:false},{...facts,isLeasehold:true},{...facts,isDeveloperSale:true},{...facts,isCondominium:null}])assert.throws(()=>selector.selectMontanaContract('condo',f));
 assert.throws(()=>selector.selectMontanaContract('vacant_land',facts));
 const f=fixture(),t=f.version.terms;assert.equal(pkg.getAgreementTemplate(t).templateUid,'navstreet-mt-condominium-2026');assert.equal(pkg.getAgreementTemplate(t).templateVersion,'2026-10-22');
 const p=load(path.join(project,ui,'montana-offer-package.ts')).MONTANA_OFFER_PACKAGE;
 const qs=p.getSections(t).flatMap(s=>s.questions);assert(qs.some(q=>q.fieldPath==='disclosures.hoaDocumentsStatus'&&q.options.some(o=>o.value==='received')));assert(!qs.some(q=>q.fieldPath?.startsWith('condominium.')));
 const Validator=load(path.join(project,ui,'validators/montana-offer.validator.ts')).MontanaOfferValidator;
 assert.equal(new Validator().validate(t,f.version.buyers,f.version.sellers,{mode:'submit',currentDateTime:new Date()}).valid,true);
 const definition=p.contracts[condo];assert.equal(definition.formId,'NAVSTREET-MT-CONDOMINIUM-2026');
 const pin=load(path.join(project,ui,'services/montana-reviewed-document-versions.ts')).pinMontanaReviewedDocumentVersions;
 let before=structuredClone(t);before.disclosures.hoaDocumentsStatus='pending';before.documentVersions={};let received=structuredClone(before);received.disclosures.hoaDocumentsStatus='received';received=pin(before,received,[{documentType:'montana-association-documents',versionId:'reviewed-v1'}]);
 assert.equal(received.documentVersions['montana-association-documents'],'reviewed-v1');assert.equal(pin(received,received,[{documentType:'montana-association-documents',versionId:'new-v2'}]).documentVersions['montana-association-documents'],'reviewed-v1');
 const required=pkg.requiredListingDisclosures({offer:f.offer,version:{...f.version,terms:received}});assert(required.includes('montana-association-documents'));assert.equal(pkg.listingDisclosurePolicy.reviewedVersions({version:{terms:received}})['montana-association-documents'],'reviewed-v1');
 const pending=structuredClone(received);pending.disclosures.hoaDocumentsStatus='pending';assert.equal(pin(received,pending,[]).documentVersions['montana-association-documents'],undefined);
 const hostile=structuredClone(received);hostile.contractType=house;hostile.disclosures.hoaDocumentsStatus='pending';hostile.disclosures.propertyConditionStatus='received';hostile.documentVersions={};
 const counter=pkg.sanitizeDraftTerms({requestedTerms:hostile,currentTerms:received,initiatedBy:'seller'});assert.equal(counter.contractType,condo);assert.equal(counter.disclosures.hoaDocumentsStatus,'received');assert.equal(counter.disclosures.propertyConditionStatus,'received');assert.deepEqual(normal(counter.documentVersions),normal(received.documentVersions));
 const sanitized=pkg.sanitizeDraftTerms({requestedTerms:{...received,documentVersions:{'forged':'bad','montana-association-documents':'path/escape'}},currentTerms:received,initiatedBy:'buyer'});assert.deepEqual(normal(sanitized.documentVersions),{});assert.equal(sanitized.contractType,condo);assert.equal(sanitized.condominiumReceiptAt,undefined);
 const actual=pkg.sanitizeDraftTerms({requestedTerms:{...t,condominiumReceiptAt:'1900-01-01T00:00:00Z'},currentTerms:{...t,condominiumReceiptAt:undefined},initiatedBy:'buyer'});
 assert(Date.parse(actual.condominiumReceiptAt)>=Date.now()-2000);
 pkg.validateBeforeSigning({offer:f.offer,version:{...f.version,terms:actual},signerRole:'buyer'});
 assert.throws(()=>pkg.validateBeforeSigning({offer:f.offer,version:{...f.version,terms:actual},signerRole:'seller'}),/72-hour/);
 const sellerCounter={...f.version,terms:actual,initiatedBy:'seller'};
 pkg.validateBeforeSigning({offer:f.offer,version:sellerCounter,signerRole:'seller'});
 assert.throws(()=>pkg.validateBeforeSigning({offer:f.offer,version:sellerCounter,signerRole:'buyer'}),/72-hour/);
 const policy=require(path.join(project,back,'montana-condominium-policy.js'));
 const edge=Date.parse(actual.condominiumReceiptAt)+72*60*60*1000;
 assert(policy.montanaCondominiumAcceptanceProblem(actual,edge-1));assert.equal(policy.montanaCondominiumAcceptanceProblem(actual,edge),undefined);
 const changed=pkg.sanitizeDraftTerms({requestedTerms:{...t,documentVersions:{...t.documentVersions,'montana-seller-disclosure':'condition-v2'}},currentTerms:t,initiatedBy:'buyer'});
 assert(Date.parse(changed.condominiumReceiptAt)>Date.parse(t.condominiumReceiptAt));
 const display=load(path.join(project,ui,'display/montana-offer-display.adapter.ts')).montanaOfferDisplayAdapter;
 assert(display.display(actual,{version:{initiatedBy:'buyer'}}).sellerSigningBlockReason);
 assert(!display.display(actual,{version:{initiatedBy:'buyer'}}).buyerSigningBlockReason);
 assert(display.display(actual,{version:{initiatedBy:'seller'}}).buyerSigningBlockReason);
 assert(!display.display(actual,{version:{initiatedBy:'seller'}}).sellerSigningBlockReason);
 const html=fs.readFileSync(path.join(project,'src/app/features/sell/listing-wizard/components/property-details-step/property-details-step.component.html'),'utf8');
 assert(html.includes('class="seller-association-statement" disabled'));assert(!html.includes('Carried forward from Homeowners Association above.'));

 for(const mutate of [x=>x.terms.contractType=house,x=>x.terms.disclosures.sellerReportsHoa=false,x=>x.terms.property.contractFacts.isLeasehold=true,x=>x.immutable=true]){const v=structuredClone(f.version);mutate(v);assert.throws(()=>pkg.validateSubmission({offer:f.offer,version:v}));}
 assert.throws(()=>pkg.assertListingContractCompatible({...f.listing,sellerStatements:{...f.listing.sellerStatements,contractFacts:{...facts,isCondominium:false}}},f.version));
 const old=fixture('single_family',{...facts,isCondominium:false});assert.equal(pkg.getAgreementTemplate(old.version.terms).templateVersion,'2026-10-10');assert.equal(pkg.getAgreementTemplate(old.version.terms).templateUid,'navstreet-mt-residential-2026');
 const pre=fixture('condo',facts,1977);assert.equal(pre.version.terms.disclosures.leadPaintStatus,'unselected');pre.version.terms.disclosures.leadPaintStatus='pending';assert.throws(()=>pkg.validateSubmission(pre));assert.throws(()=>pkg.validateBeforeSigning(pre));assert.equal(t.disclosures.leadPaintStatus,'built_1978_or_later');
 const output=path.join(project,'tmp/navstreet-montana-condominium');fs.mkdirSync(output,{recursive:true});
 for(const [name,item]of [['condominium',f],['received',{...f,version:{...f.version,terms:received}}],['residential',old],['signed',structuredClone(f)],['overflow',structuredClone(f)],['financed',structuredClone(f)]]){
  if(name==='signed')for(const person of [...item.version.buyers,...item.version.sellers])person.signature={status:'signed',signedAt:require(require.resolve('firebase-admin/firestore',{paths:[path.join(project,'functions')]})).Timestamp.now()};
  if(name==='overflow')item.version.terms.additionalTerms='Long negotiated term. '.repeat(225);
  if(name==='financed'){Object.assign(item.version.terms.purchase,{financingType:'conventional',loanAmountInCents:25000000});Object.assign(item.version.terms.conditions,{financing:true,appraisal:true});pkg.validateSubmission(item);}
  const metadata=pkg.getAgreementTemplate(item.version.terms),result=await pkg.generateAgreement({...item,documentTitle:metadata.templateName,generatedAt:new Date('2026-10-22T12:00:00Z'),documentStatus:name==='signed'?'approved':'prototype'});fs.writeFileSync(path.join(output,name+'.pdf'),result.bytes||result.buffer||result.pdfBytes||result);
 }
 console.log('PASS: Montana ownership selection, residential compatibility, actual receipt/72-hour response-signature timing, condo questions/display/metadata, strict lead applicability, immutable review pins, seller counters, forged terms and six native PDFs.');
})().catch(e=>{console.error(e);process.exitCode=1});
