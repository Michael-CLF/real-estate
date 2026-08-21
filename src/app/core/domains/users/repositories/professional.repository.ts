import {
  ProfessionalListingStatus,
  ProfessionalPlacement,
  ProfessionalServiceAreaType,
  ProfessionalSubscriptionStatus,
  ProfessionalUser
} from '../models/professional-user.model';

import {
  ProfessionalCategory,
  ProfessionalType
} from '../models/professional-type';

export interface InitialProfessionalUser {
  ownerUid: string;

  businessName: string;

  category: ProfessionalCategory;
  professionalType: ProfessionalType;

  specialties: string[];

  stateName: string;
  stateAbbreviation: string;
  stateSlug: string;

  serviceAreaType:
    ProfessionalServiceAreaType;

  counties: string[];
  cities: string[];

  phone: string;
  email: string;

  subscriptionStatus:
    ProfessionalSubscriptionStatus;

  placement: ProfessionalPlacement;

  profileSlug?: string;

  website?: string;
  description?: string;
  logoUrl?: string;

  submissionCertified: boolean;

  status: ProfessionalListingStatus;
}

export type ProfessionalUserChanges =
  Partial<
    Omit<
      ProfessionalUser,
      | 'uid'
      | 'ownerUid'
      | 'createdAt'
      | 'updatedAt'
      | 'submissionCertifiedAt'
    >
  >;

export abstract class ProfessionalRepository {
  /**
   * Creates a professional directory record and returns
   * its Firestore document ID.
   */
  abstract createProfessional(
    professional: InitialProfessionalUser
  ): Promise<string>;

  /**
   * Returns the professional record owned by the
   * authenticated NavStreet user.
   */
  abstract getProfessionalByOwnerUid(
    ownerUid: string
  ): Promise<ProfessionalUser | null>;

  /**
   * Returns one active paid business profile using its
   * state and public profile slug.
   */
  abstract getProfessionalByProfileSlug(
    stateSlug: string,
    profileSlug: string
  ): Promise<ProfessionalUser | null>;

  /**
   * Returns active professional directory records for
   * the selected state.
   */
  abstract getActiveProfessionalsByState(
    stateSlug: string
  ): Promise<ProfessionalUser[]>;

  /**
   * Updates a professional record without permitting
   * ownership or document identity to be transferred.
   */
  abstract updateProfessional(
    professionalUid: string,
    changes: ProfessionalUserChanges
  ): Promise<void>;
}