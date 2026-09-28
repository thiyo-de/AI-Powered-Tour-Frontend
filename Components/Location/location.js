(function () {
    // Thiagarajar College Coordinates
    const SCHOOL_LAT = 9.912987303523334;
    const SCHOOL_LNG = 78.14750627527253;
    const SCHOOL_NAME = "Thiagarajar College";
    const SCHOOL_ADDRESS = "Madurai";

    const style = document.createElement('style');
    style.textContent = `
        /* ═════════════════════════════════════════════
           LOCATION COMPONENT — Premium Navy Theme
           Get Directions + Live Map
           ═════════════════════════════════════════════ */

        #location-backdrop {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(30, 58, 95, 0.4);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            z-index: 100001;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.35s ease;
        }
        #location-backdrop.show {
            opacity: 1;
            pointer-events: auto;
        }

        .location-modal {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.96);
            z-index: 100002;
            width: 420px;
            max-width: 92vw;
            max-height: 90vh;
            background: #FFFFFF;
            border-radius: 24px;
            box-shadow:
                0 24px 60px rgba(30, 58, 95, 0.25),
                0 0 0 1px rgba(47, 94, 142, 0.05);
            opacity: 0;
            transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            font-family: 'Satoshi', sans-serif;
        }

        #location-container {
            display: none !important;
        }
        #location-container.show {
            display: flex !important;
        }
        #location-container.show .location-modal {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }

        /* Header */
        .loc-header {
            padding: 20px 24px 16px;
            background: linear-gradient(135deg, #2F5E8E 0%, #1E3A5F 100%);
            position: relative;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-shrink: 0;
        }
        .loc-header::after {
            content: '';
            position: absolute;
            bottom: 0; left: 0; right: 0;
            height: 3px;
            background: linear-gradient(90deg, #96C0E6, #2E8B57, #F47C20);
        }
        .loc-header-content {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .loc-icon-box {
            width: 40px; height: 40px;
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #FFF;
            font-size: 18px;
        }
        .loc-header-text {
            display: flex;
            flex-direction: column;
        }
        .loc-title {
            margin: 0;
            font-size: 18px;
            font-weight: 800;
            color: #FFFFFF;
        }
        .loc-subtitle {
            margin: 2px 0 0 0;
            font-size: 12px;
            color: rgba(255, 255, 255, 0.6);
            font-weight: 500;
        }
        .loc-close {
            width: 32px; height: 32px;
            border-radius: 50%;
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.15);
            color: rgba(255,255,255,0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
            padding: 0;
        }
        .loc-close:hover {
            background: rgba(255,255,255,0.2);
            color: #fff;
            transform: rotate(90deg);
        }

        /* Map Container */
        .loc-map-container {
            width: 100%;
            height: 220px;
            position: relative;
            overflow: hidden;
            flex-shrink: 0;
        }
        .loc-map-container iframe {
            width: 100%;
            height: 100%;
            border: none;
        }

        /* Body */
        .loc-body {
            padding: 20px 24px;
            background: #F8FAFC;
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        /* School Info Card */
        .loc-info-card {
            background: #FFFFFF;
            border: 1px solid #F1F5F9;
            border-radius: 16px;
            padding: 16px;
            display: flex;
            align-items: flex-start;
            gap: 14px;
        }
        .loc-info-icon {
            width: 44px; height: 44px;
            border-radius: 12px;
            background: #EFF6FF;
            color: #2F5E8E;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            flex-shrink: 0;
        }
        .loc-info-text h4 {
            margin: 0 0 4px 0;
            font-size: 15px;
            font-weight: 700;
            color: #0F172A;
        }
        .loc-info-text p {
            margin: 0;
            font-size: 13px;
            color: #64748B;
            line-height: 1.4;
        }

        /* User Location Status */
        .loc-user-status {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px 16px;
            background: #FFFFFF;
            border: 1px solid #F1F5F9;
            border-radius: 12px;
            font-size: 13px;
            color: #64748B;
            font-weight: 500;
        }
        .loc-user-status i {
            color: #94A3B8;
            font-size: 14px;
        }
        .loc-user-status.found {
            border-color: #BBF7D0;
            background: #F0FDF4;
            color: #166534;
        }
        .loc-user-status.found i {
            color: #2E8B57;
        }
        .loc-user-status.error {
            border-color: #FECACA;
            background: #FEF2F2;
            color: #991B1B;
        }
        .loc-user-status.error i {
            color: #DC2626;
        }

        /* Buttons */
        .loc-actions {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .loc-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            padding: 14px 20px;
            border-radius: 14px;
            border: none;
            font-family: 'Satoshi', sans-serif;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            text-decoration: none;
        }
        .loc-btn:active {
            transform: scale(0.97);
        }
        .loc-btn-primary {
            background: linear-gradient(135deg, #2F5E8E, #1E3A5F);
            color: #FFFFFF;
            box-shadow: 0 4px 14px rgba(47, 94, 142, 0.3);
        }
        .loc-btn-primary:hover {
            box-shadow: 0 6px 20px rgba(47, 94, 142, 0.4);
            transform: translateY(-1px);
        }
        .loc-btn-secondary {
            background: #FFFFFF;
            color: #2F5E8E;
            border: 2px solid #E2E8F0;
        }
        .loc-btn-secondary:hover {
            border-color: #96C0E6;
            background: #EFF6FF;
        }

        /* Google Maps colored btn */
        .loc-btn-gmaps {
            background: linear-gradient(135deg, #2E8B57, #246B44);
            color: #FFFFFF;
            box-shadow: 0 4px 14px rgba(46, 139, 87, 0.3);
        }
        .loc-btn-gmaps:hover {
            box-shadow: 0 6px 20px rgba(46, 139, 87, 0.4);
            transform: translateY(-1px);
        }

        /* Footer */
        .loc-footer {
            padding: 12px 24px;
            border-top: 1px solid #F0F4F8;
            background: #FFFFFF;
            display: flex;
            align-items: center;
            gap: 8px;
            flex-shrink: 0;
        }
        .loc-footer-dot {
            width: 6px; height: 6px;
            border-radius: 50%;
            background: #2E8B57;
            box-shadow: 0 0 6px rgba(46, 139, 87, 0.4);
            animation: locPulse 2s infinite;
        }
        @keyframes locPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .loc-footer-text {
            font-size: 11px;
            color: #64748B;
            font-weight: 600;
        }

        /* Distance Badge */
        .loc-distance-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            background: #EFF6FF;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 700;
            color: #2F5E8E;
        }

        /* Loading spinner */
        .loc-spinner {
            width: 16px; height: 16px;
            border: 2px solid rgba(148, 163, 184, 0.3);
            border-top-color: #64748B;
            border-radius: 50%;
            animation: locSpin 0.8s linear infinite;
        }
        @keyframes locSpin { to { transform: rotate(360deg); } }

        /* Responsive */
        @media (max-width: 480px) {
            .location-modal {
                width: 100%;
                height: 100%;
                max-width: 100vw;
                max-height: 100vh;
                top: 0; left: 0;
                transform: translate(0, 100%);
                border-radius: 0;
            }
            #location-container.show .location-modal {
                transform: translate(0, 0);
            }
            .loc-map-container {
                height: 200px;
            }
        }
    `;
    document.head.appendChild(style);

    // ── DOM ──
    const container = document.createElement('div');
    container.id = 'location-container';

    const backdrop = document.createElement('div');
    backdrop.id = 'location-backdrop';
    container.appendChild(backdrop);

    const modal = document.createElement('div');
    modal.className = 'location-modal';

    const mapSrc = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3000!2d${SCHOOL_LNG}!3d${SCHOOL_LAT}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTDCsDE3JzQwLjIiTiA3OMKwNDUnNTIuMCJF!5e0!3m2!1sen!2sin!4v1!5m2!1sen!2sin&q=${SCHOOL_LAT},${SCHOOL_LNG}&z=16`;

    modal.innerHTML = `
        <div class="loc-header">
            <div class="loc-header-content">
                <div class="loc-icon-box"><i class="fa-solid fa-location-dot"></i></div>
                <div class="loc-header-text">
                    <h3 class="loc-title">Get Directions</h3>
                    <p class="loc-subtitle">${SCHOOL_NAME}</p>
                </div>
            </div>
            <button class="loc-close" id="loc-close-btn" aria-label="Close">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
        </div>

        <div class="loc-map-container">
            <iframe
                src="https://maps.google.com/maps?q=${SCHOOL_LAT},${SCHOOL_LNG}&z=16&output=embed"
                allowfullscreen loading="lazy"
                referrerpolicy="no-referrer-when-downgrade">
            </iframe>
        </div>

        <div class="loc-body">
            <div class="loc-info-card">
                <div class="loc-info-icon"><i class="fa-solid fa-school"></i></div>
                <div class="loc-info-text">
                    <h4>${SCHOOL_NAME}</h4>
                    <p>${SCHOOL_ADDRESS}</p>
                </div>
            </div>

            <div class="loc-user-status" id="loc-user-status">
                <div class="loc-spinner"></div>
                <span>Detecting your location…</span>
            </div>

            <div class="loc-actions">
                <a id="loc-btn-directions" href="#" target="_blank" class="loc-btn loc-btn-gmaps">
                    <i class="fa-solid fa-diamond-turn-right"></i>
                    Get Directions
                </a>
                <a href="https://www.google.com/maps/place/${SCHOOL_LAT},${SCHOOL_LNG}" target="_blank" class="loc-btn loc-btn-secondary">
                    <i class="fa-solid fa-map"></i>
                    Open in Google Maps
                </a>
            </div>
        </div>

        <div class="loc-footer">
            <div class="loc-footer-dot"></div>
            <span class="loc-footer-text">Powered by Google Maps</span>
        </div>
    `;

    container.appendChild(modal);
    document.body.appendChild(container);

    // ── User Location Logic ──
    let userLat = null;
    let userLng = null;

    function updateDirectionsLink() {
        const btn = document.getElementById('loc-btn-directions');
        let url = `https://www.google.com/maps/dir/?api=1&destination=${SCHOOL_LAT},${SCHOOL_LNG}&travelmode=driving`;
        if (userLat && userLng) {
            url += `&origin=${userLat},${userLng}`;
        }
        btn.href = url;
    }

    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    function getUserLocation() {
        const statusEl = document.getElementById('loc-user-status');

        if (!navigator.geolocation) {
            statusEl.className = 'loc-user-status error';
            statusEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i><span>Geolocation not supported by your browser</span>';
            updateDirectionsLink();
            return;
        }

        navigator.geolocation.getCurrentPosition(
            function (pos) {
                userLat = pos.coords.latitude;
                userLng = pos.coords.longitude;

                const dist = calculateDistance(userLat, userLng, SCHOOL_LAT, SCHOOL_LNG);
                let distText = dist < 1
                    ? (dist * 1000).toFixed(0) + ' m away'
                    : dist.toFixed(1) + ' km away';

                statusEl.className = 'loc-user-status found';
                statusEl.innerHTML = `
                    <i class="fa-solid fa-location-crosshairs"></i>
                    <span>Your location detected</span>
                    <span class="loc-distance-badge">
                        <i class="fa-solid fa-route"></i>
                        ${distText}
                    </span>
                `;

                updateDirectionsLink();
            },
            function (err) {
                let msg = 'Unable to get your location';
                if (err.code === 1) msg = 'Location access denied. Please allow location access.';
                else if (err.code === 2) msg = 'Location unavailable';
                else if (err.code === 3) msg = 'Location request timed out';

                statusEl.className = 'loc-user-status error';
                statusEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i><span>${msg}</span>`;
                updateDirectionsLink();
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
    }

    // ── Toggle ──
    window.toggleLocation = function () {
        const isOpen = container.classList.contains('show');
        if (!isOpen) {
            container.classList.add('show');
            backdrop.classList.add('show');
            getUserLocation();
        } else {
            container.classList.remove('show');
            backdrop.classList.remove('show');
            document.dispatchEvent(new CustomEvent('menuItemDeactivate', { detail: { id: 'menu-location' } }));
        }
    };

    // Close handlers
    document.getElementById('loc-close-btn').addEventListener('click', function () { window.toggleLocation(); });
    backdrop.addEventListener('click', function () { window.toggleLocation(); });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && container.classList.contains('show')) {
            window.toggleLocation();
        }
    });

    // Listen for menu click
    document.addEventListener('menuItemClick', function (e) {
        if (e.detail && e.detail.id === 'menu-location') {
            window.toggleLocation();
        }
    });

    // Set default directions link
    updateDirectionsLink();
})();
