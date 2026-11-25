/**
 * endgameSystems.js (v237 - 第 5 批：傳奇威能法典刻印 + Lv.50 深淵巔峰盤＆雕紋)
 */

// =========================================================================
// 1. 傳奇威能法典（Codex of Power：18 種傳奇技能威能）
// =========================================================================
export const ASPECT_CATALOG = [
  // 通用 6 種
  { id: 'asp_edgemaster',      cls: 'all', name: '鋒刃大師之威能',   color: '#fbbf24', dustCost: 120, goldCost: 5000,  stats: { skillDmgPct: 35 },                 desc: '能量充盈時全技能傷害 +35%（武器槽放大至 +52%）。' },
  { id: 'asp_disobedience',    cls: 'all', name: '違抗鐵壁之威能',   color: '#60a5fa', dustCost: 120, goldCost: 5000,  stats: { armorPct: 45, maxHpPct: 18 },      desc: '護甲 +45%、最大生命 +18%，站樁硬度質變。' },
  { id: 'asp_inner_calm',      cls: 'all', name: '靜心蓄勢之威能',   color: '#fde047', dustCost: 140, goldCost: 6000,  stats: { atkPct: 28 },                      desc: '基礎攻擊力 +28%，所有流派通用的硬核乘區。' },
  { id: 'asp_accelerating',    cls: 'all', name: '疾風暴擊之威能',   color: '#34d399', dustCost: 150, goldCost: 6500,  stats: { atkSpeedPct: 24, critRate: 8 },    desc: '攻速 +24%、暴擊率 +8%，大幅加快狀態疊層節奏。' },
  { id: 'asp_overpower_surge', cls: 'all', name: '壓制潮汐之威能',   color: '#38bdf8', dustCost: 160, goldCost: 7000,  stats: { overpowerPct: 12, critDmg: 40 },   desc: '壓制觸發率 +12%、暴擊傷害 +40%。' },
  { id: 'asp_lucky_echo',      cls: 'all', name: '幸運共鳴之威能',   color: '#c084fc', dustCost: 160, goldCost: 7000,  stats: { luckyPct: 14, mpRegenPct: 35 },    desc: '幸運一擊率 +14%、資源回復 +35%。' },

  // 6 職業各 2 種專屬威能
  { id: 'asp_w_dust_devil',    cls: 'warrior',  name: '狂沙塵魔之威能',   color: '#f87171', dustCost: 180, goldCost: 8000, stats: { skillDmgPct: 28 }, proc: 'dust_devil',     desc: '技能傷害 +28%，命中 30% 機率召喚塵魔血浪（95% 傷＋流血）。' },
  { id: 'asp_w_earthstriker',  cls: 'warrior',  name: '大地重擊者威能',   color: '#fb923c', dustCost: 180, goldCost: 8000, stats: { overpowerPct: 15, critDmg: 55 },               desc: '壓制觸發率 +15%、暴傷 +55%，極致重錘與地震爆發。' },
  { id: 'asp_r_bladedancer',   cls: 'ranger',   name: '暗影毒舞之威能',   color: '#4ade80', dustCost: 180, goldCost: 8000, stats: { skillDmgPct: 45 },                             desc: '中毒與暗影流派技能傷害 +45%，大幅拉高箭雨與毒矛上限。' },
  { id: 'asp_r_shadow_slicer', cls: 'ranger',   name: '幽影裂片之威能',   color: '#c084fc', dustCost: 180, goldCost: 8000, stats: { critRate: 10 }, proc: 'shadow_slicer',         desc: '暴擊率 +10%，暴擊時 30% 機率額外射出 110% 追蹤暗影矢。' },
  { id: 'asp_m_control',       cls: 'mage',     name: '元素掌控之威能',   color: '#38bdf8', dustCost: 180, goldCost: 8000, stats: { skillDmgPct: 45, luckyPct: 8 },                desc: '三系元素技能傷害 +45%、幸運一擊率 +8%。' },
  { id: 'asp_m_ancient_flame', cls: 'mage',     name: '上古烈焰之威能',   color: '#fb923c', dustCost: 180, goldCost: 8000, stats: { atkSpeedPct: 25, maxMpPct: 45 },               desc: '攻速 +25%、最大魔力 +45%，火蛇與隕石連轟不卡魔。' },
  { id: 'asp_p_blessed_shield',cls: 'paladin',  name: '聖盾懲戒之威能',   color: '#fde047', dustCost: 180, goldCost: 8000, stats: { armorPct: 35, armorToAtkPct: 120 },            desc: '護甲 +35%，並將 120% 護甲值轉化為額外神聖攻擊力！' },
  { id: 'asp_p_seraph_wrath',  cls: 'paladin',  name: '熾天使之怒威能',   color: '#fbbf24', dustCost: 180, goldCost: 8000, stats: { critDmg: 75, skillDmgPct: 25 },                desc: '暴擊傷害 +75%、聖光技能傷害 +25%。' },
  { id: 'asp_n_splintering',   cls: 'necro',    name: '分裂骨片之威能',   color: '#e2e8f0', dustCost: 180, goldCost: 8000, stats: { skillDmgPct: 45, critRate: 10 },               desc: '白骨與暗影技能傷害 +45%、暴擊率 +10%。' },
  { id: 'asp_n_frenzied_dead', cls: 'necro',    name: '狂熱亡軍之威能',   color: '#2dd4bf', dustCost: 180, goldCost: 8000, stats: { atkSpeedPct: 28, lifesteal: 8 },               desc: '攻速 +28%、吸血 +8%，亡靈軍團與血湧全面狂暴。' },
  { id: 'asp_a_corrupting',    cls: 'assassin', name: '腐蝕劇毒之威能',   color: '#4ade80', dustCost: 180, goldCost: 8000, stats: { skillDmgPct: 52 },                             desc: '毒素與流血技能傷害 +52%，煉獄毒爆核心威能。' },
  { id: 'asp_a_clone_echo',    cls: 'assassin', name: '千影回響之威能',   color: '#e879f9', dustCost: 180, goldCost: 8000, stats: { critDmg: 45 }, proc: 'clone_echo',             desc: '暴傷 +45%，技能命中 30% 機率由暗影分身追加 65% 影斬！' },
];

