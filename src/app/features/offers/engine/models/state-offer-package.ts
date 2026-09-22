import type {
  OfferParty,
} from '../../../../core/domains/offers/models/offer-party.model';

import type {
  OfferPropertySnapshot,
} from '../../../../core/domains/offers/models/offer-terms.model';

import type {
  OfferValidationContext,
  OfferValidationResult,
} from '../../../../core/domains/offers/models/offer-validation.model';

import type {
  OfferSectionDefinition,
} from './offer-section-definition';


export interface StateOfferContractDefinition<
  TContractType extends string = string,
> {
  readonly contractType: TContractType;

  readonly formId: string;
  readonly formName: string;

  readonly effectiveDate: string;
  readonly revisionDate: string;

  readonly description?: string;
}


export interface CreateStateOfferTermsInput<
  TContractType extends string = string,
> {
  readonly contractType: TContractType;

  readonly property:
    OfferPropertySnapshot;

  readonly expiresAt: string;
  readonly timeZone: string;
}


export interface StateOfferPackage<
  TTerms extends {
    readonly stateCode: string;
  },
  TContractType extends string = string,
> {
  readonly stateCode:
    TTerms['stateCode'];

  readonly stateName: string;

  readonly contracts:
    Readonly<
      Record<
        TContractType,
        StateOfferContractDefinition<
          TContractType
        >
      >
    >;

  createInitialTerms(
    input:
      CreateStateOfferTermsInput<
        TContractType
      >
  ): TTerms;

  getSections(
    terms: TTerms
  ): readonly OfferSectionDefinition[];

  validate(
    terms: TTerms,
    buyers: readonly OfferParty[],
    sellers: readonly OfferParty[],
    context: OfferValidationContext
  ): OfferValidationResult;
}
