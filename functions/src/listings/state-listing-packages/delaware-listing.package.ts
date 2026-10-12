import { HttpsError } from 'firebase-functions/v2/https';
import type { StateListingPackage } from './state-listing-package';
export const delawareListingPackage: StateListingPackage = {stateCode: 'DE', requiredSellerStatementFields: ['leadBasedPaintApplies','ownersAssociationApplies','generalLeasesExist'],
 validateAdditionalSellerStatements(_listingUid, statements) { const facts = statements['delaware'] as Record<string,unknown> | undefined;
 if (typeof facts?.['disclosureExemptionClaimed'] !== 'boolean') throw new HttpsError('failed-precondition','Answer the DE property applicability questions.');
 if (typeof facts?.['radonReportsKnown'] !== 'boolean') throw new HttpsError('failed-precondition','Answer the DE property applicability questions.');
 }
};
