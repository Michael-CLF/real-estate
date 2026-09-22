import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule
} from '@angular/forms';
import {
  ActivatedRoute,
  Router
} from '@angular/router';

import {
  ListingSearchFilters
} from '../../../../../core/domains/marketplace/models/listing-search-filters.model';
import {
  PROPERTY_TYPE_OPTIONS,
  PropertyType
} from '../../../../../core/domains/property/models/property-type.type';

interface SearchFilterFormValue {
  location: string;
  minimumPrice: number | null;
  maximumPrice: number | null;
  minimumBedrooms: number | null;
  minimumBathrooms: number | null;
  propertyType: PropertyType | '';
}

const STATE_SLUGS: Readonly<Record<string, string>> = {
  al: 'alabama',
  alabama: 'alabama',
  ak: 'alaska',
  alaska: 'alaska',
  az: 'arizona',
  arizona: 'arizona',
  ar: 'arkansas',
  arkansas: 'arkansas',
  ca: 'california',
  california: 'california',
  co: 'colorado',
  colorado: 'colorado',
  ct: 'connecticut',
  connecticut: 'connecticut',
  de: 'delaware',
  delaware: 'delaware',
  fl: 'florida',
  florida: 'florida',
  ga: 'georgia',
  georgia: 'georgia',
  hi: 'hawaii',
  hawaii: 'hawaii',
  id: 'idaho',
  idaho: 'idaho',
  il: 'illinois',
  illinois: 'illinois',
  in: 'indiana',
  indiana: 'indiana',
  ia: 'iowa',
  iowa: 'iowa',
  ks: 'kansas',
  kansas: 'kansas',
  ky: 'kentucky',
  kentucky: 'kentucky',
  la: 'louisiana',
  louisiana: 'louisiana',
  me: 'maine',
  maine: 'maine',
  md: 'maryland',
  maryland: 'maryland',
  ma: 'massachusetts',
  massachusetts: 'massachusetts',
  mi: 'michigan',
  michigan: 'michigan',
  mn: 'minnesota',
  minnesota: 'minnesota',
  ms: 'mississippi',
  mississippi: 'mississippi',
  mo: 'missouri',
  missouri: 'missouri',
  mt: 'montana',
  montana: 'montana',
  ne: 'nebraska',
  nebraska: 'nebraska',
  nv: 'nevada',
  nevada: 'nevada',
  nh: 'new-hampshire',
  'new hampshire': 'new-hampshire',
  nj: 'new-jersey',
  'new jersey': 'new-jersey',
  nm: 'new-mexico',
  'new mexico': 'new-mexico',
  ny: 'new-york',
  'new york': 'new-york',
  nc: 'north-carolina',
  'north carolina': 'north-carolina',
  nd: 'north-dakota',
  'north dakota': 'north-dakota',
  oh: 'ohio',
  ohio: 'ohio',
  ok: 'oklahoma',
  oklahoma: 'oklahoma',
  or: 'oregon',
  oregon: 'oregon',
  pa: 'pennsylvania',
  pennsylvania: 'pennsylvania',
  ri: 'rhode-island',
  'rhode island': 'rhode-island',
  sc: 'south-carolina',
  'south carolina': 'south-carolina',
  sd: 'south-dakota',
  'south dakota': 'south-dakota',
  tn: 'tennessee',
  tennessee: 'tennessee',
  tx: 'texas',
  texas: 'texas',
  ut: 'utah',
  utah: 'utah',
  vt: 'vermont',
  vermont: 'vermont',
  va: 'virginia',
  virginia: 'virginia',
  wa: 'washington',
  washington: 'washington',
  wv: 'west-virginia',
  'west virginia': 'west-virginia',
  wi: 'wisconsin',
  wisconsin: 'wisconsin',
  wy: 'wyoming',
  wyoming: 'wyoming',
  dc: 'district-of-columbia',
  'district of columbia': 'district-of-columbia'
};

@Component({
  selector: 'app-search-filter-bar',
  standalone: true,
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './search-filter-bar.component.html',
  styleUrl: './search-filter-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchFilterBarComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly filters = input.required<ListingSearchFilters>();

  readonly propertyTypeOptions = PROPERTY_TYPE_OPTIONS;

  readonly filterForm =
    this.formBuilder.nonNullable.group({
      location: [''],
      minimumPrice:
        this.formBuilder.control<number | null>(null),
      maximumPrice:
        this.formBuilder.control<number | null>(null),
      minimumBedrooms:
        this.formBuilder.control<number | null>(null),
      minimumBathrooms:
        this.formBuilder.control<number | null>(null),
      propertyType:
        this.formBuilder.control<PropertyType | ''>('')
    });

  constructor() {
    effect(() => {
      const filters = this.filters();

      this.filterForm.patchValue(
        {
          location:
            filters.searchTerm ??
            this.stateNameFromSlug(filters.stateSlug) ??
            filters.city ??
            filters.postalCode ??
            '',

          minimumPrice:
            filters.minimumPrice ?? null,

          maximumPrice:
            filters.maximumPrice ?? null,

          minimumBedrooms:
            filters.minimumBedrooms ?? null,

          minimumBathrooms:
            filters.minimumBathrooms ?? null,

          propertyType:
            filters.propertyTypes?.[0] ?? ''
        },
        {
          emitEvent: false
        }
      );
    });
  }

  applyFilters(): void {
    const formValue =
      this.filterForm.getRawValue() as SearchFilterFormValue;

    const location = formValue.location.trim();
    const stateSlug = this.stateSlugFromLocation(location);

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        query:
          location && !stateSlug
            ? location
            : null,

        state:
          stateSlug ?? null,

        // Remove legacy location parameters so they cannot
        // combine with the new nationwide search.
        city: null,
        postalCode: null,

        minimumPrice:
          this.normalizeNumber(
            formValue.minimumPrice
          ),

        maximumPrice:
          this.normalizeNumber(
            formValue.maximumPrice
          ),

        minimumBedrooms:
          this.normalizeNumber(
            formValue.minimumBedrooms
          ),

        minimumBathrooms:
          this.normalizeNumber(
            formValue.minimumBathrooms
          ),

        propertyType:
          formValue.propertyType || null,

        page: 1
      },
      queryParamsHandling: 'merge'
    });
  }

  clearFilters(): void {
    this.filterForm.reset({
      location: '',
      minimumPrice: null,
      maximumPrice: null,
      minimumBedrooms: null,
      minimumBathrooms: null,
      propertyType: ''
    });

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        query: null,
        state: null,
        city: null,
        postalCode: null,
        minimumPrice: null,
        maximumPrice: null,
        minimumBedrooms: null,
        minimumBathrooms: null,
        propertyType: null,
        page: 1
      },
      queryParamsHandling: 'merge'
    });
  }

  private stateSlugFromLocation(
    location: string
  ): string | undefined {
    if (!location) {
      return undefined;
    }

    return STATE_SLUGS[
      location.toLowerCase().replace(/\./g, '').trim()
    ];
  }

  private stateNameFromSlug(
    stateSlug: string | undefined
  ): string | undefined {
    if (!stateSlug) {
      return undefined;
    }

    return stateSlug
      .split('-')
      .map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      )
      .join(' ');
  }

  private normalizeNumber(
    value: number | null
  ): number | null {
    if (
      value === null ||
      value === undefined ||
      !Number.isFinite(value)
    ) {
      return null;
    }

    return value;
  }
}
