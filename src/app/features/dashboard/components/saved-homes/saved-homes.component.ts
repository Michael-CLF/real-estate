import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal
} from '@angular/core';

import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import {
  SavedPropertySummary
} from '../../models/dashboard-state.model';

@Component({
  selector: 'app-saved-homes',
  standalone: true,
  imports: [
    RouterLink,
    CurrencyPipe
  ],
  templateUrl: './saved-homes.component.html',
  styleUrl: './saved-homes.component.scss',
  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class SavedHomesComponent {

  readonly savedHomes =
    input.required<SavedPropertySummary[]>();

  readonly removeRequested =
    output<SavedPropertySummary>();

  protected readonly propertyPendingRemoval =
    signal<SavedPropertySummary | null>(
      null
    );

  readonly removingListingUid =
    input<string | null>(null);

  protected requestRemoval(
    property: SavedPropertySummary
  ): void {
    this.propertyPendingRemoval.set(
      property
    );
  }

  protected cancelRemoval(): void {
    if (this.removingListingUid()) {
      return;
    }

    this.propertyPendingRemoval.set(null);
  }

  protected confirmRemoval(): void {
    const property =
      this.propertyPendingRemoval();

    if (
      !property ||
      this.removingListingUid()
    ) {
      return;
    }

    this.removeRequested.emit(property);

    this.propertyPendingRemoval.set(null);
  }


  protected closeConfirmation(): void {
    this.propertyPendingRemoval.set(null);
  }
}