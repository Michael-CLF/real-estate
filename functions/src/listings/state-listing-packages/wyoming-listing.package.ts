import { HttpsError } from 'firebase-functions/v2/https';
import type { StateListingPackage } from './state-listing-package';
export const wyomingListingPackage: StateListingPackage = {stateCode: 'WY', requiredSellerStatementFields: ['leadBasedPaintApplies','ownersAssociationApplies','generalLeasesExist'],
 validateAdditionalSellerStatements(_listingUid, statements) { const facts = statements['wyoming'] as Record<string,unknown> | undefined;
 if (typeof facts?.['privateWastewaterApplies'] !== 'boolean') throw new HttpsError('failed-precondition','Answer the WY property applicability questions.');
 if (typeof facts?.['appurtenantWaterRightsKnown'] !== 'boolean') throw new HttpsError('failed-precondition','Answer the WY property applicability questions.');
 }
};
