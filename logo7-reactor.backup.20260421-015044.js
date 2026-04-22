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
const revealEls = [...document.querySelectorAll('.reveal')];

document.querySelector('.preloader-ring')?.remove();
document.querySelector('.ring-sweep')?.remove();

const CFG = {
  preloadMs: 7000,
  exposure: 0.84,
  bloomBase: 0.14,
  bloomPeak: 0.36,
  ringRadius: 2.18,
  ringCenter: new THREE.Vector3(0, 0, -9.8),
  cameraZ: 6.1,
  logoTargetSize: 2.84,
  ledCount: 36,
  dpr: Math.min(window.innerWidth < 900 ? 1.18 : 1.35, window.devicePixelRatio || 1.35)
};

const state = {
  startedAt: performance.now(),
  loaded: false,
  ready: false,
  progress: 0
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
scene.background = new THREE.Color(0x101114);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.016).texture;

const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 120);
camera.position.set(0, 0, CFG.cameraZ);
camera.lookAt(CFG.ringCenter);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  CFG.bloomBase,
  0.92,
  0.86
);
composer.addPass(bloomPass);

scene.add(new THREE.AmbientLight(0xffffff, 0.03));

const key = new THREE.DirectionalLight(0xfff4ea, 0.52);
key.position.set(3.2, 4.2, 2.0);
scene.add(key);

const fill = new THREE.DirectionalLight(0xe8edf5, 0.16);
fill.position.set(-3.0, 1.4, 1.5);
scene.add(fill);

const warmBack = new THREE.PointLight(0xffbe72, 0.58, 18, 2);
warmBack.position.set(0, 0.15, CFG.ringCenter.z + 1.5);
scene.add(warmBack);

const coolSpec = new THREE.PointLight(0xf5f7fb, 0.18, 12, 2);
coolSpec.position.set(0, 1.8, -7.8);
scene.add(coolSpec);

const ledSweepLight = new THREE.PointLight(0xffc15a, 0.0, 10.5, 2);
scene.add(ledSweepLight);

