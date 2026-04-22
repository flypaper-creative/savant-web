import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const preloader = document.getElementById('preloader-ui') || document.getElementById('preloader');
const shell = document.getElementById('ui-wrapper') || document.getElementById('shell');
const initBtn = document.getElementById('enter-btn') || document.getElementById('initBtn');
const preloadPercent = document.getElementById('pct') || document.getElementById('preloadPercent');
const progressFill = document.getElementById('progress-fill');
const menuBtn = document.getElementById('burger-trigger') || document.getElementById('menuBtn');
const closeMenuBtn = document.getElementById('closeMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');
const fxFlash = document.getElementById('fxFlash');
const fxShock = document.getElementById('fxShock');
const flare = document.getElementById('anamorphic-flare');
const gridOverlay = document.getElementById('grid-overlay');
const corners = [...document.querySelectorAll('.corner-accent')];
const huds = [...document.querySelectorAll('.telemetry-hud')];
const revealEls = [...document.querySelectorAll('.reveal')];

function ensureCanvas() {
  let c = document.getElementById('webgl-canvas');
  if (!c) {
    c = document.createElement('canvas');
    c.id = 'webgl-canvas';
    document.body.prepend(c);
  }
  return c;
}
const canvas = ensureCanvas();

const mouse3D = { x: 0, y: 0 };
window.addEventListener('mousemove', (e) => {
  mouse3D.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse3D.y = -((e.clientY / window.innerHeight) * 2 - 1);
});

const CFG = {
  preloadMs: 7400,
  exposure: 1.08,
  bloomBase: 0.22,
  bloomPeak: 1.02,
  bloomRadius: 0.86,
  bloomThreshold: 0.80,

  ringRadius: 2.70,
  ringCenter: new THREE.Vector3(0, 0, -11.10),
  cameraZ: 7.28,
  logoTargetSize: 3.08,

  microLedCount: 148,
  armorCount: 18,
  stripCount: 10,
  dustCount: 120,

  preEnterSpinSpeed: 0.010,
  dpr: Math.min(window.innerWidth < 900 ? 1.18 : 1.42, window.devicePixelRatio || 1.35)
};

const state = {
  startedAt: performance.now(),
  loaded: false,
  ready: false,
  entered: false,
  progress: 0
};

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function easeOutQuint(x) { return 1 - Math.pow(1 - x, 5); }
function easeInOutCubic(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
function easeOutExpo(x) { return x === 1 ? 1 : 1 - Math.pow(2, -10 * x); }

function cubicBezier3(a, b, c, d, t) {
  const k = 1 - t;
  return new THREE.Vector3(
    k*k*k*a.x + 3*k*k*t*b.x + 3*k*t*t*c.x + t*t*t*d.x,
    k*k*k*a.y + 3*k*k*t*b.y + 3*k*t*t*c.y + t*t*t*d.y,
    k*k*k*a.z + 3*k*k*t*b.z + 3*k*t*t*c.z + t*t*t*d.z
  );
}

function makeCanvasTexture(draw, size = 256) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  draw(g, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

function makeGlowSprite(stops, size, opacity = 1, textureSize = 256) {
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
    opacity
  });

  const s = new THREE.Sprite(mat);
  s.scale.set(size, size, 1);
  return s;
}

function metalMat(color, roughness, metalness = 1.0, clearcoat = 1.0, envMapIntensity = 3.0) {
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness,
    roughness,
    clearcoat,
    clearcoatRoughness: Math.max(0.010, roughness * 0.38),
    envMapIntensity
  });
}

function blackGlassMat(color = 0x06070a) {
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.78,
    roughness: 0.045,
    transmission: 0.0,
    thickness: 0.0,
    ior: 1.56,
    envMapIntensity: 3.3,
    clearcoat: 1.0,
    clearcoatRoughness: 0.012,
    specularIntensity: 1.0
  });
}

function emissiveMat(color, opacity = 0.5) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false
  });
}

/* renderer */
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
renderer.physicallyCorrectLights = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020202);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.018).texture;

