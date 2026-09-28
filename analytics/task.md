# KRCE Virtual Tour Analytics Dashboard — Production Task Specification

> **Target Directory**: `d:\Thiyo - Model Tours\Tour 4\analytics`  
> **Tour Integration**: `d:\Thiyo - Model Tours\Tour 4\analytics\tracker.js` (loaded externally via `/analytics/tracker.js` — STRICTLY NO component in `KRCE/Components/`)  
> **Scope**: 100% Dedicated 360° Virtual Tour Telemetry (No TCS/Recruitment clutter)  
> **Quality Standard**: Production Grade (Offline-first, responsive, zero-build vanilla stack, zero lag on 3DVista player)

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     KRCE 360° VIRTUAL TOUR                      │
│                  (d:\Thiyo - Model Tours\Tour 4\KRCE)           │
│                                                                 │
│   ┌──────────────────┐           ┌──────────────────────────┐   │
│   │ 3DVista Engine   │           │ Spatial UI / Dock        │   │
│   │ (window.tour)    │           │ (Street View, Audio etc) │   │
│   └────────┬─────────┘           └────────────┬─────────────┘   │
│            │ onMediaChanged                   │ Click Events    │
│            ▼                                  ▼                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  Components/Analytics/tour-tracker.js                   │   │
│   │  • requestIdleCallback event buffer (non-blocking)      │   │
│   │  • BroadcastChannel ('krce_telemetry')                  │   │
│   │  • LocalStorage session accumulator                     │   │
│   └────────────────────────────┬────────────────────────────┘   │
└────────────────────────────────┼────────────────────────────────┘
                                 │
                   Cross-Tab Realtime Stream
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│              STANDALONE ANALYTICS DASHBOARD UI                  │
│               (d:\Thiyo - Model Tours\Tour 4\analytics)         │
│                                                                 │
│   ┌────────────────────────┐       ┌────────────────────────┐   │
│   │  KPI Metric Counters   │       │  Live Activity Feed    │   │
│   │  (Views, Dwell, Mobile)│       │  (Real-time scene log) │   │
│   ├────────────────────────┴───────┴────────────────────────┤   │
│   │  Data Visualization Layer (Chart.js Engine)             │   │
│   │  • Scene & Lab Heatmap (from KRCE/Department.txt)       │   │
│   │  • Hourly Visitor Distribution                          │   │
│   │  • Department-Wise Engagement Breakdown                 │   │
│   │  • Feature & Dock Interaction Split                     │   │
│   ├─────────────────────────────────────────────────────────┤   │
│   │  Controls: Time Filter, CSV/JSON Export, Reset Baseline │   │
│   └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Production Phased Implementation Tasks

### Phase 1: Foundation & Asset Scaffolding
- [ ] **Task 1.1**: Set up local standalone vendor assets in `analytics/assets/` and `analytics/js/vendor/` (Chart.js standalone, Font Awesome SVG icons, Space Grotesk typography) to ensure 100% offline functionality.
- [ ] **Task 1.2**: Copy KRCE college emblems from `KRCE/logo Only Emblem.png` and `KRCE/College-Logo.png` into `analytics/assets/`.
- [ ] **Task 1.3**: Build semantic `analytics/index.html` featuring executive header, Bento grid layout, live badge indicator, time range selector (`Today`, `7D`, `30D`, `All Time`), and export button.

### Phase 2: Design System & Glassmorphism Styling (`analytics/css/analytics.css`)
- [ ] **Task 2.1**: Implement KRCE Design Tokens conforming to `KRCE/brand-colors.md`:
  - Canvas: Deep Obsidian Navy (`#0D1926` → `#16283D`)
  - Accent Institutional Blue: `#2F5E8E` & `#96C0E6`
  - Warning/High-Alert: `#B54545`
  - Success Indicator: `#2E8B57`
- [ ] **Task 2.2**: Craft frosted glass card components (`backdrop-filter: blur(16px)`, `rgba(30, 58, 95, 0.45)`, subtle ambient glows).
- [ ] **Task 2.3**: Build responsive 12-column grid collapsing seamlessly down to mobile devices (320px–768px).
- [ ] **Task 2.4**: Add micro-interactions (rolling number counters, pulsing live telemetry indicator, smooth card hover lifts).

### Phase 3: Tour Telemetry Engine & Department Data (`analytics/js/analytics-data.js`)
- [ ] **Task 3.1**: Model full campus dictionary parsed from `KRCE/Department.txt`:
  - Mechanical Engineering (7 Labs: AR/VR, Dynamics, CAD, Mechatronics, etc.)
  - Computer Science & Engineering (4 Labs: Alan Turing, Code Craft, etc.)
  - CSBS, EEE, ECE, AI & DS, Information Technology, Science & Humanities.
