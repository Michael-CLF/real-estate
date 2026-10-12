import { createIndianaListingAnswersForm, restoreIndianaListingAnswers } from './indiana-listing-form';
import type { StateListingPackage } from '../state-listing-package';
export const indianaListingPackage: StateListingPackage = {
 stateCode: 'IN', stateName: 'Indiana', propertyDetailFields: ['legalDescription'],
 requiredSellerStatementFields: ['leadBasedPaintApplies','ownersAssociationApplies','generalLeasesExist'],
 formFactories: { 'sellerStatements.indiana': createIndianaListingAnswersForm },
 formRestorers: { 'sellerStatements.indiana': restoreIndianaListingAnswers },
 restoreSellerStatements: saved => ({indiana: restoreIndianaListingAnswers(saved?.indiana)}),
 mapSellerStatements: answers => ({indiana: {usesCentralTime: answers.indiana!.usesCentralTime!,disclosureExemptionClaimed: answers.indiana!.disclosureExemptionClaimed!}}),
 disclosureRequirements: [],
 questionGroups: [
  {
    "id": "indiana-applicability",
    "title": "Indiana property and disclosure facts",
    "questions": [
      {
        "id": "in-usesCentralTime",
        "fieldPath": "sellerStatements.indiana.usesCentralTime",
        "label": "Property time zone",
        "description": "Indiana includes Eastern and Central time. Confirm the physical property location; both choices observe daylight saving.",
        "required": true,
        "requiredMessage": "Select an answer.",
        "options": [
          {
            "value": true,
            "label": "Central time (observes daylight saving)"
          },
          {
            "value": false,
            "label": "Eastern time (observes daylight saving)"
          }
        ]
      },
      {
        "id": "in-disclosureExemptionClaimed",
        "fieldPath": "sellerStatements.indiana.disclosureExemptionClaimed",
        "label": "Are you claiming a specific statutory seller-disclosure exemption?",
        "description": "Identify the specific IC 32-21-5-1 exemption in signed supporting evidence. An as-is sale is not an exemption.",
        "required": true,
        "requiredMessage": "Select an answer."
      }
    ]
  }
],
};
