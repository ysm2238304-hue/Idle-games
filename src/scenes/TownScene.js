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
      this.load.atlas(heroAtlas, `./assets/heroes/atlas_${cid}.png`, `./assets/heroes/atlas_${cid}.json`);
    }
    if (!this.textures.exists(td.bgKey)) {
      this.load.image(td.bgKey, td.bgUrl);
    }
    if (!this.textures.exists(td.atlasKey)) {
      this.load.atlas(td.atlasKey, td.atlasPng, td.atlasJson);
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
    this.moveTarget = null;
    this.nearestTarget = null;

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
        this.obstacles.push({ x: p.x, y: p.y + 10, radius: p.radius });
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

    // 8. 巡邏衛兵與商販平民
    for (const pt of td.patrols || []) {
      const start = pt.waypoints[0];
      const sh = this.add.image(start.x, start.y + 34, 'fx_glow')
        .setTint(0x000000).setScale(0.95, 0.34).setAlpha(0.45).setDepth(2);
      const spr = this.add.image(start.x, start.y, td.atlasKey, pt.frame)
        .setScale(pt.scale)
        .setDepth(start.y);
      this.patrolActors.push({
        spr,
        shadow: sh,
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
    }
  }

  placeNpc(atlasKey, npc, facilityName, action, actionLabel, parentObj) {
    this.add.image(npc.x, npc.y + 36, 'fx_glow')
      .setTint(0x000000).setScale(0.95, 0.36).setAlpha(0.45).setDepth(2);
    const spr = this.add.image(npc.x, npc.y, atlasKey, npc.frame)
      .setScale(npc.scale || 0.62)
      .setDepth(npc.y);
    this.tweens.add({
      targets: spr,
      scaleY: (npc.scale || 0.62) * 1.03,
      duration: 1300 + Math.random() * 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.addNameplate(npc.x, npc.y - 72, `${npc.title}・${npc.name}`, '#7dd3fc');
    this.interactables.push({
      id: `${action}_${npc.name}`,
      x: npc.x,
      y: npc.y,
      radius: 130,
      title: `${npc.title}・${npc.name}`,
      sub: `[F] ${actionLabel}`,
      action,
      data: { npc, facilityName, parentObj },
    });
  }

  addNameplate(x, y, label, color = '#fde68a') {
    return this.add.text(x, y, label, {
      fontFamily: 'Noto Sans TC, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color,
      backgroundColor: 'rgba(10, 14, 23, 0.76)',
      padding: { x: 7, y: 3 },
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

  syncHeroAppearance() {
    if (!this.hero) return;
    const cid = this.callbacks?.getState?.()?.classId || 'warrior';
    const atlasKey = `atlas_${cid}`;
    const fp = this.getHeroFramePrefix(cid);
    if (this.hero.texture.key !== atlasKey && this.textures.exists(atlasKey)) {
      this.hero.setTexture(atlasKey, `${fp}_${this.heroDir}_walk_0`);
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
    this.updatePatrols(dt);
    this.updateNearestPrompt();

    if (Phaser.Input.Keyboard.JustDown(this.wasd.interact) && this.nearestTarget) {
      this.executeInteraction(this.nearestTarget);
    }

    // 回報小地圖位置
    if (this.callbacks?.onHudUpdate) {
      const ratioX = this.hero.x / td.mapWidth;
      const ratioY = this.hero.y / td.mapHeight;
      this.callbacks.onHudUpdate({
        minimap: {
          zoneName: td.name,
          coords: `${Math.round(this.hero.x)}, ${Math.round(this.hero.y)}`,
          heroX: ratioX,
          heroY: ratioY,
          monsters: this.interactables.map((it) => ({
            x: it.x / td.mapWidth,
            y: it.y / td.mapHeight,
            isBoss: it.id === 'beacon_fire' || it.action === 'modal_portal',
          })),
        },
      });
    }
  }

  updateHeroAnim(vx, vy, time) {
    const cid = this.callbacks?.getState?.()?.classId || 'warrior';
    const prefix = this.getHeroPrefix(cid);
    const spd = Math.hypot(vx, vy);

    if (spd > 14) {
      this.heroIsMoving = true;
      this.heroStopAt = time + 120;
      if (Math.abs(vx) > Math.abs(vy) * 1.1) {
        this.heroDir = vx < 0 ? 'left' : 'right';
      } else {
        this.heroDir = vy < 0 ? 'up' : 'down';
      }
    } else if (spd < 6 && time >= (this.heroStopAt || 0)) {
      this.heroIsMoving = false;
    }

    if (time < this.heroAttackAnimUntil) {
      const atkKey = `${prefix}_${this.heroDir}_atk`;
      if (this.anims.exists(atkKey) && this.hero.anims.currentAnim?.key !== atkKey) {
        this.hero.play(atkKey, true);
      }
      return;
    }

    const walkKey = `${prefix}_${this.heroDir}_walk`;
    if (this.heroIsMoving) {
      if (this.anims.exists(walkKey)) {
        if (this.hero.anims.currentAnim?.key !== walkKey) this.hero.play(walkKey, true);
        else if (this.hero.anims.isPaused) this.hero.anims.resume();
      }
      const bob = Math.sin(time * 0.02) * 0.028;
      this.hero.setScale(0.56 * (1 - bob * 0.5), 0.56 * (1 + bob));
      if (time >= (this.heroStepDustAt || 0)) {
        this.heroStepDustAt = time + 280;
        const d = this.add.image(this.hero.x, this.hero.y + 38, 'fx_glow')
          .setTint(0x94a3b8).setScale(0.22).setAlpha(0.32).setDepth(4);
        this.tweens.add({ targets: d, y: d.y - 8, scale: 0.05, alpha: 0, duration: 280, onComplete: () => d.destroy() });
      }
    } else {
      if (this.anims.exists(walkKey)) {
        if (this.hero.anims.currentAnim?.key !== walkKey) this.hero.play(walkKey, true);
        this.hero.anims.pause();
      }
      const breath = Math.sin(time * 0.004) * 0.014;
      this.hero.setScale(0.56, 0.56 * (1 + breath));
    }
  }

  updatePatrols(dt) {
    for (const p of this.patrolActors) {
      const target = p.waypoints[p.wpIdx];
      const dx = target.x - p.spr.x;
      const dy = target.y - p.spr.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 10) {
        p.wpIdx = (p.wpIdx + 1) % p.waypoints.length;
      } else {
        p.spr.x += (dx / dist) * p.speed * dt;
        p.spr.y += (dy / dist) * p.speed * dt;
        if (Math.abs(dx) > 4) p.spr.setFlipX(dx < 0);
        p.spr.setDepth(p.spr.y);
        p.shadow.setPosition(p.spr.x, p.spr.y + 34);
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
        .setPosition(best.x, best.y - 102)
        .setVisible(true);
    } else {
      this.promptBox.setVisible(false);
    }
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
