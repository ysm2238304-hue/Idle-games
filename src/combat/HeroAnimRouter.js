// v307-1: 全 6 職業 8 大深度英雄動作路由器（146 招技能精準映射 ＋ 雙圖集自動偵測與無縫降級）

export const HERO_PREFIX = {
  warrior:  'wf',
  ranger:   'rf',
  mage:     'mf',
  paladin:  'pf',
  necro:    'nf',
  assassin: 'af',
};

export const HERO_ANIM_SHORT = {
  warrior:  'w',
  ranger:   'r',
  mage:     'm',
  paladin:  'p',
  necro:    'n',
  assassin: 'a',
};

// 雙圖集就緒清單：各職業第 2～13 批產出後逐一開啟，未開啟職業自動無縫沿用舊圖不產生 404
export const HERO_V307_READY = {
  warrior:  { base: true,  skills: true  },
  ranger:   { base: true,  skills: true  },
  mage:     { base: true,  skills: true  },
  paladin:  { base: true,  skills: true  },
  necro:    { base: true,  skills: true  },
  assassin: { base: true,  skills: true  },
};

export const BASE_ACTIONS = ['idle', 'walk', 'atk1', 'atk2'];
export const SKILL_ACTIONS = ['cast', 'buff', 'dash', 'special'];
export const ALL_HERO_ACTIONS = [...BASE_ACTIONS, ...SKILL_ACTIONS];

