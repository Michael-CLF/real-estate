import { createNewHampshireListingAnswersForm, restoreNewHampshireListingAnswers } from './new-hampshire-listing-form';
import type { StateListingPackage } from '../state-listing-package';
export const newHampshireListingPackage: StateListingPackage = {
 stateCode: 'NH', stateName: 'New Hampshire', propertyDetailFields: ['legalDescription'],
 requiredSellerStatementFields: ['leadBasedPaintApplies','ownersAssociationApplies','generalLeasesExist'],
 formFactories: { 'sellerStatements.newHampshire': createNewHampshireListingAnswersForm },
 formRestorers: { 'sellerStatements.newHampshire': restoreNewHampshireListingAnswers },
 restoreSellerStatements: saved => ({newHampshire: restoreNewHampshireListingAnswers(saved?.newHampshire)}),
 mapSellerStatements: answers => ({newHampshire: {methProductionKnown: answers.newHampshire!.methProductionKnown!,utilityTariffChargesKnown: answers.newHampshire!.utilityTariffChargesKnown!}}),
 disclosureRequirements: [],
 questionGroups: [
  {
    "id": "new-hampshire-applicability",
    "title": "New Hampshire property and disclosure facts",
    "questions": [
      {
        "id": "nh-methProductionKnown",
        "fieldPath": "sellerStatements.newHampshire.methProductionKnown",
        "label": "Do you know that methamphetamine production occurred on this property?",
        "description": "The required packet must disclose applicable production history and any authoritative remediation determination; an unverified cleanup claim is insufficient.",
        "required": true,
        "requiredMessage": "Select an answer."
      },
      {
        "id": "nh-utilityTariffChargesKnown",
        "fieldPath": "sellerStatements.newHampshire.utilityTariffChargesKnown",
        "label": "Are there known ongoing utility-tariff charges financing energy improvements?",
        "description": "Include remaining term, charges and available savings records, or state in writing when required information is unavailable.",
        "required": true,
        "requiredMessage": "Select an answer."
      }
    ]
  }
],
};
