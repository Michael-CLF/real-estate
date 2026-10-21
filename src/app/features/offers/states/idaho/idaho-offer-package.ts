import { withHoaOfferPolicy } from '../../engine/hoa-offer-policy';
import { withFederalLeadOfferPolicy } from '../../engine/federal-lead-offer-policy';
import type { StateOfferPackage } from '../../engine/models/state-offer-package';
import type { IdahoOfferTerms, IdahoContractType } from '../../../../core/domains/offers/state-contracts/idaho/models/idaho-offer-terms.model';
import { IDAHO_RESIDENTIAL_CONTRACT_DEFINITION } from '../../../../core/domains/offers/state-contracts/idaho/models/idaho-offer-terms.model';
import { createIdahoInitialOfferTerms } from '../../../../core/domains/offers/state-contracts/idaho/services/idaho-initial-offer-terms.factory';
import { IDAHO_RESIDENTIAL_SALE_SECTIONS } from './questions/idaho-residential-sale.sections';
import { IdahoOfferValidator } from './validators/idaho-offer.validator';
const validator = new IdahoOfferValidator();
export const IDAHO_OFFER_PACKAGE: StateOfferPackage<IdahoOfferTerms, IdahoContractType> = withHoaOfferPolicy(withFederalLeadOfferPolicy({
  stateCode: 'ID', stateName: 'Idaho',
  contracts: { navstreet_idaho_residential_sale_2026: IDAHO_RESIDENTIAL_CONTRACT_DEFINITION },
  createInitialTerms: input => createIdahoInitialOfferTerms(input),
  getSections: () => IDAHO_RESIDENTIAL_SALE_SECTIONS,
  validate: (terms, buyers, sellers, context) => validator.validate(terms, [...buyers], [...sellers], context),
}, {values:{'disclosures.leadPaintStatus':'built_1978_or_later','disclosures.leadInspectionSelection':'unselected','disclosures.leadInspectionDays':10,'documentVersions.lead-based-paint':undefined},hiddenFields:['disclosures.leadPaintStatus','disclosures.leadInspectionSelection','disclosures.leadInspectionDays']}), {"sellerFactPath":"disclosures.sellerReportsHoa","documentStatusPath":"disclosures.hoaDocumentsStatus","documentTypes":["idaho-association-documents"]});