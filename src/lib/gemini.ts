import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("Please define the GEMINI_API_KEY environment variable in .env.local");
}

const genAI = new GoogleGenerativeAI(apiKey);

export const geminiFlashLite = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-lite",
  generationConfig: {
    responseMimeType: "application/json",
    temperature: 0.5,
  },
});

export const geminiFlash = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
    temperature: 0.7,
  },
});
