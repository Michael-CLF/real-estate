import type {
  GlobalOptions,
} from 'firebase-functions/v2/options';

import type {
  CallableOptions,
} from 'firebase-functions/v2/https';

export const FUNCTION_REGION = 'us-east1';

export const globalFunctionOptions: GlobalOptions = {
  region: FUNCTION_REGION,
  maxInstances: 10,
};

export const callableFunctionOptions: CallableOptions = {
  region: FUNCTION_REGION,
  enforceAppCheck: false,
  maxInstances: 10,
  timeoutSeconds: 60,
  memory: '256MiB',
};