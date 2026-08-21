import {
  ProfessionalUser
} from '../../../core/domains/users/models/professional-user.model';

const seedCreatedAt =
  new Date('2026-08-20T12:00:00.000Z');

export const NORTH_CAROLINA_PROFESSIONALS:
  ReadonlyArray<ProfessionalUser> = [
    {
      uid: 'nc-financing-001',
      ownerUid: 'seed-owner-financing-001',

      businessName:
        'Carolina Community Bank',

      category: 'financing',
      professionalType: 'bank',

      specialties: [
        'Conventional mortgages',
        'Jumbo financing',
        'Construction loans'
      ],

      stateName: 'North Carolina',
      stateAbbreviation: 'NC',
      stateSlug: 'north-carolina',

      serviceAreaType: 'statewide',
      counties: [],
      cities: [],

      phone: '(919) 555-0142',
      email:
        'mortgages@carolinacommunity.example',

      subscriptionStatus: 'profile',
      placement: 'sponsored',

      profileSlug:
        'carolina-community-bank',

      website:
        'https://carolinacommunity.example',

      description:
        'Residential mortgage and construction financing for homebuyers and homeowners throughout North Carolina.',

      submissionCertified: true,
      submissionCertifiedAt: seedCreatedAt,

      status: 'active',
      createdAt: seedCreatedAt,
      updatedAt: seedCreatedAt
    },
    {
      uid: 'nc-financing-002',
      ownerUid: 'seed-owner-financing-002',

      businessName:
        'Triangle Home Lending',

      category: 'financing',
      professionalType: 'mortgage_broker',

      specialties: [
        'First-time homebuyers',
        'Conventional financing',
        'Government lending'
      ],

      stateName: 'North Carolina',
      stateAbbreviation: 'NC',
      stateSlug: 'north-carolina',

      serviceAreaType: 'counties',

      counties: [
        'Wake',
        'Durham',
        'Johnston',
        'Orange'
      ],

      cities: [],

      phone: '(919) 555-0188',
      email:
        'loans@trianglehomelending.example',

      subscriptionStatus: 'free',
      placement: 'standard',

      submissionCertified: true,
      submissionCertifiedAt: seedCreatedAt,

      status: 'active',
      createdAt: seedCreatedAt,
      updatedAt: seedCreatedAt
    },
    {
      uid: 'nc-legal-001',
      ownerUid: 'seed-owner-legal-001',

      businessName:
        'Oak City Real Estate Law',

      category: 'legal',
      professionalType:
        'real_estate_attorney',

      specialties: [
        'Residential closings',
        'Contract review',
        'Title matters'
      ],

      stateName: 'North Carolina',
      stateAbbreviation: 'NC',
      stateSlug: 'north-carolina',

      serviceAreaType: 'counties',

      counties: [
        'Wake',
        'Durham',
        'Franklin',
        'Johnston'
      ],

      cities: [],

      phone: '(919) 555-0116',
      email:
        'closings@oakcitylaw.example',

      subscriptionStatus: 'profile',
      placement: 'standard',

      profileSlug:
        'oak-city-real-estate-law',

      website:
        'https://oakcitylaw.example',

      description:
        'A North Carolina law practice focused on residential real estate closings, contract review and title-related matters.',

      submissionCertified: true,
      submissionCertifiedAt: seedCreatedAt,

      status: 'active',
      createdAt: seedCreatedAt,
      updatedAt: seedCreatedAt
    },
    {
      uid: 'nc-legal-002',
      ownerUid: 'seed-owner-legal-002',

      businessName:
        'Blue Ridge Property Counsel',

      category: 'legal',
      professionalType:
        'closing_attorney',

      specialties: [
        'Purchase closings',
        'Refinance closings',
        'Seller representation'
      ],

      stateName: 'North Carolina',
      stateAbbreviation: 'NC',
      stateSlug: 'north-carolina',

      serviceAreaType: 'cities',

      counties: [],

      cities: [
        'Asheville',
        'Hendersonville',
        'Black Mountain'
      ],

      phone: '(828) 555-0148',
      email:
        'office@blueridgecounsel.example',

      subscriptionStatus: 'free',
      placement: 'standard',

      submissionCertified: true,
      submissionCertifiedAt: seedCreatedAt,

      status: 'active',
      createdAt: seedCreatedAt,
      updatedAt: seedCreatedAt
    },
    {
      uid: 'nc-title-001',
      ownerUid: 'seed-owner-title-001',

      businessName:
        'Cardinal Title Services',

      category: 'title_and_closing',
      professionalType: 'title_company',

      specialties: [
        'Title searches',
        'Title insurance',
        'Closing coordination'
      ],

      stateName: 'North Carolina',
      stateAbbreviation: 'NC',
      stateSlug: 'north-carolina',

      serviceAreaType: 'statewide',
      counties: [],
      cities: [],

      phone: '(704) 555-0124',
      email:
        'orders@cardinaltitle.example',

      subscriptionStatus: 'profile',
      placement: 'sponsored',

      profileSlug:
        'cardinal-title-services',

      website:
        'https://cardinaltitle.example',

      description:
        'Statewide title-search, title-insurance and residential closing-coordination services.',

      submissionCertified: true,
      submissionCertifiedAt: seedCreatedAt,

      status: 'active',
      createdAt: seedCreatedAt,
      updatedAt: seedCreatedAt
    },
    {
      uid: 'nc-title-002',
      ownerUid: 'seed-owner-title-002',

      businessName:
        'Cape Fear Settlement Company',

      category: 'title_and_closing',
      professionalType:
        'settlement_company',

      specialties: [
        'Closing coordination',
        'Document preparation',
        'Remote closing support'
      ],

      stateName: 'North Carolina',
      stateAbbreviation: 'NC',
      stateSlug: 'north-carolina',

      serviceAreaType: 'counties',

      counties: [
        'New Hanover',
        'Brunswick',
        'Pender'
      ],

      cities: [],

      phone: '(910) 555-0173',
      email:
        'closing@capefearsettlement.example',

      subscriptionStatus: 'free',
      placement: 'standard',

      submissionCertified: true,
      submissionCertifiedAt: seedCreatedAt,

      status: 'active',
      createdAt: seedCreatedAt,
      updatedAt: seedCreatedAt
    },
    {
      uid: 'nc-inspection-001',
      ownerUid: 'seed-owner-inspection-001',

      businessName:
        'Carolina Home Check',

      category: 'inspections',
      professionalType:
        'home_inspector',

      specialties: [
        'Pre-purchase inspections',
        'Pre-listing inspections',
        'Radon testing'
      ],

      stateName: 'North Carolina',
      stateAbbreviation: 'NC',
      stateSlug: 'north-carolina',

      serviceAreaType: 'counties',

      counties: [
        'Wake',
        'Durham',
        'Granville',
        'Franklin'
      ],

      cities: [],

      phone: '(919) 555-0191',
      email:
        'schedule@carolinahomecheck.example',

      subscriptionStatus: 'profile',
      placement: 'standard',

      profileSlug:
        'carolina-home-check',

      website:
        'https://carolinahomecheck.example',

      description:
        'Residential inspection services for buyers, sellers and homeowners throughout the Triangle area.',

      submissionCertified: true,
      submissionCertifiedAt: seedCreatedAt,

      status: 'active',
      createdAt: seedCreatedAt,
      updatedAt: seedCreatedAt
    },
    {
      uid: 'nc-inspection-002',
      ownerUid: 'seed-owner-inspection-002',

      businessName:
        'Piedmont Pest and Property',

      category: 'inspections',
      professionalType:
        'pest_inspector',

      specialties: [
        'Termite inspections',
        'Wood-destroying insects',
        'Moisture evaluations'
      ],

      stateName: 'North Carolina',
      stateAbbreviation: 'NC',
      stateSlug: 'north-carolina',

      serviceAreaType: 'cities',

      counties: [],

      cities: [
        'Greensboro',
        'Winston-Salem',
        'High Point'
      ],

      phone: '(336) 555-0159',
      email:
        'inspections@piedmontpest.example',

      subscriptionStatus: 'free',
      placement: 'standard',

      submissionCertified: true,
      submissionCertifiedAt: seedCreatedAt,

      status: 'active',
      createdAt: seedCreatedAt,
      updatedAt: seedCreatedAt
    },
    {
      uid: 'nc-valuation-001',
      ownerUid: 'seed-owner-valuation-001',

      businessName:
        'Triangle Independent Valuations',

      category: 'property_and_valuation',
      professionalType:
        'independent_appraiser',

      specialties: [
        'Pre-listing valuations',
        'Estate valuations',
        'Private-use appraisals'
      ],

      stateName: 'North Carolina',
      stateAbbreviation: 'NC',
      stateSlug: 'north-carolina',

      serviceAreaType: 'counties',

      counties: [
        'Wake',
        'Durham',
        'Orange',
        'Chatham'
      ],

      cities: [],

      phone: '(919) 555-0137',
      email:
        'value@trianglevaluations.example',

      subscriptionStatus: 'free',
      placement: 'standard',

      submissionCertified: true,
      submissionCertifiedAt: seedCreatedAt,

      status: 'active',
      createdAt: seedCreatedAt,
      updatedAt: seedCreatedAt
    },
    {
      uid: 'nc-valuation-002',
      ownerUid: 'seed-owner-valuation-002',

      businessName:
        'Carolina Boundary Surveying',

      category: 'property_and_valuation',
      professionalType:
        'land_surveyor',

      specialties: [
        'Boundary surveys',
        'Residential closing surveys',
        'Elevation certificates'
      ],

      stateName: 'North Carolina',
      stateAbbreviation: 'NC',
      stateSlug: 'north-carolina',

      serviceAreaType: 'statewide',
      counties: [],
      cities: [],

      phone: '(704) 555-0166',
      email:
        'projects@carolinaboundary.example',

      subscriptionStatus: 'profile',
      placement: 'standard',

      profileSlug:
        'carolina-boundary-surveying',

      website:
        'https://carolinaboundary.example',

      description:
        'Residential and commercial surveying services available throughout North Carolina.',

      submissionCertified: true,
      submissionCertifiedAt: seedCreatedAt,

      status: 'active',
      createdAt: seedCreatedAt,
      updatedAt: seedCreatedAt
    },
    {
      uid: 'nc-preparation-001',
      ownerUid: 'seed-owner-preparation-001',

      businessName:
        'Front Door Property Media',

      category: 'home_preparation',
      professionalType:
        'real_estate_photographer',

      specialties: [
        'Listing photography',
        'Floor plans',
        'Twilight photography'
      ],

      stateName: 'North Carolina',
      stateAbbreviation: 'NC',
      stateSlug: 'north-carolina',

      serviceAreaType: 'cities',

      counties: [],

      cities: [
        'Raleigh',
        'Cary',
        'Apex',
        'Wake Forest'
      ],

      phone: '(919) 555-0108',
      email:
        'bookings@frontdoorpropertymedia.example',

      subscriptionStatus: 'profile',
      placement: 'sponsored',

      profileSlug:
        'front-door-property-media',

      website:
        'https://frontdoorpropertymedia.example',

      description:
        'Professional real estate photography and floor-plan services for homeowners and property professionals.',

      submissionCertified: true,
      submissionCertifiedAt: seedCreatedAt,

      status: 'active',
      createdAt: seedCreatedAt,
      updatedAt: seedCreatedAt
    },
    {
      uid: 'nc-preparation-002',
      ownerUid: 'seed-owner-preparation-002',

      businessName:
        'Ready to Show Home Services',

      category: 'home_preparation',
      professionalType:
        'home_stager',

      specialties: [
        'Occupied-home staging',
        'Vacant-home staging',
        'Pre-listing consultations'
      ],

      stateName: 'North Carolina',
      stateAbbreviation: 'NC',
      stateSlug: 'north-carolina',

      serviceAreaType: 'counties',

      counties: [
        'Mecklenburg',
        'Union',
        'Cabarrus'
      ],

      cities: [],

      phone: '(704) 555-0184',
      email:
        'hello@readytoshow.example',

      subscriptionStatus: 'free',
      placement: 'standard',

      submissionCertified: true,
      submissionCertifiedAt: seedCreatedAt,

      status: 'active',
      createdAt: seedCreatedAt,
      updatedAt: seedCreatedAt
    },
    {
      uid: 'nc-insurance-001',
      ownerUid: 'seed-owner-insurance-001',

      businessName:
        'Tar Heel Property Insurance',

      category: 'insurance_and_protection',
      professionalType:
        'insurance_agency',

      specialties: [
        'Homeowners insurance',
        'Landlord policies',
        'Vacant-home coverage'
      ],

      stateName: 'North Carolina',
      stateAbbreviation: 'NC',
      stateSlug: 'north-carolina',

      serviceAreaType: 'statewide',
      counties: [],
      cities: [],

      phone: '(800) 555-0132',
      email:
        'quotes@tarheelpropertyinsurance.example',

      subscriptionStatus: 'profile',
      placement: 'standard',

      profileSlug:
        'tar-heel-property-insurance',

      website:
        'https://tarheelpropertyinsurance.example',

      description:
        'Property-insurance options for homeowners, buyers, landlords and residential investors throughout North Carolina.',

      submissionCertified: true,
      submissionCertifiedAt: seedCreatedAt,

      status: 'active',
      createdAt: seedCreatedAt,
      updatedAt: seedCreatedAt
    },
    {
      uid: 'nc-insurance-002',
      ownerUid: 'seed-owner-insurance-002',

      businessName:
        'Coastal Flood Coverage',

      category: 'insurance_and_protection',
      professionalType:
        'flood_insurance_specialist',

      specialties: [
        'Flood insurance',
        'Coastal properties',
        'Elevation review'
      ],

      stateName: 'North Carolina',
      stateAbbreviation: 'NC',
      stateSlug: 'north-carolina',

      serviceAreaType: 'counties',

      counties: [
        'Brunswick',
        'New Hanover',
        'Onslow',
        'Carteret',
        'Dare'
      ],

      cities: [],

      phone: '(910) 555-0119',
      email:
        'coverage@coastalflood.example',

      subscriptionStatus: 'free',
      placement: 'standard',

      submissionCertified: true,
      submissionCertifiedAt: seedCreatedAt,

      status: 'active',
      createdAt: seedCreatedAt,
      updatedAt: seedCreatedAt
    },
    {
      uid: 'nc-moving-001',
      ownerUid: 'seed-owner-moving-001',

      businessName:
        'Longleaf Moving Company',

      category: 'moving_and_storage',
      professionalType:
        'moving_company',

      specialties: [
        'Local residential moves',
        'Long-distance moves',
        'Packing services'
      ],

      stateName: 'North Carolina',
      stateAbbreviation: 'NC',
      stateSlug: 'north-carolina',

      serviceAreaType: 'statewide',
      counties: [],
      cities: [],

      phone: '(919) 555-0176',
      email:
        'moves@longleafmoving.example',

      subscriptionStatus: 'profile',
      placement: 'standard',

      profileSlug:
        'longleaf-moving-company',

      website:
        'https://longleafmoving.example',

      description:
        'Residential moving, packing and relocation services serving communities across North Carolina.',

      submissionCertified: true,
      submissionCertifiedAt: seedCreatedAt,

      status: 'active',
      createdAt: seedCreatedAt,
      updatedAt: seedCreatedAt
    },
    {
      uid: 'nc-moving-002',
      ownerUid: 'seed-owner-moving-002',

      businessName:
        'Capital Area Storage',

      category: 'moving_and_storage',
      professionalType:
        'storage_facility',

      specialties: [
        'Climate-controlled storage',
        'Short-term storage',
        'Moving supplies'
      ],

      stateName: 'North Carolina',
      stateAbbreviation: 'NC',
      stateSlug: 'north-carolina',

      serviceAreaType: 'cities',

      counties: [],

      cities: [
        'Raleigh',
        'Garner',
        'Knightdale'
      ],

      phone: '(919) 555-0151',
      email:
        'storage@capitalareastorage.example',

      subscriptionStatus: 'free',
      placement: 'standard',

      submissionCertified: true,
      submissionCertifiedAt: seedCreatedAt,

      status: 'active',
      createdAt: seedCreatedAt,
      updatedAt: seedCreatedAt
    }
  ];