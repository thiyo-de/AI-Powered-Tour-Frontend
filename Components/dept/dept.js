(function () {
    const style = document.createElement('style');
    style.textContent = `
        /* ═════════════════════════════════════════════
           DEPARTMENTS COMPONENT
           Scrollable Grid Layout
           ═════════════════════════════════════════════ */

        .dept-overlay {
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
        .dept-overlay.active {
            opacity: 1;
            pointer-events: auto;
        }

        .dept-modal {
            width: 94%;
            max-width: 700px;
            height: auto;
            max-height: 90vh;
            background: #F8FAFC;
            border-radius: 20px;
            box-shadow:
                0 40px 80px rgba(30, 58, 95, 0.25),
                0 0 0 1px rgba(47, 94, 142, 0.05);
            padding: 0;
            transform: translateY(30px) scale(0.96);
            transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
            overflow: hidden;
            font-family: 'Satoshi', sans-serif;
            display: flex;
            flex-direction: column;
        }
        .dept-overlay.active .dept-modal {
            transform: translateY(0) scale(1);
        }

        .dept-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 22px 16px;
            background: linear-gradient(135deg, #2F5E8E 0%, #1E3A5F 100%);
            position: relative;
        }
        .dept-header::after {
            content: '';
            position: absolute;
            bottom: 0; left: 0; right: 0;
            height: 3px;
            background: linear-gradient(90deg, #96C0E6, #2E8B57, #F47C20);
        }
        .dept-title {
            font-size: 18px;
            font-weight: 800;
            color: #FFFFFF;
            display: flex;
            align-items: center;
            gap: 10px;
            letter-spacing: -0.3px;
        }
        .dept-close {
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
        .dept-close:hover {
            background: rgba(255, 255, 255, 0.2);
            color: #FFF;
            transform: rotate(90deg);
        }

        .dept-grid {
            padding: 24px 22px 30px;
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 16px;
            overflow-y: auto;
            scrollbar-width: thin; 
            scrollbar-color: #CBD5E1 transparent;
        }
        .dept-grid::-webkit-scrollbar { width: 4px; }
        .dept-grid::-webkit-scrollbar-track { background: transparent; }
        .dept-grid::-webkit-scrollbar-thumb { background: rgba(100, 116, 139, 0.2); border-radius: 10px; }

        .dept-card {
            background: #FFFFFF;
            border-radius: 16px;
            padding: 16px;
            color: #0F172A;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            border: 1px solid rgba(0,0,0,0.05);
            box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03);
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .dept-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
        }

        .dept-icon-box {
            width: 40px; height: 40px;
            border-radius: 12px;
            background: #F1F5F9;
            color: #2F5E8E;
            display: grid;
            place-items: center;
            font-size: 18px;
        }
        .dept-card:hover .dept-icon-box {
            background: #E2E8F0;
        }

        .dept-info-section {
            flex-grow: 1;
        }
        .dept-name {
            font-size: 14px;
            font-weight: 700;
            line-height: 1.3;
            margin-bottom: 4px;
        }

        .dept-actions {
            display: flex;
            gap: 8px;
            margin-top: auto;
        }
        
        .btn-dept {
            flex: 1;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s;
            text-decoration: none;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            border: none;
        }

        .btn-info {
            background: #F8FAFC;
            color: #475569;
            border: 1px solid #E2E8F0;
        }
        .btn-info:hover {
            background: #F1F5F9;
            color: #0F172A;
            border-color: #CBD5E1;
        }

        .btn-tour {
            background: linear-gradient(135deg, #2F5E8E 0%, #1E3A5F 100%);
            color: #FFFFFF;
        }
        .btn-tour:hover {
            box-shadow: 0 4px 12px rgba(47, 94, 142, 0.3);
            transform: translateY(-1px);
        }

        /* ═══════ Responsive ═══════ */
        @media (max-width: 768px) {
            .dept-modal {
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
            .dept-overlay.active .dept-modal {
                transform: translateY(0);
            }
            .dept-grid {
                grid-template-columns: 1fr 1fr;
            }
        }
        @media (max-width: 480px) {
            .dept-grid {
                grid-template-columns: 1fr;
                padding: 16px 16px 32px;
            }
        }
    `;
    document.head.appendChild(style);

    const departments = [
        { id: 26, name: "Business Administration", icon: "fa-briefcase" },
        { id: 14, name: "Biotechnology", icon: "fa-dna" },
        { id: 27, name: "Commerce", icon: "fa-chart-line" },
        { id: 28, name: "Commerce PA", icon: "fa-file-invoice-dollar" },
        { id: 30, name: "Commerce CA", icon: "fa-computer" },
        { id: 29, name: "Commerce Honors", icon: "fa-medal" },
        { id: 31, name: "Commerce Fintech", icon: "fa-coins" },
        { id: 13, name: "CA & IT", icon: "fa-microchip" },
        { id: 12, name: "Computer Science", icon: "fa-laptop-code" },
        { id: 34, name: "Chemistry", icon: "fa-flask" },
        { id: 19, name: "Economics", icon: "fa-money-bill-trend-up" },
        { id: 18, name: "English", icon: "fa-book-open" },
        { id: 32, name: "Mathematics", icon: "fa-calculator" },
        { id: 15, name: "Microbiology", icon: "fa-microscope" },
        { id: 33, name: "Physics", icon: "fa-atom" },
        { id: 16, name: "Psychology", icon: "fa-brain" },
        { id: 17, name: "Tamil", icon: "fa-language" }
    ];

    const overlay = document.createElement('div');
    overlay.className = 'dept-overlay';

    let cardsHTML = '';
    departments.forEach(dept => {
        cardsHTML += `
            <div class="dept-card">
                <div class="dept-icon-box">
                    <i class="fa-solid ${dept.icon}"></i>
                </div>
                <div class="dept-info-section">
                    <div class="dept-name">${dept.name}</div>
                </div>
                <div class="dept-actions">
                    <a href="https://www.tcarts.in/dept.php?id=${dept.id}" target="_blank" class="btn-dept btn-info">
                        <i class="fa-solid fa-circle-info"></i> Info
                    </a>
                    <button class="btn-dept btn-tour" onclick="triggerDeptTour('${dept.id}', '${dept.name}')">
                        <i class="fa-solid fa-person-walking"></i> Tour
                    </button>
                </div>
            </div>
        `;
    });

    overlay.innerHTML = `
        <div class="dept-modal">
            <div class="dept-header">
                <span class="dept-title"><i class="fa-solid fa-building-columns" style="color:#F47C20; margin-right:8px;"></i> Departments</span>
                <button class="dept-close"><i class="fa-solid fa-xmark"></i></button>
            </div>
            
            <div class="dept-grid">
                ${cardsHTML}
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    const closeBtn = overlay.querySelector('.dept-close');

    function openDept() { overlay.classList.add('active'); }
    function closeDept() {
        overlay.classList.remove('active');
        document.dispatchEvent(new CustomEvent('menuItemDeactivate', { detail: { id: 'menu-departments' } }));
    }

    // Global trigger for 3DVista integration
    window.triggerDeptTour = function(id, name) {
        closeDept();
        // Fire custom event so it can be picked up by main script or 3DVista
        const event = new CustomEvent("deptTourClick", {
            detail: { id: id, name: name }
        });
        document.dispatchEvent(event);
        console.log("Triggered tour for department ID:", id, name);
    };

    window.isDeptOpen = function() {
        return overlay.classList.contains('active');
    };
    window.openDeptPopup = function() {
        if (!window.isDeptOpen()) {
            openDept();
            return true;
        }
        return false;
    };
    window.closeDeptPopup = function() {
        if (window.isDeptOpen()) {
            closeDept();
            return true;
        }
        return false;
    };

    closeBtn.addEventListener('click', closeDept);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeDept();
    });

    document.addEventListener('menuItemClick', (e) => {
        if (e.detail && e.detail.id === 'menu-departments') {
            openDept();
        }
    });
})();
