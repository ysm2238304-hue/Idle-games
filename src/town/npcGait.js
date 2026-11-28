// v319: 主城 NPC 步態（程式補動作）
// 原圖走路幀幾乎沒有差異，走起來像滑行。這裡在走路時疊加：
//   上下起伏（每個步幅兩次）、左右微擺、朝行進方向前傾、落地擠壓，並讓腳下影子隨起伏縮放；
//   停下時用緩動回正，不會瞬間跳回。
// 位置（sprite.x / sprite.y）永遠是「腳底著地點」，不會被動畫改動，
// 起伏是靠調整 origin 讓圖往上抬，所以深度排序、碰撞、名牌都不受影響。

// stride：走完左右各一步所需的距離（px，越大步頻越慢）；
// bob：最大起伏（螢幕 px）；sway：左右擺動（弧度）；lean：前傾（弧度）；squash：落地擠壓比例
const PROFILES = {
  default:    { stride: 30, bob: 3.4, sway: 0.030, lean: 0.040, squash: 0.020 },
  guard:      { stride: 34, bob: 2.6, sway: 0.016, lean: 0.022, squash: 0.014 }, // 正步，穩
  scout:      { stride: 26, bob: 4.0, sway: 0.034, lean: 0.060, squash: 0.022 }, // 輕快
  villager:   { stride: 28, bob: 3.6, sway: 0.040, lean: 0.040, squash: 0.020 },
  smith:      { stride: 36, bob: 3.0, sway: 0.032, lean: 0.050, squash: 0.030 }, // 沉重
  miner:      { stride: 36, bob: 3.0, sway: 0.034, lean: 0.052, squash: 0.030 },
  market:     { stride: 30, bob: 3.4, sway: 0.040, lean: 0.036, squash: 0.022 },
  bounty:     { stride: 32, bob: 3.0, sway: 0.022, lean: 0.036, squash: 0.018 },
  guild:      { stride: 32, bob: 3.0, sway: 0.024, lean: 0.038, squash: 0.018 },
  alchemy:    { stride: 30, bob: 2.4, sway: 0.046, lean: 0.030, squash: 0.014 },
  temple:     { stride: 38, bob: 1.8, sway: 0.030, lean: 0.016, squash: 0.010 }, // 飄逸
  altar:      { stride: 38, bob: 1.8, sway: 0.030, lean: 0.016, squash: 0.010 },
  portal:     { stride: 38, bob: 1.8, sway: 0.028, lean: 0.016, squash: 0.010 },
  witchdoctor:{ stride: 28, bob: 3.0, sway: 0.050, lean: 0.030, squash: 0.016 },
  fisher:     { stride: 32, bob: 3.2, sway: 0.038, lean: 0.044, squash: 0.020 },
  smuggler:   { stride: 24, bob: 2.4, sway: 0.024, lean: 0.070, squash: 0.014 }, // 躡手躡腳
};

// 全域增益：數值是照 150px 高的角色調的，實機看起來偏收斂時集中在這裡一起放大
const GAIN_BOB = 1.4;
const GAIN_ROT = 1.3;

export function npcRole(frame) {
  const m = /_npc_(.+)$/.exec(frame || '');
  return m ? m[1] : 'default';
}

export function npcProfile(frame) {
  return PROFILES[npcRole(frame)] || PROFILES.default;
}

function approach(cur, target, k) {
  return cur + (target - cur) * Math.min(1, k);
}

// 每幀呼叫一次。
//   sp        NPC 精靈（原點需為 0.5 / 0.92 附近）
//   frame     角色圖集前綴，例如 'ch2_npc_guard'
//   dt        秒
//   moved     這一幀實際位移距離（px）；沒走就傳 0
//   dx        這一幀水平位移（用來決定前傾方向）
//   opts.breath  待機呼吸（縮放倍率，預設 1）
//   opts.shadow  腳下影子（會依起伏縮放）
export function npcGaitStep(sp, frame, dt, moved, dx, opts = {}) {
  if (!sp || !sp.active || !(dt > 0)) return 0;
  const prof = npcProfile(frame);
  let g = sp.__gait;
  if (!g) {
    g = sp.__gait = {
      baseSx: Math.abs(sp.scaleX) || 0.62,
      baseSy: Math.abs(sp.scaleY) || 0.62,
      baseOy: sp.originY,
      amp: 0,
      phase: Math.random() * Math.PI * 2,
      dir: 1,
      shSx: opts.shadow ? opts.shadow.scaleX : 1,
      shSy: opts.shadow ? opts.shadow.scaleY : 1,
      shA: opts.shadow ? opts.shadow.alpha : 1,
    };
  }
  const speed = moved / dt;
  g.amp = approach(g.amp, speed > 3 ? Math.min(1, speed / 14) : 0, dt * (speed > 3 ? 12 : 9));
  if (Math.abs(dx) > 0.04) g.dir = dx > 0 ? 1 : -1;
  if (moved > 0) g.phase += (moved / prof.stride) * Math.PI * 2;

  const a = g.amp < 0.01 ? 0 : g.amp;
  const s = Math.sin(g.phase);
  const lift = Math.abs(s) * a;              // 0..1，兩腳交替各一次
  const land = 1 - Math.abs(s);              // 落地瞬間最大
  const breath = opts.breath ?? 1;

  const liftPx = lift * prof.bob * GAIN_BOB;
  const dispH = Math.max(1, (sp.height || 242) * g.baseSy);
  sp.setOrigin(0.5, g.baseOy + liftPx / dispH);
  sp.setRotation((s * prof.sway + g.dir * prof.lean) * a * GAIN_ROT);
  sp.setScale(g.baseSx, g.baseSy * breath * (1 - prof.squash * land * a + prof.squash * 0.5 * lift));

  if (opts.shadow && opts.shadow.active) {
    const k = 1 - 0.16 * lift;
    opts.shadow.setScale(g.shSx * k, g.shSy * k);
    opts.shadow.setAlpha(g.shA * (1 - 0.18 * lift));
  }
  return lift;
}
