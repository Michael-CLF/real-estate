import { withHoaOfferPolicy } from '../../engine/hoa-offer-policy';
import { withFederalLeadOfferPolicy } from '../../engine/federal-lead-offer-policy';
import {getArizonaCondominiumSections} from './questions/arizona-condominium.sections';
import type { StateOfferPackage } from '../../engine/models/state-offer-package';
import type { ArizonaOfferTerms, ArizonaContractType } from '../../../../core/domains/offers/state-contracts/arizona/models/arizona-offer-terms.model';
import { ARIZONA_RESIDENTIAL_CONTRACT_DEFINITION, ARIZONA_CONDOMINIUM_CONTRACT_DEFINITION } from '../../../../core/domains/offers/state-contracts/arizona/models/arizona-offer-terms.model';
import { createArizonaInitialOfferTerms } from '../../../../core/domains/offers/state-contracts/arizona/services/arizona-initial-offer-terms.factory';
import { ARIZONA_RESIDENTIAL_SALE_SECTIONS } from './questions/arizona-residential-sale.sections';
import { ArizonaOfferValidator } from './validators/arizona-offer.validator';
const validator = new ArizonaOfferValidator();
export const ARIZONA_OFFER_PACKAGE: StateOfferPackage<ArizonaOfferTerms, ArizonaContractType> = withHoaOfferPolicy(withFederalLeadOfferPolicy({
  stateCode: 'AZ', stateName: 'Arizona',
  contracts: { navstreet_arizona_residential_sale_2026: ARIZONA_RESIDENTIAL_CONTRACT_DEFINITION, navstreet_arizona_condominium_resale_2026: ARIZONA_CONDOMINIUM_CONTRACT_DEFINITION },
  createInitialTerms: input => createArizonaInitialOfferTerms(input),
  getSections: terms => getArizonaCondominiumSections(terms,ARIZONA_RESIDENTIAL_SALE_SECTIONS),
  validate: (terms, buyers, sellers, context) => validator.validate(terms, [...buyers], [...sellers], context),
}, {values:{'disclosures.leadPaintStatus':'built_1978_or_later','disclosures.leadInspectionSelection':'unselected','disclosures.leadInspectionDays':10,'documentVersions.lead-based-paint':undefined},hiddenFields:['disclosures.leadPaintStatus','disclosures.leadInspectionSelection','disclosures.leadInspectionDays']}), {"sellerFactPath":"disclosures.sellerReportsHoa","documentStatusPath":"disclosures.hoaDocumentsStatus","documentTypes":["arizona-association-documents"]});