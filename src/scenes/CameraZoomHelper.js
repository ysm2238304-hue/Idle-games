// CameraZoomHelper.js — v278 全場景通用滑鼠滾輪平滑縮放引擎（支援主城 / 戰鬥 / 演武場）
// 規則：僅在滑鼠位於 CANVAS 上時觸發，不干擾彈窗、聊天室或背包捲軸；按 [0] 重置預設焦距

export class CameraZoomHelper {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.minZoom = options.minZoom ?? 0.62;
    this.maxZoom = options.maxZoom ?? 1.42;
    this.defaultZoom = options.defaultZoom ?? 1.0;
    this.step = options.step ?? 0.085;
    this.lerpSpeed = options.lerpSpeed ?? 10;
    this.targetZoom = this.defaultZoom;
    this._badgeEl = null;
    this._badgeTimer = null;

    if (scene?.cameras?.main) {
      scene.cameras.main.setZoom(this.defaultZoom);
    }

    this._onWheel = (pointer, _objs, _dx, deltaY) => {
      if (!this.scene?.cameras?.main || !this.scene.scene?.isActive?.()) return;
      const targetEl = pointer?.event?.target;
      if (targetEl && targetEl.tagName !== 'CANVAS') return;
      // 若有任何開啟的模態框正在捲動，避免誤觸縮放
      if (document.querySelector('.modal-overlay:not(.hidden), .npc-modal-backdrop:not(.hidden)')) {
        if (targetEl && targetEl.tagName !== 'CANVAS') return;
      }
      const delta = deltaY > 0 ? -this.step : this.step;
      this.setTargetZoom(this.targetZoom + delta, true);
    };

    scene.input?.on('wheel', this._onWheel);
    this._resetKey = scene.input?.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ZERO);
    scene.events?.once('shutdown', () => this.destroy());
    scene.events?.once('destroy', () => this.destroy());
  }

  setTargetZoom(z, showHint = false) {
    const next = Phaser.Math.Clamp(Number(z) || this.defaultZoom, this.minZoom, this.maxZoom);
    if (Math.abs(next - this.targetZoom) < 0.001) return;
    this.targetZoom = next;
    if (showHint) this._showZoomBadge(next);
  }

  resetZoom(showHint = true) {
    this.setTargetZoom(this.defaultZoom, showHint);
  }

  update(delta) {
    const cam = this.scene?.cameras?.main;
    if (!cam) return;
    if (this._resetKey && Phaser.Input.Keyboard.JustDown(this._resetKey)) {
      const ae = document.activeElement;
      const isTyping = ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable);
      if (!isTyping) this.resetZoom(true);
    }
    const dt = Math.min(0.05, (delta || 16) / 1000);
    const cur = cam.zoom;
    if (Math.abs(cur - this.targetZoom) > 0.0015) {
      cam.setZoom(Phaser.Math.Linear(cur, this.targetZoom, Math.min(1, dt * this.lerpSpeed)));
    }
  }

  _showZoomBadge(zoomVal) {
    if (typeof document === 'undefined') return;
    let el = document.getElementById('v278-camera-zoom-badge');
    if (!el) {
      el = document.createElement('div');
      el.id = 'v278-camera-zoom-badge';
      el.style.cssText = [
        'position:fixed',
        'bottom:122px',
        'right:18px',
        'z-index:9200',
        'padding:5px 12px',
        'border-radius:999px',
        'background:rgba(12,15,24,0.86)',
        'border:1px solid rgba(251,191,36,0.48)',
        'color:#fde68a',
        'font-size:12px',
        'font-weight:700',
        'letter-spacing:0.4px',
        'pointer-events:none',
        'box-shadow:0 4px 16px rgba(0,0,0,0.55)',
        'transition:opacity 0.25s ease',
      ].join(';');
      document.body.appendChild(el);
    }
    this._badgeEl = el;
    const pct = Math.round(zoomVal * 100);
    el.textContent = `🔍 鏡頭縮放 ${pct}%（按 0 重置）`;
    el.style.opacity = '1';
    if (this._badgeTimer) clearTimeout(this._badgeTimer);
    this._badgeTimer = setTimeout(() => {
      if (el) el.style.opacity = '0';
    }, 1150);
  }

  destroy() {
    if (this.scene?.input && this._onWheel) {
      this.scene.input.off('wheel', this._onWheel);
    }
    this._onWheel = null;
    if (this._badgeTimer) {
      clearTimeout(this._badgeTimer);
      this._badgeTimer = null;
    }
  }
}
