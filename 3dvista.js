(function () {
  "use strict";

  /* ═══════════════════════════════════════════════════════
     3D VISTA POPUP — Premium Navy Theme
     Matching Menu, Panolist, GSV Explore, Search
     Brand: Blue (#2F5E8E), Sky (#96C0E6), Green (#2E8B57),
            Orange (#F47C20), White (#FFF), Navy (#1E3A5F)
     ═══════════════════════════════════════════════════════ */

  /* ─── Load own CDNs (self-contained) ─── */
  // Font Awesome 6
  if (!document.querySelector('link[href*="font-awesome"], link[href*="fontawesome"]')) {
    const fa = document.createElement("link");
    fa.rel = "stylesheet";
    fa.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css";
    fa.crossOrigin = "anonymous";
    document.head.appendChild(fa);
  }

  // Satoshi Font
  if (!document.querySelector('link[href*="satoshi"]')) {
    const satoshi = document.createElement("link");
    satoshi.rel = "stylesheet";
    satoshi.href = "https://api.fontshare.com/v2/css?f[]=satoshi@400,500,600,700,800&display=swap";
    document.head.appendChild(satoshi);
  }

  const CONFIG = {
    autoOpen: true,
    autoOpenDelay: 800,
    closeOnBackdrop: true,
  };

  /* ─── Keyframes (inject once) ─── */
  const style = document.createElement("style");
  style.id = "dv-popup-styles";
  style.textContent = `
    @keyframes dvFadeIn   { from { opacity: 0; } to { opacity: 1; } }
    @keyframes dvFadeOut  { from { opacity: 1; } to { opacity: 0; } }
    @keyframes dvSlideUp  { from { opacity: 0; transform: translateY(30px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
    @keyframes dvSlideOut { from { opacity: 1; transform: translateY(0) scale(1); } to { opacity: 0; transform: translateY(30px) scale(0.95); } }
    @keyframes dvPulse    { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
  `;
  document.head.appendChild(style);

  /* ─── Helpers ─── */
  function s(el, styles) { Object.assign(el.style, styles); }

  /* ─── Build Popup Container (backdrop + box) ─── */
  function createPopupContainer() {
    // Backdrop — flex centered (matches GSV action box)
    const backdrop = document.createElement("div");
    backdrop.id = "dv-popup-backdrop";
    s(backdrop, {
      position: "fixed",
      top: "0", left: "0", width: "100%", height: "100%",
      background: "rgba(30, 58, 95, 0.55)",
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
      zIndex: "100020",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      animation: "dvFadeIn 0.35s ease forwards",
    });

    // Popup box — sits inside the flex backdrop
    const box = document.createElement("div");
    box.id = "dv-popup-box";
    s(box, {
      width: "92%",
      maxWidth: "440px",
      maxHeight: "90vh",
      background: "#FFFFFF",
      borderRadius: "24px",
      boxShadow: "0 32px 64px rgba(30, 58, 95, 0.3), 0 0 0 1px rgba(47, 94, 142, 0.06)",
      fontFamily: "'Satoshi', 'Segoe UI', system-ui, sans-serif",
      overflow: "hidden",
      transform: "translateY(30px) scale(0.95)",
      opacity: "0",
      transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
    });

    /* ── Header ── */
    const header = document.createElement("div");
    s(header, {
      padding: "28px 28px 20px",
      background: "linear-gradient(135deg, #2F5E8E 0%, #1E3A5F 100%)",
      position: "relative",
      textAlign: "center",
    });

    // Tri-color accent bar
    const accent = document.createElement("div");
    s(accent, {
      position: "absolute",
      bottom: "0", left: "0", right: "0", height: "3px",
      background: "linear-gradient(90deg, #96C0E6, #2E8B57, #F47C20)",
    });
    header.appendChild(accent);

    // Close button
    const closeBtn = document.createElement("button");
    closeBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    s(closeBtn, {
      position: "absolute",
      top: "16px", right: "16px",
      width: "32px", height: "32px",
      borderRadius: "50%",
      background: "rgba(255, 255, 255, 0.1)",
      border: "1px solid rgba(255, 255, 255, 0.15)",
      color: "rgba(255, 255, 255, 0.7)",
      display: "grid", placeItems: "center",
      cursor: "pointer",
      transition: "all 0.25s",
      fontSize: "13px",
      padding: "0",
    });
    closeBtn.onmouseenter = () => {
      s(closeBtn, {
        background: "rgba(255, 255, 255, 0.25)",
        color: "#fff",
        transform: "rotate(90deg)",
      });
    };
    closeBtn.onmouseleave = () => {
      s(closeBtn, {
        background: "rgba(255, 255, 255, 0.1)",
        color: "rgba(255, 255, 255, 0.7)",
        transform: "rotate(0deg)",
      });
    };
    closeBtn.onclick = () => DVPopup.close();
    header.appendChild(closeBtn);

    // Icon wrap
    const iconWrap = document.createElement("div");
    s(iconWrap, {
      width: "64px", height: "64px",
      borderRadius: "18px",
      background: "rgba(150, 192, 230, 0.15)",
      border: "1px solid rgba(150, 192, 230, 0.25)",
      display: "grid", placeItems: "center",
      margin: "0 auto 16px",
      fontSize: "26px",
      color: "#96C0E6",
    });
    iconWrap.innerHTML = '<i class="fa-solid fa-panorama"></i>';
    header.appendChild(iconWrap);

    // Title
    const title = document.createElement("div");
    title.textContent = "Mount Zion Virtual Tour";
    s(title, {
      fontSize: "20px",
      fontWeight: "800",
      color: "#FFFFFF",
      letterSpacing: "-0.3px",
      lineHeight: "1.3",
      marginBottom: "6px",
    });
    header.appendChild(title);

    // Subtitle badge
    const sub = document.createElement("div");
    sub.textContent = "Choose Your Experience";
    s(sub, {
      display: "inline-block",
      fontSize: "12px",
      fontWeight: "600",
      color: "rgba(255, 255, 255, 0.5)",
      background: "rgba(255, 255, 255, 0.08)",
      padding: "4px 14px",
      borderRadius: "100px",
      letterSpacing: "0.5px",
    });
    header.appendChild(sub);

    box.appendChild(header);

    /* ── Body with Two Action Buttons ── */
    const body = document.createElement("div");
    s(body, {
      padding: "24px 28px 28px",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      background: "#F8FAFC",
    });

    // --- Virtual Tour Button ---
    const tourBtn = createActionButton({
      iconClass: "fa-solid fa-vr-cardboard",
      label: "Continue with Virtual Tour",
      desc: null,
      gradientColors: ["#2F5E8E", "#96C0E6"],
      shadowColor: "rgba(150, 192, 230, 0.3)",
      hoverBg: "#F0F9FF",
      hoverBorder: "rgba(150, 192, 230, 0.3)",
      onClick: () => {
        DVPopup.close();
        // Virtual tour is already running — just close popup
      },
    });
    body.appendChild(tourBtn);

    // --- GSV Button ---
    const gsvBtn = createActionButton({
      iconClass: "fa-solid fa-street-view",
      label: "Switch to Google Street View",
      desc: null,
      gradientColors: ["#2E8B57", "#56B87A"],
      shadowColor: "rgba(46, 139, 87, 0.25)",
      hoverBg: "#F0FDF4",
      hoverBorder: "rgba(46, 139, 87, 0.2)",
      onClick: () => {
        DVPopup.close();
        openIframePopup("https://www.google.com/maps/embed?pb=!4v1773894128625!6m8!1m7!1sCAoSF0NJSE0wb2dLRUlDQWdJQ3A2dHVnNGdF!2m2!1d10.29539444450159!2d78.76225519795156!3f185.9805093672628!4f0.6916854146053169!5f0.7820865974627469");
      },
    });
    body.appendChild(gsvBtn);

    box.appendChild(body);

    /* ── Footer ── */
    const footer = document.createElement("div");
    s(footer, {
      padding: "12px 28px 14px",
      borderTop: "1px solid #F1F5F9",
      background: "#FFFFFF",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    });

    const dot = document.createElement("div");
    s(dot, {
      width: "6px", height: "6px",
      borderRadius: "50%",
      background: "#2E8B57",
      boxShadow: "0 0 6px rgba(46, 139, 87, 0.4)",
      animation: "dvPulse 2.5s ease-in-out infinite",
    });
    footer.appendChild(dot);

    const footerText = document.createElement("span");
    footerText.textContent = "Virtual Tour is Live";
    s(footerText, {
      fontSize: "11px",
      color: "#64748B",
      fontWeight: "600",
    });
    footer.appendChild(footerText);

    // ESC hint (desktop)
    const hint = document.createElement("span");
    hint.textContent = "Esc to close";
    s(hint, {
      marginLeft: "auto",
      fontSize: "10px",
      color: "#94A3B8",
      background: "#F1F5F9",
      padding: "2px 6px",
      borderRadius: "4px",
      fontWeight: "600",
    });
    footer.appendChild(hint);

    box.appendChild(footer);

    // Append box into backdrop
    backdrop.appendChild(box);

    // Animate in after a frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        s(box, { transform: "translateY(0) scale(1)", opacity: "1" });
      });
    });

    return { backdrop, box };
  }

  /* ─── Action Button Builder ─── */
  function createActionButton(opts) {
    const btn = document.createElement("button");
    s(btn, {
      display: "flex",
      alignItems: "center",
      gap: "16px",
      padding: "16px 20px",
      borderRadius: "16px",
      border: "1px solid #E2E8F0",
      background: "#FFFFFF",
      cursor: "pointer",
      transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
      fontFamily: "inherit",
      textAlign: "left",
      width: "100%",
    });

    // Icon
    const iconBox = document.createElement("div");
    s(iconBox, {
      width: "48px", height: "48px",
      borderRadius: "14px",
      display: "grid", placeItems: "center",
      fontSize: "18px",
      flexShrink: "0",
      background: `linear-gradient(135deg, ${opts.gradientColors[0]}, ${opts.gradientColors[1]})`,
      color: "#FFFFFF",
      boxShadow: `0 4px 14px ${opts.shadowColor}`,
      transition: "all 0.3s",
    });
    iconBox.innerHTML = `<i class="${opts.iconClass}"></i>`;
    btn.appendChild(iconBox);

    // Text
    const textWrap = document.createElement("div");
    s(textWrap, { flex: "1" });

    const label = document.createElement("div");
    label.textContent = opts.label;
    s(label, {
      fontSize: "15px",
      fontWeight: "700",
      color: "#1E3A5F",
      marginBottom: "2px",
    });
    textWrap.appendChild(label);

    const desc = document.createElement("div");
    desc.textContent = opts.desc;
    s(desc, {
      fontSize: "12px",
      color: "#94A3B8",
      fontWeight: "500",
    });
    textWrap.appendChild(desc);

    btn.appendChild(textWrap);

    // Arrow
    const arrow = document.createElement("i");
    arrow.className = "fa-solid fa-arrow-right";
    s(arrow, {
      fontSize: "12px",
      color: "#CBD5E1",
      transition: "all 0.25s",
    });
    btn.appendChild(arrow);

    // Hover
    btn.onmouseenter = () => {
      s(btn, {
        borderColor: "transparent",
        transform: "translateY(-2px)",
        boxShadow: "0 8px 24px rgba(30, 58, 95, 0.1)",
        background: opts.hoverBg,
      });
      s(arrow, { transform: "translateX(4px)", color: opts.gradientColors[0] });
    };
    btn.onmouseleave = () => {
      s(btn, {
        borderColor: "#E2E8F0",
        transform: "translateY(0)",
        boxShadow: "none",
        background: "#FFFFFF",
      });
      s(arrow, { transform: "translateX(0)", color: "#CBD5E1" });
    };
    btn.onmousedown = () => s(btn, { transform: "scale(0.98)" });
    btn.onmouseup = () => s(btn, { transform: "translateY(-2px)" });

    btn.onclick = opts.onClick;

    return btn;
  }

  /* ─── Iframe Popup Builder ─── */
  function openIframePopup(url) {
    const backdrop = document.createElement("div");
    s(backdrop, {
      position: "fixed",
      top: "0", left: "0", width: "100%", height: "100%",
      background: "rgba(15, 23, 42, 0.4)", // Darkish glassmorphism
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      zIndex: "100030",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      animation: "dvFadeIn 0.35s ease forwards",
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
    closeBtn.onmouseenter = () => { s(closeBtn, { background: "rgba(255, 255, 255, 0.35)", transform: "scale(1.1) rotate(90deg)" }); };
    closeBtn.onmouseleave = () => { s(closeBtn, { background: "rgba(255, 255, 255, 0.2)", transform: "scale(1) rotate(0deg)" }); };

    closeBtn.onclick = closeIframePopup;
    box.appendChild(closeBtn);

    const iframe = document.createElement("iframe");
    iframe.src = url;
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

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        s(box, { transform: "translateY(0) scale(1)", opacity: "1" });
      });
    });

    const escIframeHandler = (e) => {
      if (e.key === "Escape") closeIframePopup();
    };
    document.addEventListener("keydown", escIframeHandler);

    function closeIframePopup() {
      s(box, { transform: "translateY(30px) scale(0.95)", opacity: "0" });
      backdrop.style.animation = "dvFadeOut 0.4s ease forwards";
      setTimeout(() => { if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop); }, 400);
      document.removeEventListener("keydown", escIframeHandler);
    }

    backdrop.addEventListener("click", (e) => { if (e.target === backdrop) closeIframePopup(); });
  }

  /* ─── Public API ─── */
  const DVPopup = {
    _backdrop: null,
    _popup: null,
    _isOpen: false,
    _escHandler: null,

    open() {
      if (this._isOpen) return;
      this._isOpen = true;

      const { backdrop, box } = createPopupContainer();
      this._backdrop = backdrop;
      this._popup = box;

      document.body.appendChild(this._backdrop);

      // Close on backdrop click (not on box click)
      if (CONFIG.closeOnBackdrop) {
        this._backdrop.addEventListener("click", (e) => {
          if (e.target === this._backdrop) DVPopup.close();
        });
      }

      this._escHandler = (e) => {
        if (e.key === "Escape") DVPopup.close();
      };
      document.addEventListener("keydown", this._escHandler);
    },

    close() {
      if (!this._isOpen) return;
      this._isOpen = false;

      if (this._popup) {
        s(this._popup, { transform: "translateY(30px) scale(0.95)", opacity: "0" });
      }
      if (this._backdrop) {
        this._backdrop.style.animation = "dvFadeOut 0.3s ease forwards";
      }

      setTimeout(() => {
        if (this._backdrop && this._backdrop.parentNode) this._backdrop.parentNode.removeChild(this._backdrop);
        this._backdrop = null;
        this._popup = null;
      }, 350);

      document.removeEventListener("keydown", this._escHandler);
    },

    configure(options) {
      Object.assign(CONFIG, options);
      return this;
    },
  };

  window.DVPopup = DVPopup;

  // Auto-open
  if (CONFIG.autoOpen) {
    const go = () => setTimeout(() => DVPopup.open(), CONFIG.autoOpenDelay);
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", go);
    } else {
      go();
    }
  }
})();
