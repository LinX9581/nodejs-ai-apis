import { VertexAI, HarmCategory, HarmBlockThreshold } from '@google-cloud/vertexai';

const project = process.env.GOOGLE_CLOUD_PROJECT;
const location = process.env.VERTEX_LOCATION || 'us-central1';

const vertexAI = new VertexAI({ project, location });

export async function chatGemini({ prompt, content, model, jsonMode = false }) {
  try {
    const generationConfig = { maxOutputTokens: 512 };
    
    // JSON Mode
    if (jsonMode) {
      generationConfig.responseMimeType = 'application/json';
    }

    const generativeModel = vertexAI.getGenerativeModel({
      model,
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
      generationConfig,
    });

    const result = await generativeModel.generateContent({
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
    return { api: 'vertexai.generative-ai', model, totalTokens, text };
  } catch (error) {
    throw error;
  }
}


