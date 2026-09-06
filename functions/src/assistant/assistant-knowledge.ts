import {
  AssistantKnowledgeItem
} from './assistant-types';

export const ASSISTANT_KNOWLEDGE:
  readonly AssistantKnowledgeItem[] = [
    {
      id: 'platform-overview',
      title: 'What NavStreet does',
      category: 'platform',
      content:
        'NavStreet is a technology platform that helps property owners market and sell their homes directly. It provides listing creation, property marketing, buyer inquiries, showing requests, educational resources, a professional directory, listing management tools, and transaction organization. NavStreet is not a real estate brokerage, law firm, mortgage lender, appraisal company, title company, or closing attorney.',
      keywords: [
        'navstreet',
        'platform',
        'what does',
        'what is',
        'how does',
        'service',
        'website'
      ],
      path: null,
      requiresDisclaimer: false
    },
    {
      id: 'platform-availability',
      title: 'Current service area',
      category: 'platform',
      content:
        'NavStreet currently supports properties located in North Carolina. The platform may expand into additional states in the future. Features, forms, educational content, and transaction procedures may vary by state.',
      keywords: [
        'state',
        'north carolina',
        'location',
        'available',
        'service area',
        'nationwide'
      ],
      path: null,
      requiresDisclaimer: false
    },
    {
      id: 'seller-create-listing',
      title: 'Creating a property listing',
      category: 'seller',
      content:
        'A seller begins by signing in and completing the listing wizard. The listing process collects the property address, property details, features and enhancements, photographs, pricing information, homeowners association information when applicable, and the seller certification. Draft information is saved so the seller can return and continue later.',
      keywords: [
        'create',
        'listing',
        'sell',
        'seller',
        'wizard',
        'draft',
        'property'
      ],
      path: '/sell/new',
      requiresDisclaimer: false
    },
    {
      id: 'listing-publication',
      title: 'Publishing a listing',
      category: 'listing',
      content:
        'Before a listing is published, the seller must complete the required listing information, certify that the information is accurate and complete to the best of the seller’s knowledge, complete any required identity verification, and complete the applicable payment process. After publication, the property appears in the NavStreet marketplace and can be managed from the seller dashboard.',
      keywords: [
        'publish',
        'publication',
        'live',
        'marketplace',
        'required',
        'certification',
        'payment'
      ],
      path: '/sell/new',
      requiresDisclaimer: false
    },
    {
      id: 'listing-drafts',
      title: 'Listing drafts',
      category: 'listing',
      content:
        'NavStreet saves listing drafts so sellers can leave the listing wizard and return later. A draft is not visible in the public marketplace. The seller can resume the draft from the dashboard and continue with the first incomplete step.',
      keywords: [
        'draft',
        'saved',
        'resume',
        'continue',
        'unfinished',
        'incomplete'
      ],
      path: '/dashboard/listings',
      requiresDisclaimer: false
    },
    {
      id: 'listing-enhancements',
      title: 'Listing enhancements',
      category: 'enhancements',
      content:
        'Listing enhancements allow sellers to add detailed information about the kitchen, interior and living spaces, bedrooms and bathrooms, exterior and outdoor areas, parking and storage, systems and utilities, technology and security, accessibility, nearby schools, and other property details. Enhancements are optional and can be completed after publication from Listing Management. Saved enhancements appear on the public listing when applicable.',
      keywords: [
        'enhancement',
        'features',
        'amenities',
        'kitchen',
        'interior',
        'exterior',
        'parking',
        'systems',
        'technology',
        'accessibility',
        'schools'
      ],
      path: '/dashboard/listings',
      requiresDisclaimer: false
    },
    {
      id: 'listing-featured',
      title: 'Featured Listing',
      category: 'listing',
      content:
        'A seller may select the optional Featured Listing upgrade for an additional $10. A featured property receives a Featured badge and may receive more prominent placement within NavStreet. Featured placement does not guarantee views, inquiries, showings, offers, or a successful sale.',
      keywords: [
        'featured',
        'upgrade',
        'badge',
        'ten dollars',
        '$10',
        'promote'
      ],
      path: null,
      requiresDisclaimer: false
    },
    {
      id: 'listing-editing',
      title: 'Editing a published listing',
      category: 'listing',
      content:
        'The listing owner can manage a published property from Listing Management. Available tools include editing permitted listing information, managing enhancements, reviewing showing requests, setting showing availability, reviewing buyer inquiries, viewing listing activity, opening the Marketing Toolkit, managing the contract timeline when applicable, and changing the listing status.',
      keywords: [
        'edit',
        'manage',
        'change',
        'update',
        'published',
        'listing management'
      ],
      path: '/dashboard/listings',
      requiresDisclaimer: false
    },
    {
      id: 'showing-availability',
      title: 'Showing availability',
      category: 'showings',
      content:
        'Sellers control when buyers may request property showings. The seller must configure showing availability from Listing Management by selecting the available days, times, appointment length, and advance notice. NavStreet does not create showing times automatically. Until availability is configured, online showing requests may be unavailable.',
      keywords: [
        'availability',
        'showing',
        'appointment',
        'schedule',
        'calendar',
        'time',
        'unavailable'
      ],
      path: '/dashboard/listings',
      requiresDisclaimer: false
    },
    {
      id: 'showing-requests',
      title: 'Showing requests',
      category: 'showings',
      content:
        'A buyer can request an available showing time from the public property listing. The seller receives the request and may accept it, decline it, or propose another time. A requested appointment is not confirmed until the seller accepts it. The buyer receives the seller’s response through the NavStreet notification process.',
      keywords: [
        'request',
        'showing',
        'appointment',
        'accept',
        'decline',
        'confirm',
        'another time'
      ],
      path: null,
      requiresDisclaimer: false
    },
    {
      id: 'buyer-inquiries',
      title: 'Contacting a seller',
      category: 'inquiries',
      content:
        'Interested buyers can contact a property seller through the inquiry form on the public listing. NavStreet sends the inquiry to the seller and records the inquiry in the seller’s recent activity and listing-management tools. The buyer’s submitted contact information is shared with the seller so the seller can respond.',
      keywords: [
        'contact',
        'seller',
        'inquiry',
        'question',
        'message',
        'interested'
      ],
      path: null,
      requiresDisclaimer: false
    },
    {
      id: 'saved-listings',
      title: 'Saving a property listing',
      category: 'buyer',
      content:
        'A signed-in user can save a property by selecting Save this listing on the public listing page. Saved properties are available from the user dashboard. A user can remove a saved property later.',
      keywords: [
        'save',
        'saved',
        'favorite',
        'favorites',
        'property',
        'listing'
      ],
      path: null,
      requiresDisclaimer: false
    },
    {
      id: 'marketing-toolkit',
      title: 'Marketing Toolkit',
      category: 'marketing',
      content:
        'NavStreet does not market or advertise a seller’s property on the seller’s behalf. NavStreet gives sellers tools that help them market their own published property. The Marketing Toolkit provides a shareable property link, prepared listing text, social-sharing options, and a marketing checklist. Sellers can use these materials to share their listing through their own social-media accounts, email, text messages, personal contacts, and other lawful marketing channels. Social-media platforms control how shared links and previews appear. NavStreet does not guarantee advertising distribution, views, engagement, buyer inquiries, showings, offers, or a successful sale.',
      keywords: [
        'marketing',
        'market',
        'market my property',
        'market my home',
        'advertise',
        'advertising',
        'promote',
        'promotion',
        'toolkit',
        'share',
        'social media',
        'facebook',
        'x',
        'email',
        'text',
        'link'
      ],
      path: '/dashboard/listings',
      requiresDisclaimer: false
    },
    {
      id: 'listing-activity',
      title: 'Listing activity',
      category: 'listing',
      content:
        'NavStreet may display listing activity such as property views, saved-listing counts, buyer inquiries, showing activity, price changes, publication events, and listing-status changes. Some activity totals may update after the page is refreshed rather than changing instantly.',
      keywords: [
        'activity',
        'views',
        'favorites',
        'inquiries',
        'count',
        'statistics',
        'refresh'
      ],
      path: '/dashboard/listings',
      requiresDisclaimer: false
    },
    {
      id: 'listing-status',
      title: 'Listing status',
      category: 'listing',
      content:
        'Listing statuses organize the property’s progress. Depending on the listing’s current condition and available workflow, the seller may pause, reactivate, withdraw, mark under contract, or mark the property sold. Status changes should reflect the property’s actual condition. Accepted-offer information may support the under-contract status and related transaction workflow.',
      keywords: [
        'status',
        'active',
        'pause',
        'reactivate',
        'withdraw',
        'under contract',
        'sold'
      ],
      path: '/dashboard/listings',
      requiresDisclaimer: false
    },
    {
      id: 'transaction-timeline',
      title: 'Contract timeline',
      category: 'transactions',
      content:
        'The Contract Timeline helps organize important transaction milestones such as earnest money, due diligence, inspections, repairs, appraisal, mortgage approval, title work, insurance, final walkthrough, and closing. The seller enters and maintains applicable dates and statuses. Once connected to an accepted offer, the accepted buyer is intended to receive read-only access to the same timeline. The timeline is an organizational tool and does not calculate, establish, change, or extend contractual deadlines.',
      keywords: [
        'timeline',
        'task',
        'deadline',
        'earnest money',
        'due diligence',
        'inspection',
        'appraisal',
        'mortgage approval',
        'closing',
        'walkthrough'
      ],
      path: '/dashboard/listings',
      requiresDisclaimer: true
    },
    {
      id: 'offers-coming-soon',
      title: 'Making an offer through NavStreet',
      category: 'offers',
      content:
        'A buyer can begin an offer from the public property listing by selecting Make an offer. The buyer must sign in, complete the required offer information, review the proposed terms, agree to the applicable legal requirements, and submit the completed offer directly to the seller through NavStreet. The seller can review and respond to the offer through the listing-management tools. NavStreet provides technology for preparing, communicating, organizing, and preserving offer activity, but it does not represent either party or provide legal advice. Buyers and sellers should review the final purchase agreement carefully and consult a qualified North Carolina real estate attorney when legal guidance is needed.',
      keywords: [
        'offer',
        'make an offer',
        'submit an offer',
        'purchase agreement',
        'counteroffer',
        'counter offer',
        'accept',
        'reject',
        'withdraw',
        'contract'
      ],
      path: null,
      requiresDisclaimer: true
    },
    {
      id: 'identity-verification',
      title: 'Identity verification',
      category: 'identity',
      content:
        'NavStreet may require identity verification before a user can publish a property or complete other protected activities. Identity verification is processed through Stripe Identity. NavStreet should not ask users to submit identity documents, full Social Security numbers, passwords, verification codes, or payment-card details through the assistant.',
      keywords: [
        'identity',
        'verify',
        'verification',
        'stripe identity',
        'document',
        'photo id'
      ],
      path: null,
      requiresDisclaimer: false
    },
    {
      id: 'payments',
      title: 'NavStreet listing price and payments',
      category: 'payments',
      content:
        'A standard NavStreet property listing costs $49. The optional Featured Listing upgrade costs an additional $10, making the total $59 when both are selected. A valid promotion code may reduce the amount due. The complete price calculation is displayed before Stripe Checkout and shows the $49 listing fee, optional $10 Featured Listing fee, promotion discount when applicable, and final amount due. Stripe processes the payment. The assistant cannot collect payment-card information or change a completed charge.',
      keywords: [
        'payment',
        'price',
        'cost',
        'fee',
        'listing fee',
        '49',
        '$49',
        '59',
        '$59',
        'checkout',
        'stripe',
        'featured',
        'promotion',
        'discount',
        'refund'
      ],
      path: null,
      requiresDisclaimer: false
    },
    {
      id: 'professional-directory',
      title: 'Find a professional',
      category: 'professionals',
      content:
        'NavStreet does not provide appraisals, determine property values, or employ appraisal companies. Consumers may use the NavStreet professional directory to search for real-estate-related businesses, which may include appraisal professionals when participating providers are available. NavStreet does not guarantee that an appraiser or any particular type of professional will be listed in the user’s area. A directory listing is not an endorsement, guarantee, employment relationship, or representation by NavStreet. Consumers should independently review each professional’s qualifications, licensing, insurance, services, availability, and fees before hiring them.',
      keywords: [
        'professional',
        'directory',
        'find a pro',
        'agent',
        'attorney',
        'inspection',
        'inspector',
        'appraisal',
        'appraisals',
        'appraiser',
        'property value',
        'contractor',
        'title',
        'insurance'
      ],
      path: '/find-a-pro/north-carolina',
      requiresDisclaimer: true
    },
    {
      id: 'education-center',
      title: 'Education Center',
      category: 'support',
      content:
        'The NavStreet Education Center provides general educational information about buying, selling, financing, property preparation, offers, contracts, and closing. Educational material is provided for general informational purposes and is not a substitute for advice from an attorney, licensed real estate professional, tax adviser, appraiser, lender, home inspector, insurance professional, or other qualified professional.',
      keywords: [
        'education',
        'guide',
        'article',
        'learn',
        'help',
        'buying',
        'selling',
        'financing',
        'closing'
      ],
      path: '/education',
      requiresDisclaimer: true
    },
    {
      id: 'account-access',
      title: 'NavStreet accounts',
      category: 'account',
      content:
        'NavStreet uses passwordless email authentication. A user enters an email address and receives a one-time verification code. Users should never share a verification code with another person or enter it into the assistant. Users must be at least 18 years old to create an account or use protected transaction features.',
      keywords: [
        'account',
        'sign in',
        'login',
        'register',
        'password',
        'code',
        'otp',
        'email',
        'age'
      ],
      path: null,
      requiresDisclaimer: false
    },
    {
      id: 'fair-housing',
      title: 'Fair housing',
      category: 'legal',
      content:
        'Users must comply with applicable fair-housing and anti-discrimination laws. NavStreet must not help users advertise, select, exclude, rank, or evaluate people or neighborhoods based on race, color, religion, sex, disability, familial status, national origin, or any other legally protected characteristic. The assistant may provide neutral information about property features and direct users to official resources, but it must not characterize a neighborhood by protected groups or recommend discriminatory conduct.',
      keywords: [
        'fair housing',
        'discrimination',
        'race',
        'religion',
        'sex',
        'disability',
        'children',
        'families',
        'national origin',
        'neighborhood'
      ],
      path: '/terms',
      requiresDisclaimer: true
    },
    {
      id: 'legal-limitations',
      title: 'Legal and professional limitations',
      category: 'legal',
      content:
        'NavStreet provides technology and general educational information. It does not act as a real estate broker, agent, attorney, lender, mortgage broker, appraiser, inspector, title company, insurance provider, tax adviser, or fiduciary. The assistant must not interpret contracts, select contract terms, calculate legal deadlines, recommend an offer price, determine property value, determine loan eligibility, or tell a user whether to accept or reject an offer.',
      keywords: [
        'legal',
        'advice',
        'contract',
        'deadline',
        'offer price',
        'property value',
        'mortgage',
        'qualify',
        'accept offer',
        'reject offer'
      ],
      path: '/terms',
      requiresDisclaimer: true
    },
    {
      id: 'privacy',
      title: 'Privacy and assistant messages',
      category: 'privacy',
      content:
        'Users should not provide passwords, one-time verification codes, full Social Security numbers, payment-card details, government identification numbers, identity documents, banking credentials, or other highly sensitive information to the assistant. Assistant messages may be processed by NavStreet’s AI service provider and may be retained for security, support, quality, and performance purposes as described in the NavStreet Privacy Policy.',
      keywords: [
        'privacy',
        'personal information',
        'data',
        'chat',
        'conversation',
        'delete',
        'security',
        'sensitive'
      ],
      path: '/privacy',
      requiresDisclaimer: false
    },
    {
      id: 'terms-of-service',
      title: 'Terms of Service',
      category: 'legal',
      content:
        'Use of NavStreet is governed by the NavStreet Terms of Service. Users creating a listing or later submitting an offer must agree to the Terms of Service and acknowledge the Privacy Policy. The Terms describe eligibility, user responsibilities, prohibited conduct, payments, platform limitations, and dispute provisions.',
      keywords: [
        'terms',
        'terms of service',
        'agreement',
        'agree',
        'rules',
        'conditions'
      ],
      path: '/terms',
      requiresDisclaimer: false
    },
    {
      id: 'support',
      title: 'Contacting NavStreet',
      category: 'support',
      content:
        'Questions about NavStreet may be directed to the appropriate NavStreet support channel. Legal and privacy questions may be sent to legal@navstreet.com. Users should not send passwords, one-time verification codes, payment-card data, or identity documents by email or through the assistant.',
      keywords: [
        'support',
        'contact',
        'email',
        'help',
        'legal',
        'privacy'
      ],
      path: null,
      requiresDisclaimer: false
    }
  ];

