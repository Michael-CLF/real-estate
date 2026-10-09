import { mapCaliforniaListingStatements, restoreCaliforniaDraftSellerStatements } from './california-listing-statements';
import { restoreCaliforniaListingFacts } from './california-listing-facts.model';
import { createCaliforniaListingFactsForm } from './california-listing-form';
import type { StateListingPackage } from '../state-listing-package';
export const californiaListingPackage: StateListingPackage = {
  propertyDetailFields: ['legalDescription'],
  restoreSellerStatements: restoreCaliforniaDraftSellerStatements,
  mapSellerStatements: mapCaliforniaListingStatements,
  formRestorers: { 'sellerStatements.california': restoreCaliforniaListingFacts },
  formFactories: { 'sellerStatements.california': createCaliforniaListingFactsForm },
  stateCode: 'CA', stateName: 'California',
  requiredSellerStatementFields: ['leadBasedPaintApplies', 'ownersAssociationApplies', 'generalLeasesExist'],
  disclosureRequirements: [
    { documentType: 'california-transfer-disclosure', requiredWhen: 'applicable' },
    { documentType: 'california-natural-hazard-disclosure', requiredWhen: 'applicable' },
    { documentType: 'lead-based-paint', requiredWhen: 'applicable' },
  ],
};