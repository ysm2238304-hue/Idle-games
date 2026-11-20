export const MONSTER_TEMPLATES = {
  goblin: {
    id: 'goblin',
    name: '哥布林掠奪者',
    spriteKey: 'mob_goblin',
    scale: 0.42,
    speed: 112,
    hpMult: 0.85,
    atkMult: 0.85,
    goldMult: 1.0,
    expMult: 1.0,
    isBoss: false,
    isRanged: false,
    moveStyle: 'hop',
    atkStyle: 'claw',
  },
  spider: {
    id: 'spider',
    name: '劇毒巨蛛',
    spriteKey: 'mob_spider',
    scale: 0.42,
    speed: 132,
    hpMult: 0.72,
    atkMult: 0.8,
    goldMult: 0.9,
    expMult: 0.95,
    isBoss: false,
    isRanged: false,
    moveStyle: 'scuttle',
    atkStyle: 'venom',
  },
  skeleton: {
    id: 'skeleton',
    name: '骸骨騎士',
    spriteKey: 'mob_skeleton',
    scale: 0.46,
    speed: 92,
    hpMult: 1.2,
    atkMult: 1.05,
    goldMult: 1.3,
    expMult: 1.25,
    isBoss: false,
    isRanged: false,
    moveStyle: 'march',
    atkStyle: 'slash',
  },
  imp: {
    id: 'imp',
    name: '深淵小惡魔',
    spriteKey: 'mob_imp',
    scale: 0.42,
    speed: 118,
    hpMult: 0.9,
    atkMult: 1.0,
    goldMult: 1.15,
    expMult: 1.15,
    isBoss: false,
    isRanged: true,
    moveStyle: 'hover',
    atkStyle: 'imp_fire',
  },
  orc: {
    id: 'orc',
    name: '重甲獸人戰士',
    spriteKey: 'mob_orc',
    scale: 0.54,
    speed: 74,
    hpMult: 1.85,
    atkMult: 1.25,
    goldMult: 1.9,
    expMult: 1.75,
    isBoss: false,
    isRanged: false,
    moveStyle: 'heavy',
    atkStyle: 'smash',
  },
  necromancer: {
    id: 'necromancer',
    name: '墮落死靈法師',
    spriteKey: 'mob_necromancer',
    scale: 0.46,
    speed: 82,
    hpMult: 0.95,
    atkMult: 1.1,
    goldMult: 1.5,
    expMult: 1.4,
    isBoss: false,
    isRanged: true,
    moveStyle: 'float',
    atkStyle: 'necro_orb',
  },
  boss_demon: {
    id: 'boss_demon',
    name: '深淵魔王・馬爾薩斯',
    spriteKey: 'mob_boss_demon',
    scale: 0.70,
    speed: 82,
    hpMult: 5.5,
    atkMult: 1.75,
    goldMult: 6.0,
    expMult: 5.0,
    isBoss: true,
    isRanged: false,
    moveStyle: 'heavy',
    atkStyle: 'boss_cleave',
    timeLimitSec: 32,
  },
};

export const STAGE_ZONES = [
  '腐朽邊境營地',
  '幽暗哥布林巢穴',
  '白骨墓穴長廊',
  '焦土熔岩裂谷',
  '深淵魔王聖殿',
];

const ZONE_POOLS = [
  ['goblin', 'spider', 'orc'],
  ['goblin', 'imp', 'spider', 'orc'],
  ['skeleton', 'necromancer', 'spider'],
  ['imp', 'orc', 'skeleton', 'necromancer'],
  ['imp', 'necromancer', 'orc', 'skeleton'],
];

export function getZoneName(stage) {
  const idx = Math.floor((stage - 1) / 3) % STAGE_ZONES.length;
  return STAGE_ZONES[idx];
}

export function getWaveTargetKills(stage, wave) {
  if (wave >= 5) return 1; // 第 5 波擊殺 BOSS 即通關
  return 10 + Math.min(14, Math.floor((stage - 1) * 0.7) + wave * 2);
}

export function createWaveSquad(stage, wave) {
  const zoneIdx = Math.floor((stage - 1) / 3) % ZONE_POOLS.length;
  const pool = ZONE_POOLS[zoneIdx];
  const squad = [];
  const scaleFactor = 1 + (stage - 1) * 0.24 + (wave - 1) * 0.08;

  const isBossWave = wave >= 5;
  const count = isBossWave ? 4 : Math.min(12, 6 + Math.floor(stage * 0.35) + wave);

  for (let i = 0; i < count; i++) {
    const key = pool[i % pool.length];
    const tpl = MONSTER_TEMPLATES[key];
    squad.push(buildMonster(tpl, stage, scaleFactor, i));
  }

  if (isBossWave) {
    squad.push(buildMonster(MONSTER_TEMPLATES.boss_demon, stage, scaleFactor, 999));
  }

  return squad;
}

export function spawnSingleMonster(stage, wave, allowElite = false) {
  const zoneIdx = Math.floor((stage - 1) / 3) % ZONE_POOLS.length;
  const pool = ZONE_POOLS[zoneIdx];
  const scaleFactor = 1 + (stage - 1) * 0.24 + (wave - 1) * 0.08;
  const key = pool[Math.floor(Math.random() * pool.length)];
  const tpl = MONSTER_TEMPLATES[key];
  const uid = Date.now() + Math.random();
  return buildMonster(tpl, stage, scaleFactor, uid, allowElite);
}

function buildMonster(tpl, stage, scaleFactor, idx) {
  const baseHp = 48 * scaleFactor;
  const baseAtk = 6.5 * (1 + (stage - 1) * 0.19);
  const baseGold = 7 * (1 + (stage - 1) * 0.28);
  const baseExp = 12 * (1 + (stage - 1) * 0.24);

  return {
    uid: `m_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
    id: tpl.id,
    name: tpl.name,
    spriteKey: tpl.spriteKey,
    scale: tpl.scale,
    speed: tpl.speed,
    isBoss: tpl.isBoss,
    isRanged: tpl.isRanged,
    moveStyle: tpl.moveStyle || 'hop',
    atkStyle: tpl.atkStyle || 'claw',
    maxHp: Math.round(baseHp * tpl.hpMult),
    hp: Math.round(baseHp * tpl.hpMult),
    atk: Math.round(baseAtk * tpl.atkMult),
    gold: Math.round(baseGold * tpl.goldMult),
    exp: Math.round(baseExp * tpl.expMult),
    atkIntervalMs: tpl.isBoss ? 1450 : (tpl.isRanged ? 1950 : 1550),
    stage,
  };
}
