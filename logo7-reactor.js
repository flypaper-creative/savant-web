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

if (!els.canvas) {
  throw new Error('Missing #bg3d canvas');
}

const CONFIG = {
  preloadMs: 7600,
  worldY: 0.10,
  worldZ: -2.40,
  ringRadius: 2.20,
  logoTargetSize: 1.78,
  chamberRadius: 6.0,
  chamberHeight: 7.4,
  exposure: 0.98,
  bloomMin: 0.025,
  bloomMax: 0.07,
  maxDpr: 2,
  mobileBreakpoint: 700,
  assetUrl: '/public/assets/logo7/logo7.glb',
};

const STATE = {
  startedAt: performance.now(),
  progress: 0,
  loaded: false,
  ready: false,
  entered: false,
  destroyed: false,
};

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function easeOutQuart(x) {
  return 1 - Math.pow(1 - x, 4);
}

function makeCanvasTexture(draw, size = 1024) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const g = c.getContext('2d');
  draw(g, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

function makeRadialSprite(stops, size, opacity, textureSize = 1024) {
  const tex = makeCanvasTexture((g, w, h) => {
    const grad = g.createRadialGradient(w / 2, h / 2, 1, w / 2, h / 2, w / 2);
    for (const [offset, color] of stops) grad.addColorStop(offset, color);
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
  }, textureSize);

  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    opacity,
    blending: THREE.AdditiveBlending,
  });

  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(size, size, 1);
  return sprite;
}

function makeHorizontalFlare(width = 4.2, height = 0.05, opacity = 0.025) {
  const tex = makeCanvasTexture((g, w, h) => {
    const grad = g.createLinearGradient(0, h / 2, w, h / 2);
    grad.addColorStop(0.0, 'rgba(255,255,255,0.0)');
    grad.addColorStop(0.2, 'rgba(255,243,214,0.0)');
    grad.addColorStop(0.5, 'rgba(255,249,236,1.0)');
    grad.addColorStop(0.8, 'rgba(255,243,214,0.0)');
    grad.addColorStop(1.0, 'rgba(255,255,255,0.0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
  }, 1024);

  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    opacity,
    blending: THREE.AdditiveBlending,
  });

  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(width, height, 1);
  return sprite;
}

function polishedGoldMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0xe0c36d,
    metalness: 1.0,
    roughness: 0.010,
    clearcoat: 1.0,
    clearcoatRoughness: 0.001,
    envMapIntensity: 14.0,
    reflectivity: 1.0,
  });
}

function obsidianMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0x020203,
    metalness: 1.0,
    roughness: 0.14,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
    envMapIntensity: 1.0,
  });
}

function darkMetalMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0x06070a,
    metalness: 1.0,
    roughness: 0.22,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    envMapIntensity: 0.9,
  });
}

class PreloaderRuntime {
  constructor() {
    this.clock = new THREE.Clock();

    this.renderer = new THREE.WebGLRenderer({
      canvas: els.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = CONFIG.exposure;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    this.camera = new THREE.OrthographicCamera(-3, 3, 3, -3, 0.1, 100);
    this.camera.position.set(0, 0, 10);
    this.camera.lookAt(0, CONFIG.worldY, CONFIG.worldZ);

    this.pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = this.pmrem.fromScene(new RoomEnvironment(this.renderer), 0.03).texture;

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      CONFIG.bloomMin,
      0.5,
      0.985
    );
    this.composer.addPass(this.bloomPass);

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.022));

    this.keyLight = new THREE.SpotLight(0xffffff, 38, 64, 0.18, 0.88, 1.2);
    this.keyLight.position.set(0.0, 2.1, 5.8);
    this.scene.add(this.keyLight);

    this.fillLight = new THREE.PointLight(0xf6f7fa, 1.1, 10);
    this.fillLight.position.set(-1.35, 0.0, 4.8);
    this.scene.add(this.fillLight);

    this.rimLight = new THREE.PointLight(0xffffff, 9.4, 18);
    this.rimLight.position.set(1.28, 1.55, -2.7);
    this.scene.add(this.rimLight);

    this.kickLight = new THREE.PointLight(0xffefc4, 0.40, 6);
    this.kickLight.position.set(0, -1.85, 2.15);
    this.scene.add(this.kickLight);

    this.chamber = new ChamberSystem(this.scene);
    this.ring = new RingSystem(this.scene);
    this.logo = new LogoSystem(this.scene);
    this.flare = new FlareSystem(this.scene);

