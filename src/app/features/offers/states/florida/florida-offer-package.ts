import { STATE_DOCUMENT_REVIEW } from './florida-document-review';
import { withStateDocumentReview } from '../../engine/models/state-document-review';
import { HOA_POLICY, FEDERAL_LEAD_POLICY } from '../../../../core/domains/offers/state-contracts/florida/florida-policy-mappings.generated';
import { withHoaOfferPolicy } from '../../engine/hoa-offer-policy';
import { withFederalLeadOfferPolicy } from '../../engine/federal-lead-offer-policy';
import type { StateOfferPackage } from '../../engine/models/state-offer-package';
import type { FloridaOfferTerms, FloridaContractType } from '../../../../core/domains/offers/state-contracts/florida/models/florida-offer-terms.model';
import { FLORIDA_RESIDENTIAL_CONTRACT_DEFINITION } from '../../../../core/domains/offers/state-contracts/florida/models/florida-offer-terms.model';
import { createFloridaInitialOfferTerms } from '../../../../core/domains/offers/state-contracts/florida/services/florida-initial-offer-terms.factory';
import { FLORIDA_RESIDENTIAL_SALE_SECTIONS } from './questions/florida-residential-sale.sections';
import { FloridaOfferValidator } from './validators/florida-offer.validator';
const validator = new FloridaOfferValidator();
export const FLORIDA_OFFER_PACKAGE: StateOfferPackage<FloridaOfferTerms, FloridaContractType> = withStateDocumentReview(withHoaOfferPolicy(withFederalLeadOfferPolicy({
  stateCode: 'FL', stateName: 'Florida',
  contracts: { navstreet_florida_residential_sale_2026: FLORIDA_RESIDENTIAL_CONTRACT_DEFINITION },
  createInitialTerms: input => createFloridaInitialOfferTerms(input),
  getSections: () => FLORIDA_RESIDENTIAL_SALE_SECTIONS,
  validate: (terms, buyers, sellers, context) => validator.validate(terms, [...buyers], [...sellers], context),
}, FEDERAL_LEAD_POLICY), HOA_POLICY), STATE_DOCUMENT_REVIEW);