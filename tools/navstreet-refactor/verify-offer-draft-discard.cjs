const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const project=path.resolve(process.argv[2]||'.'),base=path.join(project,'functions/src/offers');
const ts=require(require.resolve('typescript',{paths:[project,path.join(project,'functions')]}));
const compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const stamp=ms=>({toMillis:()=>ms}),now=20*86400000;
let records,writes,storeOps,storageFailure=false;
const offer={Uid:'offer',listingUid:'listing',stateCode:'NC',primaryBuyerUid:'buyer',buyerUids:['buyer'],status:'draft',currentVersionUid:'v1',initialVersionUid:'v1',currentVersionNumber:1,totalVersions:1,versionUids:['v1'],draftLastActivityAt:stamp(now-8*86400000),updatedAt:stamp(now),createdAt:stamp(0)};
const version={Uid:'v1',offerUid:'offer',versionNumber:1,status:'draft',immutable:false,buyers:[{signature:{status:'not_invited'}}],sellers:[{signature:{status:'not_invited'}}],createdAt:stamp(0),updatedAt:stamp(0)};
const ref=(kind,id)=>({kind,id,collection:name=>({kind:name,id,limit:()=>({kind:name,id})}),get:async()=>snapshot(records.offer,ref('offers','offer')),listCollections:async()=>[ref('versions','versions'),ref('documents','documents')],delete:async()=>{storeOps.push('parent');records.offer=null;}});
const snapshot=(data,r)=>({exists:!!data,id:r.id,ref:r,data:()=>data,get:key=>data?.[key]});
const firestore={collection:name=>({doc:id=>ref(name,id)}),runTransaction:async callback=>callback({get:async r=>{
 if(r.kind==='offers')return snapshot(records.offer,r);
 if(r.kind==='listings')return snapshot({pendingOfferCount:records.pending},r);
 const values=r.kind==='versions'?records.versions:r.kind==='documents'?records.documents:records.signatures;
 return {docs:values.map((data,i)=>snapshot(data,ref(r.kind,r.kind==='versions'?data.Uid:String(i)))),empty:values.length===0};
},update:(r,data)=>{writes.push({kind:r.kind,data});if(r.kind==='offers')Object.assign(records.offer,data);if(r.kind==='versions')Object.assign(records.versions[0],data);if(r.kind==='listings')records.pending=data.pendingOfferCount;}}),recursiveDelete:async r=>storeOps.push(r.kind)};
const cache=new Map();function load(file){if(cache.has(file))return cache.get(file);const module={exports:{}};vm.runInNewContext(compile(fs.readFileSync(file,'utf8')),{module,exports:module.exports,require:n=>{
 if(n==='firebase-admin/firestore')return {FieldValue:{serverTimestamp:()=>stamp(now)},Timestamp:{now:()=>stamp(now)}};
 if(n==='firebase-admin/storage')return {getStorage:()=>({bucket:()=>({deleteFiles:async options=>{assert.equal(options.prefix,'offers/offer/');if(storageFailure)throw Error('storage failed');storeOps.push('storage');}})})};
 if(n==='firebase-functions/v2/scheduler')return {onSchedule:(_options,fn)=>fn};
 if(n==='firebase-functions/logger')return {info:()=>{},error:()=>{}};
 if(n==='firebase-functions/v2/https')return {HttpsError:class extends Error{constructor(code,msg){super(msg);this.code=code;}},onCall:(_options,fn)=>fn};
 if(n.endsWith('shared/firebase-admin'))return {adminFirestore:firestore};if(n.endsWith('shared/function-options'))return {callableFunctionOptions:{}};
 return load(path.resolve(path.dirname(file),n+'.ts'));
},Date,Set});cache.set(file,module.exports);return module.exports;}
const policy=load(path.join(base,'unsigned-draft-policy.ts')),handlers=load(path.join(base,'discard-offer-draft.ts'));
function reset(status='draft'){records={offer:{...offer,status,draftLastActivityAt:stamp(now-8*86400000)},versions:[{...version,buyers:[{signature:{status:'not_invited'}}],sellers:[{signature:{status:'not_invited'}}]}],documents:[],signatures:[],pending:2};writes=[];storeOps=[];storageFailure=false;}
(async()=>{
 let comparisons=0;
 for(const state of ['NC','TX','OK','UT','WI','FL','LA','CO','CA','SC','MI','MN','AZ','ID','OR','MO','NE','NH','AL','IN','KS','OH','DE','WA','IA','MT','MD','NM','SD','WY'])for(const status of ['draft','submitted','expired']){
  reset(status);records.offer.stateCode=state;records.versions[0].status=status==='submitted'?'awaiting_signatures':status;records.offer.pendingOfferCounted=status==='submitted';
  assert(await handlers.claimUnsignedDraftDeletion(ref('offers','offer'),'buyer'));assert.equal(records.offer.draftCleanupPending,true);assert.equal(records.versions[0].status,'withdrawn');assert.equal(records.versions[0].immutable,false);assert.equal(records.pending,status==='submitted'?1:2);
  await handlers.purgeClaimedUnsignedDraft(ref('offers','offer'));assert.equal(records.offer,null);assert.deepEqual(storeOps,['storage','versions','documents','parent']);comparisons++;
 }
 reset();await assert.rejects(handlers.claimUnsignedDraftDeletion(ref('offers','offer'),'seller'),/Only a buyer/);assert.equal(writes.length,0);
 for(const change of [r=>r.offer.lastDeliveredVersionUid='v1',r=>r.offer.contract={contractUid:'c'},r=>r.offer.firstViewedAt=stamp(1),r=>r.offer.initialVersionUid='other',r=>r.documents=[{deliveries:[{}]}],r=>r.documents=[{signatureRequest:{status:'completed'}}],r=>r.offer.currentVersionNumber=2,r=>r.offer.totalVersions=2,r=>r.offer.versionUids.push('v2'),r=>r.versions.push({...version,Uid:'v2'}),r=>r.versions[0].status='partially_signed',r=>r.versions[0].buyers[0].signature={status:'signed'},r=>r.versions[0].sellers[0].signature={status:'invited',signedAt:stamp(1)},r=>r.documents=[{signatureRequest:{signers:[{status:'signed'}]}}],r=>{r.documents=[{}];r.signatures=[{signatureUid:'s'}];}]){
  reset();records.offer.versionUids=['v1'];change(records);await assert.rejects(handlers.claimUnsignedDraftDeletion(ref('offers','offer'),'buyer'));assert.equal(writes.length,0);
 }
 for(const delta of [-1,0,1]){reset();records.offer.draftLastActivityAt=stamp(now-policy.DRAFT_INACTIVITY_MS+delta);assert.equal(await handlers.claimUnsignedDraftDeletion(ref('offers','offer'),undefined,now-policy.DRAFT_INACTIVITY_MS),delta<=0);}
 reset();records.offer.draftLastActivityAt=stamp(now);assert.equal(await handlers.claimUnsignedDraftDeletion(ref('offers','offer'),undefined,now-policy.DRAFT_INACTIVITY_MS),false);assert.equal(writes.length,0);
 reset('expired');delete records.offer.draftLastActivityAt;records.offer.lastActivityAt=stamp(now);records.offer.statusHistory=[{action:'draft_saved',occurredAt:stamp(now-8*86400000)},{action:'expired',occurredAt:stamp(now)}];assert.equal(policy.latestDraftActivity(records.offer,records.versions),now-8*86400000);
 reset();await handlers.claimUnsignedDraftDeletion(ref('offers','offer'),'buyer');storageFailure=true;await assert.rejects(handlers.purgeClaimedUnsignedDraft(ref('offers','offer')));assert(records.offer.draftCleanupPending);assert.equal(storeOps.length,0);storageFailure=false;await handlers.claimUnsignedDraftDeletion(ref('offers','offer'),'buyer');await handlers.purgeClaimedUnsignedDraft(ref('offers','offer'));assert.equal(records.offer,null);
 await assert.rejects(handlers.discardOfferDraft({data:{offerUid:'offer'}}),/Sign in/);await assert.rejects(handlers.discardOfferDraft({auth:{uid:'buyer'},data:{offerUid:'invalid/id'}}));
 const withdrawn=load(path.join(base,'delete-withdrawn-offers.ts'));
 reset('withdrawn');await assert.rejects(handlers.claimUnsignedDraftDeletion(ref('offers','offer'),'buyer'),/automatically deleted/);
 for(const delta of [-1,0,1]) {reset('withdrawn');records.offer.withdrawnAt=stamp(now-withdrawn.WITHDRAWN_RETENTION_MS+15*60000+delta);records.offer.lastDeliveredVersionUid='v1';records.versions[0].buyers[0].signature={status:'signed'};assert.equal(await withdrawn.claimWithdrawnOfferDeletion(ref('offers','offer'),now),delta<=0);}
 reset('withdrawn');records.offer.withdrawnAt=stamp(now-4*86400000);records.offer.contract={contractUid:'protected'};assert.equal(await withdrawn.claimWithdrawnOfferDeletion(ref('offers','offer'),now),false);
 reset('withdrawn');assert.equal(await withdrawn.claimWithdrawnOfferDeletion(ref('offers','offer'),now),false);
 reset('withdrawn');records.offer.withdrawnAt=stamp(now-4*86400000);assert(await withdrawn.claimWithdrawnOfferDeletion(ref('offers','offer'),now));storageFailure=true;await assert.rejects(handlers.purgeClaimedUnsignedDraft(ref('offers','offer')));storageFailure=false;assert(await withdrawn.claimWithdrawnOfferDeletion(ref('offers','offer'),now));await handlers.purgeClaimedUnsignedDraft(ref('offers','offer'));assert.equal(records.offer,null);
 const schedule=fs.readFileSync(path.join(base,'delete-inactive-offer-drafts.ts'),'utf8');assert(schedule.includes('every 60 minutes'));assert(schedule.includes('startAfter(last.id)'));assert(schedule.includes('lastOfferUid'));
 // Exercise the actual scheduler's persistent cursor with more than one run's batch.
 let cursorUid=null;const remaining=new Set(Array.from({length:620},(_,i)=>String(i).padStart(4,'0')));let schedulerDeleted=0;
 const makeQuery=()=>({after:null,batch:100,where(){return this;},orderBy(){return this;},limit(n){this.batch=n;return this;},startAfter(id){this.after=id;return this;},async get(){const ids=[...remaining].filter(id=>!this.after||id>this.after).slice(0,this.batch);return {empty:ids.length===0,size:ids.length,docs:ids.map(id=>({id,ref:{id},get:()=> 'draft'}))};}});
 const scheduledModule={exports:{}};
 vm.runInNewContext(compile(fs.readFileSync(path.join(base,'delete-inactive-offer-drafts.ts'),'utf8')),{module:scheduledModule,exports:scheduledModule.exports,Date:{now:()=>now},require:n=>{
  if(n==='firebase-admin/firestore')return {FieldPath:{documentId:()=> '__name__'}};
  if(n==='firebase-functions/v2/scheduler')return {onSchedule:(_options,fn)=>fn};
  if(n==='firebase-functions/logger')return {info:()=>{},error:()=>{}};
  if(n.endsWith('shared/firebase-admin'))return {adminFirestore:{collection:name=>name==='maintenance'?{doc:()=>({get:async()=>({get:()=>cursorUid}),set:async d=>{cursorUid=d.lastOfferUid;}})}:makeQuery()}};
  if(n.endsWith('shared/function-options'))return {FUNCTION_REGION:'us-east1'};
  if(n==='./unsigned-draft-policy')return policy;
  if(n==='./discard-offer-draft')return {DRAFT_INACTIVITY_MS:policy.DRAFT_INACTIVITY_MS,claimUnsignedDraftDeletion:async(reference,actor,cutoff)=>{assert.equal(actor,undefined);assert.equal(cutoff,now-policy.DRAFT_INACTIVITY_MS);return Number(reference.id)>=500;},purgeClaimedUnsignedDraft:async reference=>{remaining.delete(reference.id);schedulerDeleted++;}};
  throw Error(n);
 }});
 await scheduledModule.exports.deleteInactiveOfferDrafts();assert.equal(cursorUid,'0499');assert.equal(schedulerDeleted,0);
 await scheduledModule.exports.deleteInactiveOfferDrafts();assert.equal(cursorUid,null);assert.equal(schedulerDeleted,120);assert.equal(remaining.size,500);
 console.log('PASS:',comparisons,'all-state unsigned stages; authorization, seven-day boundaries, recent-save retention, signed/delivered/contract/history protection, signature evidence, atomic pending-count reduction, private-storage/subcollection cleanup and retry.');
})().catch(error=>{console.error(error);process.exitCode=1;});
