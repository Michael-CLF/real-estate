import { withHoaOfferPolicy } from '../../engine/hoa-offer-policy';
import { withFederalLeadOfferPolicy } from '../../engine/federal-lead-offer-policy';
import type { StateOfferPackage } from '../../engine/models/state-offer-package';
import type { DelawareOfferTerms, DelawareContractType } from '../../../../core/domains/offers/state-contracts/delaware/models/delaware-offer-terms.model';
import { DELAWARE_RESIDENTIAL_CONTRACT_DEFINITION } from '../../../../core/domains/offers/state-contracts/delaware/models/delaware-offer-terms.model';
import { createDelawareInitialOfferTerms } from '../../../../core/domains/offers/state-contracts/delaware/services/delaware-initial-offer-terms.factory';
import { DELAWARE_RESIDENTIAL_SALE_SECTIONS } from './questions/delaware-residential-sale.sections';
import { DelawareOfferValidator } from './validators/delaware-offer.validator';
const validator = new DelawareOfferValidator();
export const DELAWARE_OFFER_PACKAGE: StateOfferPackage<DelawareOfferTerms, DelawareContractType> = withHoaOfferPolicy(withFederalLeadOfferPolicy({
  stateCode: 'DE', stateName: 'Delaware',
  contracts: { navstreet_delaware_residential_sale_2026: DELAWARE_RESIDENTIAL_CONTRACT_DEFINITION },
  createInitialTerms: input => createDelawareInitialOfferTerms(input),
  getSections: () => DELAWARE_RESIDENTIAL_SALE_SECTIONS,
  validate: (terms, buyers, sellers, context) => validator.validate(terms, [...buyers], [...sellers], context),
}, {values:{'disclosures.leadPaintStatus':'built_1978_or_later','disclosures.leadInspectionSelection':'unselected','disclosures.leadInspectionDays':10,'documentVersions.lead-based-paint':undefined},hiddenFields:['disclosures.leadPaintStatus','disclosures.leadInspectionSelection','disclosures.leadInspectionDays']}), {"sellerFactPath":"disclosures.sellerReportsHoa","documentStatusPath":"disclosures.hoaDocumentsStatus","documentTypes":["delaware-association-documents"]});