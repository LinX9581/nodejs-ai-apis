import { VertexAI, HarmCategory, HarmBlockThreshold } from '@google-cloud/vertexai';

const project = process.env.GOOGLE_CLOUD_PROJECT;
const location = process.env.VERTEX_LOCATION || 'us-central1';
const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash-001';

const vertexAI = new VertexAI({ project, location });

export async function chatGemini({ prompt, content, model }) {
  try {
    const model = vertexAI.getGenerativeModel({
      model: model || DEFAULT_GEMINI_MODEL,
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
      generationConfig: { maxOutputTokens: 512 },
    });

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: `${prompt}\n\n${content}` }],
        },
      ],
    });

    const response = result.response;
    const usage = response?.usageMetadata || {};
    const totalTokens = usage?.totalTokenCount ?? ((usage?.promptTokenCount ?? 0) + (usage?.candidatesTokenCount ?? 0));
    const text = response?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return { api: 'vertexai.generative-ai', model: model || DEFAULT_GEMINI_MODEL, totalTokens, text };
  } catch (error) {
    throw error;
  }
}


