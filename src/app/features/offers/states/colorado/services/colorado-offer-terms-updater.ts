import { normalizeColoradoTerms } from '../../../../../core/domains/offers/state-contracts/colorado/services/colorado-terms-rules';
import type { ColoradoOfferTerms } from '../../../../../core/domains/offers/state-contracts/colorado/models/colorado-offer-terms.model';
const ROOTS = new Set(['elections','purchase','deadlines','conditions','propertyItems','disclosures','additionalTerms','delivery']);
const FORBIDDEN = new Set(['__proto__','constructor','prototype']);
export function updateColoradoOfferTerms(terms: ColoradoOfferTerms, path: string, value: unknown): ColoradoOfferTerms {
  const segments = path.split('.');
  if (!ROOTS.has(segments[0]) || segments.some(x => !x || FORBIDDEN.has(x))) throw new Error('Invalid Colorado field.');
  const selected = value === 'true' ? true : value === 'false' ? false : value;
  const update = (source: unknown, index: number): Record<string,unknown> => {
    const record = source && typeof source === 'object' && !Array.isArray(source) ? source as Record<string,unknown> : {};
    const key = segments[index];
    return { ...record, [key]: index === segments.length - 1 ? selected : update(record[key], index + 1) };
  };
  return normalizeColoradoTerms(update(terms, 0) as unknown as ColoradoOfferTerms);
}