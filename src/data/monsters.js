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
  },
  imp: {
    id: 'imp',
    name: '深淵小惡魔',
    spriteKey: 'mob_imp',
    scale: 0.42,
    speed: 126,
    hpMult: 0.9,
    atkMult: 1.0,
    goldMult: 1.15,
    expMult: 1.15,
    isBoss: false,
    isRanged: false,
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

export function spawnSingleMonster(stage, wave, forceBoss = false) {
  const zoneIdx = Math.floor((stage - 1) / 3) % ZONE_POOLS.length;
  const pool = ZONE_POOLS[zoneIdx];
  const tplId = forceBoss ? 'boss_demon' : pool[Math.floor(Math.random() * pool.length)];
  const tpl = MONSTER_TEMPLATES[tplId];

  const stageHpScale = Math.pow(1.24, stage - 1);
  const stageAtkScale = Math.pow(1.16, stage - 1);
  const waveScale = 1 + (wave - 1) * 0.1;

  const maxHp = Math.max(18, Math.round(38 * stageHpScale * waveScale * tpl.hpMult));
  const atk = Math.max(2, Math.round(4 * stageAtkScale * tpl.atkMult));
  const gold = Math.max(2, Math.round((4 + stage * 2.2) * Math.pow(1.2, stage - 1) * tpl.goldMult));
  const exp = Math.max(4, Math.round((6 + stage * 2.5) * Math.pow(1.16, stage - 1) * tpl.expMult));

  return {
    uid: `${tpl.id}_s${stage}_w${wave}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    name: tpl.isBoss ? `【首領】${tpl.name}` : `Lv.${stage} ${tpl.name}`,
    spriteKey: tpl.spriteKey,
    scale: tpl.scale,
    speed: tpl.speed,
    isBoss: tpl.isBoss,
    isRanged: tpl.isRanged,
    timeLimitSec: tpl.timeLimitSec || 0,
    maxHp,
    hp: maxHp,
    atk,
    atkIntervalMs: tpl.isBoss ? 1550 : (tpl.isRanged ? 2200 : 1800),
    gold,
    exp,
    stage,
    wave,
  };
}

export function createWaveSquad(stage, wave) {
  const list = [];
  if (wave >= 5) {
    list.push(spawnSingleMonster(stage, wave, true));
    for (let i = 0; i < 3; i++) list.push(spawnSingleMonster(stage, wave, false));
  } else {
    for (let i = 0; i < 3; i++) list.push(spawnSingleMonster(stage, wave, false));
  }
  return list;
}
