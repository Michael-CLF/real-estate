import { withHoaOfferPolicy } from '../../engine/hoa-offer-policy';
import { withFederalLeadOfferPolicy } from '../../engine/federal-lead-offer-policy';
import type { StateOfferPackage } from '../../engine/models/state-offer-package';
import type { AlabamaOfferTerms, AlabamaContractType } from '../../../../core/domains/offers/state-contracts/alabama/models/alabama-offer-terms.model';
import { ALABAMA_RESIDENTIAL_CONTRACT_DEFINITION } from '../../../../core/domains/offers/state-contracts/alabama/models/alabama-offer-terms.model';
import { createAlabamaInitialOfferTerms } from '../../../../core/domains/offers/state-contracts/alabama/services/alabama-initial-offer-terms.factory';
import { ALABAMA_RESIDENTIAL_SALE_SECTIONS } from './questions/alabama-residential-sale.sections';
import { AlabamaOfferValidator } from './validators/alabama-offer.validator';
const validator = new AlabamaOfferValidator();
export const ALABAMA_OFFER_PACKAGE: StateOfferPackage<AlabamaOfferTerms, AlabamaContractType> = withHoaOfferPolicy(withFederalLeadOfferPolicy({
  stateCode: 'AL', stateName: 'Alabama',
  contracts: { navstreet_alabama_residential_sale_2026: ALABAMA_RESIDENTIAL_CONTRACT_DEFINITION },
  createInitialTerms: input => createAlabamaInitialOfferTerms(input),
  getSections: () => ALABAMA_RESIDENTIAL_SALE_SECTIONS,
  validate: (terms, buyers, sellers, context) => validator.validate(terms, [...buyers], [...sellers], context),
}, {values:{'disclosures.leadPaintStatus':'built_1978_or_later','disclosures.leadInspectionSelection':'unselected','disclosures.leadInspectionDays':10,'documentVersions.lead-based-paint':undefined},hiddenFields:['disclosures.leadPaintStatus','disclosures.leadInspectionSelection','disclosures.leadInspectionDays']}), {"sellerFactPath":"disclosures.sellerReportsHoa","documentStatusPath":"disclosures.hoaDocumentsStatus","documentTypes":["alabama-association-documents"]});