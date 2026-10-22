const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {createRequire}=require('node:module');
const project=path.resolve(process.argv[2]||'.');
const req=createRequire(path.join(project,'functions/lib/offers/sign-offer.js'));
const {Timestamp}=req('firebase-admin/firestore');
const ts=req('typescript');
const pkg=req('./state-contracts/montana/montana-state-contract.package.js').montanaStateContractPackage;
const source=fs.readFileSync(path.join(project,'tools/navstreet-refactor/verify-montana-condominium.cjs'),'utf8').split('(async()=>{')[0];
const fixtureModule={exports:{}};
vm.runInNewContext(source+'\nmodule.exports={fixture,load};',{require,process:{argv:['node','test',project]},module:fixtureModule,Date,Intl,Set,Object,Number,Map,Array,structuredClone,Buffer});
const realNow=Date.now;let clock=Date.parse('2026-10-22T18:00:00Z');Date.now=()=>clock;
const originalTimestampNow=Timestamp.now;Timestamp.now=()=>Timestamp.fromMillis(clock);
let db=new Map(),counter=0,reads=0,writes=0;
const clone=x=>{if(x instanceof Timestamp)return x;if(Array.isArray(x))return x.map(clone);if(x&&typeof x==='object')return Object.fromEntries(Object.entries(x).map(([k,v])=>[k,clone(v)]));return x;};
const lookup=(obj,key)=>key.split('.').reduce((v,k)=>v?.[k],obj);
const fv={arrayUnion:(...values)=>({operation:'union',values}),serverTimestamp:()=>Timestamp.now(),delete:()=>({operation:'delete'})};
function apply(obj,changes){for(const [key,value]of Object.entries(changes)){const keys=key.split('.');let target=obj;for(const k of keys.slice(0,-1))target=target[k]??={};const k=keys.at(-1);if(value?.operation==='delete')delete target[k];else if(value?.operation==='union')target[k]=[...(target[k]??[]),...clone(value.values)];else target[k]=clone(value);}return obj;}
function ref(p){return {path:p,id:p.split('/').at(-1),collection:n=>collection(p+'/'+n)}}
function snap(p){const data=db.get(p);return {exists:!!data,id:p.split('/').at(-1),ref:ref(p),data:()=>clone(data),get:k=>lookup(clone(data),k)}}
function collection(p,filters=[]){return {path:p,filters,doc:(id='generated-'+(++counter))=>ref(p+'/'+id),where:(field,op,value)=>collection(p,[...filters,{field,op,value}]),get:async()=>query(p,filters)}}
function query(p,filters){return {docs:[...db.keys()].filter(k=>k.startsWith(p+'/')&&k.split('/').length===p.split('/').length+1).map(snap).filter(doc=>filters.every(f=>f.op==='=='?doc.get(f.field)===f.value:doc.get(f.field)<=f.value))};}
const store={collection,runTransaction:async fn=>{let writing=false;const operations=[];const result=await fn({get:async r=>{assert(!writing,'Firestore reads must precede writes');reads++;return r.filters?query(r.path,r.filters):snap(r.path)},create:(r,data)=>{writing=true;assert(!db.has(r.path),'duplicate create');operations.push(()=>db.set(r.path,clone(data)));writes++},set:(r,data,options)=>{writing=true;operations.push(()=>db.set(r.path,apply(options?.merge?clone(db.get(r.path)??{}):{},data)));writes++},update:(r,data)=>{writing=true;assert(db.has(r.path),'missing update '+r.path);operations.push(()=>db.set(r.path,apply(clone(db.get(r.path)),data)));writes++}});for(const commit of operations)commit();return result;}};
const notifications=[];
function load(file,extra={}){const module={exports:{}};const localReq=createRequire(file);vm.runInNewContext(fs.readFileSync(file,'utf8'),{module,exports:module.exports,require:n=>{
 if(n==='firebase-admin/firestore')return {...req(n),FieldValue:fv};
 if(n==='firebase-functions/v2/https')return {...req(n),onCall:(_options,handler)=>handler};
 if(n==='firebase-functions/v2/scheduler')return {onSchedule:(_options,handler)=>handler};
 if(n==='firebase-functions/logger')return {info(){},error(){}};
 if(n.endsWith('/shared/firebase-admin'))return {adminFirestore:store};
 if(n==='./offer-notification.service')return {addOfferNotificationToTransaction:(_t,_f,input)=>notifications.push(input)};
 if(extra[n])return extra[n];return localReq(n);
 },Date,console,Buffer,Set,Map,Object,Array,Number,Promise,Error});return module.exports;}
