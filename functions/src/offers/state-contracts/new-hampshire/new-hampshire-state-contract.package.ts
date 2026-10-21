import { withHoaContractPolicy } from '../hoa-contract-policy';
import { withFederalLeadContractPolicy } from '../federal-lead-contract-policy';
import { assertListingContractScope } from '../listing-contract-scope';
import { assertNewHampshireListingDisclosures } from '../../new-hampshire-listing-disclosure-gate';
import { selectReceivedListingDisclosures } from '../received-listing-disclosures';
import { summaryFunding, summaryMoney, summaryText } from '../navstreet-pdf-layout';
import type { StateContractPackage } from '../state-contract-package';
import type { NewHampshireOfferTermsDocument } from './new-hampshire-offer-terms.document';
import { NEW_HAMPSHIRE_DOCUMENT_RULES } from './new-hampshire-document-rules';
import { createNewHampshireInitialOfferTerms } from './new-hampshire-initial-terms';
import { sanitizeNewHampshireDraftTerms } from './new-hampshire-draft-terms-sanitizer';
import { validateNewHampshireSubmission } from './new-hampshire-submission-validator';
import { HttpsError } from 'firebase-functions/v2/https';
import { createNewHampshireContractMilestones } from './new-hampshire-contract-milestones';
export const newHampshireStateContractPackage: StateContractPackage<NewHampshireOfferTermsDocument> = withHoaContractPolicy(withFederalLeadContractPolicy({
  assertListingContractCompatible: listing => assertListingContractScope(newHampshireStateContractPackage, listing),
  listingDisclosurePolicy: { assertReady: assertNewHampshireListingDisclosures },
  stateCode: 'NH', offerCreationEnabled: true,
  requireOwnershipFacts:true,
  supportedPropertyTypes: ['single_family', 'townhome', 'pud'],
  contractTypes: ['navstreet_new_hampshire_residential_sale_2026'], contractTypeRequired: true,
  defaultTimeZone: 'America/New_York',
  agreementTemplate: { stateCode: 'NH', templateUid: NEW_HAMPSHIRE_DOCUMENT_RULES.templateUid, templateName: 'NavStreet New Hampshire Residential Purchase and Sale Agreement', templateVersion: NEW_HAMPSHIRE_DOCUMENT_RULES.version },
  createInitialOfferTerms: input => createNewHampshireInitialOfferTerms(input),
  sanitizeDraftTerms: input => sanitizeNewHampshireDraftTerms(input),
  validateSubmission: input => validateNewHampshireSubmission(input),
  validateBeforeSigning: ({ version }) => {
    const { disclosures } = version.terms;
    if (disclosures.propertyConditionStatus !== 'received') throw new HttpsError('failed-precondition','Required seller disclosure or lawful exemption evidence must be reviewed before signing.');
    if (disclosures.statutoryPacketStatus !== 'received' ||
        
        disclosures.leadPaintStatus === 'pending') {
      throw new HttpsError('failed-precondition',
        'This New Hampshire offer records required disclosures as not received. The seller must provide them, then the buyer must create and submit a new offer acknowledging actual receipt before either party signs.');
    }
  },
  requiredListingDisclosures: ({ version }) => selectReceivedListingDisclosures(version.terms.disclosures, [
      ['statutoryPacketStatus', 'new-hampshire-statutory-packet'],
      ['propertyConditionStatus', 'new-hampshire-seller-disclosure'],
      ['leadPaintStatus', 'lead-based-paint'],
      ['hoaDocumentsStatus', 'new-hampshire-association-documents'],    ]).concat(version.terms.disclosures.propertyConditionStatus === 'exempt' ? ['new-hampshire-seller-disclosure'] : []).concat(version.terms.disclosures.leadPaintStatus === 'exempt' ? ['lead-based-paint'] : []),
  createContractMilestones: input => createNewHampshireContractMilestones(input),
    getAgreementSummary: ({ version: { terms: t } }) => [
    ...summaryFunding(t.purchase.purchasePriceInCents, t.purchase.loanAmountInCents, t.purchase.financingType === 'cash'),
    { label: 'Funding', value: summaryText(t.purchase.financingType) },
    { label: 'Earnest money deposit', value: summaryMoney(t.purchase.hasEarnestMoney === false ? 0 : t.purchase.earnestMoneyInCents) },
    { label: 'Closing / settlement date', value: summaryText(t.deadlines.settlementDate) },
    { label: 'Inspection / due diligence', value: `${t.deadlines.inspectionPeriodDays} calendar days after Effective Date; see agreement counting rules` },
  ],
  generateAgreement: async input => {
    const { generateNewHampshireOfferPdf } = require('./new-hampshire-offer-pdf.service') as typeof import('./new-hampshire-offer-pdf.service');
    return generateNewHampshireOfferPdf(input);
  },
}, {values:{'disclosures.leadPaintStatus':'built_1978_or_later','disclosures.leadInspectionSelection':'unselected','disclosures.leadInspectionDays':10,'documentVersions.lead-based-paint':undefined},hiddenFields:['disclosures.leadPaintStatus','disclosures.leadInspectionSelection','disclosures.leadInspectionDays']}), {"sellerFactPath":"disclosures.sellerReportsHoa","documentStatusPath":"disclosures.hoaDocumentsStatus","documentTypes":["new-hampshire-association-documents"]});