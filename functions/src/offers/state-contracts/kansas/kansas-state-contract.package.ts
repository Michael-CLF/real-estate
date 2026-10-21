import { withHoaContractPolicy } from '../hoa-contract-policy';
import { withFederalLeadContractPolicy } from '../federal-lead-contract-policy';
import { assertListingContractScope } from '../listing-contract-scope';
import { assertKansasListingDisclosures } from '../../kansas-listing-disclosure-gate';
import { selectReceivedListingDisclosures } from '../received-listing-disclosures';
import { summaryFunding, summaryMoney, summaryText } from '../navstreet-pdf-layout';
import type { StateContractPackage } from '../state-contract-package';
import type { KansasOfferTermsDocument } from './kansas-offer-terms.document';
import { KANSAS_DOCUMENT_RULES } from './kansas-document-rules';
import { createKansasInitialOfferTerms } from './kansas-initial-terms';
import { sanitizeKansasDraftTerms } from './kansas-draft-terms-sanitizer';
import { validateKansasSubmission } from './kansas-submission-validator';
import { HttpsError } from 'firebase-functions/v2/https';
import { createKansasContractMilestones } from './kansas-contract-milestones';
export const kansasStateContractPackage: StateContractPackage<KansasOfferTermsDocument> = withHoaContractPolicy(withFederalLeadContractPolicy({
  assertListingContractCompatible: listing => assertListingContractScope(kansasStateContractPackage, listing),
  listingDisclosurePolicy: { assertReady: assertKansasListingDisclosures },
  stateCode: 'KS', offerCreationEnabled: true,
  requireOwnershipFacts:true,
  supportedPropertyTypes: ['single_family', 'townhome', 'pud'],
  contractTypes: ['navstreet_kansas_residential_sale_2026'], contractTypeRequired: true,
  defaultTimeZone: 'America/Chicago',
  agreementTemplate: { stateCode: 'KS', templateUid: KANSAS_DOCUMENT_RULES.templateUid, templateName: 'NavStreet Kansas Residential Purchase and Sale Agreement', templateVersion: KANSAS_DOCUMENT_RULES.version },
  createInitialOfferTerms: input => createKansasInitialOfferTerms(input),
  sanitizeDraftTerms: input => sanitizeKansasDraftTerms(input),
  validateSubmission: input => validateKansasSubmission(input),
  validateBeforeSigning: ({ version }) => {
    const { disclosures } = version.terms;
    if (disclosures.requiredKnownFacts && disclosures.statutoryPacketStatus !== 'received') throw new HttpsError('failed-precondition','Review the required Kansas disclosure before signing.');
    if (
        
        disclosures.leadPaintStatus === 'pending') {
      throw new HttpsError('failed-precondition',
        'This Kansas offer records required disclosures as not received. The seller must provide them, then the buyer must create and submit a new offer acknowledging actual receipt before either party signs.');
    }
  },
  requiredListingDisclosures: ({ version }) => selectReceivedListingDisclosures(version.terms.disclosures, [
      ['statutoryPacketStatus', 'kansas-statutory-packet'],
      ['propertyConditionStatus', 'kansas-seller-disclosure'],
      ['leadPaintStatus', 'lead-based-paint'],
      ['hoaDocumentsStatus', 'kansas-association-documents'],    ]).concat(version.terms.disclosures.propertyConditionStatus === 'exempt' ? ['kansas-seller-disclosure'] : []).concat(version.terms.disclosures.leadPaintStatus === 'exempt' ? ['lead-based-paint'] : []),
  createContractMilestones: input => createKansasContractMilestones(input),
    getAgreementSummary: ({ version: { terms: t } }) => [
    ...summaryFunding(t.purchase.purchasePriceInCents, t.purchase.loanAmountInCents, t.purchase.financingType === 'cash'),
    { label: 'Funding', value: summaryText(t.purchase.financingType) },
    { label: 'Earnest money deposit', value: summaryMoney(t.purchase.hasEarnestMoney === false ? 0 : t.purchase.earnestMoneyInCents) },
    { label: 'Closing / settlement date', value: summaryText(t.deadlines.settlementDate) },
    { label: 'Inspection / due diligence', value: `${t.deadlines.inspectionPeriodDays} calendar days after Effective Date; see agreement counting rules` },
  ],
  generateAgreement: async input => {
    const { generateKansasOfferPdf } = require('./kansas-offer-pdf.service') as typeof import('./kansas-offer-pdf.service');
    return generateKansasOfferPdf(input);
  },
}, {values:{'disclosures.leadPaintStatus':'built_1978_or_later','disclosures.leadInspectionSelection':'unselected','disclosures.leadInspectionDays':10,'documentVersions.lead-based-paint':undefined},hiddenFields:['disclosures.leadPaintStatus','disclosures.leadInspectionSelection','disclosures.leadInspectionDays']}), {"sellerFactPath":"disclosures.sellerReportsHoa","documentStatusPath":"disclosures.hoaDocumentsStatus","documentTypes":["kansas-association-documents"]});