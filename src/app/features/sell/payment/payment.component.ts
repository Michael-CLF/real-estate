import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';

import {
  ActivatedRoute
} from '@angular/router';

import {
  doc,
  onSnapshot
} from 'firebase/firestore';

import type {
  Unsubscribe
} from 'firebase/firestore';

import {
  auth,
  firestore
} from '../../../core/infrastructure/firebase/firebase';

import {
  ListingDraft
} from '../../../core/domains/listings/models/listing.model';

import {
  ListingPaymentService
} from '../../../core/domains/payments/services/listing-payment.service';


type PaymentPageState =
  | 'loading'
  | 'ready'
  | 'error';


@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [],
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentComponent
  implements OnInit, OnDestroy {

  private readonly route =
    inject(ActivatedRoute);

  private readonly listingPaymentService =
    inject(ListingPaymentService);

  private unsubscribeFromDraft:
    Unsubscribe | null = null;

  protected readonly pageState =
    signal<PaymentPageState>('loading');

  protected readonly draft =
    signal<ListingDraft | null>(null);

  protected readonly errorMessage =
    signal('');

  protected readonly isOpeningCheckout =
    signal(false);

  protected readonly listingFee = 49;
  protected readonly featuredListingFee = 10;

  protected readonly featuredFee = computed(() =>
    this.draft()?.featuredListing
      ? this.featuredListingFee
      : 0
  );

  protected readonly subtotal = computed(() =>
    this.listingFee +
    this.featuredFee()
  );

  protected readonly discount = computed(() =>
    Math.min(
      Math.max(
        this.draft()?.promotion?.discountAmount ?? 0,
        0
      ),
      this.subtotal()
    )
  );

  protected readonly total = computed(() =>
    this.subtotal() -
    this.discount()
  );

  protected readonly propertyAddress = computed(() => {
    const address =
      this.draft()?.address;

    if (!address) {
      return '';
    }

    return [
      address.addressLine1,
      address.city,
      address.state,
      address.zipCode
    ]
      .filter(Boolean)
      .join(', ');
  });


  ngOnInit(): void {
    const listingUid =
      this.route.snapshot.paramMap
        .get('listingUid')
        ?.trim();

    const sellerUid =
      auth.currentUser?.uid;

    if (!listingUid || !sellerUid) {
      this.showError(
        'Your listing or authentication session could not be found.'
      );

      return;
    }

    const draftReference = doc(
      firestore,
      'listingDrafts',
      listingUid
    );

    this.unsubscribeFromDraft =
      onSnapshot(
        draftReference,

        snapshot => {
          if (!snapshot.exists()) {
            this.showError(
              'The listing draft could not be found.'
            );

            return;
          }

          const draft = {
            Uid: snapshot.id,
            ...snapshot.data()
          } as ListingDraft;

          if (draft.sellerUid !== sellerUid) {
            this.showError(
              'You do not have permission to access this listing.'
            );

            return;
          }

          if (
            draft.publication.identityStatus !==
            'verified'
          ) {
            this.showError(
              'Identity verification must be completed before payment.'
            );

            return;
          }

          if (
            draft.publication.paymentStatus ===
            'paid'
          ) {
            this.showError(
              'Payment has already been completed for this listing.'
            );

            return;
          }

          this.draft.set(draft);
          this.errorMessage.set('');
          this.pageState.set('ready');
        },

        error => {
          console.error(
            'The listing payment information could not be loaded.',
            error
          );

          this.showError(
            'We could not load your payment information. Please refresh the page and try again.'
          );
        }
      );
  }


  ngOnDestroy(): void {
    this.unsubscribeFromDraft?.();
  }


  protected async continueToStripe(): Promise<void> {
    const listingUid =
      this.draft()?.Uid;

    if (
      !listingUid ||
      this.pageState() !== 'ready' ||
      this.isOpeningCheckout()
    ) {
      return;
    }

    this.isOpeningCheckout.set(true);
    this.errorMessage.set('');

    try {
      const checkout =
        await this.listingPaymentService.startCheckout(
          listingUid
        );

      window.location.assign(
        checkout.checkoutUrl
      );
    } catch (error) {
      console.error(
        'Stripe Checkout could not be opened.',
        error
      );

      this.errorMessage.set(
        error instanceof Error
          ? error.message
          : (
              'The secure payment page could not be opened. ' +
              'Please try again.'
            )
      );

      this.isOpeningCheckout.set(false);
    }
  }


  private showError(
    message: string
  ): void {
    this.errorMessage.set(message);
    this.pageState.set('error');
  }
}