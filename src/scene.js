import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { PROJECTS } from './data.js';
import { createSmokeTexture } from './texture.js';

const PROJECT_SPACING_Z = -7;
const FIRST_PROJECT_Z = -5;

function smoothstep(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export class SceneController {
  constructor(canvas) {
    this.canvas = canvas;
    this.clock = new THREE.Clock();
    this.mouse = new THREE.Vector2(0, 0);
    this.mouseTarget = new THREE.Vector2(0, 0);
    this.focalIndex = -1;
    this.onFocalChange = null;
    this.categoryFilter = 'all';

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x08080a);
    this.scene.fog = new THREE.FogExp2(0x08080a, 0.028);

    this.camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 200);
    this.camera.position.set(0, 0, 7);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.85,
      0.6,
      0.15
    );
    this.composer.addPass(this.bloomPass);

    this.projectAnchors = PROJECTS.map((_, i) => ({
      x: i % 2 === 0 ? -1.6 : 1.7,
      y: i % 3 === 0 ? 0.6 : -0.4,
      z: FIRST_PROJECT_Z + i * PROJECT_SPACING_Z,
    }));

    this._buildRibbon();
    this._buildParticles();
    this._buildPanels();

    this.lastProjectZ = this.projectAnchors[this.projectAnchors.length - 1].z;

    window.addEventListener('resize', () => this._onResize());
    window.addEventListener('pointermove', (e) => this._onPointerMove(e));
  }

  _onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);
  }

  _onPointerMove(e) {
    this.mouseTarget.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouseTarget.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }

  _buildRibbon() {
    const group = new THREE.Group();
    const curveFn = (t, ampY, freqY, phase) =>
      new THREE.Vector3(
        Math.sin(t * 2) * 1.6,
        Math.sin(t * freqY + phase) * ampY,
        Math.cos(t) * 1.6
      );

    const makeRibbon = (ampY, freqY, phase, radius, color) => {
      const points = [];
      const segments = 220;
      for (let i = 0; i <= segments; i++) {
        const t = (i / segments) * Math.PI * 2;
        points.push(curveFn(t, ampY, freqY, phase));
      }
      const curve = new THREE.CatmullRomCurve3(points, true);
      const geo = new THREE.TubeGeometry(curve, 260, radius, 10, true);
      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      return new THREE.Mesh(geo, mat);
    };

    this.ribbonA = makeRibbon(1.9, 3, 0, 0.045, 0xf4f0ff);
    this.ribbonB = makeRibbon(1.5, 3, Math.PI / 2, 0.028, 0x8b5cf6);
    this.ribbonB.scale.setScalar(0.82);
    group.add(this.ribbonA, this.ribbonB);
    group.position.set(0, 0, -1);
    this.ribbonGroup = group;
    this.scene.add(group);
  }

  _buildParticles() {
    const count = 3200;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    const palette = [0x8b5cf6, 0xec4899, 0x2dd4bf, 0xf59e0b, 0x60a5fa, 0xf4f4f8];
    const minZ = this.lastProjectZ ? this.lastProjectZ - 10 : FIRST_PROJECT_Z - 40;
    const c = new THREE.Color();

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = 8 - Math.random() * 60;
      c.set(palette[Math.floor(Math.random() * palette.length)]);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
      speeds[i] = 0.3 + Math.random() * 0.7;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.particleSpeeds = speeds;
    this.particleBase = positions.slice();

    const mat = new THREE.PointsMaterial({
      size: 0.055,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.particles = new THREE.Points(geo, mat);
    this.scene.add(this.particles);
  }

  _buildPanels() {
    this.panelGroups = PROJECTS.map((project, i) => {
      const anchor = this.projectAnchors[i];
      const group = new THREE.Group();
      group.position.set(anchor.x, anchor.y, anchor.z);
      group.rotation.y = i % 2 === 0 ? 0.28 : -0.28;

      const texture = createSmokeTexture(project.colorA, project.colorB);
      const mainGeo = new THREE.PlaneGeometry(3.4, 2.1);
      const mainMat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const mainPanel = new THREE.Mesh(mainGeo, mainMat);

      const edges = new THREE.EdgesGeometry(mainGeo);
      const edgeMat = new THREE.LineBasicMaterial({
        color: project.colorA,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
      });
      const border = new THREE.LineSegments(edges, edgeMat);

      const backGeo = new THREE.PlaneGeometry(2.1, 1.4);
      const backMat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const backPanel = new THREE.Mesh(backGeo, backMat);
      backPanel.position.set(i % 2 === 0 ? 1.1 : -1.1, -0.5, -1.4);
      backPanel.rotation.y = i % 2 === 0 ? -0.5 : 0.5;

      group.add(backPanel, mainPanel, border);
      group.userData = { mainMat, edgeMat, backMat, project, index: i };
      this.scene.add(group);
      return group;
    });
  }

  setCategoryFilter(filter) {
    this.categoryFilter = filter;
  }

  scrollTargetForIndex(index) {
    const n = PROJECTS.length;
    return index / Math.max(1, n - 1);
  }

  update(sections) {
    const { heroProgress, showcaseProgress, contactProgress } = sections;
    const dt = this.clock.getDelta();
    const t = this.clock.elapsedTime;

    this.mouse.lerp(this.mouseTarget, 0.06);

    const n = PROJECTS.length;
    const focalFloat = showcaseProgress * (n - 1);
    const i0 = Math.max(0, Math.min(n - 1, Math.floor(focalFloat)));
    const frac = focalFloat - i0;
    const i1 = Math.min(n - 1, i0 + 1);

    const anchors = this.projectAnchors;
    const showcaseX = lerp(anchors[i0].x, anchors[i1].x, frac);
    const showcaseY = lerp(anchors[i0].y, anchors[i1].y, frac);

    const zEnd = this.lastProjectZ - 3;
    let targetZ;
    if (heroProgress < 1) {
      targetZ = lerp(6.5, 4, heroProgress);
    } else {
      targetZ = lerp(4, zEnd, showcaseProgress);
    }
    if (contactProgress > 0) {
      targetZ = lerp(zEnd, zEnd - 5, contactProgress);
    }

    const targetX = heroProgress < 1 ? 0 : showcaseX;
    const targetY = heroProgress < 1 ? 0 : showcaseY;

    this.camera.position.x = lerp(this.camera.position.x, targetX, 0.05);
    this.camera.position.y = lerp(this.camera.position.y, targetY, 0.05);
    this.camera.position.z = lerp(this.camera.position.z, targetZ, 0.06);

    const lookTarget = new THREE.Vector3(
      targetX + this.mouse.x * 0.7,
      targetY + this.mouse.y * 0.4,
      this.camera.position.z - 5
    );
    this.camera.lookAt(lookTarget);

    this.ribbonGroup.rotation.y = t * 0.15;
    this.ribbonGroup.rotation.x = Math.sin(t * 0.08) * 0.15;
    const ribbonVisibility = 1 - smoothstep(0.55, 1.0, heroProgress);
    this.ribbonA.material.opacity = 0.9 * ribbonVisibility;
    this.ribbonB.material.opacity = 0.7 * ribbonVisibility;
    this.ribbonGroup.visible = ribbonVisibility > 0.01;

    const posAttr = this.particles.geometry.attributes.position;
    for (let i = 0; i < this.particleSpeeds.length; i++) {
      const baseX = this.particleBase[i * 3];
      const baseY = this.particleBase[i * 3 + 1];
      const baseZ = this.particleBase[i * 3 + 2];
      const s = this.particleSpeeds[i];
      posAttr.array[i * 3] = baseX + Math.sin(t * s + i) * 0.5;
      posAttr.array[i * 3 + 1] = baseY + Math.cos(t * s * 0.8 + i) * 0.4;
      posAttr.array[i * 3 + 2] = baseZ;
    }
    posAttr.needsUpdate = true;

    const showcaseVisibility =
      smoothstep(0.5, 1.0, heroProgress) * (1 - smoothstep(0.0, 0.35, contactProgress));

    this.panelGroups.forEach((group, i) => {
      const dist = Math.abs(focalFloat - i);
      let opacity = Math.max(0, 1 - dist / 1.15) * showcaseVisibility;
      const filter = this.categoryFilter;
      if (filter !== 'all' && group.userData.project.category !== filter) {
        opacity *= 0.1;
      }
      group.userData.mainMat.opacity = opacity * 0.85;
      group.userData.backMat.opacity = opacity * 0.5;
      group.userData.edgeMat.opacity = opacity;
      group.rotation.y += dt * 0.03 * (i % 2 === 0 ? 1 : -1);
    });

    const newFocal = showcaseVisibility < 0.05 ? -1 : Math.max(0, Math.min(n - 1, Math.round(focalFloat)));
    if (newFocal !== this.focalIndex) {
      this.focalIndex = newFocal;
      if (this.onFocalChange) this.onFocalChange(newFocal, showcaseVisibility);
    } else if (this.onFocalChange) {
      this.onFocalChange(this.focalIndex, showcaseVisibility);
    }

    this.composer.render();
  }
}
