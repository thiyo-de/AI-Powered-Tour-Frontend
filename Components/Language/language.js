(function () {
    // ═══════════════════════════════════════════════════════════
    //  LANGUAGE SELECTOR — Premium Navy Theme
    //  Clean architecture: Smooth animated reload for English,
    //  Google Translate combo for other languages.
    // ═══════════════════════════════════════════════════════════

    // ─── STYLES ───
    const style = document.createElement('style');
    style.textContent = `
        /* ── Overlay ── */
        .lang-overlay {
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(9, 29, 69, 0.6);
            backdrop-filter: blur(12px) saturate(180%);
            -webkit-backdrop-filter: blur(12px) saturate(180%);
            z-index: 100005;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .lang-overlay.active {
            opacity: 1;
            pointer-events: auto;
        }

        /* ── Modal ── */
        .lang-modal {
            width: 340px;
            max-width: 90%;
            max-height: 600px;
            background: #FFFFFF;
            border-radius: 24px;
            box-shadow:
                0 40px 80px rgba(9, 29, 69, 0.4),
                0 0 0 1px rgba(11, 45, 107, 0.05);
            padding: 0;
            transform: translateY(20px) scale(0.96);
            transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
            overflow: hidden;
            font-family: 'Satoshi', sans-serif;
            display: flex;
            flex-direction: column;
        }
        .lang-overlay.active .lang-modal {
            transform: translateY(0) scale(1);
        }

        /* ── Header ── */
        .lang-header {
            padding: 20px 24px 16px;
            background: linear-gradient(135deg, #0B2D6B 0%, #091D45 100%);
            position: relative;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .lang-header::after {
            content: '';
            position: absolute;
            bottom: 0; left: 0; right: 0;
            height: 3px;
            background: linear-gradient(90deg, #2FA8FF, #00C2B8, #F5C400);
        }
        .lang-title {
            font-size: 18px;
            font-weight: 800;
            color: #FFFFFF;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .lang-close {
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
            line-height: 1;
        }
        .lang-close i { display: block; line-height: 1; }
        .lang-close:hover {
            background: rgba(255,255,255,0.2);
            color: #fff;
            transform: rotate(90deg);
        }

        /* ── Body ── */
        .lang-body {
            padding: 24px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
            overflow-y: auto;
            flex: 1;
            width: 100%;
            box-sizing: border-box;
        }
        .lang-body::-webkit-scrollbar { width: 3px; }
        .lang-body::-webkit-scrollbar-track { background: transparent; }
        .lang-body::-webkit-scrollbar-thumb {
            background: rgba(11, 45, 107, 0.12);
            border-radius: 100px;
        }

        /* ── Footer ── */
        .lang-footer {
            padding: 14px 24px;
            border-top: 1px solid #F0F4F8;
            display: flex;
            align-items: center;
            gap: 8px;
            flex-shrink: 0;
            width: 100%;
            box-sizing: border-box;
            background: #FAFCFF;
            justify-content: center;
        }
        .lang-footer-dot {
            width: 7px; height: 7px;
            border-radius: 50%;
            background: #00C2B8;
            box-shadow: 0 0 6px rgba(0, 194, 184, 0.4);
            animation: langFooterPulse 2.5s ease-in-out infinite;
        }
        @keyframes langFooterPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
        }
        .lang-footer-text {
            font-size: 11px;
            color: #6B7F99;
            font-weight: 500;
        }

        /* ── Grid ── */
        .lang-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
            width: 100%;
        }

        /* ── Language Card ── */
        .lang-btn {
            background: #FFFFFF;
            border: 2px solid #F1F5F9;
            border-radius: 20px;
            padding: 20px 10px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            text-align: center;
            box-shadow: 0 4px 12px rgba(148, 163, 184, 0.08);
            position: relative;
            overflow: hidden;
        }
        .lang-btn::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, rgba(47, 168, 255, 0.1), rgba(0, 194, 184, 0.1));
            opacity: 0;
            transition: opacity 0.3s;
        }
        .lang-btn:hover {
            transform: translateY(-4px) scale(1.02);
            border-color: #2FA8FF;
            box-shadow: 0 12px 24px rgba(47, 168, 255, 0.15);
        }
        .lang-btn:hover::before { opacity: 1; }
        .lang-btn:active { transform: scale(0.96); }

        /* ── Active Language Card ── */
        .lang-btn.active {
            border-color: #2FA8FF;
            background: linear-gradient(135deg, rgba(47, 168, 255, 0.06), rgba(0, 194, 184, 0.06));
            box-shadow: 0 8px 20px rgba(47, 168, 255, 0.18);
        }
        .lang-btn.active::before { opacity: 1; }
        .lang-btn.active .lang-check {
            opacity: 1;
            transform: scale(1);
        }

        /* ── Checkmark Badge ── */
        .lang-check {
            position: absolute;
            top: 8px; right: 8px;
            width: 22px; height: 22px;
            background: linear-gradient(135deg, #2FA8FF, #00C2B8);
            border-radius: 50%;
            display: grid;
            place-items: center;
            opacity: 0;
            transform: scale(0.5);
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            z-index: 2;
        }
        .lang-check i {
            font-size: 10px;
            color: #fff;
        }

        /* ── Card Inner Elements ── */
        .lang-initial {
            width: 44px; height: 44px;
            background: linear-gradient(135deg, #0B2D6B, #00C2B8);
            color: #fff;
            border-radius: 50%;
            display: grid;
            place-items: center;
            font-size: 17px;
            font-weight: 700;
            box-shadow: 0 8px 16px rgba(11, 45, 107, 0.25);
            z-index: 1;
        }
        .lang-name {
            font-size: 13px;
            font-weight: 700;
            color: #0F172A;
            z-index: 1;
        }
        .lang-native {
            font-size: 11px;
            color: #64748B;
            font-weight: 500;
            z-index: 1;
        }

        /* ── Page Fade Transition (for smooth English restore) ── */
        .lang-page-fade {
            position: fixed;
            inset: 0;
            background: #FFFFFF;
            z-index: 999999;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
        }
        .lang-page-fade.active {
            opacity: 1;
            pointer-events: auto;
        }

        /* ── Hide Google Translate Widget ── */
        .goog-te-gadget {
            width: 100%; height: 0;
            overflow: hidden; opacity: 0; pointer-events: none; position: absolute;
        }

        /* ── Mobile Responsive ── */
        @media (max-width: 480px) {
            .lang-modal {
                width: 100%;
                max-width: 100%;
                max-height: 80vh;
                border-radius: 24px 24px 0 0;
                margin: 0;
            }
            .lang-overlay {
                align-items: flex-end;
            }
            .lang-overlay.active .lang-modal {
                transform: translateY(0) scale(1);
            }
            .lang-modal {
                transform: translateY(100%) scale(1);
                padding-bottom: env(safe-area-inset-bottom, 0px);
            }
            .lang-grid { gap: 12px; }
            .lang-btn { padding: 16px 8px; }
        }
    `;
    document.head.appendChild(style);

    // ─── LANGUAGE DATA ───
    const languages = [
        { code: 'en', name: 'English', native: 'English', short: 'En' },
        { code: 'ta', name: 'Tamil', native: 'தமிழ்', short: 'Ta' },
        { code: 'hi', name: 'Hindi', native: 'हिन्दी', short: 'Hi' },
        { code: 'te', name: 'Telugu', native: 'తెలుగు', short: 'Te' },
        { code: 'ml', name: 'Malayalam', native: 'മലയാളം', short: 'Ml' },
        { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', short: 'Kn' },
        { code: 'bn', name: 'Bengali', native: 'বাংলা', short: 'Bn' }
    ];

    // ─── READ CURRENT LANGUAGE FROM COOKIE ───
    function getCurrentLangFromCookie() {
        const match = document.cookie.match(/googtrans=\/en\/(\w+)/);
        return match ? match[1] : 'en';
    }
    let currentLang = getCurrentLangFromCookie();

    // ─── DOM STRUCTURE ───
    const overlay = document.createElement('div');
    overlay.className = 'lang-overlay notranslate';
    overlay.id = 'lang-overlay';
    overlay.setAttribute('translate', 'no');

    // Page fade element (for smooth English reload)
    const pageFade = document.createElement('div');
    pageFade.className = 'lang-page-fade';
    document.body.appendChild(pageFade);

    const currentLangData = languages.find(l => l.code === currentLang) || languages[0];

    overlay.innerHTML = `
        <div class="lang-modal">
            <div class="lang-header">
                <div class="lang-title">
                    <i class="fa-solid fa-language"></i> Select Language
                </div>
                <button class="lang-close" id="lang-close">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>

            <div class="lang-body">
                <div class="lang-grid" id="lang-grid"></div>
                <div id="google_translate_element" style="display:none;"></div>
            </div>

            <div class="lang-footer">
                <div class="lang-footer-dot"></div>
                <span class="lang-footer-text" id="lang-footer-text">
                    ${currentLang === 'en' ? 'Default Language' : 'Translated to ' + currentLangData.name}
                </span>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    // ─── GENERATE LANGUAGE CARDS ───
    const gridContainer = document.getElementById('lang-grid');
    const cardMap = {};

    languages.forEach(lang => {
        const btn = document.createElement('div');
        btn.className = 'lang-btn' + (lang.code === currentLang ? ' active' : '');
        btn.innerHTML = `
            <div class="lang-check"><i class="fa-solid fa-check"></i></div>
            <div class="lang-initial">${lang.short}</div>
            <div class="lang-name notranslate">${lang.name}</div>
            <div class="lang-native notranslate">${lang.native}</div>
        `;
        btn.onclick = () => selectLanguage(lang.code);
        gridContainer.appendChild(btn);
        cardMap[lang.code] = btn;
    });

    // ─── UPDATE ACTIVE CARD ───
    function setActiveCard(code) {
        Object.values(cardMap).forEach(c => c.classList.remove('active'));
        if (cardMap[code]) cardMap[code].classList.add('active');

        // Update footer text
        const footerText = document.getElementById('lang-footer-text');
        if (footerText) {
            const langData = languages.find(l => l.code === code);
            footerText.textContent = code === 'en'
                ? 'Default Language'
                : 'Translated to ' + (langData ? langData.name : code);
        }
    }

    // ─── CLEAR GOOGLE TRANSLATE COOKIES ───
    function clearGoogTransCookies() {
        const cookies = document.cookie.split("; ");
        for (let c of cookies) {
            const [name] = c.split("=");
            if (name.includes('googtrans')) {
                document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + window.location.hostname;
                document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.' + window.location.hostname;
            }
        }
    }

    // ─── SELECTION LOGIC ───
    function selectLanguage(code) {

        // ─── Same language → do nothing ───
        if (code === currentLang) return;

        // ─── ENGLISH → Smooth animated reload ───
        if (code === 'en') {
            clearGoogTransCookies();
            setActiveCard('en');
            closeLanguage();

            // Fade out → reload → page loads fresh in English
            pageFade.classList.add('active');
            setTimeout(() => {
                window.location.reload();
            }, 300);
            return;
        }

        // ─── OTHER LANGUAGES → Google Translate combo box ───
        const googleSelect = document.querySelector('.goog-te-combo');
        if (googleSelect) {
            googleSelect.value = code;
            googleSelect.dispatchEvent(new Event('change'));
        }

        currentLang = code;
        setActiveCard(code);
    }

    // ─── OPEN / CLOSE ───
    function openLanguage() {
        overlay.classList.add('active');
        document.dispatchEvent(new CustomEvent('languageActive'));
    }

    function closeLanguage() {
        overlay.classList.remove('active');
        document.dispatchEvent(new CustomEvent('languageDeactive'));
        document.dispatchEvent(new CustomEvent('menuItemDeactivate', { detail: { id: 'menu-language' } }));
    }

    // ─── EVENT LISTENERS ───
    const closeBtn = document.getElementById('lang-close');
    closeBtn.addEventListener('click', closeLanguage);

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeLanguage();
    });

    // Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('active')) {
            closeLanguage();
        }
    });

    // Menu integration
    document.addEventListener('menuItemClick', (e) => {
        if (e.detail && e.detail.id === 'menu-language') {
            openLanguage();
        }
    });

    // ─── GOOGLE TRANSLATE INIT ───
    window.googleTranslateElementInit = function () {
        new google.translate.TranslateElement({
            pageLanguage: 'en',
            includedLanguages: 'en,ta,hi,te,ml,kn,bn',
            autoDisplay: false
        }, 'google_translate_element');
    };

    const gtScript = document.createElement('script');
    gtScript.type = 'text/javascript';
    gtScript.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    document.head.appendChild(gtScript);

})();
