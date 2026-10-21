import { withHoaOfferPolicy } from '../../engine/hoa-offer-policy';
import { withFederalLeadOfferPolicy } from '../../engine/federal-lead-offer-policy';
import type { StateOfferPackage } from '../../engine/models/state-offer-package';
import type { NewMexicoOfferTerms, NewMexicoContractType } from '../../../../core/domains/offers/state-contracts/new-mexico/models/new-mexico-offer-terms.model';
import { NEW_MEXICO_RESIDENTIAL_CONTRACT_DEFINITION } from '../../../../core/domains/offers/state-contracts/new-mexico/models/new-mexico-offer-terms.model';
import { createNewMexicoInitialOfferTerms } from '../../../../core/domains/offers/state-contracts/new-mexico/services/new-mexico-initial-offer-terms.factory';
import { NEW_MEXICO_RESIDENTIAL_SALE_SECTIONS } from './questions/new-mexico-residential-sale.sections';
import { NewMexicoOfferValidator } from './validators/new-mexico-offer.validator';
const validator = new NewMexicoOfferValidator();
export const NEW_MEXICO_OFFER_PACKAGE: StateOfferPackage<NewMexicoOfferTerms, NewMexicoContractType> = withHoaOfferPolicy(withFederalLeadOfferPolicy({
  stateCode: 'NM', stateName: 'New Mexico',
  contracts: { navstreet_new_mexico_residential_sale_2026: NEW_MEXICO_RESIDENTIAL_CONTRACT_DEFINITION },
  createInitialTerms: input => createNewMexicoInitialOfferTerms(input),
  getSections: () => NEW_MEXICO_RESIDENTIAL_SALE_SECTIONS,
  validate: (terms, buyers, sellers, context) => validator.validate(terms, [...buyers], [...sellers], context),
}, {values:{'disclosures.leadPaintStatus':'built_1978_or_later','disclosures.leadInspectionSelection':'unselected','disclosures.leadInspectionDays':10,'documentVersions.lead-based-paint':undefined},hiddenFields:['disclosures.leadPaintStatus','disclosures.leadInspectionSelection','disclosures.leadInspectionDays']}), {"sellerFactPath":"disclosures.sellerReportsHoa","documentStatusPath":"disclosures.hoaDocumentsStatus","documentTypes":["new-mexico-association-documents"]});