import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  ListingHoaFeeFrequency,
  LotSizeUnit,
  PropertyType,
} from '../../../../../core/domains/listings/models/listing.model';

interface PropertyTypeOption {
  value: PropertyType;
  label: string;
}

export type PropertyDetailsSellerOwnershipStatus =
  'owned_at_least_one_year' | 'owned_less_than_one_year' | 'does_not_yet_own';

export type PropertyDetailsFuelTankOwnership = 'owned' | 'leased';

export interface PropertyDetailsSellerStatementsFormValue {
  ownershipStatus: PropertyDetailsSellerOwnershipStatus | '';
  leadBasedPaintApplies: boolean | null;
  ownersAssociationApplies: boolean | null;
  fuelTankPresent: boolean | null;
  fuelTankOwnership: PropertyDetailsFuelTankOwnership | '';
  leasesExist: boolean | null;
}

export interface PropertyDetailsFormValue {
  propertyType: PropertyType | '';
  bedrooms: number | null;
  bathrooms: number | null;
  squareFeet: number | null;
  yearBuilt: number | null;
  lotSize: number | null;
  lotSizeUnit: LotSizeUnit;
  description: string;
  hoa?: PropertyDetailsHoaFormValue;
  sellerStatements: PropertyDetailsSellerStatementsFormValue;
}

export interface PropertyDetailsHoaFormValue {
  hasHoa: boolean | null;
  associationName: string;
  managementCompany: string;
  contactPhone: string;
  feeAmount: number | null;
  feeFrequency: ListingHoaFeeFrequency | '';
}

