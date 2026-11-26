// v274: 公測專用多人共享主城即時同步引擎（TownMultiplayerSync）
// 移除所有假 AI 冒險者，純粹同步 Firebase 真實線上玩家；同屏角色縮放統一為 0.42，附可折疊主城表情喊話條
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

export class TownMultiplayerSync {
  constructor(scene, townData) {
    this.scene = scene;
    this.townData = townData;
    this.remoteActors = new Map();
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
    this._loadingAtlases = false;
  }

  _ensureClassAtlas(cid, onReady) {
    const s = this.scene;
    const key = `atlas_${cid}`;
    if (s.textures.exists(key)) {
      s.registerHeroAnims?.(cid);
      onReady?.();
      return;
    }
    const startLoad = () => {
      if (this._destroyed) return;
      if (s.textures.exists(key)) {
        s.registerHeroAnims?.(cid);
        onReady?.();
        return;
      }
      s.load.atlas(key, `./assets/heroes/${key}.png?v=66`, `./assets/heroes/${key}.json?v=66`);
      s.load.once('complete', () => {
        if (this._destroyed) return;
        s.registerHeroAnims?.(cid);
        onReady?.();
      });
      s.load.start();
    };
    if (s.load.isLoading()) s.load.once('complete', startLoad);
    else startLoad();
  }

