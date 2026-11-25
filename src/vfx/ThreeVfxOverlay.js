// v245: Three.js + 自訂 GLSL Shader 暗黑寫實三拍重擊特效層（無震動／無音效・純視覺實質打擊回饋）
// 新增：1) NormalBlending 貼地暗色焦痕/凍痕/雷印（消除煙火浮空感）
//      2) 三拍重量演出（聚能預兆 → 爆發擴散＋受擊元素濺射 → 持續餘韻）
//      3) 召喚物底部動態符文光環（配合 2.5D 精繪去背召喚實體）

const THREE_CDN_URLS = [
  'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js',
  'https://unpkg.com/three@0.160.0/build/three.module.js',
];

const BASE_VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vUv = uv;
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDir = normalize(-mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`;

// 0. 貼地暗色焦痕／凍痕／雷印（NormalBlending 壓暗石磚地面，讓光效有實質重量）
const DARK_SCAR_FRAG = /* glsl */ `
  precision mediump float;
  uniform float uAlpha;
  uniform vec3 uEdgeTint;
  uniform float uCrackSeed;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }

  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    if (r > 1.0) discard;
    float ang = atan(p.y, p.x);
    float n = noise(p * 4.5 + uCrackSeed);
    float cracks = pow(abs(sin(ang * 7.0 + n * 4.2)), 10.0) * smoothstep(0.95, 0.15, r);
    float darkBody = smoothstep(0.95, 0.15, r + (n - 0.5) * 0.25) * 0.78;
    vec3 col = mix(vec3(0.03, 0.025, 0.03), uEdgeTint, cracks * 0.85);
    float a = clamp(darkBody + cracks * 0.5, 0.0, 0.88) * uAlpha;
    if (a < 0.02) discard;
    gl_FragColor = vec4(col, a);
  }
`;

// 1. 流動烈焰著色器
const FIRE_FBM_FRAG = /* glsl */ `
  precision mediump float;
  uniform float uTime;
  uniform float uAlpha;
  uniform float uSpeed;
  uniform vec3 uColorCore;
  uniform vec3 uColorMid;
  uniform vec3 uColorEdge;
  uniform float uMode;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0; float a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.05 + vec2(1.7, 9.2); a *= 0.5; }
    return v;
  }

  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    float mask = 1.0;
    vec2 nUv = vUv * 4.2;

    if (uMode < 0.5) {
      float ang = atan(p.y, p.x);
      nUv = vec2(ang * 1.4, r * 3.5 - uTime * uSpeed);
      mask = smoothstep(1.0, 0.12, r);
    } else if (uMode < 1.5) {
      nUv = vec2(vUv.x * 4.5, vUv.y * 3.8 - uTime * uSpeed * 1.4);
      float edgeX = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x);
      float edgeY = smoothstep(0.0, 0.14, vUv.y) * smoothstep(1.0, 0.25, vUv.y);
      mask = edgeX * edgeY;
    } else {
      float ang = atan(p.y, p.x);
      nUv = vec2(ang * 2.6 + uTime * 1.8, r * 5.0 - uTime * uSpeed);
      float ring = exp(-pow((r - 0.74) * 8.0, 2.0));
      float inner = exp(-pow((r - 0.44) * 9.5, 2.0)) * 0.55;
      mask = (ring + inner) * smoothstep(1.0, 0.88, r);
    }

    float n = fbm(nUv);
    float n2 = fbm(nUv * 1.8 + vec2(uTime * 0.9, -uTime * uSpeed * 1.1));
    float flame = clamp(mask * (0.45 + 1.15 * n * 0.65 + 0.55 * n2), 0.0, 1.4);
    float cutoff = smoothstep(0.20, 0.92, flame);
    if (cutoff < 0.02) discard;

    vec3 col = mix(uColorEdge, uColorMid, smoothstep(0.24, 0.62, flame));
    col = mix(col, uColorCore, smoothstep(0.64, 1.08, flame));
    gl_FragColor = vec4(col * 1.32, cutoff * uAlpha);
  }
`;

// 2. 寒冰結晶著色器
const FROST_CRYSTAL_FRAG = /* glsl */ `
  precision mediump float;
  uniform float uTime;
  uniform float uAlpha;
  uniform vec3 uColorDeep;
  uniform vec3 uColorBright;
  uniform float uMode;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453);
  }
  float voronoi(vec2 x) {
    vec2 n = floor(x); vec2 f = fract(x);
    float md = 8.0;
    for (int j = -1; j <= 1; j++) {
      for (int i = -1; i <= 1; i++) {
        vec2 g = vec2(float(i), float(j));
        vec2 o = 0.5 + 0.45 * sin(uTime * 2.0 + 6.2831 * hash2(n + g));
        vec2 r = g + o - f;
        float d = dot(r, r);
        if (d < md) md = d;
      }
    }
    return sqrt(md);
  }

  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    if (uMode < 0.5) {
      float fres = pow(1.0 - abs(dot(normalize(vNormal), normalize(vViewDir))), 1.7);
      float v = voronoi(vUv * 5.0 + vec2(0.0, uTime * 0.4));
      float crack = smoothstep(0.18, 0.65, v);
      vec3 col = mix(uColorDeep, uColorBright, clamp(fres * 1.25 + crack * 0.55, 0.0, 1.0));
      float a = clamp(0.28 + fres * 0.85 + crack * 0.35, 0.0, 1.0) * uAlpha;
      gl_FragColor = vec4(col * 1.32, a);
    } else if (uMode < 1.5) {
      float ang = atan(p.y, p.x) + uTime * 1.1;
      float hex = abs(cos(ang * 3.0));
      float outerRing = exp(-pow((r - 0.82) * 14.0, 2.0));
      float star = exp(-pow((r - (0.45 + 0.28 * hex)) * 16.0, 2.0));
      float mist = smoothstep(0.98, 0.15, r) * (0.28 + 0.35 * voronoi(p * 3.5 - uTime * 0.6));
      float inten = clamp(outerRing * 1.2 + star * 1.1 + mist, 0.0, 1.5);
      if (inten < 0.03) discard;
      vec3 col = mix(uColorDeep, uColorBright, clamp(outerRing + star, 0.0, 1.0));
      gl_FragColor = vec4(col * 1.28, inten * uAlpha);
    } else {
      float ang = atan(p.y, p.x);
      float spikes = pow(abs(sin(ang * 8.0 + uTime * 4.0)), 3.0);
      float ring = exp(-pow((r - 0.68) * 9.0, 2.0)) * (0.65 + 0.85 * spikes);
      float core = smoothstep(0.45, 0.0, r) * 0.7;
      float inten = (ring + core) * smoothstep(1.0, 0.86, r);
      if (inten < 0.03) discard;
      vec3 col = mix(uColorDeep, vec3(0.92, 0.99, 1.0), clamp(inten, 0.0, 1.0));
      gl_FragColor = vec4(col * 1.36, inten * uAlpha);
    }
  }
