// v277: 獨立 2.5D 實戰演武訓練場控制器（TrainingArenaController）
// 支援零耗魔／實戰耗魔切換、4 種實戰木樁陣型、Ch.1–10 首領護甲模擬、反擊紅圈戰偶、即時 30 秒 DPS 折線圖與技能傷害佔比儀表板

const CH_ARMOR_DR = [0, 0.05, 0.12, 0.20, 0.28, 0.36, 0.44, 0.52, 0.60, 0.68];

export class TrainingArenaController {
  constructor(scene) {
    this.scene = scene;
    this.active = false;
    this.infiniteMp = true;
    this.fastCd = false;
    this.formation = 'boss'; // boss | trio | pack | striker
    this.simChapter = 1;     // 1..10
    this.trialEndAt = 0;
    this.trialTotalSec = 0;
    this._resetStats();
    this._lastSampleAt = 0;
    this._nextStrikerAt = 0;
    this._hudEl = null;
  }

  _resetStats() {
    this.startedAt = 0;
    this.totalDmg = 0;
    this.peakDps = 0;
    this.hits = 0;
    this.crits = 0;
    this.bySource = new Map();
    this.dpsHistory = new Array(30).fill(0);
    this._secBucketDmg = 0;
  }

  enter(onExitToTown) {
    const s = this.scene;
    this._onExitToTown = onExitToTown;
    const needed = [
      ['arena_training_v277', './assets/bg/arena_training.webp?v=277'],
      ['ent_dummy_normal',    './assets/fx/ent_dummy_normal.webp?v=277'],
      ['ent_dummy_boss',      './assets/fx/ent_dummy_boss.webp?v=277'],
      ['ent_dummy_striker',   './assets/fx/ent_dummy_striker.webp?v=277'],
    ].filter(([k]) => !s.textures.exists(k));

    const startNow = () => {
      this.active = true;
      s.isTrainingMode = true;
      this._resetStats();
      this.trialEndAt = 0;
      if (s.bgImage?.active) {
        s.bgImage.setTexture('arena_training_v277').setDisplaySize(4096, 2304);
      }
      s.clearAllMonsters?.();
      if (s.hero?.active) {
        s.hero.setPosition(1880, 1180);
        s.cameras?.main?.centerOn(2048, 1152);
      }
      s.playerHp = s.playerMaxHp;
      s.playerMp = s.playerMaxMp;
      s.updateHeroHpBar?.();
      this.spawnFormation(this.formation);
      this._mountHud();
    };

    if (needed.length > 0) {
      needed.forEach(([k, url]) => s.load.image(k, url));
      s.load.once('complete', startNow);
      s.load.start();
    } else {
      startNow();
    }
  }

  exit() {
    if (!this.active) return;
    const s = this.scene;
    this.active = false;
    s.isTrainingMode = false;
    this.trialEndAt = 0;
    this._unmountHud();
    s.clearAllMonsters?.();
    if (s.bgImage?.active && s.getZoneIdx) {
      const z = s.getZoneIdx();
      if (s.textures.exists(`map_zone_${z}`)) {
        s.bgImage.setTexture(`map_zone_${z}`).setDisplaySize(4096, 2304);
      }
    }
  }

  getSimulatedDr() {
    return CH_ARMOR_DR[Math.max(0, Math.min(9, (this.simChapter || 1) - 1))] || 0;
  }

