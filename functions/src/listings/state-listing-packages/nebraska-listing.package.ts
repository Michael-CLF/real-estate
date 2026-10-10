import { HttpsError } from 'firebase-functions/v2/https';
import type { StateListingPackage } from './state-listing-package';
export const nebraskaListingPackage: StateListingPackage = {stateCode: 'NE', requiredSellerStatementFields: ['leadBasedPaintApplies','ownersAssociationApplies','generalLeasesExist'],
 validateAdditionalSellerStatements(_listingUid, statements) { const facts = statements['nebraska'] as Record<string,unknown> | undefined;
 if (typeof facts?.['usesMountainTime'] !== 'boolean') throw new HttpsError('failed-precondition','Answer the NE property applicability questions.');
 }
};
