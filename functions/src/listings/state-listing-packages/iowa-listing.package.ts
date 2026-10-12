import { HttpsError } from 'firebase-functions/v2/https';
import type { StateListingPackage } from './state-listing-package';
export const iowaListingPackage: StateListingPackage = {stateCode: 'IA', requiredSellerStatementFields: ['leadBasedPaintApplies','ownersAssociationApplies','generalLeasesExist'],
 validateAdditionalSellerStatements(_listingUid, statements) { const facts = statements['iowa'] as Record<string,unknown> | undefined;
 if (typeof facts?.['disclosureExemptionClaimed'] !== 'boolean') throw new HttpsError('failed-precondition','Answer the IA property applicability questions.');
 if (typeof facts?.['privateSewageApplies'] !== 'boolean') throw new HttpsError('failed-precondition','Answer the IA property applicability questions.');
 if (typeof facts?.['leadServiceLineKnown'] !== 'boolean') throw new HttpsError('failed-precondition','Answer the IA property applicability questions.');
 }
};
