import { selectReceivedListingDisclosures } from '../received-listing-disclosures';
import { summaryFunding, summaryMoney, summaryText } from '../navstreet-pdf-layout';
import type { StateContractPackage } from '../state-contract-package';
import type { WisconsinOfferTermsDocument } from './wisconsin-offer-terms.document';
import { WISCONSIN_DOCUMENT_RULES } from './wisconsin-document-rules';
import { createWisconsinInitialOfferTerms } from './wisconsin-initial-terms';
import { sanitizeWisconsinDraftTerms } from './wisconsin-draft-terms-sanitizer';
import { validateWisconsinSubmission } from './wisconsin-submission-validator';
import { createWisconsinContractMilestones } from './wisconsin-contract-milestones';
export const wisconsinStateContractPackage: StateContractPackage<WisconsinOfferTermsDocument> = {
  stateCode: 'WI', offerCreationEnabled: true,
  contractTypes: ['navstreet_wisconsin_residential_sale_2026'], contractTypeRequired: true,
  defaultTimeZone: 'America/Chicago',
  agreementTemplate: { stateCode: 'WI', templateUid: WISCONSIN_DOCUMENT_RULES.templateUid, templateName: 'NavStreet Wisconsin Residential Purchase and Sale Agreement', templateVersion: WISCONSIN_DOCUMENT_RULES.version },
  createInitialOfferTerms: input => createWisconsinInitialOfferTerms(input),
  sanitizeDraftTerms: input => sanitizeWisconsinDraftTerms(input),
  validateSubmission: input => validateWisconsinSubmission(input),
  requiredListingDisclosures: ({ version }) => selectReceivedListingDisclosures(version.terms.disclosures, [
      ['leadPaintStatus', 'lead-based-paint'],
      ['propertyConditionStatus', 'wisconsin-real-estate-condition-report'],
      ['hoaDocumentsStatus', 'wisconsin-association-documents'],    ]),
  createContractMilestones: input => createWisconsinContractMilestones(input),
    getAgreementSummary: ({ version: { terms: t } }) => [
    ...summaryFunding(t.purchase.purchasePriceInCents, t.purchase.loanAmountInCents, t.purchase.financingType === 'cash'),
    { label: 'Funding', value: summaryText(t.purchase.financingType) },
    { label: 'Earnest money deposit', value: summaryMoney(t.purchase.earnestMoneyInCents) },
    { label: 'Closing / settlement date', value: summaryText(t.deadlines.settlementDate) },
    { label: 'Inspection / due diligence', value: summaryText(t.deadlines.dueDiligenceDate) },
  ],
  generateAgreement: async input => {
    const { generateWisconsinOfferPdf } = require('./wisconsin-offer-pdf.service') as typeof import('./wisconsin-offer-pdf.service');
    return generateWisconsinOfferPdf(input);
  },
};