- [ ] **Task 3.2**: Seed realistic production baseline metrics (~14,800 historical views, realistic lab dwell distributions, mobile/desktop ratios) so the dashboard looks executive-ready immediately upon opening.
- [ ] **Task 3.3**: Build localStorage sync adapter with fallback recovery and schema migration protection.

### Phase 4: Data Visualization & Chart Engines (`analytics/js/charts-engine.js`)
- [x] **Task 4.1**: **Scene & Lab Engagement Chart**: Horizontal ranked bar chart highlighting top-explored laboratories with auto-scaling dynamic window.
- [x] **Task 4.2**: **Hourly Visitor Distribution**: Smooth curved area chart with dark navy/sky blue gradient fills.
- [x] **Task 4.3**: **Department Engagement Ratio**: Donut chart detailing relative engagement dynamically across categories/departments.
- [x] **Task 4.4**: **Dock & Feature Telemetry**: Bar/radar visualization tracking Street View popups, audio player toggles, compass usage, and portal navigation.

### Phase 5: Dashboard Orchestration & Export (`analytics/js/app.js` & `live-sync.js`)
- [x] **Task 5.1**: Cross-tab real-time listener using `BroadcastChannel('krce_telemetry')` and `window.addEventListener('storage')`.
- [x] **Task 5.2**: Dynamic time-range filtering (`Today`, `7D`, `30D`, `All Time`) updating all 4 charts and KPI cards without page reloads.
- [x] **Task 5.3**: Instant report export (downloads complete session and department analytics as structured CSV / JSON).
- [x] **Task 5.4**: Live activity ticker: continuously updates with recent visitor actions ("Visitor explored Mechanical AR/VR Lab — 2m 14s").

### Phase 6: External Telemetry Tracker (`analytics/tracker.js`)
- [x] **Task 6.1**: Create standalone non-blocking tracker script inside `analytics/tracker.js`:
  - Hooks cleanly into 3DVista native root player + playlist events
  - Measures entry/exit timestamps for scene dwell time calculation
  - Broadcasts payload `{ sceneId, sceneName, timestamp, device: 'desktop'|'mobile' }`
- [x] **Task 6.2**: Reference `/analytics/tracker.js` in `KRCE/index.htm` as an external script without creating any folder in `KRCE/Components/`.
- [x] **Task 6.3**: Add discrete admin hotkey (`Shift + A`) inside the tour to launch the Analytics Panel (`/analytics`) in a new tab.

### Phase 7: "1 System = 1 View" Distinct Session Lock & Cloud Purge
- [x] **Task 7.1**: `sessionStorage` Tab Lock: Session ID survives page reloads (F5) and pano transitions without generating new visits.
- [x] **Task 7.2**: Mathematical Distinct Counting: `summary.totalVisits` is strictly calculated via `COUNT(DISTINCT sessionId)` in both local store and Supabase hydration.
- [x] **Task 7.3**: Dual-Layer Reset: Reset button purges both browser `localStorage` and Supabase cloud tables (`scene_telemetry` & `feature_interactions`) via security definer RPC + REST fallback.

### Phase 8: 100% Dynamic 3DVista Panorama Telemetry Architecture
- [x] **Task 8.1**: Dynamic Panorama Manifest Extractor (`extractAll3DVistaPanoramas`): Queries `window.tour.player` playlists directly, extracting all panoramas across any project without hardcoding.
- [x] **Task 8.2**: Universal Active Media Transition Engine: 250ms active media poller + `playlist.bind('change')` detecting all in-scene 360 arrow/hotspot transitions on any 3DVista virtual tour.
- [x] **Task 8.3**: Dynamic Ingestion & Ranking: Auto-promotes visited viewpoints to the top with real counts, auto-scales the chart window up to 31 panos, and dynamically calculates category shares.

---

## 3. Production Quality Verification Protocol

1. **Zero Degradation Test**: Verified 3DVista 360° panorama FPS remains at solid 60fps with zero stutter while tracker is active.
2. **Real-time Cross-Tab Test**: Open `KRCE/index.htm` in Tab 1 and `analytics/index.html` in Tab 2. Navigating scenes in Tab 1 updates Tab 2 in real-time.
3. **1 System = 1 View Test**: Navigating 10 panoramas or refreshing (F5) leaves Total Visits at 1; closing and re-opening later increments to 2.
4. **Offline Integrity Test**: Open `analytics/index.html` with network disabled; all charts, icons, and fonts render flawlessly.
5. **Mobile Responsiveness Test**: Layout verified across 375px (iPhone), 768px (iPad), and 1920px (Desktop) viewports.
