import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';

import type {
  OfferQuestionDefinition,
  OfferQuestionOption,
} from '../models/offer-question-definition';


export interface OfferDocumentSelection {
  readonly questionId: string;
  readonly fieldPath: string;
  readonly file: File;
}


interface OfferAddressValue {
  readonly addressLine1?: string;
  readonly addressLine2?: string;
  readonly city?: string;
  readonly state?: string;
  readonly zipCode?: string;
  readonly county?: string;
}


@Component({
  selector: 'app-offer-question-renderer',

  standalone: true,

  templateUrl:
    './question-renderer.component.html',

  styleUrl:
    './question-renderer.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class OfferQuestionRendererComponent {
  readonly question =
    input.required<OfferQuestionDefinition>();

  readonly value = input<unknown>(null);

  readonly disabled = input(false);

  protected readonly controlDisabled = computed(
    () => this.disabled() || this.question().readOnly === true
  );

  readonly validationMessage =
    input<string | null>(null);

  readonly valueChange = output<unknown>();

  readonly fieldTouched = output<void>();

  readonly documentSelected =
    output<OfferDocumentSelection>();

  private readonly currencyEditing = signal(false);
  protected readonly currencyInputValue = signal('');


  protected readonly controlId = computed(
    () =>
      `offer-question-${sanitizeId(
        this.question().id
      )}`
  );


  protected readonly choiceOptions = computed<
    readonly OfferQuestionOption[]
  >(
    () => {
      const question = this.question();

      return (
        question.type === 'single_choice' ||
        question.type === 'multiple_choice'
      )
        ? question.options
        : [];
    }
  );


  protected readonly acceptedFileTypes = computed(
    () => {
      const question = this.question();

      return question.type === 'document_upload'
        ? question.acceptedMimeTypes.join(',')
        : '';
    }
  );


  protected readonly maximumFileSizeLabel = computed(
    () => {
      const question = this.question();

      if (question.type !== 'document_upload') {
        return '';
      }

      const sizeInMegabytes =
        question.maximumFileSizeInBytes /
        1_048_576;

      return `${formatNumber(sizeInMegabytes)} MB maximum`;
    }
  );


  protected readonly informationTone = computed(
    () => {
      const question = this.question();

      return question.type === 'information'
        ? question.tone ?? 'neutral'
        : 'neutral';
    }
  );


  constructor() {
    effect(() => {
      const question = this.question();
      const value = this.value();

      if (
        question.type === 'currency' &&
        !this.currencyEditing()
      ) {
        this.currencyInputValue.set(
          formatCurrencyInput(value)
        );
      }
    });
  }


  protected textValue(): string {
    const value = this.value();

    return typeof value === 'string'
      ? value
      : '';
  }


  protected numericValue(): number | null {
    const value = this.value();

    return (
      typeof value === 'number' &&
      Number.isFinite(value)
    )
      ? value
      : null;
  }


  protected currencyValue(): number | null {
    const value = this.numericValue();

    return value === null
      ? null
      : value / 100;
  }


  protected dateTimeValue(): string {
    const value = this.textValue();
    const parsed = new Date(value);

    if (!value || !Number.isFinite(parsed.getTime())) {
      return '';
    }

    const local = new Date(
      parsed.getTime() - parsed.getTimezoneOffset() * 60_000
    );

    return local.toISOString().slice(0, 16);
  }


  protected currencyDisplayValue(): string {
    const value = this.currencyValue();

    return value === null
      ? ''
      : new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(value);
  }


  protected onCurrencyFocus(event: Event): void {
    const input = readInputElement(event);
    const value = this.currencyValue();

    this.currencyEditing.set(true);

    const editableValue = value === null
      ? ''
      : value.toFixed(2);

    this.currencyInputValue.set(editableValue);
    input.value = editableValue;
    input.select();
  }


  protected onCurrencyBlur(event: Event): void {
    this.currencyEditing.set(false);

    const displayValue = this.currencyDisplayValue();
    this.currencyInputValue.set(displayValue);
    readInputElement(event).value = displayValue;
    this.markTouched();
  }


  protected markTouched(): void {
    if (!this.controlDisabled()) {
      this.fieldTouched.emit();
    }
  }


  protected booleanValue(): boolean | null {
    const value = this.value();

    return typeof value === 'boolean'
      ? value
      : null;
  }


  protected onTextInput(event: Event): void {
    this.valueChange.emit(
      readInputElement(event).value
    );
  }


  protected onDateTimeInput(event: Event): void {
    const value = readInputElement(event).value;
    const parsed = new Date(value);

    this.valueChange.emit(
      value && Number.isFinite(parsed.getTime())
        ? parsed.toISOString()
        : ''
    );
  }


  protected onNumberInput(event: Event): void {
    this.valueChange.emit(
      parseOptionalNumber(
        readInputElement(event).value
      )
    );
  }


  protected onCurrencyInput(event: Event): void {
    const inputValue = readInputElement(event).value;
    this.currencyInputValue.set(inputValue);

    const dollars = parseOptionalNumber(
      inputValue.replace(/[$,\s]/g, '')
    );

    this.valueChange.emit(
      dollars === null
        ? null
        : Math.round(dollars * 100)
    );
  }


  protected onBooleanInput(value: boolean): void {
    this.valueChange.emit(value);
    this.markTouched();
  }


  protected onAcknowledgementInput(
    event: Event
  ): void {
    this.valueChange.emit(
      readInputElement(event).checked
    );
    this.markTouched();
  }


  protected onSingleChoiceInput(
    event: Event
  ): void {
    const value = readSelectElement(event).value;

    this.valueChange.emit(
      value.length > 0
        ? value
        : null
    );
    this.markTouched();
  }


  protected isMultipleChoiceSelected(
    value: string
  ): boolean {
    return this.selectedChoiceValues()
      .includes(value);
  }


  protected isChoiceDisabled(value: string): boolean {
    const question = this.question();
    return this.controlDisabled() ||
      (question.type === 'multiple_choice' &&
        question.disabledValues?.includes(value) === true);
  }


  protected onMultipleChoiceInput(
    optionValue: string,
    event: Event
  ): void {
    const selected =
      this.selectedChoiceValues();

    const checked =
      readInputElement(event).checked;

    const nextValues = checked
      ? Array.from(
        new Set([
          ...selected,
          optionValue,
        ])
      )
      : selected.filter(
        value => value !== optionValue
      );

    this.valueChange.emit(nextValues);
    this.markTouched();
  }


  protected addressField(
    fieldName: keyof OfferAddressValue
  ): string {
    const address = this.addressValue();
    const value = address[fieldName];

    return typeof value === 'string'
      ? value
      : '';
  }


  protected onAddressInput(
    fieldName: keyof OfferAddressValue,
    event: Event
  ): void {
    const value =
      readInputElement(event).value;

    this.valueChange.emit({
      ...this.addressValue(),
      [fieldName]: value,
    });
  }


  protected onDocumentInput(event: Event): void {
    const input = readInputElement(event);
    const file = input.files?.item(0);

    if (!file) {
      return;
    }

    const question = this.question();

    if (
      question.type !== 'document_upload'
    ) {
      return;
    }

    if (
      file.size >
      question.maximumFileSizeInBytes
    ) {
      input.value = '';
      return;
    }

    this.documentSelected.emit({
      questionId: question.id,
      fieldPath: question.fieldPath,
      file,
    });
    this.markTouched();
  }


  protected hasAttachedDocument(): boolean {
    const value = this.value();

    return typeof value === 'string' &&
      value.trim().length > 0;
  }


  private addressValue(): OfferAddressValue {
    const value = this.value();

    return (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value)
    )
      ? value as OfferAddressValue
      : {};
  }


  private selectedChoiceValues(): string[] {
    const currentValue = this.value();

    if (!Array.isArray(currentValue)) {
      return [];
    }

    const question = this.question();

    if (
      question.type !== 'multiple_choice' ||
      !question.objectSelection
    ) {
      return currentValue.filter(
        value => typeof value === 'string'
      ) as string[];
    }

    const {
      valueKey,
      selectedKey,
    } = question.objectSelection;

    return currentValue.flatMap(value => {
      if (
        value === null ||
        typeof value !== 'object' ||
        Array.isArray(value)
      ) {
        return [];
      }

      const record =
        value as Record<string, unknown>;

      if (
        selectedKey &&
        record[selectedKey] !== true
      ) {
        return [];
      }

      const selectedValue = record[valueKey];

      return typeof selectedValue === 'string'
        ? [selectedValue]
        : [];
    });
  }
}


function formatCurrencyInput(value: unknown): string {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value)
  ) {
    return '';
  }

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
}


function readInputElement(
  event: Event
): HTMLInputElement {
  return event.target as HTMLInputElement;
}


function readSelectElement(
  event: Event
): HTMLSelectElement {
  return event.target as HTMLSelectElement;
}


function parseOptionalNumber(
  value: string
): number | null {
  if (value.trim().length === 0) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}


function sanitizeId(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-');
}


function formatNumber(value: number): string {
  return Number.isInteger(value)
    ? value.toString()
    : value.toFixed(1);
}