// 146 招技能 → 6 種戰鬥動作精準映射（atk1 / atk2 / cast / buff / dash / special）
export const SKILL_ACTION_MAP = {
  warrior: {
    w_rend_slash:        'atk1',
    w_frenzy_flurry:     'atk1',
    w_double_swing:      'atk1',
    w_bash_crush:        'atk2',
    w_ancient_hammer:    'atk2',
    w_rupture_impale:    'atk2',
    execute_cleave:      'atk2',
    w_upheaval_wave:     'cast',
    w_chain_grasp:       'cast',
    bladestorm:          'cast',
    volcano_totem:       'cast',
    w_seismic_fissure:   'cast',
    w_call_ancients:     'cast',
    w_iron_skin:         'buff',
    warcry:              'buff',
    w_challenging_shout: 'buff',
    w_rallying_cry:      'buff',
    w_wrath_berserker:   'buff',
    w_lunging_strike:    'dash',
    bloodcharge:         'dash',
    earth_stomp:         'dash',
    w_leap_slam:         'dash',
    whirlwind:           'special',
    w_iron_maelstrom:    'special',
  },
  ranger: {
    volley:              'atk1',
    r_rapid_fire:        'atk1',
    r_puncture:          'atk1',
    r_heartseeker:       'atk1',
    r_forceful_arrow:    'atk2',
    r_gale_snipe:        'atk2',
    r_venom_pierce:      'atk2',
    phantombow:          'atk2',
    caltrops:            'cast',
    r_poison_trap:       'cast',
    r_smoke_grenade:     'cast',
    shadow_clones:       'cast',
    death_mark:          'cast',
    r_void_hunter:       'cast',
    r_death_trap:        'cast',
    r_razor_snare:       'cast',
    r_smoke_decoy:       'cast',
    r_shadow_imbue:      'buff',
    windwalk:            'buff',
    r_dark_shroud:       'buff',
    shadowstep:          'dash',
    r_frost_barrage:     'special',
    arrowrain:           'special',
    r_abyss_barrage:     'special',
  },
  mage: {
    m_fire_bolt:         'atk1',
    m_frost_bolt:        'atk1',
    m_ice_shards:        'atk1',
    m_spark:             'atk1',
    m_fireball:          'atk2',
    m_frozen_orb:        'atk2',
    arcane_orb:          'atk2',
    chain_lightning:     'cast',
    m_flame_hydra:       'cast',
    m_ice_blades:        'cast',
    m_lightning_spear:   'cast',
    m_familiar:          'cast',
    meteor:              'cast',
    m_firewall:          'cast',
    m_blizzard_field:    'cast',
    m_ball_lightning:    'cast',
    black_hole:          'cast',
    m_deep_freeze:       'cast',
    m_flame_shield:      'buff',
    m_ice_armor:         'buff',
    m_unstable_currents: 'buff',
    m_arc_lash:          'dash',
    m_arcane_blink:      'dash',
    frost_nova:          'dash',
    m_inferno:           'special',
    m_astral_supernova:  'special',
  },
  paladin: {
    p_smite_lash:        'atk1',
    p_zeal_strike:       'atk1',
    p_holy_bolt:         'atk1',
    p_justice_hammer:    'atk2',
    blessed_hammer:      'atk2',
    p_holy_lance:        'atk2',
    heaven_fist:         'cast',
    judgment:            'cast',
    p_condemn_pull:      'cast',
    consecration:        'cast',
    p_solar_beacon:      'cast',
    p_seraph_descent:    'cast',
    p_valkyrie_avatar:   'cast',
    holy_aegis:          'buff',
    p_redemption_prayer: 'buff',
    p_sanctuary_ward:    'buff',
    radiant_aura:        'buff',
    p_thorns_aura:       'buff',
    p_akarats_wrath:     'buff',
    shield_bash:         'dash',
    p_crusader_charge:   'dash',
    p_falling_sword:     'dash',
    divine_storm:        'special',
    p_heavens_verdict:   'special',
  },
  necro: {
    n_reap_scythe:       'atk1',
    n_bone_splinters:    'atk1',
    n_hemorrhage:        'atk1',
    bone_spear:          'atk2',
    n_blood_lance:       'atk2',
    n_sever:             'atk2',
    n_decompose:         'cast',
    bone_prison:         'cast',
    corpse_explosion:    'cast',
    decrepify:           'cast',
    n_iron_maiden:       'cast',
    n_corpse_tendrils:   'cast',
    n_blight_pool:       'cast',
    raise_skeleton:      'cast',
    blood_golem:         'cast',
    undead_frenzy:       'cast',
    wraith_army:         'cast',
    n_army_scourge:      'cast',
    n_bone_shield:       'buff',
    n_blood_mist:        'dash',
    n_blood_surge:       'special',
    n_blood_wave:        'special',
    n_bone_storm:        'special',
    n_soul_rift:         'special',
  },
  assassin: {
    a_twin_fang:         'atk1',
    a_venom_slash:       'atk1',
    a_shuriken_fan:      'atk1',
    poison_kunai:        'atk1',
    a_boomerang_blades:  'atk2',
    a_twisting_blades:   'atk2',
    shadow_execute:      'atk2',
    venom_burst:         'cast',
    a_crimson_mist:      'cast',
    a_shadow_decoy_bomb: 'cast',
    shadow_clones:       'cast',
    a_crimson_eclipse:   'cast',
    smoke_veil:          'buff',
    a_blood_cloak:       'buff',
    a_venom_imbue:       'buff',
    lethal_fangs:        'buff',
    a_blade_shift:       'dash',
    shadow_blitz:        'dash',
    a_shadow_backstab:   'dash',
    a_garrote_bind:      'dash',
    a_thousand_shadows:  'dash',
    blade_flurry:        'special',
    a_death_lotus:       'special',
    a_reaper_dance:      'special',
  },
};

export function getSkillAnimAction(classId, skillId) {
  const clsMap = SKILL_ACTION_MAP[classId];
  if (clsMap && skillId && clsMap[skillId]) return clsMap[skillId];
  const s = String(skillId || '').toLowerCase();
  if (/shield|armor|aura|cry|shout|skin|ward|veil|cloak|imbue|windwalk|wrath|fangs|currents/.test(s)) return 'buff';
  if (/dash|blink|step|charge|leap|blitz|backstab|shift|stomp|bash|mist/.test(s)) return 'dash';
  if (/whirlwind|maelstrom|storm|lotus|dance|flurry|rain|barrage|inferno|supernova|verdict|wave|rift/.test(s)) return 'special';
  if (/meteor|blizzard|hydra|skeleton|golem|army|totem|clone|trap|curse|prison|explosion|consecration|judgment/.test(s)) return 'cast';
  if (/execute|snipe|hammer|spear|lance|fireball|orb|crush|impale/.test(s)) return 'atk2';
  return 'atk1';
}

