import { createSouthDakotaListingAnswersForm, restoreSouthDakotaListingAnswers } from './south-dakota-listing-form';
import type { StateListingPackage } from '../state-listing-package';
export const southDakotaListingPackage: StateListingPackage = {
 stateCode: 'SD', stateName: 'South Dakota', propertyDetailFields: ['legalDescription'],
 requiredSellerStatementFields: ['leadBasedPaintApplies','ownersAssociationApplies','generalLeasesExist'],
 formFactories: { 'sellerStatements.southDakota': createSouthDakotaListingAnswersForm },
 formRestorers: { 'sellerStatements.southDakota': restoreSouthDakotaListingAnswers },
 restoreSellerStatements: saved => ({southDakota: restoreSouthDakotaListingAnswers(saved?.southDakota)}),
 mapSellerStatements: answers => ({southDakota: {usesMountainTime: answers.southDakota!.usesMountainTime!,disclosureExemptionClaimed: answers.southDakota!.disclosureExemptionClaimed!,privateTransferFeeKnown: answers.southDakota!.privateTransferFeeKnown!}}),
 disclosureRequirements: [],
 questionGroups: [
  {
    "id": "south-dakota-applicability",
    "title": "South Dakota property and disclosure facts",
    "questions": [
      {
        "id": "sd-usesMountainTime",
        "fieldPath": "sellerStatements.southDakota.usesMountainTime",
        "label": "Which time zone applies at the physical property?",
        "description": "South Dakota spans Central and Mountain time. Confirm the physical property zone; this answer controls contract deadlines.",
        "required": true,
        "requiredMessage": "Select an answer.",
        "options": [
          {
            "value": true,
            "label": "Mountain time (observes daylight saving)"
          },
          {
            "value": false,
            "label": "Central time (observes daylight saving)"
          }
        ]
      },
      {
        "id": "sd-disclosureExemptionClaimed",
        "fieldPath": "sellerStatements.southDakota.disclosureExemptionClaimed",
        "label": "Does this transfer qualify for a specific South Dakota condition-disclosure exception?",
        "description": "Identify the SDCL 43-4-43 exception in signed evidence. An as-is sale alone is not an exception, and a condition-form exception does not remove separate HOA duties.",
        "required": true,
        "requiredMessage": "Select an answer."
      },
      {
        "id": "sd-privateTransferFeeKnown",
        "fieldPath": "sellerStatements.southDakota.privateTransferFeeKnown",
        "label": "Is a private transfer-fee obligation recorded or otherwise claimed against this property?",
        "description": "Disclose it in the condition statement or, when that statement is exempt, a separate statutory notice. Ordinary government and HOA charges are not necessarily private transfer fees.",
        "required": true,
        "requiredMessage": "Select an answer."
      }
    ]
  }
],
};
