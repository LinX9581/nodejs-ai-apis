import { GoogleGenerativeAI } from "@google/generative-ai";
import { VertexAI, HarmCategory, HarmBlockThreshold } from "@google-cloud/vertexai";

const vertexAI = new VertexAI({
  project: "nownews-ai",
  location: "us-central1",
});

const generativeModel = vertexAI.getGenerativeModel({
  model: "gemini-2.0-flash-exp",
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ],
  generationConfig: { maxOutputTokens: 256 },
});

/**
 * Interact with the Gemini text model.
 * @param {string} prompt - The system instruction or role for the AI.
 * @param {string} content - The input message to send to the AI.
 * @returns {Promise<string>} - The AI's response.
 */
export async function gemini(prompt, content) {
  try {
    const chat = generativeModel.startChat({
      systemInstruction: { role: "system", parts: [{ text: prompt }] },
    });
    const result = await chat.sendMessage(content);
    const response = result.response?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
    return response;
  } catch (error) {
    console.error("Error interacting with Gemini model:", error);
    throw error;
  }
}

// Example usage
// gemini("You are a helpful teacher.", "Can you explain the basics of Node.js?");

// gemini()
export async function gemini1(prompt, content) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const totalContent = prompt + content;
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
  const result = await model.generateContent(totalContent);
  const response = await result.response;
  const text = response.text();
  return text;
}
