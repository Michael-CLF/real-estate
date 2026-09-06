export interface AssistantSource {
  id: string;
  title: string;
  path: string | null;
}

export interface NavStreetAssistantResponse {
  conversationUid: string;
  messageUid: string;
  answer: string;
  sources: AssistantSource[];
  remainingRequests: number;
  requiresProfessionalAssistance: boolean;
}