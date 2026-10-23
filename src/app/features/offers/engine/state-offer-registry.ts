import type { ListingContractFacts } from '../../../core/domains/listings/models/listing.model';
import type {
  Type,
} from '@angular/core';


export type OfferComponentLoader =
  () => Promise<Type<unknown>>;


export interface StateOfferRegistration {
  readonly stateCode: string;

  readonly routeStyle?: 'listing' | 'version';

  readonly offerCreationEnabled: boolean;

  readonly supportedPropertyTypes: readonly string[];
  readonly maximumDwellingUnits?: number;
  readonly requireOwnershipFacts?: boolean;

  /** Optional state-owned evidence panel; shared pages inspect no legal fields. */
  readonly loadSupplementalDisclosureComponent?: OfferComponentLoader;

  readonly loadComponent:
    OfferComponentLoader;
}


const STATE_OFFER_REGISTRATIONS:
  Readonly<
    Record<
      string,
      StateOfferRegistration
    >
  > = {
    NC: {
      stateCode: 'NC', requireOwnershipFacts:true, supportedPropertyTypes: ['single_family', 'townhome', 'pud', 'condo'],

      offerCreationEnabled: true,

      loadComponent: () =>
        import(
          '../states/north-carolina/north-carolina-offer-entry/north-carolina-offer-entry.component'
        ).then(
          component =>
            component.NorthCarolinaOfferEntryComponent
        ),
    },

    TX: {
      stateCode: 'TX', requireOwnershipFacts:true, maximumDwellingUnits:4, supportedPropertyTypes: ['single_family', 'townhome', 'pud', 'multi_family'],

      offerCreationEnabled: true,

      loadComponent: () =>
        import(
          '../states/texas/texas-offer-entry/texas-offer-entry.component'
        ).then(
          component =>
            component.TexasOfferEntryComponent
        ),
    },

    UT: {
      stateCode: 'UT', requireOwnershipFacts:true, supportedPropertyTypes: ['single_family', 'townhome', 'pud', 'condo'], routeStyle: 'version',
      offerCreationEnabled: true,
      loadComponent: () => import('../states/utah/utah-offer-entry/utah-offer-entry.component').then(component => component.UtahOfferEntryComponent),
    },
    WI: {
      stateCode: 'WI', requireOwnershipFacts:true, supportedPropertyTypes: ['single_family', 'townhome', 'pud'], routeStyle: 'version',
      offerCreationEnabled: true,
      loadComponent: () => import('../states/wisconsin/wisconsin-offer-entry/wisconsin-offer-entry.component').then(component => component.WisconsinOfferEntryComponent),
    },
    MN: { stateCode: 'MN', requireOwnershipFacts:true, supportedPropertyTypes: ['single_family', 'townhome', 'pud', 'condo'], routeStyle: 'version', offerCreationEnabled: true, loadComponent: () => import('../states/minnesota/minnesota-offer-entry/minnesota-offer-entry.component').then(component => component.MinnesotaOfferEntryComponent) },
    AZ: { stateCode: 'AZ', requireOwnershipFacts:true, supportedPropertyTypes: ['single_family', 'townhome', 'pud', 'condo'], routeStyle: 'version', offerCreationEnabled: true, loadComponent: () => import('../states/arizona/arizona-offer-entry/arizona-offer-entry.component').then(component => component.ArizonaOfferEntryComponent) },
    OR: { stateCode: 'OR', requireOwnershipFacts:true, supportedPropertyTypes: ['single_family', 'townhome', 'pud'], routeStyle: 'version', offerCreationEnabled: true, loadComponent: () => import('../states/oregon/oregon-offer-entry/oregon-offer-entry.component').then(component => component.OregonOfferEntryComponent) },
    MO: { stateCode: 'MO', maximumDwellingUnits:4, requireOwnershipFacts:true, supportedPropertyTypes: ['single_family','townhome','pud','condo','land','multi_family'], routeStyle: 'version', offerCreationEnabled: true, loadComponent: () => import('../states/missouri/missouri-offer-entry/missouri-offer-entry.component').then(component => component.MissouriOfferEntryComponent) },
    NE: { stateCode: 'NE', requireOwnershipFacts:true, supportedPropertyTypes: ['single_family', 'townhome', 'pud'], routeStyle: 'version', offerCreationEnabled: true, loadComponent: () => import('../states/nebraska/nebraska-offer-entry/nebraska-offer-entry.component').then(component => component.NebraskaOfferEntryComponent) },
    NH: { stateCode: 'NH', requireOwnershipFacts:true, supportedPropertyTypes: ['single_family', 'townhome', 'pud'], routeStyle: 'version', offerCreationEnabled: true, loadComponent: () => import('../states/new-hampshire/new-hampshire-offer-entry/new-hampshire-offer-entry.component').then(component => component.NewHampshireOfferEntryComponent) },
    AL: { stateCode: 'AL', requireOwnershipFacts:true, supportedPropertyTypes: ['single_family', 'townhome', 'pud'], routeStyle: 'version', offerCreationEnabled: true, loadComponent: () => import('../states/alabama/alabama-offer-entry/alabama-offer-entry.component').then(component => component.AlabamaOfferEntryComponent) },
    IN: { stateCode: 'IN', requireOwnershipFacts:true, supportedPropertyTypes: ['single_family', 'townhome', 'pud'], routeStyle: 'version', offerCreationEnabled: true, loadComponent: () => import('../states/indiana/indiana-offer-entry/indiana-offer-entry.component').then(component => component.IndianaOfferEntryComponent) },
    KS: { stateCode: 'KS', requireOwnershipFacts:true, supportedPropertyTypes: ['single_family', 'townhome', 'pud'], routeStyle: 'version', offerCreationEnabled: true, loadComponent: () => import('../states/kansas/kansas-offer-entry/kansas-offer-entry.component').then(component => component.KansasOfferEntryComponent) },
    OH: { stateCode: 'OH', requireOwnershipFacts:true, supportedPropertyTypes: ['single_family', 'townhome', 'pud'], routeStyle: 'version', offerCreationEnabled: true, loadComponent: () => import('../states/ohio/ohio-offer-entry/ohio-offer-entry.component').then(component => component.OhioOfferEntryComponent) },
    DE: { stateCode: 'DE', requireOwnershipFacts:true, supportedPropertyTypes: ['single_family', 'townhome', 'pud'], routeStyle: 'version', offerCreationEnabled: true, loadComponent: () => import('../states/delaware/delaware-offer-entry/delaware-offer-entry.component').then(component => component.DelawareOfferEntryComponent) },
    WA: { stateCode: 'WA', requireOwnershipFacts:true, supportedPropertyTypes: ['single_family', 'townhome', 'pud', 'condo'], routeStyle: 'version', offerCreationEnabled: true, loadComponent: () => import('../states/washington/washington-offer-entry/washington-offer-entry.component').then(component => component.WashingtonOfferEntryComponent) },
    IA: { loadSupplementalDisclosureComponent: () => import('../states/iowa/disclosures/iowa-disclosure-receipt.component').then(component=>component.IowaDisclosureReceiptComponent), stateCode: 'IA', requireOwnershipFacts:true, supportedPropertyTypes: ['single_family', 'townhome', 'pud'], routeStyle: 'version', offerCreationEnabled: true, loadComponent: () => import('../states/iowa/iowa-offer-entry/iowa-offer-entry.component').then(component => component.IowaOfferEntryComponent) },
    MT: { stateCode: 'MT', requireOwnershipFacts:true, supportedPropertyTypes: ['single_family', 'townhome', 'pud', 'condo'], routeStyle: 'version', offerCreationEnabled: true, loadComponent: () => import('../states/montana/montana-offer-entry/montana-offer-entry.component').then(component => component.MontanaOfferEntryComponent) },
    MD: { stateCode: 'MD', requireOwnershipFacts:true, supportedPropertyTypes: ['single_family', 'townhome', 'pud', 'condo'], routeStyle: 'version', offerCreationEnabled: true, loadComponent: () => import('../states/maryland/maryland-offer-entry/maryland-offer-entry.component').then(component => component.MarylandOfferEntryComponent) },
    NM: { stateCode: 'NM', requireOwnershipFacts:true, supportedPropertyTypes: ['single_family', 'townhome', 'pud', 'condo'], routeStyle: 'version', offerCreationEnabled: true, loadComponent: () => import('../states/new-mexico/new-mexico-offer-entry/new-mexico-offer-entry.component').then(component => component.NewMexicoOfferEntryComponent) },
    SD: { stateCode: 'SD', requireOwnershipFacts:true, supportedPropertyTypes: ['single_family', 'townhome', 'pud', 'condo'], routeStyle: 'version', offerCreationEnabled: true, loadComponent: () => import('../states/south-dakota/south-dakota-offer-entry/south-dakota-offer-entry.component').then(component => component.SouthDakotaOfferEntryComponent) },
    WY: { stateCode: 'WY', requireOwnershipFacts:true, supportedPropertyTypes: ['single_family', 'townhome', 'pud', 'condo'], routeStyle: 'version', offerCreationEnabled: true, loadComponent: () => import('../states/wyoming/wyoming-offer-entry/wyoming-offer-entry.component').then(component => component.WyomingOfferEntryComponent) },
    ME: { stateCode: 'ME', requireOwnershipFacts:true, supportedPropertyTypes: ['single_family', 'townhome', 'pud', 'condo'], routeStyle: 'version', offerCreationEnabled: true, loadComponent: () => import('../states/maine/maine-offer-entry/maine-offer-entry.component').then(component => component.MaineOfferEntryComponent) },
    MS: { stateCode: 'MS', requireOwnershipFacts:true, supportedPropertyTypes: ['single_family', 'townhome', 'pud', 'condo'], routeStyle: 'version', offerCreationEnabled: true, loadComponent: () => import('../states/mississippi/mississippi-offer-entry/mississippi-offer-entry.component').then(component => component.MississippiOfferEntryComponent) },
    AR: { stateCode: 'AR', requireOwnershipFacts:true, supportedPropertyTypes: ['single_family', 'townhome', 'pud', 'condo'], routeStyle: 'version', offerCreationEnabled: true, loadComponent: () => import('../states/arkansas/arkansas-offer-entry/arkansas-offer-entry.component').then(component => component.ArkansasOfferEntryComponent) },
    IL: { stateCode: 'IL', requireOwnershipFacts:true, supportedPropertyTypes: ['single_family', 'townhome', 'pud', 'condo'], routeStyle: 'version', offerCreationEnabled: true, loadComponent: () => import('../states/illinois/illinois-offer-entry/illinois-offer-entry.component').then(component => component.IllinoisOfferEntryComponent) },
    ID: { stateCode: 'ID', requireOwnershipFacts:true, supportedPropertyTypes: ['single_family', 'townhome', 'pud'], routeStyle: 'version', offerCreationEnabled: true, loadComponent: () => import('../states/idaho/idaho-offer-entry/idaho-offer-entry.component').then(component => component.IdahoOfferEntryComponent) },
    MI: { stateCode: 'MI', requireOwnershipFacts:true, supportedPropertyTypes: ['single_family', 'townhome', 'pud'], routeStyle: 'version', offerCreationEnabled: true, loadComponent: () => import('../states/michigan/michigan-offer-entry/michigan-offer-entry.component').then(component => component.MichiganOfferEntryComponent) },
    FL: {
      stateCode: 'FL', requireOwnershipFacts:true, supportedPropertyTypes: ['single_family', 'townhome', 'pud'], routeStyle: 'version',
      offerCreationEnabled: true,
      loadComponent: () => import('../states/florida/florida-offer-entry/florida-offer-entry.component').then(component => component.FloridaOfferEntryComponent),
    },
    LA: { stateCode: 'LA', requireOwnershipFacts:true, supportedPropertyTypes: ['single_family', 'townhome', 'pud'], routeStyle: 'version', offerCreationEnabled: true, loadComponent: () => import('../states/louisiana/louisiana-offer-entry/louisiana-offer-entry.component').then(component => component.LouisianaOfferEntryComponent) },
    SC: { stateCode: 'SC', requireOwnershipFacts:true, supportedPropertyTypes: ['single_family', 'townhome', 'pud', 'condo'], routeStyle: 'version', offerCreationEnabled: true, loadComponent: () => import('../states/south-carolina/south-carolina-offer-entry/south-carolina-offer-entry.component').then(component => component.SouthCarolinaOfferEntryComponent) },
    CA: { stateCode: 'CA', requireOwnershipFacts:true, supportedPropertyTypes: ['single_family', 'townhome', 'pud', 'condo'], routeStyle: 'version', offerCreationEnabled: true, loadComponent: () => import('../states/california/california-offer-entry/california-offer-entry.component').then(component => component.CaliforniaOfferEntryComponent) },
    CO: { stateCode: 'CO', requireOwnershipFacts:true, supportedPropertyTypes: ['single_family', 'townhome', 'pud', 'condo'], routeStyle: 'version', offerCreationEnabled: true, loadComponent: () => import('../states/colorado/colorado-offer-entry/colorado-offer-entry.component').then(component => component.ColoradoOfferEntryComponent) },
    OK: {
      stateCode: 'OK', requireOwnershipFacts:true, supportedPropertyTypes: ['single_family', 'townhome', 'pud', 'condo'],

      offerCreationEnabled: true,

      loadComponent: () =>
        import(
          '../states/oklahoma/oklahoma-offer-entry/oklahoma-offer-entry.component'
        ).then(
          component =>
            component.OklahomaOfferEntryComponent
        ),
    },
  };


