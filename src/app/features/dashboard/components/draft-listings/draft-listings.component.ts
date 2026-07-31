import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Listing } from '../../../../core/domains/listings/models/listing.model';

@Component({
  selector: 'app-draft-listings',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './draft-listings.component.html',
  styleUrl: './draft-listings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DraftListingsComponent {

  readonly listings = input.required<Listing[]>();

}