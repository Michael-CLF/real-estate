import {mississippiSubmissionReceiptProblem} from './mississippi-disclosure-policy';
import { isMississippiContractCompatible } from './mississippi-contract-selection';
import { withHoaContractPolicy } from '../hoa-contract-policy';
import { withFederalLeadContractPolicy } from '../federal-lead-contract-policy';
import { assertListingContractScope } from '../listing-contract-scope';
import { assertMississippiListingDisclosures } from '../../mississippi-listing-disclosure-gate';
import { selectReceivedListingDisclosures } from '../received-listing-disclosures';
import { summaryFunding, summaryMoney, summaryText } from '../navstreet-pdf-layout';
import type { StateContractPackage } from '../state-contract-package';
import type { MississippiOfferTermsDocument } from './mississippi-offer-terms.document';
import { MISSISSIPPI_DOCUMENT_RULES } from './mississippi-document-rules';
import { createMississippiInitialOfferTerms } from './mississippi-initial-terms';
import { sanitizeMississippiDraftTerms } from './mississippi-draft-terms-sanitizer';
import { validateMississippiSubmission } from './mississippi-submission-validator';
import { HttpsError } from 'firebase-functions/v2/https';
import { createMississippiContractMilestones } from './mississippi-contract-milestones';
export const mississippiStateContractPackage: StateContractPackage<MississippiOfferTermsDocument> = withHoaContractPolicy(withFederalLeadContractPolicy({
  assertListingContractCompatible: (listing,version) => { assertListingContractScope(mississippiStateContractPackage,listing); if (!isMississippiContractCompatible(version.terms.contractType,String(listing['propertyType']),(listing['sellerStatements'] as Record<string,any> | undefined)?.['contractFacts'])) throw new HttpsError('failed-precondition','The ownership facts require a different agreement. Start a new unsigned offer using the current listing.'); },
  listingDisclosurePolicy: { assertReady: assertMississippiListingDisclosures, assertCounterofferReady: assertMississippiListingDisclosures, reviewedVersions: ({version}) => version.terms.documentVersions },
  stateCode: 'MS', offerCreationEnabled: true,
  requireOwnershipFacts:true,
  supportedPropertyTypes: ['single_family', 'townhome', 'pud', 'condo'],
  contractTypes: ['navstreet_mississippi_residential_sale_2026','navstreet_mississippi_condominium_resale_2026'], contractTypeRequired: true,
  defaultTimeZone: 'America/Chicago',
  agreementTemplate: { stateCode: 'MS', templateUid: MISSISSIPPI_DOCUMENT_RULES.templateUid, templateName: 'NavStreet Mississippi Residential Purchase and Sale Agreement', templateVersion: MISSISSIPPI_DOCUMENT_RULES.version },
  agreementTemplates: [{stateCode:'MS',templateUid:MISSISSIPPI_DOCUMENT_RULES.templateUid,templateName:'NavStreet Mississippi Residential Purchase and Sale Agreement',templateVersion:MISSISSIPPI_DOCUMENT_RULES.version},{stateCode:'MS',templateUid:'navstreet-ms-condominium-2026',templateName:'NavStreet Mississippi Condominium Resale Purchase and Sale Agreement',templateVersion:'2026-10-23'}],
  getAgreementTemplate: terms => terms.contractType === 'navstreet_mississippi_condominium_resale_2026' ? {stateCode:'MS',templateUid:'navstreet-ms-condominium-2026',templateName:'NavStreet Mississippi Condominium Resale Purchase and Sale Agreement',templateVersion:'2026-10-23'} : terms.documentVersions !== undefined ? {...mississippiStateContractPackage.agreementTemplate,templateVersion:'2026-10-23'} : mississippiStateContractPackage.agreementTemplate,
  createInitialOfferTerms: input => createMississippiInitialOfferTerms(input),
  sanitizeDraftTerms: input => sanitizeMississippiDraftTerms(input),
  validateSubmission: input => validateMississippiSubmission(input),
  validateBeforeSigning: (input) => {const issue=mississippiSubmissionReceiptProblem(input.version.terms);if(issue)throw new HttpsError('failed-precondition',issue);},
  requiredListingDisclosures: ({ version }) => selectReceivedListingDisclosures(version.terms.disclosures, [
      ['statutoryPacketStatus', 'mississippi-statutory-packet'],
      ['propertyConditionStatus', 'mississippi-seller-disclosure'],
      ['leadPaintStatus', 'lead-based-paint'],
      ['hoaDocumentsStatus', 'mississippi-association-documents'],    ]).concat(version.terms.disclosures.propertyConditionStatus === 'exempt' ? ['mississippi-seller-disclosure'] : []).concat(version.terms.disclosures.leadPaintStatus === 'exempt' ? ['lead-based-paint'] : []),
  createContractMilestones: input => createMississippiContractMilestones(input),
    getAgreementSummary: ({ version: { terms: t } }) => [
    ...summaryFunding(t.purchase.purchasePriceInCents, t.purchase.loanAmountInCents, t.purchase.financingType === 'cash'),
    { label: 'Funding', value: summaryText(t.purchase.financingType) },
    { label: 'Earnest money deposit', value: summaryMoney(t.purchase.hasEarnestMoney === false ? 0 : t.purchase.earnestMoneyInCents) },
    { label: 'Closing / settlement date', value: summaryText(t.deadlines.settlementDate) },
    { label: 'Inspection / due diligence', value: `${t.deadlines.inspectionPeriodDays} calendar days after Effective Date; see agreement counting rules` },
  ],
  generateAgreement: async input => {
    const { generateMississippiOfferPdf } = require('./mississippi-offer-pdf.service') as typeof import('./mississippi-offer-pdf.service');
    return generateMississippiOfferPdf(input);
  },
}, {values:{'disclosures.leadPaintStatus':'built_1978_or_later','disclosures.leadInspectionSelection':'unselected','disclosures.leadInspectionDays':10,'documentVersions.lead-based-paint':undefined},hiddenFields:['disclosures.leadPaintStatus','disclosures.leadInspectionSelection','disclosures.leadInspectionDays']}), {"sellerFactPath":"disclosures.sellerReportsHoa","documentStatusPath":"disclosures.hoaDocumentsStatus","documentTypes":["mississippi-association-documents"]});
