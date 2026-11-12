
/**
 * NavStreet static blog SEO generator.
 * Runs after the Angular build and property SEO generation,
 * before uploading to IONOS.
 *
 * Creates:
 * /blog/index.html
 * /blog/{slug}/index.html
 *
 * Updates sitemap.xml.
 *
 * Static markup mirrors the existing Angular blog design.
 * No Angular component or SCSS file is modified.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const OUTPUT = resolve('dist/template/browser');
const ORIGIN = 'https://navstreet.com';

const escapeHtml = value =>
  String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[character]));

const safeJson = value =>
  JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');

const toIso = value => {
  try {
    const date = value?.toDate?.() ??
      (value ? new Date(value) : null);

    return date && !Number.isNaN(date.getTime())
      ? date.toISOString()
      : null;
  } catch {
    return null;
  }
};

const safeUrl = value => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
};

const formatDate = value => {
  const iso = toIso(value);

  return iso
    ? new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC'
      }).format(new Date(iso))
    : '';
};

const summaryPreview = value => {
  const summary = String(value ?? '');

  return summary.length > 150
    ? `${summary.substring(0, 150).trim()}...`
    : summary;
};

// Styles apply only to the initial static blog HTML.
// Angular component SCSS remains unchanged.

const STATIC_STYLES = `
<style id="navstreet-static-blog-styles">

.navstreet-static-blog.blog-page {
  min-height:70vh;
  padding:64px 24px 96px;
  background:#f8fafc;
}

.navstreet-static-blog .blog-container {
  width:100%;
  max-width:1200px;
  margin:0 auto;
}

.navstreet-static-blog .blog-header {
  max-width:780px;
  margin:0 auto 56px;
  text-align:center;
}

.navstreet-static-blog .blog-eyebrow {
  display:inline-block;
  margin-bottom:16px;
  color:#154360;
  font-size:.8rem;
  font-weight:700;
  letter-spacing:.12em;
  text-transform:uppercase;
}

.navstreet-static-blog .blog-header h1 {
  margin:0 0 20px;
  color:#154360;
  font-size:clamp(2rem,4vw,3rem);
  font-weight:700;
  line-height:1.2;
}

.navstreet-static-blog .blog-header p {
  margin:0;
  color:#526174;
  font-size:1.1rem;
  line-height:1.8;
}

.navstreet-static-blog .blog-grid {
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:30px;
  width:100%;
  min-width:0;
}

.navstreet-static-blog .blog-card {
  display:flex;
  flex-direction:column;
  overflow:hidden;
  min-width:0;
  background:#fff;
  border:1px solid #e2e8f0;
  border-radius:12px;
  box-shadow:
    rgba(0,0,0,.25) 0 54px 55px,
    rgba(0,0,0,.12) 0 -12px 30px,
    rgba(0,0,0,.12) 0 4px 6px,
    rgba(0,0,0,.17) 0 12px 13px,
    rgba(0,0,0,.09) 0 -3px 5px;
  transition:transform .2s ease,box-shadow .2s ease;
}

.navstreet-static-blog .blog-card:hover {
  box-shadow:
    rgba(21,67,96,.35) 0 20px 40px,
    rgba(21,67,96,.20) 0 8px 16px,
    rgba(21,67,96,.12) 0 2px 6px;
}

.navstreet-static-blog .blog-card-image {
  display:block;
  width:100%;
  aspect-ratio:16/9;
  overflow:hidden;
  background:#e8eef3;
}

.navstreet-static-blog .blog-card-image img {
  display:block;
  width:100%;
  height:100%;
  object-fit:cover;
  transition:transform .3s ease;
}

.navstreet-static-blog .blog-card-image:hover img {
  transform:scale(1.04);
}

.navstreet-static-blog .blog-image-placeholder {
  display:flex;
  align-items:center;
  justify-content:center;
  width:100%;
  height:100%;
  background:linear-gradient(135deg,#154360,#2874a6);
  color:#fff;
  font-size:1.5rem;
  font-weight:700;
}

.navstreet-static-blog .blog-card-content {
  display:flex;
  flex:1;
  flex-direction:column;
  padding:26px;
  min-width:0;
  overflow-wrap:anywhere;
}

.navstreet-static-blog .blog-card-content h2 {
  margin:12px 0 14px;
  font-size:1.25rem;
  font-weight:700;
  line-height:1.4;
}

.navstreet-static-blog .blog-card-content h2 a {
  color:#154360;
  text-decoration:none;
}

.navstreet-static-blog .blog-card-content h2 a:hover {
  color:#2874a6;
}

.navstreet-static-blog .blog-date {
  color:#64748b;
  font-size:.85rem;
}

.navstreet-static-blog .blog-summary {
  flex:1;
  margin:0 0 24px;
  color:#526174;
  font-size:.96rem;
  line-height:1.7;
}

.navstreet-static-blog .blog-read-more {
  display:inline-flex;
  align-items:center;
  gap:8px;
  align-self:flex-start;
  color:#154360;
  font-weight:700;
  text-decoration:none;
}

.navstreet-static-blog .blog-read-more:hover {
  color:#2874a6;
  text-decoration:underline;
}

.navstreet-static-blog .blog-message {
  padding:64px 24px;
  background:#fff;
  border:1px solid #e2e8f0;
  border-radius:12px;
  text-align:center;
}

.navstreet-static-blog .blog-message h2 {
  margin:0 0 12px;
  color:#154360;
}

.navstreet-static-blog .blog-message p {
  margin:0;
  color:#526174;
}

/* Static article */

