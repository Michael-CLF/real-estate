import { selectReceivedListingDisclosures } from '../received-listing-disclosures';
import { summaryFunding, summaryMoney, summaryText } from '../navstreet-pdf-layout';
import { HttpsError } from 'firebase-functions/v2/https';
import type { StateContractPackage } from '../state-contract-package';
import type { LouisianaOfferTermsDocument } from './louisiana-offer-terms.document';
import { LOUISIANA_DOCUMENT_RULES } from './louisiana-document-rules';
import { createLouisianaInitialOfferTerms } from './louisiana-initial-terms';
import { sanitizeLouisianaDraftTerms } from './louisiana-draft-terms-sanitizer';
import { validateLouisianaSubmission } from './louisiana-submission-validator';
import { createLouisianaContractMilestones } from './louisiana-contract-milestones';

export const louisianaStateContractPackage: StateContractPackage<LouisianaOfferTermsDocument> = {
  stateCode: 'LA', offerCreationEnabled: true,
  contractTypes: ['lrec_louisiana_residential_agreement_2026'], contractTypeRequired: true,
  defaultTimeZone: 'America/Chicago',
  agreementTemplate: {
    stateCode: 'LA', templateUid: LOUISIANA_DOCUMENT_RULES.templateUid,
    templateName: 'Louisiana Residential Agreement to Buy or Sell (LREC Rev. 01/2026)',
    templateVersion: LOUISIANA_DOCUMENT_RULES.version,
  },
  createInitialOfferTerms: createLouisianaInitialOfferTerms,
  sanitizeDraftTerms: sanitizeLouisianaDraftTerms,
  validateSubmission: validateLouisianaSubmission,
  validateBeforeSigning: ({ version }) => {
    if (
      version.terms.disclosures.propertyDisclosureStatus !== 'received' ||
      version.terms.disclosures.leadPaintStatus === 'pending'
    ) {
      throw new HttpsError(
        'failed-precondition',
        'The seller must upload the required disclosures and the buyer must acknowledge receipt before this Louisiana offer can be signed.'
      );
    }
  },
  requiredListingDisclosures: ({ version }) => [
    'louisiana-property-disclosure',
    ...selectReceivedListingDisclosures(version.terms.disclosures, [
      ['leadPaintStatus', 'lead-based-paint'],    ]),
  ],
  createContractMilestones: createLouisianaContractMilestones,
    getAgreementSummary: ({ version: { terms: t } }) => [
    ...summaryFunding(t.purchase.purchasePriceInCents, t.purchase.loanAmountInCents, t.purchase.financingType === 'cash'),
    { label: 'Funding', value: summaryText(t.purchase.financingType) },
    { label: 'Earnest money deposit', value: summaryMoney(t.purchase.hasEarnestMoney === false ? 0 : t.purchase.earnestMoneyInCents) },
    { label: 'Closing / settlement date', value: summaryText(t.deadlines.settlementDate) },
    { label: 'Inspection / due diligence', value: `${t.deadlines.inspectionPeriodDays} calendar days after the period begins on the day after acceptance; may end earlier upon a signed remedy request or extend for unavailable access/utilities — see contract` },
  ],
  generateAgreement: async input => {
    const { generateLouisianaOfferPdf } = require('./louisiana-offer-pdf.service') as typeof import('./louisiana-offer-pdf.service');
    return generateLouisianaOfferPdf(input);
  },
};