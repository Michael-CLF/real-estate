import { HOA_POLICY, FEDERAL_LEAD_POLICY } from './west-virginia-policy-mappings.generated';
import {westVirginiaSubmissionReceiptProblem} from './west-virginia-disclosure-policy';
import { isWestVirginiaContractCompatible } from './west-virginia-contract-selection';
import { withHoaContractPolicy } from '../hoa-contract-policy';
import { withFederalLeadContractPolicy } from '../federal-lead-contract-policy';
import { assertListingContractScope } from '../listing-contract-scope';
import { assertWestVirginiaListingDisclosures } from '../../west-virginia-listing-disclosure-gate';
import { selectReceivedListingDisclosures } from '../received-listing-disclosures';
import { summaryFunding, summaryMoney, summaryText } from '../navstreet-pdf-layout';
import type { StateContractPackage } from '../state-contract-package';
import type { WestVirginiaOfferTermsDocument } from './west-virginia-offer-terms.document';
import { WEST_VIRGINIA_DOCUMENT_RULES } from './west-virginia-document-rules';
import { createWestVirginiaInitialOfferTerms } from './west-virginia-initial-terms';
import { sanitizeWestVirginiaDraftTerms } from './west-virginia-draft-terms-sanitizer';
import { validateWestVirginiaSubmission } from './west-virginia-submission-validator';
import { HttpsError } from 'firebase-functions/v2/https';
import { createWestVirginiaContractMilestones } from './west-virginia-contract-milestones';
export const westVirginiaStateContractPackage: StateContractPackage<WestVirginiaOfferTermsDocument> = withHoaContractPolicy(withFederalLeadContractPolicy({
  assertListingContractCompatible: (listing,version) => { assertListingContractScope(westVirginiaStateContractPackage,listing); if (!isWestVirginiaContractCompatible(version.terms.contractType,String(listing['propertyType']),(listing['sellerStatements'] as Record<string,any> | undefined)?.['contractFacts'])) throw new HttpsError('failed-precondition','The ownership facts require a different agreement. Start a new unsigned offer using the current listing.'); },
  listingDisclosurePolicy: { assertReady: assertWestVirginiaListingDisclosures, assertCounterofferReady: assertWestVirginiaListingDisclosures, reviewedVersions: ({version}) => version.terms.documentVersions },
  stateCode: 'WV', offerCreationEnabled: true,
  requireOwnershipFacts:true,
  supportedPropertyTypes: ['single_family', 'townhome', 'pud', 'condo'],
  contractTypes: ['navstreet_west_virginia_residential_sale_2026','navstreet_west_virginia_condominium_resale_2026'], contractTypeRequired: true,
  defaultTimeZone: 'America/New_York',
  agreementTemplate: { stateCode: 'WV', templateUid: WEST_VIRGINIA_DOCUMENT_RULES.templateUid, templateName: 'NavStreet West Virginia Residential Purchase and Sale Agreement', templateVersion: WEST_VIRGINIA_DOCUMENT_RULES.version },
  agreementTemplates: [{stateCode:'WV',templateUid:WEST_VIRGINIA_DOCUMENT_RULES.templateUid,templateName:'NavStreet West Virginia Residential Purchase and Sale Agreement',templateVersion:WEST_VIRGINIA_DOCUMENT_RULES.version},{stateCode:'WV',templateUid:'navstreet-wv-condominium-2026',templateName:'NavStreet West Virginia Condominium Resale Purchase and Sale Agreement',templateVersion:'2026-10-24'}],
  getAgreementTemplate: terms => terms.contractType === 'navstreet_west_virginia_condominium_resale_2026' ? {stateCode:'WV',templateUid:'navstreet-wv-condominium-2026',templateName:'NavStreet West Virginia Condominium Resale Purchase and Sale Agreement',templateVersion:'2026-10-24'} : terms.documentVersions !== undefined ? {...westVirginiaStateContractPackage.agreementTemplate,templateVersion:'2026-10-24'} : westVirginiaStateContractPackage.agreementTemplate,
  createInitialOfferTerms: input => createWestVirginiaInitialOfferTerms(input),
  sanitizeDraftTerms: input => sanitizeWestVirginiaDraftTerms(input),
  validateSubmission: input => validateWestVirginiaSubmission(input),
  validateBeforeSigning: (input) => {const issue=westVirginiaSubmissionReceiptProblem(input.version.terms);if(issue)throw new HttpsError('failed-precondition',issue);},
  requiredListingDisclosures: ({ version }) => selectReceivedListingDisclosures(version.terms.disclosures, [
      ['statutoryPacketStatus', 'west-virginia-statutory-packet'],
      ['propertyConditionStatus', 'west-virginia-seller-disclosure'],
      ['leadPaintStatus', 'lead-based-paint'],
      ['hoaDocumentsStatus', 'west-virginia-association-documents'],    ]).concat(version.terms.disclosures.propertyConditionStatus === 'exempt' ? ['west-virginia-seller-disclosure'] : []).concat(version.terms.disclosures.leadPaintStatus === 'exempt' ? ['lead-based-paint'] : []),
  createContractMilestones: input => createWestVirginiaContractMilestones(input),
    getAgreementSummary: ({ version: { terms: t } }) => [
    ...summaryFunding(t.purchase.purchasePriceInCents, t.purchase.loanAmountInCents, t.purchase.financingType === 'cash'),
    { label: 'Funding', value: summaryText(t.purchase.financingType) },
    { label: 'Earnest money deposit', value: summaryMoney(t.purchase.hasEarnestMoney === false ? 0 : t.purchase.earnestMoneyInCents) },
    { label: 'Closing / settlement date', value: summaryText(t.deadlines.settlementDate) },
    { label: 'Inspection / due diligence', value: `${t.deadlines.inspectionPeriodDays} calendar days after Effective Date; see agreement counting rules` },
  ],
  generateAgreement: async input => {
    const { generateWestVirginiaOfferPdf } = require('./west-virginia-offer-pdf.service') as typeof import('./west-virginia-offer-pdf.service');
    return generateWestVirginiaOfferPdf(input);
  },
}, FEDERAL_LEAD_POLICY), HOA_POLICY);
