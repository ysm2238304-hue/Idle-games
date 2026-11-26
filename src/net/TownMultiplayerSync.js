// v273: 多人共享主城同屏同步引擎（TownMultiplayerSync）
// 批次預載全部六職業英雄圖集（徹底消除色球佔位）＋Firestore 即時同屏＋離線 AI 冒險者＋氣泡聊天／表情
import { publishTownPresence, subscribeTownPresence, getCurrentUser } from '../auth/firebase.js?v=272';

const CLASS_META = {
  warrior:  { badge: '⚔️', label: '狂戰士', color: '#f97316' },
  ranger:   { badge: '🏹', label: '遊俠',   color: '#4ade80' },
  mage:     { badge: '🔮', label: '秘法師', color: '#38bdf8' },
  paladin:  { badge: '🛡️', label: '聖殿騎士', color: '#fde047' },
  necro:    { badge: '💀', label: '死靈法師', color: '#c084fc' },
  assassin: { badge: '🗡️', label: '暗影刺客', color: '#f43f5e' },
};

const QUICK_EMOTES = [
  { id: 'wave',  label: '👋 揮手', text: '👋 各位冒險者安安！' },
  { id: 'salute',label: '🫡 致敬', text: '🫡 向守護者致敬！' },
  { id: 'cheer', label: '🎉 慶祝', text: '🎉 剛出暗金神裝啦！' },
  { id: 'rally', label: '⚔️ 集結', text: '⚔️ 準備出城刷圖！' },
  { id: 'party', label: '🔥 求組', text: '🔥 有人要一起挑戰 Boss 嗎？' },
  { id: 'trade', label: '💰 交易', text: '💰 鐵匠鋪強化一波！' },
];

const AI_ADVENTURER_POOL = [
  { uid: 'ai_1', name: '灰燼騎士・雷恩', classId: 'paladin',  level: 42, power: 18420 },
  { uid: 'ai_2', name: '霜月秘法・莉亞', classId: 'mage',     level: 38, power: 15900 },
  { uid: 'ai_3', name: '暗夜行者・影牙', classId: 'assassin', level: 45, power: 21350 },
  { uid: 'ai_4', name: '血怒戰神・巴爾', classId: 'warrior',  level: 40, power: 17680 },
  { uid: 'ai_5', name: '幽魂行者・維克', classId: 'necro',    level: 36, power: 14210 },
  { uid: 'ai_6', name: '蒼風獵手・艾琳', classId: 'ranger',   level: 41, power: 16890 },
];

const AI_CHAT_LINES = [
  '這座主城的祝福效果超好用！',
  '剛把武器衝上 +12，差點碎掉...',
  '大家準備好挑戰下一章 Boss 了嗎？',
  '這套暗黑 4 紙娃娃裝備看起來真帥。',
  '煉金工坊的藥水記得補滿再出城！',
  '👋 嗨！祝大家今天都掉傳奇裝備！',
];

export class TownMultiplayerSync {
  constructor(scene, townData) {
    this.scene = scene;
    this.townData = townData;
    this.remoteActors = new Map();
    this.aiActors = [];
    this._unsub = null;
    this._lastPubAt = 0;
    this._lastPubX = 0;
    this._lastPubY = 0;
    this._pendingChat = '';
    this._pendingUntil = 0;
    this._onlineCount = 1;
    this._destroyed = false;
    this._heroBubble = null;
    this._heroBubbleTimer = null;
    this._atlasesReady = false;
    this._pendingRemotePlayers = null;
  }

  _ensureAllHeroAtlases(onReady) {
    const s = this.scene;
    const allCids = ['warrior', 'ranger', 'mage', 'paladin', 'necro', 'assassin'];
    const missing = allCids.filter((cid) => !s.textures.exists(`atlas_${cid}`));
    if (missing.length === 0) {
      allCids.forEach((cid) => s.registerHeroAnims?.(cid));
      this._atlasesReady = true;
      onReady?.();
      return;
    }
    const queueAndStart = () => {
      if (this._destroyed) return;
      const stillMissing = allCids.filter((cid) => !s.textures.exists(`atlas_${cid}`));
      if (stillMissing.length === 0) {
        allCids.forEach((cid) => s.registerHeroAnims?.(cid));
        this._atlasesReady = true;
        onReady?.();
        return;
      }
      stillMissing.forEach((cid) => {
        s.load.atlas(`atlas_${cid}`, `./assets/heroes/atlas_${cid}.png?v=66`, `./assets/heroes/atlas_${cid}.json?v=66`);
      });
      s.load.once('complete', () => {
        if (this._destroyed) return;
        allCids.forEach((cid) => s.registerHeroAnims?.(cid));
        this._atlasesReady = true;
        onReady?.();
      });
      s.load.start();
    };
    if (s.load.isLoading()) {
      s.load.once('complete', queueAndStart);
    } else {
      queueAndStart();
    }
  }

