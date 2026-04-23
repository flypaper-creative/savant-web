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

if (!canvas) throw new Error('Missing #bg3d canvas');

const CFG = {
  preloadMs: 8500,
  dpr: Math.min(window.devicePixelRatio || 1, 2),
  logoTargetSize: 1.9,
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

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function makeSpriteTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(256, 256, 8, 256, 256, 256);
  grad.addColorStop(0, 'rgba(255,230,170,0.35)');
  grad.addColorStop(0.18, 'rgba(255,180,90,0.12)');
  grad.addColorStop(0.42, 'rgba(255,90,150,0.05)');
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
renderer.toneMappingExposure = 1.02;
renderer.setPixelRatio(CFG.dpr);
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x040507);

const camera = new THREE.OrthographicCamera(-4, 4, 4, -4, 0.1, 100);
camera.position.set(0, 0.02, 10);
camera.lookAt(0, 0, 0);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.03).texture;

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.10,
  0.45,
  0.95
);
composer.addPass(bloomPass);

scene.add(new THREE.AmbientLight(0xffffff, 0.03));

const key = new THREE.SpotLight(0xfff4e3, 70, 80, 0.17, 0.98, 1.0);
key.position.set(0.4, 3.0, 6.5);
scene.add(key);

const fill = new THREE.PointLight(0xf6f8ff, 1.4, 16);
fill.position.set(-2.0, 0.4, 4.8);
scene.add(fill);

const rim = new THREE.PointLight(0xffffff, 18, 22);
rim.position.set(1.9, 1.7, -2.2);
scene.add(rim);

const goldKick = new THREE.PointLight(0xffd486, 1.1, 10);
goldKick.position.set(0, -2.0, 2.6);
scene.add(goldKick);

const pinkKick = new THREE.PointLight(0xff4f8c, 0.35, 8);
pinkKick.position.set(-1.8, 0.2, 2.2);
scene.add(pinkKick);

const backPlate = new THREE.Mesh(
  new THREE.CircleGeometry(6.2, 96),
  new THREE.MeshPhysicalMaterial({
    color: 0x06080c,
    metalness: 0.35,
    roughness: 0.84,
  })
);
backPlate.position.set(0, 0, -3.2);
scene.add(backPlate);

const backRingA = new THREE.Mesh(
  new THREE.TorusGeometry(3.4, 0.035, 18, 220),
  new THREE.MeshBasicMaterial({ color: 0xe1b955, transparent: true, opacity: 0.10 })
);
backRingA.position.set(0, 0, -2.7);
scene.add(backRingA);

const backRingB = new THREE.Mesh(
  new THREE.TorusGeometry(2.95, 0.015, 18, 220),
  new THREE.MeshBasicMaterial({ color: 0xff4c82, transparent: true, opacity: 0.06 })
);
backRingB.position.set(0, 0, -2.45);
scene.add(backRingB);

const haze = new THREE.Sprite(
  new THREE.SpriteMaterial({
    map: makeSpriteTexture(),
    transparent: true,
    opacity: 0.06,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  })
);
haze.position.set(0, 0.08, -1.6);
haze.scale.set(12, 12, 1);
scene.add(haze);

const ringGroup = new THREE.Group();
scene.add(ringGroup);

const outerRing = new THREE.Mesh(
  new THREE.TorusGeometry(2.55, 0.20, 42, 320),
  new THREE.MeshPhysicalMaterial({
    color: 0x020307,
    metalness: 1.0,
    roughness: 0.028,
    clearcoat: 1.0,
    clearcoatRoughness: 0.004,
    envMapIntensity: 5.2,
  })
);
ringGroup.add(outerRing);

const midRing = new THREE.Mesh(
  new THREE.TorusGeometry(2.47, 0.08, 32, 280),
  new THREE.MeshPhysicalMaterial({
    color: 0x070a10,
    metalness: 1.0,
    roughness: 0.055,
    clearcoat: 1.0,
    clearcoatRoughness: 0.010,
    envMapIntensity: 4.0,
  })
);
ringGroup.add(midRing);

const innerRing = new THREE.Mesh(
  new THREE.TorusGeometry(2.25, 0.024, 20, 220),
  new THREE.MeshPhysicalMaterial({
    color: 0x020307,
    metalness: 1.0,
    roughness: 0.03,
    clearcoat: 1.0,
    clearcoatRoughness: 0.006,
    envMapIntensity: 4.8,
  })
);
ringGroup.add(innerRing);

const ringTrace = new THREE.Mesh(
  new THREE.TorusGeometry(2.20, 0.008, 12, 220),
  new THREE.MeshBasicMaterial({
    color: 0xd8a64d,
    transparent: true,
    opacity: 0.08,
  })
);
ringGroup.add(ringTrace);

