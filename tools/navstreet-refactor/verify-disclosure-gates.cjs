const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const project = path.resolve(process.argv[2] || '.');
const ts = require(require.resolve('typescript', { paths: [project] }));
const compile = source => ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
function load(source, globals = {}) {
  const module = { exports: {} };
  vm.runInNewContext(compile(source), { module, exports: module.exports, ...globals });
  return module.exports;
}
const config = path.join(project, 'src/app/core/configuration');
const policy = load(fs.readFileSync(path.join(config,'listing-disclosure-gates.ts'),'utf8'));
const globals = { ...policy, normalizeDisclosureStateCode: code => code.trim().toUpperCase(),
  californiaDisclosureOutstanding: decisions => Object.keys(decisions || {}).filter(k => decisions[k].status === 'required') };
const legacy = load("export function getOfferBlockingDocumentTypes(state: string, facts: ListingChecklistFacts, now = Date.now()): readonly DisclosureDocumentType[] {\n  const code = normalizeDisclosureStateCode(state);\n  const lead = facts.leadBasedPaintApplies === true;\n  const old = typeof facts.yearBuilt === 'number' && facts.yearBuilt < 1978;\n  if (code === 'CA') return californiaDisclosureOutstanding(facts.california?.disclosureApplicability, new Set()) as DisclosureDocumentType[];\n  if (code === 'FL') return [\n    'florida-flood-disclosure',\n    ...(facts.ownersAssociationApplies === true ? ['florida-hoa-disclosure-summary' as const] : []),\n    ...(lead || (old && facts.leadBasedPaintApplies !== false) ? ['lead-based-paint' as const] : []),\n  ];\n  if (code === 'LA') {\n    if (facts.propertyType === 'land') return now >= Date.parse('2027-01-01T06:00:00Z')\n      ? ['louisiana-vacant-residential-property-disclosure'] : [];\n    return ['louisiana-property-disclosure', ...(facts.yearBuilt == null || old || lead ? ['lead-based-paint' as const] : [])];\n  }\n  if (code === 'CO') return ['colorado-property-disclosure', 'colorado-radon-brochure',\n    ...(facts.yearBuilt == null || old || lead ? ['lead-based-paint' as const] : [])];\n  return [];\n}\n\n\nexport function isDisclosureRequiredForListing(\n  state: string,\n  requirement: StateDisclosureRequirement,\n  listing: { ownersAssociationApplies?: boolean | null; leadBasedPaintApplies?: boolean | null; yearBuilt?: number | null }\n): boolean {\n  if (requirement.required) return true;\n\n  const stateCode = normalizeDisclosureStateCode(state);\n\n  if (stateCode === 'CO') {\n    if (requirement.documentType === 'lead-based-paint') return listing.leadBasedPaintApplies === true || listing.yearBuilt == null || listing.yearBuilt < 1978;\n    if (requirement.documentType === 'colorado-association-documents') {\n      return false;\n    }\n    return false;\n  }\n\n  if (stateCode === 'LA') {\n    return requirement.documentType === 'lead-based-paint' &&\n      (\n        listing.leadBasedPaintApplies === true ||\n        listing.yearBuilt == null ||\n        listing.yearBuilt < 1978\n      );\n  }\n  if (stateCode !== 'FL') return false;\n  return (requirement.documentType === 'florida-hoa-disclosure-summary' && listing.ownersAssociationApplies === true) ||\n    (requirement.documentType === 'lead-based-paint' &&\n      (listing.leadBasedPaintApplies === true ||\n        (typeof listing.yearBuilt === 'number' && listing.yearBuilt < 1978 && listing.leadBasedPaintApplies !== false)));\n}\n\n",globals);
function currentFunction(file,name,end) {
  const source = fs.readFileSync(path.join(config,file),'utf8');
  return source.slice(source.indexOf('export function '+name),source.indexOf(end,source.indexOf('export function '+name)));
}
const current = load(currentFunction('listing-document-checklist.config.ts','getOfferBlockingDocumentTypes','export function checklistDocumentTitle') +
  currentFunction('state-disclosures.config.ts','isDisclosureRequiredForListing','/** Accept both'),globals);
