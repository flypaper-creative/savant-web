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
  preloadMs: 9000,
  dpr: Math.min(window.devicePixelRatio || 1, 2),
  exposure: 1.02,
  bloomMin: 0.08,
  bloomMax: 0.16,
  worldY: 0.08,
  worldZ: -2.72,
  ringRadius: 2.52,
  logoTargetSize: 1.92,
  chamberRadius: 8.2,
  chamberDepth: 14.0,
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

function makeHorizontalFlare(width = 5.4, height = 0.05, opacity = 0.018) {
  const tex = makeCanvasTexture((g, w, h) => {
    const grad = g.createLinearGradient(0, h / 2, w, h / 2);
    grad.addColorStop(0.0, 'rgba(255,255,255,0)');
    grad.addColorStop(0.25, 'rgba(255,220,170,0)');
    grad.addColorStop(0.5, 'rgba(255,248,232,1)');
    grad.addColorStop(0.75, 'rgba(255,120,180,0)');
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
    color: 0x020204,
    metalness: 1.0,
    roughness: 0.032,
    clearcoat: 1.0,
    clearcoatRoughness: 0.004,
    envMapIntensity: 4.8,
    reflectivity: 1.0,
  });
}

function blackSecondaryMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0x07090d,
    metalness: 1.0,
    roughness: 0.06,
    clearcoat: 1.0,
    clearcoatRoughness: 0.01,
    envMapIntensity: 3.8,
    reflectivity: 1.0,
  });
}

function darkGoldMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0x775116,
    metalness: 1.0,
    roughness: 0.018,
    clearcoat: 1.0,
    clearcoatRoughness: 0.001,
    envMapIntensity: 24.0,
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
      0.48,
      0.96
    );
    this.composer.addPass(this.bloomPass);

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.025));

    this.key = new THREE.SpotLight(0xffffff, 54, 64, 0.17, 0.95, 1.2);
    this.key.position.set(0.35, 2.6, 6.2);
    this.scene.add(this.key);

    this.fill = new THREE.PointLight(0xf6f8ff, 1.2, 14);
    this.fill.position.set(-2.2, 0.4, 4.8);
    this.scene.add(this.fill);

    this.rim = new THREE.PointLight(0xffffff, 13.5, 20);
    this.rim.position.set(1.8, 1.8, -2.8);
    this.scene.add(this.rim);

    this.goldKick = new THREE.PointLight(0xffd686, 1.0, 10);
    this.goldKick.position.set(0.0, -2.2, 2.8);
    this.scene.add(this.goldKick);

    this.pinkKick = new THREE.PointLight(0xff4b84, 0.45, 8);
    this.pinkKick.position.set(-1.8, 0.2, 2.6);
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
    const frustum = w < 700 ? 8.8 : 8.0;

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
      STATE.progress += (Math.min(target, 0.92) - STATE.progress) * 0.024;
    } else {
      STATE.progress += (1 - STATE.progress) * 0.03;
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
        metalness: 0.18,
        roughness: 0.985,
        side: THREE.BackSide,
      })
    );
    this.group.add(this.room);

    this.backPlate = new THREE.Mesh(
      new THREE.CircleGeometry(6.0, 96),
      new THREE.MeshPhysicalMaterial({
        color: 0x05070b,
        metalness: 0.36,
        roughness: 0.84,
      })
    );
    this.backPlate.position.set(0, CFG.worldY, CFG.worldZ - 2.75);
    this.group.add(this.backPlate);

    this.ringA = new THREE.Mesh(
      new THREE.TorusGeometry(3.35, 0.04, 18, 220),
      new THREE.MeshBasicMaterial({ color: 0xe2be57, transparent: true, opacity: 0.10 })
    );
    this.ringA.position.set(0, CFG.worldY, CFG.worldZ - 2.35);
    this.group.add(this.ringA);

    this.ringB = new THREE.Mesh(
      new THREE.TorusGeometry(2.92, 0.018, 18, 220),
      new THREE.MeshBasicMaterial({ color: 0xff4a7a, transparent: true, opacity: 0.06 })
    );
    this.ringB.position.set(0, CFG.worldY, CFG.worldZ - 2.16);
    this.group.add(this.ringB);

    this.scan = new THREE.Mesh(
      new THREE.PlaneGeometry(5.6, 0.055),
      new THREE.MeshBasicMaterial({
        color: 0xfff1d1,
        transparent: true,
        opacity: 0.10,
        blending: THREE.AdditiveBlending,
      })
    );
    this.scan.position.set(0, 1.8, CFG.worldZ - 1.4);
    this.group.add(this.scan);

    this.hazeA = makeRadialSprite([
      [0.0, 'rgba(255,240,210,0.22)'],
      [0.16, 'rgba(255,196,110,0.07)'],
      [0.34, 'rgba(255,80,120,0.03)'],
      [1.0, 'rgba(0,0,0,0)']
    ], 12.5, 0.06, 512);
    this.hazeA.position.set(0, 0.16, CFG.worldZ - 1.7);
    this.group.add(this.hazeA);

    this.hazeB = makeRadialSprite([
      [0.0, 'rgba(255,240,210,0.16)'],
      [0.18, 'rgba(255,196,110,0.05)'],
      [1.0, 'rgba(0,0,0,0)']
    ], 9.6, 0.04, 512);
    this.hazeB.position.set(0, -0.44, CFG.worldZ - 1.45);
    this.group.add(this.hazeB);
  }

  update(t, progress) {
    this.ringA.rotation.z += 0.0008;
    this.ringB.rotation.z -= 0.00045;
    this.scan.position.y = lerp(1.7, -1.7, progress);
    this.scan.material.opacity = 0.08 + Math.sin(t * 1.6) * 0.02;
    this.hazeA.material.opacity = 0.055 + Math.sin(t * 0.42) * 0.008;
    this.hazeB.material.opacity = 0.035 + Math.cos(t * 0.32) * 0.006;
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
      new THREE.TorusGeometry(CFG.ringRadius, 0.22, 42, 320),
      glossyBlackMaterial()
    );
    this.rig.add(this.outer);

    this.mid = new THREE.Mesh(
      new THREE.TorusGeometry(CFG.ringRadius - 0.08, 0.09, 34, 280),
      blackSecondaryMaterial()
    );
    this.rig.add(this.mid);

    this.inner = new THREE.Mesh(
      new THREE.TorusGeometry(CFG.ringRadius - 0.30, 0.028, 20, 240),
      glossyBlackMaterial()
    );
    this.rig.add(this.inner);

    this.trace = new THREE.Mesh(
      new THREE.TorusGeometry(CFG.ringRadius - 0.345, 0.010, 16, 220),
      new THREE.MeshBasicMaterial({ color: 0xd2a24f, transparent: true, opacity: 0.08 })
    );
    this.rig.add(this.trace);

    this.blades = [];
    const bladeGeo = new THREE.BoxGeometry(0.10, 0.80, 0.06);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const blade = new THREE.Mesh(bladeGeo, blackSecondaryMaterial());
      blade.rotation.z = a;
      blade.position.z = -0.03;
      this.rig.add(blade);
      this.blades.push(blade);
    }

    this.leds = [];
    this.ledCount = 22;

    for (let i = 0; i < this.ledCount; i++) {
      const a = Math.PI / 2 - (i / this.ledCount) * Math.PI * 2;
      const radius = CFG.ringRadius - 0.17;

      const socket = new THREE.Mesh(
        new THREE.CylinderGeometry(0.070, 0.070, 0.024, 24),
        new THREE.MeshPhysicalMaterial({
          color: 0x090b0f,
          metalness: 1.0,
          roughness: 0.04,
          clearcoat: 1.0,
          clearcoatRoughness: 0.006,
          envMapIntensity: 3.2,
        })
      );
      socket.rotation.x = Math.PI / 2;
      socket.position.set(Math.cos(a) * radius, Math.sin(a) * radius, 0.268);
      this.rig.add(socket);

      const lens = new THREE.Mesh(
        new THREE.CylinderGeometry(0.040, 0.040, 0.012, 24),
        new THREE.MeshPhysicalMaterial({
          color: 0x181012,
          emissive: 0x000000,
          metalness: 0.0,
          roughness: 0.05,
          clearcoat: 1.0,
          clearcoatRoughness: 0.002,
          ior: 1.45
        })
      );
      lens.rotation.x = Math.PI / 2;
      lens.position.set(Math.cos(a) * radius, Math.sin(a) * radius, 0.286);
      this.rig.add(lens);

      const core = new THREE.Mesh(
        new THREE.CylinderGeometry(0.020, 0.020, 0.008, 20),
        new THREE.MeshBasicMaterial({
          color: 0xffd38c,
          transparent: true,
          opacity: 0.08,
        })
      );
      core.rotation.x = Math.PI / 2;
      core.position.set(Math.cos(a) * radius, Math.sin(a) * radius, 0.298);
      this.rig.add(core);

      const glow = makeRadialSprite([
        [0.0, 'rgba(255,245,220,0.96)'],
        [0.14, 'rgba(255,208,140,0.44)'],
        [0.30, 'rgba(255,86,134,0.14)'],
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
    this.inner.rotation.z += 0.00007;
    this.trace.rotation.z -= 0.00016;
    this.rig.rotation.z = Math.sin(t * 0.05) * 0.0011;
    this.rig.rotation.x = Math.sin(t * 0.04) * 0.0016;

    for (let i = 0; i < this.blades.length; i++) {
      this.blades[i].position.z = -0.03 + Math.sin(t * 0.32 + i) * 0.008;
    }

    const front = progress * this.ledCount;
    const lit = Math.floor(front);
    const frac = front - lit;

    for (let i = 0; i < this.ledCount; i++) {
      let level = 0;
      if (i < lit) level = 1;
      else if (i === lit) level = frac;

      const cyc = (i / this.ledCount + t * 0.014) % 1;
      const gold = new THREE.Color(0xe2b45a);
      const pink = new THREE.Color(0xd55aa0);
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
        c.r * level * 0.24,
        c.g * level * 0.09,
        c.b * level * 0.18
      );
    }
  }
}
class LogoMark {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.position.set(0, CFG.worldY, CFG.worldZ);
    scene.add(this.group);
    this.root = null;
    this.load();
  }

  applyMaterials(root) {
    root.traverse((obj) => {
      if (!obj.isMesh) return;
      obj.material = darkGoldMaterial();
      obj.castShadow = false;
      obj.receiveShadow = false;
      if (obj.geometry) {
        obj.geometry.computeVertexNormals?.();
      }
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
        this.applyMaterials(this.root);
        this.group.add(this.root);
        this.fit(this.root);
        STATE.loaded = true;
      },
      undefined,
      () => {
        this.root = new THREE.Mesh(
          new THREE.TorusKnotGeometry(0.92, 0.20, 260, 40, 2, 3),
          darkGoldMaterial()
        );
        this.group.add(this.root);
        STATE.loaded = true;
      }
    );
  }

  update(t, progress) {
    if (!this.root) return;

    const settle = easeOutCubic(Math.min(progress / 0.70, 1));
    this.group.position.y = CFG.worldY + (1 - settle) * 0.10;

    const qStart = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.18, -0.62, 0.06));
    const qFront = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.02, 0, 0));
    this.group.quaternion.slerp(qStart.clone().slerp(qFront, settle), 0.08);

    if (settle > 0.985) {
      const liveQuat = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(
          0.02 + Math.sin(t * 0.34) * 0.010,
          t * 0.42,
          0
        )
      );
      this.group.quaternion.slerp(liveQuat, 0.028);
    }

    this.root.traverse((obj, i = 0) => {
      if (!obj.isMesh || !obj.material) return;
      const mat = obj.material;
      mat.color.set('#775116');
      mat.emissive.set('#110704');
      mat.emissiveIntensity = 0.025 + settle * 0.018;
      mat.metalness = 1.0;
      mat.roughness = 0.018 - settle * 0.006;
      mat.clearcoat = 1.0;
      mat.clearcoatRoughness = 0.001;
      mat.envMapIntensity = 24.0 + settle * 2.0;
      if ('specularIntensity' in mat) {
        mat.specularIntensity = 1.04 + Math.sin(t * 0.8 + i * 0.3) * 0.04;
      }
    });
  }
}
class Flare {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.position.set(0.12, CFG.worldY + 0.08, CFG.worldZ + 1.16);
    scene.add(this.group);

    this.center = makeRadialSprite([
      [0.0, 'rgba(255,250,242,0.20)'],
      [0.12, 'rgba(255,236,196,0.05)'],
      [0.30, 'rgba(255,220,160,0.010)'],
      [1.0, 'rgba(0,0,0,0)']
    ], 0.38, 0.016);
    this.group.add(this.center);

    this.horiz = makeHorizontalFlare(5.2, 0.05, 0.018);
    this.group.add(this.horiz);
  }

  update(t, progress) {
    this.center.material.opacity = 0.014 + progress * 0.010 + Math.sin(t * 0.55) * 0.0015;
    this.horiz.material.opacity = 0.016 + progress * 0.008 + Math.sin(t * 0.46 + 0.4) * 0.0015;
  }
}

new Runtime();