const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 140);
camera.position.set(0, 0, CFG.cameraZ);
camera.lookAt(CFG.ringCenter);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  CFG.bloomBase,
  CFG.bloomRadius,
  CFG.bloomThreshold
);
composer.addPass(bloomPass);

/* lighting */
scene.add(new THREE.AmbientLight(0xffffff, 0.025));

const key = new THREE.DirectionalLight(0xfff5e7, 1.02);
key.position.set(4.8, 5.2, 3.8);
scene.add(key);

const fill = new THREE.DirectionalLight(0xe3ebff, 0.30);
fill.position.set(-4.2, 1.8, 2.8);
scene.add(fill);

const warmBack = new THREE.PointLight(0xffb44f, 1.85, 24, 2);
warmBack.position.set(0, 0.05, CFG.ringCenter.z + 1.9);
scene.add(warmBack);

const goldSpec = new THREE.PointLight(0xfff3df, 0.82, 16, 2);
goldSpec.position.set(0.10, 2.30, -7.2);
scene.add(goldSpec);

const topBladeLight = new THREE.PointLight(0xffdda1, 3.0, 20, 2);
topBladeLight.position.set(0, 2.92, -9.75);
scene.add(topBladeLight);

const ringSweepLight = new THREE.PointLight(0xffb960, 0.0, 15, 2);
scene.add(ringSweepLight);

const logoAccentLight = new THREE.PointLight(0xfff7ef, 0.68, 12, 2);
logoAccentLight.position.set(0, 0.28, -8.3);
scene.add(logoAccentLight);

const chamberHaze = makeGlowSprite([
  [0.00, 'rgba(255,214,145,0.18)'],
  [0.12, 'rgba(255,156,40,0.10)'],
  [0.35, 'rgba(255,255,255,0.03)'],
  [1.00, 'rgba(255,255,255,0.0)']
], 13.0, 0.18, 512);
chamberHaze.position.set(0, -0.16, CFG.ringCenter.z + 0.58);
scene.add(chamberHaze);

/* dust */
class DustField {
  constructor(scene) {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(CFG.dustCount * 3);

    for (let i = 0; i < CFG.dustCount; i++) {
      const r = 2.2 + Math.random() * 4.6;
      const a = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 4.2;
      positions[i * 3 + 0] = Math.cos(a) * r;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = CFG.ringCenter.z + (Math.random() - 0.5) * 3.2;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xffcf86,
      transparent: true,
      opacity: 0.10,
      size: 0.022,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.points = new THREE.Points(geo, mat);
    scene.add(this.points);
  }

  update(time) {
    this.points.rotation.z = time * 0.008;
    this.points.rotation.y = time * 0.016;
  }
}
const dust = new DustField(scene);

/* ring */
class RingSystem {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.position.copy(CFG.ringCenter);
    scene.add(this.group);

    this.rig = new THREE.Group();
    this.group.add(this.rig);

    /* main body */
    this.outerShell = new THREE.Mesh(
      new THREE.TorusGeometry(CFG.ringRadius, 0.108, 32, 340),
      metalMat(0x040506, 0.026, 1.0, 1.0, 3.45)
    );
    this.rig.add(this.outerShell);

    this.midBand = new THREE.Mesh(
      new THREE.TorusGeometry(CFG.ringRadius + 0.008, 0.042, 20, 300),
      metalMat(0x090a0d, 0.038, 1.0, 1.0, 3.1)
    );
    this.rig.add(this.midBand);

    this.innerRail = new THREE.Mesh(
      new THREE.TorusGeometry(CFG.ringRadius - 0.158, 0.020, 18, 320),
      metalMat(0x15171c, 0.016, 1.0, 1.0, 3.15)
    );
    this.rig.add(this.innerRail);

    this.innerGoldFilament = new THREE.Mesh(
      new THREE.TorusGeometry(CFG.ringRadius - 0.205, 0.0055, 12, 260),
      emissiveMat(0xffd07a, 0.15)
    );
    this.rig.add(this.innerGoldFilament);

