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
  exposure: 1.01,
  bloomMin: 0.08,
  bloomMax: 0.18,
  worldY: 0.10,
  worldZ: -2.55,
  ringRadius: 2.36,
  logoTargetSize: 1.88,
  chamberRadius: 7.2,
  chamberDepth: 12.0,
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

function makeHorizontalFlare(width = 5.0, height = 0.05, opacity = 0.022) {
  const tex = makeCanvasTexture((g, w, h) => {
    const grad = g.createLinearGradient(0, h / 2, w, h / 2);
    grad.addColorStop(0.00, 'rgba(255,255,255,0.0)');
    grad.addColorStop(0.18, 'rgba(255,238,196,0.0)');
    grad.addColorStop(0.50, 'rgba(255,248,232,1.0)');
    grad.addColorStop(0.82, 'rgba(255,238,196,0.0)');
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

function makeVerticalScanSprite(width = 4.8, height = 0.10, opacity = 0.045) {
  const tex = makeCanvasTexture((g, w, h) => {
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0.00, 'rgba(255,255,255,0.0)');
    grad.addColorStop(0.50, 'rgba(255,240,210,0.95)');
    grad.addColorStop(1.00, 'rgba(255,255,255,0.0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
  }, 512);

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
    color: 0x020203,
    metalness: 1.0,
    roughness: 0.05,
    clearcoat: 1.0,
    clearcoatRoughness: 0.008,
    envMapIntensity: 3.0,
  });
}

function darkArmorMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0x06070a,
    metalness: 1.0,
    roughness: 0.09,
    clearcoat: 1.0,
    clearcoatRoughness: 0.014,
    envMapIntensity: 2.4,
  });
}

function goldTraceMaterial(opacity = 0.22) {
  return new THREE.MeshBasicMaterial({
    color: 0xd4a24f,
    transparent: true,
    opacity,
  });
}

function vibrantGoldMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0xe8c86d,
    metalness: 1.0,
    roughness: 0.007,
    clearcoat: 1.0,
    clearcoatRoughness: 0.001,
    envMapIntensity: 17.0,
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
      0.55,
      0.96
    );
    this.composer.addPass(this.bloomPass);

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.03));

    this.key = new THREE.SpotLight(0xffffff, 44, 64, 0.18, 0.88, 1.2);
    this.key.position.set(0.0, 2.2, 5.8);
    this.scene.add(this.key);

    this.fill = new THREE.PointLight(0xf7f9ff, 1.6, 12);
    this.fill.position.set(-1.4, 0.0, 4.8);
    this.scene.add(this.fill);

    this.rim = new THREE.PointLight(0xffffff, 10.2, 20);
    this.rim.position.set(1.4, 1.6, -2.9);
    this.scene.add(this.rim);

    this.goldKick = new THREE.PointLight(0xffe1a0, 1.1, 8);
    this.goldKick.position.set(0, -1.85, 2.4);
    this.scene.add(this.goldKick);

    this.chamber = new Chamber(this.scene);
    this.ring = new MechaRing(this.scene);
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
    const frustum = w < 700 ? 8.8 : 8.1;

    this.camera.left = -frustum * aspect / 2;
    this.camera.right = frustum * aspect / 2;
    this.camera.top = frustum / 2;
    this.camera.bottom = -frustum / 2;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);

    const mobileScale = Math.min(w / 420, h / 920);
    let scale = Math.max(0.76, Math.min(1.0, mobileScale));
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
        color: 0x030303,
        metalness: 0.14,
        roughness: 0.98,
        side: THREE.BackSide,
      })
    );
    this.group.add(this.room);

    this.backPlate = new THREE.Mesh(
      new THREE.CircleGeometry(5.4, 80),
      new THREE.MeshPhysicalMaterial({
        color: 0x050505,
        metalness: 0.26,
        roughness: 0.88,
      })
    );
    this.backPlate.position.set(0, CFG.worldY, CFG.worldZ - 2.35);
    this.group.add(this.backPlate);

    this.backRings = [];
    const ringDefs = [
      { r: 3.26, tube: 0.040, opacity: 0.10, speed: 0.00014 },
      { r: 3.54, tube: 0.028, opacity: 0.08, speed: -0.00010 },
      { r: 3.82, tube: 0.020, opacity: 0.06, speed: 0.00008 },
    ];
    for (const d of ringDefs) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(d.r, d.tube, 16, 180),
        new THREE.MeshBasicMaterial({
          color: 0xcda15a,
          transparent: true,
          opacity: d.opacity,
        })
      );
      ring.position.set(0, CFG.worldY, CFG.worldZ - 2.20);
      ring.userData.speed = d.speed;
      scene.add(ring);
      this.backRings.push(ring);
    }

    this.scanLine = makeVerticalScanSprite(5.0, 0.085, 0.030);
    this.scanLine.position.set(0, CFG.worldY + 1.55, CFG.worldZ + 0.18);
    scene.add(this.scanLine);

    this.atmo = makeRadialSprite([
      [0.00, 'rgba(255,248,232,0.050)'],
      [0.18, 'rgba(255,226,176,0.020)'],
      [0.40, 'rgba(255,205,150,0.008)'],
      [1.00, 'rgba(255,255,255,0.0)']
    ], 9.0, 0.048);
    this.atmo.position.set(0, CFG.worldY, CFG.worldZ - 1.45);
    this.group.add(this.atmo);
  }

  update(t, progress) {
    this.atmo.material.opacity = 0.038 + Math.sin(t * 0.20) * 0.004;

    for (const ring of this.backRings) {
      ring.rotation.z += ring.userData.speed;
    }

    const scanStart = CFG.worldY + 1.58;
    const scanEnd = CFG.worldY - 1.58;
    this.scanLine.position.y = lerp(scanStart, scanEnd, progress);
    this.scanLine.material.opacity = 0.024 + Math.sin(t * 0.8) * 0.003;
  }
}

