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