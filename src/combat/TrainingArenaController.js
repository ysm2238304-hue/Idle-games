// v299: 獨立 2.5D 實戰演武訓練場控制器（TrainingArenaController）
// 搭載全新獨立玄武岩八角演武場地圖＋3款寫實貼地戰偶＋獨立 DpsMeterEngine 計算引擎＋可拖曳不遮小地圖儀表板
import { DpsMeterEngine } from './DpsMeterEngine.js?v=299';

const CH_ARMOR_DR = [0, 0.05, 0.12, 0.20, 0.28, 0.36, 0.44, 0.52, 0.60, 0.68];

export class TrainingArenaController {
  constructor(scene) {
    this.scene = scene;
    this.active = false;
    this.infiniteMp = true;
    this.fastCd = false;
    this.formation = 'trio'; // boss | trio | pack | striker
    this.autoAttack = true;
    this.simChapter = 1;     // 1..10
    this.meter = new DpsMeterEngine();
    this._nextStrikerAt = 0;
    this._lastHudAt = 0;
    this._hudEl = null;
    this._collapsed = false;
    this._prevMinimapLabel = null;
  }

  enter(onExitToTown) {
    const s = this.scene;
    this._onExitToTown = onExitToTown;
    // v299: 進入瞬間即刻鎖定演武場模式並清場，杜絕任何章節怪物殘留或刷怪侵入
    this.active = true;
    s.isTrainingMode = true;
    s.miniDpsHud?.hide?.();
    s.clearAllMonsters?.();
    this.meter.reset();

    const needed = [
      ['arena_training_v299', './assets/bg/arena_training_v299.webp?v=299'],
      ['dummy_standard_v299', './assets/fx/dummy_standard_v299.webp?v=299'],
      ['dummy_boss_v299',     './assets/fx/dummy_boss_v299.webp?v=299'],
      ['dummy_striker_v299',  './assets/fx/dummy_striker_v299.webp?v=299'],
    ].filter(([k]) => !s.textures.exists(k));

    const startNow = () => {
      if (!this.active) return;
      this.active = true;
      s.isTrainingMode = true;
      this.meter.reset();
      if (s.textures.exists('arena_training_v299')) {
        if (s.bgImage?.active) {
          s.bgImage.setTexture('arena_training_v299').setDisplaySize(4096, 2304).setDepth(0).setVisible(true);
        } else {
          s.bgImage = s.add.image(2048, 1152, 'arena_training_v299').setDisplaySize(4096, 2304).setDepth(0);
        }
      }
      document.querySelectorAll('#town-online-badge, .town-online-badge, .town-online-pill').forEach((n) => {
        n.dataset.v301Hidden = '1';
        n.style.display = 'none';
      });
      s.clearAllMonsters?.();
      if (s.hero?.active) {
        s.hero.setPosition(1860, 1152);
        s.cameras?.main?.centerOn(2048, 1152);
      }
      s.playerHp = s.playerMaxHp;
      s.playerMp = s.playerMaxMp;
      s.updateHeroHpBar?.();
      this.spawnFormation(this.formation);
      s.autoMoveEnabled = !!this.autoAttack;
      this._setMinimapArenaMode(true);
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
    this.autoAttack = false;
    this._unmountHud();
    this._setMinimapArenaMode(false);
    document.querySelectorAll('[data-v301-hidden="1"]').forEach((n) => {
      n.style.display = '';
      delete n.dataset.v301Hidden;
    });
    s.clearAllMonsters?.();
    if (s.bgImage?.active && s.getZoneIdx) {
      const z = s.getZoneIdx();
      if (s.textures.exists(`map_zone_${z}`)) {
        s.bgImage.setTexture(`map_zone_${z}`).setDisplaySize(4096, 2304);
      }
    }
  }

  _setMinimapArenaMode(isArena) {
    try {
      const candidates = [
        document.getElementById('minimap-zone-title'),
        document.getElementById('mm-zone-name'),
        document.querySelector('.minimap-title'),
        document.querySelector('#minimap-wrap .mm-header'),
      ].filter(Boolean);
      if (candidates.length === 0) {
        // Fallback: find top-right pill containing '前線戰場' or '實戰演武場'
        document.querySelectorAll('div, span').forEach((node) => {
          if (node.children.length === 0) {
            const tx = (node.textContent || '').trim();
            if (isArena && tx.startsWith('前線戰場')) {
              node.dataset.v299PrevLabel = tx;
              node.textContent = '🎯 實戰演武場';
            } else if (!isArena && node.dataset.v299PrevLabel) {
              node.textContent = node.dataset.v299PrevLabel;
              delete node.dataset.v299PrevLabel;
            }
          }
        });
        return;
      }
      candidates.forEach((el) => {
        if (isArena) {
          if (!el.dataset.v299PrevLabel) el.dataset.v299PrevLabel = el.textContent;
          el.textContent = '🎯 實戰演武場';
        } else if (el.dataset.v299PrevLabel) {
          el.textContent = el.dataset.v299PrevLabel;
          delete el.dataset.v299PrevLabel;
        }
      });
    } catch {}
  }

  getSimulatedDr() {
    return CH_ARMOR_DR[Math.max(0, Math.min(9, (this.simChapter || 1) - 1))] || 0;
  }

  spawnFormation(form) {
    this.formation = form || 'trio';
    const s = this.scene;
    s.clearAllMonsters?.();
    const cx = 2130, cy = 1152;
    let specs = [];
    if (this.formation === 'boss') {
      specs = [{ x: cx, y: cy, key: 'dummy_boss_v299', name: `👑 首領演武傀儡 (Ch.${this.simChapter})`, scale: 0.56, isBoss: true }];
    } else if (this.formation === 'trio') {
      specs = [
        { x: cx + 15, y: cy - 95, key: 'dummy_boss_v299',     name: '首領傀儡・主', scale: 0.46, isElite: true },
        { x: cx + 115, y: cy + 55, key: 'dummy_standard_v299', name: '演武木樁・乙', scale: 0.42, isElite: true },
        { x: cx - 75, y: cy + 65, key: 'dummy_standard_v299', name: '演武木樁・丙', scale: 0.42, isElite: true },
      ];
    } else if (this.formation === 'pack') {
      specs = [
        { x: cx,       y: cy,      key: 'dummy_boss_v299',     name: '陣列傀儡・中', scale: 0.42 },
        { x: cx - 125, y: cy - 85, key: 'dummy_standard_v299', name: '演武木樁・左', scale: 0.38 },
        { x: cx + 125, y: cy - 85, key: 'dummy_standard_v299', name: '演武木樁・右', scale: 0.38 },
        { x: cx - 115, y: cy + 90, key: 'dummy_standard_v299', name: '演武木樁・前', scale: 0.38 },
        { x: cx + 115, y: cy + 90, key: 'dummy_standard_v299', name: '演武木樁・後', scale: 0.38 },
      ];
    } else if (this.formation === 'striker') {
      specs = [{ x: cx, y: cy, key: 'dummy_striker_v299', name: '🛡️ 反擊測試戰偶 (2.2秒紅圈)', scale: 0.54, isBoss: true, isStriker: true }];
    }

    for (const spc of specs) {
      // v299: 寫實貼地石座戰偶，不加浮空黑橢圓陰影
      const spr = s.add.image(spc.x, spc.y, spc.key)
        .setOrigin(0.5, 0.86)
        .setScale(spc.scale)
        .setDepth(spc.y);
      const dispH = Math.round(spr.displayHeight || 160);
      const nameText = s.add.text(spc.x, spc.y - Math.round(dispH * 0.90), spc.name, {
        fontFamily: '"Noto Sans TC", sans-serif',
        fontSize: '12.5px',
        fontStyle: 'bold',
        color: '#fde68a',
        backgroundColor: 'rgba(12,14,20,0.82)',
        padding: { x: 6, y: 2 },
      }).setOrigin(0.5).setDepth(spc.y + 120);

      const nameOffY = Math.round(dispH * 0.90);
      const m = {
        id: `dummy_${Math.random().toString(36).slice(2, 7)}`,
        name: spc.name,
        anchorX: spc.x,
        anchorY: spc.y,
        nameOffY,
        sprite: spr,
        scale: spc.scale,
        groundShadow: null,
        castShadow: null,
        hpBg: null,
        hpFill: null,
        barW: 0,
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

  recordHit({ target, dmg, isCrit = false, isOverpower = false, sourceName = '普通攻擊', timestamp = 0 } = {}) {
    if (!this.active) return;
    this.meter.recordHit({
      dmg,
      isCrit,
      isOverpower,
      sourceName,
      timestamp: timestamp || this.scene.time?.now || performance.now(),
    });

    // 戰偶受擊物理微晃回饋
    if (target?.sprite?.active && !target._wobbling) {
      target._wobbling = true;
      const dir = Math.random() < 0.5 ? -8 : 8;
      this.scene.tweens.add({
        targets: target.sprite,
        angle: dir,
        duration: 60,
        yoyo: true,
        ease: 'Sine.easeOut',
        onComplete: () => {
          if (target.sprite?.active) target.sprite.setAngle(0);
          target._wobbling = false;
        },
      });
    }
  }

  // 向下相容舊介面
  onDummyHit(m, dmg, isCrit, sourceName = '技能/普攻') {
    this.recordHit({ target: m, dmg, isCrit, sourceName });
  }

  update(time, delta) {
    if (!this.active) return;
    const s = this.scene;

    // 0. v302: 每幀強制鎖定所有演武木樁於錨點，杜絕任何聚怪/寵物拉扯/擊退位移
    for (const m of s.monsters || []) {
      if (m?.isTrainingDummy && m.sprite?.active && typeof m.anchorX === 'number') {
        if (m.sprite.x !== m.anchorX || m.sprite.y !== m.anchorY) {
          m.sprite.setPosition(m.anchorX, m.anchorY);
        }
        if (m.nameText?.active) {
          m.nameText.setPosition(m.anchorX, m.anchorY - (m.nameOffY || 120));
        }
      }
    }

    // 1. 無限能量模式鎖滿資源
    if (this.infiniteMp) {
      s.playerMp = s.playerMaxMp;
    }

    // 2. 反擊測試戰偶：每 2.2 秒紅圈預警攻擊
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
              s.spawnFloatingText?.(s.hero.x, s.hero.y - 78, `🛡️護盾吸收 ${abs}`, '#7dd3fc', 15);
            } else {
              const actual = Math.min(Math.max(0, s.playerHp - Math.round(s.playerMaxHp * 0.15)), testDmg);
              if (actual > 0) s.playerHp -= actual;
              s.updateHeroHpBar?.();
              s.spawnFloatingText?.(s.hero.x, s.hero.y - 78, `⚔️戰偶反擊 -${testDmg}`, '#fca5a5', 15);
            }
          } else {
            s.spawnFloatingText?.(s.hero.x, s.hero.y - 78, '💨 完美走位閃避！', '#4ade80', 15);
          }
        },
      });
    }

    // 3. 推進獨立 DPS 引擎（每 250ms 刷新 HUD 數字，每秒更新折線圖與計時結算）
    const cid = s.getState?.()?.classId || 'warrior';
    const res = this.meter.tick(time, cid);
    if (res.justFinished && res.snapshot) {
      const snap = res.snapshot;
      const st = s.getState?.();
      if (st && snap.avgDps > (st.bestDummyDps || 0)) {
        st.bestDummyDps = snap.avgDps;
        s.callbacks?.onPersist?.();
      }
      const badge = snap.isNewRecord ? ' 🔥新紀錄!' : '';
      s.spawnFloatingText?.(
        s.hero.x,
        s.hero.y - 108,
        `🏆 ${snap.trialTotalSec}秒評測 [${snap.grade}] ${snap.avgDps.toLocaleString()} DPS${badge}`,
        '#fde047',
        19,
        { isCrit: true },
      );
      this._renderHudMetrics(time);
    } else if (time - this._lastHudAt >= 250) {
      this._lastHudAt = time;
      this._renderHudMetrics(time);
    }
  }

  _mountHud() {
    this._unmountHud();
    const el = document.createElement('div');
    el.id = 'v299-training-hud';
    // v299: 預設停靠於右上角小地圖正下方（top: 242px），完全不遮擋小地圖且支援拖曳與折疊
    el.style.cssText = 'position:fixed;right:14px;top:242px;z-index:8600;width:328px;background:linear-gradient(rgba(8,10,16,0.62),rgba(8,10,16,0.78)),url("./assets/ui/lobby_panel_bg_v299.webp?v=299") center/100% 100% no-repeat;border:1.5px solid rgba(212,175,55,0.58);border-radius:12px;padding:12px 14px;color:#f3e8d2;font-family:"Noto Sans TC",sans-serif;box-shadow:0 16px 44px rgba(0,0,0,0.88);user-select:none;';
    el.innerHTML = `
      <div id="v299-hud-drag" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;cursor:move;padding-bottom:6px;border-bottom:1px solid rgba(245,158,11,0.22);">
        <b style="font-size:13.5px;color:#fde047;">⚔️ 獨立演武場・DPS 儀表</b>
        <div style="display:flex;gap:5px;align-items:center;">
          <button id="v299-btn-fold" type="button" title="折疊/展開" style="padding:2px 7px;border-radius:5px;border:1px solid #475569;background:#1e293b;color:#cbd5e1;font-size:11px;font-weight:800;cursor:pointer;">—</button>
          <button id="v299-btn-exit" type="button" style="padding:3px 9px;border-radius:6px;border:1px solid #f59e0b;background:#451a03;color:#fef3c7;font-size:11px;font-weight:800;cursor:pointer;">🏰 回主城</button>
        </div>
      </div>
      <div id="v299-hud-body">
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;margin-bottom:6px;">
          <button id="v299-btn-auto" type="button" style="padding:5px 3px;border-radius:6px;border:1px solid #22c55e;background:#14532d;color:#dcfce7;font-size:11px;font-weight:800;cursor:pointer;">🤖 自動: 開</button>
          <button id="v299-btn-mp" type="button" style="padding:5px 3px;border-radius:6px;border:1px solid #38bdf8;background:#0c4a6e;color:#e0f2fe;font-size:11px;font-weight:800;cursor:pointer;">♾️ 能量: 滿</button>
          <button id="v299-btn-cd" type="button" style="padding:5px 3px;border-radius:6px;border:1px solid #64748b;background:#1e293b;color:#cbd5e1;font-size:11px;font-weight:800;cursor:pointer;">⏱️ 標準CD</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin-bottom:6px;">
          <button data-form="boss"    style="padding:4px 2px;border-radius:5px;border:1px solid #475569;background:#1e293b;color:#cbd5e1;font-size:10.5px;font-weight:700;cursor:pointer;">👑 首領</button>
          <button data-form="trio"    style="padding:4px 2px;border-radius:5px;border:1px solid #f59e0b;background:#78350f;color:#fef3c7;font-size:10.5px;font-weight:700;cursor:pointer;">👥 3木樁</button>
          <button data-form="pack"    style="padding:4px 2px;border-radius:5px;border:1px solid #475569;background:#1e293b;color:#cbd5e1;font-size:10.5px;font-weight:700;cursor:pointer;">⚔️ 5群怪</button>
          <button data-form="striker" style="padding:4px 2px;border-radius:5px;border:1px solid #475569;background:#1e293b;color:#cbd5e1;font-size:10.5px;font-weight:700;cursor:pointer;">🛡️ 反擊</button>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:7px;font-size:11px;">
          <span style="color:#cbd5e1;">模擬首領減傷：</span>
          <select id="v299-sel-ch" style="background:#0f172a;color:#fde68a;border:1px solid #475569;border-radius:5px;padding:2px 6px;font-size:11px;">
            ${Array.from({ length: 10 }, (_, i) => `<option value="${i + 1}">Ch.${i + 1} 首領 (${Math.round(CH_ARMOR_DR[i] * 100)}% 減傷)</option>`).join('')}
          </select>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5px;padding:7px 6px;background:rgba(16,20,30,0.92);border:1px solid rgba(148,163,184,0.16);border-radius:8px;text-align:center;margin-bottom:6px;">
          <div><div style="font-size:10px;color:#94a3b8;">3秒即時</div><b id="v299-m-inst" style="font-size:14px;color:#fde047;">0</b></div>
          <div><div style="font-size:10px;color:#94a3b8;">全程平均</div><b id="v299-m-avg" style="font-size:14px;color:#38bdf8;">0</b></div>
          <div><div style="font-size:10px;color:#94a3b8;">1秒峰值</div><b id="v299-m-peak" style="font-size:14px;color:#fb923c;">0</b></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:10.5px;color:#cbd5e1;margin-bottom:6px;padding:0 2px;">
          <span>暴擊 <b id="v299-m-crit" style="color:#fde047;">0%</b></span>
          <span>壓制 <b id="v299-m-op" style="color:#38bdf8;">0%</b></span>
          <span>命中 <b id="v299-m-hps" style="color:#4ade80;">0/s</b></span>
          <span>總傷 <b id="v299-m-tot" style="color:#f8fafc;">0</b></span>
        </div>
        <canvas id="v299-dps-chart" width="292" height="64" style="width:100%;height:64px;background:#080a0f;border:1px solid #1e293b;border-radius:6px;margin-bottom:6px;"></canvas>
        <div id="v299-src-bars" style="display:flex;flex-direction:column;gap:4px;margin-bottom:7px;min-height:42px;max-height:112px;overflow-y:auto;font-size:10.5px;color:#94a3b8;">施放技能擊打戰偶以顯示傷害構成...</div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;">
          <button id="v299-btn-t10"   type="button" style="padding:5px 2px;border-radius:6px;border:1px solid #b45309;background:#292018;color:#fde68a;font-size:10.5px;font-weight:700;cursor:pointer;">⏱10秒</button>
          <button id="v299-btn-t30"   type="button" style="padding:5px 2px;border-radius:6px;border:1px solid #b45309;background:#292018;color:#fde68a;font-size:10.5px;font-weight:700;cursor:pointer;">⏱30秒</button>
          <button id="v299-btn-t60"   type="button" style="padding:5px 2px;border-radius:6px;border:1px solid #b45309;background:#292018;color:#fde68a;font-size:10.5px;font-weight:700;cursor:pointer;">⏱60秒</button>
          <button id="v299-btn-reset" type="button" style="padding:5px 2px;border-radius:6px;border:1px solid #475569;background:#1e293b;color:#e2e8f0;font-size:10.5px;font-weight:700;cursor:pointer;">🧹重置</button>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;gap:6px;">
          <div id="v299-trial-status" style="font-size:10.5px;color:#86efac;flex:1;">自由打樁模式</div>
          <button id="v299-btn-copy" type="button" style="padding:2px 7px;border-radius:5px;border:1px solid #475569;background:#0f172a;color:#cbd5e1;font-size:10px;cursor:pointer;">📋 複製戰報</button>
        </div>
      </div>
    `;
    if (!document.getElementById('v301-training-gothic-css')) {
      const stEl = document.createElement('style');
      stEl.id = 'v301-training-gothic-css';
      stEl.textContent = `
        #v299-training-hud button {
          border: none !important;
          background: url('./assets/ui/lobby_btn_skill_v300.webp?v=300') center/100% 100% no-repeat !important;
          color: #e2e8f0 !important;
          text-shadow: 0 2px 4px #000 !important;
          transition: filter 0.14s ease, transform 0.12s ease !important;
        }
        #v299-training-hud button:hover { filter: brightness(1.16); transform: translateY(-1px); }
        #v299-training-hud button.is-on {
          background: url('./assets/ui/lobby_btn_skill_active_v300.webp?v=300') center/100% 100% no-repeat !important;
          color: #fef08a !important;
        }
        #v299-training-hud #v299-btn-exit {
          background: url('./assets/ui/lobby_btn_top_danger_v300.webp?v=300') center/100% 100% no-repeat !important;
          color: #fecaca !important;
          padding: 4px 12px !important;
        }
      `;
      document.head.appendChild(stEl);
    }
    document.body.appendChild(el);
    el.querySelector('#v299-btn-auto')?.classList.add('is-on');
    el.querySelector('#v299-btn-mp')?.classList.add('is-on');
    el.querySelector('button[data-form="trio"]')?.classList.add('is-on');
    this._hudEl = el;

    // 自由拖曳標題列
    const dragBar = el.querySelector('#v299-hud-drag');
    let dragging = false, ox = 0, oy = 0;
    dragBar?.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button')) return;
      dragging = true;
      const r = el.getBoundingClientRect();
      ox = e.clientX - r.left;
      oy = e.clientY - r.top;
      el.style.right = 'auto';
      el.style.left = `${r.left}px`;
      el.style.top = `${r.top}px`;
      dragBar.setPointerCapture?.(e.pointerId);
    });
    dragBar?.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const nx = Math.max(8, Math.min(window.innerWidth - el.offsetWidth - 8, e.clientX - ox));
      const ny = Math.max(8, Math.min(window.innerHeight - 60, e.clientY - oy));
      el.style.left = `${nx}px`;
      el.style.top = `${ny}px`;
    });
    dragBar?.addEventListener('pointerup', () => { dragging = false; });

    el.querySelector('#v299-btn-fold')?.addEventListener('click', (ev) => {
      this._collapsed = !this._collapsed;
      const body = el.querySelector('#v299-hud-body');
      if (body) body.style.display = this._collapsed ? 'none' : 'block';
      ev.currentTarget.textContent = this._collapsed ? '+' : '—';
    });
    el.querySelector('#v299-btn-exit')?.addEventListener('click', () => {
      this.exit();
      this._onExitToTown?.();
    });
    el.querySelector('#v299-btn-auto')?.addEventListener('click', (ev) => {
      this.autoAttack = !this.autoAttack;
      this.scene.autoMoveEnabled = this.autoAttack;
      ev.currentTarget.textContent = this.autoAttack ? '🤖 自動: 開' : '🤖 自動: 關';
      ev.currentTarget.classList.toggle('is-on', this.autoAttack);
      ev.currentTarget.style.borderColor = this.autoAttack ? '#22c55e' : '#64748b';
    });
    el.querySelector('#v299-btn-mp')?.addEventListener('click', (ev) => {
      this.infiniteMp = !this.infiniteMp;
      ev.currentTarget.textContent = this.infiniteMp ? '♾️ 能量: 滿' : '💧 實戰耗魔';
      ev.currentTarget.classList.toggle('is-on', this.infiniteMp);
    });
    el.querySelector('#v299-btn-cd')?.addEventListener('click', (ev) => {
      this.fastCd = !this.fastCd;
      ev.currentTarget.textContent = this.fastCd ? '⚡ 極速-80%' : '⏱️ 標準CD';
      ev.currentTarget.classList.toggle('is-on', this.fastCd);
    });
    el.querySelectorAll('button[data-form]').forEach((btn) => {
      btn.addEventListener('click', () => {
        el.querySelectorAll('button[data-form]').forEach((b) => b.classList.remove('is-on'));
        btn.classList.add('is-on');
        this.spawnFormation(btn.dataset.form);
      });
    });
    el.querySelector('#v299-sel-ch')?.addEventListener('change', (ev) => {
      this.simChapter = Number(ev.target.value) || 1;
      this.spawnFormation(this.formation);
    });
    const arm = (sec) => {
      this.meter.armTrial(sec);
      this._renderHudMetrics(this.scene.time?.now || performance.now());
    };
    el.querySelector('#v299-btn-t10')?.addEventListener('click', () => arm(10));
    el.querySelector('#v299-btn-t30')?.addEventListener('click', () => arm(30));
    el.querySelector('#v299-btn-t60')?.addEventListener('click', () => arm(60));
    el.querySelector('#v299-btn-reset')?.addEventListener('click', () => {
      this.meter.reset();
      this._renderHudMetrics(this.scene.time?.now || performance.now());
    });
    el.querySelector('#v299-btn-copy')?.addEventListener('click', (ev) => {
      const cid = this.scene.getState?.()?.classId || 'warrior';
      const snap = this.meter.getSnapshot(this.scene.time?.now || performance.now(), cid);
      const txt = this.meter.formatReportText(snap, cid, this.simChapter);
      navigator.clipboard?.writeText?.(txt).catch(() => {});
      const b = ev.currentTarget;
      b.textContent = '✅ 已複製';
      setTimeout(() => { if (b) b.textContent = '📋 複製戰報'; }, 1400);
    });
  }

  _renderHudMetrics(now) {
    if (!this._hudEl) return;
    const cid = this.scene.getState?.()?.classId || 'warrior';
    const snap = this.meter.getSnapshot(now, cid);
    const fmt = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : (n >= 1e4 ? `${(n / 1e3).toFixed(1)}K` : n.toLocaleString()));

    this._hudEl.querySelector('#v299-m-inst').textContent = fmt(snap.instantDps);
    this._hudEl.querySelector('#v299-m-avg').textContent = fmt(snap.avgDps);
    this._hudEl.querySelector('#v299-m-peak').textContent = fmt(snap.peakDps);
    this._hudEl.querySelector('#v299-m-crit').textContent = `${snap.critPct}%`;
    this._hudEl.querySelector('#v299-m-op').textContent = `${snap.opPct}%`;
    this._hudEl.querySelector('#v299-m-hps').textContent = `${snap.hps}/s`;
    this._hudEl.querySelector('#v299-m-tot').textContent = fmt(snap.totalDmg);

    const statusEl = this._hudEl.querySelector('#v299-trial-status');
    if (snap.trialState === 'ready') {
      statusEl.style.color = '#fde047';
      statusEl.textContent = `⏳ ${snap.trialTotalSec}秒評測待命：首次命中自動倒數`;
    } else if (snap.trialState === 'running') {
      statusEl.style.color = '#fb923c';
      statusEl.textContent = `🔥 ${snap.trialTotalSec}秒評測中… 剩餘 ${snap.remSec}s`;
    } else if (snap.trialState === 'finished') {
      statusEl.style.color = '#4ade80';
      statusEl.textContent = `🏆 結算 [${snap.grade}] 均傷 ${fmt(snap.avgDps)}/s${snap.isNewRecord ? ' (新紀錄!)' : ''}`;
    } else {
      statusEl.style.color = '#94a3b8';
      statusEl.textContent = snap.pb > 0 ? `自由打樁｜歷史最佳 ${fmt(snap.pb)}/s` : '自由打樁模式';
    }

    // 繪製 30 秒雙線 DPS 折線圖（金線：每秒即時，青虛線：全程平均）
    const canvas = this._hudEl.querySelector('#v299-dps-chart');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const maxV = Math.max(100, ...snap.series30s, snap.avgDps);
      ctx.strokeStyle = 'rgba(148,163,184,0.16)';
      ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke();

      // 平均 DPS 虛線
      if (snap.avgDps > 0) {
        const ay = h - 5 - (snap.avgDps / maxV) * (h - 12);
        ctx.save();
        ctx.setLineDash([4, 3]);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(4, ay); ctx.lineTo(w - 4, ay); ctx.stroke();
        ctx.restore();
      }

      // 即時 DPS 金線
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.beginPath();
      snap.series30s.forEach((v, i) => {
        const px = (i / 29) * (w - 8) + 4;
        const py = h - 5 - (v / maxV) * (h - 12);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.stroke();
    }

    // 繪製細粒度技能傷害構成
    const barsEl = this._hudEl.querySelector('#v299-src-bars');
    if (barsEl) {
      if (snap.breakdown.length === 0) {
        barsEl.innerHTML = '施放技能擊打戰偶以顯示傷害構成...';
      } else {
        barsEl.innerHTML = snap.breakdown.slice(0, 5).map((b) => `
          <div>
            <div style="display:flex;justify-content:space-between;font-size:10.5px;color:#e2e8f0;">
              <span>${b.name}</span>
              <span>${b.pct}%｜${fmt(b.dmg)}｜暴${b.critPct}%</span>
            </div>
            <div style="height:5px;background:#1e293b;border-radius:3px;overflow:hidden;margin-top:1px;">
              <div style="width:${b.pct}%;height:100%;background:linear-gradient(90deg,#f59e0b,#fde047);"></div>
            </div>
          </div>
        `).join('');
      }
    }
  }

  _unmountHud() {
    document.getElementById('v299-training-hud')?.remove();
    document.getElementById('v277-training-hud')?.remove();
    this._hudEl = null;
  }
}
