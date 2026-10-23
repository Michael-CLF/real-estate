import {HttpsError} from 'firebase-functions/v2/https';
import type {StateListingPackage} from './state-listing-package';
export const illinoisListingPackage:StateListingPackage={stateCode:'IL',requiredSellerStatementFields:['leadBasedPaintApplies','ownersAssociationApplies','generalLeasesExist'],
 validateAdditionalSellerStatements(_uid,statements){const facts=statements['illinois'] as Record<string,unknown>|undefined;
if(typeof facts?.['disclosureExemptionClaimed']!=='boolean')throw new HttpsError('failed-precondition','Answer the Illinois disclosure applicability questions.');
if(typeof facts?.['radonExemptionClaimed']!=='boolean')throw new HttpsError('failed-precondition','Answer the Illinois disclosure applicability questions.');
}};
