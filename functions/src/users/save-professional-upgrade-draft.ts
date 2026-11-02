import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore } from '../shared/firebase-admin';
import { callableFunctionOptions } from '../shared/function-options';

type Area = 'statewide' | 'counties' | 'cities';
export interface Coverage {
  stateName: string; stateAbbreviation: string; stateSlug: string;
  serviceAreaType: Area; counties: string[]; cities: string[];
}
export function validateCoverage(value: unknown, limit: number): Coverage[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > limit) {
    throw new HttpsError('invalid-argument', `Select between one and ${limit} service states.`);
  }
  const supported = new Set(('alabama alaska arizona arkansas california colorado connecticut delaware florida georgia hawaii idaho illinois indiana iowa kansas kentucky louisiana maine maryland massachusetts michigan minnesota mississippi missouri montana nebraska nevada new-hampshire new-jersey new-mexico new-york north-carolina north-dakota ohio oklahoma oregon pennsylvania rhode-island south-carolina south-dakota tennessee texas utah vermont virginia washington west-virginia wisconsin wyoming district-of-columbia').split(' '));
  const seen = new Set<string>();
  return value.map((raw: unknown) => {
    if (!raw || typeof raw !== 'object') throw new HttpsError('invalid-argument','Invalid state.');
    const v = raw as Record<string, unknown>;
    const stateSlug = typeof v.stateSlug === 'string' ? v.stateSlug.trim().toLowerCase() : '';
    const stateName = typeof v.stateName === 'string' ? v.stateName.trim() : '';
    const stateAbbreviation = typeof v.stateAbbreviation === 'string' ? v.stateAbbreviation.trim().toUpperCase() : '';
    if (!/^[a-z]+(?:-[a-z]+)*$/.test(stateSlug) || !stateName || !supported.has(stateSlug) ||
        !/^[A-Z]{2}$/.test(stateAbbreviation) || seen.has(stateSlug)) {
      throw new HttpsError('invalid-argument','Invalid or duplicate service state.');
    }
    seen.add(stateSlug);
    const type = v.serviceAreaType;
    if (type !== 'statewide' && type !== 'counties' && type !== 'cities') {
      throw new HttpsError('invalid-argument','Invalid service area type.');
    }
    const read = (items: unknown): string[] => Array.isArray(items) ?
      [...new Set(items.filter((x): x is string => typeof x === 'string')
        .map(x => x.trim()).filter(x => x.length > 0 && x.length <= 100))].slice(0,100) : [];
    const counties = type === 'counties' ? read(v.counties) : [];
    const cities = type === 'cities' ? read(v.cities) : [];
    if (type === 'counties' && !counties.length || type === 'cities' && !cities.length) {
      throw new HttpsError('invalid-argument','Enter at least one county or city.');
    }
    return { stateSlug, stateName, stateAbbreviation, serviceAreaType: type, counties, cities };
  });
}
export function validateEnhanced(data: { website?: unknown; description?: unknown; logoUrl?: unknown }) {
  const website = typeof data.website === 'string' ? data.website.trim() : '';
  const description = typeof data.description === 'string' ? data.description.trim() : '';
  const logoUrl = typeof data.logoUrl === 'string' ? data.logoUrl.trim() : '';
  const validUrl = (v: string) => { try { return new URL(v).protocol === 'https:'; } catch { return false; } };
  if (!validUrl(website) || !validUrl(logoUrl) || description.length < 40 || description.length > 2000) {
    throw new HttpsError('invalid-argument','Provide an HTTPS website, HTTPS logo URL, and a 40–2000 character description.');
  }
  return { website, description, logoUrl };
}
export const saveProfessionalUpgradeDraft = onCall({ ...callableFunctionOptions }, async request => {
  const ownerUid = request.auth?.uid;
  if (!ownerUid) throw new HttpsError('unauthenticated','Sign in to upgrade your listing.');
  const data = request.data as Record<string, unknown>;
  const serviceStates = validateCoverage(data.serviceStates, 5);
  const details = validateEnhanced(data);
  const query = await adminFirestore.collection('professionalProfiles')
    .where('ownerUid','==',ownerUid).limit(2).get();
  if (query.size !== 1) throw new HttpsError('failed-precondition','Expected one existing professional listing.');
  const snapshot = query.docs[0];
  const professional = snapshot.data();
  if (professional.subscriptionStatus === 'profile') throw new HttpsError('already-exists','Enhanced profile already active.');
  if (professional.status !== 'active') throw new HttpsError('failed-precondition','Listing is not active.');
  await snapshot.ref.update({
    pendingUpgrade: { serviceStates, ...details },
    updatedAt: FieldValue.serverTimestamp()
  });
  return { professionalUid: snapshot.id };
});
