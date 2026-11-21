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
    scale: 0.72,
    speed: 84,
    hpMult: 6.2,
    atkMult: 1.85,
    goldMult: 6.5,
    expMult: 5.5,
    isBoss: true,
    isRanged: false,
    moveStyle: 'heavy',
    atkStyle: 'boss_cleave',
    timeLimitSec: 36,
  },
};

export const STAGE_ZONES = [
  '腐朽邊境營地',
  '幽暗哥布林巢穴',
  '白骨墓穴長廊',
  '焦土熔岩裂谷',
  '深淵魔王聖殿',
  '永凍冰霜凍原',
  '劇毒腐蝕沼澤',
  '雷鳴風暴高塔',
  '血色修道院廢墟',
  '混沌星界虛空',
];

const ZONE_POOLS = [
  ['goblin', 'spider', 'orc'],
  ['goblin', 'imp', 'spider', 'orc'],
  ['skeleton', 'necromancer', 'spider'],
  ['imp', 'orc', 'skeleton', 'necromancer'],
  ['imp', 'necromancer', 'orc', 'skeleton'],
  ['skeleton', 'orc', 'necromancer'],
  ['spider', 'imp', 'necromancer'],
  ['imp', 'skeleton', 'orc', 'necromancer'],
  ['skeleton', 'orc', 'imp', 'necromancer'],
  ['imp', 'necromancer', 'orc', 'skeleton'],
];

export const ZONE_OBSTACLES = [
  ['obs_2', 'obs_1', 'obs_0'],
  ['obs_2', 'obs_1', 'obs_4'],
  ['obs_4', 'obs_0', 'obs_1'],
  ['obs_3', 'obs_1', 'obs_0'],
  ['obs_3', 'obs_0', 'obs_7'],
  ['obs_5', 'obs_1', 'obs_0'],
  ['obs_6', 'obs_2', 'obs_1'],
  ['obs_0', 'obs_7', 'obs_1'],
  ['obs_4', 'obs_3', 'obs_0'],
  ['obs_7', 'obs_3', 'obs_1'],
];

export function getChapterIdx(stage) {
  return Math.min(9, Math.max(0, Math.floor((Math.max(1, stage) - 1) / 10)));
}

export function getSubStage(stage) {
  return ((Math.max(1, stage) - 1) % 10) + 1;
}

export function getStageLabel(stage) {
  const ch = getChapterIdx(stage) + 1;
  const sub = getSubStage(stage);
  return `${ch}-${sub}`;
}

export function getZoneName(stage) {
  return STAGE_ZONES[getChapterIdx(stage)];
}

export function getWaveTargetKills(stage, wave) {
  if (wave >= 2) return 1; // 第 2 波擊殺小王或章節首領即通關此小關
  return 8 + Math.min(10, Math.floor((stage - 1) * 0.14));
}

export function createWaveSquad(stage, wave) {
  const chIdx = getChapterIdx(stage);
  const sub = getSubStage(stage);
  const pool = ZONE_POOLS[chIdx];
  const squad = [];
  const scaleFactor = 1 + (stage - 1) * 0.22 + (wave - 1) * 0.08;

  const isBossWave = wave >= 2;
  const count = isBossWave ? 3 : Math.min(12, 6 + Math.floor(sub * 0.5));

  for (let i = 0; i < count; i++) {
    const key = pool[i % pool.length];
    const tpl = MONSTER_TEMPLATES[key];
    squad.push(buildMonster(tpl, stage, scaleFactor, i));
  }

  if (isBossWave) {
    if (sub >= 10) {
      const boss = buildMonster(MONSTER_TEMPLATES.boss_demon, stage, scaleFactor, 999);
      boss.name = `【第${chIdx + 1}章首領】${boss.name}`;
      squad.push(boss);
    } else {
      const eliteKey = pool[(sub - 1) % pool.length];
      const tpl = MONSTER_TEMPLATES[eliteKey];
      const mini = buildMonster({
        ...tpl,
        name: `【${getStageLabel(stage)} 小王】${tpl.name}`,
        scale: tpl.scale * 1.45,
        hpMult: tpl.hpMult * 3.4,
        atkMult: tpl.atkMult * 1.45,
        goldMult: tpl.goldMult * 3.5,
        expMult: tpl.expMult * 3.2,
        isBoss: true,
        isMiniBoss: true,
      }, stage, scaleFactor, 998);
      squad.push(mini);
    }
  }

  return squad;
}

