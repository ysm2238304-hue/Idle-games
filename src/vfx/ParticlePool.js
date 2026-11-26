// v266: 輕量粒子物件池（ParticlePool）— 預分配 96 顆物理粒子，統一由 update(dt) 驅動，完全取代短命 Tween
export class ParticlePool {
  constructor(scene, maxSize = 96) {
    this.scene = scene;
    this.maxSize = maxSize;
    this.pool = [];
    this.active = [];

    for (let i = 0; i < maxSize; i++) {
      const c = scene.add.circle(-9999, -9999, 4, 0xffffff, 0.9)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setActive(false)
        .setVisible(false);
      this.pool.push({
        obj: c,
        vx: 0,
        vy: 0,
        bornAt: 0,
        lifeMs: 360,
        baseScale: 1,
      });
    }
  }

  burst(x, y, colors = [0xfde047, 0xffffff], count = 6) {
    const now = this.scene.time?.now || performance.now();
    const depth = Math.max(80, Math.round(y + 24));
    const n = Math.min(count, 16);
    for (let i = 0; i < n; i++) {
      let slot = this.pool.find((p) => !p.obj.active);
      if (!slot) slot = this.active.shift() || this.pool[0];
      const ang = (Math.PI * 2 * i) / n + (Math.random() - 0.5) * 0.48;
      const spd = 85 + Math.random() * 145;
      const col = colors[i % colors.length];
      const baseScale = 0.65 + Math.random() * 0.85;
      const c = slot.obj;
      c.setPosition(x, y);
      c.setFillStyle(col, 0.92);
      c.setScale(baseScale);
      c.setAlpha(0.92);
      c.setDepth(depth);
      c.setActive(true).setVisible(true);

      slot.vx = Math.cos(ang) * spd;
      slot.vy = Math.sin(ang) * spd - (25 + Math.random() * 45);
      slot.bornAt = now;
      slot.lifeMs = 260 + Math.random() * 200;
      slot.baseScale = baseScale;
      if (!this.active.includes(slot)) this.active.push(slot);
    }
  }

  update(delta) {
    if (this.active.length === 0) return;
    const now = this.scene.time?.now || performance.now();
    const dt = Math.min(0.05, (delta || 16) / 1000);
    for (let i = this.active.length - 1; i >= 0; i--) {
      const slot = this.active[i];
      const elapsed = now - slot.bornAt;
      if (elapsed >= slot.lifeMs || !slot.obj?.active) {
        if (slot.obj) slot.obj.setActive(false).setVisible(false);
        this.active.splice(i, 1);
        continue;
      }
      const p = elapsed / slot.lifeMs;
      const drag = Math.max(0.2, 1 - p * 0.8);
      slot.obj.x += slot.vx * dt * drag;
      slot.obj.y += slot.vy * dt * drag;
      slot.obj.setScale(Math.max(0.12, slot.baseScale * (1 - p * 0.85)));
      slot.obj.setAlpha(Math.max(0, 0.92 * (1 - p)));
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
