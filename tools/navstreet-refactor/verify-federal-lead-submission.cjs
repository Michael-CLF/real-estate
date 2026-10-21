const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const project=path.resolve(process.argv[2]||'.'),ts=require(require.resolve('typescript',{paths:[project,path.join(project,'functions')]}));
const {withFederalLeadContractPolicy}=require(path.join(project,'functions/lib/offers/state-contracts/federal-lead-contract-policy.js'));
class HttpsError extends Error{constructor(code,message){super(message);this.code=code;}}
async function execute({role='buyer',yearBuilt=1980,listingYear=yearBuilt,immutable=false,authorized=true,anonymous=false}={}){
 const actor=role,offer={Uid:'o',listingUid:'listing',stateCode:'MO',currentVersionUid:'v',primaryBuyerUid:'buyer',buyerUids:['buyer'],sellerUids:['seller'],pendingOfferCounted:false,status:'draft'};
 const terms={stateCode:'MO',property:{listingUid:'listing',state:'MO',propertyType:'single_family',yearBuilt},delivery:{expiresAt:'2099-01-01',timeZone:'America/Chicago',electronicDeliveryAuthorized:true},disclosures:{leadPaintStatus:role==='seller'?'received':'pending',leadInspectionSelection:'ten_days',leadInspectionDays:10},documentVersions:{'lead-based-paint':'reviewed-lead-v1',other:'preserved'}};
 const version={Uid:'v',offerUid:'o',stateCode:'MO',status:immutable?'awaiting_signatures':'draft',immutable,initiatedBy:role,initiatedByUid:actor,versionNumber:1,terms,buyers:[],sellers:[]};
 const listing={status:'active',yearBuilt:listingYear,propertyType:'single_family'};const originals=JSON.stringify({offer,version,listing}),updates=[],events=[];let validations;
 const base={stateCode:'MO',createInitialOfferTerms:()=>terms,sanitizeDraftTerms:({requestedTerms})=>requestedTerms,validateSubmission:input=>{events.push('validate');validations=input.version.terms;if(input.version.terms.property.yearBuilt<1978 && input.version.terms.disclosures.leadPaintStatus==='pending')throw new HttpsError('failed-precondition','Covered older housing still requires its disclosure.');}};
 const pkg=withFederalLeadContractPolicy(base,{values:{'disclosures.leadPaintStatus':'built_1978_or_later','disclosures.leadInspectionSelection':'unselected','disclosures.leadInspectionDays':10,'documentVersions.lead-based-paint':undefined},hiddenFields:[]});
 const prepare=pkg.prepareSubmissionTerms;pkg.prepareSubmissionTerms=input=>{events.push('prepare');return prepare(input);};
 const data={o:offer,v:version,listing};function ref(id){return{id,collection:()=>({doc:ref}),get:async()=>({exists:!!data[id],data:()=>data[id]})};}
 const adminFirestore={collection:()=>({doc:ref}),runTransaction:async callback=>callback({get:async r=>r.get(),update:(r,value)=>updates.push({id:r.id,value})})};
 const module={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(project,'functions/src/offers/submit-offer.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module,exports:module.exports,Date,Set,require:name=>{
  if(name==='firebase-functions/v2/https')return{HttpsError,onCall:(_options,handler)=>handler};
  if(name==='firebase-functions/logger')return{info(){}};
  if(name==='firebase-admin/firestore')return{Timestamp:{now:()=>({seconds:1})},FieldValue:{arrayUnion:(...items)=>({items}),increment:value=>({increment:value})}};
  if(name==='../shared/firebase-admin')return{adminFirestore};if(name==='../shared/function-options')return{callableFunctionOptions:{}};
  if(name==='./verify-offer-eligibility')return{verifyOfferSubmissionEligibility:async()=>{events.push('eligibility');}};
  if(name==='./state-contracts/state-contract-registry')return{requireStateContractPackage:()=>pkg};throw Error(name);
 }});
 let error;try{await module.exports.submitOffer({auth:anonymous?undefined:{uid:authorized?actor:'intruder'},data:{offerUid:'o',offerVersionUid:'v'}});}catch(e){error=e;}
 assert.equal(JSON.stringify({offer,version,listing}),originals,'Submission must not mutate the transaction snapshots');return{error,updates,events,validations,terms};
}
(async()=>{
 const buyer=await execute();assert.equal(buyer.error,undefined);const frozen=buyer.updates.find(row=>row.id==='v').value;assert.equal(frozen.immutable,true);assert.equal(frozen.status,'awaiting_signatures');assert.equal(frozen.terms.disclosures.leadPaintStatus,'built_1978_or_later');assert.equal(frozen.terms.documentVersions['lead-based-paint'],undefined);assert.equal(frozen.terms.documentVersions.other,'preserved');assert.equal(buyer.validations.disclosures.leadPaintStatus,'built_1978_or_later');assert(buyer.events.indexOf('prepare')<buyer.events.indexOf('validate'));
 const seller=await execute({role:'seller'});assert.equal(seller.error,undefined);const counter=seller.updates.find(row=>row.id==='v').value.terms;assert.equal(counter.disclosures.leadPaintStatus,'received');assert.equal(counter.documentVersions['lead-based-paint'],'reviewed-lead-v1');
 for(const scenario of [{anonymous:true},{authorized:false},{immutable:true}]){const blocked=await execute(scenario);assert(blocked.error);assert.equal(blocked.updates.length,0);assert(!blocked.events.includes('prepare'),'Access/immutability guard must run before preparation');}
 for(const scenario of [{listingYear:1977},{yearBuilt:1977}]){const blocked=await execute(scenario);assert.equal(blocked.error?.code,'failed-precondition');assert.equal(blocked.updates.length,0);}
 console.log('PASS: actual submit callable transaction; canonical terms frozen atomically; authorization and signed-version guards; stale-year correction; older housing validation; seller receipt/pin preservation; untouched input snapshots.');
})().catch(error=>{console.error(error);process.exitCode=1;});
