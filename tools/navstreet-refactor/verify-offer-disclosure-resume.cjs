const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const project = path.resolve(process.argv[2] || '.');
const ts = require(require.resolve('typescript',{paths:[project]}));
function loadClass(method) {
  const module = {exports:{}};
  vm.runInNewContext(ts.transpileModule(`export class Test { ${method} }`,{compilerOptions:{
    module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,
  }}).outputText,{module,exports:module.exports});return module.exports.Test;
}
const source = fs.readFileSync(path.join(project,
  'src/app/features/offers/engine/services/offer-workflow.service.ts'),'utf8');
const Workflow = loadClass(source.slice(source.indexOf('  assertCurrentEditableDraft<'),
  source.indexOf('  async createAndLoadDraft(')));
const originals = {"california": "  private async loadOfferSession(\n    offerUid: string,\n    offerVersionUid: string,\n    expectedContractType?: string\n  ): Promise<void> {\n    const [offer, version] =\n      await this.workflow.loadValidatedOfferVersion<CaliforniaOfferTerms>(\n        offerUid, offerVersionUid, 'CA', 'California', expectedContractType\n      );\n\n    if (offer.listingUid !== this.listingUid || offer.currentVersionUid !== version.Uid || version.status !== 'draft' || offer.status !== 'draft' || version.initiatedByUid !== this.offerService.currentUserUid) {\n      throw new Error('This is not your current editable draft version.');\n    }\n    this.currentOffer.set(offer);\n    const exactDocuments=await Promise.all(Object.entries(version.terms.documentVersions).map(([type,id])=>\n      this.listingDisclosureService.getDisclosureVersion(this.listingUid,type as DisclosureDocumentType,id)));\n    const documents=[...this.listingDisclosures()];\n    for(const exact of exactDocuments) {\n      if(!exact) throw new Error('A disclosure version acknowledged in this offer is missing.');\n      const index=documents.findIndex(d=>d.documentType===exact.documentType);\n      if(index>=0) documents[index]=exact; else documents.push(exact);\n    }\n    this.listingDisclosures.set(documents);\n    this.currentVersion.set(version);\n    this.property.set(\n      version.terms.property\n    );\n  }\n\n\n", "south-carolina": "  private async loadOfferSession(\n    offerUid: string,\n    offerVersionUid: string,\n    expectedContractType?: string\n  ): Promise<void> {\n    const [offer, version] =\n      await this.workflow.loadValidatedOfferVersion<SouthCarolinaOfferTerms>(\n        offerUid, offerVersionUid, 'SC', 'South Carolina', expectedContractType\n      );\n\n    if (offer.listingUid !== this.listingUid || offer.currentVersionUid !== version.Uid || version.status !== 'draft' || offer.status !== 'draft' || version.initiatedByUid !== this.offerService.currentUserUid) {\n      throw new Error('This is not your current editable draft version.');\n    }\n    this.currentOffer.set(offer);\n    const exactDocuments=await Promise.all(Object.entries(version.terms.documentVersions).map(([type,id])=>\n      this.listingDisclosureService.getDisclosureVersion(this.listingUid,type as DisclosureDocumentType,id)));\n    const documents=[...this.listingDisclosures()];\n    for(const exact of exactDocuments) {\n      if(!exact) throw new Error('A disclosure version acknowledged in this offer is missing.');\n      const index=documents.findIndex(d=>d.documentType===exact.documentType);\n      if(index>=0) documents[index]=exact; else documents.push(exact);\n    }\n    this.listingDisclosures.set(documents);\n    const availableVersions = Object.fromEntries(documents.map(document => [document.documentType, document.versionId]));\n    this.currentVersion.set({...version, terms: {...version.terms, documentVersions: {...availableVersions, ...version.terms.documentVersions}}});\n    this.property.set(\n      version.terms.property\n    );\n  }\n\n\n"};
const normalize = value => JSON.parse(JSON.stringify(value));
async function run(Entry, state, count, scenario) {
  const entry = new Entry(); const events = [];entry.listingUid = 'listing';
  const documents = [{documentType:'lead_based_paint',versionId:'current',payload:'current'},
    {documentType:'other',versionId:'untouched'}];
  if (scenario === 'duplicate-current') documents.push({...documents[0],versionId:'second'});
  const versions = Object.fromEntries(['lead_based_paint','property_condition'].slice(0,count)
    .map(type => [type,'acknowledged']));
  const version = {Uid:'version',stateCode:state,initiatedByUid:'buyer',status:'draft',
    terms:{documentVersions:versions,property:{address:'property'}}};
  const before = JSON.stringify({version,documents});
  const offer = {Uid:'offer',listingUid:'listing',currentVersionUid:'version',status:'draft'};
  if (scenario === 'wrong-owner') version.initiatedByUid = 'other';
  entry.offerService = {currentUserUid:'buyer'};
  entry.workflow = new Workflow();entry.workflow.offerService = entry.offerService;entry.workflow.loadValidatedOfferVersion = async () => [offer,version];
  entry.currentOffer = {set:value => events.push(['offer',normalize(value)])};
  entry.currentVersion = {set:value => events.push(['version',normalize(value)])};
  entry.property = {set:value => events.push(['property',normalize(value)])};
  entry.listingDisclosures = () => documents;
  entry.listingDisclosures.set = value => events.push(['documents',normalize(value)]);
  entry.listingDisclosureService = {getDisclosureVersion: async (...args) => {
    events.push(['read',...args]);if (scenario === 'read-failure') throw new Error('read failed');
    if (scenario === 'missing') return null;
    return {documentType:args[1],versionId:args[2],payload:'exact'};
  }};
  try {await entry.loadOfferSession('offer','version','contract');}
  catch(error) {events.push(['error',error.message]);}
  if (scenario !== 'wrong-owner') assert.equal(JSON.stringify({version,documents}),before);
  return normalize(events);
}
(async () => {
  let comparisons = 0;
  for (const [state,original] of Object.entries(originals)) {
    const filename = path.join(project,'src/app/features/offers/states',state,
      `${state}-offer-entry/${state}-offer-entry.component.ts`);
    const current = fs.readFileSync(filename,'utf8');const start = current.indexOf('  private async loadOfferSession(');
    const method = current.slice(start,current.indexOf('  private readonly workflow',start));
    assert(method.includes('this.workflow.restoreAcknowledgedDisclosures('));
    for (const count of [0,1,2]) for (const scenario of ['success','duplicate-current','missing','read-failure','wrong-owner']) {
      assert.deepEqual(await run(loadClass(method),state,count,scenario),
        await run(loadClass(original),state,count,scenario),`${state}: ${count}/${scenario}`);comparisons++;
    }
  }
  const workflow = new Workflow();const releases = [];const reads = [];let current = [];
  const pending = workflow.restoreAcknowledgedDisclosures('listing',{first:'v1',second:'v2'},
    (...args) => {reads.push(args);return new Promise(resolve => releases.push(resolve));},() => current);
  assert.equal(reads.length,2); // independent reads start together
  current = [{documentType:'late',versionId:'current'}];
  const second = {documentType:'second',versionId:'v2'};
  const first = {documentType:'first',versionId:'v1'};
  releases[1](second);releases[0](first);const result = await pending;
  assert.deepEqual(normalize(result),[...current,first,second]);
  assert.equal(result[1],first);assert.equal(result[2],second);assert.equal(current.length,1);
  console.log(`PASS: ${comparisons} CA/SC disclosure-resume comparisons; exact versions, ordered concurrent reads, replacement, missing/read failures and source retention preserved.`);
})().catch(error => {console.error(error);process.exitCode = 1;});
