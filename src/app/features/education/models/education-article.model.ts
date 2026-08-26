import {
  EducationAudience
} from './education-category.model';

export interface EducationArticleStep {
  readonly title: string;
  readonly description: string;
}

export interface EducationArticleChecklistItem {
  readonly title: string;
  readonly description: string;
}

export interface EducationArticleExample {
  readonly title: string;
  readonly scenario: string;
  readonly explanation: string;
}

export interface EducationArticleTimelineItem {
  readonly stage: string;
  readonly typicalTiming: string;
  readonly description: string;
}

export interface EducationArticleLink {
  readonly label: string;
  readonly route: string;
  readonly description: string;
  readonly icon: string;
}

export interface EducationArticleSection {
  readonly heading: string;

  readonly paragraphs:
    readonly string[];

  readonly bulletPoints?:
    readonly string[];

  readonly steps?:
    readonly EducationArticleStep[];

  readonly checklist?:
    readonly EducationArticleChecklistItem[];

  readonly examples?:
    readonly EducationArticleExample[];

  readonly timeline?:
    readonly EducationArticleTimelineItem[];

  readonly callout?:
    string;
}

export interface EducationArticle {
  readonly slug: string;

  readonly categorySlug: string;

  readonly title: string;

  readonly summary: string;

  readonly eyebrow: string;

  readonly icon: string;

  readonly audience:
    EducationAudience;

  readonly estimatedMinutes:
    number;

  readonly featured:
    boolean;

  readonly displayOrder:
    number;

  readonly sections:
    readonly EducationArticleSection[];

  readonly navStreetLinks?:
    readonly EducationArticleLink[];

  readonly nextSteps?:
    readonly EducationArticleStep[];

  readonly relatedArticleSlugs:
    readonly string[];
}