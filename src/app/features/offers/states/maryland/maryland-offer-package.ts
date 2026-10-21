import { withHoaOfferPolicy } from '../../engine/hoa-offer-policy';
import { withFederalLeadOfferPolicy } from '../../engine/federal-lead-offer-policy';
import type { StateOfferPackage } from '../../engine/models/state-offer-package';
import type { MarylandOfferTerms, MarylandContractType } from '../../../../core/domains/offers/state-contracts/maryland/models/maryland-offer-terms.model';
import { MARYLAND_RESIDENTIAL_CONTRACT_DEFINITION } from '../../../../core/domains/offers/state-contracts/maryland/models/maryland-offer-terms.model';
import { createMarylandInitialOfferTerms } from '../../../../core/domains/offers/state-contracts/maryland/services/maryland-initial-offer-terms.factory';
import { MARYLAND_RESIDENTIAL_SALE_SECTIONS } from './questions/maryland-residential-sale.sections';
import { MarylandOfferValidator } from './validators/maryland-offer.validator';
const validator = new MarylandOfferValidator();
export const MARYLAND_OFFER_PACKAGE: StateOfferPackage<MarylandOfferTerms, MarylandContractType> = withHoaOfferPolicy(withFederalLeadOfferPolicy({
  stateCode: 'MD', stateName: 'Maryland',
  contracts: { navstreet_maryland_residential_sale_2026: MARYLAND_RESIDENTIAL_CONTRACT_DEFINITION },
  createInitialTerms: input => createMarylandInitialOfferTerms(input),
  getSections: () => MARYLAND_RESIDENTIAL_SALE_SECTIONS,
  validate: (terms, buyers, sellers, context) => validator.validate(terms, [...buyers], [...sellers], context),
}, {values:{'disclosures.leadPaintStatus':'built_1978_or_later','disclosures.leadInspectionSelection':'unselected','disclosures.leadInspectionDays':10,'documentVersions.lead-based-paint':undefined},hiddenFields:['disclosures.leadPaintStatus','disclosures.leadInspectionSelection','disclosures.leadInspectionDays']}), {"sellerFactPath":"disclosures.sellerReportsHoa","documentStatusPath":"disclosures.hoaDocumentsStatus","documentTypes":["maryland-association-documents"]});