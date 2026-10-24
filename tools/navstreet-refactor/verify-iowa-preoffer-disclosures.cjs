const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const project=path.resolve(process.argv[2]||'.'),ts=require(require.resolve('typescript',{paths:[project,path.join(project,'functions')]}));
const compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,experimentalDecorators:true}}).outputText;
function load(file){const module={exports:{}};vm.runInNewContext(compile(fs.readFileSync(file,'utf8')),{module,exports:module.exports,require:n=>load(path.resolve(path.dirname(file),n+'.ts')),Date,Set,Intl});return module.exports;}
const back=f=>require(path.join(project,'functions/lib',f+'.js'));
const policy=back('offers/state-contracts/iowa/iowa-disclosure-policy'),frontPolicy=load(path.join(project,'src/app/core/domains/offers/state-contracts/iowa/iowa-disclosure-policy.ts'));
const pkg=back('offers/state-contracts/state-contract-registry').requireEnabledStateContractPackage('IA');
const FrontValidator=load(path.join(project,'src/app/features/offers/states/iowa/validators/iowa-offer.validator.ts')).IowaOfferValidator;
const frontValidator=new FrontValidator();
const normal=x=>JSON.parse(JSON.stringify(x));
const person=role=>({partyUid:role,userUid:role,role,legalName:'Fictional '+role,email:role+'@example.com',phone:'5555550100',requiredSigner:true,electronicTransactionsConsentAccepted:true,identityVerification:{status:'verified'},signature:{status:'signed',signedAt:{toDate:()=>new Date('2026-10-22T10:00Z')}}});
function fixture(){const terms=pkg.createInitialOfferTerms({contractType:pkg.contractTypes[0],property:{listingUid:'listing',state:'IA',county:'Polk',propertyType:'single_family',yearBuilt:1980,addressLine1:'100 Fictional St',city:'Des Moines',zipCode:'50301',legalDescription:'Fictional Lot 1',listPriceInCents:30000000},listingData:{yearBuilt:1980,sellerStatements:{ownersAssociationApplies:false,leasesExist:false,iowa:{disclosureExemptionClaimed:false,privateSewageApplies:false,leadServiceLineKnown:false}}}});
Object.assign(terms.purchase,{hasEarnestMoney:false,financingType:'cash',loanAmountInCents:0});Object.assign(terms.conditions,{financing:false,appraisal:false,additionalEarnestMoney:false});Object.assign(terms.deadlines,{settlementDate:'2099-12-01'});Object.assign(terms.settlement,{titleEvidenceSelection:'abstract_opinion',titlePolicyPayer:'seller',closingAgentName: '',specialAssessmentPayer:'seller'});Object.assign(terms.disclosures,{propertyConditionStatus:'received',statutoryPacketStatus:'pending',hoaDocumentsStatus:'not_applicable',leadPaintStatus:'built_1978_or_later',taxNoticeAcknowledged:true,radonNoticeAcknowledged:true,leaseStatementAcknowledged:true});terms.documentVersions={'iowa-seller-disclosure':'condition-v1'};Object.assign(terms.delivery,{expiresAt:'2099-10-01T12:00:00Z',electronicDeliveryAuthorized:true});
const version={Uid:'version',offerUid:'offer',stateCode:'IA',versionNumber:1,status:'draft',immutable:false,initiatedBy:'buyer',initiatedByUid:'buyer',expiresAt:terms.delivery.expiresAt,terms,buyers:[person('buyer')],sellers:[person('seller')]};
const offer={Uid:'offer',referenceNumber:'FICTIONAL-IOWA',stateCode:'IA',listingUid:'listing',currentVersionUid:'version',buyerUids:['buyer'],sellerUids:['seller'],status:'submitted'};return {offer,version};}
function legacy(f){delete f.version.terms.disclosurePolicyRevision;delete f.version.terms.radonFactSheetVersion;delete f.version.terms.documentVersions;f.version.terms.disclosures.propertyConditionStatus='pending';f.version.terms.disclosures.requiredKnownFacts=true;f.version.terms.disclosures.statutoryPacketStatus='pending';return f;}
const receipt=(f,buyer=f.version.buyers[0])=>({kind:'iowa-later-delivery-2026-10-22',receiptUid:'receipt',offerUid:f.offer.Uid,listingUid:f.offer.listingUid,partyUid:buyer.partyUid,buyerUid:buyer.userUid,typedName:buyer.legalName,receivedAtMillis:1,reviewedForVersionUid:f.version.Uid,documentVersions:{'iowa-seller-disclosure':'condition-v1'},radonFactSheetVersion:policy.IOWA_RADON_VERSION,disclosureExemptionClaimed:false,statement:policy.IOWA_LATE_RECEIPT_STATEMENT});
// Execute the actual callable handlers with an in-memory transaction boundary.
class HttpsError extends Error{constructor(code,message){super(message);this.code=code;}}
class Timestamp{constructor(ms){this.ms=ms;}toMillis(){return this.ms;}static now(){return new Timestamp(Date.now());}}
let f,listing,summary,document,audits,writes;
const ref=parts=>({id:parts.at(-1),parts,collection:name=>({doc:id=>ref([...parts,name,id??'receipt'])}),get:async()=>read(parts)});
function read(parts){let data;if(parts[0]==='offers') data=parts.length===2?f.offer:parts[2]==='versions'?f.version:audits[parts[3]];else data=parts.length===2?listing:parts.length===4?summary:document;return {exists:!!data,data:()=>data};}
const db={collection:name=>({doc:id=>ref([name,id])}),runTransaction:async fn=>fn({get:async r=>read(r.parts),create:(r,value)=>{assert.equal(r.parts[2],'iowaDisclosureReceipts');assert(!audits[r.id]);audits[r.id]=value;writes.push({kind:'audit',value});},update:(r,value)=>{assert.equal(r.parts.join('/'),'offers/offer');assert.deepEqual(Object.keys(value).sort(),['stateDisclosureReceipts','updatedAt']);f.offer={...f.offer,...value};writes.push({kind:'parent',value});}})};
const moduleValue={exports:{}};
vm.runInNewContext(compile(fs.readFileSync(path.join(project,'functions/src/offers/state-contracts/iowa/iowa-disclosure-receipt.ts'),'utf8')),{module:moduleValue,exports:moduleValue.exports,require:n=>{
if(n==='firebase-admin/firestore')return {Timestamp};if(n==='firebase-functions/v2/https')return {HttpsError,onCall:(_options,handler)=>handler};if(n.endsWith('shared/firebase-admin'))return {adminFirestore:db};if(n.endsWith('shared/function-options'))return {callableFunctionOptions:{region:'us-east1'}};if(n==='./iowa-disclosure-policy')return policy;if(n==='./iowa-disclosure-receipt-pdf')return back('offers/state-contracts/iowa/iowa-disclosure-receipt-pdf');throw Error(n);},Date,Number});
const {recordIowaDisclosureReceipt:recordReceipt,getIowaDisclosureReceiptPdf:getReceiptPdf}=moduleValue.exports;
function reset(){f=legacy(fixture());f.version.status='delivered';f.version.immutable=true;listing={status:'active'};document={listingUid:'listing',documentType:'iowa-seller-disclosure',stateAbbreviation:'IA',versionId:'condition-v1',storagePath:'listing-disclosures/listing/iowa-seller-disclosure/condition-v1.pdf'};summary={currentDocument:{...document}};audits={};writes=[];}
const request=(uid='buyer',changes={})=>({auth:uid?{uid}:undefined,data:{offerUid:'offer',offerVersionUid:'version',partyUid:'buyer',conditionVersionId:'condition-v1',radonFactSheetVersion:policy.IOWA_RADON_VERSION,typedName:'Fictional buyer',acknowledged:true,...changes}});
(async()=>{
const fresh=fixture();assert.equal(fresh.version.terms.disclosures.requiredKnownFacts,false);assert.equal(fresh.version.terms.disclosures.statutoryPacketStatus,'pending');
assert.equal(pkg.getAgreementTemplate(fresh.version.terms).templateVersion,'2026-10-22');
pkg.validateSubmission(fresh);for(const signerRole of ['buyer','seller'])pkg.validateBeforeSigning({...fresh,signerRole});assert.equal(frontValidator.validate(fresh.version.terms,fresh.version.buyers,fresh.version.sellers,{mode:'submit'}).valid,true);
const radonOnly=fixture();radonOnly.version.terms.disclosures.radonNoticeAcknowledged=false;
const radonIssues=frontValidator.validate(radonOnly.version.terms,radonOnly.version.buyers,radonOnly.version.sellers,{mode:'submit'}).errors;
assert.equal(radonIssues.filter(issue=>issue.fieldPath==='disclosures.propertyConditionStatus').length,0);
assert.equal(radonIssues.filter(issue=>issue.fieldPath==='disclosures.radonNoticeAcknowledged').length,1);
for(const mutate of [t=>t.disclosures.propertyConditionStatus='pending',t=>t.documentVersions={},t=>t.radonFactSheetVersion='wrong',t=>t.disclosures.radonNoticeAcknowledged=false,t=>{t.disclosures.propertyConditionStatus='exempt';t.disclosures.disclosureExemptionClaimed=false;}]){const bad=fixture();mutate(bad.version.terms);assert.throws(()=>pkg.validateSubmission(bad));assert.throws(()=>pkg.validateBeforeSigning({...bad,signerRole:'seller'}));assert.equal(frontValidator.validate(bad.version.terms,bad.version.buyers,bad.version.sellers,{mode:'submit'}).valid,false);}
const except=fixture();Object.assign(except.version.terms.disclosures,{disclosureExemptionClaimed:true,propertyConditionStatus:'exempt'});pkg.validateSubmission(except);assert(pkg.requiredListingDisclosures(except).includes('iowa-seller-disclosure'));
const old=legacy(fixture());assert.throws(()=>pkg.validateSubmission(old));assert.throws(()=>pkg.validateBeforeSigning({...old,signerRole:'seller'}));assert.equal(pkg.getAgreementTemplate(old.version.terms).templateVersion,'2026-10-10');
const migrated=pkg.sanitizeDraftTerms({currentTerms:old.version.terms,requestedTerms:fresh.version.terms,initiatedBy:'buyer'});assert.equal(migrated.disclosurePolicyRevision,policy.IOWA_DISCLOSURE_REVISION);assert.equal(migrated.disclosures.requiredKnownFacts,false);
const hostile=structuredClone(fresh.version.terms);hostile.documentVersions={'iowa-seller-disclosure':'replacement','bad/path':'hostile'};hostile.radonFactSheetVersion='forged';hostile.disclosures.radonNoticeAcknowledged=false;hostile.disclosures.propertyConditionStatus='pending';
const seller=pkg.sanitizeDraftTerms({currentTerms:fresh.version.terms,requestedTerms:hostile,initiatedBy:'seller'});assert.deepEqual(seller.documentVersions,fresh.version.terms.documentVersions);assert.deepEqual(seller.disclosures,fresh.version.terms.disclosures);assert.equal(seller.radonFactSheetVersion,policy.IOWA_RADON_VERSION);
const pin=load(path.join(project,'src/app/features/offers/states/iowa/services/iowa-reviewed-document-versions.ts')).pinIowaReviewedDocumentVersions;
const previous=structuredClone(fresh.version.terms);previous.disclosures.propertyConditionStatus='unselected';previous.documentVersions={};
assert.equal(pin(previous,fresh.version.terms,[{documentType:'iowa-seller-disclosure',versionId:'reviewed-v2'}]).documentVersions['iowa-seller-disclosure'],'reviewed-v2');
assert.equal(pin(fresh.version.terms,fresh.version.terms,[{documentType:'iowa-seller-disclosure',versionId:'unreviewed-v3'}]).documentVersions['iowa-seller-disclosure'],'condition-v1');
const sections=load(path.join(project,'src/app/features/offers/states/iowa/questions/iowa-preoffer.sections.ts')).getIowaPreofferSections(fresh.version.terms,[{questions:[{fieldPath:'disclosures.propertyConditionStatus'},{fieldPath:'disclosures.statutoryPacketStatus'},{fieldPath:'disclosures.radonNoticeAcknowledged'}]}]);assert.equal(sections[0].questions[0].options.length,1);assert.equal(sections[0].questions[0].options[0].value,'received');assert.equal(sections[0].questions[1].fieldPath,undefined);assert.match(sections[0].questions[2].label,/receiving and reviewing/);
// Actual later delivery: reject spoofing, stale uploads and terminal offers without writes.
for(const invalid of [()=>request(null),()=>request('stranger'),()=>request('seller'),()=>request('buyer',{partyUid:'seller'}),()=>request('buyer',{typedName:'Someone else'}),()=>request('buyer',{acknowledged:false}),()=>request('buyer',{radonFactSheetVersion:'wrong'}),()=>request('buyer',{conditionVersionId:'old-version'}),()=>request('buyer',{offerUid:'bad/path'})]){reset();await assert.rejects(recordReceipt(invalid()));assert.equal(writes.length,0);}
for(const mutate of [()=>f.offer.status='withdrawn',()=>f.offer.contract={contractUid:'contract'},()=>f.version.terms.disclosurePolicyRevision=policy.IOWA_DISCLOSURE_REVISION,()=>f.version.expiresAt='2020-01-01T00:00:00Z',()=>f.version.immutable=false,()=>f.version.buyers[0].signature.status='not_started',()=>f.version.buyers[0].electronicTransactionsConsentAccepted=false,()=>listing.status='under_contract',()=>document=undefined,()=>document.stateAbbreviation='WA',()=>document.storagePath='other',()=>summary.currentDocument.versionId='replacement']){reset();mutate();await assert.rejects(recordReceipt(request()));assert.equal(writes.length,0);}
reset();const signedBefore=JSON.stringify(f.version);const response=await recordReceipt(request());assert.equal(response.alreadyRecorded,false);assert.equal(writes.length,2);assert.equal(JSON.stringify(f.version),signedBefore);assert.equal(Object.keys(audits).length,1);
for(const implementation of [policy,frontPolicy])assert.equal(implementation.iowaLateReceiptsCover(f.offer,f.version.buyers,f.version.terms),true);
pkg.validateBeforeSigning({...f,signerRole:'seller'});
const adapter=load(path.join(project,'src/app/features/offers/states/iowa/display/iowa-offer-display.adapter.ts')).iowaOfferDisplayAdapter;assert.equal(adapter.display(f.version.terms,{offer:f.offer,version:f.version}).sellerSigningBlockReason,undefined);
const repeated=await recordReceipt(request());assert.equal(repeated.alreadyRecorded,true);assert.equal(writes.length,2);
// A private seller counter-draft must not prevent receipt for the already delivered version.
f.offer.currentVersionUid='private-counter';f.offer.lastDeliveredVersionUid='version';f.offer.status='draft';assert.equal((await recordReceipt(request())).alreadyRecorded,true);f.offer.currentVersionUid='version';f.offer.status='submitted';
// Current 481 IAC 2014.1 allows delivery to any one buyer; do not invent an all-buyer receipt gate.
f.version.buyers.push({...person('buyer2'),partyUid:'buyer2',userUid:'buyer2'});assert.equal(policy.iowaLateReceiptsCover(f.offer,f.version.buyers,f.version.terms),true);pkg.validateBeforeSigning({...f,signerRole:'seller'});
for(const field of ['offerUid','listingUid','partyUid','buyerUid','typedName','statement','radonFactSheetVersion']){const value=f.offer.stateDisclosureReceipts.buyer[field];f.offer.stateDisclosureReceipts.buyer[field]='wrong';assert.equal(policy.iowaLateReceiptsCover(f.offer,f.version.buyers,f.version.terms),false);f.offer.stateDisclosureReceipts.buyer[field]=value;}
// Seller counter carries separate receipt evidence while original pending answers remain intact.
f.version.status='draft';f.version.immutable=false;f.version.initiatedBy='seller';f.version.initiatedByUid='seller';pkg.validateSubmission(f);assert.equal(frontValidator.validate(f.version.terms,f.version.buyers,f.version.sellers,{mode:'counteroffer',offer:f.offer}).valid,true);assert.equal(f.version.terms.disclosures.propertyConditionStatus,'pending');
// Run the state-owned component's real input/computed/action code with isolated services.
reset();let inputNumber=0,reloaded=0,called=null,opened=0;
const signal=value=>{const result=()=>value;result.set=next=>value=next;return result;};
const offerInput=signal(f.offer),versionInput=signal(f.version),authToken={},disclosureToken={};
const input={required:()=>inputNumber++===0?offerInput:versionInput};
const auth={currentUserUid:'buyer'},disclosures={getCurrentDisclosure:async()=>document,openDisclosure:async()=>{opened++;}};
const componentModule={exports:{}};
vm.runInNewContext(compile(fs.readFileSync(path.join(project,'src/app/features/offers/states/iowa/disclosures/iowa-disclosure-receipt.component.ts'),'utf8')),{module:componentModule,exports:componentModule.exports,require:n=>{
 if(n==='@angular/core')return {Component:()=>value=>value,ChangeDetectionStrategy:{OnPush:0},input,signal,computed:fn=>fn,effect:fn=>fn(),inject:token=>token===authToken?auth:disclosures};
 if(n==='@angular/forms')return {FormsModule:{}};
 if(n==='firebase/functions')return {httpsCallable:(_functions,name)=>async data=>{called={name,data};return {data:{receiptUid:'receipt'}};}};
 if(n.endsWith('/firebase/firebase'))return {functions:{}};
 if(n.endsWith('/auth.service'))return {AuthService:authToken};
 if(n.endsWith('/listing-disclosure.service'))return {ListingDisclosureService:disclosureToken};
 if(n.endsWith('/iowa-disclosure-policy'))return frontPolicy;
 throw Error(n);
},window:{location:{reload:()=>reloaded++}},Date,Number});
const ui=new componentModule.exports.IowaDisclosureReceiptComponent();await new Promise(resolve=>setImmediate(resolve));
assert.equal(ui.needsReceipt(),true);assert.equal(ui.canRecord(),false);assert.equal(ui.loading(),false);
ui.typedName.set('Fictional buyer');ui.acknowledged.set(true);assert.equal(ui.canRecord(),false);
await ui.openCondition(document);assert.equal(opened,1);assert.equal(ui.canRecord(),false);
ui.radonOpened.set(true);assert.equal(ui.canRecord(),true);ui.typedName.set('Wrong name');assert.equal(ui.canRecord(),false);
ui.typedName.set('Fictional buyer');await ui.recordReceipt();assert.equal(called.name,'recordIowaDisclosureReceipt');assert.equal(called.data.conditionVersionId,'condition-v1');assert.equal(called.data.radonFactSheetVersion,policy.IOWA_RADON_VERSION);assert.equal(reloaded,1);
versionInput.set(fixture().version);assert.equal(ui.needsReceipt(),false);
// Execute the actual wizard notice expression: completed legacy receipts must not show a pending blocker.
const wizardSource=fs.readFileSync(path.join(project,'src/app/features/offers/states/iowa/offer-wizard/offer-wizard.component.ts'),'utf8'),tree=ts.createSourceFile('wizard.ts',wizardSource,ts.ScriptTarget.Latest,true);let noticeBody;
function findNotice(node){if(ts.isPropertyDeclaration(node)&&node.name.getText(tree)==='pendingDisclosureNotice')noticeBody=node.initializer.arguments[0].body.getText(tree);ts.forEachChild(node,findNotice);}findNotice(tree);assert(noticeBody);
const notice=new Function('iowaLateReceiptsCover','return function()'+noticeBody)(policy.iowaLateReceiptsCover);
const saved=legacy(fixture()),noticeContext={terms:()=>saved.version.terms,initiatedBy:()=> 'seller',offerContext:()=>saved.offer,buyers:()=>saved.version.buyers};
assert.match(notice.call(noticeContext),/actual later delivery/);
saved.offer.stateDisclosureReceipts={buyer:receipt(saved)};assert.equal(notice.call(noticeContext),null);
saved.version.terms.disclosures.leadPaintStatus='pending';assert.match(notice.call(noticeContext),/federal lead/);
saved.version.terms.disclosures.leadPaintStatus='built_1978_or_later';delete saved.offer.stateDisclosureReceipts;Object.assign(saved.version.terms.disclosures,{propertyConditionStatus:'received',statutoryPacketStatus:'received'});assert.equal(notice.call(noticeContext),null);
const out=path.join(project,'tmp/navstreet-iowa-preoffer-pdfs');fs.mkdirSync(out,{recursive:true});
const {PDFDocument}=require(require.resolve('pdf-lib',{paths:[path.join(project,'functions')]}));
reset();await recordReceipt(request());for(const uid of ['buyer','seller']){const pdf=await getReceiptPdf({auth:{uid},data:{offerUid:'offer',receiptUid:'receipt'}});const bytes=Buffer.from(pdf.base64,'base64');assert((await PDFDocument.load(bytes)).getPageCount()>=1);fs.writeFileSync(path.join(out,'iowa-later-delivery-receipt.pdf'),bytes);}
await assert.rejects(getReceiptPdf({auth:{uid:'stranger'},data:{offerUid:'offer',receiptUid:'receipt'}}));
const asset=fs.readFileSync(path.join(project,'functions/assets/state-contracts/iowa/iowa-radon-853ed0fe04cd.pdf'));assert.equal(crypto.createHash('sha256').update(asset).digest('hex'),policy.IOWA_RADON_SHA256);assert(asset.equals(fs.readFileSync(path.join(project,'src/assets/state-contracts/iowa/iowa-radon-853ed0fe04cd.pdf'))));assert.equal((await PDFDocument.load(asset)).getPageCount(),2);
for(const [name,terms] of [['new-offer',fresh.version.terms],['supported-exception',except.version.terms],['legacy-pending',old.version.terms]]){const input={...fresh,version:{...fresh.version,terms},documentTitle:'NavStreet Iowa Residential Purchase and Sale Agreement',documentStatus:'approved',generatedAt:new Date('2026-10-22T10:00:00Z')};const before=JSON.stringify(input),pdf=await pkg.generateAgreement(input);assert.equal(JSON.stringify(input),before);assert.equal((await PDFDocument.load(pdf.buffer)).getPageCount(),pdf.pageCount);fs.writeFileSync(path.join(out,'iowa-'+name+'.pdf'),pdf.buffer);}
console.log('PASS: Iowa pre-offer condition/exception delivery, actual version-pinned receipt, automatic official radon fact sheet, buyer/seller signing, protected counteroffers, old unsigned-draft upgrade, authenticated immutable later receipts, one-buyer delivery in a multi-buyer offer, idempotency, stale-document/closed-offer protection, receipt PDF and agreement PDF appendix.');
})().catch(error=>{console.error(error);process.exitCode=1;});
