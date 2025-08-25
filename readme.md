## AI API Template (OpenAI/Claude/Gemini)

### 環境變數
```
OPENAI_API_KEY=
CLAUDE_API_KEY=
GOOGLE_CLOUD_PROJECT=
VERTEX_LOCATION=us-central1
# 可選：覆蓋預設模型
# CLAUDE_MODEL=claude-3-5-sonnet-20241022
# GEMINI_MODEL=gemini-2.0-flash-001
```

### 開發與啟動
```
npm install
npm start
# 本機預設 PORT=3008，可由環境變數 PORT 覆蓋
```

### API 使用（伺服器控制模型）
- `POST /ai/gpt/gpt5` → 使用 OpenAI（伺服器以環境變數控制 `OPENAI_DEFAULT_MODEL`，預設 gpt-5-mini）
- `POST /ai/gemini/gemini2.5` → 使用 Vertex Gemini（伺服器以環境變數控制 `GEMINI_MODEL`）
- `POST /ai/claude/claude4` → 使用 Claude（伺服器以環境變數控制 `CLAUDE_MODEL`）

請求 body（必填 `prompt`, `content`）：
```
{ "prompt": "system 設定", "content": "使用者輸入" }
```

回應為單行文字（不包含 AI 文字輸出）：
```
/ai/gpt/gpt5 model=gpt-5-mini total_tokens=123 duration_ms=85
```

### Docker
```
docker build -t ai-api-template:latest .
docker run --rm -p 3008:3008 \
  -e OPENAI_API_KEY=sk-xxx \
  -e CLAUDE_API_KEY=xxx \
  -e GOOGLE_CLOUD_PROJECT=your-gcp-project \
  -e VERTEX_LOCATION=us-central1 \
  ai-api-template:latest
```

### 部署到 Cloud Run（範例）
```
gcloud run deploy ai-api-template \
  --image=asia-docker.pkg.dev/PROJECT/REPO/ai-api-template:latest \
  --region=asia-east1 --platform=managed --allow-unauthenticated \
  --set-env-vars=OPENAI_API_KEY=sk-xxx,CLAUDE_API_KEY=xxx,GOOGLE_CLOUD_PROJECT=your-gcp-project,VERTEX_LOCATION=us-central1
```

### 測試
僅進行 OpenAI GPT-5 API smoke test：
```
npm test
```