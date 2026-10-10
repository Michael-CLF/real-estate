import { HttpsError } from 'firebase-functions/v2/https';
import type { StateListingPackage } from './state-listing-package';
export const missouriListingPackage: StateListingPackage = {stateCode: 'MO', requiredSellerStatementFields: ['leadBasedPaintApplies','ownersAssociationApplies','generalLeasesExist'],
 validateAdditionalSellerStatements(_listingUid, statements) { const facts = statements['missouri'] as Record<string,unknown> | undefined;
 if (typeof facts?.['methProductionKnown'] !== 'boolean') throw new HttpsError('failed-precondition','Answer the MO property applicability questions.');
 if (typeof facts?.['drugConvictionKnown'] !== 'boolean') throw new HttpsError('failed-precondition','Answer the MO property applicability questions.');
 }
};
