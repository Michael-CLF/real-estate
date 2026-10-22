import { createIowaListingAnswersForm, restoreIowaListingAnswers } from './iowa-listing-form';
import type { StateListingPackage } from '../state-listing-package';
export const iowaListingPackage: StateListingPackage = {
 stateCode: 'IA', stateName: 'Iowa', propertyDetailFields: ['legalDescription'],
 requiredSellerStatementFields: ['leadBasedPaintApplies','ownersAssociationApplies','generalLeasesExist'],
 formFactories: { 'sellerStatements.iowa': createIowaListingAnswersForm },
 formRestorers: { 'sellerStatements.iowa': restoreIowaListingAnswers },
 restoreSellerStatements: saved => ({iowa: restoreIowaListingAnswers(saved?.iowa)}),
 mapSellerStatements: answers => ({iowa: {disclosureExemptionClaimed: answers.iowa!.disclosureExemptionClaimed!,privateSewageApplies: answers.iowa!.privateSewageApplies!,leadServiceLineKnown: answers.iowa!.leadServiceLineKnown!}}),
 disclosureRequirements: [],
 questionGroups: [
  {
    "id": "iowa-applicability",
    "title": "Iowa property and disclosure facts",
    "questions": [
      {
        "id": "ia-disclosureExemptionClaimed",
        "fieldPath": "sellerStatements.iowa.disclosureExemptionClaimed",
        "label": "Does this transfer qualify for a specific Chapter 558A exception?",
        "description": "Identify the specific 558A.1 exception in signed supporting evidence. An as-is sale alone is not an exception. Before buyers can make online offers, upload the completed signed seller condition disclosure or supported exception evidence under Property Disclosures. The form must include required known radon information and the current lead water-service-line questions. NavStreet supplies the official radon fact sheet automatically; upload no duplicate pamphlet. You may create and advertise the listing while gathering documents.",
        "required": true,
        "requiredMessage": "Select an answer."
      },
      {
        "id": "ia-privateSewageApplies",
        "fieldPath": "sellerStatements.iowa.privateSewageApplies",
        "label": "Is the property served by a private sewage disposal system?",
        "description": "Arrange the required certified time-of-transfer inspection or legally applicable exception/binding agreement before transfer and recording; this is not a universal pre-offer inspection.",
        "required": true,
        "requiredMessage": "Select an answer."
      },
      {
        "id": "ia-leadServiceLineKnown",
        "fieldPath": "sellerStatements.iowa.leadServiceLineKnown",
        "label": "Do you know of a lead or qualifying galvanized water service line?",
        "description": "The 2026 seller disclosure must address lead service lines. No means no known line, not a certification that the service line is lead-free; use Unknown on the full form when appropriate.",
        "required": true,
        "requiredMessage": "Select an answer."
      }
    ]
  }
],
};
