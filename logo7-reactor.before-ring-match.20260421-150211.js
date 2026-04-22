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
  preloadMs: 7600,
  exposure: 1.14,
  bloomBase: 0.28,
  bloomPeak: 1.28,
  bloomRadius: 0.9,
  bloomThreshold: 0.78,

  ringRadius: 2.72,
  ringCenter: new THREE.Vector3(0, 0, -11.15),
  cameraZ: 7.35,
  logoTargetSize: 3.10,

  ledCount: 104,
  emitterCount: 24,
  armorCount: 28,
  dustCount: 220,
  atomCount: 9000,
  lightningArcCount: 10,

  preEnterSpinSpeed: 0.011,
  dpr: Math.min(window.innerWidth < 900 ? 1.2 : 1.45, window.devicePixelRatio || 1.35)
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
    clearcoatRoughness: Math.max(0.012, roughness * 0.42),
    envMapIntensity
  });
}

function blackGlassMat(color = 0x06070a) {
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.74,
    roughness: 0.05,
    transmission: 0.0,
    thickness: 0.0,
    ior: 1.56,
    envMapIntensity: 3.25,
    clearcoat: 1.0,
    clearcoatRoughness: 0.014,
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

function randomPointOnTriangle(a, b, c, target) {
  let u = Math.random();
  let v = Math.random();
  if (u + v > 1) {
    u = 1 - u;
    v = 1 - v;
  }
  target.copy(a).addScaledVector(b.clone().sub(a), u).addScaledVector(c.clone().sub(a), v);
  return target;
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
scene.add(new THREE.AmbientLight(0xffffff, 0.028));

const key = new THREE.DirectionalLight(0xfff7ea, 1.05);
key.position.set(4.8, 5.4, 3.8);
scene.add(key);

const fill = new THREE.DirectionalLight(0xe3ecff, 0.34);
fill.position.set(-4.4, 1.8, 2.6);
scene.add(fill);

const warmBack = new THREE.PointLight(0xffb048, 1.7, 26, 2);
warmBack.position.set(0, 0.06, CFG.ringCenter.z + 1.9);
scene.add(warmBack);

const goldSpec = new THREE.PointLight(0xfff2d8, 0.66, 16, 2);
goldSpec.position.set(0.15, 2.3, -7.0);
scene.add(goldSpec);

const greenEnergyLight = new THREE.PointLight(0x64ff9d, 0.95, 18, 2);
greenEnergyLight.position.set(0, 0, CFG.ringCenter.z + 0.4);
scene.add(greenEnergyLight);

const ledSweepLight = new THREE.PointLight(0xffb75e, 0.0, 16, 2);
scene.add(ledSweepLight);

const topBladeLight = new THREE.PointLight(0xffdca2, 3.2, 20, 2);
topBladeLight.position.set(0, 2.9, -9.7);
scene.add(topBladeLight);

const logoAccentLight = new THREE.PointLight(0xfff7ee, 0.62, 12, 2);
logoAccentLight.position.set(0, 0.28, -8.2);
scene.add(logoAccentLight);

const chamberHaze = makeGlowSprite([
  [0.00, 'rgba(255,208,130,0.18)'],
  [0.10, 'rgba(255,148,32,0.10)'],
  [0.28, 'rgba(120,255,170,0.06)'],
  [1.00, 'rgba(255,255,255,0.0)']
], 13.2, 0.19, 512);
chamberHaze.position.set(0, -0.18, CFG.ringCenter.z + 0.62);
scene.add(chamberHaze);

/* dust */
class DustField {
  constructor(scene) {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(CFG.dustCount * 3);

    for (let i = 0; i < CFG.dustCount; i++) {
      const r = 2.2 + Math.random() * 4.8;
      const a = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 4.8;
      positions[i * 3 + 0] = Math.cos(a) * r;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = CFG.ringCenter.z + (Math.random() - 0.5) * 3.8;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xffd28b,
      transparent: true,
      opacity: 0.14,
      size: 0.024,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.points = new THREE.Points(geo, mat);
    scene.add(this.points);
  }

  update(time) {
    this.points.rotation.z = time * 0.01;
    this.points.rotation.y = time * 0.02;
  }
}
const dust = new DustField(scene);

/* alien lightning */
class LightningRing {
  constructor(parent) {
    this.group = new THREE.Group();
    parent.add(this.group);
    this.arcs = [];

    for (let i = 0; i < CFG.lightningArcCount; i++) {
      const mat = new THREE.LineBasicMaterial({
        color: 0x71ff8d,
        transparent: true,
        opacity: 0.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false
      });
      const geo = new THREE.BufferGeometry();
      const pts = new Float32Array(18 * 3);
      geo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
      const line = new THREE.Line(geo, mat);
      line.userData = {
        angle: (i / CFG.lightningArcCount) * Math.PI * 2,
        span: 0.35 + Math.random() * 0.28,
        speed: 0.8 + Math.random() * 1.4,
        phase: Math.random() * Math.PI * 2
      };
      this.group.add(line);
      this.arcs.push(line);
    }
  }

  update(time, progress) {
    for (const line of this.arcs) {
      const { angle, span, speed, phase } = line.userData;
      const pos = line.geometry.attributes.position.array;
      const count = 18;
      const pulse = Math.sin(time * speed + phase) * 0.5 + 0.5;
      const on = pulse > 0.75 ? (pulse - 0.75) / 0.25 : 0;
      line.material.opacity = on * (0.18 + progress * 0.24);

      for (let i = 0; i < count; i++) {
        const t = i / (count - 1);
        const a = angle + (t - 0.5) * span;
        const radius = CFG.ringRadius - 0.03 + Math.sin(time * 7 + i * 1.9 + phase) * 0.02;
        const z = 0.11 + Math.sin(time * 9 + i * 0.7 + phase) * 0.025;

        pos[i * 3 + 0] = Math.cos(a) * radius;
        pos[i * 3 + 1] = Math.sin(a) * radius;
        pos[i * 3 + 2] = z;
      }
      line.geometry.attributes.position.needsUpdate = true;
    }
  }
}

/* ring */
class RingSystem {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.position.copy(CFG.ringCenter);
    scene.add(this.group);

    this.rig = new THREE.Group();
    this.group.add(this.rig);

    this.outer = new THREE.Mesh(
      new THREE.TorusGeometry(CFG.ringRadius, 0.125, 32, 320),
      metalMat(0x030405, 0.028, 1.0, 1.0, 3.4)
    );
    this.rig.add(this.outer);

    this.midArmor = new THREE.Mesh(
      new THREE.TorusGeometry(CFG.ringRadius + 0.01, 0.055, 20, 280),
      metalMat(0x08090c, 0.042, 1.0, 1.0, 3.1)
    );
    this.rig.add(this.midArmor);

    this.innerRail = new THREE.Mesh(
      new THREE.TorusGeometry(CFG.ringRadius - 0.16, 0.024, 18, 280),
      metalMat(0x14161b, 0.018, 1.0, 1.0, 3.2)
    );
    this.rig.add(this.innerRail);

    this.greenCore = new THREE.Mesh(
      new THREE.TorusGeometry(CFG.ringRadius - 0.21, 0.012, 16, 240),
      emissiveMat(0x6fff90, 0.10)
    );
    this.rig.add(this.greenCore);

    this.goldEdge = new THREE.Mesh(
      new THREE.TorusGeometry(CFG.ringRadius - 0.215, 0.006, 16, 240),
      emissiveMat(0xffcd78, 0.14)
    );
    this.rig.add(this.goldEdge);

    this.haloRing = new THREE.Mesh(
      new THREE.TorusGeometry(CFG.ringRadius - 0.21, 0.018, 16, 180),
      new THREE.MeshBasicMaterial({
        color: 0x64ff9d,
        transparent: true,
        opacity: 0.035,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false
      })
    );
    this.rig.add(this.haloRing);

    this.bigHalo = makeGlowSprite([
      [0.00, 'rgba(255,240,220,0.20)'],
      [0.07, 'rgba(255,180,78,0.12)'],
      [0.22, 'rgba(120,255,160,0.10)'],
      [0.44, 'rgba(255,255,255,0.02)'],
      [1.00, 'rgba(255,255,255,0.0)']
    ], 9.0, 0.15, 512);
    this.group.add(this.bigHalo);

    this.buildArmor();
    this.buildLEDs();
    this.buildEmitters();
    this.buildTopBlade();
    this.lightning = new LightningRing(this.rig);
  }

  buildArmor() {
    const geo = new THREE.BoxGeometry(0.34, 0.13, 0.14);
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0x07080b,
      metalness: 1.0,
      roughness: 0.036,
      clearcoat: 1.0,
      clearcoatRoughness: 0.014,
      envMapIntensity: 3.3,
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
      s.set(1.0, i % 4 === 0 ? 1.8 : (i % 2 ? 1.12 : 1.38), 1.0);
      p.set(Math.cos(a) * (CFG.ringRadius + 0.03), Math.sin(a) * (CFG.ringRadius + 0.03), 0.10);
      q.setFromEuler(new THREE.Euler(0, 0, a));
      m.compose(p, q, s);
      this.armor.setMatrixAt(i, m);
      c.setHex(i % 2 ? 0x0b0d11 : 0x04050a);
      this.armor.setColorAt(i, c);
    }

    this.armor.instanceMatrix.needsUpdate = true;
    this.armor.instanceColor.needsUpdate = true;
    this.rig.add(this.armor);
  }

  buildLEDs() {
    this.ledPositions = [];

    const housingGeo = new THREE.BoxGeometry(0.052, 0.028, 0.038);
    const housingMat = new THREE.MeshPhysicalMaterial({
      color: 0x110d09,
      metalness: 0.32,
      roughness: 0.12,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      vertexColors: true
    });

    const emitterGeo = new THREE.BoxGeometry(0.028, 0.010, 0.010);
    const emitterMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false
    });

    this.ledHousing = new THREE.InstancedMesh(housingGeo, housingMat, CFG.ledCount);
    this.ledEmitter = new THREE.InstancedMesh(emitterGeo, emitterMat, CFG.ledCount);

    this.ledHousing.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    this.ledEmitter.instanceMatrix.setUsage(THREE.StaticDrawUsage);

    this.ledHousing.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(CFG.ledCount * 3), 3);
    this.ledEmitter.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(CFG.ledCount * 3), 3);

    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3(1, 1, 1);
    const p = new THREE.Vector3();
    const darkHousing = new THREE.Color(0x110d09);
    const darkEmitter = new THREE.Color(0x000000);

    for (let i = 0; i < CFG.ledCount; i++) {
      const a = Math.PI / 2 + (i / CFG.ledCount) * Math.PI * 2;
      const radius = CFG.ringRadius - 0.13;

      p.set(Math.cos(a) * radius, Math.sin(a) * radius, 0.148);
      q.setFromEuler(new THREE.Euler(0, 0, a));
      m.compose(p, q, s);
      this.ledHousing.setMatrixAt(i, m);
      this.ledHousing.setColorAt(i, darkHousing);

      p.set(Math.cos(a) * radius, Math.sin(a) * radius, 0.17);
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
    this.tmpGreen = new THREE.Color();
    this.tmpMix = new THREE.Color();
    this.tmpBlack = new THREE.Color(0x000000);
    this.tmpHousingOff = new THREE.Color(0x110d09);
    this.tmpVec = new THREE.Vector3();
  }

  buildEmitters() {
    this.emitters = [];
    this.emitterGlows = [];

    const bodyGeo = new THREE.BoxGeometry(0.24, 0.05, 0.08);
    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: 0x090a0d,
      metalness: 1.0,
      roughness: 0.026,
      clearcoat: 1.0,
      clearcoatRoughness: 0.015,
      envMapIntensity: 3.2
    });

    for (let i = 0; i < CFG.emitterCount; i++) {
      const g = new THREE.Group();
      const a = (i / CFG.emitterCount) * Math.PI * 2 + (i % 2 ? 0.036 : -0.022);
      g.position.set(Math.cos(a) * (CFG.ringRadius + 0.04), Math.sin(a) * (CFG.ringRadius + 0.04), 0.11);
      g.rotation.z = a;

      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.scale.y = i % 3 === 0 ? 1.55 : (i % 2 ? 0.86 : 1.16);
      g.add(body);

      const slit = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.010, 0.012),
        new THREE.MeshBasicMaterial({
          color: 0xffcb75,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          toneMapped: false
        })
      );
      slit.position.z = 0.048;
      g.add(slit);

      this.rig.add(g);
      this.emitters.push(g);
      this.emitterGlows.push(slit);
    }
  }

  buildTopBlade() {
    this.topBladeRig = new THREE.Group();
    this.topBladeRig.position.set(0, CFG.ringRadius + 0.02, 0.18);
    this.rig.add(this.topBladeRig);

    const housing = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.48, 0.16),
      metalMat(0x06070a, 0.026, 1.0, 1.0, 3.3)
    );
    this.topBladeRig.add(housing);

    this.topBladeCore = new THREE.Mesh(
      new THREE.BoxGeometry(0.048, 0.72, 0.03),
      new THREE.MeshBasicMaterial({
        color: 0xffdca1,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false
      })
    );
    this.topBladeRig.add(this.topBladeCore);
  }

  update(progress, time) {
    const p = clamp(progress, 0, 1);
    const front = p * CFG.ledCount;
    const litCount = Math.floor(front);
    const frac = front - litCount;
    const activeIndex = clamp(litCount, 0, CFG.ledCount - 1);

    this.tmpGold.setRGB(2.7, 1.54, 0.46);
    this.tmpGreen.setRGB(0.55, 2.6, 0.95);

    for (let i = 0; i < CFG.ledCount; i++) {
      let level = 0;
      if (i < litCount) level = 1;
      else if (i === litCount) level = frac;

      const along = i / Math.max(1, CFG.ledCount - 1);
      const greenMix = clamp((Math.sin(along * Math.PI * 5 + time * 0.9) * 0.5 + 0.5) * 0.28, 0, 0.28);
      this.tmpMix.copy(this.tmpGold).lerp(this.tmpGreen, greenMix);

      if (level > 0.001) {
        this.ledEmitter.setColorAt(i, this.tmpMix.clone().multiplyScalar(level * 5.2));
        this.ledHousing.setColorAt(i, new THREE.Color(0x5c4120).lerp(new THREE.Color(0xfff1cb), Math.min(1, level) * 0.90));
      } else {
        this.ledEmitter.setColorAt(i, this.tmpBlack);
        this.ledHousing.setColorAt(i, this.tmpHousingOff);
      }
    }

    this.ledEmitter.instanceColor.needsUpdate = true;
    this.ledHousing.instanceColor.needsUpdate = true;

    const frontPos = this.ledPositions[activeIndex] || this.ledPositions[0];
    this.tmpVec.copy(frontPos).add(CFG.ringCenter);
    ledSweepLight.position.copy(this.tmpVec);
    ledSweepLight.position.z += 0.58;
    ledSweepLight.intensity = 1.4 + frac * 4.2;
    ledSweepLight.distance = 13.0 + frac * 5.8;

    const bladePulse = 0.88 + Math.sin(time * 5.2) * 0.12 + p * 0.22;
    this.topBladeCore.material.opacity = bladePulse;
    this.topBladeRig.rotation.z = Math.sin(time * 0.42) * 0.01;

    this.outer.rotation.z += 0.0004;
    this.midArmor.rotation.z -= 0.00025;
    this.innerRail.rotation.z += 0.0009;
    this.greenCore.rotation.z -= 0.0014;
    this.goldEdge.rotation.z += 0.0007;

    this.bigHalo.material.opacity = 0.10 + p * 0.14;
    this.greenCore.material.opacity = 0.04 + p * 0.24;
    this.goldEdge.material.opacity = 0.08 + p * 0.16;
    this.haloRing.material.opacity = 0.025 + (Math.sin(time * 3.8) * 0.5 + 0.5) * 0.06;

    for (let i = 0; i < this.emitterGlows.length; i++) {
      const g = this.emitterGlows[i];
      const wave = (Math.sin(time * 1.9 + i * 1.8) * 0.5 + 0.5);
      const threshold = 0.67;
      const on = wave > threshold ? (wave - threshold) / (1 - threshold) : 0;
      g.material.opacity = 0.02 + on * (0.44 + p * 0.34);
    }

    this.lightning.update(time, p);

    this.rig.rotation.z = Math.sin(time * 0.16) * 0.009;
    this.rig.rotation.x = Math.sin(time * 0.14) * 0.012;
  }
}