const DEFAULT_KNOWLEDGE_IDS =
  new Set([
    'platform-overview',
    'legal-limitations',
    'support'
  ]);

const MAXIMUM_RELEVANT_ITEMS =
  6;

export function getRelevantAssistantKnowledge(
  message: string,
  currentPath: string | null
): AssistantKnowledgeItem[] {
  const normalizedMessage =
    normalizeSearchValue(
      message
    );

  const normalizedPath =
    normalizeSearchValue(
      currentPath ?? ''
    );

  const scoredItems =
    ASSISTANT_KNOWLEDGE.map(
      item => ({
        item,
        score:
          calculateKnowledgeScore(
            item,
            normalizedMessage,
            normalizedPath
          )
      })
    )
      .filter(
        result =>
          result.score > 0 ||
          DEFAULT_KNOWLEDGE_IDS.has(
            result.item.id
          )
      )
      .sort(
        (
          firstResult,
          secondResult
        ) =>
          secondResult.score -
          firstResult.score
      );

  const selectedItems:
    AssistantKnowledgeItem[] = [];

  for (
    const result of scoredItems
  ) {
    if (
      selectedItems.some(
        item =>
          item.id ===
          result.item.id
      )
    ) {
      continue;
    }

    selectedItems.push(
      result.item
    );

    if (
      selectedItems.length >=
      MAXIMUM_RELEVANT_ITEMS
    ) {
      break;
    }
  }

  return selectedItems;
}

function calculateKnowledgeScore(
  item: AssistantKnowledgeItem,
  normalizedMessage: string,
  normalizedPath: string
): number {
  let score = 0;

  const normalizedTitle =
    normalizeSearchValue(
      item.title
    );

  if (
    normalizedMessage.includes(
      normalizedTitle
    )
  ) {
    score += 8;
  }

  for (
    const keyword of item.keywords
  ) {
    const normalizedKeyword =
      normalizeSearchValue(
        keyword
      );

    if (
      normalizedMessage.includes(
        normalizedKeyword
      )
    ) {
      score +=
        normalizedKeyword.includes(' ')
          ? 5
          : 3;
    }
  }

  if (
    item.path &&
    normalizedPath &&
    normalizeSearchValue(
      item.path
    ) === normalizedPath
  ) {
    score += 2;
  }

  return score;
}

function normalizeSearchValue(
  value: string
): string {
  return value
    .toLowerCase()
    .replace(
      /[^a-z0-9/$\s-]/g,
      ' '
    )
    .replace(
      /\s+/g,
      ' '
    )
    .trim();
}