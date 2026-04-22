import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const els = {
  canvas: document.getElementById('bg3d'),
  preloader: document.getElementById('preloader'),
  initBtn: document.getElementById('initBtn'),
  preloadPercent: document.getElementById('preloadPercent'),
  preloadFill: document.getElementById('preloadFill'),
  shell: document.getElementById('shell'),
};

if (!els.canvas) throw new Error('Missing #bg3d');

const CFG = {
  preloadMs: 10000,
  dpr: Math.min(window.devicePixelRatio || 1, 2),
  exposure: 1.0,
  bloomMin: 0.07,
  bloomMax: 0.14,
  worldY: 0.08,
  worldZ: -2.72,
  ringRadius: 2.44,
  logoTargetSize: 1.90,
  chamberRadius: 7.7,
  chamberDepth: 12.8,
};

const STATE = {
  startedAt: performance.now(),
  progress: 0,
  loaded: false,
  ready: false,
  entered: false,
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

function makeRadialSprite(stops, size, opacity, texSize = 1024) {
  const tex = makeCanvasTexture((g, w, h) => {
    const grad = g.createRadialGradient(w / 2, h / 2, 1, w / 2, h / 2, w / 2);
    for (const [o, c] of stops) grad.addColorStop(o, c);
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
  }, texSize);

  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    opacity,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  });

  const s = new THREE.Sprite(mat);
  s.scale.set(size, size, 1);
  return s;
}

function makeHorizontalFlare(width = 4.8, height = 0.05, opacity = 0.018) {
  const tex = makeCanvasTexture((g, w, h) => {
    const grad = g.createLinearGradient(0, h / 2, w, h / 2);
    grad.addColorStop(0.00, 'rgba(255,255,255,0.0)');
    grad.addColorStop(0.20, 'rgba(255,230,200,0.0)');
    grad.addColorStop(0.50, 'rgba(255,248,236,1.0)');
    grad.addColorStop(0.80, 'rgba(255,230,200,0.0)');
    grad.addColorStop(1.00, 'rgba(255,255,255,0.0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
  }, 1024);

  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    opacity,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  });

  const s = new THREE.Sprite(mat);
  s.scale.set(width, height, 1);
  return s;
}

function glossyBlackMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0x010102,
    metalness: 1.0,
    roughness: 0.030,
    clearcoat: 1.0,
    clearcoatRoughness: 0.004,
    envMapIntensity: 4.8,
    reflectivity: 1.0,
  });
}

function glossyBlackSecondaryMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0x05060a,
    metalness: 1.0,
    roughness: 0.055,
    clearcoat: 1.0,
    clearcoatRoughness: 0.008,
    envMapIntensity: 3.4,
    reflectivity: 1.0,
  });
}

function goldTraceMaterial(opacity = 0.10) {
  return new THREE.MeshBasicMaterial({
    color: 0xc58e42,
    transparent: true,
    opacity,
  });
}

function darkGoldMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0x7f5a16,
    metalness: 1.0,
    roughness: 0.010,
    clearcoat: 1.0,
    clearcoatRoughness: 0.0008,
    envMapIntensity: 26.0,
    reflectivity: 1.0,
  });
}

const renderer = new THREE.WebGLRenderer({
  canvas: els.canvas,
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance',
});
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = CFG.exposure;
renderer.setPixelRatio(CFG.dpr);
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.OrthographicCamera(-4, 4, 4, -4, 0.1, 100);
camera.position.set(0, 0, 10);
camera.lookAt(0, CFG.worldY, CFG.worldZ);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.025).texture;

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  CFG.bloomMin,
  0.45,
  0.97
);
composer.addPass(bloomPass);

scene.add(new THREE.AmbientLight(0xffffff, 0.022));

const key = new THREE.SpotLight(0xffffff, 58, 66, 0.16, 0.9, 1.26);
key.position.set(0.0, 2.3, 5.9);
scene.add(key);

