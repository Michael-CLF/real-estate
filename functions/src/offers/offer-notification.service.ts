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
  | 'offer_closed_due_to_contract'
  | 'offer_expired'
  | 'property_marked_sold';

export type OfferNotificationChannel =
  | 'in_app'
  | 'email';

export type OfferNotificationEmailStatus =
  | 'not_requested'
  | 'pending'
  | 'processing'
  | 'sent'
  | 'failed';

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
    OfferNotificationEmailStatus;
  emailAttemptCount: number;
  emailProcessingStartedAt: null;
  emailSentAt: null;
  emailLastError: null;
  eventKey: string | null;
  metadata: Record<
    string,
    string | number | boolean | null
  >;
  createdAt: FieldValue;
  updatedAt: FieldValue;
}

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

  await notificationReference.set(
    notification,
    {
      merge: true
    }
  );

  return notificationUid;
}

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

export function createOfferNotificationUid(
  firestore: Firestore,
  input: Pick<
    CreateOfferNotificationInput,
    | 'recipientUid'
    | 'offerUid'
    | 'offerVersionUid'
    | 'type'
    | 'eventKey'
  >
): string {
  return createNotificationUid(
    firestore,
    input
  );
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
    emailAttemptCount: 0,
    emailProcessingStartedAt: null,
    emailSentAt: null,
    emailLastError: null,
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
  input: Pick<
    CreateOfferNotificationInput,
    | 'recipientUid'
    | 'offerUid'
    | 'offerVersionUid'
    | 'type'
    | 'eventKey'
  >
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
      'offer_closed_due_to_contract',
      'offer_expired',
      'property_marked_sold'
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
