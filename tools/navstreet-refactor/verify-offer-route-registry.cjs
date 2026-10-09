const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');const assert=require('node:assert/strict');
const project=path.resolve(process.argv[2]||'.');const ts=require(require.resolve('typescript',{paths:[project]}));
const filename=path.join(project,'src/app/features/offers/engine/state-offer-registry.ts');
const source=fs.readFileSync(filename,'utf8');const moduleOut={exports:{}};
vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module:moduleOut,exports:moduleOut.exports});
const registry=moduleOut.exports;let cases=0;
for(const code of ['NC','TX','OK','UT','WI','FL','LA','CO','CA','SC','XX',''])
 for(const state of [code,code.toLowerCase(),' '+code.toLowerCase()+' ']) {
  const version=['UT','WI','FL','LA','CO','CA','SC'].includes(code);
  const newPath=version?['/listings','listing','offers','new']:['/listings','listing','offer'];
  const editPath=version?{path:['/offers','offer','versions','version','edit']}:
    {path:['/listings','listing','offer'],queryParams:{offerUid:'offer',offerVersionUid:'version'}};
  assert.equal(JSON.stringify(registry.newOfferPath(state,'listing')),JSON.stringify(newPath));
  assert.equal(JSON.stringify(registry.editOfferPath(state,'listing','offer','version')),JSON.stringify(editPath));cases+=2;
 }
assert.equal(registry.getEnabledStateOfferRegistration('XX'),null);
console.log(`PASS: ${cases} offer route comparisons; ten states, normalized codes, unknown-state fallback and legacy edit query parameters preserved.`);
