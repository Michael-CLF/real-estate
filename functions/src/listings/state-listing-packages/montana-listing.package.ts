import { HttpsError } from 'firebase-functions/v2/https';
import type { StateListingPackage } from './state-listing-package';
export const montanaListingPackage: StateListingPackage = {stateCode: 'MT', requiredSellerStatementFields: ['leadBasedPaintApplies','ownersAssociationApplies','generalLeasesExist'],
 validateAdditionalSellerStatements(_listingUid, statements) { const facts = statements['montana'] as Record<string,unknown> | undefined;
 if (typeof facts?.['disclosureExemptionClaimed'] !== 'boolean') throw new HttpsError('failed-precondition','Answer the MT property applicability questions.');
 if (typeof facts?.['radonTestsKnown'] !== 'boolean') throw new HttpsError('failed-precondition','Answer the MT property applicability questions.');
 if (typeof facts?.['drugContaminationKnown'] !== 'boolean') throw new HttpsError('failed-precondition','Answer the MT property applicability questions.');
 if (typeof facts?.['appurtenantWaterRightsKnown'] !== 'boolean') throw new HttpsError('failed-precondition','Answer the MT property applicability questions.');
 }
};
