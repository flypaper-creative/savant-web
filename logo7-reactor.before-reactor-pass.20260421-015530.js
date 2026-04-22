import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const canvas = document.getElementById('bg3d');
const preloader = document.getElementById('preloader');
const shell = document.getElementById('shell');
const initBtn = document.getElementById('initBtn');
const preloadPercent = document.getElementById('preloadPercent');
const menuBtn = document.getElementById('menuBtn');
const closeMenuBtn = document.getElementById('closeMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');
const fxFlash = document.getElementById('fxFlash');
const fxShock = document.getElementById('fxShock');
const revealEls = [...document.querySelectorAll('.reveal')];

const CFG = {
  preloadMs: 7200,
  exposure: 1.02,
  bloomBase: 0.24,
  bloomPeak: 1.05,
  bloomRadius: 0.92,
  bloomThreshold: 0.76,

  ringRadius: 2.56,
  ringCenter: new THREE.Vector3(0, 0, -10.85),
  cameraZ: 6.95,
  logoTargetSize: 3.05,

  ledCount: 84,
  emitterCount: 18,
  shardCount: 12,

  preEnterSpinSpeed: 0.012,
  dpr: Math.min(window.innerWidth < 900 ? 1.25 : 1.55, window.devicePixelRatio || 1.5)
};

const state = {
  startedAt: performance.now(),
  loaded: false,
  ready: false,
  progress: 0,
  entered: false
};

const mouse3D = { x: 0, y: 0 };
window.addEventListener('mousemove', (e) => {
  mouse3D.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse3D.y = -((e.clientY / window.innerHeight) * 2 - 1);
});

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

function metalMat(color, roughness, metalness = 1.0, clearcoat = 1.0, envMapIntensity = 2.8) {
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness,
    roughness,
    clearcoat,
    clearcoatRoughness: Math.max(0.018, roughness * 0.45),
    envMapIntensity
  });
}

function emissiveMat(color, opacity = 0.6) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false
  });
}

function blackGlassMat(color = 0x08090c) {
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.28,
    roughness: 0.06,
    transmission: 0.0,
    thickness: 0.0,
    ior: 1.52,
    envMapIntensity: 2.55,
    clearcoat: 1.0,
    clearcoatRoughness: 0.018,
    specularIntensity: 1.0
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
scene.background = new THREE.Color(0x040507);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.018).texture;

const camera = new THREE.PerspectiveCamera(36, window.innerWidth / window.innerHeight, 0.1, 140);
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
scene.add(new THREE.AmbientLight(0xffffff, 0.032));

const key = new THREE.DirectionalLight(0xfff4ea, 0.92);
key.position.set(4.2, 4.8, 3.2);
scene.add(key);

const fill = new THREE.DirectionalLight(0xd9e7ff, 0.32);
fill.position.set(-3.8, 1.5, 2.2);
scene.add(fill);

const topBlade = new THREE.PointLight(0xffdc9b, 2.6, 20, 2);
topBlade.position.set(0, 2.68, -9.55);
scene.add(topBlade);

const warmBack = new THREE.PointLight(0xffb04a, 1.45, 26, 2);
warmBack.position.set(0, 0.05, CFG.ringCenter.z + 1.7);
scene.add(warmBack);

const coldSpec = new THREE.PointLight(0xf8fbff, 0.48, 16, 2);
coldSpec.position.set(0.2, 2.0, -7.5);
scene.add(coldSpec);

const ledSweepLight = new THREE.PointLight(0xffb45f, 0.0, 14.5, 2);
scene.add(ledSweepLight);

const logoAccentLight = new THREE.PointLight(0xfff6ea, 0.45, 12, 2);
logoAccentLight.position.set(0, 0.3, -8.4);
scene.add(logoAccentLight);

/* chamber haze */
const haze = makeGlowSprite([
  [0.00, 'rgba(255,190,115,0.16)'],
  [0.18, 'rgba(255,125,20,0.08)'],
  [0.40, 'rgba(255,255,255,0.03)'],
  [1.00, 'rgba(255,255,255,0.0)'],
], 12.5, 0.18, 512);
haze.position.set(0, -0.25, CFG.ringCenter.z + 0.55);
scene.add(haze);

/* ring system */
class RingSystem {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.position.copy(CFG.ringCenter);
    scene.add(this.group);

    this.rig = new THREE.Group();
    this.group.add(this.rig);

    this.outer = new THREE.Mesh(
      new THREE.TorusGeometry(CFG.ringRadius, 0.13, 28, 280),
      metalMat(0x050608, 0.038, 1.0, 1.0, 3.1)
    );
    this.rig.add(this.outer);

