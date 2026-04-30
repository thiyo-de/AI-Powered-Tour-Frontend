(function () {
    const style = document.createElement('style');
    style.textContent = `
        /* ═════════════════════════════════════════════
           CONTACT US — Bento Grid Layout
           Modern, dashboard-style grid of actions
           Standardized Navy Theme
           ═════════════════════════════════════════════ */

        .contact-overlay {
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(30, 58, 95, 0.4);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            z-index: 100001;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .contact-overlay.active {
            opacity: 1;
            pointer-events: auto;
        }

        .contact-modal {
            width: 94%;
            max-width: 500px;
            height: auto;
            max-height: 90vh;
            background: #F8FAFC;
            border-radius: 20px; /* Aligned with Menu */
            box-shadow:
                0 40px 80px rgba(30, 58, 95, 0.25),
                0 0 0 1px rgba(47, 94, 142, 0.05); /* Softer border */
            padding: 0;
            transform: translateY(30px) scale(0.96);
            transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
            overflow: hidden;
            font-family: 'Satoshi', sans-serif;
            display: flex;
            flex-direction: column;
        }
        .contact-overlay.active .contact-modal {
            transform: translateY(0) scale(1);
        }

        /* ── Header (Navy Theme) ───────────────────── */
        .contact-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 22px 16px; /* Custom Menu Padding */
            background: linear-gradient(135deg, #2F5E8E 0%, #1E3A5F 100%);
            position: relative;
        }
        .contact-header::after {
            content: '';
            position: absolute;
            bottom: 0; left: 0; right: 0;
            height: 3px;
            background: linear-gradient(90deg, #96C0E6, #2E8B57, #F47C20);
        }
        .contact-title {
            font-size: 18px;
            font-weight: 800;
            color: #FFFFFF;
            display: flex;
            align-items: center;
            gap: 10px;
            letter-spacing: -0.3px;
        }
        .contact-close {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.15);
            color: rgba(255, 255, 255, 0.7);
            width: 32px; height: 32px;
            border-radius: 50%;
            cursor: pointer;
            display: grid;
            place-items: center;
            transition: all 0.2s;
            font-size: 13px;
        }
        .contact-close:hover {
            background: rgba(255, 255, 255, 0.2);
            color: #FFF;
            transform: rotate(90deg);
        }

        /* ── Bento Grid ────────────────────────────── */
        .contact-grid {
            padding: 24px 22px 30px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            overflow-y: auto;
            /* Hide Scrollbar */
            scrollbar-width: thin; 
            scrollbar-color: #CBD5E1 transparent;
        }
        .contact-grid::-webkit-scrollbar { width: 4px; }
        .contact-grid::-webkit-scrollbar-track { background: transparent; }
        .contact-grid::-webkit-scrollbar-thumb { background: rgba(100, 116, 139, 0.2); border-radius: 10px; }

        /* Grid Items */
        .bento-card {
            background: #FFFFFF;
            border-radius: 16px;
            padding: 16px;
            text-decoration: none;
            color: #0F172A;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            border: 1px solid rgba(255,255,255,0.8);
            box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03);
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }
        .bento-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
            z-index: 2;
        }
        .bento-card:active { transform: scale(0.98); }

        /* Full Width Items */
        .bento-wide { grid-column: span 2; }

        /* WhatsApp (Hero) */
        .bento-whatsapp {
            background: linear-gradient(135deg, #25D366, #128C7E);
            color: #FFFFFF;
            padding: 20px;
            flex-direction: row;
            align-items: center;
            gap: 16px;
            min-height: 80px;
        }
        .bento-whatsapp .icon-box {
            background: rgba(255,255,255,0.2);
            color: #FFF;
        }
        .bento-wa-title { font-size: 18px; font-weight: 800; display: block; }
        .bento-wa-sub { font-size: 13px; opacity: 0.9; margin-top: 2px; display: block; font-weight: 500;}

        /* Standard Card Content */
        .icon-box {
            width: 42px; height: 42px;
            border-radius: 12px;
            display: grid;
            place-items: center;
            font-size: 18px;
            margin-bottom: 12px;
            transition: transform 0.3s;
        }
        .bento-card:hover .icon-box { transform: scale(1.1) rotate(-5deg); }
        
        .bento-label {
            font-size: 11px;
            color: #64748B;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 4px;
            display: block;
        }
        .bento-value {
            font-size: 15px;
            color: #0F172A;
            font-weight: 700;
            line-height: 1.3;
        }
        
        /* Styles per type */
        .card-phone .icon-box { background: #E0F2FE; color: #0284C7; }
        .card-phone:hover { border-color: #BAE6FD; }

        .card-donate .icon-box { background: #FEF3C7; color: #D97706; }
        .card-donate:hover { border-color: #FDE68A; }

        .card-mail .icon-box { background: #F3E8FF; color: #7C3AED; }
        .card-mail:hover { border-color: #E9D5FF; }

        .card-location .icon-box { background: #F1F5F9; color: #475569; }
        
        .card-web .icon-box { background: #DCFCE7; color: #16A34A; }

        /* Email List */
        .bento-emails {
            gap: 10px;
            justify-content: flex-start;
        }
        .email-row {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px;
            background: #F8FAFC;
            border-radius: 10px;
            font-size: 13px;
            color: #334155;
            font-weight: 500;
            text-decoration: none;
            transition: background 0.2s;
            overflow: hidden; /* Safety */
            min-width: 0; /* CRITICAL: Allows grid item to shrink below content size */
        }
        .email-row:hover { background: #F1F5F9; color: #0F172A; }
        .email-row i { color: #94A3B8; font-size: 12px; transition: color 0.2s; flex-shrink: 0; }
        .email-row:hover i { color: #7C3AED; }
        .email-text {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            min-width: 0;
            flex: 1; /* Ensure text takes available space */
        }

        /* ═══════ Responsive ═══════ */

        /* Tablet / Small Desktop */
        @media (max-width: 768px) {
            .contact-modal {
                width: 100%;
                max-width: 100%;
                height: auto;
                max-height: 85vh;
                border-radius: 24px 24px 0 0;
                position: absolute;
                bottom: 0;
                transform: translateY(100%);
                padding-bottom: env(safe-area-inset-bottom);
            }
            .contact-overlay.active .contact-modal {
                transform: translateY(0);
            }
            .contact-header { padding: 20px 24px; }
            .contact-grid { 
                padding: 24px 24px 40px; 
                grid-template-columns: 1fr 1fr; 
                gap: 12px;
            }
            .mobile-wide { grid-column: span 2; }
            
            .bento-card { padding: 16px; }
            .icon-box { width: 36px; height: 36px; font-size: 16px; }
            .bento-value { font-size: 14px; }
        }

        /* Standard Mobile */
        @media (max-width: 480px) {
            .contact-modal {
                max-height: 80vh;
                border-radius: 20px 20px 0 0;
            }
            .contact-header {
                padding: 16px 18px 14px;
            }
            .contact-title {
                font-size: 16px;
            }
            .contact-grid {
                padding: 16px 16px 32px;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
            }
            .bento-card {
                padding: 14px;
                border-radius: 14px;
            }
            .icon-box {
                width: 34px; height: 34px;
                font-size: 15px;
                border-radius: 10px;
                margin-bottom: 10px;
            }
            .bento-label { font-size: 10px; letter-spacing: 0.6px; }
            .bento-value { font-size: 13px; }
            .bento-wa-title { font-size: 15px; }
            .bento-wa-sub { font-size: 11px; }
            .bento-whatsapp { padding: 16px; min-height: 60px; gap: 12px; }
            .email-row { font-size: 12px; padding: 7px; }
        }

        /* Ultra-small phones */
        @media (max-width: 380px) {
            .contact-grid {
                grid-template-columns: 1fr;
                gap: 8px;
                padding: 14px 14px 28px;
            }
            .mobile-wide, .bento-wide { grid-column: span 1; }
            .bento-card {
                flex-direction: row;
                align-items: center;
                gap: 14px;
                text-align: left;
                padding: 14px;
            }
            .icon-box { margin-bottom: 0; flex-shrink: 0; }
            .bento-whatsapp {
                flex-direction: row;
                align-items: center;
            }
            .card-mail.bento-wide {
                flex-direction: column;
                align-items: stretch;
            }
            .card-mail .bento-label { margin-bottom: 8px; }
            .bento-label { font-size: 10px; }
            .bento-value { font-size: 13px; }
        }
    `;
    document.head.appendChild(style);

    const overlay = document.createElement('div');
    overlay.className = 'contact-overlay';

    // HTML Structure
    overlay.innerHTML = `
        <div class="contact-modal">
            <div class="contact-header">
                <span class="contact-title"><i class="fa-solid fa-address-book" style="color:#2E8B57; margin-right:8px;"></i> Contact Us</span>
                <button class="contact-close"><i class="fa-solid fa-xmark"></i></button>
            </div>
            
            <div class="contact-grid">
                <!-- Phone (Hero) -->
                <a href="tel:+917373751513" class="bento-card bento-wide bento-whatsapp mobile-wide" style="background: linear-gradient(135deg, #2F5E8E, #1E3A5F);">
                    <div class="icon-box"><i class="fa-solid fa-phone"></i></div>
                    <div>
                        <span class="bento-wa-title">Call Us</span>
                        <span class="bento-wa-sub">+91-73737-51513</span>
                    </div>
                </a>

                <!-- Email -->
                <a href="mailto:cbse@mountzionschools.com" class="bento-card card-mail">
                    <div class="icon-box"><i class="fa-solid fa-envelope"></i></div>
                    <div>
                        <span class="bento-label">Email</span>
                        <span class="bento-value" style="font-size:12px;">cbse@mountzionschools.com</span>
                    </div>
                </a>

                <!-- Facebook -->
                <a href="https://www.facebook.com/mountzioninternationalschool" target="_blank" class="bento-card card-web">
                    <div class="icon-box" style="background:#E7F0FE; color:#1877F2;"><i class="fa-brands fa-facebook-f"></i></div>
                    <div>
                        <span class="bento-label">Facebook</span>
                        <span class="bento-value">Follow Us</span>
                    </div>
                </a>

                <!-- Address (Wide) -->
                <div class="bento-card bento-wide card-location mobile-wide">
                    <div class="icon-box"><i class="fa-solid fa-location-dot"></i></div>
                    <div>
                        <span class="bento-label">Address</span>
                        <span class="bento-value" style="font-size:13px; line-height:1.4;">Lena Villaku, Pillivalam Post, Pudukkottai</span>
                    </div>
                </div>

            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    const closeBtn = overlay.querySelector('.contact-close');

    function openContact() { overlay.classList.add('active'); }
    function closeContact() {
        overlay.classList.remove('active');
        document.dispatchEvent(new CustomEvent('menuItemDeactivate', { detail: { id: 'menu-contact' } }));
    }

    // ── AI-callable global API ────────────────────────────────────
    window.isContactOpen = function() {
        return overlay.classList.contains('active');
    };
    window.openContact = function() {
        if (!window.isContactOpen()) {
            openContact();
            return true;
        }
        return false;
    };
    window.closeContact = function() {
        if (window.isContactOpen()) {
            closeContact();
            return true;
        }
        return false;
    };

    closeBtn.addEventListener('click', closeContact);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeContact();
    });

    document.addEventListener('menuItemClick', (e) => {
        if (e.detail && e.detail.id === 'menu-contact') {
            openContact();
        }
    });
})();