  start() {
    this._mountSocialBar();
    this._ensureAllHeroAtlases(() => {
      if (this._destroyed) return;
      this._spawnAiAdventurers(5);
      if (this._pendingRemotePlayers) {
        this._syncRemotePlayers(this._pendingRemotePlayers);
        this._pendingRemotePlayers = null;
      }
    });
    const chIdx = this.townData?.chapterIdx || 0;
    subscribeTownPresence(
      chIdx,
      (players) => {
        if (this._destroyed) return;
        if (!this._atlasesReady) {
          this._pendingRemotePlayers = players;
          return;
        }
        this._syncRemotePlayers(players);
      },
      () => { this._updateOnlineBadge(); }
    ).then((unsub) => {
      if (this._destroyed) { unsub?.(); return; }
      this._unsub = unsub;
    });
  }

  _getClassPrefix(cid) {
    const map = { warrior: 'w', ranger: 'r', mage: 'm', paladin: 'p', necro: 'n', assassin: 'a' };
    return map[cid] || 'w';
  }

  _createPlayerActor(info, isAi = false) {
    const s = this.scene;
    const meta = CLASS_META[info.classId] || CLASS_META.warrior;
    const cx = info.x || (this.townData.spawn?.x || 2048);
    const cy = info.y || (this.townData.spawn?.y || 1400);
    const atlasKey = `atlas_${info.classId}`;
    const pfx = this._getClassPrefix(info.classId);
    if (!s.textures.exists(atlasKey)) return null;

    const shadow = s.add.ellipse(cx, cy + 20, 42, 16, 0x000000, 0.45).setDepth(3);
    const body = s.add.sprite(cx, cy, atlasKey, `${pfx}f_down_walk_0`)
      .setOrigin(0.5, 0.85)
      .setScale(0.76)
      .setDepth(cy)
      .setInteractive({ useHandCursor: true });
    body.on('pointerdown', () => this._openPlayerPopover(info));

    const label = s.add.text(cx, cy - 72, `${meta.badge} ${info.name} Lv.${info.level}`, {
      fontFamily: '"Noto Sans TC", sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: isAi ? '#e2e8f0' : '#fef08a',
      backgroundColor: 'rgba(15, 20, 30, 0.72)',
      padding: { x: 6, y: 2 },
    }).setOrigin(0.5).setDepth(cy + 120);

    return {
      uid: info.uid,
      info: { ...info },
      isAi,
      body,
      shadow,
      label,
      bubble: null,
      bubbleUntil: 0,
      tx: cx,
      ty: cy,
      nextAiMoveAt: (s.time?.now || 0) + 1200 + Math.random() * 2600,
      nextAiChatAt: (s.time?.now || 0) + 4500 + Math.random() * 9000,
    };
  }

  _spawnAiAdventurers(count = 5) {
    const td = this.townData;
    const cx = td.landmark?.x || td.mapWidth / 2;
    const cy = td.landmark?.y || td.mapHeight / 2;
    const shuffled = [...AI_ADVENTURER_POOL].sort(() => Math.random() - 0.5).slice(0, count);
    shuffled.forEach((p, idx) => {
      const ang = (Math.PI * 2 * idx) / count + 0.4;
      const rad = 250 + Math.random() * 180;
      const x = Phaser.Math.Clamp(cx + Math.cos(ang) * rad, 480, td.mapWidth - 480);
      const y = Phaser.Math.Clamp(cy + Math.sin(ang) * rad * 0.72, 480, td.mapHeight - 420);
      const actor = this._createPlayerActor({ ...p, x, y }, true);
      if (actor) this.aiActors.push(actor);
    });
    this._updateOnlineBadge();
  }

