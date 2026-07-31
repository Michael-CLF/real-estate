import { Component } from '@angular/core';

import { AddressStepComponent } from './components/address-step/address-step.component';

@Component({
  selector: 'app-listing-wizard',
  standalone: true,
  imports: [
    AddressStepComponent
  ],
  templateUrl: './listing-wizard.component.html',
  styleUrl: './listing-wizard.component.scss'
})
export class ListingWizardComponent {

}