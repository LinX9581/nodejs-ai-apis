import query from "../mysql-connect";
import express from "express";
import moment from "moment";
import * as aiApi from "../component/ai_api";
import multer from "multer";
const path = require("path");
const { v4: uuidv4 } = require("uuid"); // 引入 uuid 來生成唯一檔案名

// 設置上傳資料夾的路徑
const uploadDir = "./uploads";

// 檢查 uploads 目錄是否存在，如果不存在，則創建它
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 設置 multer 存儲選項
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // 設置檔案的存儲目錄
  },
  filename: function (req, file, cb) {
    // 生成一個新的檔案名（使用 uuid 並保留原始檔案的副檔名）
    const fileExt = path.extname(file.originalname); // 獲取原始檔案的副檔名
    const filename = uuidv4() + fileExt; // 生成唯一檔案名
    cb(null, filename);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 1024 }, // 限制為 5MB
});

let router = express.Router();

// speech to text
router.post("/whisper", upload.single("file"), async (req, res) => {
  try {
    req.setTimeout(10 * 60 * 1000);
    console.log("upload file");
    console.log(req.file);
    if (req.file) {
      const result = await aiApi.whisper({ file: req.file });
      res.json({ result });
    } else {
      res.status(400).json({ message: "file not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "whisper error" });
  }
});

// Chat
router.post("/groq", async (req, res) => {
  try {
    if (req.body.content) {
      const { prompt, content } = req.body;
      const result = await aiApi.groq(prompt, content);
      console.log(result);
      res.send(
        JSON.stringify({
          result,
        })
      );
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "groq error" });
  }
});

router.post("/claude", async function (req, res) {
  const { prompt, content } = req.body;
  console.log(prompt);
  console.log(content);
  let result = await aiApi.claude(prompt, content);
  console.log(result);
  res.send(
    JSON.stringify({
      result,
    })
  );
});

router.post("/gemini", async function (req, res) {
  const { prompt, content } = req.body;
  console.log(prompt);
  console.log(content);
  let result = await aiApi.gemini(prompt, content);
  console.log(result);
  res.send(
    JSON.stringify({
      result,
    })
  );
});

router.post("/chatgpt3", async (req, res) => {
  try {
    if (req.body.content) {
      const { prompt, content } = req.body;
      console.log(prompt);
      console.log(content);

      const result = await aiApi.chatGPT3(prompt, content);
      console.log(result);
      res.json({ result });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "chatgpt3 error" });
  }
});

router.post("/chatgpt4", async (req, res) => {
  try {
    if (req.body.content) {
      const { prompt, content } = req.body;
      const result = await aiApi.chatGPT4(prompt, content);
      console.log(result);
      res.json({ result });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "chatgpt4 error" });
  }
});

module.exports = router;