  _syncRemotePlayers(players) {
    const activeIds = new Set();
    players.forEach((p) => {
      activeIds.add(p.uid);
      let actor = this.remoteActors.get(p.uid);
      if (!actor) {
        actor = this._createPlayerActor(p, false);
        if (actor) this.remoteActors.set(p.uid, actor);
      } else {
        actor.info = { ...p };
        actor.tx = p.x;
        actor.ty = p.y;
        const txt = p.chat || p.emote;
        if (txt && txt !== actor._lastBubbleText) {
          actor._lastBubbleText = txt;
          this._showActorBubble(actor, txt, 3800);
        }
      }
    });
    for (const [uid, actor] of this.remoteActors.entries()) {
      if (!activeIds.has(uid)) {
        this._destroyActor(actor);
        this.remoteActors.delete(uid);
      }
    }
    this._onlineCount = 1 + this.remoteActors.size;
    this._updateOnlineBadge();
  }

  _showActorBubble(actor, text, durationMs = 3600) {
    const s = this.scene;
    if (actor.bubble?.active) actor.bubble.destroy();
    actor.bubble = s.add.text(actor.body.x, actor.body.y - 98, text, {
      fontFamily: '"Noto Sans TC", sans-serif',
      fontSize: '12px',
      color: '#fef3c7',
      backgroundColor: 'rgba(18, 16, 24, 0.88)',
      padding: { x: 8, y: 4 },
    }).setOrigin(0.5).setDepth(2600);
    actor.bubbleUntil = (s.time?.now || 0) + durationMs;
  }

  showHeroBubble(text, durationMs = 3600) {
    const s = this.scene;
    if (!s.hero) return;
    if (this._heroBubble?.active) this._heroBubble.destroy();
    this._heroBubble = s.add.text(s.hero.x, s.hero.y - 96, text, {
      fontFamily: '"Noto Sans TC", sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#fef08a',
      backgroundColor: 'rgba(20, 16, 12, 0.90)',
      padding: { x: 10, y: 5 },
    }).setOrigin(0.5).setDepth(2700);
    if (this._heroBubbleTimer) this._heroBubbleTimer.remove(false);
    this._heroBubbleTimer = s.time.delayedCall(durationMs, () => {
      if (this._heroBubble?.active) this._heroBubble.destroy();
      this._heroBubble = null;
    });
    this._pendingChat = text;
    this._pendingUntil = (s.time?.now || 0) + durationMs;
    this._publishNow(true);
  }

  cheerAllNearby() {
    const cheers = ['🔥 主城祝福！', '✨ 全員開刷！', '🫡 感謝點燃地標！', '⚔️ 戰力拉滿！'];
    this.aiActors.forEach((a, i) => {
      if (i % 2 === 0) this._showActorBubble(a, cheers[i % cheers.length], 3200);
    });
  }

  _publishNow(force = false) {
    const s = this.scene;
    if (!s.hero || !getCurrentUser?.()?.uid) return;
    const now = s.time?.now || Date.now();
    const moved = Phaser.Math.Distance.Between(s.hero.x, s.hero.y, this._lastPubX, this._lastPubY);
    if (!force && (now - this._lastPubAt < 450 || moved < 24)) return;
    this._lastPubAt = now;
    this._lastPubX = s.hero.x;
    this._lastPubY = s.hero.y;
    const st = s.callbacks?.getState?.() || window.__IDLE_ARPG_BRIDGE__?.getState?.() || {};
    const stats = s.callbacks?.getStats?.() || {};
    publishTownPresence(this.townData?.chapterIdx || 0, {
      name: st.nickname || st.heroName || '無名冒險者',
      classId: st.classId || 'warrior',
      level: st.level || 1,
      x: s.hero.x,
      y: s.hero.y,
      dir: s.heroDir || 'down',
      moving: moved >= 24,
      chat: now < this._pendingUntil ? this._pendingChat : '',
      power: Math.round((stats.atk || 20) * 10 + (stats.maxHp || 100)),
    });
  }

