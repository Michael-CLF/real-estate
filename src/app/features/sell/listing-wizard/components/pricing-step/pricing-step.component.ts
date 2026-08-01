import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

export interface PricingFormValue {
  listPrice: number | null;
}

@Component({
  selector: 'app-pricing-step',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './pricing-step.component.html',
  styleUrl: './pricing-step.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PricingStepComponent {
  private readonly fb = inject(FormBuilder);

  readonly initialValue = input<PricingFormValue | null>(null);
  readonly squareFeet = input<number | null>(null);

  readonly validityChange = output<boolean>();
  readonly valueChange = output<PricingFormValue>();

  readonly form = this.fb.nonNullable.group({
    listPrice: [
      null as number | null,
      [
        Validators.required,
        Validators.min(1),
        Validators.max(1000000000)
      ]
    ]
  });

  constructor() {
    effect(() => {
      const initialValue = this.initialValue();

      if (initialValue) {
        this.form.setValue(initialValue, {
          emitEvent: false
        });
      }

      this.validityChange.emit(this.form.valid);
    });

    this.form.valueChanges.subscribe(() => {
      this.valueChange.emit(
        this.form.getRawValue() as PricingFormValue
      );

      this.validityChange.emit(this.form.valid);
    });
  }

  protected get formattedListPrice(): string {
    const listPrice = this.form.controls.listPrice.value;

    if (!listPrice || listPrice <= 0) {
      return '—';
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(listPrice);
  }

  protected get pricePerSquareFoot(): string {
    const listPrice = this.form.controls.listPrice.value;
    const squareFeet = this.squareFeet();

    if (
      !listPrice ||
      listPrice <= 0 ||
      !squareFeet ||
      squareFeet <= 0
    ) {
      return '—';
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(listPrice / squareFeet);
  }
}