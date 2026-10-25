import { SECTION_LEGAL_CONTENT_20261025_V1 } from './legal-content/offer-section-content.2026-10-25.v1';
import { HOA_POLICY, FEDERAL_LEAD_POLICY } from '../../../../core/domains/offers/state-contracts/montana/montana-policy-mappings.generated';
import { MONTANA_CONDOMINIUM_CONTRACT_DEFINITION } from '../../../../core/domains/offers/state-contracts/montana/models/montana-offer-terms.model';
import { withHoaOfferPolicy } from '../../engine/hoa-offer-policy';
import { withFederalLeadOfferPolicy } from '../../engine/federal-lead-offer-policy';
import type { StateOfferPackage } from '../../engine/models/state-offer-package';
import type { MontanaOfferTerms, MontanaContractType } from '../../../../core/domains/offers/state-contracts/montana/models/montana-offer-terms.model';
import { MONTANA_RESIDENTIAL_CONTRACT_DEFINITION } from '../../../../core/domains/offers/state-contracts/montana/models/montana-offer-terms.model';
import { createMontanaInitialOfferTerms } from '../../../../core/domains/offers/state-contracts/montana/services/montana-initial-offer-terms.factory';
import { MONTANA_RESIDENTIAL_SALE_SECTIONS } from './questions/montana-residential-sale.sections';
import { MontanaOfferValidator } from './validators/montana-offer.validator';
const validator = new MontanaOfferValidator();
export const MONTANA_OFFER_PACKAGE: StateOfferPackage<MontanaOfferTerms, MontanaContractType> = withHoaOfferPolicy(withFederalLeadOfferPolicy({
  stateCode: 'MT', stateName: 'Montana',
  contracts: { navstreet_montana_residential_sale_2026: MONTANA_RESIDENTIAL_CONTRACT_DEFINITION, navstreet_montana_condominium_resale_2026: MONTANA_CONDOMINIUM_CONTRACT_DEFINITION },
  createInitialTerms: input => createMontanaInitialOfferTerms(input),
  getSections: terms => terms.contractType === 'navstreet_montana_condominium_resale_2026'
    ? MONTANA_RESIDENTIAL_SALE_SECTIONS.map(section => section.id !== 'disclosures' ? section : {...section, questions: section.questions.map(question => question.fieldPath !== 'disclosures.hoaDocumentsStatus' ? question : {...question, label:'Montana condominium documents — actual receipt', options:[{value:'received',label:'Received and reviewed the uploaded condominium packet'},{value:'pending',label:'Not yet received or reviewed'}], helpText:SECTION_LEGAL_CONTENT_20261025_V1["offer_package_helpText"]})})
    : MONTANA_RESIDENTIAL_SALE_SECTIONS,
  validate: (terms, buyers, sellers, context) => validator.validate(terms, [...buyers], [...sellers], context),
}, FEDERAL_LEAD_POLICY), HOA_POLICY);