import { Routes } from '@angular/router';

import {
  PublicLayoutComponent
} from './layout/layouts/public-layout/public-layout.component';

import {
  authGuard
} from './core/authentication/guards/auth.guard';

import {
  accountGuard
} from './core/authentication/guards/account.guard';

import {
  guestGuard
} from './core/authentication/guards/guest.guard';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/home/home.component').then(
            component => component.HomeComponent
          )
      },

      {
        path: 'about',
        loadComponent: () =>
          import('./features/about/about.component').then(
            component => component.AboutComponent
          )
      },

      {
        path: 'buy',
        loadComponent: () =>
          import('./features/buy/buy.component').then(
            component => component.BuyComponent
          )
      },

      {
        path: 'contact',
        loadComponent: () =>
          import('./features/contact/contact.component').then(
            component => component.ContactComponent
          )
      },

      {
        path: 'mortgage',
        loadComponent: () =>
          import('./features/mortgage/mortgage.component').then(
            component => component.MortgageComponent
          )
      },

      {
        path: 'resources',
        loadComponent: () =>
          import('./features/resources/resources.component').then(
            component => component.ResourcesComponent
          )
      },

      /*
       * Account Dashboard
       *
       * The user must have both:
       * 1. A valid Firebase authentication session.
       * 2. An active NavStreet user profile.
       *
       * Because this route is inside PublicLayoutComponent,
       * the dashboard receives the standard NavStreet
       * header and footer.
       */
      {
        path: 'dashboard',
        canActivate: [
          authGuard,
          accountGuard
        ],
        loadComponent: () =>
          import(
            './features/dashboard/dashboard.component'
          ).then(
            component => component.DashboardComponent
          )
      },

      /*
       * My Listings
       *
       * This is authenticated NavStreet account functionality.
       */
      {
        path: 'sell',
        canActivate: [
          authGuard,
          accountGuard
        ],
        loadComponent: () =>
          import('./features/sell/sell.component').then(
            component => component.SellComponent
          )
      },

      /*
       * Create Listing
       *
       * A valid NavStreet account is required before
       * a listing can be created.
       */
      {
        path: 'sell/new',
        canActivate: [
          authGuard,
          accountGuard
        ],
        loadComponent: () =>
          import(
            './features/sell/listing-wizard/listing-wizard.component'
          ).then(
            component => component.ListingWizardComponent
          )
      },
      {
        path: 'sell/listings/:listingUid/edit',
        canActivate: [
          authGuard,
          accountGuard
        ],
        loadComponent: () =>
          import(
            './features/sell/listing-wizard/listing-wizard.component'
          ).then(
            component => component.ListingWizardComponent
          )
      },

      /*
       * Registration / account completion.
       */
      {
        path: 'register',
        canActivate: [
          guestGuard
        ],
        loadComponent: () =>
          import(
            './features/authentication/pages/register/register.component'
          ).then(
            component => component.RegisterComponent
          )
      },

      /*
       * Sign-in.
       */
      {
        path: 'sign-in',
        canActivate: [
          guestGuard
        ],
        loadComponent: () =>
          import(
            './features/authentication/pages/sign-in/sign-in.component'
          ).then(
            component => component.SignInComponent
          )
      },

      /*
       * Marketplace browsing remains public.
       */
      {
        path: 'homes',
        loadChildren: () =>
          import(
            './features/marketplace/marketplace.routes'
          ).then(
            routes => routes.MARKETPLACE_ROUTES
          )
      },

      {
        path: 'listings/:listingId',
        loadComponent: () =>
          import(
            './features/marketplace/listings/pages/listing-details/listing-details.component'
          ).then(
            component => component.ListingDetailsComponent
          )
      },

      {
        path: 'states/:stateSlug',
        loadComponent: () =>
          import(
            './features/states/state-page/state-page.component'
          ).then(
            component => component.StatePageComponent
          )
      }
    ]
  },

  {
    path: '**',
    redirectTo: ''
  }
];