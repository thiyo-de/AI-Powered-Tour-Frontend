(async function () {
  // Satoshi font loaded globally by component.js

  // Common Styles (FontAwesome already loaded in index)
  const style = document.createElement("style");
  style.textContent = `
    /* ═════════════════════════════════════════════
       SEARCH COMPONENT — Premium Navy Theme
       Matches Menu/Language Style
       ═════════════════════════════════════════════ */
    
    #search-backdrop {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(30, 58, 95, 0.4);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        z-index: 100001;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.35s ease;
    }
    #search-backdrop.show {
        opacity: 1;
        pointer-events: auto;
    }

    #container_search {
        display: none !important;
        opacity: 0;
        transform: translateY(10px) scale(0.96);
        transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        font-family: 'Satoshi', sans-serif !important;
    }
    #container_search.show {
        display: flex !important;
        opacity: 1;
        transform: translateY(0) scale(1);
    }
    
    /* ── Main Container ── */
    .search-card {
        position: fixed;
        top: 24px;
        right: 24px;
        width: 360px;
        max-width: calc(100vw - 48px);
        max-height: calc(100vh - 120px);
        background: #FFFFFF;
        border-radius: 24px;
        box-shadow: 
            0 20px 60px rgba(30, 58, 95, 0.25),
            0 0 0 1px rgba(47, 94, 142, 0.05);
        z-index: 100002;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    /* ── Header ── */
    .search-header {
        padding: 20px 24px 16px;
        background: linear-gradient(135deg, #2F5E8E 0%, #1E3A5F 100%);
        position: relative;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-shrink: 0;
    }
    .search-header::after {
        content: '';
        position: absolute;
        bottom: 0; left: 0; right: 0;
        height: 3px;
        background: linear-gradient(90deg, #96C0E6, #2E8B57, #F47C20);
    }
    .search-title {
        font-size: 18px;
        font-weight: 800;
        color: #FFFFFF;
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    /* Close Button */
    .search-close {
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
    .search-close:hover {
        background: rgba(255,255,255,0.2);
        color: #fff;
        transform: rotate(90deg);
    }

    /* ── Body ── */
    .search-body {
        padding: 20px 24px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        flex: 1;
        background: #F8FAFC;
    }

    /* Input Field */
    .search-input-wrapper {
        position: relative;
        margin-bottom: 16px;
        flex-shrink: 0;
    }
    .search-input {
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
        box-sizing: border-box;
        outline: none;
    }
    .search-input:focus {
        border-color: #96C0E6;
        box-shadow: 0 0 0 3px rgba(150, 192, 230, 0.15);
    }
    .search-icon-overlay {
        position: absolute;
        left: 14px;
        top: 50%;
        transform: translateY(-50%);
        color: #94A3B8;
        font-size: 16px;
        pointer-events: none;
        transition: color 0.2s;
    }
    .search-input:focus + .search-icon-overlay {
        color: #96C0E6;
    }

    /* Results List */
    .search-results {
        list-style: none;
        padding: 0;
        margin: 0;
        overflow-y: auto;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding-right: 4px; /* Space for scrollbar */
    }
    
    /* Scrollbar */
    .search-results::-webkit-scrollbar { width: 3px; }
    .search-results::-webkit-scrollbar-track { background: transparent; }
    .search-results::-webkit-scrollbar-thumb {
        background: rgba(47, 94, 142, 0.12);
        border-radius: 100px;
    }

    /* Group Header */
    .group-header {
        font-size: 11px;
        font-weight: 700;
        color: #64748B;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin: 12px 0 4px;
        padding-left: 4px;
    }
    .group-header:first-child {
        margin-top: 0;
    }

    /* Result Item (Updated) */
    .result-item {
        background: #FFFFFF;
        border: 1px solid #F1F5F9;
        border-radius: 16px;
        padding: 12px 16px;
        display: flex;
        align-items: center;
        gap: 16px;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        position: relative;
    }
    .result-item:hover, .result-item.selected {
        border-color: rgba(150, 192, 230, 0.3);
        transform: translateY(-2px) scale(1.01);
        box-shadow: 0 8px 20px rgba(30, 58, 95, 0.08);
        background: #FFFFFF;
        z-index: 10;
    }

    /* Icons */
    .result-icon {
        width: 42px; height: 42px;
        border-radius: 12px;
        display: grid;
        place-items: center;
        font-size: 16px;
        flex-shrink: 0;
        transition: all 0.3s ease;
    }
    
    /* Pano Icon Style */
    .icon-pano {
        background: #EFF6FF;
        color: #3B82F6;
    }
    .result-item:hover .icon-pano {
        background: linear-gradient(135deg, #3B82F6, #2563EB);
        color: #FFFFFF;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    /* Link Icon Style */
    .icon-link {
        background: #F5F3FF;
        color: #8B5CF6;
    }
    .result-item:hover .icon-link {
        background: linear-gradient(135deg, #8B5CF6, #7C3AED);
        color: #FFFFFF;
        box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
    }

    .result-content {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
    }
    .result-title {
        font-size: 15px;
        font-weight: 700;
        color: #1E293B;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        letter-spacing: -0.01em;
    }
    
    /* Type Badge */
    .type-badge {
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        padding: 2px 6px;
        border-radius: 4px;
        display: inline-block;
        width: fit-content;
    }
    .badge-pano { background: #E0F2FE; color: #0284C7; }
    .badge-link { background: #F3E8FF; color: #9333EA; }

    .action-arrow {
        color: #CBD5E1;
        font-size: 12px;
        transition: all 0.2s;
    }
    .result-item:hover .action-arrow {
        color: #3B82F6;
        transform: translateX(2px);
    }
    
    .highlight-text {
        color: #0284C7;
        background: rgba(2, 132, 199, 0.1);
        padding: 0 2px;
        border-radius: 2px;
    }

    /* Footer */
    .search-footer {
        padding: 12px 24px;
        border-top: 1px solid #D1D9E6;
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
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
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

    /* No Results */
    .no-results {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px 0;
        color: #94A3B8;
        gap: 12px;
    }
    .no-results i { font-size: 32px; opacity: 0.5; }
    .no-results span { font-size: 13px; font-weight: 500; }
    
    @media (max-width: 480px) {
        .search-card {
            width: 100%;
            height: 100%;
            max-height: 100vh;
            max-width: 100vw;
            top: 0; left: 0;
            border-radius: 0;
        }
        .keyboard-hint { display: none; }
    }
  `;
  document.head.appendChild(style);

  // ─── DOM Structure ───

  // Backdrop
  const backdrop = document.createElement("div");
  backdrop.id = "search-backdrop";
  document.body.appendChild(backdrop);

  const container = document.createElement("div");
  container.id = "container_search";
  container.className = "search-card";

  container.innerHTML = `
    <div class="search-header">
        <div class="search-title">
            <i class="fa-solid fa-magnifying-glass"></i> Search
        </div>
        <button class="search-close" id="search_close">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </button>
    </div>

    <div class="search-body">
        <div class="search-input-wrapper">
            <input type="text" class="search-input" id="searchInput" placeholder="Find panoramas, links..." autocomplete="off">
            <i class="fa-solid fa-magnifying-glass search-icon-overlay"></i>
        </div>
        
        <ul class="search-results" id="itemList">
            <!-- Results injected here -->
        </ul>
        
        <div class="no-results" id="noResults" style="display:none;">
            <i class="fa-regular fa-folder-open"></i>
            <span>No matches found</span>
        </div>
    </div>

    <div class="search-footer">
        <div class="footer-left">
            <div class="footer-dot"></div>
            <span class="footer-text">Start typing...</span>
        </div>
        <div class="keyboard-hint">
            <span>Esc</span> to close
        </div>
    </div>
  `;

  document.body.appendChild(container);
  window.SearchBox = container; // Global Ref

  // ─── Logic ───
  const input = document.getElementById("searchInput");
  const ul = document.getElementById("itemList");
  const closeBtn = document.getElementById("search_close");
  const noResultsParams = document.getElementById("noResults");
  const footerText = container.querySelector(".footer-text");

  // Load Data
  let panoTitles = [];
  let ProjectLinks = [];
  let currentResults = [];
  let selectedIndex = -1;

  async function loadData() {
    try {
      const [panoRes, linkRes] = await Promise.all([
        fetch("locale/en.txt").then(r => r.text()).catch(() => ""),
        fetch("Components/Search/Links.txt").then(r => r.text()).catch(() => "")
      ]);

      panoTitles = panoRes.split("\n").map(line => {
        const m = line.match(/^panorama_[A-Z0-9_]+\.label\s*=\s*(.+)$/);
        return m ? m[1].trim() : null;
      }).filter(Boolean);

      ProjectLinks = linkRes.split("\n").map(line => {
        const firstEq = line.indexOf("=");
        if (firstEq === -1) return null;

        const title = line.substring(0, firstEq).trim();
        const url = line.substring(firstEq + 1).trim();

        return (title && url) ? { title, url } : null;
      }).filter(Boolean);

      // ── AI-callable global: open_related_campus uses this ────────
      window.relatedCampuses = ProjectLinks;

    } catch (e) { console.warn("Search Data Load Error", e); }
  }
  loadData();

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function highlightMatch(text, query) {
    if (!query) return text;
    const escaped = escapeRegex(query);
    const regex = new RegExp(`(${escaped})`, 'gi');
    return text.replace(regex, '<span class="highlight-text">$1</span>');
  }

  function renderList(items, query) {
    ul.innerHTML = "";
    currentResults = items;
    selectedIndex = -1;

    if (items.length === 0 && input.value.trim() !== "") {
      ul.style.display = "none";
      noResultsParams.style.display = "flex";
      footerText.textContent = "Try a different keyword";
      return;
    }

    ul.style.display = "flex";
    noResultsParams.style.display = "none";
    footerText.textContent = `${items.length} result(s) found`;

    // Grouping
    const panoramas = items.filter(i => i.type === "pano");
    const links = items.filter(i => i.type === "link");

    const renderGroup = (groupItems, label) => {
      if (groupItems.length === 0) return;
      const header = document.createElement("li");
      header.className = "group-header";
      header.textContent = label;
      ul.appendChild(header);

      groupItems.forEach((item, index) => {
        const li = document.createElement("li");
        li.className = "result-item";
        li.dataset.index = items.indexOf(item); // Global index

        const isPano = item.type === "pano";
        // Distinct styles
        const iconClass = isPano ? "fa-panorama" : "fa-arrow-up-right-from-square";
        const iconStyleClass = isPano ? "icon-pano" : "icon-link";

        const typeLabel = isPano ? "VR Tour" : "Link";
        const badgeClass = isPano ? "badge-pano" : "badge-link";

        li.innerHTML = `
                <div class="result-icon ${iconStyleClass}">
                    <i class="fa-solid ${iconClass}"></i>
                </div>
                <div class="result-content">
                    <div class="result-title">${highlightMatch(item.title, query)}</div>
                    <span class="type-badge ${badgeClass}">${typeLabel}</span>
                </div>
                <i class="fa-solid fa-chevron-right action-arrow"></i>
            `;

        li.onclick = () => selectItem(item);
        ul.appendChild(li);
      });
    };

    renderGroup(panoramas, "Locations");
    renderGroup(links, "External Tours");
  }

  function selectItem(item) {
    // Close Search
    if (window.SearchBox.classList.contains("show")) {
      window.toggleSearchBox();
    }

    if (item.type === "pano") {
      // Panorama — navigate directly
      if (typeof tour !== "undefined" && typeof tour.setMediaByName === "function") {
        tour.setMediaByName(item.title);
      }
    } else {
      // Link — show the explore action box with View Tour + Get Direction
      var actionBackdrop = document.querySelector('.explore-action-backdrop');
      if (!actionBackdrop) {
        // Fallback if explore component hasn't loaded yet
        window.open(item.url, "_blank");
        return;
      }

      // Populate the action box header
      var eabIcon = document.getElementById('eab-icon');
      var eabName = document.getElementById('eab-name');
      var eabSub = document.getElementById('eab-sub');
      if (eabIcon) eabIcon.innerHTML = '<i class="fa-solid fa-arrow-up-right-from-square"></i>';
      if (eabName) eabName.textContent = item.title;
      if (eabSub) eabSub.textContent = 'External Tour';

      // Wire the Tour button to open this specific URL
      var tourBtn = document.getElementById('eab-tour');
      var dirBtn = document.getElementById('eab-direction');

      // Clone + replace to remove any prior listeners
      var newTourBtn = tourBtn.cloneNode(true);
      tourBtn.parentNode.replaceChild(newTourBtn, tourBtn);
      newTourBtn.id = 'eab-tour';

      var newDirBtn = dirBtn.cloneNode(true);
      dirBtn.parentNode.replaceChild(newDirBtn, dirBtn);
      newDirBtn.id = 'eab-direction';

      newTourBtn.addEventListener('click', function () {
        window.open(item.url, '_blank');
        actionBackdrop.classList.remove('show');
      });

      newDirBtn.addEventListener('click', function () {
        var dest = encodeURIComponent(item.title + ', Mount Zion International School - CBSE');
        var url = 'https://www.google.com/maps/dir/?api=1&destination=' + dest;
        if (window.userLocation) {
          url += '&origin=' + window.userLocation.lat + ',' + window.userLocation.lng;
        }
        window.open(url, '_blank');
        actionBackdrop.classList.remove('show');
      });

      // Show the action box
      actionBackdrop.classList.add('show');
    }
  }

  function updateSelection() {
    const items = ul.querySelectorAll('.result-item');
    items.forEach(el => el.classList.remove('selected'));

    if (selectedIndex >= 0 && selectedIndex < currentResults.length) {
      const selectedEl = ul.querySelector(`.result-item[data-index="${selectedIndex}"]`);
      if (selectedEl) {
        selectedEl.classList.add('selected');
        selectedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }

  // Filter Logic (debounced for performance)
  let searchDebounce = null;
  input.addEventListener("input", () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      const q = input.value.toLowerCase().trim();
      if (!q) {
        renderList([], "");
        footerText.textContent = "Start typing...";
        noResultsParams.style.display = "none";
        return;
      }

      const panoResults = panoTitles.filter(t => t.toLowerCase().includes(q))
        .map(title => ({ type: "pano", title }));
      const linkResults = ProjectLinks.filter(l => l.title.toLowerCase().includes(q))
        .map(l => ({ type: "link", title: l.title, url: l.url }));

      renderList([...panoResults, ...linkResults], q);
    }, 150);
  });

  // Keyboard Navigation
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, currentResults.length - 1);
      updateSelection();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, -1);
      updateSelection();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && currentResults[selectedIndex]) {
        selectItem(currentResults[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      if (container.classList.contains("show")) window.toggleSearchBox();
    }
  });

  // Close Logic
  closeBtn.addEventListener("click", () => window.toggleSearchBox());
  backdrop.addEventListener("click", () => window.toggleSearchBox());

  // Shortcut Listener
  document.addEventListener("keydown", (e) => {
    // Ctrl+K or Cmd+K
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      window.toggleSearchBox();
    }
  });

})();

// Global Toggle
window.toggleSearchBox = function () {
  if (!window.SearchBox) return;
  const backdrop = document.getElementById("search-backdrop");
  const isOpen = window.SearchBox.classList.contains("show");

  if (!isOpen) {
    window.SearchBox.classList.add("show");
    if (backdrop) backdrop.classList.add("show");

    setTimeout(() => document.getElementById("searchInput").focus(), 100);
    document.dispatchEvent(new CustomEvent('searchActive'));
  } else {
    window.SearchBox.classList.remove("show");
    if (backdrop) backdrop.classList.remove("show");

    document.dispatchEvent(new CustomEvent('searchDeactive'));
    // Notify Menu to deactivate
    document.dispatchEvent(new CustomEvent('menuItemDeactivate', { detail: { id: 'menu-search' } }));

    // Reset selection
    document.getElementById("searchInput").value = "";
    const ul = document.getElementById("itemList");
    ul.innerHTML = ""; // clear list
    document.querySelector(".no-results").style.display = "none";
  }
};

// Listen for Menu Click
document.addEventListener('menuItemClick', (e) => {
  if (e.detail && e.detail.id === 'menu-search') {
    window.toggleSearchBox();
  }
});

