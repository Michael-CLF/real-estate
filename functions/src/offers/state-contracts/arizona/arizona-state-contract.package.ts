import { assertArizonaListingDisclosures } from '../../arizona-listing-disclosure-gate';
import { selectReceivedListingDisclosures } from '../received-listing-disclosures';
import { summaryFunding, summaryMoney, summaryText } from '../navstreet-pdf-layout';
import type { StateContractPackage } from '../state-contract-package';
import type { ArizonaOfferTermsDocument } from './arizona-offer-terms.document';
import { ARIZONA_DOCUMENT_RULES } from './arizona-document-rules';
import { createArizonaInitialOfferTerms } from './arizona-initial-terms';
import { sanitizeArizonaDraftTerms } from './arizona-draft-terms-sanitizer';
import { validateArizonaSubmission } from './arizona-submission-validator';
import { HttpsError } from 'firebase-functions/v2/https';
import { createArizonaContractMilestones } from './arizona-contract-milestones';
export const arizonaStateContractPackage: StateContractPackage<ArizonaOfferTermsDocument> = {
  listingDisclosurePolicy: { assertReady: assertArizonaListingDisclosures },
  stateCode: 'AZ', offerCreationEnabled: true,
  contractTypes: ['navstreet_arizona_residential_sale_2026'], contractTypeRequired: true,
  defaultTimeZone: 'America/Phoenix',
  agreementTemplate: { stateCode: 'AZ', templateUid: ARIZONA_DOCUMENT_RULES.templateUid, templateName: 'NavStreet Arizona Residential Purchase and Sale Agreement', templateVersion: ARIZONA_DOCUMENT_RULES.version },
  createInitialOfferTerms: input => createArizonaInitialOfferTerms(input),
  sanitizeDraftTerms: input => sanitizeArizonaDraftTerms(input),
  validateSubmission: input => validateArizonaSubmission(input),
  validateBeforeSigning: ({ version }) => {
    const { disclosures } = version.terms;
    if (disclosures.propertyConditionStatus !== 'received' || disclosures.statutoryPacketStatus !== 'received' ||
        (disclosures.sellerReportsHoa === true && disclosures.hoaDocumentsStatus !== 'received') ||
        disclosures.leadPaintStatus === 'pending') {
      throw new HttpsError('failed-precondition',
        'This Arizona offer records required disclosures as not received. The seller must provide them, then the buyer must create and submit a new offer acknowledging actual receipt before either party signs.');
    }
  },
  requiredListingDisclosures: ({ version }) => selectReceivedListingDisclosures(version.terms.disclosures, [
      ['statutoryPacketStatus', 'arizona-statutory-packet'],
      ['propertyConditionStatus', 'arizona-seller-disclosure'],
      ['leadPaintStatus', 'lead-based-paint'],
      ['hoaDocumentsStatus', 'arizona-association-documents'],    ]).concat(version.terms.disclosures.leadPaintStatus === 'exempt' ? ['lead-based-paint'] : []),
  createContractMilestones: input => createArizonaContractMilestones(input),
    getAgreementSummary: ({ version: { terms: t } }) => [
    ...summaryFunding(t.purchase.purchasePriceInCents, t.purchase.loanAmountInCents, t.purchase.financingType === 'cash'),
    { label: 'Funding', value: summaryText(t.purchase.financingType) },
    { label: 'Earnest money deposit', value: summaryMoney(t.purchase.hasEarnestMoney === false ? 0 : t.purchase.earnestMoneyInCents) },
    { label: 'Closing / settlement date', value: summaryText(t.deadlines.settlementDate) },
    { label: 'Inspection / due diligence', value: `${t.deadlines.inspectionPeriodDays} calendar days after Effective Date; see agreement counting rules` },
  ],
  generateAgreement: async input => {
    const { generateArizonaOfferPdf } = require('./arizona-offer-pdf.service') as typeof import('./arizona-offer-pdf.service');
    return generateArizonaOfferPdf(input);
  },
};