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
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  ActivatedRoute,
  RouterLink
} from '@angular/router';

import {
  AuthService
} from '../../../core/authentication/services/auth.service';

import {
  SellerControlledListingStatus
} from '../../../core/domains/listings/models/listing-status-management.model';

import {
  Listing,
  ListingStatus
} from '../../../core/domains/listings/models/listing.model';

import {
  ListingService
} from '../../../core/domains/listings/services/listing.service';

import {
  ListingStatusService
} from '../../../core/domains/listings/services/listing-status.service';

type DisplayListingStatus =
  | ListingStatus
  | 'pending_review'
  | 'published'
  | 'archived';

@Component({
  selector: 'app-listing-status',
  standalone: true,
  imports: [
    CurrencyPipe,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './listing-status.component.html',
  styleUrl: './listing-status.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListingStatusComponent implements OnInit {
  private readonly route =
    inject(ActivatedRoute);

  private readonly formBuilder =
    inject(FormBuilder);

  private readonly authService =
    inject(AuthService);

  private readonly listingService =
    inject(ListingService);

  private readonly listingStatusService =
    inject(ListingStatusService);

  protected readonly listing =
    signal<Listing | null>(null);

  protected readonly isLoading =
    signal(true);

  protected readonly isSaving =
    signal(false);

  protected readonly loadError =
    signal('');

  protected readonly saveError =
    signal('');

  protected readonly successMessage =
    signal('');

  protected readonly selectedStatus =
    signal<
      SellerControlledListingStatus | null
    >(null);

  protected readonly listingUid =
    this.route.snapshot.paramMap.get(
      'listingUid'
    ) ?? '';

  protected readonly statusForm =
    this.formBuilder.nonNullable.group({
      reason: [
        '',
        [
          Validators.maxLength(500)
        ]
      ],

      confirmation: [
        ''
      ]
    });

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
        'You must be signed in to manage this listing status.'
      );

      this.isLoading.set(false);
      return;
    }

    try {
      const listing =
        await this.listingService
          .getPublishedListing(
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
          'You do not have permission to manage this listing status.'
        );

        return;
      }

      this.listing.set(
        listing
      );
    } catch (error: unknown) {
      console.error(
        'Unable to load listing status:',
        error
      );

      this.loadError.set(
        'We could not load this listing status. Please return to listing management and try again.'
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  protected beginStatusChange(
    newStatus: SellerControlledListingStatus
  ): void {
    if (this.isSaving()) {
      return;
    }

    this.selectedStatus.set(
      newStatus
    );

    this.statusForm.reset({
      reason: '',
      confirmation: ''
    });

    this.saveError.set('');
    this.successMessage.set('');
  }

  protected cancelStatusChange(): void {
    if (this.isSaving()) {
      return;
    }

    this.selectedStatus.set(null);

    this.statusForm.reset({
      reason: '',
      confirmation: ''
    });

    this.saveError.set('');
  }

  protected async confirmStatusChange():
    Promise<void> {
    const newStatus =
      this.selectedStatus();

    if (
      !newStatus ||
      this.isSaving()
    ) {
      return;
    }

    const reason =
      this.statusForm.controls
        .reason.value.trim();

    const confirmation =
      this.statusForm.controls
        .confirmation.value
        .trim()
        .toUpperCase();

    if (
      this.statusForm.controls
        .reason.hasError(
          'maxlength'
        )
    ) {
      this.statusForm.controls
        .reason.markAsTouched();

      this.saveError.set(
        'The status reason cannot exceed 500 characters.'
      );

      return;
    }

    if (
      newStatus === 'withdrawn' &&
      !reason
    ) {
      this.statusForm.controls
        .reason.setErrors({
          required: true
        });

      this.statusForm.controls
        .reason.markAsTouched();

      this.saveError.set(
        'Enter a reason before withdrawing this listing.'
      );

      return;
    }

    const requiredConfirmation =
      this.requiredConfirmationText(
        newStatus
      );

    if (
      requiredConfirmation &&
      confirmation !==
        requiredConfirmation
    ) {
      this.statusForm.controls
        .confirmation.setErrors({
          confirmationMismatch: true
        });

      this.statusForm.controls
        .confirmation.markAsTouched();

      this.saveError.set(
        `Enter ${requiredConfirmation} to confirm this change.`
      );

      return;
    }

    this.isSaving.set(true);
    this.saveError.set('');
    this.successMessage.set('');

    try {
      const response =
        await this.listingStatusService
          .updateListingStatus(
            this.listingUid,
            newStatus,
            reason
          );

      const currentListing =
        this.listing();

      if (currentListing) {
        this.listing.set({
          ...currentListing,
          status:
            response.newStatus
        });
      }

      this.successMessage.set(
        this.successMessageForStatus(
          response.newStatus
        )
      );

      this.selectedStatus.set(null);

      this.statusForm.reset({
        reason: '',
        confirmation: ''
      });
    } catch (error: unknown) {
      console.error(
        'Unable to update listing status:',
        error
      );

      this.saveError.set(
        'We could not update this listing status. Please review the selected action and try again.'
      );
    } finally {
      this.isSaving.set(false);
    }
  }

 protected canPause(
  status: DisplayListingStatus
): boolean {
  return (
    status === 'active' ||
    status === 'published'
  );
}

protected canReactivate(
  status: DisplayListingStatus
): boolean {
  return (
    status === 'paused' ||
    status === 'under_contract'
  );
}

protected canMarkUnderContract(
  status: DisplayListingStatus
): boolean {
  return (
    status === 'active' ||
    status === 'published'
  );
}

protected canMarkSold(
  status: DisplayListingStatus
): boolean {
  return (
    status === 'active' ||
    status === 'published' ||
    status === 'under_contract'
  );
}

protected canWithdraw(
  status: DisplayListingStatus
): boolean {
  return (
    status === 'active' ||
    status === 'published' ||
    status === 'paused' ||
    status === 'under_contract'
  );
}

protected isTerminalStatus(
  status: DisplayListingStatus
): boolean {
  return (
    status === 'sold' ||
    status === 'withdrawn' ||
    status === 'expired' ||
    status === 'archived'
  );
}

protected statusLabel(
  status: DisplayListingStatus
): string {
  switch (status) {
    case 'draft':
      return 'Draft';

    case 'coming_soon':
      return 'Coming Soon';

    case 'pending':
    case 'pending_review':
      return 'Pending Review';

    case 'published':
    case 'active':
      return 'Active';

    case 'paused':
      return 'Paused';

    case 'under_contract':
      return 'Under Contract';

    case 'sold':
      return 'Sold';

    case 'expired':
      return 'Expired';

    case 'withdrawn':
      return 'Withdrawn';

    case 'archived':
      return 'Archived';
  }
}

  protected selectedStatusLabel():
    string {
    const status =
      this.selectedStatus();

    return status
      ? this.statusLabel(status)
      : '';
  }

  protected requiredConfirmationText(
    status:
      SellerControlledListingStatus
  ): string {
    if (status === 'sold') {
      return 'SOLD';
    }

    if (status === 'withdrawn') {
      return 'WITHDRAW';
    }

    return '';
  }

  protected selectedConfirmationText():
    string {
    const status =
      this.selectedStatus();

    return status
      ? this.requiredConfirmationText(
          status
        )
      : '';
  }

  protected isDangerousSelection():
    boolean {
    const status =
      this.selectedStatus();

    return (
      status === 'sold' ||
      status === 'withdrawn'
    );
  }

  private successMessageForStatus(
    status: SellerControlledListingStatus
  ): string {
    switch (status) {
      case 'active':
        return 'The listing is active and visible in the NavStreet marketplace.';

      case 'paused':
        return 'The listing has been paused and removed from active marketplace results.';

      case 'under_contract':
        return 'The listing has been marked under contract.';

      case 'sold':
        return 'The listing has been marked sold.';

      case 'withdrawn':
        return 'The listing has been withdrawn from NavStreet.';
    }
  }
}