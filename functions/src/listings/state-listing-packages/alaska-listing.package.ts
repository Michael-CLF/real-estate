import type {StateListingPackage} from './state-listing-package';
import {HttpsError} from 'firebase-functions/v2/https';
export const alaskaListingPackage:StateListingPackage={stateCode:'AK',requiredSellerStatementFields:['leadBasedPaintApplies','ownersAssociationApplies','generalLeasesExist'],validateAdditionalSellerStatements(_uid,s){if(typeof (s['alaska'] as Record<string,unknown>|undefined)?.['usesAleutianTime']!=='boolean')throw new HttpsError('failed-precondition',"Does the property use Hawaii-Aleutian time?");}};
