import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject
} from '@angular/core';

import {
  ActivatedRoute,
  RouterLink
} from '@angular/router';

import {
  toSignal
} from '@angular/core/rxjs-interop';

import {
  catchError,
  from,
  map,
  of,
  startWith,
  switchMap
} from 'rxjs';

import {
  PROFESSIONAL_CATEGORY_LABELS,
  PROFESSIONAL_TYPE_LABELS
} from '../../../../core/domains/users/models/professional-type';

import {
  ProfessionalUser
} from '../../../../core/domains/users/models/professional-user.model';

import {
  FirebaseProfessionalRepository
} from '../../../../core/infrastructure/firebase/firebase-professional.repository';

interface ProfessionalProfileState {
  professional:
    ProfessionalUser | null;

  isLoading: boolean;
  hasError: boolean;
}

@Component({
  selector: 'app-professional-profile',
  standalone: true,
  imports: [
    RouterLink
  ],
  templateUrl:
    './professional-profile.component.html',
  styleUrl:
    './professional-profile.component.scss',
  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class ProfessionalProfileComponent {
  private readonly route =
    inject(ActivatedRoute);

  private readonly professionalRepository =
    inject(FirebaseProfessionalRepository);

  private readonly routeParameters$ =
    this.route.paramMap.pipe(
      map(parameters => ({
        stateSlug:
          parameters.get('stateSlug') ??
          'north-carolina',

        professionalSlug:
          parameters.get(
            'professionalSlug'
          ) ?? ''
      }))
    );

  private readonly routeParameters =
    toSignal(
      this.routeParameters$,
      {
        initialValue: {
          stateSlug:
            'north-carolina',

          professionalSlug: ''
        }
      }
    );

  private readonly profileState =
    toSignal(
      this.routeParameters$.pipe(
        switchMap(
          ({
            stateSlug,
            professionalSlug
          }) =>
            from(
              this.professionalRepository
                .getProfessionalByProfileSlug(
                  stateSlug,
                  professionalSlug
                )
            ).pipe(
              map(
                professional => ({
                  professional,
                  isLoading: false,
                  hasError: false
                })
              ),

              catchError(error => {
                console.error(
                  'Unable to load professional profile:',
                  error
                );

                return of({
                  professional: null,

                  isLoading: false,
                  hasError: true
                });
              }),

              startWith({
                professional: null,

                isLoading: true,
                hasError: false
              })
            )
        )
      ),
      {
        initialValue: {
          professional: null,

          isLoading: true,
          hasError: false
        }
      }
    );

  protected readonly stateSlug =
    computed(
      () =>
        this.routeParameters()
          .stateSlug
    );

  protected readonly professional =
    computed(
      () =>
        this.profileState()
          .professional
    );

  protected readonly isLoading =
    computed(
      () =>
        this.profileState()
          .isLoading
    );

  protected readonly hasLoadError =
    computed(
      () =>
        this.profileState()
          .hasError
    );

  protected readonly categoryLabel =
    computed(() => {
      const professional =
        this.professional();

      return professional
        ? PROFESSIONAL_CATEGORY_LABELS[
            professional.category
          ]
        : '';
    });

  protected readonly professionalTypeLabel =
    computed(() => {
      const professional =
        this.professional();

      return professional
        ? PROFESSIONAL_TYPE_LABELS[
            professional.professionalType
          ]
        : '';
    });

  protected readonly serviceArea =
    computed(() => {
      const professional =
        this.professional();

      if (!professional) {
        return '';
      }

      switch (
        professional.serviceAreaType
      ) {
        case 'counties':
          return professional.counties
            .map(county =>
              county
                .toLowerCase()
                .endsWith('county')
                ? county
                : `${county} County`
            )
            .join(', ');

        case 'cities':
          return professional.cities
            .join(', ');

        case 'statewide':
        default:
          return (
            `Statewide in ` +
            professional.stateName
          );
      }
    });

  protected readonly initials =
    computed(() => {
      const professional =
        this.professional();

      if (!professional) {
        return '';
      }

      return professional.businessName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(
          word =>
            word.charAt(0)
        )
        .join('')
        .toUpperCase();
    });

  protected readonly formattedTelephone =
    computed(() => {
      const phone =
        this.professional()
          ?.phone
          .replace(/\D/g, '');

      if (!phone) {
        return '';
      }

      if (phone.length === 10) {
        return (
          `(${phone.slice(0, 3)}) ` +
          `${phone.slice(3, 6)}-` +
          `${phone.slice(6)}`
        );
      }

      return this.professional()
        ?.phone ?? '';
    });

  protected readonly telephoneHref =
    computed(() => {
      const phone =
        this.professional()?.phone;

      if (!phone) {
        return '';
      }

      return `tel:${phone.replace(
        /[^+\d]/g,
        ''
      )}`;
    });

  protected readonly emailHref =
    computed(() => {
      const email =
        this.professional()?.email;

      return email
        ? `mailto:${email}`
        : '';
    });

  protected readonly categoryClass =
    computed(() => {
      const category =
        this.professional()?.category;

      return category
        ? `professional-profile--${
            category.replaceAll(
              '_',
              '-'
            )
          }`
        : '';
    });

  protected readonly isIndependentAppraiser =
    computed(
      () =>
        this.professional()
          ?.professionalType ===
        'independent_appraiser'
    );
}