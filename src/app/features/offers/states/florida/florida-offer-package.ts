import { withHoaOfferPolicy } from '../../engine/hoa-offer-policy';
import { withFederalLeadOfferPolicy } from '../../engine/federal-lead-offer-policy';
import type { StateOfferPackage } from '../../engine/models/state-offer-package';
import type { FloridaOfferTerms, FloridaContractType } from '../../../../core/domains/offers/state-contracts/florida/models/florida-offer-terms.model';
import { FLORIDA_RESIDENTIAL_CONTRACT_DEFINITION } from '../../../../core/domains/offers/state-contracts/florida/models/florida-offer-terms.model';
import { createFloridaInitialOfferTerms } from '../../../../core/domains/offers/state-contracts/florida/services/florida-initial-offer-terms.factory';
import { FLORIDA_RESIDENTIAL_SALE_SECTIONS } from './questions/florida-residential-sale.sections';
import { FloridaOfferValidator } from './validators/florida-offer.validator';
const validator = new FloridaOfferValidator();
export const FLORIDA_OFFER_PACKAGE: StateOfferPackage<FloridaOfferTerms, FloridaContractType> = withHoaOfferPolicy(withFederalLeadOfferPolicy({
  stateCode: 'FL', stateName: 'Florida',
  contracts: { navstreet_florida_residential_sale_2026: FLORIDA_RESIDENTIAL_CONTRACT_DEFINITION },
  createInitialTerms: input => createFloridaInitialOfferTerms(input),
  getSections: () => FLORIDA_RESIDENTIAL_SALE_SECTIONS,
  validate: (terms, buyers, sellers, context) => validator.validate(terms, [...buyers], [...sellers], context),
}, {values:{'disclosures.leadPaintStatus':'built_1978_or_later','disclosures.leadInspectionSelection':'unselected','disclosures.leadInspectionDays':10,'documentVersions.lead-based-paint':undefined},hiddenFields:['disclosures.leadPaintStatus','disclosures.leadInspectionSelection','disclosures.leadInspectionDays']}), {"sellerFactPath":"disclosures.sellerReportsHoa","documentStatusPath":"disclosures.hoaDocumentsStatus","documentTypes":["florida-hoa-disclosure-summary"]});