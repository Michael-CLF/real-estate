import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal
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
  distinctUntilChanged,
  from,
  map,
  of,
  shareReplay,
  startWith,
  switchMap
} from 'rxjs';

import {
  ProfessionalCategory
} from '../../core/domains/users/models/professional-type';

import {
  ProfessionalUser
} from '../../core/domains/users/models/professional-user.model';

import {
  FirebaseProfessionalRepository
} from '../../core/infrastructure/firebase/firebase-professional.repository';

import {
  ProfessionalDirectoryCardComponent
} from './components/professional-directory-card/professional-directory-card.component';

type DirectoryCategory =
  | 'all'
  | ProfessionalCategory;

interface CategoryOption {
  value: DirectoryCategory;
  label: string;
  description: string;
  icon: string;
}

interface ProfessionalDirectoryState {
  professionals: ProfessionalUser[];
  isLoading: boolean;
  hasError: boolean;
}

@Component({
  selector: 'app-professionals',
  standalone: true,
  imports: [
    RouterLink,
    ProfessionalDirectoryCardComponent
  ],
  templateUrl:
    './professionals.component.html',
  styleUrl:
    './professionals.component.scss',
  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class ProfessionalsComponent {
  private readonly route =
    inject(ActivatedRoute);

  private readonly professionalRepository =
    inject(FirebaseProfessionalRepository);

  private readonly stateSlug$ =
    this.route.paramMap.pipe(
      map(
        parameters =>
          parameters.get('stateSlug') ??
          'north-carolina'
      ),

      distinctUntilChanged(),

      shareReplay({
        bufferSize: 1,
        refCount: true
      })
    );

  protected readonly searchTerm =
    signal('');

  protected readonly selectedCategory =
    signal<DirectoryCategory>('all');

  protected readonly stateSlug =
    toSignal(
      this.stateSlug$,
      {
        initialValue:
          'north-carolina'
      }
    );

  private readonly directoryState =
    toSignal(
      this.stateSlug$.pipe(
        switchMap(stateSlug =>
          from(
            this.professionalRepository
              .getActiveProfessionalsByState(
                stateSlug
              )
          ).pipe(
            map(
              professionals => ({
                professionals,
                isLoading: false,
                hasError: false
              })
            ),

            catchError(error => {
              console.error(
                'Unable to load professional directory:',
                error
              );

              return of({
                professionals:
                  [] as ProfessionalUser[],

                isLoading: false,
                hasError: true
              });
            }),

            startWith({
              professionals:
                [] as ProfessionalUser[],

              isLoading: true,
              hasError: false
            })
          )
        )
      ),
      {
        initialValue: {
          professionals:
            [] as ProfessionalUser[],

          isLoading: true,
          hasError: false
        }
      }
    );

  protected readonly isLoading =
    computed(
      () =>
        this.directoryState().isLoading
    );

  protected readonly hasLoadError =
    computed(
      () =>
        this.directoryState().hasError
    );

  protected readonly stateName =
    computed(() => {
      switch (this.stateSlug()) {
        case 'north-carolina':
          return 'North Carolina';

        default:
          return this.stateSlug()
            .split('-')
            .map(
              word =>
                word.charAt(0).toUpperCase() +
                word.slice(1)
            )
            .join(' ');
      }
    });

  protected readonly stateAbbreviation =
    computed(() => {
      switch (this.stateSlug()) {
        case 'north-carolina':
          return 'NC';

        default:
          return '';
      }
    });

  protected readonly categories:
    ReadonlyArray<CategoryOption> = [
      {
        value: 'all',
        label: 'All professionals',
        description:
          'View every available professional',
        icon:
          'fa-solid fa-border-all'
      },
      {
        value: 'financing',
        label: 'Financing',
        description:
          'Banks, credit unions and mortgage providers',
        icon:
          'fa-solid fa-building-columns'
      },
      {
        value: 'legal',
        label: 'Legal',
        description:
          'Real estate and closing attorneys',
        icon:
          'fa-solid fa-scale-balanced'
      },
      {
        value: 'title_and_closing',
        label: 'Title and closing',
        description:
          'Title, escrow and settlement services',
        icon:
          'fa-solid fa-file-signature'
      },
      {
        value: 'inspections',
        label: 'Inspections',
        description:
          'Home and specialty inspection services',
        icon:
          'fa-solid fa-magnifying-glass'
      },
      {
        value: 'property_and_valuation',
        label: 'Property and valuation',
        description:
          'Appraisers, surveyors and engineers',
        icon:
          'fa-solid fa-chart-column'
      },
      {
        value: 'home_preparation',
        label: 'Home preparation',
        description:
          'Photography, staging and property services',
        icon:
          'fa-solid fa-screwdriver-wrench'
      },
      {
        value: 'insurance_and_protection',
        label: 'Insurance and protection',
        description:
          'Property coverage and home warranties',
        icon:
          'fa-solid fa-shield-halved'
      },
      {
        value: 'moving_and_storage',
        label: 'Moving and storage',
        description:
          'Moving, packing and storage companies',
        icon:
          'fa-solid fa-truck-moving'
      }
    ];

  protected readonly stateProfessionals =
    computed(() =>
      this.directoryState()
        .professionals
        .filter(
          professional =>
            professional.status ===
              'active' &&
            professional.stateSlug ===
              this.stateSlug()
        )
    );

  protected readonly filteredProfessionals =
    computed(() => {
      const searchTerm =
        this.normalizeSearchValue(
          this.searchTerm()
        );

      const selectedCategory =
        this.selectedCategory();

      return this.stateProfessionals()
        .filter(professional => {
          if (
            selectedCategory !== 'all' &&
            professional.category !==
              selectedCategory
          ) {
            return false;
          }

          if (!searchTerm) {
            return true;
          }

          const searchableValue =
            this.normalizeSearchValue(
              [
                professional.businessName,
                professional.category,
                professional.professionalType,
                ...professional.specialties,
                professional.stateName,
                professional.stateAbbreviation,
                ...professional.counties,
                ...professional.cities
              ].join(' ')
            );

          return searchableValue.includes(
            searchTerm
          );
        })
        .sort(
          (
            firstProfessional,
            secondProfessional
          ) => {
            const firstSponsored =
              firstProfessional.placement ===
              'sponsored'
                ? 1
                : 0;

            const secondSponsored =
              secondProfessional.placement ===
              'sponsored'
                ? 1
                : 0;

            if (
              firstSponsored !==
              secondSponsored
            ) {
              return (
                secondSponsored -
                firstSponsored
              );
            }

            return firstProfessional
              .businessName
              .localeCompare(
                secondProfessional
                  .businessName
              );
          }
        );
    });

  protected readonly hasActiveFilters =
    computed(
      () =>
        Boolean(
          this.searchTerm().trim()
        ) ||
        this.selectedCategory() !==
          'all'
    );

  protected updateSearchTerm(
    event: Event
  ): void {
    const input =
      event.target as HTMLInputElement;

    this.searchTerm.set(
      input.value
    );
  }

  protected selectCategory(
    category: DirectoryCategory
  ): void {
    this.selectedCategory.set(
      category
    );
  }

  protected clearFilters(): void {
    this.searchTerm.set('');
    this.selectedCategory.set('all');
  }

  protected getCategoryCount(
    category: DirectoryCategory
  ): number {
    if (category === 'all') {
      return this.stateProfessionals()
        .length;
    }

    return this.stateProfessionals()
      .filter(
        professional =>
          professional.category ===
          category
      )
      .length;
  }

  private normalizeSearchValue(
    value: string
  ): string {
    return value
      .trim()
      .toLowerCase()
      .replaceAll('_', ' ')
      .replace(/\s+/g, ' ');
  }
}