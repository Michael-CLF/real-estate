const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');const assert=require('node:assert/strict');
const project=path.resolve(process.argv[2]||'.');const functionsProject=path.join(project,'functions');
const ts=require(require.resolve('typescript',{paths:[functionsProject]}));
const {FieldValue,Timestamp}=require(require.resolve('firebase-admin/firestore',{paths:[functionsProject]}));
const {removeUndefinedValues}=require(path.join(functionsProject,'lib/offers/draft-value-cleanup.js'));
const current=require(path.join(functionsProject,'lib/offers/counteroffer-draft-data.js'));
const registry=require(path.join(functionsProject,'lib/offers/state-contracts/state-contract-registry.js'));
const original="function resetPartySignatures(\n  parties:\n    OfferVersionPartySnapshotDocument[]\n): OfferVersionPartySnapshotDocument[] {\n  return parties.map(\n    party =>\n      removeUndefinedValues({\n        ...party,\n\n        signature: {\n          status:\n            'not_started'\n        },\n\n        electronicTransactionsConsentAccepted:\n          false,\n\n        electronicTransactionsConsentAcceptedAt:\n          undefined\n      }) as\n      OfferVersionPartySnapshotDocument\n  );\n}\n\n\nfunction createCounterofferTerms(\n  sourceTerms: OfferTermsDocument\n): OfferTermsDocument {\n  const terms =\n    clonePlainValue(\n      sourceTerms\n    );\n\n  return {\n    ...terms,\n\n    delivery: {\n      ...terms.delivery,\n\n      expiresAt: '',\n\n      electronicDeliveryAuthorized:\n        false\n    }\n  };\n}\n\n\nfunction clonePlainValue<T>(\n  value: T\n): T {\n  if (Array.isArray(value)) {\n    return value.map(\n      item =>\n        clonePlainValue(item)\n    ) as T;\n  }\n\n  if (\n    value !== null &&\n    typeof value === 'object' &&\n    !(value instanceof Timestamp) &&\n    !(value instanceof FieldValue)\n  ) {\n    return Object.fromEntries(\n      Object.entries(\n        value as Record<string, unknown>\n      ).map(\n        ([key, nestedValue]) => [\n          key,\n          clonePlainValue(\n            nestedValue\n          )\n        ]\n      )\n    ) as T;\n  }\n\n  return value;\n}\n\n\n";
const moduleObject={exports:{}};vm.runInNewContext(ts.transpileModule(original
 .replace('function resetPartySignatures(','export function resetPartySignatures(')
 .replace('function createCounterofferTerms(','export function createCounterofferTerms('),
 {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,
 {module:moduleObject,exports:moduleObject.exports,FieldValue,Timestamp,removeUndefinedValues});
const old=moduleObject.exports;const stamp=Timestamp.fromDate(new Date('2026-10-09T12:00:00Z'));const sentinel=FieldValue.serverTimestamp();
const normalize=value=>{if(value===stamp)return '__stamp_identity__';if(value===sentinel)return '__sentinel_identity__';if(value===undefined)return '__undefined__';
 if(Array.isArray(value))return Array.from(value,normalize);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,normalize(item)]));return value;};
let termComparisons=0,partyComparisons=0;
for(const code of ['NC','TX','OK','UT','WI','FL','LA','CO','CA','SC']) {
 const pkg=registry.requireStateContractPackage(code);
 const party=(role,sequence=1)=>({partyUid:role+sequence,userUid:role+sequence,role,capacity:'individual',firstName:'Sample',lastName:role,legalName:'Sample '+role,
  email:role+'@example.com',phone:'9195550100',mailingAddress:{addressLine1:'100 Sample',city:'City',state:code,zipCode:'00000',country:'US'},sequence,primaryParty:sequence===1,
  requiredSigner:true,identityVerification:{status:'verified',verifiedAt:stamp},signature:{status:'signed',providerEnvelopeUid:'old-envelope',providerSignerUid:'old-signer',signedAt:stamp},
  electronicTransactionsConsentAccepted:true,electronicTransactionsConsentAcceptedAt:stamp});
 const terms=pkg.createInitialOfferTerms({contractType:pkg.contractTypes[0],property:{listingUid:'listing',addressLine1:'100 Sample',city:'City',state:code,zipCode:'00000',county:'County',
  legalDescription:'Trusted lot',propertyType:'single_family',yearBuilt:2000,listPriceInCents:35000000},buyer:party('buyer'),seller:party('seller'),
  listingData:{sellerStatements:{ownershipStatus:'owned_at_least_one_year',fuelTankPresent:false,leadBasedPaintApplies:false,ownersAssociationApplies:false,leasesExist:false},coloradoPropertyFacts:{},southCarolinaReadiness:{}}});
 terms.delivery.expiresAt='2030-01-01T12:00:00Z';terms.delivery.electronicDeliveryAuthorized=true;
 terms.fixture={stamp,sentinel,array:[undefined,null,false,0,{kept:'source',missing:undefined}]};
 const before=normalize(terms);const result=current.createCounterofferTerms(terms);
 assert.deepEqual(normalize(result),normalize(old.createCounterofferTerms(terms)),code);
 assert.deepEqual(normalize(terms),before,code+' source terms');
 assert.equal(result.delivery.expiresAt,'');assert.equal(result.delivery.electronicDeliveryAuthorized,false);
 assert.equal(result.stateCode,terms.stateCode);assert.equal(result.contractType,terms.contractType);
 assert.notEqual(result.property,terms.property);assert.notEqual(result.fixture.array,terms.fixture.array);
 assert.equal(result.fixture.stamp,stamp);assert.equal(result.fixture.sentinel,sentinel);
 result.property.listingUid='changed';result.fixture.array[4].kept='changed';
 assert.equal(terms.property.listingUid,'listing');assert.equal(terms.fixture.array[4].kept,'source');termComparisons++;
 for(const side of ['buyer','seller'])for(const count of [0,1,2]) {
  const parties=Array.from({length:count},(_,index)=>party(side,index+1));const originalParties=normalize(parties);
  const reset=current.resetPartySignatures(parties);
  assert.deepEqual(normalize(reset),normalize(old.resetPartySignatures(parties)),code+' '+side);
  assert.deepEqual(normalize(parties),originalParties);
  for(let index=0;index<count;index++) {
   assert.deepEqual(reset[index].signature,{status:'not_started'});
   assert.equal(reset[index].electronicTransactionsConsentAccepted,false);
   assert.equal('electronicTransactionsConsentAcceptedAt' in reset[index],false);
   assert.equal(reset[index].identityVerification.verifiedAt,stamp);
   assert.equal(reset[index].partyUid,parties[index].partyUid);assert.equal(reset[index].sequence,index+1);
   assert.notEqual(reset[index],parties[index]);
  }
  partyComparisons++;
 }
}
const callable=fs.readFileSync(path.join(functionsProject,'src/offers/create-counteroffer.ts'),'utf8');
assert(callable.includes("import { resetPartySignatures, createCounterofferTerms } from './counteroffer-draft-data';"));
assert(!callable.includes('function resetPartySignatures('));assert(!callable.includes('function createCounterofferTerms('));
console.log(`PASS: ${termComparisons} ten-state counteroffer term comparisons and ${partyComparisons} signature-reset cases; immutable source, contract data, Firestore values and party details preserved.`);
