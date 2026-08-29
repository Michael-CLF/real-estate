import {
  Routes
} from '@angular/router';

import {
  PublicLayoutComponent
} from '../layout/layouts/public-layout/public-layout.component';

import {
  authGuard
} from '../core/authentication/guards/auth.guard';

import {
  accountGuard
} from '../core/authentication/guards/account.guard';

import {
  guestGuard
} from '../core/authentication/guards/guest.guard';

export const PUBLIC_SITE_ROUTES:
  Routes = [
    {
      path: '',

      component:
        PublicLayoutComponent,

      children: [
        /*
         * Homepage
         */
        {
          path: '',
          pathMatch: 'full',

          loadComponent: () =>
            import(
              '../features/home/home.component'
            ).then(
              component =>
                component.HomeComponent
            )
        },

        /*
         * Public product tour
         */
        {
          path:
            'how-navstreet-works',

          loadComponent: () =>
            import(
              '../features/how-navstreet-works/how-navstreet-works.component'
            ).then(
              component =>
                component
                  .HowNavStreetWorksComponent
            )
        },

        /*
         * Professional profile setup
         */
        {
          path:
            'professionals/:stateSlug/profile/setup',

          loadComponent: () =>
            import(
              '../features/professionals/pages/professional-profile-setup/professional-profile-setup.component'
            ).then(
              component =>
                component
                  .ProfessionalProfileSetupComponent
            )
        },

        /*
         * Legal pages
         */
        {
          path: 'terms',

          loadComponent: () =>
            import(
              '../features/legal/terms-of-service/terms-of-service.component'
            ).then(
              component =>
                component
                  .TermsOfServiceComponent
            )
        },

        {
          path: 'privacy',

          loadComponent: () =>
            import(
              '../features/legal/privacy-policy/privacy-policy.component'
            ).then(
              component =>
                component
                  .PrivacyPolicyComponent
            )
        },

        {
          path: 'faq',

          loadComponent: () =>
            import(
              '../features/faq/faq.component'
            ).then(
              component =>
                component.FaqComponent
            )
        },

        /*
         * Professional registration remains public
         * because email verification occurs during
         * registration.
         */
        {
          path:
            'professionals/register/:stateSlug',

          loadComponent: () =>
            import(
              '../features/professionals/pages/professional-registration/professional-registration.component'
            ).then(
              component =>
                component
                  .ProfessionalRegistrationComponent
            )
        },

        /*
         * Preserve the previous professionals URL.
         */
        {
          path: 'professionals',

          redirectTo:
            'find-a-pro/north-carolina',

          pathMatch: 'full'
        },

        /*
         * Authenticated professional directory
         */
        {
          path: 'find-a-pro',

          canActivate: [
            authGuard,
            accountGuard
          ],

          children: [
            {
              path: '',

              redirectTo:
                'north-carolina',

              pathMatch: 'full'
            },

            {
              path:
                ':stateSlug/:professionalSlug',

              loadComponent: () =>
                import(
                  '../features/professionals/pages/professional-profile/professional-profile.component'
                ).then(
                  component =>
                    component
                      .ProfessionalProfileComponent
                )
            },

            {
              path: ':stateSlug',

              loadComponent: () =>
                import(
                  '../features/professionals/professionals.component'
                ).then(
                  component =>
                    component
                      .ProfessionalsComponent
                )
            }
          ]
        },

        /*
         * Contact
         */
        {
          path: 'contact',

          loadComponent: () =>
            import(
              '../features/contact/contact.component'
            ).then(
              component =>
                component.ContactComponent
            )
        },

        /*
         * Legacy navigation redirects
         */
        {
          path: 'buy',
          redirectTo: 'homes',
          pathMatch: 'full'
        },

        {
          path: 'about',
          redirectTo: 'faq',
          pathMatch: 'full'
        },

        {
          path: 'mortgage',
          redirectTo: 'calculators',
          pathMatch: 'full'
        },

        /*
         * Authentication
         */
        {
          path: 'register',

          canActivate: [
            guestGuard
          ],

          loadComponent: () =>
            import(
              '../features/authentication/pages/register/register.component'
            ).then(
              component =>
                component.RegisterComponent
            )
        },

        {
          path: 'sign-in',

          canActivate: [
            guestGuard
          ],

          loadComponent: () =>
            import(
              '../features/authentication/pages/sign-in/sign-in.component'
            ).then(
              component =>
                component.SignInComponent
            )
        },

        /*
         * Marketplace search
         *
         * This existing route file remains independently
         * lazy-loaded.
         */
        {
          path: 'homes',

          loadChildren: () =>
            import(
              '../features/marketplace/marketplace.routes'
            ).then(
              routes =>
                routes.MARKETPLACE_ROUTES
            )
        },

        /*
         * Shareable listing link
         */
        {
          path: 'h/:shareCode',

          loadComponent: () =>
            import(
              '../features/marketplace/listing-marketing-link-redirect/listing-marketing-link-redirect.component'
            ).then(
              component =>
                component
                  .ListingMarketingLinkRedirectComponent
            )
        },

        /*
         * Public listing details
         */
        {
          path:
            'listings/:listingId',

          loadComponent: () =>
            import(
              '../features/marketplace/listings/pages/listing-details/listing-details.component'
            ).then(
              component =>
                component
                  .ListingDetailsComponent
            )
        },

        /*
         * Create or resume an offer
         */
        {
          path:
            'listings/:listingUid/offer',

          canActivate: [
            authGuard,
            accountGuard
          ],

          loadComponent: () =>
            import(
              '../features/offers/offer-wizard/offer-wizard.component'
            ).then(
              component =>
                component
                  .OfferWizardComponent
            )
        },

        /*
         * State marketplace page
         */
        {
          path:
            'states/:stateSlug',

          loadComponent: () =>
            import(
              '../features/states/state-page/state-page.component'
            ).then(
              component =>
                component.StatePageComponent
            )
        },

        /*
         * Preserve the earlier professional profile URL.
         */
        {
          path:
            'professionals/:stateSlug/:professionalSlug',

          redirectTo:
            'find-a-pro/:stateSlug/:professionalSlug',

          pathMatch: 'full'
        }
      ]
    }
  ];