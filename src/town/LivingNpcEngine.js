// v273: 主城活體 NPC 自然行為狀態機（LivingNpcEngine）
// 單一控制權同步角色、腳底陰影、頭頂名牌、互動圖示與互動座標，徹底消除雙系統互搶與名牌分離

const CLASS_CN = {
  warrior: '狂戰士',
  ranger: '遊俠',
  mage: '秘法師',
  paladin: '聖殿騎士',
  necro: '死靈法師',
  assassin: '暗影刺客',
};

export class LivingNpcEngine {
  constructor(scene) {
    this.scene = scene;
    this.agents = [];
  }

  registerNpc(sprite, cfg = {}) {
    if (!sprite) return null;
    const s = this.scene;
    const homeX = sprite.x;
    const homeY = sprite.y;
    const ring = s.add.ellipse(homeX, homeY + 4, 58, 22, 0xfde047, 0.0)
      .setStrokeStyle(1.8, 0xfde047, 0.0)
      .setDepth(4);
    const agent = {
      sprite,
      shadow: cfg.shadow || null,
      plate: cfg.plate || null,
      icon: cfg.icon || null,
      interactObj: cfg.interactObj || null,
      ring,
      homeX,
      homeY,
      name: cfg.name || '城鎮居民',
      workStyle: cfg.workStyle || 'idle',
      greeting: cfg.greeting || '歡迎光臨！',
      baseScale: sprite.scaleX || 0.62,
      state: 'work',
      stateUntil: (s.time?.now || 0) + 1800 + Math.random() * 2500,
      targetX: homeX,
      targetY: homeY,
      lastGreetAt: 0,
      lastWorkFxAt: 0,
      bubble: null,
      bubbleUntil: 0,
    };
    this.agents.push(agent);
    return agent;
  }

  triggerTownBlessingWave(x, y, color = 0xfde047) {
    const s = this.scene;
    const wave = s.add.circle(x, y, 24, color, 0.22)
      .setStrokeStyle(3, 0xfef08a, 0.92)
      .setDepth(Math.round(y + 10));
    s.tweens.add({
      targets: wave,
      scale: 22,
      alpha: 0,
      duration: 1100,
      ease: 'Cubic.easeOut',
      onComplete: () => { if (wave.active) wave.destroy(); },
    });
    this.agents.forEach((a, i) => {
      if (i % 2 === 0) this._showBubble(a, '✨ 願祝福庇佑各位冒險者！', 3000);
    });
  }

  _spawnWorkMote(agent) {
    const s = this.scene;
    const colMap = {
      forge: 0xfb923c, alchemy: 0x34d399, prayer: 0xfef08a,
      bounty: 0xfbbf24, market: 0xf59e0b, guild: 0x60a5fa,
    };
    const col = colMap[agent.workStyle] || 0xfde047;
    const sx = agent.sprite.x + (Math.random() - 0.5) * 24;
    const sy = agent.sprite.y - 34;
    const p = s.add.circle(sx, sy, 3.2, col, 0.88)
      .setDepth(agent.sprite.depth + 20)
      .setBlendMode(Phaser.BlendModes.ADD);
    s.tweens.add({
      targets: p,
      x: sx + (Math.random() - 0.5) * 28,
      y: sy - (18 + Math.random() * 24),
      scale: 0.2,
      alpha: 0,
      duration: 540,
      ease: 'Cubic.easeOut',
      onComplete: () => { if (p.active) p.destroy(); },
    });
  }

  _showBubble(agent, text, durationMs = 3400) {
    const s = this.scene;
    if (agent.bubble?.active) agent.bubble.destroy();
    agent.bubble = s.add.text(agent.sprite.x, agent.sprite.y - 156, text, {
      fontFamily: '"Noto Sans TC", sans-serif',
      fontSize: '12px',
      color: '#fef3c7',
      backgroundColor: 'rgba(18, 15, 22, 0.88)',
      padding: { x: 8, y: 4 },
      wordWrap: { width: 210 },
    }).setOrigin(0.5).setDepth(4600);
    agent.bubbleUntil = (s.time?.now || 0) + durationMs;
  }

