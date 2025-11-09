import Database from "better-sqlite3";
import fs from "fs";

const DATA_DIR = "data";
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const db = new Database(`${DATA_DIR}/data.db`);

// יצירת טבלה אם לא קיימת
db.prepare(`
  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT,
    sessionId TEXT,
    language TEXT,
    userText TEXT,
    reply TEXT,
    inputAudio TEXT,
    outputAudio TEXT
  )
`).run();

// ✅ פונקציה לשמירת לוג מפורט
export function saveLog({ sessionId, language, userText, reply, inputAudio, outputAudio }) {
  db.prepare(`
    INSERT INTO logs (date, sessionId, language, userText, reply, inputAudio, outputAudio)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    new Date().toISOString(),
    sessionId,
    language,
    userText,
    reply,
    inputAudio,
    outputAudio
  );
}

// ✅ פונקציה לשליפת הלוגים האחרונים
export function getLogs(limit = 50) {
  return db.prepare("SELECT * FROM logs ORDER BY id DESC LIMIT ?").all(limit);
}
