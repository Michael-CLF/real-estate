
import {
  Component,
  OnInit,
  inject,
  signal,
  computed
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  BlogArticle,
  BlogArticleInput
} from '../../../blog/models/blog-article.model';

import { BlogService } from '../../../blog/services/blog.service';
import { BlogImageUploadService } from '../../../blog/services/blog-image-upload.service';

import { PageSeoService } from '../../../../core/seo/page-seo.service';

@Component({
  selector: 'app-blog-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './blog-admin.component.html',
  styleUrl: './blog-admin.component.scss'
})
export class BlogAdminComponent implements OnInit {
  private readonly blogService = inject(BlogService);
  private readonly imageUpload = inject(BlogImageUploadService);
  private readonly seo = inject(PageSeoService);

  readonly articles = signal<BlogArticle[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly uploadingImage = signal(false);
  readonly imageUploadProgress = signal(0);
  readonly publishing = signal(false);

  readonly error = signal('');
  readonly success = signal('');

  readonly editorOpen = signal(false);
  readonly previewOpen = signal(false);
  readonly editingSlug = signal<string | null>(null);
  readonly publishConfirmation = signal<string | null>(null);

  readonly publishedCount = computed(
    () => this.articles().filter(a => a.status === 'published').length
  );

  readonly draftCount = computed(
    () => this.articles().filter(a => a.status === 'draft').length
  );

  form: BlogArticleInput = this.emptyForm();

  ngOnInit(): void {
    this.seo.set(
      'Blog Administration | NavStreet',
      'Manage NavStreet blog articles.',
      true
    );

    void this.loadArticles();
  }

  private emptyForm(): BlogArticleInput {
    return {
      slug: '',
      title: '',
      summary: '',
      contentHtml: '',
      seoTitle: '',
      metaDescription: '',
      featuredImageUrl: '',
      featuredImagePath: '',
      featuredImageAlt: '',
      authorName: 'NavStreet'
    };
  }

  async loadArticles(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      const articles = await this.blogService.getAdminArticles();

      this.articles.set(
        [...articles].sort(
          (a, b) =>
            (b.updatedAt?.getTime() ?? 0) -
            (a.updatedAt?.getTime() ?? 0)
        )
      );
    } catch (error) {
      console.error('Unable to load blog articles:', error);
      this.error.set('Unable to load blog articles.');
    } finally {
      this.loading.set(false);
    }
  }

  createArticle(): void {
    this.form = this.emptyForm();
    this.editingSlug.set(null);
    this.editorOpen.set(true);
    this.previewOpen.set(false);
    this.publishConfirmation.set(null);
    this.error.set('');
    this.success.set('');
  }

  editArticle(article: BlogArticle): void {
    this.form = {
      slug: article.slug,
      title: article.title,
      summary: article.summary,
      contentHtml: article.contentHtml,
      seoTitle: article.seoTitle,
      metaDescription: article.metaDescription,
      featuredImageUrl: article.featuredImageUrl,
      featuredImagePath: article.featuredImagePath,
      featuredImageAlt: article.featuredImageAlt,
      authorName: article.authorName
    };

    this.editingSlug.set(article.slug);
    this.editorOpen.set(true);
    this.previewOpen.set(false);
    this.publishConfirmation.set(null);
    this.error.set('');
    this.success.set('');
  }

  generateSlug(): void {
    if (this.editingSlug()) {
      return;
    }

    this.form.slug = this.form.title
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  togglePreview(): void {
    this.previewOpen.update(value => !value);
  }

  closeEditor(): void {
    this.editorOpen.set(false);
    this.previewOpen.set(false);
    this.publishConfirmation.set(null);
    this.error.set('');
  }

  async onImageSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || this.uploadingImage()) return;
    this.error.set('');
    this.success.set('');
    this.uploadingImage.set(true);
    this.imageUploadProgress.set(0);
    try {
      const uploaded = await this.imageUpload.upload(file, progress => {
        this.imageUploadProgress.set(progress);
      });
      this.form.featuredImageUrl = uploaded.url;
      this.form.featuredImagePath = uploaded.path;
      this.success.set('Featured image uploaded. Save the draft to attach it to the article.');
    } catch (error) {
      console.error('Blog image upload failed:', error);
      this.error.set(error instanceof Error ? error.message : 'Image upload failed.');
    } finally {
      this.uploadingImage.set(false);
      input.value = '';
    }
  }

  async saveDraft(): Promise<void> {
    if (this.uploadingImage()) {
      this.error.set('Wait until the image finishes uploading.');
      return;
    }
    this.error.set('');
    this.success.set('');

    if (!this.form.title.trim()) {
      this.error.set('Article title is required.');
      return;
    }

    if (!this.form.slug.trim()) {
      this.error.set('Article URL slug is required.');
      return;
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(this.form.slug)) {
      this.error.set(
        'The URL slug must contain lowercase letters, numbers, and hyphens only.'
      );
      return;
    }

    if (!this.form.contentHtml.trim()) {
      this.error.set('Article content is required.');
      return;
    }

    this.saving.set(true);

    try {
      await this.blogService.saveDraft({ ...this.form });

      this.success.set('Draft saved successfully.');
      this.editorOpen.set(false);
      this.previewOpen.set(false);
      this.editingSlug.set(null);

      await this.loadArticles();
    } catch (error) {
      console.error('Unable to save blog draft:', error);
      this.error.set('Unable to save the article draft.');
    } finally {
      this.saving.set(false);
    }
  }

  requestPublish(article: BlogArticle): void {
    if (article.status !== 'draft') {
      return;
    }

    this.publishConfirmation.set(article.slug);
    this.error.set('');
    this.success.set('');
  }

  cancelPublish(): void {
    this.publishConfirmation.set(null);
  }

  async confirmPublish(): Promise<void> {
    const slug = this.publishConfirmation();

    if (!slug || this.publishing()) {
      return;
    }

    const article = this.articles().find(
      item => item.slug === slug
    );

    if (!article || article.status !== 'draft') {
      this.error.set('Only saved drafts can be published.');
      this.publishConfirmation.set(null);
      return;
    }

    this.publishing.set(true);
    this.error.set('');
    this.success.set('');

    try {
      await this.blogService.publishArticle(slug);

      this.publishConfirmation.set(null);

      await this.loadArticles();

      this.success.set(
        `Article "${article.title}" published successfully.`
      );
    } catch (error) {
      console.error('Unable to publish blog article:', error);
      this.error.set('Unable to publish the article.');
    } finally {
      this.publishing.set(false);
    }
  }

  formatDate(date: Date | null): string {
    if (!date) {
      return '—';
    }

    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  }
}
