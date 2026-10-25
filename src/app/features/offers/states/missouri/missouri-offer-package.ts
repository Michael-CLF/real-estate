import { HOA_POLICY, FEDERAL_LEAD_POLICY } from '../../../../core/domains/offers/state-contracts/missouri/missouri-policy-mappings.generated';
import { withHoaOfferPolicy } from '../../engine/hoa-offer-policy';
import { withFederalLeadOfferPolicy } from '../../engine/federal-lead-offer-policy';
import { MISSOURI_CONDOMINIUM_RESALE_CONTRACT_DEFINITION, MISSOURI_LAND_SALE_CONTRACT_DEFINITION, MISSOURI_SMALL_MULTIFAMILY_RESALE_CONTRACT_DEFINITION } from '../../../../core/domains/offers/state-contracts/missouri/models/missouri-offer-terms.model';
import { getMissouriSections } from './questions/missouri-special-property.sections';
import type { StateOfferPackage } from '../../engine/models/state-offer-package';
import type { MissouriOfferTerms, MissouriContractType } from '../../../../core/domains/offers/state-contracts/missouri/models/missouri-offer-terms.model';
import { MISSOURI_RESIDENTIAL_CONTRACT_DEFINITION } from '../../../../core/domains/offers/state-contracts/missouri/models/missouri-offer-terms.model';
import { createMissouriInitialOfferTerms } from '../../../../core/domains/offers/state-contracts/missouri/services/missouri-initial-offer-terms.factory';
import { MISSOURI_RESIDENTIAL_SALE_SECTIONS } from './questions/missouri-residential-sale.sections';
import { MissouriOfferValidator } from './validators/missouri-offer.validator';
const validator = new MissouriOfferValidator();
export const MISSOURI_OFFER_PACKAGE: StateOfferPackage<MissouriOfferTerms, MissouriContractType> = withHoaOfferPolicy(withFederalLeadOfferPolicy({
  stateCode: 'MO', stateName: 'Missouri',
  contracts: {navstreet_missouri_residential_sale_2026:MISSOURI_RESIDENTIAL_CONTRACT_DEFINITION,navstreet_missouri_condominium_resale_2026:MISSOURI_CONDOMINIUM_RESALE_CONTRACT_DEFINITION,navstreet_missouri_land_sale_2026:MISSOURI_LAND_SALE_CONTRACT_DEFINITION,navstreet_missouri_small_multifamily_resale_2026:MISSOURI_SMALL_MULTIFAMILY_RESALE_CONTRACT_DEFINITION},
  createInitialTerms: input => createMissouriInitialOfferTerms(input),
  getSections: terms => getMissouriSections(terms, MISSOURI_RESIDENTIAL_SALE_SECTIONS),
  validate: (terms, buyers, sellers, context) => validator.validate(terms, [...buyers], [...sellers], context),
}, FEDERAL_LEAD_POLICY), HOA_POLICY);