import type {
  CreateInitialOfferTermsInput,
} from '../state-contract-package';

import type {
  TexasAddendumSelectionDocument,
  TexasNoticeContactDocument,
  TexasOneToFourFamilyResaleOfferTermsDocument,
  TexasOfferDeliveryTermsDocument,
} from './texas-offer-terms.document';


const DEFAULT_OFFER_EXPIRATION_HOURS = 48;


const TEXAS_MOUNTAIN_TIME_COUNTIES =
  new Set([
    'EL PASO',
    'HUDSPETH',
  ]);


export interface CreateTexasInitialTermsOptions {
  now?: Date;
  expirationHours?: number;
}


export function createTexasInitialOfferTerms(
  input: CreateInitialOfferTermsInput,
  options: CreateTexasInitialTermsOptions = {}
): TexasOneToFourFamilyResaleOfferTermsDocument {
  const supportedPropertyTypes = new Set([
    'single_family',
    'townhome',
    'pud',
    'multi_family',
  ]);

  if (!supportedPropertyTypes.has(input.property.propertyType)) {
    throw new Error(
      'The listing property type does not support the TREC 20-19 One to Four Family Residential Contract.'
    );
  }

  const now = options.now ?? new Date();

  const expirationHours =
    normalizeExpirationHours(
      options.expirationHours
    );

  const expiresAt = new Date(
    now.getTime() +
      expirationHours * 60 * 60 * 1000
  ).toISOString();

  const timeZone =
    getTexasPropertyTimeZone(
      input.property.county
    );

  const residentialLeasesExist =
    readNestedListingBoolean(
      input.listingData,
      'sellerStatements',
      'residentialLeasesExist'
    );

  const fixtureLeasesExist =
    readNestedListingBoolean(
      input.listingData,
      'sellerStatements',
      'fixtureLeasesExist'
    );

  const naturalResourceLeasesExist =
    readNestedListingBoolean(
      input.listingData,
      'sellerStatements',
      'naturalResourceLeasesExist'
    );

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

    propertyIdentification: {
      lot: readListingText(
        input.listingData,
        'lot'
      ),
      block: readListingText(
        input.listingData,
        'block'
      ),
      addition: readFirstListingText(
        input.listingData,
        [
          'addition',
          'subdivision',
          'subdivisionName',
        ]
      ),
    },

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
      residentialLeasesExist,
      residentialLeasesReceived: null,
      fixtureLeasesExist,
      fixtureLeasesReceived: null,
      naturalResourceLeasesExist,
      naturalResourceLeaseStatus:
        naturalResourceLeasesExist === false
          ? 'none'
          : 'unselected',
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
      mandatoryMembership:
        readNestedListingBoolean(
          input.listingData,
          'sellerStatements',
          'ownersAssociationApplies'
        ),
      associationName:
        readFirstNestedListingText(
          input.listingData,
          [
            ['sellerStatements', 'ownersAssociationName'],
            ['hoa', 'associationName'],
          ]
        ),
      duesInCents:
        readNestedListingNumber(
          input.listingData,
          'sellerStatements',
          'ownersAssociationDuesInCents'
        ) ?? toOptionalCents(
          readNestedListingNumber(
            input.listingData,
            'hoa',
            'feeAmount'
          )
        ),
      duesFrequency:
        readFirstNestedListingText(
          input.listingData,
          [
            ['sellerStatements', 'ownersAssociationDuesFrequency'],
            ['hoa', 'feeFrequency'],
          ]
        ),
      associationContact:
        readFirstNestedListingText(
          input.listingData,
          [
            ['sellerStatements', 'ownersAssociationContact'],
            ['hoa', 'managementCompany'],
          ]
        ),
    },

    disclosures: {
      propertyCondition: {
        status: 'unselected',
      },
      waterRights: {
        status: 'unselected',
      },
      leadBasedPaintApplies:
        readNestedListingBoolean(
          input.listingData,
          'sellerStatements',
          'leadBasedPaintApplies'
        ),
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
      buyer: createNoticeContact(
        input.buyer
      ),
      seller: createNoticeContact(
        input.seller
      ),
    },

    attorneys: {},

    addenda:
      createTexasApprovedAddendaCatalog()
        .map(addendum => ({
          ...addendum,
          included: isListingRequiredAddendum(
            addendum.formId,
            input.listingData
          ),
        })),

    delivery: {
      expiresAt,
      timeZone,
      electronicDeliveryAuthorized:
        null,
    },
  };
}


