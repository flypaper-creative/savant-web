import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
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
  preloadMs: 8200,
  dpr: Math.min(window.devicePixelRatio || 1, 2),
  exposure: 0.94,
  bloomBase: 0.035,
  bloomPeak: 0.08,
  chamberRadius: 6.2,
  chamberHeight: 7.8,
  rigY: 0.12,
  rigZ: -2.45,
  ringRadius: 2.28,
  logoTargetSize: 1.78,
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

function makeCanvasTexture(draw, size = 1024) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  draw(g, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

function makeGlowSprite(stops, size = 6, opacity = 1, textureSize = 1024) {
  const tex = makeCanvasTexture((g, w, h) => {
    const grad = g.createRadialGradient(w / 2, h / 2, 1, w / 2, h / 2, w / 2);
    for (const [o, c] of stops) grad.addColorStop(o, c);
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
  }, textureSize);

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

function makeAnamorphicFlare(width = 4.2, height = 0.05, opacity = 0.032) {
  const tex = makeCanvasTexture((g, w, h) => {
    const grad = g.createLinearGradient(0, h / 2, w, h / 2);
    grad.addColorStop(0.00, 'rgba(255,255,255,0.0)');
    grad.addColorStop(0.18, 'rgba(255,240,210,0.0)');
    grad.addColorStop(0.50, 'rgba(255,248,234,1.0)');
    grad.addColorStop(0.82, 'rgba(255,240,210,0.0)');
    grad.addColorStop(1.00, 'rgba(255,255,255,0.0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
  }, 1024);

  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    opacity,
    blending: THREE.AdditiveBlending
  });

  const s = new THREE.Sprite(mat);
  s.scale.set(width, height, 1);
  return s;
}

function polishedGoldMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0xe0bf67,
    metalness: 1.0,
    roughness: 0.01,
    clearcoat: 1.0,
    clearcoatRoughness: 0.001,
    envMapIntensity: 14.0,
    reflectivity: 1.0
  });
}

function obsidianMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0x010102,
    metalness: 1.0,
    roughness: 0.14,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
    envMapIntensity: 1.05
  });
}

function darkMetalMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0x050608,
    metalness: 1.0,
    roughness: 0.22,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    envMapIntensity: 0.95
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
scene.background = new THREE.Color(0x000000);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(
  new THREE.Scene(),
  0.04
).texture;

const camera = new THREE.OrthographicCamera(-3, 3, 3, -3, 0.1, 100);
camera.position.set(0, 0, 10);
camera.lookAt(0, CFG.rigY, CFG.rigZ);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  CFG.bloomBase,
  0.6,
  0.99
);
composer.addPass(bloomPass);

scene.add(new THREE.AmbientLight(0xffffff, 0.022));

const key = new THREE.SpotLight(0xffffff, 38, 64, 0.18, 0.88, 1.25);
key.position.set(0.0, 2.1, 5.8);
scene.add(key);

const fill = new THREE.PointLight(0xf7f8fa, 1.15, 10);
fill.position.set(-1.35, 0.0, 4.8);
scene.add(fill);

const rim = new THREE.PointLight(0xffffff, 9.8, 18);
rim.position.set(1.32, 1.58, -2.8);
scene.add(rim);

const kick = new THREE.PointLight(0xffefc4, 0.42, 6);
kick.position.set(0, -1.85, 2.15);
scene.add(kick);

