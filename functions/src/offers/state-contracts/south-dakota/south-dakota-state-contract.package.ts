import { withHoaContractPolicy } from '../hoa-contract-policy';
import { withFederalLeadContractPolicy } from '../federal-lead-contract-policy';
import { assertListingContractScope } from '../listing-contract-scope';
import { assertSouthDakotaListingDisclosures } from '../../south-dakota-listing-disclosure-gate';
import { selectReceivedListingDisclosures } from '../received-listing-disclosures';
import { summaryFunding, summaryMoney, summaryText } from '../navstreet-pdf-layout';
import type { StateContractPackage } from '../state-contract-package';
import type { SouthDakotaOfferTermsDocument } from './south-dakota-offer-terms.document';
import { SOUTH_DAKOTA_DOCUMENT_RULES } from './south-dakota-document-rules';
import { createSouthDakotaInitialOfferTerms } from './south-dakota-initial-terms';
import { sanitizeSouthDakotaDraftTerms } from './south-dakota-draft-terms-sanitizer';
import { validateSouthDakotaSubmission } from './south-dakota-submission-validator';
import { HttpsError } from 'firebase-functions/v2/https';
import { createSouthDakotaContractMilestones } from './south-dakota-contract-milestones';
export const southDakotaStateContractPackage: StateContractPackage<SouthDakotaOfferTermsDocument> = withHoaContractPolicy(withFederalLeadContractPolicy({
  assertListingContractCompatible: listing => assertListingContractScope(southDakotaStateContractPackage, listing),
  listingDisclosurePolicy: { assertReady: assertSouthDakotaListingDisclosures },
  stateCode: 'SD', offerCreationEnabled: true,
  requireOwnershipFacts:true,
  supportedPropertyTypes: ['single_family', 'townhome', 'pud'],
  contractTypes: ['navstreet_south_dakota_residential_sale_2026'], contractTypeRequired: true,
  defaultTimeZone: 'America/Chicago',
  agreementTemplate: { stateCode: 'SD', templateUid: SOUTH_DAKOTA_DOCUMENT_RULES.templateUid, templateName: 'NavStreet South Dakota Residential Purchase and Sale Agreement', templateVersion: SOUTH_DAKOTA_DOCUMENT_RULES.version },
  createInitialOfferTerms: input => createSouthDakotaInitialOfferTerms(input),
  sanitizeDraftTerms: input => sanitizeSouthDakotaDraftTerms(input),
  validateSubmission: input => validateSouthDakotaSubmission(input),
  validateBeforeSigning: ({ version }) => {
    const { disclosures } = version.terms;
    if (!disclosures.radonNoticeAcknowledged) throw new HttpsError('failed-precondition','Review the state notices before signing.');
    if (disclosures.sellerReportsHoa && disclosures.hoaDocumentsStatus !== 'received') throw new HttpsError("failed-precondition","Review the South Dakota HOA packet before the written offer.");
    if (!['received','exempt'].includes(disclosures.propertyConditionStatus)) throw new HttpsError("failed-precondition","Review the South Dakota condition statement or supported exception before the written offer.");
    if (disclosures.propertyConditionStatus === 'exempt' && !disclosures.disclosureExemptionClaimed) throw new HttpsError("failed-precondition","A disclosure exception must match supported seller evidence.");
    if (disclosures.requiredKnownFacts && disclosures.statutoryPacketStatus !== 'received') throw new HttpsError("failed-precondition","Review the applicable required property notice before submitting or signing.");
    if (
        
        disclosures.leadPaintStatus === 'pending') {
      throw new HttpsError('failed-precondition',
        'This South Dakota offer records required disclosures as not received. The seller must provide them, then the buyer must create and submit a new offer acknowledging actual receipt before either party signs.');
    }
  },
  requiredListingDisclosures: ({ version }) => selectReceivedListingDisclosures(version.terms.disclosures, [
      ['statutoryPacketStatus', 'south-dakota-statutory-packet'],
      ['propertyConditionStatus', 'south-dakota-seller-disclosure'],
      ['leadPaintStatus', 'lead-based-paint'],
      ['hoaDocumentsStatus', 'south-dakota-association-documents'],    ]).concat(version.terms.disclosures.propertyConditionStatus === 'exempt' ? ['south-dakota-seller-disclosure'] : []).concat(version.terms.disclosures.leadPaintStatus === 'exempt' ? ['lead-based-paint'] : []),
  createContractMilestones: input => createSouthDakotaContractMilestones(input),
    getAgreementSummary: ({ version: { terms: t } }) => [
    ...summaryFunding(t.purchase.purchasePriceInCents, t.purchase.loanAmountInCents, t.purchase.financingType === 'cash'),
    { label: 'Funding', value: summaryText(t.purchase.financingType) },
    { label: 'Earnest money deposit', value: summaryMoney(t.purchase.hasEarnestMoney === false ? 0 : t.purchase.earnestMoneyInCents) },
    { label: 'Closing / settlement date', value: summaryText(t.deadlines.settlementDate) },
    { label: 'Inspection / due diligence', value: `${t.deadlines.inspectionPeriodDays} calendar days after Effective Date; see agreement counting rules` },
  ],
  generateAgreement: async input => {
    const { generateSouthDakotaOfferPdf } = require('./south-dakota-offer-pdf.service') as typeof import('./south-dakota-offer-pdf.service');
    return generateSouthDakotaOfferPdf(input);
  },
}, {values:{'disclosures.leadPaintStatus':'built_1978_or_later','disclosures.leadInspectionSelection':'unselected','disclosures.leadInspectionDays':10,'documentVersions.lead-based-paint':undefined},hiddenFields:['disclosures.leadPaintStatus','disclosures.leadInspectionSelection','disclosures.leadInspectionDays']}), {"sellerFactPath":"disclosures.sellerReportsHoa","documentStatusPath":"disclosures.hoaDocumentsStatus","documentTypes":["south-dakota-association-documents"]});