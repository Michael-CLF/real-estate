import { HOA_POLICY, FEDERAL_LEAD_POLICY } from '../../../../core/domains/offers/state-contracts/ohio/ohio-policy-mappings.generated';
import { withHoaOfferPolicy } from '../../engine/hoa-offer-policy';
import { withFederalLeadOfferPolicy } from '../../engine/federal-lead-offer-policy';
import type { StateOfferPackage } from '../../engine/models/state-offer-package';
import type { OhioOfferTerms, OhioContractType } from '../../../../core/domains/offers/state-contracts/ohio/models/ohio-offer-terms.model';
import { OHIO_RESIDENTIAL_CONTRACT_DEFINITION } from '../../../../core/domains/offers/state-contracts/ohio/models/ohio-offer-terms.model';
import { createOhioInitialOfferTerms } from '../../../../core/domains/offers/state-contracts/ohio/services/ohio-initial-offer-terms.factory';
import { OHIO_RESIDENTIAL_SALE_SECTIONS } from './questions/ohio-residential-sale.sections';
import { OhioOfferValidator } from './validators/ohio-offer.validator';
const validator = new OhioOfferValidator();
export const OHIO_OFFER_PACKAGE: StateOfferPackage<OhioOfferTerms, OhioContractType> = withHoaOfferPolicy(withFederalLeadOfferPolicy({
  stateCode: 'OH', stateName: 'Ohio',
  contracts: { navstreet_ohio_residential_sale_2026: OHIO_RESIDENTIAL_CONTRACT_DEFINITION },
  createInitialTerms: input => createOhioInitialOfferTerms(input),
  getSections: () => OHIO_RESIDENTIAL_SALE_SECTIONS,
  validate: (terms, buyers, sellers, context) => validator.validate(terms, [...buyers], [...sellers], context),
}, FEDERAL_LEAD_POLICY), HOA_POLICY);