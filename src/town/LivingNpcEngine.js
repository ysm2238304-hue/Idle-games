// v267: 主城活體 NPC 自然行為狀態機（LivingNpcEngine）
// 4 態循環：idle（呼吸張望）/ work（敲打鍛造・煉藥冒泡・祈禱光粒）/ stroll（門前自然踱步）/ greet（玩家靠近轉身迎賓＋動態情境台詞）

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
    const ring = s.add.ellipse(homeX, homeY + 20, 56, 22, 0xfde047, 0.0)
      .setStrokeStyle(1.8, 0xfde047, 0.0)
      .setDepth(4);
    const agent = {
      sprite,
      ring,
      homeX,
      homeY,
      name: cfg.name || '城鎮居民',
      workStyle: cfg.workStyle || 'idle', // forge | alchemy | prayer | bounty | market | guild
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
      nameLabel: cfg.nameLabel || null,
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
      if (i % 2 === 0) this._showBubble(a, '✨ 願曙光庇佑各位冒險者！', 3000);
    });
  }

  _spawnWorkMote(agent) {
    const s = this.scene;
    const colMap = {
      forge: 0xfb923c,
      alchemy: 0x34d399,
      prayer: 0xfef08a,
      bounty: 0xfbbf24,
      market: 0xf59e0b,
      guild: 0x60a5fa,
    };
    const col = colMap[agent.workStyle] || 0xfde047;
    const sx = agent.sprite.x + (Math.random() - 0.5) * 24;
    const sy = agent.sprite.y - 18;
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
    agent.bubble = s.add.text(agent.sprite.x, agent.sprite.y - 78, text, {
      fontFamily: '"Noto Sans TC", sans-serif',
      fontSize: '12px',
      color: '#fef3c7',
      backgroundColor: 'rgba(18, 15, 22, 0.88)',
      padding: { x: 8, y: 4 },
      wordWrap: { width: 210 },
    }).setOrigin(0.5).setDepth(2550);
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

      // 1. 玩家靠近 180px：進入迎賓態（Greet）
      if (distHero <= 180) {
        a.state = 'greet';
        if (sp.setFlipX) sp.setFlipX(hero.x < sp.x);
        a.ring.setPosition(sp.x, sp.y + 20).setAlpha(0.32 + Math.sin(time * 0.008) * 0.16);
        a.ring.setStrokeStyle(1.8, 0xfde047, 0.82);
        if (time - a.lastGreetAt > 9000) {
          a.lastGreetAt = time;
          const line = `${clsName}大人，${a.greeting}`;
          this._showBubble(a, line.slice(0, 34), 3800);
        }
      } else {
        a.ring.setAlpha(0);
        a.ring.setStrokeStyle(1.8, 0xfde047, 0);
        if (a.state === 'greet') {
          a.state = 'work';
          a.stateUntil = time + 2200;
        }

        // 狀態切換：work <-> stroll <-> idle
        if (time >= a.stateUntil) {
          const r = Math.random();
          if (r < 0.45) {
            a.state = 'work';
            a.stateUntil = time + 2800 + Math.random() * 2400;
          } else if (r < 0.80) {
            a.state = 'stroll';
            a.stateUntil = time + 2400 + Math.random() * 2000;
            const ang = Math.random() * Math.PI * 2;
            const rad = 24 + Math.random() * 44;
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
          if (d > 4) {
            const step = Math.min(d, 48 * dt);
            sp.x += (dx / d) * step;
            sp.y += (dy / d) * step;
            if (sp.setFlipX) sp.setFlipX(dx < -2);
            sp.setDepth(sp.y);
          } else {
            a.state = 'idle';
          }
        } else if (a.state === 'work') {
          // 工作微律動＋對應職業火星／藥霧粒子
          const pulse = Math.sin(time * 0.008) * 0.035;
          sp.setScale(a.baseScale, a.baseScale * (1 + pulse));
          if (time - a.lastWorkFxAt > 1100 + Math.random() * 600) {
            a.lastWorkFxAt = time;
            this._spawnWorkMote(a);
          }
        } else {
          // 待機自然呼吸
          sp.setScale(a.baseScale, a.baseScale * (1 + Math.sin(time * 0.003) * 0.015));
        }
      }

      if (a.nameLabel?.active) {
        a.nameLabel.setPosition(sp.x, sp.y - 54).setDepth(sp.y + 80);
      }
      if (a.bubble?.active) {
        if (time >= a.bubbleUntil) {
          a.bubble.destroy();
          a.bubble = null;
        } else {
          a.bubble.setPosition(sp.x, sp.y - 78);
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
