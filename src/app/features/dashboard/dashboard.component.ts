import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';

import {
  SavedPropertySummary
} from './models/dashboard-state.model';

import {
  Router,
  RouterLink
} from '@angular/router';


import {
  DashboardStateService
} from './services/dashboard-state.service';

import {
  Listing
} from '../../core/domains/listings/models/listing.model';

import {
  ListingInquiryService
} from '../../core/domains/inquiries/services/listing-inquiry.service';

import {
  ActivityItem
} from './components/activity-card/activity-card.component';

import {
  httpsCallable
} from 'firebase/functions';

import {
  AuthState
} from '../../core/authentication/state/auth.state';

import {
  PROFESSIONAL_TYPE_LABELS
} from '../../core/domains/users/models/professional-type';

import {
  ProfessionalUser
} from '../../core/domains/users/models/professional-user.model';

import {
  FirebaseProfessionalRepository
} from '../../core/infrastructure/firebase/firebase-professional.repository';

import {
  functions
} from '../../core/infrastructure/firebase/firebase';

interface ProfessionalProfileCheckoutResult {
  checkoutSessionId: string;
  checkoutUrl: string;
}

interface ProfessionalProfileCheckoutResult {
  checkoutSessionId: string;
  checkoutUrl: string;
}

interface ProfessionalBillingPortalResult {
  portalUrl: string;
}

