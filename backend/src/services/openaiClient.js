const OpenAI = require("openai");

let client = null;

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set. Add it to your .env file.");
  }
  if (!client) {
    // Works with any OpenAI-compatible API (OpenAI, Groq, etc.) — just set
    // OPENAI_BASE_URL to override the default. For Groq, use
    // https://api.groq.com/openai/v1 and a Groq API key/model.
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || undefined,
    });
  }
  return client;
}

module.exports = { getOpenAIClient };
