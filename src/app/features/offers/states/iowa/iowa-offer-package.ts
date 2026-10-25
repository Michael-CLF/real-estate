import { HOA_POLICY, FEDERAL_LEAD_POLICY } from '../../../../core/domains/offers/state-contracts/iowa/iowa-policy-mappings.generated';
import { getIowaPreofferSections } from './questions/iowa-preoffer.sections';
import { withHoaOfferPolicy } from '../../engine/hoa-offer-policy';
import { withFederalLeadOfferPolicy } from '../../engine/federal-lead-offer-policy';
import type { StateOfferPackage } from '../../engine/models/state-offer-package';
import type { IowaOfferTerms, IowaContractType } from '../../../../core/domains/offers/state-contracts/iowa/models/iowa-offer-terms.model';
import { IOWA_RESIDENTIAL_CONTRACT_DEFINITION } from '../../../../core/domains/offers/state-contracts/iowa/models/iowa-offer-terms.model';
import { createIowaInitialOfferTerms } from '../../../../core/domains/offers/state-contracts/iowa/services/iowa-initial-offer-terms.factory';
import { IOWA_RESIDENTIAL_SALE_SECTIONS } from './questions/iowa-residential-sale.sections';
import { IowaOfferValidator } from './validators/iowa-offer.validator';
const validator = new IowaOfferValidator();
export const IOWA_OFFER_PACKAGE: StateOfferPackage<IowaOfferTerms, IowaContractType> = withHoaOfferPolicy(withFederalLeadOfferPolicy({
  stateCode: 'IA', stateName: 'Iowa',
  contracts: { navstreet_iowa_residential_sale_2026: IOWA_RESIDENTIAL_CONTRACT_DEFINITION },
  createInitialTerms: input => createIowaInitialOfferTerms(input),
  getSections: terms => getIowaPreofferSections(terms, IOWA_RESIDENTIAL_SALE_SECTIONS),
  validate: (terms, buyers, sellers, context) => validator.validate(terms, [...buyers], [...sellers], context),
}, FEDERAL_LEAD_POLICY), HOA_POLICY);