    this.armorOuter = new THREE.Mesh(
      new THREE.TorusGeometry(CFG.ringRadius + 0.015, 0.06, 18, 220),
      metalMat(0x0b0d12, 0.052, 1.0, 1.0, 2.8)
    );
    this.rig.add(this.armorOuter);

    this.innerRail = new THREE.Mesh(
      new THREE.TorusGeometry(CFG.ringRadius - 0.16, 0.028, 16, 220),
      metalMat(0x1a1c20, 0.024, 1.0, 1.0, 2.9)
    );
    this.rig.add(this.innerRail);

    this.innerCore = new THREE.Mesh(
      new THREE.TorusGeometry(CFG.ringRadius - 0.215, 0.014, 14, 180),
      emissiveMat(0xffd07e, 0.065)
    );
    this.rig.add(this.innerCore);

    this.haloA = new THREE.Mesh(
      new THREE.TorusGeometry(CFG.ringRadius - 0.205, 0.022, 14, 180),
      new THREE.MeshBasicMaterial({
        color: 0xff9d2f,
        transparent: true,
        opacity: 0.045,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false
      })
    );
    this.rig.add(this.haloA);

    this.haloB = makeGlowSprite([
      [0.00, 'rgba(255,238,220,0.26)'],
      [0.06, 'rgba(255,168,75,0.16)'],
      [0.20, 'rgba(255,115,20,0.07)'],
      [0.42, 'rgba(255,255,255,0.02)'],
      [1.00, 'rgba(255,255,255,0.0)']
    ], 8.4, 0.14, 512);
    this.group.add(this.haloB);