.navstreet-static-article.blog-article-page {
  min-height:75vh;
  padding:40px 24px 96px;
  background:#f8fafc;
}

.navstreet-static-article .article-container {
  width:100%;
  max-width:900px;
  margin:0 auto;
}

.navstreet-static-article .article-navigation {
  margin-bottom:40px;
}

.navstreet-static-article .article-navigation a {
  display:inline-flex;
  align-items:center;
  gap:10px;
  color:#154360;
  font-size:.95rem;
  font-weight:600;
  text-decoration:none;
}

.navstreet-static-article .article-navigation a:hover {
  color:#2874a6;
  text-decoration:underline;
}

.navstreet-static-article .article-content {
  overflow:hidden;
  background:#fff;
  border:1px solid #e2e8f0;
  border-radius:12px;
  box-shadow:
    rgba(0,0,0,.25) 0 54px 55px,
    rgba(0,0,0,.12) 0 -12px 30px,
    rgba(0,0,0,.12) 0 4px 6px,
    rgba(0,0,0,.17) 0 12px 13px,
    rgba(0,0,0,.09) 0 -3px 5px;
}

.navstreet-static-article .article-header {
  padding:56px 56px 36px;
}

.navstreet-static-article .article-category {
  display:inline-block;
  margin-bottom:18px;
  color:#2874a6;
  font-size:.8rem;
  font-weight:700;
  letter-spacing:.12em;
}

.navstreet-static-article .article-header h1 {
  margin:0 0 24px;
  color:#154360;
  font-size:clamp(2rem,4vw,2.8rem);
  font-weight:700;
  line-height:1.2;
}

.navstreet-static-article .article-summary {
  margin:0 0 24px;
  color:#526174;
  font-size:1.15rem;
  line-height:1.8;
}

.navstreet-static-article .article-meta {
  display:flex;
  align-items:center;
  flex-wrap:wrap;
  gap:10px;
  color:#64748b;
  font-size:.9rem;
}

.navstreet-static-article .article-author {
  font-weight:600;
  color:#334155;
}

.navstreet-static-article .meta-separator {
  color:#94a3b8;
}

.navstreet-static-article .article-featured-image {
  margin:0;
  padding:0 56px 24px;
}

.navstreet-static-article .article-featured-image img {
  display:block;
  width:100%;
  height:auto;
  max-height:480px;
  object-fit:cover;
  border-radius:8px;
}

