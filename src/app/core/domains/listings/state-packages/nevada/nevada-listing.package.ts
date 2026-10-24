import {createNevadaListingAnswersForm,restoreNevadaListingAnswers} from './nevada-listing-form';
import type {StateListingPackage} from '../state-listing-package';
export const nevadaListingPackage:StateListingPackage={
 stateCode:'NV',stateName:'Nevada',propertyDetailFields:['legalDescription'],
 requiredSellerStatementFields:['leadBasedPaintApplies','ownersAssociationApplies','generalLeasesExist'],
 formFactories:{'sellerStatements.nevada':createNevadaListingAnswersForm},formRestorers:{'sellerStatements.nevada':restoreNevadaListingAnswers},
 restoreSellerStatements:saved=>({nevada:restoreNevadaListingAnswers(saved?.nevada)}),
 mapSellerStatements:answers=>({nevada:{usesMountainTime:answers.nevada!.usesMountainTime!,openRangeAdjacent:answers.nevada!.openRangeAdjacent!}}),
 disclosureRequirements:[],questionGroups:[{"id": "nevada-facts", "title": "Nevada disclosure and deadline facts", "questions": [{"id": "nv-usesMountainTime", "fieldPath": "sellerStatements.nevada.usesMountainTime", "label": "Does the property use Mountain time?", "description": "Nevada: select Yes only for West Wendover; otherwise Pacific time.", "required": true, "requiredMessage": "Select Yes or No based on the actual property and transfer."}, {"id": "nv-openRangeAdjacent", "fieldPath": "sellerStatements.nevada.openRangeAdjacent", "label": "Is this property adjacent to open range?", "description": "NRS 113.065 requires a separate written grazing and rights-of-way disclosure before the purchaser signs. Upload the complete separate notice before offers can be submitted. Buyer actual review, dated signature and seller retention/recording duties remain separate.", "required": true, "requiredMessage": "Select Yes or No based on the actual property and transfer."}]}],
};
