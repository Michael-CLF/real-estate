import { withHoaOfferPolicy } from '../../engine/hoa-offer-policy';
import { withFederalLeadOfferPolicy } from '../../engine/federal-lead-offer-policy';
import type { StateOfferPackage } from '../../engine/models/state-offer-package';
import type { IndianaOfferTerms, IndianaContractType } from '../../../../core/domains/offers/state-contracts/indiana/models/indiana-offer-terms.model';
import { INDIANA_RESIDENTIAL_CONTRACT_DEFINITION } from '../../../../core/domains/offers/state-contracts/indiana/models/indiana-offer-terms.model';
import { createIndianaInitialOfferTerms } from '../../../../core/domains/offers/state-contracts/indiana/services/indiana-initial-offer-terms.factory';
import { INDIANA_RESIDENTIAL_SALE_SECTIONS } from './questions/indiana-residential-sale.sections';
import { IndianaOfferValidator } from './validators/indiana-offer.validator';
const validator = new IndianaOfferValidator();
export const INDIANA_OFFER_PACKAGE: StateOfferPackage<IndianaOfferTerms, IndianaContractType> = withHoaOfferPolicy(withFederalLeadOfferPolicy({
  stateCode: 'IN', stateName: 'Indiana',
  contracts: { navstreet_indiana_residential_sale_2026: INDIANA_RESIDENTIAL_CONTRACT_DEFINITION },
  createInitialTerms: input => createIndianaInitialOfferTerms(input),
  getSections: () => INDIANA_RESIDENTIAL_SALE_SECTIONS,
  validate: (terms, buyers, sellers, context) => validator.validate(terms, [...buyers], [...sellers], context),
}, {values:{'disclosures.leadPaintStatus':'built_1978_or_later','disclosures.leadInspectionSelection':'unselected','disclosures.leadInspectionDays':10,'documentVersions.lead-based-paint':undefined},hiddenFields:['disclosures.leadPaintStatus','disclosures.leadInspectionSelection','disclosures.leadInspectionDays']}), {"sellerFactPath":"disclosures.sellerReportsHoa","documentStatusPath":"disclosures.hoaDocumentsStatus","documentTypes":["indiana-association-documents"]});