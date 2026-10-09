const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');const assert=require('node:assert/strict');
const project=path.resolve(process.argv[2]||'.');
const ts=require(require.resolve('typescript',{paths:[project]}));const rx=require(require.resolve('rxjs',{paths:[project]}));
const source=fs.readFileSync(path.join(project,'src/app/core/domains/marketplace/repositories/firestore-marketplace-listing.repository.ts'),'utf8');
let reads=0,calls=0,fail=false;
const docs=Array.from({length:90},(_,i)=>({id:'listing-'+i,data:()=>({status:['active','under_contract','sold'][i%3],city:i%2?'Raleigh':'Austin',state:i%2?'NC':'TX',zipCode:'00000',addressLine1:i+' Sample Street',propertyType:'single_family',listPrice:100000+i*1000,bedrooms:i%5,bathrooms:2,squareFeet:1000+i,createdAt:new Date(2026,0,i+1),publishedAt:new Date(2026,0,i+1)})}));
const firestore={collection:()=>({}),where:(field,op,value)=>({field,op,value}),query:(ref,...constraints)=>constraints,
 getDocs:async constraints=>{calls++;if(fail)throw new Error('read failed');const status=constraints.find(c=>c.field==='status');assert.equal(status.op,'in');const selected=docs.filter(d=>status.value.includes(d.data().status));reads+=selected.length;return {docs:selected};}};
const moduleOut={exports:{}};
vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,experimentalDecorators:true}}).outputText,{module:moduleOut,exports:moduleOut.exports,Date,require:name=>{
 if(name==='@angular/core')return {Injectable:()=>cls=>cls};if(name==='firebase/firestore')return firestore;if(name==='rxjs')return rx;
 if(name.includes('infrastructure/firebase'))return {firestore:{}};
 if(name==='./marketplace-listing.repository')return {MarketplaceListingRepository:class{}};
 throw new Error('Unexpected dependency '+name);
}});
(async()=>{const repo=new moduleOut.exports.FirestoreMarketplaceListingRepository();const all=docs.map(d=>repo.mapFirestoreListing(d.id,d.data()));assert.equal(all.length,90);let comparisons=0;
for(const listingStatuses of [undefined,[],['active'],['sold'],['under_contract'],['sold','active'],['draft'],['draft','active'],['active','active']])
 for(const sort of ['newest','price_low_to_high','price_high_to_low','bedrooms_high_to_low','square_feet_high_to_low'])
  for(const page of [1,2,99]){
   const filters={listingStatuses,sort,page,pageSize:7,minimumPrice:110000,searchTerm:'Sample'};
   const expected=repo.createSearchResult(all,filters);const result=await rx.firstValueFrom(repo.searchListings(filters));
   assert.equal(JSON.stringify(result),JSON.stringify(expected));comparisons++;
  }
reads=0;calls=0;await rx.firstValueFrom(repo.searchListings({listingStatuses:['active']}));assert.equal(reads,30);assert.equal(calls,1);
reads=0;calls=0;await rx.firstValueFrom(repo.searchListings({listingStatuses:['draft']}));assert.equal(reads,0);assert.equal(calls,0);
fail=true;await assert.rejects(rx.firstValueFrom(repo.searchListings({listingStatuses:['active']})),/read failed/);
console.log(`PASS: ${comparisons} marketplace status/search/sort/pagination comparisons; active-only mock reads reduced from 90 to 30, private-only requests skip reads, failures propagate.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
