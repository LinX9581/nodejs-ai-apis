import request from 'supertest';

describe('AI API - OpenAI GPT-5 smoke test', () => {
  it('POST /ai/gpt/gpt5 returns AI output text', async () => {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OPENAI_API_KEY is not set. Skipping integration test.');
      return;
    }
    const { default: app } = await import('../index.js');
    const res = await request(app)
      .post('/ai/gpt/gpt5')
      .send({ prompt: 'system', content: 'ping' })
      .expect(200);
    expect(typeof res.text).toBe('string');
    expect(res.text.length).toBeGreaterThan(0);
  });
});
