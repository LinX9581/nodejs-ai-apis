import { VertexAI } from "@google-cloud/vertexai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import Groq from "groq-sdk";
import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import axios from "axios";

// Gemini Pro
export async function gemini(prompt, content) {
  try {
    const vertex_ai = new VertexAI({ project: "nownews-ai", location: "asia-northeast1" });
    const model = "gemini-1.5-pro-preview-0409";
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

export async function chatGPT3(prompt, content) {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: content },
        ],
      },
      {
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error(error);
  }
}

export async function chatGPT4(prompt, content) {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4-turbo",
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: content },
        ],
      },
      {
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error(error);
  }
}
