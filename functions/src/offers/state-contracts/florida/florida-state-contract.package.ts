import { summaryFunding, summaryMoney, summaryText } from '../navstreet-pdf-layout';
import type { StateContractPackage } from '../state-contract-package';
import type { FloridaOfferTermsDocument } from './florida-offer-terms.document';
import { FLORIDA_DOCUMENT_RULES } from './florida-document-rules';
import { createFloridaInitialOfferTerms } from './florida-initial-terms';
import { sanitizeFloridaDraftTerms } from './florida-draft-terms-sanitizer';
import { validateFloridaSubmission } from './florida-submission-validator';
import { HttpsError } from 'firebase-functions/v2/https';
import { createFloridaContractMilestones } from './florida-contract-milestones';
import { generateFloridaOfferPdf } from './florida-offer-pdf.service';
export const floridaStateContractPackage: StateContractPackage<FloridaOfferTermsDocument> = {
  stateCode: 'FL', offerCreationEnabled: true,
  contractTypes: ['navstreet_florida_residential_sale_2026'], contractTypeRequired: true,
  defaultTimeZone: 'America/New_York',
  agreementTemplate: { stateCode: 'FL', templateUid: FLORIDA_DOCUMENT_RULES.templateUid, templateName: 'NavStreet Florida Residential Purchase and Sale Agreement', templateVersion: FLORIDA_DOCUMENT_RULES.version },
  createInitialOfferTerms: input => createFloridaInitialOfferTerms(input),
  sanitizeDraftTerms: input => sanitizeFloridaDraftTerms(input),
  validateSubmission: input => validateFloridaSubmission(input),
  validateBeforeSigning: ({ version }) => {
    const { disclosures, property } = version.terms;
    if (disclosures.floodStatus !== 'received' ||
        (disclosures.sellerReportsHoa === true && disclosures.hoaDocumentsStatus !== 'received') ||
        (property.yearBuilt != null && property.yearBuilt < 1978 && disclosures.leadPaintStatus === 'pending')) {
      throw new HttpsError('failed-precondition',
        'This Florida offer records required disclosures as not received. The seller must provide them, then the buyer must create and submit a new offer acknowledging actual receipt before either party signs.');
    }
  },
  requiredListingDisclosures: input => {
    const t = input.version.terms;
    return [
      ...(t.disclosures.floodStatus === 'received' ? ['florida-flood-disclosure'] : []),
      ...(t.disclosures.propertyConditionStatus === 'received' ? ['florida-seller-property-disclosure'] : []),
      ...(t.disclosures.leadPaintStatus === 'received' ? ['lead-based-paint'] : []),
      ...(t.disclosures.hoaDocumentsStatus === 'received' ? ['florida-hoa-disclosure-summary'] : []),
    ];
  },
  createContractMilestones: input => createFloridaContractMilestones(input),
    getAgreementSummary: ({ version: { terms: t } }) => [
    ...summaryFunding(t.purchase.purchasePriceInCents, t.purchase.loanAmountInCents, t.purchase.financingType === 'cash'),
    { label: 'Funding', value: summaryText(t.purchase.financingType) },
    { label: 'Earnest money deposit', value: summaryMoney(t.purchase.hasEarnestMoney === false ? 0 : t.purchase.earnestMoneyInCents) },
    { label: 'Closing / settlement date', value: summaryText(t.deadlines.settlementDate) },
    { label: 'Inspection / due diligence', value: `${t.deadlines.inspectionPeriodDays} calendar days after Effective Date; see agreement counting rules` },
  ],
  generateAgreement: input => generateFloridaOfferPdf(input),
};