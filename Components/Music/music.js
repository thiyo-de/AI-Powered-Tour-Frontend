(function () {
    // ─── Load CSS ─────────────────────────────────────────────
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'Components/Music/music.css';
    document.head.appendChild(link);

    // ─── Audio Setup ──────────────────────────────────────────
    const audio = new Audio('Components/Music/chillout-7-1350.mp3');
    audio.loop = true;
    window.bgAudio = audio; // Expose globally for WidgetDock toggle

    // If handled by Loading Screen gateway, avoid redundant modal
    if (window.__musicConsentHandled || (document.getElementById('loading-screen') && !document.getElementById('loading-screen').classList.contains('fade-out'))) {
        if (window.__musicPlayRequested) {
            audio.play().catch(console.error);
            document.dispatchEvent(new CustomEvent('musicStateChanged', { detail: { playing: true } }));
        }
        return;
    }

    // ─── Build Consent Popup ──────────────────────────────────
    const overlay = document.createElement('div');
    overlay.className = 'music-consent-overlay';
    overlay.id = 'music-consent-overlay';

    const modal = document.createElement('div');
    modal.className = 'music-consent-modal';

    modal.innerHTML = `
        <div class="music-consent-icon">
          <i class="fa-solid fa-headphones"></i>
        </div>
        <h3 class="music-consent-title">Play Background Music?</h3>
        <p class="music-consent-text">Would you like to explore the virtual tour with some peaceful background music?</p>
        <div class="music-consent-actions">
            <button class="music-consent-btn btn-no" id="music-consent-no">No, Thanks</button>
            <button class="music-consent-btn btn-yes" id="music-consent-yes">Yes, Play</button>
        </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // ─── Event Listeners ──────────────────────────────────────
    document.getElementById('music-consent-yes').addEventListener('click', () => {
        audio.play().catch(console.error);
        closeConsentModal();
        // Dispatch event that audio is playing (WidgetDock can use this to set initial state)
        document.dispatchEvent(new CustomEvent('musicStateChanged', { detail: { playing: true } }));
    });

    document.getElementById('music-consent-no').addEventListener('click', () => {
        closeConsentModal();
        document.dispatchEvent(new CustomEvent('musicStateChanged', { detail: { playing: false } }));
    });

    function closeConsentModal() {
        overlay.classList.add('closing');
        setTimeout(() => {
            overlay.remove();
            // Dispatch event for WidgetDock auto-open logic
            document.dispatchEvent(new CustomEvent('musicConsentResolved'));
        }, 300);
    }

})();
