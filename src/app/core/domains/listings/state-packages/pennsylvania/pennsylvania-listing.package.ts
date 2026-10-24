import {createPennsylvaniaListingAnswersForm,restorePennsylvaniaListingAnswers} from './pennsylvania-listing-form';
import type {StateListingPackage} from '../state-listing-package';
export const pennsylvaniaListingPackage:StateListingPackage={
 stateCode:'PA',stateName:'Pennsylvania',propertyDetailFields:['legalDescription'],
 requiredSellerStatementFields:['leadBasedPaintApplies','ownersAssociationApplies','generalLeasesExist'],
 formFactories:{'sellerStatements.pennsylvania':createPennsylvaniaListingAnswersForm},formRestorers:{'sellerStatements.pennsylvania':restorePennsylvaniaListingAnswers},
 restoreSellerStatements:saved=>({pennsylvania:restorePennsylvaniaListingAnswers(saved?.pennsylvania)}),
 mapSellerStatements:answers=>({pennsylvania:{disclosureExemptionClaimed:answers.pennsylvania!.disclosureExemptionClaimed!}}),
 disclosureRequirements:[],questionGroups:[{"id": "pennsylvania-facts", "title": "Pennsylvania disclosure and deadline facts", "questions": [{"id": "pa-disclosureExemptionClaimed", "fieldPath": "sellerStatements.pennsylvania.disclosureExemptionClaimed", "label": "Does this transfer qualify for a specific statutory condition-disclosure exception?", "description": "Use only a specific 68 Pa.C.S. 7302 or chapter 71 scope exception, such as qualifying fiduciary, foreclosure, family/co-owner or other listed transfer. An as-is sale alone does not excuse known material defect disclosure; the unit-only rule for condominiums is not a blanket exception.", "required": true, "requiredMessage": "Select Yes or No based on the actual property and transfer."}]}],
};
