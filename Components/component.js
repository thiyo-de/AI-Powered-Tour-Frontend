// Component Loader & Utilities
// Ensures all dynamic components initialize gracefully
(function () {
    console.log("Components loading...");

    // Shared Event Bus if needed, or just a namespace
    window.App = window.App || {};
    window.App.Components = window.App.Components || {};

    // Helper to create branded modals if needed universally
    window.App.createModal = function (id, content) {
        // Future shared logic
    };

    // ─── Inject Global Fonts & Icons ────────────────────────────
    const fonts = document.createElement('link');
    fonts.href = "https://api.fontshare.com/v2/css?f[]=satoshi@900,700,500,400&display=swap";
    fonts.rel = "stylesheet";
    document.head.appendChild(fonts);

    // ─── FontAwesome 6 (Icons — Non-blocking) ─────────────────
    const fa = document.createElement('link');
    fa.rel = 'stylesheet';
    fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css';
    fa.media = 'print';
    fa.onload = function() { this.media = 'all'; };
    document.head.appendChild(fa);

    const globalStyle = document.createElement('style');
    globalStyle.textContent = `
        body, button, input, select, textarea, h1, h2, h3, h4, h5, h6 { 
            font-family: 'Satoshi', sans-serif !important; 
        }
        /* Explicitly protect icon fonts - Order matters (Brands last to override generic if mixed) */
        .fas, .fa-solid, .far, .fa-regular, .fa { font-family: "Font Awesome 6 Free" !important; }
        .fab, .fa-brands { font-family: "Font Awesome 6 Brands" !important; }
    `;
    document.head.appendChild(globalStyle);

    // Dock Widget removed — now handled by Components/WidgetDock/widget_dock.js
})();
