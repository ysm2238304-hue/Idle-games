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
