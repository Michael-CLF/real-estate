import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject
} from '@angular/core';

import {
  ActivatedRoute,
  RouterLink
} from '@angular/router';

import {
  toSignal
} from '@angular/core/rxjs-interop';

import {
  EducationArticleCardComponent
} from '../../components/education-article-card/education-article-card.component';

import {
  EducationCategoryNavigationComponent
} from '../../components/education-category-navigation/education-category-navigation.component';

import {
  EducationContentService
} from '../../services/education-content.service';

@Component({
  selector:
    'app-education-article',

  standalone:
    true,

  imports: [
    RouterLink,
    EducationArticleCardComponent,
    EducationCategoryNavigationComponent
  ],

  templateUrl:
    './education-article.component.html',

  styleUrl:
    './education-article.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class EducationArticleComponent {

  private readonly route =
    inject(ActivatedRoute);

  private readonly educationContentService =
    inject(EducationContentService);

  private readonly routeParameters =
    toSignal(
      this.route.paramMap,
      {
        initialValue:
          this.route.snapshot.paramMap
      }
    );

  protected readonly categories =
    this.educationContentService
      .getCategories();

  protected readonly categorySlug =
    computed(
      () =>
        this.routeParameters().get(
          'categorySlug'
        ) ?? ''
    );

  protected readonly articleSlug =
    computed(
      () =>
        this.routeParameters().get(
          'articleSlug'
        ) ?? ''
    );

  protected readonly category =
    computed(
      () =>
        this.educationContentService
          .getCategoryBySlug(
            this.categorySlug()
          )
    );

  protected readonly article =
    computed(() => {
      const article =
        this.educationContentService
          .getArticleBySlug(
            this.articleSlug()
          );

      if (
        !article ||
        article.categorySlug !==
          this.categorySlug()
      ) {
        return null;
      }

      return article;
    });

  protected readonly relatedArticles =
    computed(() => {
      const article =
        this.article();

      if (!article) {
        return [];
      }

      return this.educationContentService
        .getRelatedArticles(article)
        .slice(0, 3);
    });

  protected printArticle(): void {
    window.print();
  }
}