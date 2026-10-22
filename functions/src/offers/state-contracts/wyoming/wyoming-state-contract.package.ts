import { isWyomingContractCompatible } from './wyoming-contract-selection';
import { withHoaContractPolicy } from '../hoa-contract-policy';
import { withFederalLeadContractPolicy } from '../federal-lead-contract-policy';
import { assertListingContractScope } from '../listing-contract-scope';
import { assertWyomingListingDisclosures } from '../../wyoming-listing-disclosure-gate';
import { selectReceivedListingDisclosures } from '../received-listing-disclosures';
import { summaryFunding, summaryMoney, summaryText } from '../navstreet-pdf-layout';
import type { StateContractPackage } from '../state-contract-package';
import type { WyomingOfferTermsDocument } from './wyoming-offer-terms.document';
import { WYOMING_DOCUMENT_RULES } from './wyoming-document-rules';
import { createWyomingInitialOfferTerms } from './wyoming-initial-terms';
import { sanitizeWyomingDraftTerms } from './wyoming-draft-terms-sanitizer';
import { validateWyomingSubmission } from './wyoming-submission-validator';
import { HttpsError } from 'firebase-functions/v2/https';
import { createWyomingContractMilestones } from './wyoming-contract-milestones';
export const wyomingStateContractPackage: StateContractPackage<WyomingOfferTermsDocument> = withHoaContractPolicy(withFederalLeadContractPolicy({
  assertListingContractCompatible: (listing,version) => { assertListingContractScope(wyomingStateContractPackage,listing); if (!isWyomingContractCompatible(version.terms.contractType,String(listing['propertyType']),(listing['sellerStatements'] as Record<string,any> | undefined)?.['contractFacts'])) throw new HttpsError('failed-precondition','The ownership facts require a different agreement. Start a new unsigned offer using the current listing.'); },
  listingDisclosurePolicy: { assertReady: assertWyomingListingDisclosures, assertCounterofferReady: assertWyomingListingDisclosures, reviewedVersions: ({version}) => version.terms.documentVersions },
  stateCode: 'WY', offerCreationEnabled: true,
  requireOwnershipFacts:true,
  supportedPropertyTypes: ['single_family', 'townhome', 'pud', 'condo'],
  contractTypes: ['navstreet_wyoming_residential_sale_2026','navstreet_wyoming_condominium_resale_2026'], contractTypeRequired: true,
  defaultTimeZone: 'America/Denver',
  agreementTemplate: { stateCode: 'WY', templateUid: WYOMING_DOCUMENT_RULES.templateUid, templateName: 'NavStreet Wyoming Residential Purchase and Sale Agreement', templateVersion: WYOMING_DOCUMENT_RULES.version },
  agreementTemplates: [{stateCode:'WY',templateUid:WYOMING_DOCUMENT_RULES.templateUid,templateName:'NavStreet Wyoming Residential Purchase and Sale Agreement',templateVersion:WYOMING_DOCUMENT_RULES.version},{stateCode:'WY',templateUid:'navstreet-wy-condominium-2026',templateName:'NavStreet Wyoming Condominium Resale Purchase and Sale Agreement',templateVersion:'2026-10-22'},{stateCode:'WY',templateUid:'navstreet-wy-residential-2026',templateName:'NavStreet Wyoming Residential Purchase and Sale Agreement',templateVersion:'2026-10-22'}],
  getAgreementTemplate: terms => terms.contractType === 'navstreet_wyoming_condominium_resale_2026' ? {stateCode:'WY',templateUid:'navstreet-wy-condominium-2026',templateName:'NavStreet Wyoming Condominium Resale Purchase and Sale Agreement',templateVersion:'2026-10-22'} : terms.documentVersions !== undefined ? {...wyomingStateContractPackage.agreementTemplate,templateVersion:'2026-10-22'} : wyomingStateContractPackage.agreementTemplate,
  createInitialOfferTerms: input => createWyomingInitialOfferTerms(input),
  sanitizeDraftTerms: input => sanitizeWyomingDraftTerms(input),
  validateSubmission: input => validateWyomingSubmission(input),
  validateBeforeSigning: ({ version }) => {
    const { disclosures } = version.terms;
    if (!disclosures.radonNoticeAcknowledged) throw new HttpsError('failed-precondition','Review the state notices before signing.');
    if (disclosures.requiredKnownFacts && disclosures.statutoryPacketStatus !== 'received') throw new HttpsError("failed-precondition","Review the applicable required property notice before submitting or signing.");
    if (
        
        disclosures.leadPaintStatus === 'pending') {
      throw new HttpsError('failed-precondition',
        'This Wyoming offer records required disclosures as not received. The seller must provide them, then the buyer must create and submit a new offer acknowledging actual receipt before either party signs.');
    }
  },
  requiredListingDisclosures: ({ version }) => selectReceivedListingDisclosures(version.terms.disclosures, [
      ['statutoryPacketStatus', 'wyoming-statutory-packet'],
      ['propertyConditionStatus', 'wyoming-seller-disclosure'],
      ['leadPaintStatus', 'lead-based-paint'],
      ['hoaDocumentsStatus', 'wyoming-association-documents'],    ]).concat(version.terms.disclosures.propertyConditionStatus === 'exempt' ? ['wyoming-seller-disclosure'] : []).concat(version.terms.disclosures.leadPaintStatus === 'exempt' ? ['lead-based-paint'] : []),
  createContractMilestones: input => createWyomingContractMilestones(input),
    getAgreementSummary: ({ version: { terms: t } }) => [
    ...summaryFunding(t.purchase.purchasePriceInCents, t.purchase.loanAmountInCents, t.purchase.financingType === 'cash'),
    { label: 'Funding', value: summaryText(t.purchase.financingType) },
    { label: 'Earnest money deposit', value: summaryMoney(t.purchase.hasEarnestMoney === false ? 0 : t.purchase.earnestMoneyInCents) },
    { label: 'Closing / settlement date', value: summaryText(t.deadlines.settlementDate) },
    { label: 'Inspection / due diligence', value: `${t.deadlines.inspectionPeriodDays} calendar days after Effective Date; see agreement counting rules` },
  ],
  generateAgreement: async input => {
    const { generateWyomingOfferPdf } = require('./wyoming-offer-pdf.service') as typeof import('./wyoming-offer-pdf.service');
    return generateWyomingOfferPdf(input);
  },
}, {values:{'disclosures.leadPaintStatus':'built_1978_or_later','disclosures.leadInspectionSelection':'unselected','disclosures.leadInspectionDays':10,'documentVersions.lead-based-paint':undefined},hiddenFields:['disclosures.leadPaintStatus','disclosures.leadInspectionSelection','disclosures.leadInspectionDays']}), {"sellerFactPath":"disclosures.sellerReportsHoa","documentStatusPath":"disclosures.hoaDocumentsStatus","documentTypes":["wyoming-association-documents"]});