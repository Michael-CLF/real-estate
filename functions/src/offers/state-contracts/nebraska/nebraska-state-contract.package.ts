import { HOA_POLICY, FEDERAL_LEAD_POLICY } from './nebraska-policy-mappings.generated';
import { withHoaContractPolicy } from '../hoa-contract-policy';
import { withFederalLeadContractPolicy } from '../federal-lead-contract-policy';
import { assertListingContractScope } from '../listing-contract-scope';
import { assertNebraskaListingDisclosures } from '../../nebraska-listing-disclosure-gate';
import { selectReceivedListingDisclosures } from '../received-listing-disclosures';
import { summaryFunding, summaryMoney, summaryText } from '../navstreet-pdf-layout';
import type { StateContractPackage } from '../state-contract-package';
import type { NebraskaOfferTermsDocument } from './nebraska-offer-terms.document';
import { NEBRASKA_DOCUMENT_RULES } from './nebraska-document-rules';
import { createNebraskaInitialOfferTerms } from './nebraska-initial-terms';
import { sanitizeNebraskaDraftTerms } from './nebraska-draft-terms-sanitizer';
import { validateNebraskaSubmission } from './nebraska-submission-validator';
import { HttpsError } from 'firebase-functions/v2/https';
import { createNebraskaContractMilestones } from './nebraska-contract-milestones';
export const nebraskaStateContractPackage: StateContractPackage<NebraskaOfferTermsDocument> = withHoaContractPolicy(withFederalLeadContractPolicy({
  assertListingContractCompatible: listing => assertListingContractScope(nebraskaStateContractPackage, listing),
  listingDisclosurePolicy: { assertReady: assertNebraskaListingDisclosures },
  stateCode: 'NE', offerCreationEnabled: true,
  requireOwnershipFacts:true,
  supportedPropertyTypes: ['single_family', 'townhome', 'pud'],
  contractTypes: ['navstreet_nebraska_residential_sale_2026'], contractTypeRequired: true,
  defaultTimeZone: 'America/Chicago',
  agreementTemplate: { stateCode: 'NE', templateUid: NEBRASKA_DOCUMENT_RULES.templateUid, templateName: 'NavStreet Nebraska Residential Purchase and Sale Agreement', templateVersion: NEBRASKA_DOCUMENT_RULES.version },
  createInitialOfferTerms: input => createNebraskaInitialOfferTerms(input),
  sanitizeDraftTerms: input => sanitizeNebraskaDraftTerms(input),
  validateSubmission: input => validateNebraskaSubmission(input),
  validateBeforeSigning: ({ version }) => {
    const { disclosures } = version.terms;
    if (!['received','exempt'].includes(disclosures.propertyConditionStatus)) throw new HttpsError('failed-precondition','Required seller disclosure or lawful exemption evidence must be reviewed before signing.');
    if (
        
        disclosures.leadPaintStatus === 'pending') {
      throw new HttpsError('failed-precondition',
        'This Nebraska offer records required disclosures as not received. The seller must provide them, then the buyer must create and submit a new offer acknowledging actual receipt before either party signs.');
    }
  },
  requiredListingDisclosures: ({ version }) => selectReceivedListingDisclosures(version.terms.disclosures, [
      ['statutoryPacketStatus', 'nebraska-statutory-packet'],
      ['propertyConditionStatus', 'nebraska-seller-disclosure'],
      ['leadPaintStatus', 'lead-based-paint'],
      ['hoaDocumentsStatus', 'nebraska-association-documents'],    ]).concat(version.terms.disclosures.propertyConditionStatus === 'exempt' ? ['nebraska-seller-disclosure'] : []).concat(version.terms.disclosures.leadPaintStatus === 'exempt' ? ['lead-based-paint'] : []),
  createContractMilestones: input => createNebraskaContractMilestones(input),
    getAgreementSummary: ({ version: { terms: t } }) => [
    ...summaryFunding(t.purchase.purchasePriceInCents, t.purchase.loanAmountInCents, t.purchase.financingType === 'cash'),
    { label: 'Funding', value: summaryText(t.purchase.financingType) },
    { label: 'Earnest money deposit', value: summaryMoney(t.purchase.hasEarnestMoney === false ? 0 : t.purchase.earnestMoneyInCents) },
    { label: 'Closing / settlement date', value: summaryText(t.deadlines.settlementDate) },
    { label: 'Inspection / due diligence', value: `${t.deadlines.inspectionPeriodDays} calendar days after Effective Date; see agreement counting rules` },
  ],
  generateAgreement: async input => {
    const { generateNebraskaOfferPdf } = require('./nebraska-offer-pdf.service') as typeof import('./nebraska-offer-pdf.service');
    return generateNebraskaOfferPdf(input);
  },
}, FEDERAL_LEAD_POLICY), HOA_POLICY);