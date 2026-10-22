const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const project=path.resolve(process.argv[2]||'.');
const ts=require(require.resolve('typescript',{paths:[project,path.join(project,'functions')]}));
function loadDeclarations(file,select,globals){
 const source=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true);
 const text=select(source).join('\n');const module={exports:{}};
 vm.runInNewContext(ts.transpileModule(text,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module,exports:module.exports,...globals});return module.exports;
}
(async()=>{
 await import(pathToFileURL(require.resolve('@angular/compiler',{paths:[project]})).href);
 const {FormBuilder,Validators}=await import(pathToFileURL(require.resolve('@angular/forms',{paths:[project]})).href);
 const {signal}=await import(pathToFileURL(require.resolve('@angular/core',{paths:[project]})).href);
 const helper=loadDeclarations(path.join(project,'src/app/shared/components/listings/listing-contract-facts/listing-contract-facts.component.ts'),source=>source.statements.filter(n=>ts.isFunctionDeclaration(n)&&['restoreListingContractFacts','condominiumOwnershipFromPropertyType'].includes(n.name?.text)).map(n=>n.getText(source)),{});
 const file=path.join(project,'src/app/features/dashboard/listing-edit/listing-edit.component.ts');
 const methods=['populateForm','refreshHoaValidators','createUpdateChanges','applySavedValues','watchFormChanges'];
 const {ListingEditComponent}=loadDeclarations(file,source=>{const cls=source.statements.find(n=>ts.isClassDeclaration(n)&&n.name?.text==='ListingEditComponent');return ['export class ListingEditComponent {',...cls.members.filter(n=>ts.isMethodDeclaration(n)&&methods.includes(n.name.getText(source))).map(n=>n.getText(source)),'}'];},{...helper,Validators,getStateListingFormRestorer:()=>()=>({}),takeUntilDestroyed:()=>source=>source});
 const fb=new FormBuilder();
 function make(type,saved,status='active',state='MT'){
  const listing={status,state,propertyType:type,listPrice:825000,description:'Original description',legalDescription:'Recorded unit description',sellerStatements:{contractFacts:saved,montana:{radonTestsKnown:false}},hoa:{hasHoa:false,feeAmount:null,feeFrequency:'',includedItems:[]}};
  const c=Object.create(ListingEditComponent.prototype);c.listing=signal(listing);c.hasChanges=signal(false);c.saveError=signal('');c.saveMessage=signal('');c.priceChanged=signal(false);c.refreshColoradoValidators=()=>{};
  const booleanRequired=control=>typeof control.value==='boolean'?null:{required:true};
  c.form=fb.group({contractFacts:fb.group({isCondominium:[null],isDeveloperSale:[null,booleanRequired],isLeasehold:[null,booleanRequired],dwellingUnitCount:[null]}),legalDescription:[''],coloradoPropertyFacts:fb.group({}),listPrice:[0],description:[''],hoa:fb.group({hasHoa:[false],feeAmount:[null],feeFrequency:['']})});c.form.controls.coloradoPropertyFacts.disable({emitEvent:false});c.populateForm(listing);return c;
 }
 const saved={isDeveloperSale:false,isLeasehold:false,dwellingUnitCount:null};let checks=0;
 for(const state of ['NC','TX','OK','UT','WI','FL','LA','CO','CA','SC','MI','MN','AZ','ID','OR','MO','NE','NH','AL','IN','KS','OH','DE','WA','IA','MT','MD','NM','SD','WY'])for(const type of ['condo','single_family']){
  const c=make(type,saved,'active',state);assert(c.hasChanges());assert(c.form.dirty);assert.equal(c.form.touched,false);assert.equal(c.form.valid,true);
  const answer=type==='condo';const payload=c.createUpdateChanges(c.form.getRawValue());assert.equal(payload.contractFacts.isCondominium,answer);assert.equal(payload.contractFacts.isDeveloperSale,false);assert.equal(payload.contractFacts.isLeasehold,false);
  c.watchFormChanges();c.form.controls.description.setValue('Another description');assert(c.hasChanges(),'Pending ownership repair must survive valueChanges');
  c.applySavedValues(c.form.getRawValue());assert.equal(c.listing().sellerStatements.contractFacts.isCondominium,answer);assert.equal(c.listing().sellerStatements.montana.radonTestsKnown,false,'Preserve sibling seller facts');
  c.populateForm(c.listing());assert(!c.hasChanges());assert(c.form.pristine);assert.equal(c.form.touched,false);checks++;
 }
 const complete=make('condo',{...saved,isCondominium:true});assert(!complete.hasChanges());assert(complete.form.pristine,'Already persisted answers must not become unsaved');
 const unanswered=make('condo',undefined);assert(unanswered.hasChanges());assert.equal(unanswered.form.controls.contractFacts.controls.isDeveloperSale.value,null);assert.equal(unanswered.form.controls.contractFacts.controls.isLeasehold.value,null);assert(unanswered.form.invalid,'Do not invent No answers for missing seller questions');assert.equal(unanswered.form.touched,false);
 for(const status of ['draft','under_contract','sold'])assert(!make('condo',saved,status).hasChanges(),'Do not mark protected/inactive listings for migration');
 assert(!make('',saved).hasChanges(),'Do not persist an unknown property type as a boolean');
 console.log('PASS: '+checks+' actual Edit Listing restoration/payload/save-reload cases; pending derived ownership survives changes, complete answers stay pristine, untouched validation, explicit false values, missing seller answers, sibling facts and inactive-listing protection.');
})().catch(e=>{console.error(e);process.exitCode=1});
