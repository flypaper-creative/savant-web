import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const canvas = document.getElementById('bg3d');
const preloader = document.getElementById('preloader');
const initBtn = document.getElementById('initBtn');
const preloadPercent = document.getElementById('preloadPercent');
const preloadFill = document.getElementById('preloadFill');
const shell = document.getElementById('shell');

const CFG = {
  preloadMs: 7600,
  dpr: Math.min(window.devicePixelRatio || 1, 2),
  exposure: 1.04,
  bloomBase: 0.10,
  bloomPeak: 0.20,
  chamberRadius: 5.1,
  chamberHeight: 6.4,
  rigY: 0.30,
  rigZ: -1.9,
  ringRadius: 2.24,
  logoTargetSize: 1.86,
};

const state = {
  progress: 0,
  loaded: false,
  ready: false,
  entered: false,
  startedAt: performance.now(),
};

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function easeOutQuart(x) { return 1 - Math.pow(1 - x, 4); }

function makeCanvasTexture(draw, size = 512) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  draw(g, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

function makeGlowSprite(stops, size = 6, opacity = 1) {
  const tex = makeCanvasTexture((g, w, h) => {
    const grad = g.createRadialGradient(w / 2, h / 2, 1, w / 2, h / 2, w / 2);
    for (const [o, c] of stops) grad.addColorStop(o, c);
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
  }, 512);

  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    opacity,
    blending: THREE.AdditiveBlending
  });

  const s = new THREE.Sprite(mat);
  s.scale.set(size, size, 1);
  return s;
}

function polishedGoldMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0xe6c56a,
    metalness: 1.0,
    roughness: 0.012,
    clearcoat: 1.0,
    clearcoatRoughness: 0.001,
    envMapIntensity: 12.5,
    reflectivity: 1.0
  });
}

function obsidianMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0x020203,
    metalness: 1.0,
    roughness: 0.12,
    clearcoat: 1.0,
    clearcoatRoughness: 0.022,
    envMapIntensity: 1.4
  });
}

function darkMetalMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0x06070a,
    metalness: 1.0,
    roughness: 0.20,
    clearcoat: 1.0,
    clearcoatRoughness: 0.030,
    envMapIntensity: 1.2
  });
}

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance'
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(CFG.dpr);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = CFG.exposure;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x010101);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

const camera = new THREE.OrthographicCamera(-3, 3, 3, -3, 0.1, 100);
camera.position.set(0, 0, 10);
camera.lookAt(0, CFG.rigY, CFG.rigZ);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  CFG.bloomBase,
  0.8,
  0.96
);
composer.addPass(bloomPass);

scene.add(new THREE.AmbientLight(0xffffff, 0.06));

const key = new THREE.SpotLight(0xffffff, 30, 50, 0.28, 0.78, 1.18);
key.position.set(0.0, 1.7, 5.3);
scene.add(key);

const fill = new THREE.PointLight(0xf4f7ff, 2.6, 14);
fill.position.set(-1.7, -0.08, 4.2);
scene.add(fill);

const rim = new THREE.PointLight(0xffffff, 8.6, 20);
rim.position.set(1.15, 1.35, -2.25);
scene.add(rim);

const under = new THREE.PointLight(0xffd37a, 0.75, 8);
under.position.set(0, -1.45, 2.25);
scene.add(under);

const flareGroup = new THREE.Group();
scene.add(flareGroup);

const flareCenter = makeGlowSprite([
  [0.00, 'rgba(255,248,232,0.55)'],
  [0.10, 'rgba(255,233,186,0.24)'],
  [0.30, 'rgba(255,214,140,0.07)'],
  [1.00, 'rgba(255,255,255,0.0)']
], 0.52, 0.16);
flareGroup.add(flareCenter);

