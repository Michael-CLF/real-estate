export interface AssistantContactRequest {
  firstName: string;
  email: string;
  phone: string;
  contactConsent: boolean;
  website: string;
  anonymousSessionUid: string | null;
}

export interface AssistantContactResponse {
  accepted: boolean;
}