  update(time, delta) {
    if (this._destroyed) return;
    const dt = Math.min(0.05, (delta || 16) / 1000);
    const s = this.scene;

    if (this._heroBubble?.active && s.hero) {
      this._heroBubble.setPosition(s.hero.x, s.hero.y - 96);
    }
    this._publishNow(false);

    for (const actor of this.remoteActors.values()) {
      this._tickActorMovement(actor, dt, time, false);
    }

    const td = this.townData;
    const showAiCount = Math.max(0, 5 - Math.floor(this.remoteActors.size / 2));
    this.aiActors.forEach((actor, idx) => {
      const visible = idx < showAiCount;
      actor.body.setVisible(visible);
      actor.shadow.setVisible(visible);
      actor.label.setVisible(visible);
      if (!visible) {
        if (actor.bubble?.active) actor.bubble.setVisible(false);
        return;
      }
      if (time >= actor.nextAiMoveAt) {
        actor.nextAiMoveAt = time + 3400 + Math.random() * 4800;
        const spots = [
          { x: td.landmark?.x || td.mapWidth / 2, y: (td.landmark?.y || td.mapHeight / 2) + 230 },
          ...(td.facilities || []).map((f) => ({ x: f.npc?.x || f.x, y: (f.npc?.y || f.y) + 88 })),
        ];
        const pick = spots[Math.floor(Math.random() * spots.length)];
        actor.tx = Phaser.Math.Clamp(pick.x + (Math.random() - 0.5) * 140, 460, td.mapWidth - 460);
        actor.ty = Phaser.Math.Clamp(pick.y + (Math.random() - 0.5) * 90, 460, td.mapHeight - 380);
      }
      if (time >= actor.nextAiChatAt) {
        actor.nextAiChatAt = time + 12000 + Math.random() * 14000;
        const line = AI_CHAT_LINES[Math.floor(Math.random() * AI_CHAT_LINES.length)];
        this._showActorBubble(actor, line, 3600);
      }
      this._tickActorMovement(actor, dt, time, true);
    });
  }