    this.softHaloRing = new THREE.Mesh(
      new THREE.TorusGeometry(CFG.ringRadius - 0.205, 0.016, 12, 180),
      new THREE.MeshBasicMaterial({
        color: 0xffa63a,
        transparent: true,
        opacity: 0.03,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false
      })
    );
    this.rig.add(this.softHaloRing);

    this.bigHalo = makeGlowSprite([
      [0.00, 'rgba(255,242,225,0.28)'],
      [0.06, 'rgba(255,185,82,0.16)'],
      [0.18, 'rgba(255,120,24,0.08)'],
      [0.40, 'rgba(255,255,255,0.02)'],
      [1.00, 'rgba(255,255,255,0.0)']
    ], 8.9, 0.13, 512);
    this.group.add(this.bigHalo);

    this.buildArmorPanels();
    this.buildMicroLedTracks();
    this.buildStripEmitters();
    this.buildTopBlade();
  }

  buildArmorPanels() {
    const geo = new THREE.BoxGeometry(0.34, 0.13, 0.14);
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0x07080b,
      metalness: 1.0,
      roughness: 0.032,
      clearcoat: 1.0,
      clearcoatRoughness: 0.012,
      envMapIntensity: 3.35,
      vertexColors: true
    });

    this.armor = new THREE.InstancedMesh(geo, mat, CFG.armorCount);
    this.armor.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    this.armor.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(CFG.armorCount * 3), 3);

    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    const p = new THREE.Vector3();
    const c = new THREE.Color();

    for (let i = 0; i < CFG.armorCount; i++) {
      const a = (i / CFG.armorCount) * Math.PI * 2;
      s.set(1.0, i % 4 === 0 ? 1.75 : (i % 2 ? 1.06 : 1.32), 1.0);
      p.set(Math.cos(a) * (CFG.ringRadius + 0.03), Math.sin(a) * (CFG.ringRadius + 0.03), 0.10);
      q.setFromEuler(new THREE.Euler(0, 0, a));
      m.compose(p, q, s);
      this.armor.setMatrixAt(i, m);
      c.setHex(i % 2 ? 0x0b0d11 : 0x040509);
      this.armor.setColorAt(i, c);
    }

    this.armor.instanceMatrix.needsUpdate = true;
    this.armor.instanceColor.needsUpdate = true;
    this.rig.add(this.armor);
  }

  buildMicroLedTracks() {
    this.ledPositions = [];

    const housingGeo = new THREE.BoxGeometry(0.040, 0.018, 0.030);
    const housingMat = new THREE.MeshPhysicalMaterial({
      color: 0x100c08,
      metalness: 0.34,
      roughness: 0.11,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      vertexColors: true
    });

    const emitterGeo = new THREE.BoxGeometry(0.014, 0.006, 0.008);
    const emitterMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false
    });

    this.ledHousing = new THREE.InstancedMesh(housingGeo, housingMat, CFG.microLedCount);
    this.ledEmitter = new THREE.InstancedMesh(emitterGeo, emitterMat, CFG.microLedCount);

    this.ledHousing.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    this.ledEmitter.instanceMatrix.setUsage(THREE.StaticDrawUsage);

    this.ledHousing.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(CFG.microLedCount * 3), 3);
    this.ledEmitter.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(CFG.microLedCount * 3), 3);

    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3(1, 1, 1);
    const p = new THREE.Vector3();
    const darkHousing = new THREE.Color(0x100c08);
    const darkEmitter = new THREE.Color(0x000000);

    for (let i = 0; i < CFG.microLedCount; i++) {
      const a = Math.PI / 2 + (i / CFG.microLedCount) * Math.PI * 2;
      const radius = CFG.ringRadius - 0.132;

      p.set(Math.cos(a) * radius, Math.sin(a) * radius, 0.145);
      q.setFromEuler(new THREE.Euler(0, 0, a));
      m.compose(p, q, s);
      this.ledHousing.setMatrixAt(i, m);
      this.ledHousing.setColorAt(i, darkHousing);

      p.set(Math.cos(a) * radius, Math.sin(a) * radius, 0.164);
      m.compose(p, q, s);
      this.ledEmitter.setMatrixAt(i, m);
      this.ledEmitter.setColorAt(i, darkEmitter);

      this.ledPositions.push(p.clone());
    }

    this.ledHousing.instanceMatrix.needsUpdate = true;
    this.ledEmitter.instanceMatrix.needsUpdate = true;
    this.ledHousing.instanceColor.needsUpdate = true;
    this.ledEmitter.instanceColor.needsUpdate = true;

    this.rig.add(this.ledHousing);
    this.rig.add(this.ledEmitter);

    this.tmpGold = new THREE.Color();
    this.tmpWhite = new THREE.Color();
    this.tmpMix = new THREE.Color();
    this.tmpBlack = new THREE.Color(0x000000);
    this.tmpHousingOff = new THREE.Color(0x100c08);
    this.tmpVec = new THREE.Vector3();
  }

  buildStripEmitters() {
    this.stripEmitters = [];

    const bodyGeo = new THREE.BoxGeometry(0.24, 0.050, 0.080);
    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: 0x08090c,
      metalness: 1.0,
      roughness: 0.022,
      clearcoat: 1.0,
      clearcoatRoughness: 0.012,
      envMapIntensity: 3.25
    });

    for (let i = 0; i < CFG.stripCount; i++) {
      const g = new THREE.Group();
      const a = (i / CFG.stripCount) * Math.PI * 2 + (i % 2 ? 0.04 : -0.02);
      g.position.set(Math.cos(a) * (CFG.ringRadius + 0.04), Math.sin(a) * (CFG.ringRadius + 0.04), 0.11);
      g.rotation.z = a;

      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.scale.y = i % 3 === 0 ? 1.48 : (i % 2 ? 0.84 : 1.14);
      g.add(body);

      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(0.155, 0.012, 0.010),
        new THREE.MeshBasicMaterial({
          color: 0xffcb76,
          transparent: true,
          opacity: 0.62,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          toneMapped: false
        })
      );
      strip.position.z = 0.048;
      g.add(strip);

      this.rig.add(g);
      this.stripEmitters.push(strip);
    }
  }

  buildTopBlade() {
    this.topBladeRig = new THREE.Group();
    this.topBladeRig.position.set(0, CFG.ringRadius + 0.015, 0.18);
    this.rig.add(this.topBladeRig);

    const housing = new THREE.Mesh(
      new THREE.BoxGeometry(0.23, 0.48, 0.16),
      metalMat(0x06070a, 0.022, 1.0, 1.0, 3.35)
    );
    this.topBladeRig.add(housing);

    this.topBladeCore = new THREE.Mesh(
      new THREE.BoxGeometry(0.042, 0.72, 0.026),
      new THREE.MeshBasicMaterial({
        color: 0xffdda2,
        transparent: true,
        opacity: 0.96,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false
      })
    );
    this.topBladeRig.add(this.topBladeCore);
  }

  update(progress, time) {
    const p = clamp(progress, 0, 1);
    const front = p * CFG.microLedCount;
    const litCount = Math.floor(front);
    const frac = front - litCount;
    const activeIndex = clamp(litCount, 0, CFG.microLedCount - 1);

    this.tmpGold.setRGB(2.8, 1.58, 0.46);
    this.tmpWhite.setRGB(2.8, 2.55, 2.18);

    for (let i = 0; i < CFG.microLedCount; i++) {
      let level = 0;
      if (i < litCount) level = 1;
      else if (i === litCount) level = frac;

      const along = i / Math.max(1, CFG.microLedCount - 1);
      const whiteMix = clamp((along - 0.60) / 0.40, 0, 1) * p * 0.30;
      this.tmpMix.copy(this.tmpGold).lerp(this.tmpWhite, whiteMix);

      if (level > 0.001) {
        this.ledEmitter.setColorAt(i, this.tmpMix.clone().multiplyScalar(level * 5.4));
        this.ledHousing.setColorAt(i, new THREE.Color(0x5a401d).lerp(new THREE.Color(0xfff2cd), Math.min(1, level) * 0.92));
      } else {
        this.ledEmitter.setColorAt(i, this.tmpBlack);
        this.ledHousing.setColorAt(i, this.tmpHousingOff);
      }
    }

    this.ledEmitter.instanceColor.needsUpdate = true;
    this.ledHousing.instanceColor.needsUpdate = true;

    const frontPos = this.ledPositions[activeIndex] || this.ledPositions[0];
    this.tmpVec.copy(frontPos).add(CFG.ringCenter);
    ringSweepLight.position.copy(this.tmpVec);
    ringSweepLight.position.z += 0.58;
    ringSweepLight.intensity = 1.4 + frac * 4.4;
    ringSweepLight.distance = 13.5 + frac * 5.6;

    const bladePulse = 0.90 + Math.sin(time * 5.3) * 0.10 + p * 0.18;
    this.topBladeCore.material.opacity = bladePulse;

    this.outerShell.rotation.z += 0.00034;
    this.midBand.rotation.z -= 0.00018;
    this.innerRail.rotation.z += 0.00072;
    this.innerGoldFilament.rotation.z -= 0.0012;
    this.softHaloRing.rotation.z += 0.0005;

    this.bigHalo.material.opacity = 0.10 + p * 0.12;
    this.innerGoldFilament.material.opacity = 0.08 + p * 0.18;
    this.softHaloRing.material.opacity = 0.02 + p * 0.05;

    for (let i = 0; i < this.stripEmitters.length; i++) {
      const strip = this.stripEmitters[i];
      const wave = Math.sin(time * 1.9 + i * 1.6) * 0.5 + 0.5;
      strip.material.opacity = 0.20 + wave * 0.48;
    }

    this.rig.rotation.z = Math.sin(time * 0.15) * 0.006;
    this.rig.rotation.x = Math.sin(time * 0.13) * 0.008;
  }
}

