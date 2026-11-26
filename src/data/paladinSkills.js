// v263: 暗黑四 24 招聖殿騎士完整技能書（6 階層 × 4 招：基礎回聖能／核心聖光／鐵壁防禦／懲戒位移／光環聖旗／終極天罰）
export const PALADIN_SKILLS = {
  // ===================== [1] 基礎技能（0 耗聖能，回聖能＋疊聖光印記／定罪） =====================
  p_smite_lash: {
    id: 'p_smite_lash', treeNodeId: 'p_smite_lash', name: '聖光鞭撻',
    icon: './assets/skills/sk_p_smite_lash.png?v=263', cooldownMs: 2400,
    desc: '【基礎】110° 扇形揮出熾熱聖光長鞭，穩定施加【定罪】並回復 18 點聖能。',
    getDetail: (lvl) => `110° 扇形造成 ${148 + lvl * 22}% 聖光傷害、施加【定罪】並回復 18 聖能。`,
  },
  p_zeal_strike: {
    id: 'p_zeal_strike', treeNodeId: 'p_zeal_strike', name: '狂熱連斬',
    icon: './assets/skills/sk_p_zeal_strike.png?v=263', cooldownMs: 2300,
    desc: '【基礎】150px 扇形極速三段聖刃連斬，每段疊 1 層【聖光印記】共回 21 點聖能。',
    getDetail: (lvl) => `三段連斬共造成 ${156 + lvl * 22}% 傷害、+3 聖光印記並回復 21 聖能。`,
  },
  p_holy_bolt: {
    id: 'p_holy_bolt', treeNodeId: 'p_holy_bolt', name: '聖光箭',
    icon: './assets/skills/sk_p_holy_bolt.png?v=263', cooldownMs: 2400,
    desc: '【基礎】520px 遠距發射穿透 2 名敵人的聖光飛箭，命中回復 3% 最大生命與 16 聖能。',
    getDetail: (lvl) => `貫穿 2 敵各造成 ${138 + lvl * 20}% 聖光傷害，回 3% 生命並回 16 聖能。`,
  },
  p_justice_hammer: {
    id: 'p_justice_hammer', treeNodeId: 'p_justice_hammer', name: '正義飛鎚',
    icon: './assets/skills/sk_p_justice_hammer.png?v=263', cooldownMs: 2500,
    desc: '【基礎】480px 投擲旋轉正義聖鎚，命中目標分裂 2 道聖光弧並掛【定罪】、回 18 聖能。',
    getDetail: (lvl) => `飛鎚造成 ${132 + lvl * 18}% 傷害並分裂 2 道光弧（各 ${62 + lvl * 10}%），回 18 聖能。`,
  },

  // ===================== [2] 核心技能（耗聖能主力輸出） =====================
  blessed_hammer: {
    id: 'blessed_hammer', treeNodeId: 'p_hammer', name: '祝福之鎚',
    icon: './assets/skills/sk_p_hammer.png?v=263', cooldownMs: 4600,
    desc: '【核心】召喚 3–4 把實體旋轉聖鎚以阿基米德螺旋繞身擴張絞殺；對暈眩／定罪敵人 +25%。',
    getDetail: (lvl) => `召喚 ${3 + (lvl >= 4 ? 1 : 0)} 把旋轉聖鎚，每把造成 ${105 + lvl * 20}% 攻擊傷害（暈眩／定罪 +25%）。`,
  },
  heaven_fist: {
    id: 'heaven_fist', treeNodeId: 'p_heaven', name: '天堂之拳',
    icon: './assets/skills/sk_p_heaven.png?v=263', cooldownMs: 5800,
    desc: '【核心】鎖定目標降下 150px 金色聖雷天罰轟擊，並向四周分裂 6 道穿透聖光箭矢。',
    getDetail: (lvl) => `天罰造成 ${218 + lvl * 36}% 聖雷傷害，分裂 6 道聖光箭各造成 ${68 + lvl * 12}% 傷害。`,
  },
  p_holy_lance: {
    id: 'p_holy_lance', treeNodeId: 'p_holy_lance', name: '聖槍貫穿',
    icon: './assets/skills/sk_p_holy_lance.png?v=263', cooldownMs: 5400,
    desc: '【核心】560×80px 投擲黃金審判聖槍直線貫穿敵群，對【定罪】目標傷害 +55%。',
    getDetail: (lvl) => `直線貫穿造成 ${245 + lvl * 38}% 聖光傷害（定罪目標 +55%）。`,
  },
  divine_storm: {
    id: 'divine_storm', treeNodeId: 'p_storm', name: '神聖風暴',
    icon: './assets/skills/sk_p_storm.png?v=263', cooldownMs: 5200,
    desc: '【核心】揮舞戰鎚釋放 260px 擴張型金色聖光環絞殺敵群，每命中 1 敵回 3% 生命與 3 聖能。',
    getDetail: (lvl) => `聖光環造成 ${182 + lvl * 32}% 攻擊傷害，每命中 1 隻敵人回復 3% 最大生命與 3 聖能。`,
  },

  // ===================== [3] 防禦技能（護盾／鐵壁／結界／回復） =====================
  holy_aegis: {
    id: 'holy_aegis', treeNodeId: 'p_aegis', name: '聖光神盾',
    icon: './assets/skills/sk_p_aegis.png?v=263', cooldownMs: 8000,
    desc: '【防禦】展開吸收 45% 最大生命的金色聖盾 5 秒，護甲 +50% 且受擊觸發 190px 聖光反傷新星。',
    getDetail: (lvl) => `獲得 ${42 + lvl * 6}% 最大生命聖盾 5 秒，受擊釋放 ${85 + lvl * 18}% 護甲聖光反傷。`,
  },
  p_redemption_prayer: {
    id: 'p_redemption_prayer', treeNodeId: 'p_redemption_prayer', name: '救贖禱言',
    icon: './assets/skills/sk_p_redemption_prayer.png?v=263', cooldownMs: 9000,
    desc: '【防禦】降下天使羽環瞬間回復 38% 最大生命，並以 240px 聖光淨化衝擊周圍敵群。',
    getDetail: (lvl) => `回復 ${35 + lvl * 3}% 最大生命，並對 240px 周圍造成 ${165 + lvl * 25}% 淨化聖傷。`,
  },
  shield_bash: {
    id: 'shield_bash', treeNodeId: 'p_bash', name: '盾牌猛擊',
    icon: './assets/skills/sk_p_bash.png?v=263', cooldownMs: 4800,
    desc: '【防禦】260×100px 持盾高速衝撞敵群並擊退暈眩 1.0 秒，附加護甲 65%+ 轉傷害。',
    getDetail: (lvl) => `衝撞造成 ${160 + lvl * 28}% 攻擊＋護甲 ${65 + lvl * 10}% 額外傷害，並暈眩 1.0 秒。`,
  },
  p_sanctuary_ward: {
    id: 'p_sanctuary_ward', treeNodeId: 'p_sanctuary_ward', name: '聖域結界',
    icon: './assets/skills/sk_p_sanctuary_ward.png?v=263', cooldownMs: 8600,
    desc: '【防禦】於腳下部署 5 秒 230px 藍金六芒聖域結界，減傷 30% 並持續反彈 120% 護甲聖傷。',
    getDetail: (lvl) => `結界持續 5 秒減傷 30%，每波反彈 ${120 + lvl * 22}% 護甲聖傷並淨化減益。`,
  },

  // ===================== [4] 懲戒／機動技能（衝鋒／聚怪／空降／審判） =====================
  p_crusader_charge: {
    id: 'p_crusader_charge', treeNodeId: 'p_crusader_charge', name: '聖光十字衝鋒',
    icon: './assets/skills/sk_p_crusader_charge.png?v=263', cooldownMs: 6200,
    desc: '【懲戒】舉盾衝鋒 340px 並沿途燃起 4 段聖光十字火道，附加【灼燒】與【定罪】。',
    getDetail: (lvl) => `340px 十字聖火路徑造成 ${215 + lvl * 32}% 傷害並掛【灼燒】＋【定罪】。`,
  },
  judgment: {
    id: 'judgment', treeNodeId: 'p_judgment', name: '聖光審判',
    icon: './assets/skills/sk_p_judgment.png?v=263', cooldownMs: 6600,
    desc: '【懲戒】跳砸目標區域引發 210px 十字聖印爆破，暈眩 1.5 秒並每命中 1 敵回 4 聖能。',
    getDetail: (lvl) => `十字爆破造成 ${240 + lvl * 42}% 聖傷並暈眩 1.5 秒，每命中 1 敵回 4 聖能。`,
  },
  p_condemn_pull: {
    id: 'p_condemn_pull', treeNodeId: 'p_condemn_pull', name: '天譴聚爆',
    icon: './assets/skills/sk_p_condemn_pull.png?v=263', cooldownMs: 6800,
    desc: '【懲戒】釋放 280px 聖光引力漩渦將周圍敵群拉向中心，1 秒蓄能後引爆重擊並掛【易傷】。',
    getDetail: (lvl) => `280px 聚怪後引爆 ${238 + lvl * 38}% 聖雷重擊，附加【易傷】＋【定罪】。`,
  },
  p_falling_sword: {
    id: 'p_falling_sword', treeNodeId: 'p_falling_sword', name: '天降聖劍',
    icon: './assets/skills/sk_p_falling_sword.png?v=263', cooldownMs: 7400,
    desc: '【懲戒】躍空化作金色流星轟落目標點（240px），留存十字裂地並擊飛周圍敵群。',
    getDetail: (lvl) => `流星轟擊造成 ${265 + lvl * 44}% 聖火傷並擊飛暈眩 1.2 秒，附加【灼燒】。`,
  },

  // ===================== [5] 精通／光環召喚技能（奉獻／懲戒／荊棘／烈陽聖旗） =====================
  consecration: {
    id: 'consecration', treeNodeId: 'p_consecration', name: '奉獻聖地',
    icon: './assets/skills/sk_p_consecration.png?v=263', cooldownMs: 7400,
    desc: '【精通】在腳下展開持續 4 秒的 250px 金色奉獻法陣，每秒灼燒敵人並回復英雄生命。',
    getDetail: (lvl) => `4 波聖光脈衝每波造成 ${82 + lvl * 16}% 傷害，並每秒回復 ${3.5 + lvl * 0.8}% 最大生命。`,
  },
  radiant_aura: {
    id: 'radiant_aura', treeNodeId: 'p_aura', name: '熾光懲戒光環',
    icon: './assets/skills/sk_p_aura.png?v=263', cooldownMs: 7200,
    desc: '【精通】震退周圍敵人並回 28 聖能，4.5 秒內全傷 +25%、普攻附帶聖光連鎖電弧。',
    getDetail: (lvl) => `震擊造成 ${138 + lvl * 24}% 傷害、回 28 聖能，4.5 秒內全傷 +${24 + lvl * 4}%。`,
  },
  p_thorns_aura: {
    id: 'p_thorns_aura', treeNodeId: 'p_thorns_aura', name: '荊棘復仇光環',
    icon: './assets/skills/sk_p_thorns_aura.png?v=263', cooldownMs: 7200,
    desc: '【精通】展開黃金荊棘光環，將 280% 護甲值轉為 240px 範圍反傷刺波並掛【易傷】。',
    getDetail: (lvl) => `爆發 ${180 + lvl * 28}% 攻擊＋280% 護甲值荊棘反傷，附加【易傷】。`,
  },
  p_solar_beacon: {
    id: 'p_solar_beacon', treeNodeId: 'p_solar_beacon', name: '烈陽聖標',
    icon: './assets/skills/sk_p_solar_beacon.png?v=263', cooldownMs: 8200,
    desc: '【精通】插下持續 8 秒的實體「烈陽聖旗」，每 1.8 秒對 280px 內降下烈陽光柱掛【定罪】＋【灼燒】。',
    getDetail: (lvl) => `烈陽聖旗持續 8 秒，每波光柱造成 ${135 + lvl * 22}% 聖火傷並掛【定罪】＋【灼燒】。`,
  },

  // ===================== [6] 終極奧義（大招） =====================
  p_seraph_descent: {
    id: 'p_seraph_descent', treeNodeId: 'p_seraph_descent', name: '熾天使降臨',
    icon: './assets/skills/sk_p_seraph_descent.png?v=263', cooldownMs: 14400,
    desc: '【終極】展開熾天使聖光羽翼回復 30% 生命，4 秒內連續降下 4 波全場追蹤天界審判光柱！',
    getDetail: (lvl) => `展開光翼回復 30% 血，並對全場降下 4 波 ${185 + lvl * 30}% 聖光神罰！`,
  },
  p_heavens_verdict: {
    id: 'p_heavens_verdict', treeNodeId: 'p_heavens_verdict', name: '天罰審判巨劍',
    icon: './assets/skills/sk_p_heavens_verdict.png?v=263', cooldownMs: 14800,
    desc: '【終極】召喚蒼穹黃金巨劍劈落 320px 雷霆，引爆全場【定罪】與【感電】目標且必定暴擊！',
    getDetail: (lvl) => `巨劍落雷造成 ${390 + lvl * 55}% 毀滅聖雷傷，必掛【定罪】＋【感電】且必定暴擊！`,
  },
  p_valkyrie_avatar: {
    id: 'p_valkyrie_avatar', treeNodeId: 'p_valkyrie_avatar', name: '英靈聖衛降臨',
    icon: './assets/skills/sk_p_valkyrie_avatar.png?v=263', cooldownMs: 15000,
    desc: '【終極】召喚實體「天界英靈聖衛」協戰 10 秒，自主尋敵揮出聖光順劈並替英雄分擔 20% 傷害！',
    getDetail: (lvl) => `英靈聖衛持續 10 秒，每次順劈造成 ${165 + lvl * 28}% 聖傷並提供 20% 傷害分擔。`,
  },
  p_akarats_wrath: {
    id: 'p_akarats_wrath', treeNodeId: 'p_akarats_wrath', name: '神聖化身',
    icon: './assets/skills/sk_p_akarats_wrath.png?v=263', cooldownMs: 15200,
    desc: '【終極】進入 8 秒「神聖戰神」形態（攻速 +35%、暴擊 +20%、聖能消耗減半），每秒自動召喚 1 把免費祝福之鎚！',
    getDetail: (lvl) => `8 秒戰神爆發：攻速 +35%、暴擊 +20%、每秒免費召喚 ${115 + lvl * 22}% 祝福之鎚！`,
  },
};
