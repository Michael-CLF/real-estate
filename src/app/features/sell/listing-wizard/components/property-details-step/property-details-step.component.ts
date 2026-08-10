import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  ListingHoaFeeFrequency,
  PropertyType
} from '../../../../../core/domains/listings/models/listing.model';

interface PropertyTypeOption {
  value: PropertyType;
  label: string;
}

export interface PropertyDetailsFormValue {
  propertyType: PropertyType | '';
  bedrooms: number | null;
  bathrooms: number | null;
  squareFeet: number | null;
  yearBuilt: number | null;
  lotSize: number | null;
  description: string;
  hoa?: PropertyDetailsHoaFormValue;
}

export interface PropertyDetailsHoaFormValue {
  hasHoa: boolean | null;
  feeAmount: number | null;
  feeFrequency: ListingHoaFeeFrequency | '';
}

@Component({
  selector: 'app-property-details-step',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './property-details-step.component.html',
  styleUrl: './property-details-step.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class PropertyDetailsStepComponent {
  private readonly fb = inject(FormBuilder);

  readonly initialValue = input<PropertyDetailsFormValue | null>(null);

  readonly currentYear =
    new Date().getFullYear();

  readonly validityChange = output<boolean>();
  readonly valueChange = output<PropertyDetailsFormValue>();

  readonly propertyTypes: PropertyTypeOption[] = [
    { value: 'condo', label: 'Condo' },
    { value: 'land', label: 'Land' },
    { value: 'mobile', label: 'Mobile Home' },
    { value: 'multi_family', label: 'Multi-Family' },
    { value: 'pud', label: 'Pud' },
    { value: 'single_family', label: 'Single Family' },
    { value: 'townhome', label: 'Townhome' },
  ];

  readonly hoaFeeFrequencies: {
    value: ListingHoaFeeFrequency;
    label: string;
  }[] = [
      { value: 'monthly', label: 'Monthly' },
      { value: 'quarterly', label: 'Quarterly' },
      {
        value: 'semi_annually',
        label: 'Semi-Annually'
      },
      { value: 'annually', label: 'Annually' }
    ];



  readonly form = this.fb.nonNullable.group({
    propertyType: [
      '' as PropertyType | '',
      Validators.required
    ],
    bedrooms: [
      null as number | null,
      [
        Validators.required,
        Validators.min(0),
        Validators.max(99)
      ]
    ],
    bathrooms: [
      null as number | null,
      [
        Validators.required,
        Validators.min(0),
        Validators.max(99)
      ]
    ],
    squareFeet: [
      null as number | null,
      [
        Validators.required,
        Validators.min(1),
        Validators.max(1000000)
      ]
    ],
    yearBuilt: [
      null as number | null,
      [
        Validators.required,
        Validators.min(1600),
        Validators.max(new Date().getFullYear() + 1)
      ]
    ],
    lotSize: [
      null as number | null,
      Validators.min(0)
    ],
    description: [
      '',
      [
        Validators.required,
        Validators.minLength(20),
        Validators.maxLength(5000)
      ]
    ],
    hoa: this.fb.nonNullable.group({
      hasHoa: [
        null as boolean | null,
        Validators.required
      ],
      feeAmount: [
        null as number | null,
        [
          Validators.min(0),
          Validators.max(1000000)
        ]
      ],
      feeFrequency: [
        '' as ListingHoaFeeFrequency | ''
      ]
    })
  });

  constructor() {
    effect(() => {
      const initialValue = this.initialValue();

      if (initialValue) {
        this.form.patchValue(
          {
            ...initialValue,
            hoa: initialValue.hoa ?? {
              hasHoa: null,
              feeAmount: null,
              feeFrequency: ''
            }
          },
          {
            emitEvent: false
          }
        );
      }

      this.validityChange.emit(
        this.form.valid
      );
    });

    this.form.controls.hoa.controls.hasHoa
      .valueChanges
      .subscribe(hasHoa => {
        const feeAmount =
          this.form.controls.hoa.controls.feeAmount;

        const feeFrequency =
          this.form.controls.hoa.controls.feeFrequency;

        if (hasHoa === true) {
          feeAmount.setValidators([
            Validators.required,
            Validators.min(0),
            Validators.max(1000000)
          ]);

          feeFrequency.setValidators([
            Validators.required
          ]);
        } else {
          feeAmount.clearValidators();
          feeFrequency.clearValidators();

          feeAmount.setValue(null, {
            emitEvent: false
          });

          feeFrequency.setValue('', {
            emitEvent: false
          });
        }

        feeAmount.updateValueAndValidity({
          emitEvent: false
        });

        feeFrequency.updateValueAndValidity({
          emitEvent: false
        });

        this.valueChange.emit(
          this.form.getRawValue() as PropertyDetailsFormValue
        );

        this.validityChange.emit(
          this.form.valid
        );
      });

    this.form.valueChanges.subscribe(() => {
      this.valueChange.emit(
        this.form.getRawValue() as PropertyDetailsFormValue
      );

      this.validityChange.emit(this.form.valid);
    });
  }
}