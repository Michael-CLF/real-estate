import {
  ChangeDetectionStrategy,
  Component,
  input
} from '@angular/core';

import {
  RouterLink,
  RouterLinkActive
} from '@angular/router';

import {
  EducationCategory
} from '../../models/education-category.model';

@Component({
  selector:
    'app-education-category-navigation',

  standalone:
    true,

  imports: [
    RouterLink,
    RouterLinkActive
  ],

  templateUrl:
    './education-category-navigation.component.html',

  styleUrl:
    './education-category-navigation.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class EducationCategoryNavigationComponent {

  readonly categories =
    input.required<
      readonly EducationCategory[]
    >();

  readonly activeCategorySlug =
    input<string | null>(null);
}