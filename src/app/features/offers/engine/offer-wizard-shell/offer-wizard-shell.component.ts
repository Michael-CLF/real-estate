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
  ListingDisclosureDocument,
} from '../../../../core/domains/disclosures/models/listing-disclosure-document.model';

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

interface OfferReviewItem {
  readonly label: string;
  readonly value: string;
}

interface OfferReviewSection {
  readonly id: string;
  readonly title: string;
  readonly items: readonly OfferReviewItem[];
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

  readonly listingDisclosures =
    input<readonly ListingDisclosureDocument[]>([]);

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

  readonly listingDisclosureRequested =
    output<ListingDisclosureDocument>();

  private readonly attemptedSectionIds =
    signal<ReadonlySet<string>>(new Set());

  private readonly completedSectionIds =
    signal<ReadonlySet<string>>(new Set());

  protected readonly reviewing = signal(false);

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

  protected readonly reviewSections = computed<
    readonly OfferReviewSection[]
  >(() =>
    this.visibleSections().map(section => ({
      id: section.id,
      title: section.title,
      items: questionsForSection(section)
        .filter(
          question =>
            question.type !== 'information' &&
            question.fieldPath !== undefined &&
            this.isQuestionVisible(question)
        )
        .map(question => ({
          label: question.label,
          value: this.formatReviewValue(
            question,
            readPath(this.terms(), question.fieldPath as string)
          ),
        })),
    }))
  );


  protected readonly currentSectionValid = computed(
    () => this.currentSectionErrorCount() === 0
  );


  protected readonly currentSectionHasMissingSellerInformation = computed(
    () => {
      const section = this.currentSection();

      if (!section) {
        return false;
      }

      return questionsForSection(section).some(
        question =>
          question.readOnly === true &&
          question.validation?.required === true &&
          this.isQuestionVisible(question) &&
          question.fieldPath !== undefined &&
          isRequiredValueMissing(
            readPath(this.terms(), question.fieldPath),
            question
          )
      );
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
      this.reviewing.set(true);
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

    this.reviewing.set(false);

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


  protected returnToCertification(): void {
    this.reviewing.set(false);
  }

  protected editReviewSection(sectionId: string): void {
    const index = this.visibleSections().findIndex(
      section => section.id === sectionId
    );

    if (index < 0 || this.busy()) {
      return;
    }

    this.reviewing.set(false);
    this.setSectionIndex(index);
  }


  protected confirmSubmit(): void {
    if (this.busy() || !this.currentSectionValid()) {
      return;
    }

    this.submitRequested.emit();
  }


  protected reviewMoney(fieldPath: string): string {
    const value = readPath(this.terms(), fieldPath);
    const cents = typeof value === 'number' ? value : 0;

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  }


  protected formatPhone(value: string): string {
    const digits = value.replace(/\D/g, '');

    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }

    if (digits.length === 11 && digits.startsWith('1')) {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }

    return value;
  }

  protected partyNames(parties: readonly OfferParty[]): string {
    const names = parties
      .map(party => party.legalName.trim())
      .filter(Boolean);

    return names.length > 0 ? names.join(', ') : 'Not provided';
  }


  protected reviewText(fieldPath: string): string {
    const value = readPath(this.terms(), fieldPath);
    return typeof value === 'string' && value.trim()
      ? value
      : 'Not provided';
  }

  private formatReviewValue(
    question: OfferQuestionDefinition,
    value: unknown
  ): string {
    if (question.type === 'currency') {
      return typeof value === 'number' && Number.isFinite(value)
        ? new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(value / 100)
        : 'Not provided';
    }

    if (question.type === 'number') {
      return typeof value === 'number' && Number.isFinite(value)
        ? `${new Intl.NumberFormat('en-US').format(value)}${question.suffix ? ` ${question.suffix}` : ''}`
        : 'Not provided';
    }

    if (question.type === 'yes_no' || question.type === 'acknowledgement') {
      return value === true ? 'Yes' : value === false ? 'No' : 'Not provided';
    }

    if (question.type === 'single_choice' || question.type === 'multiple_choice') {
      const selectedValues = selectedChoiceValues(question, value);
      const labels = question.options
        .filter(option => selectedValues.has(option.value))
        .map(option => option.label);

      return labels.length > 0 ? labels.join(', ') : 'None selected';
    }

    if (question.type === 'address') {
      return formatReviewAddress(value);
    }

    if (question.type === 'document_upload') {
      return isEmpty(value) ? 'Not provided' : 'Document uploaded';
    }

    if (question.type === 'date_time' && typeof value === 'string') {
      const parsed = new Date(value);
      return Number.isFinite(parsed.getTime())
        ? new Intl.DateTimeFormat('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
          }).format(parsed)
        : 'Not provided';
    }

    if (Array.isArray(value)) {
      return value.length > 0
        ? value.map(item => String(item)).join(', ')
        : 'None';
    }

    if (typeof value === 'string') {
      return value.trim() || 'Not provided';
    }

    return value === null || value === undefined
      ? 'Not provided'
      : String(value);
  }


