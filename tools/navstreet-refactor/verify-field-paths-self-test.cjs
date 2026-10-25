'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { audit } = require('./verify-field-paths.cjs');
const root = path.resolve(process.argv[2] || '.');
const changes = new Map();
function mutate(file, from, to) {
  const source = changes.get(file) || fs.readFileSync(path.join(root, file), 'utf8');
  assert(source.includes(from), 'Mutation fixture no longer matches: ' + file + ' / ' + from);
  changes.set(file, source.replace(from, to));
}
const ky = 'src/app/features/offers/states/kentucky/questions/kentucky-residential-sale.sections.ts';
mutate(ky, "fieldPath: 'purchase.purchasePriceInCents'", "fieldPath: 'purchase.renamedPriceInCents'");
mutate(ky, "'purchase.hasEarnestMoney'", "'missing.hasEarnestMoney'");
mutate(ky, "{ fieldPath: 'purchase.hasEarnestMoney', operator: 'is_true' }", "{ fieldPath: 'purchase.missingVisibilityFact', operator: 'is_true' }");
const tx = 'src/app/features/offers/states/texas/questions/texas-shared-question-definitions.ts';
mutate(tx, 'salesPrice.salesPriceInCents', 'salesPrice.renamedSalesPriceInCents');
mutate(tx, "selectedKey: 'included'", "selectedKey: 'missingIncluded'");
const nc = 'functions/src/offers/state-contracts/north-carolina/north-carolina-state-contract.package.ts';
mutate(nc, 'sellerStatements.ownersAssociationApplies', 'sellerStatements.renamedOwnersAssociationApplies');
const co = 'src/app/features/offers/states/colorado/questions/colorado-residential-sale.sections.ts';
mutate(co, 'fieldPath: `sellerLoan.${key}`', 'fieldPath: `missingSellerLoan.${key}`');
const kyp = 'functions/src/offers/state-contracts/kentucky/kentucky-state-contract.package.ts';
mutate(kyp, 'disclosures.sellerReportsHoa', 'disclosures.renamedSellerReportsHoa');
const alm = 'src/app/features/offers/states/alabama/alabama-offer-package.ts';
mutate(alm, 'documentVersions.lead-based-paint', 'documentVersionTypo.lead-based-paint');
const ri = 'src/app/features/offers/states/rhode-island/questions/rhode-island-residential-sale.sections.ts';
mutate(ri, "fieldPath: 'legalDescription'", 'fieldPath: String(Date.now())');
const model = 'src/app/core/domains/offers/state-contracts/tennessee/models/tennessee-offer-terms.model.ts';
mutate(model, 'purchasePriceInCents:', 'renamedPriceInCents:');
const result = audit(root, changes);
for (const [file, fragment] of [
  [ky, 'renamedPriceInCents'], [ky, 'missing.'], [ky, 'missingVisibilityFact'],
  [tx, 'renamedSalesPriceInCents'], [tx, 'missingIncluded'], [nc, 'renamedOwnersAssociationApplies'],
  [co, 'missingSellerLoan'], [kyp, 'renamedSellerReportsHoa'],
  [alm, 'documentVersionTypo'], [ri, 'Unresolved path expression'],
  ['src/app/features/offers/states/tennessee/questions/tennessee-residential-sale.sections.ts', 'purchasePriceInCents'],
]) assert(result.errors.some(e => e.startsWith(file + ':') && e.includes(fragment)), 'Missed negative control: ' + file + ' / ' + fragment);
assert.equal(result.schemas, result.states * 2);
assert.equal(result.excluded.length, 6);
assert(result.records.some(r => r.path === 'salesPrice.salesPriceInCents' || r.path.startsWith('salesPrice.')), 'Texas schema must stay independent');
assert(result.records.some(r => r.path === 'sellerStatements.leadBasedPaintApplies' && r.file.startsWith('functions/src/offers/state-contracts/north-carolina/')));
const texasPackage = 'functions/src/offers/state-contracts/texas/texas-state-contract.package.ts';
assert.throws(() => audit(root,new Map([[texasPackage,fs.readFileSync(path.join(root,texasPackage),'utf8').replace('TREC_20_19_TEMPLATE.contractType,',"TREC_20_19_TEMPLATE.contractType, 'condominium_resale',")]])), /Texas coverage changed/);
const activeTexas = 'src/app/features/offers/states/texas/contracts/one-to-four-family-resale/one-to-four-family-resale.sections.ts';
assert.throws(() => audit(root,new Map([[activeTexas,fs.readFileSync(path.join(root,activeTexas),'utf8')+'\n// createTexasConstructionSection']])) , /dormant construction fields/);
console.log('PASS: 13 negative controls reject broken questions, visibility, helpers, computed paths, frontend/backend policy typos, schema renames and unresolved expressions; Texas/NC schemas remain distinct. No source files were mutated.');
