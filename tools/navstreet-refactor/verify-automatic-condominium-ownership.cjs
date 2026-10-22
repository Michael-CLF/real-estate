const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const project = path.resolve(process.argv[2] || '.');
const ts = require(require.resolve('typescript', {paths:[project,path.join(project,'functions')]}));
const compile = source => ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,experimentalDecorators:true}}).outputText;
function run(source, bindings = {}) {
 const module = {exports:{}};
 vm.runInNewContext(compile(source), {module,exports:module.exports,Set,...bindings});
 return module.exports;
}
(async () => {
 await import(require('node:url').pathToFileURL(require.resolve('@angular/compiler',{paths:[project]})).href);
 const forms = await import(require('node:url').pathToFileURL(require.resolve('@angular/forms',{paths:[project]})).href);
 const input = Object.assign(value => () => value, {required:() => () => undefined});
 const file = path.join(project,'src/app/shared/components/listings/listing-contract-facts/listing-contract-facts.component.ts');
 const helpers = run(fs.readFileSync(file,'utf8'), {require:name => {
  if(name === '@angular/forms') return forms;
  if(name === '@angular/core') return {Component:() => target => target,input,ChangeDetectionStrategy:{OnPush:0}};
  throw Error(name);
 }});
 const {createListingContractFactsForm:make,restoreListingContractFacts:restore,synchronizeListingCondominiumOwnership:sync,condominiumOwnershipFromPropertyType:derive} = helpers;
 const fb = new forms.FormBuilder();
 const saved = {isCondominium:true,isDeveloperSale:false,isLeasehold:true,dwellingUnitCount:4};
 assert.equal(restore(saved).isCondominium,true,'Legacy callers without a property type preserve their snapshot');
 assert.equal(derive(''),null);
 for(const type of ['single_family','condo','townhome','pud','land','multi_family','mobile','']) {
  const facts = restore(saved,type), group = make(fb);group.patchValue(saved);sync(group,type);
  const expected = type ? type === 'condo' : null;
  assert.equal(facts.isCondominium,expected);assert.equal(group.getRawValue().isCondominium,expected);
  assert.equal(facts.isDeveloperSale,false);assert.equal(facts.isLeasehold,true);assert.equal(facts.dwellingUnitCount,4);
  assert.equal(group.getRawValue().isDeveloperSale,false);assert.equal(group.getRawValue().isLeasehold,true);assert.equal(group.getRawValue().dwellingUnitCount,4);
  assert.equal(saved.isCondominium,true,'Restoration must not mutate the saved listing');
 }
 assert.deepEqual(Array.from(new helpers.ListingContractFactsComponent().questions, q => q.key),['isDeveloperSale','isLeasehold']);
 const controls = run(fs.readFileSync(path.join(project,'src/app/core/domains/listings/state-packages/listing-property-type-validation.ts'),'utf8'),{require:() => forms});
 // Execute the wizard's actual initialization/subscription against real Angular forms.
 const source = fs.readFileSync(path.join(project,'src/app/features/sell/listing-wizard/components/property-details-step/property-details-step.component.ts'),'utf8');
 const method = source.slice(source.indexOf('  ngOnInit(): void {'),source.indexOf('  private configureColoradoFactValidators()'));
 const Wizard = run('class Wizard {'+method+'} module.exports=Wizard;', {synchronizeListingCondominiumOwnership:sync,configureListingPropertyTypeControls:controls.configureListingPropertyTypeControls});
 const wizard = new Wizard();wizard.configureStateStatementValidators=()=>{};wizard.currentYear=2026;wizard.isTexasListing=() => false;
 wizard.form=fb.group({propertyType:['single_family'],bedrooms:[3],bathrooms:[2],squareFeet:[1500],yearBuilt:[2006],sellerStatements:fb.group({contractFacts:make(fb)})});
 wizard.form.controls.sellerStatements.controls.contractFacts.patchValue({isDeveloperSale:false,isLeasehold:false});
 wizard.ngOnInit();
 const answers = () => wizard.form.getRawValue().sellerStatements.contractFacts;
 assert.equal(answers().isCondominium,false);
 let emitted;
 wizard.form.valueChanges.subscribe(() => emitted = answers().isCondominium);
 for(const type of ['condo','single_family','condo','land','townhome','condo']) {
  wizard.form.controls.propertyType.setValue(type);
  assert.equal(answers().isCondominium,type === 'condo');assert.equal(emitted,type === 'condo','The parent autosave event must see the derived value');
  assert.equal(answers().isDeveloperSale,false);assert.equal(answers().isLeasehold,false);
 }
 const select = run(fs.readFileSync(path.join(project,'src/app/core/domains/offers/state-contracts/missouri/missouri-contract-selection.ts'),'utf8')).selectMissouriContract;
 assert.equal(select('condo',answers()),'navstreet_missouri_condominium_resale_2026');
 wizard.form.controls.propertyType.setValue('single_family');
 assert.equal(select('single_family',answers()),'navstreet_missouri_residential_sale_2026');
 // Exercise the actual Edit listing restoration, including missing old facts.
 const edit = fs.readFileSync(path.join(project,'src/app/features/dashboard/listing-edit/listing-edit.component.ts'),'utf8');
 const populate = edit.slice(edit.indexOf('  private populateForm('),edit.indexOf('  private refreshHoaValidators():'));
 const Edit = run('class Edit {'+populate+'} module.exports=Edit;', {restoreListingContractFacts:restore,getStateListingFormRestorer:() => value => value || {}});
 // Use real controls: populateForm also reads ownership controls and dirty state
 // when it detects an older active listing with an unsaved derived answer.
 const editor = new Edit();let changed;
 editor.form=fb.group({
  contractFacts:make(fb),legalDescription:[''],coloradoPropertyFacts:fb.group({}),
  listPrice:[0],description:[''],
  hoa:fb.group({hasHoa:[false],feeAmount:[null],feeFrequency:['']})
 });
 editor.refreshHoaValidators=() => {};editor.refreshColoradoValidators=() => {};
 editor.hasChanges={set(value){changed=value;}};
 for(const propertyType of ['condo','single_family']) {
  for(const status of ['active','draft','under_contract','sold']) {
   editor.populateForm({status,propertyType,listPrice:100,sellerStatements:{contractFacts:saved}});
   let populated=editor.form.getRawValue();
   assert.equal(populated.contractFacts.isCondominium,propertyType === 'condo');
   assert.equal(populated.contractFacts.isDeveloperSale,false);assert.equal(populated.contractFacts.isLeasehold,true);
   assert.equal(editor.form.touched,false,'Restoration must not touch the form');
   assert.equal(changed,editor.form.dirty,'Change signal must reflect the real form state');
   editor.populateForm({status,propertyType,listPrice:100});populated=editor.form.getRawValue();
   assert.equal(populated.contractFacts.isCondominium,propertyType === 'condo');
   assert.equal(populated.contractFacts.isDeveloperSale,null);assert.equal(populated.contractFacts.isLeasehold,null,'Do not invent either remaining answer');
   assert.equal(editor.form.touched,false);assert.equal(changed,editor.form.dirty);
   if(status !== 'active')assert(editor.form.pristine,'Inactive listings must not acquire a pending ownership repair');
   const matching={...saved,isCondominium:propertyType === 'condo'};
   editor.populateForm({status,propertyType,listPrice:100,sellerStatements:{contractFacts:matching}});
   assert(editor.form.pristine,'Matching persisted ownership must remain pristine');assert.equal(changed,false);
  }
 }
 console.log('PASS: real Angular form initialization/type switches/autosave values; saved draft and Edit listing restoration; removed duplicate question; preserved sale/leasehold/unit answers; Missouri residential/condominium selection.');
})().catch(error => {console.error(error);process.exitCode=1;});
