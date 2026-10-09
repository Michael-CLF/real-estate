import type { FormBuilder } from '@angular/forms';

export interface SouthCarolinaListingAnswers {
  readonly beachfrontApplies: boolean | null;
  readonly futureVacationBookingsExist: boolean | null;
}

export function createSouthCarolinaListingAnswersForm(fb: FormBuilder) {
  return fb.nonNullable.group({
    beachfrontApplies: [null as boolean | null],
    futureVacationBookingsExist: [null as boolean | null],
  });
}

export function restoreSouthCarolinaListingAnswers(
  saved: Partial<SouthCarolinaListingAnswers> | null | undefined,
): SouthCarolinaListingAnswers {
  return {
    beachfrontApplies: saved?.beachfrontApplies ?? null,
    futureVacationBookingsExist: saved?.futureVacationBookingsExist ?? null,
  };
}
