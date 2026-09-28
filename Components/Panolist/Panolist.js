(async function () {
  // Satoshi font loaded globally by component.js

  // ---- Icons as SVG ----
  const icons = {
    close: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    search: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16.5 16.5L13.5834 13.5833M15.6667 8.58333C15.6667 12.4954 12.4954 15.6667 8.58333 15.6667C4.67132 15.6667 1.5 12.4954 1.5 8.58333C1.5 4.67132 4.67132 1.5 8.58333 1.5C12.4954 1.5 15.6667 4.67132 15.6667 8.58333Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    panorama: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.8333 2.33333V11.6667C12.8333 12.1269 12.4602 12.5 12 12.5H2C1.53976 12.5 1.16667 12.1269 1.16667 11.6667V2.33333C1.16667 1.8731 1.53976 1.5 2 1.5H12C12.4602 1.5 12.8333 1.8731 12.8333 2.33333Z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M1.5 9L4.5 6L7 8.5L9.5 6L12.5 9" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    error: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 6.66667V10M10 13.3333H10.0083M18.3333 10C18.3333 14.6024 14.6024 18.3333 10 18.3333C5.39763 18.3333 1.66667 14.6024 1.66667 10C1.66667 5.39763 5.39763 1.66667 10 1.66667C14.6024 1.66667 18.3333 5.39763 18.3333 10Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`
  };

  // ---- Enhanced Styles matching Premium Navy Theme ----
  const styleId = 'pano-lines-styles'; // Renamed to ensure fresh injection if needed
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
    /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
       PANOLIST MODAL â€" Premium Navy Theme
       Matching Explore, Search, Contact
       â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

    #pano-modal-container {
      display: none !important;
      font-family: 'Satoshi', sans-serif !important;
    }
    
    #pano-modal-container.show {
      display: flex !important;
    }
    
    /* Backdrop Overlay */
    #pano-backdrop {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(30, 58, 95, 0.4);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        z-index: 100000;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.35s ease;
    }
    #pano-backdrop.show {
        opacity: 1;
        pointer-events: auto;
    }
    
    /* Main Modal */
    .pano-modal {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.96);
      z-index: 100001;
      width: 420px;
      max-width: 90vw;
      max-height: 85vh;
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
    }

    #pano-modal-container.show .pano-modal {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
    
    /* Header */
    .pano-header {
      padding: 20px 24px 16px;
      background: linear-gradient(135deg, #2F5E8E 0%, #1E3A5F 100%);
      position: relative;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
    }
    .pano-header::after {
        content: '';
        position: absolute;
        bottom: 0; left: 0; right: 0;
        height: 3px;
        background: linear-gradient(90deg, #96C0E6, #2E8B57, #F47C20);
    }
    
    .pano-header-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .pano-icon-box {
        width: 40px; height: 40px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #FFF;
        font-size: 18px;
    }
    
    .pano-header-text {
      display: flex;
      flex-direction: column;
    }
    
    .pano-title {
      margin: 0;
      font-size: 18px;
      font-weight: 800;
      color: #FFFFFF;
      letter-spacing: -0.01em;
    }
    
    .pano-subtitle {
      margin: 2px 0 0 0;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.6);
      font-weight: 500;
    }
    
    /* Close Button */
    .pano-close {
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
    .pano-close:hover {
        background: rgba(255,255,255,0.2);
        color: #fff;
        transform: rotate(90deg);
    }

    /* Body Wrapper */
    .pano-body {
        padding: 20px 24px;
        background: #F8FAFC;
        display: flex;
        flex-direction: column;
        flex: 1;
        overflow: hidden;
    }

    /* Search Input */
    .pano-search-wrapper {
      position: relative;
      margin-bottom: 16px;
      flex-shrink: 0;
    }
    
    .pano-search-input {
      width: 100%;
      padding: 14px 16px 14px 44px;
      border: 2px solid #E2E8F0;
      border-radius: 14px;
      font-family: 'Satoshi', sans-serif;
      font-size: 15px;
      font-weight: 500;
      color: #0F172A;
      background: #FFFFFF;
      transition: all 0.2s;
      outline: none;
      box-sizing: border-box;
    }
    
    .pano-search-input:focus {
      border-color: #96C0E6;
      box-shadow: 0 0 0 3px rgba(150, 192, 230, 0.15);
    }
    
    .pano-search-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: #94A3B8;
      pointer-events: none;
      display: flex;
      transition: color 0.2s;
    }
    .pano-search-input:focus + .pano-search-icon {
        color: #96C0E6;
    }
    
    /* Content Area */
    .pano-list-wrapper {
      flex: 1;
      overflow-y: auto;
      padding-right: 4px; 
    }
    
    .pano-list-wrapper::-webkit-scrollbar { width: 3px; }
    .pano-list-wrapper::-webkit-scrollbar-track { background: transparent; }
    .pano-list-wrapper::-webkit-scrollbar-thumb {
        background: rgba(47, 94, 142, 0.12);
        border-radius: 100px;
    }
    
    /* List Items */
    .pano-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .pano-item {
      background: #FFFFFF;
      border: 1px solid #F1F5F9;
      border-radius: 14px;
      padding: 12px 14px;
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
      overflow: hidden;
    }
    
    .pano-item:hover, .pano-item.selected {
        border-color: #96C0E6;
        box-shadow: 0 4px 12px rgba(150, 192, 230, 0.1);
        z-index: 1;
        background: #FFFFFF;
    }
    
    .pano-item::before {
         content: '';
         position: absolute;
         top: 0; bottom: 0; left: 0; width: 3px;
         background: transparent;
         transition: background 0.2s;
    }
    .pano-item:hover::before, .pano-item.selected::before {
        background: #96C0E6;
    }
    
    .pano-thumb-box {
        width: 48px; height: 48px;
        border-radius: 10px;
        background: #F1F5F9;
        color: #64748B;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        overflow: hidden;
        border: 1px solid #E2E8F0;
        transition: all 0.2s;
    }

    /* Highlight Thumb/Icon on Hover/Select */
    .pano-item:hover .pano-thumb-box, .pano-item.selected .pano-thumb-box {
        border-color: #96C0E6;
        color: #96C0E6;
    }
    
    /* If it's an icon inside, adjust color */
    .pano-item:hover .pano-thumb-box i, .pano-item.selected .pano-thumb-box i {
        color: #96C0E6;
    }
    .pano-thumb-img {
      width: 100%; height: 100%;
      object-fit: cover;
      display: block;
    }

    .pano-item-content {
      flex: 1;
      min-width: 0;
    }
    
    .pano-item-title {
      margin: 0;
      font-size: 14px;
      font-weight: 700;
      color: #0F172A;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .pano-item-subtitle {
      margin: 2px 0 0 0;
      font-size: 11px;
      color: #64748B;
      font-weight: 500;
    }

    .highlight-text {
        color: #96C0E6;
        font-weight: 800;
        background: rgba(150, 192, 230, 0.1);
        padding: 0 2px;
        border-radius: 4px;
    }

    /* Footer */
    .pano-footer {
        padding: 12px 24px;
        border-top: 1px solid #F0F4F8;
        background: #FFFFFF;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        flex-shrink: 0;
    }
    .footer-left {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .footer-dot {
        width: 6px; height: 6px;
        border-radius: 50%;
        background: #2E8B57;
        box-shadow: 0 0 6px rgba(46, 139, 87, 0.4);
        animation: pulse 2s infinite;
    }
    .footer-text {
        font-size: 11px;
        color: #64748B;
        font-weight: 600;
    }
    .keyboard-hint {
        font-size: 10px;
        color: #94A3B8;
        background: #F1F5F9;
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 4px;
    }

    /* -- Skeleton Loading -- */
    .pano-loading-sk {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 0;
        margin: 0;
        list-style: none;
    }
    .pano-item-sk {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 14px;
        background: #FFFFFF;
        border: 1px solid #F1F5F9;
        border-radius: 14px;
    }
    .sk-pulse {
        background: linear-gradient(90deg, #F1F5F9 0%, #E2E8F0 50%, #F1F5F9 100%);
        background-size: 200% 100%;
        animation: sk-shimmer 1.5s infinite;
        border-radius: 8px;
    }
    @keyframes sk-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    
    .sk-box { width: 48px; height: 48px; border-radius: 10px; flex-shrink: 0; }
    .sk-content { flex: 1; display: flex; flex-direction: column; gap: 6px; }
    .sk-text-1 { height: 14px; width: 60%; border-radius: 4px; }
    .sk-text-2 { height: 10px; width: 40%; border-radius: 4px; }

    /* Loading / Error / Empty */
    .pano-status-msg {
      padding: 40px 20px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      color: #94A3B8;
    }

    /* Mobile */
    @media (max-width: 480px) {
      .pano-modal {
        width: 100%;
        height: 100%;
        max-width: 100vw;
        max-height: 100vh;
        top: 0; left: 0;
        transform: none !important;
        border-radius: 0;
      }
      .keyboard-hint { display: none; }
    }
    `;
    document.head.appendChild(style);
  }

  // ---- DOM Structure ----
  // Remove if exists
  const existing = document.getElementById('pano-modal-container');
  if (existing) existing.remove();

  const container = document.createElement('div');
  container.id = 'pano-modal-container';

  // Backdrop
  const backdrop = document.createElement("div");
  backdrop.id = "pano-backdrop";
  container.appendChild(backdrop);

  // Modal
  const modal = document.createElement("div");
  modal.className = "pano-modal";
  modal.innerHTML = `
      <div class="pano-header">
        <div class="pano-header-content">
          <div class="pano-icon-box"><i class="fa-solid fa-panorama"></i></div>
          <div class="pano-header-text">
            <h3 class="pano-title">Panorama List</h3>
            <p class="pano-subtitle">Select a view to explore</p>
          </div>
        </div>
        <button class="pano-close" id="pano-close-btn" aria-label="Close">
          ${icons.close}
        </button>
      </div>
      
      <div class="pano-body">
          <div class="pano-search-wrapper">
              <input type="text" class="pano-search-input" placeholder="Search panoramas..." id="pano-search-input" />
              <div class="pano-search-icon">${icons.search}</div>
          </div>
          
          <div class="pano-list-wrapper" id="pano-list-wrapper">
              <ul class="pano-loading-sk" id="pano-skeleton">
                  ${Array(6).fill(0).map(() => `
                  <li class="pano-item-sk">
                      <div class="sk-pulse sk-box"></div>
                      <div class="sk-content">
                          <div class="sk-pulse sk-text-1"></div>
                          <div class="sk-pulse sk-text-2"></div>
                      </div>
                  </li>`).join('')}
              </ul>
          </div>
      </div>
      
      <div class="pano-footer">
          <div class="footer-left">
              <div class="footer-dot"></div>
              <span class="footer-text">Live Gallery</span>
          </div>
          <div class="keyboard-hint">
              <span>Esc</span> to close
          </div>
      </div>
    `;

  container.appendChild(modal);
  document.body.appendChild(container);

  // ---- Functionality ----
  const searchInput = document.getElementById('pano-search-input');
  const contentArea = document.getElementById('pano-list-wrapper');

  window.togglePanoList = function () {
    const isOpen = container.classList.contains('show');
    if (!isOpen) {
      container.classList.add('show');
      backdrop.classList.add('show');
      document.dispatchEvent(new CustomEvent('panoramaActive'));
      setTimeout(() => { if (searchInput) searchInput.focus(); }, 100);
    } else {
      container.classList.remove('show');
      backdrop.classList.remove('show');
      document.dispatchEvent(new CustomEvent('panoramaDeactive'));
      document.dispatchEvent(new CustomEvent('menuItemDeactivate', { detail: { id: 'menu-panorama' } }));

      // Reset search on close
      if (searchInput) searchInput.value = '';
      // Ideally re-render full list here if filtered, logic below handles renders
    }
  };

  // Close logic
  document.getElementById('pano-close-btn').addEventListener('click', () => window.togglePanoList());
  backdrop.addEventListener('click', () => window.togglePanoList());

  // Listen for Menu Click
  document.addEventListener('menuItemClick', (e) => {
    if (e.detail && e.detail.id === 'menu-panorama') {
      window.togglePanoList();
    }
  });

  // Shortcut
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "p") {
      e.preventDefault();
      window.togglePanoList();
    }
    if (e.key === 'Escape' && container.classList.contains('show')) {
      window.togglePanoList();
    }
  });

  // ---- Data Logic ----
  let allPanoramas = [];
  let selectedIndex = -1;

  function renderList(items, query = "") {
    contentArea.innerHTML = '';
    if (!items || items.length === 0) {
      contentArea.innerHTML = `<div class="pano-status-msg"><div>No panoramas found</div></div>`;
      return;
    }

    const ul = document.createElement('ul');
    ul.className = 'pano-list';

    items.forEach((pano, idx) => {
      const li = document.createElement('li');
      li.className = 'pano-item';
      li.dataset.index = idx;

      // Highlight (escape special regex chars)
      const escaped = query ? query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';
      const labelHtml = query ? pano.label.replace(new RegExp(`(${escaped})`, 'gi'), '<span class="highlight-text">$1</span>') : pano.label;

      // Thumbnail or Icon
      const thumbHtml = pano.thumb
        ? `<img src="${pano.thumb}" class="pano-thumb-img" loading="lazy" onerror="this.parentNode.innerHTML='<i class=\\'fa-solid fa-panorama\\'></i>'"/>`
        : `<i class="fa-solid fa-panorama"></i>`;

      li.innerHTML = `
                <div class="pano-thumb-box">${thumbHtml}</div>
                <div class="pano-item-content">
                    <h4 class="pano-item-title">${labelHtml}</h4>
                    <p class="pano-item-subtitle">Panorama</p>
                </div>
                <i class="fa-solid fa-chevron-right" style="font-size: 10px; color: #CBD5E1;"></i>
            `;

      li.addEventListener('click', () => {
        window.togglePanoList();
        if (window.tour && typeof pano.playlistIndex === 'number' && window.tour.setMediaByIndex) {
          window.tour.setMediaByIndex(pano.playlistIndex);
        } else if (window.tour && window.tour.setMediaByName) {
          window.tour.setMediaByName(pano.label);
        }
      });

      ul.appendChild(li);
    });

    contentArea.appendChild(ul);
  }

  // Search & Filter
  searchInput.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    const filtered = q === '' ? allPanoramas : allPanoramas.filter(p => p.label.toLowerCase().includes(q));
    renderList(filtered, q);
  });

  // --- Build panorama list dynamically from 3DVista API ---
  function loadData() {
    try {
      // Wait for 3DVista Player to mount to the window
      if (!window.tour || !window.tour.player || !window.tour.player.getById('mainPlayList')) {
        setTimeout(loadData, 500); // Poll every 500ms until the engine is ready
        return;
      }

      // Extract the exact active playlist order defined inside the 3DVista project
      const rawItems = window.tour.player.getById('mainPlayList').get('items');

      allPanoramas = rawItems.map((item, idx) => {
        const media = item.get('media');
        const id = media.get('id');
        const label = media.get('data') && media.get('data').label ? media.get('data').label : "Panorama " + (idx + 1);

        return {
          id: id,
          label: label,
          playlistIndex: idx, // CRITICAL: This is the exact integer index passed to setMediaByIndex
          thumb: id.startsWith('panorama_') ? `media/${id}_t.webp` : `media/panorama_${id}_t.webp`
        };
      });

      renderList(allPanoramas);
    } catch (err) {
      console.error("[Panolist] Failed to dynamically extract panoramas:", err);
      contentArea.innerHTML = `<div class="pano-status-msg">Could not load panoramas</div>`;
    }
  }

  loadData();

})();
