import express from 'express';
import fs from 'fs';
import path from 'path';
import moment from 'moment';
import { chatOpenAI } from '../providers/openai.js';
import { chatGeminiGenAI } from '../providers/geminiGenAi.js';

const router = express.Router();

const logsDir = path.join(process.cwd(), 'logs');
const compareLogPath = path.join(logsDir, 'model-compare.log');
const MAX_CONTENT_LENGTH = 50000;
const MAX_PROMPT_LENGTH = 10000;

const OPENAI_MODELS = [
  {
    label: 'GPT 5.4',
    value: process.env.COMPARE_OPENAI_MODEL_MAIN || 'gpt-5.4',
    inputPricePer1M: 2.5,
    outputPricePer1M: 15,
    totalTokensLimit: 1000000,
    maxOutputTokens: 128000,
    maxInputTokens: 1000000,
    knowledgeCutoff: '2025/8/31',
  },
  {
    label: 'GPT 5.4 Mini',
    value: process.env.COMPARE_OPENAI_MODEL_MINI || 'gpt-5.4-mini',
    inputPricePer1M: 0.75,
    outputPricePer1M: 4.5,
    totalTokensLimit: 400000,
    maxOutputTokens: 128000,
    maxInputTokens: 400000,
    knowledgeCutoff: '',
  },
  {
    label: 'GPT 5.4 Nano',
    value: process.env.COMPARE_OPENAI_MODEL_NANO || 'gpt-5.4-nano',
    inputPricePer1M: 0.2,
    outputPricePer1M: 1.25,
    totalTokensLimit: 400000,
    maxOutputTokens: 128000,
    maxInputTokens: 400000,
    knowledgeCutoff: '',
  },
];

const GEMINI_MODELS = [
  {
    label: 'Gemini 3.1 Flash',
    value: process.env.COMPARE_GEMINI_MODEL_FLASH || 'gemini-3.1-flash-lite-preview',
    inputPricePer1M: 0.25,
    outputPricePer1M: 1.5,
    maxInputTokens: 1800000,
    maxOutputTokens: 200000,
    totalTokensLimit: 2000000,
    knowledgeCutoff: '',
  },
  {
    label: 'Gemini 3.1 Pro Preview',
    value: process.env.COMPARE_GEMINI_MODEL_PRO || 'gemini-3.1-pro-preview',
    inputPricePer1M: 2,
    outputPricePer1M: 12,
    maxInputTokens: 100000,
    maxOutputTokens: 28000,
    totalTokensLimit: 128000,
    knowledgeCutoff: '',
  },
];

const MODEL_CATALOG = [...OPENAI_MODELS, ...GEMINI_MODELS].reduce((catalog, model) => {
  catalog[model.value] = model;
  return catalog;
}, {});

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

function generateTraceId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function writeToCompareLog(logData) {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  fs.appendFileSync(compareLogPath, `${JSON.stringify(logData)}\n`, 'utf8');
}

