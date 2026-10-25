import { STATE_DOCUMENT_REVIEW } from './idaho-document-review';
import { withStateDocumentReview } from '../../engine/models/state-document-review';
import { HOA_POLICY, FEDERAL_LEAD_POLICY } from '../../../../core/domains/offers/state-contracts/idaho/idaho-policy-mappings.generated';
import { withHoaOfferPolicy } from '../../engine/hoa-offer-policy';
import { withFederalLeadOfferPolicy } from '../../engine/federal-lead-offer-policy';
import type { StateOfferPackage } from '../../engine/models/state-offer-package';
import type { IdahoOfferTerms, IdahoContractType } from '../../../../core/domains/offers/state-contracts/idaho/models/idaho-offer-terms.model';
import { IDAHO_RESIDENTIAL_CONTRACT_DEFINITION } from '../../../../core/domains/offers/state-contracts/idaho/models/idaho-offer-terms.model';
import { createIdahoInitialOfferTerms } from '../../../../core/domains/offers/state-contracts/idaho/services/idaho-initial-offer-terms.factory';
import { IDAHO_RESIDENTIAL_SALE_SECTIONS } from './questions/idaho-residential-sale.sections';
import { IdahoOfferValidator } from './validators/idaho-offer.validator';
const validator = new IdahoOfferValidator();
export const IDAHO_OFFER_PACKAGE: StateOfferPackage<IdahoOfferTerms, IdahoContractType> = withStateDocumentReview(withHoaOfferPolicy(withFederalLeadOfferPolicy({
  stateCode: 'ID', stateName: 'Idaho',
  contracts: { navstreet_idaho_residential_sale_2026: IDAHO_RESIDENTIAL_CONTRACT_DEFINITION },
  createInitialTerms: input => createIdahoInitialOfferTerms(input),
  getSections: () => IDAHO_RESIDENTIAL_SALE_SECTIONS,
  validate: (terms, buyers, sellers, context) => validator.validate(terms, [...buyers], [...sellers], context),
}, FEDERAL_LEAD_POLICY), HOA_POLICY), STATE_DOCUMENT_REVIEW);