export const IMPRINT_SLOTS = [
  { idx: 0, label: '武器威能槽', mult: 1.50, desc: '威能數值放大 150%' },
  { idx: 1, label: '護符威能槽', mult: 1.25, desc: '威能數值放大 125%' },
  { idx: 2, label: '戒指威能槽', mult: 1.00, desc: '威能標準 100% 數值' },
];

// =========================================================================
// 2. Lv.50 深淵巔峰盤（7×7 = 49 格棋盤連線）＆ 6 款可升級雕紋（Lv.1～21）
// =========================================================================
export const PARAGON_GLYPHS = [
  { id: 'gly_exploit',   name: '弱點洞悉雕紋', color: '#c084fc', perLv: { skillDmgPct: 3.5 }, desc: '每級全技能傷害 +3.5%（鄰近每點亮 1 格額外 +1.5%）。' },
  { id: 'gly_wrath',     name: '狂怒暴殺雕紋', color: '#f87171', perLv: { critDmg: 6 },       desc: '每級暴擊傷害 +6%（鄰近每點亮 1 格額外 +3%）。' },
  { id: 'gly_territorial',name: '鐵壁領主雕紋',color: '#60a5fa', perLv: { armorPct: 4, maxHpPct: 2.5 }, desc: '每級護甲 +4%、生命 +2.5%。' },
  { id: 'gly_dominate',  name: '壓制霸主雕紋', color: '#38bdf8', perLv: { overpowerPct: 1.2, atkPct: 2.5 }, desc: '每級壓制率 +1.2%、攻擊力 +2.5%。' },
  { id: 'gly_luckstar',  name: '星辰幸運雕紋', color: '#fde047', perLv: { luckyPct: 1.2, critRate: 0.8 },   desc: '每級幸運一擊率 +1.2%、暴擊率 +0.8%。' },
  { id: 'gly_leech',     name: '噬血永恆雕紋', color: '#4ade80', perLv: { lifesteal: 0.6, atkSpeedPct: 1.8 }, desc: '每級吸血 +0.6%、攻速 +1.8%。' },
];

// 建構 7×7 棋盤（id = "r_c", 0..6）
function buildParagonBoard() {
  const nodes = {};
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      const id = `${r}_${c}`;
      let type = 'normal';
      let name = '深淵之力';
      let stats = {};
      if (r === 3 && c === 3) {
        type = 'start'; name = '巔峰起點'; stats = { atkPct: 5, maxHpPct: 5 };
      } else if ((r === 0 && c === 3) || (r === 6 && c === 3)) {
        type = 'legendary';
        if (r === 0) { name = '傳奇：深淵毀滅核心'; stats = { skillDmgPct: 28, atkPct: 18 }; }
        else { name = '傳奇：不朽星界核心'; stats = { armorPct: 35, maxHpPct: 35, mpRegenPct: 40 }; }
      } else if ((r === 3 && c === 0) || (r === 3 && c === 6)) {
        type = 'glyph'; name = c === 0 ? '雕紋插槽 I' : '雕紋插槽 II'; stats = {};
      } else if ((r === 1 && c === 1) || (r === 1 && c === 5) || (r === 5 && c === 1) || (r === 5 && c === 5)) {
        type = 'rare';
        if (r === 1 && c === 1) { name = '稀有：戰意爆發'; stats = { skillDmgPct: 18, atkPct: 10 }; }
        else if (r === 1 && c === 5) { name = '稀有：致命精準'; stats = { critRate: 6, critDmg: 25 }; }
        else if (r === 5 && c === 1) { name = '稀有：壓制之魂'; stats = { overpowerPct: 6, maxHpPct: 14 }; }
        else { name = '稀有：幸運星輝'; stats = { luckyPct: 6, atkSpeedPct: 10 }; }
      } else if (
        (r === 1 && c === 3) || (r === 5 && c === 3) || (r === 3 && c === 1) || (r === 3 && c === 5) ||
        (r === 2 && c === 2) || (r === 2 && c === 4) || (r === 4 && c === 2) || (r === 4 && c === 4)
      ) {
        type = 'magic';
        const mod = (r + c) % 4;
        if (mod === 0) { name = '魔法：鋒利'; stats = { atkPct: 9 }; }
        else if (mod === 1) { name = '魔法：暴烈'; stats = { critDmg: 16 }; }
        else if (mod === 2) { name = '魔法：迅捷'; stats = { atkSpeedPct: 6 }; }
        else { name = '魔法：堅韌'; stats = { armorPct: 12, maxHpPct: 8 }; }
      } else {
        const mod = (r * 7 + c) % 4;
        if (mod === 0) { name = '力量節點'; stats = { atkPct: 5 }; }
        else if (mod === 1) { name = '體魄節點'; stats = { maxHpPct: 6 }; }
        else if (mod === 2) { name = '護甲節點'; stats = { armorPct: 7 }; }
        else { name = '靈能節點'; stats = { maxMpPct: 6, skillDmgPct: 4 }; }
      }
      nodes[id] = { id, r, c, type, name, stats };
    }
  }
  return nodes;
}

