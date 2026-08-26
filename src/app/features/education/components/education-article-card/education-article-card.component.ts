import {
  ChangeDetectionStrategy,
  Component,
  input
} from '@angular/core';

import {
  RouterLink
} from '@angular/router';

import {
  EducationArticle
} from '../../models/education-article.model';

@Component({
  selector:
    'app-education-article-card',

  standalone:
    true,

  imports: [
    RouterLink
  ],

  templateUrl:
    './education-article-card.component.html',

  styleUrl:
    './education-article-card.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class EducationArticleCardComponent {

  readonly article =
    input.required<EducationArticle>();
}