const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const project=path.resolve(process.argv[2]||'.');
const ts=require(require.resolve('typescript',{paths:[path.join(project,'functions')]}));
function load(file){const m={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module:m,exports:m.exports,require:n=>load(path.resolve(path.dirname(file),n+'.ts')),Date,Set});return m.exports;}
const pin=load(path.join(project,'src/app/features/offers/states/indiana/services/indiana-reviewed-document-versions.ts')).pinIndianaReviewedDocumentVersions;
const current={property:{listingUid:'listing'},disclosures:{propertyConditionStatus:'unselected',statutoryPacketStatus:'pending',leadPaintStatus:'built_1978_or_later',hoaDocumentsStatus:'not_applicable'},documentVersions:{}};
const docs=[{listingUid:'listing',stateAbbreviation:'IN',documentType:'indiana-seller-disclosure',versionId:'reviewed-v1'}];
const reviewed=pin(current,{...current,disclosures:{...current.disclosures,propertyConditionStatus:'received'}},docs);
assert.equal(reviewed.documentVersions['indiana-seller-disclosure'],'reviewed-v1');
const later=[{...docs[0],versionId:'replacement-v2'}];
assert.equal(pin(reviewed,{...reviewed,purchase:{purchasePriceInCents:99}},later).documentVersions['indiana-seller-disclosure'],'reviewed-v1');
const pending=pin(reviewed,{...reviewed,disclosures:{...reviewed.disclosures,propertyConditionStatus:'pending'}},later);
assert.equal(pending.documentVersions['indiana-seller-disclosure'],undefined);
assert.equal(pin(pending,reviewed,later).documentVersions['indiana-seller-disclosure'],'replacement-v2');
for(const wrong of [{...docs[0],listingUid:'other'},{...docs[0],stateAbbreviation:'OH'}, {...docs[0],versionId:''}]) assert.equal(pin(current,reviewed,[wrong]).documentVersions['indiana-seller-disclosure'],undefined);

