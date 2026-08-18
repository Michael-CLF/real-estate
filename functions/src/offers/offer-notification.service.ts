import {
  FieldValue,
  Firestore,
  Transaction,
  getFirestore
} from 'firebase-admin/firestore';

export type OfferNotificationType =
  | 'offer_submitted'
  | 'offer_accepted'
  | 'offer_rejected'
  | 'offer_countered'
  | 'offer_withdrawn'
  | 'signature_requested'
  | 'buyer_signed'
  | 'seller_signed'
  | 'offer_fully_executed'
  | 'offer_expired';

export type OfferNotificationChannel =
  | 'in_app'
  | 'email';

export interface CreateOfferNotificationInput {
  recipientUid: string;
  actorUid?: string | null;

  offerUid: string;
  offerVersionUid: string;
  listingUid?: string | null;

  type: OfferNotificationType;

  title: string;
  message: string;

  propertyAddress?: string | null;

  channels?: OfferNotificationChannel[];

  /*
   * Supply a stable event key when the operation may be
   * retried. This prevents duplicate notifications.
   *
   * Example:
   * seller-accepted-offer-version-123
   */
  eventKey?: string | null;

  metadata?: Record<
    string,
    string | number | boolean | null
  >;
}

export interface OfferNotificationRecord {
  Uid: string;

  recipientUid: string;
  actorUid: string | null;

  offerUid: string;
  offerVersionUid: string;
  listingUid: string | null;

  type: OfferNotificationType;

  title: string;
  message: string;

  propertyAddress: string | null;

  channels: OfferNotificationChannel[];

  read: boolean;
  readAt: null;

  emailStatus:
    | 'not_requested'
    | 'pending';

  eventKey: string | null;

  metadata: Record<
    string,
    string | number | boolean | null
  >;

  createdAt: FieldValue;
  updatedAt: FieldValue;
}

/*
 * Creates a notification immediately.
 *
 * Use this function when the notification is not being
 * created inside another Firestore transaction.
 */
export async function createOfferNotification(
  input: CreateOfferNotificationInput
): Promise<string> {
  const firestore = getFirestore();

  const notificationUid =
    createNotificationUid(
      firestore,
      input
    );

  const notificationReference =
    firestore
      .collection('notifications')
      .doc(notificationUid);

  const notification =
    buildNotificationRecord(
      notificationUid,
      input
    );

  /*
   * merge: true makes notification creation idempotent
   * when a stable eventKey was supplied.
   */
  await notificationReference.set(
    notification,
    {
      merge: true
    }
  );

  return notificationUid;
}

/*
 * Adds a notification to an existing Firestore transaction.
 *
 * This should be used by offer submission, counteroffer,
 * acceptance, rejection and signature transactions so the
 * offer change and its notification are committed together.
 */
export function addOfferNotificationToTransaction(
  transaction: Transaction,
  firestore: Firestore,
  input: CreateOfferNotificationInput
): string {
  const notificationUid =
    createNotificationUid(
      firestore,
      input
    );

  const notificationReference =
    firestore
      .collection('notifications')
      .doc(notificationUid);

  const notification =
    buildNotificationRecord(
      notificationUid,
      input
    );

  transaction.set(
    notificationReference,
    notification,
    {
      merge: true
    }
  );

  return notificationUid;
}