  _tickActorMovement(actor, dt, time, isAi) {
    const b = actor.body;
    if (!b?.active) return;
    const dx = actor.tx - b.x;
    const dy = actor.ty - b.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 6) {
      const spd = isAi ? 124 : 260;
      const step = Math.min(dist, spd * dt);
      b.x += (dx / dist) * step;
      b.y += (dy / dist) * step;
      if (b.setFlipX) b.setFlipX(dx < -4);
      const pfx = this._getClassPrefix(actor.info.classId);
      const animKey = Math.abs(dx) > Math.abs(dy) ? `${pfx}_right_walk` : (dy < 0 ? `${pfx}_up_walk` : `${pfx}_down_walk`);
      if (b.anims && this.scene.anims.exists(animKey) && b.anims.currentAnim?.key !== animKey) {
        b.play(animKey, true);
      }
    } else if (b.anims?.isPlaying) {
      b.anims.stop();
    }
    b.setDepth(b.y);
    actor.shadow.setPosition(b.x, b.y + 6).setDepth(3);
    actor.label.setPosition(b.x, b.y - 72).setDepth(b.y + 120);
    if (actor.bubble?.active) {
      if (time >= actor.bubbleUntil) {
        actor.bubble.destroy();
        actor.bubble = null;
      } else {
        actor.bubble.setPosition(b.x, b.y - 98);
      }
    }
  }

  _openPlayerPopover(info) {
    const old = document.getElementById('v267-player-popover');
    if (old) old.remove();
    const meta = CLASS_META[info.classId] || CLASS_META.warrior;
    const el = document.createElement('div');
    el.id = 'v267-player-popover';
    el.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:9600;min-width:260px;background:linear-gradient(180deg,#1a171c,#0e0c10);border:1.5px solid #b88a44;border-radius:10px;padding:14px 16px;color:#f3e8d2;box-shadow:0 14px 40px rgba(0,0,0,0.8);font-family:"Noto Sans TC",sans-serif;';
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <div style="font-size:15px;font-weight:800;color:${meta.color};">${meta.badge} ${info.name}</div>
        <button id="v267-pop-close" style="background:none;border:none;color:#9ca3af;font-size:16px;cursor:pointer;">✕</button>
      </div>
      <div style="font-size:12px;color:#cbd5e1;margin-bottom:10px;line-height:1.6;">
        職業：<b>${meta.label}</b>　｜　等級：<b>Lv.${info.level || 1}</b><br/>
        綜合戰力：<b>${(info.power || 12500).toLocaleString()}</b>
      </div>
      <div style="display:flex;gap:8px;">
        <button id="v267-pop-wave" style="flex:1;padding:6px 8px;border-radius:6px;border:1px solid #854d0e;background:#292018;color:#fde68a;cursor:pointer;font-size:12px;">👋 揮手致意</button>
        <button id="v267-pop-party" style="flex:1;padding:6px 8px;border-radius:6px;border:1px solid #1d4ed8;background:#172554;color:#bfdbfe;cursor:pointer;font-size:12px;">⚔️ 邀請集結</button>
      </div>
    `;
    document.body.appendChild(el);
    el.querySelector('#v267-pop-close')?.addEventListener('click', () => el.remove());
    el.querySelector('#v267-pop-wave')?.addEventListener('click', () => {
      this.showHeroBubble(`👋 向 ${info.name} 揮手致意！`);
      el.remove();
    });
    el.querySelector('#v267-pop-party')?.addEventListener('click', () => {
      this.showHeroBubble(`⚔️ 邀請 ${info.name} 一起出城刷圖！`);
      el.remove();
    });
  }

  _mountSocialBar() {
    this._unmountSocialBar();
    const bar = document.createElement('div');
    bar.id = 'v267-town-social-bar';
    bar.style.cssText = 'position:fixed;left:16px;bottom:86px;z-index:8400;display:flex;flex-direction:column;gap:6px;background:rgba(15,13,18,0.84);border:1px solid rgba(184,138,68,0.55);border-radius:10px;padding:8px 10px;backdrop-filter:blur(6px);font-family:"Noto Sans TC",sans-serif;max-width:340px;';
    bar.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
        <span id="v267-online-badge" style="font-size:11px;color:#fde68a;font-weight:700;">🏰 主城同屏：1 位冒險者</span>
        <span style="font-size:10px;color:#94a3b8;">點擊他人可互動</span>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:4px;">
        ${QUICK_EMOTES.map((e) => `<button type="button" data-emote="${e.id}" style="padding:3px 7px;border-radius:5px;border:1px solid rgba(184,138,68,0.4);background:#221c18;color:#f3e8d2;font-size:11px;cursor:pointer;">${e.label}</button>`).join('')}
      </div>
      <div style="display:flex;gap:5px;">
        <input id="v267-town-chat-input" type="text" maxlength="36" placeholder="輸入主城氣泡喊話..." style="flex:1;padding:4px 8px;border-radius:5px;border:1px solid #475569;background:#0f172a;color:#f8fafc;font-size:12px;outline:none;" />
        <button id="v267-town-chat-send" type="button" style="padding:4px 10px;border-radius:5px;border:1px solid #b88a44;background:#451a03;color:#fde68a;font-size:12px;font-weight:700;cursor:pointer;">發送</button>
      </div>
    `;
    document.body.appendChild(bar);
    bar.querySelectorAll('button[data-emote]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const em = QUICK_EMOTES.find((x) => x.id === btn.dataset.emote);
        if (em) this.showHeroBubble(em.text);
      });
    });
    const sendChat = () => {
      const inp = bar.querySelector('#v267-town-chat-input');
      const txt = (inp?.value || '').trim();
      if (!txt) return;
      this.showHeroBubble(`💬 ${txt}`);
      inp.value = '';
    };
    bar.querySelector('#v267-town-chat-send')?.addEventListener('click', sendChat);
    bar.querySelector('#v267-town-chat-input')?.addEventListener('keydown', (ev) => {
      ev.stopPropagation();
      if (ev.key === 'Enter') sendChat();
    });
    this._updateOnlineBadge();
  }

  _updateOnlineBadge() {
    const el = document.getElementById('v267-online-badge');
    if (!el) return;
    const real = this._onlineCount;
    const total = real + Math.max(0, 5 - Math.floor(this.remoteActors.size / 2));
    el.textContent = `🏰 主城同屏：${total} 位冒險者（線上 ${real}）`;
  }

  _unmountSocialBar() {
    document.getElementById('v267-town-social-bar')?.remove();
    document.getElementById('v267-player-popover')?.remove();
  }

  _destroyActor(actor) {
    actor.body?.destroy();
    actor.shadow?.destroy();
    actor.label?.destroy();
    actor.bubble?.destroy();
  }

  destroy() {
    this._destroyed = true;
    this._unsub?.();
    this._unsub = null;
    this._unmountSocialBar();
    if (this._heroBubble?.active) this._heroBubble.destroy();
    for (const a of this.remoteActors.values()) this._destroyActor(a);
    this.remoteActors.clear();
    this.aiActors.forEach((a) => this._destroyActor(a));
    this.aiActors = [];
  }
}