  spawnFormation(form) {
    this.formation = form || 'boss';
    const s = this.scene;
    s.clearAllMonsters?.();
    const cx = 2140, cy = 1152;
    let specs = [];
    if (this.formation === 'boss') {
      specs = [{ x: cx, y: cy, key: 'ent_dummy_boss', name: `👑 首領演武木樁 (Ch.${this.simChapter})`, scale: 0.72, isBoss: true }];
    } else if (this.formation === 'trio') {
      specs = [
        { x: cx,      y: cy - 85, key: 'ent_dummy_boss',   name: '精英木樁・甲', scale: 0.56, isElite: true },
        { x: cx + 95, y: cy + 55, key: 'ent_dummy_normal', name: '精英木樁・乙', scale: 0.54, isElite: true },
        { x: cx - 75, y: cy + 65, key: 'ent_dummy_normal', name: '精英木樁・丙', scale: 0.54, isElite: true },
      ];
    } else if (this.formation === 'pack') {
      specs = [
        { x: cx,       y: cy,       key: 'ent_dummy_normal', name: '陣列木樁・中', scale: 0.50 },
        { x: cx - 110, y: cy - 75,  key: 'ent_dummy_normal', name: '陣列木樁・左', scale: 0.48 },
        { x: cx + 110, y: cy - 75,  key: 'ent_dummy_normal', name: '陣列木樁・右', scale: 0.48 },
        { x: cx - 105, y: cy + 80,  key: 'ent_dummy_normal', name: '陣列木樁・前', scale: 0.48 },
        { x: cx + 105, y: cy + 80,  key: 'ent_dummy_normal', name: '陣列木樁・後', scale: 0.48 },
      ];
    } else if (this.formation === 'striker') {
      specs = [{ x: cx, y: cy, key: 'ent_dummy_striker', name: '🛡️ 反擊測試戰偶 (2秒紅圈)', scale: 0.68, isBoss: true, isStriker: true }];
    }

    for (const spc of specs) {
      const sh = s.add.ellipse(spc.x, spc.y + 42, 74, 24, 0x000000, 0.52).setDepth(5);
      const spr = s.add.image(spc.x, spc.y, spc.key)
        .setOrigin(0.5, 0.72)
        .setScale(spc.scale)
        .setDepth(spc.y);
      const nameText = s.add.text(spc.x, spc.y - 94, spc.name, {
        fontFamily: '"Noto Sans TC", sans-serif',
        fontSize: '12.5px',
        fontStyle: 'bold',
        color: '#fde68a',
        backgroundColor: 'rgba(12,14,20,0.78)',
        padding: { x: 6, y: 2 },
      }).setOrigin(0.5).setDepth(spc.y + 90);
      const m = {
        id: `dummy_${Math.random().toString(36).slice(2, 7)}`,
        name: spc.name,
        sprite: spr,
        shadow: sh,
        nameText,
        hp: 999999999,
        maxHp: 999999999,
        atk: 0,
        speed: 0,
        isBoss: !!spc.isBoss,
        isElite: !!spc.isElite,
        isAggressive: false,
        isProvoked: true,
        isTrainingDummy: true,
        isStrikerDummy: !!spc.isStriker,
        _statuses: {},
      };
      s.monsters.push(m);
    }
    this._nextStrikerAt = (s.time?.now || 0) + 1800;
  }

  onDummyHit(m, dmg, isCrit, sourceName = '技能/普攻') {
    if (!this.active) return;
    const now = this.scene.time?.now || performance.now();
    if (!this.startedAt) this.startedAt = now;
    this.totalDmg += dmg;
    this._secBucketDmg += dmg;
    this.hits += 1;
    if (isCrit) this.crits += 1;
    const key = String(sourceName || '普攻').replace(/\s+/g, '').slice(0, 12) || '普攻';
    this.bySource.set(key, (this.bySource.get(key) || 0) + dmg);

    // 木頭人受擊微晃物理回饋
    if (m?.sprite?.active && !m._wobbling) {
      m._wobbling = true;
      const dir = Math.random() < 0.5 ? -9 : 9;
      this.scene.tweens.add({
        targets: m.sprite,
        angle: dir,
        duration: 65,
        yoyo: true,
        ease: 'Sine.easeOut',
        onComplete: () => {
          if (m.sprite?.active) m.sprite.setAngle(0);
          m._wobbling = false;
        },
      });
    }
  }

