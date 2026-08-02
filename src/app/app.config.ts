import {
  ApplicationConfig,
  provideZoneChangeDetection
} from '@angular/core';

import {
  provideHttpClient
} from '@angular/common/http';

import {
  provideRouter
} from '@angular/router';

import { routes } from './app.routes';

import {
  CORE_PROVIDERS
} from './core/core.providers';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({
      eventCoalescing: true
    }),

    provideHttpClient(),

    provideRouter(routes),

    ...CORE_PROVIDERS
  ]
};