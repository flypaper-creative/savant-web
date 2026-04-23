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
  preloadMs: 9500,
  dpr: Math.min(window.devicePixelRatio || 1, 2),
  exposure: 1.05,
  bloomMin: 0.10,
  bloomMax: 0.20,
  worldY: 0.02,
  worldZ: -3.0,
  ringRadius: 2.68,
  logoTargetSize: 1.96,
  chamberRadius: 9.2,
  chamberDepth: 16.0,
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
function easeOutCubic(x) { return 1 - Math.pow(1 - x, 3); }

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
    for (const [offset, color] of stops) grad.addColorStop(offset, color);
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

function makeHorizontalFlare(width = 6.0, height = 0.055, opacity = 0.016) {
  const tex = makeCanvasTexture((g, w, h) => {
    const grad = g.createLinearGradient(0, h / 2, w, h / 2);
    grad.addColorStop(0.0, 'rgba(255,255,255,0)');
    grad.addColorStop(0.22, 'rgba(255,220,170,0)');
    grad.addColorStop(0.50, 'rgba(255,248,235,1)');
    grad.addColorStop(0.74, 'rgba(255,90,150,0)');
    grad.addColorStop(1.0, 'rgba(255,255,255,0)');
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
    color: 0x020307,
    metalness: 1.0,
    roughness: 0.026,
    clearcoat: 1.0,
    clearcoatRoughness: 0.004,
    envMapIntensity: 5.4,
    reflectivity: 1.0,
  });
}

function secondaryBlackMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0x070a10,
    metalness: 1.0,
    roughness: 0.055,
    clearcoat: 1.0,
    clearcoatRoughness: 0.010,
    envMapIntensity: 4.2,
    reflectivity: 1.0,
  });
}

function darkGoldMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0x6c4810,
    metalness: 1.0,
    roughness: 0.012,
    clearcoat: 1.0,
    clearcoatRoughness: 0.0008,
    envMapIntensity: 30.0,
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
    this.camera.position.set(0, 0.04, 10);
    this.camera.lookAt(0, CFG.worldY, CFG.worldZ);

    this.pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = this.pmrem.fromScene(new RoomEnvironment(this.renderer), 0.03).texture;

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      CFG.bloomMin,
      0.46,
      0.95
    );
    this.composer.addPass(this.bloomPass);

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.018));

    this.key = new THREE.SpotLight(0xffffff, 72, 76, 0.16, 0.98, 1.12);
    this.key.position.set(0.55, 3.1, 6.8);
    this.scene.add(this.key);

    this.fill = new THREE.PointLight(0xf7f9ff, 1.2, 14);
    this.fill.position.set(-2.5, 0.5, 5.2);
    this.scene.add(this.fill);

    this.rim = new THREE.PointLight(0xffffff, 16.5, 24);
    this.rim.position.set(2.0, 2.0, -2.7);
    this.scene.add(this.rim);

    this.goldKick = new THREE.PointLight(0xffd17a, 1.05, 11);
    this.goldKick.position.set(0.0, -2.5, 3.0);
    this.scene.add(this.goldKick);

    this.pinkKick = new THREE.PointLight(0xff4f89, 0.40, 9);
    this.pinkKick.position.set(-2.0, 0.1, 2.9);
    this.scene.add(this.pinkKick);

    this.chamber = new Chamber(this.scene);
    this.ring = new KineticRing(this.scene);
    this.logo = new LogoMark(this.scene);
    this.flare = new Flare(this.scene);

    els.initBtn?.addEventListener('click', () => {
      if (!STATE.ready || STATE.entered) return;
      STATE.entered = true;
      els.preloader?.classList.add('hidden');
      els.shell?.classList.add('live');
    });

    window.addEventListener('resize', () => this.resize());
    this.resize();
    this.tick();
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const aspect = w / h;
    const frustum = w < 700 ? 8.95 : 8.15;

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
      STATE.progress += (1 - STATE.progress) * 0.030;
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
    this.flare.update(t, STATE.progress);

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
        metalness: 0.24,
        roughness: 0.985,
        side: THREE.BackSide,
      })
    );
    this.group.add(this.room);

    this.floorDish = new THREE.Mesh(
      new THREE.CylinderGeometry(5.5, 6.4, 0.28, 96, 1, true),
      secondaryBlackMaterial()
    );
    this.floorDish.position.set(0, -2.75, CFG.worldZ + 0.25);
    this.group.add(this.floorDish);

    this.ceilingDish = new THREE.Mesh(
      new THREE.CylinderGeometry(6.4, 5.5, 0.28, 96, 1, true),
      secondaryBlackMaterial()
    );
    this.ceilingDish.position.set(0, 2.75, CFG.worldZ + 0.25);
    this.group.add(this.ceilingDish);

    this.backPlate = new THREE.Mesh(
      new THREE.CircleGeometry(6.4, 96),
      new THREE.MeshPhysicalMaterial({
        color: 0x05070b,
        metalness: 0.46,
        roughness: 0.84,
      })
    );
    this.backPlate.position.set(0, CFG.worldY, CFG.worldZ - 3.05);
    this.group.add(this.backPlate);

    this.backRingA = new THREE.Mesh(
      new THREE.TorusGeometry(3.65, 0.045, 18, 240),
      new THREE.MeshBasicMaterial({ color: 0xe0b953, transparent: true, opacity: 0.10 })
    );
    this.backRingA.position.set(0, CFG.worldY, CFG.worldZ - 2.52);
    this.group.add(this.backRingA);

    this.backRingB = new THREE.Mesh(
      new THREE.TorusGeometry(3.18, 0.018, 18, 240),
      new THREE.MeshBasicMaterial({ color: 0xff4c82, transparent: true, opacity: 0.06 })
    );
    this.backRingB.position.set(0, CFG.worldY, CFG.worldZ - 2.28);
    this.group.add(this.backRingB);

    this.sideArchA = new THREE.Mesh(
      new THREE.TorusGeometry(6.2, 0.11, 20, 180, Math.PI),
      glossyBlackMaterial()
    );
    this.sideArchA.rotation.z = Math.PI / 2;
    this.sideArchA.position.set(-3.2, 0, CFG.worldZ - 1.4);
    this.group.add(this.sideArchA);

    this.sideArchB = this.sideArchA.clone();
    this.sideArchB.position.x *= -1;
    this.group.add(this.sideArchB);

    this.scan = new THREE.Mesh(
      new THREE.PlaneGeometry(6.4, 0.055),
      new THREE.MeshBasicMaterial({
        color: 0xfff0d0,
        transparent: true,
        opacity: 0.09,
        blending: THREE.AdditiveBlending,
      })
    );
    this.scan.position.set(0, 1.8, CFG.worldZ - 1.8);
    this.group.add(this.scan);

    this.hazeA = makeRadialSprite([
      [0.0, 'rgba(255,245,220,0.26)'],
      [0.16, 'rgba(255,205,120,0.08)'],
      [0.34, 'rgba(255,76,130,0.035)'],
      [1.0, 'rgba(0,0,0,0)']
    ], 13.5, 0.062, 512);
    this.hazeA.position.set(0, 0.18, CFG.worldZ - 1.9);
    this.group.add(this.hazeA);

    this.hazeB = makeRadialSprite([
      [0.0, 'rgba(255,245,220,0.18)'],
      [0.18, 'rgba(255,205,120,0.05)'],
      [1.0, 'rgba(0,0,0,0)']
    ], 10.4, 0.040, 512);
    this.hazeB.position.set(0, -0.46, CFG.worldZ - 1.62);
    this.group.add(this.hazeB);
  }

  update(t, progress) {
    this.backRingA.rotation.z += 0.00075;
    this.backRingB.rotation.z -= 0.00042;
    this.scan.position.y = lerp(1.75, -1.75, progress);
    this.scan.material.opacity = 0.07 + Math.sin(t * 1.35) * 0.018;
    this.hazeA.material.opacity = 0.055 + Math.sin(t * 0.40) * 0.008;
    this.hazeB.material.opacity = 0.035 + Math.cos(t * 0.30) * 0.006;
  }
}

class KineticRing {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.position.set(0, CFG.worldY, CFG.worldZ);
    scene.add(this.group);

    this.rig = new THREE.Group();
    this.group.add(this.rig);

    this.outer = new THREE.Mesh(
      new THREE.TorusGeometry(CFG.ringRadius, 0.22, 42, 340),
      glossyBlackMaterial()
    );
    this.rig.add(this.outer);

