import { HOA_POLICY, FEDERAL_LEAD_POLICY } from './alabama-policy-mappings.generated';
import { withHoaContractPolicy } from '../hoa-contract-policy';
import { withFederalLeadContractPolicy } from '../federal-lead-contract-policy';
import { assertListingContractScope } from '../listing-contract-scope';
import { assertAlabamaListingDisclosures } from '../../alabama-listing-disclosure-gate';
import { selectReceivedListingDisclosures } from '../received-listing-disclosures';
import { summaryFunding, summaryMoney, summaryText } from '../navstreet-pdf-layout';
import type { StateContractPackage } from '../state-contract-package';
import type { AlabamaOfferTermsDocument } from './alabama-offer-terms.document';
import { ALABAMA_DOCUMENT_RULES } from './alabama-document-rules';
import { createAlabamaInitialOfferTerms } from './alabama-initial-terms';
import { sanitizeAlabamaDraftTerms } from './alabama-draft-terms-sanitizer';
import { validateAlabamaSubmission } from './alabama-submission-validator';
import { HttpsError } from 'firebase-functions/v2/https';
import { createAlabamaContractMilestones } from './alabama-contract-milestones';
export const alabamaStateContractPackage: StateContractPackage<AlabamaOfferTermsDocument> = withHoaContractPolicy(withFederalLeadContractPolicy({
  assertListingContractCompatible: listing => assertListingContractScope(alabamaStateContractPackage, listing),
  listingDisclosurePolicy: { assertReady: assertAlabamaListingDisclosures },
  stateCode: 'AL', offerCreationEnabled: true,
  requireOwnershipFacts:true,
  supportedPropertyTypes: ['single_family', 'townhome', 'pud'],
  contractTypes: ['navstreet_alabama_residential_sale_2026'], contractTypeRequired: true,
  defaultTimeZone: 'America/Chicago',
  agreementTemplate: { stateCode: 'AL', templateUid: ALABAMA_DOCUMENT_RULES.templateUid, templateName: 'NavStreet Alabama Residential Purchase and Sale Agreement', templateVersion: ALABAMA_DOCUMENT_RULES.version },
  createInitialOfferTerms: input => createAlabamaInitialOfferTerms(input),
  sanitizeDraftTerms: input => sanitizeAlabamaDraftTerms(input),
  validateSubmission: input => validateAlabamaSubmission(input),
  validateBeforeSigning: ({ version }) => {
    const { disclosures } = version.terms;
    if (disclosures.requiredKnownFacts && disclosures.statutoryPacketStatus !== 'received') throw new HttpsError('failed-precondition','Review the required Alabama disclosure before signing.');
    if (
        
        disclosures.leadPaintStatus === 'pending') {
      throw new HttpsError('failed-precondition',
        'This Alabama offer records required disclosures as not received. The seller must provide them, then the buyer must create and submit a new offer acknowledging actual receipt before either party signs.');
    }
  },
  requiredListingDisclosures: ({ version }) => selectReceivedListingDisclosures(version.terms.disclosures, [
      ['statutoryPacketStatus', 'alabama-statutory-packet'],
      ['propertyConditionStatus', 'alabama-seller-disclosure'],
      ['leadPaintStatus', 'lead-based-paint'],
      ['hoaDocumentsStatus', 'alabama-association-documents'],    ]).concat(version.terms.disclosures.propertyConditionStatus === 'exempt' ? ['alabama-seller-disclosure'] : []).concat(version.terms.disclosures.leadPaintStatus === 'exempt' ? ['lead-based-paint'] : []),
  createContractMilestones: input => createAlabamaContractMilestones(input),
    getAgreementSummary: ({ version: { terms: t } }) => [
    ...summaryFunding(t.purchase.purchasePriceInCents, t.purchase.loanAmountInCents, t.purchase.financingType === 'cash'),
    { label: 'Funding', value: summaryText(t.purchase.financingType) },
    { label: 'Earnest money deposit', value: summaryMoney(t.purchase.hasEarnestMoney === false ? 0 : t.purchase.earnestMoneyInCents) },
    { label: 'Closing / settlement date', value: summaryText(t.deadlines.settlementDate) },
    { label: 'Inspection / due diligence', value: `${t.deadlines.inspectionPeriodDays} calendar days after Effective Date; see agreement counting rules` },
  ],
  generateAgreement: async input => {
    const { generateAlabamaOfferPdf } = require('./alabama-offer-pdf.service') as typeof import('./alabama-offer-pdf.service');
    return generateAlabamaOfferPdf(input);
  },
}, FEDERAL_LEAD_POLICY), HOA_POLICY);