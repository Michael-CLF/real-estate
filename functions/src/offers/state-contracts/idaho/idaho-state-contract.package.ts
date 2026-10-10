import { assertIdahoListingDisclosures } from '../../idaho-listing-disclosure-gate';
import { selectReceivedListingDisclosures } from '../received-listing-disclosures';
import { summaryFunding, summaryMoney, summaryText } from '../navstreet-pdf-layout';
import type { StateContractPackage } from '../state-contract-package';
import type { IdahoOfferTermsDocument } from './idaho-offer-terms.document';
import { IDAHO_DOCUMENT_RULES } from './idaho-document-rules';
import { createIdahoInitialOfferTerms } from './idaho-initial-terms';
import { sanitizeIdahoDraftTerms } from './idaho-draft-terms-sanitizer';
import { validateIdahoSubmission } from './idaho-submission-validator';
import { HttpsError } from 'firebase-functions/v2/https';
import { createIdahoContractMilestones } from './idaho-contract-milestones';
export const idahoStateContractPackage: StateContractPackage<IdahoOfferTermsDocument> = {
  listingDisclosurePolicy: { assertReady: assertIdahoListingDisclosures },
  stateCode: 'ID', offerCreationEnabled: true,
  contractTypes: ['navstreet_idaho_residential_sale_2026'], contractTypeRequired: true,
  defaultTimeZone: 'America/Boise',
  agreementTemplate: { stateCode: 'ID', templateUid: IDAHO_DOCUMENT_RULES.templateUid, templateName: 'NavStreet Idaho Residential Purchase and Sale Agreement', templateVersion: IDAHO_DOCUMENT_RULES.version },
  createInitialOfferTerms: input => createIdahoInitialOfferTerms(input),
  sanitizeDraftTerms: input => sanitizeIdahoDraftTerms(input),
  validateSubmission: input => validateIdahoSubmission(input),
  validateBeforeSigning: ({ version }) => {
    const { disclosures } = version.terms;
    if (disclosures.statutoryPacketStatus !== 'received' ||
        
        disclosures.leadPaintStatus === 'pending') {
      throw new HttpsError('failed-precondition',
        'This Idaho offer records required disclosures as not received. The seller must provide them, then the buyer must create and submit a new offer acknowledging actual receipt before either party signs.');
    }
  },
  requiredListingDisclosures: ({ version }) => selectReceivedListingDisclosures(version.terms.disclosures, [
      ['statutoryPacketStatus', 'idaho-statutory-packet'],
      ['propertyConditionStatus', 'idaho-seller-disclosure'],
      ['leadPaintStatus', 'lead-based-paint'],
      ['hoaDocumentsStatus', 'idaho-association-documents'],    ]).concat(version.terms.disclosures.propertyConditionStatus === 'exempt' ? ['idaho-seller-disclosure'] : []).concat(version.terms.disclosures.leadPaintStatus === 'exempt' ? ['lead-based-paint'] : []),
  createContractMilestones: input => createIdahoContractMilestones(input),
    getAgreementSummary: ({ version: { terms: t } }) => [
    ...summaryFunding(t.purchase.purchasePriceInCents, t.purchase.loanAmountInCents, t.purchase.financingType === 'cash'),
    { label: 'Funding', value: summaryText(t.purchase.financingType) },
    { label: 'Earnest money deposit', value: summaryMoney(t.purchase.hasEarnestMoney === false ? 0 : t.purchase.earnestMoneyInCents) },
    { label: 'Closing / settlement date', value: summaryText(t.deadlines.settlementDate) },
    { label: 'Inspection / due diligence', value: `${t.deadlines.inspectionPeriodDays} calendar days after Effective Date; see agreement counting rules` },
  ],
  generateAgreement: async input => {
    const { generateIdahoOfferPdf } = require('./idaho-offer-pdf.service') as typeof import('./idaho-offer-pdf.service');
    return generateIdahoOfferPdf(input);
  },
};