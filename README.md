# 🤖 AI Voice Agent – Dr. Claude Picard

An autonomous **multilingual AI voice assistant** built for the orthopedic clinic of **Dr. Claude Picard**, specializing in **knee and hip treatments**.  
The agent communicates naturally with patients in **Hebrew, English, or French**, identifies intent (booking, rescheduling, or cancellation), and handles appointment logic automatically based on the clinic’s rules and health-fund agreements.

---

## 🩺 Overview

The system provides **a full voice-driven scheduling experience**, simulating a live call center assistant.  
Patients can call the clinic, speak naturally, and the AI will:
- Recognize their speech using Whisper.
- Detect their intent (book, reschedule, cancel).
- Verify their eligibility based on clinic and fund rules.
- Offer available slots.
- Confirm or cancel appointments.
- Respond with lifelike speech using TTS.

---

## 🎙️ Main Features

- 🧠 **Natural conversation** powered by GPT-4o  
- 🗣️ **Speech recognition** using OpenAI Whisper  
- 🔊 **Text-to-speech** output (Hebrew / English / French)  
- 📅 **Automated appointment logic** via Odoro API  
- 💳 **Health-fund billing awareness** (Maccabi, Clalit, Meuhedet, Leumit, private)  
- 🏥 **Built-in clinic scheduling rules** (days, hours, costs, eligibility)  
- 🔒 **Privacy-first**: only minimal data stored (no medical records)  
- 📜 **Logging system** for each voice session  
- 🐳 **Dockerized setup** for quick deployment  

---

## ⚙️ Tech Stack

| Component | Technology |
|------------|-------------|
| Runtime | Node.js (v18+) |
| Framework | Express |
| AI Engine | OpenAI GPT-4o |
| Speech-to-Text | Whisper-1 |
| Text-to-Speech | OpenAI TTS |
| Scheduling | Odoro API |
| Telephony | Asterisk + AGI |
| Deployment | Docker / Docker Compose |
| Docs & Testing | Swagger (OpenAPI) + Postman |

---

# 🧠 Project Structure

```bash
AI-voice-agent-Dr-Claude/
├── src/
│   ├── services/
│   │   ├── appointmentService.js
│   │   ├── logService.js
│   │   ├── odoroService.js
│   │   └── ttsService.js
│   ├── rules/
│   │   └── agentRules.js
│   └── utils/
│       └── languageDetection.js
│
├── asterisk_conf/
│   └── extensions.conf
│
├── docs/
│   ├── openapi.yaml
│   └── postman_collection.json
│
├── public/
│   └── demo.html
│
├── Dockerfile
├── docker-compose.yml
├── server.js
├── package.json
└── README.md


---

# 🧠 How It Works

1. A patient calls the clinic → Asterisk routes the call to the AI agent.  
2. The agent records and transcribes the caller’s voice (Whisper).  
3. The text is analyzed by GPT-4o using `agentRules.js`.  
4. Based on detected intent:  
   - **Book** → fetch slots from Odoro API  
   - **Cancel** → confirm and cancel booking  
   - **Reschedule** → offer alternate times  
5. The reply is converted to speech and played back to the caller.  
6. The full log (user text, AI reply, audio paths) is saved in `/responses` and `/logs`.

---

# 🧭 Odoro API

The server of Odoro scheduling behavior:

| Endpoint | Description |
|-----------|--------------|
| `GET /api/odoro/availability` | Get available slots |
| `POST /api/odoro/appointments/book` | Book an appointment |
| `POST /api/odoro/appointments/{id}/cancel` | Cancel existing appointment |
| `PUT  /api/odoro/appointments/{id}/reschedule | reschedule existing appointment |

Configuration is in `src/services/odoroService.js`.

---

# 🔒 Privacy & Security

- Only minimal personal info is stored: id, name, phone, date of birth, health fund.  
- No diagnoses or medical notes are ever saved.  
- All API keys are stored securely via `.env`.  
- Communication with OpenAI and APIs is HTTPS-only.

---

# 🧾 License

Proprietary – developed for **Dr. Claude Picard’s orthopedic clinic**.  
© 2025 Eliron Picard. All rights reserved.

---

# 🧠 Author

**Eliron Picard**  
Computer Science student • Backend developer • AI integration enthusiast  
📍 Israel  
📧 [GitHub Profile](https://github.com/elir0n)
