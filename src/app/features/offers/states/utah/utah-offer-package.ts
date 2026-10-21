import { withHoaOfferPolicy } from '../../engine/hoa-offer-policy';
import { withFederalLeadOfferPolicy } from '../../engine/federal-lead-offer-policy';
import type { StateOfferPackage } from '../../engine/models/state-offer-package';
import type { UtahOfferTerms, UtahContractType } from '../../../../core/domains/offers/state-contracts/utah/models/utah-offer-terms.model';
import { UTAH_RESIDENTIAL_CONTRACT_DEFINITION } from '../../../../core/domains/offers/state-contracts/utah/models/utah-offer-terms.model';
import { createUtahInitialOfferTerms } from '../../../../core/domains/offers/state-contracts/utah/services/utah-initial-offer-terms.factory';
import { UTAH_RESIDENTIAL_SALE_SECTIONS } from './questions/utah-residential-sale.sections';
import { UtahOfferValidator } from './validators/utah-offer.validator';
const validator = new UtahOfferValidator();
export const UTAH_OFFER_PACKAGE: StateOfferPackage<UtahOfferTerms, UtahContractType> = withHoaOfferPolicy(withFederalLeadOfferPolicy({
  stateCode: 'UT', stateName: 'Utah',
  contracts: { navstreet_utah_residential_sale_2026: UTAH_RESIDENTIAL_CONTRACT_DEFINITION },
  createInitialTerms: input => createUtahInitialOfferTerms(input),
  getSections: () => UTAH_RESIDENTIAL_SALE_SECTIONS,
  validate: (terms, buyers, sellers, context) => validator.validate(terms, [...buyers], [...sellers], context),
}, {values:{'disclosures.leadPaintStatus':'built_1978_or_later','disclosures.leadInspectionSelection':'unselected','disclosures.leadInspectionDays':10,'documentVersions.lead-based-paint':undefined},hiddenFields:['disclosures.leadPaintStatus','disclosures.leadInspectionSelection','disclosures.leadInspectionDays']}), {"sellerFactPath":"disclosures.sellerReportsHoa","documentStatusPath":"disclosures.hoaDocumentsStatus","documentTypes":["utah-hoa-governing-documents"],"snapshotSellerFact":true});