
export type BlogArticleStatus = 'draft' | 'published';

export interface BlogArticle {
  id: string;
  slug: string;

  title: string;
  summary: string;
  contentHtml: string;

  seoTitle: string;
  metaDescription: string;

  featuredImageUrl: string;
  featuredImagePath: string;
  featuredImageAlt: string;

  authorName: string;

  status: BlogArticleStatus;

  createdAt: Date | null;
  updatedAt: Date | null;
  publishedAt: Date | null;
}

export interface BlogArticleInput {
  slug: string;

  title: string;
  summary: string;
  contentHtml: string;

  seoTitle: string;
  metaDescription: string;

  featuredImageUrl: string;
  featuredImagePath: string;
  featuredImageAlt: string;

  authorName: string;
}
