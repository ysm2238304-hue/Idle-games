// 全域暗黑 HUD 自由排版（拖曳／個別縮放／開關）與系統設定＋自訂快捷鍵模組 (v89)
const SETTINGS_KEY = 'desk_diablo_settings_v1';

const PANEL_META = {
  'hud-top-left': { label: '角色頭像與關卡進度', origin: 'top left' },
  'hud-top-center': { label: '目標／首領血條', origin: 'top center' },
  'hud-top-right': { label: '功能選單與羅盤小地圖', origin: 'top right' },
  'hud-bottom-left': { label: '暗黑戰鬥／掉落日誌', origin: 'bottom left' },
  'diablo-hud': { label: '底部雙球技能祭壇', origin: 'bottom center' },
};

export const RESERVED_MOVE_KEYS = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD',
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
]);

export const DEFAULT_KEYBINDS = {
  potion: 'KeyH',
  skill0: 'Space',
  skill1: 'KeyE',
  skill2: 'KeyR',
  autoHunt: 'KeyT',
  quickSalvage: 'KeyQ',
  townToggle: 'KeyG',
  worldMap: 'KeyM',
  gear: 'KeyI',
  bag: 'KeyB',
  upgrade: 'KeyU',
  tree: 'KeyK',
  skills: 'KeyN',
  rebirth: 'KeyV',
  switchClass: 'KeyC',
  waypoint: 'KeyY',
  pets: 'KeyP',
  achTower: 'KeyJ',
  shop: 'KeyF',
  powerSave: 'KeyZ',
  bgmToggle: 'KeyX',
  log: 'KeyL',
  settings: 'KeyO',
};

function sanitizeKeybinds(raw) {
  const merged = { ...DEFAULT_KEYBINDS, ...(raw || {}) };
  for (const [k, v] of Object.entries(merged)) {
    if (!v || RESERVED_MOVE_KEYS.has(v)) {
      merged[k] = DEFAULT_KEYBINDS[k];
    }
  }
  return merged;
}

const KEYBIND_META = [
  { id: 'potion', label: '使用生命藥水', group: '戰鬥操作' },
  { id: 'skill0', label: '核心技能槽 1', group: '戰鬥操作' },
  { id: 'skill1', label: '核心技能槽 2', group: '戰鬥操作' },
  { id: 'skill2', label: '核心技能槽 3', group: '戰鬥操作' },
  { id: 'autoHunt', label: '自動狩獵切換', group: '戰鬥操作' },
  { id: 'quickSalvage', label: '一鍵分解裝備', group: '戰鬥操作' },
  { id: 'townToggle', label: '返回主城 / 出城戰鬥', group: '戰鬥操作' },
  { id: 'gear', label: '角色與裝備欄', group: '介面選單' },
  { id: 'bag', label: '物品背包 / 寵物欄', group: '介面選單' },
  { id: 'pets', label: '寵物圖鑑面板', group: '介面選單' },
  { id: 'achTower', label: '成就稱號與無盡爬塔', group: '介面選單' },
  { id: 'shop', label: '暗黑深淵商城', group: '介面選單' },
  { id: 'powerSave', label: '暗黑省電掛機模式', group: '介面選單' },
  { id: 'bgmToggle', label: '主城背景音樂靜音', group: '介面選單' },
  { id: 'upgrade', label: '金幣屬性強化', group: '介面選單' },
  { id: 'tree', label: '深淵技能樹', group: '介面選單' },
  { id: 'skills', label: '職業技能配置', group: '介面選單' },
  { id: 'rebirth', label: '深淵輪迴轉生', group: '介面選單' },
  { id: 'worldMap', label: '世界大地圖選關', group: '介面選單' },
  { id: 'switchClass', label: '切換冒險職業', group: '介面選單' },
  { id: 'waypoint', label: '主城快速傳送陣', group: '介面選單' },
  { id: 'log', label: '完整戰鬥日誌', group: '介面選單' },
  { id: 'settings', label: '開啟系統設定', group: '介面選單' },
];

export function formatKeyCode(code) {
  if (!code) return '-';
  if (code === 'Space') return '空白';
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Numpad')) return 'N' + code.slice(6);
  return code;
}

function createDefaultSettings() {
  const panels = {};
  for (const id of Object.keys(PANEL_META)) {
    panels[id] = { dx: 0, dy: 0, scale: 1, visible: true };
  }
  return {
    ui: { globalScale: 1, editMode: false, panels },
    audio: { master: 0.85, bgm: 0.65, sfx: 0.85, muted: false },
    graphics: { quality: 'high', particles: 'high', damageText: true, screenShake: true },
    gameplay: { showTargetFrame: true, showChatTimestamp: true, autoHuntDefault: true },
    keybinds: { ...DEFAULT_KEYBINDS },
  };
}

export class HudSettingsManager {
  constructor({ townBgm, onApply, onSave, onExportSave, onImportSave } = {}) {
    this.townBgm = townBgm || null;
    this.onApply = onApply || null;
    this.onSave = onSave || null;
    this.onExportSave = onExportSave || null;
    this.onImportSave = onImportSave || null;
    this.settings = this._load();
    this.activeTab = 'ui';
    this._dragState = null;
    this._listeningKeyId = null;
    this._keybindNotice = '';
    this.modal = null;
    this.banner = null;
  }

  _load() {
    const def = createDefaultSettings();
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return def;
      const p = JSON.parse(raw);
      const mergedPanels = { ...def.ui.panels };
      if (p.ui?.panels) {
        for (const id of Object.keys(PANEL_META)) {
          mergedPanels[id] = { ...def.ui.panels[id], ...(p.ui.panels[id] || {}) };
        }
      }
      return {
        ui: { ...def.ui, ...(p.ui || {}), editMode: false, panels: mergedPanels },
        audio: { ...def.audio, ...(p.audio || {}) },
        graphics: { ...def.graphics, ...(p.graphics || {}) },
        gameplay: { ...def.gameplay, ...(p.gameplay || {}) },
        keybinds: sanitizeKeybinds(p.keybinds),
      };
    } catch {
      return def;
    }
  }

  getKeybinds() {
    return this.settings.keybinds || DEFAULT_KEYBINDS;
  }

  isListeningKey() {
    return !!this._listeningKeyId;
  }

  save(skipCloud = false) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    } catch {}
    if (!skipCloud) {
      this.onSave?.(JSON.parse(JSON.stringify(this.settings)));
    }
  }

  importSettings(remote) {
    if (!remote || typeof remote !== 'object') return;
    const def = createDefaultSettings();
    const mergedPanels = { ...def.ui.panels };
    if (remote.ui?.panels) {
      for (const id of Object.keys(PANEL_META)) {
        mergedPanels[id] = { ...def.ui.panels[id], ...(remote.ui.panels[id] || {}) };
      }
    }
    this.settings = {
      ui: { ...def.ui, ...(remote.ui || {}), editMode: false, panels: mergedPanels },
      audio: { ...def.audio, ...(remote.audio || {}) },
      graphics: { ...def.graphics, ...(remote.graphics || {}) },
      gameplay: { ...def.gameplay, ...(remote.gameplay || {}) },
      keybinds: sanitizeKeybinds(remote.keybinds),
    };
    this.applyAll();
    this.save(true);
  }

  init() {
    this.modal = document.getElementById('modal-settings');
    this.banner = document.getElementById('hud-edit-banner');
    this._injectPanelHandles();
    this._bindGlobalEvents();
    this.applyAll();
  }

  _injectPanelHandles() {
    for (const [id, meta] of Object.entries(PANEL_META)) {
      const el = document.getElementById(id);
      if (!el || el.querySelector('.hud-edit-bar')) continue;
      el.dataset.hudPanel = id;
      const bar = document.createElement('div');
      bar.className = 'hud-edit-bar';
      bar.innerHTML = `
        <span class="hud-drag-grip" title="按住拖曳移動位置">✥ ${meta.label}</span>
        <div class="hud-edit-btns">
          <button type="button" class="hud-ed-btn" data-act="minus" title="縮小">−</button>
          <span class="hud-ed-scale">100%</span>
          <button type="button" class="hud-ed-btn" data-act="plus" title="放大">+</button>
          <button type="button" class="hud-ed-btn" data-act="reset" title="重設此框">↺</button>
        </div>
      `;
      el.prepend(bar);

      bar.addEventListener('pointerdown', (e) => {
        if (!this.settings.ui.editMode) return;
        const actBtn = e.target.closest('[data-act]');
        if (actBtn) {
          e.stopPropagation();
          const act = actBtn.dataset.act;
          const p = this.settings.ui.panels[id];
          if (act === 'minus') p.scale = Math.max(0.65, +(p.scale - 0.05).toFixed(2));
          if (act === 'plus') p.scale = Math.min(1.45, +(p.scale + 0.05).toFixed(2));
          if (act === 'reset') { p.dx = 0; p.dy = 0; p.scale = 1; p.visible = true; }
          this.applyAll();
          this.save();
          if (this.modal && !this.modal.classList.contains('hidden')) this.renderModalBody();
          return;
        }
        e.preventDefault();
        const p = this.settings.ui.panels[id];
        this._dragState = { id, startX: e.clientX, startY: e.clientY, origDx: p.dx, origDy: p.dy };
        el.classList.add('hud-dragging');
      });
    }
  }

  _bindGlobalEvents() {
    window.addEventListener('pointermove', (e) => {
      if (!this._dragState) return;
      const { id, startX, startY, origDx, origDy } = this._dragState;
      const p = this.settings.ui.panels[id];
      if (!p) return;
      p.dx = Math.round(origDx + (e.clientX - startX));
      p.dy = Math.round(origDy + (e.clientY - startY));
      this._applyPanelTransform(id);
    });

    window.addEventListener('pointerup', () => {
      if (!this._dragState) return;
      const el = document.getElementById(this._dragState.id);
      if (el) el.classList.remove('hud-dragging');
      this._dragState = null;
      this.save();
    });

    window.addEventListener('keydown', (e) => {
      if (!this._listeningKeyId) return;
      e.preventDefault();
      e.stopPropagation();
      if (e.code === 'Escape') {
        this._listeningKeyId = null;
        this._keybindNotice = '';
        this.renderModalBody();
        return;
      }
      if (RESERVED_MOVE_KEYS.has(e.code)) {
        this._keybindNotice = '⚠️ W / A / S / D 與方向鍵為系統預設移動鍵，不可覆蓋！';
        this._listeningKeyId = null;
        this.renderModalBody();
        return;
      }
      const targetId = this._listeningKeyId;
      const kb = this.settings.keybinds;
      const prevCode = kb[targetId];
      // 衝突自動交換
      for (const [k, v] of Object.entries(kb)) {
        if (k !== targetId && v === e.code) {
          kb[k] = prevCode;
        }
      }
      kb[targetId] = e.code;
      this._listeningKeyId = null;
      this._keybindNotice = '';
      this.applyAll();
      this.save();
      this.renderModalBody();
    }, true);

    document.getElementById('btn-open-settings')?.addEventListener('click', () => this.openModal());
    document.getElementById('btn-close-settings')?.addEventListener('click', () => this.closeModal());
    document.getElementById('btn-finish-hud-edit')?.addEventListener('click', () => this.setEditMode(false));
    document.getElementById('btn-reset-hud-edit')?.addEventListener('click', () => this.resetAllPanels());

    this.modal?.addEventListener('click', (e) => {
      if (e.target === this.modal) this.closeModal();
    });
  }

  setEditMode(on) {
    this.settings.ui.editMode = !!on;
    document.body.classList.toggle('hud-edit-active', !!on);
    if (this.banner) this.banner.classList.toggle('hidden', !on);
    if (on) this.closeModal();
  }

  resetAllPanels() {
    this.settings.ui.globalScale = 1;
    for (const id of Object.keys(PANEL_META)) {
      this.settings.ui.panels[id] = { dx: 0, dy: 0, scale: 1, visible: true };
    }
    this.applyAll();
    this.save();
    if (this.modal && !this.modal.classList.contains('hidden')) this.renderModalBody();
  }

  _applyPanelTransform(id) {
    const el = document.getElementById(id);
    const p = this.settings.ui.panels[id];
    const meta = PANEL_META[id];
    if (!el || !p || !meta) return;
    const totalScale = +(p.scale * (this.settings.ui.globalScale || 1)).toFixed(3);
    const baseTx = id === 'hud-top-center' || id === 'diablo-hud' ? 'translateX(-50%) ' : '';
    el.style.transformOrigin = meta.origin;
    el.style.transform = `${baseTx}translate(${p.dx}px, ${p.dy}px) scale(${totalScale})`;
    el.classList.toggle('hud-panel-hidden', !p.visible && !this.settings.ui.editMode);
    const lbl = el.querySelector('.hud-ed-scale');
    if (lbl) lbl.textContent = `${Math.round(p.scale * 100)}%`;
  }

  syncHotkeyLabels() {
    const kb = this.getKeybinds();
    const fmt = (id) => formatKeyCode(kb[id]);

    // 1. 底部技能熱鍵欄
    const setHotbar = (sel, keyId) => {
      const el = document.querySelector(`${sel} .mmo-hotkey`);
      if (el) el.textContent = fmt(keyId);
    };
    setHotbar('#btn-potion', 'potion');
    setHotbar('#skill-slot-0', 'skill0');
    setHotbar('#skill-slot-1', 'skill1');
    setHotbar('#skill-slot-2', 'skill2');
    setHotbar('#btn-toggle-auto', 'autoHunt');

    const qBtn = document.getElementById('btn-quick-salvage');
    if (qBtn) qBtn.textContent = `🧹 一鍵分解 [${fmt('quickSalvage')}]`;

    const townBtn = document.getElementById('btn-town-toggle');
    if (townBtn) {
      townBtn.textContent = townBtn.textContent.replace(/\([^)]*\)$/, `(${fmt('townToggle')})`);
    }

    // 2. 右上角機能矩陣角標與 data-tip 同步
    const matrixMap = [
      ['[data-drawer="gear"]', 'gear', '角色與裝備'],
      ['[data-drawer="bag"]', 'bag', '物品背包'],
      ['[data-drawer="upgrade"]', 'upgrade', '金幣屬性強化'],
      ['[data-drawer="tree"]', 'tree', '深淵技能樹'],
      ['[data-drawer="skills"]', 'skills', '職業技能配置'],
      ['[data-drawer="rebirth"]', 'rebirth', '深淵輪迴轉生'],
      ['#btn-world-map', 'worldMap', '世界大地圖選關'],
      ['#btn-switch-class', 'switchClass', '切換冒險職業'],
      ['#btn-top-waypoint', 'waypoint', '主城快速傳送陣'],
      ['[data-drawer="pets"]', 'pets', '技能變異寵物'],
      ['[data-drawer="log"]', 'log', '完整戰鬥日誌'],
      ['#btn-open-ach-tower', 'achTower', '成就稱號與無盡爬塔'],
      ['#btn-open-shop', 'shop', '暗黑深淵商城'],
      ['#btn-town-bgm', 'bgmToggle', '開啟 / 靜音主城 BGM'],
      ['#btn-open-settings', 'settings', '系統設定'],
    ];
    for (const [sel, keyId, tipBase] of matrixMap) {
      const btn = document.querySelector(sel);
      if (!btn) continue;
      const k = fmt(keyId);
      const hk = btn.querySelector('.mmo-hk');
      if (hk) hk.textContent = k;
      btn.setAttribute('data-tip', `${tipBase} [${k}]`);
    }

    // 3. 彈窗與大廳按鈕提示同步
    const psBtn = document.getElementById('btn-power-save');
    if (psBtn) {
      const pk = fmt('powerSave');
      psBtn.textContent = `🌙 省電掛機 [${pk}]`;
      psBtn.title = `開啟暗黑掛機省電幕布 [${pk}]`;
    }
    const lobbySet = document.getElementById('btn-lobby-settings');
    if (lobbySet) lobbySet.textContent = `⚙️ 設定(${fmt('settings')})`;
  }

  applyAll() {
    document.documentElement.style.setProperty('--hud-global-scale', String(this.settings.ui.globalScale || 1));
    for (const id of Object.keys(PANEL_META)) {
      this._applyPanelTransform(id);
    }

    const { master, bgm, muted } = this.settings.audio;
    if (this.townBgm) {
      this.townBgm.setVolume(master * bgm, muted);
    }
    const bgVid = document.getElementById('welcome-bg-video');
    if (bgVid) bgVid.volume = muted ? 0 : Math.min(1, master * bgm);

    window.__gameSettings = {
      audio: { ...this.settings.audio },
      graphics: { ...this.settings.graphics },
      gameplay: { ...this.settings.gameplay },
      keybinds: { ...this.getKeybinds() },
    };

    const tf = document.getElementById('hud-top-center');
    if (tf) tf.classList.toggle('setting-hide-target', !this.settings.gameplay.showTargetFrame);

    this.syncHotkeyLabels();
    this.onApply?.(this.settings);
  }

  openModal(tab = null) {
    if (tab) this.activeTab = tab;
    if (!this.modal) return;
    this._listeningKeyId = null;
    this.renderModalBody();
    this.modal.classList.remove('hidden');
  }

  closeModal() {
    this._listeningKeyId = null;
    this.modal?.classList.add('hidden');
  }

  toggleModal() {
    if (!this.modal) return;
    if (this.modal.classList.contains('hidden')) this.openModal();
    else this.closeModal();
  }

  renderModalBody() {
    const body = document.getElementById('settings-modal-body');
    const tabs = this.modal?.querySelectorAll('.settings-tab-btn');
    tabs?.forEach((b) => b.classList.toggle('active', b.dataset.tab === this.activeTab));
    tabs?.forEach((b) => {
      b.onclick = () => {
        this._listeningKeyId = null;
        this.activeTab = b.dataset.tab;
        this.renderModalBody();
      };
    });
    if (!body) return;

    const s = this.settings;
    if (this.activeTab === 'ui') {
      body.innerHTML = `
        <div class="set-section">
          <div class="set-row">
            <div><b>全域介面縮放</b><small>同時縮放所有主遊戲 HUD 框架</small></div>
            <div class="set-ctrl">
              <input type="range" id="set-global-scale" min="75" max="125" step="5" value="${Math.round(s.ui.globalScale * 100)}" />
              <span class="set-val">${Math.round(s.ui.globalScale * 100)}%</span>
            </div>
          </div>
          <div class="set-row">
            <div><b>自由拖曳與單框縮放模式</b><small>解鎖後可直接在畫面上拖曳各框架位置並個別縮放</small></div>
            <div class="set-ctrl">
              <button type="button" id="set-btn-edit-mode" class="btn-gold-sm">✥ 進入自由排版模式</button>
              <button type="button" id="set-btn-reset-ui" class="btn-ghost-sm">↺ 恢復預設</button>
            </div>
          </div>
        </div>
        <div class="set-section">
          <div class="set-sec-title">各介面框架微調（顯示／獨立縮放）</div>
          ${Object.entries(PANEL_META).map(([id, meta]) => {
            const p = s.ui.panels[id];
            return `
              <div class="set-row compact">
                <label class="set-chk"><input type="checkbox" data-panel-vis="${id}" ${p.visible ? 'checked' : ''} /> <span>${meta.label}</span></label>
                <div class="set-ctrl">
                  <input type="range" data-panel-scale="${id}" min="65" max="145" step="5" value="${Math.round(p.scale * 100)}" />
                  <span class="set-val">${Math.round(p.scale * 100)}%</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
      body.querySelector('#set-global-scale')?.addEventListener('input', (e) => {
        s.ui.globalScale = Number(e.target.value) / 100;
        e.target.nextElementSibling.textContent = `${e.target.value}%`;
        this.applyAll();
        this.save();
      });
      body.querySelector('#set-btn-edit-mode')?.addEventListener('click', () => this.setEditMode(true));
      body.querySelector('#set-btn-reset-ui')?.addEventListener('click', () => this.resetAllPanels());
      body.querySelectorAll('[data-panel-vis]').forEach((el) => {
        el.addEventListener('change', (e) => {
          s.ui.panels[e.target.dataset.panelVis].visible = e.target.checked;
          this.applyAll();
          this.save();
        });
      });
      body.querySelectorAll('[data-panel-scale]').forEach((el) => {
        el.addEventListener('input', (e) => {
          const id = e.target.dataset.panelScale;
          s.ui.panels[id].scale = Number(e.target.value) / 100;
          e.target.nextElementSibling.textContent = `${e.target.value}%`;
          this.applyAll();
          this.save();
        });
      });
    } else if (this.activeTab === 'keys') {
      const kb = this.getKeybinds();
      body.innerHTML = `
        <div class="set-section">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;gap:8px;">
            <small style="color:#cbd5e1;">點擊右側按鍵鈕後按下新鍵（Esc 取消，重複自動交換；<b style="color:#fbbf24;">WASD 與方向鍵固定為移動鍵不可覆蓋</b>）</small>
            <button type="button" id="btn-reset-keybinds" class="btn-ghost-sm">↺ 恢復預設按鍵</button>
          </div>
          ${this._keybindNotice ? `<div style="margin-bottom:8px;padding:6px 10px;border-radius:6px;background:rgba(239,68,68,0.16);border:1px solid rgba(248,113,113,0.45);color:#fca5a5;font-size:12px;">${this._keybindNotice}</div>` : ''}
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 14px;">
            ${KEYBIND_META.map((item) => {
              const listening = this._listeningKeyId === item.id;
              return `
                <div class="set-row compact" style="border-bottom:1px solid rgba(255,255,255,0.06);">
                  <span style="font-size:12px;color:#e2d5be;">${item.label}</span>
                  <button type="button" class="${listening ? 'btn-gold-sm' : 'btn-ghost-sm'}" data-rebind="${item.id}" style="min-width:74px;font-weight:700;">
                    ${listening ? '請按鍵...' : formatKeyCode(kb[item.id])}
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
      body.querySelector('#btn-reset-keybinds')?.addEventListener('click', () => {
        this.settings.keybinds = { ...DEFAULT_KEYBINDS };
        this._listeningKeyId = null;
        this._keybindNotice = '';
        this.applyAll();
        this.save();
        this.renderModalBody();
      });
      body.querySelectorAll('[data-rebind]').forEach((btn) => {
        btn.onclick = () => {
          this._listeningKeyId = btn.dataset.rebind;
          this._keybindNotice = '';
          this.renderModalBody();
        };
      });
    } else if (this.activeTab === 'audio') {
      body.innerHTML = `
        <div class="set-section">
          <div class="set-row">
            <div><b>全部靜音</b><small>一鍵關閉主城音樂與所有音效</small></div>
            <label class="set-switch"><input type="checkbox" id="set-audio-mute" ${s.audio.muted ? 'checked' : ''} /> <span>${s.audio.muted ? '🔇 已靜音' : '🔊 開啟'}</span></label>
          </div>
          <div class="set-row">
            <div><b>主音量</b><small>整體音訊輸出強度</small></div>
            <div class="set-ctrl">
              <input type="range" id="set-audio-master" min="0" max="100" step="5" value="${Math.round(s.audio.master * 100)}" />
              <span class="set-val">${Math.round(s.audio.master * 100)}%</span>
            </div>
          </div>
          <div class="set-row">
            <div><b>主城／標題背景音樂 (BGM)</b><small>即時調整 10 大主城旋律與開場音樂音量</small></div>
            <div class="set-ctrl">
              <input type="range" id="set-audio-bgm" min="0" max="100" step="5" value="${Math.round(s.audio.bgm * 100)}" />
              <span class="set-val">${Math.round(s.audio.bgm * 100)}%</span>
            </div>
          </div>
          <div class="set-row">
            <div><b>戰鬥與介面音效 (SFX)</b><small>技能施放與點擊提示音量</small></div>
            <div class="set-ctrl">
              <input type="range" id="set-audio-sfx" min="0" max="100" step="5" value="${Math.round(s.audio.sfx * 100)}" />
              <span class="set-val">${Math.round(s.audio.sfx * 100)}%</span>
            </div>
          </div>
        </div>
      `;
      body.querySelector('#set-audio-mute')?.addEventListener('change', (e) => {
        s.audio.muted = e.target.checked;
        e.target.nextElementSibling.textContent = s.audio.muted ? '🔇 已靜音' : '🔊 開啟';
        this.applyAll();
        this.save();
      });
      ['master', 'bgm', 'sfx'].forEach((k) => {
        body.querySelector(`#set-audio-${k}`)?.addEventListener('input', (e) => {
          s.audio[k] = Number(e.target.value) / 100;
          e.target.nextElementSibling.textContent = `${e.target.value}%`;
          this.applyAll();
          this.save();
        });
      });
    } else if (this.activeTab === 'graphics') {
      body.innerHTML = `
        <div class="set-section">
          <div class="set-row">
            <div><b>畫面渲染畫質</b><small>調整舞台細節與抗鋸齒清晰度</small></div>
            <select id="set-gfx-quality" class="set-select">
              <option value="low" ${s.graphics.quality === 'low' ? 'selected' : ''}>流暢優先 (Low)</option>
              <option value="medium" ${s.graphics.quality === 'medium' ? 'selected' : ''}>均衡模式 (Medium)</option>
              <option value="high" ${s.graphics.quality === 'high' ? 'selected' : ''}>極致暗黑 (High)</option>
            </select>
          </div>
          <div class="set-row">
            <div><b>技能粒子特效密度</b><small>控制戰鬥與主城環境光影數量</small></div>
            <select id="set-gfx-particles" class="set-select">
              <option value="low" ${s.graphics.particles === 'low' ? 'selected' : ''}>簡約</option>
              <option value="medium" ${s.graphics.particles === 'medium' ? 'selected' : ''}>標準</option>
              <option value="high" ${s.graphics.particles === 'high' ? 'selected' : ''}>華麗</option>
            </select>
          </div>
          <div class="set-row">
            <div><b>顯示戰鬥傷害浮字</b><small>關閉後可降低大量群怪時的畫面雜訊</small></div>
            <label class="set-chk"><input type="checkbox" id="set-gfx-dmg" ${s.graphics.damageText ? 'checked' : ''} /> <span>顯示傷害數字</span></label>
          </div>
          <div class="set-row">
            <div><b>重擊螢幕震動</b><small>施放奧義或暴擊時的鏡頭震動回饋</small></div>
            <label class="set-chk"><input type="checkbox" id="set-gfx-shake" ${s.graphics.screenShake ? 'checked' : ''} /> <span>啟用鏡頭震動</span></label>
          </div>
        </div>
      `;
      body.querySelector('#set-gfx-quality')?.addEventListener('change', (e) => { s.graphics.quality = e.target.value; this.applyAll(); this.save(); });
      body.querySelector('#set-gfx-particles')?.addEventListener('change', (e) => { s.graphics.particles = e.target.value; this.applyAll(); this.save(); });
      body.querySelector('#set-gfx-dmg')?.addEventListener('change', (e) => { s.graphics.damageText = e.target.checked; this.applyAll(); this.save(); });
      body.querySelector('#set-gfx-shake')?.addEventListener('change', (e) => { s.graphics.screenShake = e.target.checked; this.applyAll(); this.save(); });
    } else {
      body.innerHTML = `
        <div class="set-section">
          <div class="set-row">
            <div><b>顯示中上目標／NPC 資訊框</b><small>靠近主城 NPC 或戰鬥鎖定怪物時顯示血條橫幅</small></div>
            <label class="set-chk"><input type="checkbox" id="set-gp-target" ${s.gameplay.showTargetFrame ? 'checked' : ''} /> <span>啟用目標資訊框</span></label>
          </div>
          <div class="set-row">
            <div><b>對話紀錄顯示時間戳記</b><small>在左下角紀錄窗顯示 [HH:MM:SS]</small></div>
            <label class="set-chk"><input type="checkbox" id="set-gp-ts" ${s.gameplay.showChatTimestamp ? 'checked' : ''} /> <span>顯示時間</span></label>
          </div>
          <div class="set-row">
            <div><b>進場預設開啟自動狩獵</b><small>進入戰鬥地圖後自動接管技能與走位</small></div>
            <label class="set-chk"><input type="checkbox" id="set-gp-hunt" ${s.gameplay.autoHuntDefault ? 'checked' : ''} /> <span>自動狩獵</span></label>
          </div>
        </div>
        <div class="set-section">
          <div class="set-sec-title">💾 本機存檔備份與跨機轉移（雙保險）</div>
          <div style="display:flex;gap:8px;margin-bottom:8px;">
            <button type="button" id="btn-export-save-copy" class="btn-gold-sm" style="flex:1;">📤 複製存檔碼</button>
            <button type="button" id="btn-export-save-file" class="btn-ghost-sm" style="flex:1;">📥 下載 .json 備份檔</button>
          </div>
          <textarea id="txt-import-save" rows="2" placeholder="貼上先前匯出的 JSON 存檔碼..." style="width:100%;background:#0e0b10;color:#e2e8f0;border:1px solid #8a6632;border-radius:6px;padding:6px;font-size:11px;resize:vertical;"></textarea>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;">
            <span id="save-backup-msg" style="font-size:11px;color:#86efac;"></span>
            <button type="button" id="btn-import-save-apply" class="btn-gold-sm">🔄 匯入並覆蓋存檔</button>
          </div>
        </div>
      `;
      body.querySelector('#set-gp-target')?.addEventListener('change', (e) => { s.gameplay.showTargetFrame = e.target.checked; this.applyAll(); this.save(); });
      body.querySelector('#set-gp-ts')?.addEventListener('change', (e) => { s.gameplay.showChatTimestamp = e.target.checked; this.applyAll(); this.save(); });
      body.querySelector('#set-gp-hunt')?.addEventListener('change', (e) => { s.gameplay.autoHuntDefault = e.target.checked; this.applyAll(); this.save(); });
      const msgEl = body.querySelector('#save-backup-msg');
      body.querySelector('#btn-export-save-copy')?.addEventListener('click', async () => {
        const str = this.onExportSave?.();
        if (!str) return;
        try { await navigator.clipboard.writeText(str); if (msgEl) msgEl.textContent = '✅ 已複製完整存檔碼至剪貼簿！'; }
        catch { const ta = body.querySelector('#txt-import-save'); if (ta) { ta.value = str; ta.select(); } if (msgEl) msgEl.textContent = '✅ 已輸出至下方輸入框，請全選複製！'; }
      });
      body.querySelector('#btn-export-save-file')?.addEventListener('click', () => {
        const str = this.onExportSave?.();
        if (!str) return;
        const blob = new Blob([str], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `abyss-save-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        if (msgEl) msgEl.textContent = '✅ 已下載 .json 存檔備份！';
      });
      body.querySelector('#btn-import-save-apply')?.addEventListener('click', () => {
        const raw = (body.querySelector('#txt-import-save')?.value || '').trim();
        if (!raw) { if (msgEl) msgEl.textContent = '⚠️ 請先貼上存檔碼'; return; }
        const ok = this.onImportSave?.(raw);
        if (msgEl) msgEl.textContent = ok ? '✅ 存檔匯入成功！已即時同步' : '❌ 存檔碼格式無效';
      });
    }
  }
}
