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
  ListingPaymentService,
  ValidateListingPromotionResult
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
  changeDetection:
    ChangeDetectionStrategy.OnPush
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
    signal<PaymentPageState>(
      'loading'
    );

  protected readonly draft =
    signal<ListingDraft | null>(
      null
    );

  protected readonly errorMessage =
    signal('');

  protected readonly isOpeningCheckout =
    signal(false);

  protected readonly promotionCode =
    signal('');

  protected readonly isValidatingPromotion =
    signal(false);

  protected readonly promotionMessage =
    signal('');

  protected readonly promotionIsValid =
    signal(false);

  protected readonly validatedPromotion =
    signal<
      ValidateListingPromotionResult |
      null
    >(
      null
    );

  protected readonly listingFee =
    computed(() =>
      (
        this.validatedPromotion()
          ?.listingFeeCents ??
        4900
      ) /
      100
    );

  protected readonly featuredFee =
    computed(() =>
      (
        this.validatedPromotion()
          ?.featuredListingFeeCents ??
        (
          this.draft()
            ?.featuredListing
            ? 1000
            : 0
        )
      ) /
      100
    );

  protected readonly subtotal =
    computed(() =>
      (
        this.validatedPromotion()
          ?.subtotalAmountCents ??
        (
          4900 +
          (
            this.draft()
              ?.featuredListing
              ? 1000
              : 0
          )
        )
      ) /
      100
    );

  protected readonly discount =
    computed(() =>
      (
        this.validatedPromotion()
          ?.discountAmountCents ??
        0
      ) /
      100
    );

  protected readonly total =
    computed(() =>
      (
        this.validatedPromotion()
          ?.totalAmountCents ??
        (
          4900 +
          (
            this.draft()
              ?.featuredListing
              ? 1000
              : 0
          )
        )
      ) /
      100
    );

  protected readonly hasUnvalidatedCode =
    computed(() =>
      Boolean(
        this.promotionCode()
          .trim()
      ) &&
      !this.promotionIsValid()
    );

  protected readonly propertyAddress =
    computed(() => {
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


  async ngOnInit():
    Promise<void> {
    await auth.authStateReady();

    const listingUid =
      this.route.snapshot
        .paramMap
        .get(
          'listingUid'
        )
        ?.trim();

    const sellerUid =
      auth.currentUser?.uid;

    if (
      !listingUid ||
      !sellerUid
    ) {
      this.showError(
        'Your listing or authentication session could not be found.'
      );

      return;
    }

    const draftReference =
      doc(
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
            Uid:
              snapshot.id,

            ...snapshot.data()
          } as ListingDraft;

          if (
            draft.sellerUid !==
            sellerUid
          ) {
            this.showError(
              'You do not have permission to access this listing.'
            );

            return;
          }

          if (
            draft.publication
              .identityStatus !==
            'verified'
          ) {
            this.showError(
              'Identity verification must be completed before payment.'
            );

            return;
          }

          if (
            draft.publication
              .paymentStatus ===
            'paid'
          ) {
            this.showError(
              'Payment has already been completed for this listing.'
            );

            return;
          }

          const validation =
            this.validatedPromotion();

          const expectedFeaturedFee =
            draft.featuredListing
              ? 1000
              : 0;

          if (
            validation &&
            validation
              .featuredListingFeeCents !==
            expectedFeaturedFee
          ) {
            this.clearValidatedPromotion();

            this.promotionMessage.set(
              'Your listing options changed. Apply the promotion code again.'
            );
          }

          this.draft.set(
            draft
          );

          this.errorMessage.set('');
          this.pageState.set(
            'ready'
          );
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


  protected onPromotionCodeInput(
    value: string
  ): void {
    const normalizedCode =
      value
        .toUpperCase()
        .replace(
          /[^A-Z0-9]/g,
          ''
        )
        .slice(
          0,
          32
        );

    this.promotionCode.set(
      normalizedCode
    );

    this.clearValidatedPromotion();
    this.promotionMessage.set('');
    this.errorMessage.set('');
  }


  protected async applyPromotionCode():
    Promise<void> {
    const listingUid =
      this.draft()?.Uid;

    const code =
      this.promotionCode()
        .trim();

    if (
      !listingUid ||
      !code ||
      this.isValidatingPromotion() ||
      this.isOpeningCheckout()
    ) {
      return;
    }

    this.isValidatingPromotion.set(
      true
    );

    this.clearValidatedPromotion();
    this.promotionMessage.set('');
    this.errorMessage.set('');

    try {
      const validation =
        await this
          .listingPaymentService
          .validatePromotion(
            listingUid,
            code
          );

      this.validatedPromotion.set(
        validation
      );

      this.promotionCode.set(
        validation.code
      );

      this.promotionIsValid.set(
        true
      );

      this.promotionMessage.set(
        `Promotion code ${validation.code} was applied.`
      );
    } catch (error) {
      console.error(
        'The promotion code could not be applied.',
        error
      );

      this.promotionMessage.set(
        error instanceof Error
          ? error.message
          : 'The promotion code could not be applied.'
      );
    } finally {
      this.isValidatingPromotion.set(
        false
      );
    }
  }


  protected removePromotionCode():
    void {
    this.promotionCode.set('');
    this.promotionMessage.set('');
    this.errorMessage.set('');

    this.clearValidatedPromotion();
  }


  protected async continueToStripe():
    Promise<void> {
    const listingUid =
      this.draft()?.Uid;

    if (
      !listingUid ||
      this.pageState() !==
      'ready' ||
      this.isOpeningCheckout() ||
      this.isValidatingPromotion()
    ) {
      return;
    }

    if (
      this.hasUnvalidatedCode()
    ) {
      this.promotionMessage.set(
        'Apply the promotion code or remove it before continuing.'
      );

      return;
    }

    this.isOpeningCheckout.set(
      true
    );

    this.errorMessage.set('');

    try {
      const checkout =
        await this
          .listingPaymentService
          .startCheckout(
            listingUid,
            this.validatedPromotion()
              ?.code ??
            null
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

      this.isOpeningCheckout.set(
        false
      );
    }
  }


  private clearValidatedPromotion():
    void {
    this.validatedPromotion.set(
      null
    );

    this.promotionIsValid.set(
      false
    );
  }


  private showError(
    message: string
  ): void {
    this.errorMessage.set(
      message
    );

    this.pageState.set(
      'error'
    );
  }
}