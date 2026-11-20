export const SKILL_BRANCHES = [
  { id: 'warrior_active', name: '戰士技能（解鎖與強化）', color: '#f97316', icon: '🔥' },
  { id: 'ranger_active',  name: '遊俠技能（解鎖與強化）', color: '#10b981', icon: '🏹' },
  { id: 'mage_active',    name: '法師技能（解鎖與強化）', color: '#a855f7', icon: '🔮' },
  { id: 'fury',  name: '狂暴輸出', color: '#ef4444', icon: '⚔️' },
  { id: 'guard', name: '生存續戰', color: '#22c55e', icon: '🛡️' },
  { id: 'greed', name: '刷寶掛機', color: '#f59e0b', icon: '💎' },
];

export const SKILL_TREE_NODES = [
  // 戰士技能分支
  { id: 'w_whirlwind',    branch: 'warrior_active', name: '旋風重斬',   maxLvl: 5, req: null, desc: '解鎖並強化【旋風重斬】每段傷害 +18%' },
  { id: 'w_earthshatter', branch: 'warrior_active', name: '裂地猛擊',   maxLvl: 5, req: { id: 'w_whirlwind', lvl: 1 }, desc: '解鎖【裂地猛擊】暈眩砸地重擊 (每級 +35% 傷)' },
  { id: 'w_bloodcharge',  branch: 'warrior_active', name: '血怒衝鋒',   maxLvl: 5, req: { id: 'w_whirlwind', lvl: 1 }, desc: '解鎖【血怒衝鋒】突進撞飛並吸血 (每級 +30% 傷)' },
  { id: 'w_bladestorm',   branch: 'warrior_active', name: '烈焰劍氣波', maxLvl: 5, req: { id: 'w_earthshatter', lvl: 1 }, desc: '解鎖【烈焰劍氣波】三連貫穿劍氣 (每級 +28% 傷)' },
  { id: 'w_cdr',          branch: 'warrior_active', name: '戰意沸騰',   maxLvl: 5, req: { id: 'w_bloodcharge', lvl: 1 }, desc: '每級縮短戰士主動技能冷卻時間 6%' },

  // 遊俠技能分支
  { id: 'r_volley',     branch: 'ranger_active', name: '穿透連射',   maxLvl: 5, req: null, desc: '解鎖並強化【穿透連射】每道光矢傷害 +18%' },
  { id: 'r_arrowrain',  branch: 'ranger_active', name: '翡翠箭雨',   maxLvl: 5, req: { id: 'r_volley', lvl: 1 }, desc: '解鎖【翡翠箭雨】4 波大範圍箭雨 (每級 +16% 傷)' },
  { id: 'r_shadowstep', branch: 'ranger_active', name: '暗影瞬步',   maxLvl: 5, req: { id: 'r_volley', lvl: 1 }, desc: '解鎖【暗影瞬步】瞬移留毒爆陷阱 (每級 +32% 傷)' },
  { id: 'r_phantombow', branch: 'ranger_active', name: '幻影狙殺箭', maxLvl: 5, req: { id: 'r_arrowrain', lvl: 1 }, desc: '解鎖【幻影狙殺箭】必定暴擊龍魂箭 (每級 +45% 傷)' },
  { id: 'r_cdr',        branch: 'ranger_active', name: '疾風節奏',   maxLvl: 5, req: { id: 'r_shadowstep', lvl: 1 }, desc: '每級縮短遊俠主動技能冷卻時間 6%' },

  // 法師技能分支
  { id: 'm_meteor',     branch: 'mage_active', name: '深淵隕石',   maxLvl: 5, req: null, desc: '解鎖並強化【深淵隕石】轟擊傷害 (每級 +42% 傷)' },
  { id: 'm_arcane_orb', branch: 'mage_active', name: '星界奧術球', maxLvl: 5, req: { id: 'm_meteor', lvl: 1 }, desc: '解鎖【星界奧術球】三連貫穿奧術球 (每級 +22% 傷)' },
  { id: 'm_frost_nova', branch: 'mage_active', name: '寒冰新星',   maxLvl: 5, req: { id: 'm_meteor', lvl: 1 }, desc: '解鎖【寒冰新星】冰環減速並張開護盾回血 (每級 +30% 傷)' },
  { id: 'm_void_beam',  branch: 'mage_active', name: '虛空星爆',   maxLvl: 5, req: { id: 'm_arcane_orb', lvl: 1 }, desc: '解鎖【虛空星爆】必定暴擊貫穿星辰雷射 (每級 +48% 傷)' },
  { id: 'm_cdr',        branch: 'mage_active', name: '魔力湧動',   maxLvl: 5, req: { id: 'm_frost_nova', lvl: 1 }, desc: '每級縮短法師主動技能冷卻時間 6%' },

  // 狂暴輸出系
  { id: 'fury_atk',   branch: 'fury',  name: '戰意覺醒', maxLvl: 10, req: null, desc: '每級攻擊力 +6%' },
  { id: 'fury_crit',  branch: 'fury',  name: '致命弱點', maxLvl: 8,  req: { id: 'fury_atk', lvl: 2 }, desc: '每級暴擊率 +2.5%、暴擊傷害 +10%' },
  { id: 'fury_aoe',   branch: 'fury',  name: '毀滅波紋', maxLvl: 5,  req: { id: 'fury_crit', lvl: 2 }, desc: '每級主動技能傷害 +15%、範圍 +16%' },
  { id: 'fury_bolt',  branch: 'fury',  name: '風暴連鎖', maxLvl: 3,  req: { id: 'fury_aoe', lvl: 2 }, desc: '暴擊時 35%/70%/100% 觸發連鎖閃電 (50% 攻傷)' },

  // 生存續戰系
  { id: 'guard_hp',    branch: 'guard', name: '不屈體魄', maxLvl: 10, req: null, desc: '每級最大生命 +8%' },
  { id: 'guard_def',   branch: 'guard', name: '鋼鐵壁壘', maxLvl: 8,  req: { id: 'guard_hp', lvl: 2 }, desc: '每級護甲 +12%、閃避 +1.5%' },
  { id: 'guard_leech', branch: 'guard', name: '嗜血狂熱', maxLvl: 5,  req: { id: 'guard_def', lvl: 2 }, desc: '每級吸血 +1.5%、擊殺回血 +2% 生命' },
  { id: 'guard_speed', branch: 'guard', name: '疾風步法', maxLvl: 5,  req: { id: 'guard_leech', lvl: 2 }, desc: '每級攻擊速度 +6%、移動速度 +8%' },

  // 刷寶掛機系
  { id: 'greed_gold',    branch: 'greed', name: '點石成金', maxLvl: 10, req: null, desc: '每級金幣掉落 +10%' },
  { id: 'greed_mf',      branch: 'greed', name: '尋寶獵人', maxLvl: 10, req: { id: 'greed_gold', lvl: 2 }, desc: '每級掉寶率 (MF) +8%' },
  { id: 'greed_exp',     branch: 'greed', name: '賢者悟性', maxLvl: 6,  req: { id: 'greed_mf', lvl: 2 }, desc: '每級經驗獲取 +12%' },
  { id: 'greed_offline', branch: 'greed', name: '靈魂共鳴', maxLvl: 5,  req: { id: 'greed_exp', lvl: 2 }, desc: '每級離線效率 +8%、上限 +1 小時' },
];

export function isNodeUnlocked(node, treeState) {
  if (!node.req) return true;
  return (treeState[node.req.id] || 0) >= node.req.lvl;
}
