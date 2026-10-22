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
 const checklist=front('src/app/core/configuration/listing-document-checklist.config.ts'),catalog=front('src/app/core/configuration/state-disclosures.config.ts');
 const facts={yearBuilt:2000,propertyType:'single_family',ownersAssociationApplies:false,contractFacts:{isCondominium:false,isDeveloperSale:false,isLeasehold:false},iowa:{disclosureExemptionClaimed:false,privateSewageApplies:false,leadServiceLineKnown:false}};
 const items=checklist.getListingDocumentChecklist('Iowa',facts),byId=id=>items.find(item=>item.id===id);
 assert.equal(byId('iowa-seller-disclosure').category,'Required before offers');assert.match(byId('iowa-seller-disclosure').applicability,/one to four dwelling units/);assert.equal(byId('iowa-statutory-packet').category,'Supporting records');assert.equal(byId('iowa-association-documents').category,'Not applicable');assert.match(byId('iowa-association-documents').applicability,/Seller reports no owners association/);assert.equal(byId('iowa-automatic-radon-fact-sheet').category,'Provided automatically');assert(!byId('lead-based-paint'));assert(!byId('iowa-private-sewage-transfer-information'));
 assert.deepEqual(Array.from(checklist.getOfferBlockingDocumentTypes('IA',facts)),['iowa-seller-disclosure']);
 for(const yearBuilt of [1977,1978,2000])for(const exempt of [false,true]){
  const f={...facts,yearBuilt,iowa:{...facts.iowa,disclosureExemptionClaimed:exempt}};
  const required=Array.from(checklist.getOfferBlockingDocumentTypes('IA',f));
  assert.deepEqual(required,back('offers/iowa-listing-disclosure-gate').iowaRequiredDisclosureTypes({yearBuilt,sellerStatements:f}));
  assert.equal(checklist.getListingDocumentChecklist('IA',f).some(item=>item.id==='lead-based-paint'),yearBuilt<1978);
  assert.deepEqual(Array.from(catalog.getStateDisclosureRequirements('IA')).filter(r=>catalog.isDisclosureRequiredForListing('IA',r,f)).map(r=>r.documentType),required);
 }
 assert.match(checklist.getListingDocumentChecklist('IA',{...facts,iowa:{...facts.iowa,disclosureExemptionClaimed:true}})[0].applicability,/signed evidence/);
 for(const ownersAssociationApplies of [null,true])assert.equal(checklist.getListingDocumentChecklist('IA',{...facts,ownersAssociationApplies}).find(r=>r.id==='iowa-association-documents').category,'Supporting records');
 assert.equal(checklist.getListingDocumentChecklist('IA',{...facts,contractFacts:{...facts.contractFacts,isCondominium:true}}).find(r=>r.id==='iowa-association-documents').category,'Supporting records');
 assert(checklist.getListingDocumentChecklist('IA',{...facts,iowa:{...facts.iowa,privateSewageApplies:true}}).some(r=>r.id==='iowa-private-sewage-transfer-information'));
 // Exact current listing-detail methods, not a duplicate gate implementation.
 const Details=methods('src/app/features/marketplace/listings/pages/listing-details/listing-details.component.ts').ListingDetailsComponent;
 const details=Object.create(Details.prototype);let documents=[];Object.assign(details,{disclosures:()=>documents,authenticationIsLoading:()=>false,isAuthenticated:()=>true,disclosuresAreLoading:()=>false,disclosureLoadError:()=>''});
 const listing={uid:'listing',yearBuilt:2000,propertyType:'single_family',address:{stateAbbreviation:'IA'},sellerStatements:facts};
 const document=type=>({listingUid:'listing',stateAbbreviation:'IA',documentType:type,storagePath:'files/'+type,versionId:'v1'});
 assert.equal(details.offerDisclosuresAreReady(listing),false);documents=[document('lead-based-paint')];assert.equal(details.offerDisclosuresAreReady(listing),false);documents=[document('iowa-seller-disclosure')];assert.equal(details.offerDisclosuresAreReady(listing),true);
 for(const override of [{listingUid:'wrong'},{stateAbbreviation:'WA'},{storagePath:''},{versionId:''}]){documents=[{...document('iowa-seller-disclosure'),...override}];assert.equal(details.offerDisclosuresAreReady(listing),false);}
 documents=[document('iowa-seller-disclosure')];details.disclosureLoadError=()=> 'read failed';assert.equal(details.offerDisclosuresAreReady(listing),false);details.disclosureLoadError=()=>'';
 // Existing manage-listing count: the year-2000 condition document alone produces 1 of 1.
 const Manage=methods('src/app/features/dashboard/listing-management/listing-management.component.ts').ListingManagementComponent;
 for(const types of [[],['lead-based-paint'],['iowa-seller-disclosure'],['iowa-seller-disclosure','lead-based-paint']]){
  const test={listing:()=>({...listing,state:'IA'}),listingUid:'listing',disclosureService:{getListingDisclosures:async()=>types.map(type=>({documentType:type,currentDocument:document(type)}))},verifiedDisclosureTypes:signal([]),requiredDisclosureCount:signal(0),uploadedDisclosureCount:signal(0),missingDisclosureTitles:signal([]),disclosureStatusError:signal(''),disclosureStatusIsLoading:signal(false)};
  await Manage.prototype.loadDisclosureStatus.call(test,'IA');assert.equal(test.requiredDisclosureCount(),1);assert.equal(test.uploadedDisclosureCount(),types.includes('iowa-seller-disclosure')?1:0);assert.equal(test.disclosureStatusError(),'');
 }
 const gate=back('offers/iowa-listing-disclosure-gate');let uploaded=false;
 const reference={id:'listing',collection:()=>({doc:type=>({type})})},transaction={get:async r=>({data:()=>uploaded?{currentDocument:document(r.type)}:undefined})};
 await assert.rejects(gate.assertIowaListingDisclosures(transaction,reference,{yearBuilt:2000,sellerStatements:facts}),/seller must upload/);uploaded=true;await gate.assertIowaListingDisclosures(transaction,reference,{yearBuilt:2000,sellerStatements:facts});
 // Real component form restoration, subscriptions and emitted answers.
 const Component=front('src/app/features/sell/listing-wizard/components/property-details-step/property-details-step.component.ts').PropertyDetailsStepComponent;
 function make(hoa,association){effects=[];emitted=[];const c=new Component();c.stateCode.set('IA');c.initialValue.set({propertyType:'single_family',yearBuilt:2000,hoa:{hasHoa:hoa,feeAmount:0,feeFrequency:'',associationName:'',managementCompany:'',contactPhone:''},sellerStatements:{ownersAssociationApplies:association}});for(const effect of effects.splice(0))effect();return c;}
 let c=make(false,null),h=c.form.controls.hoa.controls.hasHoa,a=c.form.controls.sellerStatements.controls.ownersAssociationApplies;
 assert.equal(a.value,false);assert.equal(a.touched,false);assert.equal(a.valid,true);
 h.setValue(true);assert.equal(a.value,true);assert.equal(c.form.controls.hoa.controls.feeAmount.value,0,'Zero fees must not infer no association');h.setValue(null);assert.equal(a.value,null);assert.equal(a.hasError('required'),true);assert.equal(a.touched,false);h.setValue(false);assert.equal(a.value,false);assert.equal(a.valid,true);assert(emitted.some(value=>value?.sellerStatements?.ownersAssociationApplies===false));
 c=make(null,false);assert.equal(c.form.controls.hoa.controls.hasHoa.value,false);
 c=make(null,null);assert.equal(c.form.controls.sellerStatements.controls.ownersAssociationApplies.value,null);
 c=make(false,true);assert.equal(c.form.controls.hoa.controls.hasHoa.value,false);assert.equal(c.form.controls.sellerStatements.controls.ownersAssociationApplies.value,true,'Conflicting stored answers remain visible for explicit correction');
 const template=fs.readFileSync(path.join(project,'src/app/features/sell/listing-wizard/components/property-details-step/property-details-step.component.html'),'utf8');assert(template.includes('Seller reports no owners association.'));assert(!template.includes('Carried forward from Homeowners Association above.'));assert(template.includes('class="seller-association-statement" disabled'));
 const manageTemplate=fs.readFileSync(path.join(project,'src/app/features/dashboard/listing-management/listing-management.component.html'),'utf8');
 assert(!manageTemplate.includes('Buyer delivery, acknowledgment and signatures are separate from uploading.'));assert(manageTemplate.includes('required documents uploaded'));
 // A missing radon acknowledgement never marks a completed condition disclosure invalid.
 const policy=front('src/app/core/domains/offers/state-contracts/iowa/iowa-disclosure-policy.ts'),backend=back('offers/state-contracts/iowa/iowa-disclosure-policy');
 const terms={disclosurePolicyRevision:policy.IOWA_DISCLOSURE_REVISION,radonFactSheetVersion:policy.IOWA_RADON_VERSION,documentVersions:{'iowa-seller-disclosure':'v1'},disclosures:{propertyConditionStatus:'received',disclosureExemptionClaimed:false,radonNoticeAcknowledged:false}};
 for(const p of [policy,backend]){assert.equal(p.iowaPreofferReceiptIssue(terms).fieldPath,'disclosures.radonNoticeAcknowledged');assert.match(p.iowaPreofferReceiptProblem(terms),/Radon/);const good=structuredClone(terms);good.disclosures.radonNoticeAcknowledged=true;assert.equal(p.iowaPreofferReceiptIssue(good),null);good.documentVersions={};assert.equal(p.iowaPreofferReceiptIssue(good).fieldPath,'disclosures.propertyConditionStatus');}
 console.log('PASS: Iowa contextual checklist, exact required IDs/counts and actual listing-detail/server gates; 1977/1978/2000 cutoff, supported exceptions, automatic radon sheet, association ownership, actual Angular HOA restoration/subscriptions/autosave, untouched validation and field-specific receipt errors.');
})().catch(error=>{console.error(error);process.exitCode=1;});
