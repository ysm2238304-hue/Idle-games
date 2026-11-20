export const MONSTER_TEMPLATES = {
  goblin: {
    id: 'goblin',
    name: '哥布林掠奪者',
    spriteKey: 'mob_goblin',
    scale: 0.44,
    speed: 105,
    hpMult: 1.0,
    atkMult: 0.9,
    goldMult: 1.0,
    expMult: 1.0,
    isBoss: false,
  },
  skeleton: {
    id: 'skeleton',
    name: '骸骨騎士',
    spriteKey: 'mob_skeleton',
    scale: 0.48,
    speed: 88,
    hpMult: 1.45,
    atkMult: 1.2,
    goldMult: 1.35,
    expMult: 1.25,
    isBoss: false,
  },
  boss_demon: {
    id: 'boss_demon',
    name: '深淵魔王・馬爾薩斯',
    spriteKey: 'mob_boss_demon',
    scale: 0.68,
    speed: 78,
    hpMult: 4.8,
    atkMult: 1.85,
    goldMult: 5.5,
    expMult: 4.5,
    isBoss: true,
    timeLimitSec: 28,
  },
};

export const STAGE_ZONES = [
  '腐朽邊境營地',
  '幽暗哥布林巢穴',
  '白骨墓穴長廊',
  '焦土熔岩裂谷',
  '深淵魔王聖殿',
];

export function getZoneName(stage) {
  const idx = Math.floor((stage - 1) / 3) % STAGE_ZONES.length;
  return STAGE_ZONES[idx];
}

function buildMobInstance(tpl, stage, wave, idx) {
  const stageHpScale = Math.pow(1.38, stage - 1);
  const stageAtkScale = Math.pow(1.28, stage - 1);
  const waveScale = 1 + (wave - 1) * 0.14;

  const maxHp = Math.round(68 * stageHpScale * waveScale * tpl.hpMult);
  const atk = Math.max(4, Math.round(6 * stageAtkScale * tpl.atkMult));
  const gold = Math.max(2, Math.round((4 + stage * 2.4) * Math.pow(1.22, stage - 1) * tpl.goldMult));
  const exp = Math.max(4, Math.round((7 + stage * 3) * Math.pow(1.18, stage - 1) * tpl.expMult));

  return {
    uid: `${tpl.id}_s${stage}_w${wave}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
    name: tpl.isBoss ? `【首領】${tpl.name}` : `Lv.${stage} ${tpl.name}`,
    spriteKey: tpl.spriteKey,
    scale: tpl.scale,
    speed: tpl.speed,
    isBoss: tpl.isBoss,
    timeLimitSec: tpl.timeLimitSec || 0,
    maxHp,
    hp: maxHp,
    atk,
    atkIntervalMs: tpl.isBoss ? 1550 : 1850,
    gold,
    exp,
    stage,
    wave,
  };
}

export function createWaveSquad(stage, wave) {
  const isBossWave = wave >= 5;
  const list = [];
  if (isBossWave) {
    list.push(buildMobInstance(MONSTER_TEMPLATES.boss_demon, stage, wave, 0));
    for (let i = 1; i <= 3; i++) {
      const tpl = i % 2 === 0 ? MONSTER_TEMPLATES.skeleton : MONSTER_TEMPLATES.goblin;
      list.push(buildMobInstance(tpl, stage, wave, i));
    }
  } else {
    const count = Math.min(8, 4 + Math.floor((stage - 1) / 4) + (wave >= 3 ? 1 : 0));
    for (let i = 0; i < count; i++) {
      const tpl = (i + wave) % 2 === 0 ? MONSTER_TEMPLATES.skeleton : MONSTER_TEMPLATES.goblin;
      list.push(buildMobInstance(tpl, stage, wave, i));
    }
  }
  return list;
}
