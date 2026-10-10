import { createNebraskaListingAnswersForm, restoreNebraskaListingAnswers } from './nebraska-listing-form';
import type { StateListingPackage } from '../state-listing-package';
export const nebraskaListingPackage: StateListingPackage = {
 stateCode: 'NE', stateName: 'Nebraska', propertyDetailFields: ['legalDescription'],
 requiredSellerStatementFields: ['leadBasedPaintApplies','ownersAssociationApplies','generalLeasesExist'],
 formFactories: { 'sellerStatements.nebraska': createNebraskaListingAnswersForm },
 formRestorers: { 'sellerStatements.nebraska': restoreNebraskaListingAnswers },
 restoreSellerStatements: saved => ({nebraska: restoreNebraskaListingAnswers(saved?.nebraska)}),
 mapSellerStatements: answers => ({nebraska: {usesMountainTime: answers.nebraska!.usesMountainTime!}}),
 disclosureRequirements: [],
 questionGroups: [
  {
    "id": "nebraska-applicability",
    "title": "Nebraska property and disclosure facts",
    "questions": [
      {
        "id": "ne-usesMountainTime",
        "fieldPath": "sellerStatements.nebraska.usesMountainTime",
        "label": "Property time zone",
        "description": "Nebraska includes Central and Mountain time. Confirm the physical property location with local government/title records before selecting.",
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
      }
    ]
  }
],
};
