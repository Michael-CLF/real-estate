
/** Generate static, crawlable NavStreet blog pages during deployment. */
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
    const date = value?.toDate?.() ?? (value ? new Date(value) : null);
    return date && !Number.isNaN(date.getTime()) ? date.toISOString() : null;
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
  // Remove Angular's prerendered homepage tree and hydration state.
  return html
    .replace(/<app-root\b[^>]*>[\s\S]*?<\/app-root>/i, '<app-root></app-root>')
    .replace(/<script\b[^>]*id="ng-state"[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<script\b[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi, '');
}

function replaceHead(html, article) {
  const slug = article.slug;
  const url = `${ORIGIN}/blog/${slug}`;
  const title = article.seoTitle?.trim() || `${article.title} | NavStreet`;
  const description = article.metaDescription?.trim() || article.summary?.trim() || '';
  const image = safeUrl(article.featuredImageUrl);
  const published = toIso(article.publishedAt);
  const modified = toIso(article.updatedAt) || published;
  const author = article.authorName?.trim() || 'NavStreet';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
    author: { '@type': 'Organization', name: author },
    publisher: { '@type': 'Organization', name: 'NavStreet', url: ORIGIN },
    ...(published ? { datePublished: published } : {}),
    ...(modified ? { dateModified: modified } : {}),
    ...(image ? { image } : {})
  };

  // Remove the homepage's existing metadata before inserting article metadata.
  let result = html
    .replace(/<title\b[^>]*>[\s\S]*?<\/title>/i, '')
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
    `<meta property="og:type" content="article">`,
    `<meta property="og:title" content="${escapeHtml(title)}">`,
    `<meta property="og:description" content="${escapeHtml(description)}">`,
    `<meta property="og:url" content="${escapeHtml(url)}">`,
    '<meta property="og:site_name" content="NavStreet">',
    ...(image ? [
      `<meta property="og:image" content="${escapeHtml(image)}">`,
      `<meta name="twitter:image" content="${escapeHtml(image)}">`
    ] : []),
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${escapeHtml(title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(description)}">`,
    ...(published ? [
      `<meta property="article:published_time" content="${published}">`
    ] : []),
    ...(modified ? [
      `<meta property="article:modified_time" content="${modified}">`
    ] : []),
    `<script type="application/ld+json">${safeJson(schema)}</script>`
  ].join('\n');

  result = result.replace('</head>', `${tags}\n</head>`);
  return { html: result, url, modified };
}

function renderArticle(article, shell) {
  const title = escapeHtml(article.title);
  const author = escapeHtml(article.authorName || 'NavStreet');
  const image = safeUrl(article.featuredImageUrl);
  const published = toIso(article.publishedAt);
  const content = article.contentHtml || '';
  const summary = escapeHtml(article.summary || '');

  const articleHtml = `
    <main class="navstreet-static-article">
      <article>
        <header>
          <p><a href="${ORIGIN}/blog">NavStreet Blog</a></p>
          <h1>${title}</h1>
          ${summary ? `<p>${summary}</p>` : ''}
          <p>By ${author}</p>
          ${published ? `<time datetime="${published}">${published.slice(0, 10)}</time>` : ''}
        </header>
        ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(article.featuredImageAlt || article.title)}">` : ''}
        <div class="navstreet-static-article__content">${content}</div>
      </article>
    </main>`;

  const page = replaceHead(shell, article);
  return {
    ...page,
    html: page.html.replace('<app-root></app-root>', `<app-root>${articleHtml}</app-root>`)
  };
}

async function main() {
  const indexFile = join(OUTPUT, 'index.html');
  const sitemapFile = join(OUTPUT, 'sitemap.xml');

  const shell = makeClientShell(await readFile(indexFile, 'utf8'));
  const sitemap = await readFile(sitemapFile, 'utf8');

  if (!/<urlset\b/.test(sitemap)) {
    throw new Error('Expected existing sitemap.xml');
  }

  initializeApp({
    credential: applicationDefault(),
    projectId: process.env.GOOGLE_CLOUD_PROJECT || 'real-estate-dev-c4a6d'
  });

  const snapshot = await getFirestore()
    .collection('blogArticles')
    .where('status', '==', 'published')
    .get();

  const pages = [];

  for (const document of snapshot.docs) {
    const article = document.data();
    const slug = article.slug || document.id;

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      console.warn(`Skipping invalid blog slug: ${document.id}`);
      continue;
    }

    if (!article.title || !article.contentHtml) {
      console.warn(`Skipping incomplete blog article: ${slug}`);
      continue;
    }

    const page = renderArticle({ ...article, slug }, shell);
    const directory = join(OUTPUT, 'blog', slug);

    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, 'index.html'), page.html, 'utf8');

    pages.push(page);
  }

  // Preserve all existing sitemap entries except previously generated blog articles.
  const base = sitemap.replace(
    /<url>\s*<loc>https:\/\/navstreet\.com\/blog\/[^<]*<\/loc>[\s\S]*?<\/url>\s*/g,
    ''
  );

  const entries = pages.map(page => `
    <url>
      <loc>${escapeHtml(page.url)}</loc>
      ${page.modified ? `<lastmod>${page.modified.slice(0, 10)}</lastmod>` : ''}
    </url>
  `).join('\n');

  await writeFile(
    sitemapFile,
    base.replace('</urlset>', `${entries}\n</urlset>`),
    'utf8'
  );

  console.log(`Generated ${pages.length} blog HTML pages and updated sitemap.xml`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
