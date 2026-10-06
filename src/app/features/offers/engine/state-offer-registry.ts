import type {
  Type,
} from '@angular/core';


export type OfferComponentLoader =
  () => Promise<Type<unknown>>;


export interface StateOfferRegistration {
  readonly stateCode: string;

  readonly offerCreationEnabled: boolean;

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
      stateCode: 'NC',

      offerCreationEnabled: true,

      loadComponent: () =>
        import(
          '../states/north-carolina/offer-wizard/offer-wizard.component'
        ).then(
          component =>
            component.OfferWizardComponent
        ),
    },

    TX: {
      stateCode: 'TX',

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
      stateCode: 'UT',
      offerCreationEnabled: true,
      loadComponent: () => import('../states/utah/utah-offer-entry/utah-offer-entry.component').then(component => component.UtahOfferEntryComponent),
    },
    WI: {
      stateCode: 'WI',
      offerCreationEnabled: true,
      loadComponent: () => import('../states/wisconsin/wisconsin-offer-entry/wisconsin-offer-entry.component').then(component => component.WisconsinOfferEntryComponent),
    },
    FL: {
      stateCode: 'FL',
      offerCreationEnabled: true,
      loadComponent: () => import('../states/florida/florida-offer-entry/florida-offer-entry.component').then(component => component.FloridaOfferEntryComponent),
    },
    LA: { stateCode: 'LA', offerCreationEnabled: true, loadComponent: () => import('../states/louisiana/louisiana-offer-entry/louisiana-offer-entry.component').then(component => component.LouisianaOfferEntryComponent) },
    SC: { stateCode: 'SC', offerCreationEnabled: true, loadComponent: () => import('../states/south-carolina/south-carolina-offer-entry/south-carolina-offer-entry.component').then(component => component.SouthCarolinaOfferEntryComponent) },
    CA: { stateCode: 'CA', offerCreationEnabled: true, loadComponent: () => import('../states/california/california-offer-entry/california-offer-entry.component').then(component => component.CaliforniaOfferEntryComponent) },
    CO: { stateCode: 'CO', offerCreationEnabled: true, loadComponent: () => import('../states/colorado/colorado-offer-entry/colorado-offer-entry.component').then(component => component.ColoradoOfferEntryComponent) },
    OK: {
      stateCode: 'OK',

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
  return ['UT', 'WI', 'FL', 'LA', 'CO', 'CA', 'SC'].includes(stateCode.trim().toUpperCase())
    ? ['/listings', listingUid, 'offers', 'new']
    : ['/listings', listingUid, 'offer'];
}
export function editOfferPath(stateCode: string, listingUid: string, offerUid: string, versionUid: string): { path: readonly string[]; queryParams?: Record<string, string> } {
  return ['UT', 'WI', 'FL', 'LA', 'CO', 'CA', 'SC'].includes(stateCode.trim().toUpperCase())
    ? { path: ['/offers', offerUid, 'versions', versionUid, 'edit'] }
    : { path: ['/listings', listingUid, 'offer'], queryParams: { offerUid, offerVersionUid: versionUid } };
}