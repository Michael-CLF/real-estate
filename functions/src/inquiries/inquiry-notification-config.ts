import {
  defineString,
} from 'firebase-functions/params';

/**
 * SendGrid Dynamic Template used to notify a seller
 * when a buyer submits a listing inquiry.
 */
export const LISTING_INQUIRY_SENDGRID_TEMPLATE_ID =
  defineString(
    'LISTING_INQUIRY_SENDGRID_TEMPLATE_ID',
  );