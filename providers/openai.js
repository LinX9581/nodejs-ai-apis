import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MODEL_MAP = new Set(['gpt-5', 'gpt-5-mini', 'gpt-5-nano']);

export async function chatOpenAI({ model, prompt, content }) {
  const selectedModel = MODEL_MAP.has(model) ? model : (process.env.OPENAI_DEFAULT_MODEL || 'gpt-5-mini');
  try {
    const response = await client.chat.completions.create({
      model: selectedModel,
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content },
      ],
    });
    const usage = response.usage || {};
    const text = response?.choices?.[0]?.message?.content ?? '';
    return {
      api: 'openai.chat.completions',
      model: selectedModel,
      totalTokens: usage.total_tokens ?? (usage.prompt_tokens ?? 0) + (usage.completion_tokens ?? 0),
      text,
    };
  } catch (error) {
    throw error;
  }
}