.navstreet-static-article .article-body {
  padding:16px 56px 56px;
  color:#334155;
  font-size:1.05rem;
  line-height:1.85;
  overflow-wrap:anywhere;
}

.navstreet-static-article .article-body h2,
.navstreet-static-article .article-body h3,
.navstreet-static-article .article-body h4 {
  color:#154360;
  font-weight:700;
  line-height:1.35;
}

.navstreet-static-article .article-body h2 {
  margin:42px 0 18px;
  font-size:1.7rem;
}

.navstreet-static-article .article-body h3 {
  margin:30px 0 14px;
  font-size:1.35rem;
}

.navstreet-static-article .article-body h4 {
  margin:24px 0 12px;
  font-size:1.15rem;
}

.navstreet-static-article .article-body p {
  margin:0 0 22px;
}

.navstreet-static-article .article-body ul,
.navstreet-static-article .article-body ol {
  margin:0 0 24px;
  padding-left:28px;
}

.navstreet-static-article .article-body li {
  margin-bottom:10px;
}

.navstreet-static-article .article-body a {
  color:#2874a6;
  font-weight:600;
  text-decoration:underline;
}

.navstreet-static-article .article-body a:hover {
  color:#154360;
}

.navstreet-static-article .article-body blockquote {
  margin:30px 0;
  padding:18px 24px;
  border-left:4px solid #2874a6;
  background:#f1f5f9;
  color:#475569;
  font-style:italic;
}

.navstreet-static-article .article-body img {
  display:block;
  max-width:100%;
  height:auto;
  margin:28px auto;
  border-radius:8px;
}

.navstreet-static-article .article-body hr {
  margin:36px 0;
  border:0;
  border-top:1px solid #e2e8f0;
}

.navstreet-static-article .article-body strong {
  color:#1e293b;
}

.navstreet-static-article .article-footer {
  padding:40px 56px;
  border-top:1px solid #e2e8f0;
  background:#f1f5f9;
}

.navstreet-static-article .article-footer-content h2 {
  margin:0 0 12px;
  color:#154360;
  font-size:1.5rem;
}

.navstreet-static-article .article-footer-content p {
  margin:0 0 24px;
  color:#526174;
  line-height:1.7;
}

.navstreet-static-article .article-actions {
  display:flex;
  flex-wrap:wrap;
  gap:14px;
}

.navstreet-static-article .article-actions a {
  display:inline-flex;
  align-items:center;
  justify-content:center;
  min-height:44px;
  padding:12px 22px;
  border-radius:6px;
  font-weight:600;
  text-decoration:none;
  transition:background-color .2s ease;
}

.navstreet-static-article .primary-action {
  background:#154360;
  color:#fff;
}

.navstreet-static-article .primary-action:hover {
  background:#2874a6;
}

.navstreet-static-article .secondary-action {
  border:1px solid #154360;
  color:#154360;
}

.navstreet-static-article .secondary-action:hover {
  background:#e2e8f0;
}

@media(max-width:992px) {
  .navstreet-static-blog .blog-grid {
    grid-template-columns:repeat(2,minmax(0,1fr));
  }
}

@media(max-width:768px) {
  .navstreet-static-article.blog-article-page {
    padding:24px 16px 64px;
  }

  .navstreet-static-article .article-navigation {
    margin-bottom:24px;
  }

  .navstreet-static-article .article-header {
    padding:28px 20px 20px;
  }

  .navstreet-static-article .article-header h1 {
    font-size:clamp(1.5rem,5.5vw,2rem);
    line-height:1.3;
    margin-bottom:18px;
    overflow-wrap:break-word;
  }

  .navstreet-static-article .article-summary {
    font-size:1rem;
  }

  .navstreet-static-article .article-featured-image {
    padding:0 24px 16px;
  }

  .navstreet-static-article .article-body {
    padding:16px 24px 36px;
    font-size:1rem;
  }

  .navstreet-static-article .article-footer {
    padding:32px 24px;
  }

  .navstreet-static-article .article-actions {
    flex-direction:column;
  }

  .navstreet-static-article .article-actions a {
    width:100%;
  }
}

