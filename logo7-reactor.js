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
  exposure: 1.03,
  bloomMin: 0.09,
  bloomMax: 0.18,
  worldY: 0.08,
  worldZ: -2.70,
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

function makeHorizontalFlare(width = 4.8, height = 0.05, opacity = 0.024) {
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
    roughness: 0.032,
    clearcoat: 1.0,
    clearcoatRoughness: 0.004,
    envMapIntensity: 4.2,
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
    envMapIntensity: 3.2,
    reflectivity: 1.0,
  });
}

function goldTraceMaterial(opacity = 0.16) {
  return new THREE.MeshBasicMaterial({
    color: 0xd09a4a,
    transparent: true,
    opacity,
  });
}

function vibrantGoldMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0xe8c86f,
    metalness: 1.0,
    roughness: 0.006,
    clearcoat: 1.0,
    clearcoatRoughness: 0.001,
    envMapIntensity: 18.0,
    reflectivity: 1.0,
  });
}

class Runtime {
  constructor() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: els.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = CFG.exposure;
    this.renderer.setPixelRatio(CFG.dpr);
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    this.camera = new THREE.OrthographicCamera(-4, 4, 4, -4, 0.1, 100);
    this.camera.position.set(0, 0, 10);
    this.camera.lookAt(0, CFG.worldY, CFG.worldZ);

    this.pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = this.pmrem.fromScene(new RoomEnvironment(this.renderer), 0.03).texture;

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      CFG.bloomMin,
      0.50,
      0.96
    );
    this.composer.addPass(this.bloomPass);

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.028));

    this.key = new THREE.SpotLight(0xffffff, 46, 64, 0.18, 0.88, 1.2);
    this.key.position.set(0.0, 2.25, 5.9);
    this.scene.add(this.key);

    this.fill = new THREE.PointLight(0xf6f8ff, 1.5, 12);
    this.fill.position.set(-1.45, 0.0, 4.9);
    this.scene.add(this.fill);

    this.rim = new THREE.PointLight(0xffffff, 11.2, 20);
    this.rim.position.set(1.5, 1.7, -3.0);
    this.scene.add(this.rim);

    this.goldKick = new THREE.PointLight(0xffdf9c, 1.15, 8);
    this.goldKick.position.set(0, -1.9, 2.5);
    this.scene.add(this.goldKick);

    this.chamber = new Chamber(this.scene);
    this.ring = new AlienRing(this.scene);
    this.logo = new Logo(this.scene);
    this.flare = new Flare(this.scene);

    this.onResize = this.resize.bind(this);
    window.addEventListener('resize', this.onResize);

    els.initBtn?.addEventListener('click', () => {
      if (!STATE.ready || STATE.entered) return;
      STATE.entered = true;
      els.preloader?.classList.add('hidden');
      els.shell?.classList.add('live');
    });

    this.resize();
    this.tick();
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const aspect = w / h;
    const frustum = w < 700 ? 8.9 : 8.2;

    this.camera.left = -frustum * aspect / 2;
    this.camera.right = frustum * aspect / 2;
    this.camera.top = frustum / 2;
    this.camera.bottom = -frustum / 2;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);

    const mobileScale = Math.min(w / 420, h / 920);
    let scale = Math.max(0.75, Math.min(1.0, mobileScale));
    if (aspect < 0.62) scale *= 0.92;

    this.ring.group.scale.setScalar(scale);
    this.logo.group.scale.setScalar(scale);
  }

  updateProgress() {
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

  tick() {
    requestAnimationFrame(() => this.tick());

    const t = performance.now() * 0.001;

    this.updateProgress();
    this.chamber.update(t, STATE.progress);
    this.ring.update(t, STATE.progress);
    this.logo.update(t, STATE.progress);
    this.flare.update(t);

    this.bloomPass.strength = lerp(CFG.bloomMin, CFG.bloomMax, STATE.progress);
    this.composer.render();
  }
}

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
      new THREE.CircleGeometry(5.8, 96),
      new THREE.MeshPhysicalMaterial({
        color: 0x040405,
        metalness: 0.34,
        roughness: 0.84,
      })
    );
    this.backPlate.position.set(0, CFG.worldY, CFG.worldZ - 2.52);
    this.group.add(this.backPlate);

    this.backHaloA = new THREE.Mesh(
      new THREE.TorusGeometry(3.30, 0.06, 18, 180),
      goldTraceMaterial(0.08)
    );
    this.backHaloA.position.set(0, CFG.worldY, CFG.worldZ - 2.34);
    this.group.add(this.backHaloA);

    this.backHaloB = new THREE.Mesh(
      new THREE.TorusGeometry(3.68, 0.028, 18, 180),
      goldTraceMaterial(0.05)
    );
    this.backHaloB.position.set(0, CFG.worldY, CFG.worldZ - 2.30);
    this.group.add(this.backHaloB);

    this.atmo = makeRadialSprite([
      [0.00, 'rgba(255,246,230,0.030)'],
      [0.18, 'rgba(255,220,170,0.012)'],
      [0.40, 'rgba(255,190,140,0.004)'],
      [1.00, 'rgba(255,255,255,0.0)']
    ], 9.4, 0.030);
    this.atmo.position.set(0, CFG.worldY, CFG.worldZ - 1.52);
    this.group.add(this.atmo);
  }

  update(t) {
    this.atmo.material.opacity = 0.026 + Math.sin(t * 0.20) * 0.002;
    this.backHaloA.rotation.z += 0.00008;
    this.backHaloB.rotation.z -= 0.00005;
  }
}

