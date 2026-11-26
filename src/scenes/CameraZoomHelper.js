// CameraZoomHelper.js — v282 全場景通用滑鼠滾輪平滑縮放引擎（動態邊界防黑邊＋視窗resize自適應）
// 規則：僅在滑鼠位於 CANVAS 上時觸發；動態計算最小縮放倍率確保任何寬螢幕都不會露出地圖外黑邊；按 [0] 重置

export class CameraZoomHelper {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.baseMinZoom = options.minZoom ?? 0.62;
    this.maxZoom = options.maxZoom ?? 1.45;
    this.defaultZoom = options.defaultZoom ?? 1.0;
    this.mapWidth = options.mapWidth ?? 4096;
    this.mapHeight = options.mapHeight ?? 2560;
    this.step = options.step ?? 0.085;
    this.lerpSpeed = options.lerpSpeed ?? 10;
    this._badgeTimer = null;

    const effMin = this.getEffectiveMinZoom();
    this.targetZoom = Phaser.Math.Clamp(this.defaultZoom, effMin, this.maxZoom);
    if (scene?.cameras?.main) {
      scene.cameras.main.setZoom(this.targetZoom);
    }

    this._onWheel = (pointer, _objs, _dx, deltaY) => {
      if (!this.scene?.cameras?.main || !this.scene.scene?.isActive?.()) return;
      const targetEl = pointer?.event?.target;
      if (targetEl && targetEl.tagName !== 'CANVAS') return;
      const delta = deltaY > 0 ? -this.step : this.step;
      this.setTargetZoom(this.targetZoom + delta, true);
    };

    this._onResize = () => {
      const minZ = this.getEffectiveMinZoom();
      if (this.targetZoom < minZ) {
        this.targetZoom = minZ;
        this.scene?.cameras?.main?.setZoom(minZ);
      }
    };

    scene.input?.on('wheel', this._onWheel);
    scene.scale?.on('resize', this._onResize);
    this._resetKey = scene.input?.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ZERO);
    scene.events?.once('shutdown', () => this.destroy());
    scene.events?.once('destroy', () => this.destroy());
  }

  getEffectiveMinZoom() {
    const cam = this.scene?.cameras?.main;
    const vw = cam?.width || this.scene?.scale?.width || window.innerWidth || 1280;
    const vh = cam?.height || this.scene?.scale?.height || window.innerHeight || 720;
    const coverW = vw / Math.max(1, this.mapWidth);
    const coverH = vh / Math.max(1, this.mapHeight);
    // 加 0.01 安全餘量避免子像素黑縫
    return Math.min(this.maxZoom, Math.max(this.baseMinZoom, coverW + 0.01, coverH + 0.01));
  }

  setTargetZoom(z, showHint = false) {
    const minZ = this.getEffectiveMinZoom();
    const next = Phaser.Math.Clamp(Number(z) || this.defaultZoom, minZ, this.maxZoom);
    if (Math.abs(next - this.targetZoom) < 0.001) return;
    this.targetZoom = next;
    if (showHint) this._showZoomBadge(next);
  }

  resetZoom(showHint = true) {
    this.setTargetZoom(Math.max(this.defaultZoom, this.getEffectiveMinZoom()), showHint);
  }

  update(delta) {
    const cam = this.scene?.cameras?.main;
    if (!cam) return;
    const minZ = this.getEffectiveMinZoom();
    if (this.targetZoom < minZ) this.targetZoom = minZ;

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
    if (this.scene?.scale && this._onResize) {
      this.scene.scale.off('resize', this._onResize);
    }
    this._onWheel = null;
    this._onResize = null;
    if (this._badgeTimer) {
      clearTimeout(this._badgeTimer);
      this._badgeTimer = null;
    }
  }
}