const fill = new THREE.PointLight(0xf6f8ff, 1.25, 12);
fill.position.set(-1.48, -0.02, 4.95);
scene.add(fill);

const rim = new THREE.PointLight(0xffffff, 13.2, 20);
rim.position.set(1.56, 1.78, -3.05);
scene.add(rim);

const kick = new THREE.PointLight(0xffdfa2, 0.95, 8);
kick.position.set(0, -1.95, 2.55);
scene.add(kick);

class Chamber {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);

    this.room = new THREE.Mesh(
      new THREE.CylinderGeometry(CFG.chamberRadius, CFG.chamberRadius, CFG.chamberDepth, 96, 1, true),
      new THREE.MeshPhysicalMaterial({
        color: 0x010101,
        metalness: 0.18,
        roughness: 0.985,
        side: THREE.BackSide,
      })
    );
    this.group.add(this.room);

    this.backPlate = new THREE.Mesh(
      new THREE.CircleGeometry(5.9, 96),
      new THREE.MeshPhysicalMaterial({
        color: 0x030304,
        metalness: 0.36,
        roughness: 0.84,
      })
    );
    this.backPlate.position.set(0, CFG.worldY, CFG.worldZ - 2.58);
    this.group.add(this.backPlate);

    this.backHalo = new THREE.Mesh(
      new THREE.TorusGeometry(3.34, 0.05, 16, 180),
      goldTraceMaterial(0.06)
    );
    this.backHalo.position.set(0, CFG.worldY, CFG.worldZ - 2.40);
    this.group.add(this.backHalo);

    this.atmo = makeRadialSprite([
      [0.00, 'rgba(255,244,225,0.024)'],
      [0.18, 'rgba(255,214,160,0.010)'],
      [0.40, 'rgba(255,180,130,0.003)'],
      [1.00, 'rgba(255,255,255,0.0)']
    ], 9.4, 0.024);
    this.atmo.position.set(0, CFG.worldY, CFG.worldZ - 1.55);
    this.group.add(this.atmo);
  }

  update(t) {
    this.atmo.material.opacity = 0.021 + Math.sin(t * 0.20) * 0.0015;
    this.backHalo.rotation.z += 0.00006;
  }
}

class Ring {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.position.set(0, CFG.worldY, CFG.worldZ);
    scene.add(this.group);

    this.rig = new THREE.Group();
    this.group.add(this.rig);

    this.outerHull = new THREE.Mesh(
      new THREE.TorusGeometry(CFG.ringRadius, 0.25, 48, 340),
      glossyBlackMaterial()
    );
    this.rig.add(this.outerHull);

    this.innerHull = new THREE.Mesh(
      new THREE.TorusGeometry(CFG.ringRadius - 0.09, 0.11, 36, 300),
      glossyBlackSecondaryMaterial()
    );
    this.rig.add(this.innerHull);

    this.innerVoid = new THREE.Mesh(
      new THREE.TorusGeometry(CFG.ringRadius - 0.30, 0.030, 20, 240),
      glossyBlackMaterial()
    );
    this.rig.add(this.innerVoid);

    this.energyTrace = new THREE.Mesh(
      new THREE.TorusGeometry(CFG.ringRadius - 0.340, 0.010, 16, 220),
      goldTraceMaterial(0.08)
    );
    this.rig.add(this.energyTrace);

