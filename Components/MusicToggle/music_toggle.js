// ═══════════════════════════════════════════════════════════
//  MUSIC TOGGLE — Standalone Glassmorphism Mute / Unmute
//  Fixed bottom-right corner
// ═══════════════════════════════════════════════════════════
(function () {

    // ─── Load CSS ─────────────────────────────────────────────
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'Components/MusicToggle/music_toggle.css';
    document.head.appendChild(link);

    // ─── Build Button ─────────────────────────────────────────
    const btn = document.createElement('button');
    btn.className = 'music-toggle-btn';
    btn.id = 'music-toggle-btn';
    btn.setAttribute('aria-label', 'Toggle Music');
    btn.setAttribute('data-label', 'Music: Off');
    btn.innerHTML = `<i class="fa-solid fa-volume-xmark"></i>`;

    // ─── Sync on Load ─────────────────────────────────────────
    // If music was already playing before this script loaded
    setTimeout(function () {
        if (window.bgAudio && !window.bgAudio.paused) {
            btn.innerHTML = `<i class="fa-solid fa-volume-high"></i>`;
            btn.setAttribute('data-label', 'Music: On');
            btn.classList.add('music-active');
        }
    }, 100);

    // ─── Listen for external state changes ────────────────────
    document.addEventListener('musicStateChanged', function (e) {
        if (e.detail.playing) {
            btn.innerHTML = `<i class="fa-solid fa-volume-high"></i>`;
            btn.setAttribute('data-label', 'Music: On');
            btn.classList.add('music-active');
        } else {
            btn.innerHTML = `<i class="fa-solid fa-volume-xmark"></i>`;
            btn.setAttribute('data-label', 'Music: Off');
            btn.classList.remove('music-active');
        }
    });

    // ─── Click: Mute / Unmute ─────────────────────────────────
    btn.addEventListener('click', function () {
        if (!window.bgAudio) return;

        if (window.bgAudio.paused) {
            window.bgAudio.play().then(function () {
                btn.innerHTML = `<i class="fa-solid fa-volume-high"></i>`;
                btn.setAttribute('data-label', 'Music: On');
                btn.classList.add('music-active');
            }).catch(function (e) {
                console.error('Audio playback failed:', e);
            });
        } else {
            window.bgAudio.pause();
            btn.innerHTML = `<i class="fa-solid fa-volume-xmark"></i>`;
            btn.setAttribute('data-label', 'Music: Off');
            btn.classList.remove('music-active');
        }
    });

    // ─── Inject ───────────────────────────────────────────────
    document.body.appendChild(btn);

})();