    this.mid = new THREE.Mesh(
      new THREE.TorusGeometry(CFG.ringRadius - 0.08, 0.09, 34, 300),
      secondaryBlackMaterial()
    );
    this.rig.add(this.mid);

    this.inner = new THREE.Mesh(
      new THREE.TorusGeometry(CFG.ringRadius - 0.30, 0.028, 20, 260),
      glossyBlackMaterial()
    );
    this.rig.add(this.inner);

    this.energyTrace = new THREE.Mesh(
      new THREE.TorusGeometry(CFG.ringRadius - 0.345, 0.010, 16, 240),
      new THREE.MeshBasicMaterial({
        color: 0xd2a24f,
        transparent: true,
        opacity: 0.07
      })
    );
    this.rig.add(this.energyTrace);

    this.fins = [];
    const finGeo = new THREE.BoxGeometry(0.09, 0.82, 0.06);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const fin = new THREE.Mesh(finGeo, secondaryBlackMaterial());
      fin.rotation.z = a;
      fin.position.z = -0.03;
      this.rig.add(fin);
      this.fins.push(fin);
    }

    this.ledCount = 20;
    this.leds = [];

    for (let i = 0; i < this.ledCount; i++) {
      const a = Math.PI / 2 - (i / this.ledCount) * Math.PI * 2;
      const radius = CFG.ringRadius - 0.17;

      const socket = new THREE.Mesh(
        new THREE.CylinderGeometry(0.058, 0.058, 0.020, 24),
        new THREE.MeshPhysicalMaterial({
          color: 0x090b10,
          metalness: 1.0,
          roughness: 0.04,
          clearcoat: 1.0,
          clearcoatRoughness: 0.006,
          envMapIntensity: 3.2,
        })
      );
      socket.rotation.x = Math.PI / 2;
      socket.position.set(Math.cos(a) * radius, Math.sin(a) * radius, 0.270);
      this.rig.add(socket);

      const lens = new THREE.Mesh(
        new THREE.CylinderGeometry(0.032, 0.032, 0.010, 24),
        new THREE.MeshPhysicalMaterial({
          color: 0x171015,
          emissive: 0x000000,
          metalness: 0.0,
          roughness: 0.045,
          clearcoat: 1.0,
          clearcoatRoughness: 0.002,
          ior: 1.45
        })
      );
      lens.rotation.x = Math.PI / 2;
      lens.position.set(Math.cos(a) * radius, Math.sin(a) * radius, 0.286);
      this.rig.add(lens);

      const core = new THREE.Mesh(
        new THREE.CylinderGeometry(0.016, 0.016, 0.007, 20),
        new THREE.MeshBasicMaterial({
          color: 0xffd38f,
          transparent: true,
          opacity: 0.08,
        })
      );
      core.rotation.x = Math.PI / 2;
      core.position.set(Math.cos(a) * radius, Math.sin(a) * radius, 0.298);
      this.rig.add(core);

      const glow = makeRadialSprite([
        [0.0, 'rgba(255,246,222,0.96)'],
        [0.14, 'rgba(255,214,150,0.42)'],
        [0.30, 'rgba(255,90,150,0.14)'],
        [1.0, 'rgba(0,0,0,0)']
      ], 0.16, 0.010, 512);
      glow.position.set(Math.cos(a) * radius, Math.sin(a) * radius, 0.312);
      this.rig.add(glow);

      this.leds.push({ lens, core, glow, index: i });
    }
  }

  update(t, progress) {
    this.outer.rotation.z += 0.00012;
    this.mid.rotation.z -= 0.00005;
    this.inner.rotation.z += 0.00008;
    this.energyTrace.rotation.z -= 0.00016;

    this.rig.rotation.z = Math.sin(t * 0.05) * 0.0011;
    this.rig.rotation.x = Math.sin(t * 0.04) * 0.0016;

    for (let i = 0; i < this.fins.length; i++) {
      this.fins[i].position.z = -0.03 + Math.sin(t * 0.30 + i) * 0.008;
    }

    const front = progress * this.ledCount;
    const lit = Math.floor(front);
    const frac = front - lit;

    for (let i = 0; i < this.ledCount; i++) {
      let level = 0;
      if (i < lit) level = 1;
      else if (i === lit) level = frac;

      const cyc = (i / this.ledCount + t * 0.012) % 1;
      const gold = new THREE.Color(0xe0b45b);
      const pink = new THREE.Color(0xd55da2);
      const mix = 0.5 + 0.5 * Math.sin(cyc * Math.PI * 2.0);
      const c = gold.clone().lerp(pink, mix);

      this.leds[i].core.material.color.copy(c);
      this.leds[i].core.material.opacity = 0.08 + level * 0.92;

      this.leds[i].glow.material.opacity = 0.010 + level * 0.18;
      const gs = 0.08 + level * 0.09;
      this.leds[i].glow.scale.set(gs, gs, 1);

      this.leds[i].lens.material.color.setRGB(
        0.06 + c.r * 0.10,
        0.04 + c.g * 0.04,
        0.05 + c.b * 0.08
      );
      this.leds[i].lens.material.emissive.setRGB(
        c.r * level * 0.25,
        c.g * level * 0.10,
        c.b * level * 0.20
      );
    }
  }
}

