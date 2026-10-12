import { createWashingtonListingAnswersForm, restoreWashingtonListingAnswers } from './washington-listing-form';
import type { StateListingPackage } from '../state-listing-package';
export const washingtonListingPackage: StateListingPackage = {
 stateCode: 'WA', stateName: 'Washington', propertyDetailFields: ['legalDescription'],
 requiredSellerStatementFields: ['leadBasedPaintApplies','ownersAssociationApplies','generalLeasesExist'],
 formFactories: { 'sellerStatements.washington': createWashingtonListingAnswersForm },
 formRestorers: { 'sellerStatements.washington': restoreWashingtonListingAnswers },
 restoreSellerStatements: saved => ({washington: restoreWashingtonListingAnswers(saved?.washington)}),
 mapSellerStatements: answers => ({washington: {disclosureExemptionClaimed: answers.washington!.disclosureExemptionClaimed!,oilTankHeating: answers.washington!.oilTankHeating!}}),
 disclosureRequirements: [],
 questionGroups: [
  {
    "id": "washington-applicability",
    "title": "Washington property and disclosure facts",
    "questions": [
      {
        "id": "wa-disclosureExemptionClaimed",
        "fieldPath": "sellerStatements.washington.disclosureExemptionClaimed",
        "label": "Does this transfer qualify for a specific statutory disclosure exception?",
        "description": "Identify the RCW 64.06.010 exception in signed evidence. This workflow does not offer a buyer waiver; environmental answers cannot be waived when any would be Yes.",
        "required": true,
        "requiredMessage": "Select an answer."
      },
      {
        "id": "wa-oilTankHeating",
        "fieldPath": "sellerStatements.washington.oilTankHeating",
        "label": "Does the property use an oil tank for heating?",
        "description": "The agreement includes the statutory pollution liability insurance notice. Provide known tank, leak, removal and insurance information in the seller disclosure.",
        "required": true,
        "requiredMessage": "Select an answer."
      }
    ]
  }
],
};
