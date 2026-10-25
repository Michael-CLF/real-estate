import { HOA_POLICY, FEDERAL_LEAD_POLICY } from './rhode-island-policy-mappings.generated';
import {rhodeIslandSubmissionReceiptProblem} from './rhode-island-disclosure-policy';
import { isRhodeIslandContractCompatible } from './rhode-island-contract-selection';
import { withHoaContractPolicy } from '../hoa-contract-policy';
import { withFederalLeadContractPolicy } from '../federal-lead-contract-policy';
import { assertListingContractScope } from '../listing-contract-scope';
import { assertRhodeIslandListingDisclosures } from '../../rhode-island-listing-disclosure-gate';
import { selectReceivedListingDisclosures } from '../received-listing-disclosures';
import { summaryFunding, summaryMoney, summaryText } from '../navstreet-pdf-layout';
import type { StateContractPackage } from '../state-contract-package';
import type { RhodeIslandOfferTermsDocument } from './rhode-island-offer-terms.document';
import { RHODE_ISLAND_DOCUMENT_RULES } from './rhode-island-document-rules';
import { createRhodeIslandInitialOfferTerms } from './rhode-island-initial-terms';
import { sanitizeRhodeIslandDraftTerms } from './rhode-island-draft-terms-sanitizer';
import { validateRhodeIslandSubmission } from './rhode-island-submission-validator';
import { HttpsError } from 'firebase-functions/v2/https';
import { createRhodeIslandContractMilestones } from './rhode-island-contract-milestones';
export const rhodeIslandStateContractPackage: StateContractPackage<RhodeIslandOfferTermsDocument> = withHoaContractPolicy(withFederalLeadContractPolicy({
  assertListingContractCompatible: (listing,version) => { assertListingContractScope(rhodeIslandStateContractPackage,listing); if (!isRhodeIslandContractCompatible(version.terms.contractType,String(listing['propertyType']),(listing['sellerStatements'] as Record<string,any> | undefined)?.['contractFacts'])) throw new HttpsError('failed-precondition','The ownership facts require a different agreement. Start a new unsigned offer using the current listing.'); },
  listingDisclosurePolicy: { assertReady: assertRhodeIslandListingDisclosures, assertCounterofferReady: assertRhodeIslandListingDisclosures, reviewedVersions: ({version}) => version.terms.documentVersions },
  stateCode: 'RI', offerCreationEnabled: true,
  requireOwnershipFacts:true,
  supportedPropertyTypes: ['single_family', 'townhome', 'pud', 'condo'],
  contractTypes: ['navstreet_rhode_island_residential_sale_2026','navstreet_rhode_island_condominium_resale_2026'], contractTypeRequired: true,
  defaultTimeZone: 'America/New_York',
  agreementTemplate: { stateCode: 'RI', templateUid: RHODE_ISLAND_DOCUMENT_RULES.templateUid, templateName: 'NavStreet Rhode Island Residential Purchase and Sale Agreement', templateVersion: RHODE_ISLAND_DOCUMENT_RULES.version },
  agreementTemplates: [{stateCode:'RI',templateUid:RHODE_ISLAND_DOCUMENT_RULES.templateUid,templateName:'NavStreet Rhode Island Residential Purchase and Sale Agreement',templateVersion:RHODE_ISLAND_DOCUMENT_RULES.version},{stateCode:'RI',templateUid:'navstreet-ri-condominium-2026',templateName:'NavStreet Rhode Island Condominium Resale Purchase and Sale Agreement',templateVersion:'2026-10-24'}],
  getAgreementTemplate: terms => terms.contractType === 'navstreet_rhode_island_condominium_resale_2026' ? {stateCode:'RI',templateUid:'navstreet-ri-condominium-2026',templateName:'NavStreet Rhode Island Condominium Resale Purchase and Sale Agreement',templateVersion:'2026-10-24'} : terms.documentVersions !== undefined ? {...rhodeIslandStateContractPackage.agreementTemplate,templateVersion:'2026-10-24'} : rhodeIslandStateContractPackage.agreementTemplate,
  createInitialOfferTerms: input => createRhodeIslandInitialOfferTerms(input),
  sanitizeDraftTerms: input => sanitizeRhodeIslandDraftTerms(input),
  validateSubmission: input => validateRhodeIslandSubmission(input),
  validateBeforeSigning: (input) => {const issue=rhodeIslandSubmissionReceiptProblem(input.version.terms);if(issue)throw new HttpsError('failed-precondition',issue);},
  requiredListingDisclosures: ({ version }) => selectReceivedListingDisclosures(version.terms.disclosures, [
      ['statutoryPacketStatus', 'rhode-island-statutory-packet'],
      ['propertyConditionStatus', 'rhode-island-seller-disclosure'],
      ['leadPaintStatus', 'lead-based-paint'],
      ['hoaDocumentsStatus', 'rhode-island-association-documents'],    ]).concat(version.terms.disclosures.propertyConditionStatus === 'exempt' ? ['rhode-island-seller-disclosure'] : []).concat(version.terms.disclosures.leadPaintStatus === 'exempt' ? ['lead-based-paint'] : []),
  createContractMilestones: input => createRhodeIslandContractMilestones(input),
    getAgreementSummary: ({ version: { terms: t } }) => [
    ...summaryFunding(t.purchase.purchasePriceInCents, t.purchase.loanAmountInCents, t.purchase.financingType === 'cash'),
    { label: 'Funding', value: summaryText(t.purchase.financingType) },
    { label: 'Earnest money deposit', value: summaryMoney(t.purchase.hasEarnestMoney === false ? 0 : t.purchase.earnestMoneyInCents) },
    { label: 'Closing / settlement date', value: summaryText(t.deadlines.settlementDate) },
    { label: 'Inspection / due diligence', value: `${t.deadlines.inspectionPeriodDays} calendar days after Effective Date; see agreement counting rules` },
  ],
  generateAgreement: async input => {
    const { generateRhodeIslandOfferPdf } = require('./rhode-island-offer-pdf.service') as typeof import('./rhode-island-offer-pdf.service');
    return generateRhodeIslandOfferPdf(input);
  },
}, FEDERAL_LEAD_POLICY), HOA_POLICY);
