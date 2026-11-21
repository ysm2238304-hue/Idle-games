export const MONSTER_TEMPLATES = {
  ch1_wolf:    { id: 'ch1_wolf',    name: '腐化野狼', scale: 0.44, speed: 126, hpMult: 0.85, atkMult: 0.88, goldMult: 1.0,  expMult: 1.0,  isBoss: false, isRanged: false, moveStyle: 'hop',     atkStyle: 'claw' },
  ch1_bandit:  { id: 'ch1_bandit',  name: '荒野強盜', scale: 0.46, speed: 108, hpMult: 0.95, atkMult: 0.95, goldMult: 1.15, expMult: 1.1,  isBoss: false, isRanged: false, moveStyle: 'march',   atkStyle: 'slash' },
  ch1_boar:    { id: 'ch1_boar',    name: '狂暴野豬', scale: 0.48, speed: 118, hpMult: 1.15, atkMult: 1.02, goldMult: 1.2,  expMult: 1.18, isBoss: false, isRanged: false, moveStyle: 'heavy',   atkStyle: 'smash' },
  ch1_slime:   { id: 'ch1_slime',   name: '泥沼史萊姆', scale: 0.42, speed: 90, hpMult: 0.90, atkMult: 0.82, goldMult: 0.95, expMult: 0.95, isBoss: false, isRanged: false, moveStyle: 'hop',     atkStyle: 'venom' },
  ch1_militia: { id: 'ch1_militia', name: '墮落民兵', scale: 0.46, speed: 96,  hpMult: 1.10, atkMult: 1.00, goldMult: 1.25, expMult: 1.2,  isBoss: false, isRanged: false, moveStyle: 'march',   atkStyle: 'slash' },
  ch1_treant:  { id: 'ch1_treant',  name: '棘刺樹妖', scale: 0.54, speed: 78,  hpMult: 1.55, atkMult: 1.15, goldMult: 1.6,  expMult: 1.5,  isBoss: false, isRanged: false, moveStyle: 'heavy',   atkStyle: 'smash' },
  ch1_crow:    { id: 'ch1_crow',    name: '腐屍烏鴉', scale: 0.44, speed: 132, hpMult: 0.78, atkMult: 0.92, goldMult: 1.05, expMult: 1.05, isBoss: false, isRanged: false, moveStyle: 'float',   atkStyle: 'claw' },
  ch1_raider:  { id: 'ch1_raider',  name: '破甲山賊', scale: 0.50, speed: 88,  hpMult: 1.45, atkMult: 1.18, goldMult: 1.55, expMult: 1.45, isBoss: false, isRanged: false, moveStyle: 'heavy',   atkStyle: 'smash' },
  ch1_rat:     { id: 'ch1_rat',     name: '毒牙地鼠', scale: 0.42, speed: 128, hpMult: 0.80, atkMult: 0.90, goldMult: 1.0,  expMult: 1.05, isBoss: false, isRanged: false, moveStyle: 'scuttle', atkStyle: 'venom' },
  ch1_warlord: { id: 'ch1_warlord', name: '邊境督軍', scale: 0.56, speed: 84,  hpMult: 1.75, atkMult: 1.25, goldMult: 1.85, expMult: 1.75, isBoss: false, isRanged: false, moveStyle: 'heavy',   atkStyle: 'slash' },
  ch2_shaman:    { id: 'ch2_shaman',    name: '哥布林薩滿', scale: 0.46, speed: 92,  hpMult: 1.00, atkMult: 1.08, goldMult: 1.25, expMult: 1.20, isBoss: false, isRanged: true,  moveStyle: 'march',   atkStyle: 'necro_orb' },
  ch2_bomber:    { id: 'ch2_bomber',    name: '爆破哥布林', scale: 0.44, speed: 112, hpMult: 0.88, atkMult: 1.18, goldMult: 1.20, expMult: 1.15, isBoss: false, isRanged: true,  moveStyle: 'hop',     atkStyle: 'imp_fire' },
  ch2_rider:     { id: 'ch2_rider',     name: '哥布林狼騎兵', scale: 0.52, speed: 136, hpMult: 1.32, atkMult: 1.14, goldMult: 1.45, expMult: 1.38, isBoss: false, isRanged: false, moveStyle: 'hop',     atkStyle: 'slash' },
  ch2_bat:       { id: 'ch2_bat',       name: '洞穴血蝠',   scale: 0.42, speed: 140, hpMult: 0.78, atkMult: 0.96, goldMult: 1.05, expMult: 1.08, isBoss: false, isRanged: false, moveStyle: 'hover',   atkStyle: 'claw' },
  ch2_spore:     { id: 'ch2_spore',     name: '毒菌妖精',   scale: 0.44, speed: 94,  hpMult: 0.92, atkMult: 1.04, goldMult: 1.15, expMult: 1.15, isBoss: false, isRanged: true,  moveStyle: 'float',   atkStyle: 'venom' },
  ch2_sapper:    { id: 'ch2_sapper',    name: '地精工兵',   scale: 0.46, speed: 98,  hpMult: 1.16, atkMult: 1.06, goldMult: 1.28, expMult: 1.22, isBoss: false, isRanged: false, moveStyle: 'march',   atkStyle: 'smash' },
  ch2_worm:      { id: 'ch2_worm',      name: '巨顎地蟲',   scale: 0.54, speed: 82,  hpMult: 1.62, atkMult: 1.18, goldMult: 1.60, expMult: 1.52, isBoss: false, isRanged: false, moveStyle: 'heavy',   atkStyle: 'smash' },
  ch2_stalker:   { id: 'ch2_stalker',   name: '暗影潛伏者', scale: 0.46, speed: 128, hpMult: 0.96, atkMult: 1.22, goldMult: 1.32, expMult: 1.28, isBoss: false, isRanged: false, moveStyle: 'scuttle', atkStyle: 'claw' },
  ch2_arachne:   { id: 'ch2_arachne',   name: '蜘蛛女妖',   scale: 0.50, speed: 108, hpMult: 1.28, atkMult: 1.15, goldMult: 1.48, expMult: 1.40, isBoss: false, isRanged: true,  moveStyle: 'scuttle', atkStyle: 'venom' },
  ch2_chieftain: { id: 'ch2_chieftain', name: '哥布林酋長', scale: 0.58, speed: 86,  hpMult: 1.88, atkMult: 1.32, goldMult: 1.95, expMult: 1.85, isBoss: false, isRanged: false, moveStyle: 'heavy',   atkStyle: 'smash' },
  ch3_ghoul:     { id: 'ch3_ghoul',     name: '嗜血食屍鬼', scale: 0.46, speed: 122, hpMult: 1.05, atkMult: 1.12, goldMult: 1.25, expMult: 1.22, isBoss: false, isRanged: false, moveStyle: 'hop',     atkStyle: 'claw' },
  ch3_archer:    { id: 'ch3_archer',    name: '骷髏弓手',   scale: 0.46, speed: 94,  hpMult: 0.92, atkMult: 1.16, goldMult: 1.22, expMult: 1.20, isBoss: false, isRanged: true,  moveStyle: 'march',   atkStyle: 'venom' },
  ch3_bonemage:  { id: 'ch3_bonemage',  name: '白骨法師',   scale: 0.48, speed: 88,  hpMult: 0.98, atkMult: 1.24, goldMult: 1.45, expMult: 1.38, isBoss: false, isRanged: true,  moveStyle: 'float',   atkStyle: 'necro_orb' },
  ch3_wraith:    { id: 'ch3_wraith',    name: '墓穴怨靈',   scale: 0.48, speed: 114, hpMult: 0.96, atkMult: 1.18, goldMult: 1.38, expMult: 1.34, isBoss: false, isRanged: true,  moveStyle: 'hover',   atkStyle: 'necro_orb' },
  ch3_abom:      { id: 'ch3_abom',      name: '縫合憎惡',   scale: 0.56, speed: 74,  hpMult: 1.92, atkMult: 1.28, goldMult: 1.85, expMult: 1.75, isBoss: false, isRanged: false, moveStyle: 'heavy',   atkStyle: 'smash' },
  ch3_mummy:     { id: 'ch3_mummy',     name: '腐化木乃伊', scale: 0.48, speed: 84,  hpMult: 1.38, atkMult: 1.12, goldMult: 1.42, expMult: 1.36, isBoss: false, isRanged: false, moveStyle: 'march',   atkStyle: 'venom' },
  ch3_hound:     { id: 'ch3_hound',     name: '幽冥獵犬',   scale: 0.46, speed: 142, hpMult: 0.94, atkMult: 1.18, goldMult: 1.28, expMult: 1.26, isBoss: false, isRanged: false, moveStyle: 'hop',     atkStyle: 'claw' },
  ch3_scarab:    { id: 'ch3_scarab',    name: '骨刺甲蟲',   scale: 0.44, speed: 118, hpMult: 1.24, atkMult: 1.05, goldMult: 1.20, expMult: 1.18, isBoss: false, isRanged: false, moveStyle: 'scuttle', atkStyle: 'claw' },
  ch3_guard:     { id: 'ch3_guard',     name: '黑棺守衛',   scale: 0.54, speed: 80,  hpMult: 1.78, atkMult: 1.22, goldMult: 1.72, expMult: 1.65, isBoss: false, isRanged: false, moveStyle: 'heavy',   atkStyle: 'smash' },
  ch3_lord:      { id: 'ch3_lord',      name: '白骨領主',   scale: 0.60, speed: 88,  hpMult: 2.05, atkMult: 1.38, goldMult: 2.15, expMult: 2.00, isBoss: false, isRanged: false, moveStyle: 'heavy',   atkStyle: 'slash' },
  ch4_imp:        { id: 'ch4_imp',        name: '熔岩小鬼',     scale: 0.42, speed: 122, hpMult: 0.90, atkMult: 1.08, goldMult: 1.20, expMult: 1.18, isBoss: false, isRanged: true,  moveStyle: 'hover',   atkStyle: 'imp_fire' },
  ch4_hound:      { id: 'ch4_hound',      name: '地獄炎犬',     scale: 0.48, speed: 142, hpMult: 1.04, atkMult: 1.16, goldMult: 1.28, expMult: 1.25, isBoss: false, isRanged: false, moveStyle: 'hop',     atkStyle: 'claw' },
  ch4_elemental:  { id: 'ch4_elemental',  name: '烈焰元素',     scale: 0.50, speed: 92,  hpMult: 1.18, atkMult: 1.22, goldMult: 1.42, expMult: 1.38, isBoss: false, isRanged: true,  moveStyle: 'float',   atkStyle: 'imp_fire' },
  ch4_salamander: { id: 'ch4_salamander', name: '黑曜蜥蜴',     scale: 0.48, speed: 112, hpMult: 1.24, atkMult: 1.12, goldMult: 1.32, expMult: 1.28, isBoss: false, isRanged: false, moveStyle: 'scuttle', atkStyle: 'claw' },
  ch4_golem:      { id: 'ch4_golem',      name: '熔核魔像',     scale: 0.58, speed: 74,  hpMult: 1.98, atkMult: 1.30, goldMult: 1.88, expMult: 1.78, isBoss: false, isRanged: false, moveStyle: 'heavy',   atkStyle: 'smash' },
  ch4_harpy:      { id: 'ch4_harpy',      name: '灰燼鷹身女妖', scale: 0.46, speed: 132, hpMult: 0.96, atkMult: 1.18, goldMult: 1.30, expMult: 1.28, isBoss: false, isRanged: true,  moveStyle: 'hover',   atkStyle: 'imp_fire' },
  ch4_cultist:    { id: 'ch4_cultist',    name: '炎魔祭司',     scale: 0.48, speed: 88,  hpMult: 1.02, atkMult: 1.26, goldMult: 1.45, expMult: 1.40, isBoss: false, isRanged: true,  moveStyle: 'march',   atkStyle: 'imp_fire' },
  ch4_knight:     { id: 'ch4_knight',     name: '焦土黑騎士',   scale: 0.54, speed: 86,  hpMult: 1.76, atkMult: 1.28, goldMult: 1.75, expMult: 1.68, isBoss: false, isRanged: false, moveStyle: 'heavy',   atkStyle: 'slash' },
  ch4_scorpion:   { id: 'ch4_scorpion',   name: '赤鐵巨蠍',     scale: 0.50, speed: 116, hpMult: 1.36, atkMult: 1.18, goldMult: 1.48, expMult: 1.42, isBoss: false, isRanged: false, moveStyle: 'scuttle', atkStyle: 'venom' },
  ch4_ifrit:      { id: 'ch4_ifrit',      name: '深淵伊弗利特', scale: 0.60, speed: 94,  hpMult: 2.12, atkMult: 1.42, goldMult: 2.20, expMult: 2.05, isBoss: false, isRanged: false, moveStyle: 'float',   atkStyle: 'slash' },
  ch5_thrall:     { id: 'ch5_thrall',     name: '深淵魔奴',     scale: 0.46, speed: 108, hpMult: 1.06, atkMult: 1.14, goldMult: 1.25, expMult: 1.22, isBoss: false, isRanged: false, moveStyle: 'march',   atkStyle: 'smash' },
  ch5_succubus:   { id: 'ch5_succubus',   name: '魅魔刺客',     scale: 0.48, speed: 138, hpMult: 1.02, atkMult: 1.28, goldMult: 1.42, expMult: 1.38, isBoss: false, isRanged: false, moveStyle: 'hop',     atkStyle: 'slash' },
  ch5_warlock:    { id: 'ch5_warlock',    name: '暗影術士',     scale: 0.48, speed: 88,  hpMult: 1.04, atkMult: 1.30, goldMult: 1.50, expMult: 1.45, isBoss: false, isRanged: true,  moveStyle: 'float',   atkStyle: 'necro_orb' },
  ch5_gargoyle:   { id: 'ch5_gargoyle',   name: '血石石像鬼',   scale: 0.50, speed: 124, hpMult: 1.34, atkMult: 1.20, goldMult: 1.45, expMult: 1.40, isBoss: false, isRanged: false, moveStyle: 'hover',   atkStyle: 'claw' },
  ch5_cerberus:   { id: 'ch5_cerberus',   name: '三頭魔犬',     scale: 0.54, speed: 136, hpMult: 1.56, atkMult: 1.32, goldMult: 1.68, expMult: 1.60, isBoss: false, isRanged: false, moveStyle: 'hop',     atkStyle: 'claw' },
  ch5_torturer:   { id: 'ch5_torturer',   name: '煉獄拷問者',   scale: 0.50, speed: 98,  hpMult: 1.44, atkMult: 1.26, goldMult: 1.55, expMult: 1.48, isBoss: false, isRanged: false, moveStyle: 'march',   atkStyle: 'slash' },
  ch5_eye:        { id: 'ch5_eye',        name: '虛空魔眼',     scale: 0.48, speed: 100, hpMult: 1.12, atkMult: 1.34, goldMult: 1.52, expMult: 1.48, isBoss: false, isRanged: true,  moveStyle: 'hover',   atkStyle: 'necro_orb' },
  ch5_guard:      { id: 'ch5_guard',      name: '聖殿魔衛',     scale: 0.56, speed: 78,  hpMult: 1.96, atkMult: 1.28, goldMult: 1.85, expMult: 1.75, isBoss: false, isRanged: false, moveStyle: 'heavy',   atkStyle: 'smash' },
  ch5_archfiend:  { id: 'ch5_archfiend',  name: '墮落大惡魔',   scale: 0.56, speed: 102, hpMult: 1.78, atkMult: 1.38, goldMult: 1.95, expMult: 1.85, isBoss: false, isRanged: true,  moveStyle: 'float',   atkStyle: 'imp_fire' },
  ch5_general:    { id: 'ch5_general',    name: '深淵魔將',     scale: 0.62, speed: 86,  hpMult: 2.25, atkMult: 1.46, goldMult: 2.35, expMult: 2.20, isBoss: false, isRanged: false, moveStyle: 'heavy',   atkStyle: 'slash' },
  ch6_wolf:     { id: 'ch6_wolf',     name: '霜牙雪狼',   scale: 0.46, speed: 140, hpMult: 1.02, atkMult: 1.16, goldMult: 1.25, expMult: 1.22, isBoss: false, isRanged: false, moveStyle: 'hop',     atkStyle: 'claw' },
  ch6_sprite:   { id: 'ch6_sprite',   name: '冰晶精靈',   scale: 0.44, speed: 112, hpMult: 0.92, atkMult: 1.20, goldMult: 1.28, expMult: 1.24, isBoss: false, isRanged: true,  moveStyle: 'hover',   atkStyle: 'necro_orb' },
  ch6_yeti:     { id: 'ch6_yeti',     name: '極地雪人',   scale: 0.56, speed: 82,  hpMult: 1.88, atkMult: 1.30, goldMult: 1.80, expMult: 1.72, isBoss: false, isRanged: false, moveStyle: 'heavy',   atkStyle: 'smash' },
  ch6_witch:    { id: 'ch6_witch',    name: '寒冰女巫',   scale: 0.48, speed: 92,  hpMult: 1.00, atkMult: 1.28, goldMult: 1.45, expMult: 1.40, isBoss: false, isRanged: true,  moveStyle: 'float',   atkStyle: 'necro_orb' },
  ch6_crab:     { id: 'ch6_crab',     name: '冰殼巨蟹',   scale: 0.48, speed: 108, hpMult: 1.42, atkMult: 1.15, goldMult: 1.42, expMult: 1.36, isBoss: false, isRanged: false, moveStyle: 'scuttle', atkStyle: 'claw' },
  ch6_golem:    { id: 'ch6_golem',    name: '冰川魔像',   scale: 0.58, speed: 74,  hpMult: 2.05, atkMult: 1.32, goldMult: 1.92, expMult: 1.82, isBoss: false, isRanged: false, moveStyle: 'heavy',   atkStyle: 'smash' },
  ch6_knight:   { id: 'ch6_knight',   name: '霜寒死騎',   scale: 0.54, speed: 88,  hpMult: 1.78, atkMult: 1.30, goldMult: 1.75, expMult: 1.68, isBoss: false, isRanged: false, moveStyle: 'march',   atkStyle: 'slash' },
  ch6_wyvern:   { id: 'ch6_wyvern',   name: '冰霜飛龍',   scale: 0.52, speed: 128, hpMult: 1.38, atkMult: 1.26, goldMult: 1.58, expMult: 1.50, isBoss: false, isRanged: true,  moveStyle: 'hover',   atkStyle: 'necro_orb' },
  ch6_banshee:  { id: 'ch6_banshee',  name: '冰魄女妖',   scale: 0.48, speed: 116, hpMult: 1.04, atkMult: 1.32, goldMult: 1.48, expMult: 1.42, isBoss: false, isRanged: true,  moveStyle: 'float',   atkStyle: 'necro_orb' },
  ch6_titan:    { id: 'ch6_titan',    name: '冰霜巨靈',   scale: 0.62, speed: 84,  hpMult: 2.28, atkMult: 1.44, goldMult: 2.30, expMult: 2.15, isBoss: false, isRanged: false, moveStyle: 'heavy',   atkStyle: 'slash' },
  ch7_toad:     { id: 'ch7_toad',     name: '劇毒巨蟾',   scale: 0.50, speed: 96,  hpMult: 1.38, atkMult: 1.18, goldMult: 1.40, expMult: 1.35, isBoss: false, isRanged: false, moveStyle: 'hop',     atkStyle: 'venom' },
  ch7_mosquito: { id: 'ch7_mosquito', name: '沼澤毒蚊',   scale: 0.44, speed: 146, hpMult: 0.86, atkMult: 1.16, goldMult: 1.22, expMult: 1.20, isBoss: false, isRanged: false, moveStyle: 'hover',   atkStyle: 'venom' },
  ch7_slime:    { id: 'ch7_slime',    name: '腐蝕泥怪',   scale: 0.48, speed: 86,  hpMult: 1.28, atkMult: 1.14, goldMult: 1.32, expMult: 1.28, isBoss: false, isRanged: false, moveStyle: 'hop',     atkStyle: 'venom' },
  ch7_lizard:   { id: 'ch7_lizard',   name: '毒沼蜥蜴人', scale: 0.48, speed: 112, hpMult: 1.22, atkMult: 1.22, goldMult: 1.38, expMult: 1.34, isBoss: false, isRanged: false, moveStyle: 'march',   atkStyle: 'slash' },
  ch7_shaman:   { id: 'ch7_shaman',   name: '瘟疫巫醫',   scale: 0.48, speed: 90,  hpMult: 1.04, atkMult: 1.30, goldMult: 1.50, expMult: 1.44, isBoss: false, isRanged: true,  moveStyle: 'march',   atkStyle: 'venom' },
  ch7_plant:    { id: 'ch7_plant',    name: '食人毒花',   scale: 0.50, speed: 78,  hpMult: 1.34, atkMult: 1.26, goldMult: 1.45, expMult: 1.40, isBoss: false, isRanged: true,  moveStyle: 'hop',     atkStyle: 'venom' },
  ch7_leech:    { id: 'ch7_leech',    name: '巨型血蛭',   scale: 0.46, speed: 122, hpMult: 1.12, atkMult: 1.20, goldMult: 1.30, expMult: 1.26, isBoss: false, isRanged: false, moveStyle: 'scuttle', atkStyle: 'claw' },
  ch7_spider:   { id: 'ch7_spider',   name: '沼澤黑寡婦', scale: 0.46, speed: 138, hpMult: 1.06, atkMult: 1.28, goldMult: 1.42, expMult: 1.38, isBoss: false, isRanged: false, moveStyle: 'scuttle', atkStyle: 'venom' },
  ch7_croc:     { id: 'ch7_croc',     name: '腐骨巨鱷',   scale: 0.56, speed: 88,  hpMult: 1.88, atkMult: 1.34, goldMult: 1.85, expMult: 1.76, isBoss: false, isRanged: false, moveStyle: 'heavy',   atkStyle: 'smash' },
  ch7_hydra:    { id: 'ch7_hydra',    name: '劇毒九頭蛇', scale: 0.62, speed: 82,  hpMult: 2.35, atkMult: 1.48, goldMult: 2.40, expMult: 2.25, isBoss: false, isRanged: true,  moveStyle: 'heavy',   atkStyle: 'venom' },
  ch8_spark:      { id: 'ch8_spark',      name: '雷電小精靈', scale: 0.42, speed: 124, hpMult: 0.94, atkMult: 1.24, goldMult: 1.32, expMult: 1.28, isBoss: false, isRanged: true,  moveStyle: 'hover',   atkStyle: 'necro_orb' },
  ch8_eagle:      { id: 'ch8_eagle',      name: '風暴巨鷹',   scale: 0.48, speed: 146, hpMult: 1.04, atkMult: 1.22, goldMult: 1.34, expMult: 1.30, isBoss: false, isRanged: false, moveStyle: 'hover',   atkStyle: 'claw' },
  ch8_mage:       { id: 'ch8_mage',       name: '雷霆法師',   scale: 0.48, speed: 90,  hpMult: 1.06, atkMult: 1.32, goldMult: 1.52, expMult: 1.46, isBoss: false, isRanged: true,  moveStyle: 'march',   atkStyle: 'necro_orb' },
  ch8_golem:      { id: 'ch8_golem',      name: '雷電魔像',   scale: 0.58, speed: 74,  hpMult: 2.08, atkMult: 1.34, goldMult: 1.95, expMult: 1.85, isBoss: false, isRanged: false, moveStyle: 'heavy',   atkStyle: 'smash' },
  ch8_harpy:      { id: 'ch8_harpy',      name: '暴風女妖',   scale: 0.46, speed: 134, hpMult: 1.02, atkMult: 1.26, goldMult: 1.42, expMult: 1.36, isBoss: false, isRanged: true,  moveStyle: 'hover',   atkStyle: 'necro_orb' },
  ch8_knight:     { id: 'ch8_knight',     name: '雷鳴騎士',   scale: 0.54, speed: 92,  hpMult: 1.78, atkMult: 1.34, goldMult: 1.78, expMult: 1.70, isBoss: false, isRanged: false, moveStyle: 'march',   atkStyle: 'slash' },
  ch8_elemental:  { id: 'ch8_elemental',  name: '風暴元素',   scale: 0.52, speed: 100, hpMult: 1.34, atkMult: 1.30, goldMult: 1.58, expMult: 1.50, isBoss: false, isRanged: true,  moveStyle: 'float',   atkStyle: 'necro_orb' },
  ch8_wyrm:       { id: 'ch8_wyrm',       name: '電光飛龍',   scale: 0.54, speed: 128, hpMult: 1.46, atkMult: 1.32, goldMult: 1.68, expMult: 1.60, isBoss: false, isRanged: true,  moveStyle: 'hover',   atkStyle: 'necro_orb' },
  ch8_centaur:    { id: 'ch8_centaur',    name: '雷槍半人馬', scale: 0.54, speed: 138, hpMult: 1.54, atkMult: 1.34, goldMult: 1.72, expMult: 1.64, isBoss: false, isRanged: false, moveStyle: 'hop',     atkStyle: 'slash' },
  ch8_titan:      { id: 'ch8_titan',      name: '雷神泰坦',   scale: 0.62, speed: 84,  hpMult: 2.38, atkMult: 1.48, goldMult: 2.42, expMult: 2.28, isBoss: false, isRanged: false, moveStyle: 'heavy',   atkStyle: 'smash' },
  ch9_thrall:     { id: 'ch9_thrall',     name: '血奴狂信徒', scale: 0.46, speed: 118, hpMult: 1.06, atkMult: 1.22, goldMult: 1.30, expMult: 1.26, isBoss: false, isRanged: false, moveStyle: 'hop',     atkStyle: 'slash' },
  ch9_bat:        { id: 'ch9_bat',        name: '血族巨蝠',   scale: 0.46, speed: 146, hpMult: 0.96, atkMult: 1.24, goldMult: 1.32, expMult: 1.28, isBoss: false, isRanged: false, moveStyle: 'hover',   atkStyle: 'claw' },
  ch9_nun:        { id: 'ch9_nun',        name: '墮落血修女', scale: 0.48, speed: 92,  hpMult: 1.08, atkMult: 1.32, goldMult: 1.50, expMult: 1.44, isBoss: false, isRanged: true,  moveStyle: 'float',   atkStyle: 'imp_fire' },
  ch9_inquisitor: { id: 'ch9_inquisitor', name: '猩紅審判官', scale: 0.52, speed: 94,  hpMult: 1.52, atkMult: 1.30, goldMult: 1.64, expMult: 1.56, isBoss: false, isRanged: false, moveStyle: 'march',   atkStyle: 'smash' },
  ch9_gargoyle:   { id: 'ch9_gargoyle',   name: '血腥石像鬼', scale: 0.50, speed: 124, hpMult: 1.42, atkMult: 1.26, goldMult: 1.55, expMult: 1.48, isBoss: false, isRanged: false, moveStyle: 'hover',   atkStyle: 'claw' },
  ch9_knight:     { id: 'ch9_knight',     name: '血騎士',     scale: 0.56, speed: 88,  hpMult: 1.92, atkMult: 1.36, goldMult: 1.88, expMult: 1.78, isBoss: false, isRanged: false, moveStyle: 'heavy',   atkStyle: 'slash' },
  ch9_priest:     { id: 'ch9_priest',     name: '鮮血祭司',   scale: 0.48, speed: 88,  hpMult: 1.12, atkMult: 1.36, goldMult: 1.58, expMult: 1.50, isBoss: false, isRanged: true,  moveStyle: 'march',   atkStyle: 'imp_fire' },
  ch9_hound:      { id: 'ch9_hound',      name: '血獵魔犬',   scale: 0.48, speed: 148, hpMult: 1.14, atkMult: 1.30, goldMult: 1.44, expMult: 1.38, isBoss: false, isRanged: false, moveStyle: 'hop',     atkStyle: 'claw' },
  ch9_executioner:{ id: 'ch9_executioner',name: '血色劊子手', scale: 0.58, speed: 78,  hpMult: 2.12, atkMult: 1.40, goldMult: 2.02, expMult: 1.92, isBoss: false, isRanged: false, moveStyle: 'heavy',   atkStyle: 'slash' },
  ch9_lord:       { id: 'ch9_lord',       name: '吸血鬼領主', scale: 0.60, speed: 102, hpMult: 2.36, atkMult: 1.50, goldMult: 2.48, expMult: 2.32, isBoss: false, isRanged: true,  moveStyle: 'float',   atkStyle: 'imp_fire' },
  ch10_wisp:      { id: 'ch10_wisp',      name: '虛空星靈',   scale: 0.44, speed: 122, hpMult: 1.02, atkMult: 1.30, goldMult: 1.42, expMult: 1.38, isBoss: false, isRanged: true,  moveStyle: 'hover',   atkStyle: 'necro_orb' },
  ch10_stalker:   { id: 'ch10_stalker',   name: '星界潛行者', scale: 0.48, speed: 146, hpMult: 1.16, atkMult: 1.38, goldMult: 1.55, expMult: 1.48, isBoss: false, isRanged: false, moveStyle: 'hop',     atkStyle: 'slash' },
  ch10_horror:    { id: 'ch10_horror',    name: '混沌觸手怪', scale: 0.52, speed: 96,  hpMult: 1.54, atkMult: 1.34, goldMult: 1.66, expMult: 1.58, isBoss: false, isRanged: false, moveStyle: 'scuttle', atkStyle: 'claw' },
  ch10_mage:      { id: 'ch10_mage',      name: '星界秘法師', scale: 0.50, speed: 94,  hpMult: 1.18, atkMult: 1.42, goldMult: 1.68, expMult: 1.60, isBoss: false, isRanged: true,  moveStyle: 'float',   atkStyle: 'necro_orb' },
  ch10_construct: { id: 'ch10_construct', name: '星辰魔像',   scale: 0.58, speed: 76,  hpMult: 2.18, atkMult: 1.38, goldMult: 2.05, expMult: 1.95, isBoss: false, isRanged: false, moveStyle: 'heavy',   atkStyle: 'smash' },
  ch10_seraph:    { id: 'ch10_seraph',    name: '墮落星翼天使', scale: 0.54, speed: 124, hpMult: 1.58, atkMult: 1.40, goldMult: 1.82, expMult: 1.72, isBoss: false, isRanged: true,  moveStyle: 'hover',   atkStyle: 'necro_orb' },
  ch10_devourer:  { id: 'ch10_devourer',  name: '虛空吞噬者', scale: 0.54, speed: 132, hpMult: 1.68, atkMult: 1.42, goldMult: 1.85, expMult: 1.76, isBoss: false, isRanged: false, moveStyle: 'hop',     atkStyle: 'claw' },
  ch10_knight:    { id: 'ch10_knight',    name: '混沌黑騎士', scale: 0.56, speed: 88,  hpMult: 2.04, atkMult: 1.44, goldMult: 2.00, expMult: 1.90, isBoss: false, isRanged: false, moveStyle: 'heavy',   atkStyle: 'slash' },
  ch10_eye:       { id: 'ch10_eye',       name: '全視混沌之眼', scale: 0.52, speed: 102, hpMult: 1.42, atkMult: 1.46, goldMult: 1.84, expMult: 1.74, isBoss: false, isRanged: true,  moveStyle: 'hover',   atkStyle: 'necro_orb' },
  ch10_titan:     { id: 'ch10_titan',     name: '混沌星界泰坦', scale: 0.64, speed: 86,  hpMult: 2.55, atkMult: 1.56, goldMult: 2.65, expMult: 2.50, isBoss: false, isRanged: false, moveStyle: 'heavy',   atkStyle: 'slash' },
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
  ['ch1_wolf', 'ch1_bandit', 'ch1_boar', 'ch1_slime', 'ch1_militia', 'ch1_treant', 'ch1_crow', 'ch1_raider', 'ch1_rat', 'ch1_warlord'],
  ['ch2_shaman', 'ch2_bomber', 'ch2_rider', 'ch2_bat', 'ch2_spore', 'ch2_sapper', 'ch2_worm', 'ch2_stalker', 'ch2_arachne', 'ch2_chieftain'],
  ['ch3_ghoul', 'ch3_archer', 'ch3_bonemage', 'ch3_wraith', 'ch3_abom', 'ch3_mummy', 'ch3_hound', 'ch3_scarab', 'ch3_guard', 'ch3_lord'],
  ['ch4_imp', 'ch4_hound', 'ch4_elemental', 'ch4_salamander', 'ch4_golem', 'ch4_harpy', 'ch4_cultist', 'ch4_knight', 'ch4_scorpion', 'ch4_ifrit'],
  ['ch5_thrall', 'ch5_succubus', 'ch5_warlock', 'ch5_gargoyle', 'ch5_cerberus', 'ch5_torturer', 'ch5_eye', 'ch5_guard', 'ch5_archfiend', 'ch5_general'],
  ['ch6_wolf', 'ch6_sprite', 'ch6_yeti', 'ch6_witch', 'ch6_crab', 'ch6_golem', 'ch6_knight', 'ch6_wyvern', 'ch6_banshee', 'ch6_titan'],
  ['ch7_toad', 'ch7_mosquito', 'ch7_slime', 'ch7_lizard', 'ch7_shaman', 'ch7_plant', 'ch7_leech', 'ch7_spider', 'ch7_croc', 'ch7_hydra'],
  ['ch8_spark', 'ch8_eagle', 'ch8_mage', 'ch8_golem', 'ch8_harpy', 'ch8_knight', 'ch8_elemental', 'ch8_wyrm', 'ch8_centaur', 'ch8_titan'],
  ['ch9_thrall', 'ch9_bat', 'ch9_nun', 'ch9_inquisitor', 'ch9_gargoyle', 'ch9_knight', 'ch9_priest', 'ch9_hound', 'ch9_executioner', 'ch9_lord'],
  ['ch10_wisp', 'ch10_stalker', 'ch10_horror', 'ch10_mage', 'ch10_construct', 'ch10_seraph', 'ch10_devourer', 'ch10_knight', 'ch10_eye', 'ch10_titan'],
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
  const totalMobs = 24; // 佔地圖滿編(40隻) 60% 高密度基數

  // 怪物從遠處四面八方（距離英雄 760~1380px 外圍）預先生成，全部擊殺才算通關
  for (let i = 0; i < totalMobs; i++) {
    const key = pool[i % pool.length];
    const tpl = MONSTER_TEMPLATES[key];
    const mob = buildMonster(tpl, stage, scaleFactor, `d_${i}`);
    const ang = (Math.PI * 2 * i) / totalMobs + (Math.random() * 0.4 - 0.2);
    const dist = 420 + Math.random() * 540;
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
