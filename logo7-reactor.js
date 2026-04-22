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
  bloomMax: 0.16,
  worldY: 0.08,
  worldZ: -2.65,
  ringRadius: 2.42,
  logoTargetSize: 1.88,
  chamberRadius: 7.6,
  chamberDepth: 12.5,
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

function makeHorizontalFlare(width = 4.8, height = 0.05, opacity = 0.02) {
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

function glossyBlackMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0x010102,
    metalness: 1.0,
    roughness: 0.045,
    clearcoat: 1.0,
    clearcoatRoughness: 0.008,
    envMapIntensity: 3.4,
  });
}

function denseBlackMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0x05060a,
    metalness: 1.0,
    roughness: 0.11,
    clearcoat: 1.0,
    clearcoatRoughness: 0.018,
    envMapIntensity: 2.4,
  });
}

function goldTraceMaterial(opacity = 0.18) {
  return new THREE.MeshBasicMaterial({
    color: 0xcf9d4f,
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
      0.52,
      0.96
    );
    this.composer.addPass(this.bloomPass);

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.028));

    this.key = new THREE.SpotLight(0xffffff, 42, 64, 0.18, 0.88, 1.2);
    this.key.position.set(0.0, 2.2, 5.8);
    this.scene.add(this.key);

    this.fill = new THREE.PointLight(0xf7f9ff, 1.45, 12);
    this.fill.position.set(-1.4, 0.0, 4.8);
    this.scene.add(this.fill);

    this.rim = new THREE.PointLight(0xffffff, 10.4, 20);
    this.rim.position.set(1.4, 1.65, -2.9);
    this.scene.add(this.rim);

    this.goldKick = new THREE.PointLight(0xffe1a0, 1.0, 8);
    this.goldKick.position.set(0, -1.85, 2.4);
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
        color: 0x020202,
        metalness: 0.14,
        roughness: 0.985,
        side: THREE.BackSide,
      })
    );
    this.group.add(this.room);

    this.backPlate = new THREE.Mesh(
      new THREE.CircleGeometry(5.6, 88),
      new THREE.MeshPhysicalMaterial({
        color: 0x040405,
        metalness: 0.28,
        roughness: 0.86,
      })
    );
    this.backPlate.position.set(0, CFG.worldY, CFG.worldZ - 2.45);
    this.group.add(this.backPlate);

    this.backHaloA = new THREE.Mesh(
      new THREE.TorusGeometry(3.25, 0.06, 18, 180),
      goldTraceMaterial(0.08)
    );
    this.backHaloA.position.set(0, CFG.worldY, CFG.worldZ - 2.30);
    this.group.add(this.backHaloA);

    this.backHaloB = new THREE.Mesh(
      new THREE.TorusGeometry(3.62, 0.03, 18, 180),
      goldTraceMaterial(0.05)
    );
    this.backHaloB.position.set(0, CFG.worldY, CFG.worldZ - 2.26);
    this.group.add(this.backHaloB);

    this.atmo = makeRadialSprite([
      [0.00, 'rgba(255,248,232,0.040)'],
      [0.18, 'rgba(255,226,176,0.016)'],
      [0.40, 'rgba(255,205,150,0.006)'],
      [1.00, 'rgba(255,255,255,0.0)']
    ], 9.2, 0.040);
    this.atmo.position.set(0, CFG.worldY, CFG.worldZ - 1.46);
    this.group.add(this.atmo);
  }

  update(t) {
    this.atmo.material.opacity = 0.032 + Math.sin(t * 0.20) * 0.003;
    this.backHaloA.rotation.z += 0.00010;
    this.backHaloB.rotation.z -= 0.00006;
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
      new THREE.TorusGeometry(CFG.ringRadius, 0.24, 42, 320),
      glossyBlackMaterial()
    );
    this.rig.add(this.outerHull);

    this.innerHull = new THREE.Mesh(
      new THREE.TorusGeometry(CFG.ringRadius - 0.08, 0.11, 32, 280),
      denseBlackMaterial()
    );
    this.rig.add(this.innerHull);

    this.voidRail = new THREE.Mesh(
      new THREE.TorusGeometry(CFG.ringRadius - 0.30, 0.028, 20, 240),
      glossyBlackMaterial()
    );
    this.rig.add(this.voidRail);

    this.fissureTrace = new THREE.Mesh(
      new THREE.TorusGeometry(CFG.ringRadius - 0.335, 0.009, 14, 220),
      goldTraceMaterial(0.14)
    );
    this.rig.add(this.fissureTrace);

    this.buildOuterCarapace();
    this.buildInnerSpines();
    this.buildAlienSockets();
    this.buildEnergyNodes();
  }

  buildOuterCarapace() {
    const segments = 10;
    const geo = new THREE.BoxGeometry(0.62, 0.26, 0.34);
    const patterns = [1.6, 1.14, 1.42, 1.08, 1.52, 1.12, 1.36, 1.08, 1.44, 1.10];

    for (let i = 0; i < segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      const shell = new THREE.Mesh(geo, glossyBlackMaterial());
      shell.position.set(
        Math.cos(a) * (CFG.ringRadius + 0.16),
        Math.sin(a) * (CFG.ringRadius + 0.16),
        0.18
      );
      shell.rotation.z = a;
      shell.scale.y = patterns[i];
      shell.scale.x = i % 2 === 0 ? 1.18 : 1.0;
      this.rig.add(shell);

      const slot = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.028, 0.018),
        goldTraceMaterial(0.16)
      );
      slot.position.z = 0.18;
      shell.add(slot);

      const tooth = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.28, 0.08),
        denseBlackMaterial()
      );
      tooth.position.set(0, 0.28, 0.03);
      shell.add(tooth);
    }
  }

  buildInnerSpines() {
    this.spines = [];
    const geo = new THREE.BoxGeometry(0.08, 0.84, 0.07);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const spine = new THREE.Mesh(geo, denseBlackMaterial());
      spine.rotation.z = a;
      spine.position.z = -0.04;
      this.rig.add(spine);
      this.spines.push(spine);
    }
  }

  buildAlienSockets() {
    this.socketGroups = [];
    const count = 28;
    for (let i = 0; i < count; i++) {
      const a = Math.PI / 2 - (i / count) * Math.PI * 2;
      const g = new THREE.Group();
      const radius = CFG.ringRadius - 0.19;

      g.position.set(
        Math.cos(a) * radius,
        Math.sin(a) * radius,
        0.22
      );
      g.rotation.z = a;

      const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.05, 0.04),
        glossyBlackMaterial()
      );
      g.add(body);

      const recess = new THREE.Mesh(
        new THREE.BoxGeometry(0.07, 0.018, 0.018),
        new THREE.MeshBasicMaterial({
          color: 0xffd489,
          transparent: true,
          opacity: 0.08,
        })
      );
      recess.position.z = 0.024;
      g.add(recess);

      const halo = makeRadialSprite([
        [0.00, 'rgba(255,244,210,0.95)'],
        [0.10, 'rgba(255,214,140,0.42)'],
        [0.24, 'rgba(255,170,70,0.12)'],
        [1.00, 'rgba(255,255,255,0.0)']
      ], 0.18, 0.02, 512);
      halo.position.set(0, 0, 0.03);
      g.add(halo);

      this.rig.add(g);
      this.socketGroups.push({ body, recess, halo });
    }
  }

  buildEnergyNodes() {
    this.nodes = [];
    const nodeAngles = [0.14, 1.18, 2.02, 3.26, 4.22, 5.30];
    for (const a of nodeAngles) {
      const g = new THREE.Group();
      const radius = CFG.ringRadius + 0.02;

      g.position.set(
        Math.cos(a) * radius,
        Math.sin(a) * radius,
        0.25
      );
      g.rotation.z = a;

      const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.11, 0.08),
        glossyBlackMaterial()
      );
      g.add(body);

      const core = new THREE.Mesh(
        new THREE.BoxGeometry(0.09, 0.018, 0.016),
        new THREE.MeshBasicMaterial({
          color: 0xffd58f,
          transparent: true,
          opacity: 0.10,
        })
      );
      core.position.z = 0.04;
      g.add(core);

      this.rig.add(g);
      this.nodes.push(core);
    }
  }

  update(t, progress = 0) {
    this.outerHull.rotation.z += 0.00012;
    this.innerHull.rotation.z -= 0.00005;
    this.voidRail.rotation.z += 0.00016;
    this.fissureTrace.rotation.z -= 0.00024;

    this.rig.rotation.z = Math.sin(t * 0.06) * 0.0014;
    this.rig.rotation.x = Math.sin(t * 0.05) * 0.0020;

    for (let i = 0; i < this.spines.length; i++) {
      this.spines[i].position.z = -0.04 + Math.sin(t * 0.28 + i) * 0.01;
    }

    const p = clamp(progress, 0, 1);
    const front = p * this.socketGroups.length;
    const litCount = Math.floor(front);
    const frac = front - litCount;

    for (let i = 0; i < this.socketGroups.length; i++) {
      let level = 0;
      if (i < litCount) level = 1;
      else if (i === litCount) level = frac;

      this.socketGroups[i].recess.material.opacity = 0.05 + level * 0.78;
      this.socketGroups[i].recess.material.color.setRGB(
        1.0,
        0.84 + level * 0.10,
        0.48 + level * 0.08
      );

      this.socketGroups[i].halo.material.opacity = 0.01 + level * 0.16;
      const s = 0.12 + level * 0.08;
      this.socketGroups[i].halo.scale.set(s, s, 1);
    }

    for (let i = 0; i < this.nodes.length; i++) {
      this.nodes[i].material.opacity = 0.06 + Math.sin(t * 0.8 + i) * 0.01 + p * 0.08;
    }
  }
}

class Flare {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.position.set(0.22, CFG.worldY + 0.10, CFG.worldZ + 1.15);
    scene.add(this.group);

    this.center = makeRadialSprite([
      [0.00, 'rgba(255,250,240,0.20)'],
      [0.12, 'rgba(255,236,196,0.06)'],
      [0.30, 'rgba(255,220,160,0.012)'],
      [1.00, 'rgba(255,255,255,0.0)']
    ], 0.40, 0.020);
    this.group.add(this.center);

    this.horiz = makeHorizontalFlare(4.8, 0.050, 0.020);
    this.group.add(this.horiz);
  }

  update(t) {
    this.center.material.opacity = 0.020 + Math.sin(t * 0.55) * 0.002;
    this.horiz.material.opacity = 0.020 + Math.sin(t * 0.46 + 0.4) * 0.002;
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
    this.root.rotation.y += 0.0018;
    this.root.rotation.x = 0.086 + Math.sin(t * 0.42) * 0.004;
  }
}

new Runtime();
