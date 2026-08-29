import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input
} from '@angular/core';
import {
  RouterLink
} from '@angular/router';

import {
  PROFESSIONAL_CATEGORY_LABELS,
  PROFESSIONAL_TYPE_LABELS
} from '../../../../core/domains/users/models/professional-type';

import {
  ProfessionalUser
} from '../../../../core/domains/users/models/professional-user.model';

@Component({
  selector: 'app-professional-directory-card',
  standalone: true,
  imports: [
    RouterLink
  ],
  templateUrl:
    './professional-directory-card.component.html',
  styleUrl:
    './professional-directory-card.component.scss',
  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class ProfessionalDirectoryCardComponent {
  readonly professional =
    input.required<ProfessionalUser>();

  protected readonly categoryLabel =
    computed(() =>
      PROFESSIONAL_CATEGORY_LABELS[
      this.professional().category
      ]
    );

  protected readonly professionalTypeLabel =
    computed(() =>
      PROFESSIONAL_TYPE_LABELS[
      this.professional().professionalType
      ]
    );

  protected readonly categoryClass =
    computed(() =>
      `professional-card--${this.professional()
        .category
        .replaceAll('_', '-')
      }`
    );

  protected readonly serviceArea =
    computed(() => {
      const professional =
        this.professional();

      if (
        professional.serviceAreaType ===
        'statewide'
      ) {
        return `Statewide in ${professional.stateName
          }`;
      }

      if (
        professional.serviceAreaType ===
        'counties'
      ) {
        return professional.counties
          .map(county => `${county} County`)
          .join(', ');
      }

      return professional.cities.join(', ');
    });

  protected readonly visibleSpecialties =
    computed(() =>
      this.professional()
        .specialties
        .slice(0, 2)
    );

  protected readonly additionalSpecialtyCount =
    computed(() =>
      Math.max(
        this.professional().specialties.length - 2,
        0
      )
    );

  protected readonly hasFullProfile =
    computed(() =>
      this.professional().subscriptionStatus ===
      'profile' &&
      Boolean(
        this.professional().profileSlug
      )
    );

  protected readonly formattedTelephone =
    computed(() => {
      const originalTelephone =
        this.professional().phone.trim();

      let digits =
        originalTelephone.replace(
          /\D/g,
          ''
        );

      /*
       * Remove the North American country code before
       * formatting the visible number.
       */
      if (
        digits.length === 11 &&
        digits.startsWith('1')
      ) {
        digits =
          digits.slice(1);
      }

      if (digits.length !== 10) {
        return originalTelephone;
      }

      return [
        `(${digits.slice(0, 3)})`,
        digits.slice(3, 6) +
        '-' +
        digits.slice(6)
      ].join(' ');
    });

  protected readonly telephoneHref =
    computed(() => {
      const originalTelephone =
        this.professional().phone.trim();

      const digits =
        originalTelephone.replace(
          /\D/g,
          ''
        );

      if (digits.length === 10) {
        return `tel:+1${digits}`;
      }

      if (
        digits.length === 11 &&
        digits.startsWith('1')
      ) {
        return `tel:+${digits}`;
      }

      return `tel:${originalTelephone}`;
    });

  protected readonly emailHref =
    computed(() =>
      `mailto:${this.professional().email}`
    );
}