// v302: 一般刷圖專用「簡化版即時 DPS 小彈窗」（BattleMiniDpsHud）
// 複用獨立 DpsMeterEngine，預設停靠右上角小地圖下方，支援拖曳、收合、重置；進主城或演武場時自動隱藏
import { DpsMeterEngine } from '../combat/DpsMeterEngine.js?v=318';

export class BattleMiniDpsHud {
  constructor(scene) {
    this.scene = scene;
    this.meter = new DpsMeterEngine();
    this.el = null;
    this.visible = false;
    this.collapsed = false;
    this._lastRenderAt = 0;
  }

  _ensureDom() {
    if (this.el && document.body.contains(this.el)) return this.el;
    const old = document.getElementById('v302-mini-dps-hud');
    if (old) old.remove();

    const el = document.createElement('div');
    el.id = 'v302-mini-dps-hud';
    el.style.cssText = 'position:fixed;right:14px;top:242px;z-index:8400;width:222px;background:linear-gradient(rgba(8,10,16,0.72),rgba(8,10,16,0.86)),url("./assets/ui/lobby_panel_bg_v299.webp?v=299") center/100% 100% no-repeat;border:1.5px solid rgba(212,175,55,0.48);border-radius:10px;padding:8px 10px;color:#f3e8d2;font-family:"Noto Sans TC",sans-serif;box-shadow:0 10px 28px rgba(0,0,0,0.82);user-select:none;display:none;';
    el.innerHTML = `
      <div id="v302-mdps-drag" style="display:flex;justify-content:space-between;align-items:center;cursor:move;padding-bottom:5px;border-bottom:1px solid rgba(212,175,55,0.22);margin-bottom:6px;">
        <b style="font-size:12px;color:#fde047;">⚔️ 實戰秒傷</b>
        <div style="display:flex;gap:4px;">
          <button id="v302-mdps-reset" type="button" title="重置統計" style="padding:1px 6px;border-radius:4px;border:1px solid #475569;background:#1e293b;color:#cbd5e1;font-size:10px;cursor:pointer;">↺</button>
          <button id="v302-mdps-fold" type="button" title="收合/展開" style="padding:1px 6px;border-radius:4px;border:1px solid #475569;background:#1e293b;color:#cbd5e1;font-size:10px;cursor:pointer;">—</button>
        </div>
      </div>
      <div id="v302-mdps-body">
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;text-align:center;background:rgba(12,16,24,0.82);border-radius:6px;padding:5px 4px;margin-bottom:6px;">
          <div><div style="font-size:9.5px;color:#94a3b8;">即時DPS</div><b id="v302-m-inst" style="font-size:12.5px;color:#fde047;">0</b></div>
          <div><div style="font-size:9.5px;color:#94a3b8;">峰值</div><b id="v302-m-peak" style="font-size:12.5px;color:#fb923c;">0</b></div>
          <div><div style="font-size:9.5px;color:#94a3b8;">暴擊</div><b id="v302-m-crit" style="font-size:12.5px;color:#38bdf8;">0%</b></div>
        </div>
        <div id="v302-m-bars" style="display:flex;flex-direction:column;gap:3px;font-size:10px;color:#94a3b8;">戰鬥中自動統計前 3 招...</div>
      </div>
    `;
    document.body.appendChild(el);
    this.el = el;

    const dragBar = el.querySelector('#v302-mdps-drag');
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
      el.style.left = `${Math.max(8, Math.min(window.innerWidth - el.offsetWidth - 8, e.clientX - ox))}px`;
      el.style.top = `${Math.max(8, Math.min(window.innerHeight - 48, e.clientY - oy))}px`;
    });
    dragBar?.addEventListener('pointerup', () => { dragging = false; });

    el.querySelector('#v302-mdps-reset')?.addEventListener('click', () => {
      this.meter.reset();
      this.render(performance.now());
    });
    el.querySelector('#v302-mdps-fold')?.addEventListener('click', (ev) => {
      this.collapsed = !this.collapsed;
      const body = el.querySelector('#v302-mdps-body');
      if (body) body.style.display = this.collapsed ? 'none' : 'block';
      ev.currentTarget.textContent = this.collapsed ? '+' : '—';
    });
    return el;
  }

  show() {
    if (this.scene?.isTrainingMode || this.scene?.trainingArena?.active) {
      this.hide();
      return;
    }
    const el = this._ensureDom();
    el.style.display = 'block';
    this.visible = true;
  }

  hide() {
    if (this.el) this.el.style.display = 'none';
    this.visible = false;
  }

  recordHit({ dmg, isCrit, isOverpower, sourceName, timestamp }) {
    if (this.scene?.isTrainingMode || this.scene?.trainingArena?.active) return;
    if (!this.visible) this.show();
    this.meter.recordHit({ dmg, isCrit, isOverpower, sourceName, timestamp });
  }

  update(time) {
    if (this.scene?.isTrainingMode || this.scene?.trainingArena?.active) {
      if (this.visible) this.hide();
      return;
    }
    if (!this.visible) return;
    if (time - this._lastRenderAt >= 400) {
      this._lastRenderAt = time;
      this.meter.tick(time, this.scene?.getState?.()?.classId || 'warrior');
      this.render(time);
    }
  }

  render(now) {
    if (!this.el || !this.visible) return;
    const snap = this.meter.getSnapshot(now, this.scene?.getState?.()?.classId || 'warrior');
    const fmt = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : (n >= 1e4 ? `${(n / 1e3).toFixed(1)}K` : n.toLocaleString()));
    this.el.querySelector('#v302-m-inst').textContent = fmt(snap.instantDps);
    this.el.querySelector('#v302-m-peak').textContent = fmt(snap.peakDps);
    this.el.querySelector('#v302-m-crit').textContent = `${snap.critPct}%`;

    const bars = this.el.querySelector('#v302-m-bars');
    if (bars) {
      if (!snap.breakdown.length) {
        bars.innerHTML = '戰鬥中自動統計前 3 招...';
      } else {
        bars.innerHTML = snap.breakdown.slice(0, 3).map((b) => `
          <div>
            <div style="display:flex;justify-content:space-between;color:#e2e8f0;">
              <span>${b.name}</span><span>${b.pct}% (${fmt(b.dmg)})</span>
            </div>
            <div style="height:4px;background:#1e293b;border-radius:2px;overflow:hidden;margin-top:1px;">
              <div style="width:${b.pct}%;height:100%;background:linear-gradient(90deg,#f59e0b,#fde047);"></div>
            </div>
          </div>
        `).join('');
      }
    }
  }

  destroy() {
    this.el?.remove();
    this.el = null;
    this.visible = false;
  }
}