const leds = [];
for (let i = 0; i < 18; i++) {
  const a = Math.PI / 2 - (i / 18) * Math.PI * 2;
  const r = 2.36;

  const lens = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.01, 20),
    new THREE.MeshPhysicalMaterial({
      color: 0x181016,
      emissive: 0x000000,
      metalness: 0.0,
      roughness: 0.04,
      clearcoat: 1.0,
      clearcoatRoughness: 0.002,
      ior: 1.45,
    })
  );
  lens.rotation.x = Math.PI / 2;
  lens.position.set(Math.cos(a) * r, Math.sin(a) * r, 0.26);
  ringGroup.add(lens);

  const core = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.015, 0.007, 20),
    new THREE.MeshBasicMaterial({
      color: 0xffd38f,
      transparent: true,
      opacity: 0.08,
    })
  );
  core.rotation.x = Math.PI / 2;
  core.position.set(Math.cos(a) * r, Math.sin(a) * r, 0.275);
  ringGroup.add(core);

  leds.push({ lens, core, i });
}

const logoGroup = new THREE.Group();
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
    emissiveIntensity: 0.22,
    metalness: 0.0,
    roughness: 0.08,
    transparent: true,
    opacity: 0.028,
    transmission: 0.16,
    thickness: 0.22,
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
    opacity: 0.022,
    wireframe: true,
  })
);
forcefield.add(forceWire);

let logoRoot = null;

function applyLogoMaterial(root) {
  root.traverse((obj) => {
    if (!obj.isMesh) return;
    obj.material = new THREE.MeshPhysicalMaterial({
      color: 0x6c4810,
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
  root.scale.setScalar(CFG.logoTargetSize / maxDim);
}

const loader = new GLTFLoader();
loader.load(
  '/public/assets/logo7/logo7.glb',
  (gltf) => {
    logoRoot = gltf.scene;
    applyLogoMaterial(logoRoot);
    pivot.add(logoRoot);
    fitAndAnchor(logoRoot);
    STATE.loaded = true;
  },
  undefined,
  () => {
    logoRoot = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.92, 0.20, 260, 40, 2, 3),
      new THREE.MeshPhysicalMaterial({
        color: 0x6c4810,
        metalness: 1.0,
        roughness: 0.012,
        clearcoat: 1.0,
        clearcoatRoughness: 0.0008,
        envMapIntensity: 30.0,
        reflectivity: 1.0,
      })
    );
    pivot.add(logoRoot);
    STATE.loaded = true;
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

if (initBtn) {
  initBtn.addEventListener('click', () => {
    if (!STATE.ready || STATE.entered) return;
    STATE.entered = true;
    preloader?.classList.add('hidden');
    shell?.classList.add('live');
  });
}

function updateProgress() {
  const elapsed = performance.now() - STATE.startedAt;
  const target = clamp(elapsed / CFG.preloadMs, 0, 1);

  if (!STATE.loaded) {
    STATE.progress += (Math.min(target, 0.92) - STATE.progress) * 0.022;
  } else {
    STATE.progress += (1 - STATE.progress) * 0.03;
  }

  if (STATE.loaded && elapsed < CFG.preloadMs) {
    STATE.progress = Math.min(STATE.progress, 0.995);
  }

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

  const settle = easeOutCubic(Math.min(STATE.progress / 0.72, 1));

  ringGroup.rotation.z += 0.00015;
  ringTrace.rotation.z -= 0.00022;

  const front = STATE.progress * leds.length;
  const lit = Math.floor(front);
  const frac = front - lit;

  for (let i = 0; i < leds.length; i++) {
    let level = 0;
    if (i < lit) level = 1;
    else if (i === lit) level = frac;

    const cyc = (i / leds.length + t * 0.012) % 1;
    const gold = new THREE.Color(0xe0b45b);
    const pink = new THREE.Color(0xd55da2);
    const mix = 0.5 + 0.5 * Math.sin(cyc * Math.PI * 2.0);
    const c = gold.clone().lerp(pink, mix);

    leds[i].core.material.color.copy(c);
    leds[i].core.material.opacity = 0.08 + level * 0.92;

    leds[i].lens.material.color.setRGB(
      0.06 + c.r * 0.10,
      0.04 + c.g * 0.04,
      0.05 + c.b * 0.08
    );
    leds[i].lens.material.emissive.setRGB(
      c.r * level * 0.24,
      c.g * level * 0.10,
      c.b * level * 0.18
    );
  }

  logoGroup.position.y = CFG.worldY + 0.10 - (1 - settle) * 0.10;

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

  if (logoRoot) {
    logoRoot.traverse((obj, i = 0) => {
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

  composer.render();
}

resize();
tick();
