# 🤖 AI Voice Agent – Dr. Claude Picard
An autonomous multilingual voice assistant that manages appointments for Dr. Claude Picard, an orthopedic specialist for knees and hips. The agent can communicate in Hebrew, English, and French, understand patient needs, and automatically book, reschedule, or cancel appointments according to the clinic’s rules and health-fund policies. This project creates a complete voice-based scheduling system using Node.js, Express, and the OpenAI API. The agent interacts naturally with patients, records only minimal information (name, phone, date of birth, and health fund), and supports both the Maccabi clinic at Laniado Hospital and Dr. Picard’s private clinic.

## 🩺 Main Features
🎙️ Voice interaction in Hebrew / English / French  
📅 Automated scheduling via Google Calendar or Odoro API  
🧠 Smart triage by visit reason (knee pain, hip pain, surgery referral)  
💳 Payment awareness per health fund or private insurance  
🏥 Built-in clinic logic with opening hours, costs, and allowed patients  
🔒 Privacy-first design (no sensitive medical history stored)

## ⚙️ Tech Stack
Runtime – Node.js (v18+)  
Framework – Express  
AI Model – OpenAI GPT-4o / GPT-5  
Speech Recognition – Whisper / Deepgram  
Text-to-Speech – OpenAI TTS / ElevenLabs  
Scheduling – Odoro API / Google Calendar  
Deployment – Render / Vercel  
Version Control – Git + GitHub

## 🧩 Installation
Clone the repository and install dependencies:  
`git clone https://github.com/<your-username>/ai-voice-agent-dr-picard.git`  
`cd ai-voice-agent-dr-picard`  
`npm install`  

Create a file named `.env` in the project root and insert:  
`OPENAI_API_KEY=your_openai_api_key_here`  
`PORT=3000`  

Make sure `.env` and `node_modules/` are listed in `.gitignore`.

## 🚀 Running the Server
Run `npm start`  
Open `http://localhost:3000` and confirm you see the message “AI Voice Agent Server is running 🚀”.

## 💬 Testing the Chat Endpoint
To test locally, send a POST request to `/chat`.  
macOS / Linux:  
`curl -X POST http://localhost:3000/chat -H "Content-Type: application/json" -d '{"message": "Hello! Who are you?"}'`  
Windows PowerShell:  
`curl -X POST http://localhost:3000/chat -H "Content-Type: application/json" -d "{\"message\": \"Hello! Who are you?\"}"`  
You should receive:  
`{"reply":"Hello! I'm Dr. Claude Picard's AI assistant. How can I help you today?"}`

## 🧠 Project Structure
ai-voice-agent-dr-picard/  
├── src/ – all source code  
│   ├── server.js – main Express server  
│   ├── services/openai.js – GPT and Whisper logic  
│   ├── services/speech.js – text-to-speech / speech-to-text  
│   ├── services/appointmentService.js – scheduling logic  
│   ├── rules/picardClinic.js – clinic rules (hours, prices, health funds)  
│   ├── routes/api.js – HTTP endpoints  
│   └── utils/logger.js – logging  
├── public/index.html – simple voice demo interface  
├── logs/conversations.txt – saved transcripts  
├── .env – environment variables (ignored)  
├── .gitignore  
├── package.json  
└── README.md

## 🧭 System Behavior
When a patient speaks to the agent, the voice is captured in real time and transcribed using Whisper or Deepgram. The GPT model interprets intent and context based on Dr. Picard’s clinic rules: knee or hip pain or surgery referrals receive normal scheduling; if the patient mentions back pain, the agent politely explains that Dr. Picard is not a spine specialist and advises seeing an orthopedist who treats backs. The assistant then verifies health-fund eligibility.  
Maccabi members → Laniado Hospital clinic on Sunday or Thursday 14:00–17:00.  
Other funds → Private clinic (Wednesday 08:30–12:15, or Monday 15:00–17:00 bi-weekly).  
Fees: Clalit 150 ₪, Meuhedet 250 ₪, Leumit 800 ₪, Private/Insurance 1200 ₪ (these are prioritized).  
Every appointment is 15 minutes. Payments accepted: cash, Bit, or PayBox. Patients are reminded to bring imaging disks.  
The agent calls the scheduling API (Odoro or Google Calendar), books the slot, summarizes details, and reads them aloud to the caller using TTS in their language.

## 🔒 Privacy and Security
All communication uses HTTPS and environment variables for keys. Only minimal identifiers (name, phone, DOB, health fund) are kept. No medical records or diagnoses are stored. Payments are handled externally at the clinic.

## 🔧 Configuration Notes
The assistant supports three languages automatically. Default is Hebrew but it switches based on caller speech. Each clinic and fund has its own logic for availability and fees. Developers can extend rules inside `rules/picardClinic.js` and connect to the Odoro API via REST endpoints.

## 📈 Future Development
– Web dashboard for clinic staff  
– SMS and email confirmations  
– Advanced sentiment and emotion analysis  
– Real-time streaming conversations with GPT-5 Realtime  
– Analytics for call duration and conversion rates  

## 🧾 License
This project is proprietary and developed for Dr. Claude Picard’s clinic.  
© 2025 Eliron Picard – All rights reserved.
