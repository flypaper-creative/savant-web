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
  exposure: 1.03,
  bloomMin: 0.08,
  bloomMax: 0.18,
  worldY: -0.28,
  worldZ: -3.2,
  ringRadius: 2.78,
  logoTargetSize: 1.90,
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

function glossyBlackMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0x020307,
    metalness: 1.0,
    roughness: 0.03,
    clearcoat: 1.0,
    clearcoatRoughness: 0.005,
    envMapIntensity: 4.8,
    reflectivity: 1.0,
  });
}

function batteredBlackMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0x080c12,
    metalness: 1.0,
    roughness: 0.10,
    clearcoat: 0.8,
    clearcoatRoughness: 0.04,
    envMapIntensity: 3.2,
    reflectivity: 1.0,
  });
}

function darkGoldMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0x6b4710,
    metalness: 1.0,
    roughness: 0.014,
    clearcoat: 1.0,
    clearcoatRoughness: 0.0008,
    envMapIntensity: 28.0,
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
    this.scene.background = new THREE.Color(0x07070a);

    this.camera = new THREE.OrthographicCamera(-4, 4, 4, -4, 0.1, 100);
    this.camera.position.set(0, 0.2, 10);
    this.camera.lookAt(0, CFG.worldY, CFG.worldZ);

    this.pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = this.pmrem.fromScene(new RoomEnvironment(this.renderer), 0.03).texture;

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      CFG.bloomMin,
      0.48,
      0.95
    );
    this.composer.addPass(this.bloomPass);

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.016));

    this.sun = new THREE.SpotLight(0xffefdd, 75, 80, 0.26, 0.98, 1.0);
    this.sun.position.set(3.2, 4.2, 5.8);
    this.scene.add(this.sun);

    this.bounce = new THREE.PointLight(0xe08a4d, 1.1, 16);
    this.bounce.position.set(-2.8, -1.2, 4.2);
    this.scene.add(this.bounce);

    this.rim = new THREE.PointLight(0xffffff, 12.5, 22);
    this.rim.position.set(2.2, 1.6, -2.0);
    this.scene.add(this.rim);

    this.pinkKick = new THREE.PointLight(0xff4c84, 0.38, 8);
    this.pinkKick.position.set(-2.0, 0.6, 2.4);
    this.scene.add(this.pinkKick);

    this.world = new CrashWorld(this.scene);
    this.ring = new CrashRing(this.scene);
    this.logo = new CrashLogo(this.scene);
    this.flare = new CrashFlare(this.scene);

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
    const frustum = w < 700 ? 9.2 : 8.35;

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
    this.world.update(t, STATE.progress);
    this.ring.update(t, STATE.progress);
    this.logo.update(t, STATE.progress);
    this.flare.update(t, STATE.progress);

    this.bloomPass.strength = lerp(CFG.bloomMin, CFG.bloomMax, STATE.progress);
    this.composer.render();
  }
}
class CrashWorld {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);

    this.terrain = new THREE.Mesh(
      new THREE.CylinderGeometry(9.5, 11.5, 1.2, 96),
      new THREE.MeshPhysicalMaterial({
        color: 0x2a1813,
        metalness: 0.08,
        roughness: 1.0,
      })
    );
    this.terrain.position.set(0, -3.25, CFG.worldZ + 0.4);
    this.group.add(this.terrain);

    this.crater = new THREE.Mesh(
      new THREE.TorusGeometry(3.8, 0.46, 18, 220),
      new THREE.MeshPhysicalMaterial({
        color: 0x1b0f0d,
        metalness: 0.05,
        roughness: 1.0,
      })
    );
    this.crater.rotation.x = Math.PI / 2.02;
    this.crater.position.set(0, -1.95, CFG.worldZ + 0.10);
    this.group.add(this.crater);

    this.impactGlow = makeRadialSprite([
      [0.0, 'rgba(255,205,110,0.24)'],
      [0.14, 'rgba(255,120,70,0.09)'],
      [0.34, 'rgba(255,70,120,0.03)'],
      [1.0, 'rgba(0,0,0,0)']
    ], 7.8, 0.05, 512);
    this.impactGlow.position.set(0, -1.2, CFG.worldZ - 0.3);
    this.group.add(this.impactGlow);

    this.hazeA = makeRadialSprite([
      [0.0, 'rgba(255,220,170,0.18)'],
      [0.18, 'rgba(255,150,95,0.07)'],
      [1.0, 'rgba(0,0,0,0)']
    ], 13.0, 0.06, 512);
    this.hazeA.position.set(0, -0.1, CFG.worldZ - 1.6);
    this.group.add(this.hazeA);

    this.hazeB = makeRadialSprite([
      [0.0, 'rgba(255,210,160,0.14)'],
      [0.18, 'rgba(255,130,80,0.05)'],
      [1.0, 'rgba(0,0,0,0)']
    ], 10.0, 0.04, 512);
    this.hazeB.position.set(0, -0.7, CFG.worldZ - 1.2);
    this.group.add(this.hazeB);

    this.horizonA = new THREE.Mesh(
      new THREE.TorusGeometry(5.6, 0.08, 16, 180, Math.PI),
      batteredBlackMaterial()
    );
    this.horizonA.position.set(0, -0.45, CFG.worldZ - 3.35);
    this.horizonA.rotation.z = Math.PI;
    this.group.add(this.horizonA);

    this.horizonB = new THREE.Mesh(
      new THREE.TorusGeometry(6.6, 0.04, 16, 180, Math.PI),
      new THREE.MeshBasicMaterial({
        color: 0xe4b24d,
        transparent: true,
        opacity: 0.08
      })
    );
    this.horizonB.position.set(0, -0.15, CFG.worldZ - 3.55);
    this.horizonB.rotation.z = Math.PI;
    this.group.add(this.horizonB);

    this.debris = [];
    for (let i = 0; i < 14; i++) {
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.18 + (i % 3) * 0.08, 0),
        batteredBlackMaterial()
      );
      const a = (i / 14) * Math.PI * 2;
      const r = 3.7 + (i % 4) * 0.35;
      rock.position.set(
        Math.cos(a) * r,
        -1.85 + ((i % 5) * 0.04),
        CFG.worldZ + 0.2 + Math.sin(a) * 0.6
      );
      rock.rotation.set(i * 0.2, i * 0.3, i * 0.1);
      this.group.add(rock);
      this.debris.push(rock);
    }
  }

  update(t) {
    this.impactGlow.material.opacity = 0.045 + Math.sin(t * 0.45) * 0.006;
    this.hazeA.material.opacity = 0.052 + Math.sin(t * 0.25) * 0.006;
    this.hazeB.material.opacity = 0.034 + Math.cos(t * 0.21) * 0.005;
    this.horizonB.rotation.z += 0.00018;

    for (let i = 0; i < this.debris.length; i++) {
      this.debris[i].rotation.x += 0.0008 + i * 0.00002;
      this.debris[i].rotation.y += 0.0006 + i * 0.00003;
    }
  }
}

