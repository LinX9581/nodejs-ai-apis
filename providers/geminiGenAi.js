import { GoogleGenAI } from '@google/genai';

let ai = null;

function getGenAIClient() {
  if (!process.env.GOOGLE_GENAI_API_KEY) {
    throw new Error('GOOGLE_GENAI_API_KEY 環境變數未設定');
  }

  if (!ai) {
    ai = new GoogleGenAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
    });
  }

  return ai;
}

export async function chatGeminiGenAI({ prompt, content, model, jsonMode = false }) {
  const generationConfig = {
    maxOutputTokens: 8192,
    temperature: 1,
    topP: 0.95,
  };

  if (jsonMode) {
    generationConfig.responseMimeType = 'application/json';
  }

  const client = getGenAIClient();
  const response = await client.models.generateContent({
    model,
    contents: [
      {
        role: 'user',
        parts: [{ text: `${prompt}\n\n${content}` }],
      },
    ],
    config: generationConfig,
  });

  const text = response?.text ?? '';
  const usage = response?.usageMetadata || {};
  const inputTokens = usage?.promptTokenCount ?? 0;
  const outputTokens = usage?.candidatesTokenCount ?? 0;
  const totalTokens = usage?.totalTokenCount
    ?? (inputTokens + outputTokens);

  return { api: 'google-genai', model, inputTokens, outputTokens, totalTokens, text };
}
