import { HOA_POLICY, FEDERAL_LEAD_POLICY } from './vermont-policy-mappings.generated';
import {vermontSubmissionReceiptProblem} from './vermont-disclosure-policy';
import { isVermontContractCompatible } from './vermont-contract-selection';
import { withHoaContractPolicy } from '../hoa-contract-policy';
import { withFederalLeadContractPolicy } from '../federal-lead-contract-policy';
import { assertListingContractScope } from '../listing-contract-scope';
import { assertVermontListingDisclosures } from '../../vermont-listing-disclosure-gate';
import { selectReceivedListingDisclosures } from '../received-listing-disclosures';
import { summaryFunding, summaryMoney, summaryText } from '../navstreet-pdf-layout';
import type { StateContractPackage } from '../state-contract-package';
import type { VermontOfferTermsDocument } from './vermont-offer-terms.document';
import { VERMONT_DOCUMENT_RULES } from './vermont-document-rules';
import { createVermontInitialOfferTerms } from './vermont-initial-terms';
import { sanitizeVermontDraftTerms } from './vermont-draft-terms-sanitizer';
import { validateVermontSubmission } from './vermont-submission-validator';
import { HttpsError } from 'firebase-functions/v2/https';
import { createVermontContractMilestones } from './vermont-contract-milestones';
export const vermontStateContractPackage: StateContractPackage<VermontOfferTermsDocument> = withHoaContractPolicy(withFederalLeadContractPolicy({
  assertListingContractCompatible: (listing,version) => { assertListingContractScope(vermontStateContractPackage,listing); if (!isVermontContractCompatible(version.terms.contractType,String(listing['propertyType']),(listing['sellerStatements'] as Record<string,any> | undefined)?.['contractFacts'])) throw new HttpsError('failed-precondition','The ownership facts require a different agreement. Start a new unsigned offer using the current listing.'); },
  listingDisclosurePolicy: { assertReady: assertVermontListingDisclosures, assertCounterofferReady: assertVermontListingDisclosures, reviewedVersions: ({version}) => version.terms.documentVersions },
  stateCode: 'VT', offerCreationEnabled: true,
  requireOwnershipFacts:true,
  supportedPropertyTypes: ['single_family', 'townhome', 'pud', 'condo'],
  contractTypes: ['navstreet_vermont_residential_sale_2026','navstreet_vermont_condominium_resale_2026'], contractTypeRequired: true,
  defaultTimeZone: 'America/New_York',
  agreementTemplate: { stateCode: 'VT', templateUid: VERMONT_DOCUMENT_RULES.templateUid, templateName: 'NavStreet Vermont Residential Purchase and Sale Agreement', templateVersion: VERMONT_DOCUMENT_RULES.version },
  agreementTemplates: [{stateCode:'VT',templateUid:VERMONT_DOCUMENT_RULES.templateUid,templateName:'NavStreet Vermont Residential Purchase and Sale Agreement',templateVersion:VERMONT_DOCUMENT_RULES.version},{stateCode:'VT',templateUid:'navstreet-vt-condominium-2026',templateName:'NavStreet Vermont Condominium Resale Purchase and Sale Agreement',templateVersion:'2026-10-25'}],
  getAgreementTemplate: terms => terms.contractType === 'navstreet_vermont_condominium_resale_2026' ? {stateCode:'VT',templateUid:'navstreet-vt-condominium-2026',templateName:'NavStreet Vermont Condominium Resale Purchase and Sale Agreement',templateVersion:'2026-10-25'} : terms.documentVersions !== undefined ? {...vermontStateContractPackage.agreementTemplate,templateVersion:'2026-10-25'} : vermontStateContractPackage.agreementTemplate,
  createInitialOfferTerms: input => createVermontInitialOfferTerms(input),
  sanitizeDraftTerms: input => sanitizeVermontDraftTerms(input),
  validateSubmission: input => validateVermontSubmission(input),
  validateBeforeSigning: (input) => {const issue=vermontSubmissionReceiptProblem(input.version.terms);if(issue)throw new HttpsError('failed-precondition',issue);},
  requiredListingDisclosures: ({ version }) => selectReceivedListingDisclosures(version.terms.disclosures, [
      ['statutoryPacketStatus', 'vermont-statutory-packet'],
      ['propertyConditionStatus', 'vermont-seller-disclosure'],
      ['leadPaintStatus', 'lead-based-paint'],
      ['hoaDocumentsStatus', 'vermont-association-documents'],    ]).concat(version.terms.disclosures.propertyConditionStatus === 'exempt' ? ['vermont-seller-disclosure'] : []).concat(version.terms.disclosures.leadPaintStatus === 'exempt' ? ['lead-based-paint'] : []),
  createContractMilestones: input => createVermontContractMilestones(input),
    getAgreementSummary: ({ version: { terms: t } }) => [
    ...summaryFunding(t.purchase.purchasePriceInCents, t.purchase.loanAmountInCents, t.purchase.financingType === 'cash'),
    { label: 'Funding', value: summaryText(t.purchase.financingType) },
    { label: 'Earnest money deposit', value: summaryMoney(t.purchase.hasEarnestMoney === false ? 0 : t.purchase.earnestMoneyInCents) },
    { label: 'Closing / settlement date', value: summaryText(t.deadlines.settlementDate) },
    { label: 'Inspection / due diligence', value: `${t.deadlines.inspectionPeriodDays} calendar days after Effective Date; see agreement counting rules` },
  ],
  generateAgreement: async input => {
    const { generateVermontOfferPdf } = require('./vermont-offer-pdf.service') as typeof import('./vermont-offer-pdf.service');
    return generateVermontOfferPdf(input);
  },
}, FEDERAL_LEAD_POLICY), HOA_POLICY);
