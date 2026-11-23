import { TOWN_CH1 } from '../data/towns/ch1.js';
import { TOWN_CH2 } from '../data/towns/ch2.js';
import { TOWN_CH3 } from '../data/towns/ch3.js';
import { TOWN_CH4 } from '../data/towns/ch4.js';
import { TOWN_CH5 } from '../data/towns/ch5.js';
import { TOWN_CH6 } from '../data/towns/ch6.js';
import { TOWN_CH7 } from '../data/towns/ch7.js';
import { TOWN_CH8 } from '../data/towns/ch8.js';
import { TOWN_CH9 } from '../data/towns/ch9.js';
import { TOWN_CH10 } from '../data/towns/ch10.js';
import { formatNum } from '../logic/statCalc.js';

const TOWN_REGISTRY = {
  0: TOWN_CH1,
  1: TOWN_CH2,
  2: TOWN_CH3,
  3: TOWN_CH4,
  4: TOWN_CH5,
  5: TOWN_CH6,
  6: TOWN_CH7,
  7: TOWN_CH8,
  8: TOWN_CH9,
  9: TOWN_CH10,
};

export class TownScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TownScene' });
    this.callbacks = null;
    this.townData = TOWN_CH1;
    this.hero = null;
    this.heroShadow = null;
    this.heroDir = 'down';
    this.heroIsMoving = false;
    this.heroStopAt = 0;
    this.heroStepDustAt = 0;
    this.heroAttackAnimUntil = 0;
    this.moveTarget = null;
    this.obstacles = [];
    this.interactables = [];
    this.patrolActors = [];
    this.roamNpcs = [];
    this.hoverRing = null;
    this.speechBubble = null;
    this._portraitCache = new Map();
    this.nearestTarget = null;
    this.promptBox = null;
    this.dummySprite = null;
    this.beaconGlow = null;
    this.loadedAtlasKey = null;
  }

  init(data) {
    if (data?.callbacks) this.callbacks = data.callbacks;
    const chIdx = data?.chapterIdx ?? 0;
    this.townData = TOWN_REGISTRY[chIdx] || TOWN_CH1;
  }

  preload() {
    const td = this.townData;
    const cid = this.callbacks?.getState?.()?.classId || 'warrior';
    const heroAtlas = `atlas_${cid}`;
    if (!this.textures.exists(heroAtlas)) {
      this.load.atlas(heroAtlas, `./assets/heroes/atlas_${cid}.png?v=66`, `./assets/heroes/atlas_${cid}.json?v=66`);
    }
    if (!this.textures.exists(td.bgKey)) {
      this.load.image(td.bgKey, td.bgUrl);
    }
    if (!this.textures.exists(td.atlasKey)) {
      this.load.atlas(td.atlasKey, td.atlasPng, td.atlasJson);
    }
    const npcAtlasKey = td.atlasKey.replace('town_atlas_', 'town_npc_atlas_');
    const npcPng = td.atlasPng.replace('atlas_town_', 'atlas_town_npc_');
    const npcJson = td.atlasJson.replace('atlas_town_', 'atlas_town_npc_');
    if (!this.textures.exists(npcAtlasKey)) {
      this.load.atlas(npcAtlasKey, `${npcPng}?v=66`, `${npcJson}?v=66`);
    }
    this.load.off('progress');
    this.load.on('progress', (val) => {
      this.callbacks?.onTownLoadProgress?.(val);
    });
  }

  create() {
    const td = this.townData;
    this.obstacles = [];
    this.interactables = [];
    this.patrolActors = [];
    this.roamNpcs = [];
    this.moveTarget = null;
    this.nearestTarget = null;

    const npcAtlasKey = td.atlasKey.replace('town_atlas_', 'town_npc_atlas_');
    this.npcAtlasKey = npcAtlasKey;
    this.registerNpcAnims(npcAtlasKey);
    this.registerHeroAnims(this.callbacks?.getState?.()?.classId || 'warrior');
    this.physics?.world?.setBounds(0, 0, td.mapWidth, td.mapHeight);
    this.cameras.main.setBounds(0, 0, td.mapWidth, td.mapHeight);

    // 1. 廣場大底圖
    this.add.image(td.mapWidth / 2, td.mapHeight / 2, td.bgKey)
      .setDisplaySize(td.mapWidth, td.mapHeight)
      .setDepth(0);

    // 2. 中央烽火台地標
    if (td.landmark) {
      const lm = td.landmark;
      this.add.image(lm.x, lm.y + 38, 'fx_glow')
        .setTint(0x000000).setScale(2.6, 0.95).setAlpha(0.5).setDepth(2);
      this.add.image(lm.x, lm.y, td.atlasKey, lm.frame)
        .setScale(lm.scale)
        .setDepth(lm.y);
      this.beaconGlow = this.add.image(lm.x, lm.y - 18, 'fx_glow')
        .setTint(td.ambientColor).setScale(2.2).setAlpha(0.32).setDepth(lm.y + 2);
      this.tweens.add({
        targets: this.beaconGlow,
        scale: 2.65,
        alpha: 0.48,
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      this.obstacles.push({ x: lm.x, y: lm.y + 15, radius: lm.radius });
      this.interactables.push({
        id: lm.id,
        x: lm.x,
        y: lm.y + 20,
        radius: 175,
        title: `🔥 ${lm.name}`,
        sub: lm.tip,
        action: lm.action,
        data: lm,
      });
    }

    // 3. 街區民宅、哨塔與城門
    for (const b of td.neighborhood || []) {
      this.placeBuilding(td.atlasKey, b);
    }

    // 4. 8 大核心設施建築與對應 NPC
    for (const f of td.facilities || []) {
      this.placeBuilding(td.atlasKey, f);
      if (f.npc) {
        this.placeNpc(td.atlasKey, f.npc, f.name, f.action, f.actionLabel, f);
      }
    }

    // 5. 章節限定 NPC
    for (const npc of td.extraNpcs || []) {
      this.placeNpc(td.atlasKey, npc, npc.title, npc.action, npc.actionLabel, npc);
    }

    // 6. 演武木人樁
    if (td.trainingDummy) {
      const dm = td.trainingDummy;
      this.add.image(dm.x, dm.y + 38, 'fx_glow')
        .setTint(0x000000).setScale(1.1, 0.42).setAlpha(0.45).setDepth(2);
      this.dummySprite = this.add.image(dm.x, dm.y, td.atlasKey, dm.frame)
        .setScale(dm.scale)
        .setDepth(dm.y);
      this.obstacles.push({ x: dm.x, y: dm.y + 16, radius: dm.radius });
      this.addNameplate(dm.x, dm.y - 78, `🎯 ${dm.name}`, '#facc15');
      this.interactables.push({
        id: 'dummy',
        x: dm.x,
        y: dm.y,
        radius: 135,
        title: `🎯 ${dm.name}`,
        sub: '點擊或按 [F] 測試技能與普攻秒傷',
        action: 'hit_dummy',
        data: dm,
      });
    }

    // 7. 城牆柵欄、路燈、戰旗、貨車與烏鴉微細節
    for (const p of td.props || []) {
      if (p.radius > 0) {
        this.add.image(p.x, p.y + 24, 'fx_glow')
          .setTint(0x000000).setScale(1.0, 0.38).setAlpha(0.38).setDepth(2);
        this.obstacles.push({ x: p.x, y: p.y + 24, radius: Math.max(12, Math.round(p.radius * 0.65)) });
      }
      const spr = this.add.image(p.x, p.y, td.atlasKey, p.frame)
        .setScale(p.scale)
        .setDepth(p.depthOverride ?? p.y);
      if (p.flipX) spr.setFlipX(true);
      if (p.glow) {
        const g = this.add.image(p.x, p.y - 24, 'fx_glow')
          .setTint(p.glowColor || 0xfbbf24).setScale(1.2).setAlpha(0.28).setDepth(p.y + 1);
        this.tweens.add({
          targets: g,
          alpha: 0.42,
          scale: 1.4,
          duration: 1100 + Math.random() * 500,
          yoyo: true,
          repeat: -1,
        });
      }
    }

    // 8. 巡邏衛兵與商販平民（支援靠近停步轉向與點擊/F 互動）
    for (const pt of td.patrols || []) {
      const start = pt.waypoints[0];
      const isGuard = pt.frame.includes('guard');
      const sh = this.add.image(start.x, start.y + 2, 'fx_glow')
        .setTint(0x000000).setScale(0.95, 0.34).setAlpha(0.48).setDepth(2);
      const hasNpcAnim = this.anims.exists(`${pt.frame}_idle`);
      const spr = (hasNpcAnim
        ? this.add.sprite(start.x, start.y, npcAtlasKey, `${pt.frame}_idle_0`)
        : this.add.image(start.x, start.y, td.atlasKey, pt.frame))
        .setOrigin(0.5, 0.92).setScale(pt.scale).setDepth(start.y);
      if (hasNpcAnim) spr.play(`${pt.frame}_idle`);
      const plate = this.addNameplate(start.x, start.y - 108, `${isGuard ? '🛡️' : '💬'} ${pt.name}`, isGuard ? '#93c5fd' : '#bbf7d0');
      const interactObj = {
        id: `patrol_${pt.name}_${Math.random().toString(36).slice(2, 6)}`,
        x: start.x,
        y: start.y,
        radius: 125,
        title: `${isGuard ? '🛡️' : '💬'} ${pt.name}`,
        sub: isGuard ? '[F] 詢問首領情報・領取護衛祝福' : '[F] 與旅人交談・領取小補給',
        action: isGuard ? 'modal_patrol_guard' : 'modal_patrol_villager',
        data: { atlasKey: td.atlasKey, frame: pt.frame, name: pt.name, title: isGuard ? '城防巡邏衛兵' : '城鎮旅人', greeting: isGuard ? '警戒中！隨時可以向我打聽本章節首領情報。' : '冒險者你好！這是我剛採集到的小心意。' },
      };
      this.interactables.push(interactObj);
      this.patrolActors.push({
        spr,
        frame: pt.frame,
        hasAnim: hasNpcAnim,
        dustAt: 0,
        shadow: sh,
        plate,
        interactObj,
        waypoints: pt.waypoints,
        wpIdx: 1 % pt.waypoints.length,
        speed: pt.speed,
      });
    }

    // 9. 建立玩家英雄角色（使用與 BattleScene 一致的 atlas_${cid} 與專屬幀前綴）
    const cid = this.callbacks?.getState?.()?.classId || 'warrior';
    const framePrefix = this.getHeroFramePrefix(cid);
    const atlasKey = `atlas_${cid}`;
    const initFrame = `${framePrefix}_down_walk_0`;

    this.heroShadow = this.add.image(td.spawn.x, td.spawn.y + 42, 'fx_glow')
      .setTint(0x000000).setScale(1.15, 0.42).setAlpha(0.55).setDepth(3);
    this.hero = this.add.sprite(td.spawn.x, td.spawn.y, atlasKey, initFrame)
      .setScale(0.56)
      .setDepth(td.spawn.y);

    this.cameras.main.startFollow(this.hero, true, 0.14, 0.14);

    // 9.2 主城實體「星門快速傳送陣」魔法陣地標
    const wpX = td.spawn.x + 165;
    const wpY = td.spawn.y - 24;
    const wpOuter = this.add.image(wpX, wpY, 'fx_glow')
      .setTint(0x38bdf8).setScale(1.75, 0.72).setAlpha(0.45).setDepth(4);
    const wpInner = this.add.image(wpX, wpY, 'fx_glow')
      .setTint(0xe0f2fe).setScale(0.95, 0.42).setAlpha(0.65).setDepth(4);
    this.tweens.add({ targets: wpOuter, scaleX: 1.95, scaleY: 0.82, alpha: 0.72, duration: 1200, yoyo: true, repeat: -1 });
    this.tweens.add({ targets: wpInner, angle: 360, duration: 4800, repeat: -1 });
    this.time.addEvent({
      delay: 520,
      loop: true,
      callback: () => {
        if (!this.scene.isActive('TownScene')) return;
        const p = this.add.image(wpX + Phaser.Math.Between(-28, 28), wpY + Phaser.Math.Between(-10, 10), 'fx_glow')
          .setTint(0x7dd3fc).setScale(0.14).setAlpha(0.8).setDepth(wpY + 2);
        this.tweens.add({ targets: p, y: p.y - 44, alpha: 0, scale: 0.04, duration: 850, onComplete: () => p.destroy() });
      },
    });
    this.addNameplate(wpX, wpY - 38, '🧭 主城傳送陣', '#38bdf8');
    this.interactables.push({
      id: 'town_waypoint_pad',
      x: wpX,
      y: wpY,
      radius: 115,
      title: '🧭 主城星門傳送陣',
      sub: '點擊或按 [F] 開啟城內瞬移／跨章傳送',
      action: 'open_waypoint',
      data: { chapterIdx: td.chapterIdx },
    });

    // 9.3 主城出口「紫藍螺旋戰鬥傳送陣 ＋ 實體指示路牌」（對標參考圖右下角）
    const exX = td.spawn.x - 190;
    const exY = td.spawn.y + 115;
    const exOuter = this.add.image(exX, exY, 'fx_glow')
      .setTint(0x7c3aed).setScale(2.1, 0.85).setAlpha(0.55).setDepth(4);
    const exInner = this.add.image(exX, exY, 'fx_glow')
      .setTint(0x38bdf8).setScale(1.15, 0.48).setAlpha(0.75).setDepth(4);
    this.tweens.add({ targets: exOuter, scaleX: 2.35, scaleY: 0.96, alpha: 0.82, duration: 1100, yoyo: true, repeat: -1 });
    this.tweens.add({ targets: exInner, angle: -360, duration: 3600, repeat: -1 });
    this.addNameplate(exX + 54, exY - 46, `🪧 通往 第 ${(td.chapterIdx ?? 0) + 1} 章前線 →`, '#c4b5fd');
    this.interactables.push({
      id: 'town_exit_battle_pad',
      x: exX,
      y: exY,
      radius: 120,
      title: `🌀 出城戰鬥傳送陣（第 ${(td.chapterIdx ?? 0) + 1} 章前線）`,
      sub: '點擊或按 [F] 立即傳送出城開打',
      action: 'exit_battle',
      data: {},
    });

    // 9.5 地面選取光環與 NPC 隨機閒聊氣泡
    this.hoverRing = this.add.image(0, 0, 'fx_glow')
      .setTint(td.ambientColor || 0xfbbf24).setScale(1.15, 0.45).setAlpha(0.55).setDepth(3).setVisible(false);
    this.speechBubble = this.add.text(0, 0, '', {
      fontFamily: 'Noto Sans TC, sans-serif',
      fontSize: '11.5px',
      color: '#f8fafc',
      backgroundColor: 'rgba(15, 23, 42, 0.92)',
      padding: { x: 8, y: 4 },
    }).setOrigin(0.5, 1).setDepth(5200).setVisible(false);

    this.time.addEvent({
      delay: 4200,
      loop: true,
      callback: () => {
        if (!this.scene.isActive('TownScene') || !this.roamNpcs.length || !this.speechBubble) return;
        const pick = this.roamNpcs[Math.floor(Math.random() * this.roamNpcs.length)];
        const lines = [
          '今天天氣真不錯，適合出城打寶！',
          '剛進了一批好貨，隨時來看看。',
          '記得先點燃城裡的地標祝福再出發！',
          '聽說深處的首領最近特別躁動…',
          '酒館的大餐能讓人精神百倍！',
        ];
        const txt = lines[Math.floor(Math.random() * lines.length)];
        this.speechBubble.setText(`💬 ${txt}`).setPosition(pick.spr.x, pick.spr.y - 108).setVisible(true);
        this.time.delayedCall(2400, () => {
          if (this.speechBubble) this.speechBubble.setVisible(false);
        });
      },
    });

    // 10. 頭頂互動提示條（跟隨玩家附近目標）
    this.promptBox = this.add.text(0, 0, '', {
      fontFamily: 'Noto Sans TC, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#fef08a',
      backgroundColor: 'rgba(15, 23, 42, 0.88)',
      padding: { x: 10, y: 5 },
    }).setOrigin(0.5, 1).setDepth(5000).setVisible(false);

    // 11. 鍵盤與點擊尋路/互動
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      interact: Phaser.Input.Keyboard.KeyCodes.F,
    });

    this.input.on('pointerdown', (pointer) => {
      if (pointer.button !== 0) return;
      const wx = pointer.worldX;
      const wy = pointer.worldY;
      // 若點擊在某個可互動物件附近，設為目標並接近後自動觸發
      let clickedObj = null;
      let bestDist = 115;
      for (const obj of this.interactables) {
        const d = Phaser.Math.Distance.Between(wx, wy, obj.x, obj.y - 30);
        if (d < bestDist) {
          bestDist = d;
          clickedObj = obj;
        }
      }
      this.moveTarget = clickedObj
        ? { x: clickedObj.x, y: clickedObj.y + 38, triggerObj: clickedObj }
        : { x: wx, y: wy, triggerObj: null };

      const ring = this.add.image(wx, wy, 'fx_glow')
        .setTint(clickedObj ? 0xfacc15 : 0x38bdf8)
        .setScale(0.38).setAlpha(0.75).setDepth(4);
      this.tweens.add({
        targets: ring,
        scale: 0.72,
        alpha: 0,
        duration: 340,
        onComplete: () => ring.destroy(),
      });
    });

    // 12. 環境粒子（烽火餘燼＋秋風落葉）
    this.time.addEvent({
      delay: 260,
      loop: true,
      callback: () => {
        if (!this.scene.isActive('TownScene')) return;
        const lm = td.landmark;
        if (lm) {
          const ex = lm.x + Phaser.Math.Between(-34, 34);
          const ey = lm.y + Phaser.Math.Between(-18, 12);
          const sp = this.add.image(ex, ey, 'fx_glow')
            .setTint(td.particleColor).setScale(0.14).setAlpha(0.8).setDepth(4200);
          this.tweens.add({
            targets: sp,
            x: ex + Phaser.Math.Between(-28, 28),
            y: ey - Phaser.Math.Between(65, 130),
            scale: 0.03,
            alpha: 0,
            duration: 1100,
            onComplete: () => sp.destroy(),
          });
        }
      },
    });

    // 進城傳送光環與鏡頭柔順淡入
    this.cameras.main.fadeIn(420, 0, 0, 0);
    if (this.textures.exists('fx_glow')) {
      const ring = this.add.image(td.spawn.x, td.spawn.y + 18, 'fx_glow')
        .setTint(td.ambientColor || 0xfbbf24).setScale(1.6).setAlpha(0.75).setDepth(4900);
      this.tweens.add({
        targets: ring,
        scale: 0.2,
        alpha: 0,
        duration: 650,
        ease: 'Cubic.easeOut',
        onComplete: () => ring.destroy(),
      });
    }
    this.callbacks?.onTownLoadProgress?.(1);
    this.callbacks?.onTownReady?.();
    this.events.off('wake');
    this.events.on('wake', (sys, data) => {
      if (data?.callbacks) this.callbacks = data.callbacks;
      this.syncHeroAppearance();
      this.cameras.main.fadeIn(380, 0, 0, 0);
      this.callbacks?.onTownLoadProgress?.(1);
      this.callbacks?.onTownReady?.();
    });
  }

  placeBuilding(atlasKey, b) {
    this.add.image(b.x, b.y + 42, 'fx_glow')
      .setTint(0x000000).setScale(2.6, 0.95).setAlpha(0.45).setDepth(2);
    const spr = this.add.image(b.x, b.y, atlasKey, b.frame)
      .setScale(b.scale || 0.92)
      .setDepth(b.y);
    if (b.flipX) spr.setFlipX(true);
    if (b.radius > 0) {
      this.obstacles.push({ x: b.x, y: b.y + 24, radius: b.radius });
    }
    if (b.name && b.action) {
      this.addNameplate(b.x, b.y - 125, b.name, '#fde68a');
    } else if (b.name && b.frame && b.frame.includes('tavern')) {
      this.addNameplate(b.x, b.y - 125, `🍺 ${b.name}`, '#fcd34d');
      this.interactables.push({
        id: `tavern_${b.name}`,
        x: b.x,
        y: b.y + 40,
        radius: 155,
        title: `🍺 ${b.name}`,
        sub: '[F] 免費休憩回滿・點購冒險者大餐',
        action: 'modal_tavern',
        data: { atlasKey, frame: b.frame, name: b.name, title: '冒險者酒館', greeting: '歡迎光臨！進來喝杯麥酒歇息一下，恢復全部體力再戰吧！' },
      });
    } else if (b.name && b.frame && /(tower|belltower|windmill|spire|prism|watchhut|bellows)/.test(b.frame)) {
      this.addNameplate(b.x, b.y - 135, `🔭 ${b.name}`, '#a5f3fc');
      this.interactables.push({
        id: `tower_${b.name}`,
        x: b.x,
        y: b.y + 40,
        radius: 155,
        title: `🔭 ${b.name}`,
        sub: '[F] 登高望遠・查看本章怪物掉落圖鑑',
        action: 'modal_tower',
        data: { atlasKey, frame: b.frame, name: b.name, title: '城防瞭望哨塔', greeting: '從哨塔頂端可一覽本章節所有出沒魔物與掉寶情報！' },
      });
    }
  }

  getActionIcon(action) {
    if (action === 'drawer_upgrade') return '🔨';
    if (action === 'modal_alchemy') return '⚗️';
    if (action === 'drawer_bag') return '🎒';
    if (action === 'drawer_skills') return '⚔️';
    if (action === 'modal_bounty') return '📜';
    if (action === 'modal_market') return '🎲';
    if (action === 'drawer_rebirth') return '🌀';
    if (action === 'modal_portal') return '🚪';
    if (action.startsWith('gimmick_')) return '✨';
    return '🎁';
  }

  resolveSafeNpcPos(nx, ny) {
    let x = nx;
    let y = ny;
    for (const ob of this.obstacles) {
      const dx = x - ob.x;
      const dy = y - ob.y;
      const d = Math.hypot(dx, dy);
      const minD = ob.radius + 26;
      if (d < minD) {
        const ang = d > 1 ? Math.atan2(dy, dx) : Math.PI / 2;
        x = ob.x + Math.cos(ang) * minD;
        y = ob.y + Math.sin(ang) * minD;
      }
    }
    return { x, y };
  }

  placeNpc(atlasKey, npc, facilityName, action, actionLabel, parentObj) {
    const safePos = this.resolveSafeNpcPos(npc.x, npc.y);
    npc = { ...npc, x: safePos.x, y: safePos.y };
    const sh = this.add.image(npc.x, npc.y + 2, 'fx_glow')
      .setTint(action.startsWith('gimmick_') ? 0xf59e0b : 0x8b5cf6).setScale(1.05, 0.38).setAlpha(0.36).setDepth(2);
    const nAtlas = this.npcAtlasKey || atlasKey.replace('town_atlas_', 'town_npc_atlas_');
    const hasAnim = this.anims.exists(`${npc.frame}_idle`);
    const spr = (hasAnim
      ? this.add.sprite(npc.x, npc.y, nAtlas, `${npc.frame}_idle_0`)
      : this.add.image(npc.x, npc.y, atlasKey, npc.frame))
      .setOrigin(0.5, 0.92).setScale(npc.scale || 0.62).setDepth(npc.y);
    if (hasAnim) {
      spr.play({ key: `${npc.frame}_idle`, startFrame: Math.floor(Math.random() * 4) });
    } else {
      this.tweens.add({
        targets: spr,
        scaleY: (npc.scale || 0.62) * 1.03,
        duration: 1300 + Math.random() * 400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
    this.attachNpcFacilityFx(npc.x, npc.y, action, spr);
    const plate = this.addNameplate(npc.x, npc.y - 112, `${npc.title}・${npc.name}`, '#7dd3fc');
    const iconStr = this.getActionIcon(action);
    const icon = this.add.text(npc.x, npc.y - 138, iconStr, {
      fontSize: '18px',
    }).setOrigin(0.5, 1).setDepth(4550);
    this.tweens.add({
      targets: icon,
      y: npc.y - 146,
      duration: 900 + Math.random() * 300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const interactObj = {
      id: `${action}_${npc.name}`,
      x: npc.x,
      y: npc.y,
      radius: 130,
      title: `${iconStr} ${npc.title}・${npc.name}`,
      sub: `[F] ${actionLabel}`,
      action,
      data: { npc, facilityName, parentObj, atlasKey, frame: npc.frame },
    };
    this.interactables.push(interactObj);
    if (!action.startsWith('gimmick_')) {
      this.roamNpcs.push({
        spr,
        frame: npc.frame,
        hasAnim,
        dustAt: 0,
        shadow: sh,
        plate,
        icon,
        interactObj,
        homeX: npc.x,
        homeY: npc.y,
        targetX: npc.x,
        targetY: npc.y,
        waitUntil: 1500 + Math.random() * 2500,
      });
    }
  }

  addNameplate(x, y, label, color = '#f8fafc') {
    const clean = label.includes('・') ? label.replace('・', '\n') : label;
    return this.add.text(x, y, clean, {
      fontFamily: 'Noto Sans TC, sans-serif',
      fontSize: '11.5px',
      fontStyle: 'bold',
      align: 'center',
      color,
      stroke: '#000000',
      strokeThickness: 4,
      shadow: { offsetX: 0, offsetY: 1, color: '#000000', blur: 3, fill: true },
    }).setOrigin(0.5, 1).setDepth(4500);
  }

  getHeroPrefix(cid) {
    return cid === 'warrior' ? 'w'
      : cid === 'ranger' ? 'r'
      : cid === 'paladin' ? 'p'
      : cid === 'necro' ? 'n'
      : cid === 'assassin' ? 'a'
      : 'm';
  }

  getHeroFramePrefix(cid) {
    return cid === 'warrior' ? 'wf'
      : cid === 'ranger' ? 'rf'
      : cid === 'paladin' ? 'pf'
      : cid === 'necro' ? 'nf'
      : cid === 'assassin' ? 'af'
      : 'mf';
  }

  registerHeroAnims(cid) {
    const map = {
      warrior: { prefix: 'w', tex: 'wf', walkFps: 15, atkFps: 15 },
      ranger:  { prefix: 'r', tex: 'rf', walkFps: 16, atkFps: 16 },
      mage:    { prefix: 'm', tex: 'mf', walkFps: 14, atkFps: 15 },
      paladin: { prefix: 'p', tex: 'pf', walkFps: 14, atkFps: 15 },
      necro:   { prefix: 'n', tex: 'nf', walkFps: 14, atkFps: 15 },
      assassin:{ prefix: 'a', tex: 'af', walkFps: 17, atkFps: 18 },
    };
    const def = map[cid];
    const atlasKey = `atlas_${cid}`;
    if (!def || !this.textures.exists(atlasKey)) return;
    const tex = this.textures.get(atlasKey);
    ['down', 'up', 'right'].forEach((d) => {
      if (!tex.has(`${def.tex}_${d}_walk_7`)) return;
      if (!this.anims.exists(`${def.prefix}_${d}_walk`)) {
        this.anims.create({
          key: `${def.prefix}_${d}_walk`,
          frames: [0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({ key: atlasKey, frame: `${def.tex}_${d}_walk_${i}` })),
          frameRate: def.walkFps,
          repeat: -1,
        });
      }
      if (!this.anims.exists(`${def.prefix}_${d}_idle`)) {
        this.anims.create({
          key: `${def.prefix}_${d}_idle`,
          frames: [0, 1, 2, 3].map((i) => ({ key: atlasKey, frame: `${def.tex}_${d}_idle_${i}` })),
          frameRate: 5,
          repeat: -1,
        });
      }
      if (!this.anims.exists(`${def.prefix}_${d}_atk`)) {
        this.anims.create({
          key: `${def.prefix}_${d}_atk`,
          frames: [0, 1, 2, 3].map((i) => ({ key: atlasKey, frame: `${def.tex}_${d}_atk_${i}` })),
          frameRate: def.atkFps,
          repeat: 0,
        });
      }
    });
  }

  getWaypointList() {
    const td = this.townData;
    const list = [];
    for (const lm of td?.landmarks || []) {
      list.push({ label: `🔥 ${lm.name}`, x: lm.x, y: lm.y + 56 });
    }
    for (const f of td?.facilities || []) {
      if (f.npc) {
        const icon = this.getActionIcon(f.action);
        list.push({ label: `${icon} ${f.name || f.npc.title}`, x: f.npc.x, y: f.npc.y + 44 });
      }
    }
    for (const npc of td?.extraNpcs || []) {
      list.push({ label: `🎁 ${npc.title || npc.name}`, x: npc.x, y: npc.y + 44 });
    }
    for (const b of td?.neighborhood || []) {
      if (b.action === 'modal_tavern' || b.action === 'modal_tower') {
        list.push({ label: `${b.action === 'modal_tavern' ? '🍺' : '🔭'} ${b.name}`, x: b.x, y: b.y + 62 });
      }
    }
    if (td?.trainingDummy) {
      list.push({ label: `🎯 ${td.trainingDummy.name}`, x: td.trainingDummy.x, y: td.trainingDummy.y + 50 });
    }
    return list;
  }

  teleportHeroTo(tx, ty) {
    if (!this.hero) return;
    const ring = this.add.image(this.hero.x, this.hero.y, 'fx_glow')
      .setTint(0x38bdf8).setScale(1.6).setAlpha(0.85).setDepth(4800);
    this.tweens.add({ targets: ring, scale: 0.2, alpha: 0, duration: 240, onComplete: () => ring.destroy() });

    this.hero.setPosition(tx, ty);
    this.moveTarget = null;
    this.hero.setDepth(ty);
    if (this.heroShadow) this.heroShadow.setPosition(tx, ty + 42);

    const destRing = this.add.image(tx, ty, 'fx_glow')
      .setTint(0x38bdf8).setScale(0.3).setAlpha(0.95).setDepth(4800);
    this.tweens.add({ targets: destRing, scale: 2.0, alpha: 0, duration: 360, onComplete: () => destRing.destroy() });
  }

  syncHeroAppearance() {
    if (!this.hero) return;
    const cid = this.callbacks?.getState?.()?.classId || 'warrior';
    const atlasKey = `atlas_${cid}`;
    const fp = this.getHeroFramePrefix(cid);
    this.registerHeroAnims(cid);
    const dir = this.heroDir === 'left' ? 'right' : (this.heroDir || 'down');
    if (this.hero.texture.key !== atlasKey && this.textures.exists(atlasKey)) {
      this.hero.setTexture(atlasKey, `${fp}_${dir}_idle_0`);
    }
  }

  update(time, delta) {
    if (!this.hero) return;
    const dt = Math.min(0.05, delta / 1000);
    const td = this.townData;

    // 鍵盤移動優先
    let kx = 0;
    let ky = 0;
    if (this.cursors.left.isDown || this.wasd.left.isDown) kx -= 1;
    if (this.cursors.right.isDown || this.wasd.right.isDown) kx += 1;
    if (this.cursors.up.isDown || this.wasd.up.isDown) ky -= 1;
    if (this.cursors.down.isDown || this.wasd.down.isDown) ky += 1;

    let vx = 0;
    let vy = 0;
    const moveSpeed = 270;

    if (kx !== 0 || ky !== 0) {
      this.moveTarget = null;
      const len = Math.hypot(kx, ky);
      vx = (kx / len) * moveSpeed;
      vy = (ky / len) * moveSpeed;
    } else if (this.moveTarget) {
      const dx = this.moveTarget.x - this.hero.x;
      const dy = this.moveTarget.y - this.hero.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= 22) {
        const trig = this.moveTarget.triggerObj;
        this.moveTarget = null;
        if (trig) this.executeInteraction(trig);
      } else {
        vx = (dx / dist) * moveSpeed;
        vy = (dy / dist) * moveSpeed;
      }
    }

    let nx = Phaser.Math.Clamp(this.hero.x + vx * dt, 180, td.mapWidth - 180);
    let ny = Phaser.Math.Clamp(this.hero.y + vy * dt, 220, td.mapHeight - 160);
    if (td.walkableZones && td.walkableZones.length > 0) {
      const inside = td.walkableZones.some((z) => nx >= z.x1 && nx <= z.x2 && ny >= z.y1 && ny <= z.y2);
      if (!inside) {
        let bestX = nx;
        let bestY = ny;
        let bestDist = Infinity;
        for (const z of td.walkableZones) {
          const cx = Phaser.Math.Clamp(nx, z.x1, z.x2);
          const cy = Phaser.Math.Clamp(ny, z.y1, z.y2);
          const d = Math.hypot(nx - cx, ny - cy);
          if (d < bestDist) {
            bestDist = d;
            bestX = cx;
            bestY = cy;
          }
        }
        nx = bestX;
        ny = bestY;
      }
    }
    this.hero.x = nx;
    this.hero.y = ny;

    for (const ob of this.obstacles) {
      const dx = this.hero.x - ob.x;
      const dy = this.hero.y - ob.y;
      const d = Math.hypot(dx, dy);
      const minD = ob.radius + 24;
      if (d > 0 && d < minD) {
        const push = minD - d;
        this.hero.x += (dx / d) * push;
        this.hero.y += (dy / d) * push;
      }
    }

    this.hero.setDepth(this.hero.y);
    if (this.heroShadow) {
      this.heroShadow.setPosition(this.hero.x, this.hero.y + 42);
    }

    this.updateHeroAnim(vx, vy, time);
    this.updatePatrols(dt, time);
    this.updateNearestPrompt();

    if (Phaser.Input.Keyboard.JustDown(this.wasd.interact) && this.nearestTarget) {
      this.executeInteraction(this.nearestTarget);
    }

    // 回報詳細主城小地圖與鎖定 NPC 資訊
    if (this.callbacks?.onHudUpdate) {
      this.callbacks.onHudUpdate({
        townTarget: this.nearestTarget ? {
          title: this.nearestTarget.title,
          sub: this.nearestTarget.sub,
          townName: td.name,
          chapterIdx: td.chapterIdx ?? 0,
        } : null,
        minimap: {
          mode: 'town',
          chapterIdx: td.chapterIdx ?? 0,
          bgUrl: td.bgUrl,
          zoneName: td.name,
          heroX: this.hero.x,
          heroY: this.hero.y,
          heroDir: this.heroDir,
          heroFlipX: !!this.heroFlipX,
          mapW: td.mapWidth,
          mapH: td.mapHeight,
          walkableZones: td.walkableZones || [],
          obstacles: this.obstacles,
          facilities: this.interactables.map((it) => ({
            x: it.x,
            y: it.y,
            action: it.action,
            title: it.title,
          })),
          patrols: this.patrolActors.map((p) => ({ x: p.spr.x, y: p.spr.y })),
        },
      });
    }
  }

  updateHeroAnim(vx, vy, time) {
    const cid = this.callbacks?.getState?.()?.classId || 'warrior';
    this.registerHeroAnims(cid);
    const prefix = this.getHeroPrefix(cid);
    const spd = Math.hypot(vx, vy);

    if (spd > 14) {
      this.heroIsMoving = true;
      this.heroStopAt = time + 120;
      if (Math.abs(vx) > Math.abs(vy) * 1.1) {
        this.heroDir = 'right';
        this.heroFlipX = vx < 0;
      } else {
        this.heroDir = vy < 0 ? 'up' : 'down';
        this.heroFlipX = false;
      }
    } else if (spd < 6 && time >= (this.heroStopAt || 0)) {
      this.heroIsMoving = false;
    }

    const dir = this.heroDir === 'left' ? 'right' : (this.heroDir || 'down');
    this.hero.setFlipX(!!this.heroFlipX);

    if (time < this.heroAttackAnimUntil) {
      const atkKey = `${prefix}_${dir}_atk`;
      if (this.anims.exists(atkKey) && this.hero.anims.currentAnim?.key !== atkKey) {
        this.hero.play(atkKey, true);
      }
      return;
    }

    const walkKey = `${prefix}_${dir}_walk`;
    const idleKey = `${prefix}_${dir}_idle`;
    if (this.heroIsMoving) {
      if (this.anims.exists(walkKey)) {
        if (this.hero.anims.currentAnim?.key !== walkKey) this.hero.play(walkKey, true);
        else if (this.hero.anims.isPaused) this.hero.anims.resume();
        this.hero.anims.timeScale = Phaser.Math.Clamp(spd / 160, 0.9, 1.35);
      }
      const bounce = Math.abs(Math.sin(time * 0.015));
      this.hero.setScale(0.56 * (1.02 - bounce * 0.04), 0.56 * (0.96 + bounce * 0.06));
      if (time >= (this.heroStepDustAt || 0)) {
        this.heroStepDustAt = time + 260;
        const d = this.add.image(this.hero.x, this.hero.y + 38, 'fx_glow')
          .setTint(0x94a3b8).setScale(0.22).setAlpha(0.32).setDepth(4);
        this.tweens.add({ targets: d, y: d.y - 8, scale: 0.05, alpha: 0, duration: 280, onComplete: () => d.destroy() });
      }
    } else {
      if (this.anims.exists(idleKey)) {
        if (this.hero.anims.currentAnim?.key !== idleKey) this.hero.play(idleKey, true);
        else if (this.hero.anims.isPaused) this.hero.anims.resume();
        this.hero.anims.timeScale = 1;
      }
      this.hero.setScale(0.56, 0.56);
    }
  }

  registerNpcAnims(npcAtlasKey) {
    if (!this.textures.exists(npcAtlasKey)) return;
    const frames = this.textures.get(npcAtlasKey).getFrameNames();
    for (const fn of frames) {
      if (!fn.endsWith('_idle_0')) continue;
      const base = fn.slice(0, -'_idle_0'.length);
      if (!this.anims.exists(`${base}_idle`)) {
        this.anims.create({
          key: `${base}_idle`,
          frames: [0, 1, 2, 3].map((i) => ({ key: npcAtlasKey, frame: `${base}_idle_${i}` })),
          frameRate: 5,
          repeat: -1,
        });
      }
      if (!this.anims.exists(`${base}_walk`)) {
        this.anims.create({
          key: `${base}_walk`,
          frames: [0, 1, 2, 3].map((i) => ({ key: npcAtlasKey, frame: `${base}_walk_${i}` })),
          frameRate: 11,
          repeat: -1,
        });
      }
    }
  }

  spawnFootstepDust(x, y) {
    const dust = this.add.image(x + Phaser.Math.Between(-6, 6), y + 32, 'fx_glow')
      .setTint(0xd6d3d1).setScale(0.22, 0.12).setAlpha(0.32).setDepth(3);
    this.tweens.add({
      targets: dust,
      y: y + 24,
      scaleX: 0.42,
      scaleY: 0.22,
      alpha: 0,
      duration: 380,
      onComplete: () => dust.destroy(),
    });
  }

  attachNpcFacilityFx(x, y, action, spr) {
    if (action === 'drawer_upgrade' || action === 'modal_blacksmith') {
      this.time.addEvent({
        delay: 780,
        loop: true,
        callback: () => {
          if (!this.scene.isActive('TownScene')) return;
          for (let i = 0; i < 3; i++) {
            const spk = this.add.image(spr.x + Phaser.Math.Between(-12, 12), spr.y - 6, 'fx_glow')
              .setTint(i % 2 === 0 ? 0xfb923c : 0xfef08a).setScale(0.14).setAlpha(0.85).setDepth(spr.y + 4);
            this.tweens.add({
              targets: spk,
              x: spk.x + Phaser.Math.Between(-24, 24),
              y: spk.y - Phaser.Math.Between(18, 38),
              alpha: 0,
              scale: 0.04,
              duration: 520,
              onComplete: () => spk.destroy(),
            });
          }
        },
      });
    } else if (action === 'modal_alchemy') {
      this.time.addEvent({
        delay: 620,
        loop: true,
        callback: () => {
          if (!this.scene.isActive('TownScene')) return;
          const bub = this.add.image(spr.x + Phaser.Math.Between(-14, 14), spr.y - 10, 'fx_glow')
            .setTint(Math.random() < 0.5 ? 0xc084fc : 0x4ade80).setScale(0.16).setAlpha(0.7).setDepth(spr.y + 4);
          this.tweens.add({
            targets: bub,
            y: bub.y - 36,
            scale: 0.06,
            alpha: 0,
            duration: 900,
            onComplete: () => bub.destroy(),
          });
        },
      });
    } else if (action === 'drawer_skills' || action === 'modal_trainer') {
      this.time.addEvent({
        delay: 2400,
        loop: true,
        callback: () => {
          if (!this.scene.isActive('TownScene')) return;
          const arc = this.add.image(spr.x + (spr.flipX ? -18 : 18), spr.y - 8, 'fx_glow')
            .setTint(0xfacc15).setScale(0.55, 0.14).setAlpha(0.75).setDepth(spr.y + 5);
          this.tweens.add({
            targets: arc,
            scaleX: 0.85,
            alpha: 0,
            duration: 280,
            onComplete: () => arc.destroy(),
          });
        },
      });
    } else if (action === 'modal_portal' || action === 'drawer_rebirth' || action.startsWith('modal_')) {
      const aura = this.add.image(x, y + 26, 'fx_glow')
        .setTint(action === 'modal_portal' ? 0x38bdf8 : 0xe879f9).setScale(0.95, 0.36).setAlpha(0.24).setDepth(2);
      this.tweens.add({
        targets: aura,
        alpha: 0.42,
        scaleX: 1.12,
        duration: 1400,
        yoyo: true,
        repeat: -1,
      });
    }
  }

  clampNpcToTerrain(nx, ny) {
    const td = this.townData;
    let x = Phaser.Math.Clamp(nx, 180, td.mapWidth - 180);
    let y = Phaser.Math.Clamp(ny, 220, td.mapHeight - 160);
    let hitWall = false;
    if (td.walkableZones && td.walkableZones.length > 0) {
      const inside = td.walkableZones.some((z) => x >= z.x1 && x <= z.x2 && y >= z.y1 && y <= z.y2);
      if (!inside) {
        hitWall = true;
        let bx = x, by = y, bd = Infinity;
        for (const z of td.walkableZones) {
          const cx = Phaser.Math.Clamp(x, z.x1, z.x2);
          const cy = Phaser.Math.Clamp(y, z.y1, z.y2);
          const d = Math.hypot(x - cx, y - cy);
          if (d < bd) { bd = d; bx = cx; by = cy; }
        }
        x = bx;
        y = by;
      }
    }
    for (const ob of this.obstacles) {
      const dx = x - ob.x;
      const dy = y - ob.y;
      const d = Math.hypot(dx, dy);
      const minD = ob.radius + 20;
      if (d > 0 && d < minD) {
        const push = minD - d;
        x += (dx / d) * push;
        y += (dy / d) * push;
      }
    }
    return { x, y, hitWall };
  }

  updatePatrols(dt, time = 0) {
    for (const p of this.patrolActors) {
      const distHero = this.hero ? Phaser.Math.Distance.Between(this.hero.x, this.hero.y, p.spr.x, p.spr.y) : 999;
      let isMoving = false;
      if (distHero < 145 && this.hero) {
        p.spr.setFlipX(this.hero.x < p.spr.x);
      } else if (time < (p.pauseUntil || 0)) {
        isMoving = false;
      } else {
        const target = p.waypoints[p.wpIdx];
        const dx = target.x - p.spr.x;
        const dy = target.y - p.spr.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 12) {
          p.wpIdx = (p.wpIdx + 1) % p.waypoints.length;
        } else {
          isMoving = true;
          const prevX = p.spr.x;
          const prevY = p.spr.y;
          const res = this.clampNpcToTerrain(p.spr.x + (dx / dist) * p.speed * dt, p.spr.y + (dy / dist) * p.speed * dt);
          const moved = Math.hypot(res.x - prevX, res.y - prevY);
          p.spr.x = res.x;
          p.spr.y = res.y;
          p.walkElapsed = (p.walkElapsed || 0) + dt;
          if (res.hitWall || moved < 0.4) {
            p.stuckTime = (p.stuckTime || 0) + dt;
          } else {
            p.stuckTime = 0;
          }
          if (p.stuckTime > 0.42 || p.walkElapsed > 5.5) {
            isMoving = false;
            p.stuckTime = 0;
            p.walkElapsed = 0;
            p.pauseUntil = time + 1600 + Math.random() * 1400;
            p.wpIdx = (p.wpIdx + 1) % p.waypoints.length;
          }
          const stepX = res.x - prevX;
          if (Math.abs(stepX) > 0.12) p.spr.setFlipX(stepX < 0);
          if (time >= (p.dustAt || 0)) {
            p.dustAt = time + 260;
            this.spawnFootstepDust(p.spr.x, p.spr.y - 30);
          }
        }
      }
      if (p.hasAnim && p.spr.anims) {
        const targetAnim = `${p.frame}_${isMoving ? 'walk' : 'idle'}`;
        if (p.spr.anims.currentAnim?.key !== targetAnim) p.spr.play(targetAnim, true);
      }
      p.spr.setRotation(0);
      p.spr.setDepth(p.spr.y);
      p.shadow.setPosition(p.spr.x, p.spr.y + 2);
      p.shadow.setScale(isMoving ? 0.95 + Math.sin(time * 0.014) * 0.08 : 0.95, 0.34);
      if (p.plate) p.plate.setPosition(p.spr.x, p.spr.y - 108);
      if (p.interactObj) {
        p.interactObj.x = p.spr.x;
        p.interactObj.y = p.spr.y;
      }
    }

    // 設施 NPC 小範圍踱步（貼合地形與障礙物，靠近自動面向玩家）
    for (const r of this.roamNpcs) {
      const distHero = this.hero ? Phaser.Math.Distance.Between(this.hero.x, this.hero.y, r.spr.x, r.spr.y) : 999;
      let isMoving = false;
      if (distHero < 195 && this.hero) {
        r.spr.setFlipX(this.hero.x < r.spr.x);
      } else if (time >= r.waitUntil) {
        const dx = r.targetX - r.spr.x;
        const dy = r.targetY - r.spr.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 6) {
          r.waitUntil = time + 2200 + Math.random() * 2400;
          r.targetX = r.homeX + Phaser.Math.Between(-28, 28);
          r.targetY = r.homeY + Phaser.Math.Between(-14, 14);
        } else {
          isMoving = true;
          const spd = 30;
          const prevX = r.spr.x;
          const prevY = r.spr.y;
          const res = this.clampNpcToTerrain(r.spr.x + (dx / dist) * spd * dt, r.spr.y + (dy / dist) * spd * dt);
          const moved = Math.hypot(res.x - prevX, res.y - prevY);
          r.spr.x = res.x;
          r.spr.y = res.y;
          r.walkElapsed = (r.walkElapsed || 0) + dt;
          if (res.hitWall || moved < 0.25) {
            r.stuckTime = (r.stuckTime || 0) + dt;
          } else {
            r.stuckTime = 0;
          }
          if (r.stuckTime > 0.40 || r.walkElapsed > 2.4) {
            isMoving = false;
            r.stuckTime = 0;
            r.walkElapsed = 0;
            r.waitUntil = time + 2200 + Math.random() * 2000;
            r.targetX = r.homeX + Phaser.Math.Between(-24, 24);
            r.targetY = r.homeY + Phaser.Math.Between(-12, 12);
          }
          const stepX = res.x - prevX;
          if (Math.abs(stepX) > 0.08) r.spr.setFlipX(stepX < 0);
          if (time >= (r.dustAt || 0)) {
            r.dustAt = time + 320;
            this.spawnFootstepDust(r.spr.x, r.spr.y - 30);
          }
        }
      }
      if (r.hasAnim && r.spr.anims) {
        const targetAnim = `${r.frame}_${isMoving ? 'walk' : 'idle'}`;
        if (r.spr.anims.currentAnim?.key !== targetAnim) r.spr.play(targetAnim, true);
      }
      r.spr.setRotation(0);
      r.spr.setDepth(r.spr.y);
      r.shadow.setPosition(r.spr.x, r.spr.y + 2);
      if (r.plate) r.plate.setPosition(r.spr.x, r.spr.y - 112);
      if (r.icon) r.icon.x = r.spr.x;
      if (r.interactObj) {
        r.interactObj.x = r.spr.x;
        r.interactObj.y = r.spr.y;
      }
    }
  }

  updateNearestPrompt() {
    let best = null;
    let bestD = Infinity;
    for (const obj of this.interactables) {
      const d = Phaser.Math.Distance.Between(this.hero.x, this.hero.y, obj.x, obj.y);
      if (d <= obj.radius && d < bestD) {
        bestD = d;
        best = obj;
      }
    }
    this.nearestTarget = best;
    if (best) {
      this.promptBox
        .setText(`${best.title}｜${best.sub}`)
        .setPosition(best.x, best.y - 108)
        .setVisible(true);
      if (this.hoverRing) {
        this.hoverRing.setPosition(best.x, best.y + 34).setVisible(true);
      }
    } else {
      this.promptBox.setVisible(false);
      if (this.hoverRing) this.hoverRing.setVisible(false);
    }
  }

  getSpriteDataUrl(atlasKey, frameName) {
    if (!atlasKey || !frameName) return '';
    const cacheKey = `${atlasKey}:${frameName}`;
    if (this._portraitCache.has(cacheKey)) return this._portraitCache.get(cacheKey);
    const tex = this.textures.get(atlasKey);
    if (!tex || !tex.has(frameName)) return '';
    const fr = tex.get(frameName);
    const srcImg = tex.getSourceImage();
    if (!srcImg || !fr) return '';
    const cv = document.createElement('canvas');
    cv.width = fr.cutWidth;
    cv.height = fr.cutHeight;
    const ctx2d = cv.getContext('2d');
    ctx2d.drawImage(srcImg, fr.cutX, fr.cutY, fr.cutWidth, fr.cutHeight, 0, 0, fr.cutWidth, fr.cutHeight);
    const url = cv.toDataURL('image/png');
    this._portraitCache.set(cacheKey, url);
    return url;
  }

  executeInteraction(obj) {
    if (obj.action === 'hit_dummy') {
      this.heroAttackAnimUntil = this.time.now + 340;
      const stats = this.callbacks?.getComputedStats?.() || { atk: 45, critRate: 15, critDmg: 165 };
      const isCrit = Math.random() * 100 < (stats.critRate || 15);
      const dmg = Math.round((stats.atk || 45) * (isCrit ? (stats.critDmg || 165) / 100 : 1) * (0.94 + Math.random() * 0.12));
      if (this.dummySprite) {
        this.tweens.add({
          targets: this.dummySprite,
          angle: 10,
          duration: 75,
          yoyo: true,
        });
      }
      const txt = this.add.text(obj.x + Phaser.Math.Between(-20, 20), obj.y - 52, `${isCrit ? '💥 ' : ''}${formatNum(dmg)}`, {
        fontFamily: 'Cinzel, Noto Sans TC, sans-serif',
        fontSize: isCrit ? '22px' : '17px',
        fontStyle: 'bold',
        color: isCrit ? '#facc15' : '#f8fafc',
        stroke: '#000',
        strokeThickness: 4,
      }).setOrigin(0.5).setDepth(4800);
      this.tweens.add({ targets: txt, y: txt.y - 44, alpha: 0, duration: 680, onComplete: () => txt.destroy() });
      return;
    }

    if (obj.action === 'gimmick_spore_fountain' || obj.action === 'gimmick_steam_valve' || obj.action === 'gimmick_soul_brazier' || obj.action === 'gimmick_candle_shrine' || obj.action === 'gimmick_lava_fountain' || obj.action === 'gimmick_lava_sluice' || obj.action === 'gimmick_abyss_sigil' || obj.action === 'gimmick_blood_chalice' || obj.action === 'gimmick_aurora_spire' || obj.action === 'gimmick_runic_brazier' || obj.action === 'gimmick_emerald_waterfall' || obj.action === 'gimmick_voodoo_horn' || obj.action === 'gimmick_storm_core' || obj.action === 'gimmick_tesla_coil' || obj.action === 'gimmick_blood_fountain' || obj.action === 'gimmick_abbey_bell' || obj.action === 'gimmick_astral_orrery' || obj.action === 'gimmick_star_well') {
      const tint = (obj.action === 'gimmick_spore_fountain' || obj.action === 'gimmick_abyss_sigil' || obj.action === 'gimmick_blood_chalice') ? 0xe879f9 : (obj.action === 'gimmick_steam_valve' ? 0x34d399 : ((obj.action === 'gimmick_lava_fountain' || obj.action === 'gimmick_lava_sluice') ? 0xf97316 : 0x38bdf8));
      for (let i = 0; i < 16; i++) {
        const sp = this.add.image(obj.x + Phaser.Math.Between(-35, 35), obj.y - 12, 'fx_glow')
          .setTint(tint).setScale(0.35).setDepth(4500);
        this.tweens.add({
          targets: sp,
          x: obj.x + Phaser.Math.Between(-135, 135),
          y: obj.y - Phaser.Math.Between(90, 210),
          alpha: 0,
          scale: 0.05,
          duration: 800,
          onComplete: () => sp.destroy(),
        });
      }
    }

    if (obj.action === 'gimmick_beacon') {
      for (let i = 0; i < 14; i++) {
        const sp = this.add.image(obj.x + Phaser.Math.Between(-30, 30), obj.y - 10, 'fx_glow')
          .setTint(0xfbbf24).setScale(0.32).setDepth(4500);
        this.tweens.add({
          targets: sp,
          x: obj.x + Phaser.Math.Between(-120, 120),
          y: obj.y - Phaser.Math.Between(90, 190),
          alpha: 0,
          scale: 0.05,
          duration: 750,
          onComplete: () => sp.destroy(),
        });
      }
    }

    this.callbacks?.onTownAction?.(obj.action, obj.data);
  }
}
