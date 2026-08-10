import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  inject
} from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  CeilingFeature,
  FireplaceType,
  FlooringType,
  FloorPlanType,
  InteriorFeature,
  ListingInterior
} from '../../../../../core/domains/listings/models/listing.model';

import {
  takeUntilDestroyed
} from '@angular/core/rxjs-interop';

interface SelectOption<T> {
  value: T;
  label: string;
}

@Component({
  selector: 'app-interior-step',
  standalone: true,
  imports: [
    ReactiveFormsModule
  ],
  templateUrl:
    './interior-step.component.html',
  styleUrl:
    './interior-step.component.scss',
  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class InteriorStepComponent
  implements OnInit, OnChanges {

  private readonly formBuilder =
    inject(FormBuilder);

  private readonly destroyRef =
    inject(DestroyRef);

  @Input()
  initialValue:
    ListingInterior | null = null;

  @Output()
  readonly valueChange =
    new EventEmitter<ListingInterior>();

  @Output()
  readonly validityChange =
    new EventEmitter<boolean>();

  protected readonly flooringTypes:
    SelectOption<FlooringType>[] = [
      {
        value: 'bamboo',
        label: 'Bamboo'
      },
      {
        value: 'carpet',
        label: 'Carpet'
      },
      {
        value: 'concrete',
        label: 'Concrete'
      },
      {
        value: 'engineered_hardwood',
        label: 'Engineered Hardwood'
      },
      {
        value: 'hardwood',
        label: 'Hardwood'
      },
      {
        value: 'laminate',
        label: 'Laminate'
      },
      {
        value: 'luxury_vinyl_plank',
        label: 'Luxury Vinyl Plank'
      },
      {
        value: 'marble',
        label: 'Marble'
      },
      {
        value: 'stone',
        label: 'Stone'
      },
      {
        value: 'tile',
        label: 'Tile'
      },
      {
        value: 'vinyl',
        label: 'Vinyl'
      },
      {
        value: 'other',
        label: 'Other'
      }
    ];

  protected readonly floorPlans:
    SelectOption<FloorPlanType>[] = [
      {
        value: 'open',
        label: 'Open Floor Plan'
      },
      {
        value: 'traditional',
        label: 'Traditional'
      },
      {
        value: 'split_level',
        label: 'Split Level'
      },
      {
        value: 'other',
        label: 'Other'
      }
    ];

  protected readonly ceilingFeatures:
    SelectOption<CeilingFeature>[] = [
      {
        value: 'cathedral',
        label: 'Cathedral'
      },
      {
        value: 'coffered',
        label: 'Coffered'
      },
      {
        value: 'high',
        label: 'High Ceilings'
      },
      {
        value: 'standard',
        label: 'Standard'
      },
      {
        value: 'tray',
        label: 'Tray'
      },
      {
        value: 'vaulted',
        label: 'Vaulted'
      }
    ];

  protected readonly fireplaceTypes:
    SelectOption<FireplaceType>[] = [
      {
        value: 'electric',
        label: 'Electric'
      },
      {
        value: 'gas',
        label: 'Gas'
      },
      {
        value: 'pellet',
        label: 'Pellet'
      },
      {
        value: 'wood_burning',
        label: 'Wood Burning'
      }
    ];

  protected readonly interiorFeatures:
    SelectOption<InteriorFeature>[] = [
      {
        value: 'built_in_cabinetry',
        label: 'Built-In Cabinetry'
      },
      {
        value: 'built_in_shelving',
        label: 'Built-In Shelving'
      },
      {
        value: 'central_vacuum',
        label: 'Central Vacuum'
      },
      {
        value: 'crown_molding',
        label: 'Crown Molding'
      },
      {
        value: 'custom_closets',
        label: 'Custom Closets'
      },
      {
        value: 'intercom',
        label: 'Intercom'
      },
      {
        value: 'linen_closet',
        label: 'Linen Closet'
      },
      {
        value: 'safe_room',
        label: 'Safe Room'
      },
      {
        value: 'soundproofing',
        label: 'Soundproofing'
      },
      {
        value: 'wainscoting',
        label: 'Wainscoting'
      },
      {
        value: 'walk_in_closet',
        label: 'Walk-In Closet'
      },
      {
        value: 'wet_bar',
        label: 'Wet Bar'
      }
    ];

  protected readonly form =
    this.formBuilder.nonNullable.group({
      flooringTypes:
        this.formBuilder.nonNullable.control<
          FlooringType[]
        >([]),

      otherFlooringType:
        this.formBuilder.nonNullable.control(
          ''
        ),

      floorPlan:
        this.formBuilder.nonNullable.control<
          FloorPlanType | ''
        >(
          '',
          {
            validators: [
              Validators.required
            ]
          }
        ),

      ceilingFeatures:
        this.formBuilder.nonNullable.control<
          CeilingFeature[]
        >([]),

      fireplaceCount:
        this.formBuilder.control<number | null>(
          null,
          {
            validators: [
              Validators.min(0),
              Validators.max(20)
            ]
          }
        ),

      fireplaceTypes:
        this.formBuilder.nonNullable.control<
          FireplaceType[]
        >([]),

      interiorFeatures:
        this.formBuilder.nonNullable.control<
          InteriorFeature[]
        >([])
    });

  ngOnInit(): void {
    this.restoreInitialValue();

    this.form.valueChanges
      .pipe(
        takeUntilDestroyed(
          this.destroyRef
        )
      )
      .subscribe(() => {
        this.updateConditionalValidators();
        this.emitValue();
        this.emitValidity();
      });

    this.updateConditionalValidators();
    this.emitValue();
    this.emitValidity();
  }

  ngOnChanges(
    changes: SimpleChanges
  ): void {
    if (
      changes['initialValue'] &&
      !changes['initialValue'].firstChange
    ) {
      this.restoreInitialValue();
      this.updateConditionalValidators();
      this.emitValidity();
    }
  }

  protected toggleFlooringType(
    flooringType: FlooringType,
    checked: boolean
  ): void {
    const selected = [
      ...this.form.controls
        .flooringTypes.value
    ];

    const updated = checked
      ? Array.from(
          new Set([
            ...selected,
            flooringType
          ])
        )
      : selected.filter(
          value =>
            value !== flooringType
        );

    this.form.controls
      .flooringTypes
      .setValue(updated);

    this.form.controls
      .flooringTypes
      .markAsTouched();
  }

  protected isFlooringTypeSelected(
    flooringType: FlooringType
  ): boolean {
    return this.form.controls
      .flooringTypes
      .value
      .includes(flooringType);
  }

  protected toggleCeilingFeature(
    ceilingFeature: CeilingFeature,
    checked: boolean
  ): void {
    this.updateArrayControl(
      this.form.controls
        .ceilingFeatures,
      ceilingFeature,
      checked
    );
  }

  protected isCeilingFeatureSelected(
    ceilingFeature: CeilingFeature
  ): boolean {
    return this.form.controls
      .ceilingFeatures
      .value
      .includes(ceilingFeature);
  }

  protected toggleFireplaceType(
    fireplaceType: FireplaceType,
    checked: boolean
  ): void {
    this.updateArrayControl(
      this.form.controls
        .fireplaceTypes,
      fireplaceType,
      checked
    );
  }

  protected isFireplaceTypeSelected(
    fireplaceType: FireplaceType
  ): boolean {
    return this.form.controls
      .fireplaceTypes
      .value
      .includes(fireplaceType);
  }

  protected toggleInteriorFeature(
    interiorFeature: InteriorFeature,
    checked: boolean
  ): void {
    this.updateArrayControl(
      this.form.controls
        .interiorFeatures,
      interiorFeature,
      checked
    );
  }

  protected isInteriorFeatureSelected(
    interiorFeature: InteriorFeature
  ): boolean {
    return this.form.controls
      .interiorFeatures
      .value
      .includes(interiorFeature);
  }

  private restoreInitialValue(): void {
    if (!this.initialValue) {
      return;
    }

    this.form.patchValue(
      {
        flooringTypes: [
          ...this.initialValue
            .flooringTypes
        ],

        otherFlooringType:
          this.initialValue
            .otherFlooringType ?? '',

        floorPlan:
          this.initialValue
            .floorPlan ?? '',

        ceilingFeatures: [
          ...this.initialValue
            .ceilingFeatures
        ],

        fireplaceCount:
          this.initialValue
            .fireplaceCount ?? null,

        fireplaceTypes: [
          ...this.initialValue
            .fireplaceTypes
        ],

        interiorFeatures: [
          ...this.initialValue
            .interiorFeatures
        ]
      },
      {
        emitEvent: false
      }
    );
  }

  private updateConditionalValidators():
    void {
    const hasOtherFlooring =
      this.form.controls
        .flooringTypes
        .value
        .includes('other');

    const otherFlooringControl =
      this.form.controls
        .otherFlooringType;

    if (hasOtherFlooring) {
      otherFlooringControl
        .setValidators([
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(100)
        ]);
    } else {
      otherFlooringControl
        .clearValidators();
    }

    otherFlooringControl
      .updateValueAndValidity({
        emitEvent: false
      });

    const fireplaceCount =
      this.form.controls
        .fireplaceCount
        .value ?? 0;

    if (
      fireplaceCount === 0 &&
      this.form.controls
        .fireplaceTypes
        .value.length > 0
    ) {
      this.form.controls
        .fireplaceTypes
        .setValue(
          [],
          {
            emitEvent: false
          }
        );
    }
  }

  private updateArrayControl<T>(
    control: {
      value: T[];
      setValue(
        value: T[]
      ): void;
      markAsTouched(): void;
    },
    item: T,
    checked: boolean
  ): void {
    const current = [
      ...control.value
    ];

    const updated = checked
      ? Array.from(
          new Set([
            ...current,
            item
          ])
        )
      : current.filter(
          value => value !== item
        );

    control.setValue(updated);
    control.markAsTouched();
  }

  private buildValue():
    ListingInterior {
    const value =
      this.form.getRawValue();

    return {
      flooringTypes:
        value.flooringTypes,

      otherFlooringType:
        value.flooringTypes
          .includes('other')
          ? value
              .otherFlooringType
              .trim()
          : undefined,

      floorPlan:
        value.floorPlan ||
        undefined,

      ceilingFeatures:
        value.ceilingFeatures,

      fireplaceCount:
        value.fireplaceCount ??
        undefined,

      fireplaceTypes:
        (value.fireplaceCount ?? 0) > 0
          ? value.fireplaceTypes
          : [],

      interiorFeatures:
        value.interiorFeatures
    };
  }

  private emitValue(): void {
    this.valueChange.emit(
      this.buildValue()
    );
  }

  private emitValidity(): void {
    const hasFlooringType =
      this.form.controls
        .flooringTypes
        .value.length > 0;

    const fireplaceCount =
      this.form.controls
        .fireplaceCount
        .value ?? 0;

    const hasRequiredFireplaceType =
      fireplaceCount === 0 ||
      this.form.controls
        .fireplaceTypes
        .value.length > 0;

    this.validityChange.emit(
      this.form.valid &&
      hasFlooringType &&
      hasRequiredFireplaceType
    );
  }
}