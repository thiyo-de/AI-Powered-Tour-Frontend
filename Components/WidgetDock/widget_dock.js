// ═══════════════════════════════════════════════════════════
//  WIDGET DOCK — Unified Trigger Container
//  GSV Explore · Mute / Unmute
//  Auto-opens with linear slide-in animation on page load
// ═══════════════════════════════════════════════════════════
(function () {

    // ─── Load CSS ─────────────────────────────────────────────
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'Components/WidgetDock/widget_dock.css';
    document.head.appendChild(link);

    // ─── Build Dock Container ─────────────────────────────────
    const dock = document.createElement('div');
    dock.className = 'widget-dock';
    dock.id = 'widget-dock';

    // ── GSV Button ──
    const gsvBtn = document.createElement('button');
    gsvBtn.className = 'widget-dock-btn dock-gsv';
    gsvBtn.setAttribute('aria-label', 'Open Google Street View');
    gsvBtn.setAttribute('data-label', 'Street View');
    gsvBtn.innerHTML = `<i class="fa-solid fa-street-view"></i>`;

    // ── Divider ──
    const divider = document.createElement('div');
    divider.className = 'dock-divider';

    // ── Analytics Button ──
    const analyticsBtn = document.createElement('button');
    analyticsBtn.className = 'widget-dock-btn dock-analytics';
    analyticsBtn.setAttribute('aria-label', 'Open Analytics Dashboard');
    analyticsBtn.setAttribute('data-label', 'Analytics');
    analyticsBtn.setAttribute('data-spatial-action', 'analytics_dock');
    analyticsBtn.innerHTML = `<i class="fa-solid fa-chart-line"></i>`;
    analyticsBtn.addEventListener('click', function () {
        window.open('analytics/index.html', '_blank');
    });

    const divider2 = document.createElement('div');
    divider2.className = 'dock-divider';

    // ── Mute / Unmute Button ──
    const muteBtn = document.createElement('button');
    muteBtn.className = 'widget-dock-btn dock-mute';
    muteBtn.setAttribute('aria-label', 'Toggle Music');
    muteBtn.setAttribute('data-label', 'Music: Off');
    muteBtn.innerHTML = `<i class="fa-solid fa-volume-xmark"></i>`;

    // ── Assemble ──
    dock.appendChild(gsvBtn);
    dock.appendChild(divider);
    dock.appendChild(analyticsBtn);
    dock.appendChild(divider2);
    dock.appendChild(muteBtn);
    document.body.appendChild(dock);

    // ─── Auto-Open ─────────────────────────────────────────────
    // This script is loaded AFTER musicConsentResolved fires (see index.htm),
    // so we can open the dock immediately with a short grace period.
    setTimeout(function () {
        dock.classList.add('dock-open');
    }, 600);

    // ─── GSV Event Dispatcher ─────────────────────────────────
    gsvBtn.addEventListener('click', function () {
        document.dispatchEvent(new CustomEvent('menuItemClick', { detail: { id: 'menu-street-view' } }));
    });

    // ─── Mute / Unmute: Sync on Load ──────────────────────────
    setTimeout(function () {
        if (window.bgAudio && !window.bgAudio.paused) {
            muteBtn.innerHTML = `<i class="fa-solid fa-volume-high"></i>`;
            muteBtn.setAttribute('data-label', 'Music: On');
            muteBtn.classList.add('music-active');
        }
    }, 100);

    // ─── Listen for external state changes ────────────────────
    document.addEventListener('musicStateChanged', function (e) {
        if (e.detail.playing) {
            muteBtn.innerHTML = `<i class="fa-solid fa-volume-high"></i>`;
            muteBtn.setAttribute('data-label', 'Music: On');
            muteBtn.classList.add('music-active');
        } else {
            muteBtn.innerHTML = `<i class="fa-solid fa-volume-xmark"></i>`;
            muteBtn.setAttribute('data-label', 'Music: Off');
            muteBtn.classList.remove('music-active');
        }
    });

    // ─── Click: Mute / Unmute ─────────────────────────────────
    muteBtn.addEventListener('click', function () {
        if (!window.bgAudio) return;

        if (window.bgAudio.paused) {
            window.bgAudio.play().then(function () {
                muteBtn.innerHTML = `<i class="fa-solid fa-volume-high"></i>`;
                muteBtn.setAttribute('data-label', 'Music: On');
                muteBtn.classList.add('music-active');
            }).catch(function (e) {
                console.error('Audio playback failed:', e);
            });
        } else {
            window.bgAudio.pause();
            muteBtn.innerHTML = `<i class="fa-solid fa-volume-xmark"></i>`;
            muteBtn.setAttribute('data-label', 'Music: Off');
            muteBtn.classList.remove('music-active');
        }
    });

})();
