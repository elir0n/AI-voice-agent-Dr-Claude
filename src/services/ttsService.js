import fs from "fs";
import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function textToSpeech(reply, filePath) {
  const ttsResponse = await client.audio.speech.create({
    model: "gpt-4o-mini-tts",
    voice: "alloy",
    input: reply
  });
  const buffer = Buffer.from(await ttsResponse.arrayBuffer());
  fs.writeFileSync(filePath, buffer);
  return buffer;
}
