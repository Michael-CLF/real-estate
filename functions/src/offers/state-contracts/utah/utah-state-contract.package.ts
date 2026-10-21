import { withHoaContractPolicy } from '../hoa-contract-policy';
import { withFederalLeadContractPolicy } from '../federal-lead-contract-policy';
import { assertListingContractScope } from '../listing-contract-scope';
import { selectReceivedListingDisclosures } from '../received-listing-disclosures';
import { summaryFunding, summaryMoney, summaryText } from '../navstreet-pdf-layout';
import type { StateContractPackage } from '../state-contract-package';
import type { UtahOfferTermsDocument } from './utah-offer-terms.document';
import { UTAH_DOCUMENT_RULES } from './utah-document-rules';
import { createUtahInitialOfferTerms } from './utah-initial-terms';
import { sanitizeUtahDraftTerms } from './utah-draft-terms-sanitizer';
import { validateUtahSubmission } from './utah-submission-validator';
import { createUtahContractMilestones } from './utah-contract-milestones';
export const utahStateContractPackage: StateContractPackage<UtahOfferTermsDocument> = withHoaContractPolicy(withFederalLeadContractPolicy({
  assertListingContractCompatible: listing => assertListingContractScope(utahStateContractPackage, listing),
  stateCode: 'UT', offerCreationEnabled: true,
  requireOwnershipFacts:true,
  supportedPropertyTypes: ['single_family', 'townhome', 'pud', 'condo'],
  contractTypes: ['navstreet_utah_residential_sale_2026'], contractTypeRequired: true,
  defaultTimeZone: 'America/Denver',
  agreementTemplate: { stateCode: 'UT', templateUid: UTAH_DOCUMENT_RULES.templateUid, templateName: 'NavStreet Utah Residential Purchase and Sale Agreement', templateVersion: UTAH_DOCUMENT_RULES.version },
  createInitialOfferTerms: input => createUtahInitialOfferTerms(input),
  sanitizeDraftTerms: input => sanitizeUtahDraftTerms(input),
  validateSubmission: input => validateUtahSubmission(input),
  requiredListingDisclosures: ({ version }) => selectReceivedListingDisclosures(version.terms.disclosures, [
      ['leadPaintStatus', 'lead-based-paint'],
      ['propertyConditionStatus', 'utah-seller-property-condition'],
      ['hoaDocumentsStatus', 'utah-hoa-governing-documents'],    ]),
  createContractMilestones: input => createUtahContractMilestones(input),
    getAgreementSummary: ({ version: { terms: t } }) => [
    ...summaryFunding(t.purchase.purchasePriceInCents, t.purchase.loanAmountInCents, t.purchase.financingType === 'cash'),
    { label: 'Funding', value: summaryText(t.purchase.financingType) },
    { label: 'Earnest money deposit', value: summaryMoney(t.purchase.earnestMoneyInCents) },
    { label: 'Closing / settlement date', value: summaryText(t.deadlines.settlementDate) },
    { label: 'Inspection / due diligence', value: summaryText(t.deadlines.dueDiligenceDate) },
  ],
  generateAgreement: async input => {
    const { generateUtahOfferPdf } = require('./utah-offer-pdf.service') as typeof import('./utah-offer-pdf.service');
    return generateUtahOfferPdf(input);
  },
}, {values:{'disclosures.leadPaintStatus':'built_1978_or_later','disclosures.leadInspectionSelection':'unselected','disclosures.leadInspectionDays':10,'documentVersions.lead-based-paint':undefined},hiddenFields:['disclosures.leadPaintStatus','disclosures.leadInspectionSelection','disclosures.leadInspectionDays']}), {"sellerFactPath":"disclosures.sellerReportsHoa","documentStatusPath":"disclosures.hoaDocumentsStatus","documentTypes":["utah-hoa-governing-documents"],"snapshotSellerFact":true});