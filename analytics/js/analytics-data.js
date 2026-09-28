/**
 * KRCE Virtual Tour Analytics - Telemetry Data Engine
 * Conforms to analytics/task.md specifications
 * Parses real departments and labs from KRCE/Department.txt
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.KRCEAnalyticsData = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const STORAGE_KEY = 'krce_tour_telemetry_v2';
  const BROADCAST_CHANNEL_NAME = 'krce_telemetry';

  // Master dictionary parsed from KRCE/Department.txt
  // Master dictionary populated from KRCE/Department.txt (all 31 viewpoints)
  const CAMPUS_STRUCTURE = {
    departments: [
      {
        id: 'mech',
        name: 'Mechanical Engineering',
        icon: 'fa-solid fa-gears',
        shortName: 'Mech',
        labs: [
          { id: 'mech_manufacturing', name: 'Manufacturing Technology Lab', floor: 'Ground Floor', weight: 1.05 },
          { id: 'mech_thermal', name: 'Thermal Engineering Lab', floor: 'Ground Floor', weight: 0.95 },
          { id: 'mech_fluid', name: 'Fluid Mechanics and Machinery Lab', floor: 'Ground Floor', weight: 0.9 },
          { id: 'mech_cad_cam', name: 'CAD/CAM Lab', floor: '1st Floor', weight: 1.15 },
          { id: 'mech_ar_vr', name: 'AR/VR Laboratory', floor: '1st Floor', weight: 1.35 },
          { id: 'mech_research', name: 'Research Lab', floor: '1st Floor', weight: 0.85 },
          { id: 'mech_mechatronics', name: 'Mechatronics Laboratory', floor: '4th Floor', weight: 1.1 }
        ]
      },
      {
        id: 'cse',
        name: 'Computer Science & Engineering',
        icon: 'fa-solid fa-laptop-code',
        shortName: 'CSE',
        labs: [
          { id: 'cse_project', name: 'Project Laboratory', floor: '2nd Floor', weight: 1.4 },
          { id: 'cse_compiler', name: 'Compiler Laboratory', floor: '2nd Floor', weight: 1.0 },
          { id: 'cse_os', name: 'Operating System Laboratory', floor: '2nd Floor', weight: 1.1 },
          { id: 'cse_practice', name: 'Computer Practice Laboratory', floor: '2nd Floor', weight: 0.95 }
        ]
      },
      {
        id: 'csbs',
        name: 'Computer Science & Business System',
        icon: 'fa-solid fa-network-wired',
        shortName: 'CSBS',
        labs: [
          { id: 'csbs_turing', name: 'Alan Turing Lab', floor: '5th Floor', weight: 1.45 },
          { id: 'csbs_codecraft', name: 'Code Craft Lab', floor: '5th Floor', weight: 1.25 }
        ]
      },
      {
        id: 'eee',
        name: 'Electrical & Electronics Engineering',
        icon: 'fa-solid fa-bolt',
        shortName: 'EEE',
        labs: [
          { id: 'eee_machines', name: 'Electrical machines laboratory', floor: '1st Floor', weight: 0.95 },
          { id: 'eee_control', name: 'Control and Instrumentation laboratory', floor: '1st Floor', weight: 1.0 },
          { id: 'eee_power', name: 'Power Electronics laboratory', floor: '1st Floor', weight: 1.1 },
          { id: 'eee_renewable', name: 'Renewable Energy Systems laboratory', floor: '1st Floor', weight: 1.25 },
          { id: 'eee_circuits', name: 'Linear Integrated and Digital Circuits Laboratory', floor: '1st Floor', weight: 1.05 },
          { id: 'eee_simulation', name: 'Power system simulation laboratory', floor: '1st Floor', weight: 0.9 },
          { id: 'eee_rd', name: 'Research and Development laboratory', floor: '2nd Floor', weight: 0.85 }
        ]
      },
      {
        id: 'ece',
        name: 'Electronics & Communication Engineering',
        icon: 'fa-solid fa-microchip',
        shortName: 'ECE',
        labs: [
          { id: 'ece_dsp', name: 'Digital signal processing lab', floor: '3rd Floor', weight: 0.9 },
          { id: 'ece_iot', name: 'Embedded systems and iot lab', floor: '3rd Floor', weight: 1.3 },
          { id: 'ece_comms', name: 'Analog and digital communications lab', floor: '3rd Floor', weight: 1.0 },
          { id: 'ece_rf', name: 'RF systems design and optical communication lab', floor: '3rd Floor', weight: 1.05 },
          { id: 'ece_programming', name: 'Programming lab', floor: '3rd Floor', weight: 1.1 },
          { id: 'ece_micro', name: 'Microprocessor and Microcontrollers lab', floor: '3rd Floor', weight: 1.15 },
          { id: 'ece_practice', name: 'Engineering practice lab', floor: '3rd Floor', weight: 0.95 },
          { id: 'ece_vlsi', name: 'Advanced vlsi design lab', floor: '3rd Floor', weight: 1.2 }
        ]
      },
      {
        id: 'aids',
        name: 'Artificial Intelligence & Data Science',
        icon: 'fa-solid fa-brain',
        shortName: 'AI & DS',
        labs: [
          { id: 'aids_ds', name: 'DS lab', floor: '4th Floor', weight: 1.5 },
          { id: 'aids_ml', name: 'ML lab', floor: '4th Floor', weight: 1.4 }
        ]
      },
      {
        id: 'it',
        name: 'Information Technology',
        icon: 'fa-solid fa-code-branch',
        shortName: 'IT',
        labs: [
          { id: 'it_apex', name: 'Apex Lab', floor: '5th Floor', weight: 1.3 }
        ]
      }
    ]
  };

  function resolveDepartment(sceneName) {
    const s = String(sceneName || '').toLowerCase();
    if (s.includes('mech') || s.includes('thermal') || s.includes('cad') || s.includes('dynamics') || s.includes('fluid') || s.includes('manufacturing')) return 'Mech';
    if (s.includes('cse') || s.includes('compiler') || s.includes('os') || s.includes('practice') || s.includes('project')) return 'CSE';
    if (s.includes('csbs') || s.includes('alan turing') || s.includes('alan-turing') || s.includes('codecraft') || s.includes('code craft')) return 'CSBS';
    if (s.includes('data science') || s.includes('ai & ds') || s.includes('artificial') || s.includes('ml lab') || s.includes('ds lab')) return 'AI & DS';
    if (s.includes('ece') || s.includes('vlsi') || s.includes('embedded') || s.includes('comm') || s.includes('dsp') || s.includes('rf systems')) return 'ECE';
    if (s.includes('eee') || s.includes('power') || s.includes('electric') || s.includes('control and') || s.includes('renewable') || s.includes('circuits')) return 'EEE';
    if (s.includes('it') || s.includes('apex')) return 'IT';
    if (s.includes('civil') || s.includes('survey') || s.includes('soil') || s.includes('concrete')) return 'Civil';
    if (s.includes(' - ')) return s.split(' - ')[0].trim();
    if (s.includes(':')) return s.split(':')[0].trim();
    return 'Campus Viewpoint';
  }

  function parseDwellToSeconds(str) {
    if (!str) return 10;
    if (typeof str === 'number') return str;
    const mMatch = str.match(/(\d+)\s*m/);
    const sMatch = str.match(/(\d+)\s*s/);
    const mins = mMatch ? parseInt(mMatch[1], 10) : 0;
    const secs = sMatch ? parseInt(sMatch[1], 10) : 0;
    const total = (mins * 60) + secs;
    return total > 0 ? total : 10;
  }

  function formatSeconds(sec) {
    const s = Math.round(sec || 0);
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}m ${(rem < 10 ? '0' : '') + rem}s`;
  }

  function formatDuration(sec) {
    const s = Math.round(sec || 0);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h > 0) {
      return `${h}h ${(m < 10 ? '0' : '') + m}m`;
    }
    const rem = s % 60;
    return `${m}m ${(rem < 10 ? '0' : '') + rem}s`;
  }

  // Clean zero-state initial data (pure dynamic telemetry tracking)
  function generateBaselineData() {
    // Full 24-hour chart — captures all visitor times including late night and early morning
    const hourlyVisits = Array.from({ length: 24 }, function (_, h) {
      return { hour: (h < 10 ? '0' : '') + h + ':00', views: 0 };
    });

    const featureInteractions = {
      streetView: 0,
      audioGuide: 0,
      compassNav: 0,
      campusPortal: 0,
      socialShare: 0,
      hotspotClicks: 0
    };

    // Flatten all labs initialized to 0 views
    // Priority: Dynamic Tour Manifest (any project) -> Fallback: CAMPUS_STRUCTURE (KRCE)
    const labEngagement = [];
    let manifestPanos = [];
    try {
      const storedManifest = localStorage.getItem('tour_manifest_scenes');
      if (storedManifest) manifestPanos = JSON.parse(storedManifest);
    } catch (e) {}

    if (Array.isArray(manifestPanos) && manifestPanos.length > 0) {
      manifestPanos.forEach(p => {
        labEngagement.push({
          id: p.id || ('pano_' + p.index),
          name: p.name,
          deptName: resolveDepartment(p.name),
          floor: '',
          views: 0,
          dwellTimeSec: 0
        });
      });
    } else {
      CAMPUS_STRUCTURE.departments.forEach(dept => {
        dept.labs.forEach(lab => {
          labEngagement.push({
            id: lab.id,
            name: lab.name,
            deptName: dept.shortName,
            floor: lab.floor,
            views: 0,
            dwellTimeSec: 0
          });
        });
      });
    }

    return {
      version: 2,
      lastUpdated: new Date().toISOString(),
      summary: {
        totalVisits: 0,
        uniqueVisitors: 0,
        avgDwellSeconds: 0,
        mobileRatioPercent: 0,
        topLabName: 'None',
        topDeptName: 'None'
      },
      events: [],
      uniqueSessionsMap: {},
      uniqueVisitorsMap: {},
      totalDwellSum: 0,
      mobileVisitsCount: 0,
      hourlyVisits: hourlyVisits,
      featureInteractions: featureInteractions,
      hydratedFeatureIds: {},
      labEngagement: labEngagement,
      recentSessions: [],
      activePresence: {}
    };
  }

  // Helper to map incoming feature action strings to the 6 dashboard feature metrics
  function mapFeatureActionToKey(featureAction) {
    if (!featureAction) return null;
    const act = String(featureAction).toLowerCase().trim();
    if (act === 'street' || act.includes('street') || act === 'gsv') {
      return 'streetView';
    }
    if (act === 'audio' || act.includes('audio') || act.includes('music') || act.includes('sound')) {
      return 'audioGuide';
    }
    if (act === 'fullscreen' || act === 'compass' || act === 'home' || act === 'visibility' || act.includes('nav') || act.includes('dock')) {
      return 'compassNav';
    }
    if (act === 'explore' || act === 'scenes' || act.includes('filter') || act.includes('portal') || act.includes('slide') || act.includes('orb')) {
      return 'campusPortal';
    }
    if (act === 'social' || act.includes('share')) {
      return 'socialShare';
    }
    if (act === 'hotspot' || act.includes('hotspot')) {
      return 'hotspotClicks';
    }
    return null;
  }

  // Storage and Sync Manager
  class TelemetryStore {
    constructor() {
      this.data = this.load();
      this.initBroadcast();
      // In-memory deduplication set: prevents Supabase Realtime from double-counting
      // events that were already counted via BroadcastChannel (same-browser same-session).
      // Key format: "<visitorId>|<sceneName>|<10s bucket>" — expires after 30 seconds.
      this.recentEventKeys = new Set();
    }

    load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          // Invalidate legacy mock cache (version 1 with ~14k visits)
          if (parsed && parsed.version === 2) {
            parsed.events = Array.isArray(parsed.events) ? parsed.events : [];
            parsed.uniqueVisitorsMap = parsed.uniqueVisitorsMap || {};
            parsed.uniqueSessionsMap = parsed.uniqueSessionsMap || {};
            parsed.activePresence = parsed.activePresence || {};
            
            // Reconstruct maps from events if missing
            if (Object.keys(parsed.uniqueSessionsMap).length === 0 && parsed.events.length > 0) {
              parsed.events.forEach(e => {
                if (e.sessionId) parsed.uniqueSessionsMap[e.sessionId] = true;
                if (e.visitorId) parsed.uniqueVisitorsMap[e.visitorId] = true;
              });
            }

            // Strictly enforce 1 System = 1 Unique Visitor & 1 Session = 1 Total Visit
            parsed.summary = parsed.summary || {};
            parsed.summary.totalVisits = Object.keys(parsed.uniqueSessionsMap).length;
            parsed.summary.uniqueVisitors = Object.keys(parsed.uniqueVisitorsMap).length;
            
            if (parsed.summary.totalVisits > 0 && parsed.summary.avgDwellSeconds === 0 && parsed.totalDwellSum) {
              parsed.summary.avgDwellSeconds = Math.round(parsed.totalDwellSum / parsed.summary.totalVisits);
            }

            // Auto-heal legacy inflated counts from missing deduplication
            if (!parsed.hydratedFeatureIds) {
              parsed.featureInteractions = {
                streetView: 0,
                audioGuide: 0,
                compassNav: 0,
                campusPortal: 0,
                socialShare: 0,
                hotspotClicks: 0
              };
              parsed.hydratedFeatureIds = {};
            } else {
              parsed.featureInteractions = Object.assign({
                streetView: 0,
                audioGuide: 0,
                compassNav: 0,
                campusPortal: 0,
                socialShare: 0,
                hotspotClicks: 0
              }, parsed.featureInteractions || {});
            }

            // Ingest any offline pending features recorded while dashboard tab was closed
            try {
              const rawPending = localStorage.getItem('krce_pending_features');
              if (rawPending) {
                const pending = JSON.parse(rawPending);
                if (Array.isArray(pending) && pending.length > 0) {
                  pending.forEach(act => {
                    const key = mapFeatureActionToKey(act);
                    if (key && parsed.featureInteractions[key] !== undefined) {
                      parsed.featureInteractions[key] += 1;
                    }
                  });
                  localStorage.removeItem('krce_pending_features');
                }
              }
            } catch (err) {}

            return parsed;
          }
        }
      } catch (e) {
        console.warn('[KRCE Analytics] Storage load fallback:', e);
      }
      const baseline = generateBaselineData();
      try {
        const rawPending = localStorage.getItem('krce_pending_features');
        if (rawPending) {
          const pending = JSON.parse(rawPending);
          if (Array.isArray(pending) && pending.length > 0) {
            pending.forEach(act => {
              const key = mapFeatureActionToKey(act);
              if (key && baseline.featureInteractions[key] !== undefined) {
                baseline.featureInteractions[key] += 1;
              }
            });
            localStorage.removeItem('krce_pending_features');
          }
        }
      } catch (err) {}
      this.save(baseline);
      return baseline;
    }

    save(dataToSave) {
      this.data = dataToSave || this.data;
      this.data.lastUpdated = new Date().toISOString();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      } catch (e) {
        console.error('[KRCE Analytics] Failed to save localStorage:', e);
      }
    }

    setTourManifest(panoramas) {
      if (!Array.isArray(panoramas) || panoramas.length === 0) return;
      this.data.labEngagement = Array.isArray(this.data.labEngagement) ? this.data.labEngagement : [];
      let updated = false;

      panoramas.forEach(p => {
        const pName = String(p.name || '').trim();
        if (!pName) return;
        const exists = this.data.labEngagement.some(l => 
          l.name.toLowerCase().trim() === pName.toLowerCase() ||
          (l.id && p.id && l.id === p.id)
        );
        if (!exists) {
          this.data.labEngagement.push({
            id: p.id || ('pano_' + (p.index !== undefined ? p.index : Date.now())),
            name: pName,
            deptName: resolveDepartment(pName),
            floor: '',
            views: 0,
            dwellTimeSec: 0
          });
          updated = true;
        }
      });

      if (updated) {
        this.save();
      }
    }

    // Record individual feature button or dock interaction
    recordFeatureInteraction(featureAction, recordId) {
      if (!featureAction) return;
      if (recordId) {
        this.data.hydratedFeatureIds = this.data.hydratedFeatureIds || {};
        if (this.data.hydratedFeatureIds[recordId]) return;
        this.data.hydratedFeatureIds[recordId] = true;
      }
      this.data.featureInteractions = this.data.featureInteractions || {
        streetView: 0,
        audioGuide: 0,
        compassNav: 0,
        campusPortal: 0,
        socialShare: 0,
        hotspotClicks: 0
      };

      const act = String(featureAction).toLowerCase().trim();
      let key = mapFeatureActionToKey(act);
      if (!key && this.data.featureInteractions[act] !== undefined) {
        key = act;
      }

      if (key && this.data.featureInteractions[key] !== undefined) {
        this.data.featureInteractions[key] = (this.data.featureInteractions[key] || 0) + 1;
        this.save();
      }
    }

    // Hydrate feature clicks from Supabase cloud table with strict deduplication
    hydrateFeaturesFromSupabase(records) {
      if (!Array.isArray(records) || records.length === 0) return;
      this.data.featureInteractions = this.data.featureInteractions || {
        streetView: 0,
        audioGuide: 0,
        compassNav: 0,
        campusPortal: 0,
        socialShare: 0,
        hotspotClicks: 0
      };
      this.data.hydratedFeatureIds = this.data.hydratedFeatureIds || {};
      let modified = false;
      records.forEach(r => {
        if (!r.id || this.data.hydratedFeatureIds[r.id]) return; // Deduplicated!
        this.data.hydratedFeatureIds[r.id] = true;
        const featName = r.feature_name;
        const key = mapFeatureActionToKey(featName);
        if (key && this.data.featureInteractions[key] !== undefined) {
          this.data.featureInteractions[key] = (this.data.featureInteractions[key] || 0) + 1;
          modified = true;
        }
      });
      if (modified) {
        this.save();
      }
    }

    initBroadcast() {
      if ('BroadcastChannel' in window) {
        this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      }
    }

    // Record incoming live tour event
    recordLiveEvent(payload) {
      if (!payload || !payload.sceneName) return;

      const timestamp = payload.timestamp || Date.now();
      const dwellSeconds = typeof payload.dwellSeconds === 'number' 
        ? payload.dwellSeconds 
        : parseDwellToSeconds(payload.dwell);
      const visitorId = payload.visitorId || 'vis_local';
      const isMobile = (payload.device || '').toLowerCase().includes('mobile');
      const isCompleted = payload.status === 'completed';
      const now = Date.now();
      this.data.activePresence = this.data.activePresence || {};

      if (payload.status === 'active' || (!payload.status && !isCompleted)) {
        this.data.currentActiveScene = payload.sceneName;
        this.data.activePresence[visitorId] = {
          scene: payload.sceneName,
          timestamp: now,
          device: payload.device || (isMobile ? 'Mobile Device' : 'Desktop Browser')
        };
      } else if (isCompleted) {
        if (this.data.activePresence[visitorId] && (this.data.activePresence[visitorId].scene || '').toLowerCase() === (payload.sceneName || '').toLowerCase()) {
          delete this.data.activePresence[visitorId];
        }
        if (this.data.currentActiveScene === payload.sceneName) {
          const remaining = Object.values(this.data.activePresence).find(p => (now - p.timestamp) <= 15000);
          this.data.currentActiveScene = remaining ? remaining.scene : null;
        }
      }

      // DEDUPLICATION: Supabase Realtime fires another "scene_view" for every INSERT.
      // Separate active entry from completed transition so completed dwell is never dropped!
      const timeBucket = Math.floor(timestamp / 3000);
      const dedupKey = visitorId + '|' + payload.sceneName + '|' + (isCompleted ? 'comp' : 'act') + '|' + timeBucket;
      if (this.recentEventKeys.has(dedupKey) && !isCompleted) {
        return;
      }
      this.recentEventKeys.add(dedupKey);
      setTimeout(() => { this.recentEventKeys.delete(dedupKey); }, 10000);

      // Check if this event is an in-place dwell update for the currently active session and scene
      const activeSessionIndex = this.data.recentSessions.findIndex(s =>
        (s.sessionId && payload.sessionId && s.sessionId === payload.sessionId) ||
        (s.visitorId && visitorId && s.visitorId === visitorId && s.scene === payload.sceneName)
      );
      const isSameActiveScene = (activeSessionIndex !== -1) && (this.data.recentSessions[activeSessionIndex].scene === payload.sceneName);

      if (isSameActiveScene) {
        // In-place update: same visitor continuing or completing this scene
        const existingSession = this.data.recentSessions[activeSessionIndex];
        const prevDwellSec = parseDwellToSeconds(existingSession.dwell);
        const dwellDelta = Math.max(0, dwellSeconds - prevDwellSec);

        existingSession.dwell = payload.dwell || (dwellSeconds + 's');
        existingSession.time = 'Just now';
        existingSession.status = payload.status || 'active';
        if (existingSession.status === 'active') {
          this.data.currentActiveScene = payload.sceneName;
          this.data.activePresence[visitorId] = {
            scene: payload.sceneName,
            timestamp: now,
            device: payload.device || (isMobile ? 'Mobile Device' : 'Desktop Browser')
          };
        } else if (existingSession.status === 'completed') {
          if (this.data.activePresence[visitorId] && (this.data.activePresence[visitorId].scene || '').toLowerCase() === (payload.sceneName || '').toLowerCase()) {
            delete this.data.activePresence[visitorId];
          }
          if (this.data.currentActiveScene === payload.sceneName) {
            const remaining = Object.values(this.data.activePresence).find(p => (now - p.timestamp) <= 15000);
            this.data.currentActiveScene = remaining ? remaining.scene : null;
          }
        }

        // Update dwell sums without double-counting visits
        this.data.totalDwellSum = (this.data.totalDwellSum || 0) + dwellDelta;
        if (this.data.summary.totalVisits > 0) {
          this.data.summary.avgDwellSeconds = Math.round(this.data.totalDwellSum / this.data.summary.totalVisits);
        }

        const lab = this.data.labEngagement.find(l => 
          l.name.toLowerCase().includes(payload.sceneName.toLowerCase()) || 
          payload.sceneName.toLowerCase().includes(l.name.toLowerCase())
        );
        if (lab) {
          lab.dwellTimeSec = (lab.dwellTimeSec || 0) + dwellDelta;
        }

        // Update the event record dwell
        const existingEvt = this.data.events.slice().reverse().find(e =>
          (e.sessionId === payload.sessionId || e.visitorId === visitorId) && e.sceneName === payload.sceneName
        );
        if (existingEvt) {
          existingEvt.dwell = existingSession.dwell;
          existingEvt.dwellSeconds = dwellSeconds;
        }

        this.save();
        return;
      }

      // If user moved to a NEW scene, mark previous active session for this visitor as 'completed'
      if (activeSessionIndex !== -1) {
        this.data.recentSessions[activeSessionIndex].status = 'completed';
      }

      // 1. Accumulate raw event log
      if (!Array.isArray(this.data.events)) {
        this.data.events = [];
      }
      const eventRecord = {
        id: payload.id || ('evt-' + Date.now() + '-' + Math.floor(Math.random() * 1000)),
        sceneName: payload.sceneName,
        dwell: payload.dwell || (dwellSeconds + 's'),
        dwellSeconds: dwellSeconds,
        device: payload.device || (window.innerWidth < 768 ? 'Mobile Device' : 'Desktop Browser'),
        visitorId: visitorId,
        sessionId: payload.sessionId || ('sess_' + Date.now()),
        timestamp: timestamp
      };
      this.data.events.push(eventRecord);
      if (this.data.events.length > 2000) {
        this.data.events.shift();
      }

      // 2. Update totals with 1 System = 1 View session lock
      this.data.uniqueSessionsMap = this.data.uniqueSessionsMap || {};
      this.data.uniqueVisitorsMap = this.data.uniqueVisitorsMap || {};

      const currentSessionId = payload.sessionId || ('sess_' + Date.now());
      const isNewSession = !this.data.uniqueSessionsMap[currentSessionId];

      if (isNewSession) {
        this.data.uniqueSessionsMap[currentSessionId] = true;
        if (isMobile) {
          this.data.mobileVisitsCount = (this.data.mobileVisitsCount || 0) + 1;
        }
      }

      this.data.uniqueVisitorsMap[visitorId] = true;

      // Mathematical guarantee:
      // totalVisits = count of distinct sessions
      // uniqueVisitors = count of distinct systems (devices)
      this.data.summary.totalVisits = Object.keys(this.data.uniqueSessionsMap).length;
      this.data.summary.uniqueVisitors = Math.max(1, Object.keys(this.data.uniqueVisitorsMap).length);

      this.data.totalDwellSum = (this.data.totalDwellSum || 0) + dwellSeconds;
      if (this.data.summary.totalVisits > 0) {
        this.data.summary.avgDwellSeconds = Math.round(this.data.totalDwellSum / this.data.summary.totalVisits);
        this.data.summary.mobileRatioPercent = Math.round(((this.data.mobileVisitsCount || 0) / this.data.summary.totalVisits) * 100);
      }

      // 3. Update panorama engagement dynamically (universal across any tour)
      const searchName = (payload.sceneName || '').trim().toLowerCase();
      let lab = this.data.labEngagement.find(l => 
        l.name.trim().toLowerCase() === searchName
      );
      if (!lab) {
        const norm = searchName.replace(/[^a-z0-9]/g, '');
        lab = this.data.labEngagement.find(l => 
          l.name.toLowerCase().replace(/[^a-z0-9]/g, '') === norm
        );
      }
      if (!lab) {
        lab = this.data.labEngagement.find(l => 
          l.name.toLowerCase().includes(searchName) || 
          searchName.includes(l.name.toLowerCase())
        );
      }
      if (!lab) {
        // Auto-register discovered panorama dynamically
        lab = {
          id: 'pano_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          name: payload.sceneName,
          deptName: payload.department || resolveDepartment(payload.sceneName),
          floor: '',
          views: 0,
          dwellTimeSec: 0
        };
        this.data.labEngagement.push(lab);
      }
      lab.views += 1;
      lab.dwellTimeSec = (lab.dwellTimeSec || 0) + dwellSeconds;

      // 4. Update hourly bucket
      const eventHour = new Date(timestamp).getHours();
      const hourStr = (eventHour < 10 ? '0' : '') + eventHour + ':00';
      const hourlyBin = (this.data.hourlyVisits || []).find(h => h.hour === hourStr);
      if (hourlyBin) {
        hourlyBin.views += 1;
      }

      // 5. Update top lab and top department in summary
      let topL = null;
      let maxV = -1;
      this.data.labEngagement.forEach(l => {
        if (l.views > maxV) {
          maxV = l.views;
          topL = l;
        }
      });
      if (topL && maxV > 0) {
        this.data.summary.topLabName = topL.name;
        this.data.summary.topDeptName = topL.deptName;
      }

      // 6. In-Place Update of Recent Sessions Feed:
      // When a room visit completes, update the existing 'active' row in-place
      // rather than creating a duplicate row!
      this.data.recentSessions = Array.isArray(this.data.recentSessions) ? this.data.recentSessions : [];
      const currentSessId = payload.sessionId || ('sess_' + Date.now());
      const sceneTrimmed = (payload.sceneName || '').trim().toLowerCase();

      if (payload.status === 'completed') {
        let existingActive = this.data.recentSessions.find(s => 
          (s.sessionId === currentSessId || s.visitorId === visitorId) &&
          (s.scene || '').trim().toLowerCase() === sceneTrimmed &&
          s.status === 'active'
        );
        if (!existingActive && this.data.recentSessions.length > 0) {
          if ((this.data.recentSessions[0].scene || '').trim().toLowerCase() === sceneTrimmed) {
            existingActive = this.data.recentSessions[0];
          }
        }
        if (existingActive) {
          existingActive.dwell = eventRecord.dwell;
          existingActive.status = 'completed';
          existingActive.time = 'Just now';
        } else {
          this.data.recentSessions.unshift({
            id: eventRecord.id,
            sessionId: currentSessId,
            visitorId: visitorId,
            scene: payload.sceneName,
            dwell: eventRecord.dwell,
            device: eventRecord.device,
            time: 'Just now',
            status: 'completed'
          });
        }
      } else {
        // payload.status === 'active' (instant entry)
        this.data.recentSessions.forEach(s => {
          if ((s.sessionId === currentSessId || s.visitorId === visitorId) && s.status === 'active') {
            s.status = 'completed';
            if ((s.dwell === '0s' || !s.dwell) && s.entryTime) {
              const elapsed = Math.max(1, Math.round((Date.now() - s.entryTime) / 1000));
              s.dwell = formatSeconds(elapsed);
            }
          }
        });

        const newSession = {
          id: eventRecord.id,
          sessionId: currentSessId,
          visitorId: visitorId,
          scene: payload.sceneName,
          dwell: payload.dwell || '0s',
          entryTime: Date.now(),
          device: eventRecord.device,
          time: 'Just now',
          status: 'active'
        };
        this.data.currentActiveScene = payload.sceneName;
        this.data.recentSessions.unshift(newSession);
      }

      // Sliding buffer limit: keep latest 50 events for smooth scrolling without bloat
      if (this.data.recentSessions.length > 50) {
        this.data.recentSessions.splice(50);
      }

      this.save();
    }

    // Hydrate from Supabase cloud table on startup
    hydrateFromSupabase(records) {
      if (!Array.isArray(records) || records.length === 0) return;
      let modified = false;
      this.data.events = Array.isArray(this.data.events) ? this.data.events : [];
      this.data.uniqueVisitorsMap = this.data.uniqueVisitorsMap || {};

      records.forEach(r => {
        const timestamp = r.created_at ? new Date(r.created_at).getTime() : Date.now();
        const vId = r.visitor_id || ('vis_' + (r.session_id || 'anon'));

        // Robust cross-channel deduplication:
        // Match by Supabase ID, OR match by same session/visitor + scene within 2-minute latency tolerance
        const exists = this.data.events.some(e => 
          e.id === 'sb-' + r.id || 
          (
            ((e.sessionId && r.session_id && e.sessionId === r.session_id) || 
             (e.visitorId && vId && e.visitorId === vId)) &&
            (e.sceneName || '').toLowerCase() === (r.scene_name || '').toLowerCase() &&
            Math.abs((e.timestamp || 0) - timestamp) < 120000
          )
        );

        if (!exists) {
          const dwellSeconds = r.dwell_seconds || parseDwellToSeconds(r.dwell_formatted);
          const eventRecord = {
            id: 'sb-' + r.id,
            sceneName: r.scene_name,
            dwell: r.dwell_formatted || (dwellSeconds + 's'),
            dwellSeconds: dwellSeconds,
            device: r.device_platform || 'Desktop Browser',
            visitorId: vId,
            sessionId: r.session_id,
            timestamp: timestamp
          };
          this.data.events.push(eventRecord);
          this.data.uniqueVisitorsMap[vId] = true;

          const searchName = (r.scene_name || '').trim().toLowerCase();
          let lab = this.data.labEngagement.find(l => 
            l.name.trim().toLowerCase() === searchName
          );
          if (!lab) {
            const norm = searchName.replace(/[^a-z0-9]/g, '');
            lab = this.data.labEngagement.find(l => 
              l.name.toLowerCase().replace(/[^a-z0-9]/g, '') === norm
            );
          }
          if (!lab) {
            lab = this.data.labEngagement.find(l => 
              l.name.toLowerCase().includes(searchName) || 
              searchName.includes(l.name.toLowerCase())
            );
          }
          if (!lab) {
            lab = {
              id: 'pano_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
              name: r.scene_name,
              deptName: r.department || resolveDepartment(r.scene_name),
              floor: '',
              views: 0,
              dwellTimeSec: 0
            };
            this.data.labEngagement.push(lab);
          }
          lab.views += 1;
          lab.dwellTimeSec = (lab.dwellTimeSec || 0) + dwellSeconds;

          const h = new Date(timestamp).getHours();
          const hStr = (h < 10 ? '0' : '') + h + ':00';
          const hBin = (this.data.hourlyVisits || []).find(hb => hb.hour === hStr);
          if (hBin) hBin.views += 1;

          // Prevent duplicate rows in recentSessions during hydration
          const existingRecent = this.data.recentSessions.find(s =>
            (s.sessionId && r.session_id && s.sessionId === r.session_id) ||
            (s.visitorId && vId && s.visitorId === vId && (s.scene || '').toLowerCase() === (r.scene_name || '').toLowerCase())
          );

          if (existingRecent) {
            existingRecent.dwell = eventRecord.dwell;
          } else {
            this.data.recentSessions.unshift({
              id: eventRecord.id,
              sessionId: r.session_id,
              visitorId: vId,
              scene: r.scene_name,
              dwell: eventRecord.dwell,
              device: eventRecord.device,
              time: new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              status: 'completed'
            });
          }

          modified = true;
        }
      });

      if (modified) {
        this.data.events.sort((a, b) => a.timestamp - b.timestamp);

        // Count distinct sessions and distinct systems from all hydrated events
        this.data.uniqueSessionsMap = {};
        this.data.uniqueVisitorsMap = {};
        let mobileSessions = 0;

        this.data.events.forEach(e => {
          if (e.sessionId && !this.data.uniqueSessionsMap[e.sessionId]) {
            this.data.uniqueSessionsMap[e.sessionId] = true;
            if ((e.device || '').toLowerCase().includes('mobile')) {
              mobileSessions++;
            }
          }
          if (e.visitorId) {
            this.data.uniqueVisitorsMap[e.visitorId] = true;
          }
        });

        this.data.summary.totalVisits = Object.keys(this.data.uniqueSessionsMap).length;
        this.data.summary.uniqueVisitors = Math.max(1, Object.keys(this.data.uniqueVisitorsMap).length);
        this.data.mobileVisitsCount = mobileSessions;
        
        const totalDwell = this.data.events.reduce((acc, e) => acc + (e.dwellSeconds || 0), 0);
        this.data.summary.avgDwellSeconds = this.data.summary.totalVisits ? Math.round(totalDwell / this.data.summary.totalVisits) : 0;
        this.data.summary.mobileRatioPercent = this.data.summary.totalVisits ? Math.round((mobileSessions / this.data.summary.totalVisits) * 100) : 0;

        if (this.data.recentSessions.length > 10) {
          this.data.recentSessions = this.data.recentSessions.slice(0, 10);
        }
        this.save();
      }
    }

    // Dynamic Time-Range Filter Metrics (True timestamp cutoff - no fake multipliers)
    getMetrics(timeRange = 'all') {
      const now = Date.now();
      let cutoff = 0;
      if (timeRange === 'today') {
        const d = new Date(now);
        d.setHours(0, 0, 0, 0);
        cutoff = d.getTime();
      } else if (timeRange === '7d') {
        cutoff = now - (7 * 24 * 60 * 60 * 1000);
      } else if (timeRange === '30d') {
        cutoff = now - (30 * 24 * 60 * 60 * 1000);
      } else {
        cutoff = 0; // 'all'
      }

      const events = Array.isArray(this.data.events) ? this.data.events : [];
      const inRangeEvents = events.filter(e => (e.timestamp || 0) >= cutoff);

      if (events.length > 0) {
        const sessionSet = new Set();
        inRangeEvents.forEach(e => {
          if (e.sessionId) sessionSet.add(e.sessionId);
        });
        const totalVisits = timeRange === 'all' 
          ? (Object.keys(this.data.uniqueSessionsMap || {}).length || sessionSet.size)
          : sessionSet.size;

        const uniqueSet = new Set();
        inRangeEvents.forEach(e => uniqueSet.add(e.visitorId || 'vis_local'));
        const uniqueVisitors = totalVisits > 0 ? Math.max(1, uniqueSet.size) : 0;

        const totalDwell = inRangeEvents.reduce((acc, e) => acc + (e.dwellSeconds || 0), 0);
        const avgDwellSeconds = inRangeEvents.length > 0 ? Math.round(totalDwell / inRangeEvents.length) : 0;

        const mobileCount = inRangeEvents.filter(e => (e.device || '').toLowerCase().includes('mobile')).length;
        const mobileRatioPercent = inRangeEvents.length > 0 ? Math.round((mobileCount / inRangeEvents.length) * 100) : 0;

        const labViewsMap = {};
        inRangeEvents.forEach(e => {
          const sc = (e.sceneName || '').toLowerCase();
          labViewsMap[sc] = (labViewsMap[sc] || 0) + 1;
        });

        const filteredLabs = this.data.labEngagement.map(lab => {
          if (timeRange === 'all') return lab;
          let count = 0;
          for (const [key, cnt] of Object.entries(labViewsMap)) {
            if (key.includes(lab.name.toLowerCase()) || lab.name.toLowerCase().includes(key)) {
              count += cnt;
            }
          }
          return { ...lab, views: count };
        });

        const hourlyMap = {};
        inRangeEvents.forEach(e => {
          const h = new Date(e.timestamp).getHours();
          const hStr = (h < 10 ? '0' : '') + h + ':00';
          hourlyMap[hStr] = (hourlyMap[hStr] || 0) + 1;
        });

        const filteredHourly = (this.data.hourlyVisits || []).map(hb => {
          if (timeRange === 'all') return hb;
          return { ...hb, views: hourlyMap[hb.hour] || 0 };
        });

        // Dwell Intelligence Metrics
        const totalDwellSec = inRangeEvents.reduce((acc, e) => acc + (e.dwellSeconds || 0), 0) ||
          filteredLabs.reduce((acc, l) => acc + (l.dwellTimeSec || 0), 0);

        let stickiestLab = null;
        let highestAvg = -1;
        filteredLabs.forEach(lab => {
          if (lab.views > 0 && lab.dwellTimeSec > 0) {
            const avg = Math.round(lab.dwellTimeSec / lab.views);
            if (avg > highestAvg) {
              highestAvg = avg;
              stickiestLab = { name: lab.name, avgDwell: avg, formatted: formatSeconds(avg) };
            }
          }
        });
        if (!stickiestLab && filteredLabs.length > 0) {
          const top = filteredLabs.slice().sort((a, b) => (b.dwellTimeSec || 0) - (a.dwellTimeSec || 0))[0];
          if (top && (top.views > 0 || top.dwellTimeSec > 0)) {
            const avg = top.views > 0 ? Math.round(top.dwellTimeSec / top.views) : top.dwellTimeSec;
            stickiestLab = { name: top.name, avgDwell: avg, formatted: formatSeconds(avg) };
          }
        }
        if (!stickiestLab) {
          stickiestLab = { name: 'None', avgDwell: 0, formatted: '0s' };
        }

        let deepCount = 0;
        let activeCount = 0;
        let quickCount = 0;
        inRangeEvents.forEach(e => {
          const d = e.dwellSeconds || 0;
          if (d >= 60) deepCount++;
          else if (d >= 15) activeCount++;
          else quickCount++;
        });

        let pctDeep = 0;
        let pctActive = 0;
        let pctQuick = 0;
        if (inRangeEvents.length > 0) {
          pctDeep = Math.round((deepCount / inRangeEvents.length) * 100);
          pctActive = Math.round((activeCount / inRangeEvents.length) * 100);
          pctQuick = Math.max(0, 100 - pctDeep - pctActive);
        }

        const maxPanoAvg = Math.max(1, ...filteredLabs.map(l => l.views > 0 ? Math.round(l.dwellTimeSec / l.views) : 0));
        const panoBreakdown = filteredLabs.map((lab, index) => {
          const views = lab.views || 0;
          const totalSec = lab.dwellTimeSec || 0;
          const avgSec = views > 0 ? Math.round(totalSec / views) : 0;
          let intent = 'unvisited';
          let intentLabel = 'Unvisited';
          let intentClass = 'intent-pill-unvisited';
          let intentIcon = 'fa-minus';

          if (views > 0 || totalSec > 0) {
            if (avgSec >= 60) {
              intent = 'deep';
              intentLabel = 'Deep Immersion';
              intentClass = 'intent-pill-deep';
              intentIcon = 'fa-graduation-cap';
            } else if (avgSec >= 15) {
              intent = 'active';
              intentLabel = 'Standard Tour';
              intentClass = 'intent-pill-active';
              intentIcon = 'fa-person-walking';
            } else {
              intent = 'quick';
              intentLabel = 'Quick Glance';
              intentClass = 'intent-pill-quick';
              intentIcon = 'fa-bolt';
            }
          }

          const relativePct = (views > 0 && maxPanoAvg > 0) ? Math.min(100, Math.round((avgSec / maxPanoAvg) * 100)) : 0;

          return {
            id: lab.id || ('pano_' + index),
            name: lab.name,
            dept: lab.deptName || resolveDepartment(lab.name),
            floor: lab.floor || '',
            views: views,
            totalSec: totalSec,
            totalFormatted: formatDuration(totalSec),
            avgSec: avgSec,
            avgFormatted: formatSeconds(avgSec),
            intent: intent,
            intentLabel: intentLabel,
            intentClass: intentClass,
            intentIcon: intentIcon,
            relativePct: relativePct
          };
        });
        panoBreakdown.sort((a, b) => (b.avgSec - a.avgSec) || (b.views - a.views));

        const dwellMetrics = {
          totalDwellSeconds: totalDwellSec,
          totalFormatted: formatDuration(totalDwellSec),
          avgDwellSeconds: avgDwellSeconds || (this.data.summary ? this.data.summary.avgDwellSeconds : 48),
          avgFormatted: formatSeconds(avgDwellSeconds || (this.data.summary ? this.data.summary.avgDwellSeconds : 48)),
          stickiestFacility: stickiestLab,
          currentActiveScene: this.data.currentActiveScene || null,
          activeRooms: this.getActiveRooms(),
          intentDepth: {
            deep: { count: deepCount, percent: pctDeep },
            active: { count: activeCount, percent: pctActive },
            quick: { count: quickCount, percent: pctQuick }
          },
          panoramaBreakdown: panoBreakdown
        };

        return {
          summary: {
            totalVisits: totalVisits,
            uniqueVisitors: uniqueVisitors,
            avgDwellSeconds: avgDwellSeconds,
            mobileRatioPercent: mobileRatioPercent,
            topLabName: this.data.summary.topLabName,
            topDeptName: this.data.summary.topDeptName
          },
          labEngagement: filteredLabs,
          hourlyVisits: filteredHourly,
          featureInteractions: this.data.featureInteractions,
          recentSessions: this.data.recentSessions,
          dwellMetrics: dwellMetrics
        };
      }

      const fallbackTotalDwell = (this.data.labEngagement || []).reduce((acc, l) => acc + (l.dwellTimeSec || 0), 0);
      const fallbackAvg = (this.data.summary && this.data.summary.totalVisits > 0) ? this.data.summary.avgDwellSeconds : 0;
      let fallbackStickiest = null;
      (this.data.labEngagement || []).forEach(lab => {
        if (lab.views > 0 && lab.dwellTimeSec > 0) {
          const avg = Math.round(lab.dwellTimeSec / lab.views);
          if (!fallbackStickiest || avg > fallbackStickiest.avgDwell) {
            fallbackStickiest = { name: lab.name, avgDwell: avg, formatted: formatSeconds(avg) };
          }
        }
      });
      if (!fallbackStickiest) {
        if (this.data.summary && this.data.summary.totalVisits > 0 && this.data.summary.topLabName && this.data.summary.topLabName !== 'None') {
          fallbackStickiest = { name: this.data.summary.topLabName, avgDwell: fallbackAvg, formatted: formatSeconds(fallbackAvg) };
        } else {
          fallbackStickiest = { name: 'None', avgDwell: 0, formatted: '0s' };
        }
      }

      const maxFallbackAvg = Math.max(1, ...(this.data.labEngagement || []).map(l => l.views > 0 ? Math.round(l.dwellTimeSec / l.views) : 0));
      const fallbackPanoBreakdown = (this.data.labEngagement || []).map((lab, index) => {
        const views = lab.views || 0;
        const totalSec = lab.dwellTimeSec || 0;
        const avgSec = views > 0 ? Math.round(totalSec / views) : 0;
        let intent = 'unvisited';
        let intentLabel = 'Unvisited';
        let intentClass = 'intent-pill-unvisited';
        let intentIcon = 'fa-minus';

        if (views > 0 || totalSec > 0) {
          if (avgSec >= 60) {
            intent = 'deep';
            intentLabel = 'Deep Immersion';
            intentClass = 'intent-pill-deep';
            intentIcon = 'fa-graduation-cap';
          } else if (avgSec >= 15) {
            intent = 'active';
            intentLabel = 'Standard Tour';
            intentClass = 'intent-pill-active';
            intentIcon = 'fa-person-walking';
          } else {
            intent = 'quick';
            intentLabel = 'Quick Glance';
            intentClass = 'intent-pill-quick';
            intentIcon = 'fa-bolt';
          }
        }

        const relativePct = (views > 0 && maxFallbackAvg > 0) ? Math.min(100, Math.round((avgSec / maxFallbackAvg) * 100)) : 0;

        return {
          id: lab.id || ('pano_' + index),
          name: lab.name,
          dept: lab.deptName || resolveDepartment(lab.name),
          floor: lab.floor || '',
          views: views,
          totalSec: totalSec,
          totalFormatted: formatDuration(totalSec),
          avgSec: avgSec,
          avgFormatted: formatSeconds(avgSec),
          intent: intent,
          intentLabel: intentLabel,
          intentClass: intentClass,
          intentIcon: intentIcon,
          relativePct: relativePct
        };
      });
      fallbackPanoBreakdown.sort((a, b) => (b.avgSec - a.avgSec) || (b.views - a.views));

      return {
        summary: this.data.summary,
        labEngagement: this.data.labEngagement,
        hourlyVisits: this.data.hourlyVisits,
        featureInteractions: this.data.featureInteractions,
        recentSessions: this.data.recentSessions,
        dwellMetrics: {
          totalDwellSeconds: fallbackTotalDwell,
          totalFormatted: formatDuration(fallbackTotalDwell),
          avgDwellSeconds: fallbackAvg,
          avgFormatted: formatSeconds(fallbackAvg),
          stickiestFacility: fallbackStickiest,
          currentActiveScene: this.data.currentActiveScene || null,
          activeRooms: this.getActiveRooms(),
          intentDepth: {
            deep: { count: 0, percent: 0 },
            active: { count: 0, percent: 0 },
            quick: { count: 0, percent: 0 }
          },
          panoramaBreakdown: fallbackPanoBreakdown
        }
      };
    }

    getActiveRooms() {
      this.data.activePresence = this.data.activePresence || {};
      const now = Date.now();
      const TTL = 15000;
      const activeMap = {};

      Object.keys(this.data.activePresence).forEach(vId => {
        const entry = this.data.activePresence[vId];
        if (entry && entry.scene && (now - entry.timestamp) <= TTL) {
          const norm = entry.scene.trim().toLowerCase();
          activeMap[norm] = (activeMap[norm] || 0) + 1;
        } else {
          delete this.data.activePresence[vId];
        }
      });

      if (Object.keys(activeMap).length === 0) {
        if (Array.isArray(this.data.recentSessions)) {
          const activeSess = this.data.recentSessions.find(s => s.status === 'active');
          if (activeSess && activeSess.scene) {
            activeMap[activeSess.scene.trim().toLowerCase()] = 1;
          }
        }
        if (Object.keys(activeMap).length === 0 && this.data.currentActiveScene) {
          activeMap[this.data.currentActiveScene.trim().toLowerCase()] = 1;
        }
      }

      return activeMap;
    }

    resetToBaseline() {
      try {
        localStorage.removeItem('krce_pending_features');
      } catch (e) {}
      const fresh = generateBaselineData();
      this.save(fresh);
      return fresh;
    }
  }

  return {
    CAMPUS_STRUCTURE: CAMPUS_STRUCTURE,
    store: new TelemetryStore()
  };
});