class LogoMark {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.position.set(0, CFG.worldY, CFG.worldZ);
    scene.add(this.group);

    this.pivot = new THREE.Group();
    this.group.add(this.pivot);

    this.forcefield = new THREE.Group();
    this.pivot.add(this.forcefield);

    this.forceOuter = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.22, 5),
      new THREE.MeshPhysicalMaterial({
        color: 0x84a8ff,
        emissive: 0x17224a,
        emissiveIntensity: 0.22,
        metalness: 0.0,
        roughness: 0.08,
        transparent: true,
        opacity: 0.032,
        transmission: 0.18,
        thickness: 0.24,
        clearcoat: 1.0,
        clearcoatRoughness: 0.01,
        ior: 1.18
      })
    );
    this.forcefield.add(this.forceOuter);

    this.forceInner = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.12, 3),
      new THREE.MeshPhysicalMaterial({
        color: 0x6f8cff,
        emissive: 0x101a38,
        emissiveIntensity: 0.18,
        metalness: 0.0,
        roughness: 0.10,
        transparent: true,
        opacity: 0.018,
        transmission: 0.10,
        thickness: 0.12,
        clearcoat: 1.0,
        clearcoatRoughness: 0.014,
        ior: 1.16
      })
    );
    this.forcefield.add(this.forceInner);

    this.forceWireA = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.27, 2),
      new THREE.MeshBasicMaterial({
        color: 0x98c8ff,
        transparent: true,
        opacity: 0.026,
        wireframe: true
      })
    );
    this.forcefield.add(this.forceWireA);

    this.forceWireB = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.05, 1),
      new THREE.MeshBasicMaterial({
        color: 0xff6ca8,
        transparent: true,
        opacity: 0.014,
        wireframe: true
      })
    );
    this.forcefield.add(this.forceWireB);

    this.forceRingA = new THREE.Mesh(
      new THREE.TorusGeometry(1.34, 0.010, 12, 180),
      new THREE.MeshBasicMaterial({
        color: 0x9ed2ff,
        transparent: true,
        opacity: 0.026
      })
    );
    this.forceRingA.rotation.x = Math.PI * 0.5;
    this.forcefield.add(this.forceRingA);

    this.forceRingB = new THREE.Mesh(
      new THREE.TorusGeometry(1.18, 0.008, 12, 180),
      new THREE.MeshBasicMaterial({
        color: 0xff73ac,
        transparent: true,
        opacity: 0.014
      })
    );
    this.forceRingB.rotation.y = Math.PI * 0.5;
    this.forcefield.add(this.forceRingB);

    this.forceHalo = makeRadialSprite([
      [0.0, 'rgba(160,210,255,0.28)'],
      [0.18, 'rgba(105,145,255,0.10)'],
      [0.36, 'rgba(255,70,140,0.04)'],
      [1.0, 'rgba(0,0,0,0)']
    ], 3.05, 0.03, 512);
    this.forceHalo.position.z = 0.03;
    this.forcefield.add(this.forceHalo);

    this.root = null;
    this.load();
  }

  applyMaterials(root) {
    root.traverse((obj) => {
      if (!obj.isMesh) return;
      obj.material = darkGoldMaterial();
      obj.castShadow = false;
      obj.receiveShadow = false;
      obj.geometry?.computeVertexNormals?.();
    });
  }

  fitAndAnchor(root) {
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
        this.applyMaterials(this.root);
        this.pivot.add(this.root);
        this.fitAndAnchor(this.root);
        STATE.loaded = true;
      },
      undefined,
      () => {
        this.root = new THREE.Mesh(
          new THREE.TorusKnotGeometry(0.92, 0.20, 260, 40, 2, 3),
          darkGoldMaterial()
        );
        this.pivot.add(this.root);
        STATE.loaded = true;
      }
    );
  }

  update(t, progress) {
    if (!this.root) return;

    const settle = easeOutCubic(Math.min(progress / 0.72, 1));
    this.group.position.y = CFG.worldY;

    const qStart = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.14, -0.55, 0.04));
    const qFront = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.0, 0.0, 0.0));
    this.group.quaternion.slerp(qStart.clone().slerp(qFront, settle), 0.08);

    if (settle > 0.985) {
      const spinQuat = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(0.0, t * 0.42, 0.0)
      );
      this.pivot.quaternion.slerp(spinQuat, 0.05);
    } else {
      this.pivot.quaternion.slerp(new THREE.Quaternion(), 0.08);
    }

    this.forcefield.rotation.x += 0.0010;
    this.forcefield.rotation.y -= 0.0016;
    this.forcefield.rotation.z += 0.0007;

    this.forceOuter.rotation.x -= 0.0012;
    this.forceOuter.rotation.y += 0.0015;

    this.forceInner.rotation.x += 0.0014;
    this.forceInner.rotation.z -= 0.0018;

    this.forceWireA.rotation.z += 0.0022;
    this.forceWireB.rotation.x -= 0.0017;
    this.forceWireB.rotation.y += 0.0011;

    this.forceRingA.rotation.z += 0.0032;
    this.forceRingB.rotation.x -= 0.0026;

    this.forceOuter.material.opacity = 0.024 + progress * 0.022 + Math.sin(t * 0.8) * 0.004;
    this.forceInner.material.opacity = 0.014 + progress * 0.012 + Math.cos(t * 0.9) * 0.003;
    this.forceWireA.material.opacity = 0.022 + progress * 0.024;
    this.forceWireB.material.opacity = 0.012 + progress * 0.014;
    this.forceRingA.material.opacity = 0.020 + progress * 0.022;
    this.forceRingB.material.opacity = 0.012 + progress * 0.014;
    this.forceHalo.material.opacity = 0.015 + progress * 0.026;

    const fs = 1.0 + Math.sin(t * 0.8) * 0.010;
    this.forcefield.scale.set(fs, fs, fs);

    this.root.traverse((obj, i = 0) => {
      if (!obj.isMesh || !obj.material) return;
      const mat = obj.material;
      mat.color.set('#6c4810');
      mat.emissive.set('#120704');
      mat.emissiveIntensity = 0.020 + settle * 0.018;
      mat.metalness = 1.0;
      mat.roughness = 0.012 - settle * 0.003;
      mat.clearcoat = 1.0;
      mat.clearcoatRoughness = 0.0008;
      mat.envMapIntensity = 30.0 + settle * 3.0;
      if ('specularIntensity' in mat) {
        mat.specularIntensity = 1.10 + Math.sin(t * 0.84 + i * 0.35) * 0.05;
      }
    });
  }
}

class Flare {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.position.set(0.10, CFG.worldY + 0.08, CFG.worldZ + 1.22);
    scene.add(this.group);

    this.center = makeRadialSprite([
      [0.0, 'rgba(255,250,242,0.18)'],
      [0.12, 'rgba(255,236,196,0.05)'],
      [0.30, 'rgba(255,220,160,0.010)'],
      [1.0, 'rgba(0,0,0,0)']
    ], 0.40, 0.016);
    this.group.add(this.center);

    this.horiz = makeHorizontalFlare(6.0, 0.055, 0.016);
    this.group.add(this.horiz);
  }

  update(t, progress) {
    this.center.material.opacity = 0.014 + progress * 0.010 + Math.sin(t * 0.55) * 0.0015;
    this.horiz.material.opacity = 0.016 + progress * 0.008 + Math.sin(t * 0.46 + 0.4) * 0.0015;
  }
}

new Runtime();
