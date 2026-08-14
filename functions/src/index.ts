import { setGlobalOptions } from 'firebase-functions/v2';

import {
  globalFunctionOptions,
} from './shared/function-options';

setGlobalOptions(globalFunctionOptions);

export * from './authentication/otp';
export * from './identity';
export * from './listings';
export * from './payments';
export * from './sellers';
export * from './showings';