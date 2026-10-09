const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');const assert=require('node:assert/strict');
const project=path.resolve(process.argv[2]||'.');const functionsProject=path.join(project,'functions');
const ts=require(require.resolve('typescript',{paths:[functionsProject]}));
const https=require(require.resolve('firebase-functions/v2/https',{paths:[functionsProject]}));
const folder=path.join(functionsProject,'src/offers/state-contracts');
function load(source,dependencies={}){const module={exports:{}};vm.runInNewContext(ts.transpileModule(source,
 {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,
 {module,exports:module.exports,require:name=>{if(name==='firebase-functions/v2/https')return https;
 if(name in dependencies)return dependencies[name];throw new Error(`Unexpected dependency ${name}`);}});return module.exports;}
const shared=load(fs.readFileSync(path.join(folder,'submission-values.ts'),'utf8'));
const parties=load(fs.readFileSync(path.join(folder,'submission-parties.ts'),'utf8'),{'./submission-values':shared});
const originalPartyBlock="  requireValue(version.buyers.length > 0 && version.sellers.length > 0, 'Both parties must be identified.');\n  for (const party of [...version.buyers, ...version.sellers]) {\n    requireValue(party.legalName?.trim(), 'Every party needs a legal name.');\n    requireValue(/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(party.email?.trim() ?? ''), 'Every party needs a contact email.');\n    requireValue(party.phone?.trim(), 'Every party needs a phone number.');\n  }\n  const initiatingSide = version.initiatedBy === 'buyer' ? version.buyers : version.sellers;\n  const initiator = initiatingSide.find(party => party.userUid === version.initiatedByUid);\n  requireValue(initiator?.identityVerification.status === 'verified', 'The initiating signer must verify identity.');\n";
const originals={"utah": "const requireValue = (condition: unknown, message: string): void => { if (!condition) throw new HttpsError('failed-precondition', message); };\nconst money = (n: number, positive = false) => Number.isSafeInteger(n) && (positive ? n > 0 : n >= 0);\nconst date = (s: string) => /^\\d{4}-\\d{2}-\\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T12:00:00Z`));\n", "wisconsin": "const requireValue = (condition: unknown, message: string): void => { if (!condition) throw new HttpsError('failed-precondition', message); };\nconst money = (n: number, positive = false) => Number.isSafeInteger(n) && (positive ? n > 0 : n >= 0);\nconst date = (s: string) => /^\\d{4}-\\d{2}-\\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T12:00:00Z`));\n", "florida": "const requireValue = (condition: unknown, message: string): void => { if (!condition) throw new HttpsError('failed-precondition', message); };\nconst money = (n: number, positive = false) => Number.isSafeInteger(n) && (positive ? n > 0 : n >= 0);\nconst days = (n: number, min: number, max: number) => Number.isSafeInteger(n) && n >= min && n <= max;\nconst date = (s: string) => /^\\d{4}-\\d{2}-\\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T12:00:00Z`));\n", "louisiana": "const requireValue = (ok: unknown, message: string): void => { if (!ok) throw new HttpsError('failed-precondition', message); };\nconst money = (v: number, positive = false) => Number.isSafeInteger(v) && (positive ? v > 0 : v >= 0);\nconst days = (v: number, min: number, max: number) => Number.isSafeInteger(v) && v >= min && v <= max;\nconst date = (v: string) => /^\\d{4}-\\d{2}-\\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T12:00:00Z`));\n\n"};
const registry=require(path.join(functionsProject,'lib/offers/state-contracts/state-contract-registry.js'));
const outcome=run=>{try{run();return null;}catch(error){return {code:error.code,message:error.message};}};
let primitiveCount=0,validatorCount=0;
for(const [state,original] of Object.entries(originals)){
 const names=state==='florida'||state==='louisiana'?['requireValue','money','days','date']:['requireValue','money','date'];
 const old=load("import { HttpsError } from 'firebase-functions/v2/https';\n"+original+'\nexport {'+names.join(',')+'};');
 for(const value of [undefined,null,false,true,0,-1,1,1.5,30,60,Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER+1,NaN,Infinity,'1']) {
  for(const positive of [undefined,false,true]){assert.equal(shared.money(value,positive),old.money(value,positive));primitiveCount++;}
  if(old.days)for(const [min,max] of [[0,30],[1,60],[-5,5]]){assert.equal(shared.days(value,min,max),old.days(value,min,max));primitiveCount++;}
  assert.deepEqual(outcome(()=>shared.requireValue(value,'Original message.')),outcome(()=>old.requireValue(value,'Original message.')));primitiveCount++;
 }
 for(const value of [undefined,null,'','2026-10-09','2026-02-31','2026-02-29','2028-02-29','2026-13-01','10/09/2026','2026-1-01',' 2026-10-09 ']){
  assert.equal(shared.date(value),old.date(value));primitiveCount++;
 }
 const source=fs.readFileSync(path.join(folder,state,`${state}-submission-validator.ts`),'utf8');
 const current=load(source,{'../submission-values':shared,'../submission-parties':parties});
 const legacySource=source.replace(/import [^\r\n]+ from '\.\.\/submission-values';/,original)
  .replace(/import [^\r\n]+ from '\.\.\/submission-parties';/, '')
  .replace('  validateSubmissionParties(version);', originalPartyBlock);
 const legacy=load("import { HttpsError } from 'firebase-functions/v2/https';\n"+legacySource);

 const name=Object.keys(current)[0];const code={utah:'UT',wisconsin:'WI',florida:'FL',louisiana:'LA'}[state];
 const pkg=registry.requireStateContractPackage(code);
 const party=role=>({partyUid:role,userUid:role,role,capacity:'individual',legalName:'Sample '+role,email:role+'@example.com',phone:'9195550100',
  mailingAddress:{addressLine1:'100 Sample',city:'City',state:code,zipCode:'00000',country:'US'},sequence:1,primaryParty:true,requiredSigner:true,
  identityVerification:{status:'verified'},signature:{status:'pending'}});
 const terms=pkg.createInitialOfferTerms({contractType:pkg.contractTypes[0],
  property:{listingUid:'listing',addressLine1:'100 Sample',city:'City',state:code,zipCode:'00000',county:'County',legalDescription:'Trusted lot',propertyType:'single_family',yearBuilt:2000,listPriceInCents:35000000},
  buyer:party('buyer'),seller:party('seller'),listingData:{sellerStatements:{ownershipStatus:'owned_at_least_one_year',fuelTankPresent:false,leadBasedPaintApplies:false,ownersAssociationApplies:false,leasesExist:false}}});
 const base={offer:{Uid:'offer',stateCode:code,currentVersionUid:'version',listingUid:'listing'},
  version:{Uid:'version',offerUid:'offer',stateCode:code,status:'draft',immutable:false,terms,buyers:[party('buyer')],sellers:[party('seller')],
   initiatedBy:'buyer',initiatedByUid:'buyer',expiresAt:'2030-01-01T12:00:00Z'}};
 const compare=input=>{const expected=outcome(()=>legacy[name](input));assert.deepEqual(outcome(()=>current[name](input)),expected);
  assert.deepEqual(outcome(()=>pkg.validateSubmission(input)),expected);validatorCount++;};
 for(const initiatedBy of ['buyer','seller']) {
  const input=structuredClone(base);input.version.initiatedBy=initiatedBy;input.version.initiatedByUid=initiatedBy;compare(input);
  for(const change of [v=>v.offer.stateCode='OTHER',v=>v.version.stateCode='OTHER',v=>v.version.terms.stateCode='OTHER',
   v=>v.offer.currentVersionUid='other',v=>v.version.immutable=true,v=>v.version.status='submitted',
   v=>v.version.buyers=[],v=>v.version.sellers=[],v=>v.version.buyers[0].legalName='',
   v=>v.version.sellers[0].email='bad',v=>v.version.buyers[0].identityVerification.status='not_started',
   v=>v.version.terms.property.listingUid='other',v=>v.version.terms.legalDescription='']) {
   const changed=structuredClone(input);change(changed);compare(changed);
  }
 }
}
const oldParties=load("import { requireValue } from './submission-values';\n"+'export function validate(version) {\n'+originalPartyBlock+'\n}',{'./submission-values':shared});
let partyCount=0;
const verified=(userUid='buyer')=>({userUid,legalName:'Valid Name',email:'valid@example.com',phone:'123',identityVerification:{status:'verified'}});
const checkParties=version=>{assert.deepEqual(outcome(()=>parties.validateSubmissionParties(version)),outcome(()=>oldParties.validate(version)));partyCount++;};
for(const initiatedBy of ['buyer','seller']) {
 const base={buyers:[verified('buyer')],sellers:[verified('seller')],initiatedBy,initiatedByUid:initiatedBy};
 checkParties(base);
 for(const side of ['buyers','sellers'])for(const field of ['legalName','email','phone'])
  for(const value of [undefined,null,'','   ',' valid@example.com ','name','123']) {
   const input=structuredClone(base);input[side][0][field]=value;checkParties(input);
  }
 for(const side of ['buyers','sellers']){const input=structuredClone(base);input[side]=[];checkParties(input);}
 for(const status of ['not_started','pending','verified']) {
  const input=structuredClone(base);input[initiatedBy==='buyer'?'buyers':'sellers'][0].identityVerification.status=status;checkParties(input);
 }
 const unknown=structuredClone(base);unknown.initiatedByUid='unknown';checkParties(unknown);
 const duplicates=structuredClone(base);const side=initiatedBy==='buyer'?'buyers':'sellers';
 duplicates[side]=[{...verified(initiatedBy),identityVerification:{status:'not_started'}},verified(initiatedBy)];
 checkParties(duplicates);
 assert.deepEqual(outcome(()=>parties.validateSubmissionParties(duplicates)),
  {code:'failed-precondition',message:'The initiating signer must verify identity.'});
}
console.log(`PASS: ${partyCount} party-validation comparisons; missing contacts, both initiating sides and first-match identity behavior preserved.`);
console.log(`PASS: ${primitiveCount} submission utility comparisons and ${validatorCount} four-state validator/package comparisons; existing dates, errors and check order preserved.`);