const ring = new RingSystem(scene);

/* atom dissolve */
class LogoAtomizer {
  constructor(parentGroup) {
    this.group = new THREE.Group();
    parentGroup.add(this.group);
    this.points = null;
    this.meta = null;
    this.material = null;
    this.ready = false;
  }

  buildFromRoot(root) {
    const sampled = [];
    const tmp = new THREE.Vector3();
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    const c = new THREE.Vector3();

    root.updateWorldMatrix(true, true);

    root.traverse((obj) => {
      if (!obj.isMesh || !obj.geometry || !obj.geometry.attributes?.position) return;

      const geom = obj.geometry.index ? obj.geometry.toNonIndexed() : obj.geometry.clone();
      const pos = geom.attributes.position;
      const matrix = obj.matrixWorld;

      const triCount = Math.floor(pos.count / 3);
      const perMesh = Math.max(300, Math.floor(CFG.atomCount / 6));

      for (let i = 0; i < perMesh; i++) {
        const tri = Math.floor(Math.random() * triCount);
        a.fromBufferAttribute(pos, tri * 3 + 0).applyMatrix4(matrix);
        b.fromBufferAttribute(pos, tri * 3 + 1).applyMatrix4(matrix);
        c.fromBufferAttribute(pos, tri * 3 + 2).applyMatrix4(matrix);
        randomPointOnTriangle(a, b, c, tmp);

        sampled.push({
          x: tmp.x, y: tmp.y, z: tmp.z,
          side: tmp.x >= 0 ? 1 : -1,
          drift: Math.random(),
          rise: Math.random(),
          seed: Math.random() * Math.PI * 2
        });
      }
    });

    const count = sampled.length;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const p = sampled[i];
      positions[i * 3 + 0] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;

      const warm = 0.65 + Math.random() * 0.35;
      colors[i * 3 + 0] = 0.55 + warm * 0.45;
      colors[i * 3 + 1] = 0.75 + warm * 0.18;
      colors[i * 3 + 2] = 0.42 + Math.random() * 0.12;
      sizes[i] = 1.0 + Math.random() * 2.0;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

    this.material = new THREE.PointsMaterial({
      size: 0.028,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.0,
      vertexColors: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.points = new THREE.Points(geo, this.material);
    this.group.add(this.points);
    this.meta = sampled;
    this.ready = true;
  }

  update(progress, time) {
    if (!this.ready) return;

    const dissolveStart = 0.68;
    const dissolveT = clamp((progress - dissolveStart) / (1 - dissolveStart), 0, 1);
    const pull = easeInOutCubic(dissolveT);

    this.material.opacity = pull * 0.95;

    const pos = this.points.geometry.attributes.position.array;
    for (let i = 0; i < this.meta.length; i++) {
      const m = this.meta[i];
      const idx = i * 3;

      const sidePull = m.side * pull * (0.9 + m.drift * 1.6);
      const noiseX = Math.sin(time * 9 + m.seed) * 0.03 * pull;
      const noiseY = Math.cos(time * 7 + m.seed * 1.7) * 0.02 * pull;
      const jitterZ = Math.sin(time * 8 + m.seed * 2.3) * 0.05 * pull;

      pos[idx + 0] = m.x + sidePull + noiseX;
      pos[idx + 1] = m.y + noiseY + (m.rise - 0.5) * pull * 0.18;
      pos[idx + 2] = m.z + jitterZ - pull * 0.08;
    }
    this.points.geometry.attributes.position.needsUpdate = true;
  }
}

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

    this.atomizer = new LogoAtomizer(this.group);
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
        roughness: 0.047,
        transmission: 0.0,
        thickness: 0.0,
        ior: 1.56,
        envMapIntensity: 3.28,
        clearcoat: 1.0,
        clearcoatRoughness: 0.014,
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
        this.atomizer.buildFromRoot(this.root);
        state.loaded = true;
      },
      undefined,
      () => {
        this.root = this.makeFallback();
        this.group.add(this.root);
        this.atomizer.buildFromRoot(this.root);
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

    const dissolveStart = 0.68;
    const dissolveT = clamp((p - dissolveStart) / (1 - dissolveStart), 0, 1);
    const fade = 1 - easeInOutCubic(dissolveT);

    this.root.traverse((obj) => {
      if (!obj.isMesh || !obj.material) return;
      obj.material.transparent = true;
      obj.material.opacity = fade;
    });

    this.atomizer.update(p, time);

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
    progressFill.style.background = 'linear-gradient(90deg, rgba(255,190,100,0.9), rgba(255,230,180,1))';
  }

  ring.update(state.progress, t);
  logo.update(state.progress, t);
  dust.update(t);

  const cameraYaw = 5.3 * Math.PI / 180;
  const cameraLift = Math.sin(t * 0.14) * 0.04;
  camera.position.set(Math.sin(cameraYaw) * CFG.cameraZ, cameraLift, Math.cos(cameraYaw) * CFG.cameraZ);
  camera.lookAt(CFG.ringCenter);

  greenEnergyLight.intensity = 0.55 + Math.sin(t * 3.8) * 0.12 + state.progress * 0.18;
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