  start() {
    this._mountSocialBar();
    const chIdx = this.townData?.chapterIdx || 0;
    subscribeTownPresence(
      chIdx,
      (players) => {
        if (this._destroyed) return;
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

  _createRemoteActor(info) {
    const s = this.scene;
    const cid = info.classId || 'warrior';
    const atlasKey = `atlas_${cid}`;
    if (!s.textures.exists(atlasKey)) {
      this._ensureClassAtlas(cid, () => {
        if (this._destroyed || this.remoteActors.has(info.uid)) return;
        const a = this._createRemoteActor(info);
        if (a) this.remoteActors.set(info.uid, a);
      });
      return null;
    }
    const meta = CLASS_META[cid] || CLASS_META.warrior;
    const pfx = this._getClassPrefix(cid);
    const cx = info.x || (this.townData.spawn?.x || 2048);
    const cy = info.y || (this.townData.spawn?.y || 1400);

    const shadow = s.add.ellipse(cx, cy + 28, 34, 13, 0x000000, 0.45).setDepth(3);
    const body = s.add.sprite(cx, cy, atlasKey, `${pfx}f_down_walk_0`)
      .setScale(0.42)
      .setDepth(cy)
      .setInteractive({ useHandCursor: true });
    body.on('pointerdown', () => this._openPlayerPopover(info));

    const label = s.add.text(cx, cy - 54, `${meta.badge} ${info.name} Lv.${info.level}`, {
      fontFamily: '"Noto Sans TC", sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#fef08a',
      backgroundColor: 'rgba(15, 20, 30, 0.76)',
      padding: { x: 6, y: 2 },
    }).setOrigin(0.5).setDepth(cy + 120);

    return {
      uid: info.uid,
      info: { ...info },
      body,
      shadow,
      label,
      bubble: null,
      bubbleUntil: 0,
      tx: cx,
      ty: cy,
      _lastBubbleText: '',
    };
  }

  _syncRemotePlayers(players) {
    const activeIds = new Set();
    players.forEach((p) => {
      activeIds.add(p.uid);
      let actor = this.remoteActors.get(p.uid);
      if (!actor) {
        actor = this._createRemoteActor(p);
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
    actor.bubble = s.add.text(actor.body.x, actor.body.y - 78, text, {
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
    this._heroBubble = s.add.text(s.hero.x, s.hero.y - 78, text, {
      fontFamily: '"Noto Sans TC", sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#fef08a',
      backgroundColor: 'rgba(20, 16, 12, 0.90)',
      padding: { x: 9, y: 4 },
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
    // 預留公測全城真人祝福回應事件
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
      this._heroBubble.setPosition(s.hero.x, s.hero.y - 78);
    }
    this._publishNow(false);

    for (const actor of this.remoteActors.values()) {
      const b = actor.body;
      if (!b?.active) continue;
      const dx = actor.tx - b.x;
      const dy = actor.ty - b.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 6) {
        const step = Math.min(dist, 260 * dt);
        b.x += (dx / dist) * step;
        b.y += (dy / dist) * step;
        if (b.setFlipX) b.setFlipX(dx < -4);
        const pfx = this._getClassPrefix(actor.info.classId);
        const animKey = Math.abs(dx) > Math.abs(dy) ? `${pfx}_right_walk` : (dy < 0 ? `${pfx}_up_walk` : `${pfx}_down_walk`);
        if (b.anims && s.anims.exists(animKey) && b.anims.currentAnim?.key !== animKey) {
          b.play(animKey, true);
        }
      } else if (b.anims?.isPlaying) {
        b.anims.stop();
      }
      b.setDepth(b.y);
      actor.shadow.setPosition(b.x, b.y + 28).setDepth(3);
      actor.label.setPosition(b.x, b.y - 54).setDepth(b.y + 120);
      if (actor.bubble?.active) {
        if (time >= actor.bubbleUntil) {
          actor.bubble.destroy();
          actor.bubble = null;
        } else {
          actor.bubble.setPosition(b.x, b.y - 78);
        }
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
        綜合戰力：<b>${(info.power || 0).toLocaleString()}</b>
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
    const wrap = document.createElement('div');
    wrap.id = 'v267-town-social-bar';
    // 預設收合在左上角頭像下方，絕不遮擋左下聊天室與底部技能列
    wrap.style.cssText = 'position:fixed;left:16px;top:116px;z-index:8400;display:flex;flex-direction:column;gap:6px;font-family:"Noto Sans TC",sans-serif;max-width:300px;';
    wrap.innerHTML = `
      <button id="v274-social-toggle" type="button" style="align-self:flex-start;display:flex;align-items:center;gap:6px;padding:5px 10px;border-radius:8px;border:1px solid rgba(184,138,68,0.55);background:rgba(15,13,18,0.84);color:#fde68a;font-size:11.5px;font-weight:700;cursor:pointer;backdrop-filter:blur(6px);">
        <span id="v267-online-badge">🏰 主城在線：1 人</span>
        <span style="color:#94a3b8;font-size:10px;">▾ 表情/喊話</span>
      </button>
      <div id="v274-social-body" style="display:none;flex-direction:column;gap:6px;background:rgba(15,13,18,0.90);border:1px solid rgba(184,138,68,0.55);border-radius:10px;padding:8px 10px;backdrop-filter:blur(6px);">
        <div style="display:flex;flex-wrap:wrap;gap:4px;">
          ${QUICK_EMOTES.map((e) => `<button type="button" data-emote="${e.id}" style="padding:3px 7px;border-radius:5px;border:1px solid rgba(184,138,68,0.4);background:#221c18;color:#f3e8d2;font-size:11px;cursor:pointer;">${e.label}</button>`).join('')}
        </div>
        <div style="display:flex;gap:5px;">
          <input id="v267-town-chat-input" type="text" maxlength="36" placeholder="輸入主城頭頂氣泡喊話..." style="flex:1;padding:4px 8px;border-radius:5px;border:1px solid #475569;background:#0f172a;color:#f8fafc;font-size:12px;outline:none;" />
          <button id="v267-town-chat-send" type="button" style="padding:4px 10px;border-radius:5px;border:1px solid #b88a44;background:#451a03;color:#fde68a;font-size:12px;font-weight:700;cursor:pointer;">發送</button>
        </div>
      </div>
    `;
    document.body.appendChild(wrap);
    const bodyEl = wrap.querySelector('#v274-social-body');
    wrap.querySelector('#v274-social-toggle')?.addEventListener('click', () => {
      bodyEl.style.display = bodyEl.style.display === 'none' ? 'flex' : 'none';
    });
    wrap.querySelectorAll('button[data-emote]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const em = QUICK_EMOTES.find((x) => x.id === btn.dataset.emote);
        if (em) this.showHeroBubble(em.text);
      });
    });
    const sendChat = () => {
      const inp = wrap.querySelector('#v267-town-chat-input');
      const txt = (inp?.value || '').trim();
      if (!txt) return;
      this.showHeroBubble(`💬 ${txt}`);
      inp.value = '';
    };
    wrap.querySelector('#v267-town-chat-send')?.addEventListener('click', sendChat);
    wrap.querySelector('#v267-town-chat-input')?.addEventListener('keydown', (ev) => {
      ev.stopPropagation();
      if (ev.key === 'Enter') sendChat();
    });
    this._updateOnlineBadge();
  }

  _updateOnlineBadge() {
    const el = document.getElementById('v267-online-badge');
    if (!el) return;
    el.textContent = `🏰 主城在線：${this._onlineCount} 人`;
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
  }
}
