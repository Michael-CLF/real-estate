import { iowaPreofferReceiptProblem, iowaLateReceiptsCover } from './iowa-disclosure-policy';
import { withHoaContractPolicy } from '../hoa-contract-policy';
import { withFederalLeadContractPolicy } from '../federal-lead-contract-policy';
import { assertListingContractScope } from '../listing-contract-scope';
import { assertIowaListingDisclosures } from '../../iowa-listing-disclosure-gate';
import { selectReceivedListingDisclosures } from '../received-listing-disclosures';
import { summaryFunding, summaryMoney, summaryText } from '../navstreet-pdf-layout';
import type { StateContractPackage } from '../state-contract-package';
import type { IowaOfferTermsDocument } from './iowa-offer-terms.document';
import { IOWA_DOCUMENT_RULES } from './iowa-document-rules';
import { createIowaInitialOfferTerms } from './iowa-initial-terms';
import { sanitizeIowaDraftTerms } from './iowa-draft-terms-sanitizer';
import { validateIowaSubmission } from './iowa-submission-validator';
import { HttpsError } from 'firebase-functions/v2/https';
import { createIowaContractMilestones } from './iowa-contract-milestones';
export const iowaStateContractPackage: StateContractPackage<IowaOfferTermsDocument> = withHoaContractPolicy(withFederalLeadContractPolicy({
  assertListingContractCompatible: listing => assertListingContractScope(iowaStateContractPackage, listing),
  listingDisclosurePolicy: { assertReady: assertIowaListingDisclosures, assertCounterofferReady: assertIowaListingDisclosures, reviewedVersions: ({version}) => version.terms.documentVersions },
  stateCode: 'IA', offerCreationEnabled: true,
  requireOwnershipFacts:true,
  supportedPropertyTypes: ['single_family', 'townhome', 'pud'],
  contractTypes: ['navstreet_iowa_residential_sale_2026'], contractTypeRequired: true,
  defaultTimeZone: 'America/Chicago',
  agreementTemplate: { stateCode: 'IA', templateUid: IOWA_DOCUMENT_RULES.templateUid, templateName: 'NavStreet Iowa Residential Purchase and Sale Agreement', templateVersion: IOWA_DOCUMENT_RULES.version },
  getAgreementTemplate: terms => terms.disclosurePolicyRevision ? {...iowaStateContractPackage.agreementTemplate, templateVersion:'2026-10-22'} : iowaStateContractPackage.agreementTemplate,
  createInitialOfferTerms: input => createIowaInitialOfferTerms(input),
  sanitizeDraftTerms: input => sanitizeIowaDraftTerms(input),
  validateSubmission: input => validateIowaSubmission(input),
  validateBeforeSigning: ({ offer, version, signerRole }) => {
    const problem = iowaPreofferReceiptProblem(version.terms);
    if (problem) throw new HttpsError('failed-precondition', problem);
    const { disclosures } = version.terms;
    if (signerRole !== 'buyer' && !iowaLateReceiptsCover(offer, version.buyers, version.terms) && (!['received','exempt'].includes(disclosures.propertyConditionStatus) || (disclosures.requiredKnownFacts && disclosures.statutoryPacketStatus !== 'received'))) throw new HttpsError('failed-precondition',"This saved Iowa version records required disclosure receipt as pending. Its signed answers cannot be rewritten. Actual later delivery and written buyer acknowledgement must be documented separately before seller acceptance or a seller counteroffer.");
    if (disclosures.radonNoticeAcknowledged !== true) throw new HttpsError('failed-precondition','Read and acknowledge the Iowa notices before signing.');
    if (disclosures.propertyConditionStatus === 'exempt' && !disclosures.disclosureExemptionClaimed) throw new HttpsError('failed-precondition',"A seller disclosure exception must match the supported listing exception.");
    if (
        
        disclosures.leadPaintStatus === 'pending') {
      throw new HttpsError('failed-precondition',
        'This Iowa offer records required disclosures as not received. The seller must provide them, then the buyer must create and submit a new offer acknowledging actual receipt before either party signs.');
    }
  },
  requiredListingDisclosures: ({ version }) => selectReceivedListingDisclosures(version.terms.disclosures, [
      ['statutoryPacketStatus', 'iowa-statutory-packet'],
      ['propertyConditionStatus', 'iowa-seller-disclosure'],
      ['leadPaintStatus', 'lead-based-paint'],
      ['hoaDocumentsStatus', 'iowa-association-documents'],    ]).concat(version.terms.disclosures.propertyConditionStatus === 'exempt' ? ['iowa-seller-disclosure'] : []).concat(version.terms.disclosures.leadPaintStatus === 'exempt' ? ['lead-based-paint'] : []),
  createContractMilestones: input => createIowaContractMilestones(input),
    getAgreementSummary: ({ version: { terms: t } }) => [
    ...summaryFunding(t.purchase.purchasePriceInCents, t.purchase.loanAmountInCents, t.purchase.financingType === 'cash'),
    { label: 'Funding', value: summaryText(t.purchase.financingType) },
    { label: 'Earnest money deposit', value: summaryMoney(t.purchase.hasEarnestMoney === false ? 0 : t.purchase.earnestMoneyInCents) },
    { label: 'Closing / settlement date', value: summaryText(t.deadlines.settlementDate) },
    { label: 'Inspection / due diligence', value: `${t.deadlines.inspectionPeriodDays} calendar days after Effective Date; see agreement counting rules` },
  ],
  generateAgreement: async input => {
    const { generateIowaOfferPdf } = require('./iowa-offer-pdf.service') as typeof import('./iowa-offer-pdf.service');
    return generateIowaOfferPdf(input);
  },
}, {values:{'disclosures.leadPaintStatus':'built_1978_or_later','disclosures.leadInspectionSelection':'unselected','disclosures.leadInspectionDays':10,'documentVersions.lead-based-paint':undefined},hiddenFields:['disclosures.leadPaintStatus','disclosures.leadInspectionSelection','disclosures.leadInspectionDays']}), {"sellerFactPath":"disclosures.sellerReportsHoa","documentStatusPath":"disclosures.hoaDocumentsStatus","documentTypes":["iowa-association-documents"]});