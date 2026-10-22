import { HttpsError } from 'firebase-functions/v2/https';
import type { StateListingPackage } from './state-listing-package';
export const marylandListingPackage: StateListingPackage = {stateCode: 'MD', requiredSellerStatementFields: ['leadBasedPaintApplies','ownersAssociationApplies','generalLeasesExist'],
 validateAdditionalSellerStatements(_listingUid, statements) { const facts = statements['maryland'] as Record<string,unknown> | undefined;
 if (typeof facts?.['disclosureExemptionClaimed'] !== 'boolean') throw new HttpsError('failed-precondition','Answer the MD property applicability questions.');
 if (typeof facts?.['usesDisclaimer'] !== 'boolean') throw new HttpsError('failed-precondition','Answer the MD property applicability questions.');
 if (typeof facts?.['privateWellApplies'] !== 'boolean') throw new HttpsError('failed-precondition','Answer the MD property applicability questions.');
 if (typeof facts?.['onsiteSewageApplies'] !== 'boolean') throw new HttpsError('failed-precondition','Answer the MD property applicability questions.');
 if (typeof facts?.['deferredWaterSewerCharges'] !== 'boolean') throw new HttpsError('failed-precondition','Answer the MD property applicability questions.');
 if (typeof facts?.['superfundNearby'] !== 'boolean') throw new HttpsError('failed-precondition','Answer the MD property applicability questions.');
 if (typeof facts?.['otherPropertyNoticeApplies'] !== 'boolean') throw new HttpsError('failed-precondition','Answer the MD property applicability questions.');
 if (typeof facts?.['rentalLeadObligationApplies'] !== 'boolean') throw new HttpsError('failed-precondition','Answer the MD property applicability questions.');
 if (typeof facts?.['groundRentApplies'] !== 'boolean') throw new HttpsError('failed-precondition','Answer the MD property applicability questions.');
 if ((statements['contractFacts'] as Record<string,unknown> | undefined)?.['isCondominium'] === true && typeof facts?.['condominiumFewerThanSevenUnits'] !== 'boolean') throw new HttpsError('failed-precondition','Answer the Maryland condominium size question.');
 }
};