@media(max-width:640px) {
  .navstreet-static-blog.blog-page {
    padding:40px 16px 64px;
  }

  .navstreet-static-blog .blog-header {
    margin-bottom:36px;
  }

  .navstreet-static-blog .blog-header p {
    font-size:1rem;
  }

  .navstreet-static-blog .blog-grid {
    grid-template-columns:minmax(0,1fr);
    gap:22px;
    width:100%;
    max-width:400px;
    margin:0 auto;
  }

  .navstreet-static-blog .blog-card-content {
    padding:22px;
  }
}

@media(prefers-reduced-motion:reduce) {
  .navstreet-static-blog .blog-card,
  .navstreet-static-blog .blog-card-image img,
  .navstreet-static-article .article-actions a {
    transition:none;
  }

  .navstreet-static-blog .blog-card:hover {
    transform:none;
  }
}

</style>`;

function makeClientShell(html) {
  return html
    .replace(
      /<app-root\b[^>]*>[\s\S]*?<\/app-root>/i,
      '<app-root></app-root>'
    )
    .replace(
      /<script\b[^>]*id=["']ng-state["'][^>]*>[\s\S]*?<\/script>/gi,
      ''
    )
    .replace(
      /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi,
      ''
    );
}

function applySeo(html, options) {
  const {
    url,
    title,
    description,
    type = 'website',
    image = null,
    schema = null,
    published = null,
    modified = null
  } = options;

  let result = html
    .replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta\b[^>]*name=["']description["'][^>]*>/gi, '')
    .replace(/<meta\b[^>]*name=["']robots["'][^>]*>/gi, '')
    .replace(/<link\b[^>]*rel=["']canonical["'][^>]*>/gi, '')
    .replace(/<meta\b[^>]*property=["']og:[^"']+["'][^>]*>/gi, '')
    .replace(/<meta\b[^>]*name=["']twitter:[^"']+["'][^>]*>/gi, '');

  const tags = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}">`,
    '<meta name="robots" content="index, follow">',
    `<link rel="canonical" href="${escapeHtml(url)}">`,
    `<meta property="og:type" content="${escapeHtml(type)}">`,
    `<meta property="og:title" content="${escapeHtml(title)}">`,
    `<meta property="og:description" content="${escapeHtml(description)}">`,
    `<meta property="og:url" content="${escapeHtml(url)}">`,
    '<meta property="og:site_name" content="NavStreet">',
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${escapeHtml(title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(description)}">`,
    ...(image ? [
      `<meta property="og:image" content="${escapeHtml(image)}">`,
      `<meta name="twitter:image" content="${escapeHtml(image)}">`
    ] : []),
    ...(published ? [
      `<meta property="article:published_time" content="${published}">`
    ] : []),
    ...(modified ? [
      `<meta property="article:modified_time" content="${modified}">`
    ] : []),
    ...(schema ? [
      `<script type="application/ld+json">${safeJson(schema)}</script>`
    ] : []),
    STATIC_STYLES
  ].join('\n');

  return result.replace('</head>', `${tags}\n</head>`);
}

function wrapContent(shell, content) {
  const result = shell.replace(
    '<app-root></app-root>',
    `<app-root>${content}</app-root>`
  );

  if (result === shell) {
    throw new Error(
      'Could not find app-root in Angular HTML shell'
    );
  }

  return result;
}

