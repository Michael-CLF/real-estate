import { HOA_POLICY, FEDERAL_LEAD_POLICY } from './alaska-policy-mappings.generated';
import {alaskaSubmissionReceiptProblem} from './alaska-disclosure-policy';
import { isAlaskaContractCompatible } from './alaska-contract-selection';
import { withHoaContractPolicy } from '../hoa-contract-policy';
import { withFederalLeadContractPolicy } from '../federal-lead-contract-policy';
import { assertListingContractScope } from '../listing-contract-scope';
import { assertAlaskaListingDisclosures } from '../../alaska-listing-disclosure-gate';
import { selectReceivedListingDisclosures } from '../received-listing-disclosures';
import { summaryFunding, summaryMoney, summaryText } from '../navstreet-pdf-layout';
import type { StateContractPackage } from '../state-contract-package';
import type { AlaskaOfferTermsDocument } from './alaska-offer-terms.document';
import { ALASKA_DOCUMENT_RULES } from './alaska-document-rules';
import { createAlaskaInitialOfferTerms } from './alaska-initial-terms';
import { sanitizeAlaskaDraftTerms } from './alaska-draft-terms-sanitizer';
import { validateAlaskaSubmission } from './alaska-submission-validator';
import { HttpsError } from 'firebase-functions/v2/https';
import { createAlaskaContractMilestones } from './alaska-contract-milestones';
export const alaskaStateContractPackage: StateContractPackage<AlaskaOfferTermsDocument> = withHoaContractPolicy(withFederalLeadContractPolicy({
  assertListingContractCompatible: (listing,version) => { assertListingContractScope(alaskaStateContractPackage,listing); if (!isAlaskaContractCompatible(version.terms.contractType,String(listing['propertyType']),(listing['sellerStatements'] as Record<string,any> | undefined)?.['contractFacts'])) throw new HttpsError('failed-precondition','The ownership facts require a different agreement. Start a new unsigned offer using the current listing.'); },
  listingDisclosurePolicy: { assertReady: assertAlaskaListingDisclosures, assertCounterofferReady: assertAlaskaListingDisclosures, reviewedVersions: ({version}) => version.terms.documentVersions },
  stateCode: 'AK', offerCreationEnabled: true,
  requireOwnershipFacts:true,
  supportedPropertyTypes: ['single_family', 'townhome', 'pud', 'condo'],
  contractTypes: ['navstreet_alaska_residential_sale_2026','navstreet_alaska_condominium_resale_2026'], contractTypeRequired: true,
  defaultTimeZone: 'America/Anchorage',
  agreementTemplate: { stateCode: 'AK', templateUid: ALASKA_DOCUMENT_RULES.templateUid, templateName: 'NavStreet Alaska Residential Purchase and Sale Agreement', templateVersion: ALASKA_DOCUMENT_RULES.version },
  agreementTemplates: [{stateCode:'AK',templateUid:ALASKA_DOCUMENT_RULES.templateUid,templateName:'NavStreet Alaska Residential Purchase and Sale Agreement',templateVersion:ALASKA_DOCUMENT_RULES.version},{stateCode:'AK',templateUid:'navstreet-ak-condominium-2026',templateName:'NavStreet Alaska Condominium Resale Purchase and Sale Agreement',templateVersion:'2026-10-25'}],
  getAgreementTemplate: terms => terms.contractType === 'navstreet_alaska_condominium_resale_2026' ? {stateCode:'AK',templateUid:'navstreet-ak-condominium-2026',templateName:'NavStreet Alaska Condominium Resale Purchase and Sale Agreement',templateVersion:'2026-10-25'} : terms.documentVersions !== undefined ? {...alaskaStateContractPackage.agreementTemplate,templateVersion:'2026-10-25'} : alaskaStateContractPackage.agreementTemplate,
  createInitialOfferTerms: input => createAlaskaInitialOfferTerms(input),
  sanitizeDraftTerms: input => sanitizeAlaskaDraftTerms(input),
  validateSubmission: input => validateAlaskaSubmission(input),
  validateBeforeSigning: (input) => {const issue=alaskaSubmissionReceiptProblem(input.version.terms);if(issue)throw new HttpsError('failed-precondition',issue);},
  requiredListingDisclosures: ({ version }) => selectReceivedListingDisclosures(version.terms.disclosures, [
      ['statutoryPacketStatus', 'alaska-statutory-packet'],
      ['propertyConditionStatus', 'alaska-seller-disclosure'],
      ['leadPaintStatus', 'lead-based-paint'],
      ['hoaDocumentsStatus', 'alaska-association-documents'],    ]).concat(version.terms.disclosures.propertyConditionStatus === 'exempt' ? ['alaska-seller-disclosure'] : []).concat(version.terms.disclosures.leadPaintStatus === 'exempt' ? ['lead-based-paint'] : []),
  createContractMilestones: input => createAlaskaContractMilestones(input),
    getAgreementSummary: ({ version: { terms: t } }) => [
    ...summaryFunding(t.purchase.purchasePriceInCents, t.purchase.loanAmountInCents, t.purchase.financingType === 'cash'),
    { label: 'Funding', value: summaryText(t.purchase.financingType) },
    { label: 'Earnest money deposit', value: summaryMoney(t.purchase.hasEarnestMoney === false ? 0 : t.purchase.earnestMoneyInCents) },
    { label: 'Closing / settlement date', value: summaryText(t.deadlines.settlementDate) },
    { label: 'Inspection / due diligence', value: `${t.deadlines.inspectionPeriodDays} calendar days after Effective Date; see agreement counting rules` },
  ],
  generateAgreement: async input => {
    const { generateAlaskaOfferPdf } = require('./alaska-offer-pdf.service') as typeof import('./alaska-offer-pdf.service');
    return generateAlaskaOfferPdf(input);
  },
}, FEDERAL_LEAD_POLICY), HOA_POLICY);
