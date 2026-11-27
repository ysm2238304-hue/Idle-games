// v299: 獨立戰鬥 DPS 計算引擎（DpsMeterEngine — 純邏輯、零 Phaser 耦合）
// 支援 100ms 精度 3 秒滑動即時 DPS、全程平均 DPS、1 秒峰值 DPS、首擊觸發計時評測（10/30/60秒）、
// 按職業保存歷史最佳紀錄（localStorage）、細粒度技能傷害構成（佔比/命中/暴擊/均傷）與 30 秒雙線折線圖資料。

const PB_STORAGE_KEY = 'idle_arpg_dps_pb_v299';

export class DpsMeterEngine {
  constructor() {
    this.bucketMs = 100;
    this.windowBuckets = 300; // 30 秒 × 10 桶/秒
    this.reset();
  }

  reset() {
    this.startedAt = 0;
    this.lastHitAt = 0;
    this.totalDmg = 0;
    this.peakDps = 0;
    this.hits = 0;
    this.crits = 0;
    this.overpowers = 0;
    this.bySource = new Map(); // name -> { dmg, hits, crits }
    this._ring = new Array(this.windowBuckets).fill(0);
    this._ringBucketIdx = -1;
    this.series30s = new Array(30).fill(0);
    this._secBucketDmg = 0;
    this._lastSecTick = 0;

    // 計時挑戰狀態：idle | ready | running | finished
    this.trialState = 'idle';
    this.trialTotalSec = 0;
    this.trialStartAt = 0;
    this.trialEndAt = 0;
    this.frozenSnapshot = null;
  }

  armTrial(sec) {
    this.reset();
    this.trialTotalSec = Math.max(5, Number(sec) || 10);
    this.trialState = 'ready';
    this.frozenSnapshot = null;
  }

  _advanceRing(now) {
    const curIdx = Math.floor(now / this.bucketMs);
    if (this._ringBucketIdx < 0) {
      this._ringBucketIdx = curIdx;
      return;
    }
    const diff = curIdx - this._ringBucketIdx;
    if (diff <= 0) return;
    const clearN = Math.min(diff, this.windowBuckets);
    for (let i = 1; i <= clearN; i++) {
      this._ring[(this._ringBucketIdx + i) % this.windowBuckets] = 0;
    }
    this._ringBucketIdx = curIdx;
  }

  recordHit({ dmg = 0, isCrit = false, isOverpower = false, sourceName = '普通攻擊', timestamp = 0 } = {}) {
    const val = Math.max(0, Math.round(Number(dmg) || 0));
    if (val <= 0) return;
    if (this.trialState === 'finished') return;

    const now = timestamp || performance.now();
    if (this.trialState === 'ready') {
      this.trialState = 'running';
      this.trialStartAt = now;
      this.trialEndAt = now + this.trialTotalSec * 1000;
      this.startedAt = now;
      this._lastSecTick = now;
    }
    if (!this.startedAt) {
      this.startedAt = now;
      this._lastSecTick = now;
    }
    this.lastHitAt = now;

    this._advanceRing(now);
    const slot = this._ringBucketIdx % this.windowBuckets;
    this._ring[slot] += val;

    this.totalDmg += val;
    this._secBucketDmg += val;
    this.hits += 1;
    if (isCrit) this.crits += 1;
    if (isOverpower) this.overpowers += 1;

    const key = String(sourceName || '普通攻擊').replace(/\s+/g, ' ').trim().slice(0, 14) || '普通攻擊';
    let rec = this.bySource.get(key);
    if (!rec) {
      rec = { dmg: 0, hits: 0, crits: 0 };
      this.bySource.set(key, rec);
    }
    rec.dmg += val;
    rec.hits += 1;
    if (isCrit) rec.crits += 1;

    // 計算即時 1 秒峰值 DPS
    const oneSecDmg = this._sumRecentBuckets(10);
    if (oneSecDmg > this.peakDps) this.peakDps = Math.round(oneSecDmg);
  }

  _sumRecentBuckets(count) {
    if (this._ringBucketIdx < 0) return 0;
    let sum = 0;
    const n = Math.min(count, this.windowBuckets);
    for (let i = 0; i < n; i++) {
      const idx = (this._ringBucketIdx - i + this.windowBuckets * 10) % this.windowBuckets;
      sum += this._ring[idx] || 0;
    }
    return sum;
  }

  tick(now, classId = 'warrior') {
    const t = now || performance.now();
    if (this.trialState === 'finished') return { justFinished: false };

    this._advanceRing(t);

    if (this._lastSecTick > 0 && t - this._lastSecTick >= 1000) {
      this._lastSecTick = t;
      const secVal = Math.round(this._secBucketDmg);
      this._secBucketDmg = 0;
      this.series30s.shift();
      this.series30s.push(secVal);
      if (secVal > this.peakDps) this.peakDps = secVal;
    }

    if (this.trialState === 'running' && this.trialEndAt > 0 && t >= this.trialEndAt) {
      this.trialState = 'finished';
      const snap = this.getSnapshot(t, classId);
      const prevPb = this.getPersonalBest(classId, this.trialTotalSec);
      const isNewRecord = snap.avgDps > prevPb;
      if (isNewRecord) this.savePersonalBest(classId, this.trialTotalSec, snap.avgDps);
      snap.prevPb = prevPb;
      snap.isNewRecord = isNewRecord;
      snap.grade = this.computeGrade(snap.avgDps, prevPb);
      this.frozenSnapshot = snap;
      return { justFinished: true, snapshot: snap };
    }
    return { justFinished: false };
  }

