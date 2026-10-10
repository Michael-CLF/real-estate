import { assertMissouriListingDisclosures } from '../../missouri-listing-disclosure-gate';
import { selectReceivedListingDisclosures } from '../received-listing-disclosures';
import { summaryFunding, summaryMoney, summaryText } from '../navstreet-pdf-layout';
import type { StateContractPackage } from '../state-contract-package';
import type { MissouriOfferTermsDocument } from './missouri-offer-terms.document';
import { MISSOURI_DOCUMENT_RULES } from './missouri-document-rules';
import { createMissouriInitialOfferTerms } from './missouri-initial-terms';
import { sanitizeMissouriDraftTerms } from './missouri-draft-terms-sanitizer';
import { validateMissouriSubmission } from './missouri-submission-validator';
import { HttpsError } from 'firebase-functions/v2/https';
import { createMissouriContractMilestones } from './missouri-contract-milestones';
export const missouriStateContractPackage: StateContractPackage<MissouriOfferTermsDocument> = {
  listingDisclosurePolicy: { assertReady: assertMissouriListingDisclosures },
  stateCode: 'MO', offerCreationEnabled: true,
  contractTypes: ['navstreet_missouri_residential_sale_2026'], contractTypeRequired: true,
  defaultTimeZone: 'America/Chicago',
  agreementTemplate: { stateCode: 'MO', templateUid: MISSOURI_DOCUMENT_RULES.templateUid, templateName: 'NavStreet Missouri Residential Purchase and Sale Agreement', templateVersion: MISSOURI_DOCUMENT_RULES.version },
  createInitialOfferTerms: input => createMissouriInitialOfferTerms(input),
  sanitizeDraftTerms: input => sanitizeMissouriDraftTerms(input),
  validateSubmission: input => validateMissouriSubmission(input),
  validateBeforeSigning: ({ version }) => {
    const { disclosures } = version.terms;
    if (disclosures.methDisclosureRequired && disclosures.statutoryPacketStatus !== 'received') throw new HttpsError('failed-precondition','Review the Missouri known-history disclosure before signing.');
    if (
        
        disclosures.leadPaintStatus === 'pending') {
      throw new HttpsError('failed-precondition',
        'This Missouri offer records required disclosures as not received. The seller must provide them, then the buyer must create and submit a new offer acknowledging actual receipt before either party signs.');
    }
  },
  requiredListingDisclosures: ({ version }) => selectReceivedListingDisclosures(version.terms.disclosures, [
      ['statutoryPacketStatus', 'missouri-statutory-packet'],
      ['propertyConditionStatus', 'missouri-seller-disclosure'],
      ['leadPaintStatus', 'lead-based-paint'],
      ['hoaDocumentsStatus', 'missouri-association-documents'],    ]).concat(version.terms.disclosures.propertyConditionStatus === 'exempt' ? ['missouri-seller-disclosure'] : []).concat(version.terms.disclosures.leadPaintStatus === 'exempt' ? ['lead-based-paint'] : []),
  createContractMilestones: input => createMissouriContractMilestones(input),
    getAgreementSummary: ({ version: { terms: t } }) => [
    ...summaryFunding(t.purchase.purchasePriceInCents, t.purchase.loanAmountInCents, t.purchase.financingType === 'cash'),
    { label: 'Funding', value: summaryText(t.purchase.financingType) },
    { label: 'Earnest money deposit', value: summaryMoney(t.purchase.hasEarnestMoney === false ? 0 : t.purchase.earnestMoneyInCents) },
    { label: 'Closing / settlement date', value: summaryText(t.deadlines.settlementDate) },
    { label: 'Inspection / due diligence', value: `${t.deadlines.inspectionPeriodDays} calendar days after Effective Date; see agreement counting rules` },
  ],
  generateAgreement: async input => {
    const { generateMissouriOfferPdf } = require('./missouri-offer-pdf.service') as typeof import('./missouri-offer-pdf.service');
    return generateMissouriOfferPdf(input);
  },
};