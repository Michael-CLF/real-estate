import { withHoaContractPolicy } from '../hoa-contract-policy';
import { withFederalLeadContractPolicy } from '../federal-lead-contract-policy';
import { assertListingContractScope } from '../listing-contract-scope';
import { assertMarylandListingDisclosures } from '../../maryland-listing-disclosure-gate';
import { selectReceivedListingDisclosures } from '../received-listing-disclosures';
import { summaryFunding, summaryMoney, summaryText } from '../navstreet-pdf-layout';
import type { StateContractPackage } from '../state-contract-package';
import type { MarylandOfferTermsDocument } from './maryland-offer-terms.document';
import { MARYLAND_DOCUMENT_RULES } from './maryland-document-rules';
import { createMarylandInitialOfferTerms } from './maryland-initial-terms';
import { sanitizeMarylandDraftTerms } from './maryland-draft-terms-sanitizer';
import { validateMarylandSubmission } from './maryland-submission-validator';
import { HttpsError } from 'firebase-functions/v2/https';
import { createMarylandContractMilestones } from './maryland-contract-milestones';
export const marylandStateContractPackage: StateContractPackage<MarylandOfferTermsDocument> = withHoaContractPolicy(withFederalLeadContractPolicy({
  assertListingContractCompatible: listing => assertListingContractScope(marylandStateContractPackage, listing),
  listingDisclosurePolicy: { assertReady: assertMarylandListingDisclosures },
  stateCode: 'MD', offerCreationEnabled: true,
  requireOwnershipFacts:true,
  supportedPropertyTypes: ['single_family', 'townhome', 'pud'],
  contractTypes: ['navstreet_maryland_residential_sale_2026'], contractTypeRequired: true,
  defaultTimeZone: 'America/New_York',
  agreementTemplate: { stateCode: 'MD', templateUid: MARYLAND_DOCUMENT_RULES.templateUid, templateName: 'NavStreet Maryland Residential Purchase and Sale Agreement', templateVersion: MARYLAND_DOCUMENT_RULES.version },
  createInitialOfferTerms: input => createMarylandInitialOfferTerms(input),
  sanitizeDraftTerms: input => sanitizeMarylandDraftTerms(input),
  validateSubmission: input => validateMarylandSubmission(input),
  validateBeforeSigning: ({ version, signerRole }) => {
    const { disclosures } = version.terms;
    if (Date.now() >= Date.parse('2027-07-01T04:00:00Z')) throw new HttpsError('failed-precondition','Maryland agreements require the July 2027 flood-form update before signing. Contact NavStreet for the updated package.');
    if (!disclosures.radonNoticeAcknowledged) throw new HttpsError('failed-precondition','Review the state notices before signing.');
    if (signerRole !== "buyer" && (!['received','exempt'].includes(disclosures.propertyConditionStatus))) throw new HttpsError("failed-precondition","Maryland condition disclosure/disclaimer or supported exemption is required before seller acceptance. If this immutable offer records Pending, deliver the document and have the buyer create a replacement offer acknowledging receipt.");
    if (disclosures.propertyConditionStatus === 'exempt' && !disclosures.disclosureExemptionClaimed) throw new HttpsError("failed-precondition","A disclosure exception must match supported seller evidence.");
    if (disclosures.requiredKnownFacts && disclosures.statutoryPacketStatus !== 'received') throw new HttpsError("failed-precondition","Review the applicable required property notice before submitting or signing.");
    if (
        
        disclosures.leadPaintStatus === 'pending') {
      throw new HttpsError('failed-precondition',
        'This Maryland offer records required disclosures as not received. The seller must provide them, then the buyer must create and submit a new offer acknowledging actual receipt before either party signs.');
    }
  },
  requiredListingDisclosures: ({ version }) => selectReceivedListingDisclosures(version.terms.disclosures, [
      ['statutoryPacketStatus', 'maryland-statutory-packet'],
      ['propertyConditionStatus', 'maryland-seller-disclosure'],
      ['leadPaintStatus', 'lead-based-paint'],
      ['hoaDocumentsStatus', 'maryland-association-documents'],    ]).concat(version.terms.disclosures.propertyConditionStatus === 'exempt' ? ['maryland-seller-disclosure'] : []).concat(version.terms.disclosures.leadPaintStatus === 'exempt' ? ['lead-based-paint'] : []),
  createContractMilestones: input => createMarylandContractMilestones(input),
    getAgreementSummary: ({ version: { terms: t } }) => [
    ...summaryFunding(t.purchase.purchasePriceInCents, t.purchase.loanAmountInCents, t.purchase.financingType === 'cash'),
    { label: 'Funding', value: summaryText(t.purchase.financingType) },
    { label: 'Earnest money deposit', value: summaryMoney(t.purchase.hasEarnestMoney === false ? 0 : t.purchase.earnestMoneyInCents) },
    { label: 'Closing / settlement date', value: summaryText(t.deadlines.settlementDate) },
    { label: 'Inspection / due diligence', value: `${t.deadlines.inspectionPeriodDays} calendar days after Effective Date; see agreement counting rules` },
  ],
  generateAgreement: async input => {
    const { generateMarylandOfferPdf } = require('./maryland-offer-pdf.service') as typeof import('./maryland-offer-pdf.service');
    return generateMarylandOfferPdf(input);
  },
}, {values:{'disclosures.leadPaintStatus':'built_1978_or_later','disclosures.leadInspectionSelection':'unselected','disclosures.leadInspectionDays':10,'documentVersions.lead-based-paint':undefined},hiddenFields:['disclosures.leadPaintStatus','disclosures.leadInspectionSelection','disclosures.leadInspectionDays']}), {"sellerFactPath":"disclosures.sellerReportsHoa","documentStatusPath":"disclosures.hoaDocumentsStatus","documentTypes":["maryland-association-documents"]});