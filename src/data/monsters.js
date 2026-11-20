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

export function spawnSingleMonster(stage, wave) {
  const chIdx = getChapterIdx(stage);
  const pool = ZONE_POOLS[chIdx];
  const scaleFactor = 1 + (stage - 1) * 0.22 + (wave - 1) * 0.08;
  const key = pool[Math.floor(Math.random() * pool.length)];
  const tpl = MONSTER_TEMPLATES[key];
  const uid = Date.now() + Math.random();
  return buildMonster(tpl, stage, scaleFactor, uid);
}

function buildMonster(tpl, stage, scaleFactor, idx) {
  const baseHp = 48 * scaleFactor;
  const baseAtk = 6.5 * (1 + (stage - 1) * 0.17);
  const baseGold = 8 * (1 + (stage - 1) * 0.25);
  const baseExp = 13 * (1 + (stage - 1) * 0.22);

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

  // 3 個前方遇敵區 + 1 個終點小王/首領區（從遠處 X 軸預先生成，全部殺完才過關）
  const packXs = [1450, 3800, 6500, 9200];
  packXs.forEach((px, pIdx) => {
    const isFinalPack = pIdx === packXs.length - 1;
    const count = isFinalPack ? 4 : (4 + Math.min(3, Math.floor(sub / 3)));
    for (let i = 0; i < count; i++) {
      const key = pool[(pIdx + i) % pool.length];
      const tpl = MONSTER_TEMPLATES[key];
      const mob = buildMonster(tpl, stage, scaleFactor, `${pIdx}_${i}`);
      spawns.push({
        mob,
        x: px + (i - count / 2) * 140 + (Math.random() * 140 - 70),
        y: 360 + Math.random() * 580,
      });
    }
    if (isFinalPack) {
      if (sub >= 10) {
        const boss = buildMonster(MONSTER_TEMPLATES.boss_demon, stage, scaleFactor, 'boss');
        boss.name = `【第${chIdx + 1}章首領】${boss.name}`;
        spawns.push({ mob: boss, x: 10350, y: 640 });
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
        spawns.push({ mob: mini, x: 10350, y: 640 });
      }
    }
  });

  return spawns;
}
