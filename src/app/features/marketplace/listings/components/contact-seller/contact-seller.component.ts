import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  input,
  signal
} from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import {
  AuthState
} from '../../../../../core/authentication/state/auth.state';

import {
  ListingInquiryService
} from '../../../../../core/domains/inquiries/services/listing-inquiry.service';

@Component({
  selector: 'app-contact-seller',
  standalone: true,
  imports: [
    ReactiveFormsModule
  ],
  templateUrl:
    './contact-seller.component.html',
  styleUrl:
    './contact-seller.component.scss',
  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class ContactSellerComponent
implements OnInit {
  private readonly fb =
    inject(FormBuilder);

  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  private readonly authState =
    inject(AuthState);

  private readonly listingInquiryService =
    inject(ListingInquiryService);

  readonly listingUid =
    input.required<string>();

  protected readonly isFormOpen =
    signal(false);

  protected readonly isSubmitting =
    signal(false);

  protected readonly submitError =
    signal('');

  protected readonly successMessage =
    signal('');

  protected readonly inquiryReferenceNumber =
    signal('');

  protected readonly form =
    this.fb.nonNullable.group({
      message: [
        '',
        [
          Validators.required,
          Validators.minLength(20),
          Validators.maxLength(2_000)
        ]
      ]
    });

  ngOnInit(): void {
    const shouldOpen =
      this.route.snapshot.queryParamMap.get(
        'contactSeller'
      ) === 'true';

    if (
      shouldOpen &&
      this.authState.uid()
    ) {
      this.isFormOpen.set(true);

      void this.clearContactSellerQueryParameter();
    }
  }

  protected async openForm():
    Promise<void> {
    this.submitError.set('');
    this.successMessage.set('');

    if (!this.authState.uid()) {
      const returnUrl =
        this.router.createUrlTree(
          [
            '/listings',
            this.listingUid()
          ],
          {
            queryParams: {
              contactSeller: true
            }
          }
        ).toString();

      await this.router.navigate(
        ['/sign-in'],
        {
          queryParams: {
            returnUrl
          }
        }
      );

      return;
    }

    this.isFormOpen.set(true);
  }

  protected closeForm(): void {
    if (this.isSubmitting()) {
      return;
    }

    this.isFormOpen.set(false);
    this.submitError.set('');

    this.form.reset({
      message: ''
    });

    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  protected async submitInquiry():
    Promise<void> {
    this.submitError.set('');
    this.successMessage.set('');

    this.form.markAllAsTouched();

    if (
      this.form.invalid ||
      this.isSubmitting()
    ) {
      return;
    }

    if (!this.authState.uid()) {
      await this.openForm();
      return;
    }

    this.isSubmitting.set(true);

    try {
      const response =
        await this.listingInquiryService
          .createListingInquiry({
            listingUid:
              this.listingUid(),

            message:
              this.form.controls
                .message.value
                .trim()
          });

      this.inquiryReferenceNumber.set(
        response.inquiryReferenceNumber
      );

      this.successMessage.set(
        'Your message was sent to the seller.'
      );

      this.form.reset({
        message: ''
      });

      this.form.markAsPristine();
      this.form.markAsUntouched();
    } catch (error: unknown) {
      console.error(
        'Unable to send listing inquiry:',
        error
      );

      this.submitError.set(
        this.getErrorMessage(error)
      );
    } finally {
      this.isSubmitting.set(false);
    }
  }

  protected resetInquiryForm(): void {
    this.successMessage.set('');
    this.inquiryReferenceNumber.set('');
    this.submitError.set('');
    this.isFormOpen.set(true);

    this.form.reset({
      message: ''
    });

    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  protected startAnotherInquiry():
    void {
    this.resetInquiryForm();
  }

  protected get messageLength():
    number {
    return (
      this.form.controls
        .message.value.length
    );
  }

  private async clearContactSellerQueryParameter():
    Promise<void> {
    await this.router.navigate(
      [],
      {
        relativeTo: this.route,

        queryParams: {
          contactSeller: null
        },

        queryParamsHandling: 'merge',
        replaceUrl: true
      }
    );
  }

  private getErrorMessage(
    error: unknown
  ): string {
    if (
      error !== null &&
      typeof error === 'object' &&
      'message' in error &&
      typeof error.message ===
        'string'
    ) {
      const message =
        error.message.trim();

      if (message) {
        return message;
      }
    }

    return (
      'We could not send your message. Please try again.'
    );
  }
}