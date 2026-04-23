import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const canvas = document.getElementById('bg3d');
const preloader = document.getElementById('preloader');
const initBtn = document.getElementById('initBtn');
const preloadPercent = document.getElementById('preloadPercent');
const preloadFill = document.getElementById('preloadFill');
const shell = document.getElementById('shell');

if (!canvas) throw new Error('Missing #bg3d');

const CFG = {
  preloadMs: 8500,
  dpr: Math.min(window.devicePixelRatio || 1, 2),
  exposure: 1.08,
};

const STATE = {
  startedAt: performance.now(),
  progress: 0,
  loaded: false,
  ready: false,
  entered: false,
};

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function easeOutCubic(x) {
  return 1 - Math.pow(1 - x, 3);
}

function makeGlowTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(256, 256, 10, 256, 256, 256);
  grad.addColorStop(0, 'rgba(255,235,180,0.28)');
  grad.addColorStop(0.18, 'rgba(255,190,95,0.12)');
  grad.addColorStop(0.42, 'rgba(255,80,120,0.05)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 512, 512);
  return new THREE.CanvasTexture(c);
}

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance',
});
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = CFG.exposure;
renderer.setPixelRatio(CFG.dpr);
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05070b);

const camera = new THREE.OrthographicCamera(-4, 4, 4, -4, 0.1, 100);
camera.position.set(0, 0.02, 10);
camera.lookAt(0, 0, 0);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.03).texture;

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.14,
  0.45,
  0.94
);
composer.addPass(bloomPass);

scene.add(new THREE.AmbientLight(0xffffff, 0.06));

const key = new THREE.SpotLight(0xfff5e2, 95, 80, 0.18, 0.98, 1.0);
key.position.set(0.8, 3.0, 6.5);
scene.add(key);

const fill = new THREE.PointLight(0xf6f8ff, 2.2, 16);
fill.position.set(-2.2, 0.4, 5.0);
scene.add(fill);

const rim = new THREE.PointLight(0xffffff, 20, 22);
rim.position.set(2.2, 1.8, -2.0);
scene.add(rim);

const goldKick = new THREE.PointLight(0xffd486, 1.5, 12);
goldKick.position.set(0, -2.0, 2.6);
scene.add(goldKick);

const pinkKick = new THREE.PointLight(0xff4f8c, 0.6, 10);
pinkKick.position.set(-2.0, 0.2, 2.2);
scene.add(pinkKick);

const backPlate = new THREE.Mesh(
  new THREE.CircleGeometry(6.3, 96),
  new THREE.MeshPhysicalMaterial({
    color: 0x07090d,
    metalness: 0.42,
    roughness: 0.82,
  })
);
backPlate.position.set(0, 0, -3.0);
scene.add(backPlate);

const backGlow = new THREE.Sprite(
  new THREE.SpriteMaterial({
    map: makeGlowTexture(),
    transparent: true,
    opacity: 0.08,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  })
);
backGlow.position.set(0, 0.1, -1.7);
backGlow.scale.set(12, 12, 1);
scene.add(backGlow);

const ringGroup = new THREE.Group();
ringGroup.position.set(0, 0, 0);
scene.add(ringGroup);

const outerRing = new THREE.Mesh(
  new THREE.TorusGeometry(2.55, 0.20, 42, 320),
  new THREE.MeshPhysicalMaterial({
    color: 0x05080d,
    metalness: 1.0,
    roughness: 0.03,
    clearcoat: 1.0,
    clearcoatRoughness: 0.004,
    envMapIntensity: 5.6,
  })
);
ringGroup.add(outerRing);

const midRing = new THREE.Mesh(
  new THREE.TorusGeometry(2.46, 0.08, 32, 280),
  new THREE.MeshPhysicalMaterial({
    color: 0x0a0e14,
    metalness: 1.0,
    roughness: 0.06,
    clearcoat: 1.0,
    clearcoatRoughness: 0.01,
    envMapIntensity: 4.0,
  })
);
ringGroup.add(midRing);

const innerRing = new THREE.Mesh(
  new THREE.TorusGeometry(2.23, 0.022, 20, 220),
  new THREE.MeshBasicMaterial({
    color: 0xe0b555,
    transparent: true,
    opacity: 0.18,
  })
);
ringGroup.add(innerRing);

