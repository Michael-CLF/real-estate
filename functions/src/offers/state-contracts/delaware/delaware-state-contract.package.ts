import { assertDelawareListingDisclosures } from '../../delaware-listing-disclosure-gate';
import { selectReceivedListingDisclosures } from '../received-listing-disclosures';
import { summaryFunding, summaryMoney, summaryText } from '../navstreet-pdf-layout';
import type { StateContractPackage } from '../state-contract-package';
import type { DelawareOfferTermsDocument } from './delaware-offer-terms.document';
import { DELAWARE_DOCUMENT_RULES } from './delaware-document-rules';
import { createDelawareInitialOfferTerms } from './delaware-initial-terms';
import { sanitizeDelawareDraftTerms } from './delaware-draft-terms-sanitizer';
import { validateDelawareSubmission } from './delaware-submission-validator';
import { HttpsError } from 'firebase-functions/v2/https';
import { createDelawareContractMilestones } from './delaware-contract-milestones';
export const delawareStateContractPackage: StateContractPackage<DelawareOfferTermsDocument> = {
  listingDisclosurePolicy: { assertReady: assertDelawareListingDisclosures },
  stateCode: 'DE', offerCreationEnabled: true,
  contractTypes: ['navstreet_delaware_residential_sale_2026'], contractTypeRequired: true,
  defaultTimeZone: 'America/New_York',
  agreementTemplate: { stateCode: 'DE', templateUid: DELAWARE_DOCUMENT_RULES.templateUid, templateName: 'NavStreet Delaware Residential Purchase and Sale Agreement', templateVersion: DELAWARE_DOCUMENT_RULES.version },
  createInitialOfferTerms: input => createDelawareInitialOfferTerms(input),
  sanitizeDraftTerms: input => sanitizeDelawareDraftTerms(input),
  validateSubmission: input => validateDelawareSubmission(input),
  validateBeforeSigning: ({ version }) => {
    const { disclosures } = version.terms;
    if (disclosures.radonNoticeAcknowledged !== true) throw new HttpsError('failed-precondition','Read and acknowledge the Delaware notices before signing.');
    if (!['received','exempt'].includes(disclosures.propertyConditionStatus)) throw new HttpsError('failed-precondition',"Review the seller statement or supported exception before submitting or signing.");
    if (disclosures.requiredKnownFacts && disclosures.statutoryPacketStatus !== 'received') throw new HttpsError('failed-precondition',"Review the required property records before submitting or signing.");
    if (disclosures.propertyConditionStatus === 'exempt' && !disclosures.disclosureExemptionClaimed) throw new HttpsError('failed-precondition',"A seller disclosure exception must match the supported listing exception.");
    if (
        
        disclosures.leadPaintStatus === 'pending') {
      throw new HttpsError('failed-precondition',
        'This Delaware offer records required disclosures as not received. The seller must provide them, then the buyer must create and submit a new offer acknowledging actual receipt before either party signs.');
    }
  },
  requiredListingDisclosures: ({ version }) => selectReceivedListingDisclosures(version.terms.disclosures, [
      ['statutoryPacketStatus', 'delaware-statutory-packet'],
      ['propertyConditionStatus', 'delaware-seller-disclosure'],
      ['leadPaintStatus', 'lead-based-paint'],
      ['hoaDocumentsStatus', 'delaware-association-documents'],    ]).concat(version.terms.disclosures.propertyConditionStatus === 'exempt' ? ['delaware-seller-disclosure'] : []).concat(version.terms.disclosures.leadPaintStatus === 'exempt' ? ['lead-based-paint'] : []),
  createContractMilestones: input => createDelawareContractMilestones(input),
    getAgreementSummary: ({ version: { terms: t } }) => [
    ...summaryFunding(t.purchase.purchasePriceInCents, t.purchase.loanAmountInCents, t.purchase.financingType === 'cash'),
    { label: 'Funding', value: summaryText(t.purchase.financingType) },
    { label: 'Earnest money deposit', value: summaryMoney(t.purchase.hasEarnestMoney === false ? 0 : t.purchase.earnestMoneyInCents) },
    { label: 'Closing / settlement date', value: summaryText(t.deadlines.settlementDate) },
    { label: 'Inspection / due diligence', value: `${t.deadlines.inspectionPeriodDays} calendar days after Effective Date; see agreement counting rules` },
  ],
  generateAgreement: async input => {
    const { generateDelawareOfferPdf } = require('./delaware-offer-pdf.service') as typeof import('./delaware-offer-pdf.service');
    return generateDelawareOfferPdf(input);
  },
};