class ChamberSystem {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);

    this.shell = new THREE.Mesh(
      new THREE.CylinderGeometry(CFG.chamberRadius, CFG.chamberRadius, CFG.chamberHeight, 96, 1, true),
      new THREE.MeshPhysicalMaterial({
        color: 0x030303,
        metalness: 0.12,
        roughness: 0.985,
        side: THREE.BackSide
      })
    );
    this.group.add(this.shell);

    this.vaultShadow = new THREE.Mesh(
      new THREE.TorusGeometry(6.4, 0.65, 16, 180, Math.PI),
      new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.32,
        depthWrite: false
      })
    );
    this.vaultShadow.rotation.z = Math.PI;
    this.vaultShadow.position.set(0, CFG.rigY + 0.42, CFG.rigZ - 1.55);
    this.group.add(this.vaultShadow);

    this.backHaze = makeGlowSprite([
      [0.00, 'rgba(255,248,232,0.028)'],
      [0.18, 'rgba(255,230,180,0.012)'],
      [0.40, 'rgba(255,205,150,0.004)'],
      [1.00, 'rgba(255,255,255,0.0)']
    ], 8.2, 0.028, 1024);
    this.backHaze.position.set(0, CFG.rigY, CFG.rigZ - 1.2);
    this.group.add(this.backHaze);

    this.fogLayers = [];
    const defs = [
      { x: -0.68, y: CFG.rigY + 0.10, z: CFG.rigZ - 0.92, s: 2.5, o: 0.006 },
      { x:  0.72, y: CFG.rigY + 0.04, z: CFG.rigZ - 0.96, s: 2.7, o: 0.005 },
      { x:  0.00, y: CFG.rigY - 0.58, z: CFG.rigZ - 0.82, s: 3.0, o: 0.005 }
    ];

    for (let i = 0; i < defs.length; i++) {
      const d = defs[i];
      const sprite = makeGlowSprite([
        [0.00, 'rgba(255,248,232,0.022)'],
        [0.16, 'rgba(255,230,180,0.008)'],
        [0.34, 'rgba(255,205,150,0.003)'],
        [1.00, 'rgba(255,255,255,0.0)']
      ], d.s, d.o, 1024);

      sprite.position.set(d.x, d.y, d.z);
      sprite.userData = {
        baseX: d.x,
        baseY: d.y,
        baseZ: d.z,
        speed: 0.08 + i * 0.02,
        phase: i * 1.41
      };
      this.group.add(sprite);
      this.fogLayers.push(sprite);
    }

    this.beams = [];
    const beamGeo = new THREE.ConeGeometry(0.22, 4.6, 24, 1, true);
    for (let i = 0; i < 3; i++) {
      const beam = new THREE.Mesh(
        beamGeo,
        new THREE.MeshBasicMaterial({
          color: 0xffe2a8,
          transparent: true,
          opacity: 0.016,
          depthWrite: false,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending
        })
      );
      beam.position.set((i - 1) * 0.74, CFG.rigY + 1.44, CFG.rigZ + 1.54);
      beam.rotation.x = -Math.PI / 2.28;
      beam.userData.phase = i * 1.2;
      this.group.add(beam);
      this.beams.push(beam);
    }
  }

  update(t) {
    this.backHaze.material.opacity = 0.023 + Math.sin(t * 0.18) * 0.0025;

    for (let i = 0; i < this.fogLayers.length; i++) {
      const layer = this.fogLayers[i];
      const u = layer.userData;
      layer.position.x = u.baseX + Math.sin(t * u.speed + u.phase) * 0.018;
      layer.position.y = u.baseY + Math.cos(t * (u.speed * 0.8) + u.phase) * 0.014;
      layer.position.z = u.baseZ + Math.sin(t * (u.speed * 1.1) + u.phase) * 0.008;
    }

    for (let i = 0; i < this.beams.length; i++) {
      const b = this.beams[i];
      const t2 = t + b.userData.phase;
      b.position.x = Math.sin(t2 * 0.24) * 0.82;
      b.rotation.z = Math.sin(t2 * 0.18) * 0.05;
      b.material.opacity = 0.013 + Math.sin(t2 * 0.62) * 0.003;
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
      new THREE.TorusGeometry(CFG.ringRadius, 0.09, 34, 260),
      obsidianMaterial()
    );
    this.rig.add(this.outerShell);

    this.midShell = new THREE.Mesh(
      new THREE.TorusGeometry(CFG.ringRadius - 0.03, 0.026, 18, 210),
      darkMetalMaterial()
    );
    this.rig.add(this.midShell);

    this.innerRail = new THREE.Mesh(
      new THREE.TorusGeometry(CFG.ringRadius - 0.15, 0.008, 14, 200),
      new THREE.MeshPhysicalMaterial({
        color: 0x101215,
        metalness: 1.0,
        roughness: 0.16,
        clearcoat: 1.0,
        clearcoatRoughness: 0.03,
        envMapIntensity: 0.8
      })
    );
    this.rig.add(this.innerRail);

    this.innerTrace = new THREE.Mesh(
      new THREE.TorusGeometry(CFG.ringRadius - 0.175, 0.003, 10, 190),
      new THREE.MeshBasicMaterial({
        color: 0xa87c33,
        transparent: true,
        opacity: 0.10
      })
    );
    this.rig.add(this.innerTrace);

    this.buildArmor();
    this.buildDots();
    this.buildStrips();
  }

  buildArmor() {
    this.armor = [];
    const geo = new THREE.BoxGeometry(0.30, 0.10, 0.11);
    const mat = obsidianMaterial();
    const pattern = [1.58,1.02,1.12,1.02,1.50,1.03,1.10,1.03,1.42,1.03,1.08,1.03,1.36,1.02];
    for (let i = 0; i < pattern.length; i++) {
      const a = (i / pattern.length) * Math.PI * 2;
      const seg = new THREE.Mesh(geo, mat);
      seg.position.set(Math.cos(a) * (CFG.ringRadius + 0.06), Math.sin(a) * (CFG.ringRadius + 0.06), 0.07);
      seg.rotation.z = a;
      seg.scale.y = pattern[i];
      seg.scale.x = i % 4 === 0 ? 1.14 : 1.0;
      this.rig.add(seg);
      this.armor.push(seg);
    }
  }

  buildDots() {
    this.dots = [];
    const geo = new THREE.BoxGeometry(0.007, 0.003, 0.004);
    const mat = new THREE.MeshBasicMaterial({ color: 0xb9893d });
    for (let i = 0; i < 112; i++) {
      const a = Math.PI / 2 + (i / 112) * Math.PI * 2;
      const dot = new THREE.Mesh(geo, mat);
      dot.position.set(Math.cos(a) * (CFG.ringRadius - 0.14), Math.sin(a) * (CFG.ringRadius - 0.14), 0.10);
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
      g.position.set(Math.cos(a) * (CFG.ringRadius + 0.04), Math.sin(a) * (CFG.ringRadius + 0.04), 0.08);
      g.rotation.z = a;

      const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.035, 0.055),
        obsidianMaterial()
      );
      g.add(body);

      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.005, 0.007),
        new THREE.MeshBasicMaterial({
          color: 0xb9893d,
          transparent: true,
          opacity: 0.08
        })
      );
      strip.position.z = 0.032;
      g.add(strip);

      this.rig.add(g);
      this.strips.push({ strip });
    }
  }

  update(t) {
    this.outerShell.rotation.z += 0.00012;
    this.midShell.rotation.z -= 0.00006;
    this.innerRail.rotation.z += 0.00018;
    this.innerTrace.rotation.z -= 0.00028;

    this.rig.rotation.z = Math.sin(t * 0.07) * 0.0012;
    this.rig.rotation.x = Math.sin(t * 0.06) * 0.0016;

    for (let i = 0; i < this.strips.length; i++) {
      this.strips[i].strip.material.opacity = 0.065 + Math.sin(t * 0.6 + i) * 0.006;
    }
  }
}

