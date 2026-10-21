import { createNewMexicoListingAnswersForm, restoreNewMexicoListingAnswers } from './new-mexico-listing-form';
import type { StateListingPackage } from '../state-listing-package';
export const newMexicoListingPackage: StateListingPackage = {
 stateCode: 'NM', stateName: 'New Mexico', propertyDetailFields: ['legalDescription'],
 requiredSellerStatementFields: ['leadBasedPaintApplies','ownersAssociationApplies','generalLeasesExist'],
 formFactories: { 'sellerStatements.newMexico': createNewMexicoListingAnswersForm },
 formRestorers: { 'sellerStatements.newMexico': restoreNewMexicoListingAnswers },
 restoreSellerStatements: saved => ({newMexico: restoreNewMexicoListingAnswers(saved?.newMexico)}),
 mapSellerStatements: answers => ({newMexico: {privateWastewaterApplies: answers.newMexico!.privateWastewaterApplies!,drugLabContaminationKnown: answers.newMexico!.drugLabContaminationKnown!,appurtenantWaterRightsKnown: answers.newMexico!.appurtenantWaterRightsKnown!}}),
 disclosureRequirements: [],
 questionGroups: [
  {
    "id": "new-mexico-applicability",
    "title": "New Mexico property and disclosure facts",
    "questions": [
      {
        "id": "nm-privateWastewaterApplies",
        "fieldPath": "sellerStatements.newMexico.privateWastewaterApplies",
        "label": "Does the property use an on-site liquid waste or septic system?",
        "description": "Seller must arrange the applicable NMED evaluation before transfer, required correction/registration and ownership updates. This is not a universal pre-offer inspection.",
        "required": true,
        "requiredMessage": "Select an answer."
      },
      {
        "id": "nm-drugLabContaminationKnown",
        "fieldPath": "sellerStatements.newMexico.drugLabContaminationKnown",
        "label": "Do you know of clandestine drug-laboratory contamination or a cleanup order?",
        "description": "Provide the required written contamination notice and any approved remediation evidence. A property-list search is not proof the property is uncontaminated.",
        "required": true,
        "requiredMessage": "Select an answer."
      },
      {
        "id": "nm-appurtenantWaterRightsKnown",
        "fieldPath": "sellerStatements.newMexico.appurtenantWaterRightsKnown",
        "label": "Do you know of water or irrigation rights associated with the property?",
        "description": "Provide OSE records and any reservations. Title and the closing agent must verify what rights convey and record the appropriate ownership changes.",
        "required": true,
        "requiredMessage": "Select an answer."
      }
    ]
  }
],
};
