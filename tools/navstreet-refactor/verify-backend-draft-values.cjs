const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');const assert=require('node:assert/strict');
const project=path.resolve(process.argv[2]||'.');
const ts=require(require.resolve('typescript',{paths:[path.join(project,'functions')]}));
const folder=path.join(project,'functions/src/offers/state-contracts');
const compile=source=>ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function load(source,dependencies={}){const module={exports:{}};vm.runInNewContext(compile(source),{module,exports:module.exports,require:name=>{
 if(!(name in dependencies))throw new Error(`Unexpected dependency ${name}`);return dependencies[name];
}});return module.exports;}
const shared=load(fs.readFileSync(path.join(folder,'draft-term-values.ts'),'utf8'));
const originals={"california": "const record = (v: unknown): Record<string, unknown> =>\n  v && typeof v === 'object' && !Array.isArray(v)\n    ? v as Record<string, unknown>\n    : {};\n\nconst text = (v: unknown, max = 5000) =>\n  typeof v === 'string' ? v.trim().slice(0, max) : '';\n\nconst money = (v: unknown) =>\n  Number.isSafeInteger(v) && Number(v) >= 0 ? Number(v) : 0;\n\nconst integer = (v: unknown) =>\n  Number.isSafeInteger(v) ? Number(v) : 0;\n\nconst bool = (v: unknown): boolean | null =>\n  typeof v === 'boolean' ? v : null;\n\nconst choice = <T extends string>(\n  v: unknown,\n  allowed: readonly T[],\n  fallback: T\n): T =>\n  typeof v === 'string' && allowed.includes(v as T)\n    ? v as T\n    : fallback;\n\n", "florida": "const record = (v: unknown): Record<string, unknown> =>\n  v && typeof v === 'object' && !Array.isArray(v)\n    ? v as Record<string, unknown>\n    : {};\n\nconst text = (v: unknown, max = 5000) =>\n  typeof v === 'string' ? v.trim().slice(0, max) : '';\n\nconst money = (v: unknown) =>\n  Number.isSafeInteger(v) && Number(v) >= 0 ? Number(v) : 0;\n\nconst integer = (v: unknown) =>\n  Number.isSafeInteger(v) ? Number(v) : 0;\n\nconst bool = (v: unknown): boolean | null =>\n  typeof v === 'boolean' ? v : null;\n\nconst choice = <T extends string>(\n  v: unknown,\n  allowed: readonly T[],\n  fallback: T\n): T =>\n  typeof v === 'string' && allowed.includes(v as T)\n    ? v as T\n    : fallback;\n\n", "south-carolina": "const record = (v: unknown): Record<string, unknown> =>\n  v && typeof v === 'object' && !Array.isArray(v)\n    ? v as Record<string, unknown>\n    : {};\n\nconst text = (v: unknown, max = 5000) =>\n  typeof v === 'string' ? v.trim().slice(0, max) : '';\n\nconst money = (v: unknown) =>\n  Number.isSafeInteger(v) && Number(v) >= 0 ? Number(v) : 0;\n\nconst integer = (v: unknown) =>\n  Number.isSafeInteger(v) ? Number(v) : 0;\n\nconst bool = (v: unknown): boolean | null =>\n  typeof v === 'boolean' ? v : null;\n\nconst choice = <T extends string>(\n  v: unknown,\n  allowed: readonly T[],\n  fallback: T\n): T =>\n  typeof v === 'string' && allowed.includes(v as T)\n    ? v as T\n    : fallback;\n\n", "utah": "const record = (v: unknown): Record<string, unknown> => v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {};\nconst text = (v: unknown, max = 5000) => typeof v === 'string' ? v.trim().slice(0, max) : '';\nconst money = (v: unknown) => Number.isSafeInteger(v) && Number(v) >= 0 ? Number(v) : 0;\nconst integer = (v: unknown) => Number.isSafeInteger(v) ? Number(v) : 0;\nconst bool = (v: unknown): boolean | null => typeof v === 'boolean' ? v : null;\nconst choice = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => typeof v === 'string' && allowed.includes(v as T) ? v as T : fallback;\n", "wisconsin": "const record = (v: unknown): Record<string, unknown> => v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {};\nconst text = (v: unknown, max = 5000) => typeof v === 'string' ? v.trim().slice(0, max) : '';\nconst money = (v: unknown) => Number.isSafeInteger(v) && Number(v) >= 0 ? Number(v) : 0;\nconst integer = (v: unknown) => Number.isSafeInteger(v) ? Number(v) : 0;\nconst bool = (v: unknown): boolean | null => typeof v === 'boolean' ? v : null;\nconst choice = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => typeof v === 'string' && allowed.includes(v as T) ? v as T : fallback;\n", "colorado": "const obj = (v: unknown): Record<string, unknown> => v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {};\nconst str = (v: unknown, n = 4000) => typeof v === 'string' ? v.trim().slice(0, n) : '';\nconst cash = (v: unknown) => Number.isSafeInteger(v) && Number(v) >= 0 ? Number(v) : 0;\nconst num = (v: unknown) => typeof v === 'number' && Number.isFinite(v) ? v : 0;\nconst flag = (v: unknown) => typeof v === 'boolean' ? v : null;\nconst select = <T extends string>(v: unknown, choices: readonly T[], fallback: T): T =>\n  typeof v === 'string' && choices.includes(v as T) ? v as T : fallback;\n\n", "louisiana": "const record = (v: unknown): Record<string, unknown> => v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {};\nconst text = (v: unknown, max = 4000) => typeof v === 'string' ? v.trim().slice(0, max) : '';\nconst money = (v: unknown) => Number.isSafeInteger(v) && Number(v) >= 0 ? Number(v) : 0;\nconst integer = (v: unknown) => Number.isSafeInteger(v) ? Number(v) : 0;\nconst percent = (v: unknown) => typeof v === 'number' && Number.isFinite(v) ? v : 0;\nconst bool = (v: unknown): boolean | null => typeof v === 'boolean' ? v : null;\nconst choice = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>\n  typeof v === 'string' && allowed.includes(v as T) ? v as T : fallback;\n\n", "oklahoma": "function record(value: unknown): Record<string, unknown> {\n  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};\n}\nfunction text(value: unknown, maximum: number): string {\n  return typeof value === 'string' ? value.trim().slice(0, maximum) : '';\n}\nfunction money(value: unknown): number {\n  return Number.isSafeInteger(value) && Number(value) >= 0 ? Number(value) : 0;\n}\nfunction integer(value: unknown): number {\n  return Number.isSafeInteger(value) ? Number(value) : 0;\n}\nfunction boolean(value: unknown): boolean { return value === true; }\nfunction nullableBoolean(value: unknown): boolean | null { return typeof value === 'boolean' ? value : null; }\nfunction arrayOfStrings(value: unknown): string[] {\n  return Array.isArray(value) ? [...new Set(value.filter(item => typeof item === 'string').map(item => item.trim()))] : [];\n}\nfunction choice<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {\n  return typeof value === 'string' && allowed.includes(value as T) ? value as T : fallback;\n}\n"};
const registry=require(path.join(project,'functions/lib/offers/state-contracts/state-contract-registry.js'));
const encode=value=>JSON.stringify(value,(_,v)=>v===undefined?'__undefined__':typeof v==='number'&&!Number.isFinite(v)?String(v):v);
const samples=[undefined,null,false,true,0,-1,1,1.5,Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER+1,NaN,Infinity,'',' true ','cash','conventional',' x '.repeat(3000),[],[' cash ','cash',true,' fha '],{}, {value:true}];
let scalarCount=0,sanitizerCount=0;
for(const [state,original] of Object.entries(originals)){
 const names=state==='oklahoma'?['record','text','money','integer','boolean','nullableBoolean','arrayOfStrings','choice']
  :state==='colorado'?['obj','str','cash','num','flag','select']
  :state==='louisiana'?['record','text','money','integer','percent','bool','choice']
  :['record','text','money','integer','bool','choice'];
 const old=load(original+'\nexport {'+names.join(',')+'};');
 const source=fs.readFileSync(path.join(folder,state,`${state}-draft-terms-sanitizer.ts`),'utf8');
 const dependencies=new Proxy({'../draft-term-values':shared},{has:()=>true,get:(object,name)=>
  name in object?object[name]:require(path.join(project,'functions/lib/offers/state-contracts',state,name))});
 const current=load(source+'\nexport {'+names.join(',')+'};',dependencies);
 for(const value of samples){
  for(const name of names){
   if(name==='text'||name==='str'){
    for(const limit of [undefined,0,10,4000,5000]){assert.equal(current[name](value,limit),old[name](value,limit));scalarCount++;}
   }else if(name==='choice'||name==='select'){
    assert.equal(current[name](value,['cash','conventional'],'cash'),old[name](value,['cash','conventional'],'cash'));scalarCount++;
   }else{assert.equal(encode(current[name](value)),encode(old[name](value)),`${state} ${name}`);scalarCount++;}
  }
 }
 const functionFrom=source.indexOf('export function sanitize');
 const header=source.slice(0,functionFrom).replace(/import [^\r\n]+ from '\.\.\/draft-term-values';/, '')
  .replace(/const (?:text|str) =[\s\S]*/, '');
 const legacySource=state==='oklahoma'
  ? source.replace(/import [^\r\n]+ from '\.\.\/draft-term-values';/, '').split('\nfunction text(')[0]+'\n'+original
  : header+original+source.slice(functionFrom);
 const legacy=load(legacySource,dependencies);
 const name=Object.keys(current).find(key=>key.startsWith('sanitize'));
 const code={california:'CA',florida:'FL','south-carolina':'SC',utah:'UT',wisconsin:'WI',colorado:'CO',louisiana:'LA',oklahoma:'OK'}[state];
 const pkg=registry.requireStateContractPackage(code);
 const party=role=>({partyUid:role,userUid:role,role,capacity:'individual',firstName:'Sample',lastName:role,legalName:'Sample '+role,email:role+'@example.com',phone:'9195550100',mailingAddress:{addressLine1:'100 Sample',city:'City',state:code,zipCode:'00000',country:'US'},sequence:1,primaryParty:true,requiredSigner:true,identityVerification:{status:'not_started'},signature:{status:'pending'}});
 const property={listingUid:'sample',addressLine1:'100 Sample',city:'City',state:code,zipCode:'00000',county:'County',legalDescription:'Trusted lot',propertyType:'single_family',yearBuilt:2000,listPriceInCents:35000000};
 const currentTerms=pkg.createInitialOfferTerms({contractType:pkg.contractTypes[0],property,buyer:party('buyer'),seller:party('seller'),listingData:{sellerStatements:{ownershipStatus:'owned_at_least_one_year',fuelTankPresent:false,leadBasedPaintApplies:false,ownersAssociationApplies:false,leasesExist:false},southCarolinaReadiness:{},coloradoPropertyFacts:{}}});
 function fill(value,replacement){if(Array.isArray(value))return value.map(item=>fill(item,replacement));if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,fill(item,replacement)]));return replacement;}
 const requests=[undefined,null,[],{},...samples.map(value=>fill(currentTerms,value)),currentTerms];
 if(state==='oklahoma') {
  const documents={contractDocuments:[' proof_of_funds ','proof_of_funds','unknown',true,'single_family_hoa']};
  requests.push(documents);
  assert.equal(encode(pkg.sanitizeDraftTerms({currentTerms,requestedTerms:documents,initiatedBy:'buyer'}).contractDocuments),
   encode(['proof_of_funds','single_family_hoa']));
 }
 for(const initiatedBy of ['buyer','seller'])for(const requestedTerms of requests){
  const input={currentTerms,requestedTerms,initiatedBy};const before=encode(input);
  const expected=legacy[name](input);
  assert.equal(encode(current[name](input)),encode(expected),`${code} ${initiatedBy} source parity`);
  assert.equal(encode(pkg.sanitizeDraftTerms(input)),encode(expected),`${code} ${initiatedBy} compiled package parity`);
  assert.equal(encode(input),before,`${code} input retention`);sanitizerCount++;
 }
}
let boundaryCount=0;
for(const code of ['NC','TX']) {
 const pkg=registry.requireStateContractPackage(code);
 const party=role=>({partyUid:role,userUid:role,role,capacity:'individual',firstName:'Sample',lastName:role,
  legalName:'Sample '+role,email:role+'@example.com',phone:'9195550100',
  mailingAddress:{addressLine1:'100 Sample',city:'City',state:code,zipCode:'00000',country:'US'},
  sequence:1,primaryParty:true,requiredSigner:true,identityVerification:{status:'not_started'},signature:{status:'pending'}});
 const property={listingUid:'sample',addressLine1:'100 Trusted',city:'City',state:code,zipCode:'00000',county:'County',
  legalDescription:'Trusted lot',propertyType:'single_family',yearBuilt:2000,listPriceInCents:35000000};
 const currentTerms=pkg.createInitialOfferTerms({contractType:pkg.contractTypes[0],property,buyer:party('buyer'),seller:party('seller'),
  listingData:{sellerStatements:{ownershipStatus:'owned_at_least_one_year',fuelTankPresent:false,leadBasedPaintApplies:false,
   ownersAssociationApplies:false,leasesExist:false}}});
 const clone=value=>JSON.parse(JSON.stringify(value));
 const sanitize=(requestedTerms,initiatedBy='buyer')=>pkg.sanitizeDraftTerms({currentTerms,requestedTerms,initiatedBy});
 if(code==='NC') {
  for(const initiatedBy of ['buyer','seller']) {
   const request=clone(currentTerms);
   request.stateCode='OTHER';request.property={listingUid:'attacker'};
   request.deposits.dueDiligenceEndTime='09:00';
   request.delivery={...request.delivery,timeZone:'UTC',buyerDeliveryEmail:'attacker@example.com',sellerDeliveryEmail:'attacker@example.com'};
   request.sellerStatements={attacker:true};request.buyerDisclosures={attacker:true};
   const before=encode(request);const result=sanitize(request,initiatedBy);
   assert.equal(result.stateCode,'NC');assert.deepEqual(result.property,clone(currentTerms.property));
   assert.equal(result.deposits.dueDiligenceEndTime,'17:00');
   assert.equal(result.delivery.timeZone,'America/New_York');
   assert.equal(result.delivery.buyerDeliveryEmail,currentTerms.delivery.buyerDeliveryEmail);
   assert.equal(result.delivery.sellerDeliveryEmail,currentTerms.delivery.sellerDeliveryEmail);
   const protectedField=initiatedBy==='buyer'?'sellerStatements':'buyerDisclosures';
   assert.deepEqual(result[protectedField],clone(currentTerms[protectedField]));
   assert.equal(encode(request),before);boundaryCount++;
  }
  for(const request of [undefined,null,[],true,'text']) {
   assert.throws(()=>sanitize(request),{code:'invalid-argument',message:'Offer terms must be an object.'});boundaryCount++;
  }
  for(const [field,message] of [['deposits','Deposit terms must be an object.'],['delivery','Delivery terms must be an object.']])
   for(const value of [undefined,null,[],false]) {
    const request=clone(currentTerms);request[field]=value;
    assert.throws(()=>sanitize(request),{code:'invalid-argument',message});boundaryCount++;
   }
  for(const key of ['__proto__','prototype','constructor']) {
   const request=clone(currentTerms);request.extra=[JSON.parse(`{"${key}":{"changed":true}}`)];
   assert.throws(()=>sanitize(request),{code:'invalid-argument',message:'The offer changes contain an invalid field.'});boundaryCount++;
  }
  const circular=clone(currentTerms);circular.extra=circular;
  assert.throws(()=>sanitize(circular),{code:'invalid-argument',message:'The offer terms could not be processed.'});boundaryCount++;
 } else {
  currentTerms.salesPrice.salesPriceInCents=35000000;
  currentTerms.delivery.electronicDeliveryAuthorized=true;
  for(const initiatedBy of ['buyer','seller']) {
   for(const value of samples) {
    const request={stateCode:'OTHER',contractType:'other',property:{listingUid:'attacker'},form:{version:'other'},
     salesPrice:{salesPriceInCents:value},delivery:{timeZone:'UTC',electronicDeliveryAuthorized:value}};
    const before=encode(request);const result=sanitize(request,initiatedBy);
    assert.equal(result.stateCode,currentTerms.stateCode);assert.equal(result.contractType,currentTerms.contractType);
    assert.deepEqual(result.property,currentTerms.property);assert.deepEqual(result.form,currentTerms.form);
    assert.equal(result.delivery.timeZone,currentTerms.delivery.timeZone);
    assert.equal(result.salesPrice.salesPriceInCents,
     typeof value==='number'&&Number.isInteger(value)&&value>=0?value:35000000);
    assert.equal(result.delivery.electronicDeliveryAuthorized,
     typeof value==='boolean'||value===null?value:true);
    assert.equal(encode(request),before);boundaryCount++;
   }
   for(const request of [undefined,null,[],{}, {salesPrice:{}}, {salesPrice:'invalid'}]) {
    assert.equal(sanitize(request,initiatedBy).salesPrice.salesPriceInCents,35000000);boundaryCount++;
   }
   const result=sanitize({salesPrice:{financingAddenda:['third_party_financing','third_party_financing','unknown',' third_party_financing ']}},initiatedBy);
   assert.deepEqual(result.salesPrice.financingAddenda,['third_party_financing']);boundaryCount++;
  }
 }
}
console.log(`PASS: ${boundaryCount} NC/TX compiled sanitizer boundary cases; trusted values, role-specific snapshots, malformed inputs and distinct numeric/boolean behavior preserved.`);
console.log(`PASS: ${scalarCount} backend scalar conversions and ${sanitizerCount} eight-state buyer/seller sanitizer comparisons; compiled package wiring and input retention preserved.`);
