// 成就里程碑稱號 ＋ 無盡深淵爬塔限時副本介面模組 (v97)
import { ACHIEVEMENTS } from '../data/achievements.js?v=317';

export class AchievementTowerModal {
  constructor({ getState, onClaimAchievement, onEquipTitle, onStartTower } = {}) {
    this.getState = getState;
    this.onClaimAchievement = onClaimAchievement;
    this.onEquipTitle = onEquipTitle;
    this.onStartTower = onStartTower;
    this.activeTab = 'ach';
    this.modal = null;
  }

  init() {
    this.modal = document.getElementById('modal-ach-tower');
    document.getElementById('btn-open-ach-tower')?.addEventListener('click', () => this.open());
    document.getElementById('btn-close-ach-tower')?.addEventListener('click', () => this.close());
    this.modal?.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });
  }

  open(tab = null) {
    if (tab) this.activeTab = tab;
    if (!this.modal) return;
    this.render();
    this.modal.classList.remove('hidden');
  }

  close() {
    this.modal?.classList.add('hidden');
  }

  toggle() {
    if (!this.modal) return;
    if (this.modal.classList.contains('hidden')) this.open();
    else this.close();
  }

  render() {
    const st = this.getState?.() || {};
    const body = document.getElementById('ach-tower-body');
    const tabs = this.modal?.querySelectorAll('.acht-tab-btn');
    tabs?.forEach((b) => {
      b.classList.toggle('active', b.dataset.achtab === this.activeTab);
      b.onclick = () => { this.activeTab = b.dataset.achtab; this.render(); };
    });
    if (!body) return;

    if (this.activeTab === 'tower') {
      const maxF = st.maxTowerFloor || 0;
      const nextF = maxF + 1;
      body.innerHTML = `
        <div class="set-section" style="text-align:center;padding:18px 16px;">
          <div style="font-size:40px;margin-bottom:6px;">🌀</div>
          <h3 style="margin:0;color:#fde68a;font-size:20px;">無盡深淵挑戰塔</h3>
          <p style="margin:8px 0 14px;color:#cbd5e1;font-size:13px;line-height:1.6;">
            獨立於主線關卡的高壓試煉！每層限時 <b style="color:#f87171;">60 秒</b> 清空精銳怪群與守層首領。<br>
            每突破 <b style="color:#4ade80;">5 層（5 / 10 / 15…）</b> 必掉 <b style="color:#4ade80;">綠色套裝裝備</b> 與高階寵物精華，失敗將安全返回主城！
          </p>
          <div style="display:flex;justify-content:center;gap:18px;margin-bottom:16px;font-size:13px;color:#e2d5be;">
            <span>🏆 最高突破：<b style="color:#fde047;font-size:16px;">第 ${maxF} 層</b></span>
            <span>⚔️ 建議挑戰：<b style="color:#38bdf8;font-size:16px;">第 ${nextF} 層</b></span>
          </div>
          <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
            <button type="button" id="btn-tower-start-next" class="btn-epic-gold" style="padding:11px 26px;font-size:14px;">⚔️ 挑戰第 ${nextF} 層</button>
            ${maxF >= 1 ? `<button type="button" id="btn-tower-start-1" class="btn-ghost-sm" style="padding:10px 16px;">從第 ${Math.max(1, maxF - 2)} 層熱身</button>` : ''}
          </div>
        </div>
      `;
      body.querySelector('#btn-tower-start-next')?.addEventListener('click', () => {
        this.close();
        this.onStartTower?.(nextF);
      });
      body.querySelector('#btn-tower-start-1')?.addEventListener('click', () => {
        this.close();
        this.onStartTower?.(Math.max(1, maxF - 2));
      });
      return;
    }

    const claimed = st.claimedAchievements || {};
    const unlockedTitles = ACHIEVEMENTS.filter((a) => claimed[a.id] && a.reward.title).map((a) => a.reward.title);
    const activeTitle = st.activeTitle || '';

    body.innerHTML = `
      <div class="set-section" style="margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
          <b style="color:#fde68a;font-size:12.5px;">🎖️ 目前配戴稱號：${activeTitle ? `【${activeTitle}】` : '未配戴'}</b>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <button type="button" class="${!activeTitle ? 'btn-gold-sm' : 'btn-ghost-sm'}" data-set-title="">無稱號</button>
            ${unlockedTitles.map((t) => `<button type="button" class="${activeTitle === t ? 'btn-gold-sm' : 'btn-ghost-sm'}" data-set-title="${t}">【${t}】</button>`).join('')}
          </div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:7px;">
        ${ACHIEVEMENTS.map((a) => {
          const cur = Math.min(a.goal, a.val(st));
          const done = cur >= a.goal;
          const isClaimed = !!claimed[a.id];
          const pct = Math.min(100, Math.round((cur / a.goal) * 100));
          const rewParts = [];
          if (a.reward.crystals) rewParts.push(`🔮×${a.reward.crystals}`);
          if (a.reward.protectStones) rewParts.push(`🛡️×${a.reward.protectStones}`);
          if (a.reward.petEssence) rewParts.push(`✨×${a.reward.petEssence}`);
          if (a.reward.dust) rewParts.push(`💎×${a.reward.dust}`);
          if (a.reward.title) rewParts.push(`🎖️稱號【${a.reward.title}】`);
          return `
            <div style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:8px;background:rgba(16,13,18,0.9);border:1px solid ${isClaimed ? 'rgba(34,197,94,0.4)' : (done ? '#f59e0b' : 'rgba(138,102,50,0.35)')};">
              <div style="flex:1;min-width:0;">
                <div style="display:flex;align-items:center;gap:6px;">
                  <span style="font-size:10px;padding:1px 6px;border-radius:4px;background:rgba(120,53,15,0.35);color:#fde68a;">${a.cat}</span>
                  <b style="color:#f8fafc;font-size:13px;">${a.name}</b>
                  <span style="font-size:11px;color:#94a3b8;">${a.desc}</span>
                </div>
                <div style="display:flex;align-items:center;gap:8px;margin-top:4px;">
                  <div style="flex:1;height:6px;background:#1e293b;border-radius:999px;overflow:hidden;"><div style="width:${pct}%;height:100%;background:${done ? '#4ade80' : '#f59e0b'};"></div></div>
                  <span style="font-size:10.5px;color:#cbd5e1;min-width:68px;text-align:right;">${cur} / ${a.goal}</span>
                </div>
                <div style="font-size:11px;color:#86efac;margin-top:3px;">獎勵：${rewParts.join(' ・ ')}</div>
              </div>
              <button type="button" class="${done && !isClaimed ? 'btn-gold-sm' : 'btn-ghost-sm'}" data-claim-ach="${a.id}" ${done && !isClaimed ? '' : 'disabled'}>
                ${isClaimed ? '✓ 已領取' : (done ? '🎁 領取' : '進行中')}
              </button>
            </div>
          `;
        }).join('')}
      </div>
    `;

    body.querySelectorAll('[data-claim-ach]').forEach((b) => {
      b.onclick = () => { this.onClaimAchievement?.(b.dataset.claimAch); this.render(); };
    });
    body.querySelectorAll('[data-set-title]').forEach((b) => {
      b.onclick = () => { this.onEquipTitle?.(b.dataset.setTitle); this.render(); };
    });
  }
}
