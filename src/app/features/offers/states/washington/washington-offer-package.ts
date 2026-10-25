import { HOA_POLICY, FEDERAL_LEAD_POLICY } from '../../../../core/domains/offers/state-contracts/washington/washington-policy-mappings.generated';
import { getWashingtonCondominiumSections } from './questions/washington-condominium.sections';
import { withHoaOfferPolicy } from '../../engine/hoa-offer-policy';
import { withFederalLeadOfferPolicy } from '../../engine/federal-lead-offer-policy';
import type { StateOfferPackage } from '../../engine/models/state-offer-package';
import type { WashingtonOfferTerms, WashingtonContractType } from '../../../../core/domains/offers/state-contracts/washington/models/washington-offer-terms.model';
import { WASHINGTON_RESIDENTIAL_CONTRACT_DEFINITION, WASHINGTON_CONDOMINIUM_CONTRACT_DEFINITION } from '../../../../core/domains/offers/state-contracts/washington/models/washington-offer-terms.model';
import { createWashingtonInitialOfferTerms } from '../../../../core/domains/offers/state-contracts/washington/services/washington-initial-offer-terms.factory';
import { WASHINGTON_RESIDENTIAL_SALE_SECTIONS } from './questions/washington-residential-sale.sections';
import { WashingtonOfferValidator } from './validators/washington-offer.validator';
const validator = new WashingtonOfferValidator();
export const WASHINGTON_OFFER_PACKAGE: StateOfferPackage<WashingtonOfferTerms, WashingtonContractType> = withHoaOfferPolicy(withFederalLeadOfferPolicy({
  stateCode: 'WA', stateName: 'Washington',
  contracts: { navstreet_washington_residential_sale_2026: WASHINGTON_RESIDENTIAL_CONTRACT_DEFINITION, navstreet_washington_condominium_resale_2026: WASHINGTON_CONDOMINIUM_CONTRACT_DEFINITION },
  createInitialTerms: input => createWashingtonInitialOfferTerms(input),
  getSections: terms => getWashingtonCondominiumSections(terms, WASHINGTON_RESIDENTIAL_SALE_SECTIONS),
  validate: (terms, buyers, sellers, context) => validator.validate(terms, [...buyers], [...sellers], context),
}, FEDERAL_LEAD_POLICY), HOA_POLICY);