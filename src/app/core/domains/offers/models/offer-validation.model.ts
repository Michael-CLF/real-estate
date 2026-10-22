export type OfferValidationSeverity =
  | 'error'
  | 'warning';


export interface OfferValidationIssue {
  fieldPath: string;
  message: string;
  severity: OfferValidationSeverity;
}


export interface OfferValidationResult {
  valid: boolean;
  errors: OfferValidationIssue[];
  warnings: OfferValidationIssue[];
}


export interface OfferValidationContext {
  mode:
    | 'draft'
    | 'submit'
    | 'counteroffer'
    | 'signature';

  /** Server-owned thread evidence, interpreted only by the state package. */
  offer?: unknown;
  currentUserUid?: string;
  currentDateTime?: Date;
}
