import { withHoaOfferPolicy } from '../../engine/hoa-offer-policy';
import { withFederalLeadOfferPolicy } from '../../engine/federal-lead-offer-policy';
import type { StateOfferPackage } from '../../engine/models/state-offer-package';
import type { SouthDakotaOfferTerms, SouthDakotaContractType } from '../../../../core/domains/offers/state-contracts/south-dakota/models/south-dakota-offer-terms.model';
import { SOUTH_DAKOTA_RESIDENTIAL_CONTRACT_DEFINITION } from '../../../../core/domains/offers/state-contracts/south-dakota/models/south-dakota-offer-terms.model';
import { createSouthDakotaInitialOfferTerms } from '../../../../core/domains/offers/state-contracts/south-dakota/services/south-dakota-initial-offer-terms.factory';
import { SOUTH_DAKOTA_RESIDENTIAL_SALE_SECTIONS } from './questions/south-dakota-residential-sale.sections';
import { SouthDakotaOfferValidator } from './validators/south-dakota-offer.validator';
const validator = new SouthDakotaOfferValidator();
export const SOUTH_DAKOTA_OFFER_PACKAGE: StateOfferPackage<SouthDakotaOfferTerms, SouthDakotaContractType> = withHoaOfferPolicy(withFederalLeadOfferPolicy({
  stateCode: 'SD', stateName: 'South Dakota',
  contracts: { navstreet_south_dakota_residential_sale_2026: SOUTH_DAKOTA_RESIDENTIAL_CONTRACT_DEFINITION },
  createInitialTerms: input => createSouthDakotaInitialOfferTerms(input),
  getSections: () => SOUTH_DAKOTA_RESIDENTIAL_SALE_SECTIONS,
  validate: (terms, buyers, sellers, context) => validator.validate(terms, [...buyers], [...sellers], context),
}, {values:{'disclosures.leadPaintStatus':'built_1978_or_later','disclosures.leadInspectionSelection':'unselected','disclosures.leadInspectionDays':10,'documentVersions.lead-based-paint':undefined},hiddenFields:['disclosures.leadPaintStatus','disclosures.leadInspectionSelection','disclosures.leadInspectionDays']}), {"sellerFactPath":"disclosures.sellerReportsHoa","documentStatusPath":"disclosures.hoaDocumentsStatus","documentTypes":["south-dakota-association-documents"]});