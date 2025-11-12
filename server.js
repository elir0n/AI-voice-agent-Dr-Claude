import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import { v4 as uuidv4 } from "uuid";
import { generateAvailableAppointments } from "./src/services/appointmentService.js";
import { saveLog, getLogs } from "./src/services/logService.js";
import { agentPrompt } from "./src/rules/agentPrompt.js";
import { detectLanguage } from "./src/utils/languageDetection.js";
import { textToSpeech } from "./src/services/ttsService.js";
import { OdoroService } from "./src/services/odoroService.js"; // ✅

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("public"));

ffmpeg.setFfmpegPath(ffmpegPath);

const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";
const RESPONSES_DIR = process.env.RESPONSES_DIR || "responses";
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);
if (!fs.existsSync(RESPONSES_DIR)) fs.mkdirSync(RESPONSES_DIR);

const upload = multer({ dest: `${UPLOAD_DIR}/` });
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const PORT = process.env.PORT || 3000;

// 🧠 ניהול שיחות פעילות
const sessions = new Map();

// 🧹 ניקוי sessions לא פעילים כל 3 דקות
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    const last = session.lastActive || now;
    if (now - last > 3 * 60 * 1000) {
      sessions.delete(id);
      console.log(`🧹 מחקתי session לא פעיל: ${id}`);
    }
  }
}, 60 * 1000);

// 📅 הצגת תורים לדוגמה
app.get("/appointments", (req, res) => res.json(generateAvailableAppointments()));
// 📜 הצגת לוגים
app.get("/logs", (req, res) => res.json(getLogs()));

// 🧭 זיהוי intent בסיסי
function detectIntent(text) {
  const lower = text.toLowerCase();
  if (lower.includes("לקבוע") || lower.includes("תור חדש") || lower.includes("book"))
    return "book_appointment";
  if (lower.includes("לבטל") || lower.includes("לא להגיע") || lower.includes("cancel"))
    return "cancel_appointment";
  if (lower.includes("לשנות") || lower.includes("להקדים") || lower.includes("reschedule"))
    return "reschedule_appointment";
  return "general";
}

// 🎤 נקודת הכניסה הראשית לשיחות קוליות
app.post("/voice", upload.single("audio"), async (req, res) => {
  const inputPath = req.file.path;
  const outputPath = `${inputPath}.mp3`;
  const sessionId = req.body.sessionId || uuidv4();

  try {
    // 🎧 המרה ל-MP3
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .toFormat("mp3")
        .on("end", resolve)
        .on("error", reject)
        .save(outputPath);
    });

    // 🗣️ Speech → Text
    const transcription = await client.audio.transcriptions.create({
      file: fs.createReadStream(outputPath),
      model: "whisper-1",
    });
    const text = transcription.text.trim();
    console.log(`🎙️ [${sessionId}] משתמש אמר: ${text}`);

    // 🌍 זיהוי שפה
    const detectedLang = await detectLanguage(text);

    // 🧠 ניהול שיחה
    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, {
        messages: [
          { role: "system", content: agentPrompt },
          { role: "assistant", content: "שלום, אני העוזר הקולי של ד\"ר קלוד פיקאר. איך אפשר לעזור?" },
        ],
        lastActive: Date.now(),
      });
    }

    const session = sessions.get(sessionId);
    session.messages.push({ role: "user", content: text });
    session.lastActive = Date.now();

    // 🧭 זיהוי intent
    const intent = detectIntent(text);
    console.log(`🧠 Intent detected: ${intent}`);

    // 🧩 פעולות לפי intent
    if (intent === "book_appointment") {
      const slots = await OdoroService.getAvailability();
      const free = slots.slots.filter(s => s.status === "free").slice(0, 3);
      const slotList = free.map(s => s.start.slice(11, 16)).join(", ");
      const reply = `יש תורים פנויים ביום ${slots.date} בשעות ${slotList}. באיזו שעה נוח לך?`;

      const audioBuffer = await textToSpeech(reply);
      saveLog({ sessionId, language: detectedLang, userText: text, reply, inputAudio: inputPath });
      res.setHeader("Content-Type", "audio/mpeg");
      return res.send(audioBuffer);
    }

    if (intent === "cancel_appointment") {
      const reply = "אוקיי, אני מבטל את התור שלך. האם תרצה לקבוע תור חדש במקום?";
      const audioBuffer = await textToSpeech(reply);
      saveLog({ sessionId, language: detectedLang, userText: text, reply, inputAudio: inputPath });
      res.setHeader("Content-Type", "audio/mpeg");
      return res.send(audioBuffer);
    }

    if (intent === "reschedule_appointment") {
      const slots = await OdoroService.getAvailability();
      const alt = slots.slots.filter(s => s.status === "free").slice(0, 2);
      const altList = alt.map(s => s.start.slice(11, 16)).join(", ");
      const reply = `אין בעיה. יש תורים חלופיים בשעות ${altList}. איזה מהם נוח לך יותר?`;

      const audioBuffer = await textToSpeech(reply);
      saveLog({ sessionId, language: detectedLang, userText: text, reply, inputAudio: inputPath });
      res.setHeader("Content-Type", "audio/mpeg");
      return res.send(audioBuffer);
    }

    // 🤖 אין intent ברור → נשלח ל-GPT
    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: session.messages,
    });
    const reply = completion.choices[0].message.content.trim();
    console.log(`🤖 [${sessionId}] GPT: ${reply}`);
    session.messages.push({ role: "assistant", content: reply });

    // 💾 שמירת לוגים
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const responseAudioPath = `${RESPONSES_DIR}/response_${timestamp}.mp3`;
    const responseTextPath = `${RESPONSES_DIR}/response_${timestamp}.txt`;
    const audioBuffer = await textToSpeech(reply, outputPath);

    fs.writeFileSync(responseAudioPath, audioBuffer);
    fs.writeFileSync(
      responseTextPath,
      `🕓 ${new Date().toLocaleString("he-IL")}\n🌐 שפה: ${detectedLang}\n🎤 משתמש: ${text}\n🤖 GPT: ${reply}\n-------------------------------------\n`,
      { encoding: "utf-8" }
    );
    saveLog({ sessionId, language: detectedLang, userText: text, reply, inputAudio: inputPath, outputAudio: responseAudioPath });

    res.setHeader("Content-Type", "audio/mpeg");
    res.send(audioBuffer);

  } catch (error) {
    console.error("❌ Voice processing error:", error);
    const fallbackMessage = "מצטער, קרתה שגיאה בעיבוד הבקשה.";
    const fallbackAudio = await textToSpeech(fallbackMessage);
    res.setHeader("Content-Type", "audio/mpeg");
    res.status(500).send(fallbackAudio);
  } finally {
    try {
      [inputPath, outputPath].forEach(p => fs.existsSync(p) && fs.unlinkSync(p));
    } catch (e) {
      console.warn("⚠️ cleanup error", e);
    }
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
