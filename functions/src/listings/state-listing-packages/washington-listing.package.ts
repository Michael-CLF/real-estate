import { HttpsError } from 'firebase-functions/v2/https';
import type { StateListingPackage } from './state-listing-package';
export const washingtonListingPackage: StateListingPackage = {stateCode: 'WA', requiredSellerStatementFields: ['leadBasedPaintApplies','ownersAssociationApplies','generalLeasesExist'],
 validateAdditionalSellerStatements(_listingUid, statements) { const facts = statements['washington'] as Record<string,unknown> | undefined;
 if (typeof facts?.['disclosureExemptionClaimed'] !== 'boolean') throw new HttpsError('failed-precondition','Answer the WA property applicability questions.');
 if (typeof facts?.['oilTankHeating'] !== 'boolean') throw new HttpsError('failed-precondition','Answer the WA property applicability questions.');
 }
};