export const PARAGON_BOARD = buildParagonBoard();

export function getTotalParagonPoints(level) {
  const lv = Math.max(1, Number(level) || 1);
  if (lv < 50) return 0;
  return (lv - 49) * 4;
}

export function getUnlockedParagonNodes(state) {
  const arr = Array.isArray(state?.paragonNodes) ? state.paragonNodes : [];
  const set = new Set(['3_3', ...arr]);
  return set;
}

export function canUnlockParagonNode(state, nodeId) {
  const set = getUnlockedParagonNodes(state);
  if (set.has(nodeId)) return false;
  const totalPts = getTotalParagonPoints(state?.level || 1);
  const spent = Math.max(0, set.size - 1);
  if (spent >= totalPts) return false;
  const node = PARAGON_BOARD[nodeId];
  if (!node) return false;
  const neighbors = [
    `${node.r - 1}_${node.c}`,
    `${node.r + 1}_${node.c}`,
    `${node.r}_${node.c - 1}`,
    `${node.r}_${node.c + 1}`,
  ];
  return neighbors.some((nid) => set.has(nid));
}

export function getGlyphUpgradeCost(lvl) {
  return Math.round(120 * Math.pow(1.28, Math.max(0, (lvl || 1) - 1)));
}

// 彙整傳奇威能＋深淵巔峰盤＋雕紋的全部加成（供 statCalc.js 與 BattleScene.js 呼叫）
export function calcEndgameBonuses(state) {
  const cid = state?.classId || 'warrior';
  const out = {
    atkPct: 0,
    maxHpPct: 0,
    maxMpPct: 0,
    mpRegenPct: 0,
    armorPct: 0,
    armorToAtkPct: 0,
    atkSpeedPct: 0,
    critRate: 0,
    critDmg: 0,
    lifesteal: 0,
    skillDmgPct: 0,
    overpowerPct: 0,
    luckyPct: 0,
    activeProcs: new Set(),
  };

  const addStats = (stObj, mult = 1) => {
    if (!stObj) return;
    for (const [k, v] of Object.entries(stObj)) {
      if (typeof out[k] === 'number') out[k] += v * mult;
    }
  };

  // A. 3 槽傳奇威能刻印
  const imprints = state?.imprintedAspects?.[cid] || [null, null, null];
  IMPRINT_SLOTS.forEach((slot) => {
    const aid = imprints[slot.idx];
    if (!aid) return;
    const asp = ASPECT_CATALOG.find((x) => x.id === aid);
    if (!asp) return;
    addStats(asp.stats, slot.mult);
    if (asp.proc) out.activeProcs.add(asp.proc);
  });

  // B. 巔峰盤節點與雕紋
  const unlocked = getUnlockedParagonNodes(state);
  if (unlocked.size > 1) {
    unlocked.forEach((nid) => {
      const nd = PARAGON_BOARD[nid];
      if (nd) addStats(nd.stats, 1);
    });

    const glyphSlots = state?.paragonGlyphs || {};
    const glyphLevels = state?.glyphLevels || {};
    ['3_0', '3_6'].forEach((sockId) => {
      if (!unlocked.has(sockId)) return;
      const gid = glyphSlots[sockId];
      if (!gid) return;
      const gDef = PARAGON_GLYPHS.find((x) => x.id === gid);
      if (!gDef) return;
      const gLv = Math.max(1, Math.min(21, Number(glyphLevels[gid] || 1)));
      // 計算距離插槽曼哈頓距離 <= 2 的已點亮節點數作為共鳴倍率
      const sock = PARAGON_BOARD[sockId];
      let adjCount = 0;
      unlocked.forEach((nid) => {
        const nd = PARAGON_BOARD[nid];
        if (nd && nid !== sockId && (Math.abs(nd.r - sock.r) + Math.abs(nd.c - sock.c)) <= 2) {
          adjCount += 1;
        }
      });
      const resonanceMult = 1 + adjCount * 0.15;
      addStats(gDef.perLv, gLv * resonanceMult);
    });
  }

  return out;
}