function renderArticle(article, shell) {
  const slug = article.slug;
  const url = `${ORIGIN}/blog/${slug}`;

  const title =
    article.seoTitle?.trim() ||
    `${article.title} | NavStreet`;

  const description =
    article.metaDescription?.trim() ||
    article.summary?.trim() ||
    '';

  const image = safeUrl(article.featuredImageUrl);
  const published = toIso(article.publishedAt);
  const modified = toIso(article.updatedAt) || published;
  const author = article.authorName?.trim() || 'NavStreet';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url
    },
    url,
    author: {
      '@type': 'Person',
      name: author
    },
    publisher: {
      '@type': 'Organization',
      name: 'NavStreet',
      url: ORIGIN
    },
    ...(published ? { datePublished: published } : {}),
    ...(modified ? { dateModified: modified } : {}),
    ...(image ? { image } : {})
  };

  const content = `
<section class="navstreet-static-article blog-article-page">
  <div class="article-container">

    <nav class="article-navigation" aria-label="Blog navigation">
      <a href="/blog/">
        <span aria-hidden="true">&larr;</span>
        Back to Blog
      </a>
    </nav>

    <article class="article-content">

      <header class="article-header">
        <span class="article-category">
          NAVSTREET REAL ESTATE BLOG
        </span>

        <h1>${escapeHtml(article.title)}</h1>

        <p class="article-summary">
          ${escapeHtml(article.summary || '')}
        </p>

        <div class="article-meta">
          <span class="article-author">
            By ${escapeHtml(author)}
          </span>

          ${published ? `
            <span class="meta-separator" aria-hidden="true">
              &bull;
            </span>
            <time datetime="${published}">
              ${escapeHtml(formatDate(article.publishedAt))}
            </time>
          ` : ''}
        </div>
      </header>

      ${image ? `
        <figure class="article-featured-image">
          <img
            src="${escapeHtml(image)}"
            alt="${escapeHtml(article.featuredImageAlt || article.title)}"
            fetchpriority="high"
          >
        </figure>
      ` : ''}

      <div class="article-body">
        ${article.contentHtml}
      </div>

      <footer class="article-footer">
        <div class="article-footer-content">
          <h2>Explore More on NavStreet</h2>

          <p>
            Discover homes for sale by owner and explore
            tools designed to help buyers and sellers
            navigate real estate transactions.
          </p>

          <div class="article-actions">
            <a href="/homes" class="primary-action">
              Browse Homes
            </a>

            <a href="/blog/" class="secondary-action">
              More Articles
            </a>
          </div>
        </div>
      </footer>

    </article>
  </div>
</section>`;

  const html = applySeo(
    wrapContent(shell, content),
    {
      url,
      title,
      description,
      type: 'article',
      image,
      schema,
      published,
      modified
    }
  );

  return { html, url, modified };
}

function renderBlogIndex(articles, shell) {
  const url = `${ORIGIN}/blog/`;

  const title =
    'Real Estate Blog & Home Selling Guides | NavStreet';

  const description =
    'Explore NavStreet real estate articles, for sale by owner ' +
    'guides, home selling advice, and tips for home buyers.';

  const cards = articles.map(article => {
    const articleUrl =
      `/blog/${encodeURIComponent(article.slug)}`;

    const image = safeUrl(article.featuredImageUrl);
    const published = toIso(article.publishedAt);

    return `
      <article class="blog-card">

        <a
          class="blog-card-image"
          href="${escapeHtml(articleUrl)}"
          aria-label="Read ${escapeHtml(article.title)}"
        >
          ${image ? `
            <img
              src="${escapeHtml(image)}"
              alt="${escapeHtml(
                article.featuredImageAlt || article.title
              )}"
              loading="lazy"
            >
          ` : `
            <div class="blog-image-placeholder">
              <span>NavStreet</span>
            </div>
          `}
        </a>

        <div class="blog-card-content">

          ${published ? `
            <time
              class="blog-date"
              datetime="${published}"
            >
              ${escapeHtml(formatDate(article.publishedAt))}
            </time>
          ` : ''}

          <h2>
            <a href="${escapeHtml(articleUrl)}">
              ${escapeHtml(article.title)}
            </a>
          </h2>

          <p class="blog-summary">
            ${escapeHtml(summaryPreview(article.summary))}
          </p>

          <a
            class="blog-read-more"
            href="${escapeHtml(articleUrl)}"
          >
            Read Article
            <span aria-hidden="true">&rarr;</span>
          </a>

        </div>
      </article>`;
  }).join('\n');

  const content = `
<section class="navstreet-static-blog blog-page">
  <div class="blog-container">

    <header class="blog-header">
      <span class="blog-eyebrow">
        NAVSTREET REAL ESTATE BLOG
      </span>

      <h1>
        Real Estate Insights &amp; Home Selling Tips
      </h1>

      <p>
        Practical advice for homeowners, buyers, and
        anyone interested in real estate. Learn how to
        sell your home, navigate the buying process,
        and make informed decisions.
      </p>
    </header>

    ${cards ? `
      <div class="blog-grid">
        ${cards}
      </div>
    ` : `
      <div class="blog-message">
        <h2>Articles coming soon</h2>
        <p>
          We're preparing helpful real estate guides
          and resources. Check back soon.
        </p>
      </div>
    `}

  </div>
</section>`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'NavStreet Real Estate Blog',
    url,
    description,
    publisher: {
      '@type': 'Organization',
      name: 'NavStreet',
      url: ORIGIN
    }
  };

  return applySeo(
    wrapContent(shell, content),
    { url, title, description, schema }
  );
}

