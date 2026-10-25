'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),vm=require('node:vm');
const {generate,validatePolicy,outputFile}=require('./generate-state-policy-mappings.cjs');
const root=path.resolve(process.argv[2]||'.');
const ts=require(require.resolve('typescript',{paths:[root]}));
const baseline=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/state-policy-mappings-before.json'),'utf8'));
const decode=v=>Array.isArray(v)?v.map(decode):v&&typeof v==='object'?Object.keys(v).length===1&&v.$unset===true?undefined:Object.fromEntries(Object.entries(v).map(([k,x])=>[k,decode(x)])):v;
function load(file){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports});return {hoa:exports.HOA_POLICY,federalLead:exports.FEDERAL_LEAD_POLICY};}
// Serialize in the host realm without dropping undefined or relying on VM prototypes.
function plain(v){if(Array.isArray(v))return Array.from(v,plain);if(v&&typeof v==='object')return Object.fromEntries(Object.keys(v).map(k=>[k,plain(v[k])]));return v;}
const rows=generate(root),byState=new Map();let comparisons=0;
for(const row of rows){const current=plain(load(row.file));assert.deepEqual(current,decode(row.policy),row.slug+'/'+row.side+' does not match its canonical manifest');comparisons++;
 if(baseline[row.slug]?.[row.side]){assert.deepEqual(current,decode(baseline[row.slug][row.side]),row.slug+'/'+row.side+' changed an existing mapping value or undefined own-key');comparisons++;}
 const file=path.join(root,row.side==='frontend'?'src/app/features/offers/states':'functions/src/offers/state-contracts',row.slug,row.slug+(row.side==='frontend'?'-offer-package.ts':'-state-contract.package.ts'));
 const sf=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),99,true);let count=0;
 function visit(node){if(ts.isCallExpression(node)&&/^with(Hoa|FederalLead)(Offer|Contract)Policy$/.test(node.expression.getText(sf))){count++;const name=node.expression.getText(sf).includes('Hoa')?'HOA_POLICY':'FEDERAL_LEAD_POLICY';assert(ts.isIdentifier(node.arguments[1])&&node.arguments[1].text===name,file+' must consume its generated '+name);const imports=sf.statements.filter(ts.isImportDeclaration).filter(d=>d.importClause?.namedBindings&&ts.isNamedImports(d.importClause.namedBindings)&&d.importClause.namedBindings.elements.some(e=>e.name.text===name&&(e.propertyName?.text||e.name.text)===name));assert.equal(imports.length,1);const target=path.resolve(path.dirname(file),imports[0].moduleSpecifier.text+'.ts');assert.equal(target,row.file,'State package imported another state/root mapping');}ts.forEachChild(node,visit)}visit(sf);assert.equal(count,2,file);comparisons++;
 if(!byState.has(row.slug))byState.set(row.slug,current);else{assert.deepEqual(current,byState.get(row.slug),row.slug+' frontend/backend parity');comparisons++;}
}
for(const slug of Object.keys(baseline))assert(byState.has(slug),'Historical state disappeared: '+slug);
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'navstreet-policy-mapping-'));let negatives=0;
try{
 const slug='kentucky',manifest=JSON.parse(fs.readFileSync(path.join(root,'state-contracts',slug,'offer-policy-mappings.json'),'utf8'));
 const source=path.join(temporary,'state-contracts',slug,'offer-policy-mappings.json');fs.mkdirSync(path.dirname(source),{recursive:true});
 function writeManifest(doc){fs.writeFileSync(source,JSON.stringify(doc,null,2)+'\n');}
 writeManifest(manifest);
 for(const [dir,suffix]of[['functions/src/offers/state-contracts','-state-contract.package.ts'],['src/app/features/offers/states','-offer-package.ts']]){const f=path.join(temporary,dir,slug,slug+suffix);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,'// fixture package\n');}
 generate(temporary,{write:true});generate(temporary);
 const back=outputFile(temporary,slug,'backend'),front=outputFile(temporary,slug,'frontend'),original=fs.readFileSync(back,'utf8');
 fs.writeFileSync(back,original+'// drift\n');assert.throws(()=>generate(temporary),/missing\/stale/);assert(fs.readFileSync(back,'utf8').endsWith('// drift\n'),'Check mode must not silently repair source');negatives++;generate(temporary,{write:true});assert.equal(fs.readFileSync(back,'utf8'),original);
 fs.unlinkSync(front);assert.throws(()=>generate(temporary),/missing\/stale/);negatives++;generate(temporary,{write:true});
 const changed=structuredClone(manifest);changed.policies.hoa.documentTypes.push('synthetic-test-document');writeManifest(changed);assert.throws(()=>generate(temporary),/missing\/stale/);negatives++;generate(temporary,{write:true});assert.deepEqual(plain(load(front)),plain(load(back)));writeManifest(manifest);generate(temporary,{write:true});
 const bad=structuredClone(manifest);bad.policies.federalLead.values['disclosures.leadPaintStatus']={$unset:false};writeManifest(bad);assert.throws(()=>generate(temporary),/undefined/);negatives++;
 const wrong=structuredClone(manifest);wrong.targets=['backend'];writeManifest(wrong);assert.throws(()=>generate(temporary),/targets/);negatives++;writeManifest(manifest);
 const unknown=structuredClone(manifest);unknown.policies.hoa.sellerFactPth='bad';writeManifest(unknown);assert.throws(()=>generate(temporary),/unsupported key/);negatives++;writeManifest(manifest);
 const proto=structuredClone(manifest);proto.policies.hoa.sellerFactPath='__proto__.bad';assert.throws(()=>validatePolicy(proto.policies),/invalid field path/);negatives++;
 const orphan=path.join(temporary,'functions/src/offers/state-contracts/kentucky/old-policy-mappings.generated.ts');fs.writeFileSync(orphan,'// obsolete');assert.throws(()=>generate(temporary),/Orphan/);negatives++;fs.unlinkSync(orphan);
 const extra=path.join(temporary,'state-contracts/unknown');fs.mkdirSync(extra);assert.throws(()=>generate(temporary),/exactly match/);negatives++;fs.rmdirSync(extra);
 for(const row of generate(temporary)){const s=fs.readFileSync(row.file,'utf8');fs.writeFileSync(row.file,s.replace(/\n/g,'\r\n'));}generate(temporary);assert.equal(fs.readFileSync(back,'utf8').replace(/\r\n/g,'\n'),original);
}finally{fs.rmSync(temporary,{recursive:true,force:true});}
console.log(`PASS: ${rows.length} generated modules / ${byState.size} states; ${comparisons} exact canonical/historical/binding/parity comparisons and ${negatives} generator failure controls. Undefined keys, arrays and side-specific package scope preserved.`);