    this.boundResize = this.resize.bind(this);
    window.addEventListener('resize', this.boundResize);
    this.resize();

    els.initBtn?.addEventListener('click', () => {
      if (!STATE.ready || STATE.entered) return;
      STATE.entered = true;
      els.preloader?.classList.add('hidden');
      els.shell?.classList.add('live');
    });
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const aspect = w / h;
    const frustum = w < CONFIG.mobileBreakpoint ? 8.1 : 7.8;

    this.camera.left = -frustum * aspect / 2;
    this.camera.right = frustum * aspect / 2;
    this.camera.top = frustum / 2;
    this.camera.bottom = -frustum / 2;
    this.camera.updateProjectionMatrix();

    const dpr = Math.min(window.devicePixelRatio || 1, CONFIG.maxDpr);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);

    const mobileScale = Math.min(w / 420, h / 920);
    let scale = Math.max(0.74, Math.min(1.0, mobileScale));
    if (aspect < 0.62) scale *= 0.92;

    this.ring.group.scale.setScalar(scale);
    this.logo.group.scale.setScalar(scale);
  }

  updateProgress() {
    const elapsed = performance.now() - STATE.startedAt;
    const target = clamp(elapsed / CONFIG.preloadMs, 0, 1);

    if (!STATE.loaded) {
      STATE.progress += (Math.min(target, 0.92) - STATE.progress) * 0.03;
    } else {
      STATE.progress += (1 - STATE.progress) * 0.038;
    }

    if (STATE.loaded && STATE.progress > 0.995 && !STATE.ready) {
      STATE.ready = true;
      els.initBtn?.classList.add('ready');
    }

    const pct = String(Math.round(STATE.progress * 100)).padStart(3, '0');
    if (els.preloadPercent) els.preloadPercent.textContent = `${pct}%`;
    if (els.preloadFill) els.preloadFill.style.width = `${STATE.progress * 100}%`;
  }

  tick() {
    if (STATE.destroyed) return;
    requestAnimationFrame(() => this.tick());

    const t = this.clock.getElapsedTime();

    this.updateProgress();
    this.chamber.update(t);
    this.ring.update(t);
    this.logo.update(t, STATE.progress);
    this.flare.update(t);

    this.bloomPass.strength = lerp(CONFIG.bloomMin, CONFIG.bloomMax, STATE.progress);
    this.composer.render();
  }
}

