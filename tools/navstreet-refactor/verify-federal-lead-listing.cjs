const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const project=path.resolve(process.argv[2]||'.');
const ts=require(require.resolve('typescript',{paths:[project]}));
const compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function run(source,globals={}){const module={exports:{}};vm.runInNewContext(compile(source),{module,exports:module.exports,...globals});return module.exports;}
(async()=>{
 const url=require('node:url').pathToFileURL;await import(url(require.resolve('@angular/compiler',{paths:[project]})).href);const forms=await import(url(require.resolve('@angular/forms',{paths:[project]})).href);
 const policy=require(path.join(project,'functions/lib/offers/state-contracts/federal-lead-policy.js'));
 const validatorFile=path.join(project,'src/app/core/domains/listings/state-packages/listing-statement-validation.ts');
 const validation=run(fs.readFileSync(validatorFile,'utf8'),{require:n=>n==='@angular/forms'?forms:{requiresStateListingField:(p,key)=>p.requiredSellerStatementFields.includes(key)}});
 const source=fs.readFileSync(path.join(project,'src/app/features/sell/listing-wizard/components/property-details-step/property-details-step.component.ts'),'utf8');
 const method=source.slice(source.indexOf('  private configureStateStatementValidators(): void {'),source.indexOf('  private configureAdditionalSellerValidators('));
 const Wizard=run('class Wizard { federalLeadWasExcluded=false; '+method+'} module.exports=Wizard;',{isFederalLeadExcluded:policy.isFederalLeadExcluded,configureListingStatementValidators:validation.configureListingStatementValidators});
 const fb=new forms.FormBuilder(),wizard=new Wizard();wizard.stateListingPackage=()=>({requiredSellerStatementFields:['leadBasedPaintApplies']});
 const controls={};for(const key of ['ownershipStatus','leadBasedPaintApplies','methamphetamineContaminationKnown','ownersAssociationApplies','fuelTankPresent'])controls[key]=fb.control(null);
 wizard.form=fb.group({propertyType:['single_family'],yearBuilt:[1980],sellerStatements:fb.group(controls)});
 const lead=wizard.form.controls.sellerStatements.controls.leadBasedPaintApplies;
 let saved;wizard.form.valueChanges.subscribe(()=>{wizard.configureStateStatementValidators();saved=wizard.form.getRawValue();});
 wizard.configureStateStatementValidators();assert.equal(lead.value,false);assert.equal(lead.hasError('required'),false);assert.equal(lead.touched,false);
 for(const year of [1978,1980,2000]){lead.setValue(true,{emitEvent:false});wizard.form.controls.yearBuilt.setValue(year);assert.equal(lead.value,false);assert.equal(saved.sellerStatements.leadBasedPaintApplies,false);assert.equal(lead.valid,true);}
 wizard.form.controls.yearBuilt.setValue(1977);assert.equal(lead.value,null,'Changing to older construction requires a fresh seller answer');assert.equal(lead.hasError('required'),true);assert.equal(lead.touched,false,'No premature error display');lead.markAsTouched();lead.setValue(true);assert.equal(lead.valid,true);
 wizard.form.controls.yearBuilt.setValue(1980);assert.equal(lead.value,false);assert.equal(lead.valid,true);assert.equal(lead.touched,true,'Preserve touch state');
 wizard.form.controls.propertyType.setValue('land');assert.equal(lead.value,false);wizard.form.controls.yearBuilt.setValue(1900);assert.equal(lead.value,false);wizard.form.controls.propertyType.setValue('single_family');assert.equal(lead.value,null);assert(lead.hasError('required'));
 // Existing publication calls receive original year/property facts, and no new collection/rule is required.
 const registry=require(path.join(project,'functions/lib/listings/state-listing-packages/state-listing.registry.js'));
 const statements={stateCode:'NC',ownershipStatus:'owned_at_least_one_year',ownersAssociationApplies:false,fuelTankPresent:false,leasesExist:false};
 registry.validateStateSellerStatements('sample','NC',statements,{yearBuilt:1980,propertyType:'single_family'});
 assert.throws(()=>registry.validateStateSellerStatements('sample','NC',statements,{yearBuilt:1977,propertyType:'single_family'}));
 console.log('PASS: actual Angular listing validator method; 1977/1978 year switches; stale flag normalization; parent autosave; untouched errors; vacant land; backend publication cutoff.');
})().catch(error=>{console.error(error);process.exitCode=1;});
