const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const project = path.resolve(process.argv[2] || '.');
const ts = require(require.resolve('typescript', {paths:[project]}));
function loadClass(method) {
  const module = {exports:{}};
  const code = ts.transpileModule(`export class Test { ${method} }`,{compilerOptions:{
    module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,
  }}).outputText;
  vm.runInNewContext(code,{module,exports:module.exports});return module.exports.Test;
}
const source = fs.readFileSync(path.join(project,
  'src/app/features/offers/engine/services/offer-workflow.service.ts'),'utf8');
const Workflow = loadClass(source.slice(source.indexOf('  async createAndLoadDraft('),
  source.indexOf('  async uploadAndSaveAttachment(')));
const originals = {"south-carolina": "  private async createInitialDraft(): Promise<void> {\n    if (\n      (this.busy() || this.saving()) ||\n      this.currentVersion()\n    ) {\n      return;\n    }\n\n    this.creating.set(true);\n    this.errorMessage.set('');\n\n    try {\n      const result =\n        await this.offerService\n          .createOrResumeDraft(\n            this.listingUid,\n            'navstreet_south_carolina_residential_sale_2026'\n          );\n\n      await this.loadOfferSession(\n        result.offerUid,\n        result.offerVersionUid,\n        'navstreet_south_carolina_residential_sale_2026'\n      );\n    } catch (error) {\n      this.setError(\n        error,\n        'The South Carolina offer draft could not be created.'\n      );\n    } finally {\n      this.creating.set(false);\n    }\n  }\n\n\n", "oklahoma": "  private async createInitialDraft(): Promise<void> {\n    if (\n      (this.busy() || this.saving()) ||\n      this.currentVersion()\n    ) {\n      return;\n    }\n\n    this.creating.set(true);\n    this.errorMessage.set('');\n\n    try {\n      const result =\n        await this.offerService\n          .createOrResumeDraft(\n            this.listingUid,\n            'residential_sale_2026'\n          );\n\n      await this.loadOfferSession(\n        result.offerUid,\n        result.offerVersionUid,\n        'residential_sale_2026'\n      );\n    } catch (error) {\n      this.setError(\n        error,\n        'The Oklahoma offer draft could not be created.'\n      );\n    } finally {\n      this.creating.set(false);\n    }\n  }\n\n\n", "florida": "  private async createInitialDraft(): Promise<void> {\n    if (\n      (this.busy() || this.saving()) ||\n      this.currentVersion()\n    ) {\n      return;\n    }\n\n    this.creating.set(true);\n    this.errorMessage.set('');\n\n    try {\n      const result =\n        await this.offerService\n          .createOrResumeDraft(\n            this.listingUid,\n            'navstreet_florida_residential_sale_2026'\n          );\n\n      await this.loadOfferSession(\n        result.offerUid,\n        result.offerVersionUid,\n        'navstreet_florida_residential_sale_2026'\n      );\n    } catch (error) {\n      this.setError(\n        error,\n        'The Florida offer draft could not be created.'\n      );\n    } finally {\n      this.creating.set(false);\n    }\n  }\n\n\n", "louisiana": "  private async createInitialDraft(): Promise<void> {\n    if (\n      (this.busy() || this.saving()) ||\n      this.currentVersion()\n    ) {\n      return;\n    }\n\n    this.creating.set(true);\n    this.errorMessage.set('');\n\n    try {\n      const result =\n        await this.offerService\n          .createOrResumeDraft(\n            this.listingUid,\n            'lrec_louisiana_residential_agreement_2026'\n          );\n\n      await this.loadOfferSession(\n        result.offerUid,\n        result.offerVersionUid,\n        'lrec_louisiana_residential_agreement_2026'\n      );\n    } catch (error) {\n      this.setError(\n        error,\n        'The Louisiana offer draft could not be created.'\n      );\n    } finally {\n      this.creating.set(false);\n    }\n  }\n\n\n", "colorado": "  private async createInitialDraft(): Promise<void> {\n    if (\n      (this.busy() || this.saving()) ||\n      this.currentVersion()\n    ) {\n      return;\n    }\n\n    this.creating.set(true);\n    this.errorMessage.set('');\n\n    try {\n      const result =\n        await this.offerService\n          .createOrResumeDraft(\n            this.listingUid,\n            'navstreet_colorado_residential_2026'\n          );\n\n      await this.loadOfferSession(\n        result.offerUid,\n        result.offerVersionUid,\n        'navstreet_colorado_residential_2026'\n      );\n    } catch (error) {\n      this.setError(\n        error,\n        'The Colorado offer draft could not be created.'\n      );\n    } finally {\n      this.creating.set(false);\n    }\n  }\n\n\n", "utah": "  private async createInitialDraft(): Promise<void> {\n    if (\n      (this.busy() || this.saving()) ||\n      this.currentVersion()\n    ) {\n      return;\n    }\n\n    this.creating.set(true);\n    this.errorMessage.set('');\n\n    try {\n      const result =\n        await this.offerService\n          .createOrResumeDraft(\n            this.listingUid,\n            'navstreet_utah_residential_sale_2026'\n          );\n\n      await this.loadOfferSession(\n        result.offerUid,\n        result.offerVersionUid,\n        'navstreet_utah_residential_sale_2026'\n      );\n    } catch (error) {\n      this.setError(\n        error,\n        'The Utah offer draft could not be created.'\n      );\n    } finally {\n      this.creating.set(false);\n    }\n  }\n\n\n", "texas": "  private async createInitialDraft(): Promise<void> {\n    if (\n      (this.busy() || this.saving()) ||\n      this.currentVersion()\n    ) {\n      return;\n    }\n\n    this.creating.set(true);\n    this.errorMessage.set('');\n\n    try {\n      const result =\n        await this.offerService\n          .createOrResumeDraft(\n            this.listingUid,\n            'one_to_four_family_resale'\n          );\n\n      await this.loadOfferSession(\n        result.offerUid,\n        result.offerVersionUid,\n        'one_to_four_family_resale'\n      );\n    } catch (error) {\n      this.setError(\n        error,\n        'The Texas offer draft could not be created.'\n      );\n    } finally {\n      this.creating.set(false);\n    }\n  }\n\n\n", "california": "  private async createInitialDraft(): Promise<void> {\n    if (\n      (this.busy() || this.saving()) ||\n      this.currentVersion()\n    ) {\n      return;\n    }\n\n    this.creating.set(true);\n    this.errorMessage.set('');\n\n    try {\n      const result =\n        await this.offerService\n          .createOrResumeDraft(\n            this.listingUid,\n            'navstreet_california_residential_sale_2026'\n          );\n\n      await this.loadOfferSession(\n        result.offerUid,\n        result.offerVersionUid,\n        'navstreet_california_residential_sale_2026'\n      );\n    } catch (error) {\n      this.setError(\n        error,\n        'The California offer draft could not be created.'\n      );\n    } finally {\n      this.creating.set(false);\n    }\n  }\n\n\n", "wisconsin": "  private async createInitialDraft(): Promise<void> {\n    if (\n      (this.busy() || this.saving()) ||\n      this.currentVersion()\n    ) {\n      return;\n    }\n\n    this.creating.set(true);\n    this.errorMessage.set('');\n\n    try {\n      const result =\n        await this.offerService\n          .createOrResumeDraft(\n            this.listingUid,\n            'navstreet_wisconsin_residential_sale_2026'\n          );\n\n      await this.loadOfferSession(\n        result.offerUid,\n        result.offerVersionUid,\n        'navstreet_wisconsin_residential_sale_2026'\n      );\n    } catch (error) {\n      this.setError(\n        error,\n        'The Wisconsin offer draft could not be created.'\n      );\n    } finally {\n      this.creating.set(false);\n    }\n  }\n\n\n"};
async function run(Entry, scenario) {
  const entry = new Entry(); const events = []; entry.listingUid = 'listing';
  entry.busy = () => scenario === 'busy'; entry.saving = () => scenario === 'saving';
  entry.currentVersion = () => scenario === 'existing' ? {Uid:'existing'} : null;
  entry.creating = {set:value => events.push(['creating',value])};
  entry.errorMessage = {set:value => events.push(['message',value])};
  entry.offerService = {createOrResumeDraft: async (...args) => {
    events.push(['create',...args]); if (scenario === 'create-failure') throw new Error('create');
    return {offerUid:'offer',offerVersionUid:'version'};
  }};
  entry.loadOfferSession = async (...args) => {
    events.push(['load',...args]); if (scenario === 'load-failure') throw new Error('load');
  };
  entry.setError = (error,fallback) => events.push(['error',error.message,fallback]);
  entry.workflow = new Workflow();entry.workflow.offerService = entry.offerService;
  await entry.createInitialDraft();return events;
}
(async () => {
  let comparisons = 0;
  for (const [state,original] of Object.entries(originals)) {
    const filename = path.join(project,'src/app/features/offers/states',state,
      `${state}-offer-entry/${state}-offer-entry.component.ts`);
    const current = fs.readFileSync(filename,'utf8');const start = current.indexOf('  private async createInitialDraft(');
    const method = current.slice(start,current.indexOf('  protected onDraftChanged(',start));
    assert(method.includes('this.workflow.createAndLoadDraft('));
    for (const scenario of ['success','busy','saving','existing','create-failure','load-failure']) {
      assert.deepEqual(await run(loadClass(method),scenario),await run(loadClass(original),scenario),`${state}: ${scenario}`);
      comparisons++;
    }
  }
  const workflow = new Workflow();let releaseCreate, releaseLoad, startedLoad;
  const loadStarted = new Promise(resolve => startedLoad = resolve); const events = [];let complete = false;
  workflow.offerService = {createOrResumeDraft: () => new Promise(resolve => releaseCreate = resolve)};
  const pending = workflow.createAndLoadDraft('listing','contract',(...args) => {
    events.push(args); startedLoad(); return new Promise(resolve => releaseLoad = resolve);
  }).then(() => complete = true);
  assert.deepEqual(events,[]);releaseCreate({offerUid:'offer',offerVersionUid:'version'});
  await loadStarted;assert.deepEqual(events,[['offer','version','contract']]);assert.equal(complete,false);
  releaseLoad();await pending;assert.equal(complete,true);
  console.log(`PASS: ${comparisons} nine-state initial draft comparisons; contract selection, guards, creation/loading order, errors and creating reset preserved.`);
})().catch(error => {console.error(error);process.exitCode = 1;});
