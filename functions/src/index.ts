import { setGlobalOptions } from 'firebase-functions/v2';

import {
  globalFunctionOptions,
} from './shared/function-options';

setGlobalOptions(globalFunctionOptions);

export * from './authentication';
export * from './identity';
export * from './listings';
export * from './payments';
export * from './sellers';