import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';

import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';

import {
  toSignal
} from '@angular/core/rxjs-interop';

import {
  catchError,
  combineLatest,
  distinctUntilChanged,
  from,
  map,
  of,
  startWith,
  switchMap
} from 'rxjs';

import {
  STATES
} from '../../core/configuration/states.config';

import {
  PageSeoService
} from '../../core/seo/page-seo.service';

import {
  ZipCodeService
} from '../../core/infrastructure/zip/zip-code.service';

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

@Component({
  selector: 'app-professionals',
  standalone: true,

  imports: [
    RouterLink,
    ProfessionalDirectoryCardComponent
  ],

  templateUrl: './professionals.component.html',
  styleUrl: './professionals.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class ProfessionalsComponent {
  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  private readonly professionalRepository =
    inject(FirebaseProfessionalRepository);

  private readonly zipService =
    inject(ZipCodeService);

  private readonly pageSeo =
    inject(PageSeoService);

  protected readonly states = STATES;

  protected readonly searchTerm =
    signal('');

  protected readonly selectedCategory =
    signal<DirectoryCategory>('all');

  protected readonly draftState =
    signal('');

  protected readonly draftCity =
    signal('');

  private readonly locationsLoaded =
    signal(false);

  protected readonly locationWarning =
    signal('');

  protected readonly categories:
    ReadonlyArray<CategoryOption> = [
      {
        value: 'all',
        label: 'All professionals',
        description: 'View every available professional',
        icon: 'fa-solid fa-border-all'
      },
      {
        value: 'financing',
        label: 'Financing',
        description:
          'Banks, credit unions and mortgage providers',
        icon: 'fa-solid fa-building-columns'
      },
      {
        value: 'legal',
        label: 'Legal',
        description:
          'Real estate and closing attorneys',
        icon: 'fa-solid fa-scale-balanced'
      },
      {
        value: 'title_and_closing',
        label: 'Title and closing',
        description:
          'Title, escrow and settlement services',
        icon: 'fa-solid fa-file-signature'
      },
      {
        value: 'inspections',
        label: 'Inspections',
        description:
          'Home and specialty inspection services',
        icon: 'fa-solid fa-magnifying-glass'
      },
      {
        value: 'property_and_valuation',
        label: 'Property and valuation',
        description:
          'Appraisers, surveyors and engineers',
        icon: 'fa-solid fa-chart-column'
      },
      {
        value: 'home_preparation',
        label: 'Home preparation',
        description:
          'Photography, staging and property services',
        icon: 'fa-solid fa-screwdriver-wrench'
      },
      {
        value: 'insurance_and_protection',
        label: 'Insurance and protection',
        description:
          'Property coverage and home warranties',
        icon: 'fa-solid fa-shield-halved'
      },
      {
        value: 'moving_and_storage',
        label: 'Moving and storage',
        description:
          'Moving, packing and storage companies',
        icon: 'fa-solid fa-truck-moving'
      }
    ];

  private readonly filters = toSignal(
    combineLatest([
      this.route.paramMap,
      this.route.queryParamMap
    ]).pipe(
      map(([params, query]) => ({
        state:
          params.get('stateSlug') ??
          query.get('state') ??
          '',

        city:
          query.get('city') ?? '',

        q:
          query.get('q') ?? '',

        category:
          query.get('category') ?? 'all'
      }))
    ),
    {
      initialValue: {
        state: '',
        city: '',
        q: '',
        category: 'all'
      }
    }
  );

  protected readonly stateSlug = computed(() =>
    this.filters().state
  );

  protected readonly stateName = computed(() =>
    STATES.find(state =>
      state.slug === this.stateSlug()
    )?.name ?? 'United States'
  );

  protected readonly stateAbbreviation = computed(() =>
    STATES.find(state =>
      state.slug === this.stateSlug()
    )?.abbreviation ?? 'US'
  );

  protected readonly registrationLink = computed(() =>
    this.draftState()
      ? [
          '/professionals/register',
          this.draftState()
        ]
      : [
          '/professionals/register'
        ]
  );

  private readonly directoryState = toSignal(
    combineLatest([
      this.route.paramMap,
      this.route.queryParamMap
    ]).pipe(
      map(([params, query]) =>
        params.get('stateSlug') ??
        query.get('state') ??
        ''
      ),

      distinctUntilChanged(),

      switchMap(state =>
        from(
          this.professionalRepository
            .getActiveDirectoryProfessionals(state)
        ).pipe(
          map(professionals => ({
            professionals,
            isLoading: false,
            hasError: false
          })),

          catchError(() =>
            of({
              professionals:
                [] as ProfessionalUser[],
              isLoading: false,
              hasError: true
            })
          ),

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

  protected readonly isLoading = computed(() =>
    this.directoryState().isLoading
  );

  protected readonly hasLoadError = computed(() =>
    this.directoryState().hasError
  );

  protected readonly citySuggestions = computed(() => {
    this.locationsLoaded();

    return this.draftState()
      ? this.zipService.citiesForState(
          this.draftState()
        )
      : [];
  });

  protected readonly stateProfessionals = computed(() =>
    this.directoryState()
      .professionals
      .filter(professional =>
        professional.status === 'active' &&
        (
          !this.stateSlug() ||
          professional.stateSlug === this.stateSlug()
        )
      )
  );

  protected readonly filteredProfessionals = computed(() => {
    const filters = this.filters();

    const term =
      this.normalizeSearchValue(filters.q);

    const city =
      this.normalizeSearchValue(filters.city);

    this.locationsLoaded();

    const counties =
      this.zipService
        .countiesForCity(
          filters.state,
          filters.city
        )
        .map(value =>
          this.normalizeCounty(value)
        );

    return this.stateProfessionals()
      .filter(professional => {
        if (
          filters.category !== 'all' &&
          professional.category !== filters.category
        ) {
          return false;
        }

        if (
          city &&
          professional.serviceAreaType !== 'statewide' &&
          !professional.cities.some(value =>
            this.normalizeSearchValue(value) === city
          ) &&
          !professional.counties.some(value =>
            counties.includes(
              this.normalizeCounty(value)
            )
          )
        ) {
          return false;
        }

        const searchableValue =
          this.normalizeSearchValue(
            [
              professional.businessName,
              professional.professionalType,
              professional.category,
              ...professional.specialties,
              ...professional.cities,
              ...professional.counties
            ].join(' ')
          );

        return !term ||
          searchableValue.includes(term);
      })
      .sort((first, second) =>
        Number(second.placement === 'sponsored') -
        Number(first.placement === 'sponsored') ||
        first.businessName.localeCompare(
          second.businessName
        )
      );
  });

  protected readonly hasActiveFilters = computed(() =>
    Boolean(
      this.filters().state ||
      this.filters().city ||
      this.filters().q
    ) ||
    this.filters().category !== 'all'
  );

  constructor() {
    effect(() => {
      const filters = this.filters();

      this.draftState.set(filters.state);
      this.draftCity.set(filters.city);
      this.searchTerm.set(filters.q);

      this.selectedCategory.set(
        this.categories.some(category =>
          category.value === filters.category
        )
          ? filters.category as DirectoryCategory
          : 'all'
      );

      this.pageSeo.set(
        'NavStreet Directory | Find Real Estate Professionals',
        'Find real estate professionals by state, city and service category in the NavStreet Directory.'
      );
    });

    void this.zipService
      .load()
      .then(() => {
        this.locationsLoaded.set(true);
      })
      .catch(() => {
        this.locationWarning.set(
          'City suggestions are unavailable. You can still search by city or browse a whole state.'
        );
      });
  }

  protected updateSearchTerm(
    event: Event
  ): void {
    this.searchTerm.set(
      (event.target as HTMLInputElement).value
    );
  }

  protected updateState(
    event: Event
  ): void {
    this.draftState.set(
      (event.target as HTMLSelectElement).value
    );

    this.draftCity.set('');
  }

  protected updateCity(
    event: Event
  ): void {
    this.draftCity.set(
      (event.target as HTMLInputElement).value
    );
  }

  protected selectCategory(
    category: DirectoryCategory
  ): void {
    this.selectedCategory.set(category);
    this.search();
  }

  protected search(
    event?: Event
  ): void {
    event?.preventDefault();

    void this.router.navigate(
      ['/find-a-pro'],
      {
        queryParams: {
          state:
            this.draftState() || null,

          city:
            this.draftState()
              ? this.draftCity().trim() || null
              : null,

          q:
            this.searchTerm().trim() || null,

          category:
            this.selectedCategory() === 'all'
              ? null
              : this.selectedCategory()
        }
      }
    );
  }

  protected clearFilters(): void {
    this.searchTerm.set('');
    this.selectedCategory.set('all');
    this.draftState.set('');
    this.draftCity.set('');

    void this.router.navigate(
      ['/find-a-pro']
    );
  }

  protected getCategoryCount(
    category: DirectoryCategory
  ): number {
    return this.stateProfessionals()
      .filter(professional =>
        category === 'all' ||
        professional.category === category
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

  private normalizeCounty(
    value: string
  ): string {
    return this.normalizeSearchValue(value)
      .replace(/ county$/, '');
  }
}