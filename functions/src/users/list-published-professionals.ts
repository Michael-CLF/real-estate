import { onCall } from 'firebase-functions/v2/https';
import { adminFirestore } from '../shared/firebase-admin';
import { callableFunctionOptions } from '../shared/function-options';

export const listPublishedProfessionals = onCall({ ...callableFunctionOptions }, async () => {
  const snapshot = await adminFirestore.collection('professionalProfiles')
    .where('status','==','active').get();
  return snapshot.docs.filter(doc => {
    const data = doc.data();
    return !data.publicationStatus || data.publicationStatus === 'published';
  }).map(doc => {
    const data = doc.data();
    const allowed = [ 'ownerUid','businessName','category','professionalType','specialties',
      'stateName','stateAbbreviation','stateSlug','serviceAreaType','counties','cities',
      'serviceStates','serviceStateSlugs','phone','email','subscriptionStatus','placement',
      'profileSlug','website','description','logoUrl','status','publicationStatus' ];
    const result: Record<string, unknown> = { uid: doc.id };
    for (const field of allowed) if (data[field] !== undefined) result[field] = data[field];
    result.createdAt = data.createdAt?.toDate?.().toISOString() ?? null;
    result.updatedAt = data.updatedAt?.toDate?.().toISOString() ?? null;
    return result;
  });
});
