# CampusSphere

CampusSphere is a modern, full-stack student hub built for university and college campuses. It unifies AI-assisted study help, community collaboration, placement preparation, and wellness tracking in one secure web app.

## Core Features

- **AI Academic Copilot:** Single backend AI integration via OpenRouter with Gemini 3 Flash as the primary model.
- **Study Notes & Summaries:** Auto-summarize notes, generate flashcards, and ask AI questions about lectures.
- **Course Management:** Add, update, or remove courses from the campus catalog once signed in.
- **Wellness Tracking:** Log mood, focus, and subject goals, with AI-powered wellbeing suggestions.
- **Placement Preparation:** Generate interview questions, tips, and study topics using AI.
- **Campus Community:** Student clubs, events, posts, and peer matching.
- **Profile & Progress:** Track attendance streaks, course progress, and study momentum.
- **Profile Avatars:** Choose from 10 default generated avatars or upload your own.

## AI Architecture

CampusSphere now uses a centralized OpenRouter backend integration. The AI flow is:

1. Frontend calls the backend `/api/v1/ai` or wellness endpoints.
2. Backend reads `OPENROUTER_API_KEY` and sends requests to OpenRouter.
3. Primary model: `google/gemini-3-flash-preview`.
4. Fallback chain automatically tries additional fast free models if the primary fails.
5. The frontend never receives secret API keys.

### Primary & Fallback Models

* Primary: `google/gemini-3-flash-preview`
* Fallbacks:
  * `google/gemini-3.1-flash-lite-preview`
  * `google/gemini-3.1-flash-lite`
  * `google/gemini-2.5-flash-lite`
  * `deepseek/deepseek-chat-v3-0324:free`
  * `meta-llama/llama-3.3-70b-instruct:free`
  * `mistralai/mistral-small-24b-instruct-2501:free`
  * `mistralai/mistral-small-3.2-24b-instruct`

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Node.js, Express
- **Database:** MongoDB / Mongoose
- **Real-time:** Socket.IO
- **AI Provider:** OpenRouter

## Setup

### 1. Install dependencies

```bash
npm install
cd server && npm install
```

### 2. Configure environment variables

Create a `server/.env` file or copy `server/.env.example`:

```env
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/campussphere?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
CLIENT_URL=http://localhost:5173
API_VERSION=v1
OPENROUTER_API_KEY=sk-or-your_openrouter_api_key
OPENROUTER_MODEL=google/gemini-3-flash-preview
OPENROUTER_FALLBACK_MODELS=google/gemini-3-flash-preview,google/gemini-3.1-flash-lite-preview,google/gemini-3.1-flash-lite,google/gemini-2.5-flash-lite,deepseek/deepseek-chat-v3-0324:free,meta-llama/llama-3.3-70b-instruct:free,mistralai/mistral-small-24b-instruct-2501:free,mistralai/mistral-small-3.2-24b-instruct
OPENROUTER_HTTP_REFERER=http://localhost:5173
OPENROUTER_APP_TITLE=CampusSphere
AI_STREAMING=true
AI_REQUEST_TIMEOUT_MS=20000
AI_MAX_TOKENS=700
AI_TEMPERATURE=0.35
```

### 3. Run the app

```bash
# In one terminal (frontend)
npm run dev

# In another terminal (backend)
cd server
npm run dev
```

## 📌 Features Updated

* Replaced all old Gemini / Gemini 2.5 Flash labels with Gemini 3 Flash.
* Implemented OpenRouter backend integration with stable request headers and payload structure.
* Added fallback chaining across multiple free OpenRouter models.
* Added friendly error handling for invalid API keys, rate limits, timeouts, model unavailability, network failures, and malformed responses.
* Fixed wellness history loading and subject tracking.
* Ensured new user streaks default to `0` instead of a random placeholder.

## 🔧 Troubleshooting

### AI returns an error

* Confirm `OPENROUTER_API_KEY` is valid in `server/.env`.
* Confirm the backend is running from the `server` folder.
* Check the backend logs for OpenRouter status codes (`401`, `403`, `429`, `500`).
* If the primary model is unavailable, the app will automatically try fallback models.

### Wellness page does not load

* Ensure you are authenticated and the backend returns `/api/v1/wellness/history`.
* The wellness page now expects data in `data.data.logs`.
* Add a subject in the wellness form to track your focus area.

### UI labels still say Gemini

* The entire app has been updated to use `Gemini 3 Flash` labels.

## 🧪 Validation

* Normal AI chat should use `google/gemini-3-flash-preview`.
* Fallback models are activated automatically on failure.
* Invalid API keys stop retries and return a clear message.
* Wellness history logs now render correctly for every user.
* New users start with `0` streak.

## 📁 Notes

* The backend uses OpenRouter endpoint `https://openrouter.ai/api/v1/chat/completions`.
* The frontend does not expose any AI keys.
* AI request timeout is configured by `AI_REQUEST_TIMEOUT_MS`.