export function getActionAnimDurationMs(action) {
  switch (action) {
    case 'atk1':    return 300;
    case 'atk2':    return 380;
    case 'cast':    return 460;
    case 'buff':    return 480;
    case 'dash':    return 360;
    case 'special': return 540;
    default:        return 340;
  }
}

export function getHeroAtlasInfo(classId) {
  const cid = HERO_PREFIX[classId] ? classId : 'warrior';
  const ready = HERO_V307_READY[cid] || { base: false, skills: false };
  return {
    cid,
    prefix: HERO_PREFIX[cid],
    short: HERO_ANIM_SHORT[cid],
    baseReady: !!ready.base,
    skillsReady: !!ready.skills,
    baseKey: ready.base ? `atlas_${cid}_base_v307` : `atlas_${cid}`,
    basePng: ready.base ? `./assets/heroes/atlas_${cid}_base_v307.png?v=309` : `./assets/heroes/atlas_${cid}.png?v=66`,
    baseJson: ready.base ? `./assets/heroes/atlas_${cid}_base_v307.json?v=309` : `./assets/heroes/atlas_${cid}.json?v=66`,
    skillsKey: `atlas_${cid}_skills_v307`,
    skillsPng: `./assets/heroes/atlas_${cid}_skills_v307.png?v=307`,
    skillsJson: `./assets/heroes/atlas_${cid}_skills_v307.json?v=307`,
  };
}

const FALLBACK_CHAINS = {
  special: ['special', 'cast', 'atk2', 'atk1', 'atk'],
  cast:    ['cast', 'atk2', 'atk1', 'atk'],
  buff:    ['buff', 'cast', 'atk1', 'atk'],
  dash:    ['dash', 'atk2', 'atk1', 'atk'],
  atk2:    ['atk2', 'atk1', 'atk'],
  atk1:    ['atk1', 'atk'],
  atk:     ['atk1', 'atk'],
  walk:    ['walk'],
  idle:    ['idle'],
};

export function resolveHeroAnimKey(scene, classId, dir = 'down', action = 'idle') {
  const short = HERO_ANIM_SHORT[classId] || 'm';
  const d = (dir === 'up' || dir === 'right' || dir === 'down') ? dir : 'down';
  const chain = FALLBACK_CHAINS[action] || ['atk1', 'atk'];
  for (const act of chain) {
    const k = `${short}_${d}_${act}`;
    if (scene?.anims?.exists?.(k)) return k;
  }
  return `${short}_${d}_atk`;
}


// v309-1: 全域圖集防重載鎖（避免 BattleScene 與 TownScene 切換職業時並發 load.atlas 造成 Texture key already in use 與 WebGL isGLTexture 崩潰）
function _getInflightSet() {
  if (typeof window !== 'undefined') {
    if (!window.__PHASER_ATLAS_INFLIGHT__) window.__PHASER_ATLAS_INFLIGHT__ = new Set();
    return window.__PHASER_ATLAS_INFLIGHT__;
  }
  return new Set();
}

export function safeQueueAtlas(scene, key, png, json) {
  if (!scene || !key) return false;
  if (scene.textures?.exists?.(key)) return false;
  const inflight = _getInflightSet();
  if (inflight.has(key)) return false;
  inflight.add(key);
  const cleanup = () => inflight.delete(key);
  scene.load?.once?.(`filecomplete-atlasjson-${key}`, cleanup);
  scene.load?.once?.('loaderror', (fileObj) => {
    if (!fileObj || fileObj.key === key) cleanup();
  });
  scene.load?.once?.('complete', cleanup);
  scene.load?.atlas?.(key, png, json);
  return true;
}

export function waitAtlasReady(scene, key, cb, maxWaitMs = 6000) {
  if (!cb) return;
  if (!scene || !key || scene.textures?.exists?.(key)) {
    cb();
    return;
  }
  const start = Date.now();
  const poll = () => {
    if (!scene?.sys || scene.sys.isDestroyed) return;
    if (scene.textures?.exists?.(key) || (Date.now() - start) >= maxWaitMs) {
      cb();
      return;
    }
    setTimeout(poll, 60);
  };
  setTimeout(poll, 60);
}
