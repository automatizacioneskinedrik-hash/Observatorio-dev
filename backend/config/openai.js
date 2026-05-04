import OpenAI from "openai";

export const getOpenAIClient = (apiKey = process.env.OPENAI_API_KEY) => {
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
};
