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
  title: 'Property and owners association',
  shortTitle: 'Property',
  description: 'Review the property address and complete the contract questions concerning exclusions, reservations, and the property owners association.',
  questions: [
    ...TEXAS_PROPERTY_TERMS_SECTION.questions,
    ...TEXAS_ASSOCIATION_SECTION.questions,
  ],
  questionGroups: [
    {
      id: 'property-terms',
      title: 'Property exclusions and reservations',
      columns: 1,
      questions: TEXAS_PROPERTY_TERMS_SECTION.questions,
    },
    {
      id: 'property-association',
      title: 'Property owners association',
      columns: 1,
      questions: TEXAS_ASSOCIATION_SECTION.questions,
    },
  ],
};

const PRICE_AND_PROPERTY_TERMS_SECTION: OfferSectionDefinition = {
  ...sharedSection('price-financing'),
  questions: [
    ...sharedSection('price-financing').questions,
    ...sharedSection('condition-closing').questions.filter(
      question => question.fieldPath?.startsWith('propertyCondition.')
    ),
  ],
  questionGroups: [
    {
      id: 'price-calculation',
      title: 'Sales price calculation',
      description: 'Enter the total sales price and financing portion. NavStreet calculates the cash portion automatically.',
      columns: 3,
      questions: questionsById(
        sharedSection('price-financing'),
        'total-sales-price',
        'financing-portion',
        'cash-portion',
        'financing-addenda'
      ),
    },
    {
      id: 'property-condition-terms',
      title: 'Property condition and service contract',
      questions: sharedSection('condition-closing').questions.filter(
        question => question.fieldPath?.startsWith('propertyCondition.')
      ),
    },
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
  questionGroups: [
    {
      id: 'buyer-expenses',
      title: 'Seller contribution to buyer expenses',
      questions: questionsById(
        sharedSection('expenses-contributions'),
        'seller-buyer-expenses-type',
        'seller-buyer-expenses'
      ),
    },
    {
      id: 'buyer-broker',
      title: 'Seller contribution to buyer broker',
      questions: questionsById(
        sharedSection('expenses-contributions'),
        'seller-to-buyer-broker-type',
        'seller-to-buyer-broker-amount',
        'seller-to-buyer-broker-percentage'
      ),
    },
    {
      id: 'seller-broker',
      title: 'Buyer contribution to seller broker',
      questions: questionsById(
        sharedSection('expenses-contributions'),
        'buyer-to-seller-broker-type',
        'buyer-to-seller-broker-amount',
        'buyer-to-seller-broker-percentage'
      ),
    },
    {
      id: 'standard-prorations',
      title: 'Standard prorations',
      description: 'Taxes, rents, and other standard prorations remain controlled by the Texas contract and are calculated through the closing date.',
      questions: [],
    },
  ],
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
    PRICE_AND_PROPERTY_TERMS_SECTION,
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


function questionsById(
  section: OfferSectionDefinition,
  ...questionIds: readonly string[]
): OfferSectionDefinition['questions'] {
  return questionIds.map(questionId => {
    const question = section.questions.find(
      candidate => candidate.id === questionId
    );

    if (!question) {
      throw new Error(
        `The Texas question ${questionId} is not configured.`
      );
    }

    return question;
  });
}
