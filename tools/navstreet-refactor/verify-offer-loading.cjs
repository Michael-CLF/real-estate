const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const project = path.resolve(process.argv[2] || process.cwd());
const ts = require(require.resolve('typescript', { paths: [project] }));
const source = fs.readFileSync(path.join(project, 'src/app/features/offers/engine/services/offer-workflow.service.ts'), 'utf8');
const api = { getOffer: async () => null, getVersion: async () => null, saveDraft: async () => {}, submitVersion: async () => {} };
const router = { navigate: async () => true };
const offerToken = {}; const routerToken = {};
const moduleObject = { exports: {} };
const sandbox = { exports: moduleObject.exports, module: moduleObject, structuredClone,
  require(name) {
    if (name === '@angular/core') return { Injectable: () => cls => cls, inject: token => token === offerToken ? api : router };
    if (name === '@angular/router') return { Router: routerToken };
    if (name === 'rxjs') return { firstValueFrom: value => value };
    if (name.endsWith('/offer.service')) return { OfferService: offerToken };
    throw new Error(`Unexpected runtime dependency ${name}`);
  }
};
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, experimentalDecorators: true }}).outputText, sandbox);
const queueModule = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(project,
  'src/app/features/offers/engine/services/offer-draft-save-queue.ts'), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }}).outputText,
  { module: queueModule, exports: queueModule.exports });
const { OfferDraftSaveQueue } = queueModule.exports;
const propertyModule = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(project,
  'src/app/features/offers/engine/offer-property-snapshot.ts'), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }}).outputText,
  { module: propertyModule, exports: propertyModule.exports });
const originalExpirations={"south-carolina": "function createDefaultExpiration(): string {\n  return new Date(\n    Date.now() +\n    DEFAULT_EXPIRATION_HOURS *\n    60 *\n    60 *\n    1000\n  ).toISOString();\n}\n\n", "oklahoma": "function createDefaultExpiration(): string {\n  return new Date(\n    Date.now() +\n    DEFAULT_EXPIRATION_HOURS *\n    60 *\n    60 *\n    1000\n  ).toISOString();\n}\n\n", "florida": "function createDefaultExpiration(): string {\n  return new Date(\n    Date.now() +\n    DEFAULT_EXPIRATION_HOURS *\n    60 *\n    60 *\n    1000\n  ).toISOString();\n}\n\n", "louisiana": "function createDefaultExpiration(): string {\n  return new Date(\n    Date.now() +\n    DEFAULT_EXPIRATION_HOURS *\n    60 *\n    60 *\n    1000\n  ).toISOString();\n}\n\n", "colorado": "function createDefaultExpiration(): string {\n  return new Date(\n    Date.now() +\n    DEFAULT_EXPIRATION_HOURS *\n    60 *\n    60 *\n    1000\n  ).toISOString();\n}\n\n", "utah": "function createDefaultExpiration(): string {\n  return new Date(\n    Date.now() +\n    DEFAULT_EXPIRATION_HOURS *\n    60 *\n    60 *\n    1000\n  ).toISOString();\n}\n\n", "texas": "function createDefaultExpiration(): string {\n  return new Date(\n    Date.now() +\n      DEFAULT_EXPIRATION_HOURS *\n      60 *\n      60 *\n      1000\n  ).toISOString();\n}\n\n", "california": "function createDefaultExpiration(): string {\n  return new Date(\n    Date.now() +\n    DEFAULT_EXPIRATION_HOURS *\n    60 *\n    60 *\n    1000\n  ).toISOString();\n}\n\n", "wisconsin": "function createDefaultExpiration(): string {\n  return new Date(\n    Date.now() +\n    DEFAULT_EXPIRATION_HOURS *\n    60 *\n    60 *\n    1000\n  ).toISOString();\n}\n\n"};
let expirationNow=0;
class ExpirationDate extends Date { static now() { return expirationNow; } }
const expirationModule={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(project,
 'src/app/features/offers/engine/offer-expiration.ts'),'utf8'),
 {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,
 {module:expirationModule,exports:expirationModule.exports,Date:ExpirationDate});
