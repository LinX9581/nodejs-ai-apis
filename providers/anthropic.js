import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
const DEFAULT_CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';

export async function chatClaude({ prompt, content, model }) {
  try {
    const result = await client.messages.create({
      model: model || DEFAULT_CLAUDE_MODEL,
      max_tokens: 1024,
      system: prompt,
      messages: [{ role: 'user', content }],
    });
    const usage = result.usage || {};
    const totalTokens = (usage.input_tokens ?? 0) + (usage.output_tokens ?? 0);
    const text = result?.content?.[0]?.text ?? '';
    return { api: 'anthropic.messages', model: model || DEFAULT_CLAUDE_MODEL, totalTokens, text };
  } catch (error) {
    throw error;
  }
}


