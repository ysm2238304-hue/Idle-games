import { getHeroAtlasInfo, isAtlasTextureReady, safeQueueAtlas, waitAtlasReady } from '../combat/HeroAnimRouter.js?v=317';
import { CameraZoomHelper } from './CameraZoomHelper.js?v=317';
import { TOWN_CH1 } from '../data/towns/ch1.js?v=317';
import { LivingNpcEngine } from '../town/LivingNpcEngine.js?v=317';
import { TownMultiplayerSync } from '../net/TownMultiplayerSync.js?v=317';
import { TOWN_CH2 } from '../data/towns/ch2.js?v=317';
import { TOWN_CH3 } from '../data/towns/ch3.js?v=317';
import { TOWN_CH4 } from '../data/towns/ch4.js?v=317';
import { TOWN_CH5 } from '../data/towns/ch5.js?v=317';
import { TOWN_CH6 } from '../data/towns/ch6.js?v=317';
import { TOWN_CH7 } from '../data/towns/ch7.js?v=317';
import { TOWN_CH8 } from '../data/towns/ch8.js?v=317';
import { TOWN_CH9 } from '../data/towns/ch9.js?v=317';
import { TOWN_CH10 } from '../data/towns/ch10.js?v=317';
import { formatNum } from '../logic/statCalc.js?v=317';
import { PET_CATALOG, getPetDef, PET_SCHOOLS, getPetRarityMeta } from '../data/pets.js?v=317';

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
    this.rectObstacles = [];
    this.interactables = [];
    this.patrolActors = [];
    this.roamNpcs = [];
    this.livingNpcs = null;
    this.mpSync = null;
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
    window.__petTexQueued = window.__petTexQueued || new Set();
    PET_CATALOG.forEach((p) => {
      const k = `pet_${p.id}`;
      if (!this.textures.exists(k) && !window.__petTexQueued.has(k)) {
        window.__petTexQueued.add(k);
        this.load.image(k, `./assets/pets/${p.id}.png?v=90`);
      }
    });
    const td = this.townData;
    const cid = (this.callbacks?.getState?.()?.classId || window.__IDLE_ARPG_BRIDGE__?.getState?.()?.classId || 'warrior');
    const hInfo = getHeroAtlasInfo(cid);
    safeQueueAtlas(this, hInfo.baseKey, hInfo.basePng, hInfo.baseJson);
    if (!this.textures.exists('town_waypoint_circle')) {
      this.load.image('town_waypoint_circle', './assets/ui/town_waypoint_circle.png?v=227');
    }
    if (!this.textures.exists(td.bgKey)) {
      this.load.image(td.bgKey, td.bgUrl);
    }
    // v267/v312: 載入新版暗黑 4 獨立地形融合 WebP 建築、專屬演武場與建築式傳送陣
    if (!this.textures.exists('town_dummy_v287')) {
      this.load.image('town_dummy_v287', './assets/towns/town_dummy.webp?v=287');
    }
    const chNum = (td.chapterIdx ?? 0) + 1;
    const arenaKey = td.trainingDummy?.imgKey || `ch${chNum}_arena_v312`;
    const arenaUrl = td.trainingDummy?.imgUrl || `./assets/towns/ch${chNum}_arena.webp?v=312`;
    if (!this.textures.exists(arenaKey)) {
      this.load.image(arenaKey, arenaUrl);
    }
    const wpBldKey = `ch${chNum}_waypoint_v312`;
    if (!this.textures.exists(wpBldKey)) {
      this.load.image(wpBldKey, `./assets/towns/ch${chNum}_waypoint.webp?v=312`);
    }
    if (td.modularBuildings || !td.integratedBuildings) {
      if (td.landmark?.imgKey && td.landmark?.imgUrl && !this.textures.exists(td.landmark.imgKey)) {
        this.load.image(td.landmark.imgKey, td.landmark.imgUrl);
      }
      if (td.portal?.imgKey && td.portal?.imgUrl && !this.textures.exists(td.portal.imgKey)) {
        this.load.image(td.portal.imgKey, td.portal.imgUrl);
      }
      (td.facilities || []).forEach((fac) => {
        if (fac.imgKey && fac.imgUrl && !this.textures.exists(fac.imgKey)) {
          this.load.image(fac.imgKey, fac.imgUrl);
        }
      });
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
    this.rectObstacles = [];
    this.interactables = [];
    this.patrolActors = [];
    this.roamNpcs = [];
    this._placedNpcPos = [];
    this.livingNpcs?.destroy();
    this.mpSync?.destroy();
    this.livingNpcs = new LivingNpcEngine(this);
    this.mpSync = new TownMultiplayerSync(this, td);
    this.events.once('shutdown', () => {
      this.livingNpcs?.destroy();
      this.mpSync?.destroy();
    });
    this.events.once('destroy', () => {
      this.livingNpcs?.destroy();
      this.mpSync?.destroy();
    });
    this.moveTarget = null;
    this.nearestTarget = null;

    const npcAtlasKey = td.atlasKey.replace('town_atlas_', 'town_npc_atlas_');
    this.npcAtlasKey = npcAtlasKey;
    this.registerNpcAnims(npcAtlasKey);
    this.registerHeroAnims((this.callbacks?.getState?.()?.classId || window.__IDLE_ARPG_BRIDGE__?.getState?.()?.classId || 'warrior'));
    this.physics?.world?.setBounds(0, 0, td.mapWidth, td.mapHeight);
    this.cameras.main.setBounds(0, 0, td.mapWidth, td.mapHeight);

        if (!this.textures.exists('fx_glow')) {
      const tex = this.textures.createCanvas('fx_glow', 64, 64);
      const ctx = tex.getContext();
      const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 32);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.35, 'rgba(255,255,255,0.6)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 64, 64);
      tex.refresh();
    }
    // 1. 廣場大底圖
    this.add.image(td.mapWidth / 2, td.mapHeight / 2, td.bgKey)
      .setDisplaySize(td.mapWidth, td.mapHeight)
      .setDepth(0);

    // 2. 主城章節地標（v283 三層分離架構：獨立 2.5D 地標建築＋Y-Sort＋懸停微光）
    if (td.landmark) {
      const lm = td.landmark;
      if (td.integratedBuildings) {
        const ring = this.add.circle(lm.x, lm.y + 10, 68, td.ambientColor, 0.14)
          .setStrokeStyle(2.5, td.ambientColor, 0.78).setScale(1, 0.54).setDepth(4);
        this.tweens.add({ targets: ring, scaleX: 1.09, scaleY: 0.59, alpha: 0.95, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.beaconGlow = this.add.image(lm.x, lm.y - 8, 'fx_glow')
          .setTint(td.ambientColor).setScale(2.1, 1.15).setAlpha(0.28).setBlendMode(Phaser.BlendModes.ADD).setDepth(5);
        this.tweens.add({ targets: this.beaconGlow, scaleX: 2.45, scaleY: 1.32, alpha: 0.44, duration: 1350, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.addNameplate(lm.x, lm.y - 68, `🔥 ${lm.name}`, '#fde68a', true);
        const lmZone = this.add.zone(lm.x, lm.y, 170, 120).setInteractive({ useHandCursor: true }).setDepth(lm.y + 5);
        lmZone.on('pointerover', () => ring.setStrokeStyle(3.5, 0xfef08a, 1));
        lmZone.on('pointerout', () => ring.setStrokeStyle(2.5, td.ambientColor, 0.78));
      } else {
        // v298: 移除地標下方浮空黑橢圓陰影，讓建築底座自然貼合地面
        const lm3d = this.get3DBuildingTexKey(lm);
        const lmSpr = lm3d
          ? this.add.image(lm.x, lm.y, lm3d).setOrigin(0.5, 0.92)
          : ((lm.imgKey && this.textures.exists(lm.imgKey))
            ? this.add.image(lm.x, lm.y, lm.imgKey).setOrigin(0.5, 0.72)
            : this.add.image(lm.x, lm.y, td.atlasKey, lm.frame));
        lmSpr.setScale(lm.scale).setDepth(lm.y);
        if (td.modularBuildings) {
          lmSpr.setOrigin(0.5, 0.92).setInteractive({ useHandCursor: true });
          lmSpr.on('pointerover', () => lmSpr.setTint(0xfff3c4));
          lmSpr.on('pointerout', () => lmSpr.clearTint());
          this.addNameplate(lm.x, lm.y - Math.round(240 * (lm.scale || 0.78)), `🔥 ${lm.name}`, '#fde68a', true);
        }
        this.beaconGlow = this.add.image(lm.x, lm.y - 42, 'fx_glow')
          .setTint(td.ambientColor).setScale(1.8).setAlpha(0.24).setBlendMode(Phaser.BlendModes.ADD).setDepth(lm.y + 2);
        this.tweens.add({ targets: this.beaconGlow, scale: 2.2, alpha: 0.38, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        const lmHw = Math.max(Math.round((lm.radius || 64) * 1.05), Math.round((lmSpr.displayWidth || 320) * 0.30));
        const lmHt = Math.max(Math.round((lm.radius || 64) * 1.15), Math.round((lmSpr.displayHeight || 320) * 0.36));
        this.rectObstacles.push({ x1: lm.x - lmHw, y1: lm.y - lmHt, x2: lm.x + lmHw, y2: lm.y - 6 });
      }
      this.interactables.push({
        id: lm.id,
        x: lm.x,
        y: lm.y + 14,
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

    // 6. 全 10 章專屬風格 2.5D 演武場建築（v312 重構皮靶人為主題演武場）
    if (td.trainingDummy) {
      const dm = td.trainingDummy;
      const chNum = (td.chapterIdx ?? 0) + 1;
      const arenaKey = dm.imgKey || `ch${chNum}_arena_v312`;
      const hasArenaBld = this.textures.exists(arenaKey);
      const arenaScale = hasArenaBld ? (dm.scale || 0.76) : (dm.scale || 0.62);
      this.dummySprite = (hasArenaBld
        ? this.add.image(dm.x, dm.y, arenaKey).setOrigin(0.5, 0.94).setScale(arenaScale).setDepth(dm.y - 18)
        : (this.textures.exists('town_dummy_v287')
          ? this.add.image(dm.x, dm.y, 'town_dummy_v287').setOrigin(0.5, 0.92).setScale(arenaScale).setDepth(dm.y)
          : this.add.image(dm.x, dm.y, td.atlasKey, dm.frame).setScale(arenaScale).setDepth(dm.y)));
      if (hasArenaBld) {
        const dispW = Math.round(this.dummySprite.displayWidth || (420 * arenaScale));
        const dispH = Math.round(this.dummySprite.displayHeight || (420 * arenaScale));
        const hw = Math.max(75, Math.round(dispW * 0.25));
        const hTop = Math.max(70, Math.round(dispH * 0.34));
        this.rectObstacles.push({ x1: dm.x - hw, y1: dm.y - hTop, x2: dm.x + hw, y2: dm.y - 6 });
        this.dummySprite.setInteractive({ useHandCursor: true });
        this.dummySprite.on('pointerover', () => this.dummySprite.setTint(0xfff1c9));
        this.dummySprite.on('pointerout', () => this.dummySprite.clearTint());
        this.dummySprite.on('pointerdown', (pointer) => {
          if (pointer?.leftButtonDown?.()) {
            const safePos = this._pushOutOfObstacles(dm.x, dm.y + 72, 22);
            this.moveTarget = { x: safePos.x, y: safePos.y, triggerAction: 'hit_dummy', triggerData: dm };
          }
        });
        this.addNameplate(dm.x, dm.y - Math.round(270 * arenaScale), `⚔️ ${dm.name}`, '#facc15', true);
      } else {
        this.obstacles.push({ x: dm.x, y: dm.y + 16, radius: dm.radius || 46 });
        this.addNameplate(dm.x, dm.y - 96, `⚔️ ${dm.name}`, '#facc15', true);
      }
      this.interactables.push({
        id: 'dummy',
        x: dm.x,
        y: dm.y + (hasArenaBld ? 48 : 0),
        radius: 155,
        title: `⚔️ ${dm.name}`,
        sub: '點擊或按 [F] 進入「2.5D 實戰演武場」（多木人＋自動攻擊＋DPS）',
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
      const wps = pt.waypoints || pt.points || [];
      if (!wps.length) continue;
      pt.waypoints = wps;
      if (!pt.scale) pt.scale = 0.62;
      const start = wps[0];
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
    const cid = (this.callbacks?.getState?.()?.classId || window.__IDLE_ARPG_BRIDGE__?.getState?.()?.classId || 'warrior');
    const framePrefix = this.getHeroFramePrefix(cid);
    const atlasKey = getHeroAtlasInfo(cid).baseKey;
    const initFrame = `${framePrefix}_down_walk_0`;

    this.petShadow = this.add.image(td.spawn.x - 52, td.spawn.y + 28, 'fx_glow').setTint(0x000000).setScale(0.65, 0.26).setAlpha(0.42).setDepth(2);
    this.petAura = this.add.image(td.spawn.x - 52, td.spawn.y - 14, 'fx_glow').setTint(0xf97316).setScale(0.95).setAlpha(0.32).setBlendMode(Phaser.BlendModes.ADD).setDepth(td.spawn.y - 1);
    this.petBuddy = this.add.image(td.spawn.x - 52, td.spawn.y - 18, this.textures.exists('pet_pet_c1') ? 'pet_pet_c1' : 'fx_glow').setScale(0.46).setOrigin(0.5).setDepth(td.spawn.y);
    this.petLabel = this.add.text(td.spawn.x - 52, td.spawn.y - 46, '', { fontSize: '13px', color: '#fde68a', fontFamily: 'Noto Sans TC, sans-serif', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(td.spawn.y + 3);
    this._lastTownPetId = null;
    this._petTrailAt = 0;
    this.heroShadow = this.add.image(td.spawn.x, td.spawn.y + 30, 'fx_glow')
      .setTint(0x000000).setScale(0.86, 0.32).setAlpha(0.50).setDepth(3);
    // v312-2: 防呆檢查 WebGL 貼圖就緒，避免切換職業競態導致 glTexture=null 黑屏崩潰
    const heroTexReady = isAtlasTextureReady(this, atlasKey, initFrame);
    this.hero = (heroTexReady
      ? this.add.sprite(td.spawn.x, td.spawn.y, atlasKey, initFrame).setScale(0.56)
      : this.add.sprite(td.spawn.x, td.spawn.y, 'fx_glow').setScale(0.56).setAlpha(0.01))
      .setDepth(td.spawn.y);
    const initIdleKey = `${this.getHeroPrefix(cid)}_down_idle`;
    if (heroTexReady && this.anims.exists(initIdleKey)) {
      this.hero.play(initIdleKey, true);
    } else if (!heroTexReady) {
      const hInfoNow = getHeroAtlasInfo(cid);
      const applyHeroReady = () => {
        if (!this.hero?.active || !isAtlasTextureReady(this, atlasKey, initFrame)) return;
        this.registerHeroAnims(cid);
        this.hero.setTexture(atlasKey, initFrame).setAlpha(1);
        const ik = `${this.getHeroPrefix(cid)}_down_idle`;
        if (this.anims.exists(ik)) this.hero.play(ik, true);
      };
      if (safeQueueAtlas(this, atlasKey, hInfoNow.basePng, hInfoNow.baseJson)) {
        this.load.once('complete', () => waitAtlasReady(this, atlasKey, applyHeroReady));
        this.load.start();
      } else {
        waitAtlasReady(this, atlasKey, applyHeroReady);
      }
    }
    const initNick = (this.callbacks?.getState?.()?.nickname || window.__IDLE_ARPG_BRIDGE__?.getState?.()?.nickname || '冒險者').trim();
    this.heroNameText = this.add.text(td.spawn.x, td.spawn.y - 54, initNick, {
      fontSize: '14px',
      fontFamily: 'Noto Sans TC, sans-serif',
      fontStyle: 'bold',
      color: '#fef08a',
      stroke: '#000000',
      strokeThickness: 5,
      shadow: { offsetX: 0, offsetY: 2, color: '#000000', blur: 6, fill: true },
    }).setOrigin(0.5).setDepth(4800);

    this.mpSync?.start();
    this.cameras.main.startFollow(this.hero, true, 0.14, 0.14);
    // v278: 全場景通用滑鼠滾輪縮放引擎（0.55x 全景俯瞰 ↔ 1.45x 近距細看，按 [0] 重置）
    this.cameraZoom = new CameraZoomHelper(this, { minZoom: 0.55, maxZoom: 1.45, defaultZoom: 0.88, step: 0.09, mapWidth: td.mapWidth, mapHeight: td.mapHeight });

    // 9.2 全 10 座主城 2.5D「建築式主城傳送陣」（v312 專屬石柱/拱門建築＋地面微光魔法陣）
    const wpX = td.waypoint?.x ?? (td.spawn.x + 225);
    const wpY = td.waypoint?.y ?? (td.spawn.y - 38);
    const CH_WP_TINTS = [0xfbbf24, 0xa855f7, 0x38bdf8, 0xf97316, 0xe879f9, 0x22d3ee, 0x4ade80, 0xfacc15, 0xf43f5e, 0xc084fc];
    const chIdxNow = Math.max(0, Math.min(9, td.chapterIdx ?? 0));
    const wpTint = CH_WP_TINTS[chIdxNow] || 0x38bdf8;
    const wpTintHex = '#' + wpTint.toString(16).padStart(6, '0');
    const wpBldKey = `ch${chIdxNow + 1}_waypoint_v312`;
    const hasWpBld = this.textures.exists(wpBldKey);

    const wpAura = this.add.image(wpX, wpY - (hasWpBld ? 12 : 0), 'fx_glow')
      .setTint(wpTint).setScale(hasWpBld ? 2.4 : 2.8, hasWpBld ? 1.1 : 1.35).setAlpha(0.28).setBlendMode(Phaser.BlendModes.ADD).setDepth(3);
    this.tweens.add({ targets: wpAura, scaleX: 2.9, scaleY: 1.35, alpha: 0.46, duration: 1500, yoyo: true, repeat: -1 });

    // 2.5D 壓扁容器，讓法陣貼合傳送陣底座透視並平滑旋轉
    const wpPad = this.add.container(wpX, wpY + (hasWpBld ? 8 : 0)).setScale(1, 0.54).setDepth(4);
    const hasCircleTex = this.textures.exists('town_waypoint_circle');
    const wpOuter = this.add.image(0, 0, hasCircleTex ? 'town_waypoint_circle' : 'fx_glow')
      .setTint(wpTint).setScale(hasCircleTex ? 0.38 : 1.55).setAlpha(0.82).setBlendMode(Phaser.BlendModes.ADD);
    const wpInner = this.add.image(0, 0, hasCircleTex ? 'town_waypoint_circle' : 'fx_glow')
      .setTint(0xf8fafc).setScale(hasCircleTex ? 0.24 : 0.85).setAlpha(0.68).setBlendMode(Phaser.BlendModes.ADD);
    wpPad.add([wpOuter, wpInner]);
    this.tweens.add({ targets: wpOuter, angle: 360, duration: 15000, repeat: -1 });
    this.tweens.add({ targets: wpInner, angle: -360, duration: 9500, repeat: -1 });

    if (hasWpBld) {
      const wpScale = 0.72;
      const wpSpr = this.add.image(wpX, wpY, wpBldKey).setOrigin(0.5, 0.94).setScale(wpScale).setDepth(wpY - 18);
      const dispW = Math.round(wpSpr.displayWidth || 280);
      const dispH = Math.round(wpSpr.displayHeight || 280);
      const hw = Math.max(58, Math.round(dispW * 0.23));
      const hTop = Math.max(56, Math.round(dispH * 0.30));
      this.rectObstacles.push({ x1: wpX - hw, y1: wpY - hTop, x2: wpX + hw, y2: wpY - 6 });
      wpSpr.setInteractive({ useHandCursor: true });
      wpSpr.on('pointerover', () => wpSpr.setTint(0xfff3c4));
      wpSpr.on('pointerout', () => wpSpr.clearTint());
      wpSpr.on('pointerdown', (pointer) => {
        if (pointer?.leftButtonDown?.()) {
          const safePos = this._pushOutOfObstacles(wpX, wpY + 56, 22);
          this.moveTarget = { x: safePos.x, y: safePos.y, triggerAction: 'open_waypoint', triggerData: { chapterIdx: td.chapterIdx } };
        }
      });
    }

    this.time.addEvent({
      delay: 340,
      loop: true,
      callback: () => {
        if (!this.scene.isActive('TownScene')) return;
        const p = this.add.image(wpX + Phaser.Math.Between(-42, 42), wpY + Phaser.Math.Between(-16, 16), 'fx_glow')
          .setTint(wpTint).setScale(0.16).setAlpha(0.85).setBlendMode(Phaser.BlendModes.ADD).setDepth(wpY + 2);
        this.tweens.add({ targets: p, y: p.y - 54, alpha: 0, scale: 0.04, duration: 950, onComplete: () => p.destroy() });
      },
    });
    this.addNameplate(wpX, wpY - (hasWpBld ? 205 : 64), '🧭 主城傳送陣', wpTintHex, true);
    this.interactables.push({
      id: 'town_waypoint_pad',
      x: wpX,
      y: wpY + (hasWpBld ? 34 : 0),
      radius: 135,
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
      fontSize: '15px',
      color: '#f8fafc',
      backgroundColor: 'rgba(15, 23, 42, 0.92)',
      padding: { x: 11, y: 6 },
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
      const dest = clickedObj ? { x: clickedObj.x, y: clickedObj.y + 38, clamped: false } : this._clampToWalkable(wx, wy, 20);
      this.moveTarget = clickedObj
        ? { x: dest.x, y: dest.y, triggerObj: clickedObj }
        : { x: dest.x, y: dest.y, triggerObj: null };

      const ring = this.add.image(dest.x, dest.y, 'fx_glow')
        .setTint(clickedObj ? 0xfacc15 : (dest.clamped ? 0xf97316 : 0x38bdf8))
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

  get3DBuildingTexKey() {
    return null;
  }

  placeBuilding(atlasKey, b) {
    // v283: 正統 2.5D 三層分離式主城建築（純淨地基底圖 ＋ 獨立風格化 2.5D 建築本體 ＋ doorOffset 門口綁定 NPC，完全廢除粗糙發光圓陣）
    if (this.townData?.modularBuildings) {
      const tex3d = this.get3DBuildingTexKey(b);
      const useStandalone = b.imgKey && this.textures.exists(b.imgKey);
      const sc = tex3d ? Math.max(0.74, (b.scale || 0.80) * 0.96) : (b.scale || 0.78);
      // v298: 移除建築下方浮空黑橢圓陰影，讓寫實建築本體穩妥貼合地面
      const spr = tex3d
        ? this.add.image(b.x, b.y, tex3d).setOrigin(0.5, 0.92).setScale(sc).setDepth(b.y - 20)
        : (useStandalone
          ? this.add.image(b.x, b.y, b.imgKey).setOrigin(0.5, 0.96).setScale(sc).setDepth(b.y - 20)
          : this.add.image(b.x, b.y, atlasKey, b.frame).setOrigin(0.5, 0.92).setScale(sc).setDepth(b.y - 20));
      if (b.flipX && !tex3d) spr.setFlipX(true);
      // v298: 依實際放大後建築貼圖寬高建立嚴格實體矩形碰撞盒，杜絕穿模與穿牆
      const dispW = Math.round(spr.displayWidth || (512 * sc));
      const dispH = Math.round(spr.displayHeight || (512 * sc));
      const baseR = b.radius > 0 ? b.radius : Math.round(72 * sc);
      const hw = Math.max(Math.round(baseR * 0.92), Math.round(dispW * 0.26));
      const hTop = Math.max(Math.round(baseR * 1.10), Math.round(dispH * 0.36));
      this.rectObstacles.push({
        x1: b.x - hw,
        y1: b.y - hTop,
        x2: b.x + hw,
        y2: b.y - 6,
      });
      if (b.name && b.action) {
        const icon = this.getActionIcon(b.action);
        this.addNameplate(b.x, b.y - Math.round(285 * sc), `${icon} ${b.name}`, '#fde68a', true);
      }
      if (b.action) {
        spr.setInteractive({ useHandCursor: true });
        spr.on('pointerover', () => spr.setTint(0xfff1c9));
        spr.on('pointerout', () => spr.clearTint());
        spr.on('pointerdown', (pointer) => {
          if (pointer?.leftButtonDown?.()) {
            const dx = b.doorOffset?.x ?? 0;
            const dy = b.doorOffset?.y ?? 88;
            const safeDoor = this._pushOutOfObstacles(b.x + dx, b.y + dy, 22);
            this.moveTarget = { x: safeDoor.x, y: safeDoor.y, triggerAction: b.action, triggerData: b };
          }
        });
      }
      return;
    }

    if (this.townData?.integratedBuildings && b.action) {
      const tintMap = {
        drawer_upgrade: 0xf97316,
        modal_alchemy:  0x34d399,
        modal_market:   0xc084fc,
        drawer_skills:  0xfbbf24,
        drawer_bag:     0x38bdf8,
        drawer_rebirth: 0x67e8f9,
        modal_bounty:   0xf59e0b,
        modal_portal:   0xa855f7,
      };
      const accent = tintMap[b.action] || this.townData?.ambientColor || 0xfbbf24;
      const icon = this.getActionIcon(b.action);

      // 地面 2.5D 透視發光互動符文陣
      const pad = this.add.circle(b.x, b.y + 18, 62, accent, 0.12)
        .setStrokeStyle(2, accent, 0.72).setScale(1, 0.52).setDepth(4);
      const inner = this.add.circle(b.x, b.y + 18, 36, accent, 0.08)
        .setStrokeStyle(1.5, 0xfef3c7, 0.45).setScale(1, 0.52).setDepth(4);
      this.tweens.add({
        targets: pad,
        scaleX: 1.08,
        scaleY: 0.56,
        alpha: 0.88,
        duration: 1650 + Math.random() * 450,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      // 柔和環境光點（讓厚塗建築本體呈現鍛爐火星／煉金蒸氣／聖殿微光）
      const glow = this.add.image(b.x, b.y - 6, 'fx_glow')
        .setTint(accent).setScale(1.45, 0.78).setAlpha(0.22).setBlendMode(Phaser.BlendModes.ADD).setDepth(5);
      this.tweens.add({
        targets: glow,
        alpha: 0.36,
        scaleX: 1.65,
        duration: 1400 + Math.random() * 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      // 懸浮暗黑 4 風格設施掛牌
      if (b.name) {
        this.addNameplate(b.x, b.y - 68, `${icon} ${b.name}`, '#fde68a', true);
      }

      // 大範圍可點擊建築互動熱區（滑鼠移過高亮外框）
      const hitZone = this.add.zone(b.x, b.y, 175, 130).setInteractive({ useHandCursor: true }).setDepth(b.y + 4);
      hitZone.on('pointerover', () => {
        pad.setStrokeStyle(3.2, 0xfef08a, 1);
        inner.setStrokeStyle(2, 0xffffff, 0.85);
      });
      hitZone.on('pointerout', () => {
        pad.setStrokeStyle(2, accent, 0.72);
        inner.setStrokeStyle(1.5, 0xfef3c7, 0.45);
      });
      return;
    }

    // v298: 移除備援建築黑橢圓陰影
    const useStandalone = b.imgKey && this.textures.exists(b.imgKey);
    const spr = useStandalone
      ? this.add.image(b.x, b.y, b.imgKey).setOrigin(0.5, 0.72).setScale(b.scale || 0.95).setDepth(b.y)
      : this.add.image(b.x, b.y, atlasKey, b.frame).setScale(b.scale || 0.92).setDepth(b.y);
    if (b.flipX) spr.setFlipX(true);
    if (b.radius > 0) {
      this.obstacles.push({ x: b.x, y: b.y + 24, radius: b.radius });
    }
    if (b.name && b.action) {
      this.addNameplate(b.x, b.y - 128, b.name, '#fde68a', true);
    } else if (b.name && b.frame && b.frame.includes('tavern')) {
      this.addNameplate(b.x, b.y - 128, `🍺 ${b.name}`, '#fcd34d', true);
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
      this.addNameplate(b.x, b.y - 138, `🔭 ${b.name}`, '#a5f3fc', true);
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
    let x = Number.isFinite(nx) ? nx : (this.townData?.spawn?.x || 2048);
    let y = Number.isFinite(ny) ? ny : (this.townData?.spawn?.y || 1440);
    // v312: 避開新版 2.5D 建築矩形碰撞盒，優先將 NPC 推往建築前方門口安全處
    for (const r of this.rectObstacles || []) {
      const pad = 26;
      if (x >= r.x1 - pad && x <= r.x2 + pad && y >= r.y1 - 12 && y <= r.y2 + pad) {
        y = r.y2 + pad + 6;
      }
    }
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
    // v273: 強制 NPC 間保持 150px 最小安全間距，防止任何重疊
    if (!this._placedNpcPos) this._placedNpcPos = [];
    for (let pass = 0; pass < 3; pass++) {
      for (const prev of this._placedNpcPos) {
        const dx = x - prev.x;
        const dy = y - prev.y;
        const d = Math.hypot(dx, dy);
        if (d < 150) {
          const ang = d > 1 ? Math.atan2(dy, dx) : (pass * 2.1 + 0.5);
          x = prev.x + Math.cos(ang) * 155;
          y = prev.y + Math.sin(ang) * 155;
        }
      }
    }
    this._placedNpcPos.push({ x, y });
    return { x, y };
  }

  placeNpc(atlasKey, npc, facilityName, action, actionLabel, parentObj) {
    let rawX = npc.x;
    let rawY = npc.y;
    if (parentObj && Number.isFinite(parentObj.x) && Number.isFinite(parentObj.y)) {
      const needAnchor = !Number.isFinite(rawX) || !Number.isFinite(rawY) || Math.hypot(rawX - parentObj.x, rawY - parentObj.y) > 260;
      if (needAnchor) {
        rawX = parentObj.x + (parentObj.doorOffset?.x ?? 0);
        rawY = parentObj.y + (parentObj.doorOffset?.y ?? 92);
      }
    }
    const safePos = this.resolveSafeNpcPos(rawX, rawY);
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
    const fullNpcLabel = `${npc.title}・${npc.name}`;
    const plate = this.addNameplate(npc.x, npc.y - 114, fullNpcLabel, '#7dd3fc', false);
    const iconStr = this.getActionIcon(action);
    const iconBaseY = npc.y - (fullNpcLabel.includes('・') ? 172 : 148);
    const icon = this.add.text(npc.x, iconBaseY, iconStr, {
      fontSize: '22px',
    }).setOrigin(0.5, 1).setDepth(4550);
    this.tweens.add({
      targets: icon,
      y: iconBaseY - 8,
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
      this.livingNpcs?.registerNpc(spr, {
        name: npc.name,
        workStyle: npc.workStyle || 'idle',
        greeting: npc.greeting,
        shadow: sh,
        plate,
        icon,
        interactObj,
      });
    }
  }

  addNameplate(x, y, label, color = '#f8fafc', isBuilding = false) {
    const clean = label.includes('・') ? label.replace('・', '\n') : label;
    return this.add.text(x, y, clean, {
      fontFamily: 'Noto Sans TC, sans-serif',
      fontSize: isBuilding ? '22px' : '19px',
      fontStyle: 'bold',
      align: 'center',
      color,
      stroke: '#000000',
      strokeThickness: isBuilding ? 5 : 4.5,
      shadow: { offsetX: 0, offsetY: 2, color: '#000000', blur: isBuilding ? 5 : 4, fill: true },
    }).setOrigin(0.5, 1).setDepth(isBuilding ? 4520 : 4500);
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
      warrior: { prefix: 'w', tex: 'wf', walkFps: 11, atkFps: 14 },
      ranger:  { prefix: 'r', tex: 'rf', walkFps: 12, atkFps: 15 },
      mage:    { prefix: 'm', tex: 'mf', walkFps: 11, atkFps: 14 },
      paladin: { prefix: 'p', tex: 'pf', walkFps: 11, atkFps: 14 },
      necro:   { prefix: 'n', tex: 'nf', walkFps: 11, atkFps: 14 },
      assassin:{ prefix: 'a', tex: 'af', walkFps: 13, atkFps: 16 },
    };
    const def = map[cid];
    const hInfo = getHeroAtlasInfo(cid);
    const atlasKey = hInfo.baseKey;
    if (!def || !this.textures.exists(atlasKey)) return;
    const tex = this.textures.get(atlasKey);
    const ensureAnim = (animKey, frames, frameRate, repeat) => {
      if (this.anims.exists(animKey)) {
        const cur = this.anims.get(animKey);
        const curTex = cur?.frames?.[0]?.textureKey;
        if (curTex === atlasKey) return;
        this.anims.remove(animKey);
      }
      this.anims.create({ key: animKey, frames, frameRate, repeat });
    };
    ['down', 'up', 'right'].forEach((d) => {
      if (tex.has(`${def.tex}_${d}_walk_7`)) {
        ensureAnim(
          `${def.prefix}_${d}_walk`,
          [0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({ key: atlasKey, frame: `${def.tex}_${d}_walk_${i}` })),
          def.walkFps,
          -1,
        );
      }
      if (tex.has(`${def.tex}_${d}_idle_0`)) {
        ensureAnim(
          `${def.prefix}_${d}_idle`,
          [0, 1, 2, 3].map((i) => ({ key: atlasKey, frame: `${def.tex}_${d}_idle_${i}` })),
          5,
          -1,
        );
      }
      const atkName = tex.has(`${def.tex}_${d}_atk1_0`) ? 'atk1' : (tex.has(`${def.tex}_${d}_atk_0`) ? 'atk' : null);
      if (atkName) {
        ensureAnim(
          `${def.prefix}_${d}_atk`,
          [0, 1, 2, 3].map((i) => ({ key: atlasKey, frame: `${def.tex}_${d}_${atkName}_${i}` })),
          def.atkFps,
          0,
        );
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
    const cid = (this.callbacks?.getState?.()?.classId || window.__IDLE_ARPG_BRIDGE__?.getState?.()?.classId || 'warrior');
    const hInfo = getHeroAtlasInfo(cid);
    const atlasKey = hInfo.baseKey;
    const fp = this.getHeroFramePrefix(cid);
    const prefix = this.getHeroPrefix(cid);
    this.registerHeroAnims(cid);
    const dir = this.heroDir === 'left' ? 'right' : (this.heroDir || 'down');
    if (this.hero.texture.key !== atlasKey) {
      const targetFrame = `${fp}_${dir}_idle_0`;
      if (isAtlasTextureReady(this, atlasKey, targetFrame)) {
        this.hero.setTexture(atlasKey, targetFrame).setAlpha(1);
        if (this.anims.exists(`${prefix}_${dir}_idle`)) this.hero.play(`${prefix}_${dir}_idle`, true);
      } else if (this.load) {
        const applyTex = () => {
          this.registerHeroAnims(cid);
          if (this.hero?.active && isAtlasTextureReady(this, atlasKey, targetFrame)) {
            this.hero.setTexture(atlasKey, targetFrame).setAlpha(1);
            if (this.anims.exists(`${prefix}_${dir}_idle`)) this.hero.play(`${prefix}_${dir}_idle`, true);
          }
        };
        if (safeQueueAtlas(this, atlasKey, hInfo.basePng, hInfo.baseJson)) {
          this.load.once('complete', () => waitAtlasReady(this, atlasKey, applyTex));
          this.load.start();
        } else {
          waitAtlasReady(this, atlasKey, applyTex);
        }
      }
    }
  }

  navigateToWorldPoint(wx, wy) {
    if (!this.hero || !this.townData) return;
    let clickedObj = null;
    let bestDist = 140;
    for (const obj of this.interactables || []) {
      const d = Phaser.Math.Distance.Between(wx, wy, obj.x, obj.y);
      if (d < bestDist) { bestDist = d; clickedObj = obj; }
    }
    const dest = clickedObj
      ? { x: clickedObj.x, y: clickedObj.y + 38 }
      : this._clampToWalkable(wx, wy, 20);
    this.moveTarget = { x: dest.x, y: dest.y, triggerObj: clickedObj };
    const ring = this.add.image(dest.x, dest.y, 'fx_glow')
      .setTint(clickedObj ? 0xfacc15 : 0x38bdf8)
      .setScale(0.45).setAlpha(0.85).setDepth(4200);
    this.tweens.add({ targets: ring, scale: 0.95, alpha: 0, duration: 400, onComplete: () => ring.destroy() });
  }

  _pointInZone(px, py, z) {
    if (!z) return false;
    if (!z.type || z.type === 'rect') {
      return px >= z.x1 && px <= z.x2 && py >= z.y1 && py <= z.y2;
    }
    if (z.type === 'ellipse') {
      const dx = (px - z.cx) / (z.rx || 1);
      const dy = (py - z.cy) / (z.ry || 1);
      return dx * dx + dy * dy <= 1;
    }
    if (z.type === 'capsule') {
      const vx = z.x2 - z.x1;
      const vy = z.y2 - z.y1;
      const len2 = vx * vx + vy * vy || 1;
      const t = Phaser.Math.Clamp(((px - z.x1) * vx + (py - z.y1) * vy) / len2, 0, 1);
      const cx = z.x1 + t * vx;
      const cy = z.y1 + t * vy;
      return Math.hypot(px - cx, py - cy) <= (z.r || 100);
    }
    if (z.type === 'donut') {
      const dOut = Math.pow((px - z.cx) / (z.rxOut || 1), 2) + Math.pow((py - z.cy) / (z.ryOut || 1), 2);
      const dIn = Math.pow((px - z.cx) / (z.rxIn || 1), 2) + Math.pow((py - z.cy) / (z.ryIn || 1), 2);
      return dOut <= 1 && dIn >= 1;
    }
    if (z.type === 'poly' && Array.isArray(z.pts)) {
      let inside = false;
      const pts = z.pts;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const xi = pts[i][0], yi = pts[i][1];
        const xj = pts[j][0], yj = pts[j][1];
        const intersect = ((yi > py) !== (yj > py)) && (px < ((xj - xi) * (py - yi)) / ((yj - yi) || 1e-6) + xi);
        if (intersect) inside = !inside;
      }
      return inside;
    }
    return false;
  }

  _closestInZone(px, py, z) {
    if (!z.type || z.type === 'rect') {
      return { x: Phaser.Math.Clamp(px, z.x1, z.x2), y: Phaser.Math.Clamp(py, z.y1, z.y2) };
    }
    if (z.type === 'ellipse') {
      const dx = (px - z.cx) / (z.rx || 1);
      const dy = (py - z.cy) / (z.ry || 1);
      const d = Math.hypot(dx, dy);
      if (d <= 1) return { x: px, y: py };
      return { x: z.cx + (dx / d) * z.rx, y: z.cy + (dy / d) * z.ry };
    }
    if (z.type === 'capsule') {
      const vx = z.x2 - z.x1;
      const vy = z.y2 - z.y1;
      const len2 = vx * vx + vy * vy || 1;
      const t = Phaser.Math.Clamp(((px - z.x1) * vx + (py - z.y1) * vy) / len2, 0, 1);
      const cx = z.x1 + t * vx;
      const cy = z.y1 + t * vy;
      const dist = Math.hypot(px - cx, py - cy);
      const r = z.r || 100;
      if (dist <= r || dist === 0) return { x: px, y: py };
      return { x: cx + ((px - cx) / dist) * r, y: cy + ((py - cy) / dist) * r };
    }
    if (z.type === 'donut') {
      const dxOut = (px - z.cx) / (z.rxOut || 1);
      const dyOut = (py - z.cy) / (z.ryOut || 1);
      const dOut = Math.hypot(dxOut, dyOut);
      if (dOut > 1) return { x: z.cx + (dxOut / dOut) * z.rxOut, y: z.cy + (dyOut / dOut) * z.ryOut };
      const dxIn = (px - z.cx) / (z.rxIn || 1);
      const dyIn = (py - z.cy) / (z.ryIn || 1);
      const dIn = Math.hypot(dxIn, dyIn) || 0.001;
      if (dIn < 1) return { x: z.cx + (dxIn / dIn) * z.rxIn, y: z.cy + (dyIn / dIn) * z.ryIn };
      return { x: px, y: py };
    }
    if (z.type === 'poly' && Array.isArray(z.pts)) {
      if (this._pointInZone(px, py, z)) return { x: px, y: py };
      let bx = px, by = py, bd = Infinity;
      const pts = z.pts;
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length];
        const vx = b[0] - a[0], vy = b[1] - a[1];
        const len2 = vx * vx + vy * vy || 1;
        const t = Phaser.Math.Clamp(((px - a[0]) * vx + (py - a[1]) * vy) / len2, 0, 1);
        const cx = a[0] + t * vx, cy = a[1] + t * vy;
        const d = Math.hypot(px - cx, py - cy);
        if (d < bd) { bd = d; bx = cx; by = cy; }
      }
      return { x: bx, y: by };
    }
    return { x: px, y: py };
  }

  _pointInPoly(x, y, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0], yi = poly[i][1];
      const xj = poly[j][0], yj = poly[j][1];
      const intersect = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / ((yj - yi) || 1e-9) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  _inAnyTerrainZone(x, y, list) {
    if (!list || list.length === 0) return false;
    return list.some((z) => (z.poly ? this._pointInPoly(x, y, z.poly) : this._pointInZone(x, y, z)));
  }

  _isWalkable(x, y, footOff = 20) {
    const td = this.townData;
    const fy = y + footOff;
    const zones = td?.walkableZones;
    if (zones && zones.length > 0 && !this._inAnyTerrainZone(x, fy, zones)) {
      return false;
    }
    // v303: 河流／岩漿／深淵／城牆等地形禁區阻擋（橋樑白名單 bridgeZones 放行）
    const blocked = td?.blockedZones;
    if (blocked && blocked.length > 0 && this._inAnyTerrainZone(x, fy, blocked)) {
      const bridges = td?.bridgeZones;
      if (!this._inAnyTerrainZone(x, fy, bridges)) return false;
    }
    return true;
  }

  _isBlockedByObstacle(x, y, pad = 22) {
    for (const rb of this.rectObstacles || []) {
      if (x > rb.x1 - pad && x < rb.x2 + pad && y > rb.y1 - pad && y < rb.y2 + pad) {
        return true;
      }
    }
    for (const ob of this.obstacles || []) {
      const d = Math.hypot(x - ob.x, y - ob.y);
      if (d < (ob.radius || 24) + pad) return true;
    }
    return false;
  }

  _pushOutOfObstacles(x, y, pad = 22) {
    let cx = x, cy = y, pushed = false;
    for (let pass = 0; pass < 3; pass++) {
      let moved = false;
      for (const rb of this.rectObstacles || []) {
        const rx1 = rb.x1 - pad, ry1 = rb.y1 - pad, rx2 = rb.x2 + pad, ry2 = rb.y2 + pad;
        if (cx > rx1 && cx < rx2 && cy > ry1 && cy < ry2) {
          const dl = cx - rx1, dr = rx2 - cx;
          const dt = cy - ry1, db = ry2 - cy;
          const m = Math.min(dl, dr, dt, db);
          if (m === db) cy = ry2;
          else if (m === dt) cy = ry1;
          else if (m === dl) cx = rx1;
          else cx = rx2;
          moved = true;
          pushed = true;
        }
      }
      for (const ob of this.obstacles || []) {
        const dx = cx - ob.x;
        const dy = cy - ob.y;
        const d = Math.hypot(dx, dy);
        const minD = (ob.radius || 24) + pad;
        if (d < minD) {
          if (d > 0.001) {
            cx = ob.x + (dx / d) * minD;
            cy = ob.y + (dy / d) * minD;
          } else {
            cy = ob.y + minD;
          }
          moved = true;
          pushed = true;
        }
      }
      if (!moved) break;
    }
    return { x: cx, y: cy, pushed };
  }

  _clampToWalkable(x, y, footOff = 20) {
    let rx = x, ry = y, clamped = false;
    if (!this._isWalkable(rx, ry, footOff)) {
      // 沿著英雄目前站位往點擊點做二分逼近，精準停在河岸／橋邊／牆邊不穿水
      const hx = this.hero?.x ?? this.townData?.spawn?.x ?? rx;
      const hy = this.hero?.y ?? this.townData?.spawn?.y ?? ry;
      let lo = 0, hi = 1;
      for (let step = 0; step < 10; step++) {
        const mid = (lo + hi) * 0.5;
        const tx = hx + (rx - hx) * mid;
        const ty = hy + (ry - hy) * mid;
        if (this._isWalkable(tx, ty, footOff)) lo = mid;
        else hi = mid;
      }
      rx = hx + (rx - hx) * lo;
      ry = hy + (ry - hy) * lo;
      clamped = true;
    }
    const out = this._pushOutOfObstacles(rx, ry, 22);
    return { x: out.x, y: out.y, clamped: clamped || out.pushed };
  }

  update(time, delta) {
    if (!this.hero) return;
    const dt = Math.min(0.05, delta / 1000);
    this.cameraZoom?.update(delta);
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
    const moveSpeed = 320;

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

    const prevX = this.hero.x;
    const prevY = this.hero.y;
    let nx = Phaser.Math.Clamp(prevX + vx * dt, 140, td.mapWidth - 140);
    let ny = Phaser.Math.Clamp(prevY + vy * dt, 180, td.mapHeight - 140);
    const canStand = (tx, ty) => {
      const walkOk = !(td.walkableZones && td.walkableZones.length > 0) || this._isWalkable(tx, ty, 20);
      return walkOk && !this._isBlockedByObstacle(tx, ty, 22);
    };
    if (!canStand(nx, ny)) {
      if (canStand(nx, prevY)) {
        ny = prevY;
      } else if (canStand(prevX, ny)) {
        nx = prevX;
      } else {
        nx = prevX;
        ny = prevY;
        if (this.moveTarget && Math.hypot(vx, vy) > 10) {
          this.moveTarget = null;
        }
      }
    }
    const safePos = this._pushOutOfObstacles(nx, ny, 22);
    this.hero.x = Phaser.Math.Clamp(safePos.x, 140, td.mapWidth - 140);
    this.hero.y = Phaser.Math.Clamp(safePos.y, 180, td.mapHeight - 140);

    this.hero.setDepth(this.hero.y);
    if (this.heroShadow) {
      this.heroShadow.setPosition(this.hero.x, this.hero.y + 30);
    }
    if (this.heroNameText) {
      this.heroNameText.setPosition(this.hero.x, this.hero.y - 54);
      const curNick = (this.callbacks?.getState?.()?.nickname || window.__IDLE_ARPG_BRIDGE__?.getState?.()?.nickname || '冒險者').trim();
      if (this.heroNameText.text !== curNick) this.heroNameText.setText(curNick);
    }

    this.updateHeroAnim(vx, vy, time);
    if (this.petBuddy && this.hero) {
      const st = this.callbacks?.getState?.();
      const pet = getPetDef(st?.equippedPetId);
      if (pet) {
        const rec = (st?.pets || []).find((x) => x.petId === pet.id);
        const upg = rec?.upgradeLevel || 0;
        const rar = getPetRarityMeta(pet.rarity);
        const ptk = `pet_${pet.id}`;
        if (this.textures.exists(ptk) && this.petBuddy.texture?.key !== ptk) this.petBuddy.setTexture(ptk);

        if (this._lastTownPetId && this._lastTownPetId !== pet.id) {
          const burst = this.add.image(this.petBuddy.x, this.petBuddy.y, 'fx_glow').setTint(pet.tint).setScale(0.4).setAlpha(0.9).setBlendMode(Phaser.BlendModes.ADD).setDepth(this.petBuddy.y + 5);
          this.tweens.add({ targets: burst, scale: 2.2, alpha: 0, duration: 420, onComplete: () => burst.destroy() });
        }
        this._lastTownPetId = pet.id;

        const tx = this.hero.x + (this.heroFlipX ? 54 : -54);
        const ty = this.hero.y - 16;
        const nx = Phaser.Math.Linear(this.petBuddy.x, tx, 0.11);
        const ny = Phaser.Math.Linear(this.petBuddy.y, ty, 0.11);
        const stepX = nx - this.petBuddy.x;
        const moveSpd = Math.hypot(stepX, ny - this.petBuddy.y);
        const moving = moveSpd > 0.45;
        const bob = moving ? Math.abs(Math.sin(time * 0.016)) * 10 : Math.sin(time * 0.005) * 5;
        const sxScale = moving ? 0.46 * (1.06 - Math.abs(Math.sin(time * 0.016)) * 0.1) : 0.46 * (1 + Math.sin(time * 0.005) * 0.04);
        const syScale = moving ? 0.46 * (0.94 + Math.abs(Math.sin(time * 0.016)) * 0.12) : 0.46 * (1 - Math.sin(time * 0.005) * 0.04);
        const flip = Math.abs(stepX) > 0.35 ? (stepX < 0) : this.heroFlipX;
        const tilt = moving ? Phaser.Math.Clamp(stepX * 0.04, -0.22, 0.22) : Math.sin(time * 0.003) * 0.04;

        this.petBuddy.setVisible(true).setScale(sxScale, syScale).setFlipX(flip).setRotation(tilt).setPosition(nx, ny - bob).setDepth(ny + 2);
        this.petShadow?.setVisible(true).setPosition(nx, ny + 28).setScale(0.62 - bob * 0.012, 0.24).setDepth(2);
        this.petAura?.setVisible(true).setTint(pet.tint).setPosition(nx, ny - bob + 4).setScale(0.88 + Math.sin(time * 0.008) * 0.14).setAlpha(moving ? 0.42 : 0.26).setDepth(ny + 1);
        this.petLabel?.setVisible(true).setText(`${pet.name}${upg > 0 ? ` +${upg}` : ''}`).setColor(rar.color).setPosition(nx, ny - bob - 32).setDepth(ny + 4);

        if (moving && time >= (this._petTrailAt || 0)) {
          this._petTrailAt = time + 95;
          const pt = this.add.image(nx, ny - bob + 6, 'fx_glow').setTint(pet.tint).setScale(0.28).setAlpha(0.65).setBlendMode(Phaser.BlendModes.ADD).setDepth(ny);
          this.tweens.add({ targets: pt, y: pt.y - 12, scale: 0.05, alpha: 0, duration: 360, onComplete: () => pt.destroy() });
        }
      } else {
        this.petBuddy.setVisible(false);
        this.petAura?.setVisible(false);
        this.petShadow?.setVisible(false);
        this.petLabel?.setVisible(false);
        this._lastTownPetId = null;
      }
    }
    this.updatePatrols(dt, time);
    this.livingNpcs?.update(time, delta);
    this.mpSync?.update(time, delta);
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
    const cid = (this.callbacks?.getState?.()?.classId || window.__IDLE_ARPG_BRIDGE__?.getState?.()?.classId || 'warrior');
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
    if (td.walkableZones && td.walkableZones.length > 0 && !this._isWalkable(x, y, 20)) {
      hitWall = true;
      const res = this._clampToWalkable(x, y, 20);
      x = res.x;
      y = res.y;
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
    if (obj?.action && String(obj.action).startsWith('gimmick_')) {
      this.livingNpcs?.triggerTownBlessingWave(obj.x || this.hero?.x || 2048, obj.y || this.hero?.y || 1280, this.townData?.ambientColor || 0xfde047);
      this.mpSync?.cheerAllNearby();
    }
    if (obj.action === 'hit_dummy') {
      if (this.callbacks?.onEnterTrainingArena) {
        this.callbacks.onEnterTrainingArena();
        return;
      }
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
