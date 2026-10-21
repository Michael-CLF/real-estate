/** Shared lifecycle policy: state contract terms do not affect draft disposal. */
export const DRAFT_INACTIVITY_MS = 7 * 24 * 60 * 60 * 1000;
export const UNSENT_OFFER_STATUSES = ['draft', 'submitted', 'expired', 'withdrawn'];
const versionStatuses = ['draft', 'awaiting_signatures', 'expired', 'withdrawn'];
export function isDiscardableUnsignedOffer(offer: any, versions: any[]): boolean {
  if (!offer || !UNSENT_OFFER_STATUSES.includes(offer.status) || offer.contract ||
      offer.lastDeliveredVersionUid || offer.firstViewedAt ||
      offer.currentVersionNumber !== 1 || offer.totalVersions !== 1 ||
      !Array.isArray(offer.versionUids) || offer.versionUids.length !== 1 || offer.versionUids[0] !== offer.currentVersionUid ||
      offer.initialVersionUid !== offer.currentVersionUid || versions.length !== 1) return false;
  const version = versions[0];
  if (version.versionNumber !== 1 || version.Uid !== offer.currentVersionUid ||
      version.offerUid !== offer.Uid || !versionStatuses.includes(version.status) ||
      !Array.isArray(version.buyers) || !version.buyers.length || !Array.isArray(version.sellers) || !version.sellers.length) return false;
  return [...version.buyers, ...version.sellers].every(party =>
    party.signature && ['not_invited','not_started','invited','viewed','pending'].includes(party.signature.status) &&
    !party.signature.signedAt && !party.signature.signatureUid,
  );
}
export function latestDraftActivity(offer: any, versions: any[]): number | null {
  if (typeof offer.draftLastActivityAt?.toMillis === 'function') {
    const activity = offer.draftLastActivityAt.toMillis();
    return Number.isFinite(activity) ? activity : null;
  }
  // Legacy drafts: ignore system expiration events when reconstructing user activity.
  const history = [...(offer.statusHistory ?? []), ...versions.flatMap(v => v.statusHistory ?? [])];
  const userTimes = history.filter(e => ['draft_created','draft_saved','submitted'].includes(e.action))
    .map(e => e.occurredAt?.toMillis?.()).filter(value => Number.isFinite(value));
  if (['expired','withdrawn'].includes(offer.status) && userTimes.length) return Math.max(...userTimes);
  const values = [offer.lastActivityAt, offer.updatedAt, offer.createdAt,
    ...versions.flatMap(version => [version.updatedAt, version.createdAt, version.submittedAt])];
  const times = values.map(value => typeof value?.toMillis === 'function' ? value.toMillis() : NaN)
    .filter(value => Number.isFinite(value));
  return times.length ? Math.max(...times) : null;
}
