export const TIER_THRESHOLDS = [0, 3, 7, 12, 17, 22];

export const CLASS_BUILD_INFO = {
  warrior: {
    name: '狂戰士星圖',
    color: '#ef4444',
    buildA: { name: '🩸 浴血狂戰流', color: '#f87171' },
    buildB: { name: '🌋 熔岩震盪流', color: '#fb923c' },
  },
  ranger: {
    name: '暗影遊俠星圖',
    color: '#10b981',
    buildA: { name: '🏹 疾風箭雨流', color: '#34d399' },
    buildB: { name: '☠️ 劇毒暗殺流', color: '#a3e635' },
  },
  mage: {
    name: '秘法師星圖',
    color: '#a855f7',
    buildA: { name: '☄️ 隕石星爆流', color: '#e879f9' },
    buildB: { name: '❄️ 永凍雷電控場流', color: '#38bdf8' },
  },
  paladin: {
    name: '聖殿騎士星圖',
    color: '#fbbf24',
    buildA: { name: '⚡ 審判重鎚流', color: '#fde047' },
    buildB: { name: '🛡️ 荊棘聖盾流', color: '#fb923c' },
  },
  necro: {
    name: '死靈法師星圖',
    color: '#2dd4bf',
    buildA: { name: '💀 亡靈君王召喚流', color: '#5eead4' },
    buildB: { name: '🩸 白骨屍爆流', color: '#fb7185' },
  },
  assassin: {
    name: '影殺刺客星圖',
    color: '#c084fc',
    buildA: { name: '⚡ 瞬影分身連斬流', color: '#d8b4fe' },
    buildB: { name: '☠️ 劇毒暗器引爆流', color: '#4ade80' },
  },
  shared: {
    name: '深淵通用星圖',
    color: '#f59e0b',
    buildA: { name: '⚔️ 狂暴輸出', color: '#ef4444' },
    buildB: { name: '💎 生存與刷寶', color: '#fbbf24' },
  },
};

