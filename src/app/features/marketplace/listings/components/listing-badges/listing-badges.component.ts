import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input
} from '@angular/core';

import {
  ListingBadge
} from '../../../../../core/domains/listings/models/listing-badge.model';


@Component({
  selector: 'app-listing-badges',
  standalone: true,
  templateUrl: './listing-badges.component.html',
  styleUrl: './listing-badges.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListingBadgesComponent {
  readonly badges = input<readonly ListingBadge[]>([]);
  readonly maximumVisible = input<number>();

  protected readonly visibleBadges = computed(() => {
    const maximumVisible = this.maximumVisible();

    return maximumVisible === undefined
      ? this.badges()
      : this.badges().slice(
          0,
          Math.max(0, maximumVisible)
        );
  });
}