class CrashRing {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.position.set(0, CFG.worldY - 0.15, CFG.worldZ);
    this.group.rotation.set(-0.82, 0.26, -0.12);
    scene.add(this.group);

    this.rig = new THREE.Group();
    this.group.add(this.rig);

    this.outer = new THREE.Mesh(
      new THREE.TorusGeometry(CFG.ringRadius, 0.24, 42, 340),
      glossyBlackMaterial()
    );
    this.rig.add(this.outer);

    this.mid = new THREE.Mesh(
      new THREE.TorusGeometry(CFG.ringRadius - 0.08, 0.10, 34, 300),
      batteredBlackMaterial()
    );
    this.rig.add(this.mid);

    this.inner = new THREE.Mesh(
      new THREE.TorusGeometry(CFG.ringRadius - 0.31, 0.030, 20, 260),
      glossyBlackMaterial()
    );
    this.rig.add(this.inner);

    this.trace = new THREE.Mesh(
      new THREE.TorusGeometry(CFG.ringRadius - 0.35, 0.010, 16, 240),
      new THREE.MeshBasicMaterial({
        color: 0xd6a24d,
        transparent: true,
        opacity: 0.05
      })
    );
    this.rig.add(this.trace);

    this.ledCount = 18;
    this.leds = [];

    for (let i = 0; i < this.ledCount; i++) {
      const a = Math.PI / 2 - (i / this.ledCount) * Math.PI * 2;
      const radius = CFG.ringRadius - 0.18;

      const lens = new THREE.Mesh(
        new THREE.CylinderGeometry(0.030, 0.030, 0.010, 20),
        new THREE.MeshPhysicalMaterial({
          color: 0x181016,
          emissive: 0x000000,
          metalness: 0.0,
          roughness: 0.045,
          clearcoat: 1.0,
          clearcoatRoughness: 0.002,
          ior: 1.45
        })
      );
      lens.rotation.x = Math.PI / 2;
      lens.position.set(Math.cos(a) * radius, Math.sin(a) * radius, 0.285);
      this.rig.add(lens);

      const core = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.007, 20),
        new THREE.MeshBasicMaterial({
          color: 0xffd38f,
          transparent: true,
          opacity: 0.08,
        })
      );
      core.rotation.x = Math.PI / 2;
      core.position.set(Math.cos(a) * radius, Math.sin(a) * radius, 0.297);
      this.rig.add(core);

      const glow = makeRadialSprite([
        [0.0, 'rgba(255,246,222,0.96)'],
        [0.14, 'rgba(255,214,150,0.42)'],
        [0.30, 'rgba(255,90,150,0.14)'],
        [1.0, 'rgba(0,0,0,0)']
      ], 0.15, 0.010, 512);
      glow.position.set(Math.cos(a) * radius, Math.sin(a) * radius, 0.312);
      this.rig.add(glow);

      this.leds.push({ lens, core, glow });
    }
  }

  update(t, progress) {
    this.rig.rotation.z += 0.00025;
    this.trace.rotation.z -= 0.0002;

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

      this.leds[i].glow.material.opacity = 0.010 + level * 0.16;
      const gs = 0.08 + level * 0.08;
      this.leds[i].glow.scale.set(gs, gs, 1);

      this.leds[i].lens.material.color.setRGB(
        0.06 + c.r * 0.10,
        0.04 + c.g * 0.04,
        0.05 + c.b * 0.08
      );
      this.leds[i].lens.material.emissive.setRGB(
        c.r * level * 0.24,
        c.g * level * 0.10,
        c.b * level * 0.18
      );
    }
  }
}

class CrashLogo {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.position.set(0, CFG.worldY + 0.10, CFG.worldZ + 0.10);
    scene.add(this.group);

    this.pivot = new THREE.Group();
    this.group.add(this.pivot);

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
    this.group.position.y = CFG.worldY + 0.10 - (1 - settle) * 0.10;

    const qStart = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.20, -0.60, 0.05));
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

class CrashFlare {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.position.set(0.18, CFG.worldY + 0.10, CFG.worldZ + 1.1);
    scene.add(this.group);

    this.center = makeRadialSprite([
      [0.0, 'rgba(255,250,242,0.18)'],
      [0.12, 'rgba(255,236,196,0.05)'],
      [0.30, 'rgba(255,140,90,0.015)'],
      [1.0, 'rgba(0,0,0,0)']
    ], 0.42, 0.016);
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
