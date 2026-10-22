const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const project=path.resolve(process.argv[2]||'.');const ts=require(require.resolve('typescript',{paths:[project,path.join(project,'functions')]}));
function evaluate(source,file,globals={}){const module={exports:{}};vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module,exports:module.exports,require:n=>load(path.resolve(path.dirname(file),n+'.ts')),Date,Intl,Set,Object,Number,Map,Array,console,...globals});return module.exports;}
function load(file){return evaluate(fs.readFileSync(file,'utf8'),file);}
const gates=load(path.join(project,'src/app/core/configuration/listing-disclosure-gates.ts'));
const catalog=load(path.join(project,'src/app/core/configuration/state-disclosures.config.ts'));
const checklist=load(path.join(project,'src/app/core/configuration/listing-document-checklist.config.ts'));
const backend=require(path.join(project,'functions/lib/offers/montana-listing-disclosure-gate.js'));
const reader=require(path.join(project,'functions/lib/offers/listing-disclosure-gate-reader.js'));
const id='montana-association-documents';
const facts={yearBuilt:2000,propertyType:'condo',ownersAssociationApplies:false,contractFacts:{isCondominium:true,isDeveloperSale:false,isLeasehold:false},montana:{radonTestsKnown:false,drugContaminationKnown:false,appurtenantWaterRightsKnown:false,disclosureExemptionClaimed:false}};
const listingFor=f=>({propertyType:f.propertyType,yearBuilt:f.yearBuilt,sellerStatements:{...f}});
const requirement=catalog.getStateDisclosureRequirements('MT').find(r=>r.documentType===id);
function methods(rel,clsName,names,globals){const file=path.join(project,rel),s=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true),cls=s.statements.find(n=>ts.isClassDeclaration(n)&&n.name?.text===clsName);return evaluate('export class '+clsName+' {\n'+cls.members.filter(n=>ts.isMethodDeclaration(n)&&names.includes(n.name.getText(s))).map(n=>n.getText(s)).join('\n')+'\n}',file,globals)[clsName];}
function signal(initial){let value=initial;const get=()=>value;get.set=v=>value=v;return get;}
(async()=>{
 let cases=0;
 for(const type of ['condo','single_family','townhome','pud'])for(const year of [1977,1978,2000])for(const exemption of [true,false]){
  const f={...facts,propertyType:type,yearBuilt:year,montana:{...facts.montana,disclosureExemptionClaimed:exemption}};
  const front=gates.getListingUploadGateDocumentTypes('MT',f,Date.now());assert(front.includes(id));assert.deepEqual(JSON.parse(JSON.stringify(front)),backend.montanaRequiredDisclosureTypes(listingFor(f)));
  assert.equal(front.includes('lead-based-paint'),year<1978);assert(catalog.isDisclosureRequiredForListing('MT',requirement,f));assert(requirement.requiredBeforeOffers);cases++;
 }
 for(const ownersAssociationApplies of [true,false,null]){
  const f={...facts,propertyType:'single_family',ownersAssociationApplies,contractFacts:{...facts.contractFacts,isCondominium:false}};
  assert(!gates.getListingUploadGateDocumentTypes('MT',f,Date.now()).includes(id));assert(!catalog.isDisclosureRequiredForListing('MT',requirement,f));
 }
 const minimal={...facts,contractFacts:undefined};assert(gates.getListingUploadGateDocumentTypes('MT',minimal,Date.now()).includes(id),'Physical condo also requires upload before ownership answers are completed');
 const item=checklist.getListingDocumentChecklist('MT',facts).find(x=>x.id===id);assert.equal(item.category,'Required before offers');assert(item.timing.includes('NavStreet policy'));
 const reference={id:'listing',collection:()=>({doc:documentType=>({documentType})})};
 const doc=type=>({listingUid:'listing',stateAbbreviation:'MT',documentType:type,storagePath:'listing-disclosures/seller/listing/'+type+'/reviewed-v1.pdf',versionId:'reviewed-v1'});
 const tx=mutate=>({get:async ref=>({data:()=>({currentDocument:mutate?.(ref.documentType,doc(ref.documentType))??doc(ref.documentType)})})});
 await backend.assertMontanaListingDisclosures(tx(),reference,listingFor(facts));
 for(const invalid of [undefined,{...doc(id),listingUid:'other'},{...doc(id),stateAbbreviation:'IA'},{...doc(id),storagePath:''},{...doc(id),versionId:''},{...doc(id),documentType:'montana-seller-disclosure'}]){
  const transaction={get:async ref=>({data:()=>({currentDocument:ref.documentType===id?invalid:doc(ref.documentType)})})};
  await assert.rejects(()=>backend.assertMontanaListingDisclosures(transaction,reference,listingFor(facts)),/montana-association-documents/);
 }
 assert.deepEqual(await reader.readMissingListingDisclosures(tx(),reference,['a','b'],value=>!value),[],'Existing single-argument callbacks remain compatible');
 const Details=methods('src/app/features/marketplace/listings/pages/listing-details/listing-details.component.ts','ListingDetailsComponent',['requiredOfferDocumentTypes','requiredOfferDisclosureTitles','offerDisclosuresAreReady'],{...checklist,isFederalLeadExcluded:load(path.join(project,'src/app/core/domains/offers/federal-lead-policy.ts')).isFederalLeadExcluded});
 const details=Object.create(Details.prototype);details.disclosures=()=>[doc('montana-seller-disclosure')];details.contractCoverageMessage=()=>null;details.authenticationIsLoading=()=>false;details.isAuthenticated=()=>true;details.disclosuresAreLoading=()=>false;details.disclosureLoadError=()=>'';const publicListing={...listingFor(facts),uid:'listing',address:{stateAbbreviation:'MT'}};
 assert.equal(details.requiredOfferDisclosureTitles(publicListing).length,1);assert.equal(details.offerDisclosuresAreReady(publicListing),false);details.disclosures=()=>[doc('montana-seller-disclosure'),doc(id)];assert.equal(details.requiredOfferDisclosureTitles(publicListing).length,0);assert.equal(details.offerDisclosuresAreReady(publicListing),true);
 const Management=methods('src/app/features/dashboard/listing-management/listing-management.component.ts','ListingManagementComponent',['loadDisclosureStatus'],catalog);
 const management=Object.create(Management.prototype);management.listingUid='listing';management.listing=()=>listingFor(facts);for(const n of ['disclosureStatusIsLoading','disclosureStatusError','requiredDisclosureCount','uploadedDisclosureCount','missingDisclosureTitles','verifiedDisclosureTypes'])management[n]=signal(null);
 management.disclosureService={getListingDisclosures:async()=>[{documentType:'montana-seller-disclosure',currentDocument:doc('montana-seller-disclosure')}]};await management.loadDisclosureStatus('MT');assert.equal(management.requiredDisclosureCount(),2);assert.equal(management.uploadedDisclosureCount(),1);assert.equal(management.missingDisclosureTitles().length,1);
 management.disclosureService.getListingDisclosures=async()=>['montana-seller-disclosure',id].map(type=>({documentType:type,currentDocument:doc(type)}));await management.loadDisclosureStatus('MT');assert.equal(management.uploadedDisclosureCount(),2);
 const Upload=methods('src/app/features/dashboard/listing-disclosures-management/listing-disclosures-management.component.ts','ListingDisclosuresManagementComponent',['isRequiredForCurrentListing'],catalog);const upload=Object.create(Upload.prototype);upload.listing=()=>({...listingFor(facts),state:'MT'});assert.equal(upload.isRequiredForCurrentListing(requirement),true);upload.listing=()=>({...listingFor({...facts,propertyType:'single_family',contractFacts:{isCondominium:false}}),state:'MT'});assert.equal(upload.isRequiredForCurrentListing(requirement),false);
 const Review=methods('src/app/features/sell/listing-wizard/components/review-step/review-step.component.ts','ReviewStepComponent',['isDisclosureRequired'],catalog);const review=Object.create(Review.prototype);review.address=()=>({state:'MT'});review.propertyDetails=()=>listingFor(facts);assert.equal(review.isDisclosureRequired(requirement),true);
 const template=fs.readFileSync(path.join(project,'src/app/features/dashboard/listing-disclosures-management/listing-disclosures-management.component.html'),'utf8');assert(template.includes('requirement.requiredBeforeOffers && isRequiredForCurrentListing(requirement)'));assert(template.includes('Required before offers'));
 const pkg=require(path.join(project,'functions/lib/offers/state-contracts/montana/montana-state-contract.package.js')).montanaStateContractPackage;assert.equal(pkg.listingDisclosurePolicy.assertReady,backend.assertMontanaListingDisclosures);assert.equal(pkg.listingDisclosurePolicy.assertCounterofferReady,backend.assertMontanaListingDisclosures);
 for(const file of ['create-offer-draft.ts','submit-offer.ts']){const source=fs.readFileSync(path.join(project,'functions/src/offers',file),'utf8');assert(source.includes('listingDisclosurePolicy?.assertReady'));if(file==='create-offer-draft.ts')assert(source.indexOf('listingDisclosurePolicy?.assertReady')<source.indexOf('const existingOfferQuery'));}
 console.log('PASS: '+cases+' MT ownership/year/exception parity cases, non-condo optionality, seller checklist/badge, actual listing-details blocking, actual 1-of-2 to 2-of-2 progress, backend missing/invalid/existing upload checks, draft/resume/submission/counter hooks and compatible reader callbacks.');
})().catch(e=>{console.error(e);process.exitCode=1});
