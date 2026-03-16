require("dotenv").config();
const { OpenAI } = require("openai");

async function runTest() {
  try {
    const client = new OpenAI({
      baseURL: "https://router.huggingface.co/v1",
      apiKey: process.env.HF_KEY,
    });

    const prompt = "Write a short mysterious true crime story about a disappearance at night.";

    const chatCompletion = await client.chat.completions.create({
      model: "Qwen/Qwen2.5-7B-Instruct",
      messages: [{ role: "user", content: prompt }],
    });

    console.log("Generated Text:\n");
    console.log(chatCompletion.choices[0].message.content);

  } catch (err) {
    console.error("HF Text Error:", err.message);
  }
}

runTest();