    this.buildArmor();
    this.buildLEDs();
    this.buildEmitters();
    this.buildTopBlade();
  }

  buildArmor() {
    const count = 20;
    const geo = new THREE.BoxGeometry(0.42, 0.18, 0.15);
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0x08090c,
      metalness: 1.0,
      roughness: 0.05,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      envMapIntensity: 3.1,
      vertexColors: true
    });

    this.armor = new THREE.InstancedMesh(geo, mat, count);
    this.armor.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    this.armor.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);

    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3(1, 1, 1);
    const p = new THREE.Vector3();
    const c = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const scaleY = i % 3 === 0 ? 1.65 : (i % 2 ? 1.15 : 1.38);
      s.set(1.0, scaleY, 1.0);
      p.set(Math.cos(a) * (CFG.ringRadius + 0.01), Math.sin(a) * (CFG.ringRadius + 0.01), 0.09);
      q.setFromEuler(new THREE.Euler(0, 0, a));
      m.compose(p, q, s);
      this.armor.setMatrixAt(i, m);
      c.setHex(i % 2 ? 0x101216 : 0x07080b);
      this.armor.setColorAt(i, c);
    }

    this.armor.instanceMatrix.needsUpdate = true;
    this.armor.instanceColor.needsUpdate = true;
    this.rig.add(this.armor);
  }

  buildLEDs() {
    this.ledCount = CFG.ledCount;
    this.ledStartAngle = Math.PI / 2;
    this.ledPositions = [];

    const housingGeo = new THREE.BoxGeometry(0.085, 0.05, 0.05);
    const housingMat = new THREE.MeshPhysicalMaterial({
      color: 0x100d0a,
      metalness: 0.35,
      roughness: 0.14,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      vertexColors: true
    });

    const emitterGeo = new THREE.BoxGeometry(0.052, 0.022, 0.012);
    const emitterMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false
    });

    this.ledHousing = new THREE.InstancedMesh(housingGeo, housingMat, this.ledCount);
    this.ledEmitter = new THREE.InstancedMesh(emitterGeo, emitterMat, this.ledCount);

    this.ledHousing.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    this.ledEmitter.instanceMatrix.setUsage(THREE.StaticDrawUsage);

    this.ledHousing.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(this.ledCount * 3), 3);
    this.ledEmitter.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(this.ledCount * 3), 3);

    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3(1, 1, 1);
    const p = new THREE.Vector3();
    const darkHousing = new THREE.Color(0x100d0a);
    const darkEmitter = new THREE.Color(0x000000);

    for (let i = 0; i < this.ledCount; i++) {
      const a = this.ledStartAngle + (i / this.ledCount) * Math.PI * 2;
      const radius = CFG.ringRadius - 0.135;

      p.set(Math.cos(a) * radius, Math.sin(a) * radius, 0.142);
      q.setFromEuler(new THREE.Euler(0, 0, a));
      m.compose(p, q, s);
      this.ledHousing.setMatrixAt(i, m);
      this.ledHousing.setColorAt(i, darkHousing);

      p.set(Math.cos(a) * radius, Math.sin(a) * radius, 0.168);
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
    this.tmpHousingOff = new THREE.Color(0x100d0a);
    this.tmpVec = new THREE.Vector3();
  }

  buildEmitters() {
    const count = CFG.emitterCount;
    const geo = new THREE.BoxGeometry(0.38, 0.07, 0.10);
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0x0b0c10,
      metalness: 1.0,
      roughness: 0.03,
      clearcoat: 1.0,
      clearcoatRoughness: 0.018,
      envMapIntensity: 3.1
    });
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffc66a,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false
    });

    this.emitters = [];
    this.emitterGlows = [];

    for (let i = 0; i < count; i++) {
      const g = new THREE.Group();
      const a = (i / count) * Math.PI * 2 + (i % 2 ? 0.035 : -0.022);
      g.position.set(Math.cos(a) * (CFG.ringRadius + 0.03), Math.sin(a) * (CFG.ringRadius + 0.03), 0.12);
      g.rotation.z = a;

      const body = new THREE.Mesh(geo, mat);
      body.scale.y = i % 3 === 0 ? 1.4 : (i % 2 ? 0.85 : 1.18);
      g.add(body);

      const slit = new THREE.Mesh(
        new THREE.BoxGeometry(0.26, 0.016, 0.015),
        glowMat.clone()
      );
      slit.position.z = 0.062;
      g.add(slit);

      this.rig.add(g);
      this.emitters.push(g);
      this.emitterGlows.push(slit);
    }
  }

  buildTopBlade() {
    this.topBladeRig = new THREE.Group();
    this.topBladeRig.position.set(0, CFG.ringRadius + 0.005, 0.17);
    this.rig.add(this.topBladeRig);

    const bladeHousing = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.48, 0.18),
      metalMat(0x07080a, 0.035, 1.0, 1.0, 3.2)
    );
    this.topBladeRig.add(bladeHousing);

    this.topBladeCore = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.68, 0.03),
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
    const front = p * this.ledCount;
    const litCount = Math.floor(front);
    const frac = front - litCount;
    const activeIndex = clamp(litCount, 0, this.ledCount - 1);

    this.tmpGold.setRGB(2.6, 1.48, 0.46);
    this.tmpWhite.setRGB(2.8, 2.55, 2.15);

    for (let i = 0; i < this.ledCount; i++) {
      let level = 0;
      if (i < litCount) level = 1;
      else if (i === litCount) level = frac;

      const along = i / Math.max(1, this.ledCount - 1);
      const whiteMix = clamp((along - 0.55) / 0.45, 0, 1) * p * 0.35;
      this.tmpMix.copy(this.tmpGold).lerp(this.tmpWhite, whiteMix);

      if (level > 0.001) {
        this.ledEmitter.setColorAt(i, this.tmpMix.clone().multiplyScalar(level * 4.8));
        this.ledHousing.setColorAt(i, new THREE.Color(0x62431e).lerp(new THREE.Color(0xfff0c7), Math.min(1, level) * 0.88));
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
    ledSweepLight.position.z += 0.52;
    ledSweepLight.intensity = 1.35 + frac * 3.8;
    ledSweepLight.distance = 12.5 + frac * 5.5;

    const bladePulse = 0.88 + Math.sin(time * 5.2) * 0.12 + p * 0.18;
    this.topBladeCore.material.opacity = bladePulse;
    this.topBladeRig.rotation.z = Math.sin(time * 0.42) * 0.012;

    this.outer.rotation.z += 0.0006;
    this.armorOuter.rotation.z -= 0.00035;
    this.innerRail.rotation.z += 0.0012;
    this.innerCore.rotation.z -= 0.0016;
    this.haloA.rotation.z += 0.0008;

    this.haloB.material.opacity = 0.11 + p * 0.12;
    this.innerCore.material.opacity = 0.04 + p * 0.22;
    this.haloA.material.opacity = 0.03 + p * 0.07;

    for (let i = 0; i < this.emitterGlows.length; i++) {
      const g = this.emitterGlows[i];
      const wave = (Math.sin(time * 1.8 + i * 1.91) * 0.5 + 0.5);
      const threshold = 0.68;
      const on = wave > threshold ? (wave - threshold) / (1 - threshold) : 0;
      g.material.opacity = 0.02 + on * (0.45 + p * 0.3);
    }

    // subtle predatory asymmetry
    this.rig.rotation.z = Math.sin(time * 0.17) * 0.012;
    this.rig.rotation.x = Math.sin(time * 0.14) * 0.018;
  }
}

const ring = new RingSystem(scene);

