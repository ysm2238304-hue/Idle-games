// 30 隻「技能特效＆衍生型」寵物資料庫 (v83)
// 與裝備做出本質差異：寵物不加基礎面板，而是改變技能視覺特效並衍生額外攻擊機制
import { RARITIES } from './items.js?v=99';

export const PET_SCHOOLS = {
  fire:      { id: 'fire',      label: '熾炎衍生', color: '#f97316', fxKey: 'mfx_meteor_flame', derivative: 'fire_wave' },
  lightning: { id: 'lightning', label: '雷霆電弧', color: '#38bdf8', fxKey: 'nfx_lightning',    derivative: 'chain_arc' },
  frost:     { id: 'frost',     label: '極寒冰爆', color: '#67e8f9', fxKey: 'mfx_frost_burst',  derivative: 'frost_nova' },
  shadow:    { id: 'shadow',    label: '冥魂追蹤', color: '#c084fc', fxKey: 'nfx_p_wraith',     derivative: 'shadow_bolt' },
  holy:      { id: 'holy',      label: '聖光天罰', color: '#fde047', fxKey: 'pfx_heaven',       derivative: 'holy_pillar' },
  void:      { id: 'void',      label: '虛空奇點', color: '#a855f7', fxKey: 'nfx_blackhole',    derivative: 'void_pull' },
};

