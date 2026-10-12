import { createKansasListingAnswersForm, restoreKansasListingAnswers } from './kansas-listing-form';
import type { StateListingPackage } from '../state-listing-package';
export const kansasListingPackage: StateListingPackage = {
 stateCode: 'KS', stateName: 'Kansas', propertyDetailFields: ['legalDescription'],
 requiredSellerStatementFields: ['leadBasedPaintApplies','ownersAssociationApplies','generalLeasesExist'],
 formFactories: { 'sellerStatements.kansas': createKansasListingAnswersForm },
 formRestorers: { 'sellerStatements.kansas': restoreKansasListingAnswers },
 restoreSellerStatements: saved => ({kansas: restoreKansasListingAnswers(saved?.kansas)}),
 mapSellerStatements: answers => ({kansas: {usesMountainTime: answers.kansas!.usesMountainTime!,elevatedRadonKnown: answers.kansas!.elevatedRadonKnown!}}),
 disclosureRequirements: [],
 questionGroups: [
  {
    "id": "kansas-applicability",
    "title": "Kansas property and disclosure facts",
    "questions": [
      {
        "id": "ks-usesMountainTime",
        "fieldPath": "sellerStatements.kansas.usesMountainTime",
        "label": "Property time zone",
        "description": "Kansas includes Central and Mountain time. Confirm the physical property location, particularly Sherman, Wallace, Greeley and Hamilton counties.",
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
        "id": "ks-elevatedRadonKnown",
        "fieldPath": "sellerStatements.kansas.elevatedRadonKnown",
        "label": "Do you have information showing elevated radon concentrations at this property?",
        "description": "Disclose known elevated results and available testing/mitigation reports. The contract includes the statutory warning; that does not replace property-specific known information.",
        "required": true,
        "requiredMessage": "Select an answer."
      }
    ]
  }
],
};