export function getTexasPropertyTimeZone(
  county: string
): TexasOfferDeliveryTermsDocument[
  'timeZone'
] {
  const normalizedCounty = county
    .trim()
    .toUpperCase()
    .replace(/\s+COUNTY$/, '')
    .replace(/\s+/g, ' ');

  return TEXAS_MOUNTAIN_TIME_COUNTIES.has(
    normalizedCounty
  )
    ? 'America/Denver'
    : 'America/Chicago';
}


export function createTexasApprovedAddendaCatalog():
  TexasAddendumSelectionDocument[] {
  return TEXAS_APPROVED_ADDENDA.map(
    addendum => ({
      ...addendum,
      included: false,
    })
  );
}


const TEXAS_APPROVED_ADDENDA:
  ReadonlyArray<
    Pick<
      TexasAddendumSelectionDocument,
      'formId' | 'title'
    >
  > = [
    {
      formId: 'third-party-financing',
      title:
        'Third Party Financing Addendum',
    },
    {
      formId: 'sale-of-other-property',
      title:
        'Addendum for Sale of Other Property by Buyer',
    },
    {
      formId: 'lender-appraisal-termination',
      title:
        'Addendum Concerning Right to Terminate Due to Lender’s Appraisal',
    },
    {
      formId: 'seller-financing',
      title:
        'Seller Financing Addendum',
    },
    {
      formId: 'section-1031-exchange',
      title:
        'Addendum for Section 1031 Exchange',
    },
    {
      formId: 'short-sale',
      title: 'Short Sale Addendum',
    },
    {
      formId: 'loan-assumption',
      title: 'Loan Assumption Addendum',
    },
    {
      formId:
        'assumed-loan-release-va-restoration',
      title:
        'Addendum for Release of Liability on Assumed Loan and/or Restoration of Seller’s VA Entitlement',
    },
    {
      formId: 'residential-leases',
      title:
        'Addendum Regarding Residential Leases',
    },
    {
      formId: 'fixture-leases',
      title:
        'Addendum Regarding Fixture Leases',
    },
    {
      formId:
        'buyer-temporary-residential-lease',
      title:
        'Buyer’s Temporary Residential Lease',
    },
    {
      formId:
        'seller-temporary-residential-lease',
      title:
        'Seller’s Temporary Residential Lease',
    },
    {
      formId: 'hydrostatic-testing',
      title:
        'Addendum for Authorizing Hydrostatic Testing',
    },
    {
      formId: 'environmental-assessment',
      title:
        'Environmental Assessment, Threatened or Endangered Species, and Wetlands Addendum',
    },
    {
      formId: 'lead-based-paint',
      title:
        'Addendum for Seller’s Disclosure of Information on Lead-Based Paint and Lead-Based Paint Hazards as Required by Federal Law',
    },
    {
      formId: 'propane-gas-service-area',
      title:
        'Addendum for Property in a Propane Gas System Service Area',
    },
    {
      formId:
        'seaward-gulf-intracoastal-waterway',
      title:
        'Addendum for Property Located Seaward of the Gulf Intracoastal Waterway',
    },
    {
      formId: 'coastal-area-property',
      title:
        'Addendum for Coastal Area Property',
    },
    {
      formId: 'district-notices',
      title:
        'Utility, Water, Drainage, Public Improvement, and Other District Notices',
    },
    {
      formId: 'mandatory-poa-membership',
      title:
        'Addendum for Property Subject to Mandatory Membership in a Property Owners Association',
    },
    {
      formId: 'non-realty-items',
      title: 'Non-Realty Items Addendum',
    },
    {
      formId: 'back-up-contract',
      title:
        'Addendum for “Back-Up” Contract',
    },
    {
      formId: 'mineral-reservation',
      title:
        'Addendum for Reservation of Oil, Gas, and Other Minerals',
    },
    {
      formId: 'other',
      title: 'Other Addendum',
    },
  ];


