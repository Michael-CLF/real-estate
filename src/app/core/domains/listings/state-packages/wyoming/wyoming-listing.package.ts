import { createWyomingListingAnswersForm, restoreWyomingListingAnswers } from './wyoming-listing-form';
import type { StateListingPackage } from '../state-listing-package';
export const wyomingListingPackage: StateListingPackage = {
 stateCode: 'WY', stateName: 'Wyoming', propertyDetailFields: ['legalDescription'],
 requiredSellerStatementFields: ['leadBasedPaintApplies','ownersAssociationApplies','generalLeasesExist'],
 formFactories: { 'sellerStatements.wyoming': createWyomingListingAnswersForm },
 formRestorers: { 'sellerStatements.wyoming': restoreWyomingListingAnswers },
 restoreSellerStatements: saved => ({wyoming: restoreWyomingListingAnswers(saved?.wyoming)}),
 mapSellerStatements: answers => ({wyoming: {privateWastewaterApplies: answers.wyoming!.privateWastewaterApplies!,appurtenantWaterRightsKnown: answers.wyoming!.appurtenantWaterRightsKnown!}}),
 disclosureRequirements: [],
 questionGroups: [
  {
    "id": "wyoming-applicability",
    "title": "Wyoming property and disclosure facts",
    "questions": [
      {
        "id": "wy-privateWastewaterApplies",
        "fieldPath": "sellerStatements.wyoming.privateWastewaterApplies",
        "label": "Does the property use an on-site septic or wastewater system?",
        "description": "Provide permits and known problems; verify applicable DEQ or delegated county requirements before closing. This question does not impose a universal new inspection.",
        "required": true,
        "requiredMessage": "Select an answer."
      },
      {
        "id": "wy-appurtenantWaterRightsKnown",
        "fieldPath": "sellerStatements.wyoming.appurtenantWaterRightsKnown",
        "label": "Do you know of water or irrigation rights associated with the property?",
        "description": "Provide State Engineer records, well information, ditch access and any reservations; title must confirm rights and changes in ownership.",
        "required": true,
        "requiredMessage": "Select an answer."
      }
    ]
  }
],
};
