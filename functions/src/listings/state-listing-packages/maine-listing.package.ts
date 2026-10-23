import {HttpsError} from 'firebase-functions/v2/https';
import type {StateListingPackage} from './state-listing-package';
export const maineListingPackage:StateListingPackage={stateCode:'ME',requiredSellerStatementFields:['leadBasedPaintApplies','ownersAssociationApplies','generalLeasesExist'],
 validateAdditionalSellerStatements(_uid,statements){const facts=statements['maine'] as Record<string,unknown>|undefined;
if(typeof facts?.['disclosureExemptionClaimed']!=='boolean')throw new HttpsError('failed-precondition','Answer the Maine disclosure applicability questions.');
}};
