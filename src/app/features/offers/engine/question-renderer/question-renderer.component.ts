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

interface OfferTimeParts {
  readonly hour: string;
  readonly minute: string;
  readonly period: '' | 'AM' | 'PM';
}

@Component({
  selector: 'app-offer-question-renderer',
  standalone: true,
  templateUrl: './question-renderer.component.html',
  styleUrl: './question-renderer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfferQuestionRendererComponent {
  readonly question = input.required<OfferQuestionDefinition>();
  readonly value = input<unknown>(null);
  readonly disabled = input(false);
  readonly validationMessage = input<string | null>(null);

  readonly valueChange = output<unknown>();
  readonly fieldTouched = output<void>();
  readonly documentSelected = output<OfferDocumentSelection>();

  protected readonly controlDisabled = computed(
    () => this.disabled() || this.question().readOnly === true,
  );

  protected readonly timeHours = Array.from(
    { length: 12 },
    (_, index) => String(index + 1),
  );

  protected readonly timeMinutes = Array.from(
    { length: 60 },
    (_, index) => String(index).padStart(2, '0'),
  );

  protected readonly timeParts = signal<OfferTimeParts>({
    hour: '',
    minute: '',
    period: '',
  });

  private lastTimeQuestionId: string | null = null;
  private lastTimeValue: string | null = null;

  private readonly currencyEditing = signal(false);
  protected readonly currencyInputValue = signal('');

  protected readonly controlId = computed(
    () => `offer-question-${sanitizeId(this.question().id)}`,
  );

  protected readonly choiceOptions = computed<
    readonly OfferQuestionOption[]
  >(() => {
    const question = this.question();

    return (
      question.type === 'single_choice' ||
      question.type === 'multiple_choice'
    )
      ? question.options
      : [];
  });

  protected readonly acceptedFileTypes = computed(() => {
    const question = this.question();

    return question.type === 'document_upload'
      ? question.acceptedMimeTypes.join(',')
      : '';
  });

  protected readonly maximumFileSizeLabel = computed(() => {
    const question = this.question();

    if (question.type !== 'document_upload') {
      return '';
    }

    const sizeInMegabytes =
      question.maximumFileSizeInBytes / 1_048_576;

    return `${formatNumber(sizeInMegabytes)} MB maximum`;
  });

  protected readonly informationTone = computed(() => {
    const question = this.question();

    return question.type === 'information'
      ? question.tone ?? 'neutral'
      : 'neutral';
  });

  constructor() {
    effect(() => {
      const question = this.question();
      const value = this.value();

      if (
        question.type === 'currency' &&
        !this.currencyEditing()
      ) {
        this.currencyInputValue.set(formatCurrencyInput(value));
      }
    });

    effect(() => {
      const question = this.question();
      const rawValue = this.value();

      if (
        question.type !== 'text' ||
        question.inputType !== 'time'
      ) {
        this.lastTimeQuestionId = null;
        this.lastTimeValue = null;
        return;
      }

      const value = typeof rawValue === 'string' ? rawValue : '';

      // Keep partially completed selections when the parent
      // returns the empty value emitted during editing.
      if (
        this.lastTimeQuestionId === question.id &&
        this.lastTimeValue === value
      ) {
        return;
      }

      this.lastTimeQuestionId = question.id;
      this.lastTimeValue = value;

      const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);

      if (!match) {
        this.timeParts.set({
          hour: '',
          minute: '',
          period: '',
        });
        return;
      }

      const hour24 = Number(match[1]);

      this.timeParts.set({
        hour: String(hour24 % 12 || 12),
        minute: match[2] ?? '',
        period: hour24 >= 12 ? 'PM' : 'AM',
      });
    });
  }

  protected textValue(): string {
    const value = this.value();

    return typeof value === 'string' ? value : '';
  }

  protected selectedChoiceLabel(): string {
    const value = this.textValue();

    return this.choiceOptions()
      .find(option => option.value === value)
      ?.label ?? 'No answer provided';
  }

  protected numericValue(): number | null {
    const value = this.value();

    return typeof value === 'number' && Number.isFinite(value)
      ? value
      : null;
  }

  protected currencyValue(): number | null {
    const value = this.numericValue();

    return value === null ? null : value / 100;
  }

  protected textInputType(): 'text' | 'time' {
    const question = this.question();

    return question.type === 'text'
      ? question.inputType ?? 'text'
      : 'text';
  }

  protected onTimePartChange(
    part: keyof OfferTimeParts,
    event: Event,
  ): void {
    const question = this.question();

    if (
      this.controlDisabled() ||
      question.type !== 'text' ||
      question.inputType !== 'time'
    ) {
      return;
    }

    const selected = readSelectElement(event).value;
    const current = this.timeParts();

    let next: OfferTimeParts;

    if (part === 'period') {
      next = {
        ...current,
        period:
          selected === 'AM' || selected === 'PM'
            ? selected
            : '',
      };
    } else if (part === 'hour') {
      next = {
        ...current,
        hour: selected,
      };
    } else {
      next = {
        ...current,
        minute: selected,
      };
    }

    this.timeParts.set(next);

    let storedValue = '';

    if (
      /^(?:[1-9]|1[0-2])$/.test(next.hour) &&
      /^[0-5]\d$/.test(next.minute) &&
      next.period !== ''
    ) {
      const hour24 =
        Number(next.hour) % 12 +
        (next.period === 'PM' ? 12 : 0);

      storedValue =
        `${String(hour24).padStart(2, '0')}:${next.minute}`;
    }

    this.lastTimeQuestionId = question.id;
    this.lastTimeValue = storedValue;

    this.valueChange.emit(storedValue);
    this.markTouched();
  }

  protected dateTimeValue(): string {
    const question = this.question();
    const value = this.textValue();

    if (
      question.type === 'date_time' &&
      question.timeFieldPath
    ) {
      return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)
        ? value
        : '';
    }

    const parsed = new Date(value);

    if (!value || !Number.isFinite(parsed.getTime())) {
      return '';
    }

    if (
      question.type === 'date_time' &&
      question.timeZone
    ) {
      return dateTimeInZone(parsed, question.timeZone);
    }

    const local = new Date(
      parsed.getTime() -
      parsed.getTimezoneOffset() * 60_000,
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

    return typeof value === 'boolean' ? value : null;
  }

  protected onTextInput(event: Event): void {
    this.valueChange.emit(readInputElement(event).value);
  }

  protected onDateTimeInput(event: Event): void {
    const input = readInputElement(event);
    const value = input.value;
    const question = this.question();

    input.setCustomValidity('');

    if (
      question.type === 'date_time' &&
      question.timeFieldPath
    ) {
      this.valueChange.emit(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)
          ? value
          : '',
      );
      return;
    }

    if (
      question.type === 'date_time' &&
      question.timeZone
    ) {
      const instant = instantForZonedDateTime(
        value,
        question.timeZone,
      );

      if (value && !instant) {
        input.setCustomValidity(
          'Choose a valid date and time in the stated timezone.',
        );
        input.reportValidity();
      }

      this.valueChange.emit(instant);
      return;
    }

    const parsed = new Date(value);

    this.valueChange.emit(
      value && Number.isFinite(parsed.getTime())
        ? parsed.toISOString()
        : '',
    );
  }

  protected onNumberInput(event: Event): void {
    this.valueChange.emit(
      parseOptionalNumber(readInputElement(event).value),
    );
  }

  protected onCurrencyInput(event: Event): void {
    const inputValue = readInputElement(event).value;

    this.currencyInputValue.set(inputValue);

    const dollars = parseOptionalNumber(
      inputValue.replace(/[$,\s]/g, ''),
    );

    this.valueChange.emit(
      dollars === null
        ? null
        : Math.round(dollars * 100),
    );
  }

  protected onBooleanInput(value: boolean): void {
    this.valueChange.emit(value);
    this.markTouched();
  }

  protected onAcknowledgementInput(event: Event): void {
    this.valueChange.emit(readInputElement(event).checked);
    this.markTouched();
  }

  protected onSingleChoiceInput(event: Event): void {
    const value = readSelectElement(event).value;

    this.valueChange.emit(value.length > 0 ? value : null);
    this.markTouched();
  }

  protected isMultipleChoiceSelected(value: string): boolean {
    return this.selectedChoiceValues().includes(value);
  }

  protected isChoiceDisabled(value: string): boolean {
    const question = this.question();

    return this.controlDisabled() ||
      (
        question.type === 'multiple_choice' &&
        question.disabledValues?.includes(value) === true
      );
  }

  protected onMultipleChoiceInput(
    optionValue: string,
    event: Event,
  ): void {
    const selected = this.selectedChoiceValues();
    const checked = readInputElement(event).checked;

    const nextValues = checked
      ? Array.from(new Set([...selected, optionValue]))
      : selected.filter(value => value !== optionValue);

    this.valueChange.emit(nextValues);
    this.markTouched();
  }

  protected addressField(
    fieldName: keyof OfferAddressValue,
  ): string {
    const value = this.addressValue()[fieldName];

    return typeof value === 'string' ? value : '';
  }

  protected onAddressInput(
    fieldName: keyof OfferAddressValue,
    event: Event,
  ): void {
    this.valueChange.emit({
      ...this.addressValue(),
      [fieldName]: readInputElement(event).value,
    });
  }

  protected onDocumentInput(event: Event): void {
    const input = readInputElement(event);
    const file = input.files?.item(0);

    if (!file) {
      return;
    }

    const question = this.question();

    if (question.type !== 'document_upload') {
      return;
    }

    if (file.size > question.maximumFileSizeInBytes) {
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
        (value): value is string => typeof value === 'string',
      );
    }

    const { valueKey, selectedKey } = question.objectSelection;

    return currentValue.flatMap(value => {
      if (
        value === null ||
        typeof value !== 'object' ||
        Array.isArray(value)
      ) {
        return [];
      }

      const record = value as Record<string, unknown>;

      if (selectedKey && record[selectedKey] !== true) {
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

function readInputElement(event: Event): HTMLInputElement {
  return event.target as HTMLInputElement;
}

function readSelectElement(event: Event): HTMLSelectElement {
  return event.target as HTMLSelectElement;
}

function parseOptionalNumber(value: string): number | null {
  if (value.trim().length === 0) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
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

function dateTimeInZone(
  date: Date,
  timeZone: string,
): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const get = (type: string): string =>
    parts.find(part => part.type === type)?.value ?? '';

  return (
    `${get('year')}-${get('month')}-${get('day')}` +
    `T${get('hour')}:${get('minute')}`
  );
}

function instantForZonedDateTime(
  value: string,
  timeZone: string,
): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    return '';
  }

  const base = Date.parse(`${value}:00Z`);

  if (!Number.isFinite(base)) {
    return '';
  }

  const offsets = new Set<number>();

  for (const shift of [-36, 0, 36]) {
    const probe = new Date(
      base + shift * 60 * 60 * 1000,
    );

    const wallClock = Date.parse(
      `${dateTimeInZone(probe, timeZone)}:00Z`,
    );

    offsets.add(wallClock - probe.getTime());
  }

  const matches = [...offsets]
    .map(offset => new Date(base - offset))
    .filter(
      candidate =>
        dateTimeInZone(candidate, timeZone) === value,
    )
    .sort((a, b) => a.getTime() - b.getTime());

  // Reject nonexistent spring-forward times.
  // For repeated fall-back times, use the earlier occurrence.
  return matches[0]?.toISOString() ?? '';
}