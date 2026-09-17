import {
  createNorthCarolinaInitialOfferTerms,
} from './north-carolina-initial-terms';

import type {
  StateContractPackage,
} from '../state-contract-package';


const NORTH_CAROLINA_STATE_CODE =
  'NC';

const NORTH_CAROLINA_DEFAULT_TIME_ZONE =
  'America/New_York';


export const northCarolinaStateContractPackage:
  StateContractPackage = {
    stateCode:
      NORTH_CAROLINA_STATE_CODE,

    offerCreationEnabled: true,

    defaultTimeZone:
      NORTH_CAROLINA_DEFAULT_TIME_ZONE,

    agreementTemplate: {
      stateCode:
        NORTH_CAROLINA_STATE_CODE,

      templateUid:
        'navstreet-nc-residential-purchase-agreement',

      templateName:
        'NavStreet North Carolina Residential Purchase Agreement',

      templateVersion:
        '1.0.0',
    },

    createInitialOfferTerms:
      (input) =>
        createNorthCarolinaInitialOfferTerms(
          input,
          {
            stateCode:
              NORTH_CAROLINA_STATE_CODE,

            defaultTimeZone:
              NORTH_CAROLINA_DEFAULT_TIME_ZONE,
          }
        ),
  };