export function spawnSingleMonster(stage, forceBoss = false) {
  const chIdx = getChapterIdx(stage);
  const sub = getSubStage(stage);
  const pool = ZONE_POOLS[chIdx];
  const scaleFactor = (1 + (stage - 1) * 0.28) * Math.pow(1.032, stage - 1);
  if (forceBoss) {
    if (sub >= 10) {
      const boss = buildMonster(MONSTER_TEMPLATES.boss_demon, stage, scaleFactor, 'boss_' + Date.now(), true);
      boss.name = `【第${chIdx + 1}章首領】${boss.name}`;
      return boss;
    }
    const eliteKey = pool[(sub - 1) % pool.length];
    const tpl = MONSTER_TEMPLATES[eliteKey];
    return buildMonster({
      ...tpl,
      name: `【${getStageLabel(stage)} 菁英首領】${tpl.name}`,
      scale: tpl.scale * 1.45,
      hpMult: tpl.hpMult * 3.5,
      atkMult: tpl.atkMult * 1.48,
      goldMult: tpl.goldMult * 3.8,
      expMult: tpl.expMult * 3.6,
      isBoss: true,
      isMiniBoss: true,
    }, stage, scaleFactor, 'mini_' + Date.now(), true);
  }
  const key = pool[Math.floor(Math.random() * pool.length)];
  const tpl = MONSTER_TEMPLATES[key];
  const uid = Date.now() + Math.random();
  return buildMonster(tpl, stage, scaleFactor, uid);
}

function buildMonster(tpl, stage, scaleFactor, idx, forceAggressive = null) {
  const diffMult = (1 + (stage - 1) * 0.28) * Math.pow(1.032, stage - 1);
  const atkScale = (1 + (stage - 1) * 0.20) * Math.pow(1.022, stage - 1);
  const expScale = (1 + (stage - 1) * 0.30) * Math.pow(1.028, stage - 1);
  const goldScale = (1 + (stage - 1) * 0.26) * Math.pow(1.024, stage - 1);

  const isAggressive = forceAggressive !== null ? forceAggressive : (tpl.isBoss ? true : Math.random() < 0.55);
  const aggroExpBonus = isAggressive ? 1.20 : 1.0;

  const baseHp = 48 * diffMult;
  const baseAtk = 6.5 * atkScale;
  const baseGold = 8 * goldScale;
  const baseExp = 14 * expScale * aggroExpBonus;

  return {
    uid: `m_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
    id: tpl.id,
    name: tpl.name,
    spriteKey: tpl.spriteKey,
    scale: tpl.scale,
    speed: tpl.speed,
    isBoss: !!tpl.isBoss,
    isMiniBoss: !!tpl.isMiniBoss,
    isRanged: !!tpl.isRanged,
    isAggressive,
    isProvoked: false,
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

export function createStageEncounters(stage) {
  const chIdx = getChapterIdx(stage);
  const sub = getSubStage(stage);
  const pool = ZONE_POOLS[chIdx];
  const scaleFactor = 1 + (stage - 1) * 0.22;
  const spawns = [];
  const cx = 2048;
  const cy = 1152;
  const totalMobs = 15; // 佔地圖滿編(25隻) 60% 基數

  // 怪物從遠處四面八方（距離英雄 760~1380px 外圍）預先生成，全部擊殺才算通關
  for (let i = 0; i < totalMobs; i++) {
    const key = pool[i % pool.length];
    const tpl = MONSTER_TEMPLATES[key];
    const mob = buildMonster(tpl, stage, scaleFactor, `d_${i}`);
    const ang = (Math.PI * 2 * i) / totalMobs + (Math.random() * 0.4 - 0.2);
    const dist = 760 + Math.random() * 620;
    spawns.push({
      mob,
      x: Math.max(240, Math.min(3856, cx + Math.cos(ang) * dist)),
      y: Math.max(240, Math.min(2064, cy + Math.sin(ang) * dist * 0.72)),
    });
  }

  // 終極小王 / 章節首領在最遠處外圍登場
  const bossAng = Math.random() * Math.PI * 2;
  const bossDist = 1180;
  const bx = Math.max(300, Math.min(3796, cx + Math.cos(bossAng) * bossDist));
  const by = Math.max(280, Math.min(2024, cy + Math.sin(bossAng) * bossDist * 0.7));

  if (sub >= 10) {
    const boss = buildMonster(MONSTER_TEMPLATES.boss_demon, stage, scaleFactor, 'boss');
    boss.name = `【第${chIdx + 1}章首領】${boss.name}`;
    spawns.push({ mob: boss, x: bx, y: by });
  } else {
    const eliteKey = pool[(sub - 1) % pool.length];
    const tpl = MONSTER_TEMPLATES[eliteKey];
    const mini = buildMonster({
      ...tpl,
      name: `【${getStageLabel(stage)} 小王】${tpl.name}`,
      scale: tpl.scale * 1.45,
      hpMult: tpl.hpMult * 3.4,
      atkMult: tpl.atkMult * 1.45,
      goldMult: tpl.goldMult * 3.5,
      expMult: tpl.expMult * 3.2,
      isBoss: true,
      isMiniBoss: true,
    }, stage, scaleFactor, 'mini');
    spawns.push({ mob: mini, x: bx, y: by });
  }

  return spawns;
}