export function getEnabledStateOfferRegistration(
  stateCode: string
): StateOfferRegistration | null {
  const normalizedStateCode =
    stateCode
      .trim()
      .toUpperCase();

  const registration =
    STATE_OFFER_REGISTRATIONS[
      normalizedStateCode
    ];

  if (
    !registration ||
    !registration.offerCreationEnabled
  ) {
    return null;
  }

  return registration;
}
/** Routes are selected by state registration so shared pages do not inspect state terms. */
export function newOfferPath(stateCode: string, listingUid: string): readonly string[] {
  return STATE_OFFER_REGISTRATIONS[stateCode.trim().toUpperCase()]?.routeStyle === 'version'
    ? ['/listings', listingUid, 'offers', 'new']
    : ['/listings', listingUid, 'offer'];
}
export function editOfferPath(stateCode: string, listingUid: string, offerUid: string, versionUid: string): { path: readonly string[]; queryParams?: Record<string, string> } {
  return STATE_OFFER_REGISTRATIONS[stateCode.trim().toUpperCase()]?.routeStyle === 'version'
    ? { path: ['/offers', offerUid, 'versions', versionUid, 'edit'] }
    : { path: ['/listings', listingUid, 'offer'], queryParams: { offerUid, offerVersionUid: versionUid } };
}
/** Listing advertising remains available even when its purchase agreement is not implemented. */
export function getListingContractCoverageMessage(stateCode: string, propertyType: string, facts?: Partial<ListingContractFacts> | null): string | null {
  const registration = getEnabledStateOfferRegistration(stateCode);
  if (!registration) return 'Online offers are not available in this state.';
  if (propertyType && !registration.supportedPropertyTypes.includes(propertyType)) return 'You can advertise this property, but its purchase agreement is not yet available on NavStreet. Online offers are unavailable for this property type.';
  if (facts?.isDeveloperSale === true || facts?.isLeasehold === true) return 'This sale needs a developer or leasehold agreement that is not yet available on NavStreet.';
  if (registration.requireOwnershipFacts && ['isCondominium','isDeveloperSale','isLeasehold'].some(key => typeof facts?.[key as keyof ListingContractFacts] !== 'boolean')) return 'The seller must complete the ownership and sale type questions in Edit listing before online offers can be opened.';
  if (facts?.isCondominium === true && !['single_family','townhome','pud','condo'].includes(propertyType)) return 'The property type conflicts with condominium ownership. The seller must correct the ownership facts.';
  if ((propertyType === 'condo' && facts?.isCondominium === false) || (facts?.isCondominium === true && !registration.supportedPropertyTypes.includes('condo'))) return 'This property has condominium ownership and needs a supported condominium agreement.';
  if (propertyType === 'multi_family' && registration.maximumDwellingUnits && (!Number.isSafeInteger(facts?.dwellingUnitCount) || Number(facts?.dwellingUnitCount) < 2 || Number(facts?.dwellingUnitCount) > registration.maximumDwellingUnits)) return `The seller must confirm between 2 and ${registration.maximumDwellingUnits} dwelling units in Edit listing for this agreement.`;
  if (!propertyType || registration.supportedPropertyTypes.includes(propertyType)) return null;
  return 'You can advertise this property, but its purchase agreement is not yet available on NavStreet. Online offers are unavailable for this property type.';
}
