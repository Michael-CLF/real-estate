import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  RouterLink
} from '@angular/router';

import {
  STATES
} from '../../../core/configuration/states.config';

interface StateOption {
  abbreviation: string;
  isActive: boolean;
  name: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-state-explorer',
  standalone: true,
  imports: [RouterLink],
  styleUrl: './state-explorer.component.scss',
  templateUrl: './state-explorer.component.html'
})
export class StateExplorerComponent {
  protected readonly states =STATES

  protected selectState(state: StateOption): void {
    if (!state.isActive) {
      return;
    }

    console.log(`Selected state: ${state.name}`);
  }
}