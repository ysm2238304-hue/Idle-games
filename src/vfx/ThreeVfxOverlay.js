// v244: Three.js + 自訂 GLSL Shader 即時動態特效覆蓋層（專為 Phaser 3 2.5D 暗黑 ARPG 打造）
// 100% 程式化 WebGL 著色器：流動烈焰 FBM / 寒冰結晶 Fresnel+Voronoi / 動態分岔電漿 / 星界符文扭曲
// 支援 window.__THREE_VFX__.registerCustomEffect(name, fn) 掛載 00GameDevs 等外部 Three.js 特效

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

// 1. 流動烈焰著色器（FBM Noise + UV 向上捲動 + 黑體色溫漸層）
const FIRE_FBM_FRAG = /* glsl */ `
  precision mediump float;
  uniform float uTime;
  uniform float uAlpha;
  uniform float uSpeed;
  uniform vec3 uColorCore;
  uniform vec3 uColorMid;
  uniform vec3 uColorEdge;
  uniform float uMode; // 0 = 圓形爆破/火球, 1 = 立體火柱/火牆, 2 = 地面火環
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p = p * 2.05 + vec2(1.7, 9.2);
      a *= 0.5;
    }
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
      float ring = exp(-pow((r - 0.72) * 7.5, 2.0));
      float inner = exp(-pow((r - 0.42) * 9.0, 2.0)) * 0.55;
      mask = (ring + inner) * smoothstep(1.0, 0.88, r);
    }

    float n = fbm(nUv);
    float n2 = fbm(nUv * 1.8 + vec2(uTime * 0.9, -uTime * uSpeed * 1.1));
    float flame = clamp(mask * (0.45 + 1.15 * n * 0.65 + 0.55 * n2), 0.0, 1.4);
    float cutoff = smoothstep(0.18, 0.92, flame);
    if (cutoff < 0.02) discard;

    vec3 col = mix(uColorEdge, uColorMid, smoothstep(0.22, 0.62, flame));
    col = mix(col, uColorCore, smoothstep(0.62, 1.08, flame));
    gl_FragColor = vec4(col * 1.35, cutoff * uAlpha);
  }
`;

// 2. 寒冰結晶著色器（Fresnel 邊緣高光 + Voronoi 冰裂紋）
const FROST_CRYSTAL_FRAG = /* glsl */ `
  precision mediump float;
  uniform float uTime;
  uniform float uAlpha;
  uniform vec3 uColorDeep;
  uniform vec3 uColorBright;
  uniform float uMode; // 0 = 3D 立體冰晶(Fresnel), 1 = 地面六芒霜陣, 2 = 碎冰衝擊環
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453);
  }
  float voronoi(vec2 x) {
    vec2 n = floor(x);
    vec2 f = fract(x);
    float md = 8.0;
    for (int j = -1; j <= 1; j++) {
      for (int i = -1; i <= 1; i++) {
        vec2 g = vec2(float(i), float(j));
        vec2 o = hash2(n + g);
        o = 0.5 + 0.45 * sin(uTime * 2.0 + 6.2831 * o);
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
      gl_FragColor = vec4(col * 1.35, a);
    } else if (uMode < 1.5) {
      float ang = atan(p.y, p.x) + uTime * 1.2;
      float hex = abs(cos(ang * 3.0));
      float outerRing = exp(-pow((r - 0.82) * 14.0, 2.0));
      float star = exp(-pow((r - (0.45 + 0.28 * hex)) * 16.0, 2.0));
      float mist = smoothstep(0.98, 0.15, r) * (0.28 + 0.35 * voronoi(p * 3.5 - uTime * 0.6));
      float inten = clamp(outerRing * 1.2 + star * 1.1 + mist, 0.0, 1.5);
      if (inten < 0.03) discard;
      vec3 col = mix(uColorDeep, uColorBright, clamp(outerRing + star, 0.0, 1.0));
      gl_FragColor = vec4(col * 1.3, inten * uAlpha);
    } else {
      float ang = atan(p.y, p.x);
      float spikes = pow(abs(sin(ang * 8.0 + uTime * 4.0)), 3.0);
      float ring = exp(-pow((r - 0.68) * 9.0, 2.0)) * (0.65 + 0.85 * spikes);
      float core = smoothstep(0.45, 0.0, r) * 0.7;
      float inten = (ring + core) * smoothstep(1.0, 0.86, r);
      if (inten < 0.03) discard;
      vec3 col = mix(uColorDeep, vec3(0.92, 0.99, 1.0), clamp(inten, 0.0, 1.0));
      gl_FragColor = vec4(col * 1.4, inten * uAlpha);
    }
  }
`;

