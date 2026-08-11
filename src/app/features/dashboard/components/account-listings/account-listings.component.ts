import {
  ChangeDetectionStrategy,
  Component,
  input,
  output
} from '@angular/core';

import {
  CurrencyPipe
} from '@angular/common';

import {
  RouterLink
} from '@angular/router';

import {
  Listing
} from '../../../../core/domains/listings/models/listing.model';

@Component({
  selector: 'app-account-listings',
  standalone: true,
  imports: [
    CurrencyPipe,
    RouterLink
  ],
  templateUrl: './account-listings.component.html',
  styleUrl: './account-listings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountListingsComponent {

  readonly listings =
    input.required<Listing[]>();

  readonly emptyMessage =
    input('No listings found.');

  readonly actionLabel =
    input('Enhance Listing');

  readonly actionSelected =
    output<Listing>();
}