const ring = new RingSystem(scene);

/* logo */
class LogoSystem {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);

    this.root = null;
    this.baseScale = 1;
    this.tmpScale = new THREE.Vector3();

    this.start = new THREE.Vector3(0, 9.5, -1.1);
    this.cp1 = new THREE.Vector3(0, 6.7, -5.2);
    this.cp2 = new THREE.Vector3(0, 1.45, -9.8);
    this.mid = new THREE.Vector3(0, 0.09, -10.35);
    this.final = CFG.ringCenter.clone();
  }

  makeObsidianMaps() {
    const roughnessMap = makeCanvasTexture((g, w, h) => {
      const img = g.createImageData(w, h);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.floor(8 + Math.random() * 22);
        img.data[i] = v;
        img.data[i + 1] = v;
        img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
      g.putImageData(img, 0, 0);
    }, 512);

    const bumpMap = makeCanvasTexture((g, w, h) => {
      g.fillStyle = 'rgb(120,120,120)';
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 1800; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const r = 0.22 + Math.random() * 1.0;
        const v = Math.floor(92 + Math.random() * 56);
        g.fillStyle = `rgb(${v},${v},${v})`;
        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.fill();
      }
    }, 512);

    roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
    bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
    roughnessMap.repeat.set(3.0, 3.0);
    bumpMap.repeat.set(3.0, 3.0);

    return { roughnessMap, bumpMap };
  }

  applyMaterial(root) {
    const maps = this.makeObsidianMaps();
    root.traverse((obj) => {
      if (!obj.isMesh || !obj.geometry) return;
      obj.material = new THREE.MeshPhysicalMaterial({
        color: 0x060709,
        metalness: 0.78,
        roughness: 0.045,
        transmission: 0.0,
        thickness: 0.0,
        ior: 1.56,
        envMapIntensity: 3.28,
        clearcoat: 1.0,
        clearcoatRoughness: 0.012,
        roughnessMap: maps.roughnessMap,
        bumpMap: maps.bumpMap,
        bumpScale: 0.010,
        specularIntensity: 1.0,
        specularColor: new THREE.Color(0xfdf5e8)
      });
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

  makeFallback() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.72, 0.19, 180, 24, 2, 3),
      blackGlassMat(0x090a0d)
    );
    g.add(body);
    this.baseScale = 1;
    return g;
  }

  load() {
    const loader = new GLTFLoader();
    loader.load(
      '/public/assets/logo7/logo7.glb',
      (gltf) => {
        this.root = gltf.scene;
        this.group.add(this.root);
        this.fit(this.root);
        this.applyMaterial(this.root);
        state.loaded = true;
      },
      undefined,
      () => {
        this.root = this.makeFallback();
        this.group.add(this.root);
        state.loaded = true;
      }
    );
  }

  update(progress, time) {
    if (!this.root) return;

    const p = clamp(progress, 0, 1);

    if (p <= 0.62) {
      const t1 = easeOutExpo(clamp(p / 0.62, 0, 1));
      const pos = cubicBezier3(this.start, this.cp1, this.cp2, this.mid, t1);
      this.group.position.lerp(pos, 0.14);

      this.group.rotation.x += (lerp(-0.67, -0.04, t1) - this.group.rotation.x) * 0.13;
      this.group.rotation.y += (lerp(0.50, 0.015, t1) - this.group.rotation.y) * 0.13;
      this.group.rotation.z += (0 - this.group.rotation.z) * 0.13;

      const scaleMul = lerp(5.6, 1.48, t1);
      this.tmpScale.setScalar(this.baseScale * scaleMul);
      this.root.scale.lerp(this.tmpScale, 0.16);

      this.root.rotation.y += CFG.preEnterSpinSpeed;
      this.root.rotation.x += (mouse3D.y * 0.18 - this.root.rotation.x) * 0.06;
      this.root.rotation.z += (mouse3D.x * 0.10 - this.root.rotation.z) * 0.06;
    } else {
      const t2 = easeInOutCubic(clamp((p - 0.62) / 0.38, 0, 1));
      const pos = cubicBezier3(
        this.mid,
        new THREE.Vector3(0, 0.08, -11.03),
        new THREE.Vector3(0, 0.02, -11.18),
        this.final,
        t2
      );
      this.group.position.lerp(pos, 0.18);

      this.group.rotation.x += (lerp(-0.04, -0.01, t2) - this.group.rotation.x) * 0.15;
      this.group.rotation.y += (lerp(0.015, 0.0, t2) - this.group.rotation.y) * 0.15;
      this.group.rotation.z += (0 - this.group.rotation.z) * 0.15;

      const holdMul = lerp(1.24, 1.03, t2);
      this.tmpScale.setScalar(this.baseScale * holdMul);
      this.root.scale.lerp(this.tmpScale, 0.16);

      const settledRotationSpeed = t2 < 0.5 ? 0.0012 : lerp(0.014, 0.032, clamp((t2 - 0.5) / 0.5, 0, 1));
      this.root.rotation.y += settledRotationSpeed;
      this.root.rotation.x += (Math.sin(time * 0.09) * 0.0009 - this.root.rotation.x) * 0.08;
      this.root.rotation.z += (0 - this.root.rotation.z) * 0.08;
    }

    logoAccentLight.position.x = this.group.position.x * 0.5;
    logoAccentLight.position.y = this.group.position.y * 0.35 + 0.35;
  }
}

