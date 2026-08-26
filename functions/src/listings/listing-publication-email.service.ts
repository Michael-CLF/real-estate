import sgMail from '@sendgrid/mail';

import {
  FieldValue,
  Timestamp
} from 'firebase-admin/firestore';

import {
  adminFirestore
} from '../shared/firebase-admin';

import {
  OTP_FROM_EMAIL,
  OTP_FROM_NAME,
  SENDGRID_API_KEY
} from '../authentication/otp/otp-config';

import {
  LISTING_PUBLISHED_SENDGRID_TEMPLATE_ID
} from './listing-publication-email-config';

export interface ListingPublicationEmailData {
  listingUid: string;
  sellerUid: string;
  propertyAddress: string;
  primaryPhotoUrl: string | null;
}

interface PlatformUserDocument {
  firstName?: string;
  displayName?: string;
  email?: string;
}

interface PublicationEmailDeliveryDocument {
  status?: string;
  leaseExpiresAt?: Timestamp;
}

const DELIVERY_COLLECTION =
  'listingPublicationEmailDeliveries';

const DELIVERY_LEASE_MILLISECONDS =
  5 * 60 * 1000;

export async function sendListingPublishedEmailIfNeeded(
  data: ListingPublicationEmailData
): Promise<void> {
  const deliveryReference =
    adminFirestore
      .collection(
        DELIVERY_COLLECTION
      )
      .doc(data.listingUid);

  const deliveryClaimed =
    await claimDelivery(
      deliveryReference,
      data
    );

  if (!deliveryClaimed) {
    return;
  }

  try {
    const userSnapshot =
      await adminFirestore
        .collection('users')
        .doc(data.sellerUid)
        .get();

    if (!userSnapshot.exists) {
      throw new Error(
        `Seller profile ${data.sellerUid} was not found.`
      );
    }

    const user =
      userSnapshot.data() as
        PlatformUserDocument;

    const sellerEmail =
      user.email?.trim() ?? '';

    const sellerName =
      user.firstName?.trim() ||
      user.displayName?.trim() ||
      'Seller';

    if (!sellerEmail) {
      throw new Error(
        'The seller profile does not contain an email address.'
      );
    }

    const apiKey =
      SENDGRID_API_KEY.value();

    const fromEmail =
      OTP_FROM_EMAIL.value();

    const fromName =
      OTP_FROM_NAME.value();

    const templateId =
      LISTING_PUBLISHED_SENDGRID_TEMPLATE_ID
        .value();

    if (!apiKey) {
      throw new Error(
        'SENDGRID_API_KEY has not been configured.'
      );
    }

    if (!fromEmail) {
      throw new Error(
        'OTP_FROM_EMAIL has not been configured.'
      );
    }

    if (!templateId) {
      throw new Error(
        'LISTING_PUBLISHED_SENDGRID_TEMPLATE_ID has not been configured.'
      );
    }

    const siteOrigin =
      normalizeSiteOrigin(
        process.env['PUBLIC_SITE_ORIGIN'] ||
        process.env['NAVSTREET_APP_URL'] ||
        'https://navstreet.com'
      );

    const encodedListingUid =
      encodeURIComponent(
        data.listingUid
      );

    const listingUrl =
      `${siteOrigin}/listings/${encodedListingUid}`;

    const marketingToolkitUrl =
      `${siteOrigin}/sell/listings/` +
      `${encodedListingUid}/manage/marketing`;

    const listingManagementUrl =
      `${siteOrigin}/sell/listings/` +
      `${encodedListingUid}/manage`;

    const dashboardUrl =
      `${siteOrigin}/dashboard/listings`;

    sgMail.setApiKey(
      apiKey
    );

    await sgMail.send({
      to:
        sellerEmail,

      from: {
        email:
          fromEmail,

        name:
          fromName || 'NavStreet'
      },

      templateId,

      dynamicTemplateData: {
        subject:
          `Congratulations, ${sellerName} — your NavStreet listing is live!`,

        previewText:
          'Your property is now live on NavStreet. Review your listing and start promoting it with your Marketing Toolkit.',

        sellerName,

        propertyAddress:
          data.propertyAddress,

        primaryPhotoUrl:
          data.primaryPhotoUrl,

        listingUrl,

        marketingToolkitUrl,

        listingManagementUrl,

        dashboardUrl,

        currentYear:
          new Date().getFullYear()
      }
    });

    await deliveryReference.set(
      {
        listingUid:
          data.listingUid,

        sellerUid:
          data.sellerUid,

        sellerEmail,

        propertyAddress:
          data.propertyAddress,

        status:
          'sent',

        sentAt:
          FieldValue.serverTimestamp(),

        updatedAt:
          FieldValue.serverTimestamp(),

        leaseExpiresAt:
          FieldValue.delete(),

        lastError:
          FieldValue.delete()
      },
      {
        merge: true
      }
    );

    console.log(
      'Listing publication email sent.',
      {
        listingUid:
          data.listingUid,

        sellerUid:
          data.sellerUid,

        sellerEmail
      }
    );
  } catch (error: unknown) {
    await deliveryReference.set(
      {
        status:
          'failed',

        failedAt:
          FieldValue.serverTimestamp(),

        updatedAt:
          FieldValue.serverTimestamp(),

        leaseExpiresAt:
          FieldValue.delete(),

        lastError:
          error instanceof Error
            ? error.message
            : 'Unknown publication-email error.'
      },
      {
        merge: true
      }
    );

    throw error;
  }
}

async function claimDelivery(
  deliveryReference:
    FirebaseFirestore.DocumentReference,
  data: ListingPublicationEmailData
): Promise<boolean> {
  return adminFirestore.runTransaction(
    async transaction => {
      const deliverySnapshot =
        await transaction.get(
          deliveryReference
        );

      if (deliverySnapshot.exists) {
        const delivery =
          deliverySnapshot.data() as
            PublicationEmailDeliveryDocument;

        if (
          delivery.status ===
          'sent'
        ) {
          return false;
        }

        if (
          delivery.status ===
            'processing' &&
          delivery.leaseExpiresAt &&
          delivery.leaseExpiresAt.toMillis() >
            Date.now()
        ) {
          return false;
        }
      }

      transaction.set(
        deliveryReference,
        {
          listingUid:
            data.listingUid,

          sellerUid:
            data.sellerUid,

          propertyAddress:
            data.propertyAddress,

          status:
            'processing',

          leaseExpiresAt:
            Timestamp.fromMillis(
              Date.now() +
              DELIVERY_LEASE_MILLISECONDS
            ),

          attemptCount:
            FieldValue.increment(1),

          updatedAt:
            FieldValue.serverTimestamp(),

          createdAt:
            deliverySnapshot.exists
              ? deliverySnapshot.get(
                  'createdAt'
                ) ??
                FieldValue.serverTimestamp()
              : FieldValue.serverTimestamp()
        },
        {
          merge: true
        }
      );

      return true;
    }
  );
}

function normalizeSiteOrigin(
  value: string
): string {
  return value
    .trim()
    .replace(
      /\/+$/g,
      ''
    );
}