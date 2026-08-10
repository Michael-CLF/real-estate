import {
  CommonModule
} from '@angular/common';

import {
  Component,
  effect,
  inject,
  input,
  output
} from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  ZipCodeService
} from '../../../../../core/infrastructure/zip/zip-code.service';


export interface AddressFormValue {
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;
}


@Component({
  selector: 'app-address-step',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl:
    './address-step.component.html',
  styleUrl:
    './address-step.component.scss'
})
export class AddressStepComponent {
  private readonly fb =
    inject(FormBuilder);

  private readonly zipCodeService =
    inject(ZipCodeService);


  readonly initialValue =
    input<AddressFormValue | null>(null);

  readonly validityChange =
    output<boolean>();

  readonly valueChange =
    output<AddressFormValue>();


  readonly states = [
    { code: 'AL', name: 'Alabama' },
    { code: 'AK', name: 'Alaska' },
    { code: 'AZ', name: 'Arizona' },
    { code: 'AR', name: 'Arkansas' },
    { code: 'CA', name: 'California' },
    { code: 'CO', name: 'Colorado' },
    { code: 'CT', name: 'Connecticut' },
    { code: 'DE', name: 'Delaware' },
    { code: 'FL', name: 'Florida' },
    { code: 'GA', name: 'Georgia' },
    { code: 'HI', name: 'Hawaii' },
    { code: 'ID', name: 'Idaho' },
    { code: 'IL', name: 'Illinois' },
    { code: 'IN', name: 'Indiana' },
    { code: 'IA', name: 'Iowa' },
    { code: 'KS', name: 'Kansas' },
    { code: 'KY', name: 'Kentucky' },
    { code: 'LA', name: 'Louisiana' },
    { code: 'ME', name: 'Maine' },
    { code: 'MD', name: 'Maryland' },
    { code: 'MA', name: 'Massachusetts' },
    { code: 'MI', name: 'Michigan' },
    { code: 'MN', name: 'Minnesota' },
    { code: 'MS', name: 'Mississippi' },
    { code: 'MO', name: 'Missouri' },
    { code: 'MT', name: 'Montana' },
    { code: 'NE', name: 'Nebraska' },
    { code: 'NV', name: 'Nevada' },
    { code: 'NH', name: 'New Hampshire' },
    { code: 'NJ', name: 'New Jersey' },
    { code: 'NM', name: 'New Mexico' },
    { code: 'NY', name: 'New York' },
    { code: 'NC', name: 'North Carolina' },
    { code: 'ND', name: 'North Dakota' },
    { code: 'OH', name: 'Ohio' },
    { code: 'OK', name: 'Oklahoma' },
    { code: 'OR', name: 'Oregon' },
    { code: 'PA', name: 'Pennsylvania' },
    { code: 'RI', name: 'Rhode Island' },
    { code: 'SC', name: 'South Carolina' },
    { code: 'SD', name: 'South Dakota' },
    { code: 'TN', name: 'Tennessee' },
    { code: 'TX', name: 'Texas' },
    { code: 'UT', name: 'Utah' },
    { code: 'VT', name: 'Vermont' },
    { code: 'VA', name: 'Virginia' },
    { code: 'WA', name: 'Washington' },
    { code: 'WV', name: 'West Virginia' },
    { code: 'WI', name: 'Wisconsin' },
    { code: 'WY', name: 'Wyoming' }
  ];


  readonly form =
    this.fb.nonNullable.group({
      addressLine1: [
        '',
        [
          Validators.required,
          Validators.minLength(5),
          Validators.maxLength(100)
        ]
      ],

      addressLine2: [
        '',
        [
          Validators.maxLength(100)
        ]
      ],

      city: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.pattern(
            /^[A-Za-z\s'-]+$/
          )
        ]
      ],

      state: [
        'NC',
        Validators.required
      ],

      zipCode: [
        '',
        [
          Validators.required,
          Validators.pattern(
            /^\d{5}$/
          )
        ]
      ],

      county: [
        {
          value: '',
          disabled: true
        }
      ]
    });


  constructor() {
    effect(() => {
      const initialValue =
        this.initialValue();

      if (initialValue) {
        this.form.setValue(
          initialValue,
          {
            emitEvent: false
          }
        );
      }

      this.validityChange.emit(
        this.form.valid
      );
    });


    this.form.valueChanges.subscribe(
      () => {
        this.valueChange.emit(
          this.form.getRawValue()
        );

        this.validityChange.emit(
          this.form.valid
        );
      }
    );
  }


  async lookupZipCode(): Promise<void> {
    const zip =
      this.form.controls.zipCode.value
        .trim();

    this.form.patchValue({
      county: ''
    });

    if (!/^\d{5}$/.test(zip)) {
      return;
    }

    await this.zipCodeService.load();

    const result =
      this.zipCodeService.lookup(zip);

    if (!result) {
      this.form.controls.zipCode.setErrors({
        invalidZipCode: true
      });

      this.validityChange.emit(false);

      return;
    }

    this.form.patchValue({
      city: result.city,
      state: result.state,
      county: result.county
    });

    this.form.controls.zipCode
      .updateValueAndValidity({
        emitEvent: false
      });

    this.valueChange.emit(
      this.form.getRawValue()
    );

    this.validityChange.emit(
      this.form.valid
    );
  }
}