import type {
  OfferDateTime,
  OfferPropertySnapshot,
} from '../../../models/offer-terms.model';

import type {
  TexasOneToFourFamilyResaleOfferTerms,
} from '../models/texas-offer-terms.model';

import type {
  TexasContractType,
} from '../models/texas-contract-type.model';


export interface CreateTexasInitialOfferTermsInput {
  contractType: TexasContractType;
  property: OfferPropertySnapshot;

  expiresAt: OfferDateTime;
  timeZone: string;
}


/*
 * Creates an unanswered TREC 20-19 draft.
 *
 * Values that express a legal choice remain null or
 * unselected. The factory must never infer contract terms
 * merely from the listing or from application defaults.
 */
export function createTexasInitialOfferTerms(
  input: CreateTexasInitialOfferTermsInput
): TexasOneToFourFamilyResaleOfferTerms {
  return {
    stateCode: 'TX',
    contractType:
      'one_to_four_family_resale',

    form: {
      formId: '20-19',
      formName:
        'One to Four Family Residential Contract (Resale)',
      effectiveDate: '2026-07-01',
      revisionDate: '2026-05-04',
    },

    property: {
      ...input.property,
      state: 'TX',
    },

    propertyIdentification: {},

    propertyTerms: {
      mineralWaterTimberReservationApplies:
        null,
    },

    salesPrice: {
      cashPortionInCents: 0,
      financingInCents: 0,
      salesPriceInCents:
        input.property.listPriceInCents,
      financingAddenda: [],
    },

    leases: {
      residentialLeasesExist: null,
      residentialLeasesReceived: null,
      fixtureLeasesExist: null,
      fixtureLeasesReceived: null,
      naturalResourceLeasesExist: null,
      naturalResourceLeaseStatus:
        'unselected',
    },

    earnestMoneyAndOption: {
      escrowAgentName: '',
      escrowAgentAddress: '',
      earnestMoneyInCents: 0,
      optionFeeInCents: 0,
    },

    titlePolicy: {
      titleCompanyName: '',
      titlePolicyExpensePayer:
        'unselected',
      boundaryExceptionTreatment:
        'unselected',
    },

    survey: {
      selection: 'unselected',
      deliveryDays: 0,
      titleObjectionDays: 0,
    },

    propertyAssociation: {
      mandatoryMembership: null,
    },

    disclosures: {
      propertyCondition: {
        status: 'unselected',
      },
      waterRights: {
        status: 'unselected',
      },
      leadBasedPaintApplies: null,
    },

    propertyCondition: {
      acceptance: 'unselected',
    },

    closingAndPossession: {
      closingDate: '',
      possession: 'unselected',
    },

    expenses: {
      sellerContributionToBuyerExpensesType:
        'unselected',
      sellerContributionToBuyerBroker: {
        contributionType: 'unselected',
      },
      buyerContributionToSellerBroker: {
        contributionType: 'unselected',
      },
    },

    specialProvisions: {
      included: false,
    },

    notices: {
      buyer: {},
      seller: {},
    },

    attorneys: {},
    addenda: [],

    delivery: {
      expiresAt: input.expiresAt,
      timeZone: input.timeZone,
      electronicDeliveryAuthorized:
        null,
    },
  };
}