const flareHoriz = new THREE.Sprite(new THREE.SpriteMaterial({
  map: makeCanvasTexture((g, w, h) => {
    const grad = g.createLinearGradient(0, h / 2, w, h / 2);
    grad.addColorStop(0.00, 'rgba(255,255,255,0.0)');
    grad.addColorStop(0.18, 'rgba(255,230,170,0.0)');
    grad.addColorStop(0.50, 'rgba(255,240,210,0.85)');
    grad.addColorStop(0.82, 'rgba(255,230,170,0.0)');
    grad.addColorStop(1.00, 'rgba(255,255,255,0.0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
  }, 1024),
  transparent: true,
  opacity: 0.12,
  depthWrite: false,
  depthTest: false,
  blending: THREE.AdditiveBlending
}));
flareHoriz.scale.set(3.6, 0.085, 1);
flareGroup.add(flareHoriz);

const flareGhostA = makeGlowSprite([
  [0.00, 'rgba(255,245,220,0.35)'],
  [0.16, 'rgba(255,220,150,0.09)'],
  [1.00, 'rgba(255,255,255,0.0)']
], 0.22, 0.08);
flareGroup.add(flareGhostA);

const flareGhostB = makeGlowSprite([
  [0.00, 'rgba(255,245,220,0.25)'],
  [0.16, 'rgba(255,220,150,0.07)'],
  [1.00, 'rgba(255,255,255,0.0)']
], 0.14, 0.06);
flareGroup.add(flareGhostB);

const flareGroup = new THREE.Group();
scene.add(flareGroup);

const flareCenter = makeGlowSprite([
  [0.00, 'rgba(255,248,232,0.55)'],
  [0.10, 'rgba(255,233,186,0.24)'],
  [0.30, 'rgba(255,214,140,0.07)'],
  [1.00, 'rgba(255,255,255,0.0)']
], 0.52, 0.16);
flareGroup.add(flareCenter);

const flareHoriz = new THREE.Sprite(new THREE.SpriteMaterial({
  map: makeCanvasTexture((g, w, h) => {
    const grad = g.createLinearGradient(0, h / 2, w, h / 2);
    grad.addColorStop(0.00, 'rgba(255,255,255,0.0)');
    grad.addColorStop(0.18, 'rgba(255,230,170,0.0)');
    grad.addColorStop(0.50, 'rgba(255,240,210,0.85)');
    grad.addColorStop(0.82, 'rgba(255,230,170,0.0)');
    grad.addColorStop(1.00, 'rgba(255,255,255,0.0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
  }, 1024),
  transparent: true,
  opacity: 0.12,
  depthWrite: false,
  depthTest: false,
  blending: THREE.AdditiveBlending
}));
flareHoriz.scale.set(3.6, 0.085, 1);
flareGroup.add(flareHoriz);

const flareGhostA = makeGlowSprite([
  [0.00, 'rgba(255,245,220,0.35)'],
  [0.16, 'rgba(255,220,150,0.09)'],
  [1.00, 'rgba(255,255,255,0.0)']
], 0.22, 0.08);
flareGroup.add(flareGhostA);

const flareGhostB = makeGlowSprite([
  [0.00, 'rgba(255,245,220,0.25)'],
  [0.16, 'rgba(255,220,150,0.07)'],
  [1.00, 'rgba(255,255,255,0.0)']
], 0.14, 0.06);
flareGroup.add(flareGhostB);

class ChamberSystem {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);

    this.shell = new THREE.Mesh(
      new THREE.CylinderGeometry(CFG.chamberRadius, CFG.chamberRadius, CFG.chamberHeight, 72, 1, true),
      new THREE.MeshPhysicalMaterial({
        color: 0x050505,
        metalness: 0.18,
        roughness: 0.95,
        side: THREE.BackSide
      })
    );
    this.group.add(this.shell);

    this.backHaze = makeGlowSprite([
      [0.00, 'rgba(255,245,220,0.08)'],
      [0.14, 'rgba(255,214,140,0.045)'],
      [0.28, 'rgba(255,180,90,0.018)'],
      [1.00, 'rgba(255,255,255,0.0)']
    ], 7.2, 0.08);
    this.backHaze.position.set(0, CFG.rigY, CFG.rigZ - 1.0);
    this.group.add(this.backHaze);

    this.fogLayers = [];
    const defs = [
      { x: -0.82, y: CFG.rigY + 0.16, z: CFG.rigZ - 0.76, s: 2.8, o: 0.028 },
      { x:  0.84, y: CFG.rigY + 0.05, z: CFG.rigZ - 0.84, s: 3.0, o: 0.024 },
      { x:  0.00, y: CFG.rigY - 0.70, z: CFG.rigZ - 0.70, s: 3.6, o: 0.020 }
    ];

    for (let i = 0; i < defs.length; i++) {
      const d = defs[i];
      const sprite = makeGlowSprite([
        [0.00, 'rgba(255,245,220,0.08)'],
        [0.16, 'rgba(255,214,140,0.03)'],
        [0.32, 'rgba(255,180,90,0.012)'],
        [1.00, 'rgba(255,255,255,0.0)']
      ], d.s, d.o);
      sprite.position.set(d.x, d.y, d.z);
      sprite.userData = {
        baseX: d.x,
        baseY: d.y,
        baseZ: d.z,
        speed: 0.14 + i * 0.04,
        phase: i * 1.33
      };
      this.group.add(sprite);
      this.fogLayers.push(sprite);
    }

    this.beams = [];
    const beamGeo = new THREE.ConeGeometry(0.34, 3.8, 28, 1, true);
    for (let i = 0; i < 3; i++) {
      const beam = new THREE.Mesh(
        beamGeo,
        new THREE.MeshBasicMaterial({
          color: 0xffdd8a,
          transparent: true,
          opacity: 0.045,
          depthWrite: false,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending
        })
      );
      beam.position.set((i - 1) * 0.95, CFG.rigY + 1.28, CFG.rigZ + 1.35);
      beam.rotation.x = -Math.PI / 2.24;
      beam.userData.phase = i * 1.24;
      this.group.add(beam);
      this.beams.push(beam);
    }
  }

  update(t) {
    this.backHaze.material.opacity = 0.065 + Math.sin(t * 0.38) * 0.01;
    this.backHaze.scale.set(
      7.0 + Math.sin(t * 0.16) * 0.08,
      7.0 + Math.cos(t * 0.14) * 0.07,
      1
    );

    for (let i = 0; i < this.fogLayers.length; i++) {
      const layer = this.fogLayers[i];
      const u = layer.userData;
      layer.position.x = u.baseX + Math.sin(t * u.speed + u.phase) * 0.06;
      layer.position.y = u.baseY + Math.cos(t * (u.speed * 0.82) + u.phase) * 0.04;
      layer.position.z = u.baseZ + Math.sin(t * (u.speed * 1.15) + u.phase) * 0.025;
      layer.material.opacity = 0.014 + (Math.sin(t * (u.speed * 1.4) + u.phase) * 0.5 + 0.5) * 0.014;
    }

    for (let i = 0; i < this.beams.length; i++) {
      const b = this.beams[i];
      const t2 = t + b.userData.phase;
      b.position.x = Math.sin(t2 * 0.54) * 1.05;
      b.rotation.z = Math.sin(t2 * 0.36) * 0.18;
      b.material.opacity = 0.03 + Math.sin(t2 * 1.1) * 0.012;
    }
  }
}

