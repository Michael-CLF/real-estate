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

  readonly questionGroups?:
    readonly OfferSectionQuestionGroup[];

  readonly visibleWhen?:
    OfferQuestionVisibilityRule;

  readonly reviewGroup?: string;
}


export interface OfferSectionQuestionGroup {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly columns?: 1 | 2 | 3;
  readonly questions:
    readonly OfferQuestionDefinition[];
}


export interface OfferSectionProgress {
  readonly sectionId: string;

  readonly complete: boolean;
  readonly errorCount: number;
}