  update(time, delta) {
    const s = this.scene;
    const hero = s.hero;
    if (!hero || this.agents.length === 0) return;
    const dt = Math.min(0.05, (delta || 16) / 1000);
    const st = s.callbacks?.getState?.() || window.__IDLE_ARPG_BRIDGE__?.getState?.() || {};
    const clsName = CLASS_CN[st.classId] || '冒險者';

    for (const a of this.agents) {
      const sp = a.sprite;
      if (!sp?.active) continue;
      const distHero = Phaser.Math.Distance.Between(hero.x, hero.y, sp.x, sp.y);

      if (distHero <= 175) {
        a.state = 'greet';
        if (sp.setFlipX) sp.setFlipX(hero.x < sp.x);
        a.ring.setPosition(sp.x, sp.y + 4).setAlpha(0.30 + Math.sin(time * 0.008) * 0.14);
        a.ring.setStrokeStyle(1.8, 0xfde047, 0.80);
        if (time - a.lastGreetAt > 9500) {
          a.lastGreetAt = time;
          this._showBubble(a, `${clsName}大人，${a.greeting}`.slice(0, 34), 3600);
        }
      } else {
        a.ring.setAlpha(0);
        a.ring.setStrokeStyle(1.8, 0xfde047, 0);
        if (a.state === 'greet') {
          a.state = 'work';
          a.stateUntil = time + 2400;
        }
        if (time >= a.stateUntil) {
          const r = Math.random();
          if (r < 0.50) {
            a.state = 'work';
            a.stateUntil = time + 2800 + Math.random() * 2400;
          } else if (r < 0.82) {
            a.state = 'stroll';
            a.stateUntil = time + 2200 + Math.random() * 1800;
            const ang = Math.random() * Math.PI * 2;
            const rad = 18 + Math.random() * 32;
            a.targetX = a.homeX + Math.cos(ang) * rad;
            a.targetY = a.homeY + Math.sin(ang) * rad * 0.65;
          } else {
            a.state = 'idle';
            a.stateUntil = time + 1800 + Math.random() * 1800;
          }
        }
        if (a.state === 'stroll') {
          const dx = a.targetX - sp.x;
          const dy = a.targetY - sp.y;
          const d = Math.hypot(dx, dy);
          if (d > 3) {
            const step = Math.min(d, 44 * dt);
            sp.x += (dx / d) * step;
            sp.y += (dy / d) * step;
            if (sp.setFlipX) sp.setFlipX(dx < -2);
            sp.setDepth(sp.y);
          } else {
            a.state = 'idle';
          }
        } else if (a.state === 'work') {
          const pulse = Math.sin(time * 0.007) * 0.025;
          sp.setScale(a.baseScale, a.baseScale * (1 + pulse));
          if (time - a.lastWorkFxAt > 1200 + Math.random() * 600) {
            a.lastWorkFxAt = time;
            this._spawnWorkMote(a);
          }
        } else {
          sp.setScale(a.baseScale, a.baseScale * (1 + Math.sin(time * 0.003) * 0.012));
        }
      }

      // 完整同步陰影、名牌、圖示與互動判定點，杜絕分離或錯亂
      if (a.shadow?.active) a.shadow.setPosition(sp.x, sp.y + 2);
      if (a.plate?.active) a.plate.setPosition(sp.x, sp.y - 112);
      if (a.icon?.active) a.icon.setX(sp.x);
      if (a.interactObj) { a.interactObj.x = sp.x; a.interactObj.y = sp.y; }
      if (a.bubble?.active) {
        if (time >= a.bubbleUntil) {
          a.bubble.destroy();
          a.bubble = null;
        } else {
          a.bubble.setPosition(sp.x, sp.y - 156);
        }
      }
    }
  }

  destroy() {
    this.agents.forEach((a) => {
      a.ring?.destroy();
      a.bubble?.destroy();
    });
    this.agents = [];
  }
}