class RingSystem {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.position.set(0, CFG.rigY, CFG.rigZ);
    scene.add(this.group);

    this.rig = new THREE.Group();
    this.group.add(this.rig);

    this.outerShell = new THREE.Mesh(
      new THREE.TorusGeometry(CFG.ringRadius, 0.09, 36, 280),
      obsidianMaterial()
    );
    this.rig.add(this.outerShell);

    this.midShell = new THREE.Mesh(
      new THREE.TorusGeometry(CFG.ringRadius - 0.03, 0.034, 20, 240),
      darkMetalMaterial()
    );
    this.rig.add(this.midShell);

    this.innerRail = new THREE.Mesh(
      new THREE.TorusGeometry(CFG.ringRadius - 0.15, 0.013, 16, 220),
      new THREE.MeshPhysicalMaterial({
        color: 0x17191d,
        metalness: 1.0,
        roughness: 0.10,
        clearcoat: 1.0,
        clearcoatRoughness: 0.02,
        envMapIntensity: 1.6
      })
    );
    this.rig.add(this.innerRail);

    this.innerTrace = new THREE.Mesh(
      new THREE.TorusGeometry(CFG.ringRadius - 0.18, 0.005, 12, 220),
      new THREE.MeshBasicMaterial({
        color: 0xc99a43,
        transparent: true,
        opacity: 0.34
      })
    );
    this.rig.add(this.innerTrace);

