import { apiRequest } from './authApi';

export interface AiCoreHistoryItem {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AiCoreChatResponse {
  reply: string;
  model: string;
}

export interface AiCoreMemoryHit {
  id: string;
  score: number;
  text: string;
  payload: Record<string, unknown>;
}

export interface AiCoreRagResponse {
  answer: string;
  model: string;
  contexts: string[];
}

export interface AiCoreTranscriptionResponse {
  text: string;
  language?: string;
  provider: string;
}

export const aiCoreChat = async (
  prompt: string,
  history: AiCoreHistoryItem[] = [],
  model?: string
): Promise<AiCoreChatResponse> => {
  return apiRequest<AiCoreChatResponse>('/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ prompt, history, model }),
  });
};

export const aiCoreUpsertMemory = async (payload: {
  text: string;
  metadata?: Record<string, unknown>;
  userId?: string;
  id?: string;
}): Promise<{ id: string; dimensions: number }> => {
  return apiRequest<{ id: string; dimensions: number }>('/ai/memory/upsert', {
    method: 'POST',
    body: JSON.stringify({
      text: payload.text,
      metadata: payload.metadata ?? {},
      user_id: payload.userId,
      id: payload.id,
    }),
  });
};

export const aiCoreSearchMemory = async (payload: {
  query: string;
  limit?: number;
  userId?: string;
}): Promise<{ hits: AiCoreMemoryHit[] }> => {
  return apiRequest<{ hits: AiCoreMemoryHit[] }>('/ai/memory/search', {
    method: 'POST',
    body: JSON.stringify({
      query: payload.query,
      limit: payload.limit ?? 6,
      user_id: payload.userId,
    }),
  });
};

export const aiCoreRagQuery = async (payload: {
  question: string;
  limit?: number;
  model?: string;
  userId?: string;
}): Promise<AiCoreRagResponse> => {
  return apiRequest<AiCoreRagResponse>('/ai/rag/query', {
    method: 'POST',
    body: JSON.stringify({
      question: payload.question,
      limit: payload.limit ?? 6,
      model: payload.model,
      user_id: payload.userId,
    }),
  });
};

export const aiCoreTranscribe = async (payload: {
  audioBase64: string;
  language?: string;
  prompt?: string;
}): Promise<AiCoreTranscriptionResponse> => {
  return apiRequest<AiCoreTranscriptionResponse>('/ai/voice/transcribe', {
    method: 'POST',
    body: JSON.stringify({
      audio_base64: payload.audioBase64,
      language: payload.language,
      prompt: payload.prompt,
    }),
  });
};
