import { HOA_POLICY, FEDERAL_LEAD_POLICY } from './new-mexico-policy-mappings.generated';
import { isNewMexicoContractCompatible } from './new-mexico-contract-selection';
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
  assertListingContractCompatible: (listing,version) => { assertListingContractScope(newMexicoStateContractPackage,listing); if (!isNewMexicoContractCompatible(version.terms.contractType,String(listing['propertyType']),(listing['sellerStatements'] as Record<string,any> | undefined)?.['contractFacts'])) throw new HttpsError('failed-precondition','The ownership facts require a different agreement. Start a new unsigned offer using the current listing.'); },
  listingDisclosurePolicy: { assertReady: assertNewMexicoListingDisclosures, assertCounterofferReady: assertNewMexicoListingDisclosures, reviewedVersions: ({version}) => version.terms.documentVersions },
  stateCode: 'NM', offerCreationEnabled: true,
  requireOwnershipFacts:true,
  supportedPropertyTypes: ['single_family', 'townhome', 'pud', 'condo'],
  contractTypes: ['navstreet_new_mexico_residential_sale_2026','navstreet_new_mexico_condominium_resale_2026'], contractTypeRequired: true,
  defaultTimeZone: 'America/Denver',
  agreementTemplate: { stateCode: 'NM', templateUid: NEW_MEXICO_DOCUMENT_RULES.templateUid, templateName: 'NavStreet New Mexico Residential Purchase and Sale Agreement', templateVersion: NEW_MEXICO_DOCUMENT_RULES.version },
  agreementTemplates: [{stateCode:'NM',templateUid:NEW_MEXICO_DOCUMENT_RULES.templateUid,templateName:'NavStreet New Mexico Residential Purchase and Sale Agreement',templateVersion:NEW_MEXICO_DOCUMENT_RULES.version},{stateCode:'NM',templateUid:'navstreet-nm-condominium-2026',templateName:'NavStreet New Mexico Condominium Resale Purchase and Sale Agreement',templateVersion:'2026-10-22'},{stateCode:'NM',templateUid:'navstreet-nm-residential-2026',templateName:'NavStreet New Mexico Residential Purchase and Sale Agreement',templateVersion:'2026-10-22'}],
  getAgreementTemplate: terms => terms.contractType === 'navstreet_new_mexico_condominium_resale_2026' ? {stateCode:'NM',templateUid:'navstreet-nm-condominium-2026',templateName:'NavStreet New Mexico Condominium Resale Purchase and Sale Agreement',templateVersion:'2026-10-22'} : terms.documentVersions !== undefined ? {...newMexicoStateContractPackage.agreementTemplate,templateVersion:'2026-10-22'} : newMexicoStateContractPackage.agreementTemplate,
  createInitialOfferTerms: input => createNewMexicoInitialOfferTerms(input),
  sanitizeDraftTerms: input => sanitizeNewMexicoDraftTerms(input),
  validateSubmission: input => validateNewMexicoSubmission(input),
  validateBeforeSigning: ({ version, signerRole }) => {
    const { disclosures } = version.terms;
    if (disclosures.taxEstimateUnavailable && disclosures.taxEstimateWaived !== true) throw new HttpsError("failed-precondition","The buyer must sign the statutory tax estimate waiver before making the offer.");
    if (!disclosures.radonNoticeAcknowledged) throw new HttpsError('failed-precondition','Review the state notices before signing.');
    if (signerRole !== "buyer" && (disclosures.statutoryPacketStatus !== 'received')) throw new HttpsError("failed-precondition","New Mexico county assessor tax-levy estimate and buyer receipt are required before seller acceptance. Review the uploaded required document before submitting the offer.");
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
}, FEDERAL_LEAD_POLICY), HOA_POLICY);