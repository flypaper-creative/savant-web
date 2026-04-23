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
  exposure: 1.04,
  bloomMin: 0.10,
  bloomMax: 0.20,
  worldY: 0.06,
  worldZ: -2.90,
  ringRadius: 2.62,
  logoTargetSize: 1.92,
  chamberRadius: 8.6,
  chamberDepth: 14.5,
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

function makeHorizontalFlare(width = 5.8, height = 0.055, opacity = 0.018) {
  const tex = makeCanvasTexture((g, w, h) => {
    const grad = g.createLinearGradient(0, h / 2, w, h / 2);
    grad.addColorStop(0.0, 'rgba(255,255,255,0)');
    grad.addColorStop(0.25, 'rgba(255,220,170,0)');
    grad.addColorStop(0.5, 'rgba(255,248,235,1)');
    grad.addColorStop(0.72, 'rgba(255,90,150,0)');
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
    roughness: 0.028,
    clearcoat: 1.0,
    clearcoatRoughness: 0.004,
    envMapIntensity: 5.2,
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
    envMapIntensity: 4.0,
    reflectivity: 1.0,
  });
}

function darkGoldMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0x6f4a10,
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
      0.95
    );
    this.composer.addPass(this.bloomPass);

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.018));

    this.key = new THREE.SpotLight(0xffffff, 68, 72, 0.16, 0.98, 1.15);
    this.key.position.set(0.45, 2.9, 6.6);
    this.scene.add(this.key);

    this.fill = new THREE.PointLight(0xf7f9ff, 1.25, 14);
    this.fill.position.set(-2.4, 0.45, 5.0);
    this.scene.add(this.fill);

    this.rim = new THREE.PointLight(0xffffff, 15.5, 22);
    this.rim.position.set(1.9, 1.9, -2.7);
    this.scene.add(this.rim);

    this.goldKick = new THREE.PointLight(0xffd27d, 1.05, 11);
    this.goldKick.position.set(0.0, -2.3, 3.0);
    this.scene.add(this.goldKick);

    this.pinkKick = new THREE.PointLight(0xff508a, 0.42, 9);
    this.pinkKick.position.set(-1.9, 0.2, 2.8);
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
    const frustum = w < 700 ? 8.9 : 8.15;

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
        metalness: 0.22,
        roughness: 0.985,
        side: THREE.BackSide,
      })
    );
    this.group.add(this.room);

    this.backPlate = new THREE.Mesh(
      new THREE.CircleGeometry(6.1, 96),
      new THREE.MeshPhysicalMaterial({
        color: 0x05070b,
        metalness: 0.42,
        roughness: 0.84,
      })
    );
    this.backPlate.position.set(0, CFG.worldY, CFG.worldZ - 2.9);
    this.group.add(this.backPlate);

    this.primaryRing = new THREE.Mesh(
      new THREE.TorusGeometry(3.45, 0.04, 18, 240),
      new THREE.MeshBasicMaterial({ color: 0xe0b953, transparent: true, opacity: 0.10 })
    );
    this.primaryRing.position.set(0, CFG.worldY, CFG.worldZ - 2.45);
    this.group.add(this.primaryRing);

    this.secondaryRing = new THREE.Mesh(
      new THREE.TorusGeometry(3.00, 0.018, 18, 240),
      new THREE.MeshBasicMaterial({ color: 0xff4c82, transparent: true, opacity: 0.06 })
    );
    this.secondaryRing.position.set(0, CFG.worldY, CFG.worldZ - 2.24);
    this.group.add(this.secondaryRing);

    this.scan = new THREE.Mesh(
      new THREE.PlaneGeometry(5.8, 0.05),
      new THREE.MeshBasicMaterial({
        color: 0xfff0d0,
        transparent: true,
        opacity: 0.09,
        blending: THREE.AdditiveBlending,
      })
    );
    this.scan.position.set(0, 1.75, CFG.worldZ - 1.55);
    this.group.add(this.scan);

    this.hazeA = makeRadialSprite([
      [0.0, 'rgba(255,245,220,0.26)'],
      [0.16, 'rgba(255,205,120,0.08)'],
      [0.34, 'rgba(255,76,130,0.035)'],
      [1.0, 'rgba(0,0,0,0)']
    ], 13.0, 0.065, 512);
    this.hazeA.position.set(0, 0.16, CFG.worldZ - 1.8);
    this.group.add(this.hazeA);

    this.hazeB = makeRadialSprite([
      [0.0, 'rgba(255,245,220,0.18)'],
      [0.18, 'rgba(255,205,120,0.05)'],
      [1.0, 'rgba(0,0,0,0)']
    ], 10.0, 0.04, 512);
    this.hazeB.position.set(0, -0.44, CFG.worldZ - 1.55);
    this.group.add(this.hazeB);
  }

  update(t, progress) {
    this.primaryRing.rotation.z += 0.00075;
    this.secondaryRing.rotation.z -= 0.00042;
    this.scan.position.y = lerp(1.7, -1.7, progress);
    this.scan.material.opacity = 0.07 + Math.sin(t * 1.4) * 0.018;
    this.hazeA.material.opacity = 0.058 + Math.sin(t * 0.42) * 0.008;
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
