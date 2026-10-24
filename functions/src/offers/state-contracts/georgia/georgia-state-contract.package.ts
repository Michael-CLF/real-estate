import {georgiaSubmissionReceiptProblem} from './georgia-disclosure-policy';
import { isGeorgiaContractCompatible } from './georgia-contract-selection';
import { withHoaContractPolicy } from '../hoa-contract-policy';
import { withFederalLeadContractPolicy } from '../federal-lead-contract-policy';
import { assertListingContractScope } from '../listing-contract-scope';
import { assertGeorgiaListingDisclosures } from '../../georgia-listing-disclosure-gate';
import { selectReceivedListingDisclosures } from '../received-listing-disclosures';
import { summaryFunding, summaryMoney, summaryText } from '../navstreet-pdf-layout';
import type { StateContractPackage } from '../state-contract-package';
import type { GeorgiaOfferTermsDocument } from './georgia-offer-terms.document';
import { GEORGIA_DOCUMENT_RULES } from './georgia-document-rules';
import { createGeorgiaInitialOfferTerms } from './georgia-initial-terms';
import { sanitizeGeorgiaDraftTerms } from './georgia-draft-terms-sanitizer';
import { validateGeorgiaSubmission } from './georgia-submission-validator';
import { HttpsError } from 'firebase-functions/v2/https';
import { createGeorgiaContractMilestones } from './georgia-contract-milestones';
export const georgiaStateContractPackage: StateContractPackage<GeorgiaOfferTermsDocument> = withHoaContractPolicy(withFederalLeadContractPolicy({
  assertListingContractCompatible: (listing,version) => { assertListingContractScope(georgiaStateContractPackage,listing); if (!isGeorgiaContractCompatible(version.terms.contractType,String(listing['propertyType']),(listing['sellerStatements'] as Record<string,any> | undefined)?.['contractFacts'])) throw new HttpsError('failed-precondition','The ownership facts require a different agreement. Start a new unsigned offer using the current listing.'); },
  listingDisclosurePolicy: { assertReady: assertGeorgiaListingDisclosures, assertCounterofferReady: assertGeorgiaListingDisclosures, reviewedVersions: ({version}) => version.terms.documentVersions },
  stateCode: 'GA', offerCreationEnabled: true,
  requireOwnershipFacts:true,
  supportedPropertyTypes: ['single_family', 'townhome', 'pud', 'condo'],
  contractTypes: ['navstreet_georgia_residential_sale_2026','navstreet_georgia_condominium_resale_2026'], contractTypeRequired: true,
  defaultTimeZone: 'America/New_York',
  agreementTemplate: { stateCode: 'GA', templateUid: GEORGIA_DOCUMENT_RULES.templateUid, templateName: 'NavStreet Georgia Residential Purchase and Sale Agreement', templateVersion: GEORGIA_DOCUMENT_RULES.version },
  agreementTemplates: [{stateCode:'GA',templateUid:GEORGIA_DOCUMENT_RULES.templateUid,templateName:'NavStreet Georgia Residential Purchase and Sale Agreement',templateVersion:GEORGIA_DOCUMENT_RULES.version},{stateCode:'GA',templateUid:'navstreet-ga-condominium-2026',templateName:'NavStreet Georgia Condominium Resale Purchase and Sale Agreement',templateVersion:'2026-10-24'}],
  getAgreementTemplate: terms => terms.contractType === 'navstreet_georgia_condominium_resale_2026' ? {stateCode:'GA',templateUid:'navstreet-ga-condominium-2026',templateName:'NavStreet Georgia Condominium Resale Purchase and Sale Agreement',templateVersion:'2026-10-24'} : terms.documentVersions !== undefined ? {...georgiaStateContractPackage.agreementTemplate,templateVersion:'2026-10-24'} : georgiaStateContractPackage.agreementTemplate,
  createInitialOfferTerms: input => createGeorgiaInitialOfferTerms(input),
  sanitizeDraftTerms: input => sanitizeGeorgiaDraftTerms(input),
  validateSubmission: input => validateGeorgiaSubmission(input),
  validateBeforeSigning: (input) => {const issue=georgiaSubmissionReceiptProblem(input.version.terms);if(issue)throw new HttpsError('failed-precondition',issue);},
  requiredListingDisclosures: ({ version }) => selectReceivedListingDisclosures(version.terms.disclosures, [
      ['statutoryPacketStatus', 'georgia-statutory-packet'],
      ['propertyConditionStatus', 'georgia-seller-disclosure'],
      ['leadPaintStatus', 'lead-based-paint'],
      ['hoaDocumentsStatus', 'georgia-association-documents'],    ]).concat(version.terms.disclosures.propertyConditionStatus === 'exempt' ? ['georgia-seller-disclosure'] : []).concat(version.terms.disclosures.leadPaintStatus === 'exempt' ? ['lead-based-paint'] : []),
  createContractMilestones: input => createGeorgiaContractMilestones(input),
    getAgreementSummary: ({ version: { terms: t } }) => [
    ...summaryFunding(t.purchase.purchasePriceInCents, t.purchase.loanAmountInCents, t.purchase.financingType === 'cash'),
    { label: 'Funding', value: summaryText(t.purchase.financingType) },
    { label: 'Earnest money deposit', value: summaryMoney(t.purchase.hasEarnestMoney === false ? 0 : t.purchase.earnestMoneyInCents) },
    { label: 'Closing / settlement date', value: summaryText(t.deadlines.settlementDate) },
    { label: 'Inspection / due diligence', value: `${t.deadlines.inspectionPeriodDays} calendar days after Effective Date; see agreement counting rules` },
  ],
  generateAgreement: async input => {
    const { generateGeorgiaOfferPdf } = require('./georgia-offer-pdf.service') as typeof import('./georgia-offer-pdf.service');
    return generateGeorgiaOfferPdf(input);
  },
}, {values:{'disclosures.leadPaintStatus':'built_1978_or_later','disclosures.leadInspectionSelection':'unselected','disclosures.leadInspectionDays':10,'documentVersions.lead-based-paint':undefined},hiddenFields:['disclosures.leadPaintStatus','disclosures.leadInspectionSelection','disclosures.leadInspectionDays']}), {"sellerFactPath":"disclosures.sellerReportsHoa","documentStatusPath":"disclosures.hoaDocumentsStatus","documentTypes":["georgia-association-documents"]});
