const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const project = path.resolve(process.argv[2] || '.');
const ts = require(require.resolve('typescript',{paths:[project]}));
function loadClass(method) {
  const module = {exports:{}};
  vm.runInNewContext(ts.transpileModule(`export class Test { ${method} }`,{compilerOptions:{
    module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,
  }}).outputText,{module,exports:module.exports});return module.exports.Test;
}
const source = fs.readFileSync(path.join(project,
  'src/app/features/offers/engine/services/offer-workflow.service.ts'),'utf8');
const Guard = loadClass(source.slice(source.indexOf('  assertCurrentEditableDraft<'),
  source.indexOf('  async restoreAcknowledgedDisclosures(')));
const originals = {"south-carolina": "    if (offer.listingUid !== this.listingUid || offer.currentVersionUid !== version.Uid || version.status !== 'draft' || offer.status !== 'draft' || version.initiatedByUid !== this.offerService.currentUserUid) {\n      throw new Error('This is not your current editable draft version.');\n    }", "florida": "    if (offer.listingUid !== this.listingUid || offer.currentVersionUid !== version.Uid || version.status !== 'draft' || offer.status !== 'draft' || version.initiatedByUid !== this.offerService.currentUserUid) {\n      throw new Error('This is not your current editable draft version.');\n    }", "louisiana": "    if (offer.listingUid !== this.listingUid || offer.currentVersionUid !== version.Uid || version.status !== 'draft' || offer.status !== 'draft' || version.initiatedByUid !== this.offerService.currentUserUid) {\n      throw new Error('This is not your current editable draft version.');\n    }", "colorado": "    if (offer.listingUid !== this.listingUid || offer.currentVersionUid !== version.Uid || version.status !== 'draft' || offer.status !== 'draft' || version.initiatedByUid !== this.offerService.currentUserUid) {\n      throw new Error('This is not your current editable draft version.');\n    }", "utah": "    if (offer.listingUid !== this.listingUid || offer.currentVersionUid !== version.Uid || version.status !== 'draft' || offer.status !== 'draft' || version.initiatedByUid !== this.offerService.currentUserUid) {\n      throw new Error('This is not your current editable draft version.');\n    }", "california": "    if (offer.listingUid !== this.listingUid || offer.currentVersionUid !== version.Uid || version.status !== 'draft' || offer.status !== 'draft' || version.initiatedByUid !== this.offerService.currentUserUid) {\n      throw new Error('This is not your current editable draft version.');\n    }", "wisconsin": "    if (offer.listingUid !== this.listingUid || offer.currentVersionUid !== version.Uid || version.status !== 'draft' || offer.status !== 'draft' || version.initiatedByUid !== this.offerService.currentUserUid) {\n      throw new Error('This is not your current editable draft version.');\n    }"};
function outcome(fn) {try {fn();return null;}catch(error) {return error.message;}}
let comparisons = 0;
for (const [state, original] of Object.entries(originals)) {
  const filename = path.join(project,'src/app/features/offers/states',state,
    `${state}-offer-entry/${state}-offer-entry.component.ts`);
  const current = fs.readFileSync(filename,'utf8');
  assert.equal(current.split('this.workflow.assertCurrentEditableDraft(offer, version, this.listingUid);').length,2);
  assert(!current.includes("throw new Error('This is not your current editable draft version.')"));
  const old = new (loadClass(`check(offer, version) {${original}}`))();
  old.listingUid = 'listing';old.offerService = {currentUserUid:'buyer'};
  const guard = new Guard();guard.offerService = old.offerService;
  for (let bits = 0; bits < 32; bits++) for (const immutable of [undefined,false,true]) {
    const offer = {listingUid: bits & 1 ? 'other':'listing',
      currentVersionUid:bits & 2 ? 'other':'version',status:bits & 4 ? 'submitted':'draft'};
    const version = {Uid:'version',status:bits & 8 ? 'signed':'draft',
      initiatedByUid:bits & 16 ? 'other':'buyer',immutable};
    const before = JSON.stringify({offer,version});
    assert.equal(outcome(() => guard.assertCurrentEditableDraft(offer,version,'listing')),
      outcome(() => old.check(offer,version)),`${state}: ${bits}/${immutable}`);
    assert.equal(JSON.stringify({offer,version}),before);comparisons++;
  }
}
for (const state of ['texas','oklahoma']) {
  const source = fs.readFileSync(path.join(project,'src/app/features/offers/states',state,
    `${state}-offer-entry/${state}-offer-entry.component.ts`),'utf8');
  assert(!source.includes('assertCurrentEditableDraft('));
}
console.log(`PASS: ${comparisons} seven-state editable-draft guard comparisons; mismatched listing/version, status, ownership, messages and existing immutability behavior preserved; TX/OK remain separate.`);
