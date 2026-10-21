const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const project=path.resolve(process.argv[2]||'.');
const ts=require(require.resolve('typescript',{paths:[project,path.join(project,'functions')]}));
const compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,experimentalDecorators:true}}).outputText;
const cache=new Map();
function load(file){if(cache.has(file))return cache.get(file);const module={exports:{}};vm.runInNewContext(compile(fs.readFileSync(file,'utf8')),{module,exports:module.exports,require:n=>load(path.resolve(path.dirname(file),n+'.ts')),Date,Set});cache.set(file,module.exports);return module.exports;}
const config=load(path.join(project,'src/app/core/configuration/state-disclosures.config.ts'));
const signal=value=>{const s=()=>value;s.set=next=>value=next;return s;};
const requirements=state=>config.getStateDisclosureRequirements(state);
const listing=(state,extra={})=>({state,yearBuilt:2000,sellerStatements:{leadBasedPaintApplies:false,ownersAssociationApplies:false,delaware:{disclosureExemptionClaimed:false},iowa:{disclosureExemptionClaimed:false},montana:{radonTestsKnown:false,drugContaminationKnown:false,appurtenantWaterRightsKnown:false},...extra}});
const required=(state,facts)=>Array.from(requirements(state)).filter(r=>config.isDisclosureRequiredForListing(state,r,{...facts.sellerStatements,yearBuilt:facts.yearBuilt}));
assert.deepEqual(required('DE',listing('DE')).map(r=>r.documentType),['delaware-seller-disclosure','delaware-statutory-packet']);
assert.deepEqual(required('MT',listing('MT')).map(r=>r.documentType),['montana-seller-disclosure']);
assert.deepEqual(required('MT',listing('MT',{montana:{radonTestsKnown:true,drugContaminationKnown:false,appurtenantWaterRightsKnown:false}})).map(r=>r.documentType),['montana-seller-disclosure','montana-statutory-packet']);
assert.deepEqual(required('IA',listing('IA')).map(r=>r.documentType),['iowa-seller-disclosure','iowa-statutory-packet']);
assert.deepEqual(required('IA',listing('IA',{iowa:{disclosureExemptionClaimed:true}})).map(r=>r.documentType),['iowa-seller-disclosure']);
for(const r of required('IA',listing('IA')))assert(config.isDisclosureRequiredBeforeAcceptanceForListing('IA',r,{iowa:{disclosureExemptionClaimed:false}}));
const file=path.join(project,'src/app/features/dashboard/listing-management/listing-management.component.ts'),moduleStub={exports:{}};
vm.runInNewContext(compile(fs.readFileSync(file,'utf8')),{module:moduleStub,exports:moduleStub.exports,require:n=>n==='@angular/core'?{Component:()=>()=>{},ChangeDetectionStrategy:{OnPush:0}}:n.endsWith('state-disclosures.config')?config:{},console,Set});
const method=moduleStub.exports.ListingManagementComponent.prototype.loadDisclosureStatus;
const document=(state,type,override={})=>({documentType:type,currentDocument:{listingUid:'sample',stateAbbreviation:state,storagePath:'files/'+type,versionId:'v1',...override}});
async function check(state,records,expected){
 const test={listing:()=>listing(state),listingUid:'sample',disclosureService:{getListingDisclosures:async()=>records},verifiedDisclosureTypes:signal([]),requiredDisclosureCount:signal(0),uploadedDisclosureCount:signal(0),missingDisclosureTitles:signal([]),disclosureStatusError:signal(''),disclosureStatusIsLoading:signal(false)};
 await method.call(test,state);
 assert.equal(test.disclosureStatusError(),'');assert.equal(test.requiredDisclosureCount(),expected.total);assert.equal(test.uploadedDisclosureCount(),expected.uploaded);assert.equal(test.missingDisclosureTitles().length,expected.total-expected.uploaded);return test;
}
(async()=>{
 await check('DE',[],{total:2,uploaded:0});
 await check('MT',[],{total:1,uploaded:0});
 await check('IA',[],{total:2,uploaded:0});
 await check('DE',[document('DE','delaware-seller-disclosure')],{total:2,uploaded:1});
 await check('DE',[document('DE','delaware-seller-disclosure'),document('DE','delaware-statutory-packet')],{total:2,uploaded:2});
 for(const override of [{listingUid:'wrong'},{stateAbbreviation:'XX'},{storagePath:''},{versionId:''}])await check('MT',[document('MT','montana-seller-disclosure',override)],{total:1,uploaded:0});
 await check('WY',[],{total:0,uploaded:0});
 console.log('PASS: seller required labels, covered/exempt Iowa acceptance timing, Delaware/Montana counts, missing names, optional uploads and rejection of wrong-listing/wrong-state/incomplete document identities.');
})().catch(error=>{console.error(error);process.exitCode=1;});
