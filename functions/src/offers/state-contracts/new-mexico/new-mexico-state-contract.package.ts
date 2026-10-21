import { withHoaContractPolicy } from '../hoa-contract-policy';
import { withFederalLeadContractPolicy } from '../federal-lead-contract-policy';
import { assertListingContractScope } from '../listing-contract-scope';
import { assertNewMexicoListingDisclosures } from '../../new-mexico-listing-disclosure-gate';
import { selectReceivedListingDisclosures } from '../received-listing-disclosures';
import { summaryFunding, summaryMoney, summaryText } from '../navstreet-pdf-layout';
import type { StateContractPackage } from '../state-contract-package';
import type { NewMexicoOfferTermsDocument } from './new-mexico-offer-terms.document';
import { NEW_MEXICO_DOCUMENT_RULES } from './new-mexico-document-rules';
import { createNewMexicoInitialOfferTerms } from './new-mexico-initial-terms';
import { sanitizeNewMexicoDraftTerms } from './new-mexico-draft-terms-sanitizer';
import { validateNewMexicoSubmission } from './new-mexico-submission-validator';
import { HttpsError } from 'firebase-functions/v2/https';
import { createNewMexicoContractMilestones } from './new-mexico-contract-milestones';
export const newMexicoStateContractPackage: StateContractPackage<NewMexicoOfferTermsDocument> = withHoaContractPolicy(withFederalLeadContractPolicy({
  assertListingContractCompatible: listing => assertListingContractScope(newMexicoStateContractPackage, listing),
  listingDisclosurePolicy: { assertReady: assertNewMexicoListingDisclosures },
  stateCode: 'NM', offerCreationEnabled: true,
  requireOwnershipFacts:true,
  supportedPropertyTypes: ['single_family', 'townhome', 'pud'],
  contractTypes: ['navstreet_new_mexico_residential_sale_2026'], contractTypeRequired: true,
  defaultTimeZone: 'America/Denver',
  agreementTemplate: { stateCode: 'NM', templateUid: NEW_MEXICO_DOCUMENT_RULES.templateUid, templateName: 'NavStreet New Mexico Residential Purchase and Sale Agreement', templateVersion: NEW_MEXICO_DOCUMENT_RULES.version },
  createInitialOfferTerms: input => createNewMexicoInitialOfferTerms(input),
  sanitizeDraftTerms: input => sanitizeNewMexicoDraftTerms(input),
  validateSubmission: input => validateNewMexicoSubmission(input),
  validateBeforeSigning: ({ version, signerRole }) => {
    const { disclosures } = version.terms;
    if (!disclosures.radonNoticeAcknowledged) throw new HttpsError('failed-precondition','Review the state notices before signing.');
    if (signerRole !== "buyer" && (disclosures.statutoryPacketStatus !== 'received')) throw new HttpsError("failed-precondition","New Mexico county assessor tax-levy estimate and buyer receipt are required before seller acceptance. If this immutable offer records Pending, deliver the document and have the buyer create a replacement offer acknowledging receipt.");
    if (disclosures.requiredKnownFacts && disclosures.statutoryPacketStatus !== 'received') throw new HttpsError("failed-precondition","Review the applicable required property notice before submitting or signing.");
    if (
        
        disclosures.leadPaintStatus === 'pending') {
      throw new HttpsError('failed-precondition',
        'This New Mexico offer records required disclosures as not received. The seller must provide them, then the buyer must create and submit a new offer acknowledging actual receipt before either party signs.');
    }
  },
  requiredListingDisclosures: ({ version }) => selectReceivedListingDisclosures(version.terms.disclosures, [
      ['statutoryPacketStatus', 'new-mexico-statutory-packet'],
      ['propertyConditionStatus', 'new-mexico-seller-disclosure'],
      ['leadPaintStatus', 'lead-based-paint'],
      ['hoaDocumentsStatus', 'new-mexico-association-documents'],    ]).concat(version.terms.disclosures.propertyConditionStatus === 'exempt' ? ['new-mexico-seller-disclosure'] : []).concat(version.terms.disclosures.leadPaintStatus === 'exempt' ? ['lead-based-paint'] : []),
  createContractMilestones: input => createNewMexicoContractMilestones(input),
    getAgreementSummary: ({ version: { terms: t } }) => [
    ...summaryFunding(t.purchase.purchasePriceInCents, t.purchase.loanAmountInCents, t.purchase.financingType === 'cash'),
    { label: 'Funding', value: summaryText(t.purchase.financingType) },
    { label: 'Earnest money deposit', value: summaryMoney(t.purchase.hasEarnestMoney === false ? 0 : t.purchase.earnestMoneyInCents) },
    { label: 'Closing / settlement date', value: summaryText(t.deadlines.settlementDate) },
    { label: 'Inspection / due diligence', value: `${t.deadlines.inspectionPeriodDays} calendar days after Effective Date; see agreement counting rules` },
  ],
  generateAgreement: async input => {
    const { generateNewMexicoOfferPdf } = require('./new-mexico-offer-pdf.service') as typeof import('./new-mexico-offer-pdf.service');
    return generateNewMexicoOfferPdf(input);
  },
}, {values:{'disclosures.leadPaintStatus':'built_1978_or_later','disclosures.leadInspectionSelection':'unselected','disclosures.leadInspectionDays':10,'documentVersions.lead-based-paint':undefined},hiddenFields:['disclosures.leadPaintStatus','disclosures.leadInspectionSelection','disclosures.leadInspectionDays']}), {"sellerFactPath":"disclosures.sellerReportsHoa","documentStatusPath":"disclosures.hoaDocumentsStatus","documentTypes":["new-mexico-association-documents"]});