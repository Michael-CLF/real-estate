import { minnesotaAssociationPacketProblem } from './minnesota-association-packet';
import { assertMinnesotaListingDisclosures } from '../../minnesota-listing-disclosure-gate';
import { selectReceivedListingDisclosures } from '../received-listing-disclosures';
import { summaryFunding, summaryMoney, summaryText } from '../navstreet-pdf-layout';
import type { StateContractPackage } from '../state-contract-package';
import type { MinnesotaOfferTermsDocument } from './minnesota-offer-terms.document';
import { MINNESOTA_DOCUMENT_RULES } from './minnesota-document-rules';
import { createMinnesotaInitialOfferTerms } from './minnesota-initial-terms';
import { sanitizeMinnesotaDraftTerms } from './minnesota-draft-terms-sanitizer';
import { validateMinnesotaSubmission } from './minnesota-submission-validator';
import { HttpsError } from 'firebase-functions/v2/https';
import { createMinnesotaContractMilestones } from './minnesota-contract-milestones';
export const minnesotaStateContractPackage: StateContractPackage<MinnesotaOfferTermsDocument> = {
  listingDisclosurePolicy: { assertReady: assertMinnesotaListingDisclosures },
  stateCode: 'MN', offerCreationEnabled: true,
  contractTypes: ['navstreet_minnesota_residential_sale_2026'], contractTypeRequired: true,
  defaultTimeZone: 'America/Chicago',
  agreementTemplate: { stateCode: 'MN', templateUid: MINNESOTA_DOCUMENT_RULES.templateUid, templateName: 'NavStreet Minnesota Residential Purchase and Sale Agreement', templateVersion: MINNESOTA_DOCUMENT_RULES.version },
  createInitialOfferTerms: input => createMinnesotaInitialOfferTerms(input),
  sanitizeDraftTerms: input => sanitizeMinnesotaDraftTerms(input),
  validateSubmission: input => validateMinnesotaSubmission(input),
  validateBeforeSigning: ({ version }) => {
    if (version.terms.disclosures.sellerReportsHoa) {
      const problem = minnesotaAssociationPacketProblem(version.terms.disclosures.associationCertificateDate, version.terms.disclosures.associationPacketReceivedDate);
      if (problem) throw new HttpsError('failed-precondition', problem);
    }
    const { disclosures } = version.terms;
    if (disclosures.propertyConditionStatus !== 'received' || disclosures.statutoryPacketStatus !== 'received' ||
        (disclosures.sellerReportsHoa === true && disclosures.hoaDocumentsStatus !== 'received') ||
        disclosures.leadPaintStatus === 'pending') {
      throw new HttpsError('failed-precondition',
        'This Minnesota offer records required disclosures as not received. The seller must provide them, then the buyer must create and submit a new offer acknowledging actual receipt before either party signs.');
    }
  },
  requiredListingDisclosures: ({ version }) => selectReceivedListingDisclosures(version.terms.disclosures, [
      ['statutoryPacketStatus', 'minnesota-statutory-packet'],
      ['propertyConditionStatus', 'minnesota-seller-disclosure'],
      ['leadPaintStatus', 'lead-based-paint'],
      ['hoaDocumentsStatus', 'minnesota-association-documents'],    ]).concat(version.terms.disclosures.leadPaintStatus === 'exempt' ? ['lead-based-paint'] : []),
  createContractMilestones: input => createMinnesotaContractMilestones(input),
    getAgreementSummary: ({ version: { terms: t } }) => [
    ...summaryFunding(t.purchase.purchasePriceInCents, t.purchase.loanAmountInCents, t.purchase.financingType === 'cash'),
    { label: 'Funding', value: summaryText(t.purchase.financingType) },
    { label: 'Earnest money deposit', value: summaryMoney(t.purchase.hasEarnestMoney === false ? 0 : t.purchase.earnestMoneyInCents) },
    { label: 'Closing / settlement date', value: summaryText(t.deadlines.settlementDate) },
    { label: 'Inspection / due diligence', value: `${t.deadlines.inspectionPeriodDays} calendar days after Effective Date; see agreement counting rules` },
  ],
  generateAgreement: async input => {
    const { generateMinnesotaOfferPdf } = require('./minnesota-offer-pdf.service') as typeof import('./minnesota-offer-pdf.service');
    return generateMinnesotaOfferPdf(input);
  },
};