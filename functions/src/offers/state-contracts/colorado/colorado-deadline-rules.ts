import type { ColoradoOfferTermsDocument } from './colorado-offer-terms.document';
import { coloradoTermIssues } from './colorado-terms-rules';
export type DeadlineIssue = { fieldPath: string; message: string };
export function coloradoDeadlineIssues(terms: ColoradoOfferTermsDocument): DeadlineIssue[] {
  return coloradoTermIssues(terms).filter(issue => issue.fieldPath.startsWith('deadlines.'));
}