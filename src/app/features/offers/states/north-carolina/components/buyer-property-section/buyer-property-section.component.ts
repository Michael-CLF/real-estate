import {
  ChangeDetectionStrategy,
  Component,
  inject
} from '@angular/core';

import {
  ControlContainer,
  FormGroup,
  FormGroupDirective,
  ReactiveFormsModule
} from '@angular/forms';


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
}
