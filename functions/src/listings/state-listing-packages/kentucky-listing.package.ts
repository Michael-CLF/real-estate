import type {StateListingPackage} from './state-listing-package';
import {HttpsError} from 'firebase-functions/v2/https';
export const kentuckyListingPackage:StateListingPackage={stateCode:'KY',requiredSellerStatementFields:['leadBasedPaintApplies','ownersAssociationApplies','generalLeasesExist'],validateAdditionalSellerStatements(_uid,s){if(typeof (s['kentucky'] as Record<string,unknown>|undefined)?.['usesCentralTime']!=='boolean')throw new HttpsError('failed-precondition',"Does this property use Central time?");}};
