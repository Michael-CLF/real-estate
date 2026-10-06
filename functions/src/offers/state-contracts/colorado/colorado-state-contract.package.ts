import { summaryFunding, summaryMoney, summaryText } from '../navstreet-pdf-layout';
import { HttpsError } from 'firebase-functions/v2/https';
import type { StateContractPackage } from '../state-contract-package';
import type { ColoradoOfferTermsDocument } from './colorado-offer-terms.document';
import { COLORADO_DOCUMENT_RULES } from './colorado-document-rules';
import { createColoradoInitialOfferTerms } from './colorado-initial-terms';
import { sanitizeColoradoDraftTerms } from './colorado-draft-terms-sanitizer';
import { validateColoradoSubmission } from './colorado-submission-validator';
import { createColoradoContractMilestones } from './colorado-contract-milestones';
import { generateColoradoOfferPdf } from './colorado-offer-pdf.service';

export const coloradoStateContractPackage: StateContractPackage<ColoradoOfferTermsDocument> = {
  stateCode: 'CO', offerCreationEnabled: true,
  contractTypes: ['navstreet_colorado_residential_2026'], contractTypeRequired: true,
  defaultTimeZone: 'America/Denver',
  agreementTemplate: {
    stateCode: 'CO', templateUid: COLORADO_DOCUMENT_RULES.templateUid,
    templateName: 'NavStreet Colorado Residential Purchase and Sale Agreement',
    templateVersion: COLORADO_DOCUMENT_RULES.version,
  },
  createInitialOfferTerms: createColoradoInitialOfferTerms,
  sanitizeDraftTerms: sanitizeColoradoDraftTerms,
  validateSubmission: validateColoradoSubmission,
  validateBeforeSigning: ({ version }) => {
    const s = version.terms.disclosures;
    if (s.sellerPropertyStatus !== 'received' ||
      (s.leadPaintStatus !== 'received' && s.leadPaintStatus !== 'not_applicable') ||
      !s.radonInformationAcknowledged || !s.radonBrochureAcknowledged) {
      throw new HttpsError('failed-precondition', 'Review the Colorado seller, radon and applicable lead documents before signing.');
    }
  },
  requiredListingDisclosures: ({ version }) => [
    COLORADO_DOCUMENT_RULES.propertyDisclosure,
    COLORADO_DOCUMENT_RULES.radonBrochure,
    ...(version.terms.disclosures.leadPaintStatus === 'received' ? ['lead-based-paint'] : []),
  ],
  createContractMilestones: createColoradoContractMilestones,
    getAgreementSummary: ({ version: { terms: t } }) => [
    ...summaryFunding(t.purchase.purchasePriceInCents,
      t.purchase.financingType === 'assumption' ? undefined : t.purchase.newLoanAmountInCents,
      t.purchase.financingType === 'cash'),
    { label: 'Funding', value: summaryText(t.purchase.financingType === 'new_loan' ? t.purchase.newLoanType : t.purchase.financingType) },
    { label: 'Earnest money deposit', value: summaryMoney(t.purchase.earnestMoneyInCents) },
    { label: 'Closing date', value: summaryText(t.deadlines.closing) },
    { label: 'Inspection objection / termination', value: `Objection: ${summaryText(t.deadlines.inspectionObjection)}; termination: ${summaryText(t.deadlines.inspectionTermination)}; ${summaryText(t.deadlines.timeOfDay)} Mountain time; see holiday rules` },
  ],
  generateAgreement: generateColoradoOfferPdf,
};