async function main() {
  const indexFile = join(OUTPUT, 'index.html');
  const sitemapFile = join(OUTPUT, 'sitemap.xml');

  const shell = makeClientShell(
    await readFile(indexFile, 'utf8')
  );

  const sitemap = await readFile(sitemapFile, 'utf8');

  if (!/<urlset\b/.test(sitemap)) {
    throw new Error('Expected existing sitemap.xml');
  }

  initializeApp({
    credential: applicationDefault(),
    projectId:
      process.env.GOOGLE_CLOUD_PROJECT ||
      'real-estate-dev-c4a6d'
  });

  const snapshot = await getFirestore()
    .collection('blogArticles')
    .where('status', '==', 'published')
    .get();

  const articles = [];

  for (const document of snapshot.docs) {
    const article = document.data();
    const slug = article.slug || document.id;

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      console.warn(
        `Skipping invalid blog slug: ${document.id}`
      );
      continue;
    }

    if (!article.title || !article.contentHtml) {
      console.warn(
        `Skipping incomplete blog article: ${slug}`
      );
      continue;
    }

    articles.push({ ...article, slug });
  }

  articles.sort((a, b) =>
    (toIso(b.publishedAt) || '').localeCompare(
      toIso(a.publishedAt) || ''
    )
  );

  const blogDirectory = join(OUTPUT, 'blog');

  await mkdir(blogDirectory, { recursive: true });

  await writeFile(
    join(blogDirectory, 'index.html'),
    renderBlogIndex(articles, shell),
    'utf8'
  );

  console.log('Generated blog/index.html');

  const pages = [];

  for (const article of articles) {
    const page = renderArticle(article, shell);

    const directory = join(
      blogDirectory,
      article.slug
    );

    await mkdir(directory, { recursive: true });

    await writeFile(
      join(directory, 'index.html'),
      page.html,
      'utf8'
    );

    pages.push(page);

    console.log(
      `Generated blog/${article.slug}/index.html`
    );
  }

  // Preserve property listings and all other sitemap URLs.
  const base = sitemap.replace(
    /<url>\s*<loc>https:\/\/navstreet\.com\/blog(?:\/[^<]*)?<\/loc>[\s\S]*?<\/url>\s*/g,
    ''
  );

  const entries = [
    { url: `${ORIGIN}/blog/`, modified: null },
    ...pages
  ].map(page => `
    <url>
      <loc>${escapeHtml(page.url)}</loc>
      ${page.modified
        ? `<lastmod>${page.modified.slice(0, 10)}</lastmod>`
        : ''}
    </url>
  `).join('\n');

  await writeFile(
    sitemapFile,
    base.replace(
      '</urlset>',
      `${entries}\n</urlset>`
    ),
    'utf8'
  );

  console.log(
    `Generated ${pages.length} blog article HTML pages`
  );

  console.log(
    'Generated public blog homepage and updated sitemap.xml'
  );
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