/* logo system */
class LogoSystem {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);

    this.root = null;
    this.baseScale = 1;
    this.tmpScale = new THREE.Vector3();

    this.start = new THREE.Vector3(0, 9.6, -1.2);
    this.cp1 = new THREE.Vector3(0, 6.8, -5.2);
    this.cp2 = new THREE.Vector3(0, 1.5, -9.7);
    this.mid = new THREE.Vector3(0, 0.10, -10.25);
    this.final = CFG.ringCenter.clone();
  }

  makeObsidianMaps() {
    const roughnessMap = makeCanvasTexture((g, w, h) => {
      const img = g.createImageData(w, h);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.floor(10 + Math.random() * 24);
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
      for (let i = 0; i < 1700; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const r = 0.22 + Math.random() * 1.0;
        const v = Math.floor(92 + Math.random() * 58);
        g.fillStyle = `rgb(${v},${v},${v})`;
        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.fill();
      }
    }, 512);

    roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
    bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
    roughnessMap.repeat.set(3.2, 3.2);
    bumpMap.repeat.set(3.2, 3.2);

    return { roughnessMap, bumpMap };
  }

  applyMaterial(root) {
    const maps = this.makeObsidianMaps();
    root.traverse((obj) => {
      if (!obj.isMesh || !obj.geometry) return;

      obj.material = new THREE.MeshPhysicalMaterial({
        color: 0x070708,
        metalness: 0.68,
        roughness: 0.055,
        transmission: 0.0,
        thickness: 0.0,
        ior: 1.56,
        envMapIntensity: 3.05,
        clearcoat: 1.0,
        clearcoatRoughness: 0.016,
        roughnessMap: maps.roughnessMap,
        bumpMap: maps.bumpMap,
        bumpScale: 0.012,
        specularIntensity: 1.0,
        specularColor: new THREE.Color(0xfdf3e5)
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

      this.group.rotation.x += (lerp(-0.66, -0.04, t1) - this.group.rotation.x) * 0.13;
      this.group.rotation.y += (lerp(0.48, 0.015, t1) - this.group.rotation.y) * 0.13;
      this.group.rotation.z += (0 - this.group.rotation.z) * 0.13;

      const scaleMul = lerp(5.4, 1.48, t1);
      this.tmpScale.setScalar(this.baseScale * scaleMul);
      this.root.scale.lerp(this.tmpScale, 0.16);

      this.root.rotation.y += CFG.preEnterSpinSpeed;
      this.root.rotation.x += (mouse3D.y * 0.18 - this.root.rotation.x) * 0.06;
      this.root.rotation.z += (mouse3D.x * 0.10 - this.root.rotation.z) * 0.06;
    } else {
      const t2 = easeInOutCubic(clamp((p - 0.62) / 0.38, 0, 1));
      const pos = cubicBezier3(
        this.mid,
        new THREE.Vector3(0, 0.08, -10.95),
        new THREE.Vector3(0, 0.02, -11.16),
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
    logoAccentLight.position.y = this.group.position.y * 0.35 + 0.4;
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

function triggerLaunchFX() {
  fxFlash?.classList.add('live');
  fxShock?.classList.add('live');
  setTimeout(() => fxFlash?.classList.remove('live'), 220);
  setTimeout(() => fxShock?.classList.remove('live'), 680);

  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.value = 0.03;
    master.connect(ctx.destination);

    const oscA = ctx.createOscillator();
    const oscB = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(420, now);
    filter.frequency.exponentialRampToValueAtTime(1400, now + 0.34);

    oscA.type = 'sawtooth';
    oscB.type = 'triangle';

    oscA.frequency.setValueAtTime(70, now);
    oscA.frequency.exponentialRampToValueAtTime(190, now + 0.42);

    oscB.frequency.setValueAtTime(120, now);
    oscB.frequency.exponentialRampToValueAtTime(620, now + 0.24);

    oscA.connect(filter);
    oscB.connect(filter);
    filter.connect(master);

    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.045, now + 0.05);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

    oscA.start(now);
    oscB.start(now);
    oscA.stop(now + 0.72);
    oscB.stop(now + 0.72);
  } catch (_) {}
}

initBtn?.addEventListener('click', () => {
  if (!state.ready || state.entered) return;
  state.entered = true;
  triggerLaunchFX();
  preloader?.classList.add('hidden');
  shell?.classList.add('live');
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
    initBtn?.classList.add('ready');
  }

  if (preloadPercent) {
    preloadPercent.textContent = `${String(Math.round(clamp(state.progress, 0, 1) * 100)).padStart(3, '0')}%`;
  }

  ring.update(state.progress, t);
  logo.update(state.progress, t);

  const cameraYaw = 5.5 * Math.PI / 180;
  const cameraLift = Math.sin(t * 0.14) * 0.05;
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
