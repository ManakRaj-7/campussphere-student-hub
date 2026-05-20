# 🎓 CampusSphere

CampusSphere is a modern, full-stack student hub built for university and college campuses. It seamlessly blends AI-assisted learning, real-time campus community features, placement tracking, and wellness tools into a single platform.

## ✨ Core Features

* **AI Academic Copilot:** Deeply integrated AI powered by OpenRouter (GLM-4.5, Llama-3.3, Qwen) acting as your personal study assistant to explain notes, predict questions, and summarize topics.
* **Smart Resume ATS Analyzer:** Automatically parses uploaded PDFs/Docs and scores them against modern ATS systems, giving you tailored recommendations to land interviews.
* **Real-time Campus Community:** Connect with peers, explore student clubs, join campus events, and share knowledge through real-time feeds.
* **Mindfulness & Wellness Dashboard:** Provides actionable wellness tips and AI-recommended strategies to deal with academic burnout.
* **QR Attendance Simulation:** A fully animated, interactive QR code generator for simulated classroom attendance.
* **Placements & Internships Tracker:** Real-time job board and application tracker with integrated AI prep materials.

## 🚀 Tech Stack

* **Frontend:** React, Vite, Tailwind CSS
* **Backend:** Node.js, Express, Mongoose
* **Database:** MongoDB Atlas
* **AI:** Google Generative AI / OpenRouter API
* **File Parsing:** `pdf-parse`, `mammoth` for Word files

## 🛠️ Installation

1. **Clone the repository and install dependencies:**
   ```bash
   npm install       # root
   cd server && npm install  # backend
   ```

2. **Environment Configuration:**
   Create a `.env` file in the `server` folder:
   ```env
   PORT=5001
   MONGO_URI=mongodb+srv://<username>:<password>@cluster...
   JWT_SECRET=your_secret_key
   OPENROUTER_API_KEY=your_openrouter_api_key
   # or
   GEMINI_API_KEY=your_gemini_api_key
   ```

3. **Run the App:**
   ```bash
   # Terminal 1 (Frontend)
   npm run dev

   # Terminal 2 (Backend)
   cd server
   npm run dev
   ```

## 📝 Recent Updates
- Integrated dynamic ESM support for `pdf-parse` v2.4.5 ensuring stable resume parsing.
- Optimized AI fallback models (Prioritizing `z-ai/glm-4.5-air` for ~4s response times).
- Cleaned up redundant Mongoose Schema indexes.
- Improved Markdown formatting in AI responses.
- Added mock data for campus events and clubs when database is empty.
