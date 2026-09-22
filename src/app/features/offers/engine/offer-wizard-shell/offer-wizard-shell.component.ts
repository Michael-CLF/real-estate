import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  output,
  signal,
} from '@angular/core';

import type {
  OfferParty,
} from '../../../../core/domains/offers/models/offer-party.model';

import type {
  OfferValidationIssue,
} from '../../../../core/domains/offers/models/offer-validation.model';

import type {
  OfferQuestionCondition,
  OfferQuestionDefinition,
  OfferQuestionVisibilityRule,
} from '../models/offer-question-definition';

import type {
  OfferSectionDefinition,
  OfferSectionProgress,
} from '../models/offer-section-definition';

import {
  OfferQuestionRendererComponent,
} from '../question-renderer/question-renderer.component';

import type {
  OfferDocumentSelection,
} from '../question-renderer/question-renderer.component';


export interface OfferFieldValueChange {
  readonly fieldPath: string;
  readonly value: unknown;
}

export interface OfferCoBuyerChange {
  readonly legalName: string;
  readonly email: string;
  readonly phone: string;
}


@Component({
  selector: 'app-offer-wizard-shell',

  standalone: true,

  imports: [
    OfferQuestionRendererComponent,
  ],

  templateUrl:
    './offer-wizard-shell.component.html',

  styleUrl:
    './offer-wizard-shell.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class OfferWizardShellComponent {
  readonly stateName = input.required<string>();

  readonly title = input('Make an offer');

  readonly description = input(
    'Complete each section carefully. Your progress will be saved before the offer is submitted.'
  );

  readonly sections =
    input.required<
      readonly OfferSectionDefinition[]
    >();

  readonly terms = input.required<unknown>();

  readonly buyers = input<readonly OfferParty[]>([]);
  readonly sellers = input<readonly OfferParty[]>([]);

  readonly validationIssues =
    input<readonly OfferValidationIssue[]>([]);

  readonly currentSectionIndex = model(0);

  readonly saving = input(false);
  readonly submitting = input(false);

  readonly submitLabel = input('Submit offer');

  readonly fieldValueChange =
    output<OfferFieldValueChange>();

  readonly documentSelected =
    output<OfferDocumentSelection>();

  readonly coBuyerChange =
    output<OfferCoBuyerChange | null>();

  readonly sectionChanged = output<number>();

  readonly submitRequested = output<void>();

  readonly returnToListingRequested =
    output<void>();

  private readonly attemptedSectionIds =
    signal<ReadonlySet<string>>(new Set());

  private readonly completedSectionIds =
    signal<ReadonlySet<string>>(new Set());

  protected readonly addingCoBuyer = signal(false);
  protected readonly coBuyerLegalName = signal('');
  protected readonly coBuyerEmail = signal('');
  protected readonly coBuyerPhone = signal('');


  protected readonly visibleSections = computed(
    () =>
      this.sections().filter(
        section =>
          this.matchesVisibilityRule(
            section.visibleWhen
          )
      )
  );


  protected readonly normalizedSectionIndex = computed(
    () => {
      const sectionCount =
        this.visibleSections().length;

      if (sectionCount === 0) {
        return 0;
      }

      return Math.min(
        Math.max(this.currentSectionIndex(), 0),
        sectionCount - 1
      );
    }
  );


  protected readonly currentSection = computed(
    () =>
      this.visibleSections()[
        this.normalizedSectionIndex()
      ] ?? null
  );


  protected readonly progressPercent = computed(
    () => {
      const sectionCount =
        this.visibleSections().length;

      if (sectionCount === 0) {
        return 0;
      }

      return Math.round(
        (
          (this.normalizedSectionIndex() + 1) /
          sectionCount
        ) * 100
      );
    }
  );


  protected readonly sectionProgress = computed<
    readonly OfferSectionProgress[]
  >(
    () =>
      this.visibleSections().map(
        section => {
          const errorCount =
            this.sectionErrorCount(section);

          return {
            sectionId: section.id,
            complete: errorCount === 0,
            errorCount,
          };
        }
      )
  );


  protected readonly currentSectionErrorCount = computed(
    () => {
      const section = this.currentSection();

      return section
        ? this.sectionErrorCount(section)
        : 0;
    }
  );


  protected readonly busy = computed(
    () => this.saving() || this.submitting()
  );


  protected readonly isLastSection = computed(
    () =>
      this.visibleSections().length > 0 &&
      this.normalizedSectionIndex() ===
        this.visibleSections().length - 1
  );


  protected questionValue(
    question: OfferQuestionDefinition
  ): unknown {
    return question.fieldPath
      ? readPath(this.terms(), question.fieldPath)
      : null;
  }


  protected isQuestionVisible(
    question: OfferQuestionDefinition
  ): boolean {
    return this.matchesVisibilityRule(
      question.visibleWhen
    );
  }


  protected validationMessageFor(
    question: OfferQuestionDefinition
  ): string | null {
    const section = this.currentSection();

    if (
      !question.fieldPath ||
      !section ||
      !this.attemptedSectionIds().has(section.id)
    ) {
      return null;
    }

    return this.validationIssues().find(
      issue =>
        issue.severity === 'error' &&
        issue.fieldPath === question.fieldPath
    )?.message ?? null;
  }


  protected progressFor(
    sectionId: string
  ): OfferSectionProgress | null {
    return this.sectionProgress().find(
      progress =>
        progress.sectionId === sectionId
    ) ?? null;
  }

  protected isSectionComplete(sectionId: string): boolean {
    return this.completedSectionIds().has(sectionId) &&
      (this.progressFor(sectionId)?.errorCount ?? 0) === 0;
  }

  protected shouldShowSectionErrors(sectionId: string): boolean {
    return this.attemptedSectionIds().has(sectionId) &&
      (this.progressFor(sectionId)?.errorCount ?? 0) > 0;
  }

  protected shouldShowCurrentSectionError(): boolean {
    const section = this.currentSection();
    return !!section && this.shouldShowSectionErrors(section.id);
  }

  protected propertyValue(fieldName: string): string {
    const value = readPath(this.terms(), `property.${fieldName}`);
    return typeof value === 'string' ? value : '';
  }

  protected toggleCoBuyer(enabled: boolean): void {
    this.addingCoBuyer.set(enabled);
    this.emitCoBuyer();
  }

  protected updateCoBuyerField(
    field: 'legalName' | 'email' | 'phone',
    event: Event
  ): void {
    const value = (event.target as HTMLInputElement).value;

    if (field === 'legalName') {
      this.coBuyerLegalName.set(value);
    } else if (field === 'email') {
      this.coBuyerEmail.set(value);
    } else {
      this.coBuyerPhone.set(value);
    }

    this.emitCoBuyer();
  }

  private emitCoBuyer(): void {
    if (!this.addingCoBuyer()) {
      this.coBuyerChange.emit(null);
      return;
    }

    this.coBuyerChange.emit({
      legalName: this.coBuyerLegalName().trim(),
      email: this.coBuyerEmail().trim(),
      phone: this.coBuyerPhone().trim(),
    });
  }


  protected goToPreviousSection(): void {
    if (
      this.busy() ||
      this.normalizedSectionIndex() === 0
    ) {
      return;
    }

    this.setSectionIndex(
      this.normalizedSectionIndex() - 1
    );
  }


  protected continueOrSubmit(): void {
    if (this.busy()) {
      return;
    }

    const section = this.currentSection();
    if (!section) {
      return;
    }

    this.attemptedSectionIds.set(
      new Set([...this.attemptedSectionIds(), section.id])
    );

    if (this.currentSectionErrorCount() > 0) {
      return;
    }

    this.completedSectionIds.set(
      new Set([...this.completedSectionIds(), section.id])
    );

    if (this.isLastSection()) {
      this.submitRequested.emit();
      return;
    }

    this.setSectionIndex(
      this.normalizedSectionIndex() + 1
    );
  }


  protected onValueChange(
    question: OfferQuestionDefinition,
    value: unknown
  ): void {
    if (!question.fieldPath) {
      return;
    }

    const section = this.currentSection();
    if (section) {
      const completed = new Set(this.completedSectionIds());
      completed.delete(section.id);
      this.completedSectionIds.set(completed);
    }

    this.fieldValueChange.emit({
      fieldPath: question.fieldPath,
      value,
    });
  }


  protected onDocumentSelected(
    selection: OfferDocumentSelection
  ): void {
    this.documentSelected.emit(selection);
  }


  private setSectionIndex(index: number): void {
    this.currentSectionIndex.set(index);
    this.sectionChanged.emit(index);
  }


  private sectionErrorCount(
    section: OfferSectionDefinition
  ): number {
    if (section.id === 'parties') {
      return this.validationIssues().filter(
        issue => issue.severity === 'error' &&
          (issue.fieldPath === 'buyers' ||
            issue.fieldPath.startsWith('buyers.') ||
            issue.fieldPath === 'sellers' ||
            issue.fieldPath.startsWith('sellers.'))
      ).length;
    }

    const fieldPaths = new Set(
      section.questions
        .filter(
          question =>
            this.isQuestionVisible(question) &&
            question.fieldPath
        )
        .map(
          question => question.fieldPath as string
        )
    );

    return this.validationIssues().filter(
      issue =>
        issue.severity === 'error' &&
        Array.from(fieldPaths).some(
          fieldPath =>
            issue.fieldPath === fieldPath ||
            issue.fieldPath.startsWith(
              `${fieldPath}.`
            )
        )
    ).length;
  }


  private matchesVisibilityRule(
    rule:
      OfferQuestionVisibilityRule |
      undefined
  ): boolean {
    if (!rule) {
      return true;
    }

    const results = rule.conditions.map(
      condition =>
        evaluateCondition(
          this.terms(),
          condition
        )
    );

    return rule.match === 'all'
      ? results.every(Boolean)
      : results.some(Boolean);
  }
}


function evaluateCondition(
  terms: unknown,
  condition: OfferQuestionCondition
): boolean {
  const actual = readPath(
    terms,
    condition.fieldPath
  );

  switch (condition.operator) {
    case 'equals':
      return actual === condition.value;

    case 'not_equals':
      return actual !== condition.value;

    case 'includes':
      return Array.isArray(actual) &&
        actual.includes(condition.value);

    case 'not_includes':
      return !Array.isArray(actual) ||
        !actual.includes(condition.value);

    case 'is_empty':
      return isEmpty(actual);

    case 'is_not_empty':
      return !isEmpty(actual);

    case 'is_true':
      return actual === true;

    case 'is_false':
      return actual === false;
  }
}


function readPath(
  source: unknown,
  fieldPath: string
): unknown {
  return fieldPath
    .split('.')
    .reduce<unknown>(
      (value, key) => {
        if (Array.isArray(value)) {
          const numericIndex = Number(key);

          if (
            Number.isInteger(numericIndex) &&
            numericIndex >= 0
          ) {
            return value[numericIndex];
          }

          return value.find(item => {
            if (
              item === null ||
              typeof item !== 'object' ||
              Array.isArray(item)
            ) {
              return false;
            }

            const record =
              item as Record<string, unknown>;

            return record['formId'] === key ||
              record['id'] === key ||
              record['value'] === key;
          });
        }

        if (
          value === null ||
          typeof value !== 'object'
        ) {
          return undefined;
        }

        return (
          value as Record<string, unknown>
        )[key];
      },
      source
    );
}


function isEmpty(value: unknown): boolean {
  return value === null ||
    value === undefined ||
    value === '' ||
    (
      Array.isArray(value) &&
      value.length === 0
    );
}