  update(time, delta) {
    if (!this.active) return;
    const s = this.scene;

    // 1. 無限能量模式鎖滿資源
    if (this.infiniteMp) {
      s.playerMp = s.playerMaxMp;
    }

    // 2. 反擊測試戰偶：每 2.2 秒對英雄腳下釋放紅圈預警攻擊（不致死，最低保留 15% HP）
    if (this.formation === 'striker' && s.hero?.active && time >= this._nextStrikerAt) {
      this._nextStrikerAt = time + 2200;
      const hx = s.hero.x, hy = s.hero.y;
      const warn = s.add.circle(hx, hy + 8, 68, 0xef4444, 0.22)
        .setStrokeStyle(2.5, 0xf87171, 0.92)
        .setDepth(50);
      s.tweens.add({
        targets: warn,
        scale: 1.08,
        alpha: 0.45,
        duration: 650,
        onComplete: () => {
          if (warn.active) warn.destroy();
          if (!this.active || !s.hero?.active) return;
          if (Phaser.Math.Distance.Between(hx, hy, s.hero.x, s.hero.y) <= 78) {
            const testDmg = Math.max(10, Math.round(s.playerMaxHp * 0.12));
            if ((s.mageShieldHp || 0) > 0) {
              const abs = Math.min(s.mageShieldHp, testDmg);
              s.mageShieldHp -= abs;
              s.spawnFloatingText?.(s.hero.x, s.hero.y - 78, `🛡️護盾吸收 ${abs}`, '#7dd3fc', 13);
            } else {
              const actual = Math.min(Math.max(0, s.playerHp - Math.round(s.playerMaxHp * 0.15)), testDmg);
              if (actual > 0) s.playerHp -= actual;
              s.updateHeroHpBar?.();
              s.spawnFloatingText?.(s.hero.x, s.hero.y - 78, `⚔️戰偶反擊 -${testDmg}`, '#fca5a5', 13);
            }
          } else {
            s.spawnFloatingText?.(s.hero.x, s.hero.y - 78, '💨 完美走位閃避！', '#4ade80', 13);
          }
        },
      });
    }

    // 3. 每 1 秒採樣 DPS 歷史曲線並更新儀表板
    if (time - this._lastSampleAt >= 1000) {
      this._lastSampleAt = time;
      const curSecDps = Math.round(this._secBucketDmg);
      this._secBucketDmg = 0;
      this.dpsHistory.shift();
      this.dpsHistory.push(curSecDps);
      if (curSecDps > this.peakDps) this.peakDps = curSecDps;

      // 計時評測結算
      if (this.trialEndAt > 0 && time >= this.trialEndAt) {
        this.trialEndAt = 0;
        const avgDps = Math.round(this.totalDmg / Math.max(1, this.trialTotalSec));
        const st = s.getState?.();
        if (st && avgDps > (st.bestDummyDps || 0)) {
          st.bestDummyDps = avgDps;
          s.callbacks?.onPersist?.();
        }
        s.spawnFloatingText?.(s.hero.x, s.hero.y - 104, `🏆 ${this.trialTotalSec}秒評測結算：${avgDps.toLocaleString()} DPS！`, '#fde047', 16);
      }
      this._renderHudMetrics(time);
    }
  }

