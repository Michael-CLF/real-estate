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
} from '../../../../../core/domains/marketplace/models/property-type.type';

interface SearchFilterFormValue {
  location: string;
  minimumPrice: number | null;
  maximumPrice: number | null;
  minimumBedrooms: number | null;
  minimumBathrooms: number | null;
  propertyType: PropertyType | '';
}

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
    const isPostalCode = /^\d{5}$/.test(location);

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        city:
          location && !isPostalCode
            ? location
            : null,

        postalCode:
          location && isPostalCode
            ? location
            : null,

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