export const PET_CATALOG = [
  // === 普通 (Common) 6 隻 ===
  { id: 'pet_c1', name: '火精靈幼雛',   rarity: 'common', school: 'fire',      emoji: '🔥', tint: 0xf97316, bonusHits: 1, dmgMult: 0.35, desc: '技能附帶熾炎餘燼特效，命中時衍生 1 道小型火焰衝擊波。' },
  { id: 'pet_c2', name: '電光小飛蛾',   rarity: 'common', school: 'lightning', emoji: '⚡', tint: 0x38bdf8, bonusHits: 1, dmgMult: 0.35, desc: '技能轉為電藍閃光，額外釋放 1 道連鎖電弧彈射鄰近敵人。' },
  { id: 'pet_c3', name: '雪球小精靈',   rarity: 'common', school: 'frost',     emoji: '❄️', tint: 0x67e8f9, bonusHits: 1, dmgMult: 0.32, desc: '技能附帶寒氣結晶特效，命中周圍產生小型冰霜波紋。' },
  { id: 'pet_c4', name: '幽影小蝙蝠',   rarity: 'common', school: 'shadow',    emoji: '🦇', tint: 0xc084fc, bonusHits: 1, dmgMult: 0.35, desc: '技能染上紫黑暗影，施放時衍生 1 枚追蹤魂火彈。' },
  { id: 'pet_c5', name: '微光小燈靈',   rarity: 'common', school: 'holy',      emoji: '✨', tint: 0xfde047, bonusHits: 1, dmgMult: 0.32, desc: '技能閃耀金色聖輝，於目標頭頂降下 1 道小型聖光柱。' },
  { id: 'pet_c6', name: '星塵小水母',   rarity: 'common', school: 'void',      emoji: '🌌', tint: 0xa855f7, bonusHits: 1, dmgMult: 0.32, desc: '技能呈現星界紫暈，於落點產生微幅虛空引力牽引敵人。' },

  // === 魔法 (Magic) 6 隻 ===
  { id: 'pet_m1', name: '熔岩小火蜥',   rarity: 'magic',  school: 'fire',      emoji: '🦎', tint: 0xfb923c, bonusHits: 2, dmgMult: 0.48, desc: '技能附加熔岩爆裂特效，衍生 2 道扇形火焰波灼燒前方敵群。' },
  { id: 'pet_m2', name: '風暴藍雀',     rarity: 'magic',  school: 'lightning', emoji: '🐦', tint: 0x0ea5e9, bonusHits: 2, dmgMult: 0.48, desc: '技能伴隨雷雲閃爍，衍生 2 段高壓電弧在敵群間跳躍。' },
  { id: 'pet_m3', name: '極地霜狼崽',   rarity: 'magic',  school: 'frost',     emoji: '🐺', tint: 0x22d3ee, bonusHits: 2, dmgMult: 0.45, desc: '技能附帶冰晶碎裂特效，觸發中型寒冰新星緩速周圍怪物。' },
  { id: 'pet_m4', name: '暗影幼貓',     rarity: 'magic',  school: 'shadow',    emoji: '🐈‍⬛', tint: 0xa855f7, bonusHits: 2, dmgMult: 0.48, desc: '技能伴隨影刃殘像，衍生 2 枚暗影追蹤彈貫穿殘血敵人。' },
  { id: 'pet_m5', name: '聖殿小獅鷲',   rarity: 'magic',  school: 'holy',      emoji: '🦁', tint: 0xfacc15, bonusHits: 2, dmgMult: 0.45, desc: '技能附帶金羽聖印，衍生 2 道聖光天罰並回復 2% 最大生命。' },
  { id: 'pet_m6', name: '星界小靈狐',   rarity: 'magic',  school: 'void',      emoji: '🦊', tint: 0xc084fc, bonusHits: 2, dmgMult: 0.45, desc: '技能附加星軌殘影，生成小型黑洞奇點聚攏半徑內怪物。' },

  // === 稀有 (Rare) 6 隻 ===
  { id: 'pet_r1', name: '炎魔小惡魔',   rarity: 'rare',   school: 'fire',      emoji: '👿', tint: 0xef4444, bonusHits: 3, dmgMult: 0.65, desc: '所有技能化為地獄紅蓮特效，衍生 3 道烈焰衝擊波連環炸裂。' },
  { id: 'pet_r2', name: '雷霆天鷹',     rarity: 'rare',   school: 'lightning', emoji: '🦅', tint: 0x38bdf8, bonusHits: 3, dmgMult: 0.65, desc: '技能觸發蒼穹落雷特效，衍生 3 段連鎖閃電貫穿整群目標。' },
  { id: 'pet_r3', name: '冰晶鳳凰雛',   rarity: 'rare',   school: 'frost',     emoji: '🕊️', tint: 0x38bdf8, bonusHits: 3, dmgMult: 0.62, desc: '技能轉為極光冰華特效，引爆大型寒冰新星並凍結敵人節奏。' },
  { id: 'pet_r4', name: '冥界渡鴉',     rarity: 'rare',   school: 'shadow',    emoji: '🐦‍⬛', tint: 0x9333ea, bonusHits: 3, dmgMult: 0.65, desc: '技能染上冥界鬼火，衍生 3 隻追蹤怨靈直撲敵方引爆。' },
  { id: 'pet_r5', name: '熾光獨角獸',   rarity: 'rare',   school: 'holy',      emoji: '🦄', tint: 0xfde047, bonusHits: 3, dmgMult: 0.62, desc: '技能綻放虹彩聖光，降下 3 道審判光柱並為英雄回復 3% 生命。' },
  { id: 'pet_r6', name: '虛空眼魔',     rarity: 'rare',   school: 'void',      emoji: '👁️', tint: 0x8b5cf6, bonusHits: 3, dmgMult: 0.62, desc: '技能附帶扭曲空間波紋，展開強力虛空奇點將怪物拉向中心。' },

  // === 傳奇 (Legendary) 6 隻 ===
  { id: 'pet_l1', name: '赤炎幼龍',     rarity: 'legendary', school: 'fire',      emoji: '🐉', tint: 0xf97316, bonusHits: 4, dmgMult: 0.88, desc: '技能全面附帶龍息烈焰特效，施放後衍生 4 道毀滅火龍衝擊波。' },
  { id: 'pet_l2', name: '風暴雷龍',     rarity: 'legendary', school: 'lightning', emoji: '⚡', tint: 0x60a5fa, bonusHits: 4, dmgMult: 0.88, desc: '技能伴隨狂暴雷域特效，衍生 4 道高頻天雷連鎖轟擊全場。' },
  { id: 'pet_l3', name: '永凍冰龍',     rarity: 'legendary', school: 'frost',     emoji: '❄️', tint: 0x67e8f9, bonusHits: 4, dmgMult: 0.85, desc: '技能化為萬年冰封特效，連續引爆雙重極寒新星碎裂群怪。' },
  { id: 'pet_l4', name: '深淵死神鴉',   rarity: 'legendary', school: 'shadow',    emoji: '💀', tint: 0xa855f7, bonusHits: 4, dmgMult: 0.88, desc: '技能附帶死神鐮影特效，衍生 4 枚高傷索敵冥魂飛彈齊射。' },
  { id: 'pet_l5', name: '聖光小天使',   rarity: 'legendary', school: 'holy',      emoji: '👼', tint: 0xfef08a, bonusHits: 4, dmgMult: 0.85, desc: '技能獲得天使聖詠光環，降下 4 道天界光柱並回復 5% 生命。' },
  { id: 'pet_l6', name: '星界幻靈',     rarity: 'legendary', school: 'void',      emoji: '🌠', tint: 0xc084fc, bonusHits: 4, dmgMult: 0.85, desc: '技能化為星辰碎裂特效，生成大範圍黑洞奇點聚怪並引爆星爆。' },

  // === 神話套裝綠 (Set) 6 隻 ===
  { id: 'pet_s1', name: '滅世炎魔龍',   rarity: 'set',    school: 'fire',      emoji: '🌋', tint: 0xef4444, bonusHits: 5, dmgMult: 1.15, desc: '【太古變異】技能化為焚天黑炎特效，衍生 5 道煉獄火柱連環爆破！' },
  { id: 'pet_s2', name: '天譴雷神獸',   rarity: 'set',    school: 'lightning', emoji: '🌩️', tint: 0x38bdf8, bonusHits: 5, dmgMult: 1.15, desc: '【太古變異】技能引動九霄神雷特效，衍生 5 段毀滅電弧全場彈射！' },
  { id: 'pet_s3', name: '極光蒼穹龍',   rarity: 'set',    school: 'frost',     emoji: '🧊', tint: 0x22d3ee, bonusHits: 5, dmgMult: 1.12, desc: '【太古變異】技能展開極光領域特效，觸發全場絕對零度冰爆！' },
  { id: 'pet_s4', name: '冥界骨龍王',   rarity: 'set',    school: 'shadow',    emoji: '🦴', tint: 0x2dd4bf, bonusHits: 5, dmgMult: 1.15, desc: '【太古變異】技能喚起亡靈潮汐特效，齊射 5 道冥界骨龍魂火彈幕！' },
  { id: 'pet_s5', name: '熾天使聖靈',   rarity: 'set',    school: 'holy',      emoji: '☀️', tint: 0xfacc15, bonusHits: 5, dmgMult: 1.12, desc: '【太古變異】技能降下黃金聖殿裁決，衍生 5 道神聖光柱並回血 8%！' },
  { id: 'pet_s6', name: '混沌星神體',   rarity: 'set',    school: 'void',      emoji: '🌀', tint: 0x4ade80, bonusHits: 5, dmgMult: 1.15, desc: '【太古變異】技能撕裂深淵星界，觸發超重力黑洞奇點聚怪引爆！' },
];

