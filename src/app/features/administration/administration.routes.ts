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
        {
          path: '',

          loadComponent: () =>
            import(
              './pages/administration-overview/administration-overview.component'
            ).then(
              component =>
                component
                  .AdministrationOverviewComponent
            )
        },

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
          path: 'businesses',

          loadComponent: () =>
            import(
              './pages/businesses/businesses.component'
            ).then(
              component =>
                component.BusinessesComponent
            )
        },

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

        {
          path: 'subscriptions',

          loadComponent: () =>
            import(
              './pages/subscriptions/subscriptions.component'
            ).then(
              component =>
                component
                  .SubscriptionsComponent
            )
        },

        {
          path: 'activity',

          data: {
            title: 'Activity',

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

        {
          path: 'promotion-codes',

          loadComponent: () =>
            import(
              './pages/promotion-codes/promotion-codes.component'
            ).then(
              component =>
                component
                  .PromotionCodesComponent
            )
        },

        {
          path: 'settings',

          data: {
            title: 'Settings',

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

        {
          path: '**',
          redirectTo: ''
        }
      ]
    }
  ];