  protected hasValue(fieldPath: string): boolean {
    const value = readPath(this.terms(), fieldPath);
    return value !== undefined && value !== null && value !== '';
  }


  protected listingDocumentsForSection(
    sectionId: string
  ): readonly ListingDisclosureDocument[] {
    if (sectionId === 'leases') {
      const leaseDocumentRules: Readonly<Record<string, string>> = {
        'texas-residential-leases': 'leases.residentialLeasesExist',
        'texas-fixture-leases': 'leases.fixtureLeasesExist',
        'texas-natural-resource-leases': 'leases.naturalResourceLeasesExist',
      };

      return this.listingDisclosures().filter(document => {
        const fieldPath = leaseDocumentRules[document.documentType];
        return fieldPath
          ? readPath(this.terms(), fieldPath) === true
          : false;
      });
    }

    if (sectionId === 'disclosures') {
      return this.listingDisclosures().filter(
        document => !document.documentType.startsWith('texas-') ||
          !document.documentType.endsWith('-leases')
      );
    }

    return [];
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

    const visibleQuestions = questionsForSection(section).filter(
      question =>
        this.isQuestionVisible(question) &&
        question.fieldPath
    );

    const fieldPaths = new Set(
      visibleQuestions.map(
        question => question.fieldPath as string
      )
    );

    const errorKeys = new Set(
      this.validationIssues()
        .filter(
          issue =>
            issue.severity === 'error' &&
            Array.from(fieldPaths).some(
              fieldPath =>
                issue.fieldPath === fieldPath ||
                issue.fieldPath.startsWith(
                  `${fieldPath}.`
                )
            )
        )
        .map(issue => issue.fieldPath)
    );

    for (const question of visibleQuestions) {
      if (
        question.validation?.required === true &&
        question.fieldPath &&
        isRequiredValueMissing(
          readPath(this.terms(), question.fieldPath),
          question
        )
      ) {
        errorKeys.add(question.fieldPath);
      }
    }

    return errorKeys.size;
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


function questionsForSection(
  section: OfferSectionDefinition
): readonly OfferQuestionDefinition[] {
  return section.questionGroups?.length
    ? section.questionGroups.flatMap(group => group.questions)
    : section.questions;
}

function selectedChoiceValues(
  question: Extract<
    OfferQuestionDefinition,
    { readonly type: 'single_choice' | 'multiple_choice' }
  >,
  value: unknown
): ReadonlySet<string> {
  if (!Array.isArray(value)) {
    return new Set(typeof value === 'string' ? [value] : []);
  }

  if (!question.objectSelection) {
    return new Set(
      value.filter((item): item is string => typeof item === 'string')
    );
  }

  const valueKey = question.objectSelection.valueKey;
  const selectedKey = question.objectSelection.selectedKey ?? 'included';

  return new Set(
    value.flatMap(item => {
      if (item === null || typeof item !== 'object' || Array.isArray(item)) {
        return [];
      }

      const record = item as Record<string, unknown>;
      return record[selectedKey] === true && typeof record[valueKey] === 'string'
        ? [record[valueKey] as string]
        : [];
    })
  );
}

function formatReviewAddress(value: unknown): string {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return 'Not provided';
  }

  const address = value as Record<string, unknown>;
  const street = [address['addressLine1'], address['addressLine2']]
    .filter(part => typeof part === 'string' && part.trim())
    .join(' ');
  const locality = [address['city'], address['state'], address['zipCode']]
    .filter(part => typeof part === 'string' && part.trim())
    .join(' ');
  const county = typeof address['county'] === 'string' && address['county'].trim()
    ? `${address['county']} County`
    : '';

  return [street, locality, county].filter(Boolean).join(', ') || 'Not provided';
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


function isRequiredValueMissing(
  value: unknown,
  question: OfferQuestionDefinition
): boolean {
  if (question.type === 'acknowledgement') {
    return value !== true;
  }

  if (
    question.type === 'multiple_choice' &&
    question.objectSelection &&
    Array.isArray(value)
  ) {
    const selectedKey =
      question.objectSelection.selectedKey ?? 'included';

    return !value.some(
      item =>
        item !== null &&
        typeof item === 'object' &&
        !Array.isArray(item) &&
        (item as Record<string, unknown>)[selectedKey] === true
    );
  }

  return value === undefined ||
    value === null ||
    value === 'unselected' ||
    (
      typeof value === 'string' &&
      value.trim().length === 0
    ) ||
    (
      Array.isArray(value) &&
      value.length === 0
    );
}
