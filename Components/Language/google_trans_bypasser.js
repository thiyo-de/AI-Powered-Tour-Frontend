(function () {
    // ═══════════════════════════════════════════════════
    //  GOOGLE TRANSLATE BYPASSER — CSS-Only Approach
    //  Hides all Google Translate UI artifacts cleanly.
    //  Single source of truth — no duplicate CSS needed.
    // ═══════════════════════════════════════════════════

    const style = document.createElement('style');
    style.textContent = `
        /* ── Hide Google Translate Banner & Toolbar ── */
        .goog-te-banner-frame,
        .skiptranslate,
        .VIpgJd-ZVi9od-ORHb-OEVmcd,
        .VIpgJd-ZVi9od-l4eHX-hSRGPd,
        .VIpgJd-ZVi9od-ORHb-bN97Pc {
            display: none !important;
        }

        /* ── Hide Tooltip & Balloon ── */
        #goog-gt-tt,
        .goog-te-balloon-frame {
            display: none !important;
            visibility: hidden !important;
            pointer-events: none !important;
        }

        /* ── Remove Text Highlight on Hover ── */
        .goog-text-highlight {
            background: none !important;
            box-shadow: none !important;
        }

        /* ── Prevent Page Shift from Banner ── */
        body { top: 0 !important; }
    `;
    document.head.appendChild(style);

    // Body top reset (Google Translate sometimes overrides inline)
    const observer = new MutationObserver(() => {
        if (document.body.style.top !== '0px') {
            document.body.style.top = '0px';
        }
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['style'] });
})();
