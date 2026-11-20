export const EQUIP_SLOTS = {
  weapon: { id: 'weapon', label: '武器', icon: '⚔️' },
  helm:   { id: 'helm',   label: '頭盔', icon: '🪖' },
  armor:  { id: 'armor',  label: '胸甲', icon: '🛡️' },
  boots:  { id: 'boots',  label: '戰靴', icon: '🥾' },
  ring:   { id: 'ring',   label: '戒指', icon: '💍' },
  amulet: { id: 'amulet', label: '護符', icon: '📿' },
};

export const RARITIES = {
  common:    { id: 'common',    label: '普通', color: '#cbd5e1', border: '#64748b', bg: 'rgba(100,116,139,0.16)', affixes: [0, 0], mult: 1.0, beam: 0xe2e8f0 },
  magic:     { id: 'magic',     label: '魔法', color: '#38bdf8', border: '#0284c7', bg: 'rgba(56,189,248,0.14)',  affixes: [1, 2], mult: 1.25, beam: 0x38bdf8 },
  rare:      { id: 'rare',      label: '稀有', color: '#facc15', border: '#ca8a04', bg: 'rgba(250,204,21,0.14)',  affixes: [3, 4], mult: 1.55, beam: 0xfacc15 },
  legendary: { id: 'legendary', label: '傳奇', color: '#fb923c', border: '#ea580c', bg: 'rgba(251,146,60,0.18)',  affixes: [4, 4], mult: 2.0,  beam: 0xf97316 },
};

export const BASE_ITEMS = {
  weapon: [
    { name: '生鏽長劍', baseStat: 'atkFlat', baseVal: 6 },
    { name: '精鋼戰刃', baseStat: 'atkFlat', baseVal: 12 },
    { name: '暗影獵弓', baseStat: 'atkFlat', baseVal: 18 },
    { name: '獄火巨劍', baseStat: 'atkFlat', baseVal: 26 },
  ],
  helm: [
    { name: '皮質兜帽', baseStat: 'hpFlat', baseVal: 25 },
    { name: '鐵衛戰盔', baseStat: 'hpFlat', baseVal: 45 },
    { name: '秘法頭冠', baseStat: 'hpFlat', baseVal: 70 },
    { name: '深淵角盔', baseStat: 'hpFlat', baseVal: 105 },
  ],
  armor: [
    { name: '粗布護胸', baseStat: 'armorFlat', baseVal: 4 },
    { name: '鎖子甲衣', baseStat: 'armorFlat', baseVal: 9 },
    { name: '黑鐵板甲', baseStat: 'armorFlat', baseVal: 15 },
    { name: '煉獄龍鎧', baseStat: 'armorFlat', baseVal: 24 },
  ],
  boots: [
    { name: '旅人長靴', baseStat: 'dodge', baseVal: 2 },
    { name: '疾風戰靴', baseStat: 'dodge', baseVal: 4 },
    { name: '影步軟靴', baseStat: 'dodge', baseVal: 6 },
    { name: '踏火魔靴', baseStat: 'dodge', baseVal: 9 },
  ],
  ring: [
    { name: '銅製指環', baseStat: 'critRate', baseVal: 2 },
    { name: '血石戒指', baseStat: 'critRate', baseVal: 4 },
    { name: '星輝魔戒', baseStat: 'critRate', baseVal: 6 },
    { name: '毀滅之戒', baseStat: 'critRate', baseVal: 9 },
  ],
  amulet: [
    { name: '骨製護符', baseStat: 'hpFlat', baseVal: 20 },
    { name: '聖光項鍊', baseStat: 'hpFlat', baseVal: 40 },
    { name: '龍魂吊墜', baseStat: 'hpFlat', baseVal: 65 },
    { name: '永恆之心', baseStat: 'hpFlat', baseVal: 100 },
  ],
};

export const AFFIX_POOL = [
  { key: 'atkFlat',     label: '攻擊力',     unit: '',  min: 3,  max: 8,   scalePerLvl: 1.15 },
  { key: 'atkPct',      label: '攻擊加成',   unit: '%', min: 4,  max: 14,  scalePerLvl: 0.25 },
  { key: 'hpFlat',      label: '最大生命',   unit: '',  min: 18, max: 45,  scalePerLvl: 4.5 },
  { key: 'hpPct',       label: '生命加成',   unit: '%', min: 4,  max: 12,  scalePerLvl: 0.2 },
  { key: 'armorFlat',   label: '護甲值',     unit: '',  min: 2,  max: 7,   scalePerLvl: 0.7 },
  { key: 'critRate',    label: '暴擊率',     unit: '%', min: 2,  max: 6,   scalePerLvl: 0.08 },
  { key: 'critDmg',     label: '暴擊傷害',   unit: '%', min: 8,  max: 24,  scalePerLvl: 0.45 },
  { key: 'atkSpeedPct', label: '攻擊速度',   unit: '%', min: 3,  max: 10,  scalePerLvl: 0.12 },
  { key: 'lifesteal',   label: '攻擊吸血',   unit: '%', min: 1,  max: 4,   scalePerLvl: 0.05 },
  { key: 'goldFind',    label: '金幣掉落',   unit: '%', min: 6,  max: 18,  scalePerLvl: 0.35 },
  { key: 'magicFind',   label: '掉寶率(MF)', unit: '%', min: 5,  max: 16,  scalePerLvl: 0.3 },
];

export const LEGENDARY_EFFECTS = [
  { id: 'chain_lightning', name: '風暴怒雷', desc: '暴擊時額外引發閃電造成 45% 攻擊傷害' },
  { id: 'execute',         name: '處決者',   desc: '對生命低於 35% 的敵人造成 +35% 傷害' },
  { id: 'vampiric_aura',   name: '鮮血契約', desc: '擊殺敵人時額外回復 8% 最大生命' },
  { id: 'greed_blessing',  name: '貪婪之魂', desc: '擊殺怪物金幣掉落額外 +35%' },
];
