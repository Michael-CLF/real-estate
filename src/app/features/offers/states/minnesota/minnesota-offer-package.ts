import { HOA_POLICY, FEDERAL_LEAD_POLICY } from '../../../../core/domains/offers/state-contracts/minnesota/minnesota-policy-mappings.generated';
import { withHoaOfferPolicy } from '../../engine/hoa-offer-policy';
import { withFederalLeadOfferPolicy } from '../../engine/federal-lead-offer-policy';
import {getMinnesotaCondominiumSections} from './questions/minnesota-condominium.sections';
import type { StateOfferPackage } from '../../engine/models/state-offer-package';
import type { MinnesotaOfferTerms, MinnesotaContractType } from '../../../../core/domains/offers/state-contracts/minnesota/models/minnesota-offer-terms.model';
import { MINNESOTA_RESIDENTIAL_CONTRACT_DEFINITION, MINNESOTA_CONDOMINIUM_CONTRACT_DEFINITION } from '../../../../core/domains/offers/state-contracts/minnesota/models/minnesota-offer-terms.model';
import { createMinnesotaInitialOfferTerms } from '../../../../core/domains/offers/state-contracts/minnesota/services/minnesota-initial-offer-terms.factory';
import { MINNESOTA_RESIDENTIAL_SALE_SECTIONS } from './questions/minnesota-residential-sale.sections';
import { MinnesotaOfferValidator } from './validators/minnesota-offer.validator';
const validator = new MinnesotaOfferValidator();
export const MINNESOTA_OFFER_PACKAGE: StateOfferPackage<MinnesotaOfferTerms, MinnesotaContractType> = withHoaOfferPolicy(withFederalLeadOfferPolicy({
  stateCode: 'MN', stateName: 'Minnesota',
  contracts: { navstreet_minnesota_residential_sale_2026: MINNESOTA_RESIDENTIAL_CONTRACT_DEFINITION, navstreet_minnesota_condominium_resale_2026: MINNESOTA_CONDOMINIUM_CONTRACT_DEFINITION },
  createInitialTerms: input => createMinnesotaInitialOfferTerms(input),
  getSections: terms => getMinnesotaCondominiumSections(terms,MINNESOTA_RESIDENTIAL_SALE_SECTIONS),
  validate: (terms, buyers, sellers, context) => validator.validate(terms, [...buyers], [...sellers], context),
}, FEDERAL_LEAD_POLICY), HOA_POLICY);