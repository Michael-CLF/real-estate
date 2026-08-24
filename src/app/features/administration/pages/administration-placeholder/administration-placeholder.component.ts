import {
  ChangeDetectionStrategy,
  Component,
  inject
} from '@angular/core';

import {
  ActivatedRoute,
  RouterLink
} from '@angular/router';

@Component({
  selector:
    'app-administration-placeholder',

  standalone:
    true,

  imports: [
    RouterLink
  ],

  templateUrl:
    './administration-placeholder.component.html',

  styleUrl:
    './administration-placeholder.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class AdministrationPlaceholderComponent {
  private readonly route =
    inject(ActivatedRoute);

  protected readonly title =
    String(
      this.route.snapshot
        .data['title'] ??
      'Administration'
    );

  protected readonly description =
    String(
      this.route.snapshot
        .data['description'] ??
      'This administration section will be available soon.'
    );

  protected readonly icon =
    String(
      this.route.snapshot
        .data['icon'] ??
      'fa-solid fa-screwdriver-wrench'
    );
}