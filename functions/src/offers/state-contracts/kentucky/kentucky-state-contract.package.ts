import { HOA_POLICY, FEDERAL_LEAD_POLICY } from './kentucky-policy-mappings.generated';
import {kentuckySubmissionReceiptProblem} from './kentucky-disclosure-policy';
import { isKentuckyContractCompatible } from './kentucky-contract-selection';
import { withHoaContractPolicy } from '../hoa-contract-policy';
import { withFederalLeadContractPolicy } from '../federal-lead-contract-policy';
import { assertListingContractScope } from '../listing-contract-scope';
import { assertKentuckyListingDisclosures } from '../../kentucky-listing-disclosure-gate';
import { selectReceivedListingDisclosures } from '../received-listing-disclosures';
import { summaryFunding, summaryMoney, summaryText } from '../navstreet-pdf-layout';
import type { StateContractPackage } from '../state-contract-package';
import type { KentuckyOfferTermsDocument } from './kentucky-offer-terms.document';
import { KENTUCKY_DOCUMENT_RULES } from './kentucky-document-rules';
import { createKentuckyInitialOfferTerms } from './kentucky-initial-terms';
import { sanitizeKentuckyDraftTerms } from './kentucky-draft-terms-sanitizer';
import { validateKentuckySubmission } from './kentucky-submission-validator';
import { HttpsError } from 'firebase-functions/v2/https';
import { createKentuckyContractMilestones } from './kentucky-contract-milestones';
export const kentuckyStateContractPackage: StateContractPackage<KentuckyOfferTermsDocument> = withHoaContractPolicy(withFederalLeadContractPolicy({
  assertListingContractCompatible: (listing,version) => { assertListingContractScope(kentuckyStateContractPackage,listing); if (!isKentuckyContractCompatible(version.terms.contractType,String(listing['propertyType']),(listing['sellerStatements'] as Record<string,any> | undefined)?.['contractFacts'])) throw new HttpsError('failed-precondition','The ownership facts require a different agreement. Start a new unsigned offer using the current listing.'); },
  listingDisclosurePolicy: { assertReady: assertKentuckyListingDisclosures, assertCounterofferReady: assertKentuckyListingDisclosures, reviewedVersions: ({version}) => version.terms.documentVersions },
  stateCode: 'KY', offerCreationEnabled: true,
  requireOwnershipFacts:true,
  supportedPropertyTypes: ['single_family', 'townhome', 'pud', 'condo'],
  contractTypes: ['navstreet_kentucky_residential_sale_2026','navstreet_kentucky_condominium_resale_2026'], contractTypeRequired: true,
  defaultTimeZone: 'America/New_York',
  agreementTemplate: { stateCode: 'KY', templateUid: KENTUCKY_DOCUMENT_RULES.templateUid, templateName: 'NavStreet Kentucky Residential Purchase and Sale Agreement', templateVersion: KENTUCKY_DOCUMENT_RULES.version },
  agreementTemplates: [{stateCode:'KY',templateUid:KENTUCKY_DOCUMENT_RULES.templateUid,templateName:'NavStreet Kentucky Residential Purchase and Sale Agreement',templateVersion:KENTUCKY_DOCUMENT_RULES.version},{stateCode:'KY',templateUid:'navstreet-ky-condominium-2026',templateName:'NavStreet Kentucky Condominium Resale Purchase and Sale Agreement',templateVersion:'2026-10-24'}],
  getAgreementTemplate: terms => terms.contractType === 'navstreet_kentucky_condominium_resale_2026' ? {stateCode:'KY',templateUid:'navstreet-ky-condominium-2026',templateName:'NavStreet Kentucky Condominium Resale Purchase and Sale Agreement',templateVersion:'2026-10-24'} : terms.documentVersions !== undefined ? {...kentuckyStateContractPackage.agreementTemplate,templateVersion:'2026-10-24'} : kentuckyStateContractPackage.agreementTemplate,
  createInitialOfferTerms: input => createKentuckyInitialOfferTerms(input),
  sanitizeDraftTerms: input => sanitizeKentuckyDraftTerms(input),
  validateSubmission: input => validateKentuckySubmission(input),
  validateBeforeSigning: (input) => {const issue=kentuckySubmissionReceiptProblem(input.version.terms);if(issue)throw new HttpsError('failed-precondition',issue);},
  requiredListingDisclosures: ({ version }) => selectReceivedListingDisclosures(version.terms.disclosures, [
      ['statutoryPacketStatus', 'kentucky-statutory-packet'],
      ['propertyConditionStatus', 'kentucky-seller-disclosure'],
      ['leadPaintStatus', 'lead-based-paint'],
      ['hoaDocumentsStatus', 'kentucky-association-documents'],    ]).concat(version.terms.disclosures.propertyConditionStatus === 'exempt' ? ['kentucky-seller-disclosure'] : []).concat(version.terms.disclosures.leadPaintStatus === 'exempt' ? ['lead-based-paint'] : []),
  createContractMilestones: input => createKentuckyContractMilestones(input),
    getAgreementSummary: ({ version: { terms: t } }) => [
    ...summaryFunding(t.purchase.purchasePriceInCents, t.purchase.loanAmountInCents, t.purchase.financingType === 'cash'),
    { label: 'Funding', value: summaryText(t.purchase.financingType) },
    { label: 'Earnest money deposit', value: summaryMoney(t.purchase.hasEarnestMoney === false ? 0 : t.purchase.earnestMoneyInCents) },
    { label: 'Closing / settlement date', value: summaryText(t.deadlines.settlementDate) },
    { label: 'Inspection / due diligence', value: `${t.deadlines.inspectionPeriodDays} calendar days after Effective Date; see agreement counting rules` },
  ],
  generateAgreement: async input => {
    const { generateKentuckyOfferPdf } = require('./kentucky-offer-pdf.service') as typeof import('./kentucky-offer-pdf.service');
    return generateKentuckyOfferPdf(input);
  },
}, FEDERAL_LEAD_POLICY), HOA_POLICY);
