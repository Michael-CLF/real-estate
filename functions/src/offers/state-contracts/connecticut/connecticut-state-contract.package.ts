import { HOA_POLICY, FEDERAL_LEAD_POLICY } from './connecticut-policy-mappings.generated';
import {connecticutSubmissionReceiptProblem} from './connecticut-disclosure-policy';
import { isConnecticutContractCompatible } from './connecticut-contract-selection';
import { withHoaContractPolicy } from '../hoa-contract-policy';
import { withFederalLeadContractPolicy } from '../federal-lead-contract-policy';
import { assertListingContractScope } from '../listing-contract-scope';
import { assertConnecticutListingDisclosures } from '../../connecticut-listing-disclosure-gate';
import { selectReceivedListingDisclosures } from '../received-listing-disclosures';
import { summaryFunding, summaryMoney, summaryText } from '../navstreet-pdf-layout';
import type { StateContractPackage } from '../state-contract-package';
import type { ConnecticutOfferTermsDocument } from './connecticut-offer-terms.document';
import { CONNECTICUT_DOCUMENT_RULES } from './connecticut-document-rules';
import { createConnecticutInitialOfferTerms } from './connecticut-initial-terms';
import { sanitizeConnecticutDraftTerms } from './connecticut-draft-terms-sanitizer';
import { validateConnecticutSubmission } from './connecticut-submission-validator';
import { HttpsError } from 'firebase-functions/v2/https';
import { createConnecticutContractMilestones } from './connecticut-contract-milestones';
export const connecticutStateContractPackage: StateContractPackage<ConnecticutOfferTermsDocument> = withHoaContractPolicy(withFederalLeadContractPolicy({
  assertListingContractCompatible: (listing,version) => { assertListingContractScope(connecticutStateContractPackage,listing); if (!isConnecticutContractCompatible(version.terms.contractType,String(listing['propertyType']),(listing['sellerStatements'] as Record<string,any> | undefined)?.['contractFacts'])) throw new HttpsError('failed-precondition','The ownership facts require a different agreement. Start a new unsigned offer using the current listing.'); },
  listingDisclosurePolicy: { assertReady: assertConnecticutListingDisclosures, assertCounterofferReady: assertConnecticutListingDisclosures, reviewedVersions: ({version}) => version.terms.documentVersions },
  stateCode: 'CT', offerCreationEnabled: true,
  requireOwnershipFacts:true,
  supportedPropertyTypes: ['single_family', 'townhome', 'pud', 'condo'],
  contractTypes: ['navstreet_connecticut_residential_sale_2026','navstreet_connecticut_condominium_resale_2026'], contractTypeRequired: true,
  defaultTimeZone: 'America/New_York',
  agreementTemplate: { stateCode: 'CT', templateUid: CONNECTICUT_DOCUMENT_RULES.templateUid, templateName: 'NavStreet Connecticut Residential Purchase and Sale Agreement', templateVersion: CONNECTICUT_DOCUMENT_RULES.version },
  agreementTemplates: [{stateCode:'CT',templateUid:CONNECTICUT_DOCUMENT_RULES.templateUid,templateName:'NavStreet Connecticut Residential Purchase and Sale Agreement',templateVersion:CONNECTICUT_DOCUMENT_RULES.version},{stateCode:'CT',templateUid:'navstreet-ct-condominium-2026',templateName:'NavStreet Connecticut Condominium Resale Purchase and Sale Agreement',templateVersion:'2026-10-25'}],
  getAgreementTemplate: terms => terms.contractType === 'navstreet_connecticut_condominium_resale_2026' ? {stateCode:'CT',templateUid:'navstreet-ct-condominium-2026',templateName:'NavStreet Connecticut Condominium Resale Purchase and Sale Agreement',templateVersion:'2026-10-25'} : terms.documentVersions !== undefined ? {...connecticutStateContractPackage.agreementTemplate,templateVersion:'2026-10-25'} : connecticutStateContractPackage.agreementTemplate,
  createInitialOfferTerms: input => createConnecticutInitialOfferTerms(input),
  sanitizeDraftTerms: input => sanitizeConnecticutDraftTerms(input),
  validateSubmission: input => validateConnecticutSubmission(input),
  validateBeforeSigning: (input) => {const issue=connecticutSubmissionReceiptProblem(input.version.terms);if(issue)throw new HttpsError('failed-precondition',issue);},
  requiredListingDisclosures: ({ version }) => selectReceivedListingDisclosures(version.terms.disclosures, [
      ['statutoryPacketStatus', 'connecticut-statutory-packet'],
      ['propertyConditionStatus', 'connecticut-seller-disclosure'],
      ['leadPaintStatus', 'lead-based-paint'],
      ['hoaDocumentsStatus', 'connecticut-association-documents'],    ]).concat(version.terms.disclosures.propertyConditionStatus === 'exempt' ? ['connecticut-seller-disclosure'] : []).concat(version.terms.disclosures.leadPaintStatus === 'exempt' ? ['lead-based-paint'] : []),
  createContractMilestones: input => createConnecticutContractMilestones(input),
    getAgreementSummary: ({ version: { terms: t } }) => [
    ...summaryFunding(t.purchase.purchasePriceInCents, t.purchase.loanAmountInCents, t.purchase.financingType === 'cash'),
    { label: 'Funding', value: summaryText(t.purchase.financingType) },
    { label: 'Earnest money deposit', value: summaryMoney(t.purchase.hasEarnestMoney === false ? 0 : t.purchase.earnestMoneyInCents) },
    { label: 'Closing / settlement date', value: summaryText(t.deadlines.settlementDate) },
    { label: 'Inspection / due diligence', value: `${t.deadlines.inspectionPeriodDays} calendar days after Effective Date; see agreement counting rules` },
  ],
  generateAgreement: async input => {
    const { generateConnecticutOfferPdf } = require('./connecticut-offer-pdf.service') as typeof import('./connecticut-offer-pdf.service');
    return generateConnecticutOfferPdf(input);
  },
}, FEDERAL_LEAD_POLICY), HOA_POLICY);
