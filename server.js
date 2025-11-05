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

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("public"));

ffmpeg.setFfmpegPath(ffmpegPath);
const upload = multer({ dest: "uploads/" });
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const PORT = process.env.PORT || 3000;

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

  try {
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

    const text = transcription.text;
    console.log("🗣️ דיבור → טקסט:", text);

    // 🧠 Detect language with GPT
    const detectLangResp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Detect the language of the following text. Reply only with a two-letter code (he, en, fr)." },
        { role: "user", content: text }
      ]
    });

    let detectedLang = detectLangResp.choices[0].message.content.trim().toLowerCase();
    if (!["he", "en", "fr"].includes(detectedLang)) detectedLang = "he"; // fallback
    console.log(`🌐 שפה שזוהתה: ${detectedLang}`);

    // 🧠 Choose language context
    const systemPrompts = {
      he: "אתה העוזר הקולי של ד\"ר קלוד פיקאר. דבר בעברית בלבד.",
      en: "You are Dr. Claude Picard's voice assistant. Reply only in English.",
      fr: "Vous êtes l'assistant vocal du Dr Claude Picard. Répondez uniquement en français."
    };
    const prompt = systemPrompts[detectedLang];

    const availableAppointments = generateAvailableAppointments();
    const completion = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
        {
        role: "system",
        content:
            "אתה עוזר קולי במרפאת ד\"ר קלוד פיקאר. יש לך גישה לרשימת תורים. השתמש בה כדי להציע תורים מתאימים."
        },
        { role: "user", content: text },
        { role: "assistant", content: JSON.stringify(availableAppointments.slice(0, 10)) }
    ]
    });

    const reply = completion.choices[0].message.content;
    console.log("GPT:", reply);

    // שמירת הלוג
    saveLog(detectedLang, text, reply);

    // 🔊 Text → Speech (voice in same language)
    const ttsResponse = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "alloy",
      input: reply
    });

    const audioBuffer = Buffer.from(await ttsResponse.arrayBuffer());

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
    fs.unlinkSync(inputPath);
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
