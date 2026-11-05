
/**
 * NavStreet static blog SEO generator.
 *
 * Runs after Angular build and property SEO generation,
 * before uploading to IONOS.
 *
 * Creates:
 *   /blog/index.html
 *   /blog/{slug}/index.html
 *
 * Updates the existing sitemap.xml.
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

function makeClientShell(html) {
  return html
    .replace(
      /<app-root\b[^>]*>[\s\S]*?<\/app-root>/i,
      '<app-root></app-root>'
    )
    .replace(
      /<script\b[^>]*id="ng-state"[^>]*>[\s\S]*?<\/script>/gi,
      ''
    )
    .replace(
      /<script\b[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi,
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
    ] : [])
  ].join('\n');

  return result.replace('</head>', `${tags}\n</head>`);
}

function wrapContent(shell, content) {
  const result = shell.replace(
    '<app-root></app-root>',
    `<app-root>${content}</app-root>`
  );

  if (result === shell) {
    throw new Error('Could not find app-root in Angular HTML shell');
  }

  return result;
}

function renderArticle(article, shell) {
  const slug = article.slug;
  const url = `${ORIGIN}/blog/${slug}`;

  const title = article.seoTitle?.trim() ||
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
    <main class="navstreet-static-article">
      <article>
        <header>
          <p>
            <a href="/blog/">NavStreet Blog</a>
          </p>

          <h1>${escapeHtml(article.title)}</h1>

          ${article.summary
            ? `<p>${escapeHtml(article.summary)}</p>`
            : ''}

          <p>By ${escapeHtml(author)}</p>

          ${published
            ? `<time datetime="${published}">
                 ${published.slice(0, 10)}
               </time>`
            : ''}
        </header>

        ${image
          ? `<img
               src="${escapeHtml(image)}"
               alt="${escapeHtml(
                 article.featuredImageAlt || article.title
               )}">`
          : ''}

        <div class="navstreet-static-article__content">
          ${article.contentHtml}
        </div>
      </article>
    </main>
  `;

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
  const title = 'Real Estate Blog & Home Selling Guides | NavStreet';

  const description =
    'Explore NavStreet real estate articles, for sale by owner ' +
    'guides, home selling advice, and tips for home buyers.';

  const cards = articles.map(article => {
    const articleUrl =
      `/blog/${encodeURIComponent(article.slug)}`;

    const image = safeUrl(article.featuredImageUrl);
    const published = toIso(article.publishedAt);

    return `
      <article class="navstreet-blog-card">
        ${image
          ? `<a href="${escapeHtml(articleUrl)}">
               <img
                 src="${escapeHtml(image)}"
                 alt="${escapeHtml(
                   article.featuredImageAlt || article.title
                 )}">
             </a>`
          : ''}

        <h2>
          <a href="${escapeHtml(articleUrl)}">
            ${escapeHtml(article.title)}
          </a>
        </h2>

        ${article.summary
          ? `<p>${escapeHtml(article.summary)}</p>`
          : ''}

        ${published
          ? `<time datetime="${published}">
               ${published.slice(0, 10)}
             </time>`
          : ''}

        <p>
          <a href="${escapeHtml(articleUrl)}">
            Read article
          </a>
        </p>
      </article>
    `;
  }).join('\n');

  const content = `
    <main class="navstreet-static-blog">
      <header>
        <h1>NavStreet Real Estate Blog</h1>
        <p>
          Home selling advice, buying guides, and practical
          real estate information.
        </p>
      </header>

      <section aria-label="Published articles">
        ${cards || '<p>No articles published yet.</p>'}
      </section>
    </main>
  `;

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
    {
      url,
      title,
      description,
      schema
    }
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

  articles.sort((a, b) => {
    const aDate = toIso(a.publishedAt) || '';
    const bDate = toIso(b.publishedAt) || '';
    return bDate.localeCompare(aDate);
  });

  const blogDirectory = join(OUTPUT, 'blog');

  await mkdir(blogDirectory, { recursive: true });

  // Create the missing public blog homepage.
  const blogIndexHtml = renderBlogIndex(articles, shell);

  await writeFile(
    join(blogDirectory, 'index.html'),
    blogIndexHtml,
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

  // Remove existing blog entries, preserving property
  // listings and all other sitemap entries.
  const base = sitemap.replace(
    /<url>\s*<loc>https:\/\/navstreet\.com\/blog(?:\/[^<]*)?<\/loc>[\s\S]*?<\/url>\s*/g,
    ''
  );

  const sitemapPages = [
    { url: `${ORIGIN}/blog/`, modified: null },
    ...pages
  ];

  const entries = sitemapPages.map(page => `
    <url>
      <loc>${escapeHtml(page.url)}</loc>
      ${page.modified
        ? `<lastmod>${page.modified.slice(0, 10)}</lastmod>`
        : ''}
    </url>
  `).join('\n');

  await writeFile(
    sitemapFile,
    base.replace('</urlset>', `${entries}\n</urlset>`),
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
