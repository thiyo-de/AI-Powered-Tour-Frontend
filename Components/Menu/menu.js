(function () {
    // ─── Menu Items with Categories ─────────────────────────────
    const menuCategories = [
        {
            label: "Explore",
            items: [
                {
                    icon: "fa-house",
                    label: "Home",
                    id: "menu-home",
                    url: "https://mount-zion-schools.netlify.app/",
                },
                {
                    icon: "fa-panorama",
                    label: "Explore Classrooms & Facilities",
                    id: "menu-panorama",
                },
                {
                    icon: "fa-street-view",
                    label: "Google Street View",
                    id: "menu-street-view",
                },
                { icon: "fa-magnifying-glass", label: "Search", id: "menu-search" },
            ],
        },
        {
            label: "Services",
            items: [
                {
                    icon: "fa-credit-card",
                    label: "Payment",
                    id: "menu-payment",
                    url: "https://payments.billdesk.com/bdcollect/pay?p1=4833&p2=1",
                },
                {
                    icon: "fa-user-graduate",
                    label: "Student Login",
                    id: "menu-student-login",
                    url: "https://ssolive.myclassboard.com/Account/Login?ReturnUrl=%2Fconnect%2Fauthorize%2Fcallback%3Fclient_id%3DEP5WI6IH8T1V0Q5FX0OR%26redirect_uri%3Dhttps%253A%252F%252Fmountzion.myclassboard.com%252Fsso%252FCallback%26response_type%3Dcode%26scope%3Dopenid%2520profile%2520offline_access",
                },
            ],
        },
        {
            label: "Admissions",
            items: [
                {
                    icon: "fa-file-lines",
                    label: "Admission & Prospectus",
                    id: "menu-admission",
                    url: "https://mountzionschools.com/cbse/pros/pros.html",
                },
            ],
        },
        {
            label: "Facilities",
            items: [
                {
                    icon: "fa-building",
                    label: "Infrastructure",
                    id: "menu-infrastructure",
                    url: "https://mountzionschools.com/cbse/infrastructure.html",
                },
                {
                    icon: "fa-bed",
                    label: "Hostel Facility",
                    id: "menu-hostel",
                    url: "https://mountzionschools.com/cbse/hostel.html",
                },
                {
                    icon: "fa-futbol",
                    label: "Sports Facility",
                    id: "menu-sports",
                    url: "https://mountzionschools.com/cbse/sports.html",
                },
                {
                    icon: "fa-bus",
                    label: "Transport",
                    id: "menu-transport",
                    url: "https://mountzionschools.com/cbse/transport.html",
                },
                {
                    icon: "fa-flask",
                    label: "Lab",
                    id: "menu-lab",
                    url: "https://mountzionschools.com/cbse/lab.html",
                },
                {
                    icon: "fa-book-open",
                    label: "Library",
                    id: "menu-library",
                    url: "https://mountzionschools.com/cbse/library.html",
                },
            ],
        },
        {
            label: "Information",
            items: [
                { icon: "fa-expand", label: "Fullscreen Mode", id: "menu-fullscreen" },
                {
                    icon: "fa-circle-info",
                    label: "Info",
                    id: "menu-visitor",
                    url: "https://mountzionschools.com/cbse/aboutus.html",
                },
            ],
        },
        {
            label: "Connect",
            items: [
                { icon: "fa-envelope", label: "Contact Us", id: "menu-contact" },
                {
                    icon: "fa-location-dot",
                    label: "Location & Directions",
                    id: "menu-location",
                },
            ],
        },
    ];

    // Flat list for legacy compatibility
    const menuItems = menuCategories.flatMap((c) => c.items);

    // ─── Inject CSS ─────────────────────────────────────────────
    const css = document.createElement("style");
    css.textContent = `
        /* ═════════════════════════════════════════════
           MENU — Brand-Aligned Premium Design
           Blue (#2F5E8E), Sky (#96C0E6), Green (#2E8B57),
           Orange (#F47C20), White (#FFF), Navy (#1E3A5F)
           ═════════════════════════════════════════════ */

        /* ── Menu Toggle (FAB) ─────────────────────── */
        .menu-toggle {
            position: fixed;
            bottom: 24px;
            left: 24px;
            z-index: 100000;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            border: 1px solid rgba(255, 255, 255, 0.12);
            background: rgba(30, 58, 95, 0.75);
            backdrop-filter: blur(20px) saturate(180%);
            -webkit-backdrop-filter: blur(20px) saturate(180%);
            box-shadow: 
                0 8px 32px rgba(30, 58, 95, 0.3),
                0 0 0 1px rgba(255, 255, 255, 0.05),
                inset 0 1px 0 rgba(255, 255, 255, 0.08);
            color: #fff;
            font-size: 20px;
            cursor: pointer;
            display: grid;
            place-items: center;
            transition: all .3s cubic-bezier(0.4, 0, 0.2, 1);
            -webkit-tap-highlight-color: transparent;
            /* Start hidden below screen — set via JS inline styles */
        }
        .menu-toggle:hover {
            transform: scale(1.08);
            box-shadow:
                0 6px 28px rgba(47, 94, 142, 0.5),
                0 0 0 3px rgba(150, 192, 230, 0.25);
        }
        @media (max-width: 380px) {
            .menu-toggle {
                bottom: 16px;
                left: 16px;
                width: 48px;
                height: 48px;
                font-size: 17px;
            }
            .menu-panel {
                bottom: 76px;
                left: 16px;
            }
        }
        .menu-toggle:active {
            transform: scale(0.94);
        }
        .menu-toggle.open {
            background: rgba(30, 58, 95, 0.85);
            box-shadow: 0 6px 28px rgba(30, 58, 95, 0.4);
        }
        .menu-toggle i {
            transition: transform .35s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .menu-toggle.open i {
            transform: rotate(180deg);
        }

        /* ── Menu Panel ────────────────────────────── */
        .menu-panel {
            position: fixed;
            bottom: 92px;
            left: 24px;
            z-index: 99998;
            width: min(300px, calc(100vw - 48px));
            max-height: min(640px, calc(100vh - 140px));
            background: #FFFFFF;
            border-radius: 20px;
            box-shadow:
                0 20px 60px rgba(30, 58, 95, 0.22),
                0 4px 16px rgba(30, 58, 95, 0.1),
                0 0 0 1px rgba(47, 94, 142, 0.06);
            font-family: 'Satoshi', sans-serif;
            overflow: hidden;
            display: flex;
            flex-direction: column;

            /* Hidden by default */
            opacity: 0;
            transform: translateY(16px) scale(0.95);
            pointer-events: none;
            transition: all .3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .menu-panel.open {
            opacity: 1;
            transform: translateY(0) scale(1);
            pointer-events: auto;
        }

        /* ── Header ────────────────────────────────── */
        .menu-head {
            padding: 20px 22px 16px;
            background: linear-gradient(135deg, #2F5E8E 0%, #1E3A5F 100%);
            position: relative;
            flex-shrink: 0;
        }
        .menu-head::after {
            content: '';
            position: absolute;
            bottom: 0; left: 0; right: 0;
            height: 3px;
            background: linear-gradient(90deg, #96C0E6, #2E8B57, #F47C20);
        }
        .menu-head-title {
            font-family: 'Satoshi', 'Inter', sans-serif;
            font-size: 18px;
            font-weight: 800;
            color: #FFFFFF;
            letter-spacing: -0.3px;
        }
        .menu-head-sub {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.55);
            font-weight: 500;
            margin-top: 3px;
        }
        .menu-close-btn {
            position: absolute;
            top: 18px;
            right: 18px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.15);
            width: 32px;
            height: 32px;
            border-radius: 50%;
            color: rgba(255, 255, 255, 0.7);
            cursor: pointer;
            display: grid;
            place-items: center;
            transition: all .25s;
            font-size: 13px;
        }
        .menu-close-btn:hover {
            background: rgba(255, 255, 255, 0.2);
            border-color: rgba(255, 255, 255, 0.3);
            color: #fff;
            transform: rotate(90deg);
        }

        /* ── Scrollable Body ───────────────────────── */
        .menu-items {
            padding: 10px 12px 16px;
            display: flex;
            flex-direction: column;
            gap: 2px;
            overflow-y: auto;
            flex: 1;
        }
        .menu-items::-webkit-scrollbar { width: 3px; }
        .menu-items::-webkit-scrollbar-track { background: transparent; }
        .menu-items::-webkit-scrollbar-thumb {
            background: rgba(47, 94, 142, 0.12);
            border-radius: 100px;
        }

        /* ── Category Labels ───────────────────────── */
        .menu-category-label {
            font-size: 10px;
            font-weight: 700;
            color: #6B7F99;
            text-transform: uppercase;
            letter-spacing: 1.1px;
            padding: 14px 12px 5px;
            user-select: none;
        }
        .menu-category-label:first-child {
            padding-top: 4px;
        }

        /* ── Menu Item ─────────────────────────────── */
        .menu-item {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 10px 12px;
            border-radius: 12px;
            cursor: pointer;
            transition: all .2s cubic-bezier(0.4, 0, 0.2, 1);
            border: none;
            background: transparent;
            width: 100%;
            text-align: left;
            font-family: inherit;
            -webkit-tap-highlight-color: transparent;
            position: relative;
            opacity: 0;
            animation: menuSlideIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            text-decoration: none; /* For links */
        }
        @keyframes menuSlideIn {
            from {
                opacity: 0;
                transform: translateX(-8px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        .menu-item:hover {
            background: #EEF4FA;
        }
        .menu-item:active {
            background: #E3EDF6;
            transform: scale(0.98);
        }
        /* Active state */
        .menu-item.active {
            background: #EEF4FA;
        }
        .menu-item.active::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 3px;
            height: 55%;
            background: linear-gradient(180deg, #2F5E8E, #2E8B57);
            border-radius: 0 3px 3px 0;
        }

        /* Icon */
        .menu-item-icon {
            width: 38px;
            height: 38px;
            border-radius: 10px;
            background: #F0F4F8;
            display: grid;
            place-items: center;
            font-size: 14px;
            color: #2F5E8E;
            flex-shrink: 0;
            transition: all .25s cubic-bezier(0.34, 1.56, 0.64, 1);
            border: 1px solid transparent;
        }
        .menu-item:hover .menu-item-icon {
            background: linear-gradient(135deg, #2F5E8E, #1E3A5F);
            color: #fff;
            box-shadow: 0 4px 14px rgba(47, 94, 142, 0.3);
            transform: scale(1.06);
        }
        .menu-item.active .menu-item-icon {
            background: linear-gradient(135deg, #2F5E8E, #1E3A5F);
            color: #fff;
            box-shadow: 0 4px 14px rgba(47, 94, 142, 0.25);
        }

        /* Label */
        .menu-item-label {
            font-size: 14px;
            font-weight: 600;
            color: #1E3A5F;
            transition: all .2s;
        }
        .menu-item:hover .menu-item-label {
            color: #2F5E8E;
            transform: translateX(2px);
        }
        .menu-item.active .menu-item-label {
            color: #2F5E8E;
            font-weight: 700;
        }

        /* Arrow */
        .menu-item-arrow {
            margin-left: auto;
            font-size: 10px;
            color: #C4D0DC;
            transition: all .25s;
        }
        .menu-item-arrow.external {
            /* Distinct style for external links if needed, using standard arrow for now */
        }
        .menu-item:hover .menu-item-arrow {
            transform: translateX(3px);
            color: #2F5E8E;
        }

        /* ── Footer / Branding ─────────────────────── */
        .menu-footer {
            padding: 10px 22px 14px;
            border-top: 1px solid #D1D9E6;
            display: flex;
            align-items: center;
            gap: 8px;
            flex-shrink: 0;
        }
        .menu-footer-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #2E8B57;
            box-shadow: 0 0 6px rgba(46, 139, 87, 0.4);
            animation: footerPulse 2.5s ease-in-out infinite;
        }
        @keyframes footerPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
        }
        .menu-footer-text {
            font-size: 11px;
            color: #6B7F99;
            font-weight: 500;
        }

        /* ═══════ Responsive ═══════ */

        @media (max-width: 768px) {
            .menu-toggle {
                width: 52px;
                height: 52px;
                font-size: 18px;
                bottom: 18px;
                left: 18px;
            }
            .menu-panel {
                width: 280px;
                bottom: 82px;
                left: 18px;
            }
            .menu-head { padding: 18px 18px 14px; }
            .menu-head-title { font-size: 16px; }
            .menu-item { padding: 9px 12px; }
            .menu-item-icon {
                width: 36px;
                height: 36px;
                font-size: 13px;
            }
        }

        @media (max-width: 480px) {
            .menu-toggle {
                width: 50px;
                height: 50px;
                font-size: 17px;
                bottom: 14px;
                left: 14px;
            }
            .menu-panel {
                width: calc(100% - 28px);
                left: 14px;
                right: 14px;
                bottom: 76px;
                max-height: calc(100vh - 100px);
                border-radius: 18px;
            }
            .menu-head { padding: 16px 16px 12px; }
            .menu-head-title { font-size: 15px; }
            .menu-items { padding: 8px 10px 12px; }
            .menu-item {
                padding: 9px 10px;
                gap: 12px;
                border-radius: 10px;
            }
            .menu-item-icon {
                width: 34px;
                height: 34px;
                border-radius: 9px;
                font-size: 12px;
            }
            .menu-item-label { font-size: 13px; }
        }



        @media (max-width: 360px) {
            .menu-toggle {
                width: 46px;
                height: 46px;
                bottom: 10px;
                left: 10px;
            }
            .menu-panel {
                left: 10px;
                right: 10px;
                width: calc(100% - 20px);
                bottom: 66px;
                border-radius: 16px;
            }
        }
    `;
    document.head.appendChild(css);

    // ─── Build HTML ─────────────────────────────────────────────

    // Toggle Button
    const toggleBtn = document.createElement("button");
    toggleBtn.className = "menu-toggle";
    toggleBtn.id = "menu-toggle";
    toggleBtn.setAttribute("aria-label", "Toggle Menu");
    toggleBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';

    // Start hidden below screen
    toggleBtn.style.transform = "translateY(150px)";
    toggleBtn.style.opacity = "0";
    document.body.appendChild(toggleBtn);

    // Slide menu toggle in from bottom
    setTimeout(function () {
        toggleBtn.style.transform = "translateY(0)";
        toggleBtn.style.opacity = "1";
        // Clean up inline styles after transition so hover/active work
        setTimeout(function () {
            toggleBtn.style.transform = "";
            toggleBtn.style.opacity = "";
        }, 350);
    }, 200);

    // Menu Panel
    const panel = document.createElement("div");
    panel.className = "menu-panel";
    panel.id = "menu-panel";

    // Build categorized items with stagger
    let itemIndex = 0;
    let itemsHTML = "";
    menuCategories.forEach((cat) => {
        itemsHTML += `<div class="menu-category-label">${cat.label}</div>`;
        cat.items.forEach((item) => {
            const urlAttr = item.url ? ` data-url="${item.url}"` : "";
            const iconClass = item.url
                ? "fa-arrow-up-right-from-square"
                : "fa-chevron-right";
            const arrowIcon = `<i class="fa-solid ${iconClass} menu-item-arrow ${item.url ? "external" : ""}"></i>`;

            itemsHTML += `
                <button class="menu-item" id="${item.id}" data-index="${itemIndex}"${urlAttr} style="animation-delay: ${itemIndex * 35}ms">
                    <div class="menu-item-icon">
                        <i class="fa-solid ${item.icon}"></i>
                    </div>
                    <span class="menu-item-label">${item.label}</span>
                    ${arrowIcon}
                </button>
            `;
            itemIndex++;
        });
    });

    panel.innerHTML = `
        <div class="menu-head">
            <div class="menu-head-title">Mount Zion School - CBSE</div>
            <div class="menu-head-sub">Explore the virtual tour</div>
            <button class="menu-close-btn" id="menu_close" aria-label="Close Menu"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="menu-items">
            ${itemsHTML}
        </div>
        <div class="menu-footer">
            <div class="menu-footer-dot"></div>
            <span class="menu-footer-text">Virtual Tour is Live</span>
        </div>
    `;
    document.body.appendChild(panel);

    // ─── Events ─────────────────────────────────────────────────
    let isOpen = false;

    // ── AI-callable global API ───────────────────────────────────
    window.isMenuOpen = function() {
        return typeof isOpen !== 'undefined' ? isOpen : false;
    };
    window.openMenu = function () {
        if (!window.isMenuOpen()) {
            isOpen = true;
            toggleBtn.classList.add('open');
            panel.classList.add('open');
            toggleBtn.querySelector('i').classList.replace('fa-bars', 'fa-xmark');
            return true;
        }
        return false;
    };
    window.closeMenu = function () {
        if (window.isMenuOpen()) {
            isOpen = false;
            toggleBtn.classList.remove('open');
            panel.classList.remove('open');
            toggleBtn.querySelector('i').classList.replace('fa-xmark', 'fa-bars');
            return true;
        }
        return false;
    };

    toggleBtn.addEventListener("click", () => {
        isOpen = !isOpen;
        toggleBtn.classList.toggle("open", isOpen);
        panel.classList.toggle("open", isOpen);
        const icon = toggleBtn.querySelector("i");
        icon.classList.toggle("fa-bars", !isOpen);
        icon.classList.toggle("fa-xmark", isOpen);
    });

    // Explicit Close Button
    const explicitCloseBtn = document.getElementById("menu_close");
    explicitCloseBtn.addEventListener("click", () => {
        isOpen = false;
        toggleBtn.classList.remove("open");
        panel.classList.remove("open");
        const icon = toggleBtn.querySelector("i");
        icon.classList.replace("fa-xmark", "fa-bars");
    });

    // Close when clicking outside (Ignoring Components)
    document.addEventListener("click", (e) => {
        // Exceptions: Don't close if clicking inside these components
        if (
            e.target.closest(".contact-overlay") ||
            e.target.closest(".gsv-overlay") || // GSV Explore
            e.target.closest(".pano-modal") || // Panolist Modal
            e.target.closest("#pano-backdrop") || // Panolist Backdrop
            e.target.closest(".search-card") || // Search Modal
            e.target.closest("#search-backdrop") || // Search Backdrop
            e.target.closest(".gsv-action-backdrop") // GSV Action Box
        ) {
            return;
        }

        const isClickInsideMenu =
            panel.contains(e.target) || toggleBtn.contains(e.target);

        if (isOpen && !isClickInsideMenu) {
            isOpen = false;
            toggleBtn.classList.remove("open");
            panel.classList.remove("open");
            const icon = toggleBtn.querySelector("i");
            icon.classList.replace("fa-xmark", "fa-bars");
        }
    });

    // Menu item click
    const items = panel.querySelectorAll(".menu-item");
    items.forEach((item) => {
        item.addEventListener("click", () => {
            // Check if it's a Link or Action vs Component
            const isLink = !!item.dataset.url;
            const isAction = item.id === "menu-fullscreen" || item.id === "menu-home";
            // Treat actions like links for highlight purposes (Flash only)
            const shouldFlash = isLink || isAction;

            if (shouldFlash) {
                // Flash highlight (Toggle visual only)
                item.classList.add("active");
                setTimeout(() => item.classList.remove("active"), 300);
            } else {
                // Components (Explore, Contact, etc.) -> Persistent Active State
                items.forEach((i) => i.classList.remove("active"));
                item.classList.add("active");
            }

            // Handle External URLs
            if (item.dataset.url) {
                window.open(item.dataset.url, "_blank");
                if (window.innerWidth <= 480) {
                    // close menu on mobile
                    isOpen = false;
                    toggleBtn.classList.remove("open");
                    panel.classList.remove("open");
                    const icon = toggleBtn.querySelector("i");
                    icon.classList.replace("fa-xmark", "fa-bars");
                }
                return;
            }

            const event = new CustomEvent("menuItemClick", {
                detail: {
                    id: item.id,
                    label: item.querySelector(".menu-item-label").textContent,
                },
            });
            document.dispatchEvent(event);

            // Fullscreen Toggle
            if (item.id === "menu-fullscreen") {
                if (!document.fullscreenElement) {
                    document.documentElement
                        .requestFullscreen()
                        .catch((e) => console.log(e));
                } else {
                    if (document.exitFullscreen) {
                        document.exitFullscreen();
                    }
                }
            }

            // Auto-close menu on mobile, but NOT for search or GSV (overlays)
            if (
                window.innerWidth <= 480 &&
                item.id !== "menu-search" &&
                item.id !== "menu-street-view"
            ) {
                isOpen = false;
                toggleBtn.classList.remove("open");
                panel.classList.remove("open");
                const icon = toggleBtn.querySelector("i");
                icon.classList.replace("fa-xmark", "fa-bars");
            }
        });
    });

    // Listen for Deactivation (from components)
    document.addEventListener("menuItemDeactivate", (e) => {
        if (e.detail && e.detail.id) {
            const item = document.getElementById(e.detail.id);
            if (item) item.classList.remove("active");
        }
    });
})();
