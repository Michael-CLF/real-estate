import { STATE_DOCUMENT_REVIEW } from './new-mexico-document-review';
import { withStateDocumentReview } from '../../engine/models/state-document-review';
import { HOA_POLICY, FEDERAL_LEAD_POLICY } from '../../../../core/domains/offers/state-contracts/new-mexico/new-mexico-policy-mappings.generated';
import { getNewMexicoCondominiumSections } from './questions/new-mexico-condominium.sections';
import { withHoaOfferPolicy } from '../../engine/hoa-offer-policy';
import { withFederalLeadOfferPolicy } from '../../engine/federal-lead-offer-policy';
import type { StateOfferPackage } from '../../engine/models/state-offer-package';
import type { NewMexicoOfferTerms, NewMexicoContractType } from '../../../../core/domains/offers/state-contracts/new-mexico/models/new-mexico-offer-terms.model';
import { NEW_MEXICO_RESIDENTIAL_CONTRACT_DEFINITION, NEW_MEXICO_CONDOMINIUM_CONTRACT_DEFINITION } from '../../../../core/domains/offers/state-contracts/new-mexico/models/new-mexico-offer-terms.model';
import { createNewMexicoInitialOfferTerms } from '../../../../core/domains/offers/state-contracts/new-mexico/services/new-mexico-initial-offer-terms.factory';
import { NEW_MEXICO_RESIDENTIAL_SALE_SECTIONS } from './questions/new-mexico-residential-sale.sections';
import { NewMexicoOfferValidator } from './validators/new-mexico-offer.validator';
const validator = new NewMexicoOfferValidator();
export const NEW_MEXICO_OFFER_PACKAGE: StateOfferPackage<NewMexicoOfferTerms, NewMexicoContractType> = withStateDocumentReview(withHoaOfferPolicy(withFederalLeadOfferPolicy({
  stateCode: 'NM', stateName: 'New Mexico',
  contracts: { navstreet_new_mexico_residential_sale_2026: NEW_MEXICO_RESIDENTIAL_CONTRACT_DEFINITION, navstreet_new_mexico_condominium_resale_2026: NEW_MEXICO_CONDOMINIUM_CONTRACT_DEFINITION },
  createInitialTerms: input => createNewMexicoInitialOfferTerms(input),
  getSections: terms => getNewMexicoCondominiumSections(terms,NEW_MEXICO_RESIDENTIAL_SALE_SECTIONS),
  validate: (terms, buyers, sellers, context) => validator.validate(terms, [...buyers], [...sellers], context),
}, FEDERAL_LEAD_POLICY), HOA_POLICY), STATE_DOCUMENT_REVIEW);