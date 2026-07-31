export interface Showing {
  Uid: string;

  companyUid: string;
  listingUid: string;

  sellerUid: string;
  buyerUid: string;

  buyerName: string;
  buyerEmail?: string;
  buyerPhone?: string;

  agentName: string;
  agentEmail?: string;
  agentPhone?: string;

  showingDate: Date;
  showingEndDate?: Date;

  status: ShowingStatus;

  confirmationCode?: string;

  notes?: string;
  showingInstructions?: string;

  createdAt: Date;
  updatedAt: Date;
}

export type ShowingStatus =
  | 'requested'
  | 'approved'
  | 'declined'
  | 'rescheduled'
  | 'completed'
  | 'cancelled'
  | 'no_show';