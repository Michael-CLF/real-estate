import { STATE_DOCUMENT_REVIEW } from './south-dakota-document-review';
import { withStateDocumentReview } from '../../engine/models/state-document-review';
import { HOA_POLICY, FEDERAL_LEAD_POLICY } from '../../../../core/domains/offers/state-contracts/south-dakota/south-dakota-policy-mappings.generated';
import { getSouthDakotaCondominiumSections } from './questions/south-dakota-condominium.sections';
import { withHoaOfferPolicy } from '../../engine/hoa-offer-policy';
import { withFederalLeadOfferPolicy } from '../../engine/federal-lead-offer-policy';
import type { StateOfferPackage } from '../../engine/models/state-offer-package';
import type { SouthDakotaOfferTerms, SouthDakotaContractType } from '../../../../core/domains/offers/state-contracts/south-dakota/models/south-dakota-offer-terms.model';
import { SOUTH_DAKOTA_RESIDENTIAL_CONTRACT_DEFINITION, SOUTH_DAKOTA_CONDOMINIUM_CONTRACT_DEFINITION } from '../../../../core/domains/offers/state-contracts/south-dakota/models/south-dakota-offer-terms.model';
import { createSouthDakotaInitialOfferTerms } from '../../../../core/domains/offers/state-contracts/south-dakota/services/south-dakota-initial-offer-terms.factory';
import { SOUTH_DAKOTA_RESIDENTIAL_SALE_SECTIONS } from './questions/south-dakota-residential-sale.sections';
import { SouthDakotaOfferValidator } from './validators/south-dakota-offer.validator';
const validator = new SouthDakotaOfferValidator();
export const SOUTH_DAKOTA_OFFER_PACKAGE: StateOfferPackage<SouthDakotaOfferTerms, SouthDakotaContractType> = withStateDocumentReview(withHoaOfferPolicy(withFederalLeadOfferPolicy({
  stateCode: 'SD', stateName: 'South Dakota',
  contracts: { navstreet_south_dakota_residential_sale_2026: SOUTH_DAKOTA_RESIDENTIAL_CONTRACT_DEFINITION, navstreet_south_dakota_condominium_resale_2026: SOUTH_DAKOTA_CONDOMINIUM_CONTRACT_DEFINITION },
  createInitialTerms: input => createSouthDakotaInitialOfferTerms(input),
  getSections: terms => getSouthDakotaCondominiumSections(terms,SOUTH_DAKOTA_RESIDENTIAL_SALE_SECTIONS),
  validate: (terms, buyers, sellers, context) => validator.validate(terms, [...buyers], [...sellers], context),
}, FEDERAL_LEAD_POLICY), HOA_POLICY), STATE_DOCUMENT_REVIEW);