const ledData = [];
for (let i = 0; i < 16; i++) {
  const a = Math.PI / 2 - (i / 16) * Math.PI * 2;
  const r = 2.35;

  const lens = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 0.012, 20),
    new THREE.MeshPhysicalMaterial({
      color: 0x1a1117,
      emissive: 0x000000,
      metalness: 0.0,
      roughness: 0.04,
      clearcoat: 1.0,
      clearcoatRoughness: 0.002,
      ior: 1.45,
    })
  );
  lens.rotation.x = Math.PI / 2;
  lens.position.set(Math.cos(a) * r, Math.sin(a) * r, 0.24);
  ringGroup.add(lens);

  const core = new THREE.Mesh(
    new THREE.CylinderGeometry(0.017, 0.017, 0.008, 20),
    new THREE.MeshBasicMaterial({
      color: 0xffd38f,
      transparent: true,
      opacity: 0.12,
    })
  );
  core.rotation.x = Math.PI / 2;
  core.position.set(Math.cos(a) * r, Math.sin(a) * r, 0.255);
  ringGroup.add(core);

  ledData.push({ lens, core, i });
}

const logoGroup = new THREE.Group();
logoGroup.position.set(0, 0, 0.06);
scene.add(logoGroup);

const pivot = new THREE.Group();
logoGroup.add(pivot);

const forcefield = new THREE.Group();
pivot.add(forcefield);

const forceOuter = new THREE.Mesh(
  new THREE.IcosahedronGeometry(1.18, 4),
  new THREE.MeshPhysicalMaterial({
    color: 0x84a8ff,
    emissive: 0x17224a,
    emissiveIntensity: 0.24,
    metalness: 0.0,
    roughness: 0.08,
    transparent: true,
    opacity: 0.030,
    transmission: 0.16,
    thickness: 0.20,
    clearcoat: 1.0,
    clearcoatRoughness: 0.01,
    ior: 1.18,
  })
);
forcefield.add(forceOuter);

const forceWire = new THREE.Mesh(
  new THREE.IcosahedronGeometry(1.24, 2),
  new THREE.MeshBasicMaterial({
    color: 0x98c8ff,
    transparent: true,
    opacity: 0.024,
    wireframe: true,
  })
);
forcefield.add(forceWire);

const forceHalo = new THREE.Sprite(
  new THREE.SpriteMaterial({
    map: makeGlowTexture(),
    transparent: true,
    opacity: 0.028,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  })
);
forceHalo.scale.set(3.0, 3.0, 1);
forcefield.add(forceHalo);

let logoRoot = null;

function makeFallbackLogo() {
  const mesh = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.82, 0.20, 260, 40, 2, 3),
    new THREE.MeshPhysicalMaterial({
      color: 0x7a5514,
      metalness: 1.0,
      roughness: 0.012,
      clearcoat: 1.0,
      clearcoatRoughness: 0.0008,
      envMapIntensity: 30.0,
      reflectivity: 1.0,
    })
  );
  return mesh;
}

function applyLogoMaterial(root) {
  root.traverse((obj) => {
    if (!obj.isMesh) return;
    obj.material = new THREE.MeshPhysicalMaterial({
      color: 0x7a5514,
      metalness: 1.0,
      roughness: 0.012,
      clearcoat: 1.0,
      clearcoatRoughness: 0.0008,
      envMapIntensity: 30.0,
      reflectivity: 1.0,
    });
    obj.castShadow = false;
    obj.receiveShadow = false;
    obj.geometry?.computeVertexNormals?.();
  });
}

function fitAndAnchor(root) {
  const box = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  root.position.sub(center);

  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  root.scale.setScalar(1.9 / maxDim);
}

function useFallbackNow() {
  if (logoRoot) return;
  logoRoot = makeFallbackLogo();
  pivot.add(logoRoot);
  STATE.loaded = true;
}

const loader = new GLTFLoader();
const fallbackTimeout = setTimeout(() => {
  useFallbackNow();
}, 2500);

loader.load(
  '/public/assets/logo7/logo7.glb',
  (gltf) => {
    clearTimeout(fallbackTimeout);
    if (logoRoot) return;
    logoRoot = gltf.scene;
    applyLogoMaterial(logoRoot);
    pivot.add(logoRoot);
    fitAndAnchor(logoRoot);
    STATE.loaded = true;
  },
  undefined,
  () => {
    clearTimeout(fallbackTimeout);
    useFallbackNow();
  }
);

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const aspect = w / h;
  const frustum = w < 700 ? 9.0 : 8.2;

  camera.left = -frustum * aspect / 2;
  camera.right = frustum * aspect / 2;
  camera.top = frustum / 2;
  camera.bottom = -frustum / 2;
  camera.updateProjectionMatrix();

  renderer.setSize(w, h);
  composer.setSize(w, h);

  const mobileScale = Math.min(w / 420, h / 920);
  let scale = Math.max(0.76, Math.min(1.0, mobileScale));
  if (aspect < 0.62) scale *= 0.92;

  ringGroup.scale.setScalar(scale);
  logoGroup.scale.setScalar(scale);
}

