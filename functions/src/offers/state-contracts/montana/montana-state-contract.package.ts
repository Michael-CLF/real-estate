import { isMontanaContractCompatible, type MontanaOwnershipFacts } from './montana-contract-selection';
import { montanaCondominiumReceiptProblem, montanaCondominiumAcceptanceProblem } from './montana-condominium-policy';
import { withHoaContractPolicy } from '../hoa-contract-policy';
import { withFederalLeadContractPolicy } from '../federal-lead-contract-policy';
import { assertListingContractScope } from '../listing-contract-scope';
import { assertMontanaListingDisclosures } from '../../montana-listing-disclosure-gate';
import { selectReceivedListingDisclosures } from '../received-listing-disclosures';
import { summaryFunding, summaryMoney, summaryText } from '../navstreet-pdf-layout';
import type { StateContractPackage } from '../state-contract-package';
import type { MontanaOfferTermsDocument } from './montana-offer-terms.document';
import { MONTANA_DOCUMENT_RULES } from './montana-document-rules';
import { createMontanaInitialOfferTerms } from './montana-initial-terms';
import { sanitizeMontanaDraftTerms } from './montana-draft-terms-sanitizer';
import { validateMontanaSubmission } from './montana-submission-validator';
import { HttpsError } from 'firebase-functions/v2/https';
import { createMontanaContractMilestones } from './montana-contract-milestones';
export const montanaStateContractPackage: StateContractPackage<MontanaOfferTermsDocument> = withHoaContractPolicy(withFederalLeadContractPolicy({
  assertListingContractCompatible: (listing, version) => {
    assertListingContractScope(montanaStateContractPackage, listing);
    const facts = (listing['sellerStatements'] as Record<string,unknown> | undefined)?.['contractFacts'] as MontanaOwnershipFacts | undefined;
    if (!isMontanaContractCompatible(version.terms.contractType, String(listing['propertyType']), facts)) throw new HttpsError('failed-precondition','The listing ownership requires a different Montana agreement. Start a new unsigned draft with the correct agreement.');
  },
  listingDisclosurePolicy: { reviewedVersions: ({version}) => version.terms.documentVersions, assertReady: assertMontanaListingDisclosures, assertCounterofferReady: assertMontanaListingDisclosures },
  stateCode: 'MT', offerCreationEnabled: true,
  requireOwnershipFacts:true,
  supportedPropertyTypes: ['single_family', 'townhome', 'pud', 'condo'],
  contractTypes: ['navstreet_montana_residential_sale_2026','navstreet_montana_condominium_resale_2026'], contractTypeRequired: true,
  defaultTimeZone: 'America/Denver',
  agreementTemplate: { stateCode: 'MT', templateUid: MONTANA_DOCUMENT_RULES.templateUid, templateName: 'NavStreet Montana Residential Purchase and Sale Agreement', templateVersion: MONTANA_DOCUMENT_RULES.version },
  agreementTemplates: [
    {stateCode:'MT',templateUid:MONTANA_DOCUMENT_RULES.templateUid,templateName:'NavStreet Montana Residential Purchase and Sale Agreement',templateVersion:MONTANA_DOCUMENT_RULES.version},
    {stateCode:'MT',templateUid:'navstreet-mt-condominium-2026',templateName:'NavStreet Montana Condominium Resale Purchase and Sale Agreement',templateVersion:'2026-10-22'},
    {stateCode:'MT',templateUid:'navstreet-mt-condominium-2026',templateName:'NavStreet Montana Condominium Resale Purchase and Sale Agreement',templateVersion:'2026-10-22.2'},
  ],
  getAgreementTemplate: terms => terms.contractType === 'navstreet_montana_condominium_resale_2026'
    ? {stateCode:'MT',templateUid:'navstreet-mt-condominium-2026',templateName:'NavStreet Montana Condominium Resale Purchase and Sale Agreement',templateVersion:terms.condominiumAcceptancePolicy === 'accept_during_review_v2' ? '2026-10-22.2' : '2026-10-22'}
    : montanaStateContractPackage.agreementTemplate,
  agreementEffectiveNotBefore: ({version}) => version.terms.condominiumAcceptancePolicy === 'accept_during_review_v2' && version.terms.contractType === 'navstreet_montana_condominium_resale_2026'
    ? new Date(Date.parse(version.terms.condominiumReceiptAt ?? '') + 72 * 60 * 60 * 1000) : undefined,
  createInitialOfferTerms: input => createMontanaInitialOfferTerms(input),
  sanitizeDraftTerms: input => sanitizeMontanaDraftTerms(input),
  validateSubmission: input => validateMontanaSubmission(input),
  validateBeforeSigning: ({ version, signerRole }) => {
    const issue = signerRole && signerRole !== version.initiatedBy
      ? montanaCondominiumAcceptanceProblem(version.terms) : montanaCondominiumReceiptProblem(version.terms);
    if (issue) throw new HttpsError('failed-precondition', issue);
    const { disclosures } = version.terms;
    if (disclosures.radonNoticeAcknowledged !== true) throw new HttpsError('failed-precondition','Read and acknowledge the Montana notices before signing.');
    if (!['received','exempt'].includes(disclosures.propertyConditionStatus)) throw new HttpsError('failed-precondition',"Review the seller statement or supported exception before submitting or signing.");
    if (disclosures.requiredKnownFacts && disclosures.statutoryPacketStatus !== 'received') throw new HttpsError('failed-precondition',"Review the required property records before submitting or signing.");
    if (disclosures.propertyConditionStatus === 'exempt' && !disclosures.disclosureExemptionClaimed) throw new HttpsError('failed-precondition',"A seller disclosure exception must match the supported listing exception.");
    if (
        
        disclosures.leadPaintStatus === 'pending') {
      throw new HttpsError('failed-precondition',
        'This Montana offer records required disclosures as not received. The seller must provide them, then the buyer must create and submit a new offer acknowledging actual receipt before either party signs.');
    }
  },
  requiredListingDisclosures: ({ version }) => selectReceivedListingDisclosures(version.terms.disclosures, [
      ['statutoryPacketStatus', 'montana-statutory-packet'],
      ['propertyConditionStatus', 'montana-seller-disclosure'],
      ['leadPaintStatus', 'lead-based-paint'],
      ['hoaDocumentsStatus', 'montana-association-documents'],    ]).concat(version.terms.disclosures.propertyConditionStatus === 'exempt' ? ['montana-seller-disclosure'] : []).concat(version.terms.disclosures.leadPaintStatus === 'exempt' ? ['lead-based-paint'] : []),
  createContractMilestones: input => createMontanaContractMilestones(input),
    getAgreementSummary: ({ version: { terms: t } }) => [
    ...summaryFunding(t.purchase.purchasePriceInCents, t.purchase.loanAmountInCents, t.purchase.financingType === 'cash'),
    { label: 'Funding', value: summaryText(t.purchase.financingType) },
    { label: 'Earnest money deposit', value: summaryMoney(t.purchase.hasEarnestMoney === false ? 0 : t.purchase.earnestMoneyInCents) },
    { label: 'Closing / settlement date', value: summaryText(t.deadlines.settlementDate) },
    { label: 'Inspection / due diligence', value: `${t.deadlines.inspectionPeriodDays} calendar days after Effective Date; see agreement counting rules` },
  ],
  generateAgreement: async input => {
    const { generateMontanaOfferPdf } = require('./montana-offer-pdf.service') as typeof import('./montana-offer-pdf.service');
    return generateMontanaOfferPdf(input);
  },
}, {values:{'disclosures.leadPaintStatus':'built_1978_or_later','disclosures.leadInspectionSelection':'unselected','disclosures.leadInspectionDays':10,'documentVersions.lead-based-paint':undefined},hiddenFields:['disclosures.leadPaintStatus','disclosures.leadInspectionSelection','disclosures.leadInspectionDays']}), {"sellerFactPath":"disclosures.sellerReportsHoa","documentStatusPath":"disclosures.hoaDocumentsStatus","documentTypes":["montana-association-documents"]});