  _mountHud() {
    this._unmountHud();
    const el = document.createElement('div');
    el.id = 'v277-training-hud';
    el.style.cssText = 'position:fixed;right:14px;top:92px;z-index:8600;width:305px;background:rgba(12,13,18,0.92);border:1.5px solid rgba(245,158,11,0.6);border-radius:12px;padding:11px 12px;color:#f3e8d2;font-family:"Noto Sans TC",sans-serif;box-shadow:0 12px 36px rgba(0,0,0,0.8);backdrop-filter:blur(6px);';
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <b style="font-size:13.5px;color:#fde047;">⚔️ 2.5D 實戰演武訓練場</b>
        <button id="v277-btn-exit" type="button" style="padding:3px 9px;border-radius:6px;border:1px solid #f59e0b;background:#451a03;color:#fef3c7;font-size:11px;font-weight:800;cursor:pointer;">🏰 回主城 [G]</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:7px;">
        <button id="v277-btn-mp" type="button" style="padding:5px;border-radius:6px;border:1px solid #38bdf8;background:#0c4a6e;color:#e0f2fe;font-size:11px;font-weight:800;cursor:pointer;">♾️ 無限能量: 開</button>
        <button id="v277-btn-cd" type="button" style="padding:5px;border-radius:6px;border:1px solid #64748b;background:#1e293b;color:#cbd5e1;font-size:11px;font-weight:800;cursor:pointer;">⏱️ 標準冷卻</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin-bottom:7px;">
        <button data-form="boss"    style="padding:4px 2px;border-radius:5px;border:1px solid #f59e0b;background:#78350f;color:#fef3c7;font-size:10.5px;font-weight:700;cursor:pointer;">👑 首領</button>
        <button data-form="trio"    style="padding:4px 2px;border-radius:5px;border:1px solid #475569;background:#1e293b;color:#cbd5e1;font-size:10.5px;font-weight:700;cursor:pointer;">👥 3精英</button>
        <button data-form="pack"    style="padding:4px 2px;border-radius:5px;border:1px solid #475569;background:#1e293b;color:#cbd5e1;font-size:10.5px;font-weight:700;cursor:pointer;">⚔️ 5群怪</button>
        <button data-form="striker" style="padding:4px 2px;border-radius:5px;border:1px solid #475569;background:#1e293b;color:#cbd5e1;font-size:10.5px;font-weight:700;cursor:pointer;">🛡️ 反擊</button>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:8px;font-size:11px;">
        <span style="color:#cbd5e1;">模擬護甲減傷：</span>
        <select id="v277-sel-ch" style="background:#0f172a;color:#fde68a;border:1px solid #475569;border-radius:5px;padding:2px 6px;font-size:11px;">
          ${Array.from({ length: 10 }, (_, i) => `<option value="${i+1}">Ch.${i+1} 首領 (${Math.round(CH_ARMOR_DR[i]*100)}% 減傷)</option>`).join('')}
        </select>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px;padding:7px;background:rgba(18,22,32,0.9);border-radius:8px;text-align:center;margin-bottom:7px;">
        <div><div style="font-size:10px;color:#94a3b8;">即時 DPS</div><b id="v277-m-dps" style="font-size:14px;color:#fde047;">0</b></div>
        <div><div style="font-size:10px;color:#94a3b8;">峰值 DPS</div><b id="v277-m-peak" style="font-size:14px;color:#fb923c;">0</b></div>
        <div><div style="font-size:10px;color:#94a3b8;">實測暴擊</div><b id="v277-m-crit" style="font-size:14px;color:#38bdf8;">0%</b></div>
      </div>
      <canvas id="v277-dps-chart" width="278" height="62" style="width:100%;height:62px;background:#090b10;border:1px solid #1e293b;border-radius:6px;margin-bottom:7px;"></canvas>
      <div id="v277-src-bars" style="display:flex;flex-direction:column;gap:4px;margin-bottom:8px;min-height:40px;font-size:11px;color:#94a3b8;">施放技能擊打木樁以顯示傷害構成...</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px;">
        <button id="v277-btn-t10"   type="button" style="padding:5px;border-radius:6px;border:1px solid #b45309;background:#292018;color:#fde68a;font-size:11px;font-weight:700;cursor:pointer;">⏱️ 10秒測</button>
        <button id="v277-btn-t30"   type="button" style="padding:5px;border-radius:6px;border:1px solid #b45309;background:#292018;color:#fde68a;font-size:11px;font-weight:700;cursor:pointer;">⏱️ 30秒測</button>
        <button id="v277-btn-reset" type="button" style="padding:5px;border-radius:6px;border:1px solid #475569;background:#1e293b;color:#e2e8f0;font-size:11px;font-weight:700;cursor:pointer;">🧹 重置</button>
      </div>
      <div id="v277-trial-status" style="font-size:10.5px;color:#86efac;text-align:center;margin-top:5px;"></div>
    `;
    document.body.appendChild(el);
    this._hudEl = el;

    el.querySelector('#v277-btn-exit')?.addEventListener('click', () => {
      this.exit();
      this._onExitToTown?.();
    });
    el.querySelector('#v277-btn-mp')?.addEventListener('click', (ev) => {
      this.infiniteMp = !this.infiniteMp;
      ev.currentTarget.textContent = this.infiniteMp ? '♾️ 無限能量: 開' : '💧 實戰耗魔: 開';
      ev.currentTarget.style.background = this.infiniteMp ? '#0c4a6e' : '#334155';
    });
    el.querySelector('#v277-btn-cd')?.addEventListener('click', (ev) => {
      this.fastCd = !this.fastCd;
      ev.currentTarget.textContent = this.fastCd ? '⚡ 極速 CD (-80%)' : '⏱️ 標準冷卻';
      ev.currentTarget.style.background = this.fastCd ? '#78350f' : '#1e293b';
    });
    el.querySelectorAll('button[data-form]').forEach((btn) => {
      btn.addEventListener('click', () => {
        el.querySelectorAll('button[data-form]').forEach((b) => { b.style.background = '#1e293b'; b.style.borderColor = '#475569'; });
        btn.style.background = '#78350f'; btn.style.borderColor = '#f59e0b';
        this.spawnFormation(btn.dataset.form);
      });
    });
    el.querySelector('#v277-sel-ch')?.addEventListener('change', (ev) => {
      this.simChapter = Number(ev.target.value) || 1;
      this.spawnFormation(this.formation);
    });
    const startTrial = (sec) => {
      this._resetStats();
      this.trialTotalSec = sec;
      this.trialEndAt = (this.scene.time?.now || 0) + sec * 1000;
      this._renderHudMetrics(this.scene.time?.now || 0);
    };
    el.querySelector('#v277-btn-t10')?.addEventListener('click', () => startTrial(10));
    el.querySelector('#v277-btn-t30')?.addEventListener('click', () => startTrial(30));
    el.querySelector('#v277-btn-reset')?.addEventListener('click', () => {
      this._resetStats();
      this.trialEndAt = 0;
      this._renderHudMetrics(this.scene.time?.now || 0);
    });
  }

  _renderHudMetrics(now) {
    if (!this._hudEl) return;
    const elapsedSec = this.startedAt ? Math.max(1, (now - this.startedAt) / 1000) : 1;
    const avgDps = Math.round(this.totalDmg / elapsedSec);
    const critPct = this.hits > 0 ? Math.round((this.crits / this.hits) * 100) : 0;
    this._hudEl.querySelector('#v277-m-dps').textContent = avgDps.toLocaleString();
    this._hudEl.querySelector('#v277-m-peak').textContent = this.peakDps.toLocaleString();
    this._hudEl.querySelector('#v277-m-crit').textContent = `${critPct}%`;

    const trialEl = this._hudEl.querySelector('#v277-trial-status');
    if (this.trialEndAt > 0) {
      const rem = Math.max(0, Math.ceil((this.trialEndAt - now) / 1000));
      trialEl.textContent = `🔥 ${this.trialTotalSec} 秒實戰評測進行中… 剩餘 ${rem} 秒（總傷 ${Math.round(this.totalDmg).toLocaleString()}）`;
    } else {
      trialEl.textContent = this.totalDmg > 0 ? `累計總傷害：${Math.round(this.totalDmg).toLocaleString()}（命中 ${this.hits} 次）` : '';
    }

    // 繪製 30 秒即時 DPS 折線圖
    const canvas = this._hudEl.querySelector('#v277-dps-chart');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const maxV = Math.max(100, ...this.dpsHistory);
      ctx.strokeStyle = 'rgba(148,163,184,0.18)';
      ctx.beginPath(); ctx.moveTo(0, h/2); ctx.lineTo(w, h/2); ctx.stroke();
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.beginPath();
      this.dpsHistory.forEach((v, i) => {
        const px = (i / 29) * (w - 8) + 4;
        const py = h - 5 - (v / maxV) * (h - 12);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.stroke();
    }

    // 繪製前 4 大傷害來源佔比條
    const barsEl = this._hudEl.querySelector('#v277-src-bars');
    if (barsEl && this.totalDmg > 0) {
      const top = [...this.bySource.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
      barsEl.innerHTML = top.map(([k, v]) => {
        const pct = Math.max(1, Math.round((v / this.totalDmg) * 100));
        return `
          <div>
            <div style="display:flex;justify-content:space-between;font-size:10.5px;color:#e2e8f0;">
              <span>${k}</span><span>${pct}%（${Math.round(v).toLocaleString()}）</span>
            </div>
            <div style="height:5px;background:#1e293b;border-radius:3px;overflow:hidden;">
              <div style="width:${pct}%;height:100%;background:linear-gradient(90deg,#f59e0b,#fde047);"></div>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  _unmountHud() {
    document.getElementById('v277-training-hud')?.remove();
    this._hudEl = null;
  }
}
