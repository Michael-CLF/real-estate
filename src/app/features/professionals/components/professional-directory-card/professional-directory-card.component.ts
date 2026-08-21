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
      `professional-card--${
        this.professional()
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
        return `Statewide in ${
          professional.stateName
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

  protected readonly telephoneHref =
    computed(() => {
      const telephone =
        this.professional().phone.replace(
          /[^+\d]/g,
          ''
        );

      return `tel:${telephone}`;
    });

  protected readonly emailHref =
    computed(() =>
      `mailto:${this.professional().email}`
    );
}