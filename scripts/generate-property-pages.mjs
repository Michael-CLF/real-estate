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


  return result.replace(
    /<app-root><\/app-root>/i,
    `<app-root>${content}</app-root>`
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


      entries.push(page);

    }

  }


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