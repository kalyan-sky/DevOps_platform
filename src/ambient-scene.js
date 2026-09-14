import * as THREE from 'three';

// Additive blending (used for the dark theme's glow look) adds light onto
// whatever's already drawn — great against a near-black background, but it
// blows out to white almost immediately against a light one. Light mode
// switches to normal blending with deeper, more saturated colors instead so
// the scene stays visible rather than washing out.
const PALETTES = {
  dark: {
    bg: 0x08080a,
    ribbonA: 0xf4f0ff,
    ribbonB: 0x8b5cf6,
    particles: [0x8b5cf6, 0xec4899, 0x2dd4bf, 0xf59e0b, 0x60a5fa],
    blending: THREE.AdditiveBlending,
    ribbonOpacity: 0.55,
    particleOpacity: 0.75,
  },
  light: {
    bg: 0xf7f6fb,
    ribbonA: 0x4c1d95,
    ribbonB: 0x7c3aed,
    particles: [0x7c3aed, 0xdb2777, 0x0f766e, 0xb45309, 0x1d4ed8],
    blending: THREE.NormalBlending,
    ribbonOpacity: 0.45,
    particleOpacity: 0.55,
  },
};

function getTheme() {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

export function mountAmbientScene(canvas) {
  let theme = getTheme();
  let palette = PALETTES[theme];

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(palette.bg);
  scene.fog = new THREE.FogExp2(palette.bg, 0.05);

  const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 6);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const ribbonGroup = new THREE.Group();
  ribbonGroup.position.set(1.4, 0.2, -2);
  scene.add(ribbonGroup);

  const curveFn = (t, ampY, freqY, phase) =>
    new THREE.Vector3(Math.sin(t * 2) * 1.6, Math.sin(t * freqY + phase) * ampY, Math.cos(t) * 1.6);

  function makeRibbon(ampY, freqY, phase, radius, color) {
    const points = [];
    const segments = 200;
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 2;
      points.push(curveFn(t, ampY, freqY, phase));
    }
    const curve = new THREE.CatmullRomCurve3(points, true);
    const geo = new THREE.TubeGeometry(curve, 220, radius, 8, true);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: palette.ribbonOpacity,
      blending: palette.blending,
      depthWrite: false,
      fog: false,
    });
    return new THREE.Mesh(geo, mat);
  }

  const ribbonA = makeRibbon(1.7, 3, 0, 0.045, palette.ribbonA);
  const ribbonB = makeRibbon(1.3, 3, Math.PI / 2, 0.03, palette.ribbonB);
  ribbonB.scale.setScalar(0.82);
  ribbonGroup.add(ribbonA, ribbonB);

  const count = 900;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const speeds = new Float32Array(count);
  const c = new THREE.Color();
  function fillParticleColors(paletteColors) {
    for (let i = 0; i < count; i++) {
      c.set(paletteColors[Math.floor(Math.random() * paletteColors.length)]);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
  }
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 14;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 9;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
    speeds[i] = 0.3 + Math.random() * 0.7;
  }
  fillParticleColors(palette.particles);
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const pBase = positions.slice();
  const pMat = new THREE.PointsMaterial({
    size: 0.05,
    vertexColors: true,
    transparent: true,
    opacity: palette.particleOpacity,
    blending: palette.blending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  // Live-swap colors/blending when the nav's theme toggle fires, so the
  // scene doesn't require a page reload to match the new theme.
  window.addEventListener('themechange', (e) => {
    theme = e.detail?.theme === 'light' ? 'light' : 'dark';
    palette = PALETTES[theme];
    scene.background.set(palette.bg);
    scene.fog.color.set(palette.bg);
    ribbonA.material.color.set(palette.ribbonA);
    ribbonA.material.opacity = palette.ribbonOpacity;
    ribbonA.material.blending = palette.blending;
    ribbonB.material.color.set(palette.ribbonB);
    ribbonB.material.opacity = palette.ribbonOpacity;
    ribbonB.material.blending = palette.blending;
    fillParticleColors(palette.particles);
    pGeo.attributes.color.needsUpdate = true;
    pMat.opacity = palette.particleOpacity;
    pMat.blending = palette.blending;
  });

  const mouse = new THREE.Vector2(0, 0);
  const mouseTarget = new THREE.Vector2(0, 0);
  window.addEventListener('pointermove', (e) => {
    mouseTarget.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouseTarget.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  const clock = new THREE.Clock();
  let running = true;

  function render() {
    if (!running) return;
    const t = clock.elapsedTime;
    clock.getDelta();
    mouse.lerp(mouseTarget, 0.05);

    ribbonGroup.rotation.y = t * 0.12;
    ribbonGroup.rotation.x = Math.sin(t * 0.07) * 0.12;

    const posAttr = particles.geometry.attributes.position;
    for (let i = 0; i < speeds.length; i++) {
      posAttr.array[i * 3] = pBase[i * 3] + Math.sin(t * speeds[i] + i) * 0.4;
      posAttr.array[i * 3 + 1] = pBase[i * 3 + 1] + Math.cos(t * speeds[i] * 0.8 + i) * 0.3;
    }
    posAttr.needsUpdate = true;

    camera.position.x += (mouse.x * 0.6 - camera.position.x) * 0.04;
    camera.position.y += (mouse.y * 0.4 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, -2);

    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }
  render();

  return {
    stop() {
      running = false;
    },
  };
}
