import {
  setGlobalOptions
} from 'firebase-functions/v2';

import {
  globalFunctionOptions
} from './shared/function-options';

setGlobalOptions(
  globalFunctionOptions
);

export * from './authentication/otp';

export * from './identity';

export * from './listings';

export * from './payments';

export * from './sellers';

export * from './showings';

export * from './users';

export * from './inquiries';

export {
  createOfferDraft
} from './offers/create-offer-draft';

export {
  saveOfferDraft
} from './offers/save-offer-draft';

export {
  respondToOffer
} from './offers/respond-to-offer';

export {
  withdrawOffer
} from './offers/withdraw-offer';