function createNoticeContact(
  party: CreateInitialOfferTermsInput[
    'buyer'
  ]
): TexasNoticeContactDocument {
  return {
    addressLine1:
      optionalStoredText(
        party.mailingAddress.addressLine1
      ),
    addressLine2:
      optionalStoredText(
        party.mailingAddress.addressLine2
      ),
    city:
      optionalStoredText(
        party.mailingAddress.city
      ),
    state:
      optionalStoredText(
        party.mailingAddress.state
      ),
    zipCode:
      optionalStoredText(
        party.mailingAddress.zipCode
      ),
    phone:
      optionalStoredText(party.phone),
    email:
      optionalStoredText(party.email),
  };
}


function normalizeExpirationHours(
  value: number | undefined
): number {
  return (
    Number.isInteger(value) &&
    (value ?? 0) >= 1 &&
    (value ?? 0) <= 168
  )
    ? value as number
    : DEFAULT_OFFER_EXPIRATION_HOURS;
}


function readFirstListingText(
  listingData: Record<string, unknown>,
  fieldNames: string[]
): string | undefined {
  for (const fieldName of fieldNames) {
    const value = readListingText(
      listingData,
      fieldName
    );

    if (value) {
      return value;
    }
  }

  return undefined;
}


function readListingText(
  listingData: Record<string, unknown>,
  fieldName: string
): string | undefined {
  const value = listingData[fieldName];

  return typeof value === 'string'
    ? optionalStoredText(value)
    : undefined;
}


function isListingRequiredAddendum(
  formId: string,
  listingData: Record<string, unknown>
): boolean {
  switch (formId) {
    case 'mandatory-poa-membership':
      return readNestedListingBoolean(
        listingData,
        'sellerStatements',
        'ownersAssociationApplies'
      ) === true;

    case 'residential-leases':
      return readNestedListingBoolean(
        listingData,
        'sellerStatements',
        'leasesExist'
      ) === true;

    case 'lead-based-paint':
      return readNestedListingBoolean(
        listingData,
        'sellerStatements',
        'leadBasedPaintApplies'
      ) === true;

    default:
      return false;
  }
}


function readNestedListingBoolean(
  listingData: Record<string, unknown>,
  objectFieldName: string,
  fieldName: string
): boolean | null {
  const nested = listingData[objectFieldName];

  if (
    nested === null ||
    typeof nested !== 'object' ||
    Array.isArray(nested)
  ) {
    return null;
  }

  const value =
    (nested as Record<string, unknown>)[fieldName];

  return typeof value === 'boolean'
    ? value
    : null;
}


function readFirstNestedListingText(
  listingData: Record<string, unknown>,
  paths: ReadonlyArray<readonly [string, string]>
): string | undefined {
  for (const [objectFieldName, fieldName] of paths) {
    const nested = listingData[objectFieldName];
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      const value = (nested as Record<string, unknown>)[fieldName];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
  }
  return undefined;
}


function readNestedListingNumber(
  listingData: Record<string, unknown>,
  objectFieldName: string,
  fieldName: string
): number | undefined {
  const nested = listingData[objectFieldName];
  if (!nested || typeof nested !== 'object' || Array.isArray(nested)) {
    return undefined;
  }
  const value = (nested as Record<string, unknown>)[fieldName];
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : undefined;
}


function toOptionalCents(value: number | undefined): number | undefined {
  return value === undefined
    ? undefined
    : Math.round(value * 100);
}


function optionalStoredText(
  value: string | undefined
): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim();

  return normalized.length > 0
    ? normalized
    : undefined;
}
