import { COLORADO_LISTING_EDIT_FIELDS } from './colorado-listing-edit-fields';
import { restoreColoradoPropertyFacts } from './colorado-listing-facts';
import { configureColoradoListingEditValidators, configureColoradoListingFactValidators, configureColoradoListingLoanValidators } from './colorado-listing-validation';
import { createColoradoPropertyFactsForm, createColoradoAssumableLoanForm, restoreColoradoAssumableLoan, serializeColoradoAssumableLoan } from './colorado-listing-form';
import type { StateListingPackage } from '../state-listing-package';

/** Uploaded disclosures required before NavStreet will accept a Colorado offer. */
export const coloradoListingPackage: StateListingPackage = {
  editFields: { coloradoPropertyFacts: COLORADO_LISTING_EDIT_FIELDS },
  propertyDetailFields: ['legalDescription'],
  stateCode: 'CO',
  formRestorers: { coloradoPropertyFacts: restoreColoradoPropertyFacts, coloradoAssumableLoan: restoreColoradoAssumableLoan },
  formSerializers: { coloradoAssumableLoan: serializeColoradoAssumableLoan },
  formValidators: { coloradoPropertyFactsEdit: configureColoradoListingEditValidators, coloradoPropertyFacts: configureColoradoListingFactValidators, coloradoAssumableLoan: configureColoradoListingLoanValidators },
  disclosureCardVisibility: {
    'colorado-association-documents': context => context.ownersAssociationApplies === true,
  },
  formFactories: { coloradoPropertyFacts: createColoradoPropertyFactsForm, coloradoAssumableLoan: createColoradoAssumableLoanForm },
  stateName: 'Colorado',
  requiredSellerStatementFields: [
    'leadBasedPaintApplies',
    'ownersAssociationApplies',
    'generalLeasesExist',
  ],
  disclosureRequirements: [
    {
      documentType: 'colorado-property-disclosure',
      requiredWhen: 'always',
    },
    {
      documentType: 'colorado-radon-brochure',
      requiredWhen: 'always',
    },
    {
      documentType: 'lead-based-paint',
      requiredWhen: 'applicable',
    },
  ],
};