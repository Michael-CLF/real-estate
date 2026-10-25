import { HOA_POLICY, FEDERAL_LEAD_POLICY } from '../../../../core/domains/offers/state-contracts/kansas/kansas-policy-mappings.generated';
import { withHoaOfferPolicy } from '../../engine/hoa-offer-policy';
import { withFederalLeadOfferPolicy } from '../../engine/federal-lead-offer-policy';
import type { StateOfferPackage } from '../../engine/models/state-offer-package';
import type { KansasOfferTerms, KansasContractType } from '../../../../core/domains/offers/state-contracts/kansas/models/kansas-offer-terms.model';
import { KANSAS_RESIDENTIAL_CONTRACT_DEFINITION } from '../../../../core/domains/offers/state-contracts/kansas/models/kansas-offer-terms.model';
import { createKansasInitialOfferTerms } from '../../../../core/domains/offers/state-contracts/kansas/services/kansas-initial-offer-terms.factory';
import { KANSAS_RESIDENTIAL_SALE_SECTIONS } from './questions/kansas-residential-sale.sections';
import { KansasOfferValidator } from './validators/kansas-offer.validator';
const validator = new KansasOfferValidator();
export const KANSAS_OFFER_PACKAGE: StateOfferPackage<KansasOfferTerms, KansasContractType> = withHoaOfferPolicy(withFederalLeadOfferPolicy({
  stateCode: 'KS', stateName: 'Kansas',
  contracts: { navstreet_kansas_residential_sale_2026: KANSAS_RESIDENTIAL_CONTRACT_DEFINITION },
  createInitialTerms: input => createKansasInitialOfferTerms(input),
  getSections: () => KANSAS_RESIDENTIAL_SALE_SECTIONS,
  validate: (terms, buyers, sellers, context) => validator.validate(terms, [...buyers], [...sellers], context),
}, FEDERAL_LEAD_POLICY), HOA_POLICY);