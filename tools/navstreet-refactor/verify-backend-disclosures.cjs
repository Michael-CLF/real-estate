const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const project = path.resolve(process.argv[2] || '.');
const ts = require(require.resolve('typescript', { paths: [project,path.join(project,'functions')] }));
const compile = source => ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
class HttpsError extends Error { constructor(code,message) { super(message); this.code=code; } }
function load(source, reader) {
 const module={exports:{}};
 vm.runInNewContext(compile(source),{module,exports:module.exports,require: name => {
  if(name==='firebase-functions/v2/https') return {HttpsError};
  if(name==='./listing-disclosure-gate-reader') return reader;
  throw new Error('Unexpected dependency '+name);
 }});
 return module.exports;
}
const folder=path.join(project,'functions/src/offers');
const reader=load(fs.readFileSync(path.join(folder,'listing-disclosure-gate-reader.ts'),'utf8'));
const originals = {"colorado": "import { HttpsError } from 'firebase-functions/v2/https';\n\nimport type {\n  DocumentReference,\n  Transaction,\n} from 'firebase-admin/firestore';\n\nexport function coloradoRequiredDisclosureTypes(\n  listing: Record<string, unknown>,\n): string[] {\n  const statements = listing['sellerStatements'] as\n    | Record<string, unknown>\n    | undefined;\n\n  return [\n    'colorado-property-disclosure',\n    'colorado-radon-brochure',\n\n    ...(listing['yearBuilt'] == null ||\n    Number(listing['yearBuilt']) < 1978 ||\n    statements?.['leadBasedPaintApplies'] === true\n      ? ['lead-based-paint']\n      : []),\n  ];\n}\n\n/** Check Colorado documents required before offer creation. */\nexport async function assertColoradoListingDisclosures(\n  transaction: Transaction,\n  listingReference: DocumentReference,\n  listing: Record<string, unknown>,\n): Promise<void> {\n  const required = coloradoRequiredDisclosureTypes(listing);\n\n  const snapshots = await Promise.all(\n    required.map(documentType =>\n      transaction.get(\n        listingReference\n          .collection('disclosures')\n          .doc(documentType),\n      ),\n    ),\n  );\n\n  const missing = required.filter((documentType, index) => {\n    const file = snapshots[index].data()?.['currentDocument'] as\n      | Record<string, unknown>\n      | undefined;\n\n    return (\n      !file ||\n      file['listingUid'] !== listingReference.id ||\n      file['stateAbbreviation'] !== 'CO' ||\n      !file['storagePath'] ||\n      !file['versionId']\n    );\n  });\n\n  if (missing.length) {\n    throw new HttpsError(\n      'failed-precondition',\n      `The seller must upload ${missing\n        .map(documentType => documentType.replace(/-/g, ' '))\n        .join(', ')} in Property Disclosures before an offer can be made.`,\n    );\n  }\n}", "louisiana": "import { HttpsError } from 'firebase-functions/v2/https';\nimport type { DocumentReference, Transaction } from 'firebase-admin/firestore';\n\nexport const LOUISIANA_VACANT_DISCLOSURE_EFFECTIVE_AT =\n  Date.parse('2027-01-01T06:00:00Z');\n\nexport function louisianaRequiredDisclosureTypes(\n  listing: Record<string, unknown>,\n  now = new Date(),\n): string[] {\n  if (listing['propertyType'] === 'land') {\n    return now.getTime() >= LOUISIANA_VACANT_DISCLOSURE_EFFECTIVE_AT\n      ? ['louisiana-vacant-residential-property-disclosure']\n      : [];\n  }\n\n  const year = listing['yearBuilt'];\n  const statements = listing['sellerStatements'];\n  const sellerStatements =\n    statements && typeof statements === 'object' && !Array.isArray(statements)\n      ? statements as Record<string, unknown>\n      : {};\n\n  return [\n    'louisiana-property-disclosure',\n    ...(\n      year == null ||\n      (typeof year === 'number' && year < 1978) ||\n      sellerStatements['leadBasedPaintApplies'] === true\n        ? ['lead-based-paint']\n        : []\n    ),\n  ];\n}\n\nexport async function assertLouisianaListingDisclosures(\n  transaction: Transaction,\n  listingReference: DocumentReference,\n  listing: Record<string, unknown>,\n): Promise<void> {\n  const required = louisianaRequiredDisclosureTypes(listing);\n\n  const snapshots = await Promise.all(\n    required.map(type =>\n      transaction.get(listingReference.collection('disclosures').doc(type))\n    )\n  );\n\n  const missing = required.filter((type, index) => {\n    const document = snapshots[index].data()?.['currentDocument'] as\n      Record<string, unknown> | undefined;\n\n    return !document ||\n      document['listingUid'] !== listingReference.id ||\n      document['stateAbbreviation'] !== 'LA' ||\n      typeof document['storagePath'] !== 'string' ||\n      !document['storagePath'] ||\n      typeof document['versionId'] !== 'string' ||\n      !document['versionId'];\n  });\n\n  if (missing.length) {\n    throw new HttpsError(\n      'failed-precondition',\n      `This Louisiana listing is waiting for the seller to upload: ${\n        missing.map(type => type.replace(/-/g, ' ')).join(', ')\n      }. Open Property Disclosures from the seller's listing dashboard.`,\n    );\n  }\n}", "florida": "import { HttpsError } from 'firebase-functions/v2/https';\nimport type { DocumentReference, Transaction } from 'firebase-admin/firestore';\n\nexport function floridaRequiredDisclosureTypes(\n  listing: Record<string, unknown>,\n): string[] {\n  const statements = listing['sellerStatements'] as Record<string, unknown> | undefined;\n  const yearBuilt = listing['yearBuilt'];\n  return [\n    'florida-flood-disclosure',\n    ...(statements?.['ownersAssociationApplies'] === true\n      ? ['florida-hoa-disclosure-summary'] : []),\n    ...(statements?.['leadBasedPaintApplies'] === true ||\n      (typeof yearBuilt === 'number' && yearBuilt < 1978 && statements?.['leadBasedPaintApplies'] !== false)\n      ? ['lead-based-paint'] : []),\n  ];\n}\n\n/** Read documents in the same transaction as offer creation or submission. */\nexport async function assertFloridaListingDisclosures(\n  transaction: Transaction,\n  listingReference: DocumentReference,\n  listing: Record<string, unknown>,\n): Promise<void> {\n  const required = floridaRequiredDisclosureTypes(listing);\n  const snapshots = await Promise.all(required.map(type =>\n    transaction.get(listingReference.collection('disclosures').doc(type))\n  ));\n  const missing = required.filter((type, index) => {\n    const document = snapshots[index].data()?.['currentDocument'] as Record<string, unknown> | undefined;\n    return !document || document['listingUid'] !== listingReference.id ||\n      document['stateAbbreviation'] !== 'FL' ||\n      typeof document['storagePath'] !== 'string' || !document['storagePath'] ||\n      typeof document['versionId'] !== 'string' || !document['versionId'];\n  });\n  if (missing.length) {\n    throw new HttpsError('failed-precondition',\n      `This Florida listing is waiting for the seller to upload: ${missing.map(type => type.replace(/-/g, ' ')).join(', ')}. Open Property Disclosures from the seller's listing dashboard.`);\n  }\n}"};
(async()=>{
 let cases=0;
 for(const state of ['colorado','louisiana','florida']) {
  const old=load(originals[state]);
  const current=load(fs.readFileSync(path.join(folder,state+'-listing-disclosure-gate.ts'),'utf8'),reader);
  const name='assert'+state[0].toUpperCase()+state.slice(1)+'ListingDisclosures';
  const code={colorado:'CO',louisiana:'LA',florida:'FL'}[state];
  for(const bad of [undefined,null,{}, {listingUid:'wrong'}, {stateAbbreviation:'wrong'},
    {storagePath:''},{storagePath:123},{versionId:''},{versionId:123},'valid']) {
   const listing={yearBuilt:1970,sellerStatements:{ownersAssociationApplies:true}};
   async function run(mod) {
    const reads=[];
    const ref={id:'listing',collection: collection=>{assert.equal(collection,'disclosures');return {doc:type=>({type})};}};
    const transaction={get: doc=>{reads.push(doc.type);const good={listingUid:'listing',stateAbbreviation:code,storagePath:'file',versionId:'v1'};
      const file=bad==='valid'?good:bad==null?bad:{...good,...bad};
      return Promise.resolve({data:()=>({currentDocument:file})});}};
    let error=null;try{await mod[name](transaction,ref,listing);}catch(e){error={code:e.code,message:e.message};}
    return {reads,error};
   }
   assert.deepEqual(await run(current),await run(old));cases++;
  }
 }
 // Hold reads unresolved to verify parallel dispatch and preserve required-document ordering.
 const pending=[];const required=['a','b','c'];
 const reference={collection:()=>({doc:type=>({type})})};
 const work=reader.readMissingListingDisclosures({get:doc=>new Promise(resolve=>pending.push({type:doc.type,resolve}))},reference,required,file=>!file);
 assert.deepEqual(pending.map(p=>p.type),required);
 pending[2].resolve({data:()=>({})});pending[0].resolve({data:()=>({})});pending[1].resolve({data:()=>({currentDocument:{}})});
 assert.equal(JSON.stringify(await work),JSON.stringify(['a','c']));
 await assert.rejects(reader.readMissingListingDisclosures({get:()=>Promise.reject(new Error('read failed'))},reference,['a'],()=>false),/read failed/);
 let reads=0;assert.equal(JSON.stringify(await reader.readMissingListingDisclosures({get:()=>{reads++;}},reference,[],()=>false)),'[]');assert.equal(reads,0);
 console.log(`PASS: ${cases} backend disclosure parity cases; error messages, CO permissive metadata behavior, concurrent reads, ordering, empty requirements and read failure propagation.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