class ChamberSystem {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);

    this.shell = new THREE.Mesh(
      new THREE.CylinderGeometry(CONFIG.chamberRadius, CONFIG.chamberRadius, CONFIG.chamberHeight, 96, 1, true),
      new THREE.MeshPhysicalMaterial({
        color: 0x030303,
        metalness: 0.12,
        roughness: 0.985,
        side: THREE.BackSide,
      })
    );
    this.group.add(this.shell);

    this.vaultShadow = new THREE.Mesh(
      new THREE.TorusGeometry(6.4, 0.65, 16, 180, Math.PI),
      new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.32,
        depthWrite: false,
      })
    );
    this.vaultShadow.rotation.z = Math.PI;
    this.vaultShadow.position.set(0, CONFIG.worldY + 0.42, CONFIG.worldZ - 1.55);
    this.group.add(this.vaultShadow);

    this.backHaze = makeRadialSprite([
      [0.00, 'rgba(255,248,232,0.028)'],
      [0.18, 'rgba(255,230,180,0.012)'],
      [0.40, 'rgba(255,205,150,0.004)'],
      [1.00, 'rgba(255,255,255,0.0)']
    ], 8.2, 0.028, 1024);
    this.backHaze.position.set(0, CONFIG.worldY, CONFIG.worldZ - 1.2);
    this.group.add(this.backHaze);

    this.fogLayers = [];
    const defs = [
      { x: -0.68, y: CONFIG.worldY + 0.10, z: CONFIG.worldZ - 0.92, s: 2.5, o: 0.006 },
      { x:  0.72, y: CONFIG.worldY + 0.04, z: CONFIG.worldZ - 0.96, s: 2.7, o: 0.005 },
      { x:  0.00, y: CONFIG.worldY - 0.58, z: CONFIG.worldZ - 0.82, s: 3.0, o: 0.005 },
    ];

    for (let i = 0; i < defs.length; i++) {
      const d = defs[i];
      const sprite = makeRadialSprite([
        [0.00, 'rgba(255,248,232,0.022)'],
        [0.16, 'rgba(255,230,180,0.008)'],
        [0.34, 'rgba(255,205,150,0.003)'],
        [1.00, 'rgba(255,255,255,0.0)']
      ], d.s, d.o, 1024);

      sprite.position.set(d.x, d.y, d.z);
      sprite.userData = {
        baseX: d.x,
        baseY: d.y,
        baseZ: d.z,
        speed: 0.08 + i * 0.02,
        phase: i * 1.41,
      };
      this.group.add(sprite);
      this.fogLayers.push(sprite);
    }

    this.beams = [];
    const beamGeo = new THREE.ConeGeometry(0.22, 4.6, 24, 1, true);
    for (let i = 0; i < 3; i++) {
      const beam = new THREE.Mesh(
        beamGeo,
        new THREE.MeshBasicMaterial({
          color: 0xffe2a8,
          transparent: true,
          opacity: 0.016,
          depthWrite: false,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
        })
      );
      beam.position.set((i - 1) * 0.74, CONFIG.worldY + 1.44, CONFIG.worldZ + 1.54);
      beam.rotation.x = -Math.PI / 2.28;
      beam.userData.phase = i * 1.2;
      this.group.add(beam);
      this.beams.push(beam);
    }
  }

  update(t) {
    this.backHaze.material.opacity = 0.023 + Math.sin(t * 0.18) * 0.0025;

    for (const layer of this.fogLayers) {
      const u = layer.userData;
      layer.position.x = u.baseX + Math.sin(t * u.speed + u.phase) * 0.018;
      layer.position.y = u.baseY + Math.cos(t * (u.speed * 0.8) + u.phase) * 0.014;
      layer.position.z = u.baseZ + Math.sin(t * (u.speed * 1.1) + u.phase) * 0.008;
    }

    for (const beam of this.beams) {
      const t2 = t + beam.userData.phase;
      beam.position.x = Math.sin(t2 * 0.24) * 0.82;
      beam.rotation.z = Math.sin(t2 * 0.18) * 0.05;
      beam.material.opacity = 0.013 + Math.sin(t2 * 0.62) * 0.003;
    }
  }
}

class RingSystem {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.position.set(0, CONFIG.worldY, CONFIG.worldZ);
    scene.add(this.group);

    this.rig = new THREE.Group();
    this.group.add(this.rig);

    this.outerShell = new THREE.Mesh(
      new THREE.TorusGeometry(CONFIG.ringRadius, 0.09, 34, 260),
      obsidianMaterial()
    );
    this.rig.add(this.outerShell);

    this.midShell = new THREE.Mesh(
      new THREE.TorusGeometry(CONFIG.ringRadius - 0.03, 0.026, 18, 210),
      darkMetalMaterial()
    );
    this.rig.add(this.midShell);

    this.innerRail = new THREE.Mesh(
      new THREE.TorusGeometry(CONFIG.ringRadius - 0.15, 0.008, 14, 200),
      new THREE.MeshPhysicalMaterial({
        color: 0x101215,
        metalness: 1.0,
        roughness: 0.16,
        clearcoat: 1.0,
        clearcoatRoughness: 0.03,
        envMapIntensity: 0.8,
      })
    );
    this.rig.add(this.innerRail);

    this.innerTrace = new THREE.Mesh(
      new THREE.TorusGeometry(CONFIG.ringRadius - 0.175, 0.003, 10, 190),
      new THREE.MeshBasicMaterial({
        color: 0xa87c33,
        transparent: true,
        opacity: 0.10,
      })
    );
    this.rig.add(this.innerTrace);

    this.strips = [];
    const stripAngles = [0.18, 1.94, 2.54, 3.62, 4.08, 5.72];

    const armorGeo = new THREE.BoxGeometry(0.30, 0.10, 0.11);
    const armorPattern = [1.58,1.02,1.12,1.02,1.50,1.03,1.10,1.03,1.42,1.03,1.08,1.03,1.36,1.02];

    for (let i = 0; i < armorPattern.length; i++) {
      const a = (i / armorPattern.length) * Math.PI * 2;
      const seg = new THREE.Mesh(armorGeo, obsidianMaterial());
      seg.position.set(Math.cos(a) * (CONFIG.ringRadius + 0.06), Math.sin(a) * (CONFIG.ringRadius + 0.06), 0.07);
      seg.rotation.z = a;
      seg.scale.y = armorPattern[i];
      seg.scale.x = i % 4 === 0 ? 1.14 : 1.0;
      this.rig.add(seg);
    }

