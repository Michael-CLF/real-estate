import {tennesseeSubmissionReceiptProblem} from './tennessee-disclosure-policy';
import { isTennesseeContractCompatible } from './tennessee-contract-selection';
import { withHoaContractPolicy } from '../hoa-contract-policy';
import { withFederalLeadContractPolicy } from '../federal-lead-contract-policy';
import { assertListingContractScope } from '../listing-contract-scope';
import { assertTennesseeListingDisclosures } from '../../tennessee-listing-disclosure-gate';
import { selectReceivedListingDisclosures } from '../received-listing-disclosures';
import { summaryFunding, summaryMoney, summaryText } from '../navstreet-pdf-layout';
import type { StateContractPackage } from '../state-contract-package';
import type { TennesseeOfferTermsDocument } from './tennessee-offer-terms.document';
import { TENNESSEE_DOCUMENT_RULES } from './tennessee-document-rules';
import { createTennesseeInitialOfferTerms } from './tennessee-initial-terms';
import { sanitizeTennesseeDraftTerms } from './tennessee-draft-terms-sanitizer';
import { validateTennesseeSubmission } from './tennessee-submission-validator';
import { HttpsError } from 'firebase-functions/v2/https';
import { createTennesseeContractMilestones } from './tennessee-contract-milestones';
export const tennesseeStateContractPackage: StateContractPackage<TennesseeOfferTermsDocument> = withHoaContractPolicy(withFederalLeadContractPolicy({
  assertListingContractCompatible: (listing,version) => { assertListingContractScope(tennesseeStateContractPackage,listing); if (!isTennesseeContractCompatible(version.terms.contractType,String(listing['propertyType']),(listing['sellerStatements'] as Record<string,any> | undefined)?.['contractFacts'])) throw new HttpsError('failed-precondition','The ownership facts require a different agreement. Start a new unsigned offer using the current listing.'); },
  listingDisclosurePolicy: { assertReady: assertTennesseeListingDisclosures, assertCounterofferReady: assertTennesseeListingDisclosures, reviewedVersions: ({version}) => version.terms.documentVersions },
  stateCode: 'TN', offerCreationEnabled: true,
  requireOwnershipFacts:true,
  supportedPropertyTypes: ['single_family', 'townhome', 'pud', 'condo'],
  contractTypes: ['navstreet_tennessee_residential_sale_2026','navstreet_tennessee_condominium_resale_2026'], contractTypeRequired: true,
  defaultTimeZone: 'America/New_York',
  agreementTemplate: { stateCode: 'TN', templateUid: TENNESSEE_DOCUMENT_RULES.templateUid, templateName: 'NavStreet Tennessee Residential Purchase and Sale Agreement', templateVersion: TENNESSEE_DOCUMENT_RULES.version },
  agreementTemplates: [{stateCode:'TN',templateUid:TENNESSEE_DOCUMENT_RULES.templateUid,templateName:'NavStreet Tennessee Residential Purchase and Sale Agreement',templateVersion:TENNESSEE_DOCUMENT_RULES.version},{stateCode:'TN',templateUid:'navstreet-tn-condominium-2026',templateName:'NavStreet Tennessee Condominium Resale Purchase and Sale Agreement',templateVersion:'2026-10-24'}],
  getAgreementTemplate: terms => terms.contractType === 'navstreet_tennessee_condominium_resale_2026' ? {stateCode:'TN',templateUid:'navstreet-tn-condominium-2026',templateName:'NavStreet Tennessee Condominium Resale Purchase and Sale Agreement',templateVersion:'2026-10-24'} : terms.documentVersions !== undefined ? {...tennesseeStateContractPackage.agreementTemplate,templateVersion:'2026-10-24'} : tennesseeStateContractPackage.agreementTemplate,
  createInitialOfferTerms: input => createTennesseeInitialOfferTerms(input),
  sanitizeDraftTerms: input => sanitizeTennesseeDraftTerms(input),
  validateSubmission: input => validateTennesseeSubmission(input),
  validateBeforeSigning: (input) => {const issue=tennesseeSubmissionReceiptProblem(input.version.terms);if(issue)throw new HttpsError('failed-precondition',issue);},
  requiredListingDisclosures: ({ version }) => selectReceivedListingDisclosures(version.terms.disclosures, [
      ['statutoryPacketStatus', 'tennessee-statutory-packet'],
      ['propertyConditionStatus', 'tennessee-seller-disclosure'],
      ['leadPaintStatus', 'lead-based-paint'],
      ['hoaDocumentsStatus', 'tennessee-association-documents'],    ]).concat(version.terms.disclosures.propertyConditionStatus === 'exempt' ? ['tennessee-seller-disclosure'] : []).concat(version.terms.disclosures.leadPaintStatus === 'exempt' ? ['lead-based-paint'] : []),
  createContractMilestones: input => createTennesseeContractMilestones(input),
    getAgreementSummary: ({ version: { terms: t } }) => [
    ...summaryFunding(t.purchase.purchasePriceInCents, t.purchase.loanAmountInCents, t.purchase.financingType === 'cash'),
    { label: 'Funding', value: summaryText(t.purchase.financingType) },
    { label: 'Earnest money deposit', value: summaryMoney(t.purchase.hasEarnestMoney === false ? 0 : t.purchase.earnestMoneyInCents) },
    { label: 'Closing / settlement date', value: summaryText(t.deadlines.settlementDate) },
    { label: 'Inspection / due diligence', value: `${t.deadlines.inspectionPeriodDays} calendar days after Effective Date; see agreement counting rules` },
  ],
  generateAgreement: async input => {
    const { generateTennesseeOfferPdf } = require('./tennessee-offer-pdf.service') as typeof import('./tennessee-offer-pdf.service');
    return generateTennesseeOfferPdf(input);
  },
}, {values:{'disclosures.leadPaintStatus':'built_1978_or_later','disclosures.leadInspectionSelection':'unselected','disclosures.leadInspectionDays':10,'documentVersions.lead-based-paint':undefined},hiddenFields:['disclosures.leadPaintStatus','disclosures.leadInspectionSelection','disclosures.leadInspectionDays']}), {"sellerFactPath":"disclosures.sellerReportsHoa","documentStatusPath":"disclosures.hoaDocumentsStatus","documentTypes":["tennessee-association-documents"]});
