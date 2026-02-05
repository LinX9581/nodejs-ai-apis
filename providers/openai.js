import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function chatOpenAI({ model, prompt, content, jsonMode = false }) {
  // 直接使用傳入的 model（由路由層透過環境變數控制）
  try {
    const requestOptions = {
      model,
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
      model,
      totalTokens: usage.total_tokens ?? (usage.prompt_tokens ?? 0) + (usage.completion_tokens ?? 0),
      text,
    };
  } catch (error) {
    throw error;
  }
}