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

import {
  offerAccessGuard
} from '../core/domains/offers/guards/offer-access.guard';

import {
  offerIdentityGuard
} from '../core/domains/identity/guards/offer-identity.guard';

export const PUBLIC_ROUTES:
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
         * How NavStreet Works
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
 * Pricing
 */
        {
          path: 'pricing',

          loadComponent: () =>
            import(
              '../features/pricing/pricing.component'
            ).then(
              component =>
                component.PricingComponent
            )
        },

        /*
         * Education Center
         *
         * Account required.
         *
         * A signed-out visitor will be sent through
         * authGuard to sign-in with /education preserved
         * as the return URL.
         */
        {
          path: 'education',

          canActivate: [
            authGuard,
            accountGuard
          ],

          children: [
            /*
             * Education homepage
             */
            {
              path: '',

              pathMatch: 'full',

              loadComponent: () =>
                import(
                  '../features/education/pages/education-center/education-center.component'
                ).then(
                  component =>
                    component
                      .EducationCenterComponent
                )
            },

            /*
             * Article
             *
             * Keep this above :categorySlug.
             */
            {
              path:
                ':categorySlug/:articleSlug',

              loadComponent: () =>
                import(
                  '../features/education/pages/education-article/education-article.component'
                ).then(
                  component =>
                    component
                      .EducationArticleComponent
                )
            },

            /*
             * Category
             */
            {
              path:
                ':categorySlug',

              loadComponent: () =>
                import(
                  '../features/education/pages/education-center/education-center.component'
                ).then(
                  component =>
                    component
                      .EducationCenterComponent
                )
            }
          ]
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
         * Terms
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

        /*
         * Privacy
         */
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

        /*
         * FAQ
         */
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
         * Calculators
         *
         * Account required.
         */
        {
          path: 'calculators',

          children: [
            /*
             * Calculator center
             */
            {
              path: '',

              pathMatch: 'full',

              loadComponent: () =>
                import(
                  '../features/calculators/calculators.component'
                ).then(
                  component =>
                    component
                      .CalculatorsComponent
                )
            },

            /*
             * Mortgage payment
             */
            {
              path:
                'mortgage-payment',

              loadComponent: () =>
                import(
                  '../features/calculators/components/mortgage-payment-calculator/mortgage-payment-calculator.component'
                ).then(
                  component =>
                    component
                      .MortgagePaymentCalculatorComponent
                )
            },

            /*
             * Affordability
             */
            {
              path:
                'affordability',

              loadComponent: () =>
                import(
                  '../features/calculators/components/affordability-calculator/affordability-calculator.component'
                ).then(
                  component =>
                    component
                      .AffordabilityCalculatorComponent
                )
            },

            /*
             * Interest only
             */
            {
              path:
                'interest-only',

              loadComponent: () =>
                import(
                  '../features/calculators/components/interest-only-calculator/interest-only-calculator.component'
                ).then(
                  component =>
                    component
                      .InterestOnlyCalculatorComponent
                )
            },

            /*
             * Balloon payment
             */
            {
              path:
                'balloon-payment',

              loadComponent: () =>
                import(
                  '../features/calculators/components/balloon-payment-calculator/balloon-payment-calculator.component'
                ).then(
                  component =>
                    component
                      .BalloonPaymentCalculatorComponent
                )
            },

            /*
             * Loan to value
             */
            {
              path:
                'loan-to-value',

              loadComponent: () =>
                import(
                  '../features/calculators/components/loan-to-value-calculator/loan-to-value-calculator.component'
                ).then(
                  component =>
                    component
                      .LoanToValueCalculatorComponent
                )
            },

            /*
             * Extra payment
             */
            {
              path:
                'extra-payment',

              loadComponent: () =>
                import(
                  '../features/calculators/components/extra-payment-calculator/extra-payment-calculator.component'
                ).then(
                  component =>
                    component
                      .ExtraPaymentCalculatorComponent
                )
            }
          ]
        },

        /*
         * Professional registration
         *
         * Must remain public.
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
         * Legacy /professionals shortcut
         */
        {
          path: 'professionals',

          redirectTo:
            'find-a-pro/north-carolina',

          pathMatch: 'full'
        },

        /*
         * Find a Pro
         *
         * Account required.
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
              path:
                ':stateSlug',

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
         * Legacy route aliases
         */
        {
          path: 'buy',

          redirectTo:
            'homes',

          pathMatch: 'full'
        },

        {
          path: 'about',

          redirectTo:
            'faq',

          pathMatch: 'full'
        },

        {
          path: 'mortgage',

          redirectTo:
            'calculators',

          pathMatch: 'full'
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
              '../features/authentication/pages/register/register.component'
            ).then(
              component =>
                component.RegisterComponent
            )
        },

        /*
         * Sign in
         */
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
         * Marketplace
         *
         * KEEP your existing marketplace.routes.ts.
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
         * Marketing share link
         */
        {
          path:
            'h/:shareCode',

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
         * Public listing
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
         * Return from Stripe Identity.
         *
         * This route must remain outside offerIdentityGuard so it can
         * check Stripe's result before reopening the offer wizard.
         */
        {
          path:
            'listings/:listingUid/offer/verification-return',

          canActivate: [
            authGuard,
            accountGuard
          ],

          loadComponent: () =>
            import(
              '../features/identity/offer-verification-return/offer-verification-return.component'
            ).then(
              component =>
                component
                  .OfferVerificationReturnComponent
            )
        },

        /*
         * Create/resume offer
         *
         * Account and verified identity required.
         */
        {
          path:
            'listings/:listingUid/offer',

          canActivate: [
            authGuard,
            accountGuard,
            offerIdentityGuard
          ],

          loadComponent: () =>
            import(
              '../features/offers/states/north-carolina/offer-wizard/offer-wizard.component'
            ).then(
              component =>
                component.OfferWizardComponent
            )
        },

        /*
         * Offer and counteroffer details
         *
         * Only buyers and sellers recorded on the offer
         * may open this route.
         */
        {
          path:
            'offers/:offerUid',

          canActivate: [
            authGuard,
            accountGuard,
            offerAccessGuard
          ],

          loadComponent: () =>
            import(
              '../features/offers/offer-details/offer-details.component'
            ).then(
              component =>
                component
                  .OfferDetailsComponent
            )
        },

        /*
         * State page
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
         * Legacy professional profile URL
         *
         * This MUST remain below the more-specific
         * profile/setup and register routes above.
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
