import {
  COLORADO_FACT_DEFAULTS,
  type ColoradoPropertyFacts,
} from '../../../offers/state-contracts/colorado/models/colorado-contract-elections';

/** Preserve existing stored overrides, including explicit empty/undefined values. */
export function restoreColoradoPropertyFacts(
  saved: Partial<ColoradoPropertyFacts> | null | undefined,
): ColoradoPropertyFacts {
  return { ...COLORADO_FACT_DEFAULTS, ...saved };
}
