const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const project = path.resolve(process.argv[2] || '.');
const ts = require(require.resolve('typescript', { paths: [project,path.join(project,'functions')] }));
const compile = source => ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function load(source) {const module={exports:{}};vm.runInNewContext(compile(source),{module,exports:module.exports});return module.exports;}
const frontPath=path.join(project,'src/app/features/offers/engine/state-offer-registry.ts');
const frontSource=fs.readFileSync(frontPath,'utf8');
const frontend=load(frontSource);
const backend=require(path.join(project,'functions/lib/offers/state-contracts/state-contract-registry.js'));
const states={NC:'north-carolina',TX:'texas',OK:'oklahoma',UT:'utah',WI:'wisconsin',FL:'florida',LA:'louisiana',CO:'colorado',CA:'california',SC:'south-carolina'};
function stringsForProperty(source,property) {
 const values=[];const tree=ts.createSourceFile('file.ts',source,ts.ScriptTarget.Latest,true);
 function visit(node){if(ts.isPropertyAssignment(node)&&node.name.getText(tree).replace(/['"]/g,'')===property&&ts.isStringLiteral(node.initializer))values.push(node.initializer.text);ts.forEachChild(node,visit);}visit(tree);return values;
}
const tree=ts.createSourceFile(frontPath,frontSource,ts.ScriptTarget.Latest,true);let loaders=0;
function checkImports(node){if(ts.isCallExpression(node)&&node.expression.kind===ts.SyntaxKind.ImportKeyword){const target=node.arguments[0];assert(ts.isStringLiteral(target));assert(fs.existsSync(path.resolve(path.dirname(frontPath),target.text+'.ts')),`Missing offer component ${target.text}`);loaders++;}ts.forEachChild(node,checkImports);}checkImports(tree);assert.equal(loaders,12);
const templateIds=new Set();
for(const [code,folder] of Object.entries(states)) {
 const front=frontend.getEnabledStateOfferRegistration(' '+code.toLowerCase()+' ');
 const registration=backend.getStateContractRegistration(code);
 const pkg=backend.requireEnabledStateContractPackage(code);
 assert(front,`${code}: frontend registration missing`);assert.equal(front.stateCode,code);
 assert.equal(front.offerCreationEnabled,registration.offerCreationEnabled);
 assert.equal(pkg.stateCode,code);assert.equal(pkg.agreementTemplate.stateCode,code);
 assert(pkg.agreementTemplate.templateUid);assert(pkg.agreementTemplate.templateVersion);
 assert(!templateIds.has(pkg.agreementTemplate.templateUid),'Duplicate agreement template identity');templateIds.add(pkg.agreementTemplate.templateUid);
 for(const hook of ['createInitialOfferTerms','sanitizeDraftTerms','validateSubmission','createContractMilestones','generateAgreement','getAgreementSummary'])assert.equal(typeof pkg[hook],'function',`${code}: missing ${hook}`);
 const packageFile=path.join(project,'functions/src/offers/state-contracts',folder,folder+'-state-contract.package.ts');
 const packageSource=fs.readFileSync(packageFile,'utf8');
 const pdfPaths=[...packageSource.matchAll(/require\(['"]([^'"]*pdf[^'"]*)['"]\)/g)].map(match=>match[1]);
 assert.equal(pdfPaths.length,1,`${code}: PDF must have one lazy module`);
 assert(fs.existsSync(path.resolve(path.dirname(packageFile),pdfPaths[0]+'.ts')),`${code}: PDF module missing`);
 if(code!=='NC') {
  const modelFile=path.join(project,'src/app/core/domains/offers/state-contracts',folder,'models',code==='TX'?'texas-contract-type.model.ts':folder+'-offer-terms.model.ts');
  const model=fs.readFileSync(modelFile,'utf8');
  const contractTypes=stringsForProperty(model,'contractType');
  for(const type of pkg.contractTypes)assert(contractTypes.includes(type),`${code}: frontend contract definition missing ${type}`);
  if(code==='CA')assert.equal(stringsForProperty(model,'formId')[0],pkg.agreementTemplate.templateUid);
 }
 console.log(`${code}: registration, contract selection, backend hooks and PDF wiring verified (${pkg.agreementTemplate.templateVersion}).`);
}
assert.equal(frontend.getEnabledStateOfferRegistration('XX'),null);
assert.throws(()=>backend.requireEnabledStateContractPackage('XX'),/not yet available/);
console.log('PASS: ten-state contract integration; launch registration, contract selection, unique template identities, backend hooks, lazy PDF wiring and unknown-state rejection.');
