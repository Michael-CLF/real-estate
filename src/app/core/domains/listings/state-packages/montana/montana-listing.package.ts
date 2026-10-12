import { createMontanaListingAnswersForm, restoreMontanaListingAnswers } from './montana-listing-form';
import type { StateListingPackage } from '../state-listing-package';
export const montanaListingPackage: StateListingPackage = {
 stateCode: 'MT', stateName: 'Montana', propertyDetailFields: ['legalDescription'],
 requiredSellerStatementFields: ['leadBasedPaintApplies','ownersAssociationApplies','generalLeasesExist'],
 formFactories: { 'sellerStatements.montana': createMontanaListingAnswersForm },
 formRestorers: { 'sellerStatements.montana': restoreMontanaListingAnswers },
 restoreSellerStatements: saved => ({montana: restoreMontanaListingAnswers(saved?.montana)}),
 mapSellerStatements: answers => ({montana: {disclosureExemptionClaimed: answers.montana!.disclosureExemptionClaimed!,radonTestsKnown: answers.montana!.radonTestsKnown!,drugContaminationKnown: answers.montana!.drugContaminationKnown!,appurtenantWaterRightsKnown: answers.montana!.appurtenantWaterRightsKnown!}}),
 disclosureRequirements: [],
 questionGroups: [
  {
    "id": "montana-applicability",
    "title": "Montana property and disclosure facts",
    "questions": [
      {
        "id": "mt-disclosureExemptionClaimed",
        "fieldPath": "sellerStatements.montana.disclosureExemptionClaimed",
        "label": "Does this transfer qualify for a seller-statement exception?",
        "description": "Identify the 70-20-503 exception in signed evidence. A statement exception does not automatically waive separate radon, contamination or water-right requirements.",
        "required": true,
        "requiredMessage": "Select an answer."
      },
      {
        "id": "mt-radonTestsKnown",
        "fieldPath": "sellerStatements.montana.radonTestsKnown",
        "label": "Do you know that the building has been tested for radon?",
        "description": "Provide prior test results and subsequent mitigation/treatment evidence before or upon entry into the contract.",
        "required": true,
        "requiredMessage": "Select an answer."
      },
      {
        "id": "mt-drugContaminationKnown",
        "fieldPath": "sellerStatements.montana.drugContaminationKnown",
        "label": "Do you know of methamphetamine or fentanyl lab use or contamination at the property?",
        "description": "Provide written notice and any certified remediation/compliance evidence before agreement to sale under 75-10-1305. Do not omit prior contamination merely because remediation occurred.",
        "required": true,
        "requiredMessage": "Select an answer."
      },
      {
        "id": "mt-appurtenantWaterRightsKnown",
        "fieldPath": "sellerStatements.montana.appurtenantWaterRightsKnown",
        "label": "Do you know of appurtenant water rights associated with this property?",
        "description": "Provide recorded right identifiers and proposed transfer, reservation or severance details. Closing must verify the DNRC records, required fees and ownership updates.",
        "required": true,
        "requiredMessage": "Select an answer."
      }
    ]
  }
],
};
