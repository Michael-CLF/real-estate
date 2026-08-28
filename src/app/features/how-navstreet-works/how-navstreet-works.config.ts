import {
  AudiencePath,
  CapabilitySection,
  JourneyStep,
  ProductTourAction
} from './models/how-navstreet-works.models';

export const AUDIENCE_PATHS:
  readonly AudiencePath[] = [
    {
      analyticsName: 'buyer_path',
      description:
        'Discover properties, understand the details, estimate costs, contact sellers and request showings.',
      destination: 'buyers',
      icon: 'fa-solid fa-house',
      label: 'I’m Buying'
    },
    {
      analyticsName: 'seller_path',
      description:
        'Create a comprehensive listing, reach buyers, manage inquiries and monitor property activity.',
      destination: 'sellers',
      icon: 'fa-solid fa-sign-hanging',
      label: 'I’m Selling'
    },
    {
      analyticsName:
        'professional_path',
      description:
        'Connect with consumers, build professional visibility and grow your real estate business.',
      destination: 'professionals',
      icon: 'fa-solid fa-briefcase',
      label: 'I’m a Professional'
    },
    {
      analyticsName:
        'platform_path',
      description:
        'Explore the tools, education and connected services available throughout NavStreet.',
      destination: 'capabilities',
      icon: 'fa-solid fa-compass',
      label: 'Explore NavStreet'
    }
  ];

export const BUYER_JOURNEY_STEPS:
  readonly JourneyStep[] = [
    {
      description:
        'Search active properties, explore available markets and identify homes that match your needs.',
      icon:
        'fa-solid fa-magnifying-glass',
      status: 'available',
      title: 'Discover Homes'
    },
    {
      description:
        'Review photographs, property facts, enhancements, nearby schools and seller-provided information.',
      icon:
        'fa-solid fa-house-circle-check',
      status: 'available',
      title: 'Understand the Property'
    },
    {
      description:
        'Use mortgage, affordability and closing-cost tools to better understand the potential financial commitment.',
      icon:
        'fa-solid fa-calculator',
      status: 'available',
      title: 'Estimate the Cost'
    },
    {
      description:
        'Save interesting properties and return to them from your personalized dashboard.',
      icon:
        'fa-solid fa-heart',
      status: 'available',
      title: 'Save Properties'
    },
    {
      description:
        'Send the seller a private property-specific message and provide the information needed for a response.',
      icon:
        'fa-solid fa-message',
      status: 'available',
      title: 'Contact the Seller'
    },
    {
      description:
        'Request a showing, propose a preferred time and track the seller’s response.',
      icon:
        'fa-solid fa-calendar-check',
      status: 'available',
      title: 'Schedule a Showing'
    },
    {
      description:
        'Prepare, review and submit an offer through an organized online workflow.',
      icon:
        'fa-solid fa-file-signature',
      status: 'available',
      title: 'Make an Offer'
    },
    {
      description:
        'Complete the remaining transaction and closing steps, receive the keys and begin enjoying your new home.',
      icon:
        'fa-solid fa-house-circle-check',
      status: 'available',
      title: 'Close on Your New Home'
    }

  ];

export const SELLER_JOURNEY_STEPS:
  readonly JourneyStep[] = [
    {
      description:
        'Start with the property address. NavStreet creates and automatically saves the listing draft.',
      icon:
        'fa-solid fa-location-dot',
      status: 'available',
      title: 'Add the Address'
    },
    {
      description:
        'Enter the property type, bedrooms, bathrooms, square footage, lot information, year built, HOA and description.',
      icon:
        'fa-solid fa-house',
      status: 'available',
      title: 'Describe the Property'
    },
    {
      description:
        'Choose from hundreds of detailed property enhancements and amenities organized into useful categories.',
      icon:
        'fa-solid fa-list-check',
      status: 'available',
      title: 'Add Features and Amenities'
    },
    {
      description:
        'Upload as many as 20 photographs, arrange their order and choose the primary listing photograph.',
      icon:
        'fa-solid fa-images',
      status: 'available',
      title: 'Add Photographs'
    },
    {
      description:
        'Set the list price, select optional featured placement and review applicable fees or promotions.',
      icon:
        'fa-solid fa-tag',
      status: 'available',
      title: 'Set the Price'
    },
    {
      description:
        'Review the complete listing and certify that the submitted information is accurate.',
      icon:
        'fa-solid fa-clipboard-check',
      status: 'available',
      title: 'Review the Listing'
    },
    {
      description:
        'Complete secure Stripe identity verification and listing payment before publication.',
      icon:
        'fa-solid fa-shield-halved',
      status: 'available',
      title: 'Verify and Publish'
    },
    {
      description:
        'Update the listing, add enhancements, manage photographs, review activity and respond to interested buyers.',
      icon:
        'fa-solid fa-chart-line',
      status: 'available',
      title: 'Manage the Listing'
    }
  ];