let expirationComparisons=0;
const originalAttachmentResolvers={"south-carolina": "function resolveAttachmentType(\n  fieldPath: string\n): OfferAttachmentType {\n  if (fieldPath.startsWith('addenda.')) {\n    return 'contract_addendum';\n  }\n\n  const attachmentTypes:\n    Readonly<Record<string, OfferAttachmentType>> = {\n    'propertyIdentification.legalDescriptionExhibitDocumentUid':\n      'legal_description_exhibit',\n    'propertyTerms.reservationAddendumDocumentUid':\n      'reservation_addendum',\n    'leases.residentialLeasesAddendumDocumentUid':\n      'residential_lease_addendum',\n    'leases.fixtureLeasesAddendumDocumentUid':\n      'fixture_lease_addendum',\n    'propertyAssociation.associationAddendumDocumentUid':\n      'association_addendum',\n    'disclosures.propertyCondition.documentUid':\n      'property_condition_disclosure',\n    'disclosures.leadBasedPaintAddendumDocumentUid':\n      'lead_based_paint_addendum',\n    'closingAndPossession.temporaryResidentialLeaseDocumentUid':\n      'temporary_residential_lease',\n    'construction.plansAndSpecificationsDocumentUid':\n      'plans_and_specifications',\n    'construction.buyerSelectionDocumentsUid':\n      'buyer_selection_documents',\n    'construction.builderWarrantyDocumentUid':\n      'builder_warranty',\n    'construction.thirdPartyWarrantyDocumentUid':\n      'third_party_warranty',\n  };\n\n  const attachmentType =\n    attachmentTypes[fieldPath];\n\n  if (!attachmentType) {\n    throw new Error(\n      'The selected South Carolina document field is not supported.'\n    );\n  }\n\n  return attachmentType;\n}", "oklahoma": "function resolveAttachmentType(\n  fieldPath: string\n): OfferAttachmentType {\n  if (fieldPath.startsWith('addenda.')) {\n    return 'contract_addendum';\n  }\n\n  const attachmentTypes:\n    Readonly<Record<string, OfferAttachmentType>> = {\n    'propertyIdentification.legalDescriptionExhibitDocumentUid':\n      'legal_description_exhibit',\n    'propertyTerms.reservationAddendumDocumentUid':\n      'reservation_addendum',\n    'leases.residentialLeasesAddendumDocumentUid':\n      'residential_lease_addendum',\n    'leases.fixtureLeasesAddendumDocumentUid':\n      'fixture_lease_addendum',\n    'propertyAssociation.associationAddendumDocumentUid':\n      'association_addendum',\n    'disclosures.propertyCondition.documentUid':\n      'property_condition_disclosure',\n    'disclosures.waterRights.documentUid':\n      'water_rights_disclosure',\n    'disclosures.leadBasedPaintAddendumDocumentUid':\n      'lead_based_paint_addendum',\n    'closingAndPossession.temporaryResidentialLeaseDocumentUid':\n      'temporary_residential_lease',\n    'construction.plansAndSpecificationsDocumentUid':\n      'plans_and_specifications',\n    'construction.buyerSelectionDocumentsUid':\n      'buyer_selection_documents',\n    'construction.builderWarrantyDocumentUid':\n      'builder_warranty',\n    'construction.thirdPartyWarrantyDocumentUid':\n      'third_party_warranty',\n  };\n\n  const attachmentType =\n    attachmentTypes[fieldPath];\n\n  if (!attachmentType) {\n    throw new Error(\n      'The selected Oklahoma document field is not supported.'\n    );\n  }\n\n  return attachmentType;\n}\n", "florida": "function resolveAttachmentType(\n  fieldPath: string\n): OfferAttachmentType {\n  if (fieldPath.startsWith('addenda.')) {\n    return 'contract_addendum';\n  }\n\n  const attachmentTypes:\n    Readonly<Record<string, OfferAttachmentType>> = {\n    'propertyIdentification.legalDescriptionExhibitDocumentUid':\n      'legal_description_exhibit',\n    'propertyTerms.reservationAddendumDocumentUid':\n      'reservation_addendum',\n    'leases.residentialLeasesAddendumDocumentUid':\n      'residential_lease_addendum',\n    'leases.fixtureLeasesAddendumDocumentUid':\n      'fixture_lease_addendum',\n    'propertyAssociation.associationAddendumDocumentUid':\n      'association_addendum',\n    'disclosures.propertyCondition.documentUid':\n      'property_condition_disclosure',\n    'disclosures.leadBasedPaintAddendumDocumentUid':\n      'lead_based_paint_addendum',\n    'closingAndPossession.temporaryResidentialLeaseDocumentUid':\n      'temporary_residential_lease',\n    'construction.plansAndSpecificationsDocumentUid':\n      'plans_and_specifications',\n    'construction.buyerSelectionDocumentsUid':\n      'buyer_selection_documents',\n    'construction.builderWarrantyDocumentUid':\n      'builder_warranty',\n    'construction.thirdPartyWarrantyDocumentUid':\n      'third_party_warranty',\n  };\n\n  const attachmentType =\n    attachmentTypes[fieldPath];\n\n  if (!attachmentType) {\n    throw new Error(\n      'The selected Florida document field is not supported.'\n    );\n  }\n\n  return attachmentType;\n}\n", "louisiana": "function resolveAttachmentType(\n  fieldPath: string\n): OfferAttachmentType {\n  if (fieldPath.startsWith('addenda.')) {\n    return 'contract_addendum';\n  }\n\n  const attachmentTypes:\n    Readonly<Record<string, OfferAttachmentType>> = {\n    'propertyIdentification.legalDescriptionExhibitDocumentUid':\n      'legal_description_exhibit',\n    'propertyTerms.reservationAddendumDocumentUid':\n      'reservation_addendum',\n    'leases.residentialLeasesAddendumDocumentUid':\n      'residential_lease_addendum',\n    'leases.fixtureLeasesAddendumDocumentUid':\n      'fixture_lease_addendum',\n    'propertyAssociation.associationAddendumDocumentUid':\n      'association_addendum',\n    'disclosures.propertyCondition.documentUid':\n      'property_condition_disclosure',\n    'disclosures.leadBasedPaintAddendumDocumentUid':\n      'lead_based_paint_addendum',\n    'closingAndPossession.temporaryResidentialLeaseDocumentUid':\n      'temporary_residential_lease',\n    'construction.plansAndSpecificationsDocumentUid':\n      'plans_and_specifications',\n    'construction.buyerSelectionDocumentsUid':\n      'buyer_selection_documents',\n    'construction.builderWarrantyDocumentUid':\n      'builder_warranty',\n    'construction.thirdPartyWarrantyDocumentUid':\n      'third_party_warranty',\n  };\n\n  const attachmentType =\n    attachmentTypes[fieldPath];\n\n  if (!attachmentType) {\n    throw new Error(\n      'The selected Louisiana document field is not supported.'\n    );\n  }\n\n  return attachmentType;\n}", "colorado": "function resolveAttachmentType(\n  fieldPath: string\n): OfferAttachmentType {\n  if (fieldPath.startsWith('addenda.')) {\n    return 'contract_addendum';\n  }\n\n  const attachmentTypes:\n    Readonly<Record<string, OfferAttachmentType>> = {\n    'propertyIdentification.legalDescriptionExhibitDocumentUid':\n      'legal_description_exhibit',\n    'propertyTerms.reservationAddendumDocumentUid':\n      'reservation_addendum',\n    'leases.residentialLeasesAddendumDocumentUid':\n      'residential_lease_addendum',\n    'leases.fixtureLeasesAddendumDocumentUid':\n      'fixture_lease_addendum',\n    'propertyAssociation.associationAddendumDocumentUid':\n      'association_addendum',\n    'disclosures.propertyCondition.documentUid':\n      'property_condition_disclosure',\n    'disclosures.leadBasedPaintAddendumDocumentUid':\n      'lead_based_paint_addendum',\n    'closingAndPossession.temporaryResidentialLeaseDocumentUid':\n      'temporary_residential_lease',\n    'construction.plansAndSpecificationsDocumentUid':\n      'plans_and_specifications',\n    'construction.buyerSelectionDocumentsUid':\n      'buyer_selection_documents',\n    'construction.builderWarrantyDocumentUid':\n      'builder_warranty',\n    'construction.thirdPartyWarrantyDocumentUid':\n      'third_party_warranty',\n  };\n\n  const attachmentType =\n    attachmentTypes[fieldPath];\n\n  if (!attachmentType) {\n    throw new Error(\n      'The selected Colorado document field is not supported.'\n    );\n  }\n\n  return attachmentType;\n}", "utah": "function resolveAttachmentType(\n  fieldPath: string\n): OfferAttachmentType {\n  if (fieldPath.startsWith('addenda.')) {\n    return 'contract_addendum';\n  }\n\n  const attachmentTypes:\n    Readonly<Record<string, OfferAttachmentType>> = {\n    'propertyIdentification.legalDescriptionExhibitDocumentUid':\n      'legal_description_exhibit',\n    'propertyTerms.reservationAddendumDocumentUid':\n      'reservation_addendum',\n    'leases.residentialLeasesAddendumDocumentUid':\n      'residential_lease_addendum',\n    'leases.fixtureLeasesAddendumDocumentUid':\n      'fixture_lease_addendum',\n    'propertyAssociation.associationAddendumDocumentUid':\n      'association_addendum',\n    'disclosures.propertyCondition.documentUid':\n      'property_condition_disclosure',\n    'disclosures.waterRights.documentUid':\n      'water_rights_disclosure',\n    'disclosures.leadBasedPaintAddendumDocumentUid':\n      'lead_based_paint_addendum',\n    'closingAndPossession.temporaryResidentialLeaseDocumentUid':\n      'temporary_residential_lease',\n    'construction.plansAndSpecificationsDocumentUid':\n      'plans_and_specifications',\n    'construction.buyerSelectionDocumentsUid':\n      'buyer_selection_documents',\n    'construction.builderWarrantyDocumentUid':\n      'builder_warranty',\n    'construction.thirdPartyWarrantyDocumentUid':\n      'third_party_warranty',\n  };\n\n  const attachmentType =\n    attachmentTypes[fieldPath];\n\n  if (!attachmentType) {\n    throw new Error(\n      'The selected Utah document field is not supported.'\n    );\n  }\n\n  return attachmentType;\n}\n", "texas": "function resolveAttachmentType(\n  fieldPath: string\n): OfferAttachmentType {\n  if (fieldPath.startsWith('addenda.')) {\n    return 'contract_addendum';\n  }\n\n  const attachmentTypes:\n    Readonly<Record<string, OfferAttachmentType>> = {\n      'propertyIdentification.legalDescriptionExhibitDocumentUid':\n        'legal_description_exhibit',\n      'propertyTerms.reservationAddendumDocumentUid':\n        'reservation_addendum',\n      'leases.residentialLeasesAddendumDocumentUid':\n        'residential_lease_addendum',\n      'leases.fixtureLeasesAddendumDocumentUid':\n        'fixture_lease_addendum',\n      'propertyAssociation.associationAddendumDocumentUid':\n        'association_addendum',\n      'disclosures.propertyCondition.documentUid':\n        'property_condition_disclosure',\n      'disclosures.waterRights.documentUid':\n        'water_rights_disclosure',\n      'disclosures.leadBasedPaintAddendumDocumentUid':\n        'lead_based_paint_addendum',\n      'closingAndPossession.temporaryResidentialLeaseDocumentUid':\n        'temporary_residential_lease',\n      'construction.plansAndSpecificationsDocumentUid':\n        'plans_and_specifications',\n      'construction.buyerSelectionDocumentsUid':\n        'buyer_selection_documents',\n      'construction.builderWarrantyDocumentUid':\n        'builder_warranty',\n      'construction.thirdPartyWarrantyDocumentUid':\n        'third_party_warranty',\n    };\n\n  const attachmentType =\n    attachmentTypes[fieldPath];\n\n  if (!attachmentType) {\n    throw new Error(\n      'The selected Texas document field is not supported.'\n    );\n  }\n\n  return attachmentType;\n}\n", "california": "function resolveAttachmentType(\n  fieldPath: string\n): OfferAttachmentType {\n  if (fieldPath.startsWith('addenda.')) {\n    return 'contract_addendum';\n  }\n\n  const attachmentTypes:\n    Readonly<Record<string, OfferAttachmentType>> = {\n    'propertyIdentification.legalDescriptionExhibitDocumentUid':\n      'legal_description_exhibit',\n    'propertyTerms.reservationAddendumDocumentUid':\n      'reservation_addendum',\n    'leases.residentialLeasesAddendumDocumentUid':\n      'residential_lease_addendum',\n    'leases.fixtureLeasesAddendumDocumentUid':\n      'fixture_lease_addendum',\n    'propertyAssociation.associationAddendumDocumentUid':\n      'association_addendum',\n    'disclosures.propertyCondition.documentUid':\n      'property_condition_disclosure',\n    'disclosures.leadBasedPaintAddendumDocumentUid':\n      'lead_based_paint_addendum',\n    'closingAndPossession.temporaryResidentialLeaseDocumentUid':\n      'temporary_residential_lease',\n    'construction.plansAndSpecificationsDocumentUid':\n      'plans_and_specifications',\n    'construction.buyerSelectionDocumentsUid':\n      'buyer_selection_documents',\n    'construction.builderWarrantyDocumentUid':\n      'builder_warranty',\n    'construction.thirdPartyWarrantyDocumentUid':\n      'third_party_warranty',\n  };\n\n  const attachmentType =\n    attachmentTypes[fieldPath];\n\n  if (!attachmentType) {\n    throw new Error(\n      'The selected California document field is not supported.'\n    );\n  }\n\n  return attachmentType;\n}", "wisconsin": "function resolveAttachmentType(\n  fieldPath: string\n): OfferAttachmentType {\n  if (fieldPath.startsWith('addenda.')) {\n    return 'contract_addendum';\n  }\n\n  const attachmentTypes:\n    Readonly<Record<string, OfferAttachmentType>> = {\n    'propertyIdentification.legalDescriptionExhibitDocumentUid':\n      'legal_description_exhibit',\n    'propertyTerms.reservationAddendumDocumentUid':\n      'reservation_addendum',\n    'leases.residentialLeasesAddendumDocumentUid':\n      'residential_lease_addendum',\n    'leases.fixtureLeasesAddendumDocumentUid':\n      'fixture_lease_addendum',\n    'propertyAssociation.associationAddendumDocumentUid':\n      'association_addendum',\n    'disclosures.propertyCondition.documentUid':\n      'property_condition_disclosure',\n    'disclosures.leadBasedPaintAddendumDocumentUid':\n      'lead_based_paint_addendum',\n    'closingAndPossession.temporaryResidentialLeaseDocumentUid':\n      'temporary_residential_lease',\n    'construction.plansAndSpecificationsDocumentUid':\n      'plans_and_specifications',\n    'construction.buyerSelectionDocumentsUid':\n      'buyer_selection_documents',\n    'construction.builderWarrantyDocumentUid':\n      'builder_warranty',\n    'construction.thirdPartyWarrantyDocumentUid':\n      'third_party_warranty',\n  };\n\n  const attachmentType =\n    attachmentTypes[fieldPath];\n\n  if (!attachmentType) {\n    throw new Error(\n      'The selected Wisconsin document field is not supported.'\n    );\n  }\n\n  return attachmentType;\n}\n"};
const attachmentModule={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(project,
 'src/app/features/offers/engine/offer-attachment-type.ts'),'utf8'),
 {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,
 {module:attachmentModule,exports:attachmentModule.exports});
