import {
  defineString,
} from 'firebase-functions/params';

/**
 * SendGrid Dynamic Template used to notify a seller
 * when a buyer submits a showing request.
 */
export const SHOWING_REQUEST_SENDGRID_TEMPLATE_ID =
  defineString(
    'SHOWING_REQUEST_SENDGRID_TEMPLATE_ID',
  );

/**
 * Public NavStreet application URL used to build links
 * back to the seller dashboard.
 *
 * This may be overridden in the Functions environment
 * without changing application code.
 */
export const NAVSTREET_APP_URL =
  defineString(
    'NAVSTREET_APP_URL',
    {
      default:
        'https://navstreet.com',
    },
  );