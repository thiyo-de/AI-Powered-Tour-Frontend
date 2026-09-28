/**
 * KRCE Virtual Tour - Non-Blocking Telemetry Tracker
 * File: analytics/tracker.js
 * Strictly isolated: Zero component files inside KRCE/Components/
 * Conforms to analytics/task.md specifications
 */

(function () {
  'use strict';

  if (window.__KRCE_TOUR_TRACKER_INITIALIZED__) return;
  window.__KRCE_TOUR_TRACKER_INITIALIZED__ = true;

  // NOTE: tour-tracker.js intentionally has no STORAGE_KEY.
  // It never reads or writes krce_tour_telemetry_v2 — that is owned by TelemetryStore.
  const CHANNEL_NAME = 'krce_telemetry';
  const SUPABASE_CONFIG = {
    url: 'https://bqiajzfllcotjyskbczo.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxaWFqemZsbGNvdGp5c2tiY3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0NjY5MzQsImV4cCI6MjEwNTA0MjkzNH0.r0uLpNJl6bei-qXguNmc1eQXSTeuhojIxdZyi1xubCM'
  };

  let broadcastChannel = null;
  let supabaseClient = null;

  if ('BroadcastChannel' in window) {
    try {
      broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
    } catch (e) {
      console.warn('[Tracker] BroadcastChannel initialization skipped:', e);
    }
  }

  try {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    }
  } catch (e) {}

  let visitorId = '';
  try {
    visitorId = localStorage.getItem('krce_visitor_uuid');
    if (!visitorId) {
      visitorId = 'vis_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('krce_visitor_uuid', visitorId);
    }
  } catch (e) {
    visitorId = 'vis_' + Date.now();
  }

  let sessionId = '';
  try {
    sessionId = sessionStorage.getItem('krce_session_uuid');
    if (!sessionId) {
      sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem('krce_session_uuid', sessionId);
    }
  } catch (e) {
    sessionId = 'sess_' + Date.now();
  }

  // Active scene tracking state
  let currentSceneName = '';
  let sceneEnterTime = Date.now();
  let tabHiddenTimestamp = 0;
  let isFlushedOnExit = false;

  function getDeviceType() {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isNarrow = window.innerWidth < 768;
    return (isTouch && isNarrow) ? 'Mobile Device' : 'Desktop Browser';
  }

  function formatDwellTime(ms) {
    const totalSec = Math.max(1, Math.round(ms / 1000));
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    if (mins === 0) return secs + 's';
    return mins + 'm ' + (secs < 10 ? '0' : '') + secs + 's';
  }

  function resolveDepartmentName(sceneName) {
    const s = String(sceneName || '').toLowerCase();
    if (s.includes('mech') || s.includes('thermal') || s.includes('cad') || s.includes('dynamics') || s.includes('fluid') || s.includes('manufacturing')) return 'Mechanical';
    if (s.includes('cse') || s.includes('compiler') || s.includes('os') || s.includes('practice') || s.includes('project')) return 'CSE';
    if (s.includes('csbs') || s.includes('alan turing') || s.includes('codecraft')) return 'CSBS';
    if (s.includes('data science') || s.includes('ai & ds') || s.includes('artificial')) return 'AI & DS';
    if (s.includes('ece') || s.includes('vlsi') || s.includes('embedded') || s.includes('comm') || s.includes('dsp')) return 'ECE';
    if (s.includes('eee') || s.includes('power') || s.includes('electric')) return 'EEE';
    if (s.includes('civil') || s.includes('survey') || s.includes('soil') || s.includes('concrete')) return 'Civil';
    return 'Campus';
  }

  // Asynchronous non-blocking dispatch
  // ARCHITECTURE: tour-tracker.js is a SIGNAL-ONLY sender.
  // It must NEVER write to krce_tour_telemetry_v2 localStorage.
  // TelemetryStore (analytics/js/analytics-data.js) is the sole owner of that key.
  // Writing here AND in app.js.recordLiveEvent() = +2 double-count. FIXED.
  function dispatchTelemetry(sceneName, dwellFormatted, dwellSeconds, status = 'active') {
    const dwellSec = typeof dwellSeconds === 'number' ? dwellSeconds : 0;
    const payload = {
      type: 'scene_view',
      sceneName: sceneName,
      department: resolveDepartmentName(sceneName),
      dwell: dwellFormatted,
      dwellSeconds: dwellSec,
      device: getDeviceType(),
      visitorId: visitorId,
      sessionId: sessionId,
      status: status,
      timestamp: Date.now()
    };

    // 1. Cross-Tab BroadcastChannel → dashboard tab receives this and calls recordLiveEvent() ONCE
    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage(payload);
      } catch (err) {
        // ignore
      }
    }

    // 2. Supabase Cloud Ingestion (Async Non-Blocking)
    if (supabaseClient) {
      try {
        supabaseClient.from('scene_telemetry').insert([{
          session_id: sessionId,
          visitor_id: visitorId,
          scene_name: sceneName,
          department: payload.department,
          dwell_seconds: dwellSec,
          dwell_formatted: dwellFormatted,
          device_platform: payload.device,
          status: status
        }]).then(function () {}).catch(function () {});
      } catch (supaErr) {}
    }
  }

  let activeHeartbeatTimer = null;
  function startDwellHeartbeat() {
    if (activeHeartbeatTimer) clearInterval(activeHeartbeatTimer);
    activeHeartbeatTimer = setInterval(function () {
      if (!currentSceneName || (typeof document !== 'undefined' && document.visibilityState === 'hidden')) return;
      const now = Date.now();
      const dwellMs = Math.max(1000, now - sceneEnterTime);
      const dwellFormatted = formatDwellTime(dwellMs);
      const dwellSec = Math.max(1, Math.round(dwellMs / 1000));
      dispatchTelemetry(currentSceneName, dwellFormatted, dwellSec, 'active');
    }, 5000);
  }

  // Handle scene transition
  function onSceneTransition(newSceneName) {
    const trimmed = String(newSceneName || '').trim();
    if (!trimmed || trimmed === 'Preparing the tour' || trimmed === 'Loading…') return;
    if (trimmed === currentSceneName) return;

    const now = Date.now();
    // 1. If leaving an existing scene, flush its completed dwell time
    if (currentSceneName) {
      const effectiveNow = (tabHiddenTimestamp > 0) ? tabHiddenTimestamp : now;
      const dwellMs = Math.max(1000, effectiveNow - sceneEnterTime);
      const dwellFormatted = formatDwellTime(dwellMs);
      const dwellSec = Math.max(1, Math.round(dwellMs / 1000));
      dispatchTelemetry(currentSceneName, dwellFormatted, dwellSec, 'completed');
    }

    // 2. Switch to new scene
    currentSceneName = trimmed;
    sceneEnterTime = now;
    tabHiddenTimestamp = 0;
    isFlushedOnExit = false;

    // 3. INSTANT ENTRY PING: notify dashboard that this panorama is now active!
    dispatchTelemetry(currentSceneName, '0s', 0, 'active');
    startDwellHeartbeat();
  }

  // Extract all panoramas dynamically from 3DVista's runtime
  function extractAll3DVistaPanoramas() {
    if (!window.tour) return [];
    const player = window.tour.player || (window.tour._getRootPlayer ? window.tour._getRootPlayer() : null);
    if (!player) return [];

    let playlist = null;
    if (typeof player.getById === 'function') {
      playlist = player.getById('mainPlayList');
    }
    if (!playlist && typeof player.getByClassName === 'function') {
      const lists = player.getByClassName('PlayList');
      if (lists && lists.length > 0) playlist = lists[0];
    }

    const panos = [];
    if (playlist && typeof playlist.get === 'function') {
      const items = playlist.get('items') || [];
      items.forEach(function (item, idx) {
        const media = item.get ? item.get('media') : null;
        if (!media) return;
        const mediaId = String(media.get('id') || '');
        const data = (media.get && media.get('data')) || {};
        const label = data.label || (media.get && media.get('label')) || (item.get && item.get('label')) || ('Panorama ' + (idx + 1));
        panos.push({
          id: mediaId || ('pano_' + idx),
          name: String(label).trim(),
          index: idx
        });
      });
    }

    if (panos.length === 0 && typeof player.getByClassName === 'function') {
      const panoList = player.getByClassName('Panorama');
      if (panoList && panoList.length > 0) {
        panoList.forEach(function (p, idx) {
          const id = String(p.get('id') || '');
          const data = (p.get && p.get('data')) || {};
          const label = data.label || p.get('label') || ('Panorama ' + (idx + 1));
          panos.push({
            id: id || ('pano_' + idx),
            name: String(label).trim(),
            index: idx
          });
        });
      }
    }

    return panos;
  }

  let hasBroadcastManifest = false;
  function broadcastManifestIfReady() {
    if (hasBroadcastManifest) return;
    const panos = extractAll3DVistaPanoramas();
    if (panos.length > 0) {
      hasBroadcastManifest = true;
      try {
        localStorage.setItem('tour_manifest_scenes', JSON.stringify(panos));
      } catch (e) {}

      if (broadcastChannel) {
        try {
          broadcastChannel.postMessage({
            type: 'tour_manifest',
            tourTitle: document.title || 'Virtual Tour',
            panoramas: panos
          });
        } catch (e) {}
      }
    }
  }

  function getCurrentActiveSceneLabel() {
    if (!window.tour) return null;
    const root = window.tour._getRootPlayer ? window.tour._getRootPlayer() : (window.tour.player ? (window.tour.player.getById ? window.tour.player.getById('rootPlayer') : null) : null);
    if (!root || typeof root.getMainViewer !== 'function' || typeof root.getActiveMediaWithViewer !== 'function') {
      return null;
    }
    const viewer = root.getMainViewer();
    if (!viewer) return null;
    const media = root.getActiveMediaWithViewer(viewer);
    if (!media) return null;
    const data = (media.get && media.get('data')) || {};
    const label = data.label || (media.get && media.get('label')) || media.get('id');
    return label ? String(label).trim() : null;
  }

  // Universal Scene Observer:
  // Hook 1: Direct 3DVista Player Active Media Poller & PlayList Events (Universal across ANY 3DVista tour)
  // Hook 2: SpatialUI #spatial-location-name (DOM fallback)
  function initObserver() {
    const locElem = (typeof document !== 'undefined' && typeof document.getElementById === 'function')
      ? document.getElementById('spatial-location-name')
      : null;
    if (locElem) {
      if (locElem.textContent) {
        onSceneTransition(locElem.textContent);
      }
      const observer = new MutationObserver(function () {
        if (locElem.textContent) {
          onSceneTransition(locElem.textContent);
        }
      });
      observer.observe(locElem, { childList: true, characterData: true, subtree: true });
    }

    // Universal 3DVista Player Lifecycle & Active Media Hook
    function checkTour() {
      if (window.tour) {
        broadcastManifestIfReady();

        const activeLabel = getCurrentActiveSceneLabel();
        if (activeLabel) {
          onSceneTransition(activeLabel);
        }

        try {
          const player = window.tour.player || (window.tour._getRootPlayer ? window.tour._getRootPlayer() : null);
          if (player) {
            let playlist = null;
            if (typeof player.getById === 'function') playlist = player.getById('mainPlayList');
            if (!playlist && typeof player.getByClassName === 'function') {
              const lists = player.getByClassName('PlayList');
              if (lists && lists.length > 0) playlist = lists[0];
            }
            if (playlist && typeof playlist.bind === 'function' && !playlist._krceBound) {
              playlist._krceBound = true;
              playlist.bind('change', function () {
                setTimeout(function () {
                  const lbl = getCurrentActiveSceneLabel();
                  if (lbl) onSceneTransition(lbl);
                }, 50);
              });
            }
          }
        } catch (e) {}
      }

      setTimeout(checkTour, 250);
    }
    checkTour();
  }

  // Feature interactions listener (delegated click tracking using CAPTURE phase)
  function initFeatureTracker() {
    // Capture phase (useCapture: true) intercepts the click before any child component can call event.stopPropagation()!
    document.addEventListener('click', function (e) {
      if (!e || !e.target) return;

      let action = null;
      // 1. Direct or closest data-spatial-action, data-feature, or data-spatial-filter
      const btn = e.target.closest('[data-spatial-action], [data-feature], [data-spatial-filter]');
      if (btn) {
        action = btn.getAttribute('data-spatial-action') || 
                 btn.getAttribute('data-feature') || 
                 (btn.getAttribute('data-spatial-filter') ? 'filter_' + btn.getAttribute('data-spatial-filter') : null);
      }

      // 2. Liquid kinetic menu item / radial orb click
      if (!action) {
        const menuItem = e.target.closest('.liquid-menu-item, [data-label]');
        if (menuItem) {
          const label = (menuItem.getAttribute('data-label') || '').toLowerCase();
          if (label.includes('explore')) action = 'explore';
          else if (label.includes('street')) action = 'street';
          else if (label.includes('social')) action = 'social';
          else if (label.includes('home')) action = 'home';
        }
      }

      // 3. Radial orb root button
      if (!action) {
        const orbBtn = e.target.closest('.liquid-orb, #liquid-radial-container');
        if (orbBtn) action = 'portal';
      }

      // 4. Audio / music button click
      if (!action) {
        const audioBtn = e.target.closest('#music-toggle, .music-toggle, [aria-label*="audio" i], [aria-label*="music" i]');
        if (audioBtn) action = 'audio';
      }

      // 5. In-scene 3DVista hotspot / overlay click
      if (!action) {
        const hotspot = e.target.closest('[class*="hotspot" i], [class*="Hotspot" i], [id*="hotspot" i]');
        if (hotspot) action = 'hotspot';
      }

      if (action) {
        // Pending queue in localStorage for cross-tab launch sync
        try {
          const raw = localStorage.getItem('krce_pending_features');
          const pending = raw ? JSON.parse(raw) : [];
          pending.push(action);
          localStorage.setItem('krce_pending_features', JSON.stringify(pending.slice(-100)));
        } catch (err) {}

        // BroadcastChannel → dashboard feature chart
        if (broadcastChannel) {
          try {
            broadcastChannel.postMessage({
              type: 'feature_click',
              feature: action,
              payload: { featureName: action },
              timestamp: Date.now()
            });
          } catch (err) {}
        }
        // Supabase cloud persistence
        if (supabaseClient) {
          try {
            supabaseClient.from('feature_interactions').insert([{
              session_id: sessionId,
              feature_name: action
            }]).then(function () {}).catch(function () {});
          } catch (supaErr) {}
        }
      }
    }, true);
  }

  // Admin Shortcut: Shift + A launches the Analytics Panel
  function initAdminShortcut() {
    window.addEventListener('keydown', function (e) {
      if (e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        window.open('../analytics/index.html', '_blank');
      }
    });
  }

  // Pause/resume active dwell time calculation across background tab states
  // Do NOT dispatch false visit completions on casual tab switching
  window.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') {
      tabHiddenTimestamp = Date.now();
    } else if (document.visibilityState === 'visible' && tabHiddenTimestamp > 0) {
      const backgroundDuration = Date.now() - tabHiddenTimestamp;
      sceneEnterTime += backgroundDuration;
      tabHiddenTimestamp = 0;
    }
  });

  // Flush dwell time only when user actually unloads or closes the tour tab
  function flushOnPageExit() {
    if (isFlushedOnExit || !currentSceneName) return;
    isFlushedOnExit = true;
    const now = Date.now();
    const effectiveNow = (tabHiddenTimestamp > 0) ? tabHiddenTimestamp : now;
    const dwellMs = Math.max(1000, effectiveNow - sceneEnterTime);
    const dwellFormatted = formatDwellTime(dwellMs);
    const dwellSec = Math.max(1, Math.round(dwellMs / 1000));
    dispatchTelemetry(currentSceneName, dwellFormatted, dwellSec);
  }

  window.addEventListener('pagehide', flushOnPageExit);
  window.addEventListener('beforeunload', flushOnPageExit);

  // Start initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initObserver();
      initFeatureTracker();
      initAdminShortcut();
    });
  } else {
    initObserver();
    initFeatureTracker();
    initAdminShortcut();
  }

  console.log('[KRCE Analytics Tracker] Active (Shift+A to open dashboard)');
})();
