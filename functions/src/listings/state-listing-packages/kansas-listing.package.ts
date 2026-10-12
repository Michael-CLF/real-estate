import { HttpsError } from 'firebase-functions/v2/https';
import type { StateListingPackage } from './state-listing-package';
export const kansasListingPackage: StateListingPackage = {stateCode: 'KS', requiredSellerStatementFields: ['leadBasedPaintApplies','ownersAssociationApplies','generalLeasesExist'],
 validateAdditionalSellerStatements(_listingUid, statements) { const facts = statements['kansas'] as Record<string,unknown> | undefined;
 if (typeof facts?.['usesMountainTime'] !== 'boolean') throw new HttpsError('failed-precondition','Answer the KS property applicability questions.');
 if (typeof facts?.['elevatedRadonKnown'] !== 'boolean') throw new HttpsError('failed-precondition','Answer the KS property applicability questions.');
 }
};