const logo = new LogoSystem(scene);
logo.load();

/* UI */
menuBtn?.addEventListener('click', () => mobileMenu?.classList.add('open'));
closeMenuBtn?.addEventListener('click', () => mobileMenu?.classList.remove('open'));
mobileMenu?.addEventListener('click', (e) => {
  if (e.target === mobileMenu) mobileMenu.classList.remove('open');
});
document.querySelectorAll('.mobile-links a').forEach((a) => {
  a.addEventListener('click', () => mobileMenu?.classList.remove('open'));
});

const io = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add('in');
  });
}, { threshold: 0.12 });
revealEls.forEach((el) => io.observe(el));

function activateShellFX() {
  flare?.classList.add('active');
  gridOverlay?.classList.add('active');
  corners.forEach(el => el.classList.add('active'));
  huds.forEach(el => el.classList.add('active'));
  if (shell) shell.classList.add('live');
}

function triggerLaunchFX() {
  fxFlash?.classList.add('live');
  fxShock?.classList.add('live');
  setTimeout(() => fxFlash?.classList.remove('live'), 220);
  setTimeout(() => fxShock?.classList.remove('live'), 700);

  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;

    const master = ctx.createGain();
    master.gain.value = 0.03;
    master.connect(ctx.destination);

    const oscA = ctx.createOscillator();
    const oscB = ctx.createOscillator();
    const oscC = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(420, now);
    filter.frequency.exponentialRampToValueAtTime(2200, now + 0.36);

    oscA.type = 'sawtooth';
    oscB.type = 'triangle';
    oscC.type = 'sine';

    oscA.frequency.setValueAtTime(62, now);
    oscA.frequency.exponentialRampToValueAtTime(180, now + 0.42);

    oscB.frequency.setValueAtTime(120, now);
    oscB.frequency.exponentialRampToValueAtTime(620, now + 0.28);

    oscC.frequency.setValueAtTime(420, now);
    oscC.frequency.exponentialRampToValueAtTime(980, now + 0.12);

    oscA.connect(filter);
    oscB.connect(filter);
    oscC.connect(filter);
    filter.connect(master);

    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.05, now + 0.05);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

    oscA.start(now);
    oscB.start(now);
    oscC.start(now);
    oscA.stop(now + 0.82);
    oscB.stop(now + 0.82);
    oscC.stop(now + 0.18);
  } catch (_) {}
}

