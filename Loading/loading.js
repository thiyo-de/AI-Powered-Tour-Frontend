/**
 * ═══════════════════════════════════════════════════════════
 *  THIAGARAJAR COLLEGE — VIRTUAL TOUR LOADING GATEWAY
 *  Three.js Procedural MagicRings + Integrated Audio Consent
 * ═══════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  let ringsInstance = null;

  function initMagicRings(mount) {
    if (!mount || !window.THREE) return null;
    const THREE = window.THREE;

    const vertexShader = `
      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      precision highp float;
      uniform float uTime, uAttenuation, uLineThickness;
      uniform float uBaseRadius, uRadiusStep, uScaleRate;
      uniform float uOpacity, uNoiseAmount, uRotation, uRingGap;
      uniform float uFadeIn, uFadeOut;
      uniform vec2 uResolution;
      uniform vec3 uColor, uColorTwo;
      uniform int uRingCount;

      const float HP = 1.5707963;
      const float CYCLE = 3.45;

      float fade(float t) {
        return t < uFadeIn ? smoothstep(0.0, uFadeIn, t) : 1.0 - smoothstep(uFadeOut, CYCLE - 0.2, t);
      }

      float ring(vec2 p, float ri, float cut, float t0, float px) {
        float t = mod(uTime + t0, CYCLE);
        float r = ri + t / CYCLE * uScaleRate;
        float d = abs(length(p) - r);
        float a = atan(abs(p.y), abs(p.x)) / HP;
        float th = max(1.0 - a, 0.5) * px * uLineThickness;
        float h = (1.0 - smoothstep(th, th * 1.5, d)) + 1.0;
        d += pow(cut * a, 3.0) * r;
        return h * exp(-uAttenuation * d) * fade(t);
      }

      void main() {
        float px = 1.0 / min(uResolution.x, uResolution.y);
        vec2 p = (gl_FragCoord.xy - 0.5 * uResolution.xy) * px;
        float cr = cos(uRotation), sr = sin(uRotation);
        p = mat2(cr, -sr, sr, cr) * p;

        vec3 c = vec3(0.0);
        float coverage = 0.0;
        float rcf = max(float(uRingCount) - 1.0, 1.0);
        for (int i = 0; i < 8; i++) {
          if (i >= uRingCount) break;
          float fi = float(i);
          vec2 pr = p;
          vec3 rc = mix(uColor, uColorTwo, fi / rcf);
          float ringAmount = ring(pr, uBaseRadius + fi * uRadiusStep, pow(uRingGap, fi), i == 0 ? 0.0 : 2.95 * fi, px);
          c = mix(c, rc, vec3(ringAmount));
          coverage = max(coverage, ringAmount);
        }
        float n = fract(sin(dot(gl_FragCoord.xy + uTime * 100.0, vec2(12.9898, 78.233))) * 43758.5453);
        c += (n - 0.5) * uNoiseAmount;
        float intensity = max(c.r, max(c.g, c.b));
        vec3 emissiveColor = intensity > 0.0001 ? clamp(c / intensity, 0.0, 1.0) : vec3(0.0);
        gl_FragColor = vec4(emissiveColor, clamp(intensity * uOpacity, 0.0, 1.0));
      }
    `;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch (e) {
      console.warn('[Loading] WebGL not available for rings:', e);
      return null;
    }

    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 10);
    camera.position.z = 1;

    // Palette: Gold / Orange + Deep Institutional Blue
    const uniforms = {
      uTime: { value: 0 },
      uAttenuation: { value: 10 },
      uResolution: { value: new THREE.Vector2() },
      uColor: { value: new THREE.Color('#f59e0b') },
      uColorTwo: { value: new THREE.Color('#3b82f6') },
      uLineThickness: { value: 2 },
      uBaseRadius: { value: 0.35 },
      uRadiusStep: { value: 0.1 },
      uScaleRate: { value: 0.1 },
      uRingCount: { value: 6 },
      uOpacity: { value: 1 },
      uNoiseAmount: { value: 0.08 },
      uRotation: { value: 0 },
      uRingGap: { value: 1.5 },
      uFadeIn: { value: 0.7 },
      uFadeOut: { value: 0.5 }
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true
    });

    const quad = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
    scene.add(quad);

    const resize = () => {
      const w = mount.clientWidth || window.innerWidth;
      const h = mount.clientHeight || window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setSize(w, h);
      renderer.setPixelRatio(dpr);
      uniforms.uResolution.value.set(w * dpr, h * dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    let frameId = 0;
    let lastT = 0;
    let elapsed = 0;

    const animate = (t) => {
      frameId = requestAnimationFrame(animate);
      const dt = lastT === 0 ? 0 : Math.min(t - lastT, 100);
      lastT = t;
      elapsed += dt * 0.001;
      uniforms.uTime.value = elapsed;
      renderer.render(scene, camera);
    };
    frameId = requestAnimationFrame(animate);

    return {
      destroy: () => {
        if (frameId) cancelAnimationFrame(frameId);
        window.removeEventListener('resize', resize);
        if (renderer.domElement.parentNode) {
          mount.removeChild(renderer.domElement);
        }
        renderer.dispose();
        material.dispose();
      }
    };
  }

  function handleTourEntrance(playMusic) {
    window.__musicConsentHandled = true;
    window.__musicPlayRequested = !!playMusic;

    // Start background music if requested
    if (playMusic && window.bgAudio) {
      window.bgAudio.play().catch(function (e) {
        console.warn('[Audio] Autoplay error:', e);
      });
      document.dispatchEvent(new CustomEvent('musicStateChanged', { detail: { playing: true } }));
    } else {
      document.dispatchEvent(new CustomEvent('musicStateChanged', { detail: { playing: false } }));
    }

    // Notify all tour UI components to load
    document.dispatchEvent(new CustomEvent('musicConsentResolved'));

    // Smoothly fade out loading screen
    const screen = document.getElementById('loading-screen');
    if (screen) {
      screen.classList.add('fade-out');
      setTimeout(function () {
        if (ringsInstance && typeof ringsInstance.destroy === 'function') {
          ringsInstance.destroy();
          ringsInstance = null;
        }
        if (screen.parentNode) {
          screen.parentNode.removeChild(screen);
        }
      }, 850);
    }
  }

  function initLoadingScreen() {
    const canvasHost = document.getElementById('rings-canvas-host');
    if (canvasHost) {
      ringsInstance = initMagicRings(canvasHost);
    }

    const soundBtn = document.getElementById('btn-enter-sound');
    if (soundBtn) {
      soundBtn.addEventListener('click', function () {
        handleTourEntrance(true);
      });
    }

    const muteBtn = document.getElementById('btn-enter-muted');
    if (muteBtn) {
      muteBtn.addEventListener('click', function () {
        handleTourEntrance(false);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLoadingScreen);
  } else {
    initLoadingScreen();
  }
})();
