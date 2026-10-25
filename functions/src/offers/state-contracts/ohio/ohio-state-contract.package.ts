import { HOA_POLICY, FEDERAL_LEAD_POLICY } from './ohio-policy-mappings.generated';
import { withHoaContractPolicy } from '../hoa-contract-policy';
import { withFederalLeadContractPolicy } from '../federal-lead-contract-policy';
import { assertListingContractScope } from '../listing-contract-scope';
import { assertOhioListingDisclosures } from '../../ohio-listing-disclosure-gate';
import { selectReceivedListingDisclosures } from '../received-listing-disclosures';
import { summaryFunding, summaryMoney, summaryText } from '../navstreet-pdf-layout';
import type { StateContractPackage } from '../state-contract-package';
import type { OhioOfferTermsDocument } from './ohio-offer-terms.document';
import { OHIO_DOCUMENT_RULES } from './ohio-document-rules';
import { createOhioInitialOfferTerms } from './ohio-initial-terms';
import { sanitizeOhioDraftTerms } from './ohio-draft-terms-sanitizer';
import { validateOhioSubmission } from './ohio-submission-validator';
import { HttpsError } from 'firebase-functions/v2/https';
import { createOhioContractMilestones } from './ohio-contract-milestones';
export const ohioStateContractPackage: StateContractPackage<OhioOfferTermsDocument> = withHoaContractPolicy(withFederalLeadContractPolicy({
  assertListingContractCompatible: listing => assertListingContractScope(ohioStateContractPackage, listing),
  listingDisclosurePolicy: { assertReady: assertOhioListingDisclosures },
  stateCode: 'OH', offerCreationEnabled: true,
  requireOwnershipFacts:true,
  supportedPropertyTypes: ['single_family', 'townhome', 'pud'],
  contractTypes: ['navstreet_ohio_residential_sale_2026'], contractTypeRequired: true,
  defaultTimeZone: 'America/New_York',
  agreementTemplate: { stateCode: 'OH', templateUid: OHIO_DOCUMENT_RULES.templateUid, templateName: 'NavStreet Ohio Residential Purchase and Sale Agreement', templateVersion: OHIO_DOCUMENT_RULES.version },
  createInitialOfferTerms: input => createOhioInitialOfferTerms(input),
  sanitizeDraftTerms: input => sanitizeOhioDraftTerms(input),
  validateSubmission: input => validateOhioSubmission(input),
  validateBeforeSigning: ({ version }) => {
    const { disclosures } = version.terms;
    if (disclosures.propertyConditionStatus === 'exempt' && !disclosures.disclosureExemptionClaimed) throw new HttpsError('failed-precondition','Review the required Ohio disclosure before signing.');
    if (
        
        disclosures.leadPaintStatus === 'pending') {
      throw new HttpsError('failed-precondition',
        'This Ohio offer records required disclosures as not received. The seller must provide them, then the buyer must create and submit a new offer acknowledging actual receipt before either party signs.');
    }
  },
  requiredListingDisclosures: ({ version }) => selectReceivedListingDisclosures(version.terms.disclosures, [
      ['statutoryPacketStatus', 'ohio-statutory-packet'],
      ['propertyConditionStatus', 'ohio-seller-disclosure'],
      ['leadPaintStatus', 'lead-based-paint'],
      ['hoaDocumentsStatus', 'ohio-association-documents'],    ]).concat(version.terms.disclosures.propertyConditionStatus === 'exempt' ? ['ohio-seller-disclosure'] : []).concat(version.terms.disclosures.leadPaintStatus === 'exempt' ? ['lead-based-paint'] : []),
  createContractMilestones: input => createOhioContractMilestones(input),
    getAgreementSummary: ({ version: { terms: t } }) => [
    ...summaryFunding(t.purchase.purchasePriceInCents, t.purchase.loanAmountInCents, t.purchase.financingType === 'cash'),
    { label: 'Funding', value: summaryText(t.purchase.financingType) },
    { label: 'Earnest money deposit', value: summaryMoney(t.purchase.hasEarnestMoney === false ? 0 : t.purchase.earnestMoneyInCents) },
    { label: 'Closing / settlement date', value: summaryText(t.deadlines.settlementDate) },
    { label: 'Inspection / due diligence', value: `${t.deadlines.inspectionPeriodDays} calendar days after Effective Date; see agreement counting rules` },
  ],
  generateAgreement: async input => {
    const { generateOhioOfferPdf } = require('./ohio-offer-pdf.service') as typeof import('./ohio-offer-pdf.service');
    return generateOhioOfferPdf(input);
  },
}, FEDERAL_LEAD_POLICY), HOA_POLICY);