let attachmentComparisons=0;
const service = new moduleObject.exports.OfferWorkflowService();
(async () => {
  let reads = 0; const supplied = { uid: 'listing-a' };
  const repo = { getListingById: async uid => { reads++; return { uid }; } };
  assert.equal(await service.loadListing('listing-a', repo, supplied), supplied);
  assert.equal(reads, 0);
  assert.equal((await service.loadListing('listing-b', repo, supplied)).uid, 'listing-b');
  assert.equal(reads, 1);
  assert.equal((await service.loadListing('listing-a', repo, null)).uid, 'listing-a');
  let releaseOffer, releaseVersion; const started = [];
  api.getOffer = () => { started.push('offer'); return new Promise(resolve => releaseOffer = resolve); };
  api.getVersion = () => { started.push('version'); return new Promise(resolve => releaseVersion = resolve); };
  const concurrent = service.loadOfferVersion('o', 'v');
  assert.deepEqual(started, ['offer', 'version']);
  releaseOffer({ stateCode: 'TX' }); releaseVersion({ stateCode: 'TX', terms: { stateCode: 'TX' } }); await concurrent;
  for (const code of ['NC','TX','OK','UT','WI','FL','LA','CO','CA','SC']) {
    api.getOffer = async () => ({ stateCode: code });
    api.getVersion = async () => ({ stateCode: code, terms: { stateCode: code, contractType: 'form' } });
    const [, version] = await service.loadValidatedOfferVersion('o', 'v', code, code, 'form');
    assert.equal(version.terms.stateCode, code);
    await assert.rejects(service.loadValidatedOfferVersion('o','v', code, code, 'other'), /different/);
    api.getVersion = async () => ({ stateCode: code, terms: { stateCode: 'OTHER' } });
    await assert.rejects(service.loadValidatedOfferVersion('o','v', code, code), /does not contain/);
  }
  api.getOffer = async () => null;
  await assert.rejects(service.loadValidatedOfferVersion('o','v','TX','Texas'), /could not be loaded/);
  let saved = []; api.saveDraft = async (_, __, payload) => saved.push(payload);
  const payload = { terms: { value: 1 } }; const pending = service.saveDraft('o','v',payload); payload.terms.value = 2;
  await pending; assert.equal(saved[0].terms.value, 1);
  await service.saveDraft('o','v',{ terms: { value: 1 } }); assert.equal(saved.length,1);
  api.saveDraft = async () => { throw new Error('save failed'); };
  await assert.rejects(service.saveDraft('o','v',{ terms: { value: 3 } }), /save failed/);
  let submitted = 0; api.submitVersion = async () => { submitted++; };
  await assert.rejects(service.submitAndPrepareAgreement('o','v',1), /save failed/); assert.equal(submitted,0);
  api.saveDraft = async () => {}; await service.saveDraft('o','v',{ terms: { value: 3 } });
  await Promise.all([service.submitAndPrepareAgreement('o','v',1), service.submitAndPrepareAgreement('o','v',1)]);
  assert.equal(submitted,1);
  const events = [];
  router.navigate = async route => { events.push(['navigate', ...route]); return true; };
  await service.saveAndReturnToListing(async () => { events.push('save'); }, 'listing-a');
  assert.deepEqual(events, ['save', ['navigate', '/listings', 'listing-a']]);
  events.length = 0;
  await service.saveAndReturnToListing(async () => { throw new Error('failure'); }, 'listing-a');
  assert.equal(events.length, 0);
  let releaseBoundary;
  const originalSubmit = service.submitAndPrepareAgreement;
  service.submitAndPrepareAgreement = async (...args) => { events.push(['submit', ...args]); };
  const submissionBoundary = service.saveAndSubmit(() => new Promise(resolve => {
    events.push('save'); releaseBoundary = resolve;
  }), 'offer-b', 'version-b', 2);
  assert.deepEqual(events, ['save']);
  releaseBoundary(); await submissionBoundary;
  assert.deepEqual(events, ['save', ['submit', 'offer-b', 'version-b', 2]]);
  events.length = 0;
  await assert.rejects(service.saveAndSubmit(async () => { throw new Error('failure'); }, 'o', 'v', 1), /failure/);
  assert.equal(events.length, 0);
  service.submitAndPrepareAgreement = originalSubmit;
  api.currentUserUid = 'buyer';
  const resumeRepo = { getOpenOfferForBuyerAndListing: async (uid, listing) => {
    assert.equal(uid, 'buyer'); assert.equal(listing, 'listing-a'); return null;
  }};
  assert.equal(await service.findResumableDraft('listing-a', resumeRepo), null);
  resumeRepo.getOpenOfferForBuyerAndListing = async () => ({ Uid: 'draft', status: 'draft' });
  assert.equal((await service.findResumableDraft('listing-a', resumeRepo)).Uid, 'draft');
  resumeRepo.getOpenOfferForBuyerAndListing = async () => ({ status: 'submitted' });
  await assert.rejects(service.findResumableDraft('listing-a', resumeRepo), /active offer/);
  const party = { partyUid: 'party', userUid: 'buyer', role: 'buyer', capacity: 'individual',
    firstName: 'A', middleName: 'B', lastName: 'C', suffix: 'Jr', legalName: 'A B C Jr',
    email: 'a@example.com', phone: '123', mailingAddress: { city: 'Raleigh' },
    sequence: 2, primaryParty: false, intendedUse: 'investment', proposedDeedName: 'A C',
    requiredSigner: true, identityVerification: { status: 'verified' },
    signature: { status: 'not_started', providerEnvelopeUid: 'envelope', providerSignerUid: 'signer' },
    electronicTransactionsConsentAccepted: true };
  for (const role of ['buyer', 'seller']) {
    const mapped = service.toOfferParties([{ ...party, role }])[0];
    assert.equal(mapped.signature.status, 'not_invited');
    assert.equal(mapped.role, role);
    const roundtrip = service.toOfferVersionPartySnapshot(mapped);
    assert.equal(roundtrip.signature.status, 'not_started');
    assert.equal(roundtrip.partyUid, 'party');
    assert.equal(roundtrip.sequence, 2);
    assert.equal(roundtrip.primaryParty, false);
    assert.equal(roundtrip.signature.providerEnvelopeUid, 'envelope');
    assert.equal(roundtrip.middleName, 'B');
  }
  const legacyPropertyModule = { exports: {} };
  vm.runInNewContext(ts.transpileModule("function createPropertySnapshot(\n  listing: MarketplaceListing\n): OfferPropertySnapshot {\n  return {\n    listingUid:\n      listing.uid,\n\n    addressLine1:\n      listing.address.addressLine1,\n\n    ...(\n      listing.address.addressLine2\n        ? {\n          addressLine2:\n            listing.address.addressLine2,\n        }\n        : {}\n    ),\n\n    city:\n      listing.address.city,\n\n    state: 'UT',\n\n    zipCode:\n      listing.address.postalCode,\n\n    county:\n      listing.address.county ?? '',\n\n    propertyType:\n      String(listing.propertyType),\n\n    ...(\n      typeof listing.yearBuilt === 'number'\n        ? {\n          yearBuilt:\n            listing.yearBuilt,\n        }\n        : {}\n    ),\n\n    listPriceInCents:\n      Math.round(\n        listing.price * 100\n      ),\n  };\n}\n\n\n".replace("state: 'UT'",'state: stateCode')
    .replace('function createPropertySnapshot(', 'export function createPropertySnapshot(')
    .replace('  listing: MarketplaceListing\n', '  listing: MarketplaceListing, stateCode: string\n'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }}).outputText,
    { module: legacyPropertyModule, exports: legacyPropertyModule.exports });
  let propertyComparisons = 0;
  for (const state of ['california','colorado','florida','louisiana','oklahoma','south-carolina','texas','utah','wisconsin']) {
    const entry = fs.readFileSync(path.join(project, `src/app/features/offers/states/${state}/${state}-offer-entry/${state}-offer-entry.component.ts`), 'utf8');
    const attachmentFrom=entry.indexOf('function resolveAttachmentType(');
    const currentAttachment={exports:{}},oldAttachment={exports:{}};
    const loadAttachment=(source,module)=>vm.runInNewContext(ts.transpileModule('export '+source,
     {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,
     {module,exports:module.exports,resolveOfferAttachmentType:attachmentModule.exports.resolveOfferAttachmentType});
    loadAttachment(entry.slice(attachmentFrom),currentAttachment);
    loadAttachment(originalAttachmentResolvers[state],oldAttachment);
    const result=(resolver,field)=>{try{return {type:resolver(field)};}catch(error){return {error:error.message};}};
    const paths=[...Object.keys({"propertyIdentification.legalDescriptionExhibitDocumentUid": "legal_description_exhibit", "propertyTerms.reservationAddendumDocumentUid": "reservation_addendum", "leases.residentialLeasesAddendumDocumentUid": "residential_lease_addendum", "leases.fixtureLeasesAddendumDocumentUid": "fixture_lease_addendum", "propertyAssociation.associationAddendumDocumentUid": "association_addendum", "disclosures.propertyCondition.documentUid": "property_condition_disclosure", "disclosures.leadBasedPaintAddendumDocumentUid": "lead_based_paint_addendum", "closingAndPossession.temporaryResidentialLeaseDocumentUid": "temporary_residential_lease", "construction.plansAndSpecificationsDocumentUid": "plans_and_specifications", "construction.buyerSelectionDocumentsUid": "buyer_selection_documents", "construction.builderWarrantyDocumentUid": "builder_warranty", "construction.thirdPartyWarrantyDocumentUid": "third_party_warranty"}),'disclosures.waterRights.documentUid','addenda.test','addenda.',
      'addenda','unknown','',' construction.builderWarrantyDocumentUid'];
    for(const field of paths) {
      assert.deepEqual(result(currentAttachment.exports.resolveAttachmentType,field),
       result(oldAttachment.exports.resolveAttachmentType,field),`${state} ${field}`);
      attachmentComparisons++;
    }
    const expirationFrom=entry.indexOf('function createDefaultExpiration()');
    const expirationTo=entry.indexOf('\nfunction get',expirationFrom);
    const hours=Number(entry.match(/const DEFAULT_EXPIRATION_HOURS = (\d+);/)[1]);
    const currentExpiration={exports:{}},oldExpiration={exports:{}};
    const loadExpiration=(source,module)=>vm.runInNewContext(ts.transpileModule('export '+source,
      {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,
      {module,exports:module.exports,Date:ExpirationDate,DEFAULT_EXPIRATION_HOURS:hours,
        offerExpirationAfterHours:expirationModule.exports.offerExpirationAfterHours});
    loadExpiration(entry.slice(expirationFrom,expirationTo),currentExpiration);
    loadExpiration(originalExpirations[state],oldExpiration);
    for(const instant of ['2026-03-07T12:00:00Z','2026-11-01T03:00:00Z','2026-12-31T23:59:59Z','2028-02-28T23:00:00Z']) {
      expirationNow=Date.parse(instant);
      const actual=currentExpiration.exports.createDefaultExpiration();
      assert.equal(actual,oldExpiration.exports.createDefaultExpiration(),state);
      assert.equal(Date.parse(actual)-expirationNow,48*60*60*1000,state);
      expirationComparisons++;
    }
    const propertyFrom = entry.indexOf('function createPropertySnapshot(');
    const propertyTo = entry.indexOf('function createDefaultExpiration(',propertyFrom);
    const statePropertyModule = { exports: {} };
    vm.runInNewContext(ts.transpileModule('export '+entry.slice(propertyFrom,propertyTo),
      { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }}).outputText,
      { module: statePropertyModule, exports: statePropertyModule.exports,
        createOfferPropertySnapshot: propertyModule.exports.createOfferPropertySnapshot });
    const stateCode = { california:'CA',colorado:'CO',florida:'FL',louisiana:'LA',oklahoma:'OK',
      'south-carolina':'SC',texas:'TX',utah:'UT',wisconsin:'WI' }[state];
    for (const addressLine2 of [undefined,'','Unit 2']) for (const county of [undefined,null,'Wake'])
      for (const yearBuilt of [undefined,null,0,1978,'1978']) for (const price of [0,12.345,123456.78]) {
        const listing = { uid:'listing-a',address:{addressLine1:'1 Main',addressLine2,city:'City',state:'OTHER',postalCode:'12345',county},
          propertyType:'single_family',yearBuilt,price };
        const actual = statePropertyModule.exports.createPropertySnapshot(listing);
        const expected = legacyPropertyModule.exports.createPropertySnapshot(listing,stateCode);
        assert.deepEqual(JSON.parse(JSON.stringify(actual)),JSON.parse(JSON.stringify(expected)),state);
        assert.equal(actual.state,stateCode);
        assert.equal(Object.hasOwn(actual,'addressLine2'),!!addressLine2);
        assert.equal(Object.hasOwn(actual,'yearBuilt'),typeof yearBuilt==='number');
        propertyComparisons++;
      }
    const boundaryFrom = entry.indexOf('  protected async onSubmitRequested(');
    const boundaryTo = entry.indexOf('  private async resumeExistingDraft()', boundaryFrom);
    const boundaryModule = { exports: {} };
    vm.runInNewContext(ts.transpileModule(`export class Test { ${entry.slice(boundaryFrom, boundaryTo)} }`,
      { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }}).outputText,
      { exports: boundaryModule.exports, module: boundaryModule });
    const boundaryController = new boundaryModule.exports.Test();
    boundaryController.workflow = { saveAndReturnToListing: service.saveAndReturnToListing.bind(service),
      saveAndSubmit: service.saveAndSubmit.bind(service) };
    boundaryController.listingUid = 'listing-a';
    boundaryController.currentOffer = () => ({ Uid: 'o' });
    boundaryController.currentVersion = () => ({ Uid: 'v', versionNumber: 1 });
    boundaryController.busy = () => false;
    boundaryController.creating = () => false;
    boundaryController.uploading = () => false;
    boundaryController.submitting = () => !!boundaryController.isSubmitting;
    boundaryController.submitting.set = value => { boundaryController.isSubmitting = value; };
    boundaryController.errorMessage = { set: () => {} };
    boundaryController.setError = error => { boundaryController.error = error; };
    boundaryController.flushDraftSave = async () => { throw new Error('save blocked'); };
    events.length = 0;
    await boundaryController.returnToListing();
    await boundaryController.onSubmitRequested({ terms: {} });
    assert.equal(events.length, 0, state);
    assert.equal(boundaryController.error.message, 'save blocked', state);
    assert.equal(boundaryController.isSubmitting, false, state);
    boundaryController.flushDraftSave = async () => { events.push('save'); };
    await boundaryController.returnToListing();
    assert.deepEqual(events, ['save', ['navigate', '/listings', 'listing-a']], state);
    const from = entry.indexOf('  private flushDraftSave()');
    const to = entry.indexOf('  private toOfferParties(', from);
    assert(from >= 0 && to > from);
    const mod = { exports: {} };
    vm.runInNewContext(ts.transpileModule(`export class Test { ${entry.slice(from,to)} }`,
      { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }}).outputText,
      { exports: mod.exports, module: mod });
    const controller = new mod.exports.Test();
    controller.draftSaveQueue = new OfferDraftSaveQueue();
    Object.defineProperty(controller, 'pendingDraftChange', {
      get: () => controller.draftSaveQueue.pendingDraftChange,
      set: value => { controller.draftSaveQueue.pendingDraftChange = value; }
    });
    const first = { terms: { contractType: 'form', value: 1 }, buyers: [], expiresAt: 'date' };
    const latest = { ...first, terms: { contractType: 'form', value: 2 } };
    let release; const calls = [];
    controller.currentOffer = () => ({ Uid: 'o' });
    controller.currentVersion = () => ({ Uid: 'v', initiatedBy: 'buyer' });
    controller.saving = { set: () => {} };
    controller.setError = () => {};
    controller.toOfferVersionPartySnapshot = value => value;
    controller.workflow = { buildDraftChanges: service.buildDraftChanges.bind(service), saveDraft: async (_, __, payload) => {
      calls.push(payload); if (calls.length === 1) await new Promise(resolve => release = resolve);
    }};
    for (const initiatedBy of ['buyer', 'seller']) {
      controller.currentVersion = () => ({ Uid: 'v', initiatedBy });
      const change = { ...first, buyers: service.toOfferParties([party]) };
      const code = { california: 'CA', colorado: 'CO', florida: 'FL', louisiana: 'LA',
        oklahoma: 'OK', 'south-carolina': 'SC', texas: 'TX', utah: 'UT', wisconsin: 'WI' }[state];
      const expected = { terms: change.terms, expiresAt: change.expiresAt,
        ...((state === 'texas' || initiatedBy === 'buyer')
          ? { buyers: change.buyers.map(buyer => service.toOfferVersionPartySnapshot(buyer)) } : {}),
        wizardData: { stateCode: code, contractType: change.terms.contractType } };
      let captured;
      const saveDraft = controller.workflow.saveDraft;
      controller.workflow.saveDraft = async (_, __, payload) => { captured = payload; };
      controller.pendingDraftChange = change;
      await controller.flushDraftSave();
      assert.deepEqual(JSON.parse(JSON.stringify(captured)), JSON.parse(JSON.stringify(expected)),
        `${state} ${initiatedBy} draft payload`);
      controller.workflow.saveDraft = saveDraft;
    }
    controller.currentVersion = () => ({ Uid: 'v', initiatedBy: 'buyer' });
    controller.pendingDraftChange = first;
    const background = controller.flushDraftSave();
    controller.pendingDraftChange = latest;
    const boundary = controller.flushDraftSave();
    release(); await Promise.all([background,boundary]);
    assert.equal(calls.length,2, state); assert.equal(calls[1].terms.value,2,state);
    controller.pendingDraftChange = latest;
    controller.workflow.saveDraft = async () => { throw new Error('failure'); };
    await assert.rejects(controller.flushDraftSave(), /failure/);
    assert.equal(controller.pendingDraftChange, latest, state);
    controller.workflow.saveDraft = async () => {};
    await controller.flushDraftSave(); assert.equal(controller.pendingDraftChange,null,state);
  }
  const queue = new OfferDraftSaveQueue();
  const queueStates = []; const queueErrors = [];
  const older = { value: 1 }; const newer = { value: 2 };
  let rejectSave; let startedSaves = 0;
  const prepare = change => () => { startedSaves++; return new Promise((_, reject) => { rejectSave = reject; }); };
  queue.pendingDraftChange = older;
  const failingSave = queue.flush(prepare, value => queueStates.push(value), error => queueErrors.push(error.message));
  queue.pendingDraftChange = newer;
  const waitingSave = queue.flush(prepare, value => queueStates.push(value), error => queueErrors.push(error.message));
  assert.equal(startedSaves, 1);
  rejectSave(new Error('failed older edit'));
  await assert.rejects(failingSave, /failed older edit/);
  await assert.rejects(waitingSave, /failed older edit/);
  assert.equal(queue.pendingDraftChange, newer);
  assert.deepEqual(queueStates, [true,false]);
  assert.deepEqual(queueErrors, ['failed older edit']);
  let retried;
  await queue.flush(change => async () => { retried = change; }, () => {}, () => {});
  assert.equal(retried, newer); assert.equal(queue.pendingDraftChange,null);
  queue.pendingDraftChange = older;
  await queue.flush(() => null, () => { throw new Error('must not start saving'); }, () => {});
  assert.equal(queue.pendingDraftChange,older);
  console.log(`PASS: ${attachmentComparisons} nine-state attachment-routing comparisons; water-rights support, addenda and state-specific errors preserved.`);
  console.log(`PASS: ${expirationComparisons} nine-state default-expiration comparisons; exactly 48 elapsed hours across DST and calendar boundaries.`);
  console.log(`PASS: ${propertyComparisons} nine-state property snapshot comparisons; optional fields, state identity and price rounding preserved.`);
  console.log('PASS: listing reuse/fallback, concurrent reads, ten-state matching, contract mismatch, missing draft, snapshot saves, duplicate saves, failed-save blocking, retry, duplicate submission, resume decisions and buyer/seller conversion, nine-state pending-edit flush and failure retry, 18 buyer/seller draft payload comparisons, shared save-before-navigation/submission boundaries, shared pending-edit queue and newer-edit failure retention.');
})().catch(error => { console.error(error); process.exitCode = 1; });
