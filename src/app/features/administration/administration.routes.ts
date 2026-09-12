import {
  Routes
} from '@angular/router';

import {
  authGuard
} from '../../core/authentication/guards/auth.guard';

import {
  accountGuard
} from '../../core/authentication/guards/account.guard';

import {
  adminGuard
} from '../../core/authentication/guards/admin.guard';

import {
  AdministrationLayoutComponent
} from './layout/administration-layout/administration-layout.component';

export const ADMINISTRATION_ROUTES:
  Routes = [
    {
      path: '',

      component:
        AdministrationLayoutComponent,

      canActivate: [
        authGuard,
        accountGuard,
        adminGuard
      ],

      children: [
        /*
         * Overview
         */
        {
          path: '',

          pathMatch: 'full',

          loadComponent: () =>
            import(
              './pages/administration-overview/administration-overview.component'
            ).then(
              component =>
                component
                  .AdministrationOverviewComponent
            )
        },

        /*
         * Users
         */
        {
          path: 'users',

          loadComponent: () =>
            import(
              './pages/users/users.component'
            ).then(
              component =>
                component.UsersComponent
            )
        },

        /*
         * Listings
         */
        {
          path: 'listings',

          loadComponent: () =>
            import(
              './pages/listings/listings.component'
            ).then(
              component =>
                component.ListingsComponent
            )
        },
        {
          path:
            'listings/:recordType/:listingUid',

          loadComponent: () =>
            import(
              './pages/listing-details/listing-details.component'
            ).then(
              component =>
                component.ListingDetailsComponent
            )
        },

        /*
         * Businesses
         */
        {
          path: 'businesses',

          loadComponent: () =>
            import(
              './pages/businesses/businesses.component'
            ).then(
              component =>
                component.BusinessesComponent
            )
        },

        /*
         * Payments
         */
        {
          path: 'payments',

          loadComponent: () =>
            import(
              './pages/payments/payments.component'
            ).then(
              component =>
                component.PaymentsComponent
            )
        },

        /*
         * Subscriptions
         */
        {
          path: 'subscriptions',

          loadComponent: () =>
            import(
              './pages/subscriptions/subscriptions.component'
            ).then(
              component =>
                component.SubscriptionsComponent
            )
        },

        /*
         * Activity
         */
        {
          path: 'activity',

          data: {
            title:
              'Activity',

            description:
              'Review important NavStreet platform and administrator activity.',

            icon:
              'clock-rotate-left'
          },

          loadComponent: () =>
            import(
              './pages/administration-placeholder/administration-placeholder.component'
            ).then(
              component =>
                component
                  .AdministrationPlaceholderComponent
            )
        },

        /*
         * Promotion Codes
         */
        {
          path: 'promotion-codes',

          loadComponent: () =>
            import(
              './pages/promotion-codes/promotion-codes.component'
            ).then(
              component =>
                component.PromotionCodesComponent
            )
        },

        /*
         * Settings
         */
        {
          path: 'settings',

          data: {
            title:
              'Settings',

            description:
              'Manage NavStreet administration and platform configuration.',

            icon:
              'gear'
          },

          loadComponent: () =>
            import(
              './pages/administration-placeholder/administration-placeholder.component'
            ).then(
              component =>
                component
                  .AdministrationPlaceholderComponent
            )
        },

        /*
         * Unknown administration URL
         */
        {
          path: '**',
          redirectTo: ''
        }
      ]
    }
  ];