/**
 * NavStreet Stage G — build-time public listing HTML generator.
 *
 * Run AFTER `npm run build`, BEFORE the IONOS artifact upload.
 *
 * Requires:
 * - firebase-admin as a development dependency
 * - GOOGLE_APPLICATION_CREDENTIALS
 *
 * Never place credentials in the generated output.
 *
 * This script does not alter Angular source files,
 * routes, or the existing offer system.
 */

import {
  readFile,
  writeFile,
  mkdir
} from 'node:fs/promises';

import {
  join,
  resolve
} from 'node:path';

import {
  applicationDefault,
  initializeApp
} from 'firebase-admin/app';

import {
  getFirestore
} from 'firebase-admin/firestore';


const OUTPUT = resolve('dist/template/browser');

const ORIGIN = 'https://navstreet.com';

const PUBLIC_STATUSES = [
  'active',
  'under_contract',
  'sold'
];


const escapeHtml = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    character => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[character])
  );


const text = (value) =>
  typeof value === 'string'
    ? value.trim()
    : '';


const number = (value) =>
  typeof value === 'number' && Number.isFinite(value)
    ? value
    : undefined;


const currency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);


const cleanId = (id) =>
  /^[A-Za-z0-9_-]{1,150}$/.test(id);


const safePhoto = (value) => {

  if (!value || typeof value !== 'string') {
    return null;
  }

  try {

    const url = new URL(value);

    return url.protocol === 'https:'
      ? url.href
      : null;

  } catch {

    return null;

  }

};


const toIso = (value) => {

  try {

    const date =
      value?.toDate?.() ??
      (value ? new Date(value) : null);

    return date && !Number.isNaN(date.getTime())
      ? date.toISOString()
      : null;

  } catch {

    return null;

  }

};


const safeJson = (value) =>
  JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');


/**
 * Angular 22 prerenders the homepage into browser/index.html.
 *
 * We must not reuse the prerendered homepage component tree
 * when generating individual property pages.
 *
 * This function preserves the HTML document, assets,
 * stylesheets, and JavaScript references while replacing
 * the prerendered Angular content with an empty app-root.
 */

