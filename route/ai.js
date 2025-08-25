import express from 'express';
import { chatOpenAI } from '../providers/openai.js';
import { chatClaude } from '../providers/anthropic.js';
import { chatGemini } from '../providers/gemini.js';

const router = express.Router();

router.post('/gpt/gpt5', async (req, res) => {
  const startAtMs = Date.now();
  try {
    const { prompt, content } = req.body || {};
    if (!prompt || !content) {
      return res.status(400).json({ message: 'prompt, content 為必填' });
    }
    const model = process.env.OPENAI_DEFAULT_MODEL || 'gpt-5-mini';
    console.log('[AI Request]', { prompt, content });
    const result = await chatOpenAI({ model, prompt, content });
    const durationMs = Date.now() - startAtMs;
    const line = `${req.path} model=${result.model} total_tokens=${result.totalTokens ?? 0} duration_ms=${durationMs}`;
    console.log('[AI Usage]', line);
    console.log('[AI Output]', result.text);
    res.type('text/plain');
    return res.send(result.text);
  } catch (error) {
    console.error('[AI Error]', error?.response?.data || error?.message || error);
    return res.status(500).json({ message: 'AI 服務錯誤' });
  }
});

router.post('/gemini/gemini2.5', async (req, res) => {
  const startAtMs = Date.now();
  try {
    const { prompt, content } = req.body || {};
    if (!prompt || !content) {
      return res.status(400).json({ message: 'prompt, content 為必填' });
    }
    const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash-001';
    console.log('[AI Request]', { prompt, content });
    const result = await chatGemini({ model, prompt, content });
    const durationMs = Date.now() - startAtMs;
    const line = `${req.path} model=${result.model} total_tokens=${result.totalTokens ?? 0} duration_ms=${durationMs}`;
    console.log('[AI Usage]', line);
    console.log('[AI Output]', result.text);
    res.type('text/plain');
    return res.send(result.text);
  } catch (error) {
    console.error('[AI Error]', error?.response?.data || error?.message || error);
    return res.status(500).json({ message: 'AI 服務錯誤' });
  }
});

router.post('/claude/claude4', async (req, res) => {
  const startAtMs = Date.now();
  try {
    const { prompt, content } = req.body || {};
    if (!prompt || !content) {
      return res.status(400).json({ message: 'prompt, content 為必填' });
    }
    const model = process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';
    console.log('[AI Request]', { prompt, content });
    const result = await chatClaude({ model, prompt, content });
    const durationMs = Date.now() - startAtMs;
    const line = `${req.path} model=${result.model} total_tokens=${result.totalTokens ?? 0} duration_ms=${durationMs}`;
    console.log('[AI Usage]', line);
    console.log('[AI Output]', result.text);
    res.type('text/plain');
    return res.send(result.text);
  } catch (error) {
    console.error('[AI Error]', error?.response?.data || error?.message || error);
    return res.status(500).json({ message: 'AI 服務錯誤' });
  }
});

export default router;


