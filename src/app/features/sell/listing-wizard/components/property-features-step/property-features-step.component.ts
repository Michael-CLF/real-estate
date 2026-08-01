import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  effect,
  inject,
  input,
  output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

export type PropertyFeaturesMode = 'unselected' | 'add' | 'skip';

export interface PropertyFeaturesFormValue {
  kitchenIsland: boolean;
  pantry: boolean;
  stoneCountertops: boolean;
  stainlessAppliances: boolean;
  gasRange: boolean;
  doubleOven: boolean;

  fireplace: boolean;
  hardwoodFloors: boolean;
  vaultedCeilings: boolean;
  homeOffice: boolean;
  bonusRoom: boolean;
  basement: boolean;

  walkInCloset: boolean;
  ensuiteBath: boolean;
  doubleVanity: boolean;
  soakingTub: boolean;
  separateShower: boolean;

  deck: boolean;
  patio: boolean;
  porch: boolean;
  fencedYard: boolean;
  pool: boolean;
  outdoorKitchen: boolean;

  attachedGarage: boolean;
  detachedGarage: boolean;
  carport: boolean;
  evCharging: boolean;

  centralHvac: boolean;
  heatPump: boolean;
  gasHeat: boolean;
  centralAir: boolean;
  solarPanels: boolean;
  generator: boolean;
  smartThermostat: boolean;
}

export interface PropertyFeaturesStepValue {
  mode: PropertyFeaturesMode;
  features: PropertyFeaturesFormValue;
}

@Component({
  selector: 'app-property-features-step',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './property-features-step.component.html',
  styleUrl: './property-features-step.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PropertyFeaturesStepComponent {
  private readonly fb = inject(FormBuilder);

  readonly initialValue = input<PropertyFeaturesStepValue | null>(null);

  @Output() readonly validityChange = new EventEmitter<boolean>();

  readonly valueChange = output<PropertyFeaturesStepValue>();

  protected mode: PropertyFeaturesMode = 'unselected';

  readonly form = this.fb.nonNullable.group({
    kitchenIsland: false,
    pantry: false,
    stoneCountertops: false,
    stainlessAppliances: false,
    gasRange: false,
    doubleOven: false,

    fireplace: false,
    hardwoodFloors: false,
    vaultedCeilings: false,
    homeOffice: false,
    bonusRoom: false,
    basement: false,

    walkInCloset: false,
    ensuiteBath: false,
    doubleVanity: false,
    soakingTub: false,
    separateShower: false,

    deck: false,
    patio: false,
    porch: false,
    fencedYard: false,
    pool: false,
    outdoorKitchen: false,

    attachedGarage: false,
    detachedGarage: false,
    carport: false,
    evCharging: false,

    centralHvac: false,
    heatPump: false,
    gasHeat: false,
    centralAir: false,
    solarPanels: false,
    generator: false,
    smartThermostat: false
  });

  constructor() {
    effect(() => {
      const initialValue = this.initialValue();

      if (initialValue) {
        this.mode = initialValue.mode;

        this.form.setValue(initialValue.features, {
          emitEvent: false
        });
      } else {
        this.mode = 'unselected';
      }

      this.emitValidity();
    });

    this.form.valueChanges.subscribe(() => {
      this.emitValue();
      this.emitValidity();
    });
  }

  protected selectAddFeatures(): void {
    this.mode = 'add';

    this.emitValue();
    this.emitValidity();
  }

  protected selectSkip(): void {
    this.mode = 'skip';

    this.form.reset(
      {
        kitchenIsland: false,
        pantry: false,
        stoneCountertops: false,
        stainlessAppliances: false,
        gasRange: false,
        doubleOven: false,

        fireplace: false,
        hardwoodFloors: false,
        vaultedCeilings: false,
        homeOffice: false,
        bonusRoom: false,
        basement: false,

        walkInCloset: false,
        ensuiteBath: false,
        doubleVanity: false,
        soakingTub: false,
        separateShower: false,

        deck: false,
        patio: false,
        porch: false,
        fencedYard: false,
        pool: false,
        outdoorKitchen: false,

        attachedGarage: false,
        detachedGarage: false,
        carport: false,
        evCharging: false,

        centralHvac: false,
        heatPump: false,
        gasHeat: false,
        centralAir: false,
        solarPanels: false,
        generator: false,
        smartThermostat: false
      },
      {
        emitEvent: false
      }
    );

    this.emitValue();
    this.emitValidity();
  }

  private emitValue(): void {
    this.valueChange.emit({
      mode: this.mode,
      features: this.form.getRawValue()
    });
  }

  private emitValidity(): void {
    if (this.mode === 'skip') {
      this.validityChange.emit(true);
      return;
    }

    if (this.mode === 'unselected') {
      this.validityChange.emit(false);
      return;
    }

    const features = this.form.getRawValue();

    const selectedCount = Object.values(features).filter(
      value => value === true
    ).length;

    this.validityChange.emit(selectedCount >= 1);
  }
}