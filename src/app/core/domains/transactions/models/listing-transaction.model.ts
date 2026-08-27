export type ListingTransactionTaskId =
  | 'agreement_effective'
  | 'due_diligence_fee_due'
  | 'earnest_money_due'
  | 'due_diligence_ends'
  | 'inspection_scheduled'
  | 'inspection_completed'
  | 'repair_negotiations_completed'
  | 'loan_application_due'
  | 'appraisal_ordered'
  | 'appraisal_completed'
  | 'mortgage_approval_due'
  | 'insurance_confirmed'
  | 'title_review_completed'
  | 'final_walkthrough'
  | 'closing';

export type ListingTransactionTaskStatus =
  | 'pending'
  | 'completed'
  | 'not_applicable';

export type ListingTransactionStatus =
  | 'preparing'
  | 'under_contract'
  | 'closed'
  | 'cancelled';

export interface ListingTransactionTask {
  id: ListingTransactionTaskId;
  label: string;
  description: string;
  dueDate: string | null;
  status: ListingTransactionTaskStatus;
  completedAt: string | null;
  updatedAt: string;
  updatedByUid: string;
}

export interface ListingTransaction {
  listingUid: string;
  sellerUid: string;
  buyerUid: string | null;
  acceptedOfferUid: string | null;
  status: ListingTransactionStatus;
  tasks: ListingTransactionTask[];
  createdAt: string;
  updatedAt: string;
  updatedByUid: string;

  /*
   * True for the listing seller.
   *
   * The accepted buyer will eventually receive the same
   * timeline with read-only access.
   */
  canEdit: boolean;
}

export interface SaveListingTransactionTask {
  id: ListingTransactionTaskId;
  dueDate: string | null;
  status: ListingTransactionTaskStatus;
}