import {
  Injectable
} from '@angular/core';

import {
  httpsCallable
} from 'firebase/functions';

import {
  functions
} from '../../../infrastructure/firebase/firebase';

export interface ContactInquirySubmission {
  email: string;
  firstName: string;
  interest: string;
  lastName: string;
  marketingConsent: boolean;
  message: string;
  phone: string;
  state: string;
  website: string;
}

interface ContactInquiryResponse {
  accepted: boolean;
  inquiryUid?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContactInquiryService {
  private readonly submitCallable =
    httpsCallable<
      ContactInquirySubmission,
      ContactInquiryResponse
    >(
      functions,
      'submitContactInquiry'
    );

  async submit(
    inquiry: ContactInquirySubmission
  ): Promise<ContactInquiryResponse> {
    const response =
      await this.submitCallable(
        inquiry
      );

    return response.data;
  }
}