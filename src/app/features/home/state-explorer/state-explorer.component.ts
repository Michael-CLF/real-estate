import { ChangeDetectionStrategy, Component } from '@angular/core';

interface StateOption {
  abbreviation: string;
  isActive: boolean;
  name: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-state-explorer',
  standalone: true,
  styleUrl: './state-explorer.component.scss',
  templateUrl: './state-explorer.component.html'
})
export class StateExplorerComponent {
  protected readonly states: StateOption[] = [
    { abbreviation: 'AL', isActive: false, name: 'Alabama' },
    { abbreviation: 'AK', isActive: false, name: 'Alaska' },
    { abbreviation: 'AZ', isActive: false, name: 'Arizona' },
    { abbreviation: 'AR', isActive: false, name: 'Arkansas' },
    { abbreviation: 'CA', isActive: false, name: 'California' },
    { abbreviation: 'CO', isActive: false, name: 'Colorado' },
    { abbreviation: 'CT', isActive: false, name: 'Connecticut' },
    { abbreviation: 'DE', isActive: false, name: 'Delaware' },
    { abbreviation: 'FL', isActive: false, name: 'Florida' },
    { abbreviation: 'GA', isActive: false, name: 'Georgia' },
    { abbreviation: 'HI', isActive: false, name: 'Hawaii' },
    { abbreviation: 'ID', isActive: false, name: 'Idaho' },
    { abbreviation: 'IL', isActive: false, name: 'Illinois' },
    { abbreviation: 'IN', isActive: false, name: 'Indiana' },
    { abbreviation: 'IA', isActive: false, name: 'Iowa' },
    { abbreviation: 'KS', isActive: false, name: 'Kansas' },
    { abbreviation: 'KY', isActive: false, name: 'Kentucky' },
    { abbreviation: 'LA', isActive: false, name: 'Louisiana' },
    { abbreviation: 'ME', isActive: false, name: 'Maine' },
    { abbreviation: 'MD', isActive: false, name: 'Maryland' },
    { abbreviation: 'MA', isActive: false, name: 'Massachusetts' },
    { abbreviation: 'MI', isActive: false, name: 'Michigan' },
    { abbreviation: 'MN', isActive: false, name: 'Minnesota' },
    { abbreviation: 'MS', isActive: false, name: 'Mississippi' },
    { abbreviation: 'MO', isActive: false, name: 'Missouri' },
    { abbreviation: 'MT', isActive: false, name: 'Montana' },
    { abbreviation: 'NE', isActive: false, name: 'Nebraska' },
    { abbreviation: 'NV', isActive: false, name: 'Nevada' },
    { abbreviation: 'NH', isActive: false, name: 'New Hampshire' },
    { abbreviation: 'NJ', isActive: false, name: 'New Jersey' },
    { abbreviation: 'NM', isActive: false, name: 'New Mexico' },
    { abbreviation: 'NY', isActive: false, name: 'New York' },
    { abbreviation: 'NC', isActive: true, name: 'North Carolina' },
    { abbreviation: 'ND', isActive: false, name: 'North Dakota' },
    { abbreviation: 'OH', isActive: false, name: 'Ohio' },
    { abbreviation: 'OK', isActive: false, name: 'Oklahoma' },
    { abbreviation: 'OR', isActive: false, name: 'Oregon' },
    { abbreviation: 'PA', isActive: false, name: 'Pennsylvania' },
    { abbreviation: 'RI', isActive: false, name: 'Rhode Island' },
    { abbreviation: 'SC', isActive: false, name: 'South Carolina' },
    { abbreviation: 'SD', isActive: false, name: 'South Dakota' },
    { abbreviation: 'TN', isActive: false, name: 'Tennessee' },
    { abbreviation: 'TX', isActive: false, name: 'Texas' },
    { abbreviation: 'UT', isActive: false, name: 'Utah' },
    { abbreviation: 'VT', isActive: false, name: 'Vermont' },
    { abbreviation: 'VA', isActive: false, name: 'Virginia' },
    { abbreviation: 'WA', isActive: false, name: 'Washington' },
    { abbreviation: 'WV', isActive: false, name: 'West Virginia' },
    { abbreviation: 'WI', isActive: false, name: 'Wisconsin' },
    { abbreviation: 'WY', isActive: false, name: 'Wyoming' }
  ];

  protected selectState(state: StateOption): void {
    if (!state.isActive) {
      return;
    }

    console.log(`Selected state: ${state.name}`);
  }
}