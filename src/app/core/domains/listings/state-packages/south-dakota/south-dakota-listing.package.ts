import { createSouthDakotaListingAnswersForm, restoreSouthDakotaListingAnswers } from './south-dakota-listing-form';
import type { StateListingPackage } from '../state-listing-package';
export const southDakotaListingPackage: StateListingPackage = {
 stateCode: 'SD', stateName: 'South Dakota', propertyDetailFields: ['legalDescription'],
 requiredSellerStatementFields: ['leadBasedPaintApplies','ownersAssociationApplies','generalLeasesExist'],
 formFactories: { 'sellerStatements.southDakota': createSouthDakotaListingAnswersForm },
 formRestorers: { 'sellerStatements.southDakota': restoreSouthDakotaListingAnswers },
 restoreSellerStatements: saved => ({southDakota: restoreSouthDakotaListingAnswers(saved?.southDakota)}),
 mapSellerStatements: answers => ({southDakota: {condominiumReportIssued: answers.southDakota!.condominiumReportIssued!,usesMountainTime: answers.southDakota!.usesMountainTime!,disclosureExemptionClaimed: answers.southDakota!.disclosureExemptionClaimed!,privateTransferFeeKnown: answers.southDakota!.privateTransferFeeKnown!}}),
 disclosureRequirements: [],
 questionGroups: [
  {
    "id": "south-dakota-applicability",
    "title": "South Dakota property and disclosure facts",
    "questions": [
 {"id":"sd-condominium-report","fieldPath":"sellerStatements.southDakota.condominiumReportIssued","label":"For condominium ownership, has the project final or substitute Commission public report been issued?","description":"SDCL 43-15A-17 requires issuance before a project unit is offered for sale. Confirm with the association/Commission and upload the available report and supplements with the required condominium packet. Non-condominium sellers may leave this unanswered. Developer/new-construction offerings use a different agreement.","required":false,"requiredMessage":"Confirm condominium project report issuance."},
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
