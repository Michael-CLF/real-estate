import { createDelawareListingAnswersForm, restoreDelawareListingAnswers } from './delaware-listing-form';
import type { StateListingPackage } from '../state-listing-package';
export const delawareListingPackage: StateListingPackage = {
 stateCode: 'DE', stateName: 'Delaware', propertyDetailFields: ['legalDescription'],
 requiredSellerStatementFields: ['leadBasedPaintApplies','ownersAssociationApplies','generalLeasesExist'],
 formFactories: { 'sellerStatements.delaware': createDelawareListingAnswersForm },
 formRestorers: { 'sellerStatements.delaware': restoreDelawareListingAnswers },
 restoreSellerStatements: saved => ({delaware: restoreDelawareListingAnswers(saved?.delaware)}),
 mapSellerStatements: answers => ({delaware: {disclosureExemptionClaimed: answers.delaware!.disclosureExemptionClaimed!,radonReportsKnown: answers.delaware!.radonReportsKnown!}}),
 disclosureRequirements: [],
 questionGroups: [
  {
    "id": "delaware-applicability",
    "title": "Delaware property and disclosure facts",
    "questions": [
      {
        "id": "de-disclosureExemptionClaimed",
        "fieldPath": "sellerStatements.delaware.disclosureExemptionClaimed",
        "label": "Are you claiming a specific statutory seller-disclosure exemption?",
        "description": "Use the current Commission exemption certification identifying a 6 Del. C. 2577 exception. An as-is sale or sale by heirs alone is not an exemption.",
        "required": true,
        "requiredMessage": "Select an answer."
      },
      {
        "id": "de-radonReportsKnown",
        "fieldPath": "sellerStatements.delaware.radonReportsKnown",
        "label": "Do you possess radon testing or inspection information or know of a radon hazard?",
        "description": "Provide possessed reports and known hazards with the required Commission radon disclosure. No new test is required solely by this question.",
        "required": true,
        "requiredMessage": "Select an answer."
      }
    ]
  }
],
};
