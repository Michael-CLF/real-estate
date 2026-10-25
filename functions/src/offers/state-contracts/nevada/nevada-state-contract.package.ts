import { HOA_POLICY, FEDERAL_LEAD_POLICY } from './nevada-policy-mappings.generated';
import {nevadaSubmissionReceiptProblem} from './nevada-disclosure-policy';
import { isNevadaContractCompatible } from './nevada-contract-selection';
import { withHoaContractPolicy } from '../hoa-contract-policy';
import { withFederalLeadContractPolicy } from '../federal-lead-contract-policy';
import { assertListingContractScope } from '../listing-contract-scope';
import { assertNevadaListingDisclosures } from '../../nevada-listing-disclosure-gate';
import { selectReceivedListingDisclosures } from '../received-listing-disclosures';
import { summaryFunding, summaryMoney, summaryText } from '../navstreet-pdf-layout';
import type { StateContractPackage } from '../state-contract-package';
import type { NevadaOfferTermsDocument } from './nevada-offer-terms.document';
import { NEVADA_DOCUMENT_RULES } from './nevada-document-rules';
import { createNevadaInitialOfferTerms } from './nevada-initial-terms';
import { sanitizeNevadaDraftTerms } from './nevada-draft-terms-sanitizer';
import { validateNevadaSubmission } from './nevada-submission-validator';
import { HttpsError } from 'firebase-functions/v2/https';
import { createNevadaContractMilestones } from './nevada-contract-milestones';
export const nevadaStateContractPackage: StateContractPackage<NevadaOfferTermsDocument> = withHoaContractPolicy(withFederalLeadContractPolicy({
  assertListingContractCompatible: (listing,version) => { assertListingContractScope(nevadaStateContractPackage,listing); if (!isNevadaContractCompatible(version.terms.contractType,String(listing['propertyType']),(listing['sellerStatements'] as Record<string,any> | undefined)?.['contractFacts'])) throw new HttpsError('failed-precondition','The ownership facts require a different agreement. Start a new unsigned offer using the current listing.'); },
  listingDisclosurePolicy: { assertReady: assertNevadaListingDisclosures, assertCounterofferReady: assertNevadaListingDisclosures, reviewedVersions: ({version}) => version.terms.documentVersions },
  stateCode: 'NV', offerCreationEnabled: true,
  requireOwnershipFacts:true,
  supportedPropertyTypes: ['single_family', 'townhome', 'pud', 'condo'],
  contractTypes: ['navstreet_nevada_residential_sale_2026','navstreet_nevada_condominium_resale_2026'], contractTypeRequired: true,
  defaultTimeZone: 'America/Los_Angeles',
  agreementTemplate: { stateCode: 'NV', templateUid: NEVADA_DOCUMENT_RULES.templateUid, templateName: 'NavStreet Nevada Residential Purchase and Sale Agreement', templateVersion: NEVADA_DOCUMENT_RULES.version },
  agreementTemplates: [{stateCode:'NV',templateUid:NEVADA_DOCUMENT_RULES.templateUid,templateName:'NavStreet Nevada Residential Purchase and Sale Agreement',templateVersion:NEVADA_DOCUMENT_RULES.version},{stateCode:'NV',templateUid:'navstreet-nv-condominium-2026',templateName:'NavStreet Nevada Condominium Resale Purchase and Sale Agreement',templateVersion:'2026-10-24'}],
  getAgreementTemplate: terms => terms.contractType === 'navstreet_nevada_condominium_resale_2026' ? {stateCode:'NV',templateUid:'navstreet-nv-condominium-2026',templateName:'NavStreet Nevada Condominium Resale Purchase and Sale Agreement',templateVersion:'2026-10-24'} : terms.documentVersions !== undefined ? {...nevadaStateContractPackage.agreementTemplate,templateVersion:'2026-10-24'} : nevadaStateContractPackage.agreementTemplate,
  createInitialOfferTerms: input => createNevadaInitialOfferTerms(input),
  sanitizeDraftTerms: input => sanitizeNevadaDraftTerms(input),
  validateSubmission: input => validateNevadaSubmission(input),
  validateBeforeSigning: (input) => {const issue=nevadaSubmissionReceiptProblem(input.version.terms);if(issue)throw new HttpsError('failed-precondition',issue);},
  requiredListingDisclosures: ({ version }) => selectReceivedListingDisclosures(version.terms.disclosures, [
      ['statutoryPacketStatus', 'nevada-statutory-packet'],
      ['propertyConditionStatus', 'nevada-seller-disclosure'],
      ['leadPaintStatus', 'lead-based-paint'],
      ['hoaDocumentsStatus', 'nevada-association-documents'],    ]).concat(version.terms.disclosures.propertyConditionStatus === 'exempt' ? ['nevada-seller-disclosure'] : []).concat(version.terms.disclosures.leadPaintStatus === 'exempt' ? ['lead-based-paint'] : []),
  createContractMilestones: input => createNevadaContractMilestones(input),
    getAgreementSummary: ({ version: { terms: t } }) => [
    ...summaryFunding(t.purchase.purchasePriceInCents, t.purchase.loanAmountInCents, t.purchase.financingType === 'cash'),
    { label: 'Funding', value: summaryText(t.purchase.financingType) },
    { label: 'Earnest money deposit', value: summaryMoney(t.purchase.hasEarnestMoney === false ? 0 : t.purchase.earnestMoneyInCents) },
    { label: 'Closing / settlement date', value: summaryText(t.deadlines.settlementDate) },
    { label: 'Inspection / due diligence', value: `${t.deadlines.inspectionPeriodDays} calendar days after Effective Date; see agreement counting rules` },
  ],
  generateAgreement: async input => {
    const { generateNevadaOfferPdf } = require('./nevada-offer-pdf.service') as typeof import('./nevada-offer-pdf.service');
    return generateNevadaOfferPdf(input);
  },
}, FEDERAL_LEAD_POLICY), HOA_POLICY);
