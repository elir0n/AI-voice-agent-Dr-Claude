import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import { generateAvailableAppointments } from "./src/services/appointmentService.js";
import { saveLog, getLogs } from "./src/services/logService.js";
import { agentPrompt } from "./src/rules/agentRules.js";
import { detectLanguage } from "./src/utils/languageDetection.js";
import { textToSpeech } from "./src/services/ttsService.js";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("public"));

ffmpeg.setFfmpegPath(ffmpegPath);
const upload = multer({ dest: "uploads/" });
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const PORT = process.env.PORT || 3000;

// 🧠 זיכרון זמני לשיחות פעילות
const sessions = new Map();

if (!fs.existsSync("responses")) fs.mkdirSync("responses");

app.get("/appointments", (req, res) => {
  const data = generateAvailableAppointments();
  res.json(data);
});

app.get("/logs", (req, res) => {
  const rows = getLogs();
  res.json(rows);
});

app.post("/voice", upload.single("audio"), async (req, res) => {
  const inputPath = req.file.path;
  const outputPath = `${inputPath}.mp3`;
  const sessionId = req.body.sessionId || "anonymous";

  try {
    // 🎧 Convert to mp3
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .toFormat("mp3")
        .on("end", resolve)
        .on("error", reject)
        .save(outputPath);
    });

    // 🎤 Speech → Text
    const transcription = await client.audio.transcriptions.create({
      file: fs.createReadStream(outputPath),
      model: "whisper-1"
    });

    const text = transcription.text.trim();
    console.log("🗣️ דיבור → טקסט:", text);

    // 🧠 Detect language
    const detectedLang = await detectLanguage(text);

    // ✅ ניהול שיחה לפי session
    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, [
        { role: "system", content: agentPrompt },
        { role: "assistant", content: "שלום, אני העוזר הקולי של ד\"ר קלוד פיקאר. איך אפשר לעזור?" }
      ]);
    }

    // מוסיפים את הודעת המשתמש לשיחה
    const conversation = sessions.get(sessionId);
    conversation.push({ role: "user", content: text });

    // שולחים ל-GPT את כל ההיסטוריה
    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: conversation,
    });

    const reply = completion.choices[0].message.content.trim();
    console.log("🤖 GPT:", reply);

    // מוסיפים את תגובת הסוכן להיסטוריה
    conversation.push({ role: "assistant", content: reply });

    // 💾 Save log
    saveLog(detectedLang, text, reply);

    // 🔊 Text → Speech
    const audioBuffer = await textToSpeech(reply, outputPath);

    // 🕒 Save response locally
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const responseAudioPath = `responses/response_${timestamp}.mp3`;
    const responseTextPath = `responses/response_${timestamp}.txt`;

    fs.writeFileSync(responseAudioPath, audioBuffer);
    fs.writeFileSync(
      responseTextPath,
      `🕓 ${new Date().toLocaleString("he-IL")}\n🌐 Language: ${detectedLang}\n🎤 User: ${text}\n🤖 GPT: ${reply}\n-------------------------------------\n`
    );

    res.setHeader("Content-Type", "audio/mpeg");
    res.send(audioBuffer);

  } catch (error) {
    console.error(error);
    res.status(500).send("Error processing voice request");
  } finally {
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
