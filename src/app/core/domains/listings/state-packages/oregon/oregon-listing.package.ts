import { createOregonListingAnswersForm, restoreOregonListingAnswers } from './oregon-listing-form';
import type { StateListingPackage } from '../state-listing-package';
export const oregonListingPackage: StateListingPackage = {
 stateCode: 'OR', stateName: 'Oregon', propertyDetailFields: ['legalDescription'],
 requiredSellerStatementFields: ['leadBasedPaintApplies','ownersAssociationApplies','generalLeasesExist'],
 formFactories: { 'sellerStatements.oregon': createOregonListingAnswersForm },
 formRestorers: { 'sellerStatements.oregon': restoreOregonListingAnswers },
 restoreSellerStatements: saved => ({oregon: restoreOregonListingAnswers(saved?.oregon)}),
 mapSellerStatements: answers => ({oregon: {historicSpecialAssessmentApplies: answers.oregon!.historicSpecialAssessmentApplies!,usesMountainTime: answers.oregon!.usesMountainTime!,domesticWellApplies: answers.oregon!.domesticWellApplies!,uncertifiedWoodDevicePresent: answers.oregon!.uncertifiedWoodDevicePresent!}}),
 disclosureRequirements: [],
 questionGroups: [
  {
    "id": "oregon-applicability",
    "title": "Oregon property and disclosure facts",
    "questions": [
{"id": "or-historic-assessment", "fieldPath": "sellerStatements.oregon.historicSpecialAssessmentApplies", "label": "Is this property subject to historic-property special assessment under ORS 358.505?", "description": "Check the assessor and title records. When applicable, the agreement must include the required special-assessment statement.", "required": true, "requiredMessage": "Select whether this special assessment applies."},
      {
        "id": "or-usesMountainTime",
        "fieldPath": "sellerStatements.oregon.usesMountainTime",
        "label": "Property time zone",
        "description": "Choose Mountain only where the property is in the Mountain zone, including the applicable portion of Malheur County. Confirm the physical property location; ZIP alone is not sufficient.",
        "required": true,
        "requiredMessage": "Select an answer.",
        "options": [
          {
            "value": true,
            "label": "Mountain time (observes daylight saving)"
          },
          {
            "value": false,
            "label": "Pacific time (observes daylight saving)"
          }
        ]
      },
      {
        "id": "or-domesticWellApplies",
        "fieldPath": "sellerStatements.oregon.domesticWellApplies",
        "label": "Does a domestic well serve this property?",
        "description": "Seller testing after offer acceptance includes arsenic, nitrate and total coliform bacteria. Irrigation-only and other exclusions must be evaluated separately.",
        "required": true,
        "requiredMessage": "Select an answer."
      },
      {
        "id": "or-uncertifiedWoodDevicePresent",
        "fieldPath": "sellerStatements.oregon.uncertifiedWoodDevicePresent",
        "label": "Is an uncertified wood stove or fireplace insert present?",
        "description": "Seller must remove and destroy applicable uncertified devices before closing unless buyer separately accepts responsibility in writing, with removal within 30 days after closing.",
        "required": true,
        "requiredMessage": "Select an answer."
      }
    ]
  }
],
};
