import { HOA_POLICY, FEDERAL_LEAD_POLICY } from './minnesota-policy-mappings.generated';
import { withHoaContractPolicy } from '../hoa-contract-policy';
import { withFederalLeadContractPolicy } from '../federal-lead-contract-policy';
import { isMinnesotaContractCompatible, type MinnesotaOwnershipFacts } from './minnesota-contract-selection';
import { HttpsError as ContractScopeError } from 'firebase-functions/v2/https';
import { assertListingContractScope } from '../listing-contract-scope';
import { minnesotaAssociationPacketProblem } from './minnesota-association-packet';
import { assertMinnesotaListingDisclosures } from '../../minnesota-listing-disclosure-gate';
import { selectReceivedListingDisclosures } from '../received-listing-disclosures';
import { summaryFunding, summaryMoney, summaryText } from '../navstreet-pdf-layout';
import type { StateContractPackage } from '../state-contract-package';
import type { MinnesotaOfferTermsDocument } from './minnesota-offer-terms.document';
import { MINNESOTA_DOCUMENT_RULES } from './minnesota-document-rules';
import { createMinnesotaInitialOfferTerms } from './minnesota-initial-terms';
import { sanitizeMinnesotaDraftTerms } from './minnesota-draft-terms-sanitizer';
import { validateMinnesotaSubmission } from './minnesota-submission-validator';
import { HttpsError } from 'firebase-functions/v2/https';
import { createMinnesotaContractMilestones } from './minnesota-contract-milestones';
export const minnesotaStateContractPackage: StateContractPackage<MinnesotaOfferTermsDocument> = withHoaContractPolicy(withFederalLeadContractPolicy({
  assertListingContractCompatible: (listing,version) => {
    assertListingContractScope(minnesotaStateContractPackage,listing);
    const statements=listing['sellerStatements'] as Record<string,unknown>|undefined;
    if (!isMinnesotaContractCompatible(version.terms.contractType,String(listing['propertyType']),statements?.['contractFacts'] as MinnesotaOwnershipFacts | undefined)) throw new ContractScopeError('failed-precondition','The listing ownership now requires a different agreement. Discard an unsigned draft on its offer page and start again.');
  },
  listingDisclosurePolicy: { reviewedVersions: ({version}) => version.terms.documentVersions, assertReady: assertMinnesotaListingDisclosures },
  stateCode: 'MN', offerCreationEnabled: true,
  requireOwnershipFacts:true,
  supportedPropertyTypes: ['single_family', 'townhome', 'pud', 'condo'],
  contractTypes: ['navstreet_minnesota_residential_sale_2026','navstreet_minnesota_condominium_resale_2026'], contractTypeRequired: true,
  defaultTimeZone: 'America/Chicago',
  agreementTemplate: { stateCode: 'MN', templateUid: MINNESOTA_DOCUMENT_RULES.templateUid, templateName: 'NavStreet Minnesota Residential Purchase and Sale Agreement', templateVersion: MINNESOTA_DOCUMENT_RULES.version },
  agreementTemplates: [{stateCode:'MN',templateUid:MINNESOTA_DOCUMENT_RULES.templateUid,templateName:'NavStreet Minnesota Residential Purchase and Sale Agreement',templateVersion:MINNESOTA_DOCUMENT_RULES.version},{stateCode:'MN',templateUid:'navstreet-mn-condominium-2026',templateName:'NavStreet Minnesota Condominium Resale Purchase and Sale Agreement',templateVersion:'2026-10-12'}],
  getAgreementTemplate: terms => terms.contractType === 'navstreet_minnesota_condominium_resale_2026' ? {stateCode:'MN',templateUid:'navstreet-mn-condominium-2026',templateName:'NavStreet Minnesota Condominium Resale Purchase and Sale Agreement',templateVersion:'2026-10-12'} : minnesotaStateContractPackage.agreementTemplate,
  createInitialOfferTerms: input => createMinnesotaInitialOfferTerms(input),
  sanitizeDraftTerms: input => sanitizeMinnesotaDraftTerms(input),
  validateSubmission: input => validateMinnesotaSubmission(input),
  validateBeforeSigning: ({ version }) => {
    if (version.terms.disclosures.sellerReportsHoa) {
      const problem = minnesotaAssociationPacketProblem(version.terms.disclosures.associationCertificateDate, version.terms.disclosures.associationPacketReceivedDate);
      if (problem) throw new HttpsError('failed-precondition', problem);
    }
    const { disclosures } = version.terms;
    if (disclosures.propertyConditionStatus !== 'received' || disclosures.statutoryPacketStatus !== 'received' ||
        (disclosures.sellerReportsHoa === true && disclosures.hoaDocumentsStatus !== 'received') ||
        disclosures.leadPaintStatus === 'pending') {
      throw new HttpsError('failed-precondition',
        'This Minnesota offer records required disclosures as not received. The seller must provide them, then the buyer must create and submit a new offer acknowledging actual receipt before either party signs.');
    }
  },
  requiredListingDisclosures: ({ version }) => selectReceivedListingDisclosures(version.terms.disclosures, [
      ['statutoryPacketStatus', 'minnesota-statutory-packet'],
      ['propertyConditionStatus', 'minnesota-seller-disclosure'],
      ['leadPaintStatus', 'lead-based-paint'],
      ['hoaDocumentsStatus', 'minnesota-association-documents'],    ]).concat(version.terms.disclosures.leadPaintStatus === 'exempt' ? ['lead-based-paint'] : []),
  createContractMilestones: input => createMinnesotaContractMilestones(input),
    getAgreementSummary: ({ version: { terms: t } }) => [
    ...summaryFunding(t.purchase.purchasePriceInCents, t.purchase.loanAmountInCents, t.purchase.financingType === 'cash'),
    { label: 'Funding', value: summaryText(t.purchase.financingType) },
    { label: 'Earnest money deposit', value: summaryMoney(t.purchase.hasEarnestMoney === false ? 0 : t.purchase.earnestMoneyInCents) },
    { label: 'Closing / settlement date', value: summaryText(t.deadlines.settlementDate) },
    { label: 'Inspection / due diligence', value: `${t.deadlines.inspectionPeriodDays} calendar days after Effective Date; see agreement counting rules` },
  ],
  generateAgreement: async input => {
    const { generateMinnesotaOfferPdf } = require('./minnesota-offer-pdf.service') as typeof import('./minnesota-offer-pdf.service');
    return generateMinnesotaOfferPdf(input);
  },
}, FEDERAL_LEAD_POLICY), HOA_POLICY);