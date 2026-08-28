import {
  defineString
} from 'firebase-functions/params';

export const CONTACT_INQUIRY_TO_EMAIL =
  defineString(
    'CONTACT_INQUIRY_TO_EMAIL',
    {
      default:
        'legal@navstreet.com'
    }
  );