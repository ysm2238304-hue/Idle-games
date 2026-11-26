// v266: 高頻傷害浮字物件池（FloatingTextPool）— 預分配 48 個可複用 Text，零 GC 波動、無 Tween 堆積
export class FloatingTextPool {
  constructor(scene, maxSize = 48) {
    this.scene = scene;
    this.maxSize = maxSize;
    this.pool = [];
    this.active = [];
    this._frameCount = 0;
    this._lastFrameTime = 0;

    for (let i = 0; i < maxSize; i++) {
      const t = scene.add.text(-9999, -9999, '', {
        fontFamily: '"Noto Sans TC", "Microsoft JhengHei", sans-serif',
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4,
      })
        .setOrigin(0.5)
        .setDepth(2400)
        .setActive(false)
        .setVisible(false);
      this.pool.push({ obj: t, bornAt: 0, durationMs: 760, vy: -52, startY: 0 });
    }
  }

  spawn(x, y, text, color = '#ffffff', size = 15) {
    const s = this.scene;
    const now = s.time?.now || performance.now();
    if (now - this._lastFrameTime > 14) {
      this._lastFrameTime = now;
      this._frameCount = 0;
    }
    // 單幀節流上限 8 筆，防止大範圍 AOE 瞬間洗版造成 WebGL 文字紋理上傳尖峰
    if (this._frameCount >= 8) return null;
    this._frameCount++;

    let slot = this.pool.find((p) => !p.obj.active);
    if (!slot) {
      // 全滿時回收最舊的浮字槽
      slot = this.active.shift() || this.pool[0];
    }
    const jitterX = (Math.random() - 0.5) * 22;
    const jitterY = -((this._frameCount % 3) * 10);
    const t = slot.obj;
    t.setPosition(x + jitterX, y + jitterY);
    t.setText(String(text));
    t.setColor(color);
    t.setFontSize(`${size}px`);
    t.setAlpha(1);
    t.setScale(size >= 18 ? 1.12 : 1.0);
    t.setActive(true).setVisible(true);

    slot.bornAt = now;
    slot.durationMs = size >= 18 ? 860 : 720;
    slot.vy = size >= 18 ? -58 : -48;
    slot.startY = y + jitterY;
    if (!this.active.includes(slot)) this.active.push(slot);
    return t;
  }

  update(delta) {
    if (this.active.length === 0) return;
    const now = this.scene.time?.now || performance.now();
    const dt = Math.min(0.05, (delta || 16) / 1000);
    for (let i = this.active.length - 1; i >= 0; i--) {
      const slot = this.active[i];
      const elapsed = now - slot.bornAt;
      if (elapsed >= slot.durationMs || !slot.obj?.active) {
        if (slot.obj) slot.obj.setActive(false).setVisible(false);
        this.active.splice(i, 1);
        continue;
      }
      const p = elapsed / slot.durationMs;
      slot.obj.y += slot.vy * dt * (1 - p * 0.45);
      if (p > 0.55) {
        slot.obj.setAlpha(Math.max(0, 1 - (p - 0.55) / 0.45));
      }
    }
  }

  destroy() {
    for (const slot of this.pool) {
      if (slot.obj?.active || slot.obj?.scene) slot.obj.destroy();
    }
    this.pool.length = 0;
    this.active.length = 0;
  }
}
