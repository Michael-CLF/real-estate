const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');const assert=require('node:assert/strict');
const project=path.resolve(process.argv[2]||'.');const functionsProject=path.join(project,'functions');
const ts=require(require.resolve('typescript',{paths:[functionsProject]}));
const {FieldValue,Timestamp}=require(require.resolve('firebase-admin/firestore',{paths:[functionsProject]}));
const {removeUndefinedValues}=require(path.join(functionsProject,'lib/offers/draft-value-cleanup.js'));
const originals={"create-offer-draft": "function removeUndefinedValues<T>(value: T): T {\n  if (Array.isArray(value)) {\n    return value.map((item) => removeUndefinedValues(item)) as T;\n  }\n\n  if (\n    value !== null &&\n    typeof value === 'object' &&\n    !(value instanceof Timestamp) &&\n    !(value instanceof FieldValue)\n  ) {\n    return Object.fromEntries(\n      Object.entries(value as Record<string, unknown>)\n        .filter(([, nestedValue]) => nestedValue !== undefined)\n        .map(([key, nestedValue]) => [key, removeUndefinedValues(nestedValue)]),\n    ) as T;\n  }\n\n  return value;\n}", "save-offer-draft": "function removeUndefinedValues<T>(\n  value: T\n): T {\n  if (Array.isArray(value)) {\n    return value.map(\n      item =>\n        removeUndefinedValues(item)\n    ) as T;\n  }\n\n  if (\n    value !== null &&\n    typeof value === 'object' &&\n    !(value instanceof Timestamp) &&\n    !(value instanceof FieldValue)\n  ) {\n    return Object.fromEntries(\n      Object.entries(\n        value as Record<string, unknown>\n      )\n        .filter(\n          ([, nestedValue]) =>\n            nestedValue !== undefined\n        )\n        .map(\n          ([key, nestedValue]) => [\n            key,\n            removeUndefinedValues(\n              nestedValue\n            ),\n          ]\n        )\n    ) as T;\n  }\n\n  return value;\n}", "create-counteroffer": "function removeUndefinedValues<T>(\n  value: T\n): T {\n  if (Array.isArray(value)) {\n    return value.map(\n      item =>\n        removeUndefinedValues(item)\n    ) as T;\n  }\n\n  if (\n    value !== null &&\n    typeof value === 'object' &&\n    !(value instanceof Timestamp) &&\n    !(value instanceof FieldValue)\n  ) {\n    return Object.fromEntries(\n      Object.entries(\n        value as Record<string, unknown>\n      )\n        .filter(\n          ([, nestedValue]) =>\n            nestedValue !== undefined\n        )\n        .map(\n          ([key, nestedValue]) => [\n            key,\n            removeUndefinedValues(\n              nestedValue\n            )\n          ]\n        )\n    ) as T;\n  }\n\n  return value;\n}", "state-contracts/north-carolina/north-carolina-draft-terms-sanitizer": "function removeUndefinedValues<T>(\r\n  value: T\r\n): T {\r\n  if (Array.isArray(value)) {\r\n    return value.map(\r\n      item =>\r\n        removeUndefinedValues(\r\n          item\r\n        )\r\n    ) as T;\r\n  }\r\n\r\n  if (\r\n    value !== null &&\r\n    typeof value === 'object' &&\r\n    !(value instanceof Timestamp) &&\r\n    !(value instanceof FieldValue)\r\n  ) {\r\n    return Object.fromEntries(\r\n      Object.entries(\r\n        value as\r\n          Record<string, unknown>\r\n      )\r\n        .filter(\r\n          ([, nestedValue]) =>\r\n            nestedValue !==\r\n              undefined\r\n        )\r\n        .map(\r\n          ([\r\n            key,\r\n            nestedValue,\r\n          ]) => [\r\n            key,\r\n            removeUndefinedValues(\r\n              nestedValue\r\n            ),\r\n          ]\r\n        )\r\n    ) as T;\r\n  }\r\n\r\n  return value;\r\n}"};
const stamp=Timestamp.fromDate(new Date('2026-10-09T12:00:00Z'));
const sentinel=FieldValue.serverTimestamp();
const array=[undefined,null,false,0,'',stamp,sentinel,{missing:undefined,kept:false}];
const inputs=[undefined,null,false,true,0,'',stamp,sentinel,array,{missing:undefined,kept:null},
 {buyers:[{signature:{status:'not_started',providerEnvelopeUid:undefined},electronicTransactionsConsentAccepted:false,electronicTransactionsConsentAcceptedAt:undefined,createdAt:stamp}],
 terms:{delivery:{expiresAt:'',electronicDeliveryAuthorized:false},nested:{missing:undefined,zero:0,empty:''}},updatedAt:sentinel},
 {outer:{array,missing:undefined,stamp,sentinel}}];
let comparisons=0;
for(const [name,source] of Object.entries(originals)) {
 const module={exports:{}};vm.runInNewContext(ts.transpileModule('export '+source,
  {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,
  {module,exports:module.exports,FieldValue,Timestamp});
 const old=module.exports.removeUndefinedValues;
 const normalize=value=>{
  if(value===stamp)return '__timestamp_identity__';if(value===sentinel)return '__sentinel_identity__';
  if(value===undefined)return '__undefined__';if(Array.isArray(value))return Array.from(value,normalize);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,normalize(item)]));return value;
 };
 for(const value of inputs){const before=normalize(value);const actual=removeUndefinedValues(value);
  assert.deepEqual(normalize(actual),normalize(old(value)),name);assert.deepEqual(normalize(value),before);comparisons++;
 }
 const originalFile=fs.readFileSync(path.join(functionsProject,'src/offers',name+'.ts'),'utf8');
 const importPath = name.startsWith('state-contracts/') ? '../../draft-value-cleanup' : './draft-value-cleanup';
 assert(originalFile.includes(`import { removeUndefinedValues } from '${importPath}';`));
 assert(!originalFile.includes('function removeUndefinedValues'));
}
const result=removeUndefinedValues({array,stamp,sentinel,missing:undefined});
assert.equal(result.stamp,stamp);assert.equal(result.sentinel,sentinel);assert.equal(result.array.length,array.length);
assert.equal(0 in result.array,true);assert.equal(result.array[0],undefined);assert.equal('missing' in result,false);
assert.equal(result.array[5],stamp);assert.equal(result.array[6],sentinel);
assert.notEqual(result.array,array);assert.notEqual(result.array[7],array[7]);
assert.equal(result.array[7].kept,false);assert.equal('missing' in result.array[7],false);
console.log(`PASS: ${comparisons} draft-create/save/counteroffer/NC-sanitizer cleanup comparisons; Firestore identity, array entries, false/null/zero values and source retention preserved.`);
