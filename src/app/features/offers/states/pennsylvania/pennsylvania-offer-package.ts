import {pennsylvaniaConditionRequired} from '../../../../core/domains/offers/state-contracts/pennsylvania/pennsylvania-disclosure-policy';
import { getPennsylvaniaCondominiumSections } from './questions/pennsylvania-condominium.sections';
import { withHoaOfferPolicy } from '../../engine/hoa-offer-policy';
import { withFederalLeadOfferPolicy } from '../../engine/federal-lead-offer-policy';
import type { StateOfferPackage } from '../../engine/models/state-offer-package';
import type { PennsylvaniaOfferTerms, PennsylvaniaContractType } from '../../../../core/domains/offers/state-contracts/pennsylvania/models/pennsylvania-offer-terms.model';
import { PENNSYLVANIA_RESIDENTIAL_CONTRACT_DEFINITION, PENNSYLVANIA_CONDOMINIUM_CONTRACT_DEFINITION } from '../../../../core/domains/offers/state-contracts/pennsylvania/models/pennsylvania-offer-terms.model';
import { createPennsylvaniaInitialOfferTerms } from '../../../../core/domains/offers/state-contracts/pennsylvania/services/pennsylvania-initial-offer-terms.factory';
import { PENNSYLVANIA_RESIDENTIAL_SALE_SECTIONS } from './questions/pennsylvania-residential-sale.sections';
import { PennsylvaniaOfferValidator } from './validators/pennsylvania-offer.validator';
const validator = new PennsylvaniaOfferValidator();
export const PENNSYLVANIA_OFFER_PACKAGE: StateOfferPackage<PennsylvaniaOfferTerms, PennsylvaniaContractType> = withHoaOfferPolicy(withFederalLeadOfferPolicy({
  stateCode: 'PA', stateName: 'Pennsylvania',
  contracts: { navstreet_pennsylvania_residential_sale_2026: PENNSYLVANIA_RESIDENTIAL_CONTRACT_DEFINITION, navstreet_pennsylvania_condominium_resale_2026: PENNSYLVANIA_CONDOMINIUM_CONTRACT_DEFINITION },
  createInitialTerms: input => createPennsylvaniaInitialOfferTerms(input),
  getSections: terms => getPennsylvaniaCondominiumSections(terms,PENNSYLVANIA_RESIDENTIAL_SALE_SECTIONS).map(section=>section.id!=='disclosures'?section:{...section,questions:section.questions.filter(q=>(q.fieldPath!=='disclosures.propertyConditionStatus'||pennsylvaniaConditionRequired(terms))&&(q.fieldPath!=='disclosures.statutoryPacketStatus'||terms.disclosures.requiredKnownFacts))}),
  validate: (terms, buyers, sellers, context) => validator.validate(terms, [...buyers], [...sellers], context),
}, {values:{'disclosures.leadPaintStatus':'built_1978_or_later','disclosures.leadInspectionSelection':'unselected','disclosures.leadInspectionDays':10,'documentVersions.lead-based-paint':undefined},hiddenFields:['disclosures.leadPaintStatus','disclosures.leadInspectionSelection','disclosures.leadInspectionDays']}), {"sellerFactPath":"disclosures.sellerReportsHoa","documentStatusPath":"disclosures.hoaDocumentsStatus","documentTypes":["pennsylvania-association-documents"]});
