import { createOhioListingAnswersForm, restoreOhioListingAnswers } from './ohio-listing-form';
import type { StateListingPackage } from '../state-listing-package';
export const ohioListingPackage: StateListingPackage = {
 stateCode: 'OH', stateName: 'Ohio', propertyDetailFields: ['legalDescription'],
 requiredSellerStatementFields: ['leadBasedPaintApplies','ownersAssociationApplies','generalLeasesExist'],
 formFactories: { 'sellerStatements.ohio': createOhioListingAnswersForm },
 formRestorers: { 'sellerStatements.ohio': restoreOhioListingAnswers },
 restoreSellerStatements: saved => ({ohio: restoreOhioListingAnswers(saved?.ohio)}),
 mapSellerStatements: answers => ({ohio: {disclosureExemptionClaimed: answers.ohio!.disclosureExemptionClaimed!}}),
 disclosureRequirements: [],
 questionGroups: [
  {
    "id": "ohio-applicability",
    "title": "Ohio property and disclosure facts",
    "questions": [
      {
        "id": "oh-disclosureExemptionClaimed",
        "fieldPath": "sellerStatements.ohio.disclosureExemptionClaimed",
        "label": "Are you claiming a specific statutory property-disclosure exemption?",
        "description": "Identify the specific R.C. 5302.30(B)(2) exception in signed supporting evidence. An as-is sale alone is not an exception.",
        "required": true,
        "requiredMessage": "Select an answer."
      }
    ]
  }
],
};