    const dotGeo = new THREE.BoxGeometry(0.007, 0.003, 0.004);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0xb9893d });

    for (let i = 0; i < 112; i++) {
      const a = Math.PI / 2 + (i / 112) * Math.PI * 2;
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.set(Math.cos(a) * (CONFIG.ringRadius - 0.14), Math.sin(a) * (CONFIG.ringRadius - 0.14), 0.10);
      dot.rotation.z = a;
      this.rig.add(dot);
    }

    for (const a of stripAngles) {
      const g = new THREE.Group();
      g.position.set(Math.cos(a) * (CONFIG.ringRadius + 0.04), Math.sin(a) * (CONFIG.ringRadius + 0.04), 0.08);
      g.rotation.z = a;

      const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.035, 0.055),
        obsidianMaterial()
      );
      g.add(body);

      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.005, 0.007),
        new THREE.MeshBasicMaterial({
          color: 0xb9893d,
          transparent: true,
          opacity: 0.08,
        })
      );
      strip.position.z = 0.032;
      g.add(strip);

      this.rig.add(g);
      this.strips.push(strip);
    }
  }

  update(t) {
    this.outerShell.rotation.z += 0.00012;
    this.midShell.rotation.z -= 0.00006;
    this.innerRail.rotation.z += 0.00018;
    this.innerTrace.rotation.z -= 0.00028;

    this.rig.rotation.z = Math.sin(t * 0.07) * 0.0012;
    this.rig.rotation.x = Math.sin(t * 0.06) * 0.0016;

    for (let i = 0; i < this.strips.length; i++) {
      this.strips[i].material.opacity = 0.065 + Math.sin(t * 0.6 + i) * 0.006;
    }
  }
}

class FlareSystem {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.group.position.set(0.18, CONFIG.worldY + 0.12, CONFIG.worldZ + 1.02);

    this.center = makeRadialSprite([
      [0.00, 'rgba(255,250,240,0.22)'],
      [0.12, 'rgba(255,236,196,0.07)'],
      [0.30, 'rgba(255,220,160,0.015)'],
      [1.00, 'rgba(255,255,255,0.0)']
    ], 0.34, 0.022, 1024);
    this.group.add(this.center);

    this.horiz = makeHorizontalFlare(4.4, 0.045, 0.022);
    this.group.add(this.horiz);

    this.ghostA = makeRadialSprite([
      [0.00, 'rgba(255,246,224,0.08)'],
      [0.16, 'rgba(255,220,150,0.02)'],
      [1.00, 'rgba(255,255,255,0.0)']
    ], 0.14, 0.012, 1024);
    this.ghostA.position.set(-0.46, 0.0, -0.03);
    this.group.add(this.ghostA);

    this.ghostB = makeRadialSprite([
      [0.00, 'rgba(255,246,224,0.07)'],
      [0.16, 'rgba(255,220,150,0.018)'],
      [1.00, 'rgba(255,255,255,0.0)']
    ], 0.09, 0.010, 1024);
    this.ghostB.position.set(0.66, 0.0, -0.04);
    this.group.add(this.ghostB);
  }

  update(t) {
    this.center.material.opacity = 0.020 + Math.sin(t * 0.55) * 0.002;
    this.horiz.material.opacity = 0.020 + Math.sin(t * 0.48 + 0.4) * 0.002;
  }
}

class LogoSystem {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.position.set(0, CONFIG.worldY, CONFIG.worldZ);
    scene.add(this.group);
    this.root = null;
    this.baseScale = 1;
    this.load();
  }

  applyMaterial(root) {
    root.traverse((obj) => {
      if (!obj.isMesh) return;
      obj.material = polishedGoldMaterial();
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
    this.baseScale = CONFIG.logoTargetSize / maxDim;
    root.scale.setScalar(this.baseScale);
  }

  load() {
    const loader = new GLTFLoader();
    loader.load(
      CONFIG.assetUrl,
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
          polishedGoldMaterial()
        );
        this.group.add(this.root);
        STATE.loaded = true;
      }
    );
  }

  update(t, p) {
    if (!this.root) return;
    const settle = easeOutQuart(Math.min(p / 0.62, 1));
    this.group.position.y = CONFIG.worldY + (1 - settle) * 0.10;
    this.root.rotation.y += 0.0018;
    this.root.rotation.x = 0.082 + Math.sin(t * 0.42) * 0.004;
  }
}

new PreloaderRuntime().tick();
