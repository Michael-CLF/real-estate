const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const project = path.resolve(process.argv[2] || process.cwd());
const ts = require(require.resolve('typescript', { paths: [project] }));
const resolve = name => pathToFileURL(require.resolve(name, { paths: [project] })).href;
(async () => {
  await import(resolve('@angular/compiler'));
  const { FormControl, FormGroup, FormBuilder, Validators } = await import(resolve('@angular/forms'));
  const packageSource = fs.readFileSync(path.join(project,'src/app/core/domains/listings/state-packages/south-carolina/south-carolina-listing.package.ts'),'utf8');
  const packageModule = { exports: {} };
  const compile = source => ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const scFormModule = { exports: {} };
  vm.runInNewContext(compile(fs.readFileSync(path.join(project,
    'src/app/core/domains/listings/state-packages/south-carolina/south-carolina-listing-form.ts'),'utf8')),
    { module: scFormModule, exports: scFormModule.exports });
  const scForms = scFormModule.exports;
  vm.runInNewContext(compile(packageSource), { module: packageModule, exports: packageModule.exports,
    require: () => scForms });
  const scForm = scForms.createSouthCarolinaListingAnswersForm(new FormBuilder());
  assert.equal(JSON.stringify(scForm.getRawValue()),JSON.stringify({beachfrontApplies:null,futureVacationBookingsExist:null}));
  for (const beachfrontApplies of [undefined,null,false,true])
    for (const futureVacationBookingsExist of [undefined,null,false,true]) {
      const stored = {beachfrontApplies,futureVacationBookingsExist};
      const restored = scForms.restoreSouthCarolinaListingAnswers(stored);
      assert.equal(restored.beachfrontApplies,beachfrontApplies ?? null);
      assert.equal(restored.futureVacationBookingsExist,futureVacationBookingsExist ?? null);
      scForm.patchValue(restored);
      assert.equal(JSON.stringify(scForm.getRawValue()),JSON.stringify(restored));
    }
  scForm.reset();assert.equal(scForm.controls.beachfrontApplies.value,null);
  assert.equal(scForm.controls.futureVacationBookingsExist.value,null);
  const pkg = packageModule.exports.southCarolinaListingPackage;
  assert.equal(pkg.questionGroups.length,1);
  const questions = pkg.questionGroups[0].questions;
  assert.equal(questions.length,2);
  assert.equal(questions[0].fieldPath,'sellerStatements.southCarolina.beachfrontApplies');
  assert.equal(questions[1].fieldPath,'sellerStatements.southCarolina.futureVacationBookingsExist');
  const component = fs.readFileSync(path.join(project,'src/app/features/sell/listing-wizard/components/property-details-step/property-details-step.component.ts'),'utf8');
  const start = component.indexOf('  protected stateQuestionControl(');
  const methods = component.slice(start, component.lastIndexOf('\n}'));
  const module = { exports: {} };
  vm.runInNewContext(compile(`export class Test { ${methods} }`), {
    module, exports: module.exports, FormControl, Validators,
    getStateListingQuestionGroups: () => pkg.questionGroups
  });
  const test = new module.exports.Test();
  test.form = new FormGroup({ sellerStatements: new FormGroup({ southCarolina: new FormGroup({
    beachfrontApplies: new FormControl(null), futureVacationBookingsExist: new FormControl(null)
  }) }) });
  test.stateListingPackage = () => pkg;
  test.configureStateQuestionValidators();
  assert.equal(test.form.valid,false);
  for (const q of questions) {
    const control = test.stateQuestionControl(q.fieldPath);
    assert.equal(control.touched,false); assert.equal(control.hasError('required'),true);
    control.setValue(false); assert.equal(control.valid,true);
  }
  assert.equal(test.form.valid,true);
  const saved = test.form.getRawValue();
  test.form.reset(); test.form.patchValue(saved);
  assert.equal(test.form.getRawValue().sellerStatements.southCarolina.beachfrontApplies,false);
  for (const q of questions) test.stateQuestionControl(q.fieldPath).setValue(true);
  assert.equal(test.form.valid,true);
  test.form.reset(); test.stateListingPackage = () => ({ questionGroups: [] });
  test.configureStateQuestionValidators(); assert.equal(test.form.valid,true);
  assert.throws(() => test.stateQuestionControl('missing'), /missing/);
  const html = fs.readFileSync(path.join(project,'src/app/features/sell/listing-wizard/components/property-details-step/property-details-step.component.html'),'utf8');
  assert(html.includes('control.touched && control.hasError'));
  assert(html.includes('[ngValue]="false"'));
  assert(!html.includes('isSouthCarolinaListing()'));
  const caFolder = path.join(project,'src/app/core/domains/listings/state-packages/california');
  const caModule = { exports: {} };
  vm.runInNewContext(compile(fs.readFileSync(path.join(caFolder,'california-listing-facts.model.ts'),'utf8')),
    { module: caModule, exports: caModule.exports });
  const ca = caModule.exports;
  const formModule = { exports: {} };
  vm.runInNewContext(compile(fs.readFileSync(path.join(caFolder,'california-listing-form.ts'),'utf8')),
    { module: formModule, exports: formModule.exports, require: () => ca });
  const form = formModule.exports.createCaliforniaListingFactsForm(new FormBuilder());
  const normalize = value => JSON.stringify(value);
  assert.equal(normalize(form.getRawValue()), normalize(ca.CALIFORNIA_LISTING_FACT_DEFAULTS));
  assert.equal(form.valid,true);
  for (const stored of [undefined, null, {}, { transferDisclosure: 'exempt', transferExemptionBasis: ' inherited ' },
    { resaleWithin18Months: 'no', assistedWaterTank: 'unknown', gasApplianceRestrictions: 'local text' }]) {
    const restored = ca.restoreCaliforniaListingFacts(stored);
    assert.equal(normalize(restored),normalize({ ...ca.CALIFORNIA_LISTING_FACT_DEFAULTS, ...stored }));
    form.patchValue(restored); assert.equal(normalize(form.getRawValue()),normalize(restored));
  }
  form.reset(); assert.equal(normalize(form.getRawValue()),normalize(ca.CALIFORNIA_LISTING_FACT_DEFAULTS));
  const coModule = { exports: {} };
  vm.runInNewContext(compile(fs.readFileSync(path.join(project,
    'src/app/core/domains/listings/state-packages/colorado/colorado-listing-form.ts'),'utf8')),
    { module: coModule, exports: coModule.exports });
  const co = coModule.exports;
  const coFacts = co.createColoradoPropertyFactsForm(new FormBuilder());
  assert.equal(coFacts.getRawValue().metroDistrict,'unselected');
  assert.equal(co.COLORADO_LISTING_OPTIONAL_FACTS.length,11);
  for (const question of co.COLORADO_LISTING_OPTIONAL_FACTS) assert(coFacts.get(question.key));
  const coLoan = co.createColoradoAssumableLoanForm(new FormBuilder());
  assert.equal(coLoan.getRawValue().available,false);
  assert.equal(coLoan.getRawValue().paymentPeriod,'month');
  assert.equal(co.restoreColoradoAssumableLoan(undefined),null);
  for (const [balance,payment] of [[0,0],[12345678,145699],[1,1],[99999999,234567]]) {
    const stored = { available: true, ratePercent: 4.5, estimatedBalanceInCents: balance,
      principalInterestPaymentInCents: payment, balanceAsOf: '2026-10-08', paymentPeriod: 'month',
      escrowRealEstateTaxes: true, escrowPropertyInsurance: false, escrowMortgageInsurance: false, escrowOther: '' };
    const restored = co.restoreColoradoAssumableLoan(stored);
    assert.equal(restored.estimatedBalanceDollars,balance/100);
    assert.equal(restored.principalInterestPaymentDollars,payment/100);
    const saved = co.serializeColoradoAssumableLoan('CO',restored);
    assert.deepEqual(JSON.parse(normalize(saved)),JSON.parse(normalize(stored)));
    assert.equal(co.serializeColoradoAssumableLoan('CA',restored),undefined);
    assert.equal(co.serializeColoradoAssumableLoan('CO',{ ...restored, available: false }),undefined);
  }
  const rounding = co.serializeColoradoAssumableLoan('CO',{
    ...coLoan.getRawValue(), available: true, estimatedBalanceDollars: 12.345,
    principalInterestPaymentDollars: 1.235, paymentPeriod: ' month ', escrowOther: ' other ' });
  assert.equal(rounding.estimatedBalanceInCents,Math.round(12.345*100));
  assert.equal(rounding.principalInterestPaymentInCents,Math.round(1.235*100));
  assert.equal(rounding.paymentPeriod,'month'); assert.equal(rounding.escrowOther,'other');
  const loaded = new Map();
  function loadSource(filename) {
    filename = path.resolve(filename);
    if (loaded.has(filename)) return loaded.get(filename);
    const module = { exports: {} }; loaded.set(filename,module.exports);
    vm.runInNewContext(compile(fs.readFileSync(filename,'utf8')), {
      module, exports: module.exports, URL,
      require: name => {
        if (name === '@angular/forms') return { Validators };
        if (!name.startsWith('.')) throw new Error(`Unexpected dependency ${name}`);
        return loadSource(path.resolve(path.dirname(filename),name+'.ts'));
      }
    });
    return module.exports;
  }
  const registry = loadSource(path.join(project,'src/app/core/domains/listings/state-packages/state-listing.registry.ts'));
  const originalEditFields = vm.runInNewContext('(' + "[\n    ['includedItems','Additional included items and garage remotes'],['excludedItems','Excluded items'],\n    ['leasedItems','Leased equipment'],['encumberedItems','Equipment debt or PACE obligation'],\n    ['solarPowerPlan','Solar power purchase plan'],['parkingStorage','Parking and storage rights'],\n    ['waterSource','Potable water source (required)'],['deededWaterRights','Deeded water rights'],\n    ['otherWaterRights','Other water rights'],['wellPermit','Well and permit'],['waterStock','Water stock'],\n    ['mineralRights','Mineral interests'],['offRecordMatters','Off-record matters and existing surveys'],\n    ['thirdPartyRights','Third-party purchase or approval rights'],['leases','Continuing occupancy agreements'],\n\n  ].map(([key,label]) => ({key,label}))" + ')');
  const editFields = registry.getStateListingEditFields('coloradoPropertyFacts');
  assert.equal(normalize(editFields),normalize(originalEditFields));
  assert.equal(editFields, registry.getStateListingPackage('CO').editFields.coloradoPropertyFacts);
  const editFactsForm = co.createColoradoPropertyFactsForm(new FormBuilder());
  for (const field of editFields) assert(editFactsForm.get(field.key),field.key);
  assert.equal(new Set(editFields.map(field => field.key)).size,editFields.length);
  const coEditFields = registry.getStateListingPackage('CO').editFields;
  registry.getStateListingPackage('CO').editFields = undefined;
  assert.throws(() => registry.getStateListingEditFields('coloradoPropertyFacts'),/No state listing/);
  registry.getStateListingPackage('CO').editFields = coEditFields;
  const scEditFields = registry.getStateListingPackage('SC').editFields;
  registry.getStateListingPackage('SC').editFields = { coloradoPropertyFacts: editFields };
  assert.throws(() => registry.getStateListingEditFields('coloradoPropertyFacts'),/More than one/);
  registry.getStateListingPackage('SC').editFields = scEditFields;
  const editComponentSource = fs.readFileSync(path.join(project,
    'src/app/features/dashboard/listing-edit/listing-edit.component.ts'),'utf8');
  assert(editComponentSource.includes("coloradoFields = getStateListingEditFields('coloradoPropertyFacts')"));
  assert(!editComponentSource.includes('Additional included items and garage remotes'));
  console.log(`PASS: ${editFields.length} Colorado edit field labels/order/control comparisons; package ownership and missing/duplicate guards.`);
  const coloradoFactsModule = loadSource(path.join(project,
    'src/app/core/domains/listings/state-packages/colorado/colorado-listing-facts.ts'));
  const coloradoDefaults = loadSource(path.join(project,
    'src/app/core/domains/offers/state-contracts/colorado/models/colorado-contract-elections.ts')).COLORADO_FACT_DEFAULTS;
  const restoreFacts = registry.getStateListingFormRestorer('coloradoPropertyFacts');
  assert.equal(restoreFacts, coloradoFactsModule.restoreColoradoPropertyFacts);
  assert.equal(restoreFacts, registry.getStateListingPackage('CO').formRestorers.coloradoPropertyFacts);
  const factsCases = [undefined, null, {}, { landArea: '2 acres' },
    { metroDistrict: 'covered', metroDistrictWebsite: ' saved url ' }];
  for (const key of Object.keys(coloradoDefaults)) for (const value of [undefined, null, '', false, ' saved value ']) {
    factsCases.push({ [key]: value });
  }
  let factsRestoreComparisons = 0;
  for (const saved of factsCases) {
    const before = normalize(saved);
    for (const flow of ['creation','edit']) {
      // Both original callers used this exact defaults-then-saved spread expression.
      const expected = { ...coloradoDefaults, ...saved };
      const actual = restoreFacts(saved);
      assert.equal(normalize(actual),normalize(expected),flow);
      assert.equal(normalize(saved),before);
      for (const key of Object.keys(expected)) assert.equal(actual[key],expected[key]);
      const oldForm = co.createColoradoPropertyFactsForm(new FormBuilder());
      const newForm = co.createColoradoPropertyFactsForm(new FormBuilder());
      oldForm.patchValue(expected); newForm.patchValue(actual);
      assert.equal(normalize(newForm.getRawValue()),normalize(oldForm.getRawValue()));
      factsRestoreComparisons++;
    }
  }
  const firstFacts = restoreFacts(undefined), secondFacts = restoreFacts(undefined);
  assert.notEqual(firstFacts,secondFacts); firstFacts.waterSource = 'changed';
  assert.equal(secondFacts.waterSource,coloradoDefaults.waterSource);
  const coRestorers = registry.getStateListingPackage('CO').formRestorers;
  registry.getStateListingPackage('CO').formRestorers = { ...coRestorers, coloradoPropertyFacts: undefined };
  assert.throws(() => registry.getStateListingFormRestorer('coloradoPropertyFacts'),/No state listing/);
  registry.getStateListingPackage('CO').formRestorers = coRestorers;
  const scRestorers = registry.getStateListingPackage('SC').formRestorers;
  registry.getStateListingPackage('SC').formRestorers = { ...scRestorers, coloradoPropertyFacts: restoreFacts };
  assert.throws(() => registry.getStateListingFormRestorer('coloradoPropertyFacts'),/More than one/);
  registry.getStateListingPackage('SC').formRestorers = scRestorers;
  for (const [file, expression] of [
    ['src/app/features/sell/listing-wizard/components/property-details-step/property-details-step.component.ts',
      "getStateListingFormRestorer('coloradoPropertyFacts')(initialValue.coloradoPropertyFacts)"],
    ['src/app/features/dashboard/listing-edit/listing-edit.component.ts',
      "getStateListingFormRestorer('coloradoPropertyFacts')(listing.coloradoPropertyFacts)"],
  ]) {
    const source = fs.readFileSync(path.join(project,file),'utf8');
    assert(source.includes(expression));assert(!source.includes('COLORADO_FACT_DEFAULTS'));
  }
  console.log(`PASS: ${factsRestoreComparisons} Colorado creation/edit fact restoration comparisons; partial/missing/explicit values, form parity, fresh defaults and hook ownership preserved.`);
  for (const code of ['NC','TX','OK','UT','WI','FL','LA','CO','CA','SC']) assert.equal(registry.getStateListingPackage(code).stateCode,code);
  for (const field of ['sellerStatements.california','sellerStatements.southCarolina','coloradoPropertyFacts','coloradoAssumableLoan']) {
    const factory = registry.getStateListingFormFactory(field);
    assert.equal(typeof factory,'function');
    assert(factory(new FormBuilder()) instanceof FormGroup);
  }
  assert.throws(() => registry.getStateListingFormFactory('missing'),/No state listing/);
  const caFactory = registry.getStateListingFormFactory('sellerStatements.california');
  assert.equal(caFactory,registry.getStateListingPackage('CA').formFactories['sellerStatements.california']);
  const originalFactories = registry.getStateListingPackage('SC').formFactories;
  registry.getStateListingPackage('SC').formFactories = { 'sellerStatements.california': caFactory };
  assert.throws(() => registry.getStateListingFormFactory('sellerStatements.california'),/More than one/);
  registry.getStateListingPackage('SC').formFactories = originalFactories;
  for (const field of ['coloradoPropertyFacts','coloradoAssumableLoan']) {
    assert.equal(registry.getStateListingFormValidator(field),registry.getStateListingPackage('CO').formValidators[field]);
  }
  const registeredFacts = registry.getStateListingFormFactory('coloradoPropertyFacts')(new FormBuilder());
  registry.getStateListingFormValidator('coloradoPropertyFacts')(registeredFacts,true,()=> 'no');
  assert.equal(registeredFacts.controls.waterSource.hasError('required'),true);
  registry.getStateListingFormValidator('coloradoPropertyFacts')(registeredFacts,false,()=> 'no');
  assert.equal(registeredFacts.controls.waterSource.valid,true);
  assert.throws(()=>registry.getStateListingFormValidator('missing'),/No state listing form validator/);
  const originalValidators = registry.getStateListingPackage('SC').formValidators;
  registry.getStateListingPackage('SC').formValidators = registry.getStateListingPackage('CO').formValidators;
  assert.throws(()=>registry.getStateListingFormValidator('coloradoPropertyFacts'),/More than one/);
  registry.getStateListingPackage('SC').formValidators = originalValidators;
  console.log('PASS: registered listing validators, ownership, inactive-state reset, missing and duplicate hooks.');
  let restoreComparisons = 0;
  for (const [code, field, expectedRestore, storedValues] of [
    ['CA', 'sellerStatements.california', ca.restoreCaliforniaListingFacts,
      [undefined, null, {}, { transferDisclosure: 'exempt', transferExemptionBasis: ' inherited ' },
        { resaleWithin18Months: 'no', assistedWaterTank: 'unknown', gasApplianceRestrictions: 'local text' }]],
    ['SC', 'sellerStatements.southCarolina', loadSource(path.join(project,
      'src/app/core/domains/listings/state-packages/south-carolina/south-carolina-listing-form.ts')).restoreSouthCarolinaListingAnswers,
      [undefined, null, {}, ...[undefined,null,false,true].flatMap(beachfrontApplies =>
        [undefined,null,false,true].map(futureVacationBookingsExist => ({ beachfrontApplies, futureVacationBookingsExist })))]]
  ]) {
    const restore = registry.getStateListingFormRestorer(field);
    assert.equal(restore, registry.getStateListingPackage(code).formRestorers[field]);
    for (const stored of storedValues) {
      assert.deepEqual(JSON.parse(normalize(restore(stored))), JSON.parse(normalize(expectedRestore(stored))));
      const restoredForm = registry.getStateListingFormFactory(field)(new FormBuilder());
      restoredForm.patchValue(restore(stored), { emitEvent: false });
      assert.deepEqual(JSON.parse(normalize(restoredForm.getRawValue())), JSON.parse(normalize(expectedRestore(stored))));
      restoreComparisons++;
    }
  }
  assert.throws(() => registry.getStateListingFormRestorer('missing'), /No state listing form restorer/);
  const originalRestorers = registry.getStateListingPackage('CO').formRestorers;
  registry.getStateListingPackage('CO').formRestorers = registry.getStateListingPackage('CA').formRestorers;
  assert.throws(() => registry.getStateListingFormRestorer('sellerStatements.california'), /More than one/);
  registry.getStateListingPackage('CO').formRestorers = originalRestorers;
  assert(!component.includes('restoreCaliforniaListingFacts'));
  assert(!component.includes('restoreSouthCarolinaListingAnswers'));
  assert(component.includes("getStateListingFormRestorer('sellerStatements.california')"));
  assert(component.includes("getStateListingFormRestorer('sellerStatements.southCarolina')"));
  console.log(`PASS: ${restoreComparisons} registered draft restore comparisons, form parity, ownership, missing and duplicate hooks.`);
  const loanRestorer = registry.getStateListingFormRestorer('coloradoAssumableLoan');
  const loanSerializer = registry.getStateListingFormSerializer('coloradoAssumableLoan');
  assert.equal(loanRestorer, registry.getStateListingPackage('CO').formRestorers.coloradoAssumableLoan);
  assert.equal(loanSerializer, registry.getStateListingPackage('CO').formSerializers.coloradoAssumableLoan);
  assert.equal(loanRestorer(undefined), null);
  assert.equal(loanRestorer(null), null);
  let loanComparisons = 0;
  const registeredLoanForm = registry.getStateListingFormFactory('coloradoAssumableLoan')(new FormBuilder());
  for (const state of [undefined, 'CO', 'CA', 'SC', 'co', ' CO '])
    for (const available of [false, true])
      for (const [balance, payment] of [[0,0], [12.345,1.235], [123456.78,1456.99]]) {
        const value = { ...registeredLoanForm.getRawValue(), available,
          estimatedBalanceDollars: balance, principalInterestPaymentDollars: payment,
          paymentPeriod: ' month ', escrowOther: ' other ' };
        const saved = loanSerializer(state, value);
        assert.equal(normalize(saved), normalize(co.serializeColoradoAssumableLoan(state, value)));
        if (saved) {
          assert.equal(normalize(loanRestorer(saved)), normalize(co.restoreColoradoAssumableLoan(saved)));
          const restored = loanRestorer(saved);
          assert.equal(restored.estimatedBalanceDollars, Math.round(balance * 100) / 100);
          assert.equal(restored.principalInterestPaymentDollars, Math.round(payment * 100) / 100);
        }
        loanComparisons++;
      }
  for (const missingLoan of [null, undefined]) assert.equal(loanSerializer('CO', missingLoan), undefined);
  assert.throws(() => registry.getStateListingFormSerializer('missing'), /No state listing form serializer/);
  const otherSerializers = registry.getStateListingPackage('SC').formSerializers;
  registry.getStateListingPackage('SC').formSerializers = registry.getStateListingPackage('CO').formSerializers;
  assert.throws(() => registry.getStateListingFormSerializer('coloradoAssumableLoan'), /More than one/);
  registry.getStateListingPackage('SC').formSerializers = otherSerializers;
  const otherLoanRestorers = registry.getStateListingPackage('SC').formRestorers;
  registry.getStateListingPackage('SC').formRestorers = registry.getStateListingPackage('CO').formRestorers;
  assert.throws(() => registry.getStateListingFormRestorer('coloradoAssumableLoan'), /More than one/);
  registry.getStateListingPackage('SC').formRestorers = otherLoanRestorers;
  const wizardSource = fs.readFileSync(path.join(project,
    'src/app/features/sell/listing-wizard/listing-wizard.component.ts'), 'utf8');
  assert(!wizardSource.includes('restoreColoradoAssumableLoan'));
  assert(!wizardSource.includes('serializeColoradoAssumableLoan'));
  assert(wizardSource.includes("getStateListingFormRestorer('coloradoAssumableLoan')"));
  assert(wizardSource.includes("getStateListingFormSerializer('coloradoAssumableLoan')"));
  console.log(`PASS: ${loanComparisons} registered loan conversion comparisons, rounding, exact state gating, missing loans and duplicate hooks.`);
  const { validateStateListingQuestionAnswers } = loadSource(path.join(project,
    'src/app/core/domains/listings/state-packages/listing-question-validation.ts'));
  let saveQuestionComparisons = 0;
  for (const code of ['NC','TX','OK','UT','WI','FL','LA','CO','CA','SC'])
    for (const beachfrontApplies of [undefined,null,false,true,'false',0])
      for (const futureVacationBookingsExist of [undefined,null,false,true,'true',1]) {
        const value = { sellerStatements: { southCarolina: { beachfrontApplies, futureVacationBookingsExist } } };
        const expectedInvalid = code === 'SC' && (typeof beachfrontApplies !== 'boolean' || typeof futureVacationBookingsExist !== 'boolean');
        const validate = () => validateStateListingQuestionAnswers(registry.getStateListingPackage(code), value);
        if (expectedInvalid) assert.throws(validate, { message: 'Answer both South Carolina disclosure applicability questions.' });
        else assert.doesNotThrow(validate);
        saveQuestionComparisons++;
      }
  for (const value of [undefined,null,{}, { sellerStatements: {} }, { sellerStatements: { southCarolina: null } }])
    assert.throws(() => validateStateListingQuestionAnswers(registry.getStateListingPackage('SC'), value),
      { message: 'Answer both South Carolina disclosure applicability questions.' });
  const syntheticPackage = { questionGroups: [{ questions: [
    { required: false, fieldPath: 'optional', requiredMessage: 'unused' },
    { required: true, fieldPath: 'other.answer', requiredMessage: 'Select an answer.' }
  ] }] };
  assert.doesNotThrow(() => validateStateListingQuestionAnswers(syntheticPackage, { other: { answer: false } }));
  assert.throws(() => validateStateListingQuestionAnswers(syntheticPackage, {}), { message: 'Select an answer.' });
  assert(wizardSource.includes('validateStateListingQuestionAnswers(statePackage, propertyDetails)'));
  assert(!wizardSource.includes("typeof statements.southCarolina?.beachfrontApplies"));
  console.log(`PASS: ${saveQuestionComparisons} ten-state question save comparisons; invalid types, missing groups, optional questions and original error preserved.`);
  let outerRestoreCount = 0;
  for (const california of [undefined,null,{}, { transferDisclosure: 'exempt' },
    { resaleWithin18Months: 'no', gasApplianceRestrictions: 'local text' }])
    for (const beachfrontApplies of [undefined,null,false,true])
      for (const futureVacationBookingsExist of [undefined,null,false,true]) {
        const saved = { california, southCarolina: { beachfrontApplies, futureVacationBookingsExist } };
        const restored = registry.restoreStateListingSellerStatements(saved);
        const expected = {
          southCarolina: { beachfrontApplies: beachfrontApplies ?? null,
            futureVacationBookingsExist: futureVacationBookingsExist ?? null },
          california: california ?? { ...ca.CALIFORNIA_LISTING_FACT_DEFAULTS }
        };
        assert.deepEqual(JSON.parse(normalize(restored)), JSON.parse(normalize(expected)));
        if (california != null) assert.equal(restored.california, california);
        outerRestoreCount++;
      }
  for (const saved of [undefined,null,{}]) {
    const restored = registry.restoreStateListingSellerStatements(saved);
    assert.deepEqual(JSON.parse(normalize(restored)), {
      california: JSON.parse(normalize(ca.CALIFORNIA_LISTING_FACT_DEFAULTS)),
      southCarolina: { beachfrontApplies: null, futureVacationBookingsExist: null }
    });
  }
  const defaultsOne = registry.restoreStateListingSellerStatements(undefined);
  const defaultsTwo = registry.restoreStateListingSellerStatements(undefined);
  assert.notEqual(defaultsOne.california, defaultsTwo.california);
  assert.notEqual(defaultsOne.southCarolina, defaultsTwo.southCarolina);
  const originalDraftRestorer = registry.getStateListingPackage('CO').restoreSellerStatements;
  registry.getStateListingPackage('CO').restoreSellerStatements = registry.getStateListingPackage('CA').restoreSellerStatements;
  assert.throws(() => registry.restoreStateListingSellerStatements({}), /More than one state listing draft restorer/);
  registry.getStateListingPackage('CO').restoreSellerStatements = originalDraftRestorer;
  assert(wizardSource.includes('...restoreStateListingSellerStatements(draft.sellerStatements)'));
  assert(!wizardSource.includes('CALIFORNIA_LISTING_FACT_DEFAULTS'));
  console.log(`PASS: ${outerRestoreCount} outer-wizard restore comparisons; partial California facts, false SC answers, fresh defaults and duplicate ownership preserved.`);
  let propertyVisibilityCount = 0;
  for (const code of ['NC','TX','OK','UT','WI','FL','LA','CO','CA','SC','XX',''])
    for (const supplied of [code, code.toLowerCase(), ` ${code.toLowerCase()} `]) {
      const expected = ['WI','FL','LA','CA','SC','CO'].includes(supplied.trim().toUpperCase());
      assert.equal(registry.showsStateListingPropertyField(supplied,'legalDescription'), expected);
      propertyVisibilityCount++;
    }
  assert.equal(registry.showsStateListingPropertyField('SC','unknown'), false);
  assert(component.includes("showsStateListingPropertyField(this.stateCode(), 'legalDescription')"));
  assert(!component.includes("['WI', 'FL', 'LA', 'CA', 'SC', 'CO']"));
  const legalMethodFrom = component.indexOf('  private configureLegalDescriptionValidators()');
  const legalMethodTo = component.indexOf('  private configureLeaseValidators()',legalMethodFrom);
  const legalModule = { exports: {} };
  vm.runInNewContext(compile(`export class Test { ${component.slice(legalMethodFrom,legalMethodTo)} }`),
    { module: legalModule, exports: legalModule.exports, Validators });
  const legalTest = new legalModule.exports.Test();
  const legalControl = new FormControl('');
  legalTest.form = { controls: { legalDescription: legalControl } };
  let legalEvents = 0; legalControl.valueChanges.subscribe(() => legalEvents++);
  legalTest.configureLegalDescriptionValidators();
  assert.equal(legalControl.valid,true); assert.equal(legalControl.touched,false); assert.equal(legalEvents,0);
  legalControl.setValue('x'.repeat(5000)); assert.equal(legalControl.valid,true);
  legalControl.setValue('x'.repeat(5001)); assert.equal(legalControl.hasError('maxlength'),true);
  console.log(`PASS: ${propertyVisibilityCount} property-field visibility comparisons; normalized/unknown states and optional legal-description length validation preserved.`);
  let visibilityComparisons = 0;
  for (const stateCode of ['NC','TX','OK','UT','WI','FL','LA','CO','CA','SC','XX'])
    for (const documentType of ['colorado-association-documents','south-carolina-association-documents',
      'south-carolina-coastal-disclosure','south-carolina-vacation-rentals','lead-based-paint'])
      for (const ownersAssociationApplies of [undefined,null,false,true])
        for (const beachfrontApplies of [null,false,true])
          for (const futureVacationBookingsExist of [null,false,true]) {
            const context = { stateCode, ownersAssociationApplies,
              southCarolinaAnswers: { beachfrontApplies, futureVacationBookingsExist } };
            // Original component decision order, including cross-state document behavior.
            const expected = documentType === 'colorado-association-documents' ? ownersAssociationApplies === true
              : stateCode !== 'SC' ? true
              : documentType === 'south-carolina-association-documents' ? ownersAssociationApplies !== false
              : documentType === 'south-carolina-coastal-disclosure' ? beachfrontApplies === true
              : documentType === 'south-carolina-vacation-rentals' ? futureVacationBookingsExist === true : true;
            assert.equal(registry.isStateListingDisclosureCardVisible(documentType,context),expected);
            visibilityComparisons++;
          }
  const visibilityComponent = fs.readFileSync(path.join(project,
    'src/app/features/dashboard/listing-disclosures-management/listing-disclosures-management.component.ts'),'utf8');
  assert(visibilityComponent.includes('if (!listing) return false;'));
  assert(visibilityComponent.includes('southCarolinaAnswers: this.southCarolinaSavedAnswers()'));
  assert(visibilityComponent.includes('getSouthCarolinaDisclosureAnswers(this.listingUid)'));
  const scVisibility = registry.getStateListingPackage('SC').disclosureCardVisibility;
  registry.getStateListingPackage('SC').disclosureCardVisibility = {
    ...scVisibility, 'colorado-association-documents': () => true };
  assert.throws(() => registry.isStateListingDisclosureCardVisible('colorado-association-documents',{}),/More than one/);
  registry.getStateListingPackage('SC').disclosureCardVisibility = scVisibility;
  console.log(`PASS: ${visibilityComparisons} disclosure visibility comparisons; saved SC answer source and duplicate-rule guard.`);
  console.log('PASS: South Carolina defaults, 16 answer restoration combinations, reset and registered form factory.');
  console.log('PASS: package question paths, null/false/true validation, untouched errors, false answer restoration, inactive-state validation generic rendering, California defaults/restore/reset parity, Colorado controls/loan roundtrip/rounding/state gating, ten-state registry/factory ownership/missing and duplicate hooks.');
})().catch(error => { console.error(error); process.exitCode = 1; });