window.addEventListener('resize', resize);

initBtn?.addEventListener('click', () => {
  if (!STATE.ready || STATE.entered) return;
  STATE.entered = true;
  preloader?.classList.add('hidden');
  shell?.classList.add('live');
});

function updateProgress() {
  const elapsed = performance.now() - STATE.startedAt;
  const target = clamp(elapsed / CFG.preloadMs, 0, 1);

  if (!STATE.loaded) {
    STATE.progress += (Math.min(target, 0.92) - STATE.progress) * 0.022;
  } else {
    STATE.progress += (1 - STATE.progress) * 0.03;
  }

  STATE.progress = clamp(STATE.progress, 0, 1);

  if (STATE.loaded && elapsed >= CFG.preloadMs && !STATE.ready) {
    STATE.progress = 1;
    STATE.ready = true;
    initBtn?.classList.add('ready');
  }

  const pct = String(Math.round(STATE.progress * 100)).padStart(3, '0');
  if (preloadPercent) preloadPercent.textContent = `${pct}%`;
  if (preloadFill) preloadFill.style.width = `${STATE.progress * 100}%`;
}

function tick() {
  requestAnimationFrame(tick);
  const t = performance.now() * 0.001;

  updateProgress();

  backRingA.rotation.z += 0.0006;
  backRingB.rotation.z -= 0.00035;
  backGlow.material.opacity = 0.06 + Math.sin(t * 0.4) * 0.008;

  ringGroup.rotation.z += 0.00016;

  const front = STATE.progress * ledData.length;
  const lit = Math.floor(front);
  const frac = front - lit;

  for (let i = 0; i < ledData.length; i++) {
    let level = 0;
    if (i < lit) level = 1;
    else if (i === lit) level = frac;

    const cyc = (i / ledData.length + t * 0.012) % 1;
    const gold = new THREE.Color(0xe0b45b);
    const pink = new THREE.Color(0xd55da2);
    const mix = 0.5 + 0.5 * Math.sin(cyc * Math.PI * 2.0);
    const c = gold.clone().lerp(pink, mix);

    ledData[i].core.material.color.copy(c);
    ledData[i].core.material.opacity = 0.10 + level * 0.90;

    ledData[i].lens.material.color.setRGB(
      0.06 + c.r * 0.10,
      0.04 + c.g * 0.04,
      0.05 + c.b * 0.08
    );
    ledData[i].lens.material.emissive.setRGB(
      c.r * level * 0.26,
      c.g * level * 0.10,
      c.b * level * 0.20
    );
  }

  const settle = easeOutCubic(Math.min(STATE.progress / 0.72, 1));
  logoGroup.position.y = 0.04 - (1 - settle) * 0.08;

  const qStart = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.14, -0.55, 0.04));
  const qFront = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0));
  logoGroup.quaternion.slerp(qStart.clone().slerp(qFront, settle), 0.08);

  if (settle > 0.985) {
    const spinQuat = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(0, t * 0.42, 0)
    );
    pivot.quaternion.slerp(spinQuat, 0.05);
  } else {
    pivot.quaternion.slerp(new THREE.Quaternion(), 0.08);
  }

  forcefield.rotation.x += 0.0010;
  forcefield.rotation.y -= 0.0016;
  forcefield.rotation.z += 0.0007;
  forceOuter.material.opacity = 0.022 + STATE.progress * 0.022 + Math.sin(t * 0.8) * 0.004;
  forceWire.material.opacity = 0.016 + STATE.progress * 0.018;
  forceHalo.material.opacity = 0.020 + STATE.progress * 0.020;

  if (logoRoot) {
    logoRoot.traverse((obj, i = 0) => {
      if (!obj.isMesh || !obj.material) return;
      const mat = obj.material;
      mat.color.set('#7a5514');
      mat.emissive.set('#120704');
      mat.emissiveIntensity = 0.024 + settle * 0.018;
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

  composer.render();
}

resize();
tick();
