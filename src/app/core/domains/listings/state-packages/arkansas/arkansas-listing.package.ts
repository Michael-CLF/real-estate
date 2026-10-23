import {createArkansasListingAnswersForm,restoreArkansasListingAnswers} from './arkansas-listing-form';
import type {StateListingPackage} from '../state-listing-package';
export const arkansasListingPackage:StateListingPackage={
 stateCode:'AR',stateName:'Arkansas',propertyDetailFields:['legalDescription'],
 requiredSellerStatementFields:['leadBasedPaintApplies','ownersAssociationApplies','generalLeasesExist'],
 formFactories:{'sellerStatements.arkansas':createArkansasListingAnswersForm},formRestorers:{'sellerStatements.arkansas':restoreArkansasListingAnswers},
 restoreSellerStatements:saved=>({arkansas:restoreArkansasListingAnswers(saved?.arkansas)}),
 mapSellerStatements:answers=>({arkansas:{}}),
 disclosureRequirements:[],questionGroups:[],
};
