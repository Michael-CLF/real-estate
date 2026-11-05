
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const db = getFirestore();

const REGION = 'us-east1';
const COLLECTION = 'blogArticles';

function requireAdmin(
  auth: {
    uid: string;
    token: Record<string, unknown>;
  } | undefined
): void {
  if (!auth) {
    throw new HttpsError(
      'unauthenticated',
      'You must be signed in.'
    );
  }

  const isAdmin =
    auth.token['admin'] === true ||
    auth.token['role'] === 'admin';

  if (!isAdmin) {
    throw new HttpsError(
      'permission-denied',
      'Administrator access is required.'
    );
  }
}

function requiredString(
  value: unknown,
  field: string,
  maxLength: number
): string {
  if (typeof value !== 'string') {
    throw new HttpsError(
      'invalid-argument',
      `${field} must be a string.`
    );
  }

  const result = value.trim();

  if (!result || result.length > maxLength) {
    throw new HttpsError(
      'invalid-argument',
      `${field} must contain 1–${maxLength} characters.`
    );
  }

  return result;
}

function optionalString(
  value: unknown,
  field: string,
  maxLength: number
): string {
  if (value === undefined || value === null) {
    return '';
  }

  if (typeof value !== 'string' || value.length > maxLength) {
    throw new HttpsError(
      'invalid-argument',
      `${field} exceeds its permitted length or is invalid.`
    );
  }

  return value.trim();
}

function validateSlug(value: unknown): string {
  const slug = requiredString(value, 'slug', 160);

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new HttpsError(
      'invalid-argument',
      'Invalid article slug.'
    );
  }

  return slug;
}

export const getBlogAdminArticles = onCall(
  { region: REGION },
  async request => {
    requireAdmin(request.auth);

    const snapshot = await db.collection(COLLECTION).get();

    return {
      articles: snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data()['createdAt']?.toDate?.()?.toISOString() ?? null,
        updatedAt: doc.data()['updatedAt']?.toDate?.()?.toISOString() ?? null,
        publishedAt: doc.data()['publishedAt']?.toDate?.()?.toISOString() ?? null
      }))
    };
  }
);

export const saveBlogDraft = onCall(
  { region: REGION },
  async request => {
    requireAdmin(request.auth);

    const data = request.data ?? {};
    const slug = validateSlug(data.slug);

    const input = {
      slug,
      title: requiredString(data.title, 'title', 200),
      summary: optionalString(data.summary, 'summary', 1000),
      contentHtml: requiredString(
        data.contentHtml,
        'contentHtml',
        200000
      ),
      seoTitle: optionalString(data.seoTitle, 'seoTitle', 200),
      metaDescription: optionalString(
        data.metaDescription,
        'metaDescription',
        500
      ),
      featuredImageUrl: optionalString(
        data.featuredImageUrl,
        'featuredImageUrl',
        2000
      ),
      featuredImagePath: optionalString(
        data.featuredImagePath,
        'featuredImagePath',
        1000
      ),
      featuredImageAlt: optionalString(
        data.featuredImageAlt,
        'featuredImageAlt',
        300
      ),
      authorName: optionalString(
        data.authorName,
        'authorName',
        150
      ) || 'NavStreet'
    };

    const ref = db.collection(COLLECTION).doc(slug);

    await db.runTransaction(async transaction => {
      const existing = await transaction.get(ref);

      if (existing.exists &&
          existing.data()?.['status'] === 'published') {
        throw new HttpsError(
          'failed-precondition',
          'Published articles cannot be overwritten as drafts.'
        );
      }

      transaction.set(
        ref,
        {
          ...input,
          status: 'draft',
          updatedAt: FieldValue.serverTimestamp(),
          ...(!existing.exists
            ? {
                createdAt: FieldValue.serverTimestamp(),
                publishedAt: null
              }
            : {})
        },
        { merge: true }
      );
    });

    return { success: true, slug };
  }
);

export const publishBlogArticle = onCall(
  { region: REGION },
  async request => {
    requireAdmin(request.auth);

    const slug = validateSlug(request.data?.slug);
    const ref = db.collection(COLLECTION).doc(slug);

    await db.runTransaction(async transaction => {
      const snapshot = await transaction.get(ref);

      if (!snapshot.exists) {
        throw new HttpsError(
          'not-found',
          'Article not found.'
        );
      }

      const article = snapshot.data();

      if (!article?.['title'] || !article?.['contentHtml']) {
        throw new HttpsError(
          'failed-precondition',
          'Article must have a title and content before publishing.'
        );
      }

      transaction.update(ref, {
        status: 'published',
        publishedAt:
          article['publishedAt'] ?? FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });
    });

    return { success: true, slug };
  }
);
