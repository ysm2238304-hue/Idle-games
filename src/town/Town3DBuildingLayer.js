// Town3DBuildingLayer.js — v291 Three.js 全十城 80 棟專屬風格真 3D 建模建築渲染器
// 每章皆有專屬材質紋理、點光源與 8 種獨立 3D 幾何結構（鐵匠／煉金／公會／黑市／聖殿／懸賞／地標／星門）
// 渲染為透明背景高解析度 3D 模型貼圖供 Phaser 進行真實 Y-Sort（英雄不變透明且立體遮擋自然）

const CH_STYLE_PRESETS = [
  { id: 0, wall: 0x5c6068, trim: 0x3f2e21, roof: 0x353b45, accent: 0xf59e0b, glow: 0xfb923c, style: 'frontier' },   // Ch.1 灰岩橡木
  { id: 1, wall: 0x3b484f, trim: 0x2e453b, roof: 0x1d4d59, accent: 0x22d3ee, glow: 0xa855f7, style: 'mushroom' },   // Ch.2 螢光菌林
  { id: 2, wall: 0x787b82, trim: 0x454952, roof: 0x32363e, accent: 0x93c5fd, glow: 0xfde047, style: 'cathedral' },  // Ch.3 哥德廢墟
  { id: 3, wall: 0x2b292c, trim: 0x473028, roof: 0x1c191b, accent: 0xf97316, glow: 0xef4444, style: 'volcanic' },   // Ch.4 黑曜鑄鐵
  { id: 4, wall: 0x2a1d24, trim: 0x5c1824, roof: 0x1b1116, accent: 0xf43f5e, glow: 0xdc2626, style: 'crimson' },    // Ch.5 緋紅魔獄
  { id: 5, wall: 0x5d6978, trim: 0x4b382a, roof: 0xdbeafe, accent: 0x38bdf8, glow: 0x67e8f9, style: 'nordic' },     // Ch.6 維京雪頂
  { id: 6, wall: 0x4a3b2c, trim: 0x2d4a2b, roof: 0x1f4f32, accent: 0x4ade80, glow: 0x34d399, style: 'druidic' },    // Ch.7 翡翠古樹
  { id: 7, wall: 0x646b75, trim: 0x8b6b35, roof: 0x3b4e63, accent: 0x38bdf8, glow: 0xfacc15, style: 'sky' },        // Ch.8 蒼穹青銅
  { id: 8, wall: 0x4e4a52, trim: 0x611c2c, roof: 0x2d2830, accent: 0xfb7185, glow: 0xf59e0b, style: 'rose' },       // Ch.9 血月玫瑰
  { id: 9, wall: 0x1e1b2e, trim: 0xc89b3c, roof: 0x271e45, accent: 0xc084fc, glow: 0xfde047, style: 'astral' },     // Ch.10 星界金飾
];

