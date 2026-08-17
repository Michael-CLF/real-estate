import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal
} from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';

import {
  takeUntilDestroyed
} from '@angular/core/rxjs-interop';

import {
  httpsCallable
} from 'firebase/functions';

import {
  AuthService
} from '../../../core/authentication/services/auth.service';

import {
  Listing,
  ListingHoaFeeFrequency
} from '../../../core/domains/listings/models/listing.model';

import {
  ListingService
} from '../../../core/domains/listings/services/listing.service';

import {
  functions
} from '../../../core/infrastructure/firebase/firebase';

interface ListingEditHoaValue {
  hasHoa: boolean;
  feeAmount: number | null;
  feeFrequency:
    ListingHoaFeeFrequency | '';
}

interface ListingEditFormValue {
  listPrice: number;
  description: string;
  hoa: ListingEditHoaValue;
}

interface UpdatePublishedListingChanges {
  listPrice: number;
  description: string;

  hoa: {
    hasHoa: boolean;
    feeAmount: number | null;
    feeFrequency:
      ListingHoaFeeFrequency | null;
  };
}

interface UpdatePublishedListingRequest {
  listingUid: string;
  changes:
    UpdatePublishedListingChanges;
}

interface UpdatePublishedListingResponse {
  listingUid: string;
  updatedFields: string[];
  priceChanged: boolean;
}

