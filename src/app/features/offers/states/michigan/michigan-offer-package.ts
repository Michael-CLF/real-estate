import { withHoaOfferPolicy } from '../../engine/hoa-offer-policy';
import { withFederalLeadOfferPolicy } from '../../engine/federal-lead-offer-policy';
import type { StateOfferPackage } from '../../engine/models/state-offer-package';
import type { MichiganOfferTerms, MichiganContractType } from '../../../../core/domains/offers/state-contracts/michigan/models/michigan-offer-terms.model';
import { MICHIGAN_RESIDENTIAL_CONTRACT_DEFINITION } from '../../../../core/domains/offers/state-contracts/michigan/models/michigan-offer-terms.model';
import { createMichiganInitialOfferTerms } from '../../../../core/domains/offers/state-contracts/michigan/services/michigan-initial-offer-terms.factory';
import { MICHIGAN_RESIDENTIAL_SALE_SECTIONS } from './questions/michigan-residential-sale.sections';
import { MichiganOfferValidator } from './validators/michigan-offer.validator';
const validator = new MichiganOfferValidator();
export const MICHIGAN_OFFER_PACKAGE: StateOfferPackage<MichiganOfferTerms, MichiganContractType> = withHoaOfferPolicy(withFederalLeadOfferPolicy({
  stateCode: 'MI', stateName: 'Michigan',
  contracts: { navstreet_michigan_residential_sale_2026: MICHIGAN_RESIDENTIAL_CONTRACT_DEFINITION },
  createInitialTerms: input => createMichiganInitialOfferTerms(input),
  getSections: () => MICHIGAN_RESIDENTIAL_SALE_SECTIONS,
  validate: (terms, buyers, sellers, context) => validator.validate(terms, [...buyers], [...sellers], context),
}, {values:{'disclosures.leadPaintStatus':'built_1978_or_later','disclosures.leadInspectionSelection':'unselected','disclosures.leadInspectionDays':10,'documentVersions.lead-based-paint':undefined},hiddenFields:['disclosures.leadPaintStatus','disclosures.leadInspectionSelection','disclosures.leadInspectionDays']}), {"sellerFactPath":"disclosures.sellerReportsHoa","documentStatusPath":"disclosures.hoaDocumentsStatus","documentTypes":["michigan-association-documents"]});