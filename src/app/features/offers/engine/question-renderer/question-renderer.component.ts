import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
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

  readonly validationMessage =
    input<string | null>(null);

  readonly valueChange = output<unknown>();

  readonly documentSelected =
    output<OfferDocumentSelection>();


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


  protected onNumberInput(event: Event): void {
    this.valueChange.emit(
      parseOptionalNumber(
        readInputElement(event).value
      )
    );
  }


  protected onCurrencyInput(event: Event): void {
    const dollars = parseOptionalNumber(
      readInputElement(event).value
    );

    this.valueChange.emit(
      dollars === null
        ? null
        : Math.round(dollars * 100)
    );
  }


  protected onBooleanInput(value: boolean): void {
    this.valueChange.emit(value);
  }


  protected onAcknowledgementInput(
    event: Event
  ): void {
    this.valueChange.emit(
      readInputElement(event).checked
    );
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
  }


  protected isMultipleChoiceSelected(
    value: string
  ): boolean {
    return this.selectedChoiceValues()
      .includes(value);
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
