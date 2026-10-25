import { HOA_POLICY, FEDERAL_LEAD_POLICY } from './virginia-policy-mappings.generated';
import {virginiaSubmissionReceiptProblem} from './virginia-disclosure-policy';
import { isVirginiaContractCompatible } from './virginia-contract-selection';
import { withHoaContractPolicy } from '../hoa-contract-policy';
import { withFederalLeadContractPolicy } from '../federal-lead-contract-policy';
import { assertListingContractScope } from '../listing-contract-scope';
import { assertVirginiaListingDisclosures } from '../../virginia-listing-disclosure-gate';
import { selectReceivedListingDisclosures } from '../received-listing-disclosures';
import { summaryFunding, summaryMoney, summaryText } from '../navstreet-pdf-layout';
import type { StateContractPackage } from '../state-contract-package';
import type { VirginiaOfferTermsDocument } from './virginia-offer-terms.document';
import { VIRGINIA_DOCUMENT_RULES } from './virginia-document-rules';
import { createVirginiaInitialOfferTerms } from './virginia-initial-terms';
import { sanitizeVirginiaDraftTerms } from './virginia-draft-terms-sanitizer';
import { validateVirginiaSubmission } from './virginia-submission-validator';
import { HttpsError } from 'firebase-functions/v2/https';
import { createVirginiaContractMilestones } from './virginia-contract-milestones';
export const virginiaStateContractPackage: StateContractPackage<VirginiaOfferTermsDocument> = withHoaContractPolicy(withFederalLeadContractPolicy({
  assertListingContractCompatible: (listing,version) => { assertListingContractScope(virginiaStateContractPackage,listing); if (!isVirginiaContractCompatible(version.terms.contractType,String(listing['propertyType']),(listing['sellerStatements'] as Record<string,any> | undefined)?.['contractFacts'])) throw new HttpsError('failed-precondition','The ownership facts require a different agreement. Start a new unsigned offer using the current listing.'); },
  listingDisclosurePolicy: { assertReady: assertVirginiaListingDisclosures, assertCounterofferReady: assertVirginiaListingDisclosures, reviewedVersions: ({version}) => version.terms.documentVersions },
  stateCode: 'VA', offerCreationEnabled: true,
  requireOwnershipFacts:true,
  supportedPropertyTypes: ['single_family', 'townhome', 'pud', 'condo'],
  contractTypes: ['navstreet_virginia_residential_sale_2026','navstreet_virginia_condominium_resale_2026'], contractTypeRequired: true,
  defaultTimeZone: 'America/New_York',
  agreementTemplate: { stateCode: 'VA', templateUid: VIRGINIA_DOCUMENT_RULES.templateUid, templateName: 'NavStreet Virginia Residential Purchase and Sale Agreement', templateVersion: VIRGINIA_DOCUMENT_RULES.version },
  agreementTemplates: [{stateCode:'VA',templateUid:VIRGINIA_DOCUMENT_RULES.templateUid,templateName:'NavStreet Virginia Residential Purchase and Sale Agreement',templateVersion:VIRGINIA_DOCUMENT_RULES.version},{stateCode:'VA',templateUid:'navstreet-va-condominium-2026',templateName:'NavStreet Virginia Condominium Resale Purchase and Sale Agreement',templateVersion:'2026-10-25'}],
  getAgreementTemplate: terms => terms.contractType === 'navstreet_virginia_condominium_resale_2026' ? {stateCode:'VA',templateUid:'navstreet-va-condominium-2026',templateName:'NavStreet Virginia Condominium Resale Purchase and Sale Agreement',templateVersion:'2026-10-25'} : terms.documentVersions !== undefined ? {...virginiaStateContractPackage.agreementTemplate,templateVersion:'2026-10-25'} : virginiaStateContractPackage.agreementTemplate,
  createInitialOfferTerms: input => createVirginiaInitialOfferTerms(input),
  sanitizeDraftTerms: input => sanitizeVirginiaDraftTerms(input),
  validateSubmission: input => validateVirginiaSubmission(input),
  validateBeforeSigning: (input) => {const issue=virginiaSubmissionReceiptProblem(input.version.terms);if(issue)throw new HttpsError('failed-precondition',issue);},
  requiredListingDisclosures: ({ version }) => selectReceivedListingDisclosures(version.terms.disclosures, [
      ['statutoryPacketStatus', 'virginia-statutory-packet'],
      ['propertyConditionStatus', 'virginia-seller-disclosure'],
      ['leadPaintStatus', 'lead-based-paint'],
      ['hoaDocumentsStatus', 'virginia-association-documents'],    ]).concat(version.terms.disclosures.propertyConditionStatus === 'exempt' ? ['virginia-seller-disclosure'] : []).concat(version.terms.disclosures.leadPaintStatus === 'exempt' ? ['lead-based-paint'] : []),
  createContractMilestones: input => createVirginiaContractMilestones(input),
    getAgreementSummary: ({ version: { terms: t } }) => [
    ...summaryFunding(t.purchase.purchasePriceInCents, t.purchase.loanAmountInCents, t.purchase.financingType === 'cash'),
    { label: 'Funding', value: summaryText(t.purchase.financingType) },
    { label: 'Earnest money deposit', value: summaryMoney(t.purchase.hasEarnestMoney === false ? 0 : t.purchase.earnestMoneyInCents) },
    { label: 'Closing / settlement date', value: summaryText(t.deadlines.settlementDate) },
    { label: 'Inspection / due diligence', value: `${t.deadlines.inspectionPeriodDays} calendar days after Effective Date; see agreement counting rules` },
  ],
  generateAgreement: async input => {
    const { generateVirginiaOfferPdf } = require('./virginia-offer-pdf.service') as typeof import('./virginia-offer-pdf.service');
    return generateVirginiaOfferPdf(input);
  },
}, FEDERAL_LEAD_POLICY), HOA_POLICY);
