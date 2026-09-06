export type AssistantMessageRole =
  'user' |
  'assistant';

export type AssistantKnowledgeCategory =
  'platform' |
  'seller' |
  'buyer' |
  'listing' |
  'enhancements' |
  'showings' |
  'inquiries' |
  'marketing' |
  'professionals' |
  'payments' |
  'identity' |
  'offers' |
  'transactions' |
  'legal' |
  'privacy' |
  'account' |
  'support';

export interface AssistantConversationMessage {
  role: AssistantMessageRole;
  content: string;
}

export interface AskNavStreetAssistantData {
  message: string;
  conversationUid?: string;
  conversationHistory?: AssistantConversationMessage[];
  currentPath?: string;
  anonymousSessionUid?: string;
}

export interface AssistantSource {
  id: string;
  title: string;
  path: string | null;
}

export interface AskNavStreetAssistantResponse {
  conversationUid: string;
  messageUid: string;
  answer: string;
  sources: AssistantSource[];
  remainingRequests: number;
  requiresProfessionalAssistance: boolean;
}

export interface AssistantKnowledgeItem {
  id: string;
  title: string;
  category: AssistantKnowledgeCategory;
  content: string;
  keywords: readonly string[];
  path: string | null;
  requiresDisclaimer: boolean;
}

export interface AssistantRateLimitIdentity {
  key: string;
  isAuthenticated: boolean;
}

export interface AssistantRateLimitResult {
  remainingRequests: number;
  hourlyRequestCount: number;
  dailyRequestCount: number;
}

export interface PreparedAssistantRequest {
  message: string;
  conversationUid: string | null;
  conversationHistory: AssistantConversationMessage[];
  currentPath: string | null;
  anonymousSessionUid: string | null;
}