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

      /*
       * Resume/Edit Draft
       */
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
       * Published Listing Management
       */
      {
        path: 'sell/listings/:listingUid/manage',
        canActivate: [
          authGuard,
          accountGuard
        ],
        loadComponent: () =>
          import(
            './features/dashboard/listing-management/listing-management.component'
          ).then(
            component => component.ListingManagementComponent
          )
      },

      /*
       * Listing Enhancement Hub
       */
      {
        path: 'sell/listings/:listingUid/enhancements',
        canActivate: [
          authGuard,
          accountGuard
        ],
        loadComponent: () =>
          import(
            './features/dashboard/listing-enhancement/listing-enhancement/listing-enhancement.component'
          ).then(
            component => component.ListingEnhancementComponent
          )
      },

      /*
       * Individual Enhancement Sections
       */
      {
        path: 'sell/listings/:listingUid/enhancements/construction',
        canActivate: [
          authGuard,
          accountGuard
        ],
        loadComponent: () =>
          import(
            './features/dashboard/listing-enhancement/construction-enhancement/construction-enhancement.component'
          ).then(
            component => component.ConstructionEnhancementComponent
          )
      },
      {
        path: 'sell/listings/:listingUid/enhancements/interior',
        canActivate: [
          authGuard,
          accountGuard
        ],
        loadComponent: () =>
          import(
            './features/dashboard/listing-enhancement/interior-enhancement/interior-enhancement.component'
          ).then(
            component => component.LivingSpacesEnhancementComponent
          )
      },
      {
        path: 'sell/listings/:listingUid/enhancements/kitchen',
        canActivate: [
          authGuard,
          accountGuard
        ],
        loadComponent: () =>
          import(
            './features/dashboard/listing-enhancement/kitchen-enhancement/kitchen-enhancement.component'
          ).then(
            component => component.KitchenEnhancementComponent
          )
      },
      {
        path: 'sell/listings/:listingUid/enhancements/bedrooms-bathrooms',
        canActivate: [
          authGuard,
          accountGuard
        ],
        loadComponent: () =>
          import(
            './features/dashboard/listing-enhancement/bedrooms-bathrooms-enhancement/bedrooms-bathrooms-enhancement.component'
          ).then(
            component => component.BedroomsBathroomsEnhancementComponent
          )
      },
      {
        path: 'sell/listings/:listingUid/enhancements/parking-storage',
        canActivate: [
          authGuard,
          accountGuard
        ],
        loadComponent: () =>
          import(
            './features/dashboard/listing-enhancement/parking-storage-enhancement/parking-storage-enhancement.component'
          ).then(
            component => component.ParkingStorageEnhancementComponent
          )
      },
      {
        path: 'sell/listings/:listingUid/enhancements/outdoor-living',
        canActivate: [
          authGuard,
          accountGuard
        ],
        loadComponent: () =>
          import(
            './features/dashboard/listing-enhancement/outdoor-living-enhancement/outdoor-living-enhancement.component'
          ).then(
            component => component.OutdoorLivingEnhancementComponent
          )
      },
      {
        path: 'sell/listings/:listingUid/enhancements/systems-utilities',
        canActivate: [
          authGuard,
          accountGuard
        ],
        loadComponent: () =>
          import(
            './features/dashboard/listing-enhancement/systems-utilities-enhancement/systems-utilities-enhancement.component'
          ).then(
            component => component.SystemUtilitiesEnhancementComponent
          )
      },
      {
        path: 'sell/listings/:listingUid/enhancements/technology-security',
        canActivate: [
          authGuard,
          accountGuard
        ],
        loadComponent: () =>
          import(
            './features/dashboard/listing-enhancement/technology-security-enhancement/technology-security-enhancement.component'
          ).then(
            component => component.TechnologySecurityEnhancementComponent
          )
      },
      {
        path: 'sell/listings/:listingUid/enhancements/accessibility',
        canActivate: [
          authGuard,
          accountGuard
        ],
        loadComponent: () =>
          import(
            './features/dashboard/listing-enhancement/accessibility-enhancement/accessibility-enhancement.component'
          ).then(
            component => component.AccessibilityEnhancementComponent
          )
      },
      {
        path: 'sell/listings/:listingUid/enhancements/community-amenities',
        canActivate: [
          authGuard,
          accountGuard
        ],
        loadComponent: () =>
          import(
            './features/dashboard/listing-enhancement/community-amenities-enhancement/community-amenities-enhancement.component'
          ).then(
            component => component.CommunityAmenitiesEnhancementComponent
          )
      },
      {
        path: 'sell/listings/:listingUid/enhancements/schools',
        canActivate: [
          authGuard,
          accountGuard
        ],
        loadComponent: () =>
          import(
            './features/dashboard/listing-enhancement/schools-enhancement/schools-enhancement.component'
          ).then(
            component => component.SchoolsEnhancementComponent
          )
      },

      /*
       * Registration
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
       * Sign In
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
       * Marketplace
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
    path: 'sell/listings/:listingUid/verification-return',
    loadComponent: () =>
      import(
        './features/sell/verification-return/verification-return.component'
      ).then(
        component => component.VerificationReturnComponent
      )
  },
  {
    path: 'sell/listings/:listingUid/payment',
    loadComponent: () =>
      import(
        './features/sell/payment/payment.component'
      ).then(
        component => component.PaymentComponent
      )
  },
  {
    path: 'sell/listings/:listingUid/payment-return',
    loadComponent: () =>
      import(
        './features/sell/payment-return/payment-return.component'
      ).then(
        component => component.PaymentReturnComponent
      )
  },
  {
    path: '**',
    redirectTo: ''
  }
];