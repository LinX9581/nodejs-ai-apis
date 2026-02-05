import express from 'express';
import moment from 'moment';
import fs from 'fs';
import path from 'path';
import { chatOpenAI } from '../providers/openai.js';

const router = express.Router();

// 確保 logs 目錄存在
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// 寫入 log 檔案的函數
function writeToLogFile(logData) {
  // 在測試環境中跳過日誌寫入，避免非同步操作干擾測試
  if (process.env.NODE_ENV === 'test') {
    return;
  }
  
  const logFilePath = path.join(logsDir, 'gpt.log');
  const logLine = JSON.stringify(logData) + '\n';
  fs.appendFileSync(logFilePath, logLine, 'utf8');
}

// 路由配置表：定義每個端點的特性（模型由環境變數控制）
const ROUTE_CONFIG = {
  '/chat': {
    model: process.env.OPENAI_MODEL_CHAT || 'gpt-5.2',
    jsonMode: false,
    responseType: 'text/plain'
  },
  '/translate': {
    model: process.env.OPENAI_MODEL_TRANSLATE || 'gpt-5.2',
    jsonMode: true,
    responseType: 'application/json'
  },
  '/gptSearch': {
    model: process.env.OPENAI_MODEL_GPT_SEARCH || 'gpt-4o-search-preview',
    jsonMode: false,
    responseType: 'text/plain'
  }
};

// 內容長度限制（字元數）
const MAX_CONTENT_LENGTH = 50000;

// 生成追蹤 ID
function generateTraceId() {
  return Date.now().toString();
}

// 通用的 AI 處理函數
async function handleAIRequest(req, res, routeConfig) {
  const startAtMs = Date.now();
  const traceId = generateTraceId();
  const userIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() 
    || req.ip 
    || req.socket?.remoteAddress 
    || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';
  
  try {
    const { prompt, content } = req.body || {};

    // 驗證必填參數
    if (!prompt || !content) {
      return res.status(400).json({ message: 'prompt, content 為必填' });
    }

    // 驗證內容長度
    if (content.length > MAX_CONTENT_LENGTH) {
      return res.status(400).json({ 
        message: `Content 超過長度限制 (最大 ${MAX_CONTENT_LENGTH} 字元)` 
      });
    }

    // 使用路由配置
    const { model, jsonMode, responseType } = routeConfig;
    const requestLog = {
      type: 'ai_request',
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
    
    console.log(`[${requestLog.trace_id}] ${req.path} - ${model}`);
    writeToLogFile(requestLog);

    // 調用 AI API
    const result = await chatOpenAI({ model, prompt, content, jsonMode });
    const durationMs = Date.now() - startAtMs;
    const outputLog = {
      type: 'ai_output',
      trace_id: traceId,
      timestamp: moment().utcOffset(8).format('YYYY-MM-DD HH:mm:ss'),
      total_tokens: result.totalTokens ?? 0,
      duration_ms: durationMs,
      response: result.text
    };
    
    console.log(`[${outputLog.trace_id}] ${outputLog.total_tokens} tokens, ${outputLog.duration_ms}ms`);
    writeToLogFile(outputLog);

    // 設定回應格式並返回結果
    res.type(responseType);
    return res.send(result.text);

  } catch (error) {
    console.error(`[${traceId}] ERROR: ${error?.message || error}`);
    
    // 完整錯誤資訊仍寫入檔案
    const errorLog = {
      type: 'ai_error',
      trace_id: traceId,
      timestamp: moment().utcOffset(8).format('YYYY-MM-DD HH:mm:ss'),
      user_ip: userIp,
      user_agent: userAgent,
      error: error?.response?.data || error?.message || error
    };
    writeToLogFile(errorLog);
    return res.status(500).json({ message: 'AI 服務錯誤' });
  }
}

// 註冊所有路由
Object.keys(ROUTE_CONFIG).forEach(path => {
  router.post(path, (req, res) => handleAIRequest(req, res, ROUTE_CONFIG[path]));
});

export default router;


