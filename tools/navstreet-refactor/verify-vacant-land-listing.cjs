const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const project=path.resolve(process.argv[2]||'.');const ts=require(require.resolve('typescript',{paths:[project,path.join(project,'functions')]}));
(async()=>{
 await import(require('node:url').pathToFileURL(require.resolve('@angular/compiler',{paths:[project]})).href);
 const forms=await import(require('node:url').pathToFileURL(require.resolve('@angular/forms',{paths:[project]})).href);
 const file=path.join(project,'src/app/core/domains/listings/state-packages/listing-property-type-validation.ts'),module={exports:{}};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module,exports:module.exports,require:()=>forms,Object});
 const configure=module.exports.configureListingPropertyTypeControls,form=new forms.FormBuilder().group({bedrooms:[null],bathrooms:[null],squareFeet:[null],yearBuilt:[null]});
 configure(form.controls,'single_family',2026);assert.equal(form.valid,false);
 form.setValue({bedrooms:3,bathrooms:2,squareFeet:1800,yearBuilt:2000});assert.equal(form.valid,true);
 configure(form.controls,'land',2026);assert.equal(form.valid,true);assert.deepEqual(form.getRawValue(),{bedrooms:0,bathrooms:0,squareFeet:0,yearBuilt:null});
 configure(form.controls,'single_family',2026);assert.equal(form.valid,false);assert(form.controls.squareFeet.invalid);assert(form.controls.yearBuilt.invalid);
 form.patchValue({squareFeet:1200,yearBuilt:1900});assert.equal(form.valid,true);
 const service=fs.readFileSync(path.join(project,'functions/src/payments/stripe-payment-webhook.ts'),'utf8');assert(service.includes("'yearBuilt',"));assert(service.includes('addOptionalField('));
 console.log('PASS: actual Angular controls; valid house, vacant land without a invented construction year, zero residential measurements, and restored house requirements after switching types.');
})().catch(error=>{console.error(error);process.exitCode=1;});