class MechaRing {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.position.set(0, CFG.worldY, CFG.worldZ);
    scene.add(this.group);

    this.rig = new THREE.Group();
    this.group.add(this.rig);

    this.coreOuter = new THREE.Mesh(
      new THREE.TorusGeometry(CFG.ringRadius, 0.18, 36, 320),
      glossyBlackMaterial()
    );
    this.rig.add(this.coreOuter);

    this.coreMid = new THREE.Mesh(
      new THREE.TorusGeometry(CFG.ringRadius - 0.06, 0.080, 28, 300),
      darkArmorMaterial()
    );
    this.rig.add(this.coreMid);

    this.innerRail = new THREE.Mesh(
      new THREE.TorusGeometry(CFG.ringRadius - 0.24, 0.020, 20, 260),
      glossyBlackMaterial()
    );
    this.rig.add(this.innerRail);

    this.goldTrace = new THREE.Mesh(
      new THREE.TorusGeometry(CFG.ringRadius - 0.270, 0.008, 14, 240),
      goldTraceMaterial(0.26)
    );
    this.rig.add(this.goldTrace);

    this.buildArmor();
    this.buildPanels();
    this.buildVisibleLEDs();
  }

  buildArmor() {
    const geo = new THREE.BoxGeometry(0.46, 0.20, 0.24);
    const pattern = [1.90,1.12,1.44,1.08,1.76,1.10,1.38,1.08,1.64,1.10,1.30,1.08];
    for (let i = 0; i < pattern.length; i++) {
      const a = (i / pattern.length) * Math.PI * 2;
      const seg = new THREE.Mesh(geo, glossyBlackMaterial());
      seg.position.set(
        Math.cos(a) * (CFG.ringRadius + 0.12),
        Math.sin(a) * (CFG.ringRadius + 0.12),
        0.12
      );
      seg.rotation.z = a;
      seg.scale.y = pattern[i];
      seg.scale.x = i % 3 === 0 ? 1.24 : 1.0;
      this.rig.add(seg);

      const cap = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.06, 0.02),
        goldTraceMaterial(0.16)
      );
      cap.position.z = 0.13;
      seg.add(cap);
    }
  }

  buildPanels() {
    const geo = new THREE.BoxGeometry(0.26, 0.09, 0.14);
    const angles = [0.22, 0.62, 1.18, 1.86, 2.42, 3.02, 3.48, 4.06, 4.76, 5.34, 5.92];
    this.strips = [];
    for (const a of angles) {
      const g = new THREE.Group();
      g.position.set(
        Math.cos(a) * (CFG.ringRadius + 0.03),
        Math.sin(a) * (CFG.ringRadius + 0.03),
        0.12
      );
      g.rotation.z = a;

      const body = new THREE.Mesh(geo, darkArmorMaterial());
      g.add(body);

      const slit = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.012, 0.012),
        goldTraceMaterial(0.22)
      );
      slit.position.z = 0.078;
      g.add(slit);

      this.rig.add(g);
      this.strips.push(slit);
    }
  }

  buildVisibleLEDs() {
    this.visibleLedCount = 56;
    this.visibleLeds = [];

    const housingGeo = new THREE.BoxGeometry(0.090, 0.030, 0.022);
    const emitterGeo = new THREE.BoxGeometry(0.068, 0.020, 0.014);

    for (let i = 0; i < this.visibleLedCount; i++) {
      const a = Math.PI / 2 - (i / this.visibleLedCount) * Math.PI * 2;
      const radius = CFG.ringRadius - 0.20;

      const body = new THREE.Mesh(
        housingGeo,
        new THREE.MeshPhysicalMaterial({
          color: 0x0a0b0d,
          metalness: 1.0,
          roughness: 0.08,
          clearcoat: 1.0,
          clearcoatRoughness: 0.012,
          envMapIntensity: 2.4,
        })
      );
      body.position.set(
        Math.cos(a) * radius,
        Math.sin(a) * radius,
        0.245
      );
      body.rotation.z = a;
      this.rig.add(body);

      const emitter = new THREE.Mesh(
        emitterGeo,
        new THREE.MeshBasicMaterial({
          color: 0xffd88c,
          transparent: true,
          opacity: 0.10,
        })
      );
      emitter.position.set(
        Math.cos(a) * radius,
        Math.sin(a) * radius,
        0.262
      );
      emitter.rotation.z = a;
      this.rig.add(emitter);

      const glow = makeRadialSprite([
        [0.00, 'rgba(255,244,210,0.95)'],
        [0.10, 'rgba(255,214,140,0.48)'],
        [0.24, 'rgba(255,170,70,0.16)'],
        [1.00, 'rgba(255,255,255,0.0)']
      ], 0.20, 0.04, 512);
      glow.position.set(
        Math.cos(a) * radius,
        Math.sin(a) * radius,
        0.278
      );
      this.rig.add(glow);

      this.visibleLeds.push({ body, emitter, glow });
    }
  }

  update(t, progress = 0) {
    this.coreOuter.rotation.z += 0.00022;
    this.coreMid.rotation.z -= 0.00008;
    this.innerRail.rotation.z += 0.00020;
    this.goldTrace.rotation.z -= 0.00034;

    this.rig.rotation.z = Math.sin(t * 0.08) * 0.0020;
    this.rig.rotation.x = Math.sin(t * 0.06) * 0.0028;

    for (let i = 0; i < this.strips.length; i++) {
      this.strips[i].material.opacity = 0.18 + Math.sin(t * 0.8 + i) * 0.018;
    }

    const p = clamp(progress, 0, 1);
    const front = p * this.visibleLedCount;
    const litCount = Math.floor(front);
    const frac = front - litCount;

    for (let i = 0; i < this.visibleLedCount; i++) {
      let level = 0;
      if (i < litCount) level = 1;
      else if (i === litCount) level = frac;

      this.visibleLeds[i].body.material.color.setRGB(
        0.08 + level * 0.46,
        0.06 + level * 0.24,
        0.04 + level * 0.08
      );

      this.visibleLeds[i].emitter.material.opacity = 0.10 + level * 0.90;
      this.visibleLeds[i].emitter.material.color.setRGB(
        1.0,
        0.86 + level * 0.10,
        0.46 + level * 0.08
      );

      this.visibleLeds[i].glow.material.opacity = 0.02 + level * 0.22;
      const s = 0.14 + level * 0.12;
      this.visibleLeds[i].glow.scale.set(s, s, 1);
    }
  }
}

class Flare {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.position.set(0.22, CFG.worldY + 0.10, CFG.worldZ + 1.15);
    scene.add(this.group);

    this.center = makeRadialSprite([
      [0.00, 'rgba(255,250,240,0.22)'],
      [0.12, 'rgba(255,236,196,0.07)'],
      [0.30, 'rgba(255,220,160,0.015)'],
      [1.00, 'rgba(255,255,255,0.0)']
    ], 0.42, 0.022);
    this.group.add(this.center);

    this.horiz = makeHorizontalFlare(4.8, 0.050, 0.022);
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
    this.root.rotation.y += 0.0020;
    this.root.rotation.x = 0.086 + Math.sin(t * 0.44) * 0.005;
  }
}

new Runtime();
