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
  contracts: { navstreet_montana_residential_sale_2026: MONTANA_RESIDENTIAL_CONTRACT_DEFINITION },
  createInitialTerms: input => createMontanaInitialOfferTerms(input),
  getSections: () => MONTANA_RESIDENTIAL_SALE_SECTIONS,
  validate: (terms, buyers, sellers, context) => validator.validate(terms, [...buyers], [...sellers], context),
}, {values:{'disclosures.leadPaintStatus':'built_1978_or_later','disclosures.leadInspectionSelection':'unselected','disclosures.leadInspectionDays':10,'documentVersions.lead-based-paint':undefined},hiddenFields:['disclosures.leadPaintStatus','disclosures.leadInspectionSelection','disclosures.leadInspectionDays']}), {"sellerFactPath":"disclosures.sellerReportsHoa","documentStatusPath":"disclosures.hoaDocumentsStatus","documentTypes":["montana-association-documents"]});