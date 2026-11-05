
import { Injectable } from '@angular/core';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
  Timestamp
} from 'firebase/firestore';

import {
  httpsCallable
} from 'firebase/functions';

import {
  firestore,
  functions
} from '../../../core/infrastructure/firebase/firebase';

import {
  BlogArticle,
  BlogArticleInput,
  BlogArticleStatus
} from '../models/blog-article.model';

interface BlogArticleResponse {
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
  createdAt: unknown;
  updatedAt: unknown;
  publishedAt: unknown;
}

interface AdminArticlesResponse {
  articles: BlogArticleResponse[];
}

interface BlogOperationResponse {
  success: boolean;
  slug: string;
}

@Injectable({
  providedIn: 'root'
})
export class BlogService {
  private readonly collectionName = 'blogArticles';

  private articlesCollection() {
    return collection(firestore, this.collectionName);
  }

  private toDate(value: unknown): Date | null {
    if (value instanceof Timestamp) {
      return value.toDate();
    }

    if (value instanceof Date) {
      return value;
    }

    if (typeof value === 'string') {
      const date = new Date(value);

      return Number.isNaN(date.getTime())
        ? null
        : date;
    }

    if (
      value &&
      typeof value === 'object' &&
      'seconds' in value &&
      typeof value.seconds === 'number'
    ) {
      return new Date(value.seconds * 1000);
    }

    return null;
  }

  private mapArticle(
    id: string,
    data: Record<string, unknown>
  ): BlogArticle {
    return {
      id,
      slug: String(data['slug'] ?? ''),
      title: String(data['title'] ?? ''),
      summary: String(data['summary'] ?? ''),
      contentHtml: String(data['contentHtml'] ?? ''),
      seoTitle: String(data['seoTitle'] ?? ''),
      metaDescription: String(data['metaDescription'] ?? ''),
      featuredImageUrl: String(data['featuredImageUrl'] ?? ''),
      featuredImagePath: String(data['featuredImagePath'] ?? ''),
      featuredImageAlt: String(data['featuredImageAlt'] ?? ''),
      authorName: String(data['authorName'] ?? ''),
      status: data['status'] === 'published'
        ? 'published'
        : 'draft',
      createdAt: this.toDate(data['createdAt']),
      updatedAt: this.toDate(data['updatedAt']),
      publishedAt: this.toDate(data['publishedAt'])
    };
  }

  /*
   * PUBLIC: Published blog articles
   */
  async getPublishedArticles(): Promise<BlogArticle[]> {
    const articlesQuery = query(
      this.articlesCollection(),
      where('status', '==', 'published'),
      orderBy('publishedAt', 'desc')
    );

    const snapshot = await getDocs(articlesQuery);

    return snapshot.docs.map(article =>
      this.mapArticle(article.id, article.data())
    );
  }

  /*
   * PUBLIC: Individual published article
   */
  async getPublishedArticle(
    slug: string
  ): Promise<BlogArticle | null> {
    const articleRef = doc(
      firestore,
      this.collectionName,
      slug
    );

    const snapshot = await getDoc(articleRef);

    if (!snapshot.exists()) {
      return null;
    }

    const article = this.mapArticle(
      snapshot.id,
      snapshot.data()
    );

    return article.status === 'published'
      ? article
      : null;
  }

  /*
   * ADMIN: Retrieve all articles, including drafts.
   * Uses a secured Firebase callable function.
   */
  async getAdminArticles(): Promise<BlogArticle[]> {
    const callable = httpsCallable<
      Record<string, never>,
      AdminArticlesResponse
    >(
      functions,
      'getBlogAdminArticles'
    );

    const result = await callable({});

    return result.data.articles.map(article =>
      this.mapArticle(
        article.id,
        article as unknown as Record<string, unknown>
      )
    );
  }

  /*
   * ADMIN: Create or update an unpublished draft.
   */
  async saveDraft(
    input: BlogArticleInput
  ): Promise<void> {
    const callable = httpsCallable<
      BlogArticleInput,
      BlogOperationResponse
    >(
      functions,
      'saveBlogDraft'
    );

    const result = await callable(input);

    if (!result.data.success) {
      throw new Error('Unable to save the blog draft.');
    }
  }

  /*
   * ADMIN: Publish an existing draft.
   */
  async publishArticle(
    slug: string
  ): Promise<void> {
    const callable = httpsCallable<
      { slug: string },
      BlogOperationResponse
    >(
      functions,
      'publishBlogArticle'
    );

    const result = await callable({ slug });

    if (!result.data.success) {
      throw new Error('Unable to publish the blog article.');
    }
  }
}