// 3. 電漿閃電著色器（高壓白紫核心＋電弧閃爍）
const PLASMA_BOLT_FRAG = /* glsl */ `
  precision mediump float;
  uniform float uTime;
  uniform float uAlpha;
  uniform vec3 uColorCore;
  uniform vec3 uColorGlow;
  varying vec2 vUv;

  void main() {
    float dist = abs(vUv.y - 0.5) * 2.0;
    float pulse = 0.8 + 0.3 * sin(vUv.x * 28.0 - uTime * 36.0);
    float core = exp(-dist * 7.0) * pulse;
    float halo = exp(-dist * 2.3) * 0.75;
    float endFade = smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x);
    float inten = (core + halo) * endFade;
    if (inten < 0.03) discard;
    vec3 col = mix(uColorGlow, uColorCore, clamp(core * 1.4, 0.0, 1.0));
    gl_FragColor = vec4(col * 1.6, clamp(inten, 0.0, 1.0) * uAlpha);
  }
`;

// 4. 星界符文／黑洞渦流著色器（極座標旋轉＋三元素光譜）
const ASTRAL_SWIRL_FRAG = /* glsl */ `
  precision mediump float;
  uniform float uTime;
  uniform float uAlpha;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uMode; // 0 = 三系啟蒙符文大陣, 1 = 黑洞吸積盤, 2 = 超新星爆發環
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
      gl_FragColor = vec4(col * 1.5, clamp(inten, 0.0, 1.0) * uAlpha);
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
    this._maxFx = 52;
    this._initPromise = this._boot();
    if (typeof window !== 'undefined') window.__THREE_VFX__ = this;
  }

  registerCustomEffect(name, factoryFn) {
    if (name && typeof factoryFn === 'function') {
      this.customEffects.set(name, factoryFn);
    }
  }

  async _boot() {
    let THREE = null;
    for (const url of THREE_CDN_URLS) {
      try {
        THREE = await import(/* @vite-ignore */ url);
        if (THREE?.WebGLRenderer) break;
      } catch (e) {
        THREE = null;
      }
    }
    if (!THREE) {
      console.warn('[ThreeVfxOverlay] Three.js CDN unavailable, falling back to 2D VFX.');
      return;
    }
    try {
      this.THREE = THREE;
      const existing = document.getElementById('three-vfx-canvas');
      if (existing) existing.remove();

      const canvas = document.createElement('canvas');
      canvas.id = 'three-vfx-canvas';
      canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:6;';
      document.body.appendChild(canvas);
      this.canvas = canvas;

      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
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
        const nw = window.innerWidth;
        const nh = window.innerHeight;
        this.renderer.setSize(nw, nh, false);
        this.camera.right = nw;
        this.camera.bottom = -nh;
        this.camera.updateProjectionMatrix();
      };
      window.addEventListener('resize', this._onResize);
      this.ready = true;
    } catch (err) {
      console.warn('[ThreeVfxOverlay] WebGL init failed, using 2D fallback:', err);
      this.ready = false;
    }
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

  _matFire(mode = 0, core = 0xfff5d6, mid = 0xff7a18, edge = 0x991b1b, speed = 2.4) {
    const T = this.THREE;
    return new T.ShaderMaterial({
      vertexShader: BASE_VERT,
      fragmentShader: FIRE_FBM_FRAG,
      transparent: true,
      depthWrite: false,
      side: T.DoubleSide,
      blending: T.AdditiveBlending,
      uniforms: {
        uTime: { value: this.clockSec },
        uAlpha: { value: 1.0 },
        uSpeed: { value: speed },
        uMode: { value: mode },
        uColorCore: { value: new T.Color(core) },
        uColorMid: { value: new T.Color(mid) },
        uColorEdge: { value: new T.Color(edge) },
      },
    });
  }

  _matFrost(mode = 0, deep = 0x0284c7, bright = 0xbaf2ff) {
    const T = this.THREE;
    return new T.ShaderMaterial({
      vertexShader: BASE_VERT,
      fragmentShader: FROST_CRYSTAL_FRAG,
      transparent: true,
      depthWrite: false,
      side: T.DoubleSide,
      blending: T.AdditiveBlending,
      uniforms: {
        uTime: { value: this.clockSec },
        uAlpha: { value: 1.0 },
        uMode: { value: mode },
        uColorDeep: { value: new T.Color(deep) },
        uColorBright: { value: new T.Color(bright) },
      },
    });
  }

  _matPlasma(core = 0xf5f3ff, glow = 0x8b5cf6) {
    const T = this.THREE;
    return new T.ShaderMaterial({
      vertexShader: BASE_VERT,
      fragmentShader: PLASMA_BOLT_FRAG,
      transparent: true,
      depthWrite: false,
      side: T.DoubleSide,
      blending: T.AdditiveBlending,
      uniforms: {
        uTime: { value: this.clockSec },
        uAlpha: { value: 1.0 },
        uColorCore: { value: new T.Color(core) },
        uColorGlow: { value: new T.Color(glow) },
      },
    });
  }

  _matAstral(mode = 0, colA = 0x7c3aed, colB = 0xfde047) {
    const T = this.THREE;
    return new T.ShaderMaterial({
      vertexShader: BASE_VERT,
      fragmentShader: ASTRAL_SWIRL_FRAG,
      transparent: true,
      depthWrite: false,
      side: T.DoubleSide,
      blending: T.AdditiveBlending,
      uniforms: {
        uTime: { value: this.clockSec },
        uAlpha: { value: 1.0 },
        uMode: { value: mode },
        uColorA: { value: new T.Color(colA) },
        uColorB: { value: new T.Color(colB) },
      },
    });
  }

  _buildBoltRibbonGeo(len, width = 22, segments = 10, jitter = 18) {
    const T = this.THREE;
    const positions = [];
    const uvs = [];
    const indices = [];
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
      if (obj.userData?.ownGeo && obj.geometry) {
        obj.geometry.dispose();
      }
    });
  }

  playMageSkill(effectName, opts = {}) {
    if (!this.ready || !this.visible) return false;
    if (this.customEffects.has(effectName)) {
      try {
        this.customEffects.get(effectName)(this, opts);
        return true;
      } catch (e) {}
    }

    const T = this.THREE;
    const sx = opts.sx ?? opts.x ?? 0;
    const sy = opts.sy ?? opts.y ?? 0;
    const tx = opts.tx ?? opts.x ?? sx;
    const ty = opts.ty ?? opts.y ?? sy;
    const scale = opts.scale || 1;
    const dur = opts.duration || 520;
    const group = new T.Group();
    const mats = [];

    if (effectName === 'fire_bolt' || effectName === 'fireball_proj') {
      const isBig = effectName === 'fireball_proj';
      const coreM = this._matFire(0, 0xfffbeb, 0xff7b00, 0xb91c1c, 4.0);
      const trailM = this._matFire(1, 0xfef08a, 0xf97316, 0x7f1d1d, 5.2);
      mats.push(coreM, trailM);
      const orb = new T.Mesh(this.geoCache.sphere, coreM);
      const sz = (isBig ? 46 : 28) * scale;
      orb.scale.set(sz, sz, sz);
      const tail = new T.Mesh(this.geoCache.plane, trailM);
      tail.scale.set(sz * 0.9, sz * 2.4, 1);
      tail.rotation.z = Math.PI * 0.5;
      tail.position.x = -sz * 0.95;
      group.add(orb, tail);
      group.rotation.z = Math.atan2(-(ty - sy), tx - sx);
      this._pushFx({
        group, mats, elapsed: 0, duration: dur,
        update: (p, dt) => {
          const pt = this.worldToThree(sx + (tx - sx) * p, sy + (ty - sy) * p - 12);
          group.position.set(pt.x, pt.y, 40);
          group.scale.setScalar(pt.zoom);
          orb.rotation.y += dt * 8;
        },
      });
      return true;
    }

    if (effectName === 'fireball_blast' || effectName === 'fire_enchant_nova') {
      const ringM = this._matFire(2, 0xfff7ed, 0xf97316, 0x991b1b, 3.6);
      const domeM = this._matFire(0, 0xffffff, 0xfb923c, 0x7f1d1d, 4.2);
      mats.push(ringM, domeM);
      const ring = new T.Mesh(this.geoCache.plane, ringM);
      ring.rotation.x = 0.62;
      const dome = new T.Mesh(this.geoCache.sphere, domeM);
      group.add(ring, dome);
      const maxR = (effectName === 'fireball_blast' ? 210 : 175) * scale;
      this._pushFx({
        group, mats, elapsed: 0, duration: dur,
        update: (p) => {
          const pt = this.worldToThree(tx, ty);
          group.position.set(pt.x, pt.y, 35);
          const ease = 1 - Math.pow(1 - p, 3);
          const s = maxR * (0.25 + 0.85 * ease) * pt.zoom;
          ring.scale.set(s, s * 0.72, 1);
          dome.scale.set(s * 0.58, s * 0.58, s * 0.58);
          const a = p < 0.25 ? p / 0.25 : 1 - (p - 0.25) / 0.75;
          ringM.uniforms.uAlpha.value = a;
          domeM.uniforms.uAlpha.value = a * 0.9;
        },
      });
      return true;
    }

    if (effectName === 'firewall') {
      const baseM = this._matFire(2, 0xfef3c7, 0xf97316, 0x7f1d1d, 2.5);
      const wallM = this._matFire(1, 0xfffbeb, 0xf97316, 0x991b1b, 3.4);
      mats.push(baseM, wallM);
      const base = new T.Mesh(this.geoCache.plane, baseM);
      base.rotation.x = 0.68;
      base.scale.set(250 * scale, 110 * scale, 1);
      group.add(base);
      for (let i = -2; i <= 2; i++) {
        const w = new T.Mesh(this.geoCache.plane, wallM);
        w.position.set(i * 44 * scale, 52 * scale, i * 2);
        w.scale.set(66 * scale, 128 * scale, 1);
        group.add(w);
      }
      this._pushFx({
        group, mats, elapsed: 0, duration: dur || 1250,
        update: (p) => {
          const pt = this.worldToThree(tx, ty);
          group.position.set(pt.x, pt.y, 30);
          group.scale.setScalar(pt.zoom);
          const a = p < 0.12 ? p / 0.12 : (p > 0.75 ? (1 - p) / 0.25 : 1);
          baseM.uniforms.uAlpha.value = a * 0.85;
          wallM.uniforms.uAlpha.value = a;
        },
      });
      return true;
    }

    if (effectName === 'meteor_impact') {
      const rockM = this._matFire(0, 0xffffff, 0xfb923c, 0x7f1d1d, 4.2);
      const colM = this._matFire(1, 0xfffbeb, 0xf97316, 0x991b1b, 4.5);
      const ringM = this._matFire(2, 0xfef08a, 0xea580c, 0x7f1d1d, 3.5);
      mats.push(rockM, colM, ringM);
      const rock = new T.Mesh(this.geoCache.icosa, rockM);
      const col = new T.Mesh(this.geoCache.cylinder, colM);
      col.position.y = 115 * scale;
      const ring = new T.Mesh(this.geoCache.plane, ringM);
      ring.rotation.x = 0.62;
      group.add(rock, col, ring);
      this._pushFx({
        group, mats, elapsed: 0, duration: dur || 760,
        update: (p, dt) => {
          const pt = this.worldToThree(tx, ty);
          group.position.set(pt.x, pt.y, 50);
          group.scale.setScalar(pt.zoom);
          if (p < 0.32) {
            const fp = p / 0.32;
            rock.visible = true;
            rock.position.set((1 - fp) * 140, (1 - fp) * 280, 0);
            rock.scale.setScalar(56 * scale);
            rock.rotation.x += dt * 10;
            rock.rotation.y += dt * 12;
            colM.uniforms.uAlpha.value = 0;
            ringM.uniforms.uAlpha.value = fp * 0.45;
            ring.scale.set(140 * scale, 95 * scale, 1);
          } else {
            rock.visible = false;
            const bp = (p - 0.32) / 0.68;
            const ease = 1 - Math.pow(1 - bp, 3);
            const fade = 1 - bp;
            col.scale.set((90 + 80 * ease) * scale, (260 + 80 * ease) * scale, (90 + 80 * ease) * scale);
            ring.scale.set((120 + 180 * ease) * scale, (80 + 125 * ease) * scale, 1);
            colM.uniforms.uAlpha.value = fade;
            ringM.uniforms.uAlpha.value = fade;
          }
        },
      });
      return true;
    }

    if (effectName === 'inferno_serpent') {
      const vortexM = this._matFire(1, 0xfffbeb, 0xf97316, 0x991b1b, 5.2);
      const ringM = this._matFire(2, 0xfef08a, 0xea580c, 0x7f1d1d, 4.2);
      mats.push(vortexM, ringM);
      const outer = new T.Mesh(this.geoCache.cylinder, vortexM);
      outer.position.y = 110 * scale;
      outer.scale.set(190 * scale, 240 * scale, 190 * scale);
      const inner = new T.Mesh(this.geoCache.cylinder, vortexM);
      inner.position.y = 90 * scale;
      inner.scale.set(110 * scale, 210 * scale, 110 * scale);
      const floor = new T.Mesh(this.geoCache.plane, ringM);
      floor.rotation.x = 0.62;
      floor.scale.set(310 * scale, 210 * scale, 1);
      group.add(floor, outer, inner);
      this._pushFx({
        group, mats, elapsed: 0, duration: dur || 1400,
        update: (p, dt) => {
          const pt = this.worldToThree(tx, ty);
          group.position.set(pt.x, pt.y, 45);
          group.scale.setScalar(pt.zoom);
          outer.rotation.y += dt * 5.2;
          inner.rotation.y -= dt * 7.8;
          floor.rotation.z += dt * 2.8;
          const a = p < 0.15 ? p / 0.15 : (p > 0.72 ? (1 - p) / 0.28 : 1);
          vortexM.uniforms.uAlpha.value = a * 0.92;
          ringM.uniforms.uAlpha.value = a;
        },
      });
      return true;
    }

    if (effectName === 'frost_bolt' || effectName === 'ice_shards') {
      const m = this._matFrost(0, 0x0369a1, 0xe0f2fe);
      mats.push(m);
      const count = effectName === 'ice_shards' ? 3 : 1;
      const spears = [];
      for (let i = 0; i < count; i++) {
        const sp = new T.Mesh(this.geoCache.cone, m);
        sp.rotation.z = -Math.PI * 0.5;
        sp.scale.set(18 * scale, 58 * scale, 18 * scale);
        sp.position.y = (i - (count - 1) / 2) * 18;
        group.add(sp);
        spears.push(sp);
      }
      group.rotation.z = Math.atan2(-(ty - sy), tx - sx);
      this._pushFx({
        group, mats, elapsed: 0, duration: dur || 220,
        update: (p, dt) => {
          const pt = this.worldToThree(sx + (tx - sx) * p, sy + (ty - sy) * p - 12);
          group.position.set(pt.x, pt.y, 42);
          group.scale.setScalar(pt.zoom);
          spears.forEach((s) => { s.rotation.x += dt * 12; });
        },
      });
      return true;
    }

    if (effectName === 'frozen_orb') {
      const coreM = this._matFrost(0, 0x0284c7, 0xe0f2fe);
      const ringM = this._matFrost(1, 0x0ea5e9, 0xbae6fd);
      mats.push(coreM, ringM);
      const core = new T.Mesh(this.geoCache.icosa, coreM);
      core.scale.setScalar(68 * scale);
      const ring = new T.Mesh(this.geoCache.plane, ringM);
      ring.scale.setScalar(132 * scale);
      group.add(ring, core);
      this._pushFx({
        group, mats, elapsed: 0, duration: dur || 640,
        update: (p, dt) => {
          const ease = 1 - Math.pow(1 - p, 2);
          const pt = this.worldToThree(sx + (tx - sx) * ease, sy + (ty - sy) * ease - 12);
          group.position.set(pt.x, pt.y, 48);
          group.scale.setScalar(pt.zoom * (0.85 + 0.3 * p));
          core.rotation.x += dt * 6.5;
          core.rotation.y += dt * 8.5;
          ring.rotation.z -= dt * 7.0;
          const a = p > 0.85 ? (1 - p) / 0.15 : 1;
          coreM.uniforms.uAlpha.value = a;
          ringM.uniforms.uAlpha.value = a;
        },
      });
      return true;
    }

    if (effectName === 'frost_nova' || effectName === 'shatter_burst') {
      const spikeM = this._matFrost(0, 0x0369a1, 0xf0f9ff);
      const ringM = this._matFrost(2, 0x0284c7, 0xe0f2fe);
      mats.push(spikeM, ringM);
      const ring = new T.Mesh(this.geoCache.plane, ringM);
      ring.rotation.x = 0.62;
      group.add(ring);
      const spikes = [];
      const nSpikes = effectName === 'frost_nova' ? 12 : 8;
      for (let i = 0; i < nSpikes; i++) {
        const ang = (i / nSpikes) * Math.PI * 2;
        const cone = new T.Mesh(this.geoCache.cone, spikeM);
        cone.userData.ang = ang;
        cone.rotation.z = ang - Math.PI * 0.5;
        group.add(cone);
        spikes.push(cone);
      }
      const maxR = (effectName === 'frost_nova' ? 250 : 185) * scale;
      this._pushFx({
        group, mats, elapsed: 0, duration: dur || 480,
        update: (p) => {
          const pt = this.worldToThree(tx, ty);
          group.position.set(pt.x, pt.y, 38);
          group.scale.setScalar(pt.zoom);
          const ease = 1 - Math.pow(1 - p, 3);
          const s = maxR * (0.2 + 0.9 * ease);
          ring.scale.set(s, s * 0.72, 1);
          spikes.forEach((sp) => {
            const dist = 24 + maxR * 0.42 * ease;
            sp.position.set(Math.cos(sp.userData.ang) * dist, Math.sin(sp.userData.ang) * dist * 0.68, 12);
            sp.scale.set(22 * scale, (55 + 32 * ease) * scale, 22 * scale);
          });
          const a = p < 0.2 ? p / 0.2 : 1 - (p - 0.2) / 0.8;
          spikeM.uniforms.uAlpha.value = a;
          ringM.uniforms.uAlpha.value = a;
        },
      });
      return true;
    }

    if (effectName === 'blizzard_field') {
      const sigilM = this._matFrost(1, 0x0284c7, 0xe0f2fe);
      const shardM = this._matFrost(0, 0x38bdf8, 0xffffff);
      mats.push(sigilM, shardM);
      const sigil = new T.Mesh(this.geoCache.plane, sigilM);
      sigil.rotation.x = 0.62;
      sigil.scale.set(290 * scale, 200 * scale, 1);
      group.add(sigil);
      const shards = [];
      for (let i = 0; i < 14; i++) {
        const c = new T.Mesh(this.geoCache.cone, shardM);
        c.rotation.z = Math.PI + 0.24;
        c.scale.set(12 * scale, 48 * scale, 12 * scale);
        c.userData = {
          ox: (Math.random() - 0.5) * 220 * scale,
          oy: (Math.random() - 0.5) * 120 * scale,
          phase: Math.random(),
        };
        group.add(c);
        shards.push(c);
      }
      this._pushFx({
        group, mats, elapsed: 0, duration: dur || 1200,
        update: (p, dt) => {
          const pt = this.worldToThree(tx, ty);
          group.position.set(pt.x, pt.y, 36);
          group.scale.setScalar(pt.zoom);
          sigil.rotation.z += dt * 1.6;
          shards.forEach((s) => {
            const fp = (p * 2.4 + s.userData.phase) % 1.0;
            s.position.set(s.userData.ox + (1 - fp) * 55, s.userData.oy + (1 - fp) * 230, 15);
          });
          const a = p < 0.12 ? p / 0.12 : (p > 0.78 ? (1 - p) / 0.22 : 1);
          sigilM.uniforms.uAlpha.value = a * 0.9;
          shardM.uniforms.uAlpha.value = a;
        },
      });
      return true;
    }

    if (effectName === 'deep_freeze') {
      const monoM = this._matFrost(0, 0x0284c7, 0xf0f9ff);
      const ringM = this._matFrost(1, 0x0ea5e9, 0xe0f2fe);
      mats.push(monoM, ringM);
      const monolith = new T.Mesh(this.geoCache.octa, monoM);
      monolith.position.y = 32 * scale;
      const ring = new T.Mesh(this.geoCache.plane, ringM);
      ring.rotation.x = 0.62;
      group.add(ring, monolith);
      this._pushFx({
        group, mats, elapsed: 0, duration: dur || 1100,
        update: (p, dt) => {
          const pt = this.worldToThree(tx, ty);
          group.position.set(pt.x, pt.y, 52);
          group.scale.setScalar(pt.zoom);
          monolith.rotation.y += dt * 2.2;
          ring.rotation.z -= dt * 2.4;
          const pop = p < 0.2 ? p / 0.2 : 1;
          monolith.scale.set(95 * pop * scale, 165 * pop * scale, 95 * pop * scale);
          ring.scale.set((180 + 140 * p) * scale, (125 + 95 * p) * scale, 1);
          const a = p > 0.75 ? (1 - p) / 0.25 : 1;
          monoM.uniforms.uAlpha.value = a;
          ringM.uniforms.uAlpha.value = a;
        },
      });
      return true;
    }

    if (effectName === 'lightning_bolt' || effectName === 'arc_lash' || effectName === 'arcane_blink' || effectName === 'thunder_pillar') {
      const boltM = this._matPlasma(0xffffff, effectName === 'arc_lash' ? 0xa855f7 : 0x38bdf8);
      mats.push(boltM);
      const isPillar = effectName === 'thunder_pillar' || effectName === 'arcane_blink';
      const p1 = isPillar ? { x: tx, y: ty - 340 } : { x: sx, y: sy - 12 };
      const p2 = { x: tx, y: ty - 8 };
      const dx = p2.x - p1.x;
      const dy = -(p2.y - p1.y);
      const len = Math.max(48, Math.hypot(dx, dy));
      const ang = Math.atan2(dy, dx);
      const b1Geo = this._buildBoltRibbonGeo(len, isPillar ? 38 * scale : 26 * scale, 10, isPillar ? 26 : 18);
      const b2Geo = this._buildBoltRibbonGeo(len, isPillar ? 22 * scale : 15 * scale, 8, isPillar ? 36 : 26);
      const m1 = new T.Mesh(b1Geo, boltM); m1.userData.ownGeo = true;
      const m2 = new T.Mesh(b2Geo, boltM); m2.userData.ownGeo = true;
      group.add(m1, m2);
      group.rotation.z = ang;
      this._pushFx({
        group, mats, elapsed: 0, duration: dur || 320,
        update: (p) => {
          const pt = this.worldToThree(p1.x, p1.y);
          group.position.set(pt.x, pt.y, 55);
          group.scale.setScalar(pt.zoom);
          boltM.uniforms.uAlpha.value = 1 - p * p;
        },
      });
      return true;
    }

    if (effectName === 'ball_lightning') {
      const coreM = this._matPlasma(0xf5f3ff, 0x7c3aed);
      const ringM = this._matPlasma(0xe0f2fe, 0x38bdf8);
      mats.push(coreM, ringM);
      const core = new T.Mesh(this.geoCache.sphere, coreM);
      core.scale.setScalar(48 * scale);
      const t1 = new T.Mesh(this.geoCache.torus, ringM); t1.scale.setScalar(68 * scale);
      const t2 = new T.Mesh(this.geoCache.torus, ringM); t2.scale.setScalar(62 * scale); t2.rotation.x = Math.PI * 0.4;
      const t3 = new T.Mesh(this.geoCache.torus, coreM); t3.scale.setScalar(54 * scale); t3.rotation.y = Math.PI * 0.45;
      group.add(core, t1, t2, t3);
      this._pushFx({
        group, mats, elapsed: 0, duration: dur || 620,
        update: (p, dt) => {
          const pt = this.worldToThree(tx, ty - 12);
          group.position.set(pt.x, pt.y, 46);
          group.scale.setScalar(pt.zoom);
          t1.rotation.z += dt * 11;
          t2.rotation.y += dt * 13;
          t3.rotation.x -= dt * 10;
          const a = p > 0.78 ? (1 - p) / 0.22 : 1;
          coreM.uniforms.uAlpha.value = a;
          ringM.uniforms.uAlpha.value = a;
        },
      });
      return true;
    }

    if (effectName === 'enlightenment_nova' || effectName === 'elemental_cataclysm' || effectName === 'astral_supernova' || effectName === 'black_hole') {
      const mode = effectName === 'black_hole' ? 1 : (effectName === 'astral_supernova' ? 2 : 0);
      const colA = effectName === 'black_hole' ? 0x6d28d9 : 0x7c3aed;
      const colB = effectName === 'black_hole' ? 0x38bdf8 : 0xfde047;
      const sigM = this._matAstral(mode, colA, colB);
      mats.push(sigM);
      const disc = new T.Mesh(this.geoCache.plane, sigM);
      disc.rotation.x = 0.58;
      group.add(disc);
      let beam = null;
      if (effectName === 'astral_supernova' || effectName === 'enlightenment_nova') {
        const beamM = this._matFire(1, 0xffffff, 0xfde047, 0x7c3aed, 4.5);
        mats.push(beamM);
        beam = new T.Mesh(this.geoCache.cylinder, beamM);
        beam.position.y = 140 * scale;
        group.add(beam);
      }
      const maxR = (effectName === 'astral_supernova' ? 360 : 300) * scale;
      this._pushFx({
        group, mats, elapsed: 0, duration: dur || 880,
        update: (p, dt) => {
          const pt = this.worldToThree(tx, ty);
          group.position.set(pt.x, pt.y, 44);
          group.scale.setScalar(pt.zoom);
          const ease = 1 - Math.pow(1 - p, 3);
          const s = maxR * (0.3 + 0.8 * ease);
          disc.scale.set(s, s * 0.72, 1);
          disc.rotation.z += dt * 2.5;
          const a = p < 0.16 ? p / 0.16 : 1 - (p - 0.16) / 0.84;
          sigM.uniforms.uAlpha.value = a;
          if (beam) {
            beam.scale.set((60 + 90 * ease) * scale, 320 * scale, (60 + 90 * ease) * scale);
            beam.rotation.y += dt * 6;
            beam.material.uniforms.uAlpha.value = a * 0.9;
          }
        },
      });
      return true;
    }

    return false;
  }

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
    rec.group.position.set(pt.x, pt.y, kind.startsWith('barrier') ? 45 : 40);
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
      const dome = new T.Mesh(this.geoCache.icosa, m);
      dome.scale.setScalar(92);
      const ring = new T.Mesh(this.geoCache.plane, r);
      ring.rotation.x = 0.65;
      ring.scale.set(126, 92, 1);
      group.add(ring, dome);
      return { kind, group, mats, dome, ring };
    }
    if (kind === 'barrier_fire') {
      const r = this._matFire(2, 0xfffbeb, 0xf97316, 0x991b1b, 3.8);
      const t = this._matFire(0, 0xfef08a, 0xea580c, 0x7f1d1d, 3.2);
      mats.push(r, t);
      const ring = new T.Mesh(this.geoCache.plane, r);
      ring.rotation.x = 0.62;
      ring.scale.set(138, 100, 1);
      const tor = new T.Mesh(this.geoCache.torus, t);
      tor.rotation.x = 0.85;
      tor.scale.setScalar(96);
      group.add(ring, tor);
      return { kind, group, mats, dome: tor, ring };
    }
    if (kind === 'conj_hydra') {
      const baseM = this._matFire(2, 0xfef08a, 0xf97316, 0x991b1b, 3.2);
      const neckM = this._matFire(1, 0xfffbeb, 0xfb923c, 0x991b1b, 4.4);
      mats.push(baseM, neckM);
      const base = new T.Mesh(this.geoCache.plane, baseM);
      base.rotation.x = 0.65;
      base.scale.set(96, 68, 1);
      group.add(base);
      const heads = [];
      [-24, 0, 24].forEach((ox, idx) => {
        const neck = new T.Mesh(this.geoCache.cone, neckM);
        neck.position.set(ox, 36 + (idx === 1 ? 14 : 0), 0);
        neck.scale.set(22, 68, 22);
        group.add(neck);
        heads.push(neck);
      });
      return { kind, group, mats, heads, ring: base };
    }
    if (kind === 'conj_ice_blades') {
      const m = this._matFrost(0, 0x0ea5e9, 0xf0f9ff);
      mats.push(m);
      const b1 = new T.Mesh(this.geoCache.cone, m); b1.scale.set(14, 78, 10); b1.rotation.z = 0.55;
      const b2 = new T.Mesh(this.geoCache.cone, m); b2.scale.set(14, 78, 10); b2.rotation.z = -0.55;
      group.add(b1, b2);
      return { kind, group, mats, dome: group };
    }
    if (kind === 'conj_lightning_spear') {
      const m = this._matPlasma(0xffffff, 0x38bdf8);
      mats.push(m);
      const geo = this._buildBoltRibbonGeo(92, 20, 7, 10);
      const sp = new T.Mesh(geo, m); sp.userData.ownGeo = true;
      sp.position.x = -46;
      group.add(sp);
      return { kind, group, mats, dome: sp };
    }
    if (kind === 'conj_familiar') {
      const m = this._matAstral(0, 0xf97316, 0x38bdf8);
      mats.push(m);
      const orb = new T.Mesh(this.geoCache.octa, m);
      orb.scale.setScalar(36);
      const ring = new T.Mesh(this.geoCache.plane, m);
      ring.scale.setScalar(64);
      group.add(ring, orb);
      return { kind, group, mats, dome: orb, ring };
    }
    if (kind === 'crackling_orb') {
      const m = this._matPlasma(0xe0f2fe, 0x38bdf8);
      mats.push(m);
      const orb = new T.Mesh(this.geoCache.sphere, m);
      orb.scale.setScalar(26);
      const tor = new T.Mesh(this.geoCache.torus, m);
      tor.scale.setScalar(34);
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
      for (const m of fx.mats) {
        if (m.uniforms?.uTime) m.uniforms.uTime.value = this.clockSec;
      }
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
      for (const m of rec.mats) {
        if (m.uniforms?.uTime) m.uniforms.uTime.value = this.clockSec;
      }
      if (rec.dome && rec.dome !== rec.group) {
        rec.dome.rotation.y += dt * 3.4;
        rec.dome.rotation.z += dt * 1.8;
      }
      if (rec.ring) {
        rec.ring.rotation.z -= dt * 2.1;
      }
      if (rec.heads) {
        rec.heads.forEach((h, idx) => {
          h.rotation.z = Math.sin(this.clockSec * 5.2 + idx * 2.1) * 0.22;
        });
      }
      if (rec.kind === 'conj_ice_blades' || rec.kind === 'conj_lightning_spear') {
        rec.group.rotation.z = -(rec.targetAngle || 0);
      }
    }

    this.renderer.render(this.threeScene, this.camera);
  }
}
