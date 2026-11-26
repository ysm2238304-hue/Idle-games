// v255: 暗黑四 24 招狂戰士完整技能書（6 槽位 × 4 招：基礎產怒／核心耗怒／防禦戰吼／搏鬥位移／武器精通／終極奧義）
export const WARRIOR_SKILLS = {
  // ===================== [1] 基礎產怒（0 耗怒，穩定產能） =====================
  w_rend_slash: {
    id: 'w_rend_slash', treeNodeId: 'w_rend_slash', name: '撕裂重擊',
    icon: './assets/skills/sk_w_rend_slash.png?v=255', cooldownMs: 2400,
    desc: '【基礎】135° 前方橫掃猩紅巨刃，穩定疊加【流血】並回復 14 點怒氣。',
    getDetail: (lvl) => `135° 扇形斬擊造成 ${135 + lvl * 18}% 攻擊傷害、附加 4.5 秒【流血】並回復 14 怒氣。`,
  },
  w_lunging_strike: {
    id: 'w_lunging_strike', treeNodeId: 'w_lunging_strike', name: '突進重劈',
    icon: './assets/skills/sk_w_lunging_strike.png?v=255', cooldownMs: 2500,
    desc: '【基礎】朝目標高速突進 240px 並劈出烈焰重擊，貼臉黏怪、掛【流血】並回復 14 怒氣。',
    getDetail: (lvl) => `突進貼近敵人造成 ${140 + lvl * 18}% 傷害、回復 14 怒氣並提升 2 秒移速 +20%。`,
  },
  w_frenzy_flurry: {
    id: 'w_frenzy_flurry', treeNodeId: 'w_frenzy_flurry', name: '狂亂雙連斬',
    icon: './assets/skills/sk_w_frenzy_flurry.png?v=255', cooldownMs: 2200,
    desc: '【基礎】單體鎖定極速雙斧二連斬，疊加【狂亂】攻速層數（最高 5 層）並回復 12 怒氣。',
    getDetail: (lvl) => `2 段單體連斬每段造成 ${80 + lvl * 12}% 傷害，每層狂亂提供 +8% 攻速與 +4% 減傷，並回 12 怒氣。`,
  },
  w_bash_crush: {
    id: 'w_bash_crush', treeNodeId: 'w_bash_crush', name: '重鎚震擊',
    icon: './assets/skills/sk_w_bash_crush.png?v=255', cooldownMs: 2600,
    desc: '【基礎】單體鎖定重錘猛擊並暈眩 1.2 秒；每第 4 下必定觸發【壓制】並回復 15 怒氣。',
    getDetail: (lvl) => `造成 ${145 + lvl * 20}% 傷害與 1.2 秒暈眩，第 4 次命中必壓制並回復 15 怒氣。`,
  },

  // ===================== [2] 核心耗怒輸出 =====================
  whirlwind: {
    id: 'whirlwind', treeNodeId: 'w_whirlwind', name: '旋風重斬',
    icon: './assets/skills/sk_whirlwind.png?v=255', cooldownMs: 4800,
    desc: '【核心】高速旋轉烈焰巨劍 1.2 秒，4 段絞殺半徑 240px 敵人並吸血；對【流血】目標傷害 +25%。',
    getDetail: (lvl) => `4 段旋轉斬擊每段造成 ${90 + lvl * 16}% 傷害（流血目標 +25%），每段回復 2.5% 最大生命。`,
  },
  w_ancient_hammer: {
    id: 'w_ancient_hammer', treeNodeId: 'w_ancient_hammer', name: '上古之錘',
    icon: './assets/skills/sk_w_ancient_hammer.png?v=255', cooldownMs: 5600,
    desc: '【核心】傾瀉怒氣砸下上古巨錘，留下地裂坑、極高機率觸發【壓制】並附加【易傷】。',
    getDetail: (lvl) => `範圍 250px 重擊造成 ${250 + lvl * 34}% 傷害，壓制率 +25% 並掛【易傷】。`,
  },
  w_upheaval_wave: {
    id: 'w_upheaval_wave', treeNodeId: 'w_upheaval_wave', name: '動地裂波',
    icon: './assets/skills/sk_w_upheaval_wave.png?v=255', cooldownMs: 5400,
    desc: '【核心】以武器掀翻大地，朝前方 110° 扇形 420px 轟出碎岩衝擊波並擊退敵群。',
    getDetail: (lvl) => `420px 扇形碎岩波造成 ${235 + lvl * 32}% 火焰岩石傷害並擊退掛【灼燒】。`,
  },
  w_double_swing: {
    id: 'w_double_swing', treeNodeId: 'w_double_swing', name: '雙持交叉斬',
    icon: './assets/skills/sk_w_double_swing.png?v=255', cooldownMs: 4400,
    desc: '【核心】雙斧 160° 交叉重劈，命中【暈眩】或【易傷】敵人立即返還 40% 消耗怒氣！',
    getDetail: (lvl) => `160° 交叉重斬造成 ${220 + lvl * 30}% 傷害，命中控場目標返還 40% 怒氣並掛【易傷】。`,
  },

  // ===================== [3] 防禦與戰吼 =====================
  w_iron_skin: {
    id: 'w_iron_skin', treeNodeId: 'w_iron_skin', name: '鋼鐵戰膚',
    icon: './assets/skills/sk_w_iron_skin.png?v=255', cooldownMs: 8200,
    desc: '【防禦】凝聚精鋼護盾屏障（38% 最大生命）並進入 2.0 秒霸體，震傷周圍敵人。',
    getDetail: (lvl) => `獲得 ${35 + lvl * 3}% 最大生命護盾與 18% 回血，並對周圍造成 ${145 + lvl * 20}% 護甲震擊。`,
  },
  warcry: {
    id: 'warcry', treeNodeId: 'w_warcry', name: '狂戰血吼',
    icon: './assets/skills/sk_warcry.png?v=255', cooldownMs: 8400,
    desc: '【戰吼】震退周圍 320px 敵人並進入 6 秒【狂暴】：攻速 +35%、吸血 +12%、全傷 +25%。',
    getDetail: (lvl) => `震擊造成 ${130 + lvl * 18}% 傷害並進入 6 秒狂暴（攻速 +${30 + lvl * 4}%、吸血 +12%）。`,
  },
  w_challenging_shout: {
    id: 'w_challenging_shout', treeNodeId: 'w_challenging_shout', name: '挑戰怒吼',
    icon: './assets/skills/sk_w_challenging_shout.png?v=255', cooldownMs: 8800,
    desc: '【戰吼】嘲諷聚攏 340px 敵群並開啟 5 秒荊棘護甲壁壘，受擊額外回怒並反震傷害。',
    getDetail: (lvl) => `嘲諷敵群造成 ${120 + lvl * 18}% 傷害，5 秒內減傷 35%、荊棘反傷並受擊回怒 +8。`,
  },
  w_rallying_cry: {
    id: 'w_rallying_cry', treeNodeId: 'w_rallying_cry', name: '集結戰吼',
    icon: './assets/skills/sk_w_rallying_cry.png?v=255', cooldownMs: 8600,
    desc: '【戰吼】插下戰旗解除控制、回復 24 怒氣，6 秒內怒氣獲取 +65% 且強化場上先祖與圖騰。',
    getDetail: (lvl) => `立即回復 24 怒氣與 15% 生命，6 秒內資源獲取 +65%、移速 +25% 並為召喚物續命。`,
  },

  // ===================== [4] 搏鬥位移與控場 =====================
  bloodcharge: {
    id: 'bloodcharge', treeNodeId: 'w_bloodcharge', name: '血怒衝鋒',
    icon: './assets/skills/sk_bloodcharge.png?v=255', cooldownMs: 5600,
    desc: '【搏鬥】朝目標直線 360px 猛烈衝鋒，將路徑敵人撞飛擊退至終點並掛 4.5 秒【流血】。',
    getDetail: (lvl) => `直線衝撞造成 ${195 + lvl * 28}% 傷害、擊退撞飛並回復 ${10 + lvl * 1.5}% 最大生命。`,
  },
  earth_stomp: {
    id: 'earth_stomp', treeNodeId: 'w_stomp', name: '大地踐踏',
    icon: './assets/skills/sk_stomp.png?v=255', cooldownMs: 6800,
    desc: '【搏鬥】重踏大地將 320px 內所有怪物強力聚攏並硬暈眩 1.8 秒，同時回復 18 怒氣。',
    getDetail: (lvl) => `聚攏 320px 敵人造成 ${175 + lvl * 24}% 傷害、暈眩 1.8 秒並回復 18 怒氣。`,
  },
  w_chain_grasp: {
    id: 'w_chain_grasp', treeNodeId: 'w_chain_grasp', name: '鎖鏈拖曳',
    icon: './assets/skills/sk_w_chain_grasp.png?v=255', cooldownMs: 6600,
    desc: '【搏鬥】擲出 3 條燃燒鐵鍊將 380px 內敵人強拉至身前，全體附加【易傷】與【灼燒】。',
    getDetail: (lvl) => `鉤抓拉扯 380px 敵人造成 ${180 + lvl * 24}% 傷害並掛【易傷】＋【灼燒】。`,
  },
  w_leap_slam: {
    id: 'w_leap_slam', treeNodeId: 'w_leap_slam', name: '戰神躍擊',
    icon: './assets/skills/sk_w_leap_slam.png?v=255', cooldownMs: 6400,
    desc: '【搏鬥】高空拋物線躍向目標（最高 380px），落地重砸 260px 震飛敵群並回復 20 怒氣。',
    getDetail: (lvl) => `躍擊落地造成 ${210 + lvl * 28}% 範圍傷害、留下地裂坑並回復 20 怒氣。`,
  },

  // ===================== [E] 武器精通與戰場實體 =====================
  bladestorm: {
    id: 'bladestorm', treeNodeId: 'w_bladestorm', name: '烈焰劍氣波',
    icon: './assets/skills/sk_bladestorm.png?v=255', cooldownMs: 6800,
    desc: '【精通】朝前方劈出 3 道 500px 貫穿烈焰劍氣，命中【流血】敵人時必定暴擊！',
    getDetail: (lvl) => `發射 3 道貫穿劍氣，每道造成 ${155 + lvl * 24}% 傷害（對【流血】敵人必暴擊）。`,
  },
  w_rupture_impale: {
    id: 'w_rupture_impale', treeNodeId: 'w_rupture_impale', name: '血脈撕裂',
    icon: './assets/skills/sk_w_rupture_impale.png?v=255', cooldownMs: 7000,
    desc: '【精通】貫穿目標並引爆身上所有【流血】，觸發猩紅血爆並大量吸血！',
    getDetail: (lvl) => `貫穿造成 ${225 + lvl * 30}% 傷害（對【流血】目標翻倍並回復 14% 最大生命）。`,
  },
  volcano_totem: {
    id: 'volcano_totem', treeNodeId: 'w_volcano', name: '火山圖騰',
    icon: './assets/skills/sk_volcano.png?v=255', cooldownMs: 8200,
    desc: '【實體】召喚 4 幀動態熔岩圖騰立於戰場 14 秒，自主噴發灼熱火環轟炸 240px 敵群。',
    getDetail: (lvl) => `召喚火山圖騰持續 14 秒，每 1.35 秒轟炸 ${115 + lvl * 18}% 熔岩範圍傷並掛【灼燒】。`,
  },
  w_seismic_fissure: {
    id: 'w_seismic_fissure', treeNodeId: 'w_seismic_fissure', name: '熔岩裂縫',
    icon: './assets/skills/sk_w_seismic_fissure.png?v=255', cooldownMs: 7400,
    desc: '【精通】朝前方 460px 直線撕裂大地，連環引爆 3 段熔岩地火並留下焦土烙印。',
    getDetail: (lvl) => `直線 3 段熔岩裂縫每段造成 ${145 + lvl * 22}% 火焰傷害並掛【灼燒】＋【易傷】。`,
  },

  // ===================== [R] 終極毀滅奧義 =====================
  w_call_ancients: {
    id: 'w_call_ancients', treeNodeId: 'w_call_ancients', name: '先祖之魂召喚',
    icon: './assets/skills/sk_w_call_ancients.png?v=255', cooldownMs: 14500,
    desc: '【終極】同時召喚 3 位 4 幀動態上古先祖英靈（旋風斧／上古錘／血刃躍擊）自主作戰 12 秒！',
    getDetail: (lvl) => `3 位動態先祖英靈獨立鎖敵連斬 12 秒，每擊造成 ${165 + lvl * 24}% 傷害並掛【流血】＋【易傷】。`,
  },
  w_wrath_berserker: {
    id: 'w_wrath_berserker', treeNodeId: 'w_wrath_berserker', name: '狂戰神降臨',
    icon: './assets/skills/sk_w_wrath_berserker.png?v=255', cooldownMs: 15000,
    desc: '【終極】化身不滅狂戰神 7 秒（2 秒不可阻擋），引爆烈焰震波、攻速 +45% 且壓制必發！',
    getDetail: (lvl) => `爆發 ${310 + lvl * 42}% 烈焰震擊，7 秒狂暴攻速 +45%、移速 +25% 並掉落怒氣血珠。`,
  },
  execute_cleave: {
    id: 'execute_cleave', treeNodeId: 'w_execute', name: '斷罪處決',
    icon: './assets/skills/sk_execute.png?v=255', cooldownMs: 11500,
    desc: '【終極】140° 巨型暗紅處決斷頭斬，目標 HP < 50% 必暴擊且總傷 +75%，擊殺返還 35% 冷卻！',
    getDetail: (lvl) => `處決重斬造成 ${285 + lvl * 38}% 傷害；HP < 50% 必暴且 +75% 傷，擊殺減 CD 35%。`,
  },
  w_iron_maelstrom: {
    id: 'w_iron_maelstrom', treeNodeId: 'w_iron_maelstrom', name: '鋼鐵漩渦',
    icon: './assets/skills/sk_w_iron_maelstrom.png?v=255', cooldownMs: 13800,
    desc: '【終極】武器庫三段切換奧義：巨劍旋風流血 → 戰錘重砸暈眩 → 雙鎖鏈 360° 橫掃易傷！',
    getDetail: (lvl) => `三段武器庫連擊每段造成 ${195 + lvl * 28}% 範圍傷害，依序附加【流血】【暈眩】【易傷】。`,
  },
};