PET_CATALOG.forEach((p) => { p.icon = `./assets/pets/${p.id}.png?v=90`; });

export function getPetDef(petId) {
  return PET_CATALOG.find((p) => p.id === petId) || null;
}

export function rollPetDrop(stage = 1, isBoss = false, magicFindPct = 0) {
  const chance = isBoss ? Math.min(35, 14 + magicFindPct * 0.08) : Math.min(4.5, 1.4 + magicFindPct * 0.02);
  if (Math.random() * 100 > chance) return null;
  const mfMult = 1 + Math.min(1.5, magicFindPct / 150);
  const r = Math.random() * 100;
  let rarity = 'common';
  if (r < (isBoss ? 4 : 0.8) * mfMult) rarity = 'set';
  else if (r < (isBoss ? 14 : 3.5) * mfMult) rarity = 'legendary';
  else if (r < (isBoss ? 34 : 14) * mfMult) rarity = 'rare';
  else if (r < (isBoss ? 65 : 42) * mfMult) rarity = 'magic';
  const pool = PET_CATALOG.filter((p) => p.rarity === rarity);
  const tpl = pool[Math.floor(Math.random() * pool.length)] || PET_CATALOG[0];
  return {
    uid: `pet_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    petId: tpl.id,
    name: tpl.name,
    rarity: tpl.rarity,
    school: tpl.school,
    emoji: tpl.emoji,
    obtainedAt: Date.now(),
  };
}

export function getPetRarityMeta(rarity) {
  return RARITIES[rarity] || RARITIES.common;
}

export function getPetPickupRadius(petDef, upgLv = 0) {
  if (!petDef) return 58;
  const rarBase = { common: 110, magic: 130, rare: 150, legendary: 175, set: 195 }[petDef.rarity] || 110;
  return Math.min(240, rarBase + (upgLv || 0) * 5);
}

export function getPetCodexInfo(pets = [], unlockedIds = []) {
  const s = new Set(unlockedIds || []);
  for (const p of pets || []) if (p?.petId) s.add(p.petId);
  const count = s.size;
  let bonusPct = 0;
  if (count >= 30) bonusPct = 100;
  else if (count >= 20) bonusPct = 50;
  else if (count >= 10) bonusPct = 25;
  else if (count >= 5) bonusPct = 10;
  return { unlockedSet: s, count, total: PET_CATALOG.length, bonusPct };
}
