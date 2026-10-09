const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const project = path.resolve(process.argv[2] || '.');
const ts = require(require.resolve('typescript', {paths: [project]}));
const compile = source => ts.transpileModule(source, {compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
}}).outputText;
function loadClass(methods) {
  const module = {exports: {}};
  vm.runInNewContext(compile(`export class Test { ${methods} }`), {
    module, exports: module.exports,
    resolveAttachmentType: field => { if (field === 'unsupported') throw new Error('unsupported'); return 'contract_addendum'; },
  });
  return module.exports.Test;
}
const workflowSource = fs.readFileSync(path.join(project,
  'src/app/features/offers/engine/services/offer-workflow.service.ts'), 'utf8');
const helper = workflowSource.slice(workflowSource.indexOf('  async uploadAndSaveAttachment('),
  workflowSource.indexOf('  async saveAndSubmit('));
const workflow = new (loadClass(helper))();
const originals = {"south-carolina": "  protected async onDocumentSelected(\n    selection: OfferDocumentSelection\n  ): Promise<void> {\n    const offer = this.currentOffer();\n    const version = this.currentVersion();\n\n    if (\n      !offer ||\n      !version ||\n      (this.busy() || this.saving())\n    ) {\n      return;\n    }\n\n    this.uploading.set(true);\n    this.errorMessage.set('');\n\n    try {\n      const result =\n        await this.offerDocumentService\n          .uploadAttachment(\n            offer.Uid,\n            version.Uid,\n            resolveAttachmentType(\n              selection.fieldPath\n            ),\n            selection.file\n          );\n\n      this.wizard()\n        ?.applyDocumentUid(\n          selection.fieldPath,\n          result.documentUid\n        );\n      await this.flushDraftSave();\n    } catch (error) {\n      this.setError(\n        error,\n        'The selected document could not be uploaded.'\n      );\n    } finally {\n      this.uploading.set(false);\n    }\n  }\n\n\n", "oklahoma": "  protected async onDocumentSelected(\n    selection: OfferDocumentSelection\n  ): Promise<void> {\n    const offer = this.currentOffer();\n    const version = this.currentVersion();\n\n    if (\n      !offer ||\n      !version ||\n      (this.busy() || this.saving())\n    ) {\n      return;\n    }\n\n    this.uploading.set(true);\n    this.errorMessage.set('');\n\n    try {\n      const result =\n        await this.offerDocumentService\n          .uploadAttachment(\n            offer.Uid,\n            version.Uid,\n            resolveAttachmentType(\n              selection.fieldPath\n            ),\n            selection.file\n          );\n\n      this.wizard()\n        ?.applyDocumentUid(\n          selection.fieldPath,\n          result.documentUid\n        );\n      await this.flushDraftSave();\n    } catch (error) {\n      this.setError(\n        error,\n        'The selected document could not be uploaded.'\n      );\n    } finally {\n      this.uploading.set(false);\n    }\n  }\n\n\n", "florida": "  protected async onDocumentSelected(\n    selection: OfferDocumentSelection\n  ): Promise<void> {\n    const offer = this.currentOffer();\n    const version = this.currentVersion();\n\n    if (\n      !offer ||\n      !version ||\n      (this.busy() || this.saving())\n    ) {\n      return;\n    }\n\n    this.uploading.set(true);\n    this.errorMessage.set('');\n\n    try {\n      const result =\n        await this.offerDocumentService\n          .uploadAttachment(\n            offer.Uid,\n            version.Uid,\n            resolveAttachmentType(\n              selection.fieldPath\n            ),\n            selection.file\n          );\n\n      this.wizard()\n        ?.applyDocumentUid(\n          selection.fieldPath,\n          result.documentUid\n        );\n      await this.flushDraftSave();\n    } catch (error) {\n      this.setError(\n        error,\n        'The selected document could not be uploaded.'\n      );\n    } finally {\n      this.uploading.set(false);\n    }\n  }\n\n\n", "louisiana": "  protected async onDocumentSelected(\n    selection: OfferDocumentSelection\n  ): Promise<void> {\n    const offer = this.currentOffer();\n    const version = this.currentVersion();\n\n    if (\n      !offer ||\n      !version ||\n      (this.busy() || this.saving())\n    ) {\n      return;\n    }\n\n    this.uploading.set(true);\n    this.errorMessage.set('');\n\n    try {\n      const result =\n        await this.offerDocumentService\n          .uploadAttachment(\n            offer.Uid,\n            version.Uid,\n            resolveAttachmentType(\n              selection.fieldPath\n            ),\n            selection.file\n          );\n\n      this.wizard()\n        ?.applyDocumentUid(\n          selection.fieldPath,\n          result.documentUid\n        );\n      await this.flushDraftSave();\n    } catch (error) {\n      this.setError(\n        error,\n        'The selected document could not be uploaded.'\n      );\n    } finally {\n      this.uploading.set(false);\n    }\n  }\n\n", "colorado": "  protected async onDocumentSelected(\n    selection: OfferDocumentSelection\n  ): Promise<void> {\n    const offer = this.currentOffer();\n    const version = this.currentVersion();\n\n    if (\n      !offer ||\n      !version ||\n      (this.busy() || this.saving())\n    ) {\n      return;\n    }\n\n    this.uploading.set(true);\n    this.errorMessage.set('');\n\n    try {\n      const result =\n        await this.offerDocumentService\n          .uploadAttachment(\n            offer.Uid,\n            version.Uid,\n            resolveAttachmentType(\n              selection.fieldPath\n            ),\n            selection.file\n          );\n\n      this.wizard()\n        ?.applyDocumentUid(\n          selection.fieldPath,\n          result.documentUid\n        );\n      await this.flushDraftSave();\n    } catch (error) {\n      this.setError(\n        error,\n        'The selected document could not be uploaded.'\n      );\n    } finally {\n      this.uploading.set(false);\n    }\n  }\n\n", "utah": "  protected async onDocumentSelected(\n    selection: OfferDocumentSelection\n  ): Promise<void> {\n    const offer = this.currentOffer();\n    const version = this.currentVersion();\n\n    if (\n      !offer ||\n      !version ||\n      (this.busy() || this.saving())\n    ) {\n      return;\n    }\n\n    this.uploading.set(true);\n    this.errorMessage.set('');\n\n    try {\n      const result =\n        await this.offerDocumentService\n          .uploadAttachment(\n            offer.Uid,\n            version.Uid,\n            resolveAttachmentType(\n              selection.fieldPath\n            ),\n            selection.file\n          );\n\n      this.wizard()\n        ?.applyDocumentUid(\n          selection.fieldPath,\n          result.documentUid\n        );\n      await this.flushDraftSave();\n    } catch (error) {\n      this.setError(\n        error,\n        'The selected document could not be uploaded.'\n      );\n    } finally {\n      this.uploading.set(false);\n    }\n  }\n\n\n", "texas": "  protected async onDocumentSelected(\n    selection: OfferDocumentSelection\n  ): Promise<void> {\n    const offer = this.currentOffer();\n    const version = this.currentVersion();\n\n    if (\n      !offer ||\n      !version ||\n      (this.busy() || this.saving())\n    ) {\n      return;\n    }\n\n    this.uploading.set(true);\n    this.errorMessage.set('');\n\n    try {\n      const result =\n        await this.offerDocumentService\n          .uploadAttachment(\n            offer.Uid,\n            version.Uid,\n            resolveAttachmentType(\n              selection.fieldPath\n            ),\n            selection.file\n          );\n\n      this.wizard()\n        ?.applyDocumentUid(\n          selection.fieldPath,\n          result.documentUid\n        );\n      await this.flushDraftSave();\n    } catch (error) {\n      this.setError(\n        error,\n        'The selected document could not be uploaded.'\n      );\n    } finally {\n      this.uploading.set(false);\n    }\n  }\n\n\n", "california": "  protected async onDocumentSelected(\n    selection: OfferDocumentSelection\n  ): Promise<void> {\n    const offer = this.currentOffer();\n    const version = this.currentVersion();\n\n    if (\n      !offer ||\n      !version ||\n      (this.busy() || this.saving())\n    ) {\n      return;\n    }\n\n    this.uploading.set(true);\n    this.errorMessage.set('');\n\n    try {\n      const result =\n        await this.offerDocumentService\n          .uploadAttachment(\n            offer.Uid,\n            version.Uid,\n            resolveAttachmentType(\n              selection.fieldPath\n            ),\n            selection.file\n          );\n\n      this.wizard()\n        ?.applyDocumentUid(\n          selection.fieldPath,\n          result.documentUid\n        );\n      await this.flushDraftSave();\n    } catch (error) {\n      this.setError(\n        error,\n        'The selected document could not be uploaded.'\n      );\n    } finally {\n      this.uploading.set(false);\n    }\n  }\n\n\n", "wisconsin": "  protected async onDocumentSelected(\n    selection: OfferDocumentSelection\n  ): Promise<void> {\n    const offer = this.currentOffer();\n    const version = this.currentVersion();\n\n    if (\n      !offer ||\n      !version ||\n      (this.busy() || this.saving())\n    ) {\n      return;\n    }\n\n    this.uploading.set(true);\n    this.errorMessage.set('');\n\n    try {\n      const result =\n        await this.offerDocumentService\n          .uploadAttachment(\n            offer.Uid,\n            version.Uid,\n            resolveAttachmentType(\n              selection.fieldPath\n            ),\n            selection.file\n          );\n\n      this.wizard()\n        ?.applyDocumentUid(\n          selection.fieldPath,\n          result.documentUid\n        );\n      await this.flushDraftSave();\n    } catch (error) {\n      this.setError(\n        error,\n        'The selected document could not be uploaded.'\n      );\n    } finally {\n      this.uploading.set(false);\n    }\n  }\n\n\n"};
async function run(Entry, scenario) {
  const entry = new Entry(); const events = [];
  const fail = stage => { if (scenario === stage) throw new Error(stage); };
  entry.currentOffer = () => scenario === 'no-offer' ? null : {Uid: 'offer'};
  entry.currentVersion = () => scenario === 'no-version' ? null : {Uid: 'version'};
  for (const guard of ['busy','saving','creating','uploading','submitting']) {
    const fn = () => scenario === guard;
    fn.set = value => events.push([guard,value]); entry[guard] = fn;
  }
  entry.errorMessage = {set: value => events.push(['message',value])};
  entry.offerDocumentService = {uploadAttachment: async (...args) => {
    events.push(['upload',...args]); fail('upload'); return {documentUid: 'document'};
  }};
  entry.wizard = () => scenario === 'no-wizard' ? undefined : {applyDocumentUid: (...args) => {
    events.push(['apply',...args]); fail('apply');
  }};
  entry.flushDraftSave = async () => {events.push(['save']); fail('save');};
  entry.setError = (error, fallback) => events.push(['error',error.message,fallback]);
  entry.workflow = workflow;
  await entry.onDocumentSelected({fieldPath: scenario === 'unsupported' ? 'unsupported' : 'addenda.test',file: 'file'});
  return events;
}
(async () => {
  let comparisons = 0;
  for (const [state, original] of Object.entries(originals)) {
    const filename = path.join(project, 'src/app/features/offers/states', state,
      `${state}-offer-entry/${state}-offer-entry.component.ts`);
    const source = fs.readFileSync(filename,'utf8');
    const start = source.indexOf('  protected async onDocumentSelected(');
    const method = source.slice(start,source.indexOf('  protected async onSubmitRequested(',start));
    assert(method.includes('this.workflow.uploadAndSaveAttachment('));
    const Old = loadClass(original), New = loadClass(method);
    for (const scenario of ['success','no-offer','no-version','busy','saving','creating',
      'uploading','submitting','no-wizard','unsupported','upload','apply','save']) {
      assert.deepEqual(await run(New,scenario),await run(Old,scenario),`${state}: ${scenario}`);
      comparisons++;
    }
  }
  let release; const events = [];
  const pending = workflow.uploadAndSaveAttachment(() => new Promise(resolve => release = resolve),
    uid => events.push(['apply',uid]), async () => events.push(['save']));
  assert.deepEqual(events,[]); release({documentUid:'document'}); await pending;
  assert.deepEqual(events,[['apply','document'],['save']]);
  let finishSave, startedSave; let completed = false;
  const saveStarted = new Promise(resolve => startedSave = resolve);
  const saving = workflow.uploadAndSaveAttachment(async () => ({documentUid:'document'}), () => {},
    () => new Promise(resolve => {finishSave = resolve; startedSave();})).then(() => completed = true);
  await saveStarted;
  assert.equal(completed,false); finishSave(); await saving; assert.equal(completed,true);
  console.log(`PASS: ${comparisons} nine-state attachment lifecycle comparisons; guards, upload/apply/save order, failures, messages and busy reset preserved.`);
})().catch(error => {console.error(error);process.exitCode = 1;});
