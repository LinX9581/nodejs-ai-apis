import { VertexAI } from "@google-cloud/vertexai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import Groq from "groq-sdk";
import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import axios from "axios";
import ffmpeg from "fluent-ffmpeg";

// gemini1()
async function gemini1() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro",
    tools: [
      {
        codeExecution: {},
      },
    ],
  });

  const result = await model.generateContent(
    "What is the sum of the first 50 prime numbers? " + "Generate and run code for the calculation, and make sure you get all 50."
  );

  const response = result.response;
  console.log(response.text());
}

// Gemini Pro
export async function gemini(prompt, content) {
  try {
    const vertex_ai = new VertexAI({ project: "nownews-ai", location: "asia-northeast1" });
    const model = "gemini-1.5-flash-001";
    const generativeModel = vertex_ai.preview.getGenerativeModel({
      model: model,
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 1,
        topP: 0.95,
      },
      system: prompt,
    });
    const req = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: content,
            },
          ],
        },
      ],
    };

    const streamingResp = await generativeModel.generateContentStream(req);

    // for await (const item of streamingResp.stream) {
    //   process.stdout.write("stream chunk: " + JSON.stringify(item));
    // }

    let res = await streamingResp.response;
    return res.candidates[0].content.parts[0].text;
  } catch (error) {
    console.log(error);
  }
}

// Anthropic
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY, // defaults to process.env["ANTHROPIC_API_KEY"]
});

export async function claude(prompt, content) {
  try {
    const msg = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 1024,
      system: prompt,
      messages: [{ role: "user", content: content }],
    });
    return msg.content[0].text;
  } catch (error) {
    console.error(error);
  }
}

// Groq
const groq_api = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function groq(prompt, content) {
  try {
    const completion = await groq_api.chat.completions
      .create({
        messages: [
          {
            role: "system",
            content: prompt, // 這裡放置系統消息的內容
          },
          {
            role: "user",
            content: content,
          },
        ],
        model: "llama3-8b-8192",
      })
      .then((chatCompletion) => {
        return chatCompletion.choices[0]?.message?.content;
      });
    return completion;
  } catch (error) {
    console.error(error);
  }
}

export async function groq_whisper(file) {
  try {
    console.log(file.file.path);

    // // ffmpeg conversion
    // await new Promise((resolve, reject) => {
    //   ffmpeg(file.file.path).noVideo().output("uploads/2332.mp3").on("end", resolve).on("error", reject).run();
    // });

    console.log("Audio extraction finished.");
    // Transcription
    const transcription = await groq_api.audio.transcriptions.create({
      file: fs.createReadStream("uploads/2332.mp3"),
      model: "whisper-large-v3",
      prompt: "請用繁體中文輸出", // Optional
      response_format: "json", // Optional
      language: "zh", // 設置語言為繁體中文
      temperature: 0.0, // Optional
    });

    console.log(transcription);
    // return transcription;
  } catch (error) {
    console.error(error);
  }
}

// OpenAI
const apiKey = process.env.OPENAI_API_KEY;
const openai = new OpenAI(apiKey);

export async function whisper(file) {
  try {
    // console.log(file.file.path);
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(file.file.path), // 使用 Node.js 的 fs 模塊來讀取檔案
      model: "whisper-1",
    });

    console.log(transcription.text);
    return transcription.text;
  } catch (error) {
    console.error(error);
  }
}

export async function chatGPT4oMini(prompt, content) {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: content },
        ],
      },
      {
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      }
    );
    console.log(response.data.usage);
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error(error);
  }
}

export async function chatGPT4o(prompt, content) {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o",
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: content },
        ],
      },
      {
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      }
    );

    console.log(response.data.usage);
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error(error);
  }
}

// getimg();
export async function getimg() {
  try {
    const options = {
      method: "POST",
      url: "https://api.getimg.ai/v1/stable-diffusion-xl/text-to-image",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        authorization: `Bearer ${process.env.GETIMG_API_KEY}`,
      },
      data: {
        model: "stable-diffusion-xl-v1-0",
        prompt: "A cute cat, highly detailed, soft fur, big eyes, playful pose, studio lighting, 4k resolution, photorealistic",
        negative_prompt: "Disfigured, cartoon, blurry, low quality, bad anatomy, bad proportions, extra limbs, text, watermark",
        width: 1024,
        height: 1024,
        steps: 30,
        guidance: 7.5,
        seed: 0,
        scheduler: 'euler',
        output_format: 'jpeg',
        response_format: 'b64'
      },
    };

    await axios
      .request(options)
      .then(function (response) {
        const imageData = response.data.image;
        const buffer = Buffer.from(imageData, "base64");
        // 將圖片保存到本地文件
        fs.writeFileSync("/devops/github/output.jpg", buffer);
      })
      .catch(function (error) {
        console.error(error);
      });

    console.log("圖片已生成並保存為 output.png");
  } catch (error) {
    console.error(error);
  }
}
