import { createAlabamaListingAnswersForm, restoreAlabamaListingAnswers } from './alabama-listing-form';
import type { StateListingPackage } from '../state-listing-package';
export const alabamaListingPackage: StateListingPackage = {
 stateCode: 'AL', stateName: 'Alabama', propertyDetailFields: ['legalDescription'],
 requiredSellerStatementFields: ['leadBasedPaintApplies','ownersAssociationApplies','generalLeasesExist'],
 formFactories: { 'sellerStatements.alabama': createAlabamaListingAnswersForm },
 formRestorers: { 'sellerStatements.alabama': restoreAlabamaListingAnswers },
 restoreSellerStatements: saved => ({alabama: restoreAlabamaListingAnswers(saved?.alabama)}),
 mapSellerStatements: answers => ({alabama: {usesEasternTime: answers.alabama!.usesEasternTime!,hiddenHealthSafetyKnown: answers.alabama!.hiddenHealthSafetyKnown!}}),
 disclosureRequirements: [],
 questionGroups: [
  {
    "id": "alabama-applicability",
    "title": "Alabama property and disclosure facts",
    "questions": [
      {
        "id": "al-usesEasternTime",
        "fieldPath": "sellerStatements.alabama.usesEasternTime",
        "label": "Contract deadline time zone",
        "description": "Alabama is officially Central time. Some border communities use Eastern time locally. Confirm and expressly choose the time zone all parties will use for contract deadlines.",
        "required": true,
        "requiredMessage": "Select an answer.",
        "options": [
          {
            "value": true,
            "label": "Eastern time (observes daylight saving)"
          },
          {
            "value": false,
            "label": "Central time (observes daylight saving)"
          }
        ]
      },
      {
        "id": "al-hiddenHealthSafetyKnown",
        "fieldPath": "sellerStatements.alabama.hiddenHealthSafetyKnown",
        "label": "Do you know of a material health or safety defect that is not readily observable by a buyer?",
        "description": "Disclose applicable known hidden health or safety defects. Buyer-specific inquiries and fiduciary duties may require further disclosures even when this answer is No.",
        "required": true,
        "requiredMessage": "Select an answer."
      }
    ]
  }
],
};
