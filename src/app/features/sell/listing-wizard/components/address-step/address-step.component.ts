import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';

import { ZipCodeService } from '../../../../../core/infrastructure/zip/zip-code.service';

@Component({
  selector: 'app-address-step',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './address-step.component.html',
  styleUrl: './address-step.component.scss'
})
export class AddressStepComponent {

  private readonly fb = inject(FormBuilder);
  private readonly zipCodeService = inject(ZipCodeService);

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

  readonly form = this.fb.nonNullable.group({

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
        Validators.pattern(/^[A-Za-z\s'-]+$/)
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
        Validators.pattern(/^\d{5}$/)
      ]
    ],

    county: [
      {
        value: '',
        disabled: true
      }
    ]

  });

  async lookupZipCode(): Promise<void> {

    console.log('lookupZipCode fired');

    const zip = this.form.controls.zipCode.value.trim();

    if (zip.length !== 5) {
      return;
    }

    await this.zipCodeService.load();

    const result = this.zipCodeService.lookup(zip);

    if (!result) {

      this.form.controls.zipCode.setErrors({
        invalidZipCode: true
      });

      return;

    }

    this.form.patchValue({
      city: result.city,
      state: result.state,
      county: result.county
    });
  }
}