export type TennesseeSelectedContract = 'navstreet_tennessee_residential_sale_2026' | 'navstreet_tennessee_condominium_resale_2026';
export interface TennesseeOwnershipFacts { readonly isCondominium?: boolean | null; readonly isDeveloperSale?: boolean | null; readonly isLeasehold?: boolean | null; }
export function selectTennesseeContract(type: string, facts?: TennesseeOwnershipFacts | null): TennesseeSelectedContract {
 if (!facts || [facts.isCondominium,facts.isDeveloperSale,facts.isLeasehold].some(value => typeof value !== 'boolean')) throw new Error('The seller must complete the ownership and sale type questions in Edit listing.');
 if (facts.isDeveloperSale || facts.isLeasehold) throw new Error('Developer, new-construction and leasehold sales need a separate Tennessee agreement.');
 if (!['single_family','townhome','pud','condo'].includes(type)) throw new Error('This property type needs a separate Tennessee agreement.');
 if (type === 'condo' && !facts.isCondominium) throw new Error('Correct the conflicting condominium ownership facts in Edit listing.');
 return facts.isCondominium ? 'navstreet_tennessee_condominium_resale_2026' : 'navstreet_tennessee_residential_sale_2026';
}
export function isTennesseeContractCompatible(contract: string, type: string, facts?: TennesseeOwnershipFacts | null): boolean {
 try { return selectTennesseeContract(type,facts) === contract; } catch { return false; }
}