function buildNotificationRecord(
  notificationUid: string,
  input: CreateOfferNotificationInput
): OfferNotificationRecord {
  const recipientUid =
    requireNonEmptyString(
      input.recipientUid,
      'recipientUid'
    );

  const offerUid =
    requireNonEmptyString(
      input.offerUid,
      'offerUid'
    );

  const offerVersionUid =
    requireNonEmptyString(
      input.offerVersionUid,
      'offerVersionUid'
    );

  const title =
    requireNonEmptyString(
      input.title,
      'title'
    );

  const message =
    requireNonEmptyString(
      input.message,
      'message'
    );

  const channels =
    normalizeChannels(
      input.channels
    );

  return {
    Uid: notificationUid,

    recipientUid,

    actorUid:
      normalizeOptionalString(
        input.actorUid
      ),

    offerUid,
    offerVersionUid,

    listingUid:
      normalizeOptionalString(
        input.listingUid
      ),

    type:
      validateNotificationType(
        input.type
      ),

    title,
    message,

    propertyAddress:
      normalizeOptionalString(
        input.propertyAddress
      ),

    channels,

    read: false,
    readAt: null,

    emailStatus:
      channels.includes('email')
        ? 'pending'
        : 'not_requested',

    eventKey:
      normalizeOptionalString(
        input.eventKey
      ),

    metadata:
      normalizeMetadata(
        input.metadata
      ),

    createdAt:
      FieldValue.serverTimestamp(),

    updatedAt:
      FieldValue.serverTimestamp()
  };
}

function createNotificationUid(
  firestore: Firestore,
  input: CreateOfferNotificationInput
): string {
  const eventKey =
    normalizeOptionalString(
      input.eventKey
    );

  if (!eventKey) {
    return firestore
      .collection('notifications')
      .doc()
      .id;
  }

  /*
   * A deterministic ID prevents duplicate notifications
   * if Firebase retries a function or the browser repeats
   * the same request.
   */
  return [
    input.recipientUid,
    input.offerUid,
    input.offerVersionUid,
    input.type,
    eventKey
  ]
    .map(toSafeDocumentIdSegment)
    .join('_')
    .slice(0, 1400);
}

function normalizeChannels(
  channels:
    OfferNotificationChannel[] |
    undefined
): OfferNotificationChannel[] {
  if (!channels?.length) {
    return [
      'in_app'
    ];
  }

  const uniqueChannels =
    Array.from(
      new Set(channels)
    );

  for (
    const channel of uniqueChannels
  ) {
    if (
      channel !== 'in_app' &&
      channel !== 'email'
    ) {
      throw new Error(
        `Unsupported notification channel: ${channel}`
      );
    }
  }

  return uniqueChannels;
}

function validateNotificationType(
  type: OfferNotificationType
): OfferNotificationType {
  const supportedTypes:
    OfferNotificationType[] = [
      'offer_submitted',
      'offer_accepted',
      'offer_rejected',
      'offer_countered',
      'offer_withdrawn',
      'signature_requested',
      'buyer_signed',
      'seller_signed',
      'offer_fully_executed',
      'offer_expired'
    ];

  if (!supportedTypes.includes(type)) {
    throw new Error(
      `Unsupported offer notification type: ${type}`
    );
  }

  return type;
}

function normalizeMetadata(
  metadata:
    CreateOfferNotificationInput['metadata']
): Record<
  string,
  string | number | boolean | null
> {
  if (!metadata) {
    return {};
  }

  const normalized:
    Record<
      string,
      string | number | boolean | null
    > = {};

  for (
    const [
      key,
      value
    ] of Object.entries(metadata)
  ) {
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null
    ) {
      normalized[key] = value;
    }
  }

  return normalized;
}

function normalizeOptionalString(
  value:
    string |
    null |
    undefined
): string | null {
  if (
    typeof value !== 'string'
  ) {
    return null;
  }

  const normalized =
    value.trim();

  return normalized.length > 0
    ? normalized
    : null;
}

function requireNonEmptyString(
  value: unknown,
  fieldName: string
): string {
  if (
    typeof value !== 'string' ||
    value.trim().length === 0
  ) {
    throw new Error(
      `${fieldName} is required to create an offer notification.`
    );
  }

  return value.trim();
}

function toSafeDocumentIdSegment(
  value: unknown
): string {
  const normalized =
    typeof value === 'string'
      ? value.trim()
      : String(value ?? '');

  return normalized
    .replace(
      /[^a-zA-Z0-9_-]/g,
      '-'
    )
    .replace(
      /-+/g,
      '-'
    )
    .replace(
      /^[-_]+|[-_]+$/g,
      ''
    ) || 'unknown';
}