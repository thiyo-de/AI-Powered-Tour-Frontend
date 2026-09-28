// Thiagarajar College Logo Component
const montfortLogo = (function () {
    // Create styles
    const style = document.createElement("style");
    style.textContent = `
        .montfort-logo-container {
            position: fixed;
            top: 24px;
            left: 24px;
            z-index: 10;
        }
        
        .logo-card {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            width: 180px;
            height: 160px;
            border-radius: 20px;
            position: relative;
            overflow: hidden;
            transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            animation: gentle-float 6s ease-in-out infinite;
            padding: 8px;
            box-sizing: border-box;
        }
        
        /* Glassmorphism Backdrop */
        .logo-card::before {
            content: '';
            position: absolute;
            inset: 0;
            background: rgba(30, 58, 95, 0.75);
            backdrop-filter: blur(20px) saturate(180%);
            -webkit-backdrop-filter: blur(20px) saturate(180%);
            pointer-events: all;
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.12);
            box-shadow: 
                0 8px 32px rgba(30, 58, 95, 0.3),
                0 0 0 1px rgba(255, 255, 255, 0.05),
                inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }
        
        /* Shine Effect Layer */
        .logo-card::after {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 50%;
            height: 100%;
            background: linear-gradient(
                to right,
                transparent,
                rgba(255, 255, 255, 0.4),
                transparent
            );
            transform: skewX(-20deg);
            transition: left 0.75s ease-in-out;
            border-radius: 20px;
            pointer-events: none;
        }
        
        /* Subtle gradient overlay */
        .logo-card .overlay {
            position: absolute;
            inset: 0;
            background: linear-gradient(
                135deg,
                rgba(255, 255, 255, 0.1) 0%,
                rgba(255, 255, 255, 0.05) 50%,
                rgba(255, 255, 255, 0.1) 100%
            );
            border-radius: 20px;
            pointer-events: none;
            z-index: 1;
        }
        
        .logo-image {
            width: 100px;
            height: 100px;
            object-fit: contain;
            filter: brightness(1.05) contrast(1.1) saturate(1.1);
            transition: all 0.4s ease;
            position: relative;
            z-index: 2;
        }
        
        /* School Name Styling */
        .school-name {
            font-family: 'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-weight: 700;
            font-size: 11px;
            color: #FFFFFF;
            width: 100%;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            letter-spacing: 0.02em;
            line-height: 1.2;
            position: relative;
            z-index: 2;
            transition: all 0.3s ease;
            text-transform: uppercase;
        }
        
        .school-name-main {
            display: block;
            font-size: 12px;
            font-weight: 800;
            margin-bottom: 2px;
            color: #ffffff;
        }
        
         .school-name-sub {
            display: block;
            font-size: 9px;
            font-weight: 600;
            opacity: 0.9;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;
            color: #ffffff;
        }
        
        .school-name-location {
            display: block;
            font-size: 9px;
            font-weight: lighter;
            opacity: 0.9;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;
            color: #ffffff;
            margin-top: 1px;
            text-transform: uppercase;
        }
        
        /* Hover States */
        .logo-card:hover {
            transform: translateY(-2px) scale(1.02);
            animation-play-state: paused;
        }
        
        .logo-card:hover::before {
            background: rgba(30, 58, 95, 0.85);
            backdrop-filter: blur(25px) saturate(200%);
            -webkit-backdrop-filter: blur(25px) saturate(200%);
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 
                0 12px 40px rgba(30, 58, 95, 0.4),
                0 0 0 1px rgba(255, 255, 255, 0.08),
                inset 0 1px 0 rgba(255, 255, 255, 0.12);
        }
        
        /* Shine effect on hover */
        .logo-card:hover::after {
            left: 100%;
        }
        
        .logo-card:hover .logo-image {
            transform: scale(1.08);
            filter: brightness(1.15) contrast(1.2) saturate(1.2);
        }
        
        .logo-card:hover .school-name {
            transform: translateY(-1px);
        }
        
        .logo-card:hover .school-name-main {
            letter-spacing: 0.03em;
        }
        
        /* Active State */
        .logo-card:active {
            transform: translateY(0px) scale(1);
            transition-duration: 0.1s;
        }
        
        .logo-card:active::before {
            background: rgba(30, 58, 95, 0.95);
            backdrop-filter: blur(18px) saturate(170%);
            -webkit-backdrop-filter: blur(18px) saturate(170%);
        }
        
        /* Animations */
        @keyframes gentle-float {
            0%, 100% {
                transform: translateY(0px);
            }
            50% {
                transform: translateY(-4px);
            }
        }
        
        /* Hidden state */
        .montfort-logo-container.hidden {
            opacity: 0;
            visibility: hidden;
            transform: translateY(-150px);
            transition: opacity 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), visibility 0.5s ease, transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        
        /* Visible state */
        .montfort-logo-container.visible {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
            transition: opacity 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), visibility 0.5s ease, transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
            .montfort-logo-container {
                top: 20px;
                left: 20px;
            }
            
            .logo-card {
                width: 170px;
                height: 130px;
                border-radius: 18px;
                padding: 10px;

            }
            
            .logo-card::before {
                border-radius: 18px;
            }
            
            .logo-card::after {
                border-radius: 18px;
            }
            
            .logo-card .overlay {
                border-radius: 18px;
            }
            
            .logo-image {
                width: 85px;
                height: 85px;
                margin-bottom: -4px;
            }
            
            .school-name {
                font-size: 10px;
            }
            
            .school-name-main {
                font-size: 11px;
            }
            
            .school-name-sub {
                font-size: 8px;
            }
            
            .school-name-location {
                font-size: 8px;
            }
            
            @keyframes gentle-float {
                0%, 100% {
                    transform: translateY(0px);
                }
                50% {
                    transform: translateY(-3px);
                }
            }
        }
        
        @media (max-width: 480px) {
            .montfort-logo-container {
                top: 16px;
                left: 16px;
            }
            
            .logo-card {
                width: 145px;
                height: 110px;
                border-radius: 16px;
                padding: 8px;

            }
            
            .logo-card::before {
                border-radius: 16px;
                backdrop-filter: blur(16px) saturate(180%);
                -webkit-backdrop-filter: blur(16px) saturate(180%);
            }
            
            .logo-card::after {
                border-radius: 16px;
            }
            
            .logo-card .overlay {
                border-radius: 16px;
            }
            
            .logo-image {
                width: 70px;
                height: 70px;
                margin-bottom: -2px;
            }
            
            .school-name {
                font-size: 9px;
            }
            
            .school-name-main {
                font-size: 10px;
            }
            
            .school-name-sub {
                font-size: 7px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .school-name-location {
                font-size: 7px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
        }
        
        @media (max-width: 360px) {
            .montfort-logo-container {
                top: 12px;
                left: 12px;
            }
            
            .logo-card {
                width: 130px;
                height: 100px;
                border-radius: 14px;
                padding: 6px;
            }
            
            .logo-card::before,
            .logo-card::after,
            .logo-card .overlay {
                border-radius: 14px;
            }
            
            .logo-image {
                width: 60px;
                height: 60px;
            }
            
            .school-name-main {
                font-size: 9px;
            }
            
            .school-name-sub {
                font-size: 6.5px;
            }
            
            .school-name-location {
                font-size: 6.5px;
            }
        }
        
        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
            .logo-card {
                animation: none;
            }
            
            .logo-card::after {
                transition: none;
                animation: none;
            }
            
            .logo-card:hover {
                transform: none;
            }
            
            .logo-card:hover::after {
                left: -100%;
            }
            
            .logo-card:hover .logo-image {
                transform: none;
            }
            
            .logo-card:hover .school-name {
                transform: none;
            }
            
            .montfort-logo-container.hidden,
            .montfort-logo-container.visible {
                transition: none;
            }
        }
        
        /* Dark mode adjustments */
        @media (prefers-color-scheme: dark) {
            .logo-card::before {
                background: rgba(30, 58, 95, 0.75);
                border: 1px solid rgba(255, 255, 255, 0.12);
            }
            
            .logo-card:hover::before {
                background: rgba(30, 58, 95, 0.85);
            }
            
            .logo-card::after {
                background: linear-gradient(
                    to right,
                    transparent,
                    rgba(255, 255, 255, 0.3),
                    transparent
                );
            }
            
            .school-name {
                color: #D4E8F7;
            }
        }
    `;
    document.head.appendChild(style);

    // Create container — start hidden so it slides in from top
    const container = document.createElement("div");
    container.className = "montfort-logo-container hidden";

    // Create logo card
    const logoCard = document.createElement("div");
    logoCard.className = "logo-card";
    logoCard.setAttribute("role", "img");
    logoCard.setAttribute("aria-label", "Thiagarajar College Logo");
    logoCard.tabIndex = 0; // Make it focusable for accessibility

    // Create overlay div
    const overlay = document.createElement("div");
    overlay.className = "overlay";

    // Create image
    const img = document.createElement("img");
    img.className = "logo-image";
    img.src = "College-Logo.png";
    img.alt = "Thiagarajar College Logo";
    img.loading = "eager";

    // Create school name element
    const schoolName = document.createElement("div");
    schoolName.className = "school-name";

    const schoolNameMain = document.createElement("span");
    schoolNameMain.className = "school-name-main";
    schoolNameMain.textContent = "THIAGARAJAR";

    const schoolNameSub = document.createElement("span");
    schoolNameSub.className = "school-name-sub";
    schoolNameSub.textContent = "COLLEGE";

    const schoolNameLocation = document.createElement("span");
    schoolNameLocation.className = "school-name-location";
    schoolNameLocation.textContent = "Madurai";

    // Build structure
    schoolName.appendChild(schoolNameMain);
    schoolName.appendChild(schoolNameSub);
    schoolName.appendChild(schoolNameLocation);
    logoCard.appendChild(overlay);
    logoCard.appendChild(img);
    logoCard.appendChild(schoolName);
    container.appendChild(logoCard);
    document.body.appendChild(container);

    // Slide in from top after a brief delay
    setTimeout(function () {
        container.classList.remove('hidden');
        container.classList.add('visible');
    }, 200);

    // Add error handling for image
    img.onerror = function () {
        console.warn("Thiagarajar College logo image failed to load");
        const fallbackText = document.createElement("div");
        fallbackText.style.cssText = `
            position: relative;
            z-index: 2;
            color: #333;
            font-weight: 600;
            font-size: 14px;
            text-align: center;
            font-family: 'Satoshi', sans-serif;
            margin-bottom: 8px;
        `;
        fallbackText.textContent = "THIAGARAJAR";
        logoCard.insertBefore(fallbackText, schoolName);
    };

    // Store visibility state
    let isVisible = true;

    // Toggle function
    window.toggleLogo = function () {
        if (isVisible) {
            // Hide the logo
            container.classList.remove('visible');
            container.classList.add('hidden');
        } else {
            // Show the logo
            container.classList.remove('hidden');
            container.classList.add('visible');
        }
        isVisible = !isVisible;
    };

    // Optional: Add a showLogo() and hideLogo() functions for more control
    window.showLogo = function () {
        container.classList.remove('hidden');
        container.classList.add('visible');
        isVisible = true;
    };

    window.hideLogo = function () {
        container.classList.remove('visible');
        container.classList.add('hidden');
        isVisible = false;
    };

    // Return public API if needed
    return {
        toggle: window.toggleLogo,
        show: window.showLogo,
        hide: window.hideLogo,
        isVisible: () => isVisible
    };
})();