    this.buildLensLEDs();
  }

  buildLensLEDs() {
    this.ledCount = 24;
    this.leds = [];

    for (let i = 0; i < this.ledCount; i++) {
      const a = Math.PI / 2 - (i / this.ledCount) * Math.PI * 2;
      const radius = CFG.ringRadius - 0.18;

      const socket = new THREE.Mesh(
        new THREE.CylinderGeometry(0.072, 0.072, 0.030, 24),
        new THREE.MeshPhysicalMaterial({
          color: 0x090a0c,
          metalness: 1.0,
          roughness: 0.045,
          clearcoat: 1.0,
          clearcoatRoughness: 0.006,
          envMapIntensity: 3.0,
        })
      );
      socket.rotation.x = Math.PI / 2;
      socket.position.set(
        Math.cos(a) * radius,
        Math.sin(a) * radius,
        0.268
      );
      this.rig.add(socket);

      const lens = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.045, 0.014, 24),
        new THREE.MeshPhysicalMaterial({
          color: 0x20140d,
          emissive: 0x000000,
          metalness: 0.0,
          roughness: 0.05,
          transmission: 0.0,
          clearcoat: 1.0,
          clearcoatRoughness: 0.002,
          ior: 1.45
        })
      );
      lens.rotation.x = Math.PI / 2;
      lens.position.set(
        Math.cos(a) * radius,
        Math.sin(a) * radius,
        0.286
      );
      this.rig.add(lens);

      const core = new THREE.Mesh(
        new THREE.CylinderGeometry(0.022, 0.022, 0.008, 20),
        new THREE.MeshBasicMaterial({
          color: 0xffc97b,
          transparent: true,
          opacity: 0.08,
        })
      );
      core.rotation.x = Math.PI / 2;
      core.position.set(
        Math.cos(a) * radius,
        Math.sin(a) * radius,
        0.298
      );
      this.rig.add(core);

      const glow = makeRadialSprite([
        [0.00, 'rgba(255,244,210,0.95)'],
        [0.12, 'rgba(255,214,140,0.42)'],
        [0.30, 'rgba(255,110,165,0.16)'],
        [1.00, 'rgba(255,255,255,0.0)']
      ], 0.16, 0.010, 512);
      glow.position.set(
        Math.cos(a) * radius,
        Math.sin(a) * radius,
        0.312
      );
      this.rig.add(glow);

      this.leds.push({ socket, lens, core, glow, angle: a });
    }
  }

  update(t, progress = 0) {
    this.outerHull.rotation.z += 0.00010;
    this.innerHull.rotation.z -= 0.00004;
    this.innerVoid.rotation.z += 0.00007;
    this.energyTrace.rotation.z -= 0.00015;

    this.rig.rotation.z = Math.sin(t * 0.05) * 0.0010;
    this.rig.rotation.x = Math.sin(t * 0.045) * 0.0015;

    const p = clamp(progress, 0, 1);
    const front = p * this.ledCount;
    const litCount = Math.floor(front);
    const frac = front - litCount;

    for (let i = 0; i < this.ledCount; i++) {
      let level = 0;
      if (i < litCount) level = 1;
      else if (i === litCount) level = frac;

      const cyc = (i / this.ledCount + t * 0.018) % 1;
      const gold = new THREE.Color(0xe0b45a);
      const pink = new THREE.Color(0xce5fa4);
      const mix = 0.5 + 0.5 * Math.sin(cyc * Math.PI * 2.0);
      const c = gold.clone().lerp(pink, mix);

      this.leds[i].core.material.color.copy(c);
      this.leds[i].core.material.opacity = 0.08 + level * 0.92;

      this.leds[i].glow.material.opacity = 0.010 + level * 0.18;
      const gs = 0.08 + level * 0.10;
      this.leds[i].glow.scale.set(gs, gs, 1);

      this.leds[i].lens.material.color.setRGB(
        0.06 + c.r * 0.10,
        0.04 + c.g * 0.04,
        0.05 + c.b * 0.08
      );
      this.leds[i].lens.material.emissive.setRGB(
        c.r * level * 0.26,
        c.g * level * 0.10,
        c.b * level * 0.20
      );
    }
  }
}

class Flare {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.position.set(0.18, CFG.worldY + 0.10, CFG.worldZ + 1.18);
    scene.add(this.group);

    this.center = makeRadialSprite([
      [0.00, 'rgba(255,250,240,0.18)'],
      [0.12, 'rgba(255,236,196,0.05)'],
      [0.30, 'rgba(255,220,160,0.010)'],
      [1.00, 'rgba(255,255,255,0.0)']
    ], 0.40, 0.016);
    this.group.add(this.center);

