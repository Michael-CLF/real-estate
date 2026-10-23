import {createMaineListingAnswersForm,restoreMaineListingAnswers} from './maine-listing-form';
import type {StateListingPackage} from '../state-listing-package';
export const maineListingPackage:StateListingPackage={
 stateCode:'ME',stateName:'Maine',propertyDetailFields:['legalDescription'],
 requiredSellerStatementFields:['leadBasedPaintApplies','ownersAssociationApplies','generalLeasesExist'],
 formFactories:{'sellerStatements.maine':createMaineListingAnswersForm},formRestorers:{'sellerStatements.maine':restoreMaineListingAnswers},
 restoreSellerStatements:saved=>({maine:restoreMaineListingAnswers(saved?.maine)}),
 mapSellerStatements:answers=>({maine:{disclosureExemptionClaimed:answers.maine!.disclosureExemptionClaimed!}}),
 disclosureRequirements:[],questionGroups:[{"id": "maine-facts", "title": "Maine disclosure applicability", "questions": [{"id": "me-disclosureExemptionClaimed", "fieldPath": "sellerStatements.maine.disclosureExemptionClaimed", "label": "Does this transfer qualify for a specific exemption under 33 M.R.S. 172?", "description": "Select Yes only for an actual listed exemption, such as court-ordered, qualifying foreclosure/default, fiduciary administration, co-owner-only, succession, spouse/lineal-family, divorce settlement, government or qualifying relocation transfer. Ordinary nonoccupancy is not itself an exemption. The seller certifies the applicability answer; it does not waive fraud duties.", "required": true, "requiredMessage": "Select Yes or No based on the actual sale."}]}],
};
