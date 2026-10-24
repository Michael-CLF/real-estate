import {createGeorgiaListingAnswersForm,restoreGeorgiaListingAnswers} from './georgia-listing-form';
import type {StateListingPackage} from '../state-listing-package';
export const georgiaListingPackage:StateListingPackage={
 stateCode:'GA',stateName:'Georgia',propertyDetailFields:['legalDescription'],
 requiredSellerStatementFields:['leadBasedPaintApplies','ownersAssociationApplies','generalLeasesExist'],
 formFactories:{'sellerStatements.georgia':createGeorgiaListingAnswersForm},formRestorers:{'sellerStatements.georgia':restoreGeorgiaListingAnswers},
 restoreSellerStatements:saved=>({georgia:restoreGeorgiaListingAnswers(saved?.georgia)}),
 mapSellerStatements:answers=>({georgia:{}}),
 disclosureRequirements:[],questionGroups:[],
};
