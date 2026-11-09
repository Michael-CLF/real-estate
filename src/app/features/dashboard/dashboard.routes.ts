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
  DashboardLayoutComponent
} from './layout/dashboard-layout/dashboard-layout.component';

import { DashboardStateService } from './services/dashboard-state.service';

import { ListingService } from '../../core/domains/listings/services/listing.service';
import { ListingRepository } from '../../core/domains/listings/repositories/listing.repository';
import { FirebaseListingRepository } from '../../core/infrastructure/firebase/listings/firebase-listing.repository';
import { ShowingService } from '../../core/domains/showings/services/showing.service';
import { ShowingRepository } from '../../core/domains/showings/repositories/showing.repository';
import { FirebaseShowingRepository } from '../../core/infrastructure/firebase/showings/firebase-showing.repository';
import { DashboardService } from './services/dashboard.service';

export const DASHBOARD_ROUTES:
  Routes = [
    {
      path: '',



      providers: [
        FirebaseListingRepository,
        {
          provide: ListingRepository,
          useExisting: FirebaseListingRepository
        },
        FirebaseShowingRepository,
        {
          provide: ShowingRepository,
          useExisting: FirebaseShowingRepository
        },
        ListingService,
        ShowingService,
        DashboardService,
        DashboardStateService
      ],



      component:
        DashboardLayoutComponent,

      canActivate: [
        authGuard,
        accountGuard
      ],

      children: [
        /*
         * Dashboard overview
         */
        {
          path: '',

          pathMatch: 'full',

          loadComponent: () =>
            import(
              './dashboard.component'
            ).then(
              component =>
                component.DashboardComponent
            )
        },

        /*
         * Listings
         */
        {
          path: 'listings',

          loadComponent: () =>
            import(
              './pages/dashboard-listings/dashboard-listings.component'
            ).then(
              component =>
                component
                  .DashboardListingsComponent
            )
        },

        /*
         * Saved properties
         */
        {
          path: 'saved-properties',

          loadComponent: () =>
            import(
              './pages/dashboard-saved-properties/dashboard-saved-properties.component'
            ).then(
              component =>
                component
                  .DashboardSavedPropertiesComponent
            )
        },

        /*
         * Inquiries
         */
        {
          path: 'inquiries',

          loadComponent: () =>
            import(
              './pages/dashboard-inquiries/dashboard-inquiries.component'
            ).then(
              component =>
                component
                  .DashboardInquiriesComponent
            )
        },

        /*
         * Activity
         */
        {
          path: 'activity',

          loadComponent: () =>
            import(
              './pages/dashboard-activity/dashboard-activity.component'
            ).then(
              component =>
                component
                  .DashboardActivityComponent
            )
        },

        /*
         * Offers
         */
        {
          path: 'offers',

          loadComponent: () =>
            import(
              './pages/dashboard-offers/dashboard-offers.component'
            ).then(
              component =>
                component
                  .DashboardOffersComponent
            )
        },

        /*
         * Showing requests
         */
        {
          path: 'showings',

          loadComponent: () =>
            import(
              './showings/my-showing-requests/my-showing-requests.component'
            ).then(
              component =>
                component
                  .MyShowingRequestsComponent
            )
        },

        /*
         * Professional business
         */
        {
          path: 'business',

          loadComponent: () =>
            import(
              './pages/dashboard-business/dashboard-business.component'
            ).then(
              component =>
                component
                  .DashboardBusinessComponent
            )
        },

        /*
         * Account
         */
        {
          path: 'account',

          loadComponent: () =>
            import(
              './pages/dashboard-account/dashboard-account.component'
            ).then(
              component =>
                component
                  .DashboardAccountComponent
            )
        },

        /*
         * Unknown dashboard URL
         */
        {
          path: '**',
          redirectTo: ''
        }
      ]
    }
  ];