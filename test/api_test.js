import axios from "axios";
import FormData from "form-data";
import fs from "fs";

// whisper_test();
async function whisper_test() {
  try {
    const data = new FormData();
    data.append("file", fs.createReadStream("/var/www/1.mp3"));

    const config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "http://127.0.0.1:3006/ai/whisper",
      headers: {
        ...data.getHeaders(),
      },
      data: data,
    };

    const response = await axios.request(config);
  } catch (error) {
    console.log(error);
  }
}

// chat("groq");
// chat("chatgpt3");
// chat("chatgpt4");
// chat("gemini");
// chat("claude");

// curl -X POST http://127.0.0.1:3008/ai/gemini \
// -H "Content-Type: application/json" \
// -d '{"prompt": "system", "content": "who are you"}'

async function chat(ai) {
  const data = JSON.stringify({
    prompt: "system",
    content: "who are you",
  });

  const config = {
    method: "post",
    maxBodyLength: Infinity,
    url: `http://127.0.0.1:3006/ai/${ai}`, // 確保 ai 變數已經定義並且可用
    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  };

  try {
    const response = await axios.request(config);
    console.log(JSON.stringify(response.data));
  } catch (error) {
    console.log(error);
  }
}
