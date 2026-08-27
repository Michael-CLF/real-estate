import {
  HttpsError
} from 'firebase-functions/v2/https';

export type TransactionTaskStatus =
  | 'pending'
  | 'completed'
  | 'not_applicable';

export interface TransactionTaskDefinition {
  id: string;
  label: string;
  description: string;
}

export interface SubmittedTransactionTask {
  id: string;
  dueDate: string | null;
  status: TransactionTaskStatus;
}

export const TRANSACTION_TASK_DEFINITIONS:
  readonly TransactionTaskDefinition[] = [
    {
      id:
        'agreement_effective',

      label:
        'Agreement effective date',

      description:
        'Date the purchase agreement became effective.'
    },
    {
      id:
        'due_diligence_fee_due',

      label:
        'Due-diligence fee due',

      description:
        'Contractual deadline for any applicable due-diligence fee.'
    },
    {
      id:
        'earnest_money_due',

      label:
        'Earnest-money deposit due',

      description:
        'Contractual deadline for the earnest-money deposit.'
    },
    {
      id:
        'due_diligence_ends',

      label:
        'Due-diligence period ends',

      description:
        'Final date of the negotiated due-diligence period.'
    },
    {
      id:
        'inspection_scheduled',

      label:
        'Inspection scheduled',

      description:
        'Planned date for the property inspection.'
    },
    {
      id:
        'inspection_completed',

      label:
        'Inspection completed',

      description:
        'Date the property inspection was completed.'
    },
    {
      id:
        'repair_negotiations_completed',

      label:
        'Repair negotiations completed',

      description:
        'Target date for resolving any inspection-related requests.'
    },
    {
      id:
        'loan_application_due',

      label:
        'Loan application due',

      description:
        'Contractual or planned deadline for the buyer loan application.'
    },
    {
      id:
        'appraisal_ordered',

      label:
        'Appraisal ordered',

      description:
        'Date the lender appraisal was ordered.'
    },
    {
      id:
        'appraisal_completed',

      label:
        'Appraisal completed',

      description:
        'Target or completed appraisal date.'
    },
    {
      id:
        'mortgage_approval_due',

      label:
        'Mortgage approval deadline',

      description:
        'Contractual financing or mortgage-approval deadline.'
    },
    {
      id:
        'insurance_confirmed',

      label:
        'Homeowners insurance confirmed',

      description:
        'Target date for confirming required property insurance.'
    },
    {
      id:
        'title_review_completed',

      label:
        'Title and attorney review completed',

      description:
        'Target date for completing title and closing-attorney review.'
    },
    {
      id:
        'final_walkthrough',

      label:
        'Final walkthrough',

      description:
        'Scheduled date for the buyer final walkthrough.'
    },
    {
      id:
        'closing',

      label:
        'Closing date',

      description:
        'Anticipated closing date stated in the agreement.'
    }
  ];

const TASK_IDS =
  new Set(
    TRANSACTION_TASK_DEFINITIONS.map(
      definition =>
        definition.id
    )
  );

const TASK_STATUSES =
  new Set<TransactionTaskStatus>([
    'pending',
    'completed',
    'not_applicable'
  ]);

export function validateListingUid(
  value: unknown
): string {

  if (
    typeof value !== 'string' ||
    !value.trim()
  ) {
    throw new HttpsError(
      'invalid-argument',
      'The selected listing could not be identified.'
    );
  }

  return value.trim();
}

export function validateSubmittedTasks(
  value: unknown
): SubmittedTransactionTask[] {

  if (
    !Array.isArray(value) ||
    value.length !==
      TRANSACTION_TASK_DEFINITIONS.length
  ) {
    throw new HttpsError(
      'invalid-argument',
      'The contract timeline tasks are incomplete.'
    );
  }

  const seenTaskIds =
    new Set<string>();

  const tasks =
    value.map(
      task => {

        if (!isRecord(task)) {
          throw new HttpsError(
            'invalid-argument',
            'A contract timeline task is invalid.'
          );
        }

        const id =
          task['id'];

        const dueDate =
          task['dueDate'];

        const status =
          task['status'];

        if (
          typeof id !== 'string' ||
          !TASK_IDS.has(id) ||
          seenTaskIds.has(id)
        ) {
          throw new HttpsError(
            'invalid-argument',
            'A contract timeline task identifier is invalid.'
          );
        }

        seenTaskIds.add(id);

        if (
          typeof status !== 'string' ||
          !TASK_STATUSES.has(
            status as TransactionTaskStatus
          )
        ) {
          throw new HttpsError(
            'invalid-argument',
            'A contract timeline task status is invalid.'
          );
        }

        if (
          dueDate !== null &&
          (
            typeof dueDate !== 'string' ||
            !isValidDateOnly(
              dueDate
            )
          )
        ) {
          throw new HttpsError(
            'invalid-argument',
            'Use a valid date for each applicable task.'
          );
        }

        return {
          id,

          dueDate:
            dueDate as string | null,

          status:
            status as
              TransactionTaskStatus
        };
      }
    );

  return (
    TRANSACTION_TASK_DEFINITIONS.map(
      definition => {

        const task =
          tasks.find(
            candidate =>
              candidate.id ===
              definition.id
          );

        if (!task) {
          throw new HttpsError(
            'invalid-argument',
            'The contract timeline tasks are incomplete.'
          );
        }

        return task;
      }
    )
  );
}

function isValidDateOnly(
  value: string
): boolean {

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      value
    )
  ) {
    return false;
  }

  const date =
    new Date(
      `${value}T00:00:00.000Z`
    );

  return (
    !Number.isNaN(
      date.getTime()
    ) &&
    date
      .toISOString()
      .slice(
        0,
        10
      ) === value
  );
}

function isRecord(
  value: unknown
): value is Record<string, unknown> {

  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
  );
}