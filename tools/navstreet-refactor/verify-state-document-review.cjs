'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const ts=require(require.resolve('typescript',{paths:[root]}));
const cache=new Map();
function load(file){if(cache.has(file))return cache.get(file);const module={exports:{}};cache.set(file,module.exports);vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module,exports:module.exports,require:n=>load(path.resolve(path.dirname(file),n+'.ts')),Date,Set,Map,Intl});cache.set(file,module.exports);return module.exports;}
const baseline=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/document-review-before.json'),'utf8'));
const normalize=x=>JSON.parse(JSON.stringify(x));let comparisons=0;
const states=path.join(root,'src/app/features/offers/states');
assert.equal(baseline.length,41);
for(const row of baseline){
 const dir=path.join(states,row.state),pkg=load(path.join(dir,row.state+'-offer-package.ts'))[row.package];
 const hook=pkg.documentReview;assert(hook,'Package must expose its hook: '+row.state);
 const env={};if(row.delegate)env[row.delegate]=load(path.join(dir,'services',row.state+'-reviewed-document-versions.ts'))[row.delegate];
 function compile(params,body){const module={exports:{}};vm.runInNewContext(ts.transpileModule('module.exports = ('+params+') => {'+body+'}',{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module,exports:module.exports,Set,...env});return module.exports;}
 const oldValidate=compile('terms, documents',row.validate),oldChange=compile('currentTerms, updatedTerms, change, documents, initiatedBy',row.applyChange);
 const wizard=fs.readFileSync(path.join(dir,'offer-wizard/offer-wizard.component.ts'),'utf8');
 assert(!wizard.includes('const attached = new Set('));assert(!wizard.includes('const receiptTypes:'));assert(!/pin\w+ReviewedDocumentVersions/.test(wizard));
 assert(wizard.includes(row.package+'.documentReview!.validate(terms, this.listingDisclosures())'));
 assert(wizard.includes(row.package+'.documentReview!.applyChange('));
 const hookText=fs.readFileSync(path.join(dir,row.state+'-document-review.ts'),'utf8');
 const fields=[...new Set([...hookText.matchAll(/terms\.disclosures\.(\w+)/g)].map(m=>m[1]).concat(['propertyConditionStatus','statutoryPacketStatus','hoaDocumentsStatus','leadPaintStatus','radonBrochureAcknowledged']))];
 const types=[...new Set([...hookText.matchAll(/['"]([a-z]+(?:-[a-z]+)+)['"]/g)].map(m=>m[1]).filter(x=>!x.startsWith('disclosures')))];
 const initial={stateCode:pkg.stateCode,property:{listingUid:'sample'},contractType:'navstreet_'+row.state.replaceAll('-','_')+'_condominium_resale_2026',disclosurePolicyRevision:'test',documentVersions:{unrelated:'keep'},disclosures:Object.fromEntries(fields.map(f=>[f,'pending']))};
 const docs=types.map(documentType=>({documentType,versionId:'current-v2',listingUid:'sample',stateAbbreviation:pkg.stateCode}));
 for(const status of ['unselected','pending','received','exempt','not_applicable',true,false,null])for(const present of [[],docs,docs.map(d=>({...d,versionId:''}))])for(const pins of [{},Object.fromEntries(types.map(t=>[t,'reviewed-v1'])),undefined]){
  const terms={...structuredClone(initial),disclosures:Object.fromEntries(fields.map(f=>[f,status])),documentVersions:pins};
  if(['california','south-carolina'].includes(row.state)&&pins===undefined)continue;
  assert.deepEqual(normalize(hook.validate(terms,present)),normalize(oldValidate(terms,present)),row.state+' validation');comparisons++;
 }
 const paths=fields.map(f=>'disclosures.'+f).concat(['purchase.purchasePriceInCents','other']);
 for(const legacy of [false,true])for(const sameReceipt of [false,true])for(const initiatedBy of ['buyer','seller',undefined])for(const fieldPath of paths)for(const value of ['received','exempt','pending',null])for(const present of [[],docs]){
  const previous=structuredClone(initial),updated=structuredClone(initial);previous.documentVersions=Object.fromEntries(types.map(t=>[t,'reviewed-v1']));updated.documentVersions={...previous.documentVersions};
  if(legacy){delete previous.disclosurePolicyRevision;delete updated.disclosurePolicyRevision;previous.contractType=updated.contractType='navstreet_'+row.state.replaceAll('-','_')+'_residential_sale_2026';}
  if(fieldPath.startsWith('disclosures.')){updated.disclosures[fieldPath.slice(12)]=value;if(sameReceipt)previous.disclosures[fieldPath.slice(12)]=value;}
  const before=JSON.stringify({previous,updated,present});
  assert.deepEqual(normalize(hook.applyChange(previous,updated,{fieldPath,value},present,initiatedBy)),normalize(oldChange(previous,updated,{fieldPath,value},present,initiatedBy)),row.state+' change '+fieldPath);
  assert.equal(JSON.stringify({previous,updated,present}),before,'Hook must not mutate inputs');comparisons++;
 }
 if(['indiana','missouri','arizona','minnesota'].includes(row.state)){
  const name=row.state[0].toUpperCase()+row.state.slice(1),fn=load(path.join(dir,'services',row.state+'-reviewed-document-versions.ts'))['pin'+name+'ReviewedDocumentVersions'];
  assert.equal(hook.prepareDraft,fn);const entry=fs.readFileSync(path.join(dir,row.state+'-offer-entry',row.state+'-offer-entry.component.ts'),'utf8');assert(entry.includes(row.package+'.documentReview!.prepareDraft!('));
  const a=entry.indexOf('  private lastReviewedTerms:'), b=entry.indexOf('  protected onDraftChanged(',a);assert.equal(entry.slice(a,b).replaceAll(row.package+'.documentReview!.prepareDraft!', 'pin'+name+'ReviewedDocumentVersions').replace(/\r\n/g, '\n'),row.entryMethods.replace(/\r\n/g, '\n'),'Entry lifecycle and save boundary must remain unchanged');
 }
}
const ky=load(path.join(states,'kentucky/kentucky-offer-package.ts')).KENTUCKY_OFFER_PACKAGE.documentReview;
const t={disclosures:{leadPaintStatus:'received',propertyConditionStatus:'pending',statutoryPacketStatus:'pending',hoaDocumentsStatus:'pending'},documentVersions:{}};
assert.throws(()=>assert.deepEqual(normalize(ky.validate(t,[])),[]));
const out=ky.applyChange(t,t,{fieldPath:'disclosures.leadPaintStatus',value:'received'},[{documentType:'lead-based-paint',versionId:'exact-v1'}],'buyer');
assert.throws(()=>assert.equal(out.documentVersions['lead-based-paint'],'replacement-v2'));
console.log(`PASS: ${comparisons} historical document-review comparisons across 41 package hooks; missing uploads, receipt statuses, existing/absent pins, buyer/seller changes, input immutability, entry boundaries and 2 negative controls.`);
