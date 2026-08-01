import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  Listing,
  ListingDraftStep
} from '../../../../core/domains/listings/models/listing.model';

@Component({
  selector: 'app-draft-listings',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink
  ],
  templateUrl: './draft-listings.component.html',
  styleUrl: './draft-listings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DraftListingsComponent {
  readonly listings = input.required<Listing[]>();

  getStepLabel(step?: ListingDraftStep): string {
    switch (step) {
      case 'address':
        return 'Property Address';
      case 'property_details':
        return 'Property Details';
      case 'property_features':
        return 'Property Features';
      case 'photos':
        return 'Photos';
      case 'pricing':
        return 'Pricing';
      case 'review':
        return 'Review & Publish';
      default:
        return 'Property Address';
    }
  }
}