let comparisons = 0;
for (const state of ['NC','TX','OK','UT','WI','FL','LA','CO','CA','SC','XX'])
 for (const yearBuilt of [undefined,null,1900,1977,1978,2026])
  for (const leadBasedPaintApplies of [undefined,null,false,true])
   for (const ownersAssociationApplies of [undefined,null,false,true])
    for (const propertyType of [undefined,'land','single_family'])
     for (const now of [Date.parse('2027-01-01T06:00:00Z')-1,Date.parse('2027-01-01T06:00:00Z')]) {
      const facts = { yearBuilt,leadBasedPaintApplies,ownersAssociationApplies,propertyType,
        california: { disclosureApplicability: { a: {status:'required'}, b: {status:'exempt'} } } };
      assert.equal(JSON.stringify(current.getOfferBlockingDocumentTypes(state,facts,now)),
        JSON.stringify(legacy.getOfferBlockingDocumentTypes(state,facts,now)));
      comparisons++;
      for (const required of [false,true])
       for (const documentType of ['lead-based-paint','florida-hoa-disclosure-summary','colorado-association-documents','other']) {
        const requirement = { required,documentType };
        assert.equal(current.isDisclosureRequiredForListing(state,requirement,facts),
          legacy.isDisclosureRequiredForListing(state,requirement,facts));
        comparisons++;
       }
     }
console.log(`PASS: ${comparisons} upload-gate and required-document comparisons against pre-extraction rules, including Louisiana effective-date boundary.`);

// Captured from the supplied backend gates; no backend enforcement changes.
const backend = load("export function floridaRequiredDisclosureTypes(\n  listing: Record<string, unknown>,\n): string[] {\n  const statements = listing['sellerStatements'] as Record<string, unknown> | undefined;\n  const yearBuilt = listing['yearBuilt'];\n  return [\n    'florida-flood-disclosure',\n    ...(statements?.['ownersAssociationApplies'] === true\n      ? ['florida-hoa-disclosure-summary'] : []),\n    ...(statements?.['leadBasedPaintApplies'] === true ||\n      (typeof yearBuilt === 'number' && yearBuilt < 1978 && statements?.['leadBasedPaintApplies'] !== false)\n      ? ['lead-based-paint'] : []),\n  ];\n}\n\n/** Read documents in the same transaction as offer creation or submission. */\n\nexport function coloradoRequiredDisclosureTypes(\n  listing: Record<string, unknown>,\n): string[] {\n  const statements = listing['sellerStatements'] as\n    | Record<string, unknown>\n    | undefined;\n\n  return [\n    'colorado-property-disclosure',\n    'colorado-radon-brochure',\n\n    ...(listing['yearBuilt'] == null ||\n    Number(listing['yearBuilt']) < 1978 ||\n    statements?.['leadBasedPaintApplies'] === true\n      ? ['lead-based-paint']\n      : []),\n  ];\n}\n\n/** Check Colorado documents required before offer creation. */\n\nexport const LOUISIANA_VACANT_DISCLOSURE_EFFECTIVE_AT =\n  Date.parse('2027-01-01T06:00:00Z');\n\nexport function louisianaRequiredDisclosureTypes(\n  listing: Record<string, unknown>,\n  now = new Date(),\n): string[] {\n  if (listing['propertyType'] === 'land') {\n    return now.getTime() >= LOUISIANA_VACANT_DISCLOSURE_EFFECTIVE_AT\n      ? ['louisiana-vacant-residential-property-disclosure']\n      : [];\n  }\n\n  const year = listing['yearBuilt'];\n  const statements = listing['sellerStatements'];\n  const sellerStatements =\n    statements && typeof statements === 'object' && !Array.isArray(statements)\n      ? statements as Record<string, unknown>\n      : {};\n\n  return [\n    'louisiana-property-disclosure',\n    ...(\n      year == null ||\n      (typeof year === 'number' && year < 1978) ||\n      sellerStatements['leadBasedPaintApplies'] === true\n        ? ['lead-based-paint']\n        : []\n    ),\n  ];\n}\n\n");
let backendComparisons = 0;
for (const code of ['FL','CO','LA'])
 for (const yearBuilt of [undefined,null,1900,1977,1978,2026])
  for (const leadBasedPaintApplies of [undefined,null,false,true])
   for (const ownersAssociationApplies of [undefined,null,false,true])
    for (const propertyType of [undefined,'land','single_family'])
     for (const now of [Date.parse('2027-01-01T06:00:00Z')-1,Date.parse('2027-01-01T06:00:00Z')]) {
      const facts = {yearBuilt,leadBasedPaintApplies,ownersAssociationApplies,propertyType};
      const listing = {yearBuilt,propertyType,sellerStatements:{leadBasedPaintApplies,ownersAssociationApplies}};
      const expected = code === 'FL' ? backend.floridaRequiredDisclosureTypes(listing)
        : code === 'CO' ? backend.coloradoRequiredDisclosureTypes(listing)
        : backend.louisianaRequiredDisclosureTypes(listing,new Date(now));
      assert.equal(JSON.stringify(policy.getListingUploadGateDocumentTypes(code,facts,now)),JSON.stringify(expected));
      backendComparisons++;
     }
console.log(`PASS: ${backendComparisons} comparisons with supplied FL/CO/LA backend gates for valid listing facts.`);
