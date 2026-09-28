// ═══════════════════════════════════════════════════════════
//  GSV POPUP — Google Street View Iframe Popup
//  Glassmorphism overlay with embedded Google Maps Street View
//  Same style as 3dvista.js iframe popup
// ═══════════════════════════════════════════════════════════
(function () {

    /* ─── Keyframes (inject once) ─── */
    const style = document.createElement("style");
    style.id = "gsv-popup-styles";
    style.textContent = `
        @keyframes gsvFadeIn   { from { opacity: 0; } to { opacity: 1; } }
        @keyframes gsvFadeOut  { from { opacity: 1; } to { opacity: 0; } }
    `;
    document.head.appendChild(style);

    /* ─── Helpers ─── */
    function s(el, styles) { Object.assign(el.style, styles); }

    /* ─── GSV Iframe URL ─── */
    const GSV_URL = "https://www.google.com/maps/embed?pb=!4v1780375592323!6m8!1m7!1svXot9QTmqgL0mIAvUbYLUw!2m2!1d9.91184973728455!2d78.14834959933886!3f3.278447578512313!4f3.8932723806887566!5f0.7820865974627469";

        /* ─── Open Popup ─── */
        function openGsvPopup() {
            const backdrop = document.createElement("div");
            s(backdrop, {
                position: "fixed",
                top: "0", left: "0", width: "100%", height: "100%",
                background: "rgba(15, 23, 42, 0.4)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                zIndex: "100030",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                animation: "gsvFadeIn 0.35s ease forwards",
                boxSizing: "border-box"
            });

            const box = document.createElement("div");
            s(box, {
                width: "95%",
                height: "95%",
                position: "relative",
                background: "rgba(255, 255, 255, 0.05)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "24px",
                boxShadow: "0 32px 64px rgba(0, 0, 0, 0.3)",
                overflow: "hidden",
                transform: "translateY(30px) scale(0.95)",
                opacity: "0",
                transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
                display: "flex",
                flexDirection: "column"
            });

            const closeBtn = document.createElement("button");
            closeBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
            s(closeBtn, {
                position: "absolute",
                top: "20px", right: "20px",
                width: "48px", height: "48px",
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.2)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: "1px solid rgba(255, 255, 255, 0.4)",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
                color: "#FFFFFF",
                display: "grid", placeItems: "center",
                cursor: "pointer", transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                padding: "0", zIndex: "10"
            });
            closeBtn.onmouseenter = function () { s(closeBtn, { background: "rgba(255, 255, 255, 0.35)", transform: "scale(1.1) rotate(90deg)" }); };
            closeBtn.onmouseleave = function () { s(closeBtn, { background: "rgba(255, 255, 255, 0.2)", transform: "scale(1) rotate(0deg)" }); };
            closeBtn.onclick = closePopup;
            box.appendChild(closeBtn);

            const iframe = document.createElement("iframe");
            iframe.src = GSV_URL;
            iframe.setAttribute("allowfullscreen", "");
            iframe.setAttribute("loading", "lazy");
            iframe.setAttribute("referrerpolicy", "no-referrer-when-downgrade");
            s(iframe, {
                width: "100%", height: "100%",
                border: "none", flex: "1", background: "transparent",
                borderRadius: "24px"
            });
            box.appendChild(iframe);

            backdrop.appendChild(box);
            document.body.appendChild(backdrop);

            requestAnimationFrame(function () {
                requestAnimationFrame(function () {
                    s(box, { transform: "translateY(0) scale(1)", opacity: "1" });
                });
            });

            var escHandler = function (e) {
                if (e.key === "Escape") closePopup();
            };
            document.addEventListener("keydown", escHandler);

            function closePopup() {
                s(box, { transform: "translateY(30px) scale(0.95)", opacity: "0" });
                backdrop.style.animation = "gsvFadeOut 0.4s ease forwards";
                setTimeout(function () {
                    if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
                }, 400);
                document.removeEventListener("keydown", escHandler);
            }

            backdrop.addEventListener("click", function (e) {
                if (e.target === backdrop) closePopup();
            });
        }

    /* ─── Public API ─── */
    window.openGsvPopup = openGsvPopup;

    /* ─── Listen for WidgetDock GSV button click ─── */
    document.addEventListener("menuItemClick", function (e) {
        if (e.detail && e.detail.id === "menu-street-view") {
            openGsvPopup();
        }
    });

})();
