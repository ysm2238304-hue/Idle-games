// v298: 高對比怪物頭頂戰鬥傷害數字物件池（FloatingTextPool）— 96 槽預分配、depth 5000 永不被技能特效遮擋、彈跳回彈動效
export class FloatingTextPool {
  constructor(scene, maxSize = 96) {
    this.scene = scene;
    this.maxSize = maxSize;
    this.pool = [];
    this.active = [];
    this._frameCount = 0;
    this._lastFrameTime = 0;

    for (let i = 0; i < maxSize; i++) {
      const t = scene.add.text(-9999, -9999, '', {
        fontFamily: '"Noto Sans TC", "Microsoft JhengHei", "Segoe UI", sans-serif',
        fontSize: '19px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 5,
        shadow: {
          offsetX: 1,
          offsetY: 2,
          color: '#000000',
          blur: 3,
          stroke: true,
          fill: true,
        },
      })
        .setOrigin(0.5, 0.5)
        .setDepth(5000)
        .setActive(false)
        .setVisible(false);
      this.pool.push({
        obj: t,
        bornAt: 0,
        durationMs: 820,
        vx: 0,
        vy: -64,
        baseScale: 1.0,
        peakScale: 1.25,
      });
    }
  }

  spawn(x, y, text, color = '#ffffff', size = 19, opts = null) {
    const s = this.scene;
    const now = s.time?.now || performance.now();
    if (now - this._lastFrameTime > 14) {
      this._lastFrameTime = now;
      this._frameCount = 0;
    }
    // 單幀節流上限提升至 20 筆，大範圍 AOE 也能讓每隻怪頭上清楚跳出數字
    if (this._frameCount >= 20) return null;
    this._frameCount++;

    let slot = this.pool.find((p) => !p.obj.active);
    if (!slot) {
      slot = this.active.shift() || this.pool[0];
    }
    const isCrit = !!(opts && opts.isCrit) || size >= 24;
    const jitterX = (Math.random() - 0.5) * 28;
    const jitterY = -((this._frameCount % 4) * 12);
    const t = slot.obj;
    t.setPosition(x + jitterX, y + jitterY);
    t.setText(String(text));
    t.setColor(color);
    t.setFontSize(`${size}px`);
    t.setStroke('#000000', isCrit ? 6 : 5);
    t.setAlpha(1);
    t.setDepth(isCrit ? 5010 : 5000);

    slot.bornAt = now;
    slot.durationMs = isCrit ? 960 : 780;
    slot.vx = (Math.random() - 0.5) * (isCrit ? 26 : 16);
    slot.vy = isCrit ? -78 : -58;
    slot.baseScale = 1.0;
    slot.peakScale = isCrit ? 1.42 : 1.18;

    t.setScale(slot.peakScale);
    t.setActive(true).setVisible(true);

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
      slot.obj.x += slot.vx * dt * (1 - p * 0.5);
      slot.obj.y += slot.vy * dt * (1 - p * 0.55);
      // 前 18% 時間做彈跳回彈縮放（Pop-in），增加打擊辨識度
      if (p < 0.18) {
        const sp = p / 0.18;
        const sc = slot.peakScale + (slot.baseScale - slot.peakScale) * sp;
        slot.obj.setScale(sc);
      } else {
        slot.obj.setScale(slot.baseScale);
      }
      if (p > 0.62) {
        slot.obj.setAlpha(Math.max(0, 1 - (p - 0.62) / 0.38));
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
