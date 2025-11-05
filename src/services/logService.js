import Database from "better-sqlite3";
import fs from "fs";

// נוודא שהתיקייה data קיימת
if (!fs.existsSync("data")) fs.mkdirSync("data");

// פתיחת/יצירת בסיס הנתונים
const db = new Database("data/data.db");

// יצירת טבלה אם לא קיימת
db.prepare(`
  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT,
    language TEXT,
    userText TEXT,
    reply TEXT
  )
`).run();

// פונקציה לשמירת רשומה
export function saveLog(lang, userText, reply) {
  db.prepare(`
    INSERT INTO logs (date, language, userText, reply)
    VALUES (?, ?, ?, ?)
  `).run(new Date().toISOString(), lang, userText, reply);
}

// פונקציה לקריאת הלוגים (למשל להצגה ב-admin)
export function getLogs(limit = 50) {
  return db.prepare("SELECT * FROM logs ORDER BY id DESC LIMIT ?").all(limit);
}
