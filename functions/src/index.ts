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
export * from './assistant';
export * from './identity';
export * from './listings';
export * from './payments';
export * from './sellers';
export * from './showings';
export * from './transactions';
export * from './users';
export * from './inquiries';
export * from './contact';

export {
  createCounteroffer
} from './offers/create-counteroffer';

export {
  createOfferDraft
} from './offers/create-offer-draft';

export {
  expireOffers
} from './offers/expire-offers';

export {
  generateOfferDocument
} from './offers/generate-offer-document';

export {
  markContractsSold
} from './offers/mark-contracts-sold';

export {
  registerOfferAttachment
} from './offers/register-offer-attachment';

export {
  respondToOffer
} from './offers/respond-to-offer';

export {
  saveOfferDraft
} from './offers/save-offer-draft';

export {
  signOffer
} from './offers/sign-offer';

export {
  submitOffer
} from './offers/submit-offer';

export {
  withdrawOffer
} from './offers/withdraw-offer';