@Component({
  selector: 'app-property-details-step',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './property-details-step.component.html',
  styleUrl: './property-details-step.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyDetailsStepComponent {
  private readonly fb = inject(FormBuilder);

  readonly initialValue = input<PropertyDetailsFormValue | null>(null);

  readonly currentYear = new Date().getFullYear();

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
      label: 'Semi-Annually',
    },
    { value: 'annually', label: 'Annually' },
  ];

  readonly form = this.fb.nonNullable.group({
    propertyType: ['' as PropertyType | '', Validators.required],
    bedrooms: [
      null as number | null,
      [Validators.required, Validators.min(0), Validators.max(99)],
    ],
    bathrooms: [
      null as number | null,
      [Validators.required, Validators.min(0), Validators.max(99)],
    ],
    squareFeet: [
      null as number | null,
      [Validators.required, Validators.min(1), Validators.max(1000000)],
    ],
    yearBuilt: [
      null as number | null,
      [
        Validators.required,
        Validators.min(1600),
        Validators.max(new Date().getFullYear() + 1),
      ],
    ],
    lotSize: [null as number | null, Validators.min(0)],
    lotSizeUnit: ['square_feet' as LotSizeUnit, Validators.required],
    description: [
      '',
      [
        Validators.required,
        Validators.minLength(20),
        Validators.maxLength(5000),
      ],
    ],
    hoa: this.fb.nonNullable.group({
      hasHoa: [null as boolean | null],
      feeAmount: [
        null as number | null,
        [Validators.min(0), Validators.max(1000000)],
      ],
      feeFrequency: ['' as ListingHoaFeeFrequency | ''],
      associationName: [''],
      managementCompany: [''],
      contactPhone: [''],
    }),
    sellerStatements: this.fb.nonNullable.group({
      ownershipStatus: [
        '' as PropertyDetailsSellerOwnershipStatus | '',
        Validators.required,
      ],
      leadBasedPaintApplies: [null as boolean | null, Validators.required],
      ownersAssociationApplies: [null as boolean | null, Validators.required],
      fuelTankPresent: [null as boolean | null, Validators.required],
      fuelTankOwnership: ['' as PropertyDetailsFuelTankOwnership | ''],
      leasesExist: [null as boolean | null, Validators.required],
    }),
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
              associationName: '',
              managementCompany: '',
              contactPhone: '',
              feeAmount: null,
              feeFrequency: '',
            },
            sellerStatements: initialValue.sellerStatements ?? {
              ownershipStatus: '',
              leadBasedPaintApplies: null,
              ownersAssociationApplies: null,
              fuelTankPresent: null,
              fuelTankOwnership: '',
              leasesExist: null,
            },
          },
          {
            emitEvent: false,
          },
        );
      }

      this.configureHoaValidators(
        this.form.controls.hoa.controls.hasHoa.value,
        false,
      );

      this.configureFuelTankValidators(
        this.form.controls.sellerStatements.controls.fuelTankPresent.value,
        false,
      );

      this.validityChange.emit(this.form.valid);
    });

    this.form.controls.hoa.controls.hasHoa.valueChanges.subscribe((hasHoa) => {
      this.configureHoaValidators(hasHoa, true);

      if (hasHoa !== null) {
        this.form.controls.sellerStatements.controls.ownersAssociationApplies.setValue(
          hasHoa,
          {
            emitEvent: false,
          },
        );
      }

      this.valueChange.emit(
        this.form.getRawValue() as PropertyDetailsFormValue,
      );

      this.validityChange.emit(this.form.valid);
    });

    this.form.controls.sellerStatements.controls.ownersAssociationApplies.valueChanges.subscribe(
      (ownersAssociationApplies) => {
        if (ownersAssociationApplies !== null) {
          this.form.controls.hoa.controls.hasHoa.setValue(
            ownersAssociationApplies,
            {
              emitEvent: false,
            },
          );

          this.configureHoaValidators(
            ownersAssociationApplies,
            ownersAssociationApplies === false,
          );
        }

        this.valueChange.emit(
          this.form.getRawValue() as PropertyDetailsFormValue,
        );

        this.validityChange.emit(this.form.valid);
      },
    );

    this.form.controls.sellerStatements.controls.fuelTankPresent.valueChanges.subscribe(
      (fuelTankPresent) => {
        this.configureFuelTankValidators(fuelTankPresent, true);

        this.valueChange.emit(
          this.form.getRawValue() as PropertyDetailsFormValue,
        );

        this.validityChange.emit(this.form.valid);
      },
    );

    this.form.valueChanges.subscribe(() => {
      this.valueChange.emit(
        this.form.getRawValue() as PropertyDetailsFormValue,
      );

      this.validityChange.emit(this.form.valid);
    });
  }

  private configureHoaValidators(
    hasHoa: boolean | null,
    clearValues: boolean,
  ): void {
    const controls = this.form.controls.hoa.controls;

    if (hasHoa === true) {
      controls.feeAmount.setValidators([
        Validators.min(0),
        Validators.max(1000000),
      ]);
      controls.feeFrequency.clearValidators();
      controls.associationName.setValidators([
        Validators.maxLength(200),
      ]);
      controls.managementCompany.setValidators([
        Validators.maxLength(200),
      ]);
    } else {
      controls.feeAmount.clearValidators();
      controls.feeFrequency.clearValidators();
      controls.associationName.clearValidators();
      controls.managementCompany.clearValidators();

      if (clearValues) {
        controls.feeAmount.setValue(null, {
          emitEvent: false,
        });
        controls.feeFrequency.setValue('', {
          emitEvent: false,
        });
        controls.associationName.setValue('', {
          emitEvent: false,
        });
        controls.managementCompany.setValue('', {
          emitEvent: false,
        });
        controls.contactPhone.setValue('', {
          emitEvent: false,
        });
      }
    }

    controls.feeAmount.updateValueAndValidity({ emitEvent: false });
    controls.feeFrequency.updateValueAndValidity({ emitEvent: false });
    controls.associationName.updateValueAndValidity({ emitEvent: false });
    controls.managementCompany.updateValueAndValidity({ emitEvent: false });
  }

  private configureFuelTankValidators(
    fuelTankPresent: boolean | null,
    clearValue: boolean,
  ): void {
    const fuelTankOwnership =
      this.form.controls.sellerStatements.controls.fuelTankOwnership;

    if (fuelTankPresent === true) {
      fuelTankOwnership.setValidators([Validators.required]);
    } else {
      fuelTankOwnership.clearValidators();

      if (clearValue) {
        fuelTankOwnership.setValue('', {
          emitEvent: false,
        });
      }
    }

    fuelTankOwnership.updateValueAndValidity({
      emitEvent: false,
    });
  }
}
