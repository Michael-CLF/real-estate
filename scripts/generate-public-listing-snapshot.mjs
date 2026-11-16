/**
 * Build-time-only public marketplace snapshot.
 * Uses the same public statuses as generate-property-pages.mjs.
 * Output is intentionally outside dist/template/browser and is NOT deployed.
 * Future Angular prerender integration will consume this file.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const DESTINATION = resolve('.navstreet-public-listings-snapshot.json');
const ANGULAR_SNAPSHOT = resolve('src/app/core/domains/marketplace/public-listings.snapshot.json');
const STATUSES = ['active', 'under_contract', 'sold'];
const validId = id => /^[A-Za-z0-9_-]{1,150}$/.test(id);
const str = value => typeof value === 'string' ? value.trim() : '';
const num = value => typeof value === 'number' && Number.isFinite(value) ? value : null;
const date = value => {
  const d = value?.toDate?.() ?? (value ? new Date(value) : null);
  return d && !Number.isNaN(d.getTime()) ? d.toISOString() : null;
};
const image = value => {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : null;
  } catch { return null; }
};

initializeApp({
  credential: applicationDefault(),
  projectId: process.env.GOOGLE_CLOUD_PROJECT || 'real-estate-dev-c4a6d'
});
const db = getFirestore();
const STATE_CODES = Object.fromEntries([
  ['Alabama','AL'],['Alaska','AK'],['Arizona','AZ'],['Arkansas','AR'],
  ['California','CA'],['Colorado','CO'],['Connecticut','CT'],['Delaware','DE'],
  ['Florida','FL'],['Georgia','GA'],['Hawaii','HI'],['Idaho','ID'],
  ['Illinois','IL'],['Indiana','IN'],['Iowa','IA'],['Kansas','KS'],
  ['Kentucky','KY'],['Louisiana','LA'],['Maine','ME'],['Maryland','MD'],
  ['Massachusetts','MA'],['Michigan','MI'],['Minnesota','MN'],['Mississippi','MS'],
  ['Missouri','MO'],['Montana','MT'],['Nebraska','NE'],['Nevada','NV'],
  ['New Hampshire','NH'],['New Jersey','NJ'],['New Mexico','NM'],['New York','NY'],
  ['North Carolina','NC'],['North Dakota','ND'],['Ohio','OH'],['Oklahoma','OK'],
  ['Oregon','OR'],['Pennsylvania','PA'],['Rhode Island','RI'],['South Carolina','SC'],
  ['South Dakota','SD'],['Tennessee','TN'],['Texas','TX'],['Utah','UT'],
  ['Vermont','VT'],['Virginia','VA'],['Washington','WA'],['West Virginia','WV'],
  ['Wisconsin','WI'],['Wyoming','WY'],['District of Columbia','DC']
].map(([name, code]) => [name.toLowerCase(), code]));
const listings = [];
for (const status of STATUSES) {
  const snapshot = await db.collection('listings').where('status', '==', status).get();
  for (const doc of snapshot.docs) {
    const d = doc.data();
    if (!validId(doc.id) || !str(d.city) || !str(d.state) || !str(d.zipCode)) continue;
    const photos = Array.isArray(d.photos) ? d.photos : [];
    const firstPhoto = photos.map(p => image(p?.fullImageUrl || p?.url || p?.thumbnailUrl)).find(Boolean);
    const firstPhotoUrl = Array.isArray(d.photoUrls) ? d.photoUrls.map(image).find(Boolean) : null;
    listings.push({
      id: doc.id,
      status,
      title: str(d.title) || str(d.addressLine1) || `Home in ${str(d.city)}`,
      addressLine1: str(d.addressLine1),
      city: str(d.city),
      state: str(d.state),
      stateAbbreviation: STATE_CODES[str(d.state).toLowerCase()] || str(d.state).toUpperCase(),
      postalCode: str(d.zipCode),
      propertyType: str(d.propertyType),
      price: num(d.listPrice) ?? 0,
      bedrooms: num(d.bedrooms),
      bathrooms: num(d.bathrooms),
      squareFeet: num(d.squareFeet),
      featuredListing: d.featuredListing === true,
      featuredPhotoUrl: image(d.primaryPhotoUrl) || image(d.featuredPhotoUrl) || firstPhotoUrl || firstPhoto || null,
      publishedAt: date(d.publishedAt),
      createdAt: date(d.createdAt)
    });
  }
}
listings.sort((a, b) =>
  (Date.parse(b.publishedAt || b.createdAt || '') || 0) -
  (Date.parse(a.publishedAt || a.createdAt || '') || 0) ||
  a.id.localeCompare(b.id)
);
await mkdir(dirname(DESTINATION), { recursive: true });
const payload = JSON.stringify({
  generatedAt: new Date().toISOString(),
  count: listings.length,
  listings
}, null, 2) + '\n';
await mkdir(dirname(ANGULAR_SNAPSHOT), { recursive: true });
await writeFile(DESTINATION, payload, 'utf8');
await writeFile(ANGULAR_SNAPSHOT, payload, 'utf8');
console.log(`Prepared ${listings.length} public listing summaries for Angular prerender integration.`);

