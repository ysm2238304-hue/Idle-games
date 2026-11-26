// v261: 暗黑四 24 招暗影刺客完整技能書（6 槽位 × 4 招：基礎產影能／核心輸出／瞬影防禦／毒爆控場／分身毒刃／終極奧義）
export const ASSASSIN_SKILLS = {
  // ===================== [1] 基礎產影能（0 耗影能，回能＋疊暗影星） =====================
  a_twin_fang: {
    id: 'a_twin_fang', treeNodeId: 'a_twin_fang', name: '雙牙快刺',
    icon: './assets/skills/sk_a_twin_fang.png?v=261', cooldownMs: 2200,
    desc: '【基礎】單體極速雙刃連刺，立即累積 +2 顆暗影星印並回復 15 點影能、觸發雙毒。',
    getDetail: (lvl) => `雙段連刺共造成 ${148 + lvl * 20}% 傷害、+2 暗影星並回 15 影能。`,
  },
  a_blade_shift: {
    id: 'a_blade_shift', treeNodeId: 'a_blade_shift', name: '影刃位移',
    icon: './assets/skills/sk_a_blade_shift.png?v=261', cooldownMs: 2400,
    desc: '【基礎】180px 穿怪滑步斬，獲得 2.5 秒移速 +25% 與閃避 +15%，+1 暗影星並回 14 影能。',
    getDetail: (lvl) => `穿刺滑步造成 ${138 + lvl * 18}% 傷害、+1 暗影星並回復 14 影能。`,
  },
  a_venom_slash: {
    id: 'a_venom_slash', treeNodeId: 'a_venom_slash', name: '劇毒影斬',
    icon: './assets/skills/sk_a_venom_slash.png?v=261', cooldownMs: 2400,
    desc: '【基礎】130° 前方毒刃扇形橫掃，掛【中毒】並觸發雙毒油化合反應，+1 暗影星並回 15 影能。',
    getDetail: (lvl) => `130° 扇形毒斬造成 ${142 + lvl * 18}% 毒傷、+1 暗影星並回 15 影能。`,
  },
  a_shuriken_fan: {
    id: 'a_shuriken_fan', treeNodeId: 'a_shuriken_fan', name: '影鏢三連',
    icon: './assets/skills/sk_a_shuriken_fan.png?v=261', cooldownMs: 2300,
    desc: '【基礎】110° 扇形擲出 3 枚血月手裡劍遠距貫穿，掛【流血】、+1 暗影星並回 14 影能。',
    getDetail: (lvl) => `3 枚手裡劍每枚造成 ${74 + lvl * 12}% 傷害、掛【流血】並回 14 影能。`,
  },

  // ===================== [2] 核心耗影能輸出 =====================
  a_boomerang_blades: {
    id: 'a_boomerang_blades', treeNodeId: 'a_boomerang_blades', name: '迴旋雙刃',
    icon: './assets/skills/sk_a_boomerang_blades.png?v=261', cooldownMs: 4800,
    desc: '【核心】460px 直線擲出旋轉暗影雙刃來回貫穿 2 次，雙段附加【易傷】與【流血】。',
    getDetail: (lvl) => `去回 2 段旋轉斬擊每段造成 ${145 + lvl * 24}% 暗影傷並掛【易傷】＋【流血】。`,
  },
  blade_flurry: {
    id: 'blade_flurry', treeNodeId: 'a_flurry', name: '劍刃亂舞',
    icon: './assets/skills/sk_a_flurry.png?v=261', cooldownMs: 4600,
    desc: '【核心】3 波 245px 高速圓環刃氣風暴絞殺敵群，掛【流血】並每命中回復影能。',
    getDetail: (lvl) => `3 波暗影刃氣環每波造成 ${92 + lvl * 16}% 傷害並掛【流血】。`,
  },
  poison_kunai: {
    id: 'poison_kunai', treeNodeId: 'a_kunai', name: '淬毒苦無',
    icon: './assets/skills/sk_a_kunai.png?v=261', cooldownMs: 4400,
    desc: '【核心】120° 扇形齊射 5 把貫穿淬毒苦無，高層數疊加【劇毒】並留下苦無殘痕。',
    getDetail: (lvl) => `5 把貫穿苦無每把造成 ${90 + lvl * 16}% 毒傷並疊加【劇毒】。`,
  },
  a_twisting_blades: {
    id: 'a_twisting_blades', treeNodeId: 'a_twisting_blades', name: '迴旋絞殺刃',
    icon: './assets/skills/sk_a_twisting_blades.png?v=261', cooldownMs: 4600,
    desc: '【核心】招牌穿刺雙刃！刺入目標 0.45 秒後自動折返穿回英雄位置，回程雙倍傷害並減 CD 1.2s！',
    getDetail: (lvl) => `突刺造成 ${165 + lvl * 24}% 傷，折返穿回造成 ${245 + lvl * 34}% 傷並減 CD 1.2s。`,
  },

  // ===================== [3] 瞬影位移與防禦 =====================
  shadow_blitz: {
    id: 'shadow_blitz', treeNodeId: 'a_blitz', name: '瞬影閃襲',
    icon: './assets/skills/sk_a_blitz.png?v=261', cooldownMs: 4800,
    desc: '【瞬影】真實閃現 320px 至敵群身側發動交叉雙刃暴擊斬，獲得 2.5 秒閃避 +20%。',
    getDetail: (lvl) => `閃現斬擊造成 ${195 + lvl * 28}% 傷害（暴擊率 +25%），2.5 秒閃避 +20%。`,
  },
  a_shadow_backstab: {
    id: 'a_shadow_backstab', treeNodeId: 'a_shadow_backstab', name: '影步背刺',
    icon: './assets/skills/sk_a_shadow_backstab.png?v=261', cooldownMs: 5400,
    desc: '【瞬影】真實瞬移至目標背後必定暴擊背刺，附加【易傷】與【流血】並返還 1.5s CD！',
    getDetail: (lvl) => `必定暴擊造成 ${275 + lvl * 38}% 背刺傷，掛【易傷】＋【流血】並返還 1.5s CD。`,
  },
  smoke_veil: {
    id: 'smoke_veil', treeNodeId: 'a_smoke', name: '煙霧隱遁',
    icon: './assets/skills/sk_a_smoke.png?v=261', cooldownMs: 7400,
    desc: '【防禦】進入 1.8 秒真實隱遁無敵並釋放 270px 致盲毒霧，回復 24 影能且閃避 +30%。',
    getDetail: (lvl) => `1.8s 隱身無敵，致盲緩速 270px 造成 ${125 + lvl * 18}% 傷並回 24 影能。`,
  },
  a_blood_cloak: {
    id: 'a_blood_cloak', treeNodeId: 'a_blood_cloak', name: '血月影衣',
    icon: './assets/skills/sk_a_blood_cloak.png?v=261', cooldownMs: 8000,
    desc: '【防禦】凝聚 35% 血月護盾屏障與 15% 吸血，並向周圍散射暗紅反擊血刃。',
    getDetail: (lvl) => `獲得 ${35 + lvl * 3}% 血月護盾並回復 14% 生命，散射造成 ${165 + lvl * 22}% 血刃傷。`,
  },

  // ===================== [4] 毒爆與控場 =====================
  venom_burst: {
    id: 'venom_burst', treeNodeId: 'a_burst', name: '毒刃引爆',
    icon: './assets/skills/sk_a_burst.png?v=261', cooldownMs: 5800,
    desc: '【毒爆】引爆 260px 內所有敵人身上的【劇毒】，對中毒目標傷害 +65% 並觸發雙毒爆破！',
    getDetail: (lvl) => `260px 毒爆造成 ${220 + lvl * 34}% 傷害（對【劇毒】目標 +65% 並留酸坑）。`,
  },
  a_crimson_mist: {
    id: 'a_crimson_mist', treeNodeId: 'a_crimson_mist', name: '猩紅毒霧彈',
    icon: './assets/skills/sk_a_crimson_mist.png?v=261', cooldownMs: 7200,
    desc: '【實體】召喚 4 幀動態猩紅毒霧核心持續 7 秒，週期噴吐腐蝕毒火同時掛【中毒】＋【灼燒】。',
    getDetail: (lvl) => `動態毒霧核心持續 7s，每 1.15s 造成 ${115 + lvl * 18}% 傷並掛【中毒】＋【灼燒】。`,
  },
  a_garrote_bind: {
    id: 'a_garrote_bind', treeNodeId: 'a_garrote_bind', name: '血線絞殺',
    icon: './assets/skills/sk_a_garrote.png?v=261', cooldownMs: 6800,
    desc: '【控場】340px 暗紅影線捆綁拉扯敵群至中心並硬暈眩 2.0 秒，全體掛【流血】與【易傷】。',
    getDetail: (lvl) => `聚怪絞殺 340px 敵群造成 ${185 + lvl * 26}% 傷害、暈眩 2.0s 並掛【流血】＋【易傷】。`,
  },
  a_shadow_decoy_bomb: {
    id: 'a_shadow_decoy_bomb', treeNodeId: 'a_shadow_decoy_bomb', name: '影爆替身',
    icon: './assets/skills/sk_a_shadow_decoy_bomb.png?v=261', cooldownMs: 7000,
    desc: '【實體】後撤 160px 並留下 4 幀動態血影炸彈替身，2 秒後劇烈引爆 290px 暗影血爆並暈眩！',
    getDetail: (lvl) => `血影替身 2s 後引爆造成 ${255 + lvl * 36}% 必暴暗影傷並暈眩 1.6s。`,
  },

  // ===================== [E] 分身與毒刃精通 =====================
  shadow_clones: {
    id: 'shadow_clones', treeNodeId: 'a_clones', name: '影分身連擊',
    icon: './assets/skills/sk_a_clones.png?v=261', cooldownMs: 8200,
    desc: '【分身】召喚 2 位 4 幀動態暗影刺客分身存在 10 秒，自主閃現繞背雙刃連斬！',
    getDetail: (lvl) => `召喚 2 位動態分身作戰 10s，每擊造成 ${110 + lvl * 18}% 暗影背刺傷。`,
  },
  a_death_lotus: {
    id: 'a_death_lotus', treeNodeId: 'a_death_lotus', name: '死神蓮華陣',
    icon: './assets/skills/sk_a_death_lotus.png?v=261', cooldownMs: 6800,
    desc: '【精通】3 波 280px 漫天暗紅飛刀蓮華雨覆蓋敵群，疊加 +2 暗影星並掛【流血】。',
    getDetail: (lvl) => `3 波蓮華刀雨每波造成 ${130 + lvl * 20}% 傷害、掛【流血】並 +2 暗影星。`,
  },
  a_venom_imbue: {
    id: 'a_venom_imbue', treeNodeId: 'a_venom_imbue', name: '劇毒淬刃',
    icon: './assets/skills/sk_a_venom_imbue.png?v=261', cooldownMs: 7800,
    desc: '【精通】爆發 260px 酸液衝擊波並開啟 6 秒【雙毒過載】：全毒傷 +45%、回 20 影能！',
    getDetail: (lvl) => `爆發 ${210 + lvl * 30}% 劇毒傷害，6 秒雙毒過載 +45% 並回 20 影能。`,
  },
  lethal_fangs: {
    id: 'lethal_fangs', treeNodeId: 'a_fangs', name: '致命毒牙',
    icon: './assets/skills/sk_a_fangs.png?v=261', cooldownMs: 8000,
    desc: '【實體】召喚 2 把 4 幀動態環繞血毒魔刃繞身高速切割 9 秒，同時獲得 5 秒攻速 +45%！',
    getDetail: (lvl) => `2 把動態環繞魔刃持續 9s 切割近敵，每擊造成 ${95 + lvl * 16}% 毒血傷。`,
  },

  // ===================== [R] 終極毀滅奧義 =====================
  shadow_execute: {
    id: 'shadow_execute', treeNodeId: 'a_execute', name: '暗影絕殺陣',
    icon: './assets/skills/sk_a_execute.png?v=261', cooldownMs: 12500,
    desc: '【終極】300px 七重暗紫十字絕殺斬線，目標 HP < 50% 必暴且總傷 +70%，擊殺返還 35% CD！',
    getDetail: (lvl) => `絕殺陣造成 ${285 + lvl * 40}% 傷害；HP < 50% 必暴且 +70%，擊殺減 CD 35%。`,
  },
  a_thousand_shadows: {
    id: 'a_thousand_shadows', treeNodeId: 'a_thousand_shadows', name: '千影滅絕葬',
    icon: './assets/skills/sk_a_thousand_shadows.png?v=261', cooldownMs: 14200,
    desc: '【終極】展開血月劍陣進行 5 段 360px 高速千影連斬，並召喚 1 位動態暗影分身協戰！',
    getDetail: (lvl) => `5 段必暴千影斬每段造成 ${155 + lvl * 24}% 暗影傷並引爆全場印毒。`,
  },
  a_crimson_eclipse: {
    id: 'a_crimson_eclipse', treeNodeId: 'a_crimson_eclipse', name: '血月絕影域',
    icon: './assets/skills/sk_a_crimson_eclipse.png?v=261', cooldownMs: 14800,
    desc: '【終極】喚出血月五星絕殺紋（380px），3 段必暴血月裂爆並掛【流血】＋【易傷】＋【中毒】！',
    getDetail: (lvl) => `3 段血月五星裂爆每段造成 ${195 + lvl * 30}% 必暴傷並掛三重致命異常！`,
  },
  a_reaper_dance: {
    id: 'a_reaper_dance', treeNodeId: 'a_reaper_dance', name: '死神影舞',
    icon: './assets/skills/sk_a_reaper_dance.png?v=261', cooldownMs: 13800,
    desc: '【終極】2.0 秒無敵化身暗影旋風高速瞬移連斬 6 名敵人，每斬必暴並掉落暗影血星珠！',
    getDetail: (lvl) => `2.0s 無敵高速瞬斬 6 次，每次造成 ${175 + lvl * 26}% 必暴暗影傷並掉血星珠！`,
  },
};
