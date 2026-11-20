export const MONSTER_TEMPLATES = {
  goblin: {
    id: 'goblin',
    name: '哥布林掠奪者',
    spriteKey: 'mob_goblin',
    spritePath: './assets/monsters/goblin.png',
    scale: 0.56,
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
    spritePath: './assets/monsters/skeleton.png',
    scale: 0.62,
    hpMult: 1.35,
    atkMult: 1.15,
    goldMult: 1.35,
    expMult: 1.3,
    isBoss: false,
  },
  boss_demon: {
    id: 'boss_demon',
    name: '深淵魔王・馬爾薩斯',
    spriteKey: 'mob_boss_demon',
    spritePath: './assets/monsters/boss_demon.png',
    scale: 0.72,
    hpMult: 3.4,
    atkMult: 1.65,
    goldMult: 4.5,
    expMult: 4.0,
    isBoss: true,
    timeLimitSec: 25,
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

export function createWaveMonster(stage, wave) {
  const isBoss = wave >= 5;
  const tpl = isBoss
    ? MONSTER_TEMPLATES.boss_demon
    : (wave % 2 === 1 ? MONSTER_TEMPLATES.goblin : MONSTER_TEMPLATES.skeleton);

  const stageScale = Math.pow(1.26, stage - 1);
  const waveScale = 1 + (wave - 1) * 0.14;
  const maxHp = Math.round(75 * stageScale * waveScale * tpl.hpMult);
  const atk = Math.max(4, Math.round(7 * Math.pow(1.18, stage - 1) * tpl.atkMult));
  const gold = Math.round((8 + stage * 4) * stageScale * 0.65 * tpl.goldMult);
  const exp = Math.round((12 + stage * 5) * Math.pow(1.15, stage - 1) * tpl.expMult);

  return {
    id: `${tpl.id}_s${stage}_w${wave}`,
    name: isBoss ? `【首領】${tpl.name}` : `Lv.${stage} ${tpl.name}`,
    spriteKey: tpl.spriteKey,
    scale: tpl.scale,
    isBoss,
    timeLimitSec: tpl.timeLimitSec || 0,
    maxHp,
    hp: maxHp,
    atk,
    atkIntervalMs: isBoss ? 1700 : 1900,
    gold,
    exp,
    stage,
    wave,
  };
}
