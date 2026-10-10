import { HttpsError } from 'firebase-functions/v2/https';
import type { StateListingPackage } from './state-listing-package';
export const oregonListingPackage: StateListingPackage = {stateCode: 'OR', requiredSellerStatementFields: ['leadBasedPaintApplies','ownersAssociationApplies','generalLeasesExist'],
 validateAdditionalSellerStatements(_listingUid, statements) { const facts = statements['oregon'] as Record<string,unknown> | undefined;
 if (typeof facts?.['historicSpecialAssessmentApplies'] !== 'boolean') throw new HttpsError('failed-precondition','Answer the Oregon historic-property special assessment question.');
 if (typeof facts?.['usesMountainTime'] !== 'boolean') throw new HttpsError('failed-precondition','Answer the OR property applicability questions.');
 if (typeof facts?.['domesticWellApplies'] !== 'boolean') throw new HttpsError('failed-precondition','Answer the OR property applicability questions.');
 if (typeof facts?.['uncertifiedWoodDevicePresent'] !== 'boolean') throw new HttpsError('failed-precondition','Answer the OR property applicability questions.');
 }
};
