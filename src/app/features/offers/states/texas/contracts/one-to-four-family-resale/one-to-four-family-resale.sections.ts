import type {
  OfferSectionDefinition,
} from '../../../../engine/models/offer-section-definition';

import {
  TEXAS_ASSOCIATION_SECTION,
  TEXAS_DISCLOSURES_SECTION,
  TEXAS_LEASES_SECTION,
  TEXAS_PROPERTY_TERMS_SECTION,
  TEXAS_SHARED_TRANSACTION_SECTIONS,
  TEXAS_SURVEY_SECTION,
} from '../../questions/texas-shared-question-definitions';

const PARTIES_SECTION: OfferSectionDefinition = {
  id: 'parties',
  title: 'Parties',
  description: 'Review the buyer and seller information populated from NavStreet.',
  questions: [],
};

const PROPERTY_SECTION: OfferSectionDefinition = {
  id: 'property',
  title: 'Property, property condition and owners association',
  shortTitle: 'Property',
  description: 'Review the listing property and complete the buyer decisions that apply to its condition and association.',
  questions: [
    ...TEXAS_PROPERTY_TERMS_SECTION.questions,
    ...sharedSection('condition-closing').questions.filter(
      question => question.fieldPath?.startsWith('propertyCondition.')
    ),
    ...TEXAS_ASSOCIATION_SECTION.questions,
  ],
};

const TITLE_AND_SURVEY_SECTION: OfferSectionDefinition = {
  id: 'title-and-survey',
  title: 'Title policy and survey',
  shortTitle: 'Title & survey',
  questions: [
    ...sharedSection('title-policy').questions,
    ...TEXAS_SURVEY_SECTION.questions,
  ],
};

const CLOSING_AND_POSSESSION_SECTION: OfferSectionDefinition = {
  id: 'closing-and-possession',
  title: 'Closing and possession',
  shortTitle: 'Closing',
  questions: sharedSection('condition-closing').questions.filter(
    question => question.fieldPath?.startsWith('closingAndPossession.')
  ),
};

const EXPENSES_AND_PRORATIONS_SECTION: OfferSectionDefinition = {
  ...sharedSection('expenses-contributions'),
  id: 'expenses-and-prorations',
  title: 'Expenses and prorations',
  shortTitle: 'Expenses',
  description: 'Enter negotiated expense contributions. Standard prorations remain governed by the contract.',
};

const SPECIAL_PROVISIONS_AND_ADDENDA_SECTION: OfferSectionDefinition = {
  id: 'special-provisions-and-addenda',
  title: 'Special provisions and addenda',
  shortTitle: 'Provisions',
  questions: [
    ...sharedSection('special-provisions').questions,
    ...sharedSection('addenda').questions,
  ],
};

export const TEXAS_ONE_TO_FOUR_FAMILY_RESALE_SECTIONS:
  readonly OfferSectionDefinition[] = [
    PARTIES_SECTION,
    PROPERTY_SECTION,
    sharedSection('price-financing'),
    TEXAS_LEASES_SECTION,
    sharedSection('earnest-money-option'),
    TITLE_AND_SURVEY_SECTION,
    TEXAS_DISCLOSURES_SECTION,
    CLOSING_AND_POSSESSION_SECTION,
    EXPENSES_AND_PRORATIONS_SECTION,
    SPECIAL_PROVISIONS_AND_ADDENDA_SECTION,
    sharedSection('delivery-certification'),
  ];

function sharedSection(sectionId: string): OfferSectionDefinition {
  const section = TEXAS_SHARED_TRANSACTION_SECTIONS.find(
    candidate => candidate.id === sectionId
  );

  if (!section) {
    throw new Error(`The Texas section ${sectionId} is not configured.`);
  }

  return section;
}
