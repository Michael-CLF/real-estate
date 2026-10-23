import {arkansasSubmissionReceiptProblem} from './arkansas-disclosure-policy';
import { isArkansasContractCompatible } from './arkansas-contract-selection';
import { withHoaContractPolicy } from '../hoa-contract-policy';
import { withFederalLeadContractPolicy } from '../federal-lead-contract-policy';
import { assertListingContractScope } from '../listing-contract-scope';
import { assertArkansasListingDisclosures } from '../../arkansas-listing-disclosure-gate';
import { selectReceivedListingDisclosures } from '../received-listing-disclosures';
import { summaryFunding, summaryMoney, summaryText } from '../navstreet-pdf-layout';
import type { StateContractPackage } from '../state-contract-package';
import type { ArkansasOfferTermsDocument } from './arkansas-offer-terms.document';
import { ARKANSAS_DOCUMENT_RULES } from './arkansas-document-rules';
import { createArkansasInitialOfferTerms } from './arkansas-initial-terms';
import { sanitizeArkansasDraftTerms } from './arkansas-draft-terms-sanitizer';
import { validateArkansasSubmission } from './arkansas-submission-validator';
import { HttpsError } from 'firebase-functions/v2/https';
import { createArkansasContractMilestones } from './arkansas-contract-milestones';
export const arkansasStateContractPackage: StateContractPackage<ArkansasOfferTermsDocument> = withHoaContractPolicy(withFederalLeadContractPolicy({
  assertListingContractCompatible: (listing,version) => { assertListingContractScope(arkansasStateContractPackage,listing); if (!isArkansasContractCompatible(version.terms.contractType,String(listing['propertyType']),(listing['sellerStatements'] as Record<string,any> | undefined)?.['contractFacts'])) throw new HttpsError('failed-precondition','The ownership facts require a different agreement. Start a new unsigned offer using the current listing.'); },
  listingDisclosurePolicy: { assertReady: assertArkansasListingDisclosures, assertCounterofferReady: assertArkansasListingDisclosures, reviewedVersions: ({version}) => version.terms.documentVersions },
  stateCode: 'AR', offerCreationEnabled: true,
  requireOwnershipFacts:true,
  supportedPropertyTypes: ['single_family', 'townhome', 'pud', 'condo'],
  contractTypes: ['navstreet_arkansas_residential_sale_2026','navstreet_arkansas_condominium_resale_2026'], contractTypeRequired: true,
  defaultTimeZone: 'America/Chicago',
  agreementTemplate: { stateCode: 'AR', templateUid: ARKANSAS_DOCUMENT_RULES.templateUid, templateName: 'NavStreet Arkansas Residential Purchase and Sale Agreement', templateVersion: ARKANSAS_DOCUMENT_RULES.version },
  agreementTemplates: [{stateCode:'AR',templateUid:ARKANSAS_DOCUMENT_RULES.templateUid,templateName:'NavStreet Arkansas Residential Purchase and Sale Agreement',templateVersion:ARKANSAS_DOCUMENT_RULES.version},{stateCode:'AR',templateUid:'navstreet-ar-condominium-2026',templateName:'NavStreet Arkansas Condominium Resale Purchase and Sale Agreement',templateVersion:'2026-10-23'}],
  getAgreementTemplate: terms => terms.contractType === 'navstreet_arkansas_condominium_resale_2026' ? {stateCode:'AR',templateUid:'navstreet-ar-condominium-2026',templateName:'NavStreet Arkansas Condominium Resale Purchase and Sale Agreement',templateVersion:'2026-10-23'} : terms.documentVersions !== undefined ? {...arkansasStateContractPackage.agreementTemplate,templateVersion:'2026-10-23'} : arkansasStateContractPackage.agreementTemplate,
  createInitialOfferTerms: input => createArkansasInitialOfferTerms(input),
  sanitizeDraftTerms: input => sanitizeArkansasDraftTerms(input),
  validateSubmission: input => validateArkansasSubmission(input),
  validateBeforeSigning: (input) => {const issue=arkansasSubmissionReceiptProblem(input.version.terms);if(issue)throw new HttpsError('failed-precondition',issue);},
  requiredListingDisclosures: ({ version }) => selectReceivedListingDisclosures(version.terms.disclosures, [
      ['statutoryPacketStatus', 'arkansas-statutory-packet'],
      ['propertyConditionStatus', 'arkansas-seller-disclosure'],
      ['leadPaintStatus', 'lead-based-paint'],
      ['hoaDocumentsStatus', 'arkansas-association-documents'],    ]).concat(version.terms.disclosures.propertyConditionStatus === 'exempt' ? ['arkansas-seller-disclosure'] : []).concat(version.terms.disclosures.leadPaintStatus === 'exempt' ? ['lead-based-paint'] : []),
  createContractMilestones: input => createArkansasContractMilestones(input),
    getAgreementSummary: ({ version: { terms: t } }) => [
    ...summaryFunding(t.purchase.purchasePriceInCents, t.purchase.loanAmountInCents, t.purchase.financingType === 'cash'),
    { label: 'Funding', value: summaryText(t.purchase.financingType) },
    { label: 'Earnest money deposit', value: summaryMoney(t.purchase.hasEarnestMoney === false ? 0 : t.purchase.earnestMoneyInCents) },
    { label: 'Closing / settlement date', value: summaryText(t.deadlines.settlementDate) },
    { label: 'Inspection / due diligence', value: `${t.deadlines.inspectionPeriodDays} calendar days after Effective Date; see agreement counting rules` },
  ],
  generateAgreement: async input => {
    const { generateArkansasOfferPdf } = require('./arkansas-offer-pdf.service') as typeof import('./arkansas-offer-pdf.service');
    return generateArkansasOfferPdf(input);
  },
}, {values:{'disclosures.leadPaintStatus':'built_1978_or_later','disclosures.leadInspectionSelection':'unselected','disclosures.leadInspectionDays':10,'documentVersions.lead-based-paint':undefined},hiddenFields:['disclosures.leadPaintStatus','disclosures.leadInspectionSelection','disclosures.leadInspectionDays']}), {"sellerFactPath":"disclosures.sellerReportsHoa","documentStatusPath":"disclosures.hoaDocumentsStatus","documentTypes":["arkansas-association-documents"]});
