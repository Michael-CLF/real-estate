'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {hash,normalizedAssembly}=require('./legal-content-audit-lib.cjs');
const root=path.resolve(process.argv[2]||'.');const ts=require(require.resolve('typescript',{paths:[root]}));
const baseline=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/section-legal-content-baseline.json'),'utf8'));
function audit(overrides=new Map()) {
 const read=file=>{const rel=path.relative(root,path.resolve(file)).replaceAll('\\','/');return overrides.has(rel)?overrides.get(rel):fs.readFileSync(file,'utf8')};
 let texts=0,references=0;const known=new Set();
 for(const catalog of baseline.catalogs){
  known.add(catalog.file);const file=path.join(root,catalog.file),source=read(file).replace(/\r\n/g,'\n');assert.equal(hash(source),catalog.sha256,'Immutable content version changed: '+catalog.file);
  const exports={};vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports});
  assert.equal(exports[catalog.revisionSymbol],catalog.revision,'Content revision identity changed');
  const values=exports[catalog.symbol];assert(Object.isFrozen(values),'Pinned content must be frozen');
  assert.deepEqual(Object.fromEntries(Object.entries(values)),catalog.entries,'Legal/explanatory text changed');texts+=Object.keys(values).length;
 }
 for(const consumer of baseline.consumers){
  const file=path.join(root,consumer.file),source=read(file),sf=ts.createSourceFile(file,source,99,true),keys=[];let imports=0;
  function visit(n){
   if(ts.isImportDeclaration(n)&&n.moduleSpecifier.text.includes('/legal-content/')){
    imports++;assert.equal(path.resolve(path.dirname(file),n.moduleSpecifier.text+'.ts'),path.join(root,consumer.module),'Historical consumer repointed to another state/revision');
    assert(n.importClause?.namedBindings&&ts.isNamedImports(n.importClause.namedBindings));assert.equal(n.importClause.namedBindings.elements.length,1);assert.equal(n.importClause.namedBindings.elements[0].name.text,consumer.symbol,'Content binding changed');assert.equal(n.importClause.namedBindings.elements[0].propertyName?.text||n.importClause.namedBindings.elements[0].name.text,consumer.symbol,'Imported content identity changed');
   }
   if(ts.isElementAccessExpression(n)&&ts.isIdentifier(n.expression)&&n.expression.text===consumer.symbol){assert(ts.isStringLiteralLike(n.argumentExpression));keys.push(n.argumentExpression.text);}
   ts.forEachChild(n,visit);
  }visit(sf);assert.equal(imports,1,'Missing explicit content version import');assert.deepEqual(keys.sort(),consumer.keys,'Historical content keys/reference count changed');
  assert.equal(hash(normalizedAssembly(ts,file,source,read)),consumer.assemblyHash,'Question assembly/wording changed: '+consumer.file);references+=keys.length;
 }
 const statesDir=path.join(root,'src/app/features/offers/states');
 for(const entry of fs.readdirSync(statesDir,{withFileTypes:true}).filter(d=>d.isDirectory())){
  const dir=path.join(statesDir,entry.name,'legal-content');if(!fs.existsSync(dir))continue;
  for(const f of fs.readdirSync(dir).filter(f=>/^offer-section-content\..*\.ts$/.test(f))){const rel=path.relative(root,path.join(dir,f)).replaceAll('\\','/');assert(known.has(rel),'New content version needs a reviewed baseline/binding record: '+rel);}
 }
 // Future packages must not silently put long wording back into assembly.
 const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
 const candidates=new Set([...walk(statesDir),...Array.from(overrides.keys(),f=>path.join(root,f))]);
 const reviewed=new Set(baseline.consumers.map(c=>c.file));
 for(const file of candidates){
  if(!(file.endsWith('.sections.ts')||file.endsWith('-offer-package.ts')||file.endsWith('texas-shared-question-definitions.ts')))continue;
  if(file.includes(path.join('texas','contracts'))&&!file.includes('one-to-four-family-resale'))continue;
  const rel=path.relative(root,file).replaceAll('\\','/'),source=read(file),sf=ts.createSourceFile(file,source,99,true);
  function inspect(node){
   if(ts.isImportDeclaration(node)&&node.moduleSpecifier.text.includes('/legal-content/'))assert(reviewed.has(rel),'New versioned consumer needs a reviewed binding record: '+rel);
   if(ts.isStringLiteralLike(node)&&node.text.length>=80){const p=node.parent;
    if(ts.isPropertyAssignment(p)&&p.initializer===node&&['description','helpText','label'].includes(p.name.text)||ts.isCallExpression(p)&&p.arguments.includes(node)&&node.text.length>=100)throw Error('Long inline state wording must be versioned: '+rel);
   }
   ts.forEachChild(node,inspect);
  }inspect(sf);
 }
 return {texts,references,states:baseline.catalogs.length,consumers:baseline.consumers.length};
}
const result=audit();let negatives=0;
const catalog=baseline.catalogs[0],consumer=baseline.consumers.find(c=>c.module===catalog.file),catalogText=fs.readFileSync(path.join(root,catalog.file),'utf8'),consumerText=fs.readFileSync(path.join(root,consumer.file),'utf8');
function rejects(entries,message){assert.throws(()=>audit(new Map(entries)),undefined,message);negatives++;}
rejects([[catalog.file,catalogText.replace('Object.freeze(','Object.seal(')]],'Unfreezing old wording must fail');
rejects([[catalog.file,catalogText.replace('2026-10-25.ui-baseline.v1','2026-10-25.ui-baseline.v2')]],'Changing old revision must fail');
const first=Object.keys(catalog.entries)[0];rejects([[catalog.file,catalogText.replace(JSON.stringify(catalog.entries[first]),JSON.stringify(catalog.entries[first]+' Changed.'))]],'Changing one legal character must fail');
rejects([[consumer.file,consumerText.replace('offer-section-content.2026-10-25.v1','offer-section-content.2026-10-25.v2')]],'Repointing historical revision must fail');
rejects([[consumer.file,consumerText.replace('SECTION_LEGAL_CONTENT_20261025_V1[','SECTION_LEGAL_CONTENT_20261025_V1["missing" + ')]],'Dynamic/missing keys must fail');
rejects([[consumer.file,consumerText.replace('SECTION_LEGAL_CONTENT_20261025_V1[','"Inline fallback" || SECTION_LEGAL_CONTENT_20261025_V1[')]],'Changing assembly with identical bindings must fail');
rejects([[consumer.file,consumerText.replace(/import \{ SECTION_LEGAL_CONTENT_20261025_V1 \}[^\n]*\n/,'')]],'Removing version import must fail');
const futureFile='src/app/features/offers/states/'+catalog.state+'/questions/future-version.sections.ts';
rejects([[futureFile,'export const note = {helpText: '+JSON.stringify('New state legal guidance must be versioned and reviewed before it is introduced into an offer. Add a dated catalog.')+'};']],'New inline wording must fail');
rejects([[futureFile,consumerText]],'New content consumer without reviewed version binding must fail');
const crlf=new Map([[catalog.file,catalogText.replace(/\r?\n/g,'\r\n')],[consumer.file,consumerText.replace(/\r?\n/g,'\r\n')]]);assert.deepEqual(audit(crlf),result);
console.log(`PASS: ${result.texts} exact immutable text entries, ${result.references} version-pinned references, ${result.consumers} unchanged assemblies across ${result.states} states; ${negatives} negative controls and CRLF parity.`);
