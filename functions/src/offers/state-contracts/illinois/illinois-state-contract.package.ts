import {illinoisSubmissionReceiptProblem} from './illinois-disclosure-policy';
import { isIllinoisContractCompatible } from './illinois-contract-selection';
import { withHoaContractPolicy } from '../hoa-contract-policy';
import { withFederalLeadContractPolicy } from '../federal-lead-contract-policy';
import { assertListingContractScope } from '../listing-contract-scope';
import { assertIllinoisListingDisclosures } from '../../illinois-listing-disclosure-gate';
import { selectReceivedListingDisclosures } from '../received-listing-disclosures';
import { summaryFunding, summaryMoney, summaryText } from '../navstreet-pdf-layout';
import type { StateContractPackage } from '../state-contract-package';
import type { IllinoisOfferTermsDocument } from './illinois-offer-terms.document';
import { ILLINOIS_DOCUMENT_RULES } from './illinois-document-rules';
import { createIllinoisInitialOfferTerms } from './illinois-initial-terms';
import { sanitizeIllinoisDraftTerms } from './illinois-draft-terms-sanitizer';
import { validateIllinoisSubmission } from './illinois-submission-validator';
import { HttpsError } from 'firebase-functions/v2/https';
import { createIllinoisContractMilestones } from './illinois-contract-milestones';
export const illinoisStateContractPackage: StateContractPackage<IllinoisOfferTermsDocument> = withHoaContractPolicy(withFederalLeadContractPolicy({
  assertListingContractCompatible: (listing,version) => { assertListingContractScope(illinoisStateContractPackage,listing); if (!isIllinoisContractCompatible(version.terms.contractType,String(listing['propertyType']),(listing['sellerStatements'] as Record<string,any> | undefined)?.['contractFacts'])) throw new HttpsError('failed-precondition','The ownership facts require a different agreement. Start a new unsigned offer using the current listing.'); },
  listingDisclosurePolicy: { assertReady: assertIllinoisListingDisclosures, assertCounterofferReady: assertIllinoisListingDisclosures, reviewedVersions: ({version}) => version.terms.documentVersions },
  stateCode: 'IL', offerCreationEnabled: true,
  requireOwnershipFacts:true,
  supportedPropertyTypes: ['single_family', 'townhome', 'pud', 'condo'],
  contractTypes: ['navstreet_illinois_residential_sale_2026','navstreet_illinois_condominium_resale_2026'], contractTypeRequired: true,
  defaultTimeZone: 'America/Chicago',
  agreementTemplate: { stateCode: 'IL', templateUid: ILLINOIS_DOCUMENT_RULES.templateUid, templateName: 'NavStreet Illinois Residential Purchase and Sale Agreement', templateVersion: ILLINOIS_DOCUMENT_RULES.version },
  agreementTemplates: [{stateCode:'IL',templateUid:ILLINOIS_DOCUMENT_RULES.templateUid,templateName:'NavStreet Illinois Residential Purchase and Sale Agreement',templateVersion:ILLINOIS_DOCUMENT_RULES.version},{stateCode:'IL',templateUid:'navstreet-il-condominium-2026',templateName:'NavStreet Illinois Condominium Resale Purchase and Sale Agreement',templateVersion:'2026-10-23'}],
  getAgreementTemplate: terms => terms.contractType === 'navstreet_illinois_condominium_resale_2026' ? {stateCode:'IL',templateUid:'navstreet-il-condominium-2026',templateName:'NavStreet Illinois Condominium Resale Purchase and Sale Agreement',templateVersion:'2026-10-23'} : terms.documentVersions !== undefined ? {...illinoisStateContractPackage.agreementTemplate,templateVersion:'2026-10-23'} : illinoisStateContractPackage.agreementTemplate,
  createInitialOfferTerms: input => createIllinoisInitialOfferTerms(input),
  sanitizeDraftTerms: input => sanitizeIllinoisDraftTerms(input),
  validateSubmission: input => validateIllinoisSubmission(input),
  validateBeforeSigning: (input) => {const issue=illinoisSubmissionReceiptProblem(input.version.terms);if(issue)throw new HttpsError('failed-precondition',issue);},
  requiredListingDisclosures: ({ version }) => selectReceivedListingDisclosures(version.terms.disclosures, [
      ['statutoryPacketStatus', 'illinois-statutory-packet'],
      ['propertyConditionStatus', 'illinois-seller-disclosure'],
      ['leadPaintStatus', 'lead-based-paint'],
      ['hoaDocumentsStatus', 'illinois-association-documents'],    ]).concat(version.terms.disclosures.propertyConditionStatus === 'exempt' ? ['illinois-seller-disclosure'] : []).concat(version.terms.disclosures.leadPaintStatus === 'exempt' ? ['lead-based-paint'] : []),
  createContractMilestones: input => createIllinoisContractMilestones(input),
    getAgreementSummary: ({ version: { terms: t } }) => [
    ...summaryFunding(t.purchase.purchasePriceInCents, t.purchase.loanAmountInCents, t.purchase.financingType === 'cash'),
    { label: 'Funding', value: summaryText(t.purchase.financingType) },
    { label: 'Earnest money deposit', value: summaryMoney(t.purchase.hasEarnestMoney === false ? 0 : t.purchase.earnestMoneyInCents) },
    { label: 'Closing / settlement date', value: summaryText(t.deadlines.settlementDate) },
    { label: 'Inspection / due diligence', value: `${t.deadlines.inspectionPeriodDays} calendar days after Effective Date; see agreement counting rules` },
  ],
  generateAgreement: async input => {
    const { generateIllinoisOfferPdf } = require('./illinois-offer-pdf.service') as typeof import('./illinois-offer-pdf.service');
    return generateIllinoisOfferPdf(input);
  },
}, {values:{'disclosures.leadPaintStatus':'built_1978_or_later','disclosures.leadInspectionSelection':'unselected','disclosures.leadInspectionDays':10,'documentVersions.lead-based-paint':undefined},hiddenFields:['disclosures.leadPaintStatus','disclosures.leadInspectionSelection','disclosures.leadInspectionDays']}), {"sellerFactPath":"disclosures.sellerReportsHoa","documentStatusPath":"disclosures.hoaDocumentsStatus","documentTypes":["illinois-association-documents"]});
