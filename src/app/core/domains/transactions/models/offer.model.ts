export interface Offer {
  Uid: string;

  companyUid: string;
  listingUid: string;

  sellerUid: string;
  buyerUid: string;

  buyerName: string;

  offerAmount: number;
  earnestMoney: number;
  downPayment?: number;

  financingType: FinancingType;

  contingencyCount: number;

  inspectionContingency: boolean;
  appraisalContingency: boolean;
  financingContingency: boolean;
  saleOfHomeContingency: boolean;

  requestedClosingDate?: Date;
  expirationDate?: Date;

  message?: string;

  status: OfferStatus;

  submittedAt: Date;
  updatedAt: Date;
}

export type OfferStatus =
  | 'new'
  | 'reviewing'
  | 'countered'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'
  | 'expired';

export type FinancingType =
  | 'cash'
  | 'conventional'
  | 'fha'
  | 'va'
  | 'usda'
  | 'other';