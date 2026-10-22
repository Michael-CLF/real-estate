import { HttpsError } from 'firebase-functions/v2/https';
import type { StateListingPackage } from './state-listing-package';
export const newMexicoListingPackage: StateListingPackage = {stateCode: 'NM', requiredSellerStatementFields: ['leadBasedPaintApplies','ownersAssociationApplies','generalLeasesExist'],
 validateAdditionalSellerStatements(_listingUid, statements) { const facts = statements['newMexico'] as Record<string,unknown> | undefined;
 if (typeof facts?.['privateWastewaterApplies'] !== 'boolean') throw new HttpsError('failed-precondition','Answer the NM property applicability questions.');
 if (typeof facts?.['drugLabContaminationKnown'] !== 'boolean') throw new HttpsError('failed-precondition','Answer the NM property applicability questions.');
 if (typeof facts?.['appurtenantWaterRightsKnown'] !== 'boolean') throw new HttpsError('failed-precondition','Answer the NM property applicability questions.');
 if (facts?.['taxEstimateUnavailable'] !== undefined && typeof facts['taxEstimateUnavailable'] !== 'boolean') throw new HttpsError('failed-precondition','Answer the New Mexico assessor estimate availability question.');
 }
};
