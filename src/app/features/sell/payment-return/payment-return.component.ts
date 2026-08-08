import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal
} from '@angular/core';

import {
  onAuthStateChanged
} from 'firebase/auth';

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
  ListingDraft
} from '../../../core/domains/listings/models/listing.model';


type PaymentReturnState =
  | 'processing'
  | 'published'
  | 'error';


@Component({
  selector: 'app-payment-return',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './payment-return.component.html',
  styleUrl: './payment-return.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentReturnComponent
  implements OnInit, OnDestroy {

  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  private unsubscribeFromDraft:
    Unsubscribe | null = null;

  private unsubscribeFromAuth:
    Unsubscribe | null = null;

  private redirectTimer:
    ReturnType<typeof setTimeout> | null = null;

  protected readonly pageState =
    signal<PaymentReturnState>('processing');

  protected readonly errorMessage =
    signal('');


  ngOnInit(): void {
    const listingUid =
      this.route.snapshot.paramMap
        .get('listingUid')
        ?.trim();

    if (!listingUid) {
      this.showError(
        'The listing could not be identified.'
      );

      return;
    }

    this.unsubscribeFromAuth =
      onAuthStateChanged(
        auth,
        user => {
          if (!user) {
            this.showError(
              'Your authentication session could not be found.'
            );

            return;
          }

          this.unsubscribeFromAuth?.();
          this.unsubscribeFromAuth = null;

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

                if (draft.sellerUid !== user.uid) {
                  this.showError(
                    'You do not have permission to access this listing.'
                  );

                  return;
                }

                if (
                  draft.publication.status ===
                  'payment_failed' ||
                  draft.publication.paymentStatus ===
                  'failed'
                ) {
                  this.showError(
                    'Stripe could not complete the payment. Please return to the payment page and try again.'
                  );

                  return;
                }

                if (
                  draft.publication.status ===
                  'published' &&
                  draft.publication.paymentStatus ===
                  'paid'
                ) {
                  this.pageState.set('published');

                  if (!this.redirectTimer) {
                    this.redirectTimer =
                      setTimeout(() => {
                        void this.router.navigate(
                          ['/dashboard'],
                          {
                            queryParams: {
                              listingStatus: 'active'
                            },
                            replaceUrl: true
                          }
                        );
                      }, 1500);
                  }

                  return;
                }

                this.pageState.set('processing');
              },

              error => {
                console.error(
                  'The listing publication status could not be monitored.',
                  error
                );

                this.showError(
                  'We could not confirm your listing publication. Please return to your dashboard.'
                );
              }
            );
        }
      );
  }


  ngOnDestroy(): void {
    this.unsubscribeFromDraft?.();
    this.unsubscribeFromAuth?.();

    if (this.redirectTimer) {
      clearTimeout(this.redirectTimer);
    }
  }


  private showError(
    message: string
  ): void {
    this.errorMessage.set(message);
    this.pageState.set('error');
  }
}