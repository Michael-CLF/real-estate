import { HttpsError } from 'firebase-functions/v2/https';
import type { StateListingPackage } from './state-listing-package';
export const southDakotaListingPackage: StateListingPackage = {stateCode: 'SD', requiredSellerStatementFields: ['leadBasedPaintApplies','ownersAssociationApplies','generalLeasesExist'],
 validateAdditionalSellerStatements(_listingUid, statements) { const facts = statements['southDakota'] as Record<string,unknown> | undefined;
 if (typeof facts?.['usesMountainTime'] !== 'boolean') throw new HttpsError('failed-precondition','Answer the SD property applicability questions.');
 if (typeof facts?.['disclosureExemptionClaimed'] !== 'boolean') throw new HttpsError('failed-precondition','Answer the SD property applicability questions.');
 if (typeof facts?.['privateTransferFeeKnown'] !== 'boolean') throw new HttpsError('failed-precondition','Answer the SD property applicability questions.');
 if ((statements['contractFacts'] as Record<string,unknown> | undefined)?.['isCondominium'] === true && facts?.['condominiumReportIssued'] !== true) throw new HttpsError('failed-precondition','Confirm the South Dakota condominium project final or substitute report has issued before offering the unit for sale.');
 }
};
