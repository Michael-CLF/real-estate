import { summaryFunding, summaryMoney, summaryText } from '../navstreet-pdf-layout';
import { HttpsError } from 'firebase-functions/v2/https';
import type { StateContractPackage } from '../state-contract-package';
import type { CaliforniaOfferTermsDocument } from './california-offer-terms.document';
import { createCaliforniaInitialOfferTerms } from './california-initial-terms';
import { sanitizeCaliforniaDraftTerms } from './california-draft-terms-sanitizer';
import { validateCaliforniaSubmission } from './california-submission-validator';
import { createCaliforniaContractMilestones } from './california-contract-milestones';
import { generateCaliforniaOfferPdf } from './california-offer-pdf.service';
import { CALIFORNIA_DOCUMENT_RULES } from './california-document-rules';
export const californiaStateContractPackage: StateContractPackage<CaliforniaOfferTermsDocument> = {
  stateCode:'CA',offerCreationEnabled:true,contractTypes:['navstreet_california_residential_sale_2026'],contractTypeRequired:true,
  defaultTimeZone:'America/Los_Angeles',agreementTemplate:{stateCode:'CA',templateUid:CALIFORNIA_DOCUMENT_RULES.templateUid,templateName:'NavStreet California Residential Purchase and Sale Agreement',templateVersion:CALIFORNIA_DOCUMENT_RULES.version},
  createInitialOfferTerms:createCaliforniaInitialOfferTerms,sanitizeDraftTerms:sanitizeCaliforniaDraftTerms,validateSubmission:validateCaliforniaSubmission,
  validateBeforeSigning:({version})=> {if(version.terms.disclosures.leadPaintStatus==='pending' && (version.terms.property.yearBuilt == null || version.terms.property.yearBuilt < 1978)) throw new HttpsError('failed-precondition','Applicable federal lead disclosures must be received before signing.');},
  requiredListingDisclosures:({version})=> ([
    ['propertyConditionStatus','california-transfer-disclosure'],
    ['naturalHazardStatus','california-natural-hazard-disclosure'],
    ['fireHardeningStatus','california-fire-hardening'],
    ['defensibleSpaceStatus','california-defensible-space'],
    ['renovationStatus','california-recent-renovations'],
    ['waterTankStatus','california-assisted-water-tank'],
    ['hoaDocumentsStatus','california-association-documents'],
    ['leadPaintStatus','lead-based-paint'],
  ] as const).filter(([field])=>version.terms.disclosures[field]==='received').map(([,type])=>type),
  createContractMilestones:createCaliforniaContractMilestones,  getAgreementSummary: ({ version: { terms: t } }) => [
    ...summaryFunding(t.purchase.purchasePriceInCents, t.purchase.loanAmountInCents, t.purchase.financingType === 'cash'),
    { label: 'Funding', value: summaryText(t.purchase.financingType) },
    { label: 'Earnest money deposit', value: summaryMoney(t.purchase.hasEarnestMoney === false ? 0 : t.purchase.earnestMoneyInCents) },
    { label: 'Closing / settlement date', value: summaryText(t.deadlines.settlementDate) },
    { label: 'Inspection / due diligence', value: `${t.deadlines.inspectionPeriodDays} calendar days after acceptance; see agreement counting rules` },
  ],
  generateAgreement:generateCaliforniaOfferPdf,
};

import type { DocumentReference, Transaction } from 'firebase-admin/firestore';
import { CALIFORNIA_DISCLOSURE_TYPES, validCaliforniaDisclosureDecision, type CaliforniaDisclosureApplicability } from '../../../listings/state-listing-packages/california-listing-facts';
export async function readCaliforniaListingDisclosures(
  transaction: Transaction, listingReference: DocumentReference, listing: Record<string, unknown>,
): Promise<{ requiredDisclosureTypes: string[]; documentVersions: Record<string, string>; applicability: CaliforniaDisclosureApplicability }> {
  const applicability = ((listing['sellerStatements'] as { california?: { disclosureApplicability?: CaliforniaDisclosureApplicability } } | undefined)?.california?.disclosureApplicability ?? {}) as CaliforniaDisclosureApplicability;
  const snapshots = await Promise.all(CALIFORNIA_DISCLOSURE_TYPES.map(type =>
    transaction.get(listingReference.collection('disclosures').doc(type))));
  const requiredDisclosureTypes: string[] = [];
  const documentVersions: Record<string, string> = {};
  for (const [index, type] of CALIFORNIA_DISCLOSURE_TYPES.entries()) {
    const decision = applicability[type];
    const file = snapshots[index].data()?.['currentDocument'] as Record<string, unknown> | undefined;
    const validFile = file && file['listingUid'] === listingReference.id &&
      file['sellerUid'] === listing['sellerUid'] && file['stateAbbreviation'] === 'CA' &&
      file['documentType'] === type && typeof file['versionId'] === 'string' &&
      /^[A-Za-z0-9_-]{1,180}$/.test(file['versionId']) &&
      file['storagePath'] === `listing-disclosures/${listing['sellerUid']}/${listingReference.id}/${type}/${file['versionId']}.pdf`;
    if (validCaliforniaDisclosureDecision(decision) && decision.status !== 'required') continue;
    if (!validFile) continue;
    requiredDisclosureTypes.push(type);
    documentVersions[type] = file!['versionId'] as string;
  }
  return { requiredDisclosureTypes, documentVersions, applicability };
}