`;

// 3. 電漿閃電著色器
const PLASMA_BOLT_FRAG = /* glsl */ `
  precision mediump float;
  uniform float uTime;
  uniform float uAlpha;
  uniform vec3 uColorCore;
  uniform vec3 uColorGlow;
  varying vec2 vUv;

  void main() {
    float dist = abs(vUv.y - 0.5) * 2.0;
    float pulse = 0.82 + 0.28 * sin(vUv.x * 28.0 - uTime * 38.0);
    float core = exp(-dist * 7.5) * pulse;
    float halo = exp(-dist * 2.3) * 0.75;
    float endFade = smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x);
    float inten = (core + halo) * endFade;
    if (inten < 0.03) discard;
    vec3 col = mix(uColorGlow, uColorCore, clamp(core * 1.4, 0.0, 1.0));
    gl_FragColor = vec4(col * 1.55, clamp(inten, 0.0, 1.0) * uAlpha);
  }
`;

// 4. 星界符文／黑洞渦流著色器
const ASTRAL_SWIRL_FRAG = /* glsl */ `
  precision mediump float;
  uniform float uTime;
  uniform float uAlpha;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uMode;
  varying vec2 vUv;

  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    if (r > 1.0) discard;
    float ang = atan(p.y, p.x);

    if (uMode < 0.5) {
      float swirl = sin(ang * 6.0 - uTime * 4.5 + r * 8.0) * 0.5 + 0.5;
      float ring1 = exp(-pow((r - 0.84) * 16.0, 2.0));
      float ring2 = exp(-pow((r - 0.56) * 14.0, 2.0));
      float spokes = pow(abs(cos(ang * 3.0 + uTime * 1.8)), 8.0) * smoothstep(0.9, 0.2, r);
      float sector = fract((ang / 6.28318) + 0.5 + uTime * 0.25);
      vec3 triCol = sector < 0.33
        ? vec3(1.0, 0.45, 0.14)
        : (sector < 0.66 ? vec3(0.22, 0.82, 1.0) : vec3(0.72, 0.42, 1.0));
      vec3 col = mix(triCol, vec3(1.0, 0.96, 0.72), clamp(ring1 + spokes, 0.0, 1.0));
      float inten = clamp(ring1 * 1.3 + ring2 * (0.6 + 0.7 * swirl) + spokes * 0.95 + smoothstep(0.35, 0.0, r), 0.0, 1.5);
      gl_FragColor = vec4(col * 1.35, inten * uAlpha);
    } else if (uMode < 1.5) {
      float disk = exp(-pow((r - 0.58) * 6.5, 2.0));
      float arms = 0.5 + 0.5 * sin(ang * 4.0 + r * 14.0 - uTime * 7.0);
      float hole = smoothstep(0.28, 0.34, r);
      float inten = disk * (0.55 + 0.85 * arms) * hole;
      vec3 col = mix(uColorA, uColorB, clamp(arms * disk * 1.4, 0.0, 1.0));
      gl_FragColor = vec4(col * 1.4, clamp(inten, 0.0, 1.0) * uAlpha);
    } else {
      float rays = pow(abs(sin(ang * 12.0 - uTime * 5.0)), 4.0);
      float wave = exp(-pow((r - 0.72) * 10.0, 2.0)) * (0.7 + 0.8 * rays);
      float core = exp(-r * 3.8);
      float inten = (wave + core) * smoothstep(1.0, 0.88, r);
      vec3 col = mix(uColorA, uColorB, clamp(core * 1.4 + wave * 0.5, 0.0, 1.0));
      gl_FragColor = vec4(col * 1.45, clamp(inten, 0.0, 1.0) * uAlpha);
    }
  }
