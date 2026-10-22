import { createMarylandListingAnswersForm, restoreMarylandListingAnswers } from './maryland-listing-form';
import type { StateListingPackage } from '../state-listing-package';
export const marylandListingPackage: StateListingPackage = {
 stateCode: 'MD', stateName: 'Maryland', propertyDetailFields: ['legalDescription'],
 requiredSellerStatementFields: ['leadBasedPaintApplies','ownersAssociationApplies','generalLeasesExist'],
 formFactories: { 'sellerStatements.maryland': createMarylandListingAnswersForm },
 formRestorers: { 'sellerStatements.maryland': restoreMarylandListingAnswers },
 restoreSellerStatements: saved => ({maryland: restoreMarylandListingAnswers(saved?.maryland)}),
 mapSellerStatements: answers => ({maryland: {condominiumFewerThanSevenUnits: answers.maryland!.condominiumFewerThanSevenUnits!,disclosureExemptionClaimed: answers.maryland!.disclosureExemptionClaimed!,usesDisclaimer: answers.maryland!.usesDisclaimer!,privateWellApplies: answers.maryland!.privateWellApplies!,onsiteSewageApplies: answers.maryland!.onsiteSewageApplies!,deferredWaterSewerCharges: answers.maryland!.deferredWaterSewerCharges!,superfundNearby: answers.maryland!.superfundNearby!,otherPropertyNoticeApplies: answers.maryland!.otherPropertyNoticeApplies!,rentalLeadObligationApplies: answers.maryland!.rentalLeadObligationApplies!,groundRentApplies: answers.maryland!.groundRentApplies!}}),
 disclosureRequirements: [],
 questionGroups: [
  {
    "id": "maryland-applicability",
    "title": "Maryland property and disclosure facts",
    "questions": [
{
  "id": "md-condominiumFewerThanSevenUnits",
  "fieldPath": "sellerStatements.maryland.condominiumFewerThanSevenUnits",
  "label": "For a condominium resale, does the condominium contain fewer than seven units?",
  "description": "Answer for condominium ownership, regardless of the physical property label. This selects the statutory resale notice and packet. For a non-condominium property, select No.",
  "required": true,
  "requiredMessage": "Select an answer."
},
      {
        "id": "md-disclosureExemptionClaimed",
        "fieldPath": "sellerStatements.maryland.disclosureExemptionClaimed",
        "label": "Does this transfer qualify for a specific Maryland condition-disclosure exception?",
        "description": "Identify the Real Property 10-702(b)(2) exception in signed evidence. A disclaimer is an alternative form, not an exemption.",
        "required": true,
        "requiredMessage": "Select an answer."
      },
      {
        "id": "md-usesDisclaimer",
        "fieldPath": "sellerStatements.maryland.usesDisclaimer",
        "label": "Will you use the Maryland disclaimer instead of the condition disclosure?",
        "description": "Use the current Commission form. A disclaimer still requires known latent health or safety defects and does not waive the buyer rights stated in the contract.",
        "required": true,
        "requiredMessage": "Select an answer."
      },
      {
        "id": "md-privateWellApplies",
        "fieldPath": "sellerStatements.maryland.privateWellApplies",
        "label": "Does the property have a private or domestic water supply well?",
        "description": "The contract requires purchaser-arranged water quality testing and both parties review before settlement; eligible results last three years. This workflow does not provide a testing waiver.",
        "required": true,
        "requiredMessage": "Select an answer."
      },
      {
        "id": "md-onsiteSewageApplies",
        "fieldPath": "sellerStatements.maryland.onsiteSewageApplies",
        "label": "Does the property use an on-site sewage disposal system?",
        "description": "Review the MDE Septic Systems Outreach Toolkit and provide known permits, maintenance and advanced-treatment system information.",
        "required": true,
        "requiredMessage": "Select an answer."
      },
      {
        "id": "md-deferredWaterSewerCharges",
        "fieldPath": "sellerStatements.maryland.deferredWaterSewerCharges",
        "label": "Is the property subject to recorded deferred water or sewer charges?",
        "description": "Provide a completed contract notice stating the annual amount, payment month, ending date and collector name/address. These private charges are not county utility bills.",
        "required": true,
        "requiredMessage": "Select an answer."
      },
      {
        "id": "md-superfundNearby",
        "fieldPath": "sellerStatements.maryland.superfundNearby",
        "label": "Is the property within one mile of an NPL Superfund site?",
        "description": "Check EPA mapping. If Yes, supply the separate statutory addendum identifying the site and preserving the five-day cancellation right.",
        "required": true,
        "requiredMessage": "Select an answer."
      },
      {
        "id": "md-otherPropertyNoticeApplies",
        "fieldPath": "sellerStatements.maryland.otherPropertyNoticeApplies",
        "label": "Do any other property-specific contract disclosures apply?",
        "description": "Include applicable Prince George\u2019s impact fees, Anne Arundel enforcement actions, agricultural transfer-tax notices and local or environmental requirements. Provide the facts in a completed contract addendum before signing.",
        "required": true,
        "requiredMessage": "Select an answer."
      },
      {
        "id": "md-rentalLeadObligationApplies",
        "fieldPath": "sellerStatements.maryland.rentalLeadObligationApplies",
        "label": "Is an affected rental property being sold with an unperformed required lead risk-reduction obligation?",
        "description": "Environment 6-824 requires disclosure at or before execution when required treatment will not be completed before transfer. Include the obligation in the statutory packet.",
        "required": true,
        "requiredMessage": "Select an answer."
      },
      {
        "id": "md-groundRentApplies",
        "fieldPath": "sellerStatements.maryland.groundRentApplies",
        "label": "Is this property subject to a ground lease or ground rent?",
        "description": "This initial agreement covers fee-simple resales. Ground-rent transactions require separate contract provisions and are outside this package.",
        "required": true,
        "requiredMessage": "Select an answer."
      }
    ]
  }
],
};
