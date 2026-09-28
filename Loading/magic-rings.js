import * as THREE from 'three';

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
uniform float uMouseInfluence, uHoverAmount, uHoverScale, uParallax, uBurst;
uniform float uCoverageAlpha;
uniform vec2 uResolution, uMouse;
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
  p -= uMouse * uMouseInfluence;
  float sc = mix(1.0, uHoverScale, uHoverAmount) + uBurst * 0.3;
  p /= sc;
  vec3 c = vec3(0.0);
  float coverage = 0.0;
  float rcf = max(float(uRingCount) - 1.0, 1.0);
  for (int i = 0; i < 10; i++) {
    if (i >= uRingCount) break;
    float fi = float(i);
    vec2 pr = p - fi * uParallax * uMouse;
    vec3 rc = mix(uColor, uColorTwo, fi / rcf);
    float ringAmount = ring(pr, uBaseRadius + fi * uRadiusStep, pow(uRingGap, fi), i == 0 ? 0.0 : 2.95 * fi, px);
    c = mix(c, rc, vec3(ringAmount));
    coverage = max(coverage, ringAmount);
  }
  c *= 1.0 + uBurst * 2.0;
  float n = fract(sin(dot(gl_FragCoord.xy + uTime * 100.0, vec2(12.9898, 78.233))) * 43758.5453);
  c += (n - 0.5) * uNoiseAmount;
  float intensity = max(c.r, max(c.g, c.b));
  vec3 emissiveColor = intensity > 0.0001 ? clamp(c / intensity, 0.0, 1.0) : vec3(0.0);
  vec3 outputColor = mix(emissiveColor, clamp(c, 0.0, 1.0), uCoverageAlpha);
  float outputAlpha = mix(intensity, coverage, uCoverageAlpha);
  gl_FragColor = vec4(outputColor, clamp(outputAlpha * uOpacity, 0.0, 1.0));
}
`;

export function createMagicRings(mount, options = {}) {
  if (!mount) return null;

  const defaults = {
    color: '#a855f7',
    colorTwo: '#6366f1',
    speed: 1,
    ringCount: 6,
    attenuation: 10,
    lineThickness: 2,
    baseRadius: 0.35,
    radiusStep: 0.1,
    scaleRate: 0.1,
    opacity: 1,
    blur: 0,
    noiseAmount: 0.1,
    rotation: 0,
    ringGap: 1.5,
    fadeIn: 0.7,
    fadeOut: 0.5,
    followMouse: false,
    mouseInfluence: 0.2,
    hoverScale: 1.2,
    parallax: 0.05,
    clickBurst: false,
    alphaMode: 'luminance',
  };

  const p = { ...defaults, ...options };
  const mouse = [0, 0];
  const smoothMouse = [0, 0];
  let hoverAmount = 0;
  let isHovered = false;
  let burst = 0;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  } catch (err) {
    console.error('WebGL not supported:', err);
    return null;
  }

  if (!renderer.capabilities.isWebGL2) {
    renderer.dispose();
    console.warn('WebGL2 required for MagicRings');
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

  const uniforms = {
    uTime: { value: 0 },
    uAttenuation: { value: p.attenuation },
    uResolution: { value: new THREE.Vector2() },
    uColor: { value: new THREE.Color(p.color) },
    uColorTwo: { value: new THREE.Color(p.colorTwo) },
    uLineThickness: { value: p.lineThickness },
    uBaseRadius: { value: p.baseRadius },
    uRadiusStep: { value: p.radiusStep },
    uScaleRate: { value: p.scaleRate },
    uRingCount: { value: p.ringCount },
    uOpacity: { value: p.opacity },
    uNoiseAmount: { value: p.noiseAmount },
    uRotation: { value: (p.rotation * Math.PI) / 180 },
    uRingGap: { value: p.ringGap },
    uFadeIn: { value: p.fadeIn },
    uFadeOut: { value: p.fadeOut },
    uMouse: { value: new THREE.Vector2() },
    uMouseInfluence: { value: p.followMouse ? p.mouseInfluence : 0 },
    uHoverAmount: { value: 0 },
    uHoverScale: { value: p.hoverScale },
    uParallax: { value: p.parallax },
    uBurst: { value: 0 },
    uCoverageAlpha: { value: p.alphaMode === 'coverage' ? 1 : 0 },
  };

  const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms, transparent: true });
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
  const onOrientation = () => setTimeout(resize, 100);
  window.addEventListener('orientationchange', onOrientation);

  const ro = new ResizeObserver(resize);
  ro.observe(mount);

  const onMouseMove = (e) => {
    const rect = mount.getBoundingClientRect();
    mouse[0] = (e.clientX - rect.left) / rect.width - 0.5;
    mouse[1] = -((e.clientY - rect.top) / rect.height - 0.5);
  };
  const onMouseEnter = () => { isHovered = true; };
  const onMouseLeave = () => {
    isHovered = false;
    mouse[0] = 0;
    mouse[1] = 0;
  };
  const onClick = () => { burst = 1; };

  mount.addEventListener('mousemove', onMouseMove);
  mount.addEventListener('mouseenter', onMouseEnter);
  mount.addEventListener('mouseleave', onMouseLeave);
  mount.addEventListener('click', onClick);

  let frameId = 0;
  let isVisible = true;
  let isPageVisible = !document.hidden;
  let elapsed = 0;
  let lastT = 0;

  const animate = (t) => {
    frameId = requestAnimationFrame(animate);

    const dt = lastT === 0 ? 0 : Math.min(t - lastT, 100);
    lastT = t;
    elapsed += dt * 0.001 * p.speed;

    smoothMouse[0] += (mouse[0] - smoothMouse[0]) * 0.08;
    smoothMouse[1] += (mouse[1] - smoothMouse[1]) * 0.08;
    hoverAmount += ((isHovered ? 1 : 0) - hoverAmount) * 0.08;
    burst *= 0.95;
    if (burst < 0.001) burst = 0;

    uniforms.uTime.value = elapsed;
    uniforms.uMouse.value.set(smoothMouse[0], smoothMouse[1]);
    uniforms.uHoverAmount.value = hoverAmount;
    uniforms.uBurst.value = p.clickBurst ? burst : 0;

    renderer.render(scene, camera);
  };

  const tryStart = () => {
    if (isVisible && isPageVisible && frameId === 0) {
      lastT = 0;
      frameId = requestAnimationFrame(animate);
    }
  };
  const tryStop = () => {
    if (frameId !== 0) {
      cancelAnimationFrame(frameId);
      frameId = 0;
    }
  };

  const onVisibility = () => {
    isPageVisible = !document.hidden;
    isPageVisible ? tryStart() : tryStop();
  };
  document.addEventListener('visibilitychange', onVisibility);

  tryStart();

  return {
    destroy: () => {
      tryStop();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', resize);
      window.removeEventListener('orientationchange', onOrientation);
      ro.disconnect();
      mount.removeEventListener('mousemove', onMouseMove);
      mount.removeEventListener('mouseenter', onMouseEnter);
      mount.removeEventListener('mouseleave', onMouseLeave);
      mount.removeEventListener('click', onClick);
      if (renderer.domElement.parentNode) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
      material.dispose();
    },
    updateOptions: (newOpts) => {
      Object.assign(p, newOpts);
      if (newOpts.color) uniforms.uColor.value.set(newOpts.color);
      if (newOpts.colorTwo) uniforms.uColorTwo.value.set(newOpts.colorTwo);
      if (newOpts.ringCount !== undefined) uniforms.uRingCount.value = newOpts.ringCount;
      if (newOpts.attenuation !== undefined) uniforms.uAttenuation.value = newOpts.attenuation;
    }
  };
}
