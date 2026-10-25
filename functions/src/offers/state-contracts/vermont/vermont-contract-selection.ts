export type VermontSelectedContract = 'navstreet_vermont_residential_sale_2026' | 'navstreet_vermont_condominium_resale_2026';
export interface VermontOwnershipFacts { readonly isCondominium?: boolean | null; readonly isDeveloperSale?: boolean | null; readonly isLeasehold?: boolean | null; }
export function selectVermontContract(type: string, facts?: VermontOwnershipFacts | null): VermontSelectedContract {
 if (!facts || [facts.isCondominium,facts.isDeveloperSale,facts.isLeasehold].some(value => typeof value !== 'boolean')) throw new Error('The seller must complete the ownership and sale type questions in Edit listing.');
 if (facts.isDeveloperSale || facts.isLeasehold) throw new Error('Developer, new-construction and leasehold sales need a separate Vermont agreement.');
 if (!['single_family','townhome','pud','condo'].includes(type)) throw new Error('This property type needs a separate Vermont agreement.');
 if (type === 'condo' && !facts.isCondominium) throw new Error('Correct the conflicting condominium ownership facts in Edit listing.');
 return facts.isCondominium ? 'navstreet_vermont_condominium_resale_2026' : 'navstreet_vermont_residential_sale_2026';
}
export function isVermontContractCompatible(contract: string, type: string, facts?: VermontOwnershipFacts | null): boolean {
 try { return selectVermontContract(type,facts) === contract; } catch { return false; }
}