const sign=load(path.join(project,'functions/lib/offers/sign-offer.js'));
const withdraw=load(path.join(project,'functions/lib/offers/withdraw-offer.js'));
const activate=load(path.join(project,'functions/lib/offers/activate-reviewed-agreements.js'),{'./sign-offer':sign});
function setup({initiatedBy='buyer',legacy=false,receivedAgo=0,expiryHours=48}={}){
 db=new Map();notifications.length=0;clock=Date.parse('2026-10-22T18:00:00Z');
 const f=fixtureModule.exports.fixture();const t=f.version.terms;
 if(!legacy)t.condominiumAcceptancePolicy='accept_during_review_v2';
 t.condominiumReceiptAt=new Date(clock-receivedAgo*3600000).toISOString();t.delivery.expiresAt=new Date(clock+expiryHours*3600000).toISOString();
 const offer={...f.offer,primaryBuyerUid:'buyer',primarySellerUid:'seller',buyerUids:['buyer'],sellerUids:['seller'],status:initiatedBy==='buyer'?'submitted':'countered',pendingOfferCounted:true,lastDeliveredVersionUid:'version',currentVersionNumber:1,statusHistory:[],property:t.property};
 const version={...f.version,initiatedBy,documents:[],status:'delivered',immutable:true,deliveredAt:Timestamp.now(),expiresAt:Timestamp.fromDate(new Date(t.delivery.expiresAt)),statusHistory:[]};
 for(const p of [...version.buyers,...version.sellers]){p.firstName='Fictional';p.lastName=p.role;p.identityVerification={status:'verified',legalNameApplied:true,verifiedFirstName:'Fictional',verifiedLastName:p.role,providerVerificationUid:'verification-'+p.role,provider:'stripe',verifiedAt:Timestamp.now()};p.signature={status:p.role===initiatedBy?'signed':'pending',...(p.role===initiatedBy?{signedAt:Timestamp.now()}:{})};}
 const document={Uid:'agreement',offerUid:'offer',offerVersionUid:'version',type:'offer_agreement',hash:{algorithm:'SHA-256',value:'a'.repeat(64)},signatureRequest:{status:'awaiting_signatures',signers:[...version.buyers,...version.sellers].map(p=>({partyUid:p.partyUid,userUid:p.userUid,role:p.role,required:true,status:p.signature.status}))}};
 db.set('offers/offer',offer);db.set('offers/offer/versions/version',version);db.set('offers/offer/documents/agreement',document);db.set('listings/sample',{...f.listing,status:'active',acceptingOffers:true,pendingOfferCount:1});
 return {offer,version,t};
}
const signRequest=uid=>({auth:{uid},data:{offerUid:'offer',offerVersionUid:'version',documentUid:'agreement',typedSignature:'Fictional '+uid,consentToElectronicRecords:true,consentToElectronicSignature:true,certificationAccepted:true},rawRequest:{ip:'127.0.0.1',get:()=> 'NavStreet regression test'}});
const withdrawRequest=uid=>({auth:{uid},data:{offerUid:'offer',offerVersionUid:'version'}});
const output=path.join(project,'tmp/navstreet-montana-review');fs.mkdirSync(output,{recursive:true});
(async()=>{
 for(const initiatedBy of ['buyer','seller']){
  const f=setup({initiatedBy});const receiver=initiatedBy==='buyer'?'seller':'buyer';
  const oldReceipt=f.t.condominiumReceiptAt,pins=clone(f.t.documentVersions);
  clock+=24*3600000;
  const result=await sign.signOffer(signRequest(receiver));assert(result.fullyExecuted&&result.pendingReview);
  assert.equal(db.get('offers/offer').status,'accepted_pending_review');assert.equal(db.get('contracts/offer').status,'pending_review');
  assert.equal(db.get('listings/sample').status,'active');assert.equal(db.get('listings/sample').acceptingOffers,true);
  assert.equal(db.get('offers/offer/versions/version').terms.condominiumReceiptAt,oldReceipt);assert.deepEqual(db.get('offers/offer/versions/version').terms.documentVersions,pins);
  assert.equal(db.get('contracts/offer').effectiveAt,undefined);
  assert((await sign.signOffer(signRequest(receiver))).alreadySigned);
  await assert.rejects(()=>withdraw.withdrawOffer(withdrawRequest('seller')),/Only the buyer/);
  clock+=25*3600000;assert.equal(await activate.activateReviewedAgreement('offer'),false); // Offer expired, timely acceptance remains.
  clock=Date.parse(oldReceipt)+72*3600000-1;assert.equal(await activate.activateReviewedAgreement('offer'),false);
  clock++;await assert.rejects(()=>withdraw.withdrawOffer(withdrawRequest('buyer')),/before it ends/);
  assert.equal(await activate.activateReviewedAgreement('offer'),true);assert.equal(await activate.activateReviewedAgreement('offer'),false);
  assert.equal(db.get('offers/offer').status,'converted_to_contract');assert.equal(db.get('listings/sample').status,'under_contract');assert.equal(db.get('listings/sample').pendingAgreementOfferUid,undefined);
  assert.equal(db.get('contracts/offer').effectiveAt.toMillis(),clock);
  assert.equal(db.get('offers/offer').contract.effectiveAt.toMillis(),clock);assert.equal(notifications.filter(n=>n.eventKey==='fully-executed').length,2);
 }
 for(const initiatedBy of ['buyer','seller']){
  setup({initiatedBy});clock+=3600000;await sign.signOffer(signRequest(initiatedBy==='buyer'?'seller':'buyer'));
  assert.equal((await withdraw.withdrawOffer(withdrawRequest('buyer'))).status,'withdrawn');
  assert.equal(db.get('contracts/offer').status,'terminated');assert.equal(db.get('offers/offer').contract.status,'terminated');assert.equal(db.get('listings/sample').status,'active');assert.equal(db.get('listings/sample').pendingAgreementOfferUid,undefined);assert.equal(db.get('listings/sample').pendingOfferCount,0);
  assert.equal(db.get('offers/offer/versions/version').immutable,true);assert(db.get('offers/offer/documents/agreement/signatures/'+(initiatedBy==='buyer'?'seller':'buyer')));
  assert((await withdraw.withdrawOffer(withdrawRequest('buyer'))).alreadyWithdrawn);clock+=100*3600000;assert.equal(await activate.activateReviewedAgreement('offer'),false);
 }
 setup({initiatedBy:'seller'});assert.equal((await withdraw.withdrawOffer(withdrawRequest('buyer'))).status,'withdrawn'); // buyer need not initiate counter
 setup();clock+=49*3600000;await assert.rejects(()=>sign.signOffer(signRequest('seller')),/expired/);assert.equal(db.get('offers/offer').status,'submitted');assert(!db.has('contracts/offer'));
 setup({legacy:true});await assert.rejects(()=>sign.signOffer(signRequest('seller')),/72-hour/);
 setup({receivedAgo:73});assert.equal((await sign.signOffer(signRequest('seller'))).pendingReview,false);assert.equal(db.get('contracts/offer').status,'effective');
 setup();db.get('listings/sample').pendingAgreementOfferUid='another-offer';await assert.rejects(()=>sign.signOffer(signRequest('seller')),/Another accepted agreement/);
 setup();await assert.rejects(()=>sign.signOffer(signRequest('intruder')),/not a required signer/);await assert.rejects(()=>withdraw.withdrawOffer(withdrawRequest('intruder')),/Only the party/);
 // New policy is trusted: clients cannot insert it into legacy drafts or remove it from new ones.
 const f=setup();const hostile=clone(f.t);delete hostile.condominiumAcceptancePolicy;
 assert.equal(pkg.sanitizeDraftTerms({requestedTerms:hostile,currentTerms:f.t,initiatedBy:'buyer'}).condominiumAcceptancePolicy,'accept_during_review_v2');
 const legacy=clone(f.t);delete legacy.condominiumAcceptancePolicy;assert.equal(pkg.sanitizeDraftTerms({requestedTerms:f.t,currentTerms:legacy,initiatedBy:'buyer'}).condominiumAcceptancePolicy,undefined);
 assert.equal(pkg.getAgreementTemplate(f.t).templateVersion,'2026-10-22.2');assert.equal(pkg.getAgreementTemplate(legacy).templateVersion,'2026-10-22');
 assert.equal(pkg.createInitialOfferTerms({contractType:f.t.contractType,property:f.t.property,listingData:db.get('listings/sample'),buyer:f.version.buyers[0],seller:f.version.sellers[0]}).delivery.expiresAt,new Date(clock+48*3600000).toISOString());
 // Actual shared access method consumes a state-owned display deadline without Montana field paths.
 const serviceSource=fs.readFileSync(path.join(project,'src/app/core/domains/offers/services/offer.service.ts'),'utf8');
 const method=serviceSource.slice(serviceSource.indexOf('  getParticipantAccess('),serviceSource.indexOf('  private clearExpiredDraftExpiration'));
 const serviceModule={exports:{}};vm.runInNewContext(ts.transpileModule('class Service {'+method+'};module.exports=Service;',{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,{module:serviceModule,Date});
 const accessService=new serviceModule.exports();accessService.currentUserUid='buyer';
 const frontendDisplay=fixtureModule.exports.load(path.join(project,'src/app/features/offers/states/montana/display/montana-offer-display.adapter.ts')).montanaOfferDisplayAdapter;
 const front=setup({initiatedBy:'seller'});const display=frontendDisplay.display(front.t,{version:front.version});
 assert.equal(display.buyerSigningBlockReason,undefined);assert.equal(display.sellerSigningBlockReason,undefined);
 assert(accessService.getParticipantAccess(front.offer,front.version,display.buyerWithdrawalEndsAt).canWithdraw);
 front.offer.status='accepted_pending_review';front.version.status='accepted';
 assert(accessService.getParticipantAccess(front.offer,front.version,display.buyerWithdrawalEndsAt).canWithdraw);
 assert.equal(accessService.getParticipantAccess(front.offer,front.version,display.buyerWithdrawalEndsAt).canAccept,false);
 accessService.currentUserUid='seller';assert.equal(accessService.getParticipantAccess(front.offer,front.version,display.buyerWithdrawalEndsAt).canWithdraw,false);
 accessService.currentUserUid='buyer';clock=Date.parse(display.buyerWithdrawalEndsAt);assert.equal(accessService.getParticipantAccess(front.offer,front.version,display.buyerWithdrawalEndsAt).canWithdraw,false);
 // A second pending acceptance is rejected even if a client tampers with the listing reservation field.
 setup();db.set('offers/other',{...db.get('offers/offer'),Uid:'other',status:'accepted_pending_review'});
 await assert.rejects(()=>sign.signOffer(signRequest('seller')),/Another accepted agreement/);
 // Activating closes competing negotiations only after the review deadline.
 setup();await sign.signOffer(signRequest('seller'));
 db.set('offers/other',{...db.get('offers/offer'),Uid:'other',status:'submitted',currentVersionUid:'other-version'});
 db.set('offers/other/versions/other-version',{...db.get('offers/offer/versions/version'),Uid:'other-version',status:'delivered'});
 clock+=73*3600000;assert.equal(await activate.activateReviewedAgreement('offer'),true);assert.equal(db.get('offers/other').status,'closed_due_to_contract');
 // State-owned PDF variants exercise pending, accepted, financed, long text and pre-1978 content.
 for(const name of ['pending','accepted','counter','financed','overflow','pre1978']){
  const f=setup({initiatedBy:name==='counter'?'seller':'buyer'});
  if(name==='accepted'||name==='counter'){for(const p of [...f.version.buyers,...f.version.sellers])p.signature={status:'signed',signedAt:Timestamp.fromMillis(clock+3600000)};f.version.status='accepted';}
  if(name==='financed'){Object.assign(f.t.purchase,{financingType:'conventional',loanAmountInCents:25000000});Object.assign(f.t.conditions,{financing:true,appraisal:true});}
  if(name==='overflow')f.t.additionalTerms='Long negotiated provision remains subject to statutory review and withdrawal rights. '.repeat(150);
  if(name==='pre1978'){f.t.property.yearBuilt=1977;Object.assign(f.t.disclosures,{leadPaintStatus:'received',leadInspectionSelection:'ten_days'});f.t.documentVersions['lead-based-paint']='lead-v1';}
  const result=await pkg.generateAgreement({...f,documentTitle:pkg.getAgreementTemplate(f.t).templateName,generatedAt:new Date('2026-10-22T18:00:00Z'),documentStatus:name==='accepted'||name==='counter'?'approved':'prototype'});
  fs.writeFileSync(path.join(output,name+'.pdf'),result.buffer);
 }
 // Exact signed legacy PDF bytes must remain stable.
 console.log('PASS: Montana 48-hour acceptance, deferred effectiveness, exact 72-hour cutoff, buyer/seller counters, immutable pins, protected withdrawal, expiry, retries, authorization, reservation, trusted revision, six PDFs; '+reads+' transaction reads / '+writes+' writes.');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>{Date.now=realNow;Timestamp.now=originalTimestampNow});
