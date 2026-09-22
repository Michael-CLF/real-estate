import type {
  OfferQuestionDefinition,
  OfferQuestionVisibilityRule,
} from './offer-question-definition';


export interface OfferSectionDefinition {
  readonly id: string;

  readonly title: string;
  readonly shortTitle?: string;
  readonly description?: string;

  readonly questions:
    readonly OfferQuestionDefinition[];

  readonly visibleWhen?:
    OfferQuestionVisibilityRule;

  readonly reviewGroup?: string;
}


export interface OfferSectionProgress {
  readonly sectionId: string;

  readonly complete: boolean;
  readonly errorCount: number;
}
