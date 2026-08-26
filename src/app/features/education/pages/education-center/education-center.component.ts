import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal
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
    'app-education-center',

  standalone:
    true,

  imports: [
    RouterLink,
    EducationArticleCardComponent,
    EducationCategoryNavigationComponent
  ],

  templateUrl:
    './education-center.component.html',

  styleUrl:
    './education-center.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class EducationCenterComponent {

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

  protected readonly searchTerm =
    signal('');

  protected readonly categories =
    this.educationContentService
      .getCategories();

  protected readonly activeCategorySlug =
    computed(
      () =>
        this.routeParameters().get(
          'categorySlug'
        )
    );

  protected readonly activeCategory =
    computed(() => {
      const categorySlug =
        this.activeCategorySlug();

      if (!categorySlug) {
        return null;
      }

      return this.educationContentService
        .getCategoryBySlug(
          categorySlug
        );
    });

  protected readonly categoryNotFound =
    computed(
      () =>
        this.activeCategorySlug() !==
          null &&
        this.activeCategory() ===
          null
    );

  protected readonly visibleArticles =
    computed(() => {
      const categorySlug =
        this.activeCategorySlug();

      const searchTerm =
        this.searchTerm();

      const categoryArticles =
        categorySlug
          ? this.educationContentService
              .getArticlesByCategory(
                categorySlug
              )
          : this.educationContentService
              .getArticles();

      if (!searchTerm.trim()) {
        return categoryArticles;
      }

      const matchingArticleSlugs =
        new Set(
          this.educationContentService
            .searchArticles(searchTerm)
            .map(
              article => article.slug
            )
        );

      return categoryArticles.filter(
        article =>
          matchingArticleSlugs.has(
            article.slug
          )
      );
    });

  protected readonly featuredArticles =
    this.educationContentService
      .getFeaturedArticles()
      .slice(0, 3);

  protected readonly pageTitle =
    computed(
      () =>
        this.activeCategory()?.title ??
        'Education Center'
    );

  protected readonly pageDescription =
    computed(
      () =>
        this.activeCategory()
          ?.description ??
        (
          'Clear guidance for buying, selling, ' +
          'financing, marketing, and managing ' +
          'a property through NavStreet.'
        )
    );

  protected updateSearchTerm(
    event: Event
  ): void {
    const inputElement =
      event.target as HTMLInputElement;

    this.searchTerm.set(
      inputElement.value
    );
  }

  protected clearSearch(): void {
    this.searchTerm.set('');
  }
}