const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const project=path.resolve(process.argv[2]||'.'),ts=require(require.resolve('typescript',{paths:[path.join(project,'functions')]})),olds=require('./fixtures/term-updater-originals.json');
function compile(source,requireFn=()=>{throw Error('Unexpected import');}){const mod={exports:{}};vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module:mod,exports:mod.exports,require:requireFn});return mod.exports;}
const update=compile(fs.readFileSync(path.join(project,'src/app/features/offers/engine/offer-term-path.ts'),'utf8')).updatePath;
const norm=x=>JSON.stringify(x);let cases=0;
for(const [slug,source]of Object.entries(olds)){
 const previous=compile(source),current=compile(fs.readFileSync(path.join(project,'src/app/features/offers/states/'+slug+'/services/'+slug+'-offer-terms-updater.ts'),'utf8'),()=>({updatePath:update}));
 const name=Object.keys(previous)[0];
 for(const root of [undefined,null,{}, {purchase:{keep:'retained',flag:false},conditions:{flag:null}}, {purchase:[],conditions:[]}, {purchase:{nested:{keep:1}}}])
  for(const field of ['purchase.hasEarnestMoney','purchase.nested.flag','conditions.flag','__proto__.bad','purchase.__proto__.bad','missing.flag','purchase..bad',''])
   for(const value of [undefined,null,false,true,'false','true',0,150,'sample']){
    const evaluate=fn=>{const input=root===undefined?root:JSON.parse(JSON.stringify(root));const before=norm(input);try{const result=fn(input,field,value);assert.equal(norm(input),before);return ['ok',norm(result)];}catch(e){return ['error',e.message];}};
    assert.deepEqual(evaluate(current[name]),evaluate(previous[name]),slug+' '+field);cases++;
   }
}
const {formatTimestamp}=require(path.join(project,'functions/lib/offers/state-contracts/property-time-format.js'));
const old=(date,timeZone)=>date?new Intl.DateTimeFormat('en-US',{timeZone,year:'numeric',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'}).format(date):'';
let timestamps=0;for(const date of [undefined,new Date('2026-01-01T01:00:00Z'),new Date('2026-07-01T01:00:00Z'),new Date('2026-11-01T06:30:00Z'),new Date(NaN)])for(const zone of ['UTC','America/Chicago','America/Denver','America/New_York','invalid']){
 const run=fn=>{try{return ['ok',fn(date,zone)];}catch(e){return ['error',e.message];}};assert.deepEqual(run(formatTimestamp),run(old));timestamps++;
}
console.log('PASS: '+cases+' six-state complete updater comparisons, immutable inputs, root/path guards and boolean conversions; '+timestamps+' property-time/DST/error formatting comparisons.');
