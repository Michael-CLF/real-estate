export type WyomingSelectedContract = 'navstreet_wyoming_residential_sale_2026' | 'navstreet_wyoming_condominium_resale_2026';
export interface WyomingOwnershipFacts { readonly isCondominium?: boolean | null; readonly isDeveloperSale?: boolean | null; readonly isLeasehold?: boolean | null; }
export function selectWyomingContract(type: string, facts?: WyomingOwnershipFacts | null): WyomingSelectedContract {
 if (!facts || [facts.isCondominium,facts.isDeveloperSale,facts.isLeasehold].some(value => typeof value !== 'boolean')) throw new Error('The seller must complete the ownership and sale type questions in Edit listing.');
 if (facts.isDeveloperSale || facts.isLeasehold) throw new Error('Developer, new-construction and leasehold sales need a separate Wyoming agreement.');
 if (!['single_family','townhome','pud','condo'].includes(type)) throw new Error('This property type needs a separate Wyoming agreement.');
 if (type === 'condo' && !facts.isCondominium) throw new Error('Correct the conflicting condominium ownership facts in Edit listing.');
 return facts.isCondominium ? 'navstreet_wyoming_condominium_resale_2026' : 'navstreet_wyoming_residential_sale_2026';
}
export function isWyomingContractCompatible(contract: string, type: string, facts?: WyomingOwnershipFacts | null): boolean {
 // Preserve the original scope of residential snapshots created before ownership facts existed.
 if (contract === 'navstreet_wyoming_residential_sale_2026' && !facts) return ['single_family','townhome','pud'].includes(type);
 try { return selectWyomingContract(type,facts) === contract; } catch { return false; }
}
