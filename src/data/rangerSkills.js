// v259: 暗黑四 24 招暗影遊俠完整技能書（6 槽位 × 4 招：基礎產能／核心箭技／敏捷防禦／陷阱控場／分身獵殺／終極奧義）
export const RANGER_SKILLS = {
  // ===================== [1] 基礎產能（0 耗精力，回能＋疊連擊星） =====================
  r_shadow_imbue: {
    id: 'r_shadow_imbue', treeNodeId: 'r_shadow_imbue', name: '暗影灌注',
    icon: './assets/skills/sk_r_shadow_imbue.png?v=259', cooldownMs: 2500,
    desc: '【基礎】向箭矢注入暗影冥火，轟炸 210px 目標掛【易傷】＋【詛咒】，回復 15 精力並 +1 連擊星。',
    getDetail: (lvl) => `暗影爆炸造成 ${145 + lvl * 20}% 傷害、掛【易傷】＋【詛咒】並回 15 精力與 +1 連擊星。`,
  },
  r_puncture: {
    id: 'r_puncture', treeNodeId: 'r_puncture', name: '穿刺飛刀',
    icon: './assets/skills/sk_r_puncture.png?v=259', cooldownMs: 2300,
    desc: '【基礎】110° 扇形擲出 3 枚淬毒飛刀，近距離全中必掛【易傷】與【中毒】，回 14 精力。',
    getDetail: (lvl) => `3 枚飛刀每枚造成 ${72 + lvl * 12}% 毒傷，命中必掛【易傷】並回復 14 精力與 +1 連擊星。`,
  },
  r_heartseeker: {
    id: 'r_heartseeker', treeNodeId: 'r_heartseeker', name: '尋心追矢',
    icon: './assets/skills/sk_r_heartseeker.png?v=259', cooldownMs: 2200,
    desc: '【基礎】射出自動追蹤敵人的尋心影箭並彈射 1 名鄰近敵人，疊加暴擊率並回 14 精力。',
    getDetail: (lvl) => `追蹤箭造成 ${135 + lvl * 18}% 傷害並彈射 1 次，暴擊率 +15%、回 14 精力與 +1 連擊星。`,
  },
  r_forceful_arrow: {
    id: 'r_forceful_arrow', treeNodeId: 'r_forceful_arrow', name: '強襲擊退箭',
    icon: './assets/skills/sk_r_forceful_arrow.png?v=259', cooldownMs: 2600,
    desc: '【基礎】440px 直線貫穿重箭，每第 3 發強力擊退敵群並附加【易傷】，回 15 精力。',
    getDetail: (lvl) => `直線貫穿造成 ${150 + lvl * 20}% 傷害，第 3 發必擊退掛【易傷】並回 15 精力。`,
  },

  // ===================== [2] 核心耗能箭技 =====================
  volley: {
    id: 'volley', treeNodeId: 'r_volley', name: '穿透連射',
    icon: './assets/skills/sk_r_volley.png?v=259', cooldownMs: 4200,
    desc: '【核心】115° 扇形齊射 5 道貫穿翡翠光矢，暴擊率 +25% 並附加 5 秒【獵手印記】。',
    getDetail: (lvl) => `5 道貫穿光矢每道造成 ${88 + lvl * 16}% 傷害（暴擊率 +25%，掛【獵手印記】）。`,
  },
  r_venom_pierce: {
    id: 'r_venom_pierce', treeNodeId: 'r_venom_pierce', name: '劇毒貫穿箭',
    icon: './assets/skills/sk_r_venom_pierce.png?v=259', cooldownMs: 5000,
    desc: '【核心】580px 超長直線貫穿翡翠毒矛，對【易傷】目標傷害 +45% 並留下腐蝕毒泊。',
    getDetail: (lvl) => `直線貫穿造成 ${240 + lvl * 34}% 毒傷並掛【中毒】（對易傷目標 +45% 傷）。`,
  },
  r_frost_barrage: {
    id: 'r_frost_barrage', treeNodeId: 'r_frost_barrage', name: '寒霜散射箭',
    icon: './assets/skills/sk_r_frost_barrage.png?v=259', cooldownMs: 5200,
    desc: '【核心】3 波 120° 冰晶箭幕齊射，凍結敵群並對冰凍敵人觸發額外碎冰爆發。',
    getDetail: (lvl) => `3 波冰晶齊射每波造成 ${105 + lvl * 18}% 冰傷並附加【凍結】。`,
  },
  r_rapid_fire: {
    id: 'r_rapid_fire', treeNodeId: 'r_rapid_fire', name: '連珠速射',
    icon: './assets/skills/sk_r_rapid_fire.png?v=259', cooldownMs: 4600,
    desc: '【核心】鎖定目標極速連射 5 支高穿透暗影矢，單體打王爆發極高，暴擊返還 4 點精力！',
    getDetail: (lvl) => `5 連發點射每矢造成 ${76 + lvl * 13}% 傷害，暴擊立即返還 4 精力。`,
  },

  // ===================== [3] 敏捷位移與防禦 =====================
  shadowstep: {
    id: 'shadowstep', treeNodeId: 'r_shadowstep', name: '暗影瞬步',
    icon: './assets/skills/sk_r_shadowstep.png?v=259', cooldownMs: 5600,
    desc: '【敏捷】真實瞬移至 340px 目標身後，進入 1.5 秒殘影無敵＋3 秒閃避 +25%，原地引爆劇毒。',
    getDetail: (lvl) => `瞬移殘影無敵 1.5s，引爆劇毒造成 ${195 + lvl * 28}% 傷害（對印記目標 +75%）。`,
  },
  windwalk: {
    id: 'windwalk', treeNodeId: 'r_windwalk', name: '風行疾步',
    icon: './assets/skills/sk_r_windwalk.png?v=259', cooldownMs: 7400,
    desc: '【敏捷】解除控制並喚起疾風護體 5 秒：攻速 +40%、移速 +35% 並回復 22 精力。',
    getDetail: (lvl) => `5 秒內攻速 +${34 + lvl * 5}%、移速 +35%，回復 22 精力與 12% 生命。`,
  },
  r_smoke_decoy: {
    id: 'r_smoke_decoy', treeNodeId: 'r_smoke_decoy', name: '煙霧誘餌陷阱',
    icon: './assets/skills/sk_r_smoke_decoy.png?v=259', cooldownMs: 7200,
    desc: '【防禦】召喚 4 幀動態暗影誘餌實體嘲諷敵群 6 秒，持續噴吐毒煙並在結束時自爆回血 18%。',
    getDetail: (lvl) => `動態誘餌嘲諷 6s 並引爆 ${205 + lvl * 28}% 毒傷、回復 18% 生命並掛【中毒】＋【易傷】。`,
  },
  r_dark_shroud: {
    id: 'r_dark_shroud', treeNodeId: 'r_dark_shroud', name: '暗影帷幕',
    icon: './assets/skills/sk_r_dark_shroud.png?v=259', cooldownMs: 8200,
    desc: '【防禦】凝聚 5 層暗影護盾屏障（36% 最大生命），並向周圍散射暗影護衛箭矢。',
    getDetail: (lvl) => `獲得 ${34 + lvl * 3}% 暗影護盾與 15% 閃避，並散射造成 ${155 + lvl * 22}% 暗影傷害。`,
  },

  // ===================== [4] 陷阱與控場 =====================
  caltrops: {
    id: 'caltrops', treeNodeId: 'r_caltrops', name: '劇毒蒺藜陣',
    icon: './assets/skills/sk_r_caltrops.png?v=259', cooldownMs: 6400,
    desc: '【陷阱】後跳拉開 150px 並部署 4 幀動態劇毒蒺藜陣（8 秒），強力減速 50% 並持續跳毒。',
    getDetail: (lvl) => `動態蒺藜陣持續 8 秒，每 1.1s 造成 ${85 + lvl * 14}% 毒傷並強力減速 50%。`,
  },
  r_razor_snare: {
    id: 'r_razor_snare', treeNodeId: 'r_razor_snare', name: '血刃捕獸夾',
    icon: './assets/skills/sk_r_razor_snare.png?v=259', cooldownMs: 6600,
    desc: '【陷阱】部署 4 幀動態猩紅捕獸夾，將 240px 敵群扯向中心夾擊造成重創【流血】與【易傷】。',
    getDetail: (lvl) => `動態捕獸夾持續 8 秒，每次夾擊造成 ${185 + lvl * 26}% 傷害並掛【流血】＋【易傷】。`,
  },
  r_poison_trap: {
    id: 'r_poison_trap', treeNodeId: 'r_poison_trap', name: '劇毒地雷陣',
    icon: './assets/skills/sk_r_poison_trap.png?v=259', cooldownMs: 7000,
    desc: '【陷阱】埋設 3 顆連鎖劇毒地雷，引爆 3 波腐蝕毒雲並擊倒暈眩 1.5 秒、留下毒泊烙印。',
    getDetail: (lvl) => `3 波毒雷轟炸每波造成 ${135 + lvl * 20}% 劇毒傷害、暈眩 1.5s 並掛【中毒】。`,
  },
  r_smoke_grenade: {
    id: 'r_smoke_grenade', treeNodeId: 'r_smoke_grenade', name: '致盲毒煙彈',
    icon: './assets/skills/sk_r_smoke_grenade.png?v=259', cooldownMs: 6800,
    desc: '【控場】投擲暗紫致盲煙霧彈覆蓋 300px，使敵群致盲暈眩 2.4 秒並附加【易傷】。',
    getDetail: (lvl) => `300px 煙霧爆發造成 ${165 + lvl * 24}% 暗傷、致盲暈眩 2.4s 並掛【易傷】。`,
  },

  // ===================== [E] 分身與獵殺精通 =====================
  shadow_clones: {
    id: 'shadow_clones', treeNodeId: 'r_clones', name: '暗影分身',
    icon: './assets/skills/sk_r_clones.png?v=259', cooldownMs: 8400,
    desc: '【分身】召喚 2 位 4 幀動態暗影分身弓手存在 11 秒，獨立走位鎖敵齊射穿透影箭！',
    getDetail: (lvl) => `召喚 2 位動態分身作戰 11s，每箭造成 ${105 + lvl * 18}% 暗影傷並賦予【獵手印記】。`,
  },
  arrowrain: {
    id: 'arrowrain', treeNodeId: 'r_arrowrain', name: '翡翠箭雨',
    icon: './assets/skills/sk_r_arrowrain.png?v=259', cooldownMs: 6600,
    desc: '【精通】於 290px 區域降下 4 波翡翠箭雨；命中【印記】敵人延長減速並回復生命。',
    getDetail: (lvl) => `4 波箭雨每波造成 ${92 + lvl * 16}% 攻傷；命中印記敵人減速並回血 2%。`,
  },
  death_mark: {
    id: 'death_mark', treeNodeId: 'r_deathmark', name: '死神標記',
    icon: './assets/skills/sk_r_deathmark.png?v=259', cooldownMs: 7200,
    desc: '【精通】360px 範圍引爆全場死神印記並刷新標記，對已有印記目標造成雙倍暗影斬殺！',
    getDetail: (lvl) => `引爆 360px 死神印記造成 ${210 + lvl * 32}% 傷害（已標記目標傷害翻倍）。`,
  },
  r_gale_snipe: {
    id: 'r_gale_snipe', treeNodeId: 'r_gale_snipe', name: '疾風狙擊',
    icon: './assets/skills/sk_r_gale_snipe.png?v=259', cooldownMs: 6200,
    desc: '【精通】640px 超遠必暴穿透狙殺矢，擊退路徑敵人並立即獲得 +2 顆連擊星！',
    getDetail: (lvl) => `必定暴擊造成 ${275 + lvl * 38}% 穿透傷害並立即 +2 連擊星。`,
  },

  // ===================== [R] 終極毀滅奧義 =====================
  phantombow: {
    id: 'phantombow', treeNodeId: 'r_phantombow', name: '幻影狙殺箭',
    icon: './assets/skills/sk_r_phantombow.png?v=259', cooldownMs: 12800,
    desc: '【終極】射出 680×95px 必暴翡翠龍魂貫穿光束，引爆全場【獵手印記】造成連鎖星爆！',
    getDetail: (lvl) => `必暴貫穿造成 ${320 + lvl * 42}% 傷害，引爆印記額外造成 +65% 連鎖爆炸。`,
  },
  r_abyss_barrage: {
    id: 'r_abyss_barrage', treeNodeId: 'r_abyss_barrage', name: '深淵箭幕風暴',
    icon: './assets/skills/sk_r_abyss_barrage.png?v=259', cooldownMs: 14200,
    desc: '【終極】5 波 380px 暗影＋劇毒流星箭幕覆蓋全場，並召喚 1 位動態暗影分身協戰！',
    getDetail: (lvl) => `5 波流星箭雨每波造成 ${155 + lvl * 26}% 暗毒傷並掛【中毒】＋【易傷】。`,
  },
  r_void_hunter: {
    id: 'r_void_hunter', treeNodeId: 'r_void_hunter', name: '虛空獵手降臨',
    icon: './assets/skills/sk_r_void_hunter.png?v=259', cooldownMs: 15000,
    desc: '【終極】展開虛空星紋陣進入 6 秒【心眼無限精力】，向全場降下 3 波必暴虛空星爆！',
    getDetail: (lvl) => `3 波必暴星爆每波造成 ${210 + lvl * 34}% 虛空傷，並開啟 6 秒無限精力！`,
  },
  r_death_trap: {
    id: 'r_death_trap', treeNodeId: 'r_death_trap', name: '死亡陷阱',
    icon: './assets/skills/sk_r_death_trap.png?v=259', cooldownMs: 13600,
    desc: '【終極】部署 360px 暗紅死亡漩渦陷阱，將敵群吸入中心連爆 3 段致命影刃（擊殺減 CD 4 秒）！',
    getDetail: (lvl) => `漩渦聚怪 3 段絞殺每段造成 ${205 + lvl * 30}% 必暴傷害，擊殺立即縮短冷卻 4 秒！`,
  },
};