function getRecentRuns(limit = 5) {
  if (!fs.existsSync(compareLogPath)) {
    return [];
  }

  const lines = fs
    .readFileSync(compareLogPath, 'utf8')
    .split('\n')
    .filter(Boolean)
    .slice(-limit)
    .reverse();

  return lines
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function normalizeError(error) {
  return error?.response?.data || error?.message || 'Unknown error';
}

function calculateCost(tokens, pricePer1M) {
  return Number((((tokens ?? 0) / 1000000) * (pricePer1M ?? 0)).toFixed(6));
}

function validatePayload(body) {
  const {
    leftPrompt,
    rightPrompt,
    content,
    leftModel,
    rightModel,
  } = body || {};

  if (!leftPrompt || !rightPrompt || !content || !leftModel || !rightModel) {
    return 'leftPrompt, rightPrompt, content, leftModel, rightModel 為必填';
  }

  if (leftPrompt.length > MAX_PROMPT_LENGTH || rightPrompt.length > MAX_PROMPT_LENGTH) {
    return `prompt 超過長度限制 (最大 ${MAX_PROMPT_LENGTH} 字元)`;
  }

  if (content.length > MAX_CONTENT_LENGTH) {
    return `content 超過長度限制 (最大 ${MAX_CONTENT_LENGTH} 字元)`;
  }

  return null;
}

async function runSingleComparison({ provider, model, prompt, content }) {
  const startedAt = Date.now();
  const modelMeta = MODEL_CATALOG[model] || null;

  try {
    const result = provider === 'openai'
      ? await chatOpenAI({ model, prompt, content })
      : await chatGeminiGenAI({ model, prompt, content });
    const inputTokens = result.inputTokens ?? 0;
    const outputTokens = result.outputTokens ?? 0;
    const inputCostUsd = calculateCost(inputTokens, modelMeta?.inputPricePer1M);
    const outputCostUsd = calculateCost(outputTokens, modelMeta?.outputPricePer1M);

    return {
      provider,
      model,
      modelMeta,
      ok: true,
      durationMs: Date.now() - startedAt,
      inputTokens,
      outputTokens,
      totalTokens: result.totalTokens ?? (inputTokens + outputTokens),
      inputCostUsd,
      outputCostUsd,
      totalCostUsd: Number((inputCostUsd + outputCostUsd).toFixed(6)),
      text: result.text,
      error: null,
    };
  } catch (error) {
    return {
      provider,
      model,
      modelMeta,
      ok: false,
      durationMs: Date.now() - startedAt,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      inputCostUsd: 0,
      outputCostUsd: 0,
      totalCostUsd: 0,
      text: '',
      error: normalizeError(error),
    };
  }
}

router.get('/', (req, res) => {
  res.render('compare', {
    pageTitle: 'Model Compare',
    openaiModels: OPENAI_MODELS,
    geminiModels: GEMINI_MODELS,
    modelCatalog: MODEL_CATALOG,
    defaultLeftPrompt: '你是一名新聞校稿人員\n請用繁體中文字指出新聞稿中的錯字或用詞錯誤\n且不要超過10個\n你只需要回答以下格式即可 請勿提供更正後的新聞內容:\n用詞建議:\n1. "錯字字詞" -> "正確字詞"\n2.\n\n新聞內容如下:',
    defaultRightPrompt: '你是一名新聞校稿人員\n請用繁體中文字指出新聞稿中的錯字或用詞錯誤\n且不要超過10個\n你只需要回答以下格式即可 請勿提供更正後的新聞內容:\n用詞建議:\n1. "錯字字詞" -> "正確字詞"\n2.\n\n新聞內容如下:',
    recentRuns: getRecentRuns(),
  });
});

router.post('/api/run', async (req, res) => {
  const validationError = validatePayload(req.body);

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const traceId = generateTraceId();
  const timestamp = moment().utcOffset(8).format('YYYY-MM-DD HH:mm:ss');
  const userIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.ip
    || req.socket?.remoteAddress
    || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';
  const {
    leftPrompt,
    rightPrompt,
    content,
    leftModel,
    rightModel,
  } = req.body;
  const requestStartedAt = Date.now();

  const [leftResult, rightResult] = await Promise.all([
    runSingleComparison({
      provider: 'openai',
      model: leftModel,
      prompt: leftPrompt,
      content,
    }),
    runSingleComparison({
      provider: 'gemini',
      model: rightModel,
      prompt: rightPrompt,
      content,
    }),
  ]);

  const compareLog = {
    type: 'model_compare',
    trace_id: traceId,
    timestamp,
    total_duration_ms: Date.now() - requestStartedAt,
    user_ip: userIp,
    user_agent: userAgent,
    content,
    left: {
      prompt: leftPrompt,
      ...leftResult,
    },
    right: {
      prompt: rightPrompt,
      ...rightResult,
    },
  };

  writeToCompareLog(compareLog);
  return res.json(compareLog);
});

export default router;
