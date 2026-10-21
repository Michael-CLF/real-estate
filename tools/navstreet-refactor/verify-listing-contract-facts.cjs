const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const project=path.resolve(process.argv[2]||'.');const ts=require(require.resolve('typescript',{paths:[project,path.join(project,'functions')]}));
const compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
let data,writes;class HttpsError extends Error{constructor(code,message){super(message);this.code=code;}}
const reference={id:'listing'};const firestore={collection:()=>({doc:()=>reference}),runTransaction:async cb=>cb({get:async()=>({exists:true,data:()=>data}),update:(_ref,updates)=>writes.push(updates)})};
const moduleValue={exports:{}};vm.runInNewContext(compile(fs.readFileSync(path.join(project,'functions/src/listings/update-published-listing.ts'),'utf8')),{module:moduleValue,exports:moduleValue.exports,require:n=>{
 if(n==='firebase-functions/v2/https')return {HttpsError,onCall:(_options,fn)=>fn};
 if(n==='firebase-functions/logger')return {info:()=>{},error:()=>{}};
 if(n==='firebase-admin/firestore')return {Timestamp:{now:()=>({toMillis:()=>1})},FieldValue:{serverTimestamp:()=>({})}};
 if(n.endsWith('shared/firebase-admin'))return {adminFirestore:firestore};if(n.endsWith('shared/function-options'))return {callableFunctionOptions:{}};
 if(n.includes('colorado-contract-elections'))return {COLORADO_FACT_DEFAULTS:{}};
 if(n.includes('california-listing-facts'))return {CALIFORNIA_DISCLOSURE_TYPES:[],validCaliforniaDisclosureDecision:()=>false};
 throw Error(n);
},Date,Set,Object,Number});
const handler=moduleValue.exports.updatePublishedListing;const facts={isCondominium:true,isDeveloperSale:false,isLeasehold:false,dwellingUnitCount:null};
const reset=()=>{data={sellerUid:'seller',state:'MO',status:'active',sellerStatements:{missouri:{methProductionKnown:false},ownersAssociationApplies:false},hoa:{hasHoa:false}};writes=[];};
const request=(changes,uid='seller')=>({auth:{uid},data:{listingUid:'listing',changes}});
(async()=>{
 reset();await assert.rejects(handler({data:{listingUid:'listing',changes:{contractFacts:facts}}}),/sign|authenticated/i);assert.equal(writes.length,0);
 reset();await assert.rejects(handler(request({contractFacts:facts},'other')),/Only the listing owner/);assert.equal(writes.length,0);
 reset();const result=await handler(request({contractFacts:facts,legalDescription:'Recorded Unit 3'}));assert(result.updatedFields.includes('contractFacts'));assert.deepEqual(JSON.parse(JSON.stringify(writes[0]['sellerStatements.contractFacts'])),facts);assert.equal(writes[0].legalDescription,'Recorded Unit 3');assert(!('sellerStatements' in writes[0]),'A dot-path update must preserve other seller statements');
 for(const change of [{...facts,isLeasehold:'false'},{...facts,unexpected:true},{...facts,dwellingUnitCount:1},{...facts,dwellingUnitCount:2.5},{...facts,dwellingUnitCount:'3'}]){reset();await assert.rejects(handler(request({contractFacts:change})));assert.equal(writes.length,0);}
 for(const status of ['sold','withdrawn','expired','under_contract']){reset();data.status=status;await assert.rejects(handler(request({contractFacts:facts})));assert.equal(writes.length,0);}
 reset();data.activeContractUid='contract';await assert.rejects(handler(request({contractFacts:facts})),/outside a contract/);assert.equal(writes.length,0);
 reset();await handler(request({contractFacts:{isCondominium:false,isDeveloperSale:false,isLeasehold:false,dwellingUnitCount:3}}));assert.equal(writes[0]['sellerStatements.contractFacts'].isDeveloperSale,false);
 reset();await handler(request({hoa:{hasHoa:true,feeAmount:100,feeFrequency:'monthly'}}));assert.equal(writes[0]['sellerStatements.ownersAssociationApplies'],true);assert(!('sellerStatements' in writes[0]));
 console.log('PASS: actual published-listing handler; authentication/owner checks, preserved sibling facts, null/false answers, invalid ownership values/unit counts, accepted-contract protections and synchronized association applicability.');
})().catch(error=>{console.error(error);process.exitCode=1;});