export const SKILL_TREE_NODES = [
  // ==================== 狂戰士星圖 (22 節點, 8 主動, 2 互斥改造, 2 關鍵被動) ====================
  { id: 'w_whirlwind',    tree: 'warrior', tier: 1, reqPoints: 0, kind: 'active',  shape: 'square',  archetype: 'core', name: '旋風重斬', maxLvl: 5, req: null, x: 50, y: 8,  icon: './assets/skills/sk_whirlwind.png', desc: '核心主動技：高速旋轉烈焰巨劍絞殺敵群（每級每段 +18% 傷）。' },
  { id: 'w_p_might',      tree: 'warrior', tier: 1, reqPoints: 0, kind: 'passive', shape: 'circle',  archetype: 'A',    name: '嗜血本能', maxLvl: 5, req: { id: 'w_whirlwind', lvl: 1 }, x: 24, y: 10, desc: '每級攻擊力 +4%、吸血 +1%。' },
  { id: 'w_p_iron',       tree: 'warrior', tier: 1, reqPoints: 0, kind: 'passive', shape: 'circle',  archetype: 'B',    name: '熔岩護鎧', maxLvl: 5, req: { id: 'w_whirlwind', lvl: 1 }, x: 76, y: 10, desc: '每級最大生命 +5%、護甲 +8%。' },

  { id: 'w_bloodcharge',  tree: 'warrior', tier: 2, reqPoints: 3, kind: 'active',  shape: 'square',  archetype: 'A',    name: '血怒衝鋒', maxLvl: 5, req: { id: 'w_whirlwind', lvl: 1 }, x: 28, y: 24, icon: './assets/skills/sk_bloodcharge.png', desc: '流派 A 主動技：高速衝鋒撞飛敵人、附加流血並回血。' },
  { id: 'w_p_savage',     tree: 'warrior', tier: 2, reqPoints: 3, kind: 'passive', shape: 'circle',  archetype: 'core', name: '戰神覺醒', maxLvl: 5, req: { id: 'w_whirlwind', lvl: 1 }, x: 50, y: 24, desc: '每級暴擊率 +2%、暴擊傷害 +8%。' },
  { id: 'w_earthshatter', tree: 'warrior', tier: 2, reqPoints: 3, kind: 'active',  shape: 'square',  archetype: 'B',    name: '裂地猛擊', maxLvl: 5, req: { id: 'w_whirlwind', lvl: 1 }, x: 72, y: 24, icon: './assets/skills/sk_earthshatter.png', desc: '流派 B 主動技：重劍砸地暈眩 1.2 秒並引爆流血減 CD。' },

  { id: 'w_mod_leech',    tree: 'warrior', tier: 3, reqPoints: 7, kind: 'mod',     shape: 'diamond', archetype: 'A',    name: '改造：嗜血旋風', maxLvl: 1, req: { id: 'w_bloodcharge', lvl: 1 }, mutexGroup: 'w_m1', x: 16, y: 40, desc: '【二選一】旋風重斬每段額外回復 2% 最大生命，且必附帶流血。' },
  { id: 'w_mod_frenzy',   tree: 'warrior', tier: 3, reqPoints: 7, kind: 'mod',     shape: 'diamond', archetype: 'A',    name: '改造：血刃連斬', maxLvl: 1, req: { id: 'w_bloodcharge', lvl: 1 }, mutexGroup: 'w_m1', x: 38, y: 40, desc: '【二選一】血怒衝鋒冷卻縮短 20%，衝刺結束立即觸發一次重斬。' },
  { id: 'w_mod_magma',    tree: 'warrior', tier: 3, reqPoints: 7, kind: 'mod',     shape: 'diamond', archetype: 'B',    name: '改造：廣域熔岩', maxLvl: 1, req: { id: 'w_earthshatter', lvl: 1 }, mutexGroup: 'w_m2', x: 62, y: 40, desc: '【二選一】裂地猛擊半徑擴大 25%，並對暈眩敵人額外造成 40% 傷害。' },
  { id: 'w_mod_quake',    tree: 'warrior', tier: 3, reqPoints: 7, kind: 'mod',     shape: 'diamond', archetype: 'B',    name: '改造：餘震減冷', maxLvl: 1, req: { id: 'w_earthshatter', lvl: 1 }, mutexGroup: 'w_m2', x: 84, y: 40, desc: '【二選一】裂地猛擊每命中 1 名敵人回復 3 MP 並縮短冷卻 0.3 秒。' },

  { id: 'w_warcry',       tree: 'warrior', tier: 4, reqPoints: 12, kind: 'active', shape: 'square',  archetype: 'A',    name: '狂戰血吼', maxLvl: 5, req: { id: 'w_bloodcharge', lvl: 1 }, x: 26, y: 56, icon: './assets/skills/sk_warcry.png', desc: '流派 A 主動技：戰吼震退敵人並回魔，4.5 秒內攻速 +35%、吸血 +12%。' },
  { id: 'w_cdr',          tree: 'warrior', tier: 4, reqPoints: 12, kind: 'passive',shape: 'circle',  archetype: 'core', name: '戰意沸騰', maxLvl: 5, req: { id: 'w_p_savage', lvl: 1 }, x: 50, y: 56, desc: '每級縮短戰士所有主動技能冷卻時間 6%，移動速度 +3%。' },
  { id: 'w_volcano',      tree: 'warrior', tier: 4, reqPoints: 12, kind: 'active', shape: 'square',  archetype: 'B',    name: '火山圖騰', maxLvl: 5, req: { id: 'w_earthshatter', lvl: 1 }, x: 74, y: 56, icon: './assets/skills/sk_volcano.png', desc: '流派 B 主動技：召喚熔岩圖騰連續噴發 4 波灼熱火環。' },

  { id: 'w_execute',      tree: 'warrior', tier: 5, reqPoints: 17, kind: 'active', shape: 'square',  archetype: 'A',    name: '斷罪處決', maxLvl: 5, req: { id: 'w_warcry', lvl: 1 }, x: 18, y: 73, icon: './assets/skills/sk_execute.png', desc: '流派 A 大招：重斬終結技，對半血以下敵人必定暴擊且傷害 +60%。' },
  { id: 'w_bladestorm',   tree: 'warrior', tier: 5, reqPoints: 17, kind: 'active', shape: 'square',  archetype: 'B',    name: '烈焰劍氣波', maxLvl: 5, req: { id: 'w_cdr', lvl: 1 }, x: 50, y: 73, icon: './assets/skills/sk_bladestorm.png', desc: '貫穿大招：劈出 3 道巨大烈焰劍氣波，對流血敵人必暴擊。' },
  { id: 'w_stomp',        tree: 'warrior', tier: 5, reqPoints: 17, kind: 'active', shape: 'square',  archetype: 'B',    name: '大地踐踏', maxLvl: 5, req: { id: 'w_volcano', lvl: 1 }, x: 82, y: 73, icon: './assets/skills/sk_stomp.png', desc: '流派 B 大招：將半徑 310px 怪物強力聚攏至身邊並暈眩 1.5 秒。' },

  { id: 'w_key_blood',    tree: 'warrior', tier: 6, reqPoints: 22, kind: 'keystone', shape: 'octagon', archetype: 'A', name: '關鍵被動：不朽血怒', maxLvl: 1, req: { id: 'w_execute', lvl: 1 }, mutexGroup: 'w_key', x: 30, y: 90, desc: '【關鍵二選一】血量低於 55% 時攻速 +45%、吸血翻倍，且每次普攻額外附帶流血爆發！' },
  { id: 'w_key_earth',    tree: 'warrior', tier: 6, reqPoints: 22, kind: 'keystone', shape: 'octagon', archetype: 'B', name: '關鍵被動：大地主宰', maxLvl: 1, req: { id: 'w_stomp', lvl: 1 }, mutexGroup: 'w_key', x: 70, y: 90, desc: '【關鍵二選一】所有戰士主動技能傷害 +35%、範圍 +20%，且對暈眩敵人必觸發暴擊！' },

  // ==================== 暗影遊俠星圖 (22 節點, 8 主動, 2 互斥改造, 2 關鍵被動) ====================
  { id: 'r_volley',       tree: 'ranger', tier: 1, reqPoints: 0, kind: 'active',  shape: 'square',  archetype: 'core', name: '穿透連射', maxLvl: 5, req: null, x: 50, y: 8,  icon: './assets/skills/sk_r_volley.png', desc: '核心主動技：扇形齊射 5 道貫穿翡翠光矢並附加獵手印記。' },
  { id: 'r_p_swift',      tree: 'ranger', tier: 1, reqPoints: 0, kind: 'passive', shape: 'circle',  archetype: 'A',    name: '疾風射術', maxLvl: 5, req: { id: 'r_volley', lvl: 1 }, x: 24, y: 10, desc: '每級攻速 +5%、移速 +4%。' },
  { id: 'r_p_toxic',      tree: 'ranger', tier: 1, reqPoints: 0, kind: 'passive', shape: 'circle',  archetype: 'B',    name: '暗影致命', maxLvl: 5, req: { id: 'r_volley', lvl: 1 }, x: 76, y: 10, desc: '每級暴擊率 +2.5%、閃避率 +2%。' },

  { id: 'r_windwalk',     tree: 'ranger', tier: 2, reqPoints: 3, kind: 'active',  shape: 'square',  archetype: 'A',    name: '風行疾步', maxLvl: 5, req: { id: 'r_volley', lvl: 1 }, x: 28, y: 24, icon: './assets/skills/sk_r_windwalk.png', desc: '流派 A 主動技：4.5 秒內攻速 +40%、移速 +35% 並回魔。' },
  { id: 'r_p_focus',      tree: 'ranger', tier: 2, reqPoints: 3, kind: 'passive', shape: 'circle',  archetype: 'core', name: '鷹眼專注', maxLvl: 5, req: { id: 'r_volley', lvl: 1 }, x: 50, y: 24, desc: '每級暴擊傷害 +12%、攻擊力 +3%。' },
  { id: 'r_shadowstep',   tree: 'ranger', tier: 2, reqPoints: 3, kind: 'active',  shape: 'square',  archetype: 'B',    name: '暗影瞬步', maxLvl: 5, req: { id: 'r_volley', lvl: 1 }, x: 72, y: 24, icon: './assets/skills/sk_r_shadowstep.png', desc: '流派 B 主動技：瞬移拉開距離並引爆劇毒陷阱，閃避 +25%。' },

  { id: 'r_mod_fan',      tree: 'ranger', tier: 3, reqPoints: 7, kind: 'mod',     shape: 'diamond', archetype: 'A',    name: '改造：七星連射', maxLvl: 1, req: { id: 'r_windwalk', lvl: 1 }, mutexGroup: 'r_m1', x: 16, y: 40, desc: '【二選一】穿透連射改為發射 7 道光矢，並對命中敵人減速 1.5 秒。' },
  { id: 'r_mod_gale',     tree: 'ranger', tier: 3, reqPoints: 7, kind: 'mod',     shape: 'diamond', archetype: 'A',    name: '改造：疾風回魔', maxLvl: 1, req: { id: 'r_windwalk', lvl: 1 }, mutexGroup: 'r_m1', x: 38, y: 40, desc: '【二選一】風行疾步期間每次普攻額外回復 5 MP 且冷卻縮短 18%。' },
  { id: 'r_mod_venom',    tree: 'ranger', tier: 3, reqPoints: 7, kind: 'mod',     shape: 'diamond', archetype: 'B',    name: '改造：劇毒擴散', maxLvl: 1, req: { id: 'r_shadowstep', lvl: 1 }, mutexGroup: 'r_m2', x: 62, y: 40, desc: '【二選一】暗影瞬步毒爆範圍 +35% 並使所有目標中毒 4 秒。' },
  { id: 'r_mod_evade',    tree: 'ranger', tier: 3, reqPoints: 7, kind: 'mod',     shape: 'diamond', archetype: 'B',    name: '改造：幻影殘像', maxLvl: 1, req: { id: 'r_shadowstep', lvl: 1 }, mutexGroup: 'r_m2', x: 84, y: 40, desc: '【二選一】暗影瞬步閃避加成延長至 5 秒且立即回復 12% 最大生命。' },

  { id: 'r_arrowrain',    tree: 'ranger', tier: 4, reqPoints: 12, kind: 'active', shape: 'square',  archetype: 'A',    name: '翡翠箭雨', maxLvl: 5, req: { id: 'r_windwalk', lvl: 1 }, x: 26, y: 56, icon: './assets/skills/sk_r_arrowrain.png', desc: '流派 A 主動技：召喚 4 波大範圍箭雨轟炸並緩速敵人。' },
  { id: 'r_cdr',          tree: 'ranger', tier: 4, reqPoints: 12, kind: 'passive',shape: 'circle',  archetype: 'core', name: '疾風節奏', maxLvl: 5, req: { id: 'r_p_focus', lvl: 1 }, x: 50, y: 56, desc: '每級縮短遊俠所有主動技能冷卻時間 6%，掉寶率 +4%。' },
  { id: 'r_caltrops',     tree: 'ranger', tier: 4, reqPoints: 12, kind: 'active', shape: 'square',  archetype: 'B',    name: '劇毒蒺藜陣', maxLvl: 5, req: { id: 'r_shadowstep', lvl: 1 }, x: 74, y: 56, icon: './assets/skills/sk_r_caltrops.png', desc: '流派 B 主動技：地面佈下持續 4 秒劇毒蒺藜陣，強力減速與跳毒傷。' },

  { id: 'r_phantombow',   tree: 'ranger', tier: 5, reqPoints: 17, kind: 'active', shape: 'square',  archetype: 'A',    name: '幻影狙殺箭', maxLvl: 5, req: { id: 'r_arrowrain', lvl: 1 }, x: 18, y: 73, icon: './assets/skills/sk_r_phantombow.png', desc: '流派 A 大招：射出必定暴擊的青翠龍魂箭貫穿全排並引爆印記。' },
  { id: 'r_clones',       tree: 'ranger', tier: 5, reqPoints: 17, kind: 'active', shape: 'square',  archetype: 'B',    name: '暗影分身', maxLvl: 5, req: { id: 'r_cdr', lvl: 1 }, x: 50, y: 73, icon: './assets/skills/sk_r_clones.png', desc: '分身大招：召喚 2 道暗影分身同步齊射 6 支貫穿影箭。' },
  { id: 'r_deathmark',    tree: 'ranger', tier: 5, reqPoints: 17, kind: 'active', shape: 'square',  archetype: 'B',    name: '死神標記', maxLvl: 5, req: { id: 'r_caltrops', lvl: 1 }, x: 82, y: 73, icon: './assets/skills/sk_r_deathmark.png', desc: '流派 B 大招：全場引爆死神印記，對已標記目標造成雙倍爆發！' },

  { id: 'r_key_gale',     tree: 'ranger', tier: 6, reqPoints: 22, kind: 'keystone', shape: 'octagon', archetype: 'A', name: '關鍵被動：疾風連射', maxLvl: 1, req: { id: 'r_phantombow', lvl: 1 }, mutexGroup: 'r_key', x: 30, y: 90, desc: '【關鍵二選一】暴擊時 45% 機率免費額外射出 2 支貫穿翡翠箭，且遊俠攻速 +25%！' },
  { id: 'r_key_plague',   tree: 'ranger', tier: 6, reqPoints: 22, kind: 'keystone', shape: 'octagon', archetype: 'B', name: '關鍵被動：劇毒蔓延', maxLvl: 1, req: { id: 'r_deathmark', lvl: 1 }, mutexGroup: 'r_key', x: 70, y: 90, desc: '【關鍵二選一】擁有【印記】的怪物死亡時自動引爆劇毒星爆，對周圍造成 140% 攻傷！' },

  // ==================== 秘法師星圖 (22 節點, 8 主動, 2 互斥改造, 2 關鍵被動) ====================
  { id: 'm_meteor',       tree: 'mage', tier: 1, reqPoints: 0, kind: 'active',  shape: 'square',  archetype: 'core', name: '深淵隕石', maxLvl: 5, req: null, x: 50, y: 8,  icon: './assets/skills/sk_m_meteor.png', desc: '核心主動技：召喚紫焰隕石轟擊目標區域（對冰寒目標 +35% 傷）。' },
  { id: 'm_p_arcane',     tree: 'mage', tier: 1, reqPoints: 0, kind: 'passive', shape: 'circle',  archetype: 'A',    name: '奧術泉湧', maxLvl: 5, req: { id: 'm_meteor', lvl: 1 }, x: 24, y: 10, desc: '每級攻擊力 +4.5%、最大魔力 +10。' },
  { id: 'm_p_ward',       tree: 'mage', tier: 1, reqPoints: 0, kind: 'passive', shape: 'circle',  archetype: 'B',    name: '星界結界', maxLvl: 5, req: { id: 'm_meteor', lvl: 1 }, x: 76, y: 10, desc: '每級每秒回魔 +1.5、最大生命 +5%。' },

  { id: 'm_arcane_orb',   tree: 'mage', tier: 2, reqPoints: 3, kind: 'active',  shape: 'square',  archetype: 'A',    name: '星界奧術球', maxLvl: 5, req: { id: 'm_meteor', lvl: 1 }, x: 28, y: 24, icon: './assets/skills/sk_m_arcane_orb.png', desc: '流派 A 主動技：釋放 3 顆貫穿星界奧術球並引爆碎冰。' },
  { id: 'm_p_sage',       tree: 'mage', tier: 2, reqPoints: 3, kind: 'passive', shape: 'circle',  archetype: 'core', name: '賢者洞察', maxLvl: 5, req: { id: 'm_meteor', lvl: 1 }, x: 50, y: 24, desc: '每級暴擊率 +2%、掉寶率 +6%。' },
  { id: 'm_frost_nova',   tree: 'mage', tier: 2, reqPoints: 3, kind: 'active',  shape: 'square',  archetype: 'B',    name: '寒冰新星', maxLvl: 5, req: { id: 'm_meteor', lvl: 1 }, x: 72, y: 24, icon: './assets/skills/sk_m_frost_nova.png', desc: '流派 B 主動技：引爆極寒冰環使敵人冰寒減速 3.5 秒並張開護盾。' },

  { id: 'm_mod_comet',    tree: 'mage', tier: 3, reqPoints: 7, kind: 'mod',     shape: 'diamond', archetype: 'A',    name: '改造：雙重隕石', maxLvl: 1, req: { id: 'm_arcane_orb', lvl: 1 }, mutexGroup: 'm_m1', x: 16, y: 40, desc: '【二選一】深淵隕石落地後 0.4 秒自動再追加 1 顆小型余燼隕石（70% 傷害）。' },
  { id: 'm_mod_orbs',     tree: 'mage', tier: 3, reqPoints: 7, kind: 'mod',     shape: 'diamond', archetype: 'A',    name: '改造：五星連珠', maxLvl: 1, req: { id: 'm_arcane_orb', lvl: 1 }, mutexGroup: 'm_m1', x: 38, y: 40, desc: '【二選一】星界奧術球從 3 顆擴增為 5 顆，暴擊率額外 +15%。' },
  { id: 'm_mod_freeze',   tree: 'mage', tier: 3, reqPoints: 7, kind: 'mod',     shape: 'diamond', archetype: 'B',    name: '改造：絕對凍結', maxLvl: 1, req: { id: 'm_frost_nova', lvl: 1 }, mutexGroup: 'm_m2', x: 62, y: 40, desc: '【二選一】寒冰新星直接暈眩（凍結）半徑內敵人 1.4 秒並使護盾量 +35%。' },
  { id: 'm_mod_shatter',  tree: 'mage', tier: 3, reqPoints: 7, kind: 'mod',     shape: 'diamond', archetype: 'B',    name: '改造：冰環減冷', maxLvl: 1, req: { id: 'm_frost_nova', lvl: 1 }, mutexGroup: 'm_m2', x: 84, y: 40, desc: '【二選一】寒冰新星冷卻時間縮短 22% 且冰寒持續延長至 5 秒。' },

  { id: 'm_overload',     tree: 'mage', tier: 4, reqPoints: 12, kind: 'active', shape: 'square',  archetype: 'A',    name: '魔力超載', maxLvl: 5, req: { id: 'm_arcane_orb', lvl: 1 }, x: 26, y: 56, icon: './assets/skills/sk_m_overload.png', desc: '流派 A 主動技：瞬回 60% MP 並疊滿 5 層充能，4.5 秒內技能傷 +35%。' },
  { id: 'm_cdr',          tree: 'mage', tier: 4, reqPoints: 12, kind: 'passive',shape: 'circle',  archetype: 'core', name: '魔力湧動', maxLvl: 5, req: { id: 'm_p_sage', lvl: 1 }, x: 50, y: 56, desc: '每級縮短法師所有主動技能冷卻時間 6%，回魔速度 +1.5/s。' },
  { id: 'm_lightning',    tree: 'mage', tier: 4, reqPoints: 12, kind: 'active', shape: 'square',  archetype: 'B',    name: '風暴閃電鏈', maxLvl: 5, req: { id: 'm_frost_nova', lvl: 1 }, x: 74, y: 56, icon: './assets/skills/sk_m_lightning.png', desc: '流派 B 主動技：在最多 6 名敵人間高速彈跳，對冰寒目標 +85% 傷害。' },

  { id: 'm_void_beam',    tree: 'mage', tier: 5, reqPoints: 17, kind: 'active', shape: 'square',  archetype: 'A',    name: '虛空星爆', maxLvl: 5, req: { id: 'm_overload', lvl: 1 }, x: 18, y: 73, icon: './assets/skills/sk_m_void_beam.png', desc: '流派 A 大招：消耗奧術充能射出必定暴擊的貫穿星辰雷射。' },
  { id: 'm_icicles',      tree: 'mage', tier: 5, reqPoints: 17, kind: 'active', shape: 'square',  archetype: 'B',    name: '極寒冰錐雨', maxLvl: 5, req: { id: 'm_cdr', lvl: 1 }, x: 50, y: 73, icon: './assets/skills/sk_m_icicles.png', desc: '冰霜大招：降下 4 波極寒冰錐雨轟炸並附加冰寒減速。' },
  { id: 'm_blackhole',    tree: 'mage', tier: 5, reqPoints: 17, kind: 'active', shape: 'square',  archetype: 'B',    name: '黑洞奇點', maxLvl: 5, req: { id: 'm_lightning', lvl: 1 }, x: 82, y: 73, icon: './assets/skills/sk_m_blackhole.png', desc: '流派 B 大招：召喚黑洞將半徑 330px 敵人吸至中心後引爆虛空衝擊。' },

  { id: 'm_key_astral',   tree: 'mage', tier: 6, reqPoints: 22, kind: 'keystone', shape: 'octagon', archetype: 'A', name: '關鍵被動：星界過載', maxLvl: 1, req: { id: 'm_void_beam', lvl: 1 }, mutexGroup: 'm_key', x: 30, y: 90, desc: '【關鍵二選一】法師技能傷害 +30%，且施放主動技能時 35% 機率不消耗魔力並返還 30% 冷卻！' },
  { id: 'm_key_zero',     tree: 'mage', tier: 6, reqPoints: 22, kind: 'keystone', shape: 'octagon', archetype: 'B', name: '關鍵被動：絕對零度', maxLvl: 1, req: { id: 'm_blackhole', lvl: 1 }, mutexGroup: 'm_key', x: 70, y: 90, desc: '【關鍵二選一】對【冰寒】敵人所有傷害額外 +45%，且閃電鏈／奧術彈擊殺冰寒敵人時全場濺射冰爆！' },


  // ==================== 聖殿騎士星圖 (18 節點, 8 主動, 4 改造, 2 關鍵被動) ====================
  { id: 'p_hammer',       tree: 'paladin', tier: 1, reqPoints: 0, kind: 'active',  shape: 'square',  archetype: 'core', name: '祝福之鎚', maxLvl: 5, req: null, x: 50, y: 8,  icon: './assets/skills/sk_p_hammer.png', desc: '核心主動技：召喚 3 把旋轉聖光戰鎚繞身盤旋絞殺敵群。' },
  { id: 'p_p_faith',      tree: 'paladin', tier: 1, reqPoints: 0, kind: 'passive', shape: 'circle',  archetype: 'A',    name: '聖光狂熱', maxLvl: 5, req: { id: 'p_hammer', lvl: 1 }, x: 24, y: 10, desc: '每級攻擊力 +4%、聖光傷害 +6%。' },
  { id: 'p_p_bulwark',    tree: 'paladin', tier: 1, reqPoints: 0, kind: 'passive', shape: 'circle',  archetype: 'B',    name: '聖殿壁壘', maxLvl: 5, req: { id: 'p_hammer', lvl: 1 }, x: 76, y: 10, desc: '每級最大生命 +5%、護甲 +10%。' },

  { id: 'p_heaven',       tree: 'paladin', tier: 2, reqPoints: 3, kind: 'active',  shape: 'square',  archetype: 'A',    name: '天堂之拳', maxLvl: 5, req: { id: 'p_hammer', lvl: 1 }, x: 28, y: 24, icon: './assets/skills/sk_p_heaven.png', desc: '流派 A 主動技：降下金色聖雷天罰並分裂 6 道聖光箭。' },
  { id: 'p_p_zeal',       tree: 'paladin', tier: 2, reqPoints: 3, kind: 'passive', shape: 'circle',  archetype: 'core', name: '熾天使之誓', maxLvl: 5, req: { id: 'p_hammer', lvl: 1 }, x: 50, y: 24, icon: './assets/skills/sk_p_seraph.png', desc: '每級暴擊率 +2%、最大聖能 +10、護甲轉攻擊 +5%。' },
  { id: 'p_bash',         tree: 'paladin', tier: 2, reqPoints: 3, kind: 'active',  shape: 'square',  archetype: 'B',    name: '盾牌猛擊', maxLvl: 5, req: { id: 'p_hammer', lvl: 1 }, x: 72, y: 24, icon: './assets/skills/sk_p_bash.png', desc: '流派 B 主動技：持盾衝撞擊退敵人，附加護甲轉傷與暈眩。' },

  { id: 'p_mod_spiral',   tree: 'paladin', tier: 3, reqPoints: 7, kind: 'mod',     shape: 'diamond', archetype: 'A',    name: '改造：雙倍聖鎚', maxLvl: 1, req: { id: 'p_heaven', lvl: 1 }, mutexGroup: 'p_m1', x: 16, y: 40, icon: './assets/skills/sk_p_edict.png', desc: '【二選一】祝福之鎚額外多召喚 2 把聖鎚且旋轉速度 +25%。' },
  { id: 'p_mod_bolts',    tree: 'paladin', tier: 3, reqPoints: 7, kind: 'mod',     shape: 'diamond', archetype: 'A',    name: '改造：聖雷連爆', maxLvl: 1, req: { id: 'p_heaven', lvl: 1 }, mutexGroup: 'p_m1', x: 38, y: 40, desc: '【二選一】天堂之拳分裂聖光箭增至 8 道並暈眩目標 0.8 秒。' },
  { id: 'p_mod_thorns',   tree: 'paladin', tier: 3, reqPoints: 7, kind: 'mod',     shape: 'diamond', archetype: 'B',    name: '改造：荊棘聖盾', maxLvl: 1, req: { id: 'p_bash', lvl: 1 }, mutexGroup: 'p_m2', x: 62, y: 40, desc: '【二選一】盾牌猛擊後獲得 3 秒 35% 減傷，反傷提高 50%。' },
  { id: 'p_mod_taunt',    tree: 'paladin', tier: 3, reqPoints: 7, kind: 'mod',     shape: 'diamond', archetype: 'B',    name: '改造：堅毅回血', maxLvl: 1, req: { id: 'p_bash', lvl: 1 }, mutexGroup: 'p_m2', x: 84, y: 40, desc: '【二選一】盾牌猛擊每命中 1 敵人回復 3% 最大生命與 4 點聖能。' },

  { id: 'p_storm',        tree: 'paladin', tier: 4, reqPoints: 12, kind: 'active', shape: 'square',  archetype: 'A',    name: '神聖風暴', maxLvl: 5, req: { id: 'p_heaven', lvl: 1 }, x: 26, y: 56, icon: './assets/skills/sk_p_storm.png', desc: '流派 A 主動技：釋放擴張型金色聖光環並回復聖能與生命。' },
  { id: 'p_cdr',          tree: 'paladin', tier: 4, reqPoints: 12, kind: 'passive',shape: 'circle',  archetype: 'core', name: '天堂律令', maxLvl: 5, req: { id: 'p_p_zeal', lvl: 1 }, x: 50, y: 56, icon: './assets/skills/sk_p_edict.png', desc: '每級縮短聖騎士所有技能冷卻 6%、移速 +3%。' },
  { id: 'p_aegis',        tree: 'paladin', tier: 4, reqPoints: 12, kind: 'active', shape: 'square',  archetype: 'B',    name: '聖光神盾', maxLvl: 5, req: { id: 'p_bash', lvl: 1 }, x: 74, y: 56, icon: './assets/skills/sk_p_aegis.png', desc: '流派 B 主動技：展開吸收傷害的聖盾，受擊觸發聖光反傷新星。' },

  { id: 'p_judgment',     tree: 'paladin', tier: 5, reqPoints: 17, kind: 'active', shape: 'square',  archetype: 'A',    name: '聖光審判', maxLvl: 5, req: { id: 'p_storm', lvl: 1 }, x: 18, y: 73, icon: './assets/skills/sk_p_judgment.png', desc: '流派 A 大招：跳砸引發十字聖印爆破，高傷並暈眩 1.5 秒。' },
  { id: 'p_aura',         tree: 'paladin', tier: 5, reqPoints: 17, kind: 'active', shape: 'square',  archetype: 'core', name: '熾光懲戒光環', maxLvl: 5, req: { id: 'p_cdr', lvl: 1 }, x: 50, y: 73, icon: './assets/skills/sk_p_aura.png', desc: '聖光領域：震退敵人並回 28 聖能，4.5 秒內全傷害 +25%。' },
  { id: 'p_consecration', tree: 'paladin', tier: 5, reqPoints: 17, kind: 'active', shape: 'square',  archetype: 'B',    name: '奉獻聖地', maxLvl: 5, req: { id: 'p_aegis', lvl: 1 }, x: 82, y: 73, icon: './assets/skills/sk_p_consecration.png', desc: '流派 B 大招：腳下展開 4 秒金色聖光法陣持續灼燒敵人並回血。' },

  { id: 'p_key_judgment', tree: 'paladin', tier: 6, reqPoints: 22, kind: 'keystone', shape: 'octagon', archetype: 'A', name: '關鍵被動：聖光裁決', maxLvl: 1, req: { id: 'p_judgment', lvl: 1 }, mutexGroup: 'p_key', x: 30, y: 90, icon: './assets/skills/sk_p_key_judgment.png', desc: '【關鍵二選一】聖騎士所有技能傷害 +35%，對暈眩目標必定暴擊！' },
  { id: 'p_key_bulwark',  tree: 'paladin', tier: 6, reqPoints: 22, kind: 'keystone', shape: 'octagon', archetype: 'B', name: '關鍵被動：不朽聖壁', maxLvl: 1, req: { id: 'p_consecration', lvl: 1 }, mutexGroup: 'p_key', x: 70, y: 90, icon: './assets/skills/sk_p_key_bulwark.png', desc: '【關鍵二選一】護甲額外 +40% 並轉化為攻擊力，聖光反傷必定暴擊！' },


  // ==================== 死靈法師星圖 (18 節點, 8 主動, 4 改造, 2 關鍵被動) ====================
  { id: 'n_skeleton',     tree: 'necro', tier: 1, reqPoints: 0, kind: 'active',  shape: 'square',  archetype: 'core', name: '骷髏復生', maxLvl: 5, req: null, x: 50, y: 8,  icon: './assets/skills/sk_n_skeleton.png', desc: '核心主動技：召喚 2 名骷髏戰士在場上自動追擊砍殺敵人。' },
  { id: 'n_p_summon',     tree: 'necro', tier: 1, reqPoints: 0, kind: 'passive', shape: 'circle',  archetype: 'A',    name: '亡靈統御', maxLvl: 5, req: { id: 'n_skeleton', lvl: 1 }, x: 24, y: 10, desc: '每級召喚物傷害 +8%、最大魂能 +10。' },
  { id: 'n_p_bone',       tree: 'necro', tier: 1, reqPoints: 0, kind: 'passive', shape: 'circle',  archetype: 'B',    name: '骸骨護鎧', maxLvl: 5, req: { id: 'n_skeleton', lvl: 1 }, x: 76, y: 10, icon: './assets/skills/sk_n_bonearmor.png', desc: '每級最大生命 +5%、白骨技能傷害 +6%。' },

  { id: 'n_golem',        tree: 'necro', tier: 2, reqPoints: 3, kind: 'active',  shape: 'square',  archetype: 'A',    name: '鮮血魔像', maxLvl: 5, req: { id: 'n_skeleton', lvl: 1 }, x: 28, y: 24, icon: './assets/skills/sk_n_golem.png', desc: '流派 A 主動技：召喚巨型鮮血魔像震擊敵群並為英雄回血。' },
  { id: 'n_p_essence',    tree: 'necro', tier: 2, reqPoints: 3, kind: 'passive', shape: 'circle',  archetype: 'core', name: '魂能汲取', maxLvl: 5, req: { id: 'n_skeleton', lvl: 1 }, x: 50, y: 24, icon: './assets/skills/sk_n_phylactery.png', desc: '每級攻擊力 +4%、暴擊率 +2%、擊殺額外回復 3 魂能。' },
  { id: 'n_spear',        tree: 'necro', tier: 2, reqPoints: 3, kind: 'active',  shape: 'square',  archetype: 'B',    name: '白骨長矛', maxLvl: 5, req: { id: 'n_skeleton', lvl: 1 }, x: 72, y: 24, icon: './assets/skills/sk_n_spear.png', desc: '流派 B 主動技：發射高速貫穿全排的蒼白骨矛並附加【詛咒】。' },

  { id: 'n_mod_horde',    tree: 'necro', tier: 3, reqPoints: 7, kind: 'mod',     shape: 'diamond', archetype: 'A',    name: '改造：骸骨軍團', maxLvl: 1, req: { id: 'n_golem', lvl: 1 }, mutexGroup: 'n_m1', x: 16, y: 40, desc: '【二選一】骷髏上限 +2，且每次召喚額外多喚出 1 名骷髏。' },
  { id: 'n_mod_leech',    tree: 'necro', tier: 3, reqPoints: 7, kind: 'mod',     shape: 'diamond', archetype: 'A',    name: '改造：血肉獻祭', maxLvl: 1, req: { id: 'n_golem', lvl: 1 }, mutexGroup: 'n_m1', x: 38, y: 40, desc: '【二選一】鮮血魔像震擊範圍 +30%，吸血回血效果翻倍。' },
  { id: 'n_mod_split',    tree: 'necro', tier: 3, reqPoints: 7, kind: 'mod',     shape: 'diamond', archetype: 'B',    name: '改造：三叉骨矛', maxLvl: 1, req: { id: 'n_spear', lvl: 1 }, mutexGroup: 'n_m2', x: 62, y: 40, desc: '【二選一】白骨長矛變為扇形發射 3 支貫穿骨矛。' },
  { id: 'n_mod_curse',    tree: 'necro', tier: 3, reqPoints: 7, kind: 'mod',     shape: 'diamond', archetype: 'B',    name: '改造：深淵劇毒', maxLvl: 1, req: { id: 'n_spear', lvl: 1 }, mutexGroup: 'n_m2', x: 84, y: 40, desc: '【二選一】白骨長矛命中目標必定暴擊並縮短冷卻 18%。' },

  { id: 'n_frenzy',       tree: 'necro', tier: 4, reqPoints: 12, kind: 'active', shape: 'square',  archetype: 'A',    name: '亡靈狂熱', maxLvl: 5, req: { id: 'n_golem', lvl: 1 }, x: 26, y: 56, icon: './assets/skills/sk_n_frenzy.png', desc: '流派 A 主動技：全場召喚物攻速 +60%、傷害 +35% 並回 25 魂能。' },
  { id: 'n_cdr',          tree: 'necro', tier: 4, reqPoints: 12, kind: 'passive',shape: 'circle',  archetype: 'core', name: '冥界秘術', maxLvl: 5, req: { id: 'n_p_essence', lvl: 1 }, x: 50, y: 56, desc: '每級縮短死靈法師所有技能冷卻 6%、掉寶率 +4%。' },
  { id: 'n_corpse',       tree: 'necro', tier: 4, reqPoints: 12, kind: 'active', shape: 'square',  archetype: 'B',    name: '屍體爆破', maxLvl: 5, req: { id: 'n_spear', lvl: 1 }, x: 74, y: 56, icon: './assets/skills/sk_n_corpse.png', desc: '流派 B 主動技：引爆目標區域血氣造成大範圍爆破，詛咒目標 +35% 傷。' },

  { id: 'n_wraith',       tree: 'necro', tier: 5, reqPoints: 17, kind: 'active', shape: 'square',  archetype: 'A',    name: '冥界幽魂軍', maxLvl: 5, req: { id: 'n_frenzy', lvl: 1 }, x: 18, y: 73, icon: './assets/skills/sk_n_wraith.png', desc: '流派 A 大招：放出 5 隻高速自爆幽魂衝向敵人引爆魂火。' },
  { id: 'n_decrepify',    tree: 'necro', tier: 5, reqPoints: 17, kind: 'active', shape: 'square',  archetype: 'core', name: '衰老詛咒', maxLvl: 5, req: { id: 'n_cdr', lvl: 1 }, x: 50, y: 73, icon: './assets/skills/sk_n_decrepify.png', desc: '全場詛咒：大範圍降低敵攻 25% 並附加【詛咒】易傷。' },
  { id: 'n_prison',       tree: 'necro', tier: 5, reqPoints: 17, kind: 'active', shape: 'square',  archetype: 'B',    name: '骸骨牢籠', maxLvl: 5, req: { id: 'n_corpse', lvl: 1 }, x: 82, y: 73, icon: './assets/skills/sk_n_prison.png', desc: '流派 B 大招：升起骨刺牢籠緩速敵人 2.5 秒並造成 4 波骨刺傷。' },

  { id: 'n_key_overlord', tree: 'necro', tier: 6, reqPoints: 22, kind: 'keystone', shape: 'octagon', archetype: 'A', name: '關鍵被動：骸骨君王', maxLvl: 1, req: { id: 'n_wraith', lvl: 1 }, mutexGroup: 'n_key', x: 30, y: 90, icon: './assets/skills/sk_n_key_overlord.png', desc: '【關鍵二選一】骷髏上限 +2、召喚物傷害額外 +50% 且攻擊必帶魂火連鎖！' },
  { id: 'n_key_plague',   tree: 'necro', tier: 6, reqPoints: 22, kind: 'keystone', shape: 'octagon', archetype: 'B', name: '關鍵被動：瘟疫屍爆王', maxLvl: 1, req: { id: 'n_prison', lvl: 1 }, mutexGroup: 'n_key', x: 70, y: 90, icon: './assets/skills/sk_n_key_plague.png', desc: '【關鍵二選一】任何敵人死亡時自動在原地觸發免費【屍體爆破】，且骨系技能必暴擊！' },


  // ==================== 影殺刺客星圖 (18 節點, 8 主動, 4 改造, 2 關鍵被動) ====================
  { id: 'a_blitz',       tree: 'assassin', tier: 1, reqPoints: 0, kind: 'active',  shape: 'square',  archetype: 'core', name: '瞬影閃襲', maxLvl: 5, req: null, x: 50, y: 8,  icon: './assets/skills/sk_a_blitz.png', desc: '核心主動技：閃現交叉雙刃斬擊，暴擊率 +25% 並提升閃避。' },
  { id: 'a_p_swift',     tree: 'assassin', tier: 1, reqPoints: 0, kind: 'passive', shape: 'circle',  archetype: 'A',    name: '暗影疾步', maxLvl: 5, req: { id: 'a_blitz', lvl: 1 }, x: 24, y: 10, icon: './assets/skills/sk_a_swift.png', desc: '每級攻速 +5%、移速 +5%、閃避 +2%。' },
  { id: 'a_p_venom',     tree: 'assassin', tier: 1, reqPoints: 0, kind: 'passive', shape: 'circle',  archetype: 'B',    name: '淬毒之刃', maxLvl: 5, req: { id: 'a_blitz', lvl: 1 }, x: 76, y: 10, desc: '每級攻擊力 +4%、劇毒傷害 +8%。' },

  { id: 'a_clones',      tree: 'assassin', tier: 2, reqPoints: 3, kind: 'active',  shape: 'square',  archetype: 'A',    name: '影分身連擊', maxLvl: 5, req: { id: 'a_blitz', lvl: 1 }, x: 28, y: 24, icon: './assets/skills/sk_a_clones.png', desc: '流派 A 主動技：召喚 2 道暗紫影分身同步衝刺斬殺敵群。' },
  { id: 'a_p_weakpoint', tree: 'assassin', tier: 2, reqPoints: 3, kind: 'passive', shape: 'circle',  archetype: 'core', name: '致命要害', maxLvl: 5, req: { id: 'a_blitz', lvl: 1 }, x: 50, y: 24, icon: './assets/skills/sk_a_weakpoint.png', desc: '每級暴擊率 +2.5%、暴擊傷害 +12%。' },
  { id: 'a_kunai',       tree: 'assassin', tier: 2, reqPoints: 3, kind: 'active',  shape: 'square',  archetype: 'B',    name: '淬毒苦無', maxLvl: 5, req: { id: 'a_blitz', lvl: 1 }, x: 72, y: 24, icon: './assets/skills/sk_a_kunai.png', desc: '流派 B 主動技：扇形連射 5 把貫穿淬毒苦無並附加【劇毒】。' },

  { id: 'a_mod_phantom', tree: 'assassin', tier: 3, reqPoints: 7, kind: 'mod',     shape: 'diamond', archetype: 'A',    name: '改造：三重幻影', maxLvl: 1, req: { id: 'a_clones', lvl: 1 }, mutexGroup: 'a_m1', x: 16, y: 40, desc: '【二選一】影分身連擊額外多召喚 1 道分身，且必暴擊。' },
  { id: 'a_mod_leech',   tree: 'assassin', tier: 3, reqPoints: 7, kind: 'mod',     shape: 'diamond', archetype: 'A',    name: '改造：暗影吸血', maxLvl: 1, req: { id: 'a_clones', lvl: 1 }, mutexGroup: 'a_m1', x: 38, y: 40, desc: '【二選一】瞬影閃襲冷卻縮短 20%，命中回復 10% 最大生命。' },
  { id: 'a_mod_fan',     tree: 'assassin', tier: 3, reqPoints: 7, kind: 'mod',     shape: 'diamond', archetype: 'B',    name: '改造：七刃苦無', maxLvl: 1, req: { id: 'a_kunai', lvl: 1 }, mutexGroup: 'a_m2', x: 62, y: 40, desc: '【二選一】淬毒苦無改為發射 7 把苦無且中毒時間延長至 6 秒。' },
  { id: 'a_mod_refund',  tree: 'assassin', tier: 3, reqPoints: 7, kind: 'mod',     shape: 'diamond', archetype: 'B',    name: '改造：劇毒回能', maxLvl: 1, req: { id: 'a_kunai', lvl: 1 }, mutexGroup: 'a_m2', x: 84, y: 40, desc: '【二選一】淬毒苦無每命中 1 名敵人回復 3 點影能。' },

  { id: 'a_flurry',      tree: 'assassin', tier: 4, reqPoints: 12, kind: 'active', shape: 'square',  archetype: 'A',    name: '劍刃亂舞', maxLvl: 5, req: { id: 'a_clones', lvl: 1 }, x: 26, y: 56, icon: './assets/skills/sk_a_flurry.png', desc: '流派 A 主動技：高速旋轉雙刃釋放 3 波刃氣風暴並回影能。' },
  { id: 'a_cdr',         tree: 'assassin', tier: 4, reqPoints: 12, kind: 'passive',shape: 'circle',  archetype: 'core', name: '無影節奏', maxLvl: 5, req: { id: 'a_p_weakpoint', lvl: 1 }, x: 50, y: 56, desc: '每級縮短刺客所有技能冷卻 6%、最大影能 +8。' },
  { id: 'a_smoke',       tree: 'assassin', tier: 4, reqPoints: 12, kind: 'active', shape: 'square',  archetype: 'B',    name: '煙霧隱遁', maxLvl: 5, req: { id: 'a_kunai', lvl: 1 }, x: 74, y: 56, icon: './assets/skills/sk_a_smoke.png', desc: '流派 B 主動技：釋放毒霧緩速敵人、回 25 影能且閃避 +30%。' },

  { id: 'a_execute',     tree: 'assassin', tier: 5, reqPoints: 17, kind: 'active', shape: 'square',  archetype: 'A',    name: '暗影絕殺陣', maxLvl: 5, req: { id: 'a_flurry', lvl: 1 }, x: 18, y: 73, icon: './assets/skills/sk_a_execute.png', desc: '流派 A 大招：斬出 7 道十字影殺線，半血以下必暴擊且 +55% 傷。' },
  { id: 'a_fangs',       tree: 'assassin', tier: 5, reqPoints: 17, kind: 'active', shape: 'square',  archetype: 'core', name: '致命毒牙', maxLvl: 5, req: { id: 'a_cdr', lvl: 1 }, x: 50, y: 73, icon: './assets/skills/sk_a_fangs.png', desc: '刺客爆發：4.5 秒內攻速 +45%、暴擊 +20% 且普攻必帶【劇毒】。' },
  { id: 'a_burst',       tree: 'assassin', tier: 5, reqPoints: 17, kind: 'active', shape: 'square',  archetype: 'B',    name: '毒刃引爆', maxLvl: 5, req: { id: 'a_smoke', lvl: 1 }, x: 82, y: 73, icon: './assets/skills/sk_a_burst.png', desc: '流派 B 大招：引爆範圍內所有敵人的【劇毒】，中毒目標 +45% 傷。' },

  { id: 'a_key_dancer',  tree: 'assassin', tier: 6, reqPoints: 22, kind: 'keystone', shape: 'octagon', archetype: 'A', name: '關鍵被動：無形影舞者', maxLvl: 1, req: { id: 'a_execute', lvl: 1 }, mutexGroup: 'a_key', x: 30, y: 90, icon: './assets/skills/sk_a_key_dancer.png', desc: '【關鍵二選一】閃避率上限提升至 75%，每次成功閃避自動反擊 150% 暗影斬並回 6 影能！' },
  { id: 'a_key_venom',   tree: 'assassin', tier: 6, reqPoints: 22, kind: 'keystone', shape: 'octagon', archetype: 'B', name: '關鍵被動：萬毒之主', maxLvl: 1, req: { id: 'a_burst', lvl: 1 }, mutexGroup: 'a_key', x: 70, y: 90, icon: './assets/skills/sk_a_key_venom.png', desc: '【關鍵二選一】劇毒傷害可暴擊且 +60%，中毒怪物死亡時自動擴散免費毒爆雲！' },

  // ==================== 深淵通用星圖 (12 節點, 相容舊存檔) ====================
  { id: 'fury_atk',      tree: 'shared', tier: 1, reqPoints: 0, kind: 'passive', shape: 'circle', archetype: 'A', name: '戰意覺醒', maxLvl: 10, req: null, x: 20, y: 12, desc: '每級全職業攻擊力 +6%' },
  { id: 'fury_crit',     tree: 'shared', tier: 2, reqPoints: 0, kind: 'passive', shape: 'circle', archetype: 'A', name: '致命弱點', maxLvl: 8,  req: { id: 'fury_atk', lvl: 2 }, x: 20, y: 36, desc: '每級暴擊率 +2.5%、暴擊傷害 +10%' },
  { id: 'fury_aoe',      tree: 'shared', tier: 3, reqPoints: 0, kind: 'passive', shape: 'diamond',archetype: 'A', name: '毀滅波紋', maxLvl: 5,  req: { id: 'fury_crit', lvl: 2 }, x: 20, y: 60, desc: '每級主動技能傷害 +15%、範圍 +16%' },
  { id: 'fury_bolt',     tree: 'shared', tier: 4, reqPoints: 0, kind: 'keystone',shape: 'octagon',archetype: 'A', name: '風暴連鎖', maxLvl: 3,  req: { id: 'fury_aoe', lvl: 2 }, x: 20, y: 84, desc: '暴擊時 35%/70%/100% 觸發連鎖閃電 (50% 攻傷)' },

  { id: 'guard_hp',      tree: 'shared', tier: 1, reqPoints: 0, kind: 'passive', shape: 'circle', archetype: 'B', name: '不屈體魄', maxLvl: 10, req: null, x: 50, y: 12, desc: '每級最大生命 +8%' },
  { id: 'guard_def',     tree: 'shared', tier: 2, reqPoints: 0, kind: 'passive', shape: 'circle', archetype: 'B', name: '鋼鐵壁壘', maxLvl: 8,  req: { id: 'guard_hp', lvl: 2 }, x: 50, y: 36, desc: '每級護甲 +12%、閃避 +1.5%' },
  { id: 'guard_leech',   tree: 'shared', tier: 3, reqPoints: 0, kind: 'passive', shape: 'diamond',archetype: 'B', name: '嗜血狂熱', maxLvl: 5,  req: { id: 'guard_def', lvl: 2 }, x: 50, y: 60, desc: '每級吸血 +1.5%、擊殺回血 +2% 生命' },
  { id: 'guard_speed',   tree: 'shared', tier: 4, reqPoints: 0, kind: 'keystone',shape: 'octagon',archetype: 'B', name: '疾風步法', maxLvl: 5,  req: { id: 'guard_leech', lvl: 2 }, x: 50, y: 84, desc: '每級攻擊速度 +6%、移動速度 +8%' },

  { id: 'greed_gold',    tree: 'shared', tier: 1, reqPoints: 0, kind: 'passive', shape: 'circle', archetype: 'core', name: '點石成金', maxLvl: 10, req: null, x: 80, y: 12, desc: '每級金幣掉落 +10%' },
  { id: 'greed_mf',      tree: 'shared', tier: 2, reqPoints: 0, kind: 'passive', shape: 'circle', archetype: 'core', name: '尋寶獵人', maxLvl: 10, req: { id: 'greed_gold', lvl: 2 }, x: 80, y: 36, desc: '每級掉寶率 (MF) +8%' },
  { id: 'greed_exp',     tree: 'shared', tier: 3, reqPoints: 0, kind: 'passive', shape: 'diamond',archetype: 'core', name: '賢者悟性', maxLvl: 6,  req: { id: 'greed_mf', lvl: 2 }, x: 80, y: 60, desc: '每級經驗獲取 +12%' },
  { id: 'greed_offline', tree: 'shared', tier: 4, reqPoints: 0, kind: 'keystone',shape: 'octagon',archetype: 'core', name: '靈魂共鳴', maxLvl: 5,  req: { id: 'greed_exp', lvl: 2 }, x: 80, y: 84, desc: '每級離線效率 +8%、上限 +1 小時' },
];

export function getTreeSpentPoints(treeId, treeState) {
  return SKILL_TREE_NODES
    .filter((n) => n.tree === treeId)
    .reduce((sum, n) => sum + (treeState?.[n.id] || 0), 0);
}

export function isNodeBlockedByMutex(node, treeState) {
  if (!node.mutexGroup) return false;
  return SKILL_TREE_NODES.some(
    (other) => other.id !== node.id && other.mutexGroup === node.mutexGroup && (treeState?.[other.id] || 0) > 0
  );
}

export function isNodeUnlocked(node, treeState) {
  if (isNodeBlockedByMutex(node, treeState)) return false;
  if ((node.reqPoints || 0) > 0) {
    const spent = getTreeSpentPoints(node.tree, treeState);
    if (spent < node.reqPoints) return false;
  }
  if (!node.req) return true;
  return (treeState?.[node.req.id] || 0) >= node.req.lvl;
}
