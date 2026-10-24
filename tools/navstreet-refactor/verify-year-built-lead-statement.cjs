const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const project=path.resolve(process.argv[2]||'.'),ts=require(require.resolve('typescript',{paths:[project,path.join(project,'functions')]}));
const compile=source=>ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,experimentalDecorators:true}}).outputText;
const signal=value=>{const result=()=>value;result.set=next=>value=next;result.update=fn=>value=fn(value);return result;};
let forms,effects=[],emitted=[],injectedFormBuilder;
const input=value=>signal(value);input.required=()=>signal(undefined);
const core={Component:()=>value=>value,ChangeDetectionStrategy:{OnPush:0},computed:fn=>fn,signal,input,output:()=>({emit:value=>emitted.push(value)}),effect:fn=>effects.push(fn),inject:token=>token===forms?.FormBuilder?injectedFormBuilder:{}};
const cache=new Map();
function load(file){if(cache.has(file))return cache.get(file);const module={exports:{}};cache.set(file,module.exports);vm.runInNewContext(compile(fs.readFileSync(file,'utf8')),{module,exports:module.exports,require:n=>{
 if(n==='@angular/core')return core;if(n==='@angular/forms')return forms;
 if(n.endsWith('/firebase/firebase'))return {auth:{currentUser:{uid:'seller'}}};
 if(n.endsWith('/listing-disclosure.service'))return {ListingDisclosureService:class{}};
 if(!n.startsWith('.'))return {};
 return load(path.resolve(path.dirname(file),n+'.ts'));
},Date,Number,Map,Set,console});return module.exports;}
const front=rel=>load(path.join(project,rel)),back=rel=>require(path.join(project,'functions/lib',rel+'.js'));
const methods=(rel,globals={})=>{const module={exports:{}};vm.runInNewContext(compile(fs.readFileSync(path.join(project,rel),'utf8')),{module,exports:module.exports,require:n=>n==='@angular/core'?core:n.endsWith('listing-document-checklist.config')?front('src/app/core/configuration/listing-document-checklist.config.ts'):n.endsWith('state-disclosures.config')?front('src/app/core/configuration/state-disclosures.config.ts'):n.endsWith('federal-lead-policy')?front('src/app/core/domains/offers/federal-lead-policy.ts'):n.endsWith('state-offer-registry')?front('src/app/features/offers/engine/state-offer-registry.ts'):{},Date,Set,console,...globals});return module.exports;};
(async()=>{
 const url=require('node:url').pathToFileURL;await import(url(require.resolve('@angular/compiler',{paths:[project]})).href);forms=await import(url(require.resolve('@angular/forms',{paths:[project]})).href);injectedFormBuilder=new forms.FormBuilder();
 const Component=front('src/app/features/sell/listing-wizard/components/property-details-step/property-details-step.component.ts').PropertyDetailsStepComponent;
 const states=front('src/app/core/configuration/states.config.ts').STATES,registry=front('src/app/core/domains/listings/state-packages/state-listing.registry.ts');
 let checks=0,configured=0;const check=(actual,expected,message)=>{assert.equal(actual,expected,message);checks++;};
 function make(code,yearBuilt,stored,propertyType='single_family'){
  effects=[];emitted=[];const c=new Component();c.stateCode.set(code);
  // Test-only neutral package exercises future-state shared UI without enabling contracts.
  if(!registry.hasStateListingPackage(code))c.stateListingPackage=()=>({stateCode:code,requiredSellerStatementFields:[],questionGroups:[]});
  c.initialValue.set({propertyType,yearBuilt,hoa:{hasHoa:false,feeAmount:0,feeFrequency:'',associationName:'',managementCompany:'',contactPhone:''},sellerStatements:{leadBasedPaintApplies:stored,ownersAssociationApplies:false}});
  const rerun=effects.splice(0);for(const effect of rerun)effect();return {c,rerun};
 }
 check(states.length,50,'complete state inventory');
 for(const state of states){const code=state.abbreviation;if(registry.hasStateListingPackage(code))configured++;
  for(const [year,expected]of [[1959,true],[1977,true],[1978,false],[2000,false]])for(const stored of [null,false,true]){
   const {c,rerun}=make(code,year,stored),lead=c.form.controls.sellerStatements.controls.leadBasedPaintApplies;
   check(lead.value,expected,code+' restoration '+year);check(lead.touched,false,'untouched');check(c.requiresLeadBasedPaint(),expected,'pre-1978 UI only');
   if(stored!==expected)check(emitted.some(x=>x?.sellerStatements?.leadBasedPaintApplies===expected),true,'corrected answer emitted');
   emitted=[];c.initialValue.set({...c.form.getRawValue()});for(const effect of rerun)effect();check(emitted.filter(x=>x&&typeof x==='object').length,0,'normalized restoration does not loop');
   lead.setValue(!expected);check(lead.value,expected,'manual answer reset');
   c.form.controls.yearBuilt.setValue(1978);check(lead.value,false,'switch to 1978');check(c.requiresLeadBasedPaint(),false,'hide');
   c.form.controls.yearBuilt.setValue(1977);check(lead.value,true,'switch back');check(c.requiresLeadBasedPaint(),true,'show locked');
   check(emitted.some(x=>x?.yearBuilt===1977&&x?.sellerStatements?.leadBasedPaintApplies===true),true,'raw value emitted');
  }
  for(const year of [null,0,1599,1977.5,new Date().getFullYear()+2]){const{c}=make(code,year,false);check(c.form.controls.sellerStatements.controls.leadBasedPaintApplies.value,null,'invalid year no invented answer');check(c.requiresLeadBasedPaint(),false,'invalid no field');}
  const{c}=make(code,null,true,'land');check(c.form.controls.sellerStatements.controls.leadBasedPaintApplies.value,false,'nonhousing land exclusion');
 }
 const html=fs.readFileSync(path.join(project,'src/app/features/sell/listing-wizard/components/property-details-step/property-details-step.component.html'),'utf8');
 check(/<select[^>]*id="leadBasedPaintApplies"/.test(html),false,'no selectable exemption');check(/<input id="leadBasedPaintApplies"[^>]*disabled[\s\S]*?Required — property built before 1978/.test(html),true,'locked gray input');
 console.log('PASS: '+checks+' shared lead assertions across all 50 state codes ('+configured+' configured packages; unconfigured states use a test-only neutral package). Actual Angular controls, year transitions, stale-draft autosave, no emission loop, untouched state, invalid years, land exclusion and locked template. State activation unchanged.');
})().catch(error=>{console.error(error);process.exitCode=1;});