  computeGrade(avgDps, prevPb) {
    if (avgDps <= 0) return 'C';
    if (prevPb > 0 && avgDps >= prevPb * 1.15) return 'S+';
    if (prevPb > 0 && avgDps >= prevPb * 0.95) return 'S';
    if (avgDps >= 50000) return 'S+';
    if (avgDps >= 12000) return 'S';
    if (avgDps >= 3000) return 'A';
    if (avgDps >= 600) return 'B';
    return 'C';
  }

  getPersonalBest(classId, sec = 30) {
    try {
      const raw = localStorage.getItem(PB_STORAGE_KEY);
      if (!raw) return 0;
      const obj = JSON.parse(raw);
      return Number(obj?.[`${classId || 'warrior'}_${sec}`]) || 0;
    } catch {
      return 0;
    }
  }

  savePersonalBest(classId, sec, dps) {
    try {
      const raw = localStorage.getItem(PB_STORAGE_KEY);
      const obj = raw ? JSON.parse(raw) : {};
      obj[`${classId || 'warrior'}_${sec}`] = Math.round(dps);
      localStorage.setItem(PB_STORAGE_KEY, JSON.stringify(obj));
    } catch {}
  }

  getSnapshot(now, classId = 'warrior') {
    if (this.trialState === 'finished' && this.frozenSnapshot) {
      return this.frozenSnapshot;
    }
    const t = now || performance.now();
    this._advanceRing(t);

    const activeSec = this.startedAt ? Math.max(0.5, (t - this.startedAt) / 1000) : 0;
    const denomSec = (this.trialState === 'running' && this.trialTotalSec > 0)
      ? Math.max(0.5, Math.min(this.trialTotalSec, activeSec))
      : Math.max(1, activeSec);

    const avgDps = this.totalDmg > 0 ? Math.round(this.totalDmg / denomSec) : 0;
    const rollWinSec = Math.min(3, Math.max(1, activeSec || 1));
    const instantDps = this.totalDmg > 0 ? Math.round(this._sumRecentBuckets(30) / rollWinSec) : 0;
    const critPct = this.hits > 0 ? Math.round((this.crits / this.hits) * 100) : 0;
    const opPct = this.hits > 0 ? Math.round((this.overpowers / this.hits) * 100) : 0;
    const hps = activeSec > 0 ? Number((this.hits / activeSec).toFixed(1)) : 0;
    const remSec = this.trialState === 'running' ? Math.max(0, Math.ceil((this.trialEndAt - t) / 1000)) : 0;

    const breakdown = [...this.bySource.entries()]
      .map(([name, rec]) => ({
        name,
        dmg: rec.dmg,
        hits: rec.hits,
        crits: rec.crits,
        pct: this.totalDmg > 0 ? Math.max(1, Math.round((rec.dmg / this.totalDmg) * 100)) : 0,
        critPct: rec.hits > 0 ? Math.round((rec.crits / rec.hits) * 100) : 0,
        avgHit: rec.hits > 0 ? Math.round(rec.dmg / rec.hits) : 0,
      }))
      .sort((a, b) => b.dmg - a.dmg);

    return {
      trialState: this.trialState,
      trialTotalSec: this.trialTotalSec,
      remSec,
      elapsedSec: Number(activeSec.toFixed(1)),
      totalDmg: Math.round(this.totalDmg),
      instantDps,
      avgDps,
      peakDps: Math.round(this.peakDps),
      hits: this.hits,
      critPct,
      opPct,
      hps,
      breakdown,
      series30s: [...this.series30s],
      pb: this.getPersonalBest(classId, this.trialTotalSec || 30),
    };
  }

  formatReportText(snap, className = '冒險者', simChapter = 1) {
    const topLines = (snap.breakdown || []).slice(0, 5)
      .map((b, i) => `${i + 1}. ${b.name}: ${b.pct}% (${b.dmg.toLocaleString()} | ${b.hits}擊 | 暴擊${b.critPct}%)`)
      .join('\n');
    return [
      `【無限深淵・演武場 DPS 戰報】`,
      `職業：${className}｜模擬護甲：Ch.${simChapter} 首領`,
      `模式：${snap.trialTotalSec ? `${snap.trialTotalSec}秒評測` : '自由打樁'}｜歷時：${snap.elapsedSec}s${snap.grade ? `｜評級：${snap.grade}` : ''}`,
      `平均 DPS：${snap.avgDps.toLocaleString()}｜峰值 DPS：${snap.peakDps.toLocaleString()}｜總傷害：${snap.totalDmg.toLocaleString()}`,
      `暴擊率：${snap.critPct}%｜壓制率：${snap.opPct}%｜每秒命中：${snap.hps}/s`,
      topLines ? `--- 技能傷害構成 ---\n${topLines}` : '',
    ].filter(Boolean).join('\n');
  }
}