const entrySource=fs.readFileSync(path.join(project,'src/app/features/offers/states/indiana/indiana-offer-entry/indiana-offer-entry.component.ts'),'utf8');
const pinMethods=entrySource.slice(entrySource.indexOf('  private lastReviewedTerms:'),entrySource.indexOf('  protected onDraftChanged('));
const entryModule={exports:{}};
vm.runInNewContext(ts.transpileModule('class Entry {'+pinMethods+'} module.exports=Entry;',{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module:entryModule,exports:entryModule.exports,INDIANA_OFFER_PACKAGE:{documentReview:{prepareDraft:pin}}});
const entry=new entryModule.exports();let activeVersion={Uid:'one',initiatedBy:'buyer',terms:current},activeDocs=docs;
entry.currentVersion=()=>activeVersion;entry.listingDisclosures=()=>activeDocs;
const first=entry.prepareDraftChange({terms:reviewed});assert.equal(first.terms.documentVersions['indiana-seller-disclosure'],'reviewed-v1');
activeDocs=later;assert.equal(entry.prepareDraftChange({terms:reviewed}).terms.documentVersions['indiana-seller-disclosure'],'reviewed-v1');
activeVersion={Uid:'two',initiatedBy:'buyer',terms:current};assert.equal(entry.prepareDraftChange({terms:reviewed}).terms.documentVersions['indiana-seller-disclosure'],'replacement-v2');
activeVersion={Uid:'seller',initiatedBy:'seller',terms:reviewed};assert.equal(entry.prepareDraftChange({terms:reviewed}).terms,reviewed);

const pkg=require(path.join(project,'functions/lib/offers/state-contracts/indiana/indiana-state-contract.package.js')).indianaStateContractPackage;
// Exercise sanitizer with a new initializer using the same valid state fixture as the integrated suite.
const source=fs.readFileSync(path.join(project,'src/app/core/domains/offers/services/offer.service.ts'),'utf8');
const a=source.indexOf('  getParticipantAccess('),b=source.indexOf('  private clearExpiredDraftExpiration',a);
const method=source.slice(a,b);
const code=ts.transpileModule('class Access { currentUserUid="";'+method+'}\nmodule.exports=Access;',{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const moduleAccess={exports:{}};vm.runInNewContext(code,{module:moduleAccess,exports:moduleAccess.exports});
const access=new moduleAccess.exports();
const offer={buyerUids:['buyer'],sellerUids:['seller'],status:'submitted'};
for(const initiatedBy of ['buyer','seller'])for(const status of ['delivered','signed','draft','awaiting_signatures','accepted','withdrawn','expired'])for(const userUid of ['buyer','seller','stranger']){
 access.currentUserUid=userUid;
 const version={initiatedBy,status,immutable:true,versionNumber:1,buyers:[{userUid:'buyer',requiredSigner:true,signature:{status:'pending'}}],sellers:[{userUid:'seller',requiredSigner:true,signature:{status:'pending'}}]};
 const result=access.getParticipantAccess(offer,version);
 const receiver=userUid===(initiatedBy==='buyer'?'seller':'buyer');
 assert.equal(result.canAccept,receiver&&['delivered','signed'].includes(status));
 if(result.canAccept)assert(result.canSign);
 const party=version.buyers.concat(version.sellers).find(p=>p.userUid===userUid);if(party){party.signature.status='signed';assert.equal(access.getParticipantAccess(offer,version).canSign,false);}
}
const base={stateCode:'IN',contractType:'navstreet_indiana_residential_sale_2026',property:{listingUid:'listing',county:'Marion',state:'IN',propertyType:'single_family',yearBuilt:2000,listPriceInCents:10000000},delivery:{timeZone:'America/Indiana/Indianapolis'},listingData:{sellerStatements:{indiana:{usesCentralTime:false},ownersAssociationApplies:false,leasesExist:false}},buyer:{},seller:{}};
const initial=pkg.createInitialOfferTerms({...base,listingData:base.listingData});
const terms={...initial,documentVersions:{'indiana-seller-disclosure':'reviewed-v1'},disclosures:{...initial.disclosures,propertyConditionStatus:'received'}};
const hostile={...terms,documentVersions:{'indiana-seller-disclosure':'replacement-v2','unrelated':'bad','lead-based-paint':'../bad'},disclosures:{...terms.disclosures,propertyConditionStatus:'pending'}};
const seller=pkg.sanitizeDraftTerms({requestedTerms:hostile,currentTerms:terms,initiatedBy:'seller'});
assert.deepEqual(seller.documentVersions,terms.documentVersions);assert.deepEqual(seller.disclosures,terms.disclosures);
const buyer=pkg.sanitizeDraftTerms({requestedTerms:hostile,currentTerms:terms,initiatedBy:'buyer'});
assert.deepEqual(buyer.documentVersions,{'indiana-seller-disclosure':'replacement-v2'});
assert.equal(pkg.listingDisclosurePolicy.reviewedVersions({version:{terms}})['indiana-seller-disclosure'],'reviewed-v1');
assert.equal(pkg.getAgreementTemplate(initial).templateVersion,'2026-10-13');
const legacy={...initial};delete legacy.documentVersions;assert.equal(pkg.getAgreementTemplate(legacy).templateVersion,pkg.agreementTemplate.templateVersion);

// Exercise the actual listing-details readiness methods for missing, invalid,
// uploaded and supported-exception records; upload never auto-acknowledges receipt.
const listingSource=fs.readFileSync(path.join(project,'src/app/features/marketplace/listings/pages/listing-details/listing-details.component.ts'),'utf8');
const listingMethods=listingSource.slice(listingSource.indexOf('  requiredOfferDocumentTypes('),listingSource.indexOf('  californiaDisclosureExplanations('));
const listingModule={exports:{}};
const checklist=load(path.join(project,'src/app/core/configuration/listing-document-checklist.config.ts'));
const listingCode=ts.transpileModule('class ListingView {'+listingMethods+'} module.exports=ListingView;',{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
vm.runInNewContext(listingCode,{module:listingModule,exports:listingModule.exports,Set,isFederalLeadExcluded:require(path.join(project,'functions/lib/offers/state-contracts/federal-lead-policy.js')).isFederalLeadExcluded,getOfferBlockingDocumentTypes:checklist.getOfferBlockingDocumentTypes,checklistDocumentTitle:checklist.checklistDocumentTitle,getListingContractCoverageMessage:()=>null});
const view=new listingModule.exports();let uploaded=[],loading=false,readError='';
view.disclosures=()=>uploaded;view.authenticationIsLoading=()=>false;view.isAuthenticated=()=>true;view.disclosuresAreLoading=()=>loading;view.disclosureLoadError=()=>readError;
const listing={uid:'listing',address:{stateAbbreviation:'IN'},propertyType:'single_family',yearBuilt:2000,sellerStatements:{leadBasedPaintApplies:false,indiana:{disclosureExemptionClaimed:false}}};
assert.equal(view.offerDisclosuresAreReady(listing),false);assert.equal(view.requiredOfferDisclosureTitles(listing).length,1);
uploaded=[{...docs[0],storagePath:'files/reviewed-v1.pdf'}];assert.equal(view.offerDisclosuresAreReady(listing),true);
listing.sellerStatements.indiana.disclosureExemptionClaimed=true;uploaded=[];assert.equal(view.offerDisclosuresAreReady(listing),false);
uploaded=[{...docs[0],storagePath:'files/exception.pdf'}];assert.equal(view.offerDisclosuresAreReady(listing),true);
loading=true;assert.equal(view.offerDisclosuresAreReady(listing),false);loading=false;readError='failed';assert.equal(view.offerDisclosuresAreReady(listing),false);readError='';
for(const bad of [{listingUid:'other'},{stateAbbreviation:'OH'},{storagePath:''},{versionId:''}]){uploaded=[{...docs[0],storagePath:'files/test.pdf',...bad}];assert.equal(view.offerDisclosuresAreReady(listing),false);}

console.log('PASS: recipient acceptance permissions, signed-party protection, exact receipt pins, replacement/invalid documents, protected seller counteroffers, sanitizer allowlist and legacy template provenance.');
