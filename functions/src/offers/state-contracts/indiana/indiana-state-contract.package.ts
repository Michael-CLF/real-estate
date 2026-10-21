import { withHoaContractPolicy } from '../hoa-contract-policy';
import { withFederalLeadContractPolicy } from '../federal-lead-contract-policy';
import { assertListingContractScope } from '../listing-contract-scope';
import { assertIndianaListingDisclosures } from '../../indiana-listing-disclosure-gate';
import { selectReceivedListingDisclosures } from '../received-listing-disclosures';
import { summaryFunding, summaryMoney, summaryText } from '../navstreet-pdf-layout';
import type { StateContractPackage } from '../state-contract-package';
import type { IndianaOfferTermsDocument } from './indiana-offer-terms.document';
import { INDIANA_DOCUMENT_RULES } from './indiana-document-rules';
import { createIndianaInitialOfferTerms } from './indiana-initial-terms';
import { sanitizeIndianaDraftTerms } from './indiana-draft-terms-sanitizer';
import { validateIndianaSubmission } from './indiana-submission-validator';
import { HttpsError } from 'firebase-functions/v2/https';
import { createIndianaContractMilestones } from './indiana-contract-milestones';
export const indianaStateContractPackage: StateContractPackage<IndianaOfferTermsDocument> = withHoaContractPolicy(withFederalLeadContractPolicy({
  assertListingContractCompatible: listing => assertListingContractScope(indianaStateContractPackage, listing),
  listingDisclosurePolicy: {
    assertReady: assertIndianaListingDisclosures,
    assertCounterofferReady: assertIndianaListingDisclosures,
    reviewedVersions: ({version}) => version.terms.documentVersions,
  },
  stateCode: 'IN', offerCreationEnabled: true,
  requireOwnershipFacts:true,
  supportedPropertyTypes: ['single_family', 'townhome', 'pud'],
  contractTypes: ['navstreet_indiana_residential_sale_2026'], contractTypeRequired: true,
  defaultTimeZone: 'America/Indiana/Indianapolis',
  agreementTemplate: { stateCode: 'IN', templateUid: INDIANA_DOCUMENT_RULES.templateUid, templateName: 'NavStreet Indiana Residential Purchase and Sale Agreement', templateVersion: INDIANA_DOCUMENT_RULES.version },
  getAgreementTemplate: terms => terms.documentVersions !== undefined
    ? { ...indianaStateContractPackage.agreementTemplate, templateVersion: '2026-10-13' }
    : indianaStateContractPackage.agreementTemplate,
  createInitialOfferTerms: input => createIndianaInitialOfferTerms(input),
  sanitizeDraftTerms: input => sanitizeIndianaDraftTerms(input),
  validateSubmission: input => validateIndianaSubmission(input),
  validateBeforeSigning: ({ version }) => {
    const { disclosures } = version.terms;
    if (!['received','exempt'].includes(disclosures.propertyConditionStatus)) throw new HttpsError('failed-precondition','This saved version does not record buyer review of the Indiana condition disclosure or supported exception evidence. Its signatures and receipt answers cannot be changed. Signing is unavailable for this version.');
    if (disclosures.propertyConditionStatus === 'exempt' && !disclosures.disclosureExemptionClaimed) throw new HttpsError('failed-precondition','Review the required Indiana disclosure before signing.');
    if (
        
        disclosures.leadPaintStatus === 'pending') {
      throw new HttpsError('failed-precondition',
        'This Indiana offer records required disclosures as not received. The seller must provide them, then the buyer must create and submit a new offer acknowledging actual receipt before either party signs.');
    }
  },
  requiredListingDisclosures: ({ version }) => selectReceivedListingDisclosures(version.terms.disclosures, [
      ['statutoryPacketStatus', 'indiana-statutory-packet'],
      ['propertyConditionStatus', 'indiana-seller-disclosure'],
      ['leadPaintStatus', 'lead-based-paint'],
      ['hoaDocumentsStatus', 'indiana-association-documents'],    ]).concat(version.terms.disclosures.propertyConditionStatus === 'exempt' ? ['indiana-seller-disclosure'] : []).concat(version.terms.disclosures.leadPaintStatus === 'exempt' ? ['lead-based-paint'] : []),
  createContractMilestones: input => createIndianaContractMilestones(input),
    getAgreementSummary: ({ version: { terms: t } }) => [
    ...summaryFunding(t.purchase.purchasePriceInCents, t.purchase.loanAmountInCents, t.purchase.financingType === 'cash'),
    { label: 'Funding', value: summaryText(t.purchase.financingType) },
    { label: 'Earnest money deposit', value: summaryMoney(t.purchase.hasEarnestMoney === false ? 0 : t.purchase.earnestMoneyInCents) },
    { label: 'Closing / settlement date', value: summaryText(t.deadlines.settlementDate) },
    { label: 'Inspection / due diligence', value: `${t.deadlines.inspectionPeriodDays} calendar days after Effective Date; see agreement counting rules` },
  ],
  generateAgreement: async input => {
    const { generateIndianaOfferPdf } = require('./indiana-offer-pdf.service') as typeof import('./indiana-offer-pdf.service');
    return generateIndianaOfferPdf(input);
  },
}, {values:{'disclosures.leadPaintStatus':'built_1978_or_later','disclosures.leadInspectionSelection':'unselected','disclosures.leadInspectionDays':10,'documentVersions.lead-based-paint':undefined},hiddenFields:['disclosures.leadPaintStatus','disclosures.leadInspectionSelection','disclosures.leadInspectionDays']}), {"sellerFactPath":"disclosures.sellerReportsHoa","documentStatusPath":"disclosures.hoaDocumentsStatus","documentTypes":["indiana-association-documents"]});