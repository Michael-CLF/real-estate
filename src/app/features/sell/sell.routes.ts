import {
  Routes
} from '@angular/router';

import {
  PublicLayoutComponent
} from '../../layout/layouts/public-layout/public-layout.component';

import {
  authGuard
} from '../../core/authentication/guards/auth.guard';

import {
  accountGuard
} from '../../core/authentication/guards/account.guard';

export const SELL_ROUTES:
  Routes = [
    /*
     * Authenticated seller pages using the public
     * NavStreet header and footer.
     */
    {
      path: '',

      component:
        PublicLayoutComponent,

      canActivate: [
        authGuard,
        accountGuard
      ],

      children: [
        {
          path: '',
          pathMatch: 'full',
          redirectTo: '/dashboard'
        },
        {
          path: 'new',

          loadComponent: () =>
            import(
              './listing-wizard/listing-wizard.component'
            ).then(
              component =>
                component
                  .ListingWizardComponent
            )
        },

        {
          path:
            'listings/:listingUid/edit',

          loadComponent: () =>
            import(
              './listing-wizard/listing-wizard.component'
            ).then(
              component =>
                component
                  .ListingWizardComponent
            )
        },

        {
          path:
            'listings/:listingUid/manage/disclosures',

          loadComponent: () =>
            import(
              '../dashboard/listing-disclosures-management/listing-disclosures-management.component'
            ).then(
              component =>
                component
                  .ListingDisclosuresManagementComponent
            )
        },

        {
          path:
            'listings/:listingUid/manage/edit',

          loadComponent: () =>
            import(
              '../dashboard/listing-edit/listing-edit.component'
            ).then(
              component =>
                component
                  .ListingEditComponent
            )
        },

        {
          path:
            'listings/:listingUid/manage/inquiries',

          loadComponent: () =>
            import(
              '../dashboard/listing-inquiries/listing-inquiries.component'
            ).then(
              component =>
                component
                  .ListingInquiriesComponent
            )
        },

        {
          path:
            'listings/:listingUid/manage/marketing',

          loadComponent: () =>
            import(
              '../dashboard/listing-marketing/marketing-toolkit/marketing-toolkit.component'
            ).then(
              component =>
                component
                  .MarketingToolkitComponent
            )
        },

        {
          path:
            'listings/:listingUid/manage/transaction',

          loadComponent: () =>
            import(
              '../dashboard/listing-transaction/listing-transaction.component'
            ).then(
              component =>
                component
                  .ListingTransactionComponent
            )
        },

        {
          path:
            'listings/:listingUid/manage',

          loadComponent: () =>
            import(
              '../dashboard/listing-management/listing-management.component'
            ).then(
              component =>
                component
                  .ListingManagementComponent
            )
        },

        {
          path:
            'listings/:listingUid/manage/status',

          loadComponent: () =>
            import(
              '../dashboard/listing-status/listing-status.component'
            ).then(
              component =>
                component
                  .ListingStatusComponent
            )
        },

        {
          path:
            'listings/:listingUid/manage/activity',

          loadComponent: () =>
            import(
              '../dashboard/listing-activity/listing-activity.component'
            ).then(
              component =>
                component
                  .ListingActivityComponent
            )
        },

        {
          path:
            'listings/:listingUid/enhancements',

          loadComponent: () =>
            import(
              '../dashboard/listing-enhancement/listing-enhancement/listing-enhancement.component'
            ).then(
              component =>
                component
                  .ListingEnhancementComponent
            )
        },

        {
          path:
            'listings/:listingUid/enhancements/construction',

          loadComponent: () =>
            import(
              '../dashboard/listing-enhancement/construction-enhancement/construction-enhancement.component'
            ).then(
              component =>
                component
                  .ConstructionEnhancementComponent
            )
        },

        {
          path:
            'listings/:listingUid/enhancements/interior',

          loadComponent: () =>
            import(
              '../dashboard/listing-enhancement/interior-enhancement/interior-enhancement.component'
            ).then(
              component =>
                component
                  .LivingSpacesEnhancementComponent
            )
        },

        {
          path:
            'listings/:listingUid/enhancements/kitchen',

          loadComponent: () =>
            import(
              '../dashboard/listing-enhancement/kitchen-enhancement/kitchen-enhancement.component'
            ).then(
              component =>
                component
                  .KitchenEnhancementComponent
            )
        },

        {
          path:
            'listings/:listingUid/enhancements/bedrooms-bathrooms',

          loadComponent: () =>
            import(
              '../dashboard/listing-enhancement/bedrooms-bathrooms-enhancement/bedrooms-bathrooms-enhancement.component'
            ).then(
              component =>
                component
                  .BedroomsBathroomsEnhancementComponent
            )
        },

        {
          path:
            'listings/:listingUid/enhancements/parking-storage',

          loadComponent: () =>
            import(
              '../dashboard/listing-enhancement/parking-storage-enhancement/parking-storage-enhancement.component'
            ).then(
              component =>
                component
                  .ParkingStorageEnhancementComponent
            )
        },

        {
          path:
            'listings/:listingUid/enhancements/outdoor-living',

          loadComponent: () =>
            import(
              '../dashboard/listing-enhancement/outdoor-living-enhancement/outdoor-living-enhancement.component'
            ).then(
              component =>
                component
                  .OutdoorLivingEnhancementComponent
            )
        },

        {
          path:
            'listings/:listingUid/enhancements/systems-utilities',

          loadComponent: () =>
            import(
              '../dashboard/listing-enhancement/systems-utilities-enhancement/systems-utilities-enhancement.component'
            ).then(
              component =>
                component
                  .SystemUtilitiesEnhancementComponent
            )
        },

        {
          path:
            'listings/:listingUid/enhancements/technology-security',

          loadComponent: () =>
            import(
              '../dashboard/listing-enhancement/technology-security-enhancement/technology-security-enhancement.component'
            ).then(
              component =>
                component
                  .TechnologySecurityEnhancementComponent
            )
        },

        {
          path:
            'listings/:listingUid/enhancements/accessibility',

          loadComponent: () =>
            import(
              '../dashboard/listing-enhancement/accessibility-enhancement/accessibility-enhancement.component'
            ).then(
              component =>
                component
                  .AccessibilityEnhancementComponent
            )
        },

        {
          path:
            'listings/:listingUid/enhancements/community-amenities',

          loadComponent: () =>
            import(
              '../dashboard/listing-enhancement/community-amenities-enhancement/community-amenities-enhancement.component'
            ).then(
              component =>
                component
                  .CommunityAmenitiesEnhancementComponent
            )
        },

        {
          path:
            'listings/:listingUid/enhancements/schools',

          loadComponent: () =>
            import(
              '../dashboard/listing-enhancement/schools-enhancement/schools-enhancement.component'
            ).then(
              component =>
                component
                  .SchoolsEnhancementComponent
            )
        },

        {
          path:
            'listings/:listingUid/showing-availability',

          loadComponent: () =>
            import(
              '../dashboard/showings/showing-availability/showing-availability.component'
            ).then(
              component =>
                component
                  .ShowingAvailabilityComponent
            )
        },

        {
          path:
            'listings/:listingUid/showing-requests',

          loadComponent: () =>
            import(
              '../dashboard/showings/showing-requests/showing-requests.component'
            ).then(
              component =>
                component
                  .ShowingRequestsComponent
            )
        },

        {
          path:
            'listings/:listingUid/showing-requests/:showingRequestUid',

          loadComponent: () =>
            import(
              '../dashboard/showings/showing-request-details/showing-request-details.component'
            ).then(
              component =>
                component
                  .ShowingRequestDetailsComponent
            )
        }
      ]
    },

    /*
     * Identity and payment callback pages intentionally
     * remain outside PublicLayout.
     */
    {
      path:
        'listings/:listingUid/verification-return',

      loadComponent: () =>
        import(
          './verification-return/verification-return.component'
        ).then(
          component =>
            component
              .VerificationReturnComponent
        )
    },

    {
      path:
        'listings/:listingUid/payment',

      loadComponent: () =>
        import(
          './payment/payment.component'
        ).then(
          component =>
            component.PaymentComponent
        )
    },

    {
      path:
        'listings/:listingUid/payment-return',

      loadComponent: () =>
        import(
          './payment-return/payment-return.component'
        ).then(
          component =>
            component
              .PaymentReturnComponent
        )
    }
  ];