    this.horiz = makeHorizontalFlare(4.8, 0.05, 0.018);
    this.group.add(this.horiz);
  }

  update(t) {
    this.center.material.opacity = 0.016 + Math.sin(t * 0.55) * 0.0015;
    this.horiz.material.opacity = 0.018 + Math.sin(t * 0.46 + 0.4) * 0.0015;
  }
}

class Logo {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.position.set(0, CFG.worldY, CFG.worldZ);
    scene.add(this.group);
    this.root = null;
    this.load();
  }

  applyMaterial(root) {
    root.traverse((obj) => {
      if (!obj.isMesh) return;
      obj.material = darkGoldMaterial();
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
    root.scale.setScalar(CFG.logoTargetSize / maxDim);
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
        STATE.loaded = true;
      },
      undefined,
      () => {
        this.root = new THREE.Mesh(
          new THREE.TorusKnotGeometry(0.98, 0.22, 240, 36, 2, 3),
          darkGoldMaterial()
        );
        this.group.add(this.root);
        STATE.loaded = true;
      }
    );
  }

  update(t, p) {
    if (!this.root) return;
    const settle = easeOutQuart(Math.min(p / 0.62, 1));
    this.group.position.y = CFG.worldY + (1 - settle) * 0.12;
    this.root.rotation.y += 0.0018;
    this.root.rotation.x = 0.085 + Math.sin(t * 0.40) * 0.0035;
  }
}

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const aspect = w / h;
  const frustum = w < 700 ? 8.9 : 8.2;

  camera.left = -frustum * aspect / 2;
  camera.right = frustum * aspect / 2;
  camera.top = frustum / 2;
  camera.bottom = -frustum / 2;
  camera.updateProjectionMatrix();

  renderer.setSize(w, h);
  composer.setSize(w, h);

  const mobileScale = Math.min(w / 420, h / 920);
  let scale = Math.max(0.75, Math.min(1.0, mobileScale));
  if (aspect < 0.62) scale *= 0.92;

  ring.group.scale.setScalar(scale);
  logo.group.scale.setScalar(scale);
}

const chamber = new Chamber(scene);
const ring = new Ring(scene);
const logo = new Logo(scene);
const flare = new Flare(scene);

window.addEventListener('resize', resize);

els.initBtn?.addEventListener('click', () => {
  if (!STATE.ready || STATE.entered) return;
  STATE.entered = true;
  els.preloader?.classList.add('hidden');
  els.shell?.classList.add('live');
});

function updateProgress() {
  const elapsed = performance.now() - STATE.startedAt;
  const target = clamp(elapsed / CFG.preloadMs, 0, 1);

  if (!STATE.loaded) {
    STATE.progress += (Math.min(target, 0.92) - STATE.progress) * 0.022;
  } else {
    STATE.progress += (1 - STATE.progress) * 0.026;
  }

  if (STATE.loaded && elapsed < CFG.preloadMs) {
    STATE.progress = Math.min(STATE.progress, 0.995);
  }

  if (STATE.loaded && elapsed >= CFG.preloadMs && !STATE.ready) {
    STATE.progress = 1;
    STATE.ready = true;
    els.initBtn?.classList.add('ready');
  }

  const pct = String(Math.round(STATE.progress * 100)).padStart(3, '0');
  if (els.preloadPercent) els.preloadPercent.textContent = `${pct}%`;
  if (els.preloadFill) els.preloadFill.style.width = `${STATE.progress * 100}%`;
}

function tick() {
  requestAnimationFrame(tick);

  const t = performance.now() * 0.001;

  updateProgress();
  chamber.update(t, STATE.progress);
  ring.update(t, STATE.progress);
  logo.update(t, STATE.progress);
  flare.update(t);

  bloomPass.strength = lerp(CFG.bloomMin, CFG.bloomMax, STATE.progress);
  composer.render();
}

resize();
tick();