class FlareSystem {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.group.position.set(0.18, CFG.rigY + 0.12, CFG.rigZ + 1.02);

    this.center = makeGlowSprite([
      [0.00, 'rgba(255,250,240,0.22)'],
      [0.12, 'rgba(255,236,196,0.07)'],
      [0.30, 'rgba(255,220,160,0.015)'],
      [1.00, 'rgba(255,255,255,0.0)']
    ], 0.34, 0.022, 1024);
    this.group.add(this.center);

    this.horiz = makeAnamorphicFlare(4.4, 0.045, 0.022);
    this.group.add(this.horiz);

    this.ghostA = makeGlowSprite([
      [0.00, 'rgba(255,246,224,0.08)'],
      [0.16, 'rgba(255,220,150,0.02)'],
      [1.00, 'rgba(255,255,255,0.0)']
    ], 0.14, 0.012, 1024);
    this.ghostA.position.set(-0.46, 0.0, -0.03);
    this.group.add(this.ghostA);

    this.ghostB = makeGlowSprite([
      [0.00, 'rgba(255,246,224,0.07)'],
      [0.16, 'rgba(255,220,150,0.018)'],
      [1.00, 'rgba(255,255,255,0.0)']
    ], 0.09, 0.01, 1024);
    this.ghostB.position.set(0.66, 0.0, -0.04);
    this.group.add(this.ghostB);
  }

  update(t) {
    this.center.material.opacity = 0.020 + Math.sin(t * 0.55) * 0.002;
    this.horiz.material.opacity = 0.020 + Math.sin(t * 0.48 + 0.4) * 0.002;
  }
}

class LogoSystem {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.position.set(0, CFG.rigY, CFG.rigZ);
    scene.add(this.group);
    this.root = null;
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
        state.loaded = true;
      },
      undefined,
      () => {
        this.root = new THREE.Mesh(
          new THREE.TorusKnotGeometry(0.98, 0.22, 240, 36, 2, 3),
          polishedGoldMaterial()
        );
        this.group.add(this.root);
        state.loaded = true;
      }
    );
  }

  update(t, p) {
    if (!this.root) return;
    const settle = easeOutQuart(Math.min(p / 0.62, 1));
    this.group.position.y = CFG.rigY + (1 - settle) * 0.10;
    this.root.rotation.y += 0.0018;
    this.root.rotation.x = 0.082 + Math.sin(t * 0.42) * 0.004;
  }
}

const chamber = new ChamberSystem(scene);
const ring = new RingSystem(scene);
const flare = new FlareSystem(scene);
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
  const frustum = 7.8;

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
    state.progress += (1 - state.progress) * 0.038;
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
  flare.update(t);
  logo.update(t, state.progress);

  bloomPass.strength = lerp(CFG.bloomBase, CFG.bloomPeak, state.progress);

  composer.render();
}

window.addEventListener('resize', fitScene);
fitScene();
animate();
