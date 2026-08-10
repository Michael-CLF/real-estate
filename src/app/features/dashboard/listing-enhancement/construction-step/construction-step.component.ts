import {
  ChangeDetectionStrategy,
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
  ArchitecturalStyle,
  BasementType,
  ExteriorMaterial,
  FoundationType,
  ListingConstruction,
  RoofType
} from '../../../../../core/domains/listings/models/listing.model';

interface ConstructionOption<T> {
  value: T;
  label: string;
}

@Component({
  selector: 'app-construction-step',
  standalone: true,
  imports: [
    ReactiveFormsModule
  ],
  templateUrl:
    './construction-step.component.html',
  styleUrl:
    './construction-step.component.scss',
  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class ConstructionStepComponent {
  private readonly fb =
    inject(FormBuilder);

  readonly initialValue =
    input<ListingConstruction | null>(null);

  readonly validityChange =
    output<boolean>();

  readonly valueChange =
    output<ListingConstruction>();

  readonly currentYear =
    new Date().getFullYear();

  readonly architecturalStyles:
    ConstructionOption<ArchitecturalStyle>[] = [
      {
        value: 'a_frame',
        label: 'A-Frame'
      },
      {
        value: 'bungalow',
        label: 'Bungalow'
      },
      {
        value: 'cape_cod',
        label: 'Cape Cod'
      },
      {
        value: 'colonial',
        label: 'Colonial'
      },
      {
        value: 'contemporary',
        label: 'Contemporary'
      },
      {
        value: 'craftsman',
        label: 'Craftsman'
      },
      {
        value: 'farmhouse',
        label: 'Farmhouse'
      },
      {
        value: 'french_country',
        label: 'French Country'
      },
      {
        value: 'mediterranean',
        label: 'Mediterranean'
      },
      {
        value: 'mid_century_modern',
        label: 'Mid-Century Modern'
      },
      {
        value: 'modern',
        label: 'Modern'
      },
      {
        value: 'ranch',
        label: 'Ranch'
      },
      {
        value: 'spanish',
        label: 'Spanish'
      },
      {
        value: 'traditional',
        label: 'Traditional'
      },
      {
        value: 'tudor',
        label: 'Tudor'
      },
      {
        value: 'victorian',
        label: 'Victorian'
      },
      {
        value: 'other',
        label: 'Other'
      }
    ];

  readonly exteriorMaterials:
    ConstructionOption<ExteriorMaterial>[] = [
      {
        value: 'brick',
        label: 'Brick'
      },
      {
        value: 'fiber_cement',
        label: 'Fiber Cement'
      },
      {
        value: 'log',
        label: 'Log'
      },
      {
        value: 'metal',
        label: 'Metal'
      },
      {
        value: 'stone',
        label: 'Stone'
      },
      {
        value: 'stucco',
        label: 'Stucco'
      },
      {
        value: 'vinyl_siding',
        label: 'Vinyl Siding'
      },
      {
        value: 'wood_siding',
        label: 'Wood Siding'
      },
      {
        value: 'other',
        label: 'Other'
      }
    ];

  readonly roofTypes:
    ConstructionOption<RoofType>[] = [
      {
        value: 'architectural_shingle',
        label: 'Architectural Shingle'
      },
      {
        value: 'asphalt_shingle',
        label: 'Asphalt Shingle'
      },
      {
        value: 'flat',
        label: 'Flat'
      },
      {
        value: 'metal',
        label: 'Metal'
      },
      {
        value: 'rubber',
        label: 'Rubber'
      },
      {
        value: 'slate',
        label: 'Slate'
      },
      {
        value: 'tile',
        label: 'Tile'
      },
      {
        value: 'tpo',
        label: 'TPO'
      },
      {
        value: 'wood_shake',
        label: 'Wood Shake'
      },
      {
        value: 'other',
        label: 'Other'
      }
    ];

  readonly foundationTypes:
    ConstructionOption<FoundationType>[] = [
      {
        value: 'basement',
        label: 'Basement'
      },
      {
        value: 'crawl_space',
        label: 'Crawl Space'
      },
      {
        value: 'pier_and_beam',
        label: 'Pier and Beam'
      },
      {
        value: 'raised',
        label: 'Raised'
      },
      {
        value: 'slab',
        label: 'Slab'
      },
      {
        value: 'other',
        label: 'Other'
      }
    ];

  readonly basementTypes:
    ConstructionOption<BasementType>[] = [
      {
        value: 'none',
        label: 'None'
      },
      {
        value: 'unfinished',
        label: 'Unfinished'
      },
      {
        value: 'partially_finished',
        label: 'Partially Finished'
      },
      {
        value: 'finished',
        label: 'Finished'
      },
      {
        value: 'walkout',
        label: 'Walkout'
      }
    ];

  readonly form =
    this.fb.nonNullable.group({
      architecturalStyle: [
        '' as ArchitecturalStyle | '',
        Validators.required
      ],

      otherArchitecturalStyle: [
        ''
      ],

      exteriorMaterials: [
        [] as ExteriorMaterial[],
        Validators.required
      ],

      otherExteriorMaterial: [
        ''
      ],

      roofType: [
        '' as RoofType | '',
        Validators.required
      ],

      otherRoofType: [
        ''
      ],

      roofAge: [
        null as number | null,
        [
          Validators.min(0),
          Validators.max(200)
        ]
      ],

      foundationType: [
        '' as FoundationType | '',
        Validators.required
      ],

      otherFoundationType: [
        ''
      ],

      basementType: [
        '' as BasementType | '',
        Validators.required
      ],

      newConstruction: [
        false
      ],

      constructionYear: [
        null as number | null,
        [
          Validators.min(1600),
          Validators.max(
            new Date().getFullYear() + 5
          )
        ]
      ]
    });

  constructor() {
    effect(() => {
      const initialValue =
        this.initialValue();

      if (initialValue) {
        this.form.patchValue(
          {
            architecturalStyle:
              initialValue.architecturalStyle ??
              '',

            otherArchitecturalStyle:
              initialValue
                .otherArchitecturalStyle ??
              '',

            exteriorMaterials:
              initialValue.exteriorMaterials,

            otherExteriorMaterial:
              initialValue
                .otherExteriorMaterial ??
              '',

            roofType:
              initialValue.roofType ??
              '',

            otherRoofType:
              initialValue.otherRoofType ??
              '',

            roofAge:
              initialValue.roofAge ??
              null,

            foundationType:
              initialValue.foundationType ??
              '',

            otherFoundationType:
              initialValue
                .otherFoundationType ??
              '',

            basementType:
              initialValue.basementType ??
              '',

            newConstruction:
              initialValue.newConstruction,

            constructionYear:
              initialValue.constructionYear ??
              null
          },
          {
            emitEvent: false
          }
        );

        this.updateConditionalValidators();
      }

      this.emitValidity();
    });

    this.form.controls.architecturalStyle
      .valueChanges
      .subscribe(() => {
        this.updateConditionalValidators();
      });

    this.form.controls.exteriorMaterials
      .valueChanges
      .subscribe(() => {
        this.updateConditionalValidators();
      });

    this.form.controls.roofType
      .valueChanges
      .subscribe(() => {
        this.updateConditionalValidators();
      });

    this.form.controls.foundationType
      .valueChanges
      .subscribe(() => {
        this.updateConditionalValidators();
      });

    this.form.controls.newConstruction
      .valueChanges
      .subscribe(() => {
        this.updateConditionalValidators();
      });

    this.form.valueChanges
      .subscribe(() => {
        this.valueChange.emit(
          this.buildValue()
        );

        this.emitValidity();
      });
  }

  protected isExteriorMaterialSelected(
    material: ExteriorMaterial
  ): boolean {
    return this.form.controls
      .exteriorMaterials
      .value
      .includes(material);
  }

  protected toggleExteriorMaterial(
    material: ExteriorMaterial,
    checked: boolean
  ): void {
    const currentMaterials = [
      ...this.form.controls
        .exteriorMaterials
        .value
    ];

    const updatedMaterials =
      checked
        ? [
            ...currentMaterials,
            material
          ]
        : currentMaterials.filter(
            currentMaterial =>
              currentMaterial !== material
          );

    this.form.controls
      .exteriorMaterials
      .setValue(updatedMaterials);

    this.form.controls
      .exteriorMaterials
      .markAsTouched();
  }

  private updateConditionalValidators(): void {
    this.updateOtherFieldValidator(
      this.form.controls
        .otherArchitecturalStyle,
      this.form.controls
        .architecturalStyle
        .value === 'other'
    );

    this.updateOtherFieldValidator(
      this.form.controls
        .otherExteriorMaterial,
      this.form.controls
        .exteriorMaterials
        .value
        .includes('other')
    );

    this.updateOtherFieldValidator(
      this.form.controls
        .otherRoofType,
      this.form.controls
        .roofType
        .value === 'other'
    );

    this.updateOtherFieldValidator(
      this.form.controls
        .otherFoundationType,
      this.form.controls
        .foundationType
        .value === 'other'
    );

    const constructionYear =
      this.form.controls
        .constructionYear;

    if (
      this.form.controls
        .newConstruction
        .value
    ) {
      constructionYear.setValidators([
        Validators.required,
        Validators.min(1600),
        Validators.max(
          this.currentYear + 5
        )
      ]);
    } else {
      constructionYear.setValidators([
        Validators.min(1600),
        Validators.max(
          this.currentYear + 5
        )
      ]);
    }

    constructionYear
      .updateValueAndValidity({
        emitEvent: false
      });

    this.emitValidity();
  }

  private updateOtherFieldValidator(
    control:
      typeof this.form.controls
        .otherArchitecturalStyle,
    required: boolean
  ): void {
    if (required) {
      control.setValidators([
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100)
      ]);
    } else {
      control.clearValidators();
    }

    control.updateValueAndValidity({
      emitEvent: false
    });
  }

  private buildValue():
    ListingConstruction {
    const value =
      this.form.getRawValue();

    return {
      architecturalStyle:
        value.architecturalStyle ||
        undefined,

      otherArchitecturalStyle:
        value.architecturalStyle ===
          'other'
          ? value
              .otherArchitecturalStyle
              .trim()
          : undefined,

      exteriorMaterials:
        value.exteriorMaterials,

      otherExteriorMaterial:
        value.exteriorMaterials
          .includes('other')
          ? value
              .otherExteriorMaterial
              .trim()
          : undefined,

      roofType:
        value.roofType ||
        undefined,

      otherRoofType:
        value.roofType === 'other'
          ? value.otherRoofType.trim()
          : undefined,

      roofAge:
        value.roofAge ??
        undefined,

      foundationType:
        value.foundationType ||
        undefined,

      otherFoundationType:
        value.foundationType ===
          'other'
          ? value
              .otherFoundationType
              .trim()
          : undefined,

      basementType:
        value.basementType ||
        undefined,

      newConstruction:
        value.newConstruction,

      constructionYear:
        value.constructionYear ??
        undefined
    };
  }

  private emitValidity(): void {
    const hasExteriorMaterial =
      this.form.controls
        .exteriorMaterials
        .value
        .length > 0;

    this.validityChange.emit(
      this.form.valid &&
      hasExteriorMaterial
    );
  }
}