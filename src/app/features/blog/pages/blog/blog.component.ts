
import {
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  RouterLink
} from '@angular/router';

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
  selector: 'app-blog',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './blog.component.html',
  styleUrl: './blog.component.scss'
})
export class BlogComponent implements OnInit {
  private readonly blogService = inject(BlogService);
  private readonly seo = inject(PageSeoService);

  readonly articles = signal<BlogArticle[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  ngOnInit(): void {
    this.seo.set(
      'For Sale by Owner Blog & Home Selling Tips | NavStreet',
      'Explore home selling tips, for sale by owner guides, real estate insights, and helpful resources for buyers and sellers on NavStreet.'
    );

    void this.loadArticles();
  }

  private async loadArticles(): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set('');

      const articles =
        await this.blogService.getPublishedArticles();

      this.articles.set(articles);
    } catch (error) {
      console.error('Unable to load blog articles:', error);

      this.error.set(
        'Articles are temporarily unavailable. Please try again later.'
      );
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
}
