import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
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
  RouterLink
} from '@angular/router';

import {
  getDownloadURL,
  ref,
  uploadBytes
} from 'firebase/storage';

import {
  ProfessionalUser
} from '../../../../core/domains/users/models/professional-user.model';

import {
  AuthService
} from '../../../../core/authentication/services/auth.service';

import {
  FirebaseProfessionalRepository
} from '../../../../core/infrastructure/firebase/firebase-professional.repository';

import {
  storage
} from '../../../../core/infrastructure/firebase/firebase';


const MAXIMUM_LOGO_SIZE_BYTES =
  2 * 1024 * 1024;

const ALLOWED_LOGO_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp'
] as const;


@Component({
  selector:
    'app-professional-profile-setup',

  standalone: true,

  imports: [
    ReactiveFormsModule,
    RouterLink
  ],

  templateUrl:
    './professional-profile-setup.component.html',

  styleUrl:
    './professional-profile-setup.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class ProfessionalProfileSetupComponent
  implements OnInit, OnDestroy {

  private readonly formBuilder =
    inject(FormBuilder);

  private readonly authService =
    inject(AuthService);

  private readonly professionalRepository =
    inject(FirebaseProfessionalRepository);

  private activationTimer:
    ReturnType<typeof setTimeout> |
    undefined;

  private readonly maximumActivationAttempts =
    10;

  protected readonly professional =
    signal<ProfessionalUser | null>(
      null
    );

  protected readonly isLoading =
    signal(true);

  protected readonly isSaving =
    signal(false);

  protected readonly isUploadingLogo =
    signal(false);

  protected readonly errorMessage =
    signal('');

  protected readonly successMessage =
    signal('');

  protected readonly profileForm =
    this.formBuilder.nonNullable.group({
      website: [
        '',
        [
          Validators.required,
          Validators.maxLength(500),
          Validators.pattern(
            /^https?:\/\/[^\s]+\.[^\s]+$/i
          )
        ]
      ],

      description: [
        '',
        [
          Validators.required,
          Validators.minLength(40),
          Validators.maxLength(2000)
        ]
      ]
    });

  ngOnInit(): void {
    void this.loadProfessionalProfile(
      0
    );
  }

  ngOnDestroy(): void {
    if (this.activationTimer) {
      clearTimeout(
        this.activationTimer
      );
    }
  }

  protected async saveProfile():
    Promise<void> {
    const professional =
      this.professional();

    if (
      !professional ||
      this.profileForm.invalid ||
      this.isSaving()
    ) {
      this.profileForm.markAllAsTouched();
      this.focusFirstInvalidControl();

      return;
    }

    if (
      professional.subscriptionStatus !==
      'profile'
    ) {
      this.errorMessage.set(
        'Stripe has not activated the Full Business Profile yet.'
      );

      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      const values =
        this.profileForm.getRawValue();

      await this.professionalRepository
        .updateProfessional(
          professional.uid,
          {
            website:
              values.website.trim(),

            description:
              values.description.trim()
          }
        );

      this.professional.update(
        currentProfessional =>
          currentProfessional
            ? {
              ...currentProfessional,

              website:
                values.website.trim(),

              description:
                values.description.trim(),

              updatedAt:
                new Date()
            }
            : null
      );

      /*
       * The saved values are now the new baseline.
       * Save remains disabled until another change occurs.
       */
      this.profileForm.markAsPristine();
      this.profileForm.markAsUntouched();

      this.successMessage.set(
        'Your Full Business Profile has been saved.'
      );

      this.successMessage.set(
        'Your Full Business Profile has been saved.'
      );

      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } catch (error) {
      console.error(
        'Unable to save professional profile:',
        error
      );

      this.errorMessage.set(
        this.getErrorMessage(
          error,
          'We could not save your business profile.'
        )
      );
    } finally {
      this.isSaving.set(false);
    }
  }

  protected async uploadLogo(
    event: Event
  ): Promise<void> {
    const input =
      event.target as HTMLInputElement;

    const file =
      input.files?.[0];

    if (!file) {
      return;
    }

    const professional =
      this.professional();

    const firebaseUser =
      this.authService.currentUser;

    if (
      !professional ||
      !firebaseUser
    ) {
      this.errorMessage.set(
        'Your professional profile could not be identified.'
      );

      input.value = '';

      return;
    }

    if (
      professional.subscriptionStatus !==
      'profile'
    ) {
      this.errorMessage.set(
        'A Full Business Profile subscription is required to upload a logo.'
      );

      input.value = '';

      return;
    }

    if (
      !ALLOWED_LOGO_TYPES.includes(
        file.type as
        typeof ALLOWED_LOGO_TYPES[number]
      )
    ) {
      this.errorMessage.set(
        'Select a JPG, PNG, or WebP image.'
      );

      input.value = '';

      return;
    }

    if (
      file.size >
      MAXIMUM_LOGO_SIZE_BYTES
    ) {
      this.errorMessage.set(
        'The logo must be no larger than 2 MB.'
      );

      input.value = '';

      return;
    }

    this.isUploadingLogo.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      const fileExtension =
        this.getLogoFileExtension(
          file.type
        );

      const storagePath =
        [
          'professional-images',
          firebaseUser.uid,
          professional.uid,
          `logo.${fileExtension}`
        ].join('/');

      const logoReference =
        ref(
          storage,
          storagePath
        );

      await uploadBytes(
        logoReference,
        file,
        {
          contentType:
            file.type,

          customMetadata: {
            ownerUid:
              firebaseUser.uid,

            professionalUid:
              professional.uid,

            imageType:
              'business-logo'
          }
        }
      );

      const logoUrl =
        await getDownloadURL(
          logoReference
        );

      await this.professionalRepository
        .updateProfessional(
          professional.uid,
          {
            logoUrl
          }
        );

      this.professional.update(
        currentProfessional =>
          currentProfessional
            ? {
              ...currentProfessional,
              logoUrl,
              updatedAt:
                new Date()
            }
            : null
      );

      this.successMessage.set(
        'Your business logo has been uploaded.'
      );
    } catch (error) {
      console.error(
        'Unable to upload professional logo:',
        error
      );

      this.errorMessage.set(
        this.getErrorMessage(
          error,
          'We could not upload your business logo.'
        )
      );
    } finally {
      this.isUploadingLogo.set(false);
      input.value = '';
    }
  }

  protected descriptionLength():
    number {
    return this.profileForm.controls
      .description
      .value
      .length;
  }

  private async loadProfessionalProfile(
    activationAttempt: number
  ): Promise<void> {
    const firebaseUser =
      this.authService.currentUser;

    if (!firebaseUser) {
      this.isLoading.set(false);

      this.errorMessage.set(
        'You must be signed in to complete your business profile.'
      );

      return;
    }

    try {
      const professional =
        await this.professionalRepository
          .getProfessionalByOwnerUid(
            firebaseUser.uid
          );

      if (!professional) {
        this.isLoading.set(false);

        this.errorMessage.set(
          'A professional directory listing could not be found for your account.'
        );

        return;
      }

      if (
        professional.subscriptionStatus !==
        'profile' &&
        activationAttempt <
        this.maximumActivationAttempts
      ) {
        this.successMessage.set(
          'Stripe confirmed your return. We are activating your Full Business Profile.'
        );

        this.activationTimer =
          setTimeout(
            () => {
              void this.loadProfessionalProfile(
                activationAttempt + 1
              );
            },
            1500
          );

        return;
      }

      if (
        professional.subscriptionStatus !==
        'profile'
      ) {
        this.isLoading.set(false);

        this.successMessage.set('');

        this.errorMessage.set(
          'Your payment is still being confirmed. Refresh this page in a moment. You will not need to register again.'
        );

        return;
      }

      this.professional.set(
        professional
      );

      this.profileForm.patchValue({
        website:
          professional.website ?? '',

        description:
          professional.description ?? ''
      });

      this.profileForm.markAsPristine();
      this.profileForm.markAsUntouched();

      this.successMessage.set('');
      this.errorMessage.set('');
      this.isLoading.set(false);
    } catch (error) {
      console.error(
        'Unable to load professional profile:',
        error
      );

      this.isLoading.set(false);

      this.errorMessage.set(
        this.getErrorMessage(
          error,
          'We could not load your professional profile.'
        )
      );
    }
  }

  private getLogoFileExtension(
    mimeType: string
  ): 'jpg' | 'png' | 'webp' {
    switch (mimeType) {
      case 'image/png':
        return 'png';

      case 'image/webp':
        return 'webp';

      case 'image/jpeg':
      default:
        return 'jpg';
    }
  }

  private getErrorMessage(
    error: unknown,
    fallback: string
  ): string {
    if (
      error instanceof Error &&
      error.message
    ) {
      return error.message;
    }

    return fallback;
  }

  private focusFirstInvalidControl():
    void {
    window.setTimeout(() => {
      const firstInvalidElement =
        document.querySelector<HTMLElement>(
          `
            .professional-profile-setup
            input.ng-invalid,
            .professional-profile-setup
            textarea.ng-invalid
          `
        );

      firstInvalidElement?.focus();
    });
  }
}