class AlienRing {
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
      new THREE.TorusGeometry(CFG.ringRadius - 0.09, 0.115, 36, 300),
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
      goldTraceMaterial(0.12)
    );
    this.rig.add(this.energyTrace);

    this.buildRobustLEDs();
  }

  buildRobustLEDs() {
    this.ledCount = 44;
    this.leds = [];

    const housingGeo = new THREE.CapsuleGeometry(0.060, 0.055, 6, 10);
    const emitterGeo = new THREE.CapsuleGeometry(0.040, 0.034, 6, 10);

    for (let i = 0; i < this.ledCount; i++) {
      const a = Math.PI / 2 - (i / this.ledCount) * Math.PI * 2;
      const radius = CFG.ringRadius - 0.18;

      const housing = new THREE.Mesh(
        housingGeo,
        new THREE.MeshPhysicalMaterial({
          color: 0x0a0b0d,
          metalness: 1.0,
          roughness: 0.05,
          clearcoat: 1.0,
          clearcoatRoughness: 0.006,
          envMapIntensity: 2.6,
        })
      );
      housing.position.set(
        Math.cos(a) * radius,
        Math.sin(a) * radius,
        0.28
      );
      housing.rotation.z = a + Math.PI / 2;
      this.rig.add(housing);

      const emitter = new THREE.Mesh(
        emitterGeo,
        new THREE.MeshBasicMaterial({
          color: 0xffd68b,
          transparent: true,
          opacity: 0.10,
        })
      );
      emitter.position.set(
        Math.cos(a) * radius,
        Math.sin(a) * radius,
        0.302
      );
      emitter.rotation.z = a + Math.PI / 2;
      this.rig.add(emitter);

      const glow = makeRadialSprite([
        [0.00, 'rgba(255,240,210,0.95)'],
        [0.10, 'rgba(255,208,150,0.45)'],
        [0.28, 'rgba(255,120,170,0.18)'],
        [1.00, 'rgba(255,255,255,0.0)']
      ], 0.24, 0.02, 512);
      glow.position.set(
        Math.cos(a) * radius,
        Math.sin(a) * radius,
        0.322
      );
      this.rig.add(glow);

      this.leds.push({ housing, emitter, glow, angle: a, index: i });
    }
  }

  update(t, progress = 0) {
    this.outerHull.rotation.z += 0.00012;
    this.innerHull.rotation.z -= 0.00005;
    this.innerVoid.rotation.z += 0.00008;
    this.energyTrace.rotation.z -= 0.00018;

    this.rig.rotation.z = Math.sin(t * 0.06) * 0.0012;
    this.rig.rotation.x = Math.sin(t * 0.05) * 0.0018;

    const p = clamp(progress, 0, 1);
    const front = p * this.ledCount;
    const litCount = Math.floor(front);
    const frac = front - litCount;

    for (let i = 0; i < this.ledCount; i++) {
      let level = 0;
      if (i < litCount) level = 1;
      else if (i === litCount) level = frac;

      const cyc = (i / this.ledCount + t * 0.025) % 1;
      const gold = new THREE.Color(0xe4b95d);
      const pink = new THREE.Color(0xd25ca8);
      const mix = 0.5 + 0.5 * Math.sin(cyc * Math.PI * 2.0);
      const c = gold.clone().lerp(pink, mix);

      this.leds[i].housing.material.color.setRGB(
        0.08 + level * 0.30 + c.r * 0.05,
        0.06 + level * 0.16 + c.g * 0.02,
        0.08 + level * 0.12 + c.b * 0.04
      );

      this.leds[i].emitter.material.color.copy(c);
      this.leds[i].emitter.material.opacity = 0.08 + level * 0.92;

      this.leds[i].glow.material.opacity = 0.015 + level * 0.20;
      const s = 0.14 + level * 0.12;
      this.leds[i].glow.scale.set(s, s, 1);
    }
  }
}

class Flare {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.position.set(0.22, CFG.worldY + 0.10, CFG.worldZ + 1.18);
    scene.add(this.group);

    this.center = makeRadialSprite([
      [0.00, 'rgba(255,250,240,0.22)'],
      [0.12, 'rgba(255,236,196,0.07)'],
      [0.30, 'rgba(255,220,160,0.014)'],
      [1.00, 'rgba(255,255,255,0.0)']
    ], 0.42, 0.022);
    this.group.add(this.center);

    this.horiz = makeHorizontalFlare(4.9, 0.05, 0.022);
    this.group.add(this.horiz);
  }

  update(t) {
    this.center.material.opacity = 0.022 + Math.sin(t * 0.55) * 0.002;
    this.horiz.material.opacity = 0.022 + Math.sin(t * 0.46 + 0.4) * 0.002;
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
      obj.material = vibrantGoldMaterial();
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
          vibrantGoldMaterial()
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
    this.root.rotation.y += 0.0019;
    this.root.rotation.x = 0.088 + Math.sin(t * 0.42) * 0.004;
  }
}

new Runtime();
