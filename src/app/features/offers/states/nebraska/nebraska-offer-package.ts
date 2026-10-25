import { HOA_POLICY, FEDERAL_LEAD_POLICY } from '../../../../core/domains/offers/state-contracts/nebraska/nebraska-policy-mappings.generated';
import { withHoaOfferPolicy } from '../../engine/hoa-offer-policy';
import { withFederalLeadOfferPolicy } from '../../engine/federal-lead-offer-policy';
import type { StateOfferPackage } from '../../engine/models/state-offer-package';
import type { NebraskaOfferTerms, NebraskaContractType } from '../../../../core/domains/offers/state-contracts/nebraska/models/nebraska-offer-terms.model';
import { NEBRASKA_RESIDENTIAL_CONTRACT_DEFINITION } from '../../../../core/domains/offers/state-contracts/nebraska/models/nebraska-offer-terms.model';
import { createNebraskaInitialOfferTerms } from '../../../../core/domains/offers/state-contracts/nebraska/services/nebraska-initial-offer-terms.factory';
import { NEBRASKA_RESIDENTIAL_SALE_SECTIONS } from './questions/nebraska-residential-sale.sections';
import { NebraskaOfferValidator } from './validators/nebraska-offer.validator';
const validator = new NebraskaOfferValidator();
export const NEBRASKA_OFFER_PACKAGE: StateOfferPackage<NebraskaOfferTerms, NebraskaContractType> = withHoaOfferPolicy(withFederalLeadOfferPolicy({
  stateCode: 'NE', stateName: 'Nebraska',
  contracts: { navstreet_nebraska_residential_sale_2026: NEBRASKA_RESIDENTIAL_CONTRACT_DEFINITION },
  createInitialTerms: input => createNebraskaInitialOfferTerms(input),
  getSections: () => NEBRASKA_RESIDENTIAL_SALE_SECTIONS,
  validate: (terms, buyers, sellers, context) => validator.validate(terms, [...buyers], [...sellers], context),
}, FEDERAL_LEAD_POLICY), HOA_POLICY);