`;

export class ThreeVfxOverlay {
  constructor(scene) {
    this.scene = scene;
    this.THREE = null;
    this.renderer = null;
    this.threeScene = null;
    this.camera = null;
    this.canvas = null;
    this.ready = false;
    this.visible = true;
    this.clockSec = 0;
    this.activeFx = [];
    this.persistent = new Map();
    this.customEffects = new Map();
    this.geoCache = {};
    this._maxFx = 64;
    this._initPromise = this._boot();
    if (typeof window !== 'undefined') window.__THREE_VFX__ = this;
  }

  registerCustomEffect(name, factoryFn) {
    if (name && typeof factoryFn === 'function') this.customEffects.set(name, factoryFn);
  }

  async _boot() {
    let THREE = null;
    for (const url of THREE_CDN_URLS) {
      try {
        THREE = await import(/* @vite-ignore */ url);
        if (THREE?.WebGLRenderer) break;
      } catch (e) { THREE = null; }
    }
    if (!THREE) return;
    try {
      this.THREE = THREE;
      const existing = document.getElementById('three-vfx-canvas');
      if (existing) existing.remove();

      const canvas = document.createElement('canvas');
      canvas.id = 'three-vfx-canvas';
      canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:6;';
      document.body.appendChild(canvas);
      this.canvas = canvas;

      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      renderer.setClearColor(0x000000, 0);
      this.renderer = renderer;

      this.threeScene = new THREE.Scene();
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.camera = new THREE.OrthographicCamera(0, w, 0, -h, -2000, 2000);
      this.camera.position.z = 900;

      this.geoCache = {
        plane: new THREE.PlaneGeometry(1, 1),
        cylinder: new THREE.CylinderGeometry(0.45, 0.62, 1, 20, 1, true),
        cone: new THREE.ConeGeometry(0.38, 1.0, 6),
        icosa: new THREE.IcosahedronGeometry(0.5, 1),
        sphere: new THREE.SphereGeometry(0.5, 16, 12),
        torus: new THREE.TorusGeometry(0.55, 0.085, 10, 32),
        octa: new THREE.OctahedronGeometry(0.48, 0),
      };

      this._onResize = () => {
        if (!this.renderer || !this.camera) return;
        const nw = window.innerWidth; const nh = window.innerHeight;
        this.renderer.setSize(nw, nh, false);
        this.camera.right = nw; this.camera.bottom = -nh;
        this.camera.updateProjectionMatrix();
      };
      window.addEventListener('resize', this._onResize);
      this.ready = true;
    } catch (err) { this.ready = false; }
  }

  setVisible(vis) {
    this.visible = !!vis;
    if (this.canvas) this.canvas.style.display = this.visible ? 'block' : 'none';
    if (!this.visible) this.clearAll();
  }

  clearAll() {
    if (!this.threeScene) return;
    for (const fx of this.activeFx) this._disposeGroup(fx.group);
    this.activeFx.length = 0;
    for (const [, p] of this.persistent) this._disposeGroup(p.group);
    this.persistent.clear();
  }

  worldToThree(wx, wy) {
    const phCanvas = this.scene?.game?.canvas;
    const cam = this.scene?.cameras?.main;
    if (!phCanvas || !cam) return { x: wx, y: -wy, zoom: 1 };
    const rect = phCanvas.getBoundingClientRect();
    const wv = cam.worldView;
    const sx = rect.left + ((wx - wv.x) / Math.max(1, wv.width)) * rect.width;
    const sy = rect.top + ((wy - wv.y) / Math.max(1, wv.height)) * rect.height;
    const zoom = rect.width / Math.max(1, wv.width);
    return { x: sx, y: -sy, zoom };
  }

  _matScar(edgeTint = 0xf97316, seed = 1.0) {
    const T = this.THREE;
    return new T.ShaderMaterial({
      vertexShader: BASE_VERT,
      fragmentShader: DARK_SCAR_FRAG,
      transparent: true,
      depthWrite: false,
      side: T.DoubleSide,
      blending: T.NormalBlending,
      uniforms: {
        uAlpha: { value: 1.0 },
        uEdgeTint: { value: new T.Color(edgeTint) },
        uCrackSeed: { value: seed },
      },
    });
  }

  _matFire(mode = 0, core = 0xfff5d6, mid = 0xff7a18, edge = 0x991b1b, speed = 2.4) {
    const T = this.THREE;
    return new T.ShaderMaterial({
      vertexShader: BASE_VERT,
      fragmentShader: FIRE_FBM_FRAG,
      transparent: true, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending,
      uniforms: {
        uTime: { value: this.clockSec }, uAlpha: { value: 1.0 }, uSpeed: { value: speed }, uMode: { value: mode },
        uColorCore: { value: new T.Color(core) }, uColorMid: { value: new T.Color(mid) }, uColorEdge: { value: new T.Color(edge) },
      },
    });
  }

  _matFrost(mode = 0, deep = 0x0284c7, bright = 0xbaf2ff) {
    const T = this.THREE;
    return new T.ShaderMaterial({
      vertexShader: BASE_VERT,
      fragmentShader: FROST_CRYSTAL_FRAG,
      transparent: true, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending,
      uniforms: {
        uTime: { value: this.clockSec }, uAlpha: { value: 1.0 }, uMode: { value: mode },
        uColorDeep: { value: new T.Color(deep) }, uColorBright: { value: new T.Color(bright) },
      },
    });
  }

  _matPlasma(core = 0xf5f3ff, glow = 0x8b5cf6) {
    const T = this.THREE;
    return new T.ShaderMaterial({
      vertexShader: BASE_VERT,
      fragmentShader: PLASMA_BOLT_FRAG,
      transparent: true, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending,
      uniforms: {
        uTime: { value: this.clockSec }, uAlpha: { value: 1.0 },
        uColorCore: { value: new T.Color(core) }, uColorGlow: { value: new T.Color(glow) },
      },
    });
  }

  _matAstral(mode = 0, colA = 0x7c3aed, colB = 0xfde047) {
    const T = this.THREE;
    return new T.ShaderMaterial({
      vertexShader: BASE_VERT,
      fragmentShader: ASTRAL_SWIRL_FRAG,
      transparent: true, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending,
      uniforms: {
        uTime: { value: this.clockSec }, uAlpha: { value: 1.0 }, uMode: { value: mode },
        uColorA: { value: new T.Color(colA) }, uColorB: { value: new T.Color(colB) },
      },
    });
  }

  _buildBoltRibbonGeo(len, width = 22, segments = 10, jitter = 18) {
    const T = this.THREE;
    const positions = []; const uvs = []; const indices = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = t * len;
      const off = (i === 0 || i === segments) ? 0 : (Math.random() - 0.5) * 2 * jitter;
      const hw = width * (0.45 + 0.55 * Math.sin(t * Math.PI));
      positions.push(x, off - hw, 0, x, off + hw, 0);
      uvs.push(t, 0, t, 1);
      if (i < segments) {
        const b = i * 2;
        indices.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
      }
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    return geo;
  }

  _pushFx(fx) {
    if (this.activeFx.length >= this._maxFx) {
      const oldest = this.activeFx.shift();
      if (oldest) this._disposeGroup(oldest.group);
    }
    this.threeScene.add(fx.group);
    this.activeFx.push(fx);
  }

  _disposeGroup(group) {
    if (!group) return;
    if (group.parent) group.parent.remove(group);
    group.traverse((obj) => {
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      }
      if (obj.userData?.ownGeo && obj.geometry) obj.geometry.dispose();
    });
  }

  // 受擊純視覺火花濺射（取代震動／音效，讓每次命中怪物都有實質破碎濺射回饋）
  playHitSparks(wx, wy, elem = 'fire', scale = 1.0) {
    if (!this.ready || !this.visible) return false;
    const T = this.THREE;
    const group = new T.Group();
    const mats = [];
    const colMap = {
      fire: [0xfffbeb, 0xf97316, 0x991b1b],
      frost: [0xf0f9ff, 0x38bdf8, 0x0284c7],
      shock: [0xffffff, 0xc084fc, 0x6d28d9],
    };
    const c = colMap[elem] || colMap.fire;
    const m = elem === 'frost' ? this._matFrost(2, c[2], c[0]) : (elem === 'shock' ? this._matPlasma(c[0], c[1]) : this._matFire(0, c[0], c[1], c[2], 5.0));
    mats.push(m);
    const shards = [];
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2 + Math.random() * 0.6;
      const spd = (55 + Math.random() * 55) * scale;
      const mesh = new T.Mesh(elem === 'frost' ? this.geoCache.cone : this.geoCache.plane, m);
      mesh.rotation.z = ang;
      mesh.scale.set(16 * scale, 9 * scale, 12 * scale);
      mesh.userData = { vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd * 0.72 };
      group.add(mesh);
      shards.push(mesh);
    }
    this._pushFx({
      group, mats, elapsed: 0, duration: 240,
      update: (p) => {
        const pt = this.worldToThree(wx, wy - 12);
        group.position.set(pt.x, pt.y, 58);
        group.scale.setScalar(pt.zoom);
        shards.forEach((s) => {
          s.position.set(s.userData.vx * p, s.userData.vy * p + (1 - p) * 6, 0);
        });
        m.uniforms.uAlpha.value = 1 - p;
      },
    });
    return true;
  }

  playMageSkill(effectName, opts = {}) {
    if (!this.ready || !this.visible) return false;
    if (this.customEffects.has(effectName)) {
      try { this.customEffects.get(effectName)(this, opts); return true; } catch (e) {}
    }

    const T = this.THREE;
    const sx = opts.sx ?? opts.x ?? 0;
    const sy = opts.sy ?? opts.y ?? 0;
    const tx = opts.tx ?? opts.x ?? sx;
    const ty = opts.ty ?? opts.y ?? sy;
    const scale = opts.scale || 1;
    const dur = opts.duration || 680;
    const group = new T.Group();
    const mats = [];

    // 1. 火彈 / 火球彈道
    if (effectName === 'fire_bolt' || effectName === 'fireball_proj') {
      const isBig = effectName === 'fireball_proj';
      const coreM = this._matFire(0, 0xfffbeb, 0xff7b00, 0xb91c1c, 4.2);
      const trailM = this._matFire(1, 0xfef08a, 0xf97316, 0x7f1d1d, 5.5);
      mats.push(coreM, trailM);
      const orb = new T.Mesh(this.geoCache.sphere, coreM);
      const sz = (isBig ? 52 : 30) * scale;
      orb.scale.set(sz, sz, sz);
      const tail = new T.Mesh(this.geoCache.plane, trailM);
      tail.scale.set(sz * 1.0, sz * 2.8, 1);
      tail.rotation.z = Math.PI * 0.5;
      tail.position.x = -sz * 1.05;
      group.add(orb, tail);
      group.rotation.z = Math.atan2(-(ty - sy), tx - sx);
      this._pushFx({
        group, mats, elapsed: 0, duration: dur,
        update: (p, dt) => {
          const pt = this.worldToThree(sx + (tx - sx) * p, sy + (ty - sy) * p - 12);
          group.position.set(pt.x, pt.y, 44);
          group.scale.setScalar(pt.zoom);
          orb.rotation.y += dt * 9;
        },
      });
      return true;
    }

    // 2. 火球爆破 / 火球附魔屍爆（含貼地黑紅焦痕＋餘燼）
    if (effectName === 'fireball_blast' || effectName === 'fire_enchant_nova') {
      const scarM = this._matScar(0xea580c, Math.random() * 10);
      const ringM = this._matFire(2, 0xfff7ed, 0xf97316, 0x991b1b, 3.6);
      const domeM = this._matFire(0, 0xffffff, 0xfb923c, 0x7f1d1d, 4.2);
      mats.push(scarM, ringM, domeM);
      const scar = new T.Mesh(this.geoCache.plane, scarM); scar.rotation.x = 0.62;
      const ring = new T.Mesh(this.geoCache.plane, ringM); ring.rotation.x = 0.62;
      const dome = new T.Mesh(this.geoCache.sphere, domeM);
      group.add(scar, ring, dome);
      const maxR = (effectName === 'fireball_blast' ? 235 : 195) * scale;
      this._pushFx({
        group, mats, elapsed: 0, duration: Math.max(760, dur),
        update: (p) => {
          const pt = this.worldToThree(tx, ty);
          group.position.set(pt.x, pt.y, 32);
          group.scale.setScalar(pt.zoom);
          const ease = 1 - Math.pow(1 - Math.min(1, p * 1.8), 3);
          const s = maxR * (0.28 + 0.82 * ease);
          scar.scale.set(s * 1.05, s * 0.74, 1);
          ring.scale.set(s, s * 0.72, 1);
          dome.scale.set(s * 0.56, s * 0.56, s * 0.56);
          const burstA = p < 0.14 ? p / 0.14 : Math.max(0, 1 - (p - 0.14) / 0.55);
          ringM.uniforms.uAlpha.value = burstA;
          domeM.uniforms.uAlpha.value = burstA * 0.92;
          scarM.uniforms.uAlpha.value = p < 0.1 ? p / 0.1 : (p > 0.6 ? (1 - p) / 0.4 : 0.92);
        },
      });
      return true;
    }

    // 3. 烈焰火牆（貼地焦道＋5 面持續升騰火舌 2.6 秒）
    if (effectName === 'firewall') {
      const scarM = this._matScar(0xdc2626, 3.7);
      const baseM = this._matFire(2, 0xfef3c7, 0xf97316, 0x7f1d1d, 2.5);
      const wallM = this._matFire(1, 0xfffbeb, 0xf97316, 0x991b1b, 3.4);
      mats.push(scarM, baseM, wallM);
      const scar = new T.Mesh(this.geoCache.plane, scarM); scar.rotation.x = 0.68; scar.scale.set(275 * scale, 125 * scale, 1);
      const base = new T.Mesh(this.geoCache.plane, baseM); base.rotation.x = 0.68; base.scale.set(255 * scale, 110 * scale, 1);
      group.add(scar, base);
      for (let i = -2; i <= 2; i++) {
        const w = new T.Mesh(this.geoCache.plane, wallM);
        w.position.set(i * 46 * scale, 56 * scale, i * 2);
        w.scale.set(70 * scale, 138 * scale, 1);
        group.add(w);
      }
      this._pushFx({
        group, mats, elapsed: 0, duration: Math.max(2400, dur),
        update: (p) => {
          const pt = this.worldToThree(tx, ty);
          group.position.set(pt.x, pt.y, 28);
          group.scale.setScalar(pt.zoom);
          const a = p < 0.08 ? p / 0.08 : (p > 0.8 ? (1 - p) / 0.2 : 1);
          scarM.uniforms.uAlpha.value = a * 0.9;
          baseM.uniforms.uAlpha.value = a * 0.85;
          wallM.uniforms.uAlpha.value = a;
        },
      });
      return true;
    }

    // 4. 隕石墜擊（三拍重擊：0.38s 紅金警示鎖地 → 巨石墜地爆炎 → 2.2s 貼地黑紅熔岩坑灼燒）
    if (effectName === 'meteor_impact') {
      const warnM = this._matFire(2, 0xfef08a, 0xef4444, 0x7f1d1d, 3.0);
      const scarM = this._matScar(0xf97316, 6.2);
      const rockM = this._matFire(0, 0xffffff, 0xfb923c, 0x7f1d1d, 4.5);
      const colM = this._matFire(1, 0xfffbeb, 0xf97316, 0x991b1b, 4.8);
      mats.push(warnM, scarM, rockM, colM);
      const warn = new T.Mesh(this.geoCache.plane, warnM); warn.rotation.x = 0.62;
      const scar = new T.Mesh(this.geoCache.plane, scarM); scar.rotation.x = 0.62;
      const rock = new T.Mesh(this.geoCache.icosa, rockM);
      const col = new T.Mesh(this.geoCache.cylinder, colM); col.position.y = 128 * scale;
      group.add(scar, warn, col, rock);
      this._pushFx({
        group, mats, elapsed: 0, duration: 2400,
        update: (p, dt) => {
          const pt = this.worldToThree(tx, ty);
          group.position.set(pt.x, pt.y, 46);
          group.scale.setScalar(pt.zoom);
          if (p < 0.16) {
            // 第一拍：鎖地預警＋隕石自高空斜墜
            const fp = p / 0.16;
            rock.visible = true;
            rock.position.set((1 - fp) * 180, (1 - fp) * 360, 0);
            rock.scale.setScalar(66 * scale);
            rock.rotation.x += dt * 11; rock.rotation.y += dt * 13;
            warn.scale.set(220 * scale * (1.2 - 0.25 * fp), 154 * scale * (1.2 - 0.25 * fp), 1);
            warnM.uniforms.uAlpha.value = fp * 0.9;
            scarM.uniforms.uAlpha.value = 0;
            colM.uniforms.uAlpha.value = 0;
          } else if (p < 0.42) {
            // 第二拍：砸地爆炎光柱＋熔岩裂地坑擴張
            rock.visible = false;
            const bp = (p - 0.16) / 0.26;
            const ease = 1 - Math.pow(1 - bp, 3);
            col.scale.set((100 + 95 * ease) * scale, (290 + 90 * ease) * scale, (100 + 95 * ease) * scale);
            colM.uniforms.uAlpha.value = 1 - bp * 0.7;
            warn.scale.set((180 + 170 * ease) * scale, (124 + 118 * ease) * scale, 1);
            warnM.uniforms.uAlpha.value = 1 - bp;
            scar.scale.set((190 + 130 * ease) * scale, (132 + 92 * ease) * scale, 1);
            scarM.uniforms.uAlpha.value = 0.95;
          } else {
            // 第三拍：地面焦黑熔岩裂痕餘燼殘留
            rock.visible = false;
            const ap = (p - 0.42) / 0.58;
            colM.uniforms.uAlpha.value = Math.max(0, 0.3 - ap * 0.6);
            warnM.uniforms.uAlpha.value = 0;
            scarM.uniforms.uAlpha.value = 0.95 * (1 - ap);
          }
        },
      });
      return true;
    }

    // 5. 煉獄巨蛇終極大招（2.6 秒焦黑封印陣＋巨型旋轉火焰漩渦）
    if (effectName === 'inferno_serpent') {
      const scarM = this._matScar(0xf97316, 9.1);
      const vortexM = this._matFire(1, 0xfffbeb, 0xf97316, 0x991b1b, 5.4);
      const ringM = this._matFire(2, 0xfef08a, 0xea580c, 0x7f1d1d, 4.4);
      mats.push(scarM, vortexM, ringM);
      const scar = new T.Mesh(this.geoCache.plane, scarM); scar.rotation.x = 0.62; scar.scale.set(360 * scale, 250 * scale, 1);
      const floor = new T.Mesh(this.geoCache.plane, ringM); floor.rotation.x = 0.62; floor.scale.set(330 * scale, 226 * scale, 1);
      const outer = new T.Mesh(this.geoCache.cylinder, vortexM); outer.position.y = 120 * scale; outer.scale.set(200 * scale, 260 * scale, 200 * scale);
      const inner = new T.Mesh(this.geoCache.cylinder, vortexM); inner.position.y = 95 * scale; inner.scale.set(118 * scale, 225 * scale, 118 * scale);
      group.add(scar, floor, outer, inner);
      this._pushFx({
        group, mats, elapsed: 0, duration: 2600,
        update: (p, dt) => {
          const pt = this.worldToThree(tx, ty);
          group.position.set(pt.x, pt.y, 44);
          group.scale.setScalar(pt.zoom);
          outer.rotation.y += dt * 5.2; inner.rotation.y -= dt * 8.0; floor.rotation.z += dt * 2.8;
          const a = p < 0.1 ? p / 0.1 : (p > 0.78 ? (1 - p) / 0.22 : 1);
          scarM.uniforms.uAlpha.value = a * 0.92;
          vortexM.uniforms.uAlpha.value = a * 0.92;
          ringM.uniforms.uAlpha.value = a;
        },
      });
      return true;
    }

    // 6. 寒冰箭 / 冰片飛射
    if (effectName === 'frost_bolt' || effectName === 'ice_shards') {
      const m = this._matFrost(0, 0x0369a1, 0xe0f2fe);
      mats.push(m);
      const count = effectName === 'ice_shards' ? 3 : 1;
      const spears = [];
      for (let i = 0; i < count; i++) {
        const sp = new T.Mesh(this.geoCache.cone, m);
        sp.rotation.z = -Math.PI * 0.5;
        sp.scale.set(20 * scale, 64 * scale, 20 * scale);
        sp.position.y = (i - (count - 1) / 2) * 18;
        group.add(sp); spears.push(sp);
      }
      group.rotation.z = Math.atan2(-(ty - sy), tx - sx);
      this._pushFx({
        group, mats, elapsed: 0, duration: dur || 220,
        update: (p, dt) => {
          const pt = this.worldToThree(sx + (tx - sx) * p, sy + (ty - sy) * p - 12);
          group.position.set(pt.x, pt.y, 44);
          group.scale.setScalar(pt.zoom);
          spears.forEach((s) => { s.rotation.x += dt * 12; });
        },
      });
      return true;
    }

    // 7. 冰封球（1.15 秒慢速推進壓迫感→終點向內坍縮→碎冰裂地）
    if (effectName === 'frozen_orb') {
      const coreM = this._matFrost(0, 0x0284c7, 0xe0f2fe);
      const ringM = this._matFrost(1, 0x0ea5e9, 0xbae6fd);
      mats.push(coreM, ringM);
      const core = new T.Mesh(this.geoCache.icosa, coreM); core.scale.setScalar(74 * scale);
      const ring = new T.Mesh(this.geoCache.plane, ringM); ring.scale.setScalar(148 * scale);
      group.add(ring, core);
      this._pushFx({
        group, mats, elapsed: 0, duration: Math.max(1150, dur),
        update: (p, dt) => {
          const travelP = Math.min(1, p / 0.85);
          const ease = 1 - Math.pow(1 - travelP, 2);
          const pt = this.worldToThree(sx + (tx - sx) * ease, sy + (ty - sy) * ease - 12);
          group.position.set(pt.x, pt.y, 48);
          // 最後 15% 向內急速坍縮準備引爆
          const compress = p > 0.85 ? 1 - ((p - 0.85) / 0.15) * 0.55 : (0.85 + 0.3 * travelP);
          group.scale.setScalar(pt.zoom * compress);
          core.rotation.x += dt * 6.5; core.rotation.y += dt * 8.5; ring.rotation.z -= dt * 7.5;
        },
      });
      return true;
    }

    // 8. 冰霜新星 / 碎裂爆破（暗冰凍裂地面底層＋12 根 3D 鋸齒冰錐破土）
    if (effectName === 'frost_nova' || effectName === 'shatter_burst') {
      const scarM = this._matScar(0x38bdf8, 4.4);
      const spikeM = this._matFrost(0, 0x0369a1, 0xf0f9ff);
      const ringM = this._matFrost(2, 0x0284c7, 0xe0f2fe);
      mats.push(scarM, spikeM, ringM);
      const scar = new T.Mesh(this.geoCache.plane, scarM); scar.rotation.x = 0.62;
      const ring = new T.Mesh(this.geoCache.plane, ringM); ring.rotation.x = 0.62;
      group.add(scar, ring);
      const spikes = [];
      const nSpikes = effectName === 'frost_nova' ? 12 : 8;
      for (let i = 0; i < nSpikes; i++) {
        const ang = (i / nSpikes) * Math.PI * 2;
        const cone = new T.Mesh(this.geoCache.cone, spikeM);
        cone.userData.ang = ang; cone.rotation.z = ang - Math.PI * 0.5;
        group.add(cone); spikes.push(cone);
      }
      const maxR = (effectName === 'frost_nova' ? 270 : 195) * scale;
      this._pushFx({
        group, mats, elapsed: 0, duration: Math.max(850, dur),
        update: (p) => {
          const pt = this.worldToThree(tx, ty);
          group.position.set(pt.x, pt.y, 38);
          group.scale.setScalar(pt.zoom);
          const ease = 1 - Math.pow(1 - Math.min(1, p * 1.7), 3);
          const s = maxR * (0.22 + 0.88 * ease);
          scar.scale.set(s * 1.05, s * 0.74, 1);
          ring.scale.set(s, s * 0.72, 1);
          spikes.forEach((sp) => {
            const dist = 26 + maxR * 0.42 * ease;
            sp.position.set(Math.cos(sp.userData.ang) * dist, Math.sin(sp.userData.ang) * dist * 0.68, 12);
            sp.scale.set(24 * scale, (62 + 34 * ease) * scale, 24 * scale);
          });
          const burstA = p < 0.14 ? p / 0.14 : Math.max(0, 1 - (p - 0.14) / 0.56);
          spikeM.uniforms.uAlpha.value = burstA;
          ringM.uniforms.uAlpha.value = burstA;
          scarM.uniforms.uAlpha.value = p < 0.1 ? p / 0.1 : (p > 0.65 ? (1 - p) / 0.35 : 0.88);
        },
      });
      return true;
    }

    // 9. 暴風雪（2.6 秒暗冰地面印記＋24 根斜落冰錐雨）
    if (effectName === 'blizzard_field') {
      const scarM = this._matScar(0x0ea5e9, 7.3);
      const sigilM = this._matFrost(1, 0x0284c7, 0xe0f2fe);
      const shardM = this._matFrost(0, 0x38bdf8, 0xffffff);
      mats.push(scarM, sigilM, shardM);
      const scar = new T.Mesh(this.geoCache.plane, scarM); scar.rotation.x = 0.62; scar.scale.set(320 * scale, 224 * scale, 1);
      const sigil = new T.Mesh(this.geoCache.plane, sigilM); sigil.rotation.x = 0.62; sigil.scale.set(300 * scale, 206 * scale, 1);
      group.add(scar, sigil);
      const shards = [];
      for (let i = 0; i < 20; i++) {
        const c = new T.Mesh(this.geoCache.cone, shardM);
        c.rotation.z = Math.PI + 0.24;
        c.scale.set(13 * scale, 54 * scale, 13 * scale);
        c.userData = { ox: (Math.random() - 0.5) * 240 * scale, oy: (Math.random() - 0.5) * 130 * scale, phase: Math.random() };
        group.add(c); shards.push(c);
      }
      this._pushFx({
        group, mats, elapsed: 0, duration: 2600,
        update: (p, dt) => {
          const pt = this.worldToThree(tx, ty);
          group.position.set(pt.x, pt.y, 36);
          group.scale.setScalar(pt.zoom);
          sigil.rotation.z += dt * 1.5;
          shards.forEach((s) => {
            const fp = (p * 3.8 + s.userData.phase) % 1.0;
            s.position.set(s.userData.ox + (1 - fp) * 60, s.userData.oy + (1 - fp) * 250, 15);
          });
          const a = p < 0.1 ? p / 0.1 : (p > 0.8 ? (1 - p) / 0.2 : 1);
          scarM.uniforms.uAlpha.value = a * 0.88;
          sigilM.uniforms.uAlpha.value = a * 0.9;
          shardM.uniforms.uAlpha.value = a;
        },
      });
      return true;
    }

    // 10. 深度凍結（2.2 秒冰棺＋地面擴散冰環）
    if (effectName === 'deep_freeze') {
      const scarM = this._matScar(0x38bdf8, 8.2);
      const monoM = this._matFrost(0, 0x0284c7, 0xf0f9ff);
      const ringM = this._matFrost(1, 0x0ea5e9, 0xe0f2fe);
      mats.push(scarM, monoM, ringM);
      const scar = new T.Mesh(this.geoCache.plane, scarM); scar.rotation.x = 0.62; scar.scale.set(340 * scale, 238 * scale, 1);
      const ring = new T.Mesh(this.geoCache.plane, ringM); ring.rotation.x = 0.62;
      const monolith = new T.Mesh(this.geoCache.octa, monoM); monolith.position.y = 34 * scale;
      group.add(scar, ring, monolith);
      this._pushFx({
        group, mats, elapsed: 0, duration: 2100,
        update: (p, dt) => {
          const pt = this.worldToThree(tx, ty);
          group.position.set(pt.x, pt.y, 50);
          group.scale.setScalar(pt.zoom);
          monolith.rotation.y += dt * 2.0; ring.rotation.z -= dt * 2.2;
          const pop = p < 0.15 ? p / 0.15 : 1;
          monolith.scale.set(100 * pop * scale, 175 * pop * scale, 100 * pop * scale);
          ring.scale.set((200 + 150 * p) * scale, (140 + 105 * p) * scale, 1);
          const a = p > 0.8 ? (1 - p) / 0.2 : 1;
          scarM.uniforms.uAlpha.value = a * 0.88;
          monoM.uniforms.uAlpha.value = a;
          ringM.uniforms.uAlpha.value = a;
        },
      });
      return true;
    }

    // 11. 連鎖閃電 / 電弧鞭 / 閃現 / 落雷柱（多分支折線＋落地雷焦印）
    if (effectName === 'lightning_bolt' || effectName === 'arc_lash' || effectName === 'arcane_blink' || effectName === 'thunder_pillar') {
      const boltM = this._matPlasma(0xffffff, effectName === 'arc_lash' ? 0xa855f7 : 0x38bdf8);
      const scarM = this._matScar(0xa855f7, Math.random() * 9);
      mats.push(boltM, scarM);
      const isPillar = effectName === 'thunder_pillar' || effectName === 'arcane_blink';
      const p1 = isPillar ? { x: tx, y: ty - 360 } : { x: sx, y: sy - 12 };
      const p2 = { x: tx, y: ty - 8 };
      const dx = p2.x - p1.x; const dy = -(p2.y - p1.y);
      const len = Math.max(52, Math.hypot(dx, dy));
      const ang = Math.atan2(dy, dx);
      const b1Geo = this._buildBoltRibbonGeo(len, isPillar ? 42 * scale : 28 * scale, 10, isPillar ? 28 : 20);
      const b2Geo = this._buildBoltRibbonGeo(len, isPillar ? 24 * scale : 16 * scale, 8, isPillar ? 38 : 28);
      const m1 = new T.Mesh(b1Geo, boltM); m1.userData.ownGeo = true;
      const m2 = new T.Mesh(b2Geo, boltM); m2.userData.ownGeo = true;
      group.add(m1, m2);
      group.rotation.z = ang;
      this._pushFx({
        group, mats, elapsed: 0, duration: Math.max(340, dur),
        update: (p) => {
          const pt = this.worldToThree(p1.x, p1.y);
          group.position.set(pt.x, pt.y, 55);
          group.scale.setScalar(pt.zoom);
          boltM.uniforms.uAlpha.value = 1 - p * p;
        },
      });
      return true;
    }

    // 12. 球狀閃電（1.4 秒慢速旋轉電漿力場）
    if (effectName === 'ball_lightning') {
      const coreM = this._matPlasma(0xf5f3ff, 0x7c3aed);
      const ringM = this._matPlasma(0xe0f2fe, 0x38bdf8);
      mats.push(coreM, ringM);
      const core = new T.Mesh(this.geoCache.sphere, coreM); core.scale.setScalar(50 * scale);
      const t1 = new T.Mesh(this.geoCache.torus, ringM); t1.scale.setScalar(72 * scale);
      const t2 = new T.Mesh(this.geoCache.torus, ringM); t2.scale.setScalar(64 * scale); t2.rotation.x = Math.PI * 0.4;
      const t3 = new T.Mesh(this.geoCache.torus, coreM); t3.scale.setScalar(56 * scale); t3.rotation.y = Math.PI * 0.45;
      group.add(core, t1, t2, t3);
      this._pushFx({
        group, mats, elapsed: 0, duration: Math.max(1150, dur),
        update: (p, dt) => {
          const pt = this.worldToThree(tx, ty - 12);
          group.position.set(pt.x, pt.y, 46);
          group.scale.setScalar(pt.zoom);
          t1.rotation.z += dt * 11; t2.rotation.y += dt * 13; t3.rotation.x -= dt * 10;
          const a = p > 0.8 ? (1 - p) / 0.2 : 1;
          coreM.uniforms.uAlpha.value = a; ringM.uniforms.uAlpha.value = a;
        },
      });
      return true;
    }

    // 13. 啟蒙 100 層三系爆發 / 元素天災 / 星界超新星 / 黑洞
    if (effectName === 'enlightenment_nova' || effectName === 'elemental_cataclysm' || effectName === 'astral_supernova' || effectName === 'black_hole') {
      const mode = effectName === 'black_hole' ? 1 : (effectName === 'astral_supernova' ? 2 : 0);
      const colA = effectName === 'black_hole' ? 0x6d28d9 : 0x7c3aed;
      const colB = effectName === 'black_hole' ? 0x38bdf8 : 0xfde047;
      const scarM = this._matScar(colA, 5.5);
      const sigM = this._matAstral(mode, colA, colB);
      mats.push(scarM, sigM);
      const scar = new T.Mesh(this.geoCache.plane, scarM); scar.rotation.x = 0.58;
      const disc = new T.Mesh(this.geoCache.plane, sigM); disc.rotation.x = 0.58;
      group.add(scar, disc);
      let beam = null;
      if (effectName === 'astral_supernova' || effectName === 'enlightenment_nova') {
        const beamM = this._matFire(1, 0xffffff, 0xfde047, 0x7c3aed, 4.5);
        mats.push(beamM);
        beam = new T.Mesh(this.geoCache.cylinder, beamM);
        beam.position.y = 145 * scale;
        group.add(beam);
      }
      const maxR = (effectName === 'astral_supernova' ? 375 : 320) * scale;
      this._pushFx({
        group, mats, elapsed: 0, duration: Math.max(1350, dur),
        update: (p, dt) => {
          const pt = this.worldToThree(tx, ty);
          group.position.set(pt.x, pt.y, 44);
          group.scale.setScalar(pt.zoom);
          const ease = 1 - Math.pow(1 - Math.min(1, p * 1.4), 3);
          const s = maxR * (0.3 + 0.8 * ease);
          scar.scale.set(s * 1.05, s * 0.74, 1);
          disc.scale.set(s, s * 0.72, 1);
          disc.rotation.z += dt * 2.5;
          const a = p < 0.14 ? p / 0.14 : 1 - (p - 0.14) / 0.86;
          scarM.uniforms.uAlpha.value = a * 0.92;
          sigM.uniforms.uAlpha.value = a;
          if (beam) {
            beam.scale.set((64 + 92 * ease) * scale, 330 * scale, (64 + 92 * ease) * scale);
            beam.rotation.y += dt * 6;
            beam.material.uniforms.uAlpha.value = a * 0.9;
          }
        },
      });
      return true;
    }

    return false;
  }

  // 持續追蹤 3D 光環／底陣（召喚物本體改用 Phaser 精繪 2.5D 去背實體，Three.js 只負責腳下流動符文光環與劈啪電花）
  syncPersistent(id, kind, wx, wy, scale = 1, angle = 0) {
    if (!this.ready || !this.visible) return false;
    let rec = this.persistent.get(id);
    if (!rec || rec.kind !== kind) {
      if (rec) this._disposeGroup(rec.group);
      rec = this._createPersistent(kind, scale);
      if (!rec) return false;
      this.threeScene.add(rec.group);
      this.persistent.set(id, rec);
    }
    const pt = this.worldToThree(wx, wy);
    rec.group.position.set(pt.x, pt.y, kind.startsWith('barrier') ? 45 : 32);
    rec.group.scale.setScalar(pt.zoom * scale);
    rec.targetAngle = angle;
    rec.touched = true;
    return true;
  }

  _createPersistent(kind) {
    const T = this.THREE;
    const group = new T.Group();
    const mats = [];

    if (kind === 'barrier_ice') {
      const m = this._matFrost(0, 0x0284c7, 0xe0f2fe);
      const r = this._matFrost(1, 0x38bdf8, 0xffffff);
      mats.push(m, r);
      const dome = new T.Mesh(this.geoCache.icosa, m); dome.scale.setScalar(92);
      const ring = new T.Mesh(this.geoCache.plane, r); ring.rotation.x = 0.65; ring.scale.set(126, 92, 1);
      group.add(ring, dome);
      return { kind, group, mats, dome, ring };
    }
    if (kind === 'barrier_fire') {
      const r = this._matFire(2, 0xfffbeb, 0xf97316, 0x991b1b, 3.8);
      const t = this._matFire(0, 0xfef08a, 0xea580c, 0x7f1d1d, 3.2);
      mats.push(r, t);
      const ring = new T.Mesh(this.geoCache.plane, r); ring.rotation.x = 0.62; ring.scale.set(138, 100, 1);
      const tor = new T.Mesh(this.geoCache.torus, t); tor.rotation.x = 0.85; tor.scale.setScalar(96);
      group.add(ring, tor);
      return { kind, group, mats, dome: tor, ring };
    }
    if (kind === 'conj_aura_fire') {
      const m = this._matFire(2, 0xfef08a, 0xf97316, 0x991b1b, 3.2);
      mats.push(m);
      const ring = new T.Mesh(this.geoCache.plane, m); ring.rotation.x = 0.65; ring.scale.set(108, 76, 1);
      group.add(ring);
      return { kind, group, mats, ring };
    }
    if (kind === 'conj_aura_frost') {
      const m = this._matFrost(1, 0x0284c7, 0xe0f2fe);
      mats.push(m);
      const ring = new T.Mesh(this.geoCache.plane, m); ring.rotation.x = 0.65; ring.scale.set(96, 68, 1);
      group.add(ring);
      return { kind, group, mats, ring };
    }
    if (kind === 'conj_aura_shock') {
      const m = this._matPlasma(0xffffff, 0x38bdf8);
      mats.push(m);
      const tor = new T.Mesh(this.geoCache.torus, m); tor.rotation.x = 0.68; tor.scale.setScalar(56);
      group.add(tor);
      return { kind, group, mats, ring: tor };
    }
    if (kind === 'conj_aura_astral') {
      const m = this._matAstral(0, 0xf97316, 0x38bdf8);
      mats.push(m);
      const ring = new T.Mesh(this.geoCache.plane, m); ring.rotation.x = 0.65; ring.scale.set(82, 58, 1);
      group.add(ring);
      return { kind, group, mats, ring };
    }
    if (kind === 'crackling_orb') {
      const m = this._matPlasma(0xe0f2fe, 0x38bdf8);
      mats.push(m);
      const orb = new T.Mesh(this.geoCache.sphere, m); orb.scale.setScalar(26);
      const tor = new T.Mesh(this.geoCache.torus, m); tor.scale.setScalar(34);
      group.add(orb, tor);
      return { kind, group, mats, dome: tor };
    }
    return null;
  }

  render(deltaMs) {
    if (!this.ready || !this.visible) return;
    const dt = Math.min(0.05, (deltaMs || 16) / 1000);
    this.clockSec += dt;

    for (let i = this.activeFx.length - 1; i >= 0; i--) {
      const fx = this.activeFx[i];
      fx.elapsed += deltaMs;
      const p = Math.min(1, fx.elapsed / Math.max(1, fx.duration));
      for (const m of fx.mats) { if (m.uniforms?.uTime) m.uniforms.uTime.value = this.clockSec; }
      if (fx.update) fx.update(p, dt);
      if (fx.elapsed >= fx.duration) {
        this._disposeGroup(fx.group);
        this.activeFx.splice(i, 1);
      }
    }

    for (const [id, rec] of this.persistent.entries()) {
      if (!rec.touched) {
        this._disposeGroup(rec.group);
        this.persistent.delete(id);
        continue;
      }
      rec.touched = false;
      for (const m of rec.mats) { if (m.uniforms?.uTime) m.uniforms.uTime.value = this.clockSec; }
      if (rec.dome && rec.dome !== rec.group) {
        rec.dome.rotation.y += dt * 3.4; rec.dome.rotation.z += dt * 1.8;
      }
      if (rec.ring) rec.ring.rotation.z -= dt * 2.2;
    }

    this.renderer.render(this.threeScene, this.camera);
  }
}
