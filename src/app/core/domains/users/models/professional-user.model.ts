import {
  ProfessionalCategory,
  ProfessionalType
} from './professional-type';

export type ProfessionalServiceAreaType =
  | 'statewide'
  | 'counties'
  | 'cities';

export type ProfessionalSubscriptionStatus =
  | 'free'
  | 'profile';

export type ProfessionalPlacement =
  | 'standard'
  | 'sponsored';

export type ProfessionalListingStatus =
  | 'active'
  | 'suspended'
  | 'removed';

/** A state has its own independently configured coverage. */
export interface ProfessionalStateCoverage {
  stateName: string;
  stateAbbreviation: string;
  stateSlug: string;
  serviceAreaType: ProfessionalServiceAreaType;
  counties: string[];
  cities: string[];
}

/** Payment entitlement is independent from publication and moderation. */
export type ProfessionalPaymentModel = 'one_time' | 'recurring';
export type ProfessionalPublicationStatus =
  | 'draft'
  | 'pending_payment'
  | 'published';

export interface ProfessionalUser {
  /**
   * Unique ID for the professional directory listing.
   */
  uid: string;

  /**
   * NavStreet user who owns or manages this listing.
   */
  ownerUid: string;

  businessName: string;

  category: ProfessionalCategory;
  professionalType: ProfessionalType;

  /**
   * Optional services shown beneath the primary
   * professional type.
   */
  specialties: string[];

  stateName: string;
  stateAbbreviation: string;
  stateSlug: string;

  serviceAreaType: ProfessionalServiceAreaType;
  counties: string[];
  cities: string[];

  /** New multi-state records; legacy records retain stateSlug above. */
  serviceStates?: ProfessionalStateCoverage[];
  serviceStateSlugs?: string[];

  /** Missing publicationStatus on legacy records means published. */
  publicationStatus?: ProfessionalPublicationStatus;
  paymentModel?: ProfessionalPaymentModel;

  /** A pending paid upgrade must not overwrite the published free listing. */
  pendingUpgrade?: {
    serviceStates: ProfessionalStateCoverage[];
    website: string;
    description: string;
    logoUrl?: string;
    checkoutSessionId?: string;
  };

  phone: string;
  email: string;

  /**
   * Free listings receive a directory card.
   * Profile subscribers also receive a dedicated
   * business-profile page.
   */
  subscriptionStatus:
    ProfessionalSubscriptionStatus;

  /**
   * Sponsored placement is separate from purchasing
   * a complete business profile.
   */
  placement: ProfessionalPlacement;

  /**
   * Only populated for subscribers with a dedicated
   * professional profile.
   */
  profileSlug?: string;
  website?: string;
  description?: string;
  logoUrl?: string;

  /**
   * The provider certifies ownership or authorization
   * when submitting the listing. NavStreet does not
   * independently verify that representation.
   */
  submissionCertified: boolean;
  submissionCertifiedAt?: Date;

  status: ProfessionalListingStatus;

  createdAt: Date;
  updatedAt: Date;
}