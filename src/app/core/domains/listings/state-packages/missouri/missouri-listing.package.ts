import { createMissouriListingAnswersForm, restoreMissouriListingAnswers } from './missouri-listing-form';
import type { StateListingPackage } from '../state-listing-package';
export const missouriListingPackage: StateListingPackage = {
 stateCode: 'MO', stateName: 'Missouri', propertyDetailFields: ['legalDescription'],
 requiredSellerStatementFields: ['leadBasedPaintApplies','ownersAssociationApplies','generalLeasesExist'],
 formFactories: { 'sellerStatements.missouri': createMissouriListingAnswersForm },
 formRestorers: { 'sellerStatements.missouri': restoreMissouriListingAnswers },
 restoreSellerStatements: saved => ({missouri: restoreMissouriListingAnswers(saved?.missouri)}),
 mapSellerStatements: answers => ({missouri: {methProductionKnown: answers.missouri!.methProductionKnown!,drugConvictionKnown: answers.missouri!.drugConvictionKnown!}}),
 disclosureRequirements: [],
 questionGroups: [
  {
    "id": "missouri-applicability",
    "title": "Missouri property and disclosure facts",
    "questions": [
      {
        "id": "mo-methProductionKnown",
        "fieldPath": "sellerStatements.missouri.methProductionKnown",
        "label": "Do you know that methamphetamine production occurred on this property?",
        "description": "Disclose known production in writing even when no criminal conviction occurred.",
        "required": true,
        "requiredMessage": "Select an answer."
      },
      {
        "id": "mo-drugConvictionKnown",
        "fieldPath": "sellerStatements.missouri.drugConvictionKnown",
        "label": "Do you know, or should you know, of a covered methamphetamine-related conviction associated with this property?",
        "description": "RSMo 442.606(2) includes covered residence, storage and laboratory history. Review the statutory categories; a No answer does not erase actual or legally imputed knowledge.",
        "required": true,
        "requiredMessage": "Select an answer."
      }
    ]
  }
],
};
