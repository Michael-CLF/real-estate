import {createMississippiListingAnswersForm,restoreMississippiListingAnswers} from './mississippi-listing-form';
import type {StateListingPackage} from '../state-listing-package';
export const mississippiListingPackage:StateListingPackage={
 stateCode:'MS',stateName:'Mississippi',propertyDetailFields:['legalDescription'],
 requiredSellerStatementFields:['leadBasedPaintApplies','ownersAssociationApplies','generalLeasesExist'],
 formFactories:{'sellerStatements.mississippi':createMississippiListingAnswersForm},formRestorers:{'sellerStatements.mississippi':restoreMississippiListingAnswers},
 restoreSellerStatements:saved=>({mississippi:restoreMississippiListingAnswers(saved?.mississippi)}),
 mapSellerStatements:answers=>({mississippi:{}}),
 disclosureRequirements:[],questionGroups:[],
};
