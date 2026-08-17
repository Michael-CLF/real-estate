import {
  Injectable
} from '@angular/core';

import {
  httpsCallable
} from 'firebase/functions';

import {
  functions
} from '../../../infrastructure/firebase/firebase';

import {
  CreateListingInquiryRequest,
  CreateListingInquiryResponse,
  GetListingInquiriesRequest,
  GetListingInquiriesResponse,
  MarkListingInquiryReadRequest,
  MarkListingInquiryReadResponse
} from '../models/listing-inquiry.model';

@Injectable({
  providedIn: 'root'
})
export class ListingInquiryService {
  private readonly createListingInquiryFunction =
    httpsCallable<
      CreateListingInquiryRequest,
      CreateListingInquiryResponse
    >(
      functions,
      'createListingInquiry'
    );

  private readonly getListingInquiriesFunction =
    httpsCallable<
      GetListingInquiriesRequest,
      GetListingInquiriesResponse
    >(
      functions,
      'getListingInquiries'
    );

  private readonly markListingInquiryReadFunction =
    httpsCallable<
      MarkListingInquiryReadRequest,
      MarkListingInquiryReadResponse
    >(
      functions,
      'markListingInquiryRead'
    );

  async createListingInquiry(
    request: CreateListingInquiryRequest
  ): Promise<CreateListingInquiryResponse> {
    const result =
      await this.createListingInquiryFunction(
        request
      );

    return result.data;
  }

  async getListingInquiries(
    listingUid: string
  ): Promise<GetListingInquiriesResponse> {
    const result =
      await this.getListingInquiriesFunction({
        listingUid
      });

    return result.data;
  }

  async markListingInquiryRead(
    inquiryUid: string
  ): Promise<MarkListingInquiryReadResponse> {
    const result =
      await this.markListingInquiryReadFunction({
        inquiryUid
      });

    return result.data;
  }
}