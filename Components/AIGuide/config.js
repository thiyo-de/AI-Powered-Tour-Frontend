// ─── AI Guide Configuration ────────────────────────────────────────────────
// SWITCH ENVIRONMENT: Change the line below to 'production' before deploying.
//   'development' → localhost:3002  (local npm run dev)
//   'production'  → Render hosted backend
// ──────────────────────────────────────────────────────────────────────────
const AI_ENV = 'production';   // ← CHANGE THIS TO SWITCH

const AI_ENDPOINTS = {
    development: {
        API_URL:  'http://localhost:3002',
        API_BASE: 'http://localhost:3002/api',
    },
    production: {
        API_URL:  'https://ai-powered-tour.onrender.com',
        API_BASE: 'https://ai-powered-tour.onrender.com/api',
    }
};

const _ep = AI_ENDPOINTS[AI_ENV] || AI_ENDPOINTS.production;

window.AIGuideConfig = {
    ENV:              AI_ENV,
    API_URL:          _ep.API_URL,
    API_BASE:         _ep.API_BASE,
    SESSION_ID:       'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
    VOICE_ENABLED:    true,
    SUBTITLES_ENABLED: true,

    // ── TTS Mode ───────────────────────────────────────────────────────────
    // 'browser' → Free browser speech synthesis (default, saves Groq quota)
    // 'ai'      → Groq Orpheus HD voice (uses API quota — premium quality)
    TTS_MODE: 'browser'
};

console.log(`[Config] ENV: ${AI_ENV} → ${_ep.API_URL}`);
