import { withHoaOfferPolicy } from '../../engine/hoa-offer-policy';
import { withFederalLeadOfferPolicy } from '../../engine/federal-lead-offer-policy';
import type { StateOfferPackage } from '../../engine/models/state-offer-package';
import type { WashingtonOfferTerms, WashingtonContractType } from '../../../../core/domains/offers/state-contracts/washington/models/washington-offer-terms.model';
import { WASHINGTON_RESIDENTIAL_CONTRACT_DEFINITION } from '../../../../core/domains/offers/state-contracts/washington/models/washington-offer-terms.model';
import { createWashingtonInitialOfferTerms } from '../../../../core/domains/offers/state-contracts/washington/services/washington-initial-offer-terms.factory';
import { WASHINGTON_RESIDENTIAL_SALE_SECTIONS } from './questions/washington-residential-sale.sections';
import { WashingtonOfferValidator } from './validators/washington-offer.validator';
const validator = new WashingtonOfferValidator();
export const WASHINGTON_OFFER_PACKAGE: StateOfferPackage<WashingtonOfferTerms, WashingtonContractType> = withHoaOfferPolicy(withFederalLeadOfferPolicy({
  stateCode: 'WA', stateName: 'Washington',
  contracts: { navstreet_washington_residential_sale_2026: WASHINGTON_RESIDENTIAL_CONTRACT_DEFINITION },
  createInitialTerms: input => createWashingtonInitialOfferTerms(input),
  getSections: () => WASHINGTON_RESIDENTIAL_SALE_SECTIONS,
  validate: (terms, buyers, sellers, context) => validator.validate(terms, [...buyers], [...sellers], context),
}, {values:{'disclosures.leadPaintStatus':'built_1978_or_later','disclosures.leadInspectionSelection':'unselected','disclosures.leadInspectionDays':10,'documentVersions.lead-based-paint':undefined},hiddenFields:['disclosures.leadPaintStatus','disclosures.leadInspectionSelection','disclosures.leadInspectionDays']}), {"sellerFactPath":"disclosures.sellerReportsHoa","documentStatusPath":"disclosures.hoaDocumentsStatus","documentTypes":["washington-association-documents"]});