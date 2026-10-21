import { withHoaContractPolicy } from '../hoa-contract-policy';
import { withFederalLeadContractPolicy } from '../federal-lead-contract-policy';
import { MISSOURI_CONTRACT_NAMES, selectMissouriContract } from './missouri-contract-selection';
import { assertMissouriListingDisclosures } from '../../missouri-listing-disclosure-gate';
import { selectReceivedListingDisclosures } from '../received-listing-disclosures';
import { summaryFunding, summaryMoney, summaryText } from '../navstreet-pdf-layout';
import type { StateContractPackage } from '../state-contract-package';
import type { MissouriOfferTermsDocument } from './missouri-offer-terms.document';
import { MISSOURI_DOCUMENT_RULES } from './missouri-document-rules';
import { createMissouriInitialOfferTerms } from './missouri-initial-terms';
import { sanitizeMissouriDraftTerms } from './missouri-draft-terms-sanitizer';
import { validateMissouriSubmission } from './missouri-submission-validator';
import { HttpsError } from 'firebase-functions/v2/https';
import { createMissouriContractMilestones } from './missouri-contract-milestones';
export const missouriStateContractPackage: StateContractPackage<MissouriOfferTermsDocument> = withHoaContractPolicy(withFederalLeadContractPolicy({
  listingDisclosurePolicy: { assertReady: assertMissouriListingDisclosures, reviewedVersions: ({version}) => version.terms.documentVersions },
  stateCode: 'MO', offerCreationEnabled: true,
  maximumDwellingUnits:4,
  requireOwnershipFacts:true,
  supportedPropertyTypes: ['single_family','townhome','pud','condo','land','multi_family'],
  contractTypes: Object.keys(MISSOURI_CONTRACT_NAMES), contractTypeRequired: true,
  defaultTimeZone: 'America/Chicago',
  agreementTemplate: { stateCode: 'MO', templateUid: MISSOURI_DOCUMENT_RULES.templateUid, templateName: 'NavStreet Missouri Residential Purchase and Sale Agreement', templateVersion: MISSOURI_DOCUMENT_RULES.version },
  agreementTemplates: [...Object.entries(MISSOURI_CONTRACT_NAMES).map(([key,name]) => ({stateCode:'MO',templateUid:key === 'navstreet_missouri_residential_sale_2026' ? MISSOURI_DOCUMENT_RULES.templateUid : key,templateName:name,templateVersion:key === 'navstreet_missouri_residential_sale_2026' ? MISSOURI_DOCUMENT_RULES.version : '2026-10-12'})), {stateCode:'MO',templateUid:'navstreet_missouri_condominium_resale_2026',templateName:MISSOURI_CONTRACT_NAMES.navstreet_missouri_condominium_resale_2026,templateVersion:'2026-10-19'}],
  getAgreementTemplate: terms => {
    const name = MISSOURI_CONTRACT_NAMES[terms.contractType];
    if (!name) throw new HttpsError('failed-precondition','Unsupported Missouri agreement.');
    return {stateCode:'MO',templateUid:terms.contractType === 'navstreet_missouri_residential_sale_2026' ? MISSOURI_DOCUMENT_RULES.templateUid : terms.contractType,templateName:name,templateVersion:terms.contractType === 'navstreet_missouri_condominium_resale_2026' && terms.condominiumOfferEntryRevision === '2026-10-19' ? '2026-10-19' : terms.contractType === 'navstreet_missouri_residential_sale_2026' ? MISSOURI_DOCUMENT_RULES.version : '2026-10-12'};
  },
  createInitialOfferTerms: input => createMissouriInitialOfferTerms(input),
  sanitizeDraftTerms: input => sanitizeMissouriDraftTerms(input),
  assertListingContractCompatible: (listing, version) => {
    const facts = (listing['sellerStatements'] as Record<string,any> | undefined)?.['contractFacts'];
    // Ordinary legacy residential threads can continue without newly added answers.
    if (!facts && version.terms.contractType === 'navstreet_missouri_residential_sale_2026' && ['single_family','townhome','pud'].includes(String(listing['propertyType']))) return;
    try {
      if (selectMissouriContract(String(listing['propertyType']), facts) === version.terms.contractType) return;
    } catch {}
    throw new HttpsError('failed-precondition','The listing ownership and this agreement no longer match. Use the correct agreement in a new offer; an existing signed version cannot be rewritten.');
  },
  validateSubmission: input => validateMissouriSubmission(input),
  validateBeforeSigning: ({ version }) => {
    const { disclosures } = version.terms;
    if (disclosures.methDisclosureRequired && disclosures.statutoryPacketStatus !== 'received') throw new HttpsError('failed-precondition','Review the Missouri known-history disclosure before signing.');
    if (
        
        disclosures.leadPaintStatus === 'pending') {
      throw new HttpsError('failed-precondition',
        'This Missouri offer records required disclosures as not received. The seller must provide them, then the buyer must create and submit a new offer acknowledging actual receipt before either party signs.');
    }
  },
  requiredListingDisclosures: ({ version }) => selectReceivedListingDisclosures(version.terms.disclosures, [
      ['statutoryPacketStatus', 'missouri-statutory-packet'],
      ['propertyConditionStatus', 'missouri-seller-disclosure'],
      ['leadPaintStatus', 'lead-based-paint'],
      ['hoaDocumentsStatus', 'missouri-association-documents'],    ]).filter(type => type !== 'missouri-association-documents' || version.terms.contractType !== 'navstreet_missouri_condominium_resale_2026').concat(version.terms.specialProperty?.resaleCertificateStatus === 'received' ? ['missouri-condominium-resale-certificate'] : []).concat(version.terms.specialProperty?.tenantDocumentsStatus === 'received' ? ['missouri-tenant-records'] : []).concat(version.terms.disclosures.propertyConditionStatus === 'exempt' ? ['missouri-seller-disclosure'] : []).concat(version.terms.disclosures.leadPaintStatus === 'exempt' ? ['lead-based-paint'] : []),
  createContractMilestones: input => createMissouriContractMilestones(input),
    getAgreementSummary: ({ version: { terms: t } }) => [
    ...summaryFunding(t.purchase.purchasePriceInCents, t.purchase.loanAmountInCents, t.purchase.financingType === 'cash'),
    { label: 'Funding', value: summaryText(t.purchase.financingType) },
    { label: 'Earnest money deposit', value: summaryMoney(t.purchase.hasEarnestMoney === false ? 0 : t.purchase.earnestMoneyInCents) },
    { label: 'Closing / settlement date', value: summaryText(t.deadlines.settlementDate) },
    { label: 'Inspection / due diligence', value: `${t.deadlines.inspectionPeriodDays} calendar days after Effective Date; see agreement counting rules` },
  ],
  generateAgreement: async input => {
    const { generateMissouriOfferPdf } = require('./missouri-offer-pdf.service') as typeof import('./missouri-offer-pdf.service');
    return generateMissouriOfferPdf(input);
  },
}, {values:{'disclosures.leadPaintStatus':'built_1978_or_later','disclosures.leadInspectionSelection':'unselected','disclosures.leadInspectionDays':10,'documentVersions.lead-based-paint':undefined},nonHousingValues:{'disclosures.leadPaintStatus':'not_applicable'},hiddenFields:['disclosures.leadPaintStatus','disclosures.leadInspectionSelection','disclosures.leadInspectionDays']}), {"sellerFactPath":"disclosures.sellerReportsHoa","documentStatusPath":"disclosures.hoaDocumentsStatus","documentTypes":["missouri-association-documents"]});