type ListingTab =
  | 'draft'
  | 'active'
  | 'under-contract'
  | 'sold';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterLink,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class DashboardComponent
  implements OnInit {
  protected readonly dashboardState =
    inject(DashboardStateService);

  private readonly router =
    inject(Router);

  private readonly listingInquiryService =
    inject(ListingInquiryService);

  protected readonly selectedListingTab =
    signal<ListingTab>('active');

  protected readonly recentActivities =
    signal<ActivityItem[]>([]);

  protected readonly removingSavedListingUid =
    signal<string | null>(null);

  protected readonly savedPropertyError =
    signal('');

  private readonly authState =
    inject(AuthState);

  private readonly professionalRepository =
    inject(FirebaseProfessionalRepository);

  protected readonly professional =
    signal<ProfessionalUser | null>(null);

  protected readonly isProfessionalLoading =
    signal(true);

  protected readonly professionalLoadError =
    signal('');

  protected readonly isStartingUpgrade =
    signal(false);

  protected readonly professionalUpgradeError =
    signal('');

  protected readonly isOpeningBillingPortal =
    signal(false);

  protected readonly professionalBillingError =
    signal('');

  protected readonly professionalTypeLabel =
    computed(() => {
      const professional =
        this.professional();

      return professional
        ? PROFESSIONAL_TYPE_LABELS[
        professional.professionalType
        ]
        : '';
    });

  protected readonly hasFullBusinessProfile =
    computed(
      () =>
        this.professional()
          ?.subscriptionStatus === 'profile'
    );

  protected readonly publicProfileRoute =
    computed(() => {
      const professional =
        this.professional();

      if (
        !professional ||
        professional.subscriptionStatus !==
        'profile' ||
        !professional.profileSlug
      ) {
        return null;
      }

      return [
        '/find-a-pro',
        professional.stateSlug,
        professional.profileSlug
      ];
    });

  protected readonly profileSetupRoute =
    computed(() => {
      const professional =
        this.professional();

      if (!professional) {
        return null;
      }

      return [
        '/professionals',
        professional.stateSlug,
        'profile',
        'setup'
      ];
    });

  async ngOnInit(): Promise<void> {
    await this.dashboardState.load();
    await this.loadProfessionalAccount();

    /*
     * Prefer Active when active listings exist.
     * Otherwise show Draft when drafts exist.
     */
    if (
      this.dashboardState.state()
        .activeListings.length > 0
    ) {
      this.selectedListingTab.set(
        'active'
      );
    } else if (
      this.dashboardState.state()
        .draftListings.length > 0
    ) {
      this.selectedListingTab.set(
        'draft'
      );
    }

    await this.loadRecentInquiryActivity();
  }

  protected async upgradeBusinessProfile():
    Promise<void> {
    if (
      this.isStartingUpgrade() ||
      !this.professional()
    ) {
      return;
    }

    this.isStartingUpgrade.set(true);
    this.professionalUpgradeError.set('');

    try {
      const createCheckoutSession =
        httpsCallable<
          void,
          ProfessionalProfileCheckoutResult
        >(
          functions,
          'createProfessionalProfileCheckoutSession'
        );

      const result =
        await createCheckoutSession();

      const checkoutUrl =
        result.data.checkoutUrl?.trim();

      if (!checkoutUrl) {
        throw new Error(
          'Stripe did not return a checkout address.'
        );
      }

      window.location.assign(checkoutUrl);
    } catch (error: unknown) {
      console.error(
        'Unable to begin the business profile upgrade:',
        error
      );

      this.professionalUpgradeError.set(
        this.getErrorMessage(
          error,
          'We could not open the subscription checkout. Please try again.'
        )
      );

      this.isStartingUpgrade.set(false);
    }
  }

  protected async openBusinessBillingPortal():
    Promise<void> {
    if (
      this.isOpeningBillingPortal() ||
      !this.hasFullBusinessProfile()
    ) {
      return;
    }

    this.isOpeningBillingPortal.set(true);
    this.professionalBillingError.set('');

    try {
      const createPortalSession =
        httpsCallable<
          void,
          ProfessionalBillingPortalResult
        >(
          functions,
          'createProfessionalBillingPortalSession'
        );

      const result =
        await createPortalSession();

      const portalUrl =
        result.data.portalUrl?.trim();

      if (!portalUrl) {
        throw new Error(
          'Stripe did not return a billing portal address.'
        );
      }

      window.location.assign(portalUrl);
    } catch (error: unknown) {
      console.error(
        'Unable to open the business billing portal:',
        error
      );

      this.professionalBillingError.set(
        this.getErrorMessage(
          error,
          'We could not open subscription management. Please try again.'
        )
      );

      this.isOpeningBillingPortal.set(false);
    }
  }

  protected selectListingTab(
    tab: ListingTab
  ): void {
    this.selectedListingTab.set(tab);
  }

  protected formatTelephone(
  telephone: string
): string {
  const digits =
    telephone.replace(/\D/g, '');

  if (digits.length === 10) {
    return (
      `(${digits.slice(0, 3)}) ` +
      `${digits.slice(3, 6)}-` +
      `${digits.slice(6)}`
    );
  }

  if (
    digits.length === 11 &&
    digits.startsWith('1')
  ) {
    return (
      `+1 (${digits.slice(1, 4)}) ` +
      `${digits.slice(4, 7)}-` +
      `${digits.slice(7)}`
    );
  }

  return telephone;
}


  protected async manageListing(
    listing: Listing
  ): Promise<void> {
    if (listing.status === 'draft') {
      await this.router.navigate([
        '/sell/listings',
        listing.Uid,
        'edit'
      ]);

      return;
    }

    await this.router.navigate([
      '/sell/listings',
      listing.Uid,
      'manage'
    ]);

    console.log(
      'Manage active listing:',
      listing
    );
  }

  protected async removeSavedProperty(
    property: SavedPropertySummary
  ): Promise<void> {
    if (this.removingSavedListingUid()) {
      return;
    }

    this.savedPropertyError.set('');

    this.removingSavedListingUid.set(
      property.listingUid
    );

    try {
      await this.dashboardState
        .removeSavedProperty(
          property.listingUid
        );
    } catch (error: unknown) {
      console.error(
        'Unable to remove saved property:',
        error
      );

      this.savedPropertyError.set(
        'We could not remove this property. Please try again.'
      );
    } finally {
      this.removingSavedListingUid.set(
        null
      );
    }
  }
  private async loadProfessionalAccount():
    Promise<void> {
    this.isProfessionalLoading.set(true);
    this.professionalLoadError.set('');
    this.professionalUpgradeError.set('');
    this.professionalBillingError.set('');

    try {
      const ownerUid =
        this.authState.uid();

      if (!ownerUid) {
        this.professional.set(null);

        return;
      }

      const professional =
        await this.professionalRepository
          .getProfessionalByOwnerUid(
            ownerUid
          );

      this.professional.set(professional);
    } catch (error: unknown) {
      console.error(
        'Unable to load the business account:',
        error
      );

      this.professional.set(null);

      this.professionalLoadError.set(
        'Your business information could not be loaded. Your other dashboard features are still available.'
      );
    } finally {
      this.isProfessionalLoading.set(false);
    }
  }

  private async loadRecentInquiryActivity():
    Promise<void> {
    try {
      const response =
        await this.listingInquiryService
          .getUserInquiryActivity();

      const activities =
        response.activities
          .map(
            activity =>
              this.mapInquiryActivity(
                activity
              )
          )
          .sort(
            (
              firstActivity,
              secondActivity
            ) =>
              secondActivity.timestamp
                .getTime() -
              firstActivity.timestamp
                .getTime()
          );

      this.recentActivities.set(
        activities
      );
    } catch (error: unknown) {
      /*
       * Inquiry activity must not prevent the rest
       * of the universal dashboard from loading.
       */
      console.error(
        'Unable to load recent inquiry activity:',
        error
      );

      this.recentActivities.set([]);
    }
  }

  private mapInquiryActivity(
    activity: {
      inquiryUid: string;
      inquiryReferenceNumber: string;
      listingUid: string;
      perspective:
      | 'sent'
      | 'received';
      status:
      | 'new'
      | 'read';
      buyerName: string;
      propertyAddress: string;
      createdAt: string;
      readAt: string | null;
    }
  ): ActivityItem {
    if (
      activity.perspective ===
      'received'
    ) {
      return {
        activityUid:
          `received-${activity.inquiryUid}`,

        title:
          'New buyer inquiry',

        description:
          `${activity.buyerName} contacted you about ` +
          `${activity.propertyAddress}. ` +
          `Reference: ${activity.inquiryReferenceNumber}`,

        timestamp:
          this.createActivityDate(
            activity.createdAt
          ),

        icon:
          'fa-solid fa-message',

        statusLabel:
          activity.status === 'read'
            ? 'Read'
            : 'New',

        route: [
          '/sell/listings',
          activity.listingUid,
          'manage',
          'inquiries'
        ]
      };
    }

    const sellerViewedInquiry =
      activity.status === 'read' &&
      Boolean(activity.readAt);

    return {
      activityUid:
        sellerViewedInquiry
          ? `viewed-${activity.inquiryUid}`
          : `sent-${activity.inquiryUid}`,

      title:
        sellerViewedInquiry
          ? 'Inquiry viewed by seller'
          : 'Inquiry sent',

      description:
        `You contacted the seller of ` +
        `${activity.propertyAddress}. ` +
        `Reference: ${activity.inquiryReferenceNumber}`,

      timestamp:
        this.createActivityDate(
          sellerViewedInquiry
            ? activity.readAt
            : activity.createdAt
        ),

      icon:
        sellerViewedInquiry
          ? 'fa-solid fa-eye'
          : 'fa-solid fa-paper-plane',

      statusLabel:
        sellerViewedInquiry
          ? 'Viewed'
          : 'Sent',

      route: [
        '/listings',
        activity.listingUid
      ]
    };
  }

  private createActivityDate(
    value: string | null
  ): Date {
    if (!value) {
      return new Date(0);
    }

    const date =
      new Date(value);

    return Number.isNaN(
      date.getTime()
    )
      ? new Date(0)
      : date;
  }

  private getErrorMessage(
    error: unknown,
    fallback: string
  ): string {
    if (
      error instanceof Error &&
      error.message.trim()
    ) {
      return error.message;
    }

    return fallback;
  }
}
