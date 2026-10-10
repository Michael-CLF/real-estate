import { assertMichiganListingDisclosures } from '../../michigan-listing-disclosure-gate';
import { selectReceivedListingDisclosures } from '../received-listing-disclosures';
import { summaryFunding, summaryMoney, summaryText } from '../navstreet-pdf-layout';
import type { StateContractPackage } from '../state-contract-package';
import type { MichiganOfferTermsDocument } from './michigan-offer-terms.document';
import { MICHIGAN_DOCUMENT_RULES } from './michigan-document-rules';
import { createMichiganInitialOfferTerms } from './michigan-initial-terms';
import { sanitizeMichiganDraftTerms } from './michigan-draft-terms-sanitizer';
import { validateMichiganSubmission } from './michigan-submission-validator';
import { HttpsError } from 'firebase-functions/v2/https';
import { createMichiganContractMilestones } from './michigan-contract-milestones';
export const michiganStateContractPackage: StateContractPackage<MichiganOfferTermsDocument> = {
  listingDisclosurePolicy: { assertReady: assertMichiganListingDisclosures },
  stateCode: 'MI', offerCreationEnabled: true,
  contractTypes: ['navstreet_michigan_residential_sale_2026'], contractTypeRequired: true,
  defaultTimeZone: 'America/Detroit',
  agreementTemplate: { stateCode: 'MI', templateUid: MICHIGAN_DOCUMENT_RULES.templateUid, templateName: 'NavStreet Michigan Residential Purchase and Sale Agreement', templateVersion: MICHIGAN_DOCUMENT_RULES.version },
  createInitialOfferTerms: input => createMichiganInitialOfferTerms(input),
  sanitizeDraftTerms: input => sanitizeMichiganDraftTerms(input),
  validateSubmission: input => validateMichiganSubmission(input),
  validateBeforeSigning: ({ version }) => {
    const { disclosures } = version.terms;
    if (disclosures.propertyConditionStatus !== 'received' || disclosures.statutoryPacketStatus !== 'received' ||
        (disclosures.sellerReportsHoa === true && disclosures.hoaDocumentsStatus !== 'received') ||
        disclosures.leadPaintStatus === 'pending') {
      throw new HttpsError('failed-precondition',
        'This Michigan offer records required disclosures as not received. The seller must provide them, then the buyer must create and submit a new offer acknowledging actual receipt before either party signs.');
    }
  },
  requiredListingDisclosures: ({ version }) => selectReceivedListingDisclosures(version.terms.disclosures, [
      ['statutoryPacketStatus', 'michigan-statutory-packet'],
      ['propertyConditionStatus', 'michigan-seller-disclosure'],
      ['leadPaintStatus', 'lead-based-paint'],
      ['hoaDocumentsStatus', 'michigan-association-documents'],    ]).concat(version.terms.disclosures.leadPaintStatus === 'exempt' ? ['lead-based-paint'] : []),
  createContractMilestones: input => createMichiganContractMilestones(input),
    getAgreementSummary: ({ version: { terms: t } }) => [
    ...summaryFunding(t.purchase.purchasePriceInCents, t.purchase.loanAmountInCents, t.purchase.financingType === 'cash'),
    { label: 'Funding', value: summaryText(t.purchase.financingType) },
    { label: 'Earnest money deposit', value: summaryMoney(t.purchase.hasEarnestMoney === false ? 0 : t.purchase.earnestMoneyInCents) },
    { label: 'Closing / settlement date', value: summaryText(t.deadlines.settlementDate) },
    { label: 'Inspection / due diligence', value: `${t.deadlines.inspectionPeriodDays} calendar days after Effective Date; see agreement counting rules` },
  ],
  generateAgreement: async input => {
    const { generateMichiganOfferPdf } = require('./michigan-offer-pdf.service') as typeof import('./michigan-offer-pdf.service');
    return generateMichiganOfferPdf(input);
  },
};