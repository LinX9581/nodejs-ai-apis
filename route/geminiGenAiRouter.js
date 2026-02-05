import express from 'express';
import moment from 'moment';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

const router = express.Router();

// 延遲初始化 Google GenAI（避免 API Key 未設定時 crash）
let ai = null;

function getGenAIClient() {
  if (!process.env.GOOGLE_GENAI_API_KEY) {
    throw new Error('GOOGLE_GENAI_API_KEY 環境變數未設定');
  }
  if (!ai) {
    ai = new GoogleGenAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
    });
  }
  return ai;
}

// 確保 logs 目錄存在
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// 寫入 log 檔案的函數
function writeToLogFile(logData) {
  if (process.env.NODE_ENV === 'test') {
    return;
  }
  
  const logFilePath = path.join(logsDir, 'gemini-genai.log');
  const logLine = JSON.stringify(logData) + '\n';
  fs.appendFileSync(logFilePath, logLine, 'utf8');
}

// GenAI 路由配置表
const ROUTE_CONFIG = {
  '/chat': {
    model: process.env.GEMINI_MODEL_CHAT || 'gemini-3-flash-preview',
    jsonMode: false,
    responseType: 'text/plain'
  },
  '/translate': {
    model: process.env.GEMINI_MODEL_TRANSLATE || 'gemini-3-flash-preview',
    jsonMode: true,
    responseType: 'application/json'
  }
};

// 內容長度限制（字元數）
const MAX_CONTENT_LENGTH = 50000;

// 生成追蹤 ID
function generateTraceId() {
  return Date.now().toString();
}

// GenAI 請求處理函數
async function chatGenAI({ prompt, content, model, jsonMode = false }) {
  const generationConfig = {
    maxOutputTokens: 8192,
    temperature: 1,
    topP: 0.95,
  };

  // JSON Mode
  if (jsonMode) {
    generationConfig.responseMimeType = 'application/json';
  }

  const client = getGenAIClient();
  
  const response = await client.models.generateContent({
    model,
    contents: [
      {
        role: 'user',
        parts: [{ text: `${prompt}\n\n${content}` }],
      },
    ],
    config: generationConfig,
  });

  const text = response?.text ?? '';
  const usage = response?.usageMetadata || {};
  const totalTokens = usage?.totalTokenCount ?? 
    ((usage?.promptTokenCount ?? 0) + (usage?.candidatesTokenCount ?? 0));

  return { api: 'google-genai', model, totalTokens, text };
}

// GenAI 請求處理
async function handleGenAIRequest(req, res, routeConfig) {
  const startAtMs = Date.now();
  const traceId = generateTraceId();
  const userIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() 
    || req.ip 
    || req.socket?.remoteAddress 
    || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';
  
  try {
    const { prompt, content } = req.body || {};

    if (!prompt || !content) {
      return res.status(400).json({ message: 'prompt, content 為必填' });
    }

    if (content.length > MAX_CONTENT_LENGTH) {
      return res.status(400).json({ 
        message: `Content 超過長度限制 (最大 ${MAX_CONTENT_LENGTH} 字元)` 
      });
    }

    const { model, jsonMode, responseType } = routeConfig;
    const requestLog = {
      type: 'genai_request',
      trace_id: traceId,
      timestamp: moment().utcOffset(8).format('YYYY-MM-DD HH:mm:ss'),
      path: req.path,
      model,
      user_ip: userIp,
      user_agent: userAgent,
      jsonMode,
      prompt,
      content
    };
    
    console.log(`[${requestLog.trace_id}] ${req.path} - ${model} (GenAI)`);
    writeToLogFile(requestLog);

    const result = await chatGenAI({ model, prompt, content, jsonMode });
    const durationMs = Date.now() - startAtMs;
    const outputLog = {
      type: 'genai_output',
      trace_id: traceId,
      timestamp: moment().utcOffset(8).format('YYYY-MM-DD HH:mm:ss'),
      total_tokens: result.totalTokens ?? 0,
      duration_ms: durationMs,
      response: result.text
    };
    
    console.log(`[${outputLog.trace_id}] ${outputLog.total_tokens} tokens, ${outputLog.duration_ms}ms`);
    writeToLogFile(outputLog);

    res.type(responseType);
    return res.send(result.text);

  } catch (error) {
    console.error(`[${traceId}] ERROR: ${error?.message || error}`);
    
    const errorLog = {
      type: 'genai_error',
      trace_id: traceId,
      timestamp: moment().utcOffset(8).format('YYYY-MM-DD HH:mm:ss'),
      user_ip: userIp,
      user_agent: userAgent,
      error: error?.response?.data || error?.message || error
    };
    writeToLogFile(errorLog);
    return res.status(500).json({ message: 'GenAI 服務錯誤' });
  }
}

// 註冊所有路由
Object.keys(ROUTE_CONFIG).forEach(path => {
  router.post(path, (req, res) => handleGenAIRequest(req, res, ROUTE_CONFIG[path]));
});

export default router;
