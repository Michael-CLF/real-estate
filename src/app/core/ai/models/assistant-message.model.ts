import {
  AssistantSource
} from './assistant-response.model';

export type AssistantMessageRole =
  'user' |
  'assistant';

export interface AssistantConversationMessage {
  role: AssistantMessageRole;
  content: string;
}

export interface AssistantMessage {
  uid: string;
  role: AssistantMessageRole;
  content: string;
  createdAt: Date;
  sources: AssistantSource[];
  requiresProfessionalAssistance: boolean;
}