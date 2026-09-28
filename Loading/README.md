# Dedicated Standalone Loading Screen (MagicRings)

A dedicated, isolated loading screen powered by **React Bits <MagicRings />** (Three.js WebGL procedural GLSL shaders).

> **Completely decoupled:** This screen operates in 100% isolation with zero connection or dependencies to the virtual tour or panorama.

---

## Files Included

| File | Purpose | Environment |
|---|---|---|
| `index.html` | Live standalone browser test & interactive demo | Browser / Live Server |
| `magic-rings.js` | Direct Three.js WebGL shader engine | Vanilla JS / ES Module |
| `MagicRings.jsx` | Original React Bits component | React / Vite / Next.js |
| `MagicRings.css` | Container layout & full-bleed styling | CSS |
| `App.jsx` | Complete React Loading Screen layout | React Component |

---

## How to Preview & Run

### Option 1: Instant Browser Preview (Zero Build Required)
Run a local static server in this folder (or open with VS Code Live Server):
```bash
npx serve .
# or
python -m http.server 3000
```
Then open `http://localhost:3000/index.html`.

### Option 2: In a React / Vite App
```bash
npm install three
```
```jsx
import LoadingScreen from './Loading/App';

function MyApp() {
  return <LoadingScreen onComplete={() => console.log('Loaded!')} />;
}
```

---

## Configured Attributes (Active)

| Attribute | Value | Description |
|---|---|---|
| `color` | `#a855f7` | Purple (inner ring gradient start) |
| `colorTwo` | `#6366f1` | Indigo (outer ring gradient end) |
| `ringCount` | `6` | Concentric procedural rings |
| `speed` | `1` | Animation speed multiplier |
| `attenuation` | `10` | Glow falloff tightness |
| `lineThickness` | `2` | Ring line width |
| `baseRadius` | `0.35` | Innermost ring radius |
| `radiusStep` | `0.1` | Spacing between rings |
| `scaleRate` | `0.1` | Expansion rate over cycle |
| `opacity` | `1` | Master opacity |
| `noiseAmount` | `0.1` | Film-grain texture intensity |
| `ringGap` | `1.5` | Exponential angular cutaway |
| `fadeIn` / `fadeOut` | `0.7` / `0.5` | Ring fade cycle timing |
| `followMouse` | `false` | Disabled |
| `clickBurst` | `false` | Disabled |

