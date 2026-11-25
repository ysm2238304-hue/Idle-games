// mageSkills.js (v241 - 暗黑 4 秘法師 24 招完整流派技能庫，相容所有舊存檔 ID)
export const MAGE_SKILLS = {
  // === T1 基礎產能簇 (4 招) ===
  m_fire_bolt: {
    id: 'm_fire_bolt', treeNodeId: 'm_fire_bolt', name: '烈焰箭',
    icon: './assets/skills/sk_m_fire_bolt.png?v=241', cooldownMs: 2400, mpCost: 0,
    desc: '【T1 基礎・烈焰】射出高溫炎箭，穩定疊加【灼燒】並立即回復 22 點魔力。',
    getDetail: (lvl) => `造成 ${140 + lvl * 22}% 火焰傷害、掛 5 秒【灼燒】並回 22 MP。`,
  },
  m_frost_bolt: {
    id: 'm_frost_bolt', treeNodeId: 'm_frost_bolt', name: '冰霜箭',
    icon: './assets/skills/sk_m_frost_bolt.png?v=241', cooldownMs: 2400, mpCost: 0,
    desc: '【T1 基礎・冰霜】射出極寒冰矢累積冰冷【凍結】並回復 22 點魔力。',
    getDetail: (lvl) => `造成 ${138 + lvl * 22}% 冰霜傷害、掛【凍結】並回 22 MP。`,
  },
  m_arc_lash: {
    id: 'm_arc_lash', treeNodeId: 'm_arc_lash', name: '電弧鞭',
    icon: './assets/skills/sk_m_arc_lash.png?v=241', cooldownMs: 2600, mpCost: 0,
    desc: '【T1 基礎・雷電】扇形揮出高壓電鞭，掛【感電】、回 20 MP 並縮短全技能 CD 0.4s。',
    getDetail: (lvl) => `扇形造成 ${155 + lvl * 24}% 雷傷、掛【感電】、回 20 MP 並減 CD 0.4s。`,
  },
  m_spark: {
    id: 'm_spark', treeNodeId: 'm_spark', name: '星界飛彈',
    icon: './assets/skills/sk_m_spark.png?v=241', cooldownMs: 2500, mpCost: 0,
    desc: '【T1 基礎・雷電】連發 3 道高頻電花飛彈，暴擊率 +15%、掉落【爆裂電花】並回 20 MP。',
    getDetail: (lvl) => `3 段電擊總計 ${150 + lvl * 22}% 雷傷，暴擊率 +15% 並回 20 MP。`,
  },

  // === T2 核心耗能簇 (4 招 + 保留 arcane_orb) ===
  m_fireball: {
    id: 'm_fireball', treeNodeId: 'm_fireball', name: '烈焰火球',
    icon: './assets/skills/sk_m_fireball.png?v=241', cooldownMs: 4200, mpCost: 22,
    desc: '【T2 核心・烈焰】投擲白熾火球引發廣域熔炎爆破，對【灼燒】敵人額外 +45% 爆傷。',
    getDetail: (lvl) => `範圍爆炎 ${245 + lvl * 38}% 傷並掛【灼燒】（對灼燒目標 +45%）。`,
  },
  m_ice_shards: {
    id: 'm_ice_shards', treeNodeId: 'm_ice_shards', name: '寒冰裂片',
    icon: './assets/skills/sk_m_ice_shards.png?v=241', cooldownMs: 4000, mpCost: 20,
    desc: '【T2 核心・冰霜】齊射 5 枚冰晶裂片，對【凍結】目標必貫穿且傷害 +65%！',
    getDetail: (lvl) => `5 連冰片總傷 ${235 + lvl * 36}%（對凍結目標 +65% 並掛【易傷】）。`,
  },
  chain_lightning: {
    id: 'chain_lightning', treeNodeId: 'm_chain_lightning', name: '連鎖閃電',
    icon: './assets/skills/sk_m_chain_lightning.png?v=241', cooldownMs: 4400, mpCost: 22,
    desc: '【T2 核心・雷電】在敵群間高速彈跳 6 次高壓電弧，掛【感電】並高機率生成【爆裂電花】。',
    getDetail: (lvl) => `6 次連鎖彈跳，每次 ${130 + lvl * 22}% 雷傷並掛【感電】。`,
  },
  m_frozen_orb: {
    id: 'm_frozen_orb', treeNodeId: 'm_frozen_orb', name: '冰封球',
    icon: './assets/skills/sk_m_frozen_orb.png?v=241', cooldownMs: 4800, mpCost: 24,
    desc: '【T2 核心・冰霜】暗黑經典神技！緩慢推進狂噴 3 波冰刺並在終點大爆裂，掛【凍結】＋【易傷】。',
    getDetail: (lvl) => `3 波冰刺＋終點爆裂，總計 ${290 + lvl * 42}% 冰傷並掛【凍結】＋【易傷】！`,
  },
  arcane_orb: {
    id: 'arcane_orb', treeNodeId: 'm_arcane_orb', name: '星界奧術球',
    icon: './assets/skills/sk_m_arcane_orb.png?v=241', cooldownMs: 4600, mpCost: 18,
    desc: '【T2 核心・奧術】發射貫穿星界奧球並掛【易傷】，命中回復 12 MP。',
    getDetail: (lvl) => `貫穿造成 ${210 + lvl * 32}% 奧術傷並掛【易傷】。`,
  },

  // === T3 防禦護盾簇 (4 招) ===
  m_flame_shield: {
    id: 'm_flame_shield', treeNodeId: 'm_flame_shield', name: '烈焰護盾',
    icon: './assets/skills/sk_m_flame_shield.png?v=241', cooldownMs: 9500, mpCost: 0,
    desc: '【T3 防禦・烈焰】化為不滅火焰 2.5 秒（高減傷＋回血 25%），同時點燃周圍敵群！',
    getDetail: (lvl) => `回復 ${22 + lvl * 2}% 生命，周圍持續爆發 ${170 + lvl * 26}% 傷並掛【灼燒】。`,
  },
  m_ice_armor: {
    id: 'm_ice_armor', treeNodeId: 'm_ice_armor', name: '寒冰護甲',
    icon: './assets/skills/sk_m_ice_armor.png?v=241', cooldownMs: 8800, mpCost: 0,
    desc: '【T3 防禦・冰霜】生成六角結晶護盾（+30% 護盾值）並回 30 MP，反凍周圍敵人。',
    getDetail: (lvl) => `獲得護盾與回復 ${22 + lvl * 2}% 生命＋30 MP，凍結周圍造成 ${155 + lvl * 24}% 傷。`,
  },
  m_arcane_blink: {
    id: 'm_arcane_blink', treeNodeId: 'm_arcane_blink', name: '傳送術',
    icon: './assets/skills/sk_m_arcane_blink.png?v=241', cooldownMs: 5800, mpCost: 0,
    desc: '【T3 位移・雷電】化為雷光瞬移聚怪，爆發【感電】＋【易傷】並縮短全技能 CD 1s。',
    getDetail: (lvl) => `聚怪電爆造成 ${210 + lvl * 32}% 雷傷、掛【感電】＋【易傷】並減 CD 1s。`,
  },
  frost_nova: {
    id: 'frost_nova', treeNodeId: 'm_frost_nova', name: '寒冰新星',
    icon: './assets/skills/sk_m_frost_nova.png?v=241', cooldownMs: 7400, mpCost: 0,
    desc: '【T3 控場・冰霜】以自身為中心爆發極寒衝擊波，全場硬【凍結】並掛 5 秒【易傷】！',
    getDetail: (lvl) => `全場造成 ${185 + lvl * 28}% 冰傷並強制【凍結】＋【易傷】5 秒。`,
  },

  // === T4 元素召喚簇 (4 招 — 疊加「召喚精通」乘區) ===
  m_flame_hydra: {
    id: 'm_flame_hydra', treeNodeId: 'm_flame_hydra', name: '三頭烈焰火蛇',
    icon: './assets/skills/sk_m_flame_hydra.png?v=241', cooldownMs: 6800, mpCost: 20,
    desc: '【T4 召喚・烈焰】召喚三頭烈焰魔蛇駐場連噴 4 波焦炎，疊加【召喚精通】全傷 +12%！',
    getDetail: (lvl) => `4 波烈焰噴吐，每波 ${125 + lvl * 22}% 傷並掛【灼燒】，+1 召喚層數。`,
  },
  m_ice_blades: {
    id: 'm_ice_blades', treeNodeId: 'm_ice_blades', name: '懸浮寒冰之刃',
    icon: './assets/skills/sk_m_ice_blades.png?v=241', cooldownMs: 6600, mpCost: 16,
    desc: '【T4 召喚・冰霜】召喚雙柄極寒冰刃自動斬擊 4 次，每次命中掛【易傷】並減全技能 CD 0.5s！',
    getDetail: (lvl) => `4 次冰刃連斬共 ${260 + lvl * 38}% 傷，掛【易傷】＋【凍結】並減 CD 2s。`,
  },
  m_lightning_spear: {
    id: 'm_lightning_spear', treeNodeId: 'm_lightning_spear', name: '追蹤閃電長矛',
    icon: './assets/skills/sk_m_lightning_spear.png?v=241', cooldownMs: 7000, mpCost: 18,
    desc: '【T4 召喚・雷電】召喚活體閃電長矛全場追蹤彈跳 4 次，必掛【感電】並狂掉【爆裂電花】！',
    getDetail: (lvl) => `4 次追蹤雷矛，每次 ${145 + lvl * 26}% 雷傷（暴擊額外暈眩＋掉電花）。`,
  },
  m_familiar: {
    id: 'm_familiar', treeNodeId: 'm_familiar', name: '元素魔寵',
    icon: './assets/skills/sk_m_familiar.png?v=241', cooldownMs: 7200, mpCost: 18,
    desc: '【T4 召喚・三系】召喚三系元素魔寵同步施放火／冰／雷衝擊，快速累積【啟蒙】層數！',
    getDetail: (lvl) => `3 波三系衝擊共 ${270 + lvl * 40}% 傷，同時掛【灼燒】＋【凍結】＋【感電】！`,
  },

  // === T5 精通領域簇 (4 招 + 保留 black_hole / void_beam / mana_overload / icicle_rain 相容) ===
  meteor: {
    id: 'meteor', treeNodeId: 'm_meteor', name: '深淵隕石',
    icon: './assets/skills/sk_m_meteor.png?v=241', cooldownMs: 7200, mpCost: 26,
    desc: '【T5 精通・烈焰】召喚巨型熔岩隕石轟擊戰場並留下焦土，對灼燒目標暴傷 +50%。',
    getDetail: (lvl) => `轟擊造成 ${310 + lvl * 48}% 火焰傷害並掛【灼燒】。`,
  },
  m_firewall: {
    id: 'm_firewall', treeNodeId: 'm_firewall', name: '烈焰火牆',
    icon: './assets/skills/sk_m_firewall.png?v=241', cooldownMs: 6400, mpCost: 22,
    desc: '【T5 精通・烈焰】於地面展開持續燃燒的煉獄火牆 4 波，無限疊加【灼燒】層數！',
    getDetail: (lvl) => `4 波火牆焦土，每波 ${120 + lvl * 22}% 燃燒傷並疊加多層【灼燒】。`,
  },
  m_blizzard_field: {
    id: 'm_blizzard_field', treeNodeId: 'm_blizzard_field', name: '暴風雪',
    icon: './assets/skills/sk_m_blizzard_field.png?v=241', cooldownMs: 7000, mpCost: 24,
    desc: '【T5 精通・冰霜】召喚大範圍極寒暴風雪 4 波，持續凍結全場並引爆碎冰！',
    getDetail: (lvl) => `4 波極寒暴雪，每波 ${120 + lvl * 22}% 冰傷並持續【凍結】。`,
  },
  m_ball_lightning: {
    id: 'm_ball_lightning', treeNodeId: 'm_ball_lightning', name: '球狀閃電',
    icon: './assets/skills/sk_m_ball_lightning.png?v=241', cooldownMs: 5600, mpCost: 24,
    desc: '【T5 精通・雷電】釋放環繞高壓球狀閃電 4 段高速絞殺，極致觸發【感電】與幸運一擊！',
    getDetail: (lvl) => `4 段高壓電球，每段 ${115 + lvl * 20}% 雷傷並掛【感電】。`,
  },
  black_hole: {
    id: 'black_hole', treeNodeId: 'm_black_hole', name: '黑洞奇點',
    icon: './assets/skills/sk_m_black_hole.png?v=241', cooldownMs: 8200, mpCost: 24,
    desc: '【T5 精通・奧術】生成重力黑洞將敵群吸聚中心並掛【詛咒】＋【易傷】。',
    getDetail: (lvl) => `聚怪坍縮造成 ${250 + lvl * 38}% 奧術傷並掛【詛咒】＋【易傷】。`,
  },

  // === T6 終極奧義簇 (4 招) ===
  m_inferno: {
    id: 'm_inferno', treeNodeId: 'm_inferno', name: '煉獄巨蛇',
    icon: './assets/skills/sk_m_inferno.png?v=241', cooldownMs: 14500, mpCost: 0,
    desc: '【T6 終極・烈焰】召喚巨型煉獄火蛇纏繞聚怪連燒 5 波，8 秒內所有火焰技能零魔耗！',
    getDetail: (lvl) => `5 波全場煉獄火海，每波 ${175 + lvl * 30}% 傷並回滿魔力！`,
  },
  m_deep_freeze: {
    id: 'm_deep_freeze', treeNodeId: 'm_deep_freeze', name: '極寒深凍',
    icon: './assets/skills/sk_m_deep_freeze.png?v=241', cooldownMs: 15000, mpCost: 0,
    desc: '【T6 終極・冰霜】化為無敵冰棺 4 波極寒凍結＋終點碎冰大爆，結束後所有技能 CD 減半！',
    getDetail: (lvl) => `回血 35%、4 波冰爆共 ${440 + lvl * 65}% 冰傷並立即縮短全技能 CD 50%！`,
  },
  m_unstable_currents: {
    id: 'm_unstable_currents', treeNodeId: 'm_unstable_currents', name: '不穩電流',
    icon: './assets/skills/sk_m_unstable_currents.png?v=241', cooldownMs: 14800, mpCost: 0,
    desc: '【T6 終極・雷電】進入 8 秒【不穩電流】：全場狂劈 5 波高壓天雷，施法自動免費觸發隨機雷技！',
    getDetail: (lvl) => `5 波天雷每波 ${170 + lvl * 30}% 必暴雷傷，8 秒內施法免費連發雷電！`,
  },
  m_astral_supernova: {
    id: 'm_astral_supernova', treeNodeId: 'm_astral_supernova', name: '星界超新星',
    icon: './assets/skills/sk_m_astral_supernova.png?v=241', cooldownMs: 15200, mpCost: 0,
    desc: '【T6 終極・奧術】引爆暗黑星蝕超新星，全場必暴毀滅衝擊、回滿 MP 並立即疊滿【啟蒙】！',
    getDetail: (lvl) => `全場必暴 ${420 + lvl * 62}% 奧術傷，回滿 MP 並掛【易傷】＋【詛咒】！`,
  },
};
