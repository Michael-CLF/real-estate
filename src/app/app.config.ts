import {
  ApplicationConfig,
  provideZoneChangeDetection
} from '@angular/core';

import { LocationStrategy } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';

import {
  provideRouter,
  withInMemoryScrolling
} from '@angular/router';

import { routes } from './app.routes';

import {
  PublicUrlLocationStrategy
} from './core/seo/public-url-location.strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({
      eventCoalescing: true
    }),

    provideHttpClient(),
    provideClientHydration(),

    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled'
      })
    ),

    {
      provide: LocationStrategy,
      useClass: PublicUrlLocationStrategy
    }
  ]
};