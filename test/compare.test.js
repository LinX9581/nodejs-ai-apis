import request from 'supertest';
import { jest } from '@jest/globals';

const mockChatOpenAI = jest.fn();
const mockChatGeminiGenAI = jest.fn();

jest.unstable_mockModule('../providers/openai.js', () => ({
  chatOpenAI: mockChatOpenAI,
}));

jest.unstable_mockModule('../providers/geminiGenAi.js', () => ({
  chatGeminiGenAI: mockChatGeminiGenAI,
}));

const { default: app } = await import('../index.js');

describe('compare page and API', () => {
  beforeEach(() => {
    mockChatOpenAI.mockReset();
    mockChatGeminiGenAI.mockReset();
  });

  it('GET /compare renders the EJS page', async () => {
    const res = await request(app)
      .get('/compare')
      .expect(200);

    expect(res.text).toContain('Model Compare');
    expect(res.text).toContain('左側模型');
    expect(res.text).toContain('右側模型');
    expect(res.text).toContain('submit-spinner');
  });

  it('POST /compare/api/run returns both model outputs', async () => {
    mockChatOpenAI.mockResolvedValue({
      inputTokens: 100,
      outputTokens: 23,
      totalTokens: 123,
      text: 'OpenAI compare result',
    });

    mockChatGeminiGenAI.mockResolvedValue({
      inputTokens: 70,
      outputTokens: 18,
      totalTokens: 88,
      text: 'Gemini compare result',
    });

    const res = await request(app)
      .post('/compare/api/run')
      .send({
        leftPrompt: 'openai role',
        rightPrompt: 'gemini role',
        leftModel: 'gpt-5.4',
        rightModel: 'gemini-3.1-flash',
        content: 'news content',
      })
      .expect(200);

    expect(mockChatOpenAI).toHaveBeenCalledWith({
      model: 'gpt-5.4',
      prompt: 'openai role',
      content: 'news content',
    });
    expect(mockChatGeminiGenAI).toHaveBeenCalledWith({
      model: 'gemini-3.1-flash',
      prompt: 'gemini role',
      content: 'news content',
    });
    expect(res.body.left.ok).toBe(true);
    expect(res.body.right.ok).toBe(true);
    expect(res.body.left.text).toBe('OpenAI compare result');
    expect(res.body.right.text).toBe('Gemini compare result');
    expect(res.body.left.inputCostUsd).toBeCloseTo(0.00025);
    expect(res.body.left.outputCostUsd).toBeCloseTo(0.000345);
    expect(res.body.left.totalCostUsd).toBeCloseTo(0.000595);
    expect(res.body.right.inputCostUsd).toBeCloseTo(0.000017);
    expect(res.body.right.outputCostUsd).toBeCloseTo(0.000027);
    expect(typeof res.body.total_duration_ms).toBe('number');
  });

  it('POST /compare/api/run still returns the successful side when one provider fails', async () => {
    mockChatOpenAI.mockRejectedValue(new Error('OpenAI failed'));
    mockChatGeminiGenAI.mockResolvedValue({
      inputTokens: 30,
      outputTokens: 12,
      totalTokens: 42,
      text: 'Gemini survives',
    });

    const res = await request(app)
      .post('/compare/api/run')
      .send({
        leftPrompt: 'openai role',
        rightPrompt: 'gemini role',
        leftModel: 'gpt-5.4-mini',
        rightModel: 'gemini-3.1-flash',
        content: 'news content',
      })
      .expect(200);

    expect(res.body.left.ok).toBe(false);
    expect(res.body.left.error).toBe('OpenAI failed');
    expect(res.body.right.ok).toBe(true);
    expect(res.body.right.text).toBe('Gemini survives');
  });
});