function makeProceduralTex(THREE, baseHex, pattern = 'stone') {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const ctx = c.getContext('2d');
  const col = new THREE.Color(baseHex);
  const r0 = Math.round(col.r * 255), g0 = Math.round(col.g * 255), b0 = Math.round(col.b * 255);
  ctx.fillStyle = `rgb(${r0},${g0},${b0})`;
  ctx.fillRect(0, 0, 128, 128);

  for (let i = 0; i < 420; i++) {
    const x = (i * 37) % 128;
    const y = (i * 53) % 128;
    const d = ((i % 7) - 3) * 6;
    ctx.fillStyle = `rgba(${Math.max(0, Math.min(255, r0+d))},${Math.max(0, Math.min(255, g0+d))},${Math.max(0, Math.min(255, b0+d))},0.35)`;
    ctx.fillRect(x, y, pattern === 'wood' ? 14 : 6, pattern === 'wood' ? 3 : 6);
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.28)';
  ctx.lineWidth = 1.5;
  if (pattern === 'stone') {
    for (let y = 0; y < 128; y += 16) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(128, y); ctx.stroke();
      const off = (y / 16) % 2 === 0 ? 0 : 16;
      for (let x = off; x < 128; x += 32) {
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 16); ctx.stroke();
      }
    }
  } else if (pattern === 'wood') {
    for (let y = 0; y < 128; y += 10) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(128, y); ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export class Town3DBuildingLayer {
  constructor() {
    this.THREE = typeof window !== 'undefined' ? window.THREE : null;
    this.renderer = null;
    this.scene3d = null;
    this.camera3d = null;
    this.animatedRefs = [];
  }

  isReady() {
    return !!this.THREE;
  }

  _ensureRenderer() {
    if (!this.THREE || this.renderer) return;
    const THREE = this.THREE;
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    this.renderer.setSize(512, 512, false);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene3d = new THREE.Scene();
    const d = 3.2;
    this.camera3d = new THREE.OrthographicCamera(-d, d, d, -d, 0.1, 40);
    // 經典 2.5D 等角俯視視角
    this.camera3d.position.set(6.5, 6.2, 6.5);
    this.camera3d.lookAt(0, 1.0, 0);
  }

  _clearScene() {
    while (this.scene3d.children.length > 0) {
      this.scene3d.remove(this.scene3d.children[0]);
    }
  }

  _addLights(preset) {
    const THREE = this.THREE;
    const amb = new THREE.AmbientLight(0xdbeafe, 0.85);
    const sun = new THREE.DirectionalLight(0xfff1d6, 1.85);
    sun.position.set(5, 9, 4);
    const rim = new THREE.DirectionalLight(preset.accent, 0.95);
    rim.position.set(-6, 4, -5);
    const pt = new THREE.PointLight(preset.glow, 2.2, 8);
    pt.position.set(0, 1.8, 1.4);
    this.scene3d.add(amb, sun, rim, pt);
  }

  _mats(preset) {
    const THREE = this.THREE;
    return {
      stone: new THREE.MeshStandardMaterial({ map: makeProceduralTex(THREE, preset.wall, 'stone'), roughness: 0.82, metalness: 0.12 }),
      wood:  new THREE.MeshStandardMaterial({ map: makeProceduralTex(THREE, preset.trim, 'wood'), roughness: 0.78, metalness: 0.08 }),
      roof:  new THREE.MeshStandardMaterial({ map: makeProceduralTex(THREE, preset.roof, 'stone'), roughness: 0.65, metalness: 0.22 }),
      iron:  new THREE.MeshStandardMaterial({ color: 0x262930, roughness: 0.35, metalness: 0.85 }),
      gold:  new THREE.MeshStandardMaterial({ color: 0xd4a238, roughness: 0.28, metalness: 0.88 }),
      glow:  new THREE.MeshStandardMaterial({ color: preset.glow, emissive: preset.glow, emissiveIntensity: 1.5, roughness: 0.2 }),
      accent: new THREE.MeshStandardMaterial({ color: preset.accent, emissive: preset.accent, emissiveIntensity: 1.2, roughness: 0.25 }),
    };
  }

  // 依據 (chapterIdx, roleType) 建構真實 3D 幾何模型
  _buildModelGroup(chapterIdx, roleType) {
    const THREE = this.THREE;
    const preset = CH_STYLE_PRESETS[Math.max(0, Math.min(9, chapterIdx || 0))];
    const m = this._mats(preset);
    const g = new THREE.Group();
    const box = (w, h, d, mat, x=0, y=0, z=0, ry=0) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      mesh.position.set(x, y, z);
      if (ry) mesh.rotation.y = ry;
      g.add(mesh);
      return mesh;
    };
    const cyl = (rt, rb, h, seg, mat, x=0, y=0, z=0) => {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
      mesh.position.set(x, y, z);
      g.add(mesh);
      return mesh;
    };
    const cone = (r, h, seg, mat, x=0, y=0, z=0, ry=0) => {
      const mesh = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), mat);
      mesh.position.set(x, y, z);
      if (ry) mesh.rotation.y = ry;
      g.add(mesh);
      return mesh;
    };

    // 共通 3D 厚實台階地基（依章節變化多邊形或階梯方基）
    if (preset.style === 'sky' || preset.style === 'astral') {
      cyl(2.15, 2.35, 0.28, 8, m.stone, 0, 0.14, 0);
      cyl(2.2, 2.2, 0.08, 8, m.gold, 0, 0.29, 0);
    } else if (preset.style === 'mushroom' || preset.style === 'druidic') {
      cyl(2.1, 2.4, 0.26, 7, m.stone, 0, 0.13, 0);
    } else {
      box(4.1, 0.26, 3.6, m.stone, 0, 0.13, 0);
      box(1.4, 0.14, 0.65, m.stone, 0, 0.07, 1.95);
    }

    if (roleType === 'smith') {
      // 鐵匠鋪：依章節切換爐體（巨型錐爐／晶能柱／雙紅爐／雪頂壁爐／星鍛拱門）
      box(2.5, 1.45, 2.1, m.stone, -0.35, 0.98, -0.2);
      if (preset.style === 'volcanic' || preset.style === 'crimson') {
        cone(0.95, 2.4, 6, m.stone, -0.95, 2.15, -0.6);
        box(0.75, 0.22, 1.15, m.glow, -0.45, 0.85, 0.35);
      } else if (preset.style === 'sky' || preset.style === 'astral') {
        cyl(0.28, 0.32, 2.6, 8, m.accent, -1.25, 1.6, -0.75);
        cyl(0.28, 0.32, 2.6, 8, m.accent, 0.55, 1.6, -0.75);
        box(2.2, 0.25, 0.35, m.gold, -0.35, 2.8, -0.75);
      } else {
        cone(2.05, 1.25, 4, m.roof, -0.35, 2.32, -0.2, Math.PI / 4);
        box(0.68, 2.45, 0.68, m.stone, 0.95, 1.5, -0.55);
      }
      // 3D 發光鍛造火口與立體鐵砧
      box(0.62, 0.52, 0.45, m.glow, 0.95, 0.56, 0.25);
      box(0.55, 0.32, 0.32, m.iron, 0.85, 0.42, 1.05);
      box(0.78, 0.18, 0.28, m.iron, 0.85, 0.65, 1.05);
    } else if (roleType === 'alchemy') {
      if (preset.style === 'mushroom') {
        // 第2章：巨型發光藍傘菇頂木屋
        box(2.2, 1.35, 2.0, m.wood, 0, 0.92, 0);
        cyl(0.38, 0.52, 1.4, 8, m.accent, 0.55, 2.15, -0.2);
        cone(1.9, 0.95, 12, m.accent, 0.55, 2.95, -0.2);
        cone(1.1, 0.6, 10, m.glow, -0.75, 2.45, 0.3);
      } else if (preset.style === 'sky' || preset.style === 'astral') {
        // 第8/10章：銅管星雲蒸餾高塔與雙球體
        cyl(0.95, 1.15, 1.8, 10, m.stone, -0.3, 1.15, -0.2);
        const orb1 = new THREE.Mesh(new THREE.SphereGeometry(0.62, 16, 16), m.glow);
        orb1.position.set(0.85, 1.45, 0.4); g.add(orb1);
        const orb2 = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 16), m.accent);
        orb2.position.set(-0.3, 2.55, -0.2); g.add(orb2);
      } else {
        box(2.3, 1.5, 2.0, m.wood, -0.2, 1.0, -0.1);
        cone(1.95, 1.3, 4, m.roof, -0.2, 2.4, -0.1, Math.PI / 4);
        // 室外藥鍋與發光藥瓶
        cyl(0.42, 0.32, 0.45, 10, m.iron, 1.15, 0.48, 0.85);
        cyl(0.34, 0.34, 0.08, 10, m.glow, 1.15, 0.72, 0.85);
        cyl(0.14, 0.14, 0.35, 8, m.accent, -0.8, 0.65, 1.15);
      }
    } else if (roleType === 'guild') {
      box(2.8, 1.75, 2.3, m.stone, 0, 1.12, -0.1);
      if (preset.style === 'nordic') {
        // 第6章：維京雙交龍首長屋
        cone(2.2, 1.5, 4, m.roof, 0, 2.7, -0.1, Math.PI / 4);
        box(0.2, 0.7, 0.2, m.wood, -0.9, 3.2, 0.6);
        box(0.2, 0.7, 0.2, m.wood, 0.9, 3.2, -0.8);
      } else if (preset.style === 'druidic') {
        const dome = new THREE.Mesh(new THREE.SphereGeometry(1.45, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), m.roof);
        dome.position.set(0, 1.75, -0.1); g.add(dome);
      } else if (preset.style === 'crimson' || preset.style === 'volcanic') {
        // 尖刺魔獄高塔群
        cone(0.45, 1.5, 4, m.iron, -1.25, 2.6, -1.0, Math.PI / 4);
        cone(0.45, 1.5, 4, m.iron, 1.25, 2.6, -1.0, Math.PI / 4);
        cone(0.45, 1.5, 4, m.iron, -1.25, 2.6, 0.8, Math.PI / 4);
        cone(0.45, 1.5, 4, m.iron, 1.25, 2.6, 0.8, Math.PI / 4);
        cone(1.6, 1.4, 4, m.roof, 0, 2.65, -0.1, Math.PI / 4);
      } else {
        // 齒狀城垛雙層塔樓
        for (const sx of [-1.2, 0, 1.2]) {
          box(0.45, 0.35, 0.35, m.stone, sx, 2.15, 1.0);
          box(0.45, 0.35, 0.35, m.stone, sx, 2.15, -1.2);
        }
        box(1.3, 0.9, 1.2, m.wood, 0.4, 2.35, -0.3);
        cone(1.1, 0.85, 4, m.roof, 0.4, 3.2, -0.3, Math.PI / 4);
      }
      box(0.85, 1.15, 0.15, m.wood, 0, 0.84, 1.08);
      box(0.28, 0.9, 0.06, m.accent, -0.78, 1.35, 1.12);
      box(0.28, 0.9, 0.06, m.accent, 0.78, 1.35, 1.12);
    } else if (roleType === 'market') {
      // 四柱棚架＋章節專屬 3D 商篷／馬車／飛船
      for (const [px, pz] of [[-1.3,-1.0],[1.3,-1.0],[-1.3,1.0],[1.3,1.0]]) {
        cyl(0.11, 0.13, 1.75, 6, m.wood, px, 1.12, pz);
      }
      if (preset.style === 'sky') {
        // 飛空帆船走私艦船首＋桅杆
        box(2.4, 0.65, 1.2, m.wood, 0, 0.75, 0);
        cyl(0.08, 0.08, 2.6, 6, m.wood, 0, 2.0, 0);
        box(1.5, 1.2, 0.08, m.accent, 0, 2.1, 0.1);
      } else if (preset.style === 'cathedral') {
        // 帶輪走私馬車
        box(2.1, 1.15, 1.3, m.wood, 0, 1.15, -0.1);
        cyl(0.45, 0.45, 0.12, 12, m.iron, -0.75, 0.55, 0.72);
        cyl(0.45, 0.45, 0.12, 12, m.iron, 0.75, 0.55, 0.72);
      } else {
        cone(2.25, 1.25, 4, m.roof, 0, 2.55, 0, Math.PI / 4);
      }
      box(0.65, 0.45, 0.45, m.wood, -0.65, 0.52, 0.35);
      box(0.65, 0.45, 0.45, m.gold, 0.62, 0.52, 0.45);
      cyl(0.14, 0.14, 0.25, 6, m.glow, 1.3, 1.65, 1.0);
    } else if (roleType === 'temple') {
      if (preset.style === 'sky' || preset.style === 'astral') {
        cyl(1.35, 1.5, 1.65, 10, m.stone, 0, 1.1, 0);
        const dome = new THREE.Mesh(new THREE.SphereGeometry(1.32, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), m.gold);
        dome.position.set(0, 1.9, 0); g.add(dome);
      } else {
        box(2.3, 1.9, 2.7, m.stone, 0, 1.2, -0.1);
        cone(2.1, 1.45, 4, m.roof, 0, 2.85, -0.1, Math.PI / 4);
        cone(0.45, 1.4, 4, m.roof, 0, 3.85, -0.1, Math.PI / 4);
      }
      box(0.82, 1.25, 0.18, m.glow, 0, 0.92, 1.28);
      const rose = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.15, 12), m.accent);
      rose.rotation.x = Math.PI / 2;
      rose.position.set(0, 1.92, 1.26); g.add(rose);
    } else if (roleType === 'bounty') {
      box(0.24, 2.1, 0.24, m.wood, -1.15, 1.3, 0);
      box(0.24, 2.1, 0.24, m.wood, 1.15, 1.3, 0);
      box(2.2, 1.2, 0.14, m.wood, 0, 1.45, 0);
      box(2.9, 0.25, 0.95, m.roof, 0, 2.45, 0);
      for (const px of [-0.65, 0, 0.65]) {
        box(0.42, 0.56, 0.05, m.gold, px, 1.45, 0.1);
      }
      box(0.22, 0.32, 0.22, m.glow, 1.35, 1.95, 0.25);
    } else if (roleType === 'beacon') {
      // 10 章截然不同的 3D 主地標（第5/8/10章帶動態旋轉/懸浮動畫物件！）
      if (preset.style === 'astral') {
        cyl(1.4, 1.6, 0.35, 12, m.stone, 0, 0.42, 0);
        const r1 = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.09, 10, 32), m.gold);
        r1.position.set(0, 2.0, 0); g.add(r1);
        const r2 = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.08, 10, 28), m.gold);
        r2.position.set(0, 2.0, 0); r2.rotation.x = Math.PI / 3; g.add(r2);
        const core = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 16), m.glow);
        core.position.set(0, 2.0, 0); g.add(core);
        g.userData.animSpin = [r1, r2];
      } else if (preset.style === 'crimson' || preset.style === 'sky') {
        cyl(0.95, 1.2, 0.6, 6, m.stone, 0, 0.55, 0);
        const ob = new THREE.Mesh(new THREE.OctahedronGeometry(0.82, 0), m.accent);
        ob.scale.set(0.75, 1.9, 0.75);
        ob.position.set(0, 2.15, 0); g.add(ob);
        g.userData.animFloat = ob;
      } else {
        cyl(1.1, 1.35, 1.3, 8, m.stone, 0, 0.9, 0);
        cyl(0.95, 0.65, 0.45, 8, m.iron, 0, 1.75, 0);
        cone(0.65, 1.25, 6, m.glow, 0, 2.45, 0);
      }
    } else if (roleType === 'portal') {
      const arch = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.28, 10, 24, Math.PI), m.stone);
      arch.position.set(0, 1.45, 0); g.add(arch);
      box(0.48, 1.5, 0.55, m.stone, -1.35, 0.9, 0);
      box(0.48, 1.5, 0.55, m.stone, 1.35, 0.9, 0);
      const vortex = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.16, 12, 28), m.glow);
      vortex.position.set(0, 1.45, 0); g.add(vortex);
      const disc = new THREE.Mesh(new THREE.CircleGeometry(0.95, 24), m.accent);
      disc.position.set(0, 1.45, -0.04); g.add(disc);
      g.userData.animSpin = [vortex];
    }

    return g;
  }

  // 為單一章節的 8 棟建築產生 Three.js 3D 貼圖並註冊進 Phaser Textures
  bakeChapterToPhaser(scene, chapterIdx, roles = ['smith', 'alchemy', 'guild', 'market', 'temple', 'bounty', 'beacon', 'portal']) {
    if (!this.THREE || !scene?.textures) return false;
    this._ensureRenderer();
    const preset = CH_STYLE_PRESETS[Math.max(0, Math.min(9, chapterIdx || 0))];
    for (const role of roles) {
      const texKey = `t3d_ch${chapterIdx + 1}_${role}`;
      if (scene.textures.exists(texKey)) continue;
      this._clearScene();
      this._addLights(preset);
      const model = this._buildModelGroup(chapterIdx, role);
      this.scene3d.add(model);
      this.renderer.render(this.scene3d, this.camera3d);

      const canvasTex = scene.textures.createCanvas(texKey, 512, 512);
      const ctx = canvasTex.getContext();
      ctx.clearRect(0, 0, 512, 512);
      ctx.drawImage(this.renderer.domElement, 0, 0, 512, 512);
      canvasTex.refresh();
    }
    return true;
  }
}