const makeClientShell = (html) => {

  const root =
    /<app-root\b[^>]*>[\s\S]*?<\/app-root>/i;

  if (!root.test(html)) {

    throw new Error(
      'No complete <app-root> found in built index.html'
    );

  }

  let shell = html.replace(
    root,
    '<app-root></app-root>'
  );

  // Remove Angular transfer state from the homepage.

  shell = shell.replace(
    /<script\b[^>]*id=["']ng-state["'][^>]*>[\s\S]*?<\/script>/gi,
    ''
  );

  // Remove homepage structured data.

  shell = shell.replace(
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi,
    ''
  );

  return shell;

};


/**
 * Replace homepage metadata with property-specific metadata.
 */

const replaceMeta = (html, property, content) => {

  let result = html.replace(
    /<title\b[^>]*>[\s\S]*?<\/title>/i,
    `<title>${escapeHtml(property.title)}</title>`
  );

  result = result.replace(
    /<meta\b[^>]*\bname=["']description["'][^>]*>/gi,
    ''
  );

  result = result.replace(
    /<meta\b[^>]*\bname=["']robots["'][^>]*>/gi,
    ''
  );

  result = result.replace(
    /<link\b[^>]*\brel=["']canonical["'][^>]*>/gi,
    ''
  );

  result = result.replace(
    /<meta\b[^>]*\bproperty=["']og:[^"']+["'][^>]*>/gi,
    ''
  );

  result = result.replace(
    /<meta\b[^>]*\bname=["']twitter:[^"']+["'][^>]*>/gi,
    ''
  );


  const head = [

    `<meta name="description" content="${escapeHtml(property.description)}">`,

    `<meta name="robots" content="index,follow">`,

    `<link rel="canonical" href="${escapeHtml(property.url)}">`,

    `<meta property="og:type" content="website">`,

    `<meta property="og:title" content="${escapeHtml(property.title)}">`,

    `<meta property="og:description" content="${escapeHtml(property.description)}">`,

    `<meta property="og:url" content="${escapeHtml(property.url)}">`,

    `<meta property="og:site_name" content="NavStreet">`,

    ...(property.image
      ? [
          `<meta property="og:image" content="${escapeHtml(property.image)}">`
        ]
      : []),

    `<meta name="twitter:card" content="${property.image ? 'summary_large_image' : 'summary'}">`,

    `<meta name="twitter:title" content="${escapeHtml(property.title)}">`,

    `<meta name="twitter:description" content="${escapeHtml(property.description)}">`,

    ...(property.image
      ? [
          `<meta name="twitter:image" content="${escapeHtml(property.image)}">`
        ]
      : []),

    `<script type="application/ld+json">${safeJson(property.structuredData)}</script>`

  ].join('\n  ');


  if (!/<\/head>/i.test(result)) {

    throw new Error(
      'Missing </head> in built index.html'
    );

  }


  result = result.replace(
    /<\/head>/i,
    `  ${head}\n</head>`
  );


  if (!/<app-root><\/app-root>/i.test(result)) {

    throw new Error(
      'Expected clean Angular application shell'
    );

  }


  const fallbackStyle = `<style id="navstreet-listing-seo-fallback-style">
    #navstreet-listing-seo-fallback { max-width: 1100px; margin: 2rem auto; padding: 0 1.5rem; }
    body:has(app-root .listing-details__header) #navstreet-listing-seo-fallback,
    body:has(app-root .listing-details__message) #navstreet-listing-seo-fallback { display: none; }
  </style>`;
  result = result.replace(/<\/head>/i, `${fallbackStyle}\n</head>`);

  return result.replace(
    /<app-root><\/app-root>/i,
    `<app-root></app-root>\n<div id="navstreet-listing-seo-fallback">${content}</div>`
  );

};


/**
 * Generate the HTML for one public property listing.
 */

function renderListing(id, data, template) {

  if (!cleanId(id)) {

    throw new Error(
      `Unsafe Firestore listing document ID: ${id}`
    );

  }


  const street = text(data.addressLine1);
  const city = text(data.city);
  const state = text(data.state);
  const zip = text(data.zipCode);


  if (!street || !city || !state || !zip) {
    return null;
  }


  const price = number(data.listPrice);
  const bedrooms = number(data.bedrooms);
  const bathrooms = number(data.bathrooms);
  const area = number(data.squareFeet);

  const status = data.status;


  const statusLabel =
    status === 'under_contract'
      ? 'Under contract'
      : status === 'sold'
        ? 'Sold'
        : 'For sale by owner';


  const address =
    `${street}, ${city}, ${state} ${zip}`;


  const title =
    `${street} — ${statusLabel} in ${city}, ${state} | NavStreet`;


  const sellerDescription =
    text(data.description);


  const facts = [

    price !== undefined
      ? currency(price)
      : null,

    bedrooms !== undefined
      ? `${bedrooms} bedrooms`
      : null,

    bathrooms !== undefined
      ? `${bathrooms} bathrooms`
      : null,

    area !== undefined
      ? `${area.toLocaleString('en-US')} sq ft`
      : null

  ].filter(Boolean);


  const description = (
    `${statusLabel}: ${address}. ` +
    `${facts.join(', ')}. ${sellerDescription}`
  ).slice(0, 300);


  /**
   * Property photographs.
   */

  const photoObjects =
    Array.isArray(data.photos)
      ? data.photos
      : [];


  const images = photoObjects
    .map(photo =>
      safePhoto(
        photo?.fullImageUrl ||
        photo?.url ||
        photo?.thumbnailUrl
      )
    )
    .filter(Boolean);


  if (
    !images.length &&
    Array.isArray(data.photoUrls)
  ) {

    images.push(
      ...data.photoUrls
        .map(safePhoto)
        .filter(Boolean)
    );

  }


  const primary =
    safePhoto(data.primaryPhotoUrl) ||
    safePhoto(data.featuredPhotoUrl) ||
    images[0] ||
    null;


  if (
    primary &&
    !images.includes(primary)
  ) {

    images.unshift(primary);

  }


  const url =
    `${ORIGIN}/listings/${encodeURIComponent(id)}`;


  /**
   * Schema.org structured data.
   */

  const structuredData = {

    '@context': 'https://schema.org',

    '@type': 'RealEstateListing',

    name: `${statusLabel}: ${address}`,

    url,

    description:
      sellerDescription || description,

    ...(primary
      ? {
          image: [
            primary,
            ...images.filter(image => image !== primary)
          ].slice(0, 12)
        }
      : {}),

    datePosted:
      toIso(data.publishedAt) || undefined,

    dateModified:
      toIso(data.updatedAt) || undefined,

    about: {

      '@type': 'Residence',

      address: {

        '@type': 'PostalAddress',

        streetAddress: street,

        addressLocality: city,

        addressRegion: state,

        postalCode: zip,

        addressCountry: 'US'

      },

      ...(bedrooms !== undefined
        ? {
            numberOfBedrooms: bedrooms
          }
        : {}),

      ...(bathrooms !== undefined
        ? {
            numberOfBathroomsTotal: bathrooms
          }
        : {}),

      ...(area !== undefined
        ? {
            floorSize: {

              '@type': 'QuantitativeValue',

              value: area,

              unitCode: 'FTK'

            }
          }
        : {})

    },

    ...(price !== undefined
      ? {
          offers: {

            '@type': 'Offer',

            price,

            priceCurrency: 'USD',

            url

          }
        }
      : {})

  };


  /**
   * Visible property facts.
   */

  const factsHtml = facts.length
    ? `<p>${facts.map(escapeHtml).join(' · ')}</p>`
    : '';


  /**
   * Visible property photographs.
   */

  const photosHtml = images
    .slice(0, 12)
    .map(
      (image, index) => `
        <figure>
          <img
            src="${escapeHtml(image)}"
            alt="${escapeHtml(
              `${address} — property photo ${index + 1}`
            )}"
            loading="${index === 0 ? 'eager' : 'lazy'}"
          >
        </figure>
      `
    )
    .join('\n');


  /**
   * Static HTML readable without JavaScript.
   */

  const content = `

    <main class="listing-static-content">

      <article>

        <h1>${escapeHtml(address)}</h1>

        <p>${escapeHtml(statusLabel)}</p>

        ${factsHtml}

        ${
          sellerDescription
            ? `
              <section>

                <h2>Property description</h2>

                <p>${escapeHtml(sellerDescription)}</p>

              </section>
            `
            : ''
        }

        ${
          photosHtml
            ? `
              <section>

                <h2>Property photographs</h2>

                ${photosHtml}

              </section>
            `
            : ''
        }

      </article>

    </main>
  `;


  return {

    html: replaceMeta(
      template,
      {
        title,
        description,
        url,
        image: primary,
        structuredData
      },
      content
    ),

    url,

    updated: toIso(data.updatedAt)

  };

}


/**
 * Add a small, visible, server-rendered directory of property links.
 * This lives outside app-root so Angular hydration cannot remove it.
 * Never add hidden links or change Angular's existing search UI.
 */
const STATE_CODES = 'AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split(' ');
const STATE_NAMES = 'Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming'.split('|');
const stateSlug = value => {
  const input = text(value).toLowerCase();
  const index = STATE_CODES.findIndex((code, i) => code.toLowerCase() === input || STATE_NAMES[i].toLowerCase() === input);
  return index < 0 ? null : STATE_NAMES[index].toLowerCase().replace(/ /g, '-');
};

const directoryMarkup = (pages, heading) => {
  if (!pages.length) return '';
  const links = pages.map(page =>
    `<li><a href="${escapeHtml(page.url)}">${escapeHtml(page.address)}</a></li>`
  ).join('\n');
  return `<section class="navstreet-property-directory" aria-label="${escapeHtml(heading)}">
    <h2>${escapeHtml(heading)}</h2><ul>${links}</ul>
  </section>`;
};

// The static directory must remain outside app-root in the delivered HTML so
// Angular cannot erase it during bootstrap. After bootstrap, move the actual
// element into the page layout immediately before the Angular footer.
// Reattach if Angular subsequently recreates that footer.
const directoryPlacementScript = `<script id="navstreet-property-directory-placement">
(function () {
  function placeDirectory() {
    const directory = document.querySelector('.navstreet-property-directory');
    const root = document.querySelector('app-root');
    const footer = root && root.querySelector('footer');
    if (!directory || !footer || !footer.parentNode) return;
    if (directory.nextElementSibling !== footer || directory.parentNode !== footer.parentNode) {
      footer.parentNode.insertBefore(directory, footer);
    }
  }
  let queued = false;
  const observer = new MutationObserver(function () {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; placeDirectory(); });
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  placeDirectory();
  document.addEventListener('DOMContentLoaded', placeDirectory);
})();
</script>`;

const directoryStyle = `<style id="navstreet-property-directory-style">
.navstreet-property-directory{max-width:1100px;margin:2rem auto;padding:1.5rem;font:inherit;color:#154360}
.navstreet-property-directory h2{font-size:1.35rem;margin:0 0 1rem}
.navstreet-property-directory ul{list-style:disc;padding-left:1.5rem;columns:3;column-gap:2rem}
.navstreet-property-directory li{break-inside:avoid;margin-bottom:.55rem}
.navstreet-property-directory a{color:#154360;text-decoration:underline}
@media(max-width:750px){.navstreet-property-directory ul{columns:1}}
</style>`;

async function addPropertyDirectories(entries) {
  const byState = new Map();
  for (const page of entries) {
    const slug = page.stateSlug;
    if (!slug) continue;
    if (!byState.has(slug)) byState.set(slug, []);
    byState.get(slug).push(page);
  }

  const targets = [
    { file: join(OUTPUT, 'homes', 'index.html'), pages: entries, heading: 'Browse NavStreet property listings' },
    ...[...byState].map(([slug, pages]) => ({
      file: join(OUTPUT, 'states', slug, 'index.html'),
      pages,
      heading: `Browse properties in ${STATE_NAMES.find(name => name.toLowerCase().replace(/ /g, '-') === slug)}`
    }))
  ];

  let updated = 0;
  for (const target of targets) {
    let html;
    try { html = await readFile(target.file, 'utf8'); }
    catch (error) {
      if (error.code === 'ENOENT') {
        console.warn(`No prerendered page at ${target.file}; skipping property directory`);
        continue;
      }
      throw error;
    }
    if (!/<\/body>/i.test(html)) throw new Error(`Missing body closing tag: ${target.file}`);
    // Idempotent when the generator is run twice on the same build.
    html = html.replace(/<style id="navstreet-property-directory-style">[\s\S]*?<\/style>/g, '');
    html = html.replace(/<section class="navstreet-property-directory"[\s\S]*?<\/section>/g, '');
    html = html.replace(/<script id="navstreet-property-directory-placement">[\s\S]*?<\/script>/g, '');
    const content = directoryMarkup(target.pages.sort((a,b) => a.address.localeCompare(b.address)), target.heading);
    html = html.replace(/<\/head>/i, `${directoryStyle}\n</head>`);
    html = html.replace(/<\/body>/i, `${content}\n${directoryPlacementScript}\n</body>`);
    await writeFile(target.file, html, 'utf8');
    updated++;
  }
  console.log(`Added crawlable property directories to ${updated} prerendered pages`);
}

/**
 * Main build-time generation process.
 */

async function main() {

  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {

    throw new Error(
      'GOOGLE_APPLICATION_CREDENTIALS is required'
    );

  }


  /**
   * Read the Angular build and create a clean shell.
   */

  const template = makeClientShell(
    await readFile(
      join(OUTPUT, 'index.html'),
      'utf8'
    )
  );


  const sitemapFile = join(
    OUTPUT,
    'sitemap.xml'
  );


  const sitemap = await readFile(
    sitemapFile,
    'utf8'
  );


  if (!/<urlset\b/.test(sitemap)) {

    throw new Error(
      'Expected existing sitemap.xml'
    );

  }


  /**
   * Authenticate using GitHub Actions workload identity.
   */

  initializeApp({

    credential: applicationDefault(),

    projectId:
      process.env.GOOGLE_CLOUD_PROJECT ||
      'real-estate-dev-c4a6d'

  });


  const db = getFirestore();

  const entries = [];


  /**
   * Generate pages for public listings only.
   */

  for (const status of PUBLIC_STATUSES) {

    const snapshots = await db
      .collection('listings')
      .where('status', '==', status)
      .get();


    for (const document of snapshots.docs) {

      const page = renderListing(
        document.id,
        document.data(),
        template
      );


      if (!page) {

        console.warn(
          `Skipping listing ${document.id}: missing address fields`
        );

        continue;

      }


      const directory = join(
        OUTPUT,
        'listings',
        document.id
      );


      await mkdir(directory, {
        recursive: true
      });


      await writeFile(
        join(directory, 'index.html'),
        page.html,
        'utf8'
      );


      entries.push({
        ...page,
        address: `${text(document.data().addressLine1)}, ${text(document.data().city)}, ${text(document.data().state)}`,
        stateSlug: stateSlug(document.data().state)
      });

    }

  }


  await addPropertyDirectories(entries);

  /**
   * Preserve existing sitemap entries.
   * Remove previously generated property entries.
   */

  const base = sitemap.replace(
    /<url>\s*<loc>https:\/\/navstreet\.com\/listings\/[^<]*<\/loc>[\s\S]*?<\/url>\s*/g,
    ''
  );


  const propertyXml = entries
    .map(
      page => `
        <url>

          <loc>${escapeHtml(page.url)}</loc>

          ${
            page.updated
              ? `<lastmod>${page.updated.slice(0, 10)}</lastmod>`
              : ''
          }

        </url>
      `
    )
    .join('\n');


  await writeFile(

    sitemapFile,

    base.replace(
      '</urlset>',
      `${propertyXml}\n</urlset>`
    ),

    'utf8'

  );


  // Private deployment inventory. Kept outside dist/template/browser so it
  // is never published as a website asset.
  await writeFile(
    resolve('.navstreet-property-deploy-manifest.json'),
    JSON.stringify({
      generatedAt: new Date().toISOString(),
      listingIds: entries.map(page => decodeURIComponent(new URL(page.url).pathname.split('/').pop())).sort()
    }, null, 2) + '\n',
    'utf8'
  );

  console.log(
    `Generated ${entries.length} property HTML pages and updated sitemap.xml`
  );

}


/**
 * Report generation errors.
 */

main().catch(error => {

  console.error(error);

  process.exitCode = 1;

});