function metalMat(color, roughness, metalness = 1.0, clearcoat = 1.0, envMapIntensity = 2.2) {
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness,
    roughness,
    clearcoat,
    clearcoatRoughness: Math.max(0.02, roughness * 0.5),
    envMapIntensity
  });
}
function glassMat(color, transmission = 0.82, roughness = 0.03, thickness = 0.72) {
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.0,
    roughness,
    transmission,
    thickness,
    ior: 1.32,
    transparent: true,
    opacity: 1.0,
    envMapIntensity: 1.8,
    clearcoat: 1.0,
    clearcoatRoughness: 0.02
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

class RingSystem {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.position.copy(CFG.ringCenter);
    scene.add(this.group);

    this.rig = new THREE.Group();
    this.group.add(this.rig);

    this.outer = new THREE.Mesh(
      new THREE.TorusGeometry(CFG.ringRadius, 0.060, 22, 180),
      metalMat(0x050507, 0.04, 1.0, 1.0, 2.6)
    );
    this.rig.add(this.outer);

    this.mid = new THREE.Mesh(
      new THREE.TorusGeometry(CFG.ringRadius - 0.11, 0.032, 18, 144),
      metalMat(0x141419, 0.035, 1.0, 1.0, 2.4)
    );
    this.rig.add(this.mid);

    this.innerGlass = new THREE.Mesh(
      new THREE.TorusGeometry(CFG.ringRadius - 0.17, 0.015, 16, 120),
      glassMat(0x261f28, 0.82, 0.024, 0.72)
    );
    this.rig.add(this.innerGlass);

    this.pinkNeon = new THREE.Mesh(
      new THREE.TorusGeometry(CFG.ringRadius - 0.135, 0.008, 14, 120),
      emissiveMat(0xff2f8e, 0.24)
    );
    this.rig.add(this.pinkNeon);

    this.pinkHalo = new THREE.Mesh(
      new THREE.TorusGeometry(CFG.ringRadius - 0.135, 0.018, 14, 100),
      new THREE.MeshBasicMaterial({
        color: 0xff4fa3,
        transparent: true,
        opacity: 0.04,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false
      })
    );
    this.rig.add(this.pinkHalo);

    this.coreGlow = new THREE.Mesh(
      new THREE.TorusGeometry(CFG.ringRadius - 0.19, 0.008, 12, 96),
      emissiveMat(0xffd08a, 0.05)
    );
    this.rig.add(this.coreGlow);

    this.halo = makeGlowSprite([
      [0.00, 'rgba(255,232,214,0.20)'],
      [0.08, 'rgba(255,194,126,0.10)'],
      [0.22, 'rgba(255,72,152,0.05)'],
      [1.00, 'rgba(255,255,255,0.0)'],
    ], 7.2, 0.04, 384);
    this.group.add(this.halo);

    this.buildAccents();
    this.buildLEDs();
  }

  buildAccents() {
    const count = 24;
    const geo = new THREE.BoxGeometry(0.18, 0.08, 0.05);
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0x0a0a0d,
      metalness: 1.0,
      roughness: 0.04,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      envMapIntensity: 2.4,
      vertexColors: true
    });

    this.accents = new THREE.InstancedMesh(geo, mat, count);
    this.accents.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    this.accents.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);

    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3(1, 1, 1);
    const p = new THREE.Vector3();
    const c = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      p.set(Math.cos(a) * (CFG.ringRadius + 0.02), Math.sin(a) * (CFG.ringRadius + 0.02), 0.02);
      q.setFromEuler(new THREE.Euler(0, 0, a));
      m.compose(p, q, s);
      this.accents.setMatrixAt(i, m);
      c.setHex(i % 2 ? 0x18181c : 0x08080a);
      this.accents.setColorAt(i, c);
    }

    this.accents.instanceMatrix.needsUpdate = true;
    this.accents.instanceColor.needsUpdate = true;
    this.rig.add(this.accents);
  }

  buildLEDs() {
    this.ledStartAngle = Math.PI / 2;
    this.ledCount = CFG.ledCount;
    this.ledPositions = [];

    const housingGeo = new THREE.BoxGeometry(0.072, 0.072, 0.036);
    const housingMat = new THREE.MeshPhysicalMaterial({
      color: 0x120f0c,
      metalness: 0.18,
      roughness: 0.12,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      vertexColors: true
    });

    const emitterGeo = new THREE.BoxGeometry(0.040, 0.040, 0.010);
    const emitterMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
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
    const s1 = new THREE.Vector3(1, 1, 1);
    const s2 = new THREE.Vector3(1, 1, 1);
    const p1 = new THREE.Vector3();
    const p2 = new THREE.Vector3();
    const darkHousing = new THREE.Color(0x120f0c);
    const darkEmitter = new THREE.Color(0x000000);

    for (let i = 0; i < this.ledCount; i++) {
      const a = this.ledStartAngle + (i / this.ledCount) * Math.PI * 2;
      const radius = CFG.ringRadius - 0.10;

      p1.set(Math.cos(a) * radius, Math.sin(a) * radius, 0.088);
      q.setFromEuler(new THREE.Euler(0, 0, a));
      m.compose(p1, q, s1);
      this.ledHousing.setMatrixAt(i, m);
      this.ledHousing.setColorAt(i, darkHousing);

      p2.set(Math.cos(a) * radius, Math.sin(a) * radius, 0.112);
      m.compose(p2, q, s2);
      this.ledEmitter.setMatrixAt(i, m);
      this.ledEmitter.setColorAt(i, darkEmitter);

      this.ledPositions.push(p2.clone());
    }

    this.ledHousing.instanceMatrix.needsUpdate = true;
    this.ledEmitter.instanceMatrix.needsUpdate = true;
    this.ledHousing.instanceColor.needsUpdate = true;
    this.ledEmitter.instanceColor.needsUpdate = true;

    this.rig.add(this.ledHousing);
    this.rig.add(this.ledEmitter);

    this.tmpGold = new THREE.Color();
    this.tmpPink = new THREE.Color();
    this.tmpMix = new THREE.Color();
    this.tmpBlack = new THREE.Color(0x000000);
    this.tmpHousingOff = new THREE.Color(0x120f0c);
    this.tmpVec = new THREE.Vector3();
  }

  update(progress) {
    const p = clamp(progress, 0, 1);
    const front = p * this.ledCount;
    const litCount = Math.floor(front);
    const frac = front - litCount;
    const globalBlendToGold = easeInOutCubic(clamp((p - 0.72) / 0.28, 0, 1));

    let activeIndex = litCount;
    if (activeIndex < 0) activeIndex = 0;
    if (activeIndex >= this.ledCount) activeIndex = this.ledCount - 1;

    this.tmpGold.setRGB(2.0, 1.30, 0.48);
    this.tmpPink.setRGB(2.8, 0.40, 1.5);

    for (let i = 0; i < this.ledCount; i++) {
      let level = 0.0;
      if (i < litCount) level = 1.0;
      else if (i === litCount) level = frac;

      const along = i / Math.max(1, this.ledCount - 1);
      const pinkWeightFront = clamp((along - 0.18) / 0.64, 0, 1) * (1.0 - globalBlendToGold);
      this.tmpMix.copy(this.tmpGold).lerp(this.tmpPink, pinkWeightFront);

      if (level > 0.001) {
        const emitterColor = this.tmpMix.clone().multiplyScalar(level * 4.0);
        const housingColor = new THREE.Color(0x5a381a).lerp(new THREE.Color(0xffe4b8), Math.min(level, 1.0) * 0.82);
        this.ledEmitter.setColorAt(i, emitterColor);
        this.ledHousing.setColorAt(i, housingColor);
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
    ledSweepLight.intensity = 0.8 + frac * 1.8;
    ledSweepLight.distance = 10.0 + frac * 2.8;
    ledSweepLight.color.copy(this.tmpGold).lerp(this.tmpPink, (1.0 - globalBlendToGold) * 0.75);

    this.coreGlow.material.opacity = 0.03 + p * 0.14;
    this.halo.material.opacity = 0.03 + p * 0.08;
    this.pinkNeon.material.opacity = 0.18 + (1.0 - globalBlendToGold) * 0.14;
    this.pinkHalo.material.opacity = 0.03 + (1.0 - globalBlendToGold) * 0.08;
  }
}

const ring = new RingSystem(scene);

class LogoSystem {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);

    this.root = null;
    this.baseScale = 1;
    this.tmpScale = new THREE.Vector3();

    this.start = new THREE.Vector3(0, 9.2, -1.0);
    this.cp1 = new THREE.Vector3(0, 6.6, -4.8);
    this.cp2 = new THREE.Vector3(0, 1.2, -8.9);
    this.mid = new THREE.Vector3(0, 0.10, -9.45);
    this.final = CFG.ringCenter.clone();
  }

  makeObsidianMaps() {
    const roughnessMap = makeCanvasTexture((g, w, h) => {
      const img = g.createImageData(w, h);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.floor(14 + Math.random() * 36);
        img.data[i] = v;
        img.data[i + 1] = v;
        img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
      g.putImageData(img, 0, 0);
    }, 512);

    const bumpMap = makeCanvasTexture((g, w, h) => {
      g.fillStyle = 'rgb(118,118,118)';
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 1200; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const r = 0.35 + Math.random() * 1.15;
        const v = Math.floor(108 + Math.random() * 40);
        g.fillStyle = `rgb(${v},${v},${v})`;
        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.fill();
      }
    }, 512);

    roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
    bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
    roughnessMap.repeat.set(2.6, 2.6);
    bumpMap.repeat.set(2.6, 2.6);

    return { roughnessMap, bumpMap };
  }

  applyMaterial(root) {
    const maps = this.makeObsidianMaps();
    root.traverse((obj) => {
      if (!obj.isMesh || !obj.geometry) return;
      obj.material = new THREE.MeshPhysicalMaterial({
        color: 0x070708,
        metalness: 0.22,
        roughness: 0.06,
        transmission: 0.0,
        thickness: 0.0,
        ior: 1.52,
        attenuationDistance: 0.0,
        attenuationColor: new THREE.Color(0xffffff),
        envMapIntensity: 2.25,
        clearcoat: 1.0,
        clearcoatRoughness: 0.022,
        roughnessMap: maps.roughnessMap,
        bumpMap: maps.bumpMap,
        bumpScale: 0.02
      });
      if ('specularIntensity' in obj.material) obj.material.specularIntensity = 1.0;
      if ('specularColor' in obj.material) obj.material.specularColor = new THREE.Color(0xf4eee6);
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
      new THREE.TorusKnotGeometry(0.62, 0.16, 160, 22, 2, 3),
      new THREE.MeshPhysicalMaterial({
        color: 0x0a0d12,
        metalness: 0.24,
        roughness: 0.10,
        clearcoat: 1.0,
        clearcoatRoughness: 0.02,
        envMapIntensity: 1.6
      })
    );
    g.add(body);
    this.baseScale = 1.0;
    return g;
  }

  load() {
    const loader = new GLTFLoader();
    loader.load('/public/assets/logo7/logo7.glb',
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

    if (p <= 0.60) {
      const t1 = easeOutQuint(clamp(p / 0.60, 0, 1));
      const pos = cubicBezier3(this.start, this.cp1, this.cp2, this.mid, t1);
      this.group.position.lerp(pos, 0.14);

      // Planned pre-enter choreography: visible approach into the ring center.
      this.group.rotation.x += (lerp(-0.62, -0.05, t1) - this.group.rotation.x) * 0.14;
      this.group.rotation.y += (lerp(0.42, 0.02, t1) - this.group.rotation.y) * 0.14;
      this.group.rotation.z += (0.0 - this.group.rotation.z) * 0.14;

      const scaleMul = lerp(4.8, 1.46, t1);
      this.tmpScale.setScalar(this.baseScale * scaleMul);
      this.root.scale.lerp(this.tmpScale, 0.16);

      // Logo-only pre-enter spin.
      this.root.rotation.y += 0.008;
      this.root.rotation.x += ((mouse3D?.y || 0) * 0.15 - this.root.rotation.x) * 0.06;
      this.root.rotation.z += ((mouse3D?.x || 0) * 0.08 - this.root.rotation.z) * 0.06;
    } else {
      const t2 = easeInOutCubic(clamp((p - 0.60) / 0.40, 0, 1));
      const pos = cubicBezier3(
        this.mid,
        new THREE.Vector3(0, 0.10, -10.65),
        new THREE.Vector3(0, 0.03, -10.95),
        this.final,
        t2
      );
      this.group.position.lerp(pos, 0.18);

      // Settle cleanly into the exact ring center.
      this.group.rotation.x += (lerp(-0.05, -0.012, t2) - this.group.rotation.x) * 0.16;
      this.group.rotation.y += (lerp(0.02, 0.00, t2) - this.group.rotation.y) * 0.16;
      this.group.rotation.z += (0.0 - this.group.rotation.z) * 0.16;

      const holdMul = lerp(1.22, 1.02, t2);
      this.tmpScale.setScalar(this.baseScale * holdMul);
      this.root.scale.lerp(this.tmpScale, 0.16);

      const settledRotationSpeed = t2 < 0.5 ? 0.0008 : lerp(0.0105, 0.0255, clamp((t2 - 0.5) / 0.5, 0, 1));
      this.root.rotation.y += settledRotationSpeed;
      this.root.rotation.x += (Math.sin(time * 0.08) * 0.0008 - this.root.rotation.x) * 0.08;
      this.root.rotation.z += (0 - this.root.rotation.z) * 0.08;
    }
  }
}

const logo = new LogoSystem(scene);
logo.load();

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
}, { threshold: 0.14 });
revealEls.forEach((el) => io.observe(el));

initBtn?.addEventListener('click', () => {
  preloader?.classList.add('hidden');
  shell?.classList.add('live');
});

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const t = clock.getElapsedTime();
  const elapsed = performance.now() - state.startedAt;
  const target = clamp(elapsed / CFG.preloadMs, 0, 1);

  if (!state.loaded) state.progress += (Math.min(target, 0.92) - state.progress) * 0.035;
  else state.progress += (1 - state.progress) * 0.045;

  if (state.loaded && state.progress > 0.995 && !state.ready) {
    state.ready = true;
    initBtn?.classList.add('ready');
  }

  if (preloadPercent) preloadPercent.textContent = `${String(Math.round(clamp(state.progress, 0, 1) * 100)).padStart(3, '0')}%`;

  ring.update(state.progress, t);
  logo.update(state.progress, t);

  bloomPass.strength = lerp(CFG.bloomBase, CFG.bloomPeak, clamp(state.progress, 0, 1));

  const camYaw = 5 * Math.PI / 180;
  camera.position.set(Math.sin(camYaw) * CFG.cameraZ, 0, Math.cos(camYaw) * CFG.cameraZ);
  camera.lookAt(CFG.ringCenter);

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
