import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal
} from '@angular/core';

import {
  CurrencyPipe
} from '@angular/common';

import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';

import {
  takeUntilDestroyed
} from '@angular/core/rxjs-interop';

import {
  AuthService
} from '../../../core/authentication/services/auth.service';

import {
  ListingInquiryService
} from '../../../core/domains/inquiries/services/listing-inquiry.service';

import {
  Listing
} from '../../../core/domains/listings/models/listing.model';

import {
  ListingService
} from '../../../core/domains/listings/services/listing.service';

import {
  calculateDaysOnMarket
} from '../../../core/domains/listings/utils/listing-days-on-market.util';

import {
  ShowingService
} from '../../../core/domains/showings/services/showing.service';

@Component({
  selector: 'app-listing-management',
  standalone: true,
  imports: [
    CurrencyPipe,
    RouterLink
  ],
  templateUrl: './listing-management.component.html',
  styleUrl: './listing-management.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListingManagementComponent implements OnInit {
  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  private readonly destroyRef =
    inject(DestroyRef);

  private readonly authService =
    inject(AuthService);

  private readonly listingService =
    inject(ListingService);

  private readonly listingInquiryService =
    inject(ListingInquiryService);

  private readonly showingService =
    inject(ShowingService);

  protected readonly listing =
    signal<Listing | null>(null);

  protected readonly isLoading =
    signal(true);

  protected readonly loadError =
    signal('');

  protected readonly activityLoadError =
    signal('');

  protected readonly inquiryCount =
    signal(0);

  protected readonly unreadInquiryCount =
    signal(0);

  protected readonly showingRequestCount =
    signal(0);

  protected readonly pendingShowingRequestCount =
    signal(0);

  protected readonly listingUid =
    this.route.snapshot.paramMap.get(
      'listingUid'
    ) ?? '';

  async ngOnInit(): Promise<void> {
    if (!this.listingUid) {
      this.loadError.set(
        'The selected listing could not be identified.'
      );

      this.isLoading.set(false);
      return;
    }

    const currentUserUid =
      this.authService.currentUserUid;

    if (!currentUserUid) {
      this.loadError.set(
        'You must be signed in to manage this listing.'
      );

      this.isLoading.set(false);
      return;
    }

    try {
      const listing =
        await this.listingService.getPublishedListing(
          this.listingUid
        );

      if (!listing) {
        this.loadError.set(
          'The selected listing could not be found.'
        );

        return;
      }

      if (
        listing.sellerUid !==
        currentUserUid
      ) {
        this.loadError.set(
          'You do not have permission to manage this listing.'
        );

        return;
      }

      this.listing.set({
        ...listing,

        daysOnMarket:
          calculateDaysOnMarket(
            listing.publishedAt
          )
      });

      this.loadShowingActivity(
        currentUserUid
      );

      void this.loadInquiryActivity();
    } catch (error: unknown) {
      console.error(
        'Unable to load listing management:',
        error
      );

      this.loadError.set(
        'We could not load this listing. Please return to the dashboard and try again.'
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  protected async openListingEditor():
    Promise<void> {
    await this.router.navigate([
      '/sell/listings',
      this.listingUid,
      'manage',
      'edit'
    ]);
  }

  protected async openBuyerInquiries():
    Promise<void> {
    await this.router.navigate([
      '/sell/listings',
      this.listingUid,
      'manage',
      'inquiries'
    ]);
  }

  protected async openEnhancements():
    Promise<void> {
    await this.router.navigate([
      '/sell/listings',
      this.listingUid,
      'enhancements'
    ]);
  }

  protected async openShowingAvailability():
    Promise<void> {
    await this.router.navigate([
      '/sell/listings',
      this.listingUid,
      'showing-availability'
    ]);
  }

  protected async openShowingRequests():
    Promise<void> {
    await this.router.navigate([
      '/sell/listings',
      this.listingUid,
      'showing-requests'
    ]);
  }

  protected async openListingActivity():
    Promise<void> {
    await this.router.navigate([
      '/sell/listings',
      this.listingUid,
      'manage',
      'activity'
    ]);
  }

  protected async openListingStatus():
    Promise<void> {
    await this.router.navigate([
      '/sell/listings',
      this.listingUid,
      'manage',
      'status'
    ]);
  }

  protected async previewListing():
    Promise<void> {
    await this.router.navigate([
      '/listings',
      this.listingUid
    ]);
  }

  private loadShowingActivity(
    currentUserUid: string
  ): void {
    this.showingService
      .getListingShowingRequests(
        this.listingUid
      )
      .pipe(
        takeUntilDestroyed(
          this.destroyRef
        )
      )
      .subscribe({
        next: requests => {
          const ownedRequests =
            requests.filter(
              request =>
                request.sellerUid ===
                currentUserUid
            );

          if (
            ownedRequests.length !==
            requests.length
          ) {
            console.error(
              'Showing request ownership mismatch detected while loading listing activity.'
            );

            this.activityLoadError.set(
              'Some listing activity could not be verified.'
            );
          }

          this.showingRequestCount.set(
            ownedRequests.length
          );

          this.pendingShowingRequestCount.set(
            ownedRequests.filter(
              request =>
                request.status ===
                'pending'
            ).length
          );
        },

        error: (error: unknown) => {
          console.error(
            'Unable to load showing activity:',
            error
          );

          this.showingRequestCount.set(0);
          this.pendingShowingRequestCount.set(0);

          this.activityLoadError.set(
            'Some listing activity could not be loaded.'
          );
        }
      });
  }

  private async loadInquiryActivity():
    Promise<void> {
    try {
      const response =
        await this.listingInquiryService
          .getListingInquiries(
            this.listingUid
          );

      this.inquiryCount.set(
        response.inquiries.length
      );

      this.unreadInquiryCount.set(
        response.unreadCount
      );
    } catch (error: unknown) {
      console.error(
        'Unable to load inquiry activity:',
        error
      );

      this.inquiryCount.set(0);
      this.unreadInquiryCount.set(0);

      this.activityLoadError.set(
        'Some listing activity could not be loaded.'
      );
    }
  }
}