const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');const assert=require('node:assert/strict');const {pathToFileURL}=require('node:url');
const project=path.resolve(process.argv[2]||'.');const ts=require(require.resolve('typescript',{paths:[project]}));
const compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const resolve=n=>pathToFileURL(require.resolve(n,{paths:[project]})).href;
(async()=>{await import(resolve('@angular/compiler'));const forms=await import(resolve('@angular/forms'));
 function load(s,globals={}){const module={exports:{}};vm.runInNewContext(compile(s),{module,exports:module.exports,URL,...globals});return module.exports;}
 const folder=path.join(project,'src/app/core/domains/listings/state-packages');
 const model=load(fs.readFileSync(path.join(folder,'state-listing-package.ts'),'utf8'));
 const helper=load(fs.readFileSync(path.join(folder,'listing-lease-validation.ts'),'utf8'),{require:n=>n==='@angular/forms'?forms:model});
 const old=load("export class Legacy {\n  private configureLeaseValidators(\n    isTexasListing: boolean,\n  ): void {\n    const controls =\n      this.form.controls.sellerStatements\n        .controls;\n    const texasLeaseControls = [\n      controls.residentialLeasesExist,\n      controls.fixtureLeasesExist,\n      controls.naturalResourceLeasesExist,\n    ];\n    if (isTexasListing) {\n      controls.leasesExist.clearValidators();\n      texasLeaseControls.forEach(\n        control => {\n          control.setValidators([\n            Validators.required,\n          ]);\n        },\n      );\n    } else if (\n      this.requiresGeneralLeases()\n    ) {\n      controls.leasesExist.setValidators([\n        Validators.required,\n      ]);\n      texasLeaseControls.forEach(\n        control => {\n          control.clearValidators();\n        },\n      );\n    } else {\n      controls.leasesExist.clearValidators();\n      texasLeaseControls.forEach(\n        control => {\n          control.clearValidators();\n        },\n      );\n    }\n    controls.leasesExist.updateValueAndValidity({\n      emitEvent: false,\n    });\n    texasLeaseControls.forEach(\n      control => {\n        control.updateValueAndValidity({\n          emitEvent: false,\n        });\n      },\n    );\n  }\n\n}",{Validators:forms.Validators});
 const cache=new Map();function loadFile(file){file=path.resolve(file);if(cache.has(file))return cache.get(file);const result=load(fs.readFileSync(file,'utf8'),{require:n=>n==='@angular/forms'?forms:loadFile(path.resolve(path.dirname(file),n+'.ts'))});cache.set(file,result);return result;}
 const registry=loadFile(path.join(folder,'state-listing.registry.ts'));const keys=['leasesExist','residentialLeasesExist','fixtureLeasesExist','naturalResourceLeasesExist'];let count=0;
 const snapshot=c=>JSON.stringify(Object.fromEntries(keys.map(k=>[k,{value:c[k].value,errors:c[k].errors,touched:c[k].touched}])));
 for(const code of ['NC','TX','OK','UT','WI','FL','LA','CO','CA','SC'])for(const value of [null,false,true])for(const touched of [false,true]) {
  const pkg=registry.getStateListingPackage(code);const make=()=>Object.fromEntries(keys.map(k=>{const c=new forms.FormControl(value);if(touched)c.markAsTouched();return [k,c];}));const a=make(),b=make();
  const legacy=new old.Legacy();legacy.form={controls:{sellerStatements:{controls:a}}};legacy.requiresGeneralLeases=()=>model.requiresStateListingField(pkg,'generalLeasesExist');legacy.configureLeaseValidators(code==='TX');
  let events=0;for(const control of Object.values(b))control.valueChanges.subscribe(()=>events++);
  helper.configureListingLeaseValidators(b,pkg);assert.equal(snapshot(b),snapshot(a));assert.equal(events,0);count++;
 }
 console.log(`PASS: ${count} ten-state lease-validation comparisons; null/false/true answers, touch state, general/category requirements and silent updates preserved.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
