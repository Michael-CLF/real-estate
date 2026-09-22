import type {
  OfferSectionDefinition,
} from '../../../../engine/models/offer-section-definition';

import {
  createTexasConstructionSection,
  TEXAS_ASSOCIATION_SECTION,
  TEXAS_PROPERTY_IDENTIFICATION_SECTION,
  TEXAS_PROPERTY_TERMS_SECTION,
  TEXAS_SHARED_TRANSACTION_SECTIONS,
  TEXAS_SURVEY_SECTION,
} from '../../questions/texas-shared-question-definitions';


export const TEXAS_NEW_HOME_COMPLETED_SECTIONS:
  readonly OfferSectionDefinition[] = [
    TEXAS_PROPERTY_IDENTIFICATION_SECTION,
    TEXAS_PROPERTY_TERMS_SECTION,
    createTexasConstructionSection(false),
    TEXAS_SURVEY_SECTION,
    TEXAS_ASSOCIATION_SECTION,
    ...TEXAS_SHARED_TRANSACTION_SECTIONS,
  ];
