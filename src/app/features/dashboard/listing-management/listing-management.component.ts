import {
  ChangeDetectionStrategy,
  Component,
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
  AuthService
} from '../../../core/authentication/services/auth.service';

import {
  Listing
} from '../../../core/domains/listings/models/listing.model';

import {
  ListingService
} from '../../../core/domains/listings/services/listing.service';

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
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly listingService = inject(ListingService);

  protected readonly listing =
    signal<Listing | null>(null);

  protected readonly isLoading =
    signal(true);

  protected readonly loadError =
    signal('');

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

      this.listing.set(listing);
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

  protected async previewListing():
  Promise<void> {
    await this.router.navigate([
      '/listings',
      this.listingUid
    ]);
  }
}