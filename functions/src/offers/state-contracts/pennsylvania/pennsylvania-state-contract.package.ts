import {pennsylvaniaSubmissionReceiptProblem} from './pennsylvania-disclosure-policy';
import { isPennsylvaniaContractCompatible } from './pennsylvania-contract-selection';
import { withHoaContractPolicy } from '../hoa-contract-policy';
import { withFederalLeadContractPolicy } from '../federal-lead-contract-policy';
import { assertListingContractScope } from '../listing-contract-scope';
import { assertPennsylvaniaListingDisclosures } from '../../pennsylvania-listing-disclosure-gate';
import { selectReceivedListingDisclosures } from '../received-listing-disclosures';
import { summaryFunding, summaryMoney, summaryText } from '../navstreet-pdf-layout';
import type { StateContractPackage } from '../state-contract-package';
import type { PennsylvaniaOfferTermsDocument } from './pennsylvania-offer-terms.document';
import { PENNSYLVANIA_DOCUMENT_RULES } from './pennsylvania-document-rules';
import { createPennsylvaniaInitialOfferTerms } from './pennsylvania-initial-terms';
import { sanitizePennsylvaniaDraftTerms } from './pennsylvania-draft-terms-sanitizer';
import { validatePennsylvaniaSubmission } from './pennsylvania-submission-validator';
import { HttpsError } from 'firebase-functions/v2/https';
import { createPennsylvaniaContractMilestones } from './pennsylvania-contract-milestones';
export const pennsylvaniaStateContractPackage: StateContractPackage<PennsylvaniaOfferTermsDocument> = withHoaContractPolicy(withFederalLeadContractPolicy({
  assertListingContractCompatible: (listing,version) => { assertListingContractScope(pennsylvaniaStateContractPackage,listing); if (!isPennsylvaniaContractCompatible(version.terms.contractType,String(listing['propertyType']),(listing['sellerStatements'] as Record<string,any> | undefined)?.['contractFacts'])) throw new HttpsError('failed-precondition','The ownership facts require a different agreement. Start a new unsigned offer using the current listing.'); },
  listingDisclosurePolicy: { assertReady: assertPennsylvaniaListingDisclosures, assertCounterofferReady: assertPennsylvaniaListingDisclosures, reviewedVersions: ({version}) => version.terms.documentVersions },
  stateCode: 'PA', offerCreationEnabled: true,
  requireOwnershipFacts:true,
  supportedPropertyTypes: ['single_family', 'townhome', 'pud', 'condo'],
  contractTypes: ['navstreet_pennsylvania_residential_sale_2026','navstreet_pennsylvania_condominium_resale_2026'], contractTypeRequired: true,
  defaultTimeZone: 'America/New_York',
  agreementTemplate: { stateCode: 'PA', templateUid: PENNSYLVANIA_DOCUMENT_RULES.templateUid, templateName: 'NavStreet Pennsylvania Residential Purchase and Sale Agreement', templateVersion: PENNSYLVANIA_DOCUMENT_RULES.version },
  agreementTemplates: [{stateCode:'PA',templateUid:PENNSYLVANIA_DOCUMENT_RULES.templateUid,templateName:'NavStreet Pennsylvania Residential Purchase and Sale Agreement',templateVersion:PENNSYLVANIA_DOCUMENT_RULES.version},{stateCode:'PA',templateUid:'navstreet-pa-condominium-2026',templateName:'NavStreet Pennsylvania Condominium Resale Purchase and Sale Agreement',templateVersion:'2026-10-24'}],
  getAgreementTemplate: terms => terms.contractType === 'navstreet_pennsylvania_condominium_resale_2026' ? {stateCode:'PA',templateUid:'navstreet-pa-condominium-2026',templateName:'NavStreet Pennsylvania Condominium Resale Purchase and Sale Agreement',templateVersion:'2026-10-24'} : terms.documentVersions !== undefined ? {...pennsylvaniaStateContractPackage.agreementTemplate,templateVersion:'2026-10-24'} : pennsylvaniaStateContractPackage.agreementTemplate,
  createInitialOfferTerms: input => createPennsylvaniaInitialOfferTerms(input),
  sanitizeDraftTerms: input => sanitizePennsylvaniaDraftTerms(input),
  validateSubmission: input => validatePennsylvaniaSubmission(input),
  validateBeforeSigning: (input) => {const issue=pennsylvaniaSubmissionReceiptProblem(input.version.terms);if(issue)throw new HttpsError('failed-precondition',issue);},
  requiredListingDisclosures: ({ version }) => selectReceivedListingDisclosures(version.terms.disclosures, [
      ['statutoryPacketStatus', 'pennsylvania-statutory-packet'],
      ['propertyConditionStatus', 'pennsylvania-seller-disclosure'],
      ['leadPaintStatus', 'lead-based-paint'],
      ['hoaDocumentsStatus', 'pennsylvania-association-documents'],    ]).concat(version.terms.disclosures.propertyConditionStatus === 'exempt' ? ['pennsylvania-seller-disclosure'] : []).concat(version.terms.disclosures.leadPaintStatus === 'exempt' ? ['lead-based-paint'] : []),
  createContractMilestones: input => createPennsylvaniaContractMilestones(input),
    getAgreementSummary: ({ version: { terms: t } }) => [
    ...summaryFunding(t.purchase.purchasePriceInCents, t.purchase.loanAmountInCents, t.purchase.financingType === 'cash'),
    { label: 'Funding', value: summaryText(t.purchase.financingType) },
    { label: 'Earnest money deposit', value: summaryMoney(t.purchase.hasEarnestMoney === false ? 0 : t.purchase.earnestMoneyInCents) },
    { label: 'Closing / settlement date', value: summaryText(t.deadlines.settlementDate) },
    { label: 'Inspection / due diligence', value: `${t.deadlines.inspectionPeriodDays} calendar days after Effective Date; see agreement counting rules` },
  ],
  generateAgreement: async input => {
    const { generatePennsylvaniaOfferPdf } = require('./pennsylvania-offer-pdf.service') as typeof import('./pennsylvania-offer-pdf.service');
    return generatePennsylvaniaOfferPdf(input);
  },
}, {values:{'disclosures.leadPaintStatus':'built_1978_or_later','disclosures.leadInspectionSelection':'unselected','disclosures.leadInspectionDays':10,'documentVersions.lead-based-paint':undefined},hiddenFields:['disclosures.leadPaintStatus','disclosures.leadInspectionSelection','disclosures.leadInspectionDays']}), {"sellerFactPath":"disclosures.sellerReportsHoa","documentStatusPath":"disclosures.hoaDocumentsStatus","documentTypes":["pennsylvania-association-documents"]});
