import type { StateListingPackage } from './state-listing-package';

/** Validate required boolean answers at the save boundary using the registered question paths. */
export function validateStateListingQuestionAnswers(
  statePackage: StateListingPackage,
  answers: unknown,
): void {
  for (const group of statePackage.questionGroups ?? []) {
    for (const question of group.questions) {
      if (!question.required) continue;
      let value: unknown = answers;
      for (const segment of question.fieldPath.split('.')) {
        value = value !== null && typeof value === 'object'
          ? (value as Record<string, unknown>)[segment]
          : undefined;
      }
      if (typeof value !== 'boolean') {
        throw new Error(group.requiredMessage ?? question.requiredMessage);
      }
    }
  }
}
