import { HOA_POLICY, FEDERAL_LEAD_POLICY } from './oregon-policy-mappings.generated';
import { withHoaContractPolicy } from '../hoa-contract-policy';
import { withFederalLeadContractPolicy } from '../federal-lead-contract-policy';
import { assertListingContractScope } from '../listing-contract-scope';
import { assertOregonListingDisclosures } from '../../oregon-listing-disclosure-gate';
import { selectReceivedListingDisclosures } from '../received-listing-disclosures';
import { summaryFunding, summaryMoney, summaryText } from '../navstreet-pdf-layout';
import type { StateContractPackage } from '../state-contract-package';
import type { OregonOfferTermsDocument } from './oregon-offer-terms.document';
import { OREGON_DOCUMENT_RULES } from './oregon-document-rules';
import { createOregonInitialOfferTerms } from './oregon-initial-terms';
import { sanitizeOregonDraftTerms } from './oregon-draft-terms-sanitizer';
import { validateOregonSubmission } from './oregon-submission-validator';
import { HttpsError } from 'firebase-functions/v2/https';
import { createOregonContractMilestones } from './oregon-contract-milestones';
export const oregonStateContractPackage: StateContractPackage<OregonOfferTermsDocument> = withHoaContractPolicy(withFederalLeadContractPolicy({
  assertListingContractCompatible: listing => assertListingContractScope(oregonStateContractPackage, listing),
  listingDisclosurePolicy: { assertReady: assertOregonListingDisclosures },
  stateCode: 'OR', offerCreationEnabled: true,
  requireOwnershipFacts:true,
  supportedPropertyTypes: ['single_family', 'townhome', 'pud'],
  contractTypes: ['navstreet_oregon_residential_sale_2026'], contractTypeRequired: true,
  defaultTimeZone: 'America/Los_Angeles',
  agreementTemplate: { stateCode: 'OR', templateUid: OREGON_DOCUMENT_RULES.templateUid, templateName: 'NavStreet Oregon Residential Purchase and Sale Agreement', templateVersion: OREGON_DOCUMENT_RULES.version },
  createInitialOfferTerms: input => createOregonInitialOfferTerms(input),
  sanitizeDraftTerms: input => sanitizeOregonDraftTerms(input),
  validateSubmission: input => validateOregonSubmission(input),
  validateBeforeSigning: ({ version }) => {
    const { disclosures } = version.terms;
    if (
        
        disclosures.leadPaintStatus === 'pending') {
      throw new HttpsError('failed-precondition',
        'This Oregon offer records required disclosures as not received. The seller must provide them, then the buyer must create and submit a new offer acknowledging actual receipt before either party signs.');
    }
  },
  requiredListingDisclosures: ({ version }) => selectReceivedListingDisclosures(version.terms.disclosures, [
      ['statutoryPacketStatus', 'oregon-statutory-packet'],
      ['propertyConditionStatus', 'oregon-seller-disclosure'],
      ['leadPaintStatus', 'lead-based-paint'],
      ['hoaDocumentsStatus', 'oregon-association-documents'],    ]).concat(version.terms.disclosures.propertyConditionStatus === 'exempt' ? ['oregon-seller-disclosure'] : []).concat(version.terms.disclosures.leadPaintStatus === 'exempt' ? ['lead-based-paint'] : []),
  createContractMilestones: input => createOregonContractMilestones(input),
    getAgreementSummary: ({ version: { terms: t } }) => [
    ...summaryFunding(t.purchase.purchasePriceInCents, t.purchase.loanAmountInCents, t.purchase.financingType === 'cash'),
    { label: 'Funding', value: summaryText(t.purchase.financingType) },
    { label: 'Earnest money deposit', value: summaryMoney(t.purchase.hasEarnestMoney === false ? 0 : t.purchase.earnestMoneyInCents) },
    { label: 'Closing / settlement date', value: summaryText(t.deadlines.settlementDate) },
    { label: 'Inspection / due diligence', value: `${t.deadlines.inspectionPeriodDays} calendar days after Effective Date; see agreement counting rules` },
  ],
  generateAgreement: async input => {
    const { generateOregonOfferPdf } = require('./oregon-offer-pdf.service') as typeof import('./oregon-offer-pdf.service');
    return generateOregonOfferPdf(input);
  },
}, FEDERAL_LEAD_POLICY), HOA_POLICY);