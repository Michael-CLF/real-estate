import {
  Injectable
} from '@angular/core';

import {
  httpsCallable
} from 'firebase/functions';

import {
  functions
} from '../../infrastructure/firebase/firebase';

import {
  AssistantContactRequest,
  AssistantContactResponse
} from '../models/assistant-contact-request.model';

@Injectable({
  providedIn: 'root'
})
export class NavStreetAssistantContactService {

  private readonly submitCallable =
    httpsCallable<
      AssistantContactRequest,
      AssistantContactResponse
    >(
      functions,
      'submitAssistantContactRequest'
    );

  async submit(
    request:
      AssistantContactRequest
  ): Promise<AssistantContactResponse> {
    const response =
      await this.submitCallable(
        request
      );

    return response.data;
  }
}