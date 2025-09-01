import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MODEL_MAP = new Set(['gpt-5', 'gpt-5-mini', 'gpt-5-nano', 'gpt-4o-search-preview']);

export async function chatOpenAI({ model, prompt, content, jsonMode = false }) {
  const selectedModel = MODEL_MAP.has(model) ? model : (process.env.OPENAI_DEFAULT_MODEL || 'gpt-5-mini');
  try {
    const requestOptions = {
      model: selectedModel,
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content },
      ],
    };

    // 如果需要 JSON 格式回應，添加 response_format 參數
    if (jsonMode) {
      requestOptions.response_format = { type: "json_object" };
    }

    const response = await client.chat.completions.create(requestOptions);
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