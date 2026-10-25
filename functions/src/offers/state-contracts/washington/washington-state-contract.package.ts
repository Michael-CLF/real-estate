import { HOA_POLICY, FEDERAL_LEAD_POLICY } from './washington-policy-mappings.generated';
import { isWashingtonContractCompatible, type WashingtonOwnershipFacts } from './washington-contract-selection';
import { withHoaContractPolicy } from '../hoa-contract-policy';
import { withFederalLeadContractPolicy } from '../federal-lead-contract-policy';
import { assertListingContractScope } from '../listing-contract-scope';
import { assertWashingtonListingDisclosures } from '../../washington-listing-disclosure-gate';
import { selectReceivedListingDisclosures } from '../received-listing-disclosures';
import { summaryFunding, summaryMoney, summaryText } from '../navstreet-pdf-layout';
import type { StateContractPackage } from '../state-contract-package';
import type { WashingtonOfferTermsDocument } from './washington-offer-terms.document';
import { WASHINGTON_DOCUMENT_RULES } from './washington-document-rules';
import { createWashingtonInitialOfferTerms } from './washington-initial-terms';
import { sanitizeWashingtonDraftTerms } from './washington-draft-terms-sanitizer';
import { validateWashingtonSubmission } from './washington-submission-validator';
import { HttpsError } from 'firebase-functions/v2/https';
import { createWashingtonContractMilestones } from './washington-contract-milestones';
export const washingtonStateContractPackage: StateContractPackage<WashingtonOfferTermsDocument> = withHoaContractPolicy(withFederalLeadContractPolicy({
  assertListingContractCompatible: (listing, version) => {
    assertListingContractScope(washingtonStateContractPackage, listing);
    const facts = (listing['sellerStatements'] as Record<string, unknown> | undefined)?.['contractFacts'] as WashingtonOwnershipFacts | undefined;
    if (!isWashingtonContractCompatible(version.terms.contractType, String(listing['propertyType']), facts)) throw new HttpsError('failed-precondition', 'The listing ownership requires a different Washington agreement. Discard an unsigned draft from its offer page and start again.');
  },
  listingDisclosurePolicy: { reviewedVersions: ({version}) => version.terms.documentVersions, assertReady: assertWashingtonListingDisclosures },
  stateCode: 'WA', offerCreationEnabled: true,
  requireOwnershipFacts:true,
  supportedPropertyTypes: ['single_family', 'townhome', 'pud', 'condo'],
  contractTypes: ['navstreet_washington_residential_sale_2026', 'navstreet_washington_condominium_resale_2026'], contractTypeRequired: true,
  defaultTimeZone: 'America/Los_Angeles',
  agreementTemplate: { stateCode: 'WA', templateUid: WASHINGTON_DOCUMENT_RULES.templateUid, templateName: 'NavStreet Washington Residential Purchase and Sale Agreement', templateVersion: WASHINGTON_DOCUMENT_RULES.version },
  agreementTemplates: [
    {stateCode:'WA', templateUid:WASHINGTON_DOCUMENT_RULES.templateUid, templateName:'NavStreet Washington Residential Purchase and Sale Agreement', templateVersion:WASHINGTON_DOCUMENT_RULES.version},
    {stateCode:'WA', templateUid:'navstreet-wa-condominium-2026', templateName:'NavStreet Washington Condominium Resale Purchase and Sale Agreement', templateVersion:'2026-10-21'},
  ],
  getAgreementTemplate: terms => terms.contractType === 'navstreet_washington_condominium_resale_2026'
    ? {stateCode:'WA', templateUid:'navstreet-wa-condominium-2026', templateName:'NavStreet Washington Condominium Resale Purchase and Sale Agreement', templateVersion:'2026-10-21'}
    : washingtonStateContractPackage.agreementTemplate,
  createInitialOfferTerms: input => createWashingtonInitialOfferTerms(input),
  sanitizeDraftTerms: input => sanitizeWashingtonDraftTerms(input),
  validateSubmission: input => validateWashingtonSubmission(input),
  validateBeforeSigning: ({ version }) => {
    const { disclosures } = version.terms;

    if (disclosures.requiredKnownFacts && disclosures.statutoryPacketStatus !== 'received') throw new HttpsError('failed-precondition',"Review the required property records before submitting or signing.");
    if (disclosures.propertyConditionStatus === 'exempt' && !disclosures.disclosureExemptionClaimed) throw new HttpsError('failed-precondition',"A seller disclosure exception must match the supported listing exception.");
    if (
        
        disclosures.leadPaintStatus === 'pending') {
      throw new HttpsError('failed-precondition',
        'This Washington offer records required disclosures as not received. The seller must provide them, then the buyer must create and submit a new offer acknowledging actual receipt before either party signs.');
    }
  },
  requiredListingDisclosures: ({ version }) => selectReceivedListingDisclosures(version.terms.disclosures, [
      ['statutoryPacketStatus', 'washington-statutory-packet'],
      ['propertyConditionStatus', 'washington-seller-disclosure'],
      ['leadPaintStatus', 'lead-based-paint'],
      ['hoaDocumentsStatus', 'washington-association-documents'],    ]).concat(version.terms.disclosures.propertyConditionStatus === 'exempt' ? ['washington-seller-disclosure'] : []).concat(version.terms.disclosures.leadPaintStatus === 'exempt' ? ['lead-based-paint'] : []),
  createContractMilestones: input => createWashingtonContractMilestones(input),
    getAgreementSummary: ({ version: { terms: t } }) => [
    ...summaryFunding(t.purchase.purchasePriceInCents, t.purchase.loanAmountInCents, t.purchase.financingType === 'cash'),
    { label: 'Funding', value: summaryText(t.purchase.financingType) },
    { label: 'Earnest money deposit', value: summaryMoney(t.purchase.hasEarnestMoney === false ? 0 : t.purchase.earnestMoneyInCents) },
    { label: 'Closing / settlement date', value: summaryText(t.deadlines.settlementDate) },
    { label: 'Inspection / due diligence', value: `${t.deadlines.inspectionPeriodDays} calendar days after Effective Date; see agreement counting rules` },
  ],
  generateAgreement: async input => {
    const { generateWashingtonOfferPdf } = require('./washington-offer-pdf.service') as typeof import('./washington-offer-pdf.service');
    return generateWashingtonOfferPdf(input);
  },
}, FEDERAL_LEAD_POLICY), HOA_POLICY);