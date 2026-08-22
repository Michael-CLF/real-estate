import {
  FieldValue
} from 'firebase-admin/firestore';

import {
  HttpsError,
  onCall
} from 'firebase-functions/v2/https';

import {
  adminFirestore
} from '../shared/firebase-admin';

import {
  callableFunctionOptions
} from '../shared/function-options';

interface CreateProfessionalRegistrationRequest {
  businessName: string;

  category: string;
  professionalType: string;

  specialties: string[];

  stateName: string;
  stateAbbreviation: string;
  stateSlug: string;

  serviceAreaType:
    | 'statewide'
    | 'counties'
    | 'cities';

  counties: string[];
  cities: string[];

  phone: string;
  email: string;

  submissionCertified: boolean;
}

interface CreateProfessionalRegistrationResult {
  professionalUid: string;
  alreadyExists: boolean;
}

interface ProfessionalOwnerClaim {
  ownerUid?: string;
  professionalUid?: string;
}

const PROFESSIONAL_COLLECTION =
  'professionalProfiles';

const OWNER_CLAIM_COLLECTION =
  'professionalOwnerClaims';

export const createProfessionalRegistration =
  onCall<
    CreateProfessionalRegistrationRequest,
    Promise<CreateProfessionalRegistrationResult>
  >(
    {
      ...callableFunctionOptions
    },

    async request => {
      const ownerUid =
        request.auth?.uid;

      if (!ownerUid) {
        throw new HttpsError(
          'unauthenticated',
          'You must be signed in to register a business.'
        );
      }

      const authenticatedEmail =
        typeof request.auth?.token.email ===
          'string'
          ? request.auth.token.email
            .trim()
            .toLowerCase()
          : '';

      const businessName =
        readRequiredString(
          request.data?.businessName,
          'A business name is required.'
        );

      const category =
        readRequiredString(
          request.data?.category,
          'A professional category is required.'
        );

      const professionalType =
        readRequiredString(
          request.data?.professionalType,
          'A professional type is required.'
        );

      const stateName =
        readRequiredString(
          request.data?.stateName,
          'A state is required.'
        );

      const stateAbbreviation =
        readRequiredString(
          request.data?.stateAbbreviation,
          'A state abbreviation is required.'
        ).toUpperCase();

      const stateSlug =
        readRequiredString(
          request.data?.stateSlug,
          'A state directory is required.'
        ).toLowerCase();

      const phone =
        readRequiredString(
          request.data?.phone,
          'A business telephone number is required.'
        ).replace(/\D/g, '');

      const email =
        readRequiredString(
          request.data?.email,
          'A business email address is required.'
        ).toLowerCase();

      if (
        !authenticatedEmail ||
        authenticatedEmail !== email
      ) {
        throw new HttpsError(
          'permission-denied',
          'The verified email does not match the business registration email.'
        );
      }

      if (!/^\d{10}$/.test(phone)) {
        throw new HttpsError(
          'invalid-argument',
          'Enter a valid ten-digit business telephone number.'
        );
      }

      if (
        request.data?.submissionCertified !==
        true
      ) {
        throw new HttpsError(
          'failed-precondition',
          'The business submission certification must be accepted.'
        );
      }

      const serviceAreaType =
        readServiceAreaType(
          request.data?.serviceAreaType
        );

      const specialties =
        readStringArray(
          request.data?.specialties
        );

      const counties =
        serviceAreaType === 'counties'
          ? readStringArray(
            request.data?.counties
          )
          : [];

      const cities =
        serviceAreaType === 'cities'
          ? readStringArray(
            request.data?.cities
          )
          : [];

      if (
        serviceAreaType === 'counties' &&
        counties.length === 0
      ) {
        throw new HttpsError(
          'invalid-argument',
          'Enter at least one county served.'
        );
      }

      if (
        serviceAreaType === 'cities' &&
        cities.length === 0
      ) {
        throw new HttpsError(
          'invalid-argument',
          'Enter at least one city served.'
        );
      }

      /*
       * Support professional records created before
       * owner claims were introduced.
       */
      const existingProfessionals =
        await adminFirestore
          .collection(
            PROFESSIONAL_COLLECTION
          )
          .where(
            'ownerUid',
            '==',
            ownerUid
          )
          .limit(1)
          .get();

      const existingProfessional =
        existingProfessionals.docs[0];

      const generatedProfessionalReference =
        adminFirestore
          .collection(
            PROFESSIONAL_COLLECTION
          )
          .doc();

      const ownerClaimReference =
        adminFirestore
          .collection(
            OWNER_CLAIM_COLLECTION
          )
          .doc(ownerUid);

      return adminFirestore.runTransaction(
        async transaction => {
          const claimSnapshot =
            await transaction.get(
              ownerClaimReference
            );

          if (claimSnapshot.exists) {
            const claim =
              claimSnapshot.data() as
                ProfessionalOwnerClaim;

            const claimedProfessionalUid =
              claim.professionalUid?.trim();

            if (!claimedProfessionalUid) {
              throw new HttpsError(
                'failed-precondition',
                'The existing business ownership record is incomplete.'
              );
            }

            return {
              professionalUid:
                claimedProfessionalUid,

              alreadyExists: true
            };
          }

          /*
           * Backfill an ownership claim for an
           * existing professional record.
           */
          if (existingProfessional) {
            transaction.create(
              ownerClaimReference,
              {
                ownerUid,

                professionalUid:
                  existingProfessional.id,

                createdAt:
                  FieldValue.serverTimestamp(),

                updatedAt:
                  FieldValue.serverTimestamp()
              }
            );

            return {
              professionalUid:
                existingProfessional.id,

              alreadyExists: true
            };
          }

          transaction.create(
            generatedProfessionalReference,
            {
              ownerUid,

              businessName,

              category,
              professionalType,

              specialties,

              stateName,
              stateAbbreviation,
              stateSlug,

              serviceAreaType,

              counties,
              cities,

              phone,
              email,

              subscriptionStatus:
                'free',

              placement:
                'standard',

              submissionCertified:
                true,

              submissionCertifiedAt:
                FieldValue.serverTimestamp(),

              status:
                'active',

              createdAt:
                FieldValue.serverTimestamp(),

              updatedAt:
                FieldValue.serverTimestamp()
            }
          );

          transaction.create(
            ownerClaimReference,
            {
              ownerUid,

              professionalUid:
                generatedProfessionalReference.id,

              createdAt:
                FieldValue.serverTimestamp(),

              updatedAt:
                FieldValue.serverTimestamp()
            }
          );

          return {
            professionalUid:
              generatedProfessionalReference.id,

            alreadyExists: false
          };
        }
      );
    }
  );

function readRequiredString(
  value: unknown,
  message: string
): string {
  if (
    typeof value !== 'string' ||
    !value.trim()
  ) {
    throw new HttpsError(
      'invalid-argument',
      message
    );
  }

  return value.trim();
}

function readStringArray(
  value: unknown
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is string =>
        typeof item === 'string' &&
        item.trim().length > 0
    )
    .map(item => item.trim())
    .filter(
      (
        item,
        index,
        values
      ) =>
        values.indexOf(item) === index
    );
}

function readServiceAreaType(
  value: unknown
):
  | 'statewide'
  | 'counties'
  | 'cities' {
  switch (value) {
    case 'statewide':
    case 'counties':
    case 'cities':
      return value;

    default:
      throw new HttpsError(
        'invalid-argument',
        'Select a valid service area.'
      );
  }
}