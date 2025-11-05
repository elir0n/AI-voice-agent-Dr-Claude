import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config(); 
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function detectLanguage(text) {
  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Detect the language of the text. Reply only 'he', 'en' or 'fr'." },
      { role: "user", content: text }
    ]
  });
  const lang = res.choices[0].message.content.trim().toLowerCase();
  return ["he", "en", "fr"].includes(lang) ? lang : "he";
}
