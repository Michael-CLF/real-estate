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
  ActivatedRoute,
  Router,
  RouterLink
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
  ListingDraft,
  ListingIdentityStatus
} from '../../../core/domains/listings/models/listing.model';

import {
  IdentityVerificationService
} from '../../../core/domains/identity/services/identity-verification.service';


type PageState =
  | 'loading'
  | 'processing'
  | 'verified'
  | 'requires_input'
  | 'error';


@Component({
  selector: 'app-verification-return',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './verification-return.component.html',
  styleUrl: './verification-return.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VerificationReturnComponent
  implements OnInit, OnDestroy {

  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  private readonly identityVerificationService =
    inject(IdentityVerificationService);

  private unsubscribeFromDraft:
    Unsubscribe | null = null;

  private componentDestroyed = false;

  private paymentNavigationStarted = false;


  protected readonly pageState =
    signal<PageState>('loading');

  protected readonly draft =
    signal<ListingDraft | null>(null);

  protected readonly errorMessage =
    signal('');

  protected readonly isRetrying =
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
    void this.initializeVerificationReturn();
  }


  ngOnDestroy(): void {
    this.componentDestroyed = true;
    this.unsubscribeFromDraft?.();
  }


  protected async tryVerificationAgain():
    Promise<void> {

    const listingUid =
      this.draft()?.Uid;

    if (
      !listingUid ||
      this.isRetrying()
    ) {
      return;
    }

    this.isRetrying.set(true);
    this.errorMessage.set('');

    try {
      const verification =
        await this.identityVerificationService
          .startVerification(listingUid);

      if (verification.alreadyVerified) {
        this.pageState.set('verified');
        this.navigateToPayment(listingUid);
        return;
      }

      if (!verification.verificationUrl) {
        throw new Error(
          'Stripe did not return a verification page. Please try again.'
        );
      }

      window.location.assign(
        verification.verificationUrl
      );
    } catch (error) {
      console.error(
        'Identity verification could not be restarted.',
        error
      );

      this.errorMessage.set(
        error instanceof Error
          ? error.message
          : 'Identity verification could not be restarted. Please try again.'
      );
    } finally {
      this.isRetrying.set(false);
    }
  }


  protected continueToPayment(): void {
    const listingUid =
      this.draft()?.Uid;

    if (
      !listingUid ||
      this.pageState() !== 'verified'
    ) {
      return;
    }

    this.navigateToPayment(listingUid);
  }


  private async initializeVerificationReturn():
    Promise<void> {

    const listingUid =
      this.route.snapshot.paramMap
        .get('listingUid')
        ?.trim();

    if (!listingUid) {
      this.showError(
        'The listing could not be identified. Please return to your dashboard and try again.'
      );

      return;
    }

    try {
      /*
       * Stripe returns to a newly loaded application.
       * Wait until Firebase has restored the seller's
       * authenticated session.
       */
      await auth.authStateReady();

      if (this.componentDestroyed) {
        return;
      }

      const sellerUid =
        auth.currentUser?.uid;

      if (!sellerUid) {
        this.showError(
          'Your authentication session could not be restored. Please sign in again.'
        );

        return;
      }

      this.monitorListingDraft(
        listingUid,
        sellerUid
      );
    } catch (error) {
      console.error(
        'Firebase Authentication could not be initialized.',
        error
      );

      this.showError(
        'We could not restore your authentication session. Please refresh the page or sign in again.'
      );
    }
  }


  private monitorListingDraft(
    listingUid: string,
    sellerUid: string
  ): void {

    const draftReference = doc(
      firestore,
      'listingDrafts',
      listingUid
    );

    this.unsubscribeFromDraft =
      onSnapshot(
        draftReference,

        snapshot => {
          if (this.componentDestroyed) {
            return;
          }

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

          this.draft.set(draft);

          this.applyIdentityStatus(
            draft.publication.identityStatus,
            listingUid
          );
        },

        error => {
          if (this.componentDestroyed) {
            return;
          }

          console.error(
            'The identity verification status could not be monitored.',
            error
          );

          this.showError(
            'We could not confirm your verification status. Please refresh the page or try again.'
          );
        }
      );
  }


  private applyIdentityStatus(
    identityStatus: ListingIdentityStatus,
    listingUid: string
  ): void {

    switch (identityStatus) {
      case 'verified':
        this.pageState.set('verified');
        this.navigateToPayment(listingUid);
        break;

      case 'requires_input':
      case 'failed':
        this.pageState.set('requires_input');
        break;

      case 'pending':
      case 'processing':
      case 'not_started':
      default:
        this.pageState.set('processing');
        break;
    }
  }


  private navigateToPayment(
    listingUid: string
  ): void {

    if (
      this.paymentNavigationStarted ||
      this.componentDestroyed
    ) {
      return;
    }

    this.paymentNavigationStarted = true;

    void this.router.navigate(
      [
        '/sell/listings',
        listingUid,
        'payment'
      ],
      {
        replaceUrl: true
      }
    ).then(navigationSucceeded => {
      if (navigationSucceeded) {
        return;
      }

      this.paymentNavigationStarted = false;

      this.showError(
        'We confirmed your identity, but could not open the payment page. Please try again.'
      );
    }).catch(error => {
      this.paymentNavigationStarted = false;

      console.error(
        'The payment page could not be opened.',
        error
      );

      this.showError(
        'We confirmed your identity, but could not open the payment page. Please try again.'
      );
    });
  }


  private showError(message: string): void {
    this.errorMessage.set(message);
    this.pageState.set('error');
  }
}