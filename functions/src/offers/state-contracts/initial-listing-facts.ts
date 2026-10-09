/** Existing initial-contract seller facts; state-specific contract fields remain in packages. */
export function sellerLeases(data: Record<string, unknown>): boolean | null {
  const statements = data['sellerStatements'];
  if (!statements || typeof statements !== 'object' || Array.isArray(statements)) return null;
  const value = (statements as Record<string, unknown>)['leasesExist'];
  return typeof value === 'boolean' ? value : null;
}

export function sellerHoa(data: Record<string, unknown>): boolean | null {
  const statements = data['sellerStatements'];
  if (statements && typeof statements === 'object' && !Array.isArray(statements)) {
    const value = (statements as Record<string, unknown>)['ownersAssociationApplies'];
    if (typeof value === 'boolean') return value;
  }
  const hoa = data['hoa'];
  if (hoa && typeof hoa === 'object' && !Array.isArray(hoa)) {
    const value = (hoa as Record<string, unknown>)['hasHoa'];
    if (typeof value === 'boolean') return value;
  }
  return null;
}
