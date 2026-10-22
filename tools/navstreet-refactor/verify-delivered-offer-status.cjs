const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const project=path.resolve(process.argv[2]||'.');
const ts=require(require.resolve('typescript',{paths:[project,path.join(project,'functions')]}));
const compile=source=>ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,experimentalDecorators:true}}).outputText;
class Stamp{constructor(ms=1){this.ms=ms;}toMillis(){return this.ms;}toDate(){return new Date(this.ms);}static now(){return new Stamp(10);}}
class HttpsError extends Error{constructor(code,message){super(message);this.code=code;}}
let offer,version,listing,writes,repairCalls,serverReads,missingVersion,missingListing,missingOffer,afterRepair;
const ref=parts=>({id:parts.at(-1),parts,collection:name=>({doc:id=>ref([...parts,name,id])})});
const db={collection:name=>({doc:id=>ref([name,id])}),runTransaction:async cb=>cb({
 get:async reference=>{const type=reference.parts[0]==='listings'?'listing':reference.parts.length===4?'version':'offer';const value={offer,version,listing}[type];return {exists:!({offer:missingOffer,version:missingVersion,listing:missingListing}[type]),data:()=>value};},
 update:(reference,update)=>{assert.equal(reference.parts.join('/'),'offers/offer');writes.push(update);offer={...offer,...update};},
})};
const moduleValue={exports:{}};
vm.runInNewContext(compile(fs.readFileSync(path.join(project,'functions/src/offers/reconcile-offer-status.ts'),'utf8')),{module:moduleValue,exports:moduleValue.exports,require:name=>{
 if(name==='firebase-admin/firestore')return {Timestamp:Stamp,FieldValue:{arrayUnion:x=>({arrayUnion:x})}};
 if(name==='firebase-functions/v2/https')return {HttpsError,onCall:(_options,handler)=>handler};
 if(name.endsWith('shared/firebase-admin'))return {adminFirestore:db};
 if(name.endsWith('shared/function-options'))return {callableFunctionOptions:{region:'us-east1'}};
 throw Error(name);
},Number,Set,Date});
const handler=moduleValue.exports.reconcileOfferStatus;
const person=(role,signed)=>({partyUid:role,userUid:role,role,legalName:'Fictional '+role,requiredSigner:true,signature:signed?{status:'signed',signedAt:new Stamp(2)}:{status:'not_started'}});
function reset(){offer={Uid:'offer',stateCode:'WA',status:'draft',currentVersionUid:'version',listingUid:'listing',buyerUids:['buyer'],sellerUids:['seller'],property:{addressLine1:'100 Fictional St',city:'Bellevue',state:'WA',zipCode:'98004'},pendingOfferCounted:true,submittedAt:new Stamp(1)};version={Uid:'version',offerUid:'offer',stateCode:'WA',status:'delivered',immutable:true,versionNumber:1,initiatedBy:'buyer',deliveredAt:new Stamp(3),buyers:[person('buyer',true)],sellers:[person('seller',false)],terms:{purchase:{purchasePriceInCents:100}}};listing={status:'active'};writes=[];repairCalls=0;serverReads=0;missingVersion=missingListing=missingOffer=false;afterRepair=null;}
const request=(uid='buyer',offerUid='offer')=>({auth:{uid},data:{offerUid}});
const normal=x=>JSON.parse(JSON.stringify(x));
// Run the actual frontend repository with Firebase calls replaced, not a duplicate implementation.
const repoModule={exports:{}};
const firestoreApi={Timestamp:Stamp,doc:(_db,...parts)=>ref(parts),collection:(_db,...parts)=>ref(parts),query:(reference,..._constraints)=>reference,where:()=>({}),orderBy:()=>({}),limit:()=>({}),
 getDoc:async reference=>({exists:()=>true,id:reference.id,data:()=>reference.parts.length===4?version:offer}),
 getDocFromServer:async reference=>{serverReads++;return {exists:()=>true,id:reference.id,data:()=>offer};},
 getDocs:async()=>({docs:[{id:'offer',data:()=>offer}]}),
};
vm.runInNewContext(compile(fs.readFileSync(path.join(project,'src/app/core/domains/offers/repositories/firestore-offer.repository.ts'),'utf8')),{module:repoModule,exports:repoModule.exports,require:name=>{
 if(name==='@angular/core')return {Injectable:()=>value=>value};
 if(name==='firebase/firestore')return firestoreApi;
 if(name==='firebase/functions')return {httpsCallable:(_functions,name)=>async data=>{if(name!=='reconcileOfferStatus')throw Error(name);repairCalls++;const result=await handler(request('buyer',data.offerUid));if(afterRepair)afterRepair();return {data:result};}};
 if(name.endsWith('infrastructure/firebase/firebase'))return {auth:{currentUser:{uid:'buyer'}},firestore:{},functions:{}};
 if(name==='./offer.repository')return {OfferRepository:class{}};
 throw Error(name);
},Date,Map,Set,Number,Object,Array,Promise,Error});
const repo=new repoModule.exports.FirestoreOfferRepository();
(async()=>{
 reset();await assert.rejects(handler({data:{offerUid:'offer'}}),e=>e.code==='unauthenticated');assert.equal(writes.length,0);
 reset();await assert.rejects(handler(request('stranger')),e=>e.code==='permission-denied');assert.equal(writes.length,0);
 for(const id of ['','../offer','offer/path',42]){reset();await assert.rejects(handler(request('buyer',id)),e=>e.code==='invalid-argument');assert.equal(writes.length,0);}
 for(const uid of ['buyer','seller']){reset();const saved=JSON.stringify(version),before=normal(offer),result=await handler(request(uid));assert.equal(result.repaired,true);assert.equal(offer.status,'submitted');assert.equal(offer.lastDeliveredVersionUid,'version');assert.equal(JSON.stringify(version),saved);assert.equal(offer.pendingOfferCounted,before.pendingOfferCounted);assert.equal(offer.submittedAt.ms,1);assert.deepEqual(Object.keys(writes[0]).sort(),['lastDeliveredVersionUid','status','statusHistory','submittedAt','updatedAt']);assert.equal((await handler(request(uid))).repaired,false);assert.equal(writes.length,1);}
 for(const state of ['NC','TX','MO']){reset();offer.stateCode=version.stateCode=state;await handler(request());assert.equal(offer.status,'submitted');}
 reset();offer.buyerUids='stranger';await assert.rejects(handler(request('stranger')),e=>e.code==='permission-denied');assert.equal(writes.length,0);
 reset();version.versionNumber=2;version.initiatedBy='seller';version.sellers=[person('seller',true)];version.buyers=[person('buyer',false)];await handler(request());assert.equal(offer.status,'countered');
 for(const mutate of [()=>offer.status='submitted',()=>offer.status='withdrawn',()=>offer.status='declined',()=>offer.status='expired',()=>offer.status='converted_to_contract',()=>offer.status='closed_due_to_contract',()=>offer.contract={contractUid:'contract'},()=>offer.draftCleanupPending=true,()=>offer.currentVersionUid='bad/path',()=>version.offerUid='other',()=>version.stateCode='NC',()=>version.status='draft',()=>version.status='awaiting_signatures',()=>version.status='partially_signed',()=>version.status='signed',()=>version.status='accepted',()=>version.status='superseded',()=>version.immutable=false,()=>version.deliveredAt=null,()=>version.deliveredAt='fake',()=>version.versionNumber=0,()=>version.versionNumber=1.5,()=>version.initiatedBy='other',()=>version.initiatedBy='seller',()=>version.buyers={},()=>version.buyers=[],()=>version.buyers[0].signature.status='pending',()=>version.buyers[0].signature.signedAt=null,()=>version.buyers.push(person('cobuyer',false)),()=>listing.status='sold',()=>listing.status='under_contract',()=>listing.activeContractUid='another',()=>missingVersion=true,()=>missingListing=true]){
  reset();mutate();const saved=JSON.stringify({offer,version,listing});assert.equal((await handler(request())).repaired,false);assert.equal(writes.length,0);assert.equal(JSON.stringify({offer,version,listing}),saved);
 }
 reset();missingOffer=true;await assert.rejects(handler(request()),e=>e.code==='not-found');assert.equal(writes.length,0);
 reset();const details=await repo.getOfferByUid('offer');assert.equal(details.status,'submitted');assert.equal(repairCalls,1);assert.equal(serverReads,1);
 reset();const summaries=await repo.getOffersForUser('buyer',{role:'buyer',statuses:['submitted']});assert.equal(summaries.length,1);assert.equal(summaries[0].status,'submitted');assert.equal(summaries[0].currentVersionStatus,'delivered');assert.equal(repairCalls,1);assert.equal(serverReads,1);
 reset();const listingSummaries=await repo.getOffersForListing('listing');assert.equal(listingSummaries[0].status,'submitted');
 reset();afterRepair=()=>{offer.status='withdrawn';};assert.equal((await repo.getOfferByUid('offer')).status,'withdrawn','Use server result after a concurrent withdrawal');
 reset();const prior=version;afterRepair=()=>{offer.currentVersionUid='private';};const read=firestoreApi.getDoc;firestoreApi.getDoc=async reference=>({exists:()=>true,id:reference.id,data:()=>reference.id==='private'?{...prior,Uid:'private',versionNumber:2,initiatedBy:'seller',status:'draft',immutable:false}:prior});const concurrent=await repo.getOffersForUser('buyer',{role:'buyer'});assert.equal(concurrent[0].currentVersionUid,'version');assert.equal(concurrent[0].status,'submitted');assert.equal(repairCalls,1);firestoreApi.getDoc=read;
 reset();offer.status='submitted';await repo.getOfferByUid('offer');assert.equal(repairCalls,0);assert.equal(serverReads,0,'Healthy offers have no extra server refresh');
 reset();offer.status='submitted';const freshRead=firestoreApi.getDoc;firestoreApi.getDoc=async reference=>({exists:()=>true,id:reference.id,data:()=>reference.parts.length===4?version:{...offer,status:'draft'}});assert.equal((await repo.getOfferByUid('offer')).status,'submitted');assert.equal(writes.length,0,'A stale browser parent snapshot must not cause a redundant write');assert.equal(serverReads,1);firestoreApi.getDoc=freshRead;
 reset();version.status='draft';version.immutable=false;await repo.getOfferByUid('offer');assert.equal(repairCalls,0);
 reset();version.versionNumber=2;version.initiatedBy='seller';version.status='draft';version.immutable=false;offer.lastDeliveredVersionUid='old-version';const latest=version;firestoreApi.getDoc=async reference=>({exists:()=>true,id:reference.id,data:()=>reference.id==='old-version'?{...latest,Uid:'old-version',versionNumber:1,status:'delivered',immutable:true}:latest});const received=await repo.getOffersForUser('buyer',{role:'buyer'});assert.equal(received.length,1);assert.equal(received[0].currentVersionUid,'old-version');assert.equal(repairCalls,0,'Do not expose or promote a private counteroffer through an older delivered version');
 console.log('PASS: actual reconciliation callable and frontend repository; authenticated participants, verified immutable delivery/signatures, initial/counter status, idempotency, terminal/contract/private-version protection, unchanged signed data/counts, server-confirmed detail/dashboard status and filtering.');
})().catch(error=>{console.error(error);process.exitCode=1;});
