
import {
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';

import {
  CommonModule,
  DOCUMENT
} from '@angular/common';

import {
  ActivatedRoute,
  RouterLink
} from '@angular/router';

import {
  DomSanitizer,
  SafeHtml
} from '@angular/platform-browser';

import {
  BlogService
} from '../../services/blog.service';

import {
  BlogArticle
} from '../../models/blog-article.model';

import {
  PageSeoService
} from '../../../../core/seo/page-seo.service';

@Component({
  selector: 'app-blog-article',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './blog-article.component.html',
  styleUrl: './blog-article.component.scss'
})
export class BlogArticleComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly blogService = inject(BlogService);
  private readonly seo = inject(PageSeoService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly document = inject(DOCUMENT);

  readonly article = signal<BlogArticle | null>(null);
  readonly articleHtml = signal<SafeHtml>('');
  readonly loading = signal(true);
  readonly error = signal('');
  readonly notFound = signal(false);

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');

      if (!slug) {
        this.notFound.set(true);
        this.loading.set(false);
        return;
      }

      void this.loadArticle(slug);
    });
  }

  private async loadArticle(slug: string): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    this.notFound.set(false);
    this.article.set(null);
    this.articleHtml.set('');

    try {
      const article =
        await this.blogService.getPublishedArticle(slug);

      if (!article) {
        this.notFound.set(true);

        this.seo.set(
          'Article Not Found | NavStreet',
          'The requested NavStreet blog article could not be found.',
          true
        );

        this.removeArticleSchema();
        return;
      }

      this.article.set(article);

      // Angular sanitizes HTML when bound with [innerHTML].
      // Do not bypass security for administrator-authored content.
      this.articleHtml.set(
        this.sanitizer.sanitize(1, article.contentHtml) ?? ''
      );

      this.seo.set(
        article.seoTitle || `${article.title} | NavStreet`,
        article.metaDescription || article.summary
      );

      this.updateArticleSchema(article);

    } catch (error) {
      console.error('Unable to load blog article:', error);

      this.error.set(
        'This article is temporarily unavailable. Please try again later.'
      );

      this.seo.set(
        'Blog Article Unavailable | NavStreet',
        'The requested NavStreet article is temporarily unavailable.',
        true
      );

      this.removeArticleSchema();
    } finally {
      this.loading.set(false);
    }
  }

  formatDate(date: Date | null): string {
    if (!date) {
      return '';
    }

    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  }

  private updateArticleSchema(article: BlogArticle): void {
    this.removeArticleSchema();

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.title,
      description: article.metaDescription || article.summary,
      image: article.featuredImageUrl || undefined,
      datePublished: article.publishedAt?.toISOString(),
      dateModified: article.updatedAt?.toISOString(),
      author: {
        '@type': 'Organization',
        name: article.authorName || 'NavStreet'
      },
      publisher: {
        '@type': 'Organization',
        name: 'NavStreet',
        url: 'https://navstreet.com'
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `https://navstreet.com/blog/${article.slug}`
      }
    };

    const script = this.document.createElement('script');
    script.id = 'navstreet-blog-article-schema';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema).replace(/</g, '\\u003c');

    this.document.head.appendChild(script);
  }

  private removeArticleSchema(): void {
    this.document
      .getElementById('navstreet-blog-article-schema')
      ?.remove();
  }
}
