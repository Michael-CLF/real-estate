export type OfferQuestionType =
  | 'text'
  | 'textarea'
  | 'currency'
  | 'number'
  | 'date'
  | 'date_time'
  | 'yes_no'
  | 'single_choice'
  | 'multiple_choice'
  | 'address'
  | 'acknowledgement'
  | 'document_upload'
  | 'information';


export type OfferQuestionConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'includes'
  | 'not_includes'
  | 'is_empty'
  | 'is_not_empty'
  | 'is_true'
  | 'is_false';


export interface OfferQuestionCondition {
  readonly fieldPath: string;

  readonly operator:
    OfferQuestionConditionOperator;

  readonly value?: unknown;
}


export interface OfferQuestionVisibilityRule {
  readonly match: 'all' | 'any';

  readonly conditions:
    readonly OfferQuestionCondition[];
}


export interface OfferQuestionOption<
  TValue extends string = string,
> {
  readonly value: TValue;
  readonly label: string;
  readonly description?: string;
}


export interface OfferQuestionValidationRule {
  readonly required?: boolean;

  readonly minimum?: number;
  readonly maximum?: number;

  readonly minimumLength?: number;
  readonly maximumLength?: number;

  readonly pattern?: string;
  readonly message?: string;
}


interface OfferQuestionBase {
  readonly id: string;
  readonly type: OfferQuestionType;

  readonly label: string;
  readonly description?: string;
  readonly helpText?: string;

  readonly fieldPath?: string;

  readonly visibleWhen?:
    OfferQuestionVisibilityRule;

  readonly validation?:
    OfferQuestionValidationRule;
}


export interface OfferTextQuestion
  extends OfferQuestionBase {
  readonly type: 'text' | 'textarea';
  readonly fieldPath: string;

  readonly placeholder?: string;
  readonly autocomplete?: string;
}


export interface OfferNumericQuestion
  extends OfferQuestionBase {
  readonly type:
    | 'currency'
    | 'number';

  readonly fieldPath: string;

  readonly step?: number;
  readonly suffix?: string;
}


export interface OfferDateQuestion
  extends OfferQuestionBase {
  readonly type:
    | 'date'
    | 'date_time';

  readonly fieldPath: string;

  readonly minimumDate?: string;
  readonly maximumDate?: string;
}


export interface OfferBooleanQuestion
  extends OfferQuestionBase {
  readonly type:
    | 'yes_no'
    | 'acknowledgement';

  readonly fieldPath: string;
}


export interface OfferChoiceQuestion
  extends OfferQuestionBase {
  readonly type:
    | 'single_choice'
    | 'multiple_choice';

  readonly fieldPath: string;

  readonly options:
    readonly OfferQuestionOption[];

  /*
   * Allows a choice control to read selections stored as objects.
   * Texas addenda, for example, use { formId, included } records.
   */
  readonly objectSelection?: {
    readonly valueKey: string;
    readonly selectedKey?: string;
  };
}


export interface OfferAddressQuestion
  extends OfferQuestionBase {
  readonly type: 'address';
  readonly fieldPath: string;

  readonly includeCounty?: boolean;
}


export interface OfferDocumentUploadQuestion
  extends OfferQuestionBase {
  readonly type: 'document_upload';
  readonly fieldPath: string;

  readonly acceptedMimeTypes:
    readonly string[];

  readonly maximumFileSizeInBytes:
    number;
}


export interface OfferInformationQuestion
  extends OfferQuestionBase {
  readonly type: 'information';
  readonly fieldPath?: never;

  readonly tone?:
    | 'neutral'
    | 'important'
    | 'warning';
}


export type OfferQuestionDefinition =
  | OfferTextQuestion
  | OfferNumericQuestion
  | OfferDateQuestion
  | OfferBooleanQuestion
  | OfferChoiceQuestion
  | OfferAddressQuestion
  | OfferDocumentUploadQuestion
  | OfferInformationQuestion;
