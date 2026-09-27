import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output
} from '@angular/core';

import {
  ControlContainer,
  FormGroup,
  FormGroupDirective,
  ReactiveFormsModule
} from '@angular/forms';

import { formatOfferPhone } from '../../../../engine/format-offer-phone';


@Component({
  selector:
    'app-buyer-property-section',

  standalone: true,

  imports: [
    ReactiveFormsModule
  ],

  templateUrl:
    './buyer-property-section.component.html',

  styleUrl:
    './buyer-property-section.component.scss',

  viewProviders: [
    {
      provide:
        ControlContainer,

      useExisting:
        FormGroupDirective
    }
  ],

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class BuyerPropertySectionComponent {

  readonly coBuyerLocked = input(false);
  readonly canAddCoBuyer = input(false);
  readonly coBuyerToggle = output<void>();

  private readonly parentFormDirective =
    inject(FormGroupDirective);

  get sectionForm(): FormGroup {
    const section =
      this.parentFormDirective
        .form
        .get(
          'buyerProperty'
        );

    if (!(section instanceof FormGroup)) {
      throw new Error(
        'The buyerProperty offer section is unavailable.'
      );
    }

    return section;
  }

  onCoBuyerToggle(): void {
    this.coBuyerToggle.emit();
  }

  formatCoBuyerPhone(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formatted = formatOfferPhone(input.value, true);
    input.value = formatted;
    this.sectionForm.get('coBuyerPhone')?.setValue(formatted);
  }
}
