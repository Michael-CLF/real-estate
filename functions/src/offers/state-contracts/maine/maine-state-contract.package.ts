import {maineSubmissionReceiptProblem} from './maine-disclosure-policy';
import { isMaineContractCompatible } from './maine-contract-selection';
import { withHoaContractPolicy } from '../hoa-contract-policy';
import { withFederalLeadContractPolicy } from '../federal-lead-contract-policy';
import { assertListingContractScope } from '../listing-contract-scope';
import { assertMaineListingDisclosures } from '../../maine-listing-disclosure-gate';
import { selectReceivedListingDisclosures } from '../received-listing-disclosures';
import { summaryFunding, summaryMoney, summaryText } from '../navstreet-pdf-layout';
import type { StateContractPackage } from '../state-contract-package';
import type { MaineOfferTermsDocument } from './maine-offer-terms.document';
import { MAINE_DOCUMENT_RULES } from './maine-document-rules';
import { createMaineInitialOfferTerms } from './maine-initial-terms';
import { sanitizeMaineDraftTerms } from './maine-draft-terms-sanitizer';
import { validateMaineSubmission } from './maine-submission-validator';
import { HttpsError } from 'firebase-functions/v2/https';
import { createMaineContractMilestones } from './maine-contract-milestones';
export const maineStateContractPackage: StateContractPackage<MaineOfferTermsDocument> = withHoaContractPolicy(withFederalLeadContractPolicy({
  assertListingContractCompatible: (listing,version) => { assertListingContractScope(maineStateContractPackage,listing); if (!isMaineContractCompatible(version.terms.contractType,String(listing['propertyType']),(listing['sellerStatements'] as Record<string,any> | undefined)?.['contractFacts'])) throw new HttpsError('failed-precondition','The ownership facts require a different agreement. Start a new unsigned offer using the current listing.'); },
  listingDisclosurePolicy: { assertReady: assertMaineListingDisclosures, assertCounterofferReady: assertMaineListingDisclosures, reviewedVersions: ({version}) => version.terms.documentVersions },
  stateCode: 'ME', offerCreationEnabled: true,
  requireOwnershipFacts:true,
  supportedPropertyTypes: ['single_family', 'townhome', 'pud', 'condo'],
  contractTypes: ['navstreet_maine_residential_sale_2026','navstreet_maine_condominium_resale_2026'], contractTypeRequired: true,
  defaultTimeZone: 'America/New_York',
  agreementTemplate: { stateCode: 'ME', templateUid: MAINE_DOCUMENT_RULES.templateUid, templateName: 'NavStreet Maine Residential Purchase and Sale Agreement', templateVersion: MAINE_DOCUMENT_RULES.version },
  agreementTemplates: [{stateCode:'ME',templateUid:MAINE_DOCUMENT_RULES.templateUid,templateName:'NavStreet Maine Residential Purchase and Sale Agreement',templateVersion:MAINE_DOCUMENT_RULES.version},{stateCode:'ME',templateUid:'navstreet-me-condominium-2026',templateName:'NavStreet Maine Condominium Resale Purchase and Sale Agreement',templateVersion:'2026-10-23'}],
  getAgreementTemplate: terms => terms.contractType === 'navstreet_maine_condominium_resale_2026' ? {stateCode:'ME',templateUid:'navstreet-me-condominium-2026',templateName:'NavStreet Maine Condominium Resale Purchase and Sale Agreement',templateVersion:'2026-10-23'} : terms.documentVersions !== undefined ? {...maineStateContractPackage.agreementTemplate,templateVersion:'2026-10-23'} : maineStateContractPackage.agreementTemplate,
  createInitialOfferTerms: input => createMaineInitialOfferTerms(input),
  sanitizeDraftTerms: input => sanitizeMaineDraftTerms(input),
  validateSubmission: input => validateMaineSubmission(input),
  validateBeforeSigning: (input) => {const issue=maineSubmissionReceiptProblem(input.version.terms);if(issue)throw new HttpsError('failed-precondition',issue);},
  requiredListingDisclosures: ({ version }) => selectReceivedListingDisclosures(version.terms.disclosures, [
      ['statutoryPacketStatus', 'maine-statutory-packet'],
      ['propertyConditionStatus', 'maine-seller-disclosure'],
      ['leadPaintStatus', 'lead-based-paint'],
      ['hoaDocumentsStatus', 'maine-association-documents'],    ]).concat(version.terms.disclosures.propertyConditionStatus === 'exempt' ? ['maine-seller-disclosure'] : []).concat(version.terms.disclosures.leadPaintStatus === 'exempt' ? ['lead-based-paint'] : []),
  createContractMilestones: input => createMaineContractMilestones(input),
    getAgreementSummary: ({ version: { terms: t } }) => [
    ...summaryFunding(t.purchase.purchasePriceInCents, t.purchase.loanAmountInCents, t.purchase.financingType === 'cash'),
    { label: 'Funding', value: summaryText(t.purchase.financingType) },
    { label: 'Earnest money deposit', value: summaryMoney(t.purchase.hasEarnestMoney === false ? 0 : t.purchase.earnestMoneyInCents) },
    { label: 'Closing / settlement date', value: summaryText(t.deadlines.settlementDate) },
    { label: 'Inspection / due diligence', value: `${t.deadlines.inspectionPeriodDays} calendar days after Effective Date; see agreement counting rules` },
  ],
  generateAgreement: async input => {
    const { generateMaineOfferPdf } = require('./maine-offer-pdf.service') as typeof import('./maine-offer-pdf.service');
    return generateMaineOfferPdf(input);
  },
}, {values:{'disclosures.leadPaintStatus':'built_1978_or_later','disclosures.leadInspectionSelection':'unselected','disclosures.leadInspectionDays':10,'documentVersions.lead-based-paint':undefined},hiddenFields:['disclosures.leadPaintStatus','disclosures.leadInspectionSelection','disclosures.leadInspectionDays']}), {"sellerFactPath":"disclosures.sellerReportsHoa","documentStatusPath":"disclosures.hoaDocumentsStatus","documentTypes":["maine-association-documents"]});