@Component({
  selector: 'app-listing-edit',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl:
    './listing-edit.component.html',
  styleUrl:
    './listing-edit.component.scss',
  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class ListingEditComponent
implements OnInit {
  private readonly fb =
    inject(FormBuilder);

  private readonly destroyRef =
    inject(DestroyRef);

  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  private readonly authService =
    inject(AuthService);

  private readonly listingService =
    inject(ListingService);

  private readonly updatePublishedListingFunction =
    httpsCallable<
      UpdatePublishedListingRequest,
      UpdatePublishedListingResponse
    >(
      functions,
      'updatePublishedListing'
    );

  protected readonly listing =
    signal<Listing | null>(null);

  protected readonly isLoading =
    signal(true);

  protected readonly isSaving =
    signal(false);

  protected readonly hasChanges =
    signal(false);

  protected readonly loadError =
    signal('');

  protected readonly saveError =
    signal('');

  protected readonly saveMessage =
    signal('');

  protected readonly priceChanged =
    signal(false);

  protected readonly listingUid =
    this.route.snapshot.paramMap.get(
      'listingUid'
    ) ?? '';

  protected readonly hoaFeeFrequencies: {
    value: ListingHoaFeeFrequency;
    label: string;
  }[] = [
    {
      value: 'monthly',
      label: 'Monthly'
    },
    {
      value: 'quarterly',
      label: 'Quarterly'
    },
    {
      value: 'semi_annually',
      label: 'Semi-Annually'
    },
    {
      value: 'annually',
      label: 'Annually'
    }
  ];

  protected readonly form =
    this.fb.nonNullable.group({
      listPrice: [
        0,
        [
          Validators.required,
          Validators.min(1),
          Validators.max(
            1_000_000_000
          )
        ]
      ],

      description: [
        '',
        [
          Validators.required,
          Validators.minLength(20),
          Validators.maxLength(5_000)
        ]
      ],

      hoa:
        this.fb.nonNullable.group({
          hasHoa: [
            false,
            Validators.required
          ],

          feeAmount: [
            null as number | null,
            [
              Validators.min(0),
              Validators.max(
                1_000_000
              )
            ]
          ],

          feeFrequency: [
            '' as
              ListingHoaFeeFrequency |
              ''
          ]
        })
    });

  async ngOnInit(): Promise<void> {
    this.configureHoaValidation();
    this.watchFormChanges();

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
        'You must be signed in to edit this listing.'
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
          'You do not have permission to edit this listing.'
        );

        return;
      }

      this.listing.set(listing);

      this.populateForm(listing);
    } catch (error: unknown) {
      console.error(
        'Unable to load listing editor:',
        error
      );

      this.loadError.set(
        'We could not load this listing. Please return to listing management and try again.'
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  protected async saveChanges():
    Promise<void> {
    this.saveError.set('');
    this.saveMessage.set('');
    this.priceChanged.set(false);

    this.form.markAllAsTouched();

    if (
      this.form.invalid ||
      this.isSaving()
    ) {
      return;
    }

    this.isSaving.set(true);

    try {
      const formValue =
        this.form.getRawValue();

      const request:
        UpdatePublishedListingRequest = {
          listingUid:
            this.listingUid,

          changes:
            this.createUpdateChanges(
              formValue
            )
        };

      const result =
        await this
          .updatePublishedListingFunction(
            request
          );

      this.priceChanged.set(
        result.data.priceChanged
      );

      if (
        result.data.updatedFields
          .length === 0
      ) {
        this.saveMessage.set(
          'No listing changes were detected.'
        );
      } else if (
        result.data.priceChanged
      ) {
        this.saveMessage.set(
          'Your listing and price history were updated successfully.'
        );
      } else {
        this.saveMessage.set(
          'Your listing was updated successfully.'
        );
      }

      this.applySavedValues(
        formValue
      );

      this.form.markAsPristine();
      this.hasChanges.set(false);
    } catch (error: unknown) {
      console.error(
        'Unable to update published listing:',
        error
      );

      this.saveError.set(
        this.getErrorMessage(error)
      );
    } finally {
      this.isSaving.set(false);
    }
  }

  protected resetChanges(): void {
    const listing =
      this.listing();

    if (!listing) {
      return;
    }

    this.populateForm(listing);

    this.saveError.set('');
    this.saveMessage.set('');
    this.priceChanged.set(false);
  }

  protected async returnToManagement():
    Promise<void> {
    await this.router.navigate([
      '/sell/listings',
      this.listingUid,
      'manage'
    ]);
  }

  protected get descriptionLength():
    number {
    return (
      this.form.controls
        .description.value
        .length
    );
  }

  protected get hasHoa():
    boolean {
    return (
      this.form.controls
        .hoa.controls
        .hasHoa.value
    );
  }

  private configureHoaValidation():
    void {
    const hoaControls =
      this.form.controls.hoa.controls;

    hoaControls.hasHoa.valueChanges
      .pipe(
        takeUntilDestroyed(
          this.destroyRef
        )
      )
      .subscribe(hasHoa => {
        if (hasHoa) {
          hoaControls.feeAmount
            .setValidators([
              Validators.required,
              Validators.min(0),
              Validators.max(
                1_000_000
              )
            ]);

          hoaControls.feeFrequency
            .setValidators([
              Validators.required
            ]);
        } else {
          hoaControls.feeAmount
            .clearValidators();

          hoaControls.feeFrequency
            .clearValidators();

          hoaControls.feeAmount
            .setValue(
              null,
              {
                emitEvent: false
              }
            );

          hoaControls.feeFrequency
            .setValue(
              '',
              {
                emitEvent: false
              }
            );
        }

        hoaControls.feeAmount
          .updateValueAndValidity({
            emitEvent: false
          });

        hoaControls.feeFrequency
          .updateValueAndValidity({
            emitEvent: false
          });
      });
  }

  private watchFormChanges(): void {
    this.form.valueChanges
      .pipe(
        takeUntilDestroyed(
          this.destroyRef
        )
      )
      .subscribe(() => {
        this.hasChanges.set(
          this.form.dirty
        );

        this.saveError.set('');
        this.saveMessage.set('');
        this.priceChanged.set(false);
      });
  }

  private populateForm(
    listing: Listing
  ): void {
    this.form.patchValue(
      {
        listPrice:
          listing.listPrice,

        description:
          listing.description ?? '',

        hoa: {
          hasHoa:
            listing.hoa?.hasHoa ??
            false,

          feeAmount:
            listing.hoa?.feeAmount ??
            null,

          feeFrequency:
            listing.hoa
              ?.feeFrequency ??
            ''
        }
      },
      {
        emitEvent: false
      }
    );

    this.refreshHoaValidators();

    this.form.markAsPristine();
    this.form.markAsUntouched();

    this.hasChanges.set(false);
  }

  private refreshHoaValidators():
    void {
    const hoaControls =
      this.form.controls.hoa.controls;

    const hasHoa =
      hoaControls.hasHoa.value;

    if (hasHoa) {
      hoaControls.feeAmount
        .setValidators([
          Validators.required,
          Validators.min(0),
          Validators.max(
            1_000_000
          )
        ]);

      hoaControls.feeFrequency
        .setValidators([
          Validators.required
        ]);
    } else {
      hoaControls.feeAmount
        .clearValidators();

      hoaControls.feeFrequency
        .clearValidators();
    }

    hoaControls.feeAmount
      .updateValueAndValidity({
        emitEvent: false
      });

    hoaControls.feeFrequency
      .updateValueAndValidity({
        emitEvent: false
      });
  }

  private createUpdateChanges(
    formValue: ListingEditFormValue
  ): UpdatePublishedListingChanges {
    const hasHoa =
      formValue.hoa.hasHoa;

    return {
      listPrice:
        formValue.listPrice,

      description:
        formValue.description.trim(),

      hoa: {
        hasHoa,

        feeAmount:
          hasHoa
            ? formValue.hoa
              .feeAmount
            : null,

        feeFrequency:
          hasHoa
            ? formValue.hoa
              .feeFrequency as
                ListingHoaFeeFrequency
            : null
      }
    };
  }

  private applySavedValues(
    formValue: ListingEditFormValue
  ): void {
    this.listing.update(
      currentListing => {
        if (!currentListing) {
          return currentListing;
        }

        const hasHoa =
          formValue.hoa.hasHoa;

        return {
          ...currentListing,

          listPrice:
            formValue.listPrice,

          description:
            formValue.description.trim(),

          hoa: {
            ...(currentListing.hoa ?? {
              includedItems: []
            }),

            hasHoa,

            ...(hasHoa
              ? {
                feeAmount:
                  formValue.hoa
                    .feeAmount ??
                  undefined,

                feeFrequency:
                  formValue.hoa
                    .feeFrequency ||
                  undefined
              }
              : {
                feeAmount:
                  undefined,

                feeFrequency:
                  undefined
              })
          }
        };
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
      'We could not update this listing. Please try again.'
    );
  }
}