    this.buildArmor();
    this.buildDots();
    this.buildStrips();
    this.buildEmitter();
  }

  buildArmor() {
    this.armor = [];
    const geo = new THREE.BoxGeometry(0.28, 0.11, 0.12);
    const mat = obsidianMaterial();
    const pattern = [1.52,1.02,1.14,1.02,1.46,1.03,1.12,1.03,1.38,1.03,1.10,1.03,1.32,1.02];
    for (let i = 0; i < pattern.length; i++) {
      const a = (i / pattern.length) * Math.PI * 2;
      const seg = new THREE.Mesh(geo, mat);
      seg.position.set(Math.cos(a) * (CFG.ringRadius + 0.06), Math.sin(a) * (CFG.ringRadius + 0.06), 0.07);
      seg.rotation.z = a;
      seg.scale.y = pattern[i];
      seg.scale.x = i % 4 === 0 ? 1.12 : 1.0;
      this.rig.add(seg);
      this.armor.push(seg);
    }
  }

  buildDots() {
    this.dots = [];
    const geo = new THREE.BoxGeometry(0.01, 0.004, 0.006);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffd490 });
    for (let i = 0; i < 132; i++) {
      const a = Math.PI / 2 + (i / 132) * Math.PI * 2;
      const dot = new THREE.Mesh(geo, mat);
      dot.position.set(Math.cos(a) * (CFG.ringRadius - 0.15), Math.sin(a) * (CFG.ringRadius - 0.15), 0.12);
      dot.rotation.z = a;
      this.rig.add(dot);
      this.dots.push(dot);
    }
  }

  buildStrips() {
    this.strips = [];
    const stripAngles = [0.18, 1.94, 2.54, 3.62, 4.08, 5.72];
    for (const a of stripAngles) {
      const g = new THREE.Group();
      g.position.set(Math.cos(a) * (CFG.ringRadius + 0.04), Math.sin(a) * (CFG.ringRadius + 0.04), 0.09);
      g.rotation.z = a;

      const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.042, 0.065),
        obsidianMaterial()
      );
      g.add(body);

      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(0.11, 0.008, 0.009),
        new THREE.MeshBasicMaterial({
          color: 0xffd48c,
          transparent: true,
          opacity: 0.26
        })
      );
      strip.position.z = 0.038;
      g.add(strip);

      this.rig.add(g);
      this.strips.push({ g, strip });
    }
  }

  buildEmitter() {
    this.emitter = new THREE.Group();
    this.emitter.position.set(0, CFG.ringRadius + 0.01, 0.04);

    this.core = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, 0.18, 0.012),
      new THREE.MeshBasicMaterial({
        color: 0xffe3a2,
        transparent: true,
        opacity: 0.32
      })
    );
    this.emitter.add(this.core);

    this.rig.add(this.emitter);
  }

  update(t) {
    this.outerShell.rotation.z += 0.00024;
    this.midShell.rotation.z -= 0.00012;
    this.innerRail.rotation.z += 0.00042;
    this.innerTrace.rotation.z -= 0.00072;

    this.rig.rotation.z = Math.sin(t * 0.14) * 0.0028;
    this.rig.rotation.x = Math.sin(t * 0.12) * 0.0038;

    this.core.material.opacity = 0.24 + Math.sin(t * 2.8) * 0.03;

    for (let i = 0; i < this.strips.length; i++) {
      this.strips[i].strip.material.opacity = 0.22 + Math.sin(t * 1.0 + i) * 0.02;
    }
  }
}

class LogoSystem {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.position.set(0, CFG.rigY, CFG.rigZ);
    scene.add(this.group);
    this.root = null;
    this.glowShell = null;
    this.baseScale = 1;
    this.load();
  }

  applyMaterial(root) {
    root.traverse((obj) => {
      if (!obj.isMesh) return;
      obj.material = polishedGoldMaterial();
      obj.castShadow = false;
      obj.receiveShadow = false;
    });
  }

  fit(root) {
    const box = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    root.position.sub(center);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    this.baseScale = CFG.logoTargetSize / maxDim;
    root.scale.setScalar(this.baseScale);
  }

  load() {
    const loader = new GLTFLoader();
    loader.load(
      '/public/assets/logo7/logo7.glb',
      (gltf) => {
        this.root = gltf.scene;
        this.applyMaterial(this.root);
        this.group.add(this.root);
        this.fit(this.root);

        this.glowShell = this.root.clone(true);
        this.glowShell.traverse((obj) => {
          if (!obj.isMesh) return;
          obj.material = new THREE.MeshBasicMaterial({
            color: 0xfff0c9,
            transparent: true,
            opacity: 0.008,
            depthWrite: false
          });
        });
        this.glowShell.scale.multiplyScalar(1.02);
        this.group.add(this.glowShell);

        state.loaded = true;
      },
      undefined,
      () => {
        this.root = new THREE.Mesh(
          new THREE.TorusKnotGeometry(0.98, 0.22, 240, 36, 2, 3),
          polishedGoldMaterial()
        );
        this.group.add(this.root);

        this.glowShell = this.root.clone();
        this.glowShell.material = new THREE.MeshBasicMaterial({
          color: 0xfff0c9,
          transparent: true,
          opacity: 0.008,
          depthWrite: false
        });
        this.glowShell.scale.multiplyScalar(1.02);
        this.group.add(this.glowShell);

        state.loaded = true;
      }
    );
  }

  update(t, p) {
    if (!this.root) return;
    const settle = easeOutQuart(Math.min(p / 0.62, 1));
    this.group.position.y = CFG.rigY + (1 - settle) * 0.14;
    this.root.rotation.y += 0.0028;
    this.root.rotation.x = 0.095 + Math.sin(t * 0.72) * 0.009;

    if (this.glowShell) {
      this.glowShell.rotation.y = this.root.rotation.y;
      this.glowShell.rotation.x = this.root.rotation.x;
      const s = 1.012 + Math.sin(t * 1.4) * 0.0012;
      this.glowShell.scale.setScalar(s);
    }
  }
}

const chamber = new ChamberSystem(scene);
const ring = new RingSystem(scene);
const logo = new LogoSystem(scene);

initBtn?.addEventListener('click', () => {
  if (!state.ready || state.entered) return;
  state.entered = true;
  preloader?.classList.add('hidden');
  shell?.classList.add('live');
});

function fitScene() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const aspect = w / h;
  const frustum = 7.2;

  camera.left = -frustum * aspect / 2;
  camera.right = frustum * aspect / 2;
  camera.top = frustum / 2;
  camera.bottom = -frustum / 2;
  camera.updateProjectionMatrix();

  renderer.setSize(w, h);
  renderer.setPixelRatio(CFG.dpr);
  composer.setSize(w, h);

  const mobileScale = Math.min(w / 420, h / 920);
  let scale = Math.max(0.74, Math.min(1.0, mobileScale));
  if (aspect < 0.62) scale *= 0.92;

  ring.group.scale.setScalar(scale);
  logo.group.scale.setScalar(scale);
}

function animate() {
  requestAnimationFrame(animate);

  const t = performance.now() * 0.001;
  const elapsed = performance.now() - state.startedAt;
  const target = clamp(elapsed / CFG.preloadMs, 0, 1);

  if (!state.loaded) {
    state.progress += (Math.min(target, 0.92) - state.progress) * 0.03;
  } else {
    state.progress += (1 - state.progress) * 0.045;
  }

  if (state.loaded && state.progress > 0.995 && !state.ready) {
    state.ready = true;
    initBtn?.classList.add('ready');
  }

  const pct = String(Math.round(state.progress * 100)).padStart(3, '0');
  if (preloadPercent) preloadPercent.textContent = `${pct}%`;
  if (preloadFill) preloadFill.style.width = `${state.progress * 100}%`;

  chamber.update(t);
  ring.update(t);
  logo.update(t, state.progress);

  if (logo.root && flareGroup) {
    flareGroup.position.set(0.28, CFG.rigY + 0.18, CFG.rigZ + 0.96);
    flareCenter.material.opacity = 0.11 + Math.sin(t * 1.4) * 0.015;
    flareHoriz.material.opacity = 0.08 + Math.sin(t * 1.2 + 0.6) * 0.012;
    flareGhostA.position.set(-0.62, -0.01, -0.02);
    flareGhostB.position.set(0.84, 0.02, -0.03);
  }

  bloomPass.strength = lerp(CFG.bloomBase, CFG.bloomPeak, state.progress);

  composer.render();
}

window.addEventListener('resize', fitScene);
fitScene();
animate();
