/**
 * KRCE Virtual Tour Analytics - Dashboard Orchestrator
 * Conforms to analytics/task.md specifications
 */

(function () {
  'use strict';

  const dataStore = window.KRCEAnalyticsData ? window.KRCEAnalyticsData.store : null;
  const campusStructure = window.KRCEAnalyticsData ? window.KRCEAnalyticsData.CAMPUS_STRUCTURE : null;
  const chartsEngine = window.KRCEChartsEngine;
  const liveSync = window.KRCELiveSync;

  if (!dataStore || !chartsEngine) {
    console.error('[KRCE Analytics] Missing required core modules.');
    return;
  }

  // Active time filter
  let activeFilter = 'all';

  // Stream state
  let streamPaused = false;

  // Command Palette State
  let paletteItems = [];
  let selectedPaletteIndex = 0;

  // Dwell Matrix State
  let activeDwellDeptFilter = 'all';
  let dwellSearchQuery = '';

  // Notification Center State
  const NOTIF_STORAGE_KEY = 'krce_notifications_feed_v1';
  let notifications = [];
  let activeNotifFilter = 'all';
  let isNotifFlyoutOpen = false;

  function init() {
    try {
      localStorage.removeItem('krce_tour_telemetry_v1');
    } catch (e) {}

    // Ingest cached tour manifest if available
    try {
      const cachedManifest = localStorage.getItem('tour_manifest_scenes');
      if (cachedManifest && dataStore && dataStore.setTourManifest) {
        dataStore.setTourManifest(JSON.parse(cachedManifest));
      }
    } catch (e) {}

    buildPaletteIndex();
    setupNotificationCenter();
    renderAll();
    setupEventListeners();
    setupLiveSync();
    setupCommandPalette();
    updateHealthBar();
    setInterval(updateHealthBar, 3000);
    setInterval(function () {
      if (dataStore && typeof dataStore.getActiveRooms === 'function') {
        const activeData = (dataStore.getMetrics && typeof dataStore.getMetrics === 'function')
          ? dataStore.getMetrics(activeFilter)
          : dataStore.data;
        renderPanoramaDwellMatrix(activeData.dwellMetrics ? activeData.dwellMetrics.panoramaBreakdown : []);
      }
    }, 3000);
  }

  // Render or re-render complete dashboard
  function renderAll() {
    const activeData = (dataStore.getMetrics && typeof dataStore.getMetrics === 'function')
      ? dataStore.getMetrics(activeFilter)
      : dataStore.data;

    // 1. KPI Cards with animated roll-ups (no fake multipliers!)
    updateKPICards(activeData.summary);

    // 2. Charts
    chartsEngine.renderLabEngagementChart('chart-lab-engagement', activeData.labEngagement);
    chartsEngine.renderHourlyTrafficChart('chart-hourly-traffic', activeData.hourlyVisits);

    // Compute live category/department shares dynamically from active lab views
    const deptTotals = {};
    activeData.labEngagement.forEach(l => {
      const dName = l.deptName || 'Campus Viewpoint';
      deptTotals[dName] = (deptTotals[dName] || 0) + (l.views || 0);
    });
    if (campusStructure && campusStructure.departments) {
      campusStructure.departments.forEach(d => {
        if (deptTotals[d.shortName] === undefined) {
          deptTotals[d.shortName] = 0;
        }
      });
    }
    const deptLabels = Object.keys(deptTotals);
    const liveShares = deptLabels.map(d => deptTotals[d] || 0);
    chartsEngine.renderDepartmentShareChart('chart-department-share', deptLabels, liveShares);

    chartsEngine.renderFeatureUsageChart('chart-feature-usage', activeData.featureInteractions);

    // Update Feature Telemetry total clicks badge in card header
    const totalFeatureClicks = Object.values(activeData.featureInteractions || {}).reduce((a, b) => a + (b || 0), 0);
    const featBadge = document.getElementById('feature-total-badge');
    if (featBadge) {
      featBadge.textContent = totalFeatureClicks + (totalFeatureClicks === 1 ? ' Click' : ' Clicks');
      featBadge.className = 'trend-pill ' + (totalFeatureClicks > 0 ? 'trend-up' : 'trend-neutral');
    }

    // 3. Render Recent Live Sessions Table (if not paused)
    if (!streamPaused) {
      renderRecentSessions(activeData.recentSessions);
    }

    // 4. Update Dedicated Dwell Intelligence Card & Matrix
    updateDwellIntelligenceCard(activeData.dwellMetrics, activeData.summary, activeData.labEngagement);
    renderPanoramaDwellMatrix(activeData.dwellMetrics ? activeData.dwellMetrics.panoramaBreakdown : []);

    // 5. Update Header Last Updated Time
    const lastUpdateEl = document.getElementById('last-sync-time');
    if (lastUpdateEl) {
      lastUpdateEl.textContent = 'Updated ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
  }

  // Update Dedicated Dwell Intelligence Card UI
  function updateDwellIntelligenceCard(dwellMetrics) {
    if (!dwellMetrics) return;

    // 1. Stickiest Facility
    const stickiest = dwellMetrics.stickiestFacility;
    const stickiestNameEl = document.getElementById('dwell-stickiest-name');
    const stickiestTimeEl = document.getElementById('dwell-stickiest-time');
    if (stickiestNameEl && stickiest) {
      stickiestNameEl.textContent = stickiest.name || 'None';
    }
    if (stickiestTimeEl && stickiest) {
      stickiestTimeEl.textContent = (stickiest.avgDwell > 0 ? stickiest.formatted + ' avg' : '0m 00s avg');
    }

    // 2. Key Stats Row: Total Time Invested & Avg Dwell / Room
    const totalTimeEl = document.getElementById('dwell-total-invested');
    if (totalTimeEl) {
      totalTimeEl.textContent = dwellMetrics.totalFormatted || '0h 00m';
    }
    const avgRoomEl = document.getElementById('dwell-avg-per-room');
    if (avgRoomEl) {
      avgRoomEl.textContent = dwellMetrics.avgFormatted || '0m 00s';
    }

    // 3. Visitor Intent Depth Segmentation
    const depth = dwellMetrics.intentDepth || {};
    const deepPct = (depth.deep && depth.deep.percent !== undefined) ? depth.deep.percent : 0;
    const activePct = (depth.active && depth.active.percent !== undefined) ? depth.active.percent : 0;
    const quickPct = (depth.quick && depth.quick.percent !== undefined) ? depth.quick.percent : 0;

    const elDeepPct = document.getElementById('dwell-pct-deep');
    const elDeepBar = document.getElementById('dwell-bar-deep');
    if (elDeepPct) elDeepPct.textContent = deepPct + '%';
    if (elDeepBar) elDeepBar.style.width = deepPct + '%';

    const elActivePct = document.getElementById('dwell-pct-active');
    const elActiveBar = document.getElementById('dwell-bar-active');
    if (elActivePct) elActivePct.textContent = activePct + '%';
    if (elActiveBar) elActiveBar.style.width = activePct + '%';

    const elQuickPct = document.getElementById('dwell-pct-quick');
    const elQuickBar = document.getElementById('dwell-bar-quick');
    if (elQuickPct) elQuickPct.textContent = quickPct + '%';
    if (elQuickBar) elQuickBar.style.width = quickPct + '%';
  }

  // Render Panorama Dwell Matrix Table
  function renderPanoramaDwellMatrix(breakdown) {
    const tbody = document.getElementById('pano-dwell-matrix-body');
    if (!tbody) return;

    const list = Array.isArray(breakdown) ? breakdown : [];

    function matchesDept(itemDept, itemName, filterDept) {
      if (filterDept === 'all') return true;
      const f = filterDept.toLowerCase();
      const d = (itemDept || '').toLowerCase();
      const n = (itemName || '').toLowerCase();

      if (f === 'mech') {
        return d.includes('mech') || n.includes('mech') || n.includes('thermal') || n.includes('cad') || n.includes('dynamics') || n.includes('manufacturing') || n.includes('fluid') || n.includes('ar/vr') || n.includes('ar-vr');
      }
      if (f === 'cse') {
        return d.includes('cse') || d.includes('computer science') || n.includes('cse') || n.includes('cloud') || n.includes('compiler') || n.includes('operating system') || n.includes('computer practice') || (n.includes('project') && !n.includes('ece'));
      }
      if (f === 'csbs') {
        return d.includes('csbs') || d.includes('business system') || n.includes('csbs') || n.includes('alan turing') || n.includes('alan-turing') || n.includes('code craft') || n.includes('codecraft');
      }
      if (f === 'eee') {
        return d.includes('eee') || d.includes('electrical') || n.includes('eee') || n.includes('power') || n.includes('electric') || n.includes('instrumentation') || n.includes('renewable');
      }
      if (f === 'ece') {
        return d.includes('ece') || d.includes('electronics') || n.includes('ece') || n.includes('vlsi') || n.includes('embedded') || n.includes('comm') || n.includes('signal processing') || n.includes('microprocessor') || n.includes('rf systems');
      }
      if (f.includes('ai') || f.includes('ds')) {
        return d.includes('ai') || d.includes('data science') || n.includes('ai') || n.includes('data science') || n.includes('machine learning') || n.includes('ds lab') || n.includes('ml lab');
      }
      if (f === 'it') {
        return d.includes('information technology') || d === 'it' || n.includes(' it ') || n.includes('information tech') || n.includes('apex');
      }
      return d.includes(f) || n.includes(f);
    }

    const filtered = list.filter(item => {
      if (!matchesDept(item.dept, item.name, activeDwellDeptFilter)) {
        return false;
      }
      if (dwellSearchQuery) {
        const q = dwellSearchQuery.toLowerCase();
        const matchesName = (item.name || '').toLowerCase().includes(q);
        const matchesDepartment = (item.dept || '').toLowerCase().includes(q);
        if (!matchesName && !matchesDepartment) {
          return false;
        }
      }
      return true;
    });

    tbody.innerHTML = '';
    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 32px 16px; color: var(--text-muted); font-size: 0.84rem;">
            <i class="fa-solid fa-filter" style="font-size: 1.3rem; color: var(--text-muted); margin-bottom: 8px; display: block; opacity: 0.6;"></i>
            <span>No campus viewpoints found matching the selected filter criteria.</span>
          </td>
        </tr>
      `;
      return;
    }

    // Determine active viewpoints currently being explored (supports multi-user presence!)
    const activeRooms = (dataStore && typeof dataStore.getActiveRooms === 'function')
      ? dataStore.getActiveRooms()
      : {};

    function getLiveVisitorCountForScene(itemName) {
      const n = (itemName || '').trim().toLowerCase();
      if (!n) return 0;
      for (const [sceneNorm, count] of Object.entries(activeRooms)) {
        if (sceneNorm === n || sceneNorm.includes(n) || n.includes(sceneNorm)) {
          return count;
        }
      }
      return 0;
    }

    filtered.forEach((item, idx) => {
      const tr = document.createElement('tr');
      const deptInfo = getDeptInfo(item.name);
      const isTopRank = idx < 3 && activeDwellDeptFilter === 'all' && !dwellSearchQuery;

      const liveCount = getLiveVisitorCountForScene(item.name);
      const isLiveNow = liveCount > 0;

      if (isLiveNow) {
        tr.className = 'row-live-exploring';
      }

      tr.innerHTML = `
        <td style="text-align: center;">
          <span class="pano-rank-badge ${isTopRank ? 'pano-rank-top' : ''}">${idx + 1}</span>
        </td>
        <td>
          <div class="scene-cell">
            <span class="dept-badge ${deptInfo.className}">${deptInfo.code}</span>
            <div class="scene-name-wrap">
              <strong style="color: var(--corp-blue-deep);">${escapeHtml(item.name)}</strong>
              ${isLiveNow ? `<span class="live-exploring-pill"><span class="live-pulse-dot"></span> LIVE NOW${liveCount > 1 ? ` (${liveCount})` : ''}</span>` : ''}
            </div>
          </div>
        </td>
        <td>
          <div style="font-variant-numeric: tabular-nums; font-weight: 700; color: var(--corp-blue-deep); font-size: 0.84rem;">
            ${escapeHtml(item.avgFormatted || '0s')}
          </div>
          <div class="pano-dwell-track">
            <div class="pano-dwell-fill ${item.intent === 'deep' ? 'fill-deep' : (item.intent === 'active' ? 'fill-active' : (item.intent === 'unvisited' ? 'fill-unvisited' : 'fill-quick'))}" style="width: ${item.relativePct || 0}%;"></div>
          </div>
        </td>
        <td><span style="color: var(--text-secondary); font-variant-numeric: tabular-nums; font-size: 0.82rem;">${escapeHtml(item.totalFormatted || '0s')}</span></td>
        <td><span style="font-weight: 600; color: var(--corp-blue-primary); font-variant-numeric: tabular-nums;">${(item.views || 0).toLocaleString()}</span></td>
        <td style="white-space: nowrap;">
          <span class="intent-pill ${item.intentClass || 'intent-pill-unvisited'}">
            <i class="fa-solid ${item.intentIcon || 'fa-minus'}"></i>
            ${escapeHtml(item.intentLabel || 'Unvisited')}
          </span>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Smooth number counter rollup
  function animateValue(element, start, end, duration) {
    if (!element) return;
    if (start === end) {
      element.textContent = end.toLocaleString();
      return;
    }
    const range = end - start;
    let current = start;
    const increment = end > start ? Math.ceil(range / (duration / 20)) : -1;
    const stepTime = 20;
    const timer = setInterval(function () {
      current += increment;
      if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
        current = end;
        clearInterval(timer);
      }
      element.textContent = current.toLocaleString();
    }, stepTime);
  }

  function updateKPICards(summary) {
    const visitsEl = document.getElementById('kpi-total-visits');
    const uniqueEl = document.getElementById('kpi-unique-visitors');
    const dwellEl = document.getElementById('kpi-avg-dwell');
    const mobileEl = document.getElementById('kpi-mobile-ratio');

    const targetVisits = (summary && summary.totalVisits) || 0;
    const targetUnique = (summary && summary.uniqueVisitors) || 0;

    const curVisits = visitsEl ? parseInt(visitsEl.textContent.replace(/,/g, '')) || 0 : 0;
    const curUnique = uniqueEl ? parseInt(uniqueEl.textContent.replace(/,/g, '')) || 0 : 0;

    if (visitsEl) animateValue(visitsEl, curVisits, targetVisits, 400);
    if (uniqueEl) animateValue(uniqueEl, curUnique, targetUnique, 400);

    if (dwellEl) {
      const totalSec = (summary && summary.avgDwellSeconds) || 0;
      const minutes = Math.floor(totalSec / 60);
      const seconds = totalSec % 60;
      dwellEl.textContent = minutes + 'm ' + (seconds < 10 ? '0' : '') + seconds + 's';
    }

    if (mobileEl) {
      const mob = (summary && typeof summary.mobileRatioPercent === 'number') ? summary.mobileRatioPercent : 0;
      mobileEl.textContent = mob.toFixed(1) + '%';
    }
  }

  // Resolve department badge class and text from scene name
  function getDeptInfo(sceneName) {
    const s = (sceneName || '').toLowerCase();
    if (s.includes('apex') || s.includes('information tech') || s.includes(' it ')) {
      return { code: 'IT', className: 'dept-it' };
    }
    if (s.includes('csbs') || s.includes('business system') || s.includes('alan turing') || s.includes('alan-turing') || s.includes('code craft') || s.includes('codecraft')) {
      return { code: 'CSBS', className: 'dept-csbs' };
    }
    if (s.includes('ai & ds') || s.includes('aids') || s.includes('artificial') || s.includes('data science') || s.includes('ds lab') || s.includes('ml lab') || s.includes('machine learning')) {
      return { code: 'AI & DS', className: 'dept-aids' };
    }
    if (s.includes('mech') || s.includes('thermal') || s.includes('cad') || s.includes('dynamics') || s.includes('manufacturing') || s.includes('fluid') || s.includes('ar/vr') || s.includes('ar-vr')) {
      return { code: 'MECH', className: 'dept-mech' };
    }
    if (s.includes('eee') || s.includes('power') || s.includes('electric') || s.includes('instrumentation') || s.includes('renewable')) {
      return { code: 'EEE', className: 'dept-eee' };
    }
    if (s.includes('ece') || s.includes('vlsi') || s.includes('embedded') || s.includes('comm') || s.includes('microprocessor') || s.includes('signal processing') || s.includes('rf systems')) {
      return { code: 'ECE', className: 'dept-ece' };
    }
    if (s.includes('cse') || s.includes('compiler') || s.includes('operating system') || s.includes('computer') || s.includes('cloud') || s.includes('software')) {
      return { code: 'CSE', className: 'dept-cse' };
    }
    if (s.includes('civil') || s.includes('survey') || s.includes('soil')) {
      return { code: 'CIVIL', className: 'dept-civil' };
    }
    return { code: 'CAMPUS', className: 'dept-generic' };
  }

  function renderRecentSessions(sessions) {
    const tbody = document.getElementById('recent-sessions-body');
    if (!tbody) return;

    tbody.innerHTML = '';
    if (!sessions || sessions.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 32px 16px; color: var(--text-muted); font-size: 0.84rem;">
            <i class="fa-solid fa-satellite-dish" style="font-size: 1.4rem; color: var(--corp-blue-bright); margin-bottom: 8px; display: block; opacity: 0.6;"></i>
            <span>Awaiting live visitor telemetry &middot; Explore the 360° virtual tour to start recording real sessions.</span>
          </td>
        </tr>
      `;
      return;
    }

    sessions.forEach((sess, idx) => {
      const tr = document.createElement('tr');
      if (idx === 0) tr.className = 'new-event-row';
      
      const isMobile = (sess.device || '').toLowerCase().includes('mobile');
      const isTablet = (sess.device || '').toLowerCase().includes('tablet');
      const deviceIcon = isMobile ? 'fa-mobile-screen' : (isTablet ? 'fa-tablet-screen-button' : 'fa-desktop');
      const deviceColor = isMobile ? 'var(--corp-blue-bright)' : '#0284C7';
      const deptInfo = getDeptInfo(sess.scene);

      tr.innerHTML = `
        <td>
          <div class="scene-cell">
            <span class="dept-badge ${deptInfo.className}">${deptInfo.code}</span>
            <strong style="color: var(--corp-blue-deep);">${escapeHtml(sess.scene)}</strong>
          </div>
        </td>
        <td><span style="color: var(--text-secondary); font-variant-numeric: tabular-nums;">${escapeHtml(sess.dwell)}</span></td>
        <td>
          <span class="platform-badge">
            <i class="fa-solid ${deviceIcon}" style="color: ${deviceColor};"></i>
            ${escapeHtml(sess.device)}
          </span>
        </td>
        <td><span class="time-ago" style="font-family: var(--font-display);">${escapeHtml(sess.time)}</span></td>
        <td><span class="status-pill ${sess.status === 'active' ? 'status-active' : 'status-completed'}">
          <i class="fa-solid fa-${sess.status === 'active' ? 'circle-dot' : 'check'}"></i>
          ${sess.status === 'active' ? 'Active Tour' : 'Completed'}
        </span></td>
      `;
      tbody.appendChild(tr);
    });
  }

  function triggerLivePing() {
    const kpiCards = document.querySelectorAll('.bento-card');
    kpiCards.forEach(card => {
      card.classList.remove('live-ping');
      void card.offsetWidth;
      card.classList.add('live-ping');
    });
  }

  // Filter Bar, Export, Print, and Action handlers
  function setupEventListeners() {
    // Time filter pills
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', function () {
        filterBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        activeFilter = this.getAttribute('data-range') || 'all';
        renderAll();
      });
    });

    // Stream Pause / Resume Toggle
    const toggleStreamBtn = document.getElementById('btn-toggle-stream');
    if (toggleStreamBtn) {
      toggleStreamBtn.addEventListener('click', function () {
        streamPaused = !streamPaused;
        if (streamPaused) {
          this.classList.add('paused');
          this.innerHTML = '<i class="fa-solid fa-play"></i> <span>Paused</span>';
          showToast('Live Activity Stream paused. Background telemetry continues recording.');
        } else {
          this.classList.remove('paused');
          this.innerHTML = '<i class="fa-solid fa-pause"></i> <span>Live</span>';
          renderRecentSessions(dataStore.data.recentSessions);
          showToast('Live Activity Stream resumed.');
        }
      });
    }

    // Print Executive Report
    const printBtn = document.getElementById('btn-print-report');
    if (printBtn) {
      printBtn.addEventListener('click', function () {
        window.print();
      });
    }

    // Chart PNG Export buttons
    document.querySelectorAll('.btn-export-chart').forEach(btn => {
      btn.addEventListener('click', function () {
        const chartId = this.getAttribute('data-chart');
        if (chartId && chartsEngine.exportChartImage) {
          chartsEngine.exportChartImage(chartId, 'KRCE_' + chartId);
          showToast('Chart image downloaded successfully.');
        }
      });
    });

    // Export CSV
    const exportCsvBtn = document.getElementById('btn-export-csv');
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener('click', exportCSV);
    }

    // Export JSON
    const exportJsonBtn = document.getElementById('btn-export-json');
    if (exportJsonBtn) {
      exportJsonBtn.addEventListener('click', exportJSON);
    }

    // Reset baseline (Wipes LocalStorage + Supabase Cloud Database)
    const resetBtn = document.getElementById('btn-reset-data');
    if (resetBtn) {
      resetBtn.addEventListener('click', async function () {
        const confirmed = confirm(
          'Are you sure you want to RESET all analytics data?\n\n' +
          'This will permanently DELETE:\n' +
          '• All browser LocalStorage telemetry records\n' +
          '• All Supabase Database records (scene_telemetry & feature_interactions)\n\n' +
          'Click OK to wipe everything clean.'
        );

        if (confirmed) {
          const originalHTML = resetBtn.innerHTML;
          resetBtn.disabled = true;
          resetBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Resetting...';

          try {
            // 1. Purge Supabase cloud database
            let cloudPurged = false;
            if (liveSync && typeof liveSync.purgeAllCloudData === 'function') {
              cloudPurged = await liveSync.purgeAllCloudData();
            } else if (window.KRCELiveSync && typeof window.KRCELiveSync.purgeAllCloudData === 'function') {
              cloudPurged = await window.KRCELiveSync.purgeAllCloudData();
            }

            // 2. Wipe browser localStorage and session IDs
            try {
              localStorage.removeItem('krce_visitor_uuid');
              sessionStorage.removeItem('krce_session_uuid');
              localStorage.removeItem('krce_tour_telemetry_v2');
              localStorage.removeItem('krce_tour_telemetry_v1');
            } catch (e) {}

            // 3. Reset in-memory data store to clean zero baseline
            dataStore.resetToBaseline();

            // 4. Broadcast reset to any open tour tabs
            if (liveSync && typeof liveSync.broadcast === 'function') {
              liveSync.broadcast({ type: 'analytics_reset', timestamp: Date.now() });
            }

            // 5. Re-render UI
            renderAll();

            if (cloudPurged) {
              showToast('All LocalStorage & Supabase database records deleted.');
            } else {
              showToast('LocalStorage cleared & cloud purge request sent.');
            }
          } catch (err) {
            console.error('Reset error:', err);
            showToast('Reset completed locally (cloud note: ' + (err.message || 'offline') + ')');
          } finally {
            resetBtn.disabled = false;
            resetBtn.innerHTML = originalHTML;
            resetBtn.classList.remove('active');
          }
        }
      });
    }

    // Dwell Matrix Department Filter Pills
    const dwellDeptPills = document.querySelectorAll('#dwell-dept-filter-group .dwell-dept-pill');
    dwellDeptPills.forEach(pill => {
      pill.addEventListener('click', function () {
        dwellDeptPills.forEach(p => p.classList.remove('active'));
        this.classList.add('active');
        activeDwellDeptFilter = this.getAttribute('data-dept') || 'all';
        const activeData = (dataStore.getMetrics && typeof dataStore.getMetrics === 'function')
          ? dataStore.getMetrics(activeFilter)
          : dataStore.data;
        renderPanoramaDwellMatrix(activeData.dwellMetrics ? activeData.dwellMetrics.panoramaBreakdown : []);
      });
    });

    // Dwell Matrix Search Input
    const dwellSearchInput = document.getElementById('dwell-search-input');
    if (dwellSearchInput) {
      dwellSearchInput.addEventListener('input', function () {
        dwellSearchQuery = (this.value || '').trim();
        const activeData = (dataStore.getMetrics && typeof dataStore.getMetrics === 'function')
          ? dataStore.getMetrics(activeFilter)
          : dataStore.data;
        renderPanoramaDwellMatrix(activeData.dwellMetrics ? activeData.dwellMetrics.panoramaBreakdown : []);
      });
    }
  }

  // Real-time synchronization
  function setupLiveSync() {
    liveSync.subscribe(function (message) {
      if (message.type === 'scene_view') {
        dataStore.recordLiveEvent({
          sceneName: message.sceneName,
          dwell: message.dwell || '1m 15s',
          dwellSeconds: message.dwellSeconds,
          status: message.status || 'active',
          device: message.device,
          visitorId: message.visitorId,
          sessionId: message.sessionId,
          timestamp: message.timestamp || Date.now()
        });
        renderAll();
        triggerLivePing();
        if (!message.dwellSeconds || message.dwellSeconds === 0) {
          addNotification({
            category: 'visitor',
            title: 'Visitor Arrived',
            body: message.sceneName + (message.dwell ? ' &middot; ' + message.dwell : ''),
            icon: 'fa-door-open',
            iconClass: 'icon-notif-visitor'
          });
        }
      } else if (message.type === 'tour_manifest') {
        if (dataStore && dataStore.setTourManifest && Array.isArray(message.panoramas)) {
          dataStore.setTourManifest(message.panoramas);
          buildPaletteIndex();
          renderAll();
          addNotification({
            category: 'system',
            title: 'Tour Viewpoints Linked',
            body: (message.panoramas.length) + ' 360° scenes connected to telemetry engine',
            icon: 'fa-cubes',
            iconClass: 'icon-notif-system'
          });
        }
      } else if (message.type === 'supabase_hydrate') {
        if (dataStore.hydrateFromSupabase && Array.isArray(message.records)) {
          dataStore.hydrateFromSupabase(message.records);
          renderAll();
        }
      } else if (message.type === 'feature_click' || message.type === 'FEATURE_CLICK') {
        const featureName = message.feature || (message.payload && message.payload.featureName);
        if (dataStore && typeof dataStore.recordFeatureInteraction === 'function') {
          dataStore.recordFeatureInteraction(featureName, message.recordId);
          renderAll();
          triggerLivePing();
          addNotification({
            category: 'feature',
            title: 'Feature Used',
            body: getFeatureDisplayName(featureName) + ' triggered in 360° viewer',
            icon: 'fa-sliders',
            iconClass: 'icon-notif-feature'
          });
        }
      } else if (message.type === 'supabase_feature_hydrate') {
        if (dataStore && typeof dataStore.hydrateFeaturesFromSupabase === 'function' && Array.isArray(message.records)) {
          dataStore.hydrateFeaturesFromSupabase(message.records);
          renderAll();
        }
      } else if (message.type === 'storage_update') {
        renderAll();
        triggerLivePing();
      } else if (message.type === 'analytics_reset') {
        dataStore.resetToBaseline();
        renderAll();
        addNotification({
          category: 'system',
          title: 'Telemetry Reset',
          body: 'Analytics data restored to baseline across active sessions.',
          icon: 'fa-rotate-left',
          iconClass: 'icon-notif-alert'
        });
      }
    });
  }

  function getFeatureDisplayName(action) {
    const act = String(action || '').toLowerCase();
    if (act === 'street' || act.includes('street')) return 'Street View';
    if (act === 'audio' || act.includes('audio') || act.includes('music')) return 'Audio Guide';
    if (act === 'compass' || act === 'home' || act === 'visibility' || act === 'fullscreen') return 'Compass Nav';
    if (act === 'explore' || act === 'scenes' || act.includes('filter') || act.includes('portal') || act.includes('orb')) return 'Campus Portal';
    if (act === 'social' || act.includes('share')) return 'Social Share';
    if (act === 'hotspot' || act.includes('hotspot')) return 'Hotspot Interaction';
    return action || 'Tour Widget';
  }

  // Command Palette Index & Controller
  function buildPaletteIndex() {
    paletteItems = [
      // Quick Actions
      { title: 'Export CSV Analytics Report', type: 'Action', icon: 'fa-file-csv', action: exportCSV },
      { title: 'Export Full JSON Dataset', type: 'Action', icon: 'fa-download', action: exportJSON },
      { title: 'Print Executive PDF Briefing', type: 'Action', icon: 'fa-print', action: () => window.print() },
      { title: 'Filter: Today', type: 'Time Range', icon: 'fa-calendar-day', action: () => setFilter('today') },
      { title: 'Filter: Last 7 Days', type: 'Time Range', icon: 'fa-calendar-week', action: () => setFilter('7d') },
      { title: 'Filter: Last 30 Days', type: 'Time Range', icon: 'fa-calendar', action: () => setFilter('30d') },
      { title: 'Filter: All Time', type: 'Time Range', icon: 'fa-clock-rotate-left', action: () => setFilter('all') }
    ];

    // Dynamic Categories / Departments
    const seenCategories = new Set();
    if (dataStore && dataStore.data && Array.isArray(dataStore.data.labEngagement)) {
      dataStore.data.labEngagement.forEach(lab => {
        const cat = lab.deptName || 'Campus Viewpoint';
        if (!seenCategories.has(cat)) {
          seenCategories.add(cat);
          paletteItems.push({
            title: cat,
            type: 'Category',
            icon: 'fa-graduation-cap',
            action: () => showToast('Category: ' + cat)
          });
        }
      });
    }

    // Viewpoints / Laboratories
    if (dataStore && dataStore.data && dataStore.data.labEngagement) {
      dataStore.data.labEngagement.forEach(lab => {
        paletteItems.push({
          title: lab.name,
          type: 'Viewpoint',
          icon: 'fa-flask',
          action: () => showToast(lab.name + ' — ' + (lab.views || 0) + ' total views')
        });
      });
    }
  }

  function setFilter(range) {
    const btn = document.querySelector(`.filter-btn[data-range="${range}"]`);
    if (btn) btn.click();
  }

  function setupCommandPalette() {
    const backdrop = document.getElementById('command-palette-backdrop');
    const input = document.getElementById('palette-search-input');
    const resultsList = document.getElementById('palette-results-list');
    const cmdBtn = document.getElementById('btn-cmd-palette');

    if (!backdrop || !input || !resultsList) return;

    function openPalette() {
      backdrop.classList.add('active');
      input.value = '';
      renderPaletteResults('');
      setTimeout(() => input.focus(), 50);
    }

    function closePalette() {
      backdrop.classList.remove('active');
      input.blur();
    }

    if (cmdBtn) {
      cmdBtn.addEventListener('click', openPalette);
    }

    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) closePalette();
    });

    input.addEventListener('input', function () {
      renderPaletteResults(this.value.trim().toLowerCase());
    });

    input.addEventListener('keydown', function (e) {
      const items = resultsList.querySelectorAll('.palette-item');
      if (items.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedPaletteIndex = (selectedPaletteIndex + 1) % items.length;
        updatePaletteSelection(items);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedPaletteIndex = (selectedPaletteIndex - 1 + items.length) % items.length;
        updatePaletteSelection(items);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (items[selectedPaletteIndex]) items[selectedPaletteIndex].click();
      } else if (e.key === 'Escape') {
        closePalette();
      }
    });

    // Global shortcut Ctrl+K / Cmd+K & Escape
    window.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (backdrop.classList.contains('active')) {
          closePalette();
        } else {
          openPalette();
        }
      } else if (e.key === 'Escape' && backdrop.classList.contains('active')) {
        closePalette();
      }
    });

    function renderPaletteResults(query) {
      resultsList.innerHTML = '';
      const filtered = paletteItems.filter(item => {
        return !query || item.title.toLowerCase().includes(query) || item.type.toLowerCase().includes(query);
      }).slice(0, 10);

      selectedPaletteIndex = 0;

      if (filtered.length === 0) {
        const emptyLi = document.createElement('li');
        emptyLi.className = 'palette-item';
        emptyLi.style.cursor = 'default';
        emptyLi.style.justifyContent = 'center';
        emptyLi.innerHTML = '<span style="color: var(--text-muted);">No matching labs, departments, or actions found.</span>';
        resultsList.appendChild(emptyLi);
        return;
      }

      filtered.forEach((item, idx) => {
        const li = document.createElement('li');
        li.className = 'palette-item' + (idx === 0 ? ' selected' : '');
        li.innerHTML = `
          <div class="palette-item-left">
            <i class="fa-solid ${item.icon}"></i>
            <span>${escapeHtml(item.title)}</span>
          </div>
          <span class="palette-badge">${escapeHtml(item.type)}</span>
        `;
        li.addEventListener('click', function () {
          closePalette();
          if (item.action) item.action();
        });
        resultsList.appendChild(li);
      });
    }

    function updatePaletteSelection(items) {
      items.forEach((it, idx) => {
        it.classList.toggle('selected', idx === selectedPaletteIndex);
        if (idx === selectedPaletteIndex) {
          it.scrollIntoView({ block: 'nearest' });
        }
      });
    }
  }

  // System Health Bar updater
  function updateHealthBar() {
    let totalBytes = 0;
    try {
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalBytes += ((localStorage[key].length + key.length) * 2);
        }
      }
    } catch (e) {}

    const kb = (totalBytes / 1024).toFixed(1);
    const storageEl = document.getElementById('health-storage-stat');
    if (storageEl) {
      storageEl.textContent = kb + ' KB / 5.0 MB';
    }

    const timeEl = document.getElementById('health-timestamp');
    if (timeEl) {
      timeEl.textContent = new Date().toLocaleTimeString();
    }
  }

  // -------------------------------------------------------------
  // Executive Notification Center Controller
  // -------------------------------------------------------------
  function loadNotifications() {
    try {
      const saved = localStorage.getItem(NOTIF_STORAGE_KEY);
      if (saved) {
        notifications = JSON.parse(saved);
        if (!Array.isArray(notifications)) notifications = [];
      }
    } catch (e) {
      notifications = [];
    }
  }

  function saveNotifications() {
    try {
      localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(notifications.slice(0, 50)));
    } catch (e) {}
  }

  function addNotification(item) {
    const notif = {
      id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      category: item.category || 'system',
      title: item.title || 'Telemetry Notice',
      body: item.body || '',
      icon: item.icon || 'fa-bell',
      iconClass: item.iconClass || ('icon-notif-' + (item.category || 'system')),
      timestamp: Date.now(),
      isRead: false
    };

    notifications.unshift(notif);
    if (notifications.length > 50) {
      notifications.pop();
    }
    saveNotifications();
    updateNotifBadge();
    renderNotifications();

    const btn = document.getElementById('btn-notifications');
    if (btn) {
      btn.classList.remove('has-unread');
      void btn.offsetWidth; // trigger reflow
      btn.classList.add('has-unread');
    }
  }

  function updateNotifBadge() {
    const unreadCount = notifications.filter(n => !n.isRead).length;
    const badge = document.getElementById('notification-badge');
    const pill = document.getElementById('notif-count-pill');
    const btn = document.getElementById('btn-notifications');

    if (badge) {
      if (unreadCount > 0) {
        badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    }

    if (pill) {
      pill.textContent = unreadCount + ' New';
    }

    if (btn) {
      if (unreadCount > 0) {
        btn.classList.add('has-unread');
      } else {
        btn.classList.remove('has-unread');
      }
    }
  }

  function renderNotifications() {
    const list = document.getElementById('notif-items-list');
    if (!list) return;

    const filtered = activeNotifFilter === 'all'
      ? notifications
      : notifications.filter(n => n.category === activeNotifFilter);

    if (filtered.length === 0) {
      list.innerHTML = `
        <div class="notif-empty-state">
          <i class="fa-regular fa-bell-slash"></i>
          <p>No notifications ${activeNotifFilter !== 'all' ? 'in this category' : 'yet'}</p>
          <span>Live tour telemetry events will appear here</span>
        </div>
      `;
      return;
    }

    list.innerHTML = '';
    filtered.forEach(item => {
      const el = document.createElement('div');
      el.className = 'notif-item' + (item.isRead ? '' : ' unread');
      el.setAttribute('data-id', item.id);
      
      const timeStr = formatNotifTime(item.timestamp);
      el.innerHTML = `
        <div class="notif-item-icon ${escapeHtml(item.iconClass || 'icon-notif-system')}">
          <i class="fa-solid ${escapeHtml(item.icon || 'fa-bell')}"></i>
        </div>
        <div class="notif-item-content">
          <div class="notif-item-top">
            <span class="notif-item-title">${escapeHtml(item.title)}</span>
            <span class="notif-item-time">${escapeHtml(timeStr)}</span>
          </div>
          <div class="notif-item-body">${escapeHtml(item.body)}</div>
        </div>
      `;

      el.addEventListener('click', () => {
        item.isRead = true;
        el.classList.remove('unread');
        saveNotifications();
        updateNotifBadge();
      });

      list.appendChild(el);
    });
  }

  function formatNotifTime(ts) {
    if (!ts) return '';
    const diff = Date.now() - ts;
    if (diff < 10000) return 'Just now';
    if (diff < 60000) return Math.floor(diff / 1000) + 's ago';
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function setupNotificationCenter() {
    loadNotifications();
    updateNotifBadge();
    renderNotifications();

    const triggerBtn = document.getElementById('btn-notifications');
    const flyout = document.getElementById('notification-flyout');
    const markReadBtn = document.getElementById('btn-notif-mark-read');
    const clearBtn = document.getElementById('btn-notif-clear');
    const tabs = document.querySelectorAll('.notif-tab');

    if (triggerBtn && flyout) {
      triggerBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        isNotifFlyoutOpen = !isNotifFlyoutOpen;
        flyout.style.display = isNotifFlyoutOpen ? 'flex' : 'none';
        triggerBtn.classList.toggle('active', isNotifFlyoutOpen);
        triggerBtn.setAttribute('aria-expanded', String(isNotifFlyoutOpen));
        if (isNotifFlyoutOpen) {
          renderNotifications();
        }
      });

      // Close on outside click
      document.addEventListener('click', function (e) {
        if (isNotifFlyoutOpen && !flyout.contains(e.target) && !triggerBtn.contains(e.target)) {
          isNotifFlyoutOpen = false;
          flyout.style.display = 'none';
          triggerBtn.classList.remove('active');
          triggerBtn.setAttribute('aria-expanded', 'false');
        }
      });

      // Close on Escape key
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && isNotifFlyoutOpen) {
          isNotifFlyoutOpen = false;
          flyout.style.display = 'none';
          triggerBtn.classList.remove('active');
          triggerBtn.setAttribute('aria-expanded', 'false');
        }
      });
    }

    if (markReadBtn) {
      markReadBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        notifications.forEach(n => { n.isRead = true; });
        saveNotifications();
        updateNotifBadge();
        renderNotifications();
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        notifications = [];
        saveNotifications();
        updateNotifBadge();
        renderNotifications();
      });
    }

    tabs.forEach(tab => {
      tab.addEventListener('click', function (e) {
        e.stopPropagation();
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeNotifFilter = tab.getAttribute('data-filter') || 'all';
        renderNotifications();
      });
    });
  }

  // Toast Notification -> Diverted to Notification Center
  function showToast(text, category = 'system') {
    addNotification({
      category: category,
      title: 'Dashboard Notice',
      body: text,
      icon: 'fa-circle-info',
      iconClass: 'icon-notif-' + category
    });
  }

  // CSV Export
  function exportCSV() {
    const raw = dataStore.data;
    let csv = 'KRCE 360 Virtual Tour Analytics Report\n';
    csv += 'Generated: ' + new Date().toLocaleString() + '\n\n';

    csv += '--- SUMMARY KPIS ---\n';
    csv += `Total Visits,${raw.summary.totalVisits}\n`;
    csv += `Unique Visitors,${raw.summary.uniqueVisitors}\n`;
    csv += `Average Dwell Time (sec),${raw.summary.avgDwellSeconds}\n`;
    csv += `Mobile Ratio,${raw.summary.mobileRatioPercent}%\n\n`;

    csv += '--- LABORATORY & SCENE ENGAGEMENT ---\n';
    csv += 'Rank,Laboratory / Scene,Department,Floor,Total Views,Avg Dwell (sec)\n';
    raw.labEngagement.forEach((lab, index) => {
      csv += `${index + 1},"${lab.name}","${lab.deptName}","${lab.floor}",${lab.views},${lab.dwellTimeSec}\n`;
    });

    downloadBlob(csv, 'text/csv', 'KRCE_Tour_Analytics_' + Date.now() + '.csv');
    showToast('Analytics CSV report exported successfully.');
  }

  // JSON Export
  function exportJSON() {
    const jsonStr = JSON.stringify(dataStore.data, null, 2);
    downloadBlob(jsonStr, 'application/json', 'KRCE_Tour_Analytics_' + Date.now() + '.json');
    showToast('Analytics JSON dataset exported successfully.');
  }

  function downloadBlob(content, mimeType, filename) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function escapeHtml(string) {
    const div = document.createElement('div');
    div.textContent = string;
    return div.innerHTML;
  }

  // Auto initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
