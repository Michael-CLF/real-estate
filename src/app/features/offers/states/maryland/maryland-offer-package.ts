import { STATE_DOCUMENT_REVIEW } from './maryland-document-review';
import { withStateDocumentReview } from '../../engine/models/state-document-review';
import { HOA_POLICY, FEDERAL_LEAD_POLICY } from '../../../../core/domains/offers/state-contracts/maryland/maryland-policy-mappings.generated';
import { getMarylandCondominiumSections } from './questions/maryland-condominium.sections';
import { withHoaOfferPolicy } from '../../engine/hoa-offer-policy';
import { withFederalLeadOfferPolicy } from '../../engine/federal-lead-offer-policy';
import type { StateOfferPackage } from '../../engine/models/state-offer-package';
import type { MarylandOfferTerms, MarylandContractType } from '../../../../core/domains/offers/state-contracts/maryland/models/maryland-offer-terms.model';
import { MARYLAND_RESIDENTIAL_CONTRACT_DEFINITION, MARYLAND_CONDOMINIUM_CONTRACT_DEFINITION } from '../../../../core/domains/offers/state-contracts/maryland/models/maryland-offer-terms.model';
import { createMarylandInitialOfferTerms } from '../../../../core/domains/offers/state-contracts/maryland/services/maryland-initial-offer-terms.factory';
import { MARYLAND_RESIDENTIAL_SALE_SECTIONS } from './questions/maryland-residential-sale.sections';
import { MarylandOfferValidator } from './validators/maryland-offer.validator';
const validator = new MarylandOfferValidator();
export const MARYLAND_OFFER_PACKAGE: StateOfferPackage<MarylandOfferTerms, MarylandContractType> = withStateDocumentReview(withHoaOfferPolicy(withFederalLeadOfferPolicy({
  stateCode: 'MD', stateName: 'Maryland',
  contracts: { navstreet_maryland_residential_sale_2026: MARYLAND_RESIDENTIAL_CONTRACT_DEFINITION, navstreet_maryland_condominium_resale_2026: MARYLAND_CONDOMINIUM_CONTRACT_DEFINITION },
  createInitialTerms: input => createMarylandInitialOfferTerms(input),
  getSections: terms => getMarylandCondominiumSections(terms,MARYLAND_RESIDENTIAL_SALE_SECTIONS),
  validate: (terms, buyers, sellers, context) => validator.validate(terms, [...buyers], [...sellers], context),
}, FEDERAL_LEAD_POLICY), HOA_POLICY), STATE_DOCUMENT_REVIEW);