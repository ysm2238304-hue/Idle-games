// 全域暗黑 HUD 自由排版（拖曳／個別縮放／開關）與系統設定視窗模組 (v78)
const SETTINGS_KEY = 'desk_diablo_settings_v1';

const PANEL_META = {
  'hud-top-left': { label: '角色頭像與關卡進度', origin: 'top left' },
  'hud-top-center': { label: '目標／首領血條', origin: 'top center' },
  'hud-top-right': { label: '功能選單與羅盤小地圖', origin: 'top right' },
  'hud-bottom-left': { label: '暗黑戰鬥／掉落日誌', origin: 'bottom left' },
  'diablo-hud': { label: '底部雙球技能祭壇', origin: 'bottom center' },
};

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
  };
}

export class HudSettingsManager {
  constructor({ townBgm, onApply } = {}) {
    this.townBgm = townBgm || null;
    this.onApply = onApply || null;
    this.settings = this._load();
    this.activeTab = 'ui';
    this._dragState = null;
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
      };
    } catch {
      return def;
    }
  }

  save() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    } catch {}
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

  applyAll() {
    document.documentElement.style.setProperty('--hud-global-scale', String(this.settings.ui.globalScale || 1));
    for (const id of Object.keys(PANEL_META)) {
      this._applyPanelTransform(id);
    }

    // 音量同步
    const { master, bgm, muted } = this.settings.audio;
    if (this.townBgm) {
      this.townBgm.setVolume(master * bgm, muted);
    }
    const bgVid = document.getElementById('welcome-bg-video');
    if (bgVid) bgVid.volume = muted ? 0 : Math.min(1, master * bgm);

    // 畫質與遊戲全域旗標
    window.__gameSettings = {
      audio: { ...this.settings.audio },
      graphics: { ...this.settings.graphics },
      gameplay: { ...this.settings.gameplay },
    };

    const tf = document.getElementById('hud-top-center');
    if (tf) tf.classList.toggle('setting-hide-target', !this.settings.gameplay.showTargetFrame);

    this.onApply?.(this.settings);
  }

  openModal(tab = null) {
    if (tab) this.activeTab = tab;
    if (!this.modal) return;
    this.renderModalBody();
    this.modal.classList.remove('hidden');
  }

  closeModal() {
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
      body.querySelector('#set-gfx-quality')?.addEventListener('change', (e) => {
        s.graphics.quality = e.target.value;
        this.applyAll();
        this.save();
      });
      body.querySelector('#set-gfx-particles')?.addEventListener('change', (e) => {
        s.graphics.particles = e.target.value;
        this.applyAll();
        this.save();
      });
      body.querySelector('#set-gfx-dmg')?.addEventListener('change', (e) => {
        s.graphics.damageText = e.target.checked;
        this.applyAll();
        this.save();
      });
      body.querySelector('#set-gfx-shake')?.addEventListener('change', (e) => {
        s.graphics.screenShake = e.target.checked;
        this.applyAll();
        this.save();
      });
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
          <div class="set-row">
            <div><b>快捷鍵總覽</b><small>快速操作說明</small></div>
            <div class="set-keys-hint">
              <span><b>WASD</b> 移動</span><span><b>F</b> 互動</span><span><b>O</b> 系統設定</span><span><b>Y</b> 傳送陣</span><span><b>M</b> 地圖</span><span><b>I</b> 裝備</span><span><b>B</b> 背包</span>
            </div>
          </div>
        </div>
      `;
      body.querySelector('#set-gp-target')?.addEventListener('change', (e) => {
        s.gameplay.showTargetFrame = e.target.checked;
        this.applyAll();
        this.save();
      });
      body.querySelector('#set-gp-ts')?.addEventListener('change', (e) => {
        s.gameplay.showChatTimestamp = e.target.checked;
        this.applyAll();
        this.save();
      });
      body.querySelector('#set-gp-hunt')?.addEventListener('change', (e) => {
        s.gameplay.autoHuntDefault = e.target.checked;
        this.applyAll();
        this.save();
      });
    }
  }
}
