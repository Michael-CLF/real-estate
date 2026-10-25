import { HOA_POLICY, FEDERAL_LEAD_POLICY } from './north-dakota-policy-mappings.generated';
import {northDakotaSubmissionReceiptProblem} from './north-dakota-disclosure-policy';
import { isNorthDakotaContractCompatible } from './north-dakota-contract-selection';
import { withHoaContractPolicy } from '../hoa-contract-policy';
import { withFederalLeadContractPolicy } from '../federal-lead-contract-policy';
import { assertListingContractScope } from '../listing-contract-scope';
import { assertNorthDakotaListingDisclosures } from '../../north-dakota-listing-disclosure-gate';
import { selectReceivedListingDisclosures } from '../received-listing-disclosures';
import { summaryFunding, summaryMoney, summaryText } from '../navstreet-pdf-layout';
import type { StateContractPackage } from '../state-contract-package';
import type { NorthDakotaOfferTermsDocument } from './north-dakota-offer-terms.document';
import { NORTH_DAKOTA_DOCUMENT_RULES } from './north-dakota-document-rules';
import { createNorthDakotaInitialOfferTerms } from './north-dakota-initial-terms';
import { sanitizeNorthDakotaDraftTerms } from './north-dakota-draft-terms-sanitizer';
import { validateNorthDakotaSubmission } from './north-dakota-submission-validator';
import { HttpsError } from 'firebase-functions/v2/https';
import { createNorthDakotaContractMilestones } from './north-dakota-contract-milestones';
export const northDakotaStateContractPackage: StateContractPackage<NorthDakotaOfferTermsDocument> = withHoaContractPolicy(withFederalLeadContractPolicy({
  assertListingContractCompatible: (listing,version) => { assertListingContractScope(northDakotaStateContractPackage,listing); if (!isNorthDakotaContractCompatible(version.terms.contractType,String(listing['propertyType']),(listing['sellerStatements'] as Record<string,any> | undefined)?.['contractFacts'])) throw new HttpsError('failed-precondition','The ownership facts require a different agreement. Start a new unsigned offer using the current listing.'); },
  listingDisclosurePolicy: { assertReady: assertNorthDakotaListingDisclosures, assertCounterofferReady: assertNorthDakotaListingDisclosures, reviewedVersions: ({version}) => version.terms.documentVersions },
  stateCode: 'ND', offerCreationEnabled: true,
  requireOwnershipFacts:true,
  supportedPropertyTypes: ['single_family', 'townhome', 'pud', 'condo'],
  contractTypes: ['navstreet_north_dakota_residential_sale_2026','navstreet_north_dakota_condominium_resale_2026'], contractTypeRequired: true,
  defaultTimeZone: 'America/Chicago',
  agreementTemplate: { stateCode: 'ND', templateUid: NORTH_DAKOTA_DOCUMENT_RULES.templateUid, templateName: 'NavStreet North Dakota Residential Purchase and Sale Agreement', templateVersion: NORTH_DAKOTA_DOCUMENT_RULES.version },
  agreementTemplates: [{stateCode:'ND',templateUid:NORTH_DAKOTA_DOCUMENT_RULES.templateUid,templateName:'NavStreet North Dakota Residential Purchase and Sale Agreement',templateVersion:NORTH_DAKOTA_DOCUMENT_RULES.version},{stateCode:'ND',templateUid:'navstreet-nd-condominium-2026',templateName:'NavStreet North Dakota Condominium Resale Purchase and Sale Agreement',templateVersion:'2026-10-24'}],
  getAgreementTemplate: terms => terms.contractType === 'navstreet_north_dakota_condominium_resale_2026' ? {stateCode:'ND',templateUid:'navstreet-nd-condominium-2026',templateName:'NavStreet North Dakota Condominium Resale Purchase and Sale Agreement',templateVersion:'2026-10-24'} : terms.documentVersions !== undefined ? {...northDakotaStateContractPackage.agreementTemplate,templateVersion:'2026-10-24'} : northDakotaStateContractPackage.agreementTemplate,
  createInitialOfferTerms: input => createNorthDakotaInitialOfferTerms(input),
  sanitizeDraftTerms: input => sanitizeNorthDakotaDraftTerms(input),
  validateSubmission: input => validateNorthDakotaSubmission(input),
  validateBeforeSigning: (input) => {const issue=northDakotaSubmissionReceiptProblem(input.version.terms);if(issue)throw new HttpsError('failed-precondition',issue);},
  requiredListingDisclosures: ({ version }) => selectReceivedListingDisclosures(version.terms.disclosures, [
      ['statutoryPacketStatus', 'north-dakota-statutory-packet'],
      ['propertyConditionStatus', 'north-dakota-seller-disclosure'],
      ['leadPaintStatus', 'lead-based-paint'],
      ['hoaDocumentsStatus', 'north-dakota-association-documents'],    ]).concat(version.terms.disclosures.propertyConditionStatus === 'exempt' ? ['north-dakota-seller-disclosure'] : []).concat(version.terms.disclosures.leadPaintStatus === 'exempt' ? ['lead-based-paint'] : []),
  createContractMilestones: input => createNorthDakotaContractMilestones(input),
    getAgreementSummary: ({ version: { terms: t } }) => [
    ...summaryFunding(t.purchase.purchasePriceInCents, t.purchase.loanAmountInCents, t.purchase.financingType === 'cash'),
    { label: 'Funding', value: summaryText(t.purchase.financingType) },
    { label: 'Earnest money deposit', value: summaryMoney(t.purchase.hasEarnestMoney === false ? 0 : t.purchase.earnestMoneyInCents) },
    { label: 'Closing / settlement date', value: summaryText(t.deadlines.settlementDate) },
    { label: 'Inspection / due diligence', value: `${t.deadlines.inspectionPeriodDays} calendar days after Effective Date; see agreement counting rules` },
  ],
  generateAgreement: async input => {
    const { generateNorthDakotaOfferPdf } = require('./north-dakota-offer-pdf.service') as typeof import('./north-dakota-offer-pdf.service');
    return generateNorthDakotaOfferPdf(input);
  },
}, FEDERAL_LEAD_POLICY), HOA_POLICY);
