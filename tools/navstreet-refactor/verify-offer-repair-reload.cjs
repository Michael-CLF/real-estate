const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const project=path.resolve(process.argv[2]||'.');const ts=require(require.resolve('typescript',{paths:[project]}));
function loadClass(method) {const module={exports:{}};vm.runInNewContext(ts.transpileModule(
 `export class Test { ${method} }`,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,
 {module,exports:module.exports});return module.exports.Test;}
const source=fs.readFileSync(path.join(project,'src/app/features/offers/engine/services/offer-workflow.service.ts'),'utf8');
const reload=source.slice(source.indexOf('  async loadOfferVersion<'),source.indexOf('  async loadValidatedOfferVersion<'));
const guard=source.slice(source.indexOf('  assertCurrentEditableDraft<'),source.indexOf('  async restoreAcknowledgedDisclosures('));
const Workflow=loadClass(reload+guard);
const originals={"texas": "  private async loadOfferSession(\n    offerUid: string,\n    offerVersionUid: string,\n    expectedContractType?: string\n  ): Promise<void> {\n    let [offer, version]: readonly [Offer | null, OfferVersion<TexasOfferTerms> | null] =\n      await this.workflow.loadValidatedOfferVersion<TexasOfferTerms>(\n        offerUid, offerVersionUid, 'TX', 'Texas', expectedContractType\n      );\n\n    const missingSellerLeaseFacts = [\n      version.terms.leases.residentialLeasesExist,\n      version.terms.leases.fixtureLeasesExist,\n      version.terms.leases.naturalResourceLeasesExist,\n    ].some(value => typeof value !== 'boolean');\n\n    if (\n      missingSellerLeaseFacts &&\n      offer.status === 'draft' &&\n      version.status === 'draft' &&\n      version.versionNumber === 1 &&\n      version.initiatedBy === 'buyer' &&\n      version.initiatedByUid === this.offerService.currentUserUid\n    ) {\n      const repaired = await this.offerService.createOrResumeDraft(\n        this.listingUid,\n        version.terms.contractType\n      );\n      if (repaired.offerUid !== offerUid || repaired.offerVersionUid !== offerVersionUid) {\n        throw new Error('The editable offer draft changed. Please reopen the current offer.');\n      }\n      [offer, version] = await Promise.all([\n        this.offerService.getOffer(offerUid),\n        this.offerService.getVersion<TexasOfferTerms>(offerUid, offerVersionUid),\n      ]);\n      if (!offer || !version || offer.stateCode !== 'TX' || version.stateCode !== 'TX' || version.terms.stateCode !== 'TX') {\n        throw new Error('The Texas offer draft could not be reloaded. Please reopen the current offer.');\n      }\n      if (expectedContractType && version.terms.contractType !== expectedContractType) {\n        throw new Error('The existing draft uses a different Texas contract form.');\n      }\n    }\n\n    this.currentOffer.set(offer);\n    this.currentVersion.set(version);\n    this.property.set(\n      version.terms.property\n    );\n  }\n\n\n", "colorado": "  private async loadOfferSession(\n    offerUid: string,\n    offerVersionUid: string,\n    expectedContractType?: string\n  ): Promise<void> {\n    let [offer, version]: readonly [Offer | null, OfferVersion<ColoradoOfferTerms> | null] =\n      await this.workflow.loadValidatedOfferVersion<ColoradoOfferTerms>(\n        offerUid, offerVersionUid, 'CO', 'Colorado', expectedContractType\n      );\n\n    this.workflow.assertCurrentEditableDraft(offer, version, this.listingUid);\n    const missingDistrict = !['covered', 'not_applicable'].includes(version.terms.propertyFacts.metroDistrict);\n    const missingLegalDescription = !version.terms.legalDescription.trim();\n    const unsigned = [...version.buyers, ...version.sellers].every(party =>\n      party.signature.status !== 'signed' && !party.signature.signedAt);\n    if ((missingDistrict || missingLegalDescription) && unsigned && !version.immutable && version.versionNumber === 1 && version.initiatedBy === 'buyer') {\n      const result = await this.offerService.createOrResumeDraft(this.listingUid, version.terms.contractType);\n      if (result.offerUid !== offerUid || result.offerVersionUid !== offerVersionUid) {\n        throw new Error('The current draft changed. Reopen the offer before continuing.');\n      }\n      [offer, version] = await Promise.all([\n        this.offerService.getOffer(offerUid),\n        this.offerService.getVersion<ColoradoOfferTerms>(offerUid, offerVersionUid),\n      ]);\n      if (!offer || !version || offer.stateCode !== 'CO' || version.stateCode !== 'CO' ||\n        version.terms.stateCode !== 'CO' || offer.listingUid !== this.listingUid ||\n        version.initiatedByUid !== this.offerService.currentUserUid ||\n        (expectedContractType && version.terms.contractType !== expectedContractType)) {\n        throw new Error('The Colorado draft changed. Reopen the offer before continuing.');\n      }\n      if (offer.currentVersionUid !== version.Uid || offer.status !== 'draft' || version.status !== 'draft' || version.immutable) {\n        throw new Error('The draft is no longer editable. Reopen the offer before continuing.');\n      }\n    }\n    this.currentOffer.set(offer);\n    this.currentVersion.set(version);\n    this.property.set(\n      version.terms.property\n    );\n  }\n\n\n"};
const normalize=value=>JSON.parse(JSON.stringify(value));
async function run(Entry,state,options={}) {
 const code=state==='texas'?'TX':'CO';const events=[];const entry=new Entry();entry.listingUid='listing';
 const offer={Uid:'offer',listingUid:'listing',currentVersionUid:'version',stateCode:code,status:options.offerStatus||'draft'};
 const version={Uid:'version',stateCode:code,status:options.versionStatus||'draft',versionNumber:options.number||1,
  initiatedBy:options.side||'buyer',initiatedByUid:options.otherUser?'other':'buyer',immutable:!!options.immutable,
  buyers:[{signature:{status:options.signed?'signed':'not_started',...(options.signedAt?{signedAt:'date'}:{})}}],sellers:[],
  terms:{stateCode:code,contractType:'contract',property:{listingUid:'listing'},
   leases:{residentialLeasesExist:options.missing?null:false,fixtureLeasesExist:false,naturalResourceLeasesExist:false},
   propertyFacts:{metroDistrict:options.missing?'unselected':'not_applicable'},legalDescription:options.missing?'':'Lot 1'}};
 if(options.legalOnly) {version.terms.propertyFacts.metroDistrict='not_applicable';version.terms.legalDescription='';}
 if(options.districtOnly) {version.terms.propertyFacts.metroDistrict='unknown';version.terms.legalDescription='Lot 1';}
 const repairedOffer=structuredClone(offer),repairedVersion=structuredClone(version);
 repairedVersion.terms.leases.residentialLeasesExist=false;
 repairedVersion.terms.propertyFacts.metroDistrict='not_applicable';repairedVersion.terms.legalDescription='Lot 1';
 if(options.reload==='offer-state')repairedOffer.stateCode='OTHER';
 if(options.reload==='version-state')repairedVersion.stateCode='OTHER';
 if(options.reload==='terms-state')repairedVersion.terms.stateCode='OTHER';
 if(options.reload==='contract')repairedVersion.terms.contractType='OTHER';
 if(options.reload==='listing')repairedOffer.listingUid='OTHER';
 if(options.reload==='owner')repairedVersion.initiatedByUid='OTHER';
 if(options.reload==='current-version')repairedOffer.currentVersionUid='OTHER';
 if(options.reload==='offer-status')repairedOffer.status='submitted';
 if(options.reload==='version-status')repairedVersion.status='submitted';
 if(options.reload==='immutable')repairedVersion.immutable=true;
 const before=JSON.stringify({offer,version,repairedOffer,repairedVersion});
 entry.offerService={currentUserUid:'buyer',createOrResumeDraft:async (...args)=>{
  events.push(['repair',...args]);if(options.repairFailure)throw new Error('repair failed');
  return {offerUid:options.changedOffer?'OTHER':'offer',offerVersionUid:options.changedVersion?'OTHER':'version'};
 },getOffer:async (...args)=>{events.push(['offer-read',...args]);if(options.reload==='read-failure')throw new Error('read failed');return options.reload==='missing-offer'?null:repairedOffer;},
 getVersion:async (...args)=>{events.push(['version-read',...args]);return options.reload==='missing-version'?null:repairedVersion;}};
 entry.workflow=new Workflow();entry.workflow.offerService=entry.offerService;
 entry.workflow.loadValidatedOfferVersion=async ()=>[offer,version];
 entry.currentOffer={set:value=>events.push(['set-offer',normalize(value)])};
 entry.currentVersion={set:value=>events.push(['set-version',normalize(value)])};
 entry.property={set:value=>events.push(['set-property',normalize(value)])};
 try{await entry.loadOfferSession('offer','version',options.noContract?undefined:'contract');}
 catch(error){events.push(['error',error.message]);}
 assert.equal(JSON.stringify({offer,version,repairedOffer,repairedVersion}),before);
 return normalize(events);
}
(async()=>{
 let comparisons=0;
 for(const [state,original]of Object.entries(originals)) {
  const filename=path.join(project,'src/app/features/offers/states',state,`${state}-offer-entry/${state}-offer-entry.component.ts`);
  const current=fs.readFileSync(filename,'utf8');const start=current.indexOf('  private async loadOfferSession(');
  const method=current.slice(start,current.indexOf('  private readonly workflow',start));assert(method.includes('this.workflow.loadOfferVersion<'));
  const Old=loadClass(original),New=loadClass(method);const cases=[];
  for(const missing of [false,true])for(const side of ['buyer','seller'])for(const number of [1,2])
   for(const immutable of [false,true])for(const signed of [false,true])for(const signedAt of [false,true])
    cases.push({missing,side,number,immutable,signed,signedAt});
  for(const offerStatus of ['draft','submitted'])for(const versionStatus of ['draft','submitted'])
   for(const otherUser of [false,true])cases.push({missing:true,offerStatus,versionStatus,otherUser});
  for(const option of ['changedOffer','changedVersion','repairFailure','noContract','legalOnly','districtOnly'])cases.push({missing:true,[option]:true});
  for(const reload of ['missing-offer','missing-version','offer-state','version-state','terms-state','contract','listing','owner',
    'current-version','offer-status','version-status','immutable','read-failure'])cases.push({missing:true,reload});
  for(const options of cases){assert.deepEqual(await run(New,state,options),await run(Old,state,options),`${state}: ${JSON.stringify(options)}`);comparisons++;}
  const clean=await run(New,state);assert(!clean.some(event=>event[0]==='repair'));
  const repair=await run(New,state,{missing:true});
  assert.deepEqual(repair.filter(event=>['repair','offer-read','version-read'].includes(event[0])).map(event=>event[0]),['repair','offer-read','version-read']);
  const changed=await run(New,state,{missing:true,changedVersion:true});
  assert(changed.some(event=>event[0]==='error'));assert(!changed.some(event=>event[0]==='set-version'));
  const immutable=await run(New,state,{missing:true,immutable:true});
  assert.equal(immutable.some(event=>event[0]==='repair'),state==='texas');
 }
 let releaseOffer,releaseVersion;const started=[];const workflow=new Workflow();
 workflow.offerService={getOffer:()=>{started.push('offer');return new Promise(resolve=>releaseOffer=resolve);},
  getVersion:()=>{started.push('version');return new Promise(resolve=>releaseVersion=resolve);}};
 const pending=workflow.loadOfferVersion('offer','version');assert.deepEqual(started,['offer','version']);
 releaseVersion('version');releaseOffer('offer');assert.deepEqual(normalize(await pending),['offer','version']);
 console.log(`PASS: ${comparisons} TX/CO repair/reload comparisons; separate eligibility rules, contract/identity guards, changed IDs, read failures, concurrent reloads and source retention preserved.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
