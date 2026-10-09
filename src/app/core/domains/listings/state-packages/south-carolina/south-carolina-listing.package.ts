import { mapSouthCarolinaListingStatements, restoreSouthCarolinaDraftSellerStatements } from './south-carolina-listing-statements';
import { createSouthCarolinaListingAnswersForm, restoreSouthCarolinaListingAnswers } from './south-carolina-listing-form';
import type { StateListingPackage } from '../state-listing-package';
export const southCarolinaListingPackage: StateListingPackage = {
  propertyDetailFields: ['legalDescription'],
  restoreSellerStatements: restoreSouthCarolinaDraftSellerStatements,
  mapSellerStatements: mapSouthCarolinaListingStatements,
  stateCode: 'SC',
  formRestorers: { 'sellerStatements.southCarolina': restoreSouthCarolinaListingAnswers },
  formFactories: { 'sellerStatements.southCarolina': createSouthCarolinaListingAnswersForm },
  disclosureCardVisibility: {
    'south-carolina-association-documents': context => context.stateCode !== 'SC' || context.ownersAssociationApplies !== false,
    'south-carolina-coastal-disclosure': context => context.stateCode !== 'SC' || context.southCarolinaAnswers.beachfrontApplies === true,
    'south-carolina-vacation-rentals': context => context.stateCode !== 'SC' || context.southCarolinaAnswers.futureVacationBookingsExist === true,
  },
  stateName: 'South Carolina',
  requiredSellerStatementFields: ['leadBasedPaintApplies', 'ownersAssociationApplies', 'generalLeasesExist'],
  disclosureRequirements: [],
  questionGroups: [{
    id: 'south-carolina-disclosure-applicability',
    requiredMessage: 'Answer both South Carolina disclosure applicability questions.',
    title: 'South Carolina disclosure applicability',
    questions: [{
      id: 'sc-beachfront',
      fieldPath: 'sellerStatements.southCarolina.beachfrontApplies',
      label: 'Is any part of this property seaward of the beachfront setback line or jurisdictional line?',
      description: "Being near the coast does not automatically make this disclosure applicable. Check the property's survey and current coastal boundary records if unsure.",
      required: true,
      requiredMessage: 'Select whether the beachfront disclosure applies.',
    }, {
      id: 'sc-vacation',
      fieldPath: 'sellerStatements.southCarolina.futureVacationBookingsExist',
      label: 'Is this property subject to any future vacation rental bookings?',
      description: 'Answer Yes when future vacation rental periods are already booked. Ordinary residential leases are addressed separately.',
      required: true,
      requiredMessage: 'Select whether future vacation rental bookings exist.',
    }],
  }],
};
