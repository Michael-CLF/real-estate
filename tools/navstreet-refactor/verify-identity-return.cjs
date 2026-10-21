const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(process.argv[2]||'.');
const ts=require(require.resolve('typescript',{paths:[path.join(root,'functions'),root]}));
let snapshotCallback, snapshotOptions, navigateCount=0,timers=new Map(),timerId=0;
const router={navigate:async()=>{navigateCount++;return true}};
const signal=value=>{const f=()=>value;f.set=v=>value=v;return f};
const angular={ChangeDetectionStrategy:{OnPush:0},Component:()=>x=>x,signal,computed:f=>f,inject:token=>token==='router'?router:token==='route'?{snapshot:{paramMap:{get:()=> 'listing'}}}:{}};
const modules={'@angular/core':angular,'@angular/router':{Router:'router',ActivatedRoute:'route',RouterLink:class{}},'firebase/firestore':{doc:()=>({}),onSnapshot:(ref,options,next)=>{snapshotOptions=options;snapshotCallback=next;return ()=>{snapshotCallback=null}}}};
const source=fs.readFileSync(path.join(root,'src/app/features/sell/verification-return/verification-return.component.ts'),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,experimentalDecorators:true}}).outputText;
const moduleValue={exports:{}};
vm.runInNewContext(js,{exports:moduleValue.exports,require:n=>modules[n]||(n.includes('infrastructure/firebase')?{auth:{authStateReady:async()=>{},currentUser:{uid:'seller'}},firestore:{}}:{}),console,setTimeout:f=>{timers.set(++timerId,f);return timerId},clearTimeout:id=>timers.delete(id)});
const Component=moduleValue.exports.VerificationReturnComponent;
const settle=()=>{const jobs=[...timers.values()];timers.clear();jobs.forEach(f=>f())};
function create(){timers.clear();navigateCount=0;const c=new Component();c.monitorListingDraft('listing','seller');return c}
function emit(status,{cached=false,pending=false,exists=true}={}){snapshotCallback({id:'listing',metadata:{fromCache:cached,hasPendingWrites:pending},exists:()=>exists,data:()=>({sellerUid:'seller',publication:{identityStatus:status}})})}
(async()=>{
 let c=create();assert.equal(snapshotOptions.includeMetadataChanges,true);
 emit('requires_input',{cached:true});assert.equal(c.pageState(),'loading');assert.equal(timers.size,0);
 emit('requires_input');assert.equal(c.pageState(),'processing');assert.equal(timers.size,1);
 emit('requires_input');assert.equal(timers.size,1,'Repeated snapshots do not postpone the decision');
 emit('verified');assert.equal(c.pageState(),'verified');assert.equal(timers.size,0);assert.equal(navigateCount,1);
 emit('failed');settle();assert.equal(c.pageState(),'verified');assert.equal(navigateCount,1,'Verified status does not regress');
 c.ngOnDestroy();
 c=create();emit('failed');settle();assert.equal(c.pageState(),'requires_input');assert.equal(navigateCount,0,'An unverified seller cannot advance');
 emit('processing');assert.equal(c.pageState(),'processing');emit('verified');assert.equal(navigateCount,1);c.ngOnDestroy();
 c=create();emit('requires_input');c.ngOnDestroy();assert.equal(timers.size,0,'Destroy cancels timers');
 c=create();emit('verified',{cached:true});assert.equal(navigateCount,0,'Cached success cannot authorize navigation');emit('verified',{pending:true});assert.equal(navigateCount,0);c.ngOnDestroy();
 c=create();emit('pending');assert.equal(c.pageState(),'processing');assert.equal(navigateCount,0);c.ngOnDestroy();
 c=create();router.navigate=async()=>false;emit('verified');await Promise.resolve();await Promise.resolve();assert.equal(c.pageState(),'error');assert.match(c.errorMessage(),/could not open the payment/);c.ngOnDestroy();
 const template=fs.readFileSync(path.join(root,'src/app/features/sell/verification-return/verification-return.component.html'),'utf8');assert(!template.includes('Stripe could not complete the verification'));
 console.log('PASS: actual identity return component; cached/pending snapshots, status settling, genuine retry, verified latch, one navigation, cleanup and navigation failure.');
})().catch(e=>{console.error(e);process.exitCode=1});
