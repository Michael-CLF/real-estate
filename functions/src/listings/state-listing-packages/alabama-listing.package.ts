import { HttpsError } from 'firebase-functions/v2/https';
import type { StateListingPackage } from './state-listing-package';
export const alabamaListingPackage: StateListingPackage = {stateCode: 'AL', requiredSellerStatementFields: ['leadBasedPaintApplies','ownersAssociationApplies','generalLeasesExist'],
 validateAdditionalSellerStatements(_listingUid, statements) { const facts = statements['alabama'] as Record<string,unknown> | undefined;
 if (typeof facts?.['usesEasternTime'] !== 'boolean') throw new HttpsError('failed-precondition','Answer the AL property applicability questions.');
 if (typeof facts?.['hiddenHealthSafetyKnown'] !== 'boolean') throw new HttpsError('failed-precondition','Answer the AL property applicability questions.');
 }
};
