import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { SavedPropertySummary } from '../../models/dashboard-state.model';

@Component({
  selector: 'app-saved-homes',
  standalone: true,
  imports: [
    RouterLink,
    CurrencyPipe
  ],
  templateUrl: './saved-homes.component.html',
  styleUrl: './saved-homes.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SavedHomesComponent {

  readonly savedHomes = input.required<SavedPropertySummary[]>();

}