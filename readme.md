# Node.js AI APIs 服務

基於 Express.js 的 AI API 服務，支援 OpenAI、Claude 和 Gemini 模型，提供統一的 API 介面和完整的請求日誌記錄。

## 專案特色

- 🚀 支援多種 AI 模型：OpenAI GPT、Claude、Gemini
- 📝 完整的請求/回應日誌記錄
- 🔧 靈活的路由配置系統
- 🛡️ 錯誤處理和追蹤機制
- 🐳 Docker 支援
- ⚡ 高效能的 Node.js 22+ 架構

## 環境變數設定

```env
# OpenAI 設定
OPENAI_API_KEY=sk-your-openai-key
OPENAI_DEFAULT_MODEL=gpt-5-mini

# Claude 設定
CLAUDE_API_KEY=your-claude-key
CLAUDE_MODEL=claude-3-5-sonnet-20241022

# Google Cloud Vertex AI 設定
GOOGLE_CLOUD_PROJECT=your-gcp-project
VERTEX_LOCATION=us-central1
GEMINI_MODEL=gemini-2.0-flash-001

# 伺服器設定
PORT=3005
NODE_ENV=production
```

## 安裝與啟動

```bash
# 安裝依賴
npm install

# 開發模式
npm run dev

# 生產模式
npm start

# 執行測試
npm test
```

## API 端點

### 目前可用的路由

| 端點 | 模型 | JSON模式 | 回應格式 | 說明 |
|------|------|----------|----------|------|
| `POST /ai/gpt/gpt5` | gpt-5-mini | ✅ | text/plain | GPT-5 Mini 模型 |
| `POST /ai/translate` | gpt-5-nano | ✅ | application/json | 翻譯專用，JSON 回應 |
| `POST /ai/gptSearch` | gpt-4o-search-preview | ✅ | text/plain | GPT-4o 搜尋預覽版 |

### 請求格式

所有 API 端點都需要 POST 請求，包含以下必填欄位：

```json
{
  "prompt": "系統提示詞或指令",
  "content": "使用者輸入內容"
}
```

### 回應格式

- **文字回應** (text/plain)：直接返回 AI 生成的文字內容
- **JSON 回應** (application/json)：返回結構化的 JSON 資料

### 使用範例

```bash
# GPT-5 Mini 文字生成
curl -X POST http://localhost:3005/ai/gpt/gpt5 \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "你是一個專業的技術文件撰寫助手",
    "content": "請幫我寫一個 README 檔案"
  }'

# 翻譯服務 (JSON 回應)
curl -X POST http://localhost:3005/ai/translate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "請將以下文字翻譯成繁體中文，以 JSON 格式回應",
    "content": "Hello, how are you today?"
  }'

# GPT-4o 搜尋
curl -X POST http://localhost:3005/ai/gptSearch \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "搜尋並總結最新資訊",
    "content": "Node.js 最新版本的新功能"
  }'
```

## 日誌系統

系統會自動記錄所有 API 請求和回應到 `logs/gpt.log` 檔案中，包含：

- 請求追蹤 ID
- 時間戳記
- 使用者 IP 和 User-Agent
- 使用的模型和參數
- Token 使用量
- 回應時間
- 錯誤資訊（如有）

## 支援的 AI 模型

### OpenAI 模型
- `gpt-5-mini` (預設)
- `gpt-5`
- `gpt-5-nano`
- `gpt-4o-search-preview`

### Claude 模型
- `claude-3-5-sonnet-20241022` (預設)

### Gemini 模型
- `gemini-2.0-flash-001` (預設)

## Docker 部署

```bash
# 建立 Docker 映像
docker build -t nodejs-ai-apis:latest .

# 執行容器
docker run --rm -p 3005:3005 \
  -e OPENAI_API_KEY=sk-your-key \
  -e CLAUDE_API_KEY=your-claude-key \
  -e GOOGLE_CLOUD_PROJECT=your-project \
  -e VERTEX_LOCATION=us-central1 \
  nodejs-ai-apis:latest
```

### Docker Compose

```yaml
docker compose up -d

curl 'http://127.0.0.1:3009/ai/gpt/gpt5' --header 'Content-Type: application/json' --data '{
    "prompt": "你是新聞記者",
    "content": "給我世界新聞最新5筆"
}'

```

## Cloud Run 部署

```bash
gcloud run deploy nodejs-ai-apis \
  --image=asia-docker.pkg.dev/PROJECT/REPO/nodejs-ai-apis:latest \
  --region=asia-east1 \
  --platform=managed \
  --allow-unauthenticated \
  --set-env-vars=OPENAI_API_KEY=sk-xxx,CLAUDE_API_KEY=xxx,GOOGLE_CLOUD_PROJECT=your-project,VERTEX_LOCATION=us-central1
```

## 專案結構

```
nodejs-ai-apis/
├── index.js              # 主要應用程式入口
├── route/
│   └── ai.js             # AI API 路由處理
├── providers/
│   ├── openai.js         # OpenAI 整合
│   ├── anthropic.js      # Claude 整合
│   └── gemini.js         # Gemini 整合
├── logs/                 # 日誌檔案目錄
├── test/                 # 測試檔案
├── package.json          # 專案依賴
├── dockerfile            # Docker 設定
└── docker-compose.yml    # Docker Compose 設定
```

## 開發說明

- **Node.js 版本**：需要 22.0.0 或以上版本
- **架構**：使用 ES Modules (type: "module")
- **框架**：Express.js 4.19.2
- **日誌**：使用 moment.js 處理時區 (UTC+8)
- **錯誤處理**：完整的錯誤追蹤和記錄機制

## 測試

```bash
# 執行所有測試
npm test

# 開發模式（監聽檔案變化）
npm run dev
```

## 授權

MIT License