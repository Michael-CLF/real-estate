export type MissouriContractType = 'navstreet_missouri_residential_sale_2026' | 'navstreet_missouri_condominium_resale_2026' | 'navstreet_missouri_land_sale_2026' | 'navstreet_missouri_small_multifamily_resale_2026';
export interface MissouriOwnershipFacts {isCondominium?: boolean | null; isDeveloperSale?: boolean | null; isLeasehold?: boolean | null; dwellingUnitCount?: number | null;}
export const MISSOURI_CONTRACT_NAMES: Readonly<Record<MissouriContractType,string>> = {
 navstreet_missouri_residential_sale_2026:'NavStreet Missouri Residential Purchase and Sale Agreement',
 navstreet_missouri_condominium_resale_2026:'NavStreet Missouri Condominium Resale Purchase and Sale Agreement',
 navstreet_missouri_land_sale_2026:'NavStreet Missouri Vacant Land Purchase and Sale Agreement',
 navstreet_missouri_small_multifamily_resale_2026:'NavStreet Missouri Two to Four Unit Purchase and Sale Agreement',
};
export function selectMissouriContract(propertyType: string, facts?: MissouriOwnershipFacts | null): MissouriContractType {
 if (['isCondominium','isDeveloperSale','isLeasehold'].some(key => typeof facts?.[key as keyof MissouriOwnershipFacts] !== 'boolean')) throw new Error('The seller must complete the ownership and sale type questions in Edit listing.');
 if (facts?.isDeveloperSale || facts?.isLeasehold) throw new Error('Developer, new construction and leasehold sales require a separate Missouri agreement.');
 if (propertyType === 'mobile') throw new Error('Manufactured and mobile home sales require title and land-status review and a separate agreement.');
 if (facts?.isCondominium) {
   if (!['condo','single_family','townhome','pud'].includes(propertyType)) throw new Error('The property type conflicts with condominium ownership.');
   return 'navstreet_missouri_condominium_resale_2026';
 }
 if (propertyType === 'condo') throw new Error('Confirm condominium ownership on the listing.');
 if (propertyType === 'land') return 'navstreet_missouri_land_sale_2026';
 if (propertyType === 'multi_family') {
   if (!Number.isSafeInteger(facts?.dwellingUnitCount) || Number(facts?.dwellingUnitCount) < 2 || Number(facts?.dwellingUnitCount) > 4) throw new Error('The Missouri small multifamily agreement requires 2 to 4 dwelling units.');
   return 'navstreet_missouri_small_multifamily_resale_2026';
 }
 if (['single_family','townhome','pud'].includes(propertyType)) return 'navstreet_missouri_residential_sale_2026';
 throw new Error('This property type does not have an implemented Missouri purchase agreement.');
}
export function isMissouriContractCompatible(contractType: string, propertyType: string, facts?: MissouriOwnershipFacts | null): boolean {
 // Existing residential versions predate these ownership questions; preserve their own snapshots.
 if (contractType === 'navstreet_missouri_residential_sale_2026' && !facts) return ['single_family','townhome','pud'].includes(propertyType);
 try {return selectMissouriContract(propertyType,facts) === contractType;} catch {return false;}
}