export const CAPABILITY_SECTIONS:
  readonly CapabilitySection[] = [
    {
      capabilities: [
        {
          description:
            'Send a private message directly from the property page and create an organized inquiry record.',
          icon:
            'fa-solid fa-envelope',
          title: 'Buyer Messages'
        },
        {
          description:
            'Receive buyer contact information, property-specific questions and email notifications.',
          icon:
            'fa-solid fa-inbox',
          title: 'Seller Inquiries'
        },
        {
          description:
            'Request a preferred date and time without leaving the property listing.',
          icon:
            'fa-solid fa-calendar-plus',
          title: 'Showing Requests'
        },
        {
          description:
            'Confirm, decline or propose an alternate showing time while maintaining the request history.',
          icon:
            'fa-solid fa-calendar-check',
          title: 'Showing Management'
        }
      ],
      description:
        'NavStreet connects interested buyers and sellers through property-specific communication and scheduling tools.',
      eyebrow:
        'Direct connections',
      id: 'communication',
      title:
        'Move from interest to conversation'
    },
    {
      capabilities: [
        {
          description:
            'Learn how to prepare financially, search effectively and evaluate potential properties.',
          icon:
            'fa-solid fa-key',
          title: 'Buying Guidance'
        },
        {
          description:
            'Understand listing preparation, property presentation, pricing and buyer communication.',
          icon:
            'fa-solid fa-sign-hanging',
          title: 'Selling Guidance'
        },
        {
          description:
            'Explore mortgage payments, affordability, closing costs and financing considerations.',
          icon:
            'fa-solid fa-building-columns',
          title: 'Financing Education'
        },
        {
          description:
            'Understand showings, offers, negotiations, closing and the responsibilities involved in a transaction.',
          icon:
            'fa-solid fa-graduation-cap',
          title: 'Transaction Education'
        }
      ],
      description:
        'Tools are more valuable when people understand how and when to use them.',
      eyebrow:
        'Knowledge and preparation',
      id: 'education',
      title:
        'Make informed real estate decisions'
    },
    {
      capabilities: [
        {
          description:
            'Document step-free access, mobility-friendly design, bathroom accessibility and sensory features.',
          icon:
            'fa-solid fa-universal-access',
          title: 'Accessibility'
        },
        {
          description:
            'Describe primary suites, closets, vanities, tubs, showers and bedroom layouts.',
          icon:
            'fa-solid fa-bed',
          title:
            'Bedrooms and Bathrooms'
        },
        {
          description:
            'Identify clubhouses, pools, trails, fitness facilities, gated access and shared services.',
          icon:
            'fa-solid fa-people-roof',
          title:
            'Community Amenities'
        },
        {
          description:
            'Present architectural design, exterior materials, roofing, foundation and structural information.',
          icon:
            'fa-solid fa-house-chimney',
          title:
            'Construction and Exterior'
        },
        {
          description:
            'Highlight flooring, fireplaces, offices, bonus rooms, living areas and interior finishes.',
          icon:
            'fa-solid fa-couch',
          title:
            'Interior and Living Spaces'
        },
        {
          description:
            'Showcase countertops, appliances, cabinetry, pantry space, lighting and specialty kitchen features.',
          icon:
            'fa-solid fa-kitchen-set',
          title: 'Kitchen'
        },
        {
          description:
            'Add decks, patios, porches, pools, gardens, outdoor kitchens and recreation features.',
          icon:
            'fa-solid fa-umbrella-beach',
          title: 'Outdoor Living'
        },
        {
          description:
            'Describe garages, carports, driveways, electric-vehicle charging, workshops and storage.',
          icon:
            'fa-solid fa-car',
          title:
            'Parking and Storage'
        },
        {
          description:
            'Provide assigned elementary, middle and high-school information for buyers to review.',
          icon:
            'fa-solid fa-school',
          title: 'Nearby Schools'
        },
        {
          description:
            'Identify heating, cooling, water, energy, electrical and efficiency features.',
          icon:
            'fa-solid fa-bolt',
          title:
            'Systems, Utilities and Efficiency'
        },
        {
          description:
            'Present smart-home capabilities, networking, security, entertainment and home-office technology.',
          icon:
            'fa-solid fa-house-signal',
          title:
            'Technology and Security'
        }
      ],
      description:
        'Sellers can choose from hundreds of organized property details, features and amenities—and return later to add more.',
      eyebrow:
        'Comprehensive property information',
      id: 'enhancements',
      title:
        'Show buyers what makes the property different'
    },
    {
      capabilities: [
        {
          description:
            'Estimate principal, interest, taxes, insurance and the potential total monthly payment from a listing.',
          icon:
            'fa-solid fa-house-circle-dollar',
          title:
            'Listing Mortgage Calculator'
        },
        {
          description:
            'Explore estimated mortgage payments using different prices, rates, terms and down payments.',
          icon:
            'fa-solid fa-calculator',
          title:
            'Mortgage Calculator'
        },
        {
          description:
            'Estimate a potential price range using income, debts, interest rates and available funds.',
          icon:
            'fa-solid fa-scale-balanced',
          title:
            'Affordability Calculator'
        },
        {
          description:
            'Explore costs that may be associated with completing a real estate purchase.',
          icon:
            'fa-solid fa-receipt',
          title:
            'Closing-Cost Calculator'
        }
      ],
      description:
        'Move beyond the list price and explore the potential financial picture while evaluating a property.',
      eyebrow:
        'Financial clarity',
      id: 'financing',
      title:
        'Understand what a property may cost'
    },
    {
      capabilities: [
        {
          description:
            'Publish a complete property page that can be shared directly with prospective buyers.',
          icon:
            'fa-solid fa-globe',
          title:
            'Public Listing Page'
        },
        {
          description:
            'Use ordered photographs, a primary image and detailed property information to create a stronger presentation.',
          icon:
            'fa-solid fa-camera-retro',
          title:
            'Property Presentation'
        },
        {
          description:
            'Create and distribute links that direct people to the published property.',
          icon:
            'fa-solid fa-share-nodes',
          title:
            'Shareable Marketing Links'
        },
        {
          description:
            'Use optional featured placement to increase visibility within eligible NavStreet experiences.',
          icon:
            'fa-solid fa-star',
          title:
            'Featured Listing'
        },
        {
          description:
            'Review views, favorites and inquiries to understand how people are engaging with the property.',
          icon:
            'fa-solid fa-chart-column',
          title:
            'Listing Activity'
        },
        {
          description:
            'Continue improving photographs, enhancements and editable information after publication.',
          icon:
            'fa-solid fa-pen-to-square',
          title:
            'Ongoing Listing Management'
        }
      ],
      description:
        'NavStreet helps sellers present, distribute, improve and monitor their property listing.',
      eyebrow:
        'Marketing and visibility',
      id: 'marketing',
      title:
        'Give the property a stronger digital presence'
    },
    {
      capabilities: [
        {
          description:
            'Search for professionals who can support different parts of the real estate journey.',
          icon:
            'fa-solid fa-user-tie',
          title:
            'Find a Professional'
        },
        {
          description:
            'Create a professional presence that helps consumers understand available services.',
          icon:
            'fa-solid fa-address-card',
          title:
            'Professional Profiles'
        },
        {
          description:
            'Register an eligible business and participate in the growing professional marketplace.',
          icon:
            'fa-solid fa-briefcase',
          title:
            'Business Registration'
        },
        {
          description:
            'Connect consumers with relevant real estate, financing and property-related services.',
          icon:
            'fa-solid fa-handshake',
          title:
            'Consumer Connections'
        }
      ],
      description:
        'NavStreet brings consumers and real estate-related professionals together within the same platform.',
      eyebrow:
        'Professional marketplace',
      id: 'professionals',
      title:
        'Find expertise or grow professional visibility'
    },
    {
      capabilities: [
        {
          description:
            'Listing progress is saved automatically so sellers can stop and return without starting over.',
          icon:
            'fa-solid fa-floppy-disk',
          title:
            'Automatically Saved Drafts'
        },
        {
          description:
            'Stripe provides secure identity-verification and payment workflows before publication.',
          icon:
            'fa-brands fa-stripe',
          title:
            'Secure Verification and Payment'
        },
        {
          description:
            'Buyers and sellers can organize relevant property activity through personalized dashboards.',
          icon:
            'fa-solid fa-table-columns',
          title:
            'Personalized Dashboards'
        },
        {
          description:
            'Clear privacy, legal and accessibility resources explain important platform practices.',
          icon:
            'fa-solid fa-shield',
          title:
            'Transparency and Control'
        }
      ],
      description:
        'NavStreet is designed to keep important activity organized while using established services for sensitive workflows.',
      eyebrow:
        'Trust and organization',
      id: 'security',
      title:
        'Use the platform with greater confidence'
    }
  ];

export const PRODUCT_TOUR_ACTIONS:
  readonly ProductTourAction[] = [
    {
      analyticsName:
        'explore_homes',
      destination: '/homes',
      label: 'Explore Homes',
      style: 'primary'
    },
    {
      analyticsName:
        'list_your_home',
      destination: '/sell',
      label: 'List Your Home',
      style: 'primary'
    },
    {
      analyticsName:
        'find_a_professional',
      destination:
        '/find-a-pro/north-carolina',
      label: 'Find a Professional',
      style: 'secondary'
    },
    {
      analyticsName:
        'contact_navstreet',
      destination: '/contact',
      label: 'Contact NavStreet',
      style: 'secondary'
    }
  ];