import { HttpsError } from 'firebase-functions/v2/https';
import type { StateListingPackage } from './state-listing-package';
export const indianaListingPackage: StateListingPackage = {stateCode: 'IN', requiredSellerStatementFields: ['leadBasedPaintApplies','ownersAssociationApplies','generalLeasesExist'],
 validateAdditionalSellerStatements(_listingUid, statements) { const facts = statements['indiana'] as Record<string,unknown> | undefined;
 if (typeof facts?.['usesCentralTime'] !== 'boolean') throw new HttpsError('failed-precondition','Answer the IN property applicability questions.');
 if (typeof facts?.['disclosureExemptionClaimed'] !== 'boolean') throw new HttpsError('failed-precondition','Answer the IN property applicability questions.');
 }
};
