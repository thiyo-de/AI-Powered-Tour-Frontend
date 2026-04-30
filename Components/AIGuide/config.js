// ─── AI Guide Configuration ────────────────────────────────────────────────
// SWITCH ENVIRONMENT: Change the line below to 'production' before deploying.
//   'development' → localhost:3002  (local npm run dev)
//   'production'  → Render hosted backend
// ──────────────────────────────────────────────────────────────────────────
const AI_ENV = 'production';   // ← CHANGE THIS TO SWITCH

const AI_ENDPOINTS = {
    development: {
        TTS_API: 'http://localhost:3002/api/tts'
    },
    production: {
        TTS_API: 'https://ai-powered-tour.onrender.com/api/tts'
    }
};

const _ep = AI_ENDPOINTS[AI_ENV] || AI_ENDPOINTS.production;

window.AIGuideConfig = {
    ENV: AI_ENV,
    TTS_API: _ep.TTS_API,
    SESSION_ID: 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
    VOICE_ENABLED: true,
    SUBTITLES_ENABLED: true
};

console.log(`[Config] ENV: ${AI_ENV} → Local Router Active`);
