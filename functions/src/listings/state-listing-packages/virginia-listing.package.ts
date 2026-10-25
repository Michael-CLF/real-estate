import type {StateListingPackage} from './state-listing-package';
import {HttpsError} from 'firebase-functions/v2/https';
export const virginiaListingPackage:StateListingPackage={stateCode:'VA',requiredSellerStatementFields:['leadBasedPaintApplies','ownersAssociationApplies','generalLeasesExist'],validateAdditionalSellerStatements(_uid,s){if(typeof (s['virginia'] as Record<string,unknown>|undefined)?.['affirmativeNoticesApply']!=='boolean')throw new HttpsError('failed-precondition',"Do any Virginia affirmative written disclosure duties apply?");}};