initBtn?.addEventListener('click', () => {
  if (!state.ready || state.entered) return;
  state.entered = true;
  triggerLaunchFX();

  if (preloader) {
    preloader.style.opacity = '0';
    preloader.style.pointerEvents = 'none';
    setTimeout(() => { preloader.style.display = 'none'; }, 900);
  }

  activateShellFX();
});

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const t = clock.getElapsedTime();
  const elapsed = performance.now() - state.startedAt;
  const target = clamp(elapsed / CFG.preloadMs, 0, 1);

  if (!state.loaded) state.progress += (Math.min(target, 0.9) - state.progress) * 0.032;
  else state.progress += (1 - state.progress) * 0.052;

  if (state.loaded && state.progress > 0.995 && !state.ready) {
    state.ready = true;
    if (initBtn) {
      initBtn.style.display = 'block';
      requestAnimationFrame(() => initBtn.style.opacity = '1');
    }
  }

  if (preloadPercent) {
    preloadPercent.textContent = String(Math.round(clamp(state.progress, 0, 1) * 100)).padStart(3, '0');
  }

  if (progressFill) {
    progressFill.style.width = `${clamp(state.progress, 0, 1) * 100}%`;
    progressFill.style.background = 'linear-gradient(90deg, rgba(255,190,100,0.88), rgba(255,232,184,1))';
  }

  ring.update(state.progress, t);
  logo.update(state.progress, t);
  dust.update(t);

  const cameraYaw = 5.3 * Math.PI / 180;
  const cameraLift = Math.sin(t * 0.14) * 0.04;
  camera.position.set(Math.sin(cameraYaw) * CFG.cameraZ, cameraLift, Math.cos(cameraYaw) * CFG.cameraZ);
  camera.lookAt(CFG.ringCenter);

  bloomPass.strength = lerp(CFG.bloomBase, CFG.bloomPeak, clamp(state.progress, 0, 1));
  composer.render();
}
animate();

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  renderer.setPixelRatio(CFG.dpr);
  composer.setSize(w, h);
}
window.addEventListener('resize', resize);
resize();
