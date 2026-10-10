import { HttpsError } from 'firebase-functions/v2/https';
import type { StateListingPackage } from './state-listing-package';
export const newHampshireListingPackage: StateListingPackage = {stateCode: 'NH', requiredSellerStatementFields: ['leadBasedPaintApplies','ownersAssociationApplies','generalLeasesExist'],
 validateAdditionalSellerStatements(_listingUid, statements) { const facts = statements['newHampshire'] as Record<string,unknown> | undefined;
 if (typeof facts?.['methProductionKnown'] !== 'boolean') throw new HttpsError('failed-precondition','Answer the NH property applicability questions.');
 if (typeof facts?.['utilityTariffChargesKnown'] !== 'boolean') throw new HttpsError('failed-precondition','Answer the NH property applicability questions.');
 }
};
