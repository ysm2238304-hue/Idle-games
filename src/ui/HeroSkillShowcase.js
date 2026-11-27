// v301: 創角大廳 2.5D 三層景深實戰技能演武引擎（HeroSkillShowcase）
// 徹底廢除 ctx.filter 杜絕白色色塊、對齊英雄真實動畫幀名、全 6 職業精準元素配對＋4 種真實演出模式
import { WARRIOR_SKILLS } from '../data/warriorSkills.js?v=235';
import { RANGER_SKILLS } from '../data/rangerSkills.js?v=236';
import { MAGE_SKILLS } from '../data/mageSkills.js?v=241';
import { PALADIN_SKILLS } from '../data/paladinSkills.js?v=235';
import { NECRO_SKILLS } from '../data/necroSkills.js?v=236';
import { ASSASSIN_SKILLS } from '../data/assassinSkills.js?v=235';

export const CLASS_SKILLS_MAP = {
  warrior: WARRIOR_SKILLS,
  ranger: RANGER_SKILLS,
  mage: MAGE_SKILLS,
  paladin: PALADIN_SKILLS,
  necro: NECRO_SKILLS,
  assassin: ASSASSIN_SKILLS,
};

const HERO_PREFIX = {
  warrior: 'wf',
  ranger: 'rf',
  mage: 'mf',
  paladin: 'pf',
  necro: 'nf',
  assassin: 'af',
};

const CLASS_V301_VFX = {
  warrior: {
    color: '#fb923c',
    seqs: ['seq16_w_whirlwind', 'seq16_w_hammer_slam', 'seq16_w_rend_burst', 'seq16_w_earth_stomp', 'seq16_w_fissure', 'seq16_w_warcry', 'seq16_w_maelstrom', 'seq16_w_execute'],
    decals: ['decal_w_crater', 'decal_w_lava', 'decal_w_blood', 'decal_w_rune'],
    projs: ['proj_w_flame_wave', 'proj_w_rock_shard', 'proj_w_chain_hook'],
    bySkillId: {
      w_rend_slash:        { style: 'dash', seq: 'seq16_w_rend_burst',  decal: 'decal_w_blood',  scale: 1.24, trail: '#f87171' },
      w_lunging_strike:    { style: 'dash', seq: 'seq16_w_execute',     decal: 'decal_w_crater', scale: 1.24, trail: '#fb923c' },
      w_frenzy_flurry:     { style: 'dash', seq: 'seq16_w_rend_burst',  decal: 'decal_w_blood',  scale: 1.22, trail: '#ef4444' },
      w_bash_crush:        { style: 'dash', seq: 'seq16_w_hammer_slam', decal: 'decal_w_crater', scale: 1.26, trail: '#fbbf24' },
      whirlwind:           { style: 'dash', seq: 'seq16_w_whirlwind',   decal: 'decal_w_crater', scale: 1.32, trail: '#fb923c' },
      w_ancient_hammer:    { style: 'dash', seq: 'seq16_w_hammer_slam', decal: 'decal_w_lava',   scale: 1.36, trail: '#f97316' },
      w_upheaval_wave:     { style: 'proj', proj: 'proj_w_rock_shard',  decal: 'decal_w_crater', seq: 'seq16_w_earth_stomp', multiProj: 3, trail: '#f97316', scale: 1.20 },
      w_double_swing:      { style: 'dash', seq: 'seq16_w_rend_burst',  decal: 'decal_w_blood',  scale: 1.26, trail: '#ef4444' },
      w_iron_skin:         { style: 'self_buff', buffMode: 'pure_defense',  buffKey: 'buff_w_iron_skin_v303',    buffText: '🛡️ 鋼鐵戰膚：護甲 +60%', trail: '#fbbf24' },
      warcry:              { style: 'self_buff', buffMode: 'melee_empower', buffKey: 'buff_w_berserk_roar_v303', buffText: '🔥 狂戰血吼：攻擊 +35%', followSeq: 'seq16_w_rend_burst', trail: '#f97316' },
      w_challenging_shout: { style: 'self_buff', buffMode: 'pure_defense',  buffKey: 'buff_w_iron_skin_v303',    buffText: '🛡️ 挑戰怒吼：減傷 +40%', trail: '#fb923c' },
      w_rallying_cry:      { style: 'self_buff', buffMode: 'melee_empower', buffKey: 'buff_w_berserk_roar_v303', buffText: '⚡ 集結戰吼：怒氣與攻速提升', followSeq: 'seq16_w_execute', trail: '#fde047' },
      bloodcharge:         { style: 'dash', seq: 'seq16_w_earth_stomp', decal: 'decal_w_blood',  scale: 1.28, trail: '#ef4444' },
      earth_stomp:         { style: 'dash', seq: 'seq16_w_earth_stomp', decal: 'decal_w_crater', scale: 1.30, trail: '#f97316' },
      w_chain_grasp:       { style: 'proj', proj: 'proj_w_chain_hook',  decal: 'decal_w_crater', multiProj: 2, trail: '#94a3b8' },
      w_leap_slam:         { style: 'dash', seq: 'seq16_w_hammer_slam', decal: 'decal_w_crater', scale: 1.34, trail: '#f97316' },
      bladestorm:          { style: 'proj', proj: 'proj_w_flame_wave',  decal: 'decal_w_lava',   multiProj: 3, trail: '#f97316' },
      w_rupture_impale:    { style: 'dash', seq: 'seq16_w_rend_burst',  decal: 'decal_w_blood',  scale: 1.32, trail: '#ef4444' },
      volcano_totem:       { style: 'aoe',  seq: 'seq16_w_fissure',     decal: 'decal_w_lava',   scale: 1.34, trail: '#f97316' },
      w_seismic_fissure:   { style: 'aoe',  seq: 'seq16_w_fissure',     decal: 'decal_w_lava',   scale: 1.36, trail: '#f97316' },
      w_call_ancients:    { style: 'summon', summonType: 'clone', cloneCount: 3, seq: 'seq16_w_hammer_slam', decal: 'decal_w_rune', scale: 1.28, trail: '#fde047' },
      w_wrath_berserker:   { style: 'self_buff', buffMode: 'melee_empower', buffKey: 'buff_w_berserk_roar_v303', buffText: '🌋 狂戰神降臨：攻速+45% 爆傷+50%', followSeq: 'seq16_w_hammer_slam', trail: '#ef4444' },
      execute_cleave:      { style: 'dash', seq: 'seq16_w_execute',     decal: 'decal_w_blood',  scale: 1.36, trail: '#ef4444' },
      w_iron_maelstrom:    { style: 'dash', seq: 'seq16_w_maelstrom',   decal: 'decal_w_crater', scale: 1.38, trail: '#fb923c' },
    },
  },
  ranger: {
    color: '#4ade80',
    seqs: ['seq16_r_arrow_storm', 'seq16_r_venom_burst', 'seq16_r_shadow_boom', 'seq16_r_frost_barrage', 'seq16_r_phantom_beam', 'seq16_r_death_trap', 'seq16_r_smoke_bomb', 'seq16_r_void_rift'],
    decals: ['decal_r_arrows', 'decal_r_venom', 'decal_r_shadow', 'decal_r_trap'],
    projs: ['proj_r_emerald_arrow', 'proj_r_shadow_arrow', 'proj_r_venom_spear'],
    bySkillId: {
      volley:          { style: 'proj', proj: 'proj_r_emerald_arrow', decal: 'decal_r_arrows', multiProj: 5, trail: '#4ade80', burstColor: '#86efac' },
      r_rapid_fire:    { style: 'proj', proj: 'proj_r_emerald_arrow', decal: 'decal_r_arrows', multiProj: 6, trail: '#34d399', burstColor: '#6ee7b7' },
      r_puncture:      { style: 'proj', proj: 'proj_r_shadow_arrow',  decal: 'decal_r_arrows', multiProj: 3, trail: '#a78bfa', burstColor: '#c4b5fd' },
      r_heartseeker:   { style: 'proj', proj: 'proj_r_emerald_arrow', decal: 'decal_r_arrows', multiProj: 3, trail: '#fde047', burstColor: '#fef08a' },
      r_forceful_arrow:{ style: 'proj', proj: 'proj_r_emerald_arrow', decal: 'decal_r_arrows', multiProj: 2, trail: '#4ade80', burstColor: '#bbf7d0' },
      r_gale_snipe:    { style: 'proj', proj: 'proj_r_emerald_arrow', decal: 'decal_r_arrows', seq: 'seq16_r_phantom_beam', multiProj: 1, trail: '#4ade80', scale: 1.28 },
      r_venom_pierce:  { style: 'proj', proj: 'proj_r_venom_spear',   decal: 'decal_r_venom',  seq: 'seq16_r_venom_burst', multiProj: 3, trail: '#22c55e', scale: 1.22 },
      caltrops:        { style: 'aoe',  seq: 'seq16_r_venom_burst',   decal: 'decal_r_venom',  scale: 1.24, trail: '#22c55e' },
      r_poison_trap:   { style: 'aoe',  seq: 'seq16_r_venom_burst',   decal: 'decal_r_venom',  scale: 1.28, trail: '#22c55e' },
      r_smoke_grenade: { style: 'aoe',  seq: 'seq16_r_smoke_bomb',    decal: 'decal_r_venom',  scale: 1.26, trail: '#4ade80' },
      r_frost_barrage: { style: 'proj', proj: 'proj_r_emerald_arrow', decal: 'decal_r_arrows', seq: 'seq16_r_frost_barrage', multiProj: 4, trail: '#38bdf8', scale: 1.26 },
      arrowrain:       { style: 'aoe',  seq: 'seq16_r_arrow_storm',   decal: 'decal_r_arrows', scale: 1.36, trail: '#4ade80' },
      r_abyss_barrage: { style: 'aoe',  seq: 'seq16_r_arrow_storm',   decal: 'decal_r_shadow', scale: 1.38, trail: '#c084fc' },
      phantombow:      { style: 'proj', proj: 'proj_r_shadow_arrow',  decal: 'decal_r_shadow', seq: 'seq16_r_phantom_beam', multiProj: 1, trail: '#c084fc', scale: 1.34 },
      r_shadow_imbue:  { style: 'self_buff', buffMode: 'ranged_empower', buffKey: 'buff_r_shadow_shroud_v303', buffText: '🌑 暗影灌注：箭矢附加暗影爆裂', followProj: 'proj_r_shadow_arrow', followSeq: 'seq16_r_shadow_boom', trail: '#a855f7' },
      shadowstep:      { style: 'dash', seq: 'seq16_r_smoke_bomb',    decal: 'decal_r_shadow', scale: 1.24, trail: '#a855f7' },
      windwalk:        { style: 'self_buff', buffMode: 'ranged_empower', buffKey: 'buff_r_wind_step_v303',     buffText: '🍃 風行疾步：攻速移速 +40%', followProj: 'proj_r_emerald_arrow', trail: '#34d399' },
      shadow_clones:   { style: 'summon', summonType: 'clone', cloneCount: 2, conjProj: 'proj_r_shadow_arrow', seq: 'seq16_r_shadow_boom', decal: 'decal_r_shadow', scale: 1.24, trail: '#a855f7' },
      death_mark:      { style: 'aoe',  seq: 'seq16_r_void_rift',     decal: 'decal_r_shadow', scale: 1.32, trail: '#c084fc' },
      r_void_hunter:   { style: 'aoe',  seq: 'seq16_r_void_rift',     decal: 'decal_r_shadow', scale: 1.36, trail: '#a855f7' },
      r_death_trap:    { style: 'aoe',  seq: 'seq16_r_death_trap',    decal: 'decal_r_trap',   scale: 1.32, trail: '#f87171' },
      r_razor_snare:   { style: 'aoe',  seq: 'seq16_r_death_trap',    decal: 'decal_r_trap',   scale: 1.26, trail: '#f87171' },
      r_smoke_decoy:   { style: 'aoe',  seq: 'seq16_r_smoke_bomb',    decal: 'decal_r_shadow', scale: 1.26, trail: '#94a3b8' },
      r_dark_shroud:   { style: 'self_buff', buffMode: 'pure_defense',   buffKey: 'buff_r_shadow_shroud_v303', buffText: '🌑 暗影帷幕：閃避減傷 +35%', trail: '#a855f7' },
    },
  },
  mage: {
    color: '#38bdf8',
    seqs: ['seq16_m_meteor', 'seq16_m_frost_nova', 'seq16_m_lightning_strike', 'seq16_m_inferno', 'seq16_m_fireball_blast', 'seq16_m_blizzard', 'seq16_m_firewall', 'seq16_m_ball_lightning', 'seq16_m_supernova'],
    decals: ['decal_m_scorch', 'decal_m_frost', 'decal_m_lightning', 'decal_m_void'],
    projs: ['proj_m_fireball', 'proj_m_frozen_orb', 'proj_m_ice_lance', 'proj_m_fire_bolt'],
    bySkillId: {
      m_fire_bolt:        { style: 'proj', proj: 'proj_m_fire_bolt',  decal: 'decal_m_scorch',    multiProj: 3, trail: '#fb923c', burstColor: '#fdba74' },
      m_frost_bolt:       { style: 'proj', proj: 'proj_m_ice_lance',  decal: 'decal_m_frost',     multiProj: 3, trail: '#38bdf8', burstColor: '#bae6fd' },
      m_ice_shards:       { style: 'proj', proj: 'proj_m_ice_lance',  decal: 'decal_m_frost',     multiProj: 5, trail: '#38bdf8', burstColor: '#7dd3fc' },
      m_arc_lash:         { style: 'dash', seq: 'seq16_m_lightning_strike', decal: 'decal_m_lightning', scale: 1.24, trail: '#fde047' },
      m_spark:            { style: 'proj', proj: 'proj_m_frozen_orb', decal: 'decal_m_lightning', multiProj: 3, trail: '#facc15', burstColor: '#fef08a' },
      m_fireball:         { style: 'proj', proj: 'proj_m_fireball',   decal: 'decal_m_scorch',    seq: 'seq16_m_fireball_blast', multiProj: 1, trail: '#f97316', scale: 1.30 },
      chain_lightning:    { style: 'aoe',  seq: 'seq16_m_lightning_strike', decal: 'decal_m_lightning', scale: 1.34, trail: '#fde047' },
      m_frozen_orb:       { style: 'proj', proj: 'proj_m_frozen_orb', decal: 'decal_m_frost',     seq: 'seq16_m_frost_nova', multiProj: 1, trail: '#38bdf8', scale: 1.28 },
      arcane_orb:         { style: 'proj', proj: 'proj_m_frozen_orb', decal: 'decal_m_void',      seq: 'seq16_m_supernova',  multiProj: 1, trail: '#c084fc', scale: 1.28 },
      m_flame_shield:     { style: 'self_buff', buffMode: 'pure_defense',   buffKey: 'buff_m_flame_shield_v303', buffText: '🔥 烈焰護盾：火焰屏障展開', trail: '#fb923c' },
      m_ice_armor:        { style: 'self_buff', buffMode: 'pure_defense',   buffKey: 'buff_m_ice_armor_v303',    buffText: '❄️ 寒冰護甲：稜鏡冰盾展開', trail: '#38bdf8' },
      m_arcane_blink:     { style: 'dash', seq: 'seq16_m_supernova',  decal: 'decal_m_void',      scale: 1.26, trail: '#c084fc' },
      frost_nova:         { style: 'dash', seq: 'seq16_m_frost_nova', decal: 'decal_m_frost',     scale: 1.34, trail: '#38bdf8' },
      m_flame_hydra:      { style: 'summon', summonType: 'mage_conj', conjKey: 'anim_conj_hydra', conjProj: 'proj_m_fire_bolt', seq: 'seq16_m_firewall', decal: 'decal_m_scorch', scale: 1.24, trail: '#f97316' },
      m_ice_blades:       { style: 'summon', summonType: 'mage_conj', conjKey: 'anim_conj_ice_blades', conjMelee: true, seq: 'seq16_m_frost_nova', decal: 'decal_m_frost', scale: 1.20, trail: '#38bdf8' },
      m_lightning_spear:  { style: 'summon', summonType: 'mage_conj', conjKey: 'anim_conj_lightning_spear', conjMelee: true, seq: 'seq16_m_lightning_strike', decal: 'decal_m_lightning', scale: 1.22, trail: '#facc15' },
      m_familiar:         { style: 'summon', summonType: 'mage_conj', conjKey: 'anim_conj_familiar', conjProj: 'proj_m_frozen_orb', seq: 'seq16_m_supernova', decal: 'decal_m_void', scale: 1.18, trail: '#c084fc' },
      meteor:             { style: 'aoe',  seq: 'seq16_m_meteor',     decal: 'decal_m_scorch',    scale: 1.40, trail: '#f97316' },
      m_firewall:         { style: 'aoe',  seq: 'seq16_m_firewall',   decal: 'decal_m_scorch',    scale: 1.34, trail: '#f97316' },
      m_blizzard_field:   { style: 'aoe',  seq: 'seq16_m_blizzard',   decal: 'decal_m_frost',     scale: 1.38, trail: '#38bdf8' },
      m_ball_lightning:   { style: 'aoe',  seq: 'seq16_m_ball_lightning', decal: 'decal_m_lightning', scale: 1.34, trail: '#facc15' },
      black_hole:         { style: 'aoe',  seq: 'seq16_m_supernova',  decal: 'decal_m_void',      scale: 1.38, trail: '#a855f7' },
      m_inferno:          { style: 'aoe',  seq: 'seq16_m_inferno',    decal: 'decal_m_scorch',    scale: 1.40, trail: '#f97316' },
      m_deep_freeze:      { style: 'aoe',  seq: 'seq16_m_blizzard',   decal: 'decal_m_frost',     scale: 1.38, trail: '#38bdf8' },
      m_unstable_currents:{ style: 'self_buff', buffMode: 'ranged_empower', buffKey: 'buff_m_ice_armor_v303',    buffText: '⚡ 不穩電流：施法與雷鏈加速', followProj: 'proj_m_frozen_orb', followSeq: 'seq16_m_lightning_strike', trail: '#fde047' },
      m_astral_supernova: { style: 'aoe',  seq: 'seq16_m_supernova',  decal: 'decal_m_void',      scale: 1.42, trail: '#c084fc' },
    },
  },
  paladin: {
    color: '#fde047',
    seqs: ['seq16_p_holy_slash', 'seq16_p_heaven_pillar', 'seq16_p_divine_storm', 'seq16_p_judgment_cross', 'seq16_p_shield_bash', 'seq16_p_condemn_vortex', 'seq16_p_thorns_burst', 'seq16_p_verdict_sword'],
    decals: ['decal_p_consecration', 'decal_p_cross_crater', 'decal_p_sanctuary', 'decal_p_aegis_ring'],
    projs: ['proj_p_holy_bolt', 'proj_p_holy_lance', 'proj_p_justice_hammer'],
    bySkillId: {
      p_smite_lash:       { style: 'dash', seq: 'seq16_p_holy_slash',     decal: 'decal_p_consecration', scale: 1.24, trail: '#fde047' },
      p_zeal_strike:      { style: 'dash', seq: 'seq16_p_holy_slash',     decal: 'decal_p_sanctuary',    scale: 1.26, trail: '#fde047' },
      p_holy_bolt:        { style: 'proj', proj: 'proj_p_holy_bolt',      decal: 'decal_p_sanctuary',    multiProj: 3, trail: '#fde047', burstColor: '#fef08a' },
      p_justice_hammer:   { style: 'proj', proj: 'proj_p_justice_hammer', decal: 'decal_p_consecration', multiProj: 2, trail: '#fbbf24', burstColor: '#fde68a' },
      blessed_hammer:     { style: 'proj', proj: 'proj_p_justice_hammer', decal: 'decal_p_consecration', seq: 'seq16_p_divine_storm', multiProj: 3, trail: '#fde047', scale: 1.28 },
      heaven_fist:        { style: 'aoe',  seq: 'seq16_p_heaven_pillar',  decal: 'decal_p_cross_crater', scale: 1.38, trail: '#fde047' },
      p_holy_lance:       { style: 'proj', proj: 'proj_p_holy_lance',     decal: 'decal_p_sanctuary',    multiProj: 3, trail: '#fef08a', burstColor: '#fde047' },
      divine_storm:       { style: 'dash', seq: 'seq16_p_divine_storm',   decal: 'decal_p_consecration', scale: 1.34, trail: '#fde047' },
      holy_aegis:         { style: 'self_buff', buffMode: 'pure_defense',  buffKey: 'buff_p_holy_aegis_v303',  buffText: '🛡️ 聖光神盾：穹頂護罩展開', trail: '#fde047' },
      p_redemption_prayer:{ style: 'self_buff', buffMode: 'pure_defense',  buffKey: 'buff_p_holy_aegis_v303',  buffText: '✨ 救贖禱言：神聖治療光環', trail: '#fde047' },
      shield_bash:        { style: 'dash', seq: 'seq16_p_shield_bash',    decal: 'decal_p_aegis_ring',   scale: 1.28, trail: '#fbbf24' },
      p_sanctuary_ward:   { style: 'self_buff', buffMode: 'pure_defense',  buffKey: 'buff_p_holy_aegis_v303',  buffText: '🛡️ 聖域結界：格擋減傷強化', trail: '#fde047' },
      p_crusader_charge:  { style: 'dash', seq: 'seq16_p_shield_bash',    decal: 'decal_p_cross_crater', scale: 1.32, trail: '#fde047' },
      judgment:           { style: 'aoe',  seq: 'seq16_p_judgment_cross', decal: 'decal_p_cross_crater', scale: 1.36, trail: '#fde047' },
      p_condemn_pull:     { style: 'aoe',  seq: 'seq16_p_condemn_vortex', decal: 'decal_p_consecration', scale: 1.34, trail: '#fde047' },
      p_falling_sword:    { style: 'aoe',  seq: 'seq16_p_verdict_sword',  decal: 'decal_p_cross_crater', scale: 1.38, trail: '#fde047' },
      consecration:       { style: 'aoe',  seq: 'seq16_p_condemn_vortex', decal: 'decal_p_consecration', scale: 1.34, trail: '#fde047' },
      radiant_aura:       { style: 'self_buff', buffMode: 'pure_defense',  buffKey: 'buff_p_divine_aura_v303', buffText: '☀️ 熾光懲戒光環：持續聖光脈衝', trail: '#fde047' },
      p_thorns_aura:      { style: 'self_buff', buffMode: 'pure_defense',  buffKey: 'buff_p_divine_aura_v303', buffText: '⚡ 荊棘復仇光環：高額反傷', trail: '#fbbf24' },
      p_solar_beacon:     { style: 'aoe',  seq: 'seq16_p_heaven_pillar',  decal: 'decal_p_consecration', scale: 1.34, trail: '#fde047' },
      p_seraph_descent:   { style: 'summon', summonType: 'clone', cloneCount: 2, conjProj: 'proj_p_holy_bolt', seq: 'seq16_p_heaven_pillar', decal: 'decal_p_cross_crater', scale: 1.30, trail: '#fde047' },
      p_heavens_verdict:  { style: 'aoe',  seq: 'seq16_p_verdict_sword',  decal: 'decal_p_cross_crater', scale: 1.40, trail: '#fde047' },
      p_valkyrie_avatar:  { style: 'summon', summonType: 'clone', cloneCount: 2, seq: 'seq16_p_divine_storm', decal: 'decal_p_sanctuary', scale: 1.28, trail: '#fde047' },
      p_akarats_wrath:    { style: 'self_buff', buffMode: 'melee_empower', buffKey: 'buff_p_divine_aura_v303', buffText: '👑 神聖化身：全聖傷 +50%', followSeq: 'seq16_p_judgment_cross', trail: '#fde047' },
    },
  },
  necro: {
    color: '#2dd4bf',
    seqs: ['seq16_n_corpse_boom', 'seq16_n_bone_burst', 'seq16_n_tendrils', 'seq16_n_blight_pool', 'seq16_n_blood_surge', 'seq16_n_blood_wave', 'seq16_n_bone_storm', 'seq16_n_soul_rift'],
    decals: ['decal_n_bone', 'decal_n_blood', 'decal_n_plague', 'decal_n_rift'],
    projs: ['proj_n_bone_spear', 'proj_n_blood_lance'],
    bySkillId: {
      n_reap_scythe:     { style: 'dash',   seq: 'seq16_n_soul_rift',   decal: 'decal_n_rift',   scale: 1.24, trail: '#2dd4bf' },
      n_bone_splinters:  { style: 'proj',   proj: 'proj_n_bone_spear',  decal: 'decal_n_bone',   multiProj: 4, trail: '#e2e8f0', burstColor: '#cbd5e1' },
      n_hemorrhage:      { style: 'proj',   proj: 'proj_n_blood_lance', decal: 'decal_n_blood',  multiProj: 2, trail: '#ef4444', burstColor: '#fca5a5' },
      n_decompose:       { style: 'aoe',    seq: 'seq16_n_blight_pool', decal: 'decal_n_plague', scale: 1.26, trail: '#22c55e' },
      bone_spear:        { style: 'proj',   proj: 'proj_n_bone_spear',  decal: 'decal_n_bone',   multiProj: 3, trail: '#e2e8f0', burstColor: '#f8fafc' },
      n_blood_surge:     { style: 'aoe',    seq: 'seq16_n_blood_surge', decal: 'decal_n_blood',  scale: 1.32, trail: '#ef4444' },
      n_blood_lance:     { style: 'proj',   proj: 'proj_n_blood_lance', decal: 'decal_n_blood',  multiProj: 3, trail: '#ef4444', burstColor: '#f87171' },
      n_sever:           { style: 'dash',   seq: 'seq16_n_soul_rift',   decal: 'decal_n_rift',   scale: 1.28, trail: '#2dd4bf' },
      n_blood_mist:      { style: 'self_buff', buffMode: 'pure_defense',  buffKey: 'buff_n_blood_frenzy_v303', buffText: '🩸 血霧化形：短暫免疫傷害', trail: '#ef4444' },
      n_bone_shield:     { style: 'self_buff', buffMode: 'pure_defense',  buffKey: 'buff_n_bone_shield_v303',  buffText: '💀 骸骨護盾：冥火骨環護體', trail: '#2dd4bf' },
      bone_prison:       { style: 'aoe',    seq: 'seq16_n_bone_burst',  decal: 'decal_n_bone',   scale: 1.30, trail: '#cbd5e1' },
      corpse_explosion:  { style: 'aoe',    seq: 'seq16_n_corpse_boom', decal: 'decal_n_blood',  scale: 1.38, trail: '#ef4444' },
      decrepify:         { style: 'aoe',    seq: 'seq16_n_blight_pool', decal: 'decal_n_plague', scale: 1.30, trail: '#2dd4bf' },
      n_iron_maiden:     { style: 'aoe',    seq: 'seq16_n_tendrils',    decal: 'decal_n_blood',  scale: 1.30, trail: '#ef4444' },
      n_corpse_tendrils: { style: 'aoe',    seq: 'seq16_n_tendrils',    decal: 'decal_n_blood',  scale: 1.32, trail: '#ef4444' },
      n_blight_pool:     { style: 'aoe',    seq: 'seq16_n_blight_pool', decal: 'decal_n_plague', scale: 1.34, trail: '#22c55e' },
      raise_skeleton:    { style: 'summon', summonKind: 'skel',  seq: 'seq16_n_soul_rift',  decal: 'decal_n_rift', scale: 1.28, trail: '#2dd4bf' },
      blood_golem:       { style: 'summon', summonKind: 'golem', seq: 'seq16_n_blood_surge',decal: 'decal_n_blood',scale: 1.32, trail: '#ef4444' },
      undead_frenzy:     { style: 'summon', summonKind: 'skel',  seq: 'seq16_n_blood_surge',decal: 'decal_n_blood',scale: 1.30, trail: '#ef4444' },
      wraith_army:       { style: 'summon', summonKind: 'wraith',seq: 'seq16_n_soul_rift',  decal: 'decal_n_rift', scale: 1.34, trail: '#2dd4bf' },
      n_army_scourge:    { style: 'summon', summonKind: 'skel',  seq: 'seq16_n_bone_storm', decal: 'decal_n_rift', scale: 1.36, trail: '#2dd4bf' },
      n_blood_wave:      { style: 'aoe',    seq: 'seq16_n_blood_wave',  decal: 'decal_n_blood',  scale: 1.38, trail: '#ef4444' },
      n_bone_storm:      { style: 'aoe',    seq: 'seq16_n_bone_storm',  decal: 'decal_n_bone',   scale: 1.36, trail: '#e2e8f0' },
      n_soul_rift:       { style: 'aoe',    seq: 'seq16_n_soul_rift',   decal: 'decal_n_rift',   scale: 1.38, trail: '#2dd4bf' },
    },
  },
  assassin: {
    color: '#c084fc',
    seqs: ['seq16_a_shadow_slash', 'seq16_a_blade_flurry', 'seq16_a_venom_nova', 'seq16_a_smoke_veil', 'seq16_a_garrote', 'seq16_a_execute', 'seq16_a_eclipse', 'seq16_a_reaper_dance'],
    decals: ['decal_a_blood_cross', 'decal_a_venom_pool', 'decal_a_eclipse', 'decal_a_kunai'],
    projs: ['proj_a_kunai', 'proj_a_shuriken', 'proj_a_boomerang'],
    bySkillId: {
      a_twin_fang:       { style: 'dash', seq: 'seq16_a_shadow_slash', decal: 'decal_a_blood_cross', scale: 1.24, trail: '#c084fc' },
      a_blade_shift:     { style: 'dash', seq: 'seq16_a_shadow_slash', decal: 'decal_a_eclipse',     scale: 1.26, trail: '#a855f7' },
      a_venom_slash:     { style: 'dash', seq: 'seq16_a_venom_nova',   decal: 'decal_a_venom_pool',  scale: 1.26, trail: '#22c55e' },
      a_shuriken_fan:    { style: 'proj', proj: 'proj_a_shuriken',     decal: 'decal_a_kunai',       multiProj: 5, trail: '#c084fc', burstColor: '#e9d5ff' },
      a_boomerang_blades:{ style: 'proj', proj: 'proj_a_boomerang',    decal: 'decal_a_kunai',       multiProj: 3, trail: '#c084fc', burstColor: '#d8b4fe' },
      blade_flurry:      { style: 'dash', seq: 'seq16_a_blade_flurry', decal: 'decal_a_blood_cross', scale: 1.34, trail: '#f43f5e' },
      poison_kunai:      { style: 'proj', proj: 'proj_a_kunai',        decal: 'decal_a_venom_pool',  multiProj: 5, trail: '#22c55e', burstColor: '#86efac' },
      a_twisting_blades: { style: 'dash', seq: 'seq16_a_blade_flurry', decal: 'decal_a_blood_cross', scale: 1.32, trail: '#c084fc' },
      shadow_blitz:      { style: 'dash', seq: 'seq16_a_shadow_slash', decal: 'decal_a_eclipse',     scale: 1.32, trail: '#a855f7' },
      a_shadow_backstab: { style: 'dash', seq: 'seq16_a_execute',      decal: 'decal_a_blood_cross', scale: 1.30, trail: '#a855f7' },
      smoke_veil:        { style: 'self_buff', buffMode: 'pure_defense',  buffKey: 'buff_a_blood_cloak_v303', buffText: '🌫️ 煙霧隱遁：閃避率 +50%', trail: '#c084fc' },
      a_blood_cloak:     { style: 'self_buff', buffMode: 'pure_defense',  buffKey: 'buff_a_blood_cloak_v303', buffText: '🌙 血月影衣：暗影護體減傷', trail: '#f43f5e' },
      venom_burst:       { style: 'aoe',  seq: 'seq16_a_venom_nova',   decal: 'decal_a_venom_pool',  scale: 1.34, trail: '#22c55e' },
      a_crimson_mist:    { style: 'aoe',  seq: 'seq16_a_venom_nova',   decal: 'decal_a_venom_pool',  scale: 1.32, trail: '#f43f5e' },
      a_garrote_bind:    { style: 'dash', seq: 'seq16_a_garrote',      decal: 'decal_a_blood_cross', scale: 1.30, trail: '#ef4444' },
      a_shadow_decoy_bomb:{ style: 'aoe', seq: 'seq16_a_smoke_veil',   decal: 'decal_a_eclipse',     scale: 1.32, trail: '#a855f7' },
      shadow_clones:     { style: 'summon', summonType: 'clone', cloneCount: 2, seq: 'seq16_a_shadow_slash', decal: 'decal_a_eclipse', scale: 1.26, trail: '#c084fc' },
      a_death_lotus:     { style: 'aoe',  seq: 'seq16_a_reaper_dance', decal: 'decal_a_blood_cross', scale: 1.36, trail: '#f43f5e' },
      a_venom_imbue:     { style: 'self_buff', buffMode: 'melee_empower', buffKey: 'buff_a_venom_imbue_v303', buffText: '☠️ 劇毒淬刃：雙刃劇毒附魔', followSeq: 'seq16_a_venom_nova', trail: '#22c55e' },
      lethal_fangs:      { style: 'self_buff', buffMode: 'melee_empower', buffKey: 'buff_a_venom_imbue_v303', buffText: '☠️ 致命毒牙：攻速 +45%', followSeq: 'seq16_a_shadow_slash', trail: '#22c55e' },
      shadow_execute:    { style: 'dash', seq: 'seq16_a_execute',      decal: 'decal_a_blood_cross', scale: 1.38, trail: '#c084fc' },
      a_thousand_shadows:{ style: 'dash', seq: 'seq16_a_reaper_dance', decal: 'decal_a_eclipse',     scale: 1.40, trail: '#a855f7' },
      a_crimson_eclipse: { style: 'aoe',  seq: 'seq16_a_eclipse',      decal: 'decal_a_eclipse',     scale: 1.38, trail: '#f43f5e' },
      a_reaper_dance:    { style: 'dash', seq: 'seq16_a_reaper_dance', decal: 'decal_a_blood_cross', scale: 1.38, trail: '#c084fc' },
    },
  },
};

export class HeroSkillShowcase {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.rafId = null;
    this._impactTimer = null;
    this.classId = 'warrior';
    this.skillIdx = 0;
    this.autoPlay = true;
    this.nextCastAt = 0;
    this.castAnimUntil = 0;
    this.heroBaseX = 225;
    this.heroBaseY = 276;
    this.heroX = 225;
    this.heroY = 276;
    this.dashUntil = 0;
    this.dashStartAt = 0;
    this.dashTargetX = 468;
    this.dashTargetY = 264;

    this.imgCache = new Map();
    this.atlasCache = new Map();
    this.decals = [];
    this.seqAnims = [];
    this.projs = [];
    this.sparks = [];
    this.summons = [];
    this.heroBuffs = [];
    this._followTimer = null;
    this.popups = [];
    this.onSkillChange = null;
    this.targets = [
      { x: 532, y: 264, key: 'dummy_boss_v299',     scale: 0.22, wobbleUntil: 0, punchUntil: 0 },
      { x: 612, y: 226, key: 'dummy_standard_v299', scale: 0.18, wobbleUntil: 0, punchUntil: 0 },
      { x: 604, y: 304, key: 'dummy_standard_v299', scale: 0.18, wobbleUntil: 0, punchUntil: 0 },
    ];
  }

  _loadImg(url) {
    if (this.imgCache.has(url)) return this.imgCache.get(url);
    const rec = { img: new Image(), ready: false };
    rec.img.onload = () => { rec.ready = true; };
    rec.img.src = url;
    this.imgCache.set(url, rec);
    return rec;
  }

  _loadAtlas(pngUrl, jsonUrl) {
    if (this.atlasCache.has(pngUrl)) return this.atlasCache.get(pngUrl);
    const rec = { img: new Image(), frames: null, ready: false };
    this.atlasCache.set(pngUrl, rec);
    fetch(jsonUrl)
      .then((r) => (r.ok ? r.json() : null))
      .then((meta) => {
        if (!meta) return;
        rec.frames = meta.frames || {};
        rec.img.onload = () => {
          if (pngUrl.includes('atlas_ranger')) {
            try {
              const oc = document.createElement('canvas');
              oc.width = rec.img.naturalWidth;
              oc.height = rec.img.naturalHeight;
              const octx = oc.getContext('2d');
              octx.drawImage(rec.img, 0, 0);
              const idata = octx.getImageData(0, 0, oc.width, oc.height);
              const d = idata.data;
              for (let i = 0; i < d.length; i += 4) {
                if (d[i + 3] > 20) {
                  const r = d[i], g = d[i + 1], b = d[i + 2];
                  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
                  // v302: 移除遊俠弓身與背景殘留純白/近白低飽和色塊
                  if (r > 230 && g > 230 && b > 230 && (mx - mn) < 20) {
                    d[i + 3] = 0;
                  }
                }
              }
              octx.putImageData(idata, 0, 0);
              rec.cleanCanvas = oc;
            } catch {}
          }
          rec.ready = true;
        };
        rec.img.src = pngUrl;
      })
      .catch(() => {});
    return rec;
  }

  _loadHeroAtlas(cid) {
    return this._loadAtlas(`./assets/heroes/atlas_${cid}.png?v=66`, `./assets/heroes/atlas_${cid}.json?v=66`);
  }

  _preloadClassAssets(cid) {
    this._loadImg('./assets/bg/arena_training_v299.webp?v=299');
    this._loadImg('./assets/fx/dummy_boss_v299.webp?v=299');
    this._loadImg('./assets/fx/dummy_standard_v299.webp?v=299');
    this._loadHeroAtlas(cid);
    if (cid === 'necro') {
      this._loadAtlas('./assets/heroes/atlas_summons.png', './assets/heroes/atlas_summons.json');
    }
    if (cid === 'mage') {
      ['anim_conj_hydra', 'anim_conj_ice_blades', 'anim_conj_lightning_spear', 'anim_conj_familiar']
        .forEach((k) => this._loadImg(`./assets/fx/${k}.webp`));
    }
    const cfg = CLASS_V301_VFX[cid] || CLASS_V301_VFX.warrior;
    cfg.seqs.forEach((k) => this._loadImg(`./assets/fx/${k}.webp`));
    cfg.decals.forEach((k) => this._loadImg(`./assets/fx/${k}.webp`));
    cfg.projs.forEach((k) => this._loadImg(`./assets/fx/${k}.webp`));
    const buffKeysByClass = {
      warrior:  ['buff_w_iron_skin_v303', 'buff_w_berserk_roar_v303'],
      ranger:   ['buff_r_wind_step_v303', 'buff_r_shadow_shroud_v303'],
      mage:     ['buff_m_flame_shield_v303', 'buff_m_ice_armor_v303'],
      paladin:  ['buff_p_holy_aegis_v303', 'buff_p_divine_aura_v303'],
      necro:    ['buff_n_bone_shield_v303', 'buff_n_blood_frenzy_v303'],
      assassin: ['buff_a_venom_imbue_v303', 'buff_a_blood_cloak_v303'],
    };
    (buffKeysByClass[cid] || []).forEach((k) => this._loadImg(`./assets/fx/${k}.webp?v=303`));
  }

  setAutoPlay(flag) {
    this.autoPlay = !!flag;
  }

  attach(canvas, classId, onSkillChange) {
    this.stop();
    this.canvas = canvas;
    this.ctx = canvas?.getContext('2d') || null;
    this.classId = classId || 'warrior';
    this.onSkillChange = onSkillChange || null;
    this.skillIdx = 0;
    this.decals = [];
    this.seqAnims = [];
    this.projs = [];
    this.sparks = [];
    this.summons = [];
    this.heroBuffs = [];
    this._followTimer = null;
    this.popups = [];
    this.heroX = this.heroBaseX;
    this.heroY = this.heroBaseY;
    this._preloadClassAssets(this.classId);

    this.triggerSkill(0);
    const loop = (now) => {
      this._update(now);
      this._render(now);
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stop() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    if (this._impactTimer) { clearTimeout(this._impactTimer); this._impactTimer = null; }
    if (this._followTimer) { clearTimeout(this._followTimer); this._followTimer = null; }
  }

  detach() {
    this.stop();
  }

  _getSkills() {
    const raw = CLASS_SKILLS_MAP[this.classId] || [];
    return Array.isArray(raw) ? raw : Object.values(raw);
  }

  _resolveSpec(sk, safeIdx) {
    const cfg = CLASS_V301_VFX[this.classId] || CLASS_V301_VFX.warrior;
    if (sk && cfg.bySkillId?.[sk.id]) return cfg.bySkillId[sk.id];
    const nm = `${sk?.id || ''} ${sk?.name || ''}`;
    if (/毒|瘟|枯|venom|poison/i.test(nm)) {
      return { style: 'aoe', seq: cfg.seqs.find((s) => /venom|blight/.test(s)) || cfg.seqs[0], decal: cfg.decals.find((d) => /venom|plague/.test(d)) || cfg.decals[0], trail: '#22c55e', scale: 1.26 };
    }
    if (/冰|霜|寒|frost|blizzard|ice/i.test(nm)) {
      return { style: 'aoe', seq: cfg.seqs.find((s) => /frost|blizzard/.test(s)) || cfg.seqs[0], decal: cfg.decals.find((d) => /frost/.test(d)) || cfg.decals[0], trail: '#38bdf8', scale: 1.28 };
    }
    if (/雷|電|lightning|storm/i.test(nm)) {
      return { style: 'aoe', seq: cfg.seqs.find((s) => /lightning|storm/.test(s)) || cfg.seqs[0], decal: cfg.decals.find((d) => /lightning/.test(d)) || cfg.decals[0], trail: '#fde047', scale: 1.30 };
    }
    return {
      style: (this.classId === 'warrior' || this.classId === 'assassin' || this.classId === 'paladin') ? 'dash' : 'aoe',
      seq: cfg.seqs[safeIdx % cfg.seqs.length],
      decal: cfg.decals[safeIdx % cfg.decals.length],
      trail: cfg.color,
      scale: 1.26,
    };
  }

  _spawnImpactSparks(x, y, color, count = 12) {
    const now = performance.now();
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 70 + Math.random() * 140;
      this.sparks.push({
        x, y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 30,
        color,
        size: 2.5 + Math.random() * 3.5,
        bornAt: now,
        dur: 340 + Math.random() * 220,
      });
    }
  }

  triggerSkill(idx) {
    const skills = this._getSkills();
    if (!skills.length) return;
    const safeIdx = ((idx % skills.length) + skills.length) % skills.length;
    this.skillIdx = safeIdx;
    const sk = skills[safeIdx];
    const now = performance.now();
    this.castAnimUntil = now + 560;
    this.nextCastAt = now + 2650;

    if (this.onSkillChange) this.onSkillChange(safeIdx, sk);

    const cfg = CLASS_V301_VFX[this.classId] || CLASS_V301_VFX.warrior;
    const spec = this._resolveSpec(sk, safeIdx);
    const mainTgt = this.targets[0];
    const fxX = mainTgt.x;
    const fxY = mainTgt.y - 16;

    if (spec.style === 'dash') {
      this.dashStartAt = now;
      this.dashUntil = now + 520;
      this.dashTargetX = mainTgt.x - 58;
      this.dashTargetY = mainTgt.y + 4;
    }

    if (spec.style === 'summon') {
      this.nextCastAt = now + 4650; // 延長展示時間，完整演出召喚進場→多波攻擊→消散
      this.summons = [];
      const stype = spec.summonType || 'necro';
      if (stype === 'mage_conj') {
        const cnt = spec.conjKey === 'anim_conj_hydra' ? 2 : (spec.conjKey === 'anim_conj_ice_blades' ? 3 : 2);
        for (let i = 0; i < cnt; i++) {
          const isTurret = !spec.conjMelee;
          const sx = isTurret ? (this.heroBaseX + 85 + i * 48) : (this.heroBaseX + 55 + i * 24);
          const sy = isTurret ? (this.heroBaseY - 45 + i * 62) : (this.heroBaseY - 30 + (i - 1) * 34);
          this.summons.push({
            summonType: 'mage_conj',
            conjKey: spec.conjKey,
            conjProj: spec.conjProj || null,
            conjMelee: !!spec.conjMelee,
            trail: spec.trail || cfg.color,
            x: sx, y: sy,
            tx: isTurret ? sx : (mainTgt.x - 28 + (i - 1) * 28),
            ty: isTurret ? sy : (mainTgt.y - 18 + (i - 1) * 24),
            bornAt: now,
            dur: 4300,
            nextAtkAt: now + 520 + i * 180,
            atkEveryMs: 850,
          });
        }
      } else if (stype === 'clone') {
        const cnt = spec.cloneCount || 2;
        for (let i = 0; i < cnt; i++) {
          const isRanged = !!spec.conjProj;
          this.summons.push({
            summonType: 'clone',
            classId: this.classId,
            conjProj: spec.conjProj || null,
            trail: spec.trail || cfg.color,
            x: this.heroBaseX + 35,
            y: this.heroBaseY + (i === 0 ? -42 : 42),
            tx: isRanged ? (this.heroBaseX + 95 + i * 24) : (mainTgt.x - 56 + i * 26),
            ty: mainTgt.y + (i === 0 ? -36 : 36),
            bornAt: now,
            dur: 4200,
            nextAtkAt: now + 620 + i * 200,
            atkEveryMs: 900,
          });
        }
      } else {
        const kind = spec.summonKind || 'skel';
        const cnt = kind === 'golem' ? 1 : 3;
        for (let i = 0; i < cnt; i++) {
          this.summons.push({
            summonType: 'necro',
            kind,
            trail: spec.trail || '#2dd4bf',
            x: this.heroBaseX + 42 + i * 18,
            y: this.heroBaseY - 12 + (i - 1) * 32,
            tx: mainTgt.x - 48 + (i % 2) * 22,
            ty: mainTgt.y - 10 + (i - 1) * 28,
            bornAt: now,
            dur: 4400,
            nextAtkAt: now + 680 + i * 210,
            atkEveryMs: 920,
          });
        }
      }
    }

    const triggerImpact = (impactAt, playSeq = true) => {
      if (spec.decal) {
        this.decals.push({
          url: `./assets/fx/${spec.decal}.webp`,
          x: fxX,
          y: mainTgt.y + 8,
          scale: (spec.scale || 1.26) * 0.38,
          bornAt: impactAt,
          dur: 1750,
        });
      }
      if (playSeq && spec.seq) {
        this.seqAnims.push({
          url: `./assets/fx/${spec.seq}.webp`,
          x: fxX,
          y: fxY,
          scale: spec.scale || 1.26,
          bornAt: impactAt,
          fps: 19,
        });
      }
      this._spawnImpactSparks(fxX, fxY, spec.burstColor || spec.trail || cfg.color, playSeq ? 10 : 18);

      this.targets.forEach((t, ti) => {
        const hitAt = impactAt + ti * 65;
        t.wobbleUntil = hitAt + 220;
        t.punchUntil = hitAt + 130;
        const isCrit = (ti === 0) || Math.random() < 0.45;
        const base = 1950 + safeIdx * 540 + Math.floor(Math.random() * 1400);
        const dmg = isCrit ? Math.round(base * 2.15) : base;
        this.popups.push({
          x: t.x + (Math.random() - 0.5) * 20,
          y: t.y - 56 - ti * 4,
          text: isCrit ? `${dmg.toLocaleString()}!` : dmg.toLocaleString(),
          color: isCrit ? '#fde047' : (ti === 0 ? (spec.trail || cfg.color) : '#ffffff'),
          size: isCrit ? 22 : 17,
          isCrit,
          bornAt: hitAt,
          dur: 900,
        });
      });
    };

    if (this._impactTimer) { clearTimeout(this._impactTimer); this._impactTimer = null; }
    if (this._followTimer) { clearTimeout(this._followTimer); this._followTimer = null; }

    if (this._followTimer) { clearTimeout(this._followTimer); this._followTimer = null; }
    if (spec.style === 'self_buff') {
      this.nextCastAt = now + 3800;
      this.heroBuffs = [{
        url: `./assets/fx/${spec.buffKey}.webp?v=303`,
        color: spec.trail || cfg.color,
        mode: spec.buffMode || 'pure_defense',
        bornAt: now,
        dur: 3600,
      }];
      // 在英雄頭頂跳出清晰自身增益浮字
      this.popups.push({
        x: this.heroBaseX,
        y: this.heroBaseY - 96,
        text: spec.buffText || '✨ 自身增益展開',
        color: spec.trail || '#fde047',
        size: 16,
        isCrit: false,
        bornAt: now + 80,
        dur: 1450,
      });
      this._spawnImpactSparks(this.heroBaseX, this.heroBaseY - 36, spec.trail || cfg.color, 14);

      if (spec.buffMode === 'ranged_empower' && spec.followProj) {
        // 類型 B：原地疊加完畢後（0.70s），維持遠程站位連射強化箭矢／法球
        this._followTimer = setTimeout(() => {
          this._followTimer = null;
          if (!this.rafId) return;
          const tNow = performance.now();
          this.castAnimUntil = tNow + 480;
          for (let i = 0; i < 3; i++) {
            const tgt = this.targets[i % this.targets.length];
            this.projs.push({
              url: `./assets/fx/${spec.followProj}.webp`,
              sx: this.heroBaseX + 34,
              sy: this.heroBaseY - 30 + (i - 1) * 12,
              tx: tgt.x,
              ty: tgt.y - 20,
              trailColor: spec.trail || cfg.color,
              bornAt: tNow + i * 75,
              dur: 210,
              scale: 0.30,
            });
          }
          this._impactTimer = setTimeout(() => {
            this._impactTimer = null;
            if (!this.rafId) return;
            const iAt = performance.now();
            if (spec.followSeq) {
              this.seqAnims.push({ url: `./assets/fx/${spec.followSeq}.webp`, x: fxX, y: fxY, scale: 1.24, bornAt: iAt, fps: 19 });
            }
            this._spawnImpactSparks(fxX, fxY, spec.trail || cfg.color, 14);
            this.targets.forEach((t, ti) => {
              t.wobbleUntil = iAt + 200;
              t.punchUntil = iAt + 120;
              const dmg = Math.round((3200 + Math.random() * 1600) * 1.65);
              this.popups.push({ x: t.x, y: t.y - 56 - ti * 4, text: `${dmg.toLocaleString()}!`, color: '#fde047', size: 22, isCrit: true, bornAt: iAt + ti * 60, dur: 900 });
            });
          }, 210);
        }, 700);
      } else if (spec.buffMode === 'melee_empower') {
        // 類型 C：原地完成戰吼／淬刃疊加（0.78s）後，帶著身上持續光環切入強化斬擊
        this._followTimer = setTimeout(() => {
          this._followTimer = null;
          if (!this.rafId) return;
          const tNow = performance.now();
          this.castAnimUntil = tNow + 520;
          this.dashStartAt = tNow;
          this.dashUntil = tNow + 500;
          this.dashTargetX = mainTgt.x - 58;
          this.dashTargetY = mainTgt.y + 4;
          this._impactTimer = setTimeout(() => {
            this._impactTimer = null;
            if (!this.rafId) return;
            const iAt = performance.now();
            if (spec.followSeq) {
              this.seqAnims.push({ url: `./assets/fx/${spec.followSeq}.webp`, x: fxX, y: fxY, scale: 1.28, bornAt: iAt, fps: 19 });
            }
            this._spawnImpactSparks(fxX, fxY, spec.trail || cfg.color, 14);
            this.targets.forEach((t, ti) => {
              t.wobbleUntil = iAt + 220;
              t.punchUntil = iAt + 130;
              const dmg = Math.round((3600 + Math.random() * 1800) * 1.75);
              this.popups.push({ x: t.x, y: t.y - 56 - ti * 4, text: `${dmg.toLocaleString()}!`, color: '#fde047', size: 23, isCrit: true, bornAt: iAt + ti * 60, dur: 900 });
            });
          }, 190);
        }, 780);
      }
      // 類型 A (pure_defense)：原地完整展現三層護盾／光環，絕不衝向木頭人！
      return;
    }

    if (spec.style === 'proj' && spec.proj) {
      const count = spec.multiProj || 3;
      for (let i = 0; i < count; i++) {
        const tgt = this.targets[i % this.targets.length];
        this.projs.push({
          url: `./assets/fx/${spec.proj}.webp`,
          sx: this.heroBaseX + 34,
          sy: this.heroBaseY - 30 + (i - (count - 1) / 2) * 10,
          tx: tgt.x + (Math.random() - 0.5) * 10,
          ty: tgt.y - 22 + (Math.random() - 0.5) * 10,
          trailColor: spec.trail || cfg.color,
          bornAt: now + i * 65,
          dur: 210,
          scale: 0.28,
        });
      }
      this._impactTimer = setTimeout(() => {
        this._impactTimer = null;
        if (this.rafId) triggerImpact(performance.now(), !!spec.seq);
      }, 200);
    } else if (spec.style === 'dash') {
      this._impactTimer = setTimeout(() => {
        this._impactTimer = null;
        if (this.rafId) triggerImpact(performance.now(), true);
      }, 190);
    } else {
      triggerImpact(now + 45, true);
    }
  }

  _update(now) {
    if (now >= this.nextCastAt) {
      if (this.autoPlay) this.triggerSkill(this.skillIdx + 1);
      else this.triggerSkill(this.skillIdx);
    }
    if (now < this.dashUntil) {
      const dur = Math.max(1, this.dashUntil - this.dashStartAt);
      const p = Math.max(0, Math.min(1, (now - this.dashStartAt) / dur));
      const arc = Math.sin(p * Math.PI);
      this.heroX = this.heroBaseX + (this.dashTargetX - this.heroBaseX) * arc;
      this.heroY = this.heroBaseY + (this.dashTargetY - this.heroBaseY) * arc;
    } else {
      this.heroX = this.heroBaseX;
      this.heroY = this.heroBaseY;
    }
    this.decals = this.decals.filter((d) => now - d.bornAt < d.dur);
    this.seqAnims = this.seqAnims.filter((a) => ((now - a.bornAt) / 1000) * a.fps < 16);
    this.projs = this.projs.filter((p) => now - p.bornAt < p.dur);
    this.sparks = this.sparks.filter((sp) => now - sp.bornAt < sp.dur);
    this.summons = this.summons.filter((s) => now - s.bornAt < s.dur);
    for (const sm of this.summons) {
      // 平滑移動至攻擊位置
      sm.x += (sm.tx - sm.x) * 0.08;
      sm.y += (sm.ty - sm.y) * 0.08;
      if (now >= sm.nextAtkAt && now < sm.bornAt + sm.dur - 350) {
        sm.nextAtkAt = now + (sm.atkEveryMs || 900);
        sm.atkAnimUntil = now + 360;
        const tgt = this.targets[Math.floor(Math.random() * this.targets.length)];
        if (sm.conjProj) {
          this.projs.push({
            url: `./assets/fx/${sm.conjProj}.webp`,
            sx: sm.x + 16,
            sy: sm.y - 18,
            tx: tgt.x,
            ty: tgt.y - 18,
            trailColor: sm.trail || '#fde047',
            bornAt: now,
            dur: 210,
            scale: 0.26,
          });
        }
        this._spawnImpactSparks(tgt.x, tgt.y - 16, sm.trail || '#fde047', 8);
        tgt.wobbleUntil = now + 180;
        tgt.punchUntil = now + 110;
        const isCrit = Math.random() < 0.4;
        const dmg = Math.round((1250 + Math.random() * 950) * (isCrit ? 2.0 : 1.0));
        this.popups.push({
          x: tgt.x + (Math.random() - 0.5) * 24,
          y: tgt.y - 54,
          text: isCrit ? `${dmg.toLocaleString()}!` : dmg.toLocaleString(),
          color: isCrit ? '#fde047' : (sm.trail || '#ffffff'),
          size: isCrit ? 20 : 16,
          isCrit,
          bornAt: now + (sm.conjProj ? 180 : 30),
          dur: 820,
        });
      }
    }
    this.heroBuffs = this.heroBuffs.filter((b) => now - b.bornAt < b.dur);
    if (this.heroBuffs.length > 0 && Math.random() < 0.32) {
      const hb = this.heroBuffs[0];
      this.sparks.push({
        x: this.heroX + (Math.random() - 0.5) * 62,
        y: this.heroY - 8 - Math.random() * 24,
        vx: (Math.random() - 0.5) * 18,
        vy: -55 - Math.random() * 45,
        color: hb.color || '#fde047',
        size: 2.2 + Math.random() * 2.4,
        bornAt: now,
        dur: 680,
      });
    }
    this.popups = this.popups.filter((p) => now - p.bornAt < p.dur);
  }

  _render(now) {
    const ctx = this.ctx;
    if (!ctx || !this.canvas) return;
    const W = this.canvas.width, H = this.canvas.height;
    ctx.filter = 'none';
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, W, H);

    const bgRec = this._loadImg('./assets/bg/arena_training_v299.webp?v=299');
    if (bgRec.ready && bgRec.img.complete && bgRec.img.naturalWidth > 0) {
      ctx.drawImage(bgRec.img, 0, 0, W, H);
      const grad = ctx.createRadialGradient(W * 0.5, H * 0.52, W * 0.16, W * 0.5, H * 0.52, W * 0.64);
      grad.addColorStop(0, 'rgba(6,8,14,0.05)');
      grad.addColorStop(1, 'rgba(4,5,9,0.62)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.fillStyle = '#0d1018';
      ctx.fillRect(0, 0, W, H);
    }

    for (const d of this.decals) {
      const rec = this._loadImg(d.url);
      if (!rec.ready || !rec.img.complete || rec.img.naturalWidth <= 0) continue;
      const p = Math.max(0, (now - d.bornAt) / d.dur);
      const alpha = p > 0.55 ? Math.max(0, 1 - (p - 0.55) / 0.45) : 0.85;
      const dw = rec.img.width * d.scale;
      const dh = rec.img.height * d.scale * 0.62;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.drawImage(rec.img, d.x - dw / 2, d.y - dh / 2, dw, dh);
      ctx.restore();
    }

    for (const t of this.targets) {
      const rec = this._loadImg(`./assets/fx/${t.key}.webp?v=299`);
      if (!rec.ready || !rec.img.complete || rec.img.naturalWidth <= 0) continue;
      const punch = now < t.punchUntil ? 1.07 : 1.0;
      const dw = rec.img.width * t.scale * punch;
      const dh = rec.img.height * t.scale * (now < t.punchUntil ? 0.94 : 1.0);
      const wob = now < t.wobbleUntil ? Math.sin(now * 0.065) * 0.14 : 0;
      ctx.save();
      ctx.translate(t.x, t.y + 8);
      ctx.rotate(wob);
      ctx.drawImage(rec.img, -dw / 2, -dh + 6, dw, dh);
      ctx.restore();
    }

    if (this.summons.length > 0) {
      const sRec = this._loadAtlas('./assets/heroes/atlas_summons.png', './assets/heroes/atlas_summons.json');
      const hRecForClone = this._loadHeroAtlas(this.classId);
      const pfClone = HERO_PREFIX[this.classId] || 'wf';
      for (const sm of this.summons) {
        const lifeP = (now - sm.bornAt) / sm.dur;
        const fadeAlpha = lifeP < 0.08 ? (lifeP / 0.08) : (lifeP > 0.86 ? Math.max(0, (1 - lifeP) / 0.14) : 1.0);
        const bob = Math.sin(now * 0.008 + sm.x) * 4;
        ctx.save();
        ctx.globalAlpha = fadeAlpha * (sm.summonType === 'clone' ? 0.72 : 1.0);
        if (sm.summonType === 'mage_conj' && sm.conjKey) {
          const cRec = this._loadImg(`./assets/fx/${sm.conjKey}.webp`);
          if (cRec.ready && cRec.img.complete && cRec.img.naturalWidth > 0) {
            const frame = Math.floor((now / 120) % 4);
            const fw = Math.floor(cRec.img.width / 2);
            const fh = Math.floor(cRec.img.height / 2);
            const col = frame % 2, row = Math.floor(frame / 2);
            const dw = 84, dh = 84;
            ctx.drawImage(cRec.img, col * fw, row * fh, fw, fh, sm.x - dw / 2, sm.y - dh + 16 + bob, dw, dh);
          }
        } else if (sm.summonType === 'clone' && hRecForClone.ready && hRecForClone.frames) {
          const srcImg = hRecForClone.cleanCanvas || hRecForClone.img;
          const fIdx = Math.floor((now / 105) % 4);
          const ck = now < (sm.atkAnimUntil || 0) ? `${pfClone}_right_atk_${fIdx}` : `${pfClone}_right_idle_${fIdx}`;
          const fr = hRecForClone.frames[ck]?.frame || hRecForClone.frames[`${pfClone}_right_walk_${fIdx}`]?.frame;
          if (fr && fr.w > 0 && fr.h > 0) {
            const sc = 92 / Math.max(40, fr.h);
            const dw = fr.w * sc, dh = fr.h * sc;
            ctx.drawImage(srcImg, fr.x, fr.y, fr.w, fr.h, sm.x - dw / 2, sm.y - dh + 10, dw, dh);
          }
        } else if (sRec.ready && sRec.frames && sRec.img.complete && sRec.img.naturalWidth > 0) {
          const fKeys = Object.keys(sRec.frames);
          const fIdx = Math.floor((now / 110) % 4);
          const pref = sm.kind === 'golem' ? 'golem' : (sm.kind === 'wraith' ? 'wraith' : 'skel');
          const key = [
            now < (sm.atkAnimUntil || 0) ? `${pref}_right_atk_${fIdx}` : `${pref}_right_walk_${fIdx}`,
            `${pref}_right_walk_${fIdx}`, `${pref}_walk_${fIdx}`,
            fKeys.find((k) => k.includes(pref)) || fKeys[0],
          ].find((k) => sRec.frames[k]);
          const fr = key ? sRec.frames[key].frame : null;
          if (fr && fr.w > 0 && fr.h > 0) {
            const sc = (sm.kind === 'golem' ? 92 : 70) / Math.max(32, fr.h);
            const dw = fr.w * sc, dh = fr.h * sc;
            ctx.drawImage(sRec.img, fr.x, fr.y, fr.w, fr.h, sm.x - dw / 2, sm.y - dh + 10, dw, dh);
          }
        }
        ctx.restore();
      }
    }

    // Layer A: 自身疊加底層・腳下 2.5D 透視旋轉符文環
    for (const hb of this.heroBuffs) {
      const p = (now - hb.bornAt) / hb.dur;
      const fade = p < 0.08 ? (p / 0.08) : (p > 0.86 ? Math.max(0, (1 - p) / 0.14) : 1.0);
      const pulse = 1 + Math.sin(now * 0.007) * 0.05;
      ctx.save();
      ctx.globalAlpha = fade * 0.62;
      ctx.translate(this.heroX, this.heroY + 4);
      ctx.scale(1.0 * pulse, 0.52 * pulse);
      ctx.strokeStyle = hb.color || '#fde047';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 56, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    const hRec = this._loadHeroAtlas(this.classId);
    const pf = HERO_PREFIX[this.classId] || 'wf';
    if (hRec.ready && hRec.frames && hRec.img.complete && hRec.img.naturalWidth > 0) {
      const isDash = now < this.dashUntil;
      const isCast = now < this.castAnimUntil;
      const fAtk = Math.floor((now / 105) % 4);
      const fWalk = Math.floor((now / 85) % 8);
      const fIdle = Math.floor((now / 180) % 4);

      const candidates = isCast
        ? [`${pf}_right_atk_${fAtk}`, `${pf}_right_walk_${fWalk % 4}`, `${pf}_right_idle_${fIdle}`]
        : (isDash
          ? [`${pf}_right_walk_${fWalk}`, `${pf}_right_walk_${fWalk % 4}`]
          : [`${pf}_right_idle_${fIdle}`, `${pf}_right_walk_${fIdle}`]);

      let fr = null;
      for (const ck of candidates) {
        if (hRec.frames[ck]?.frame) { fr = hRec.frames[ck].frame; break; }
      }
      if (!fr) {
        const keys = Object.keys(hRec.frames);
        const k = keys.find((x) => x.includes('right')) || keys[0];
        if (k) fr = hRec.frames[k].frame;
      }
      if (fr && fr.w > 0 && fr.h > 0) {
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.46)';
        ctx.beginPath();
        ctx.ellipse(this.heroX, this.heroY + 4, 24, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        const targetH = 104;
        const sc = targetH / Math.max(40, fr.h);
        const dw = fr.w * sc;
        const dh = fr.h * sc;
        ctx.drawImage(hRec.cleanCanvas || hRec.img, fr.x, fr.y, fr.w, fr.h, this.heroX - dw / 2, this.heroY - dh + 10, dw, dh);
        ctx.restore();
      }
    }

    // Layer B: 自身疊加中層・全新 2.5D 立體護盾／氣場貼圖（跟隨英雄身軀，零白塊）
    for (const hb of this.heroBuffs) {
      const rec = this._loadImg(hb.url);
      if (!rec.ready || !rec.img.complete || rec.img.naturalWidth <= 0) continue;
      const elapsed = now - hb.bornAt;
      const p = elapsed / hb.dur;
      const fade = p < 0.08 ? (p / 0.08) : (p > 0.86 ? Math.max(0, (1 - p) / 0.14) : 1.0);
      const popSc = elapsed < 240 ? (0.45 + (elapsed / 240) * 0.65) : (1.0 + Math.sin(now * 0.006) * 0.045);
      const rot = (now - hb.bornAt) * 0.00055;
      const size = 156 * popSc;
      ctx.save();
      ctx.globalAlpha = fade * 0.92;
      ctx.translate(this.heroX, this.heroY - 40);
      ctx.rotate(rot);
      ctx.drawImage(rec.img, -size / 2, -size / 2, size, size);
      ctx.restore();
    }

    for (const a of this.seqAnims) {
      const rec = this._loadImg(a.url);
      if (!rec.ready || !rec.img.complete || rec.img.naturalWidth <= 0) continue;
      const elapsed = Math.max(0, (now - a.bornAt) / 1000);
      const frame = Math.min(15, Math.floor(elapsed * a.fps));
      const fw = Math.floor(rec.img.width / 4);
      const fh = Math.floor(rec.img.height / 4);
      const col = frame % 4;
      const row = Math.floor(frame / 4);
      const inset = 2;
      const dw = (fw - inset * 2) * a.scale;
      const dh = (fh - inset * 2) * a.scale;
      ctx.drawImage(rec.img, col * fw + inset, row * fh + inset, fw - inset * 2, fh - inset * 2, a.x - dw / 2, a.y - dh / 2, dw, dh);
    }

    for (const p of this.projs) {
      if (now < p.bornAt) continue;
      const rec = this._loadImg(p.url);
      const prog = Math.min(1, (now - p.bornAt) / p.dur);
      const px = p.sx + (p.tx - p.sx) * prog;
      const py = p.sy + (p.ty - p.sy) * prog;
      const tailP = Math.max(0, prog - 0.34);
      const tx0 = p.sx + (p.tx - p.sx) * tailP;
      const ty0 = p.sy + (p.ty - p.sy) * tailP;

      ctx.save();
      const lg = ctx.createLinearGradient(tx0, ty0, px, py);
      lg.addColorStop(0, 'rgba(255,255,255,0)');
      lg.addColorStop(1, p.trailColor || '#4ade80');
      ctx.strokeStyle = lg;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tx0, ty0);
      ctx.lineTo(px, py);
      ctx.stroke();
      ctx.restore();

      if (rec.ready && rec.img.complete && rec.img.naturalWidth > 0) {
        const ang = Math.atan2(p.ty - p.sy, p.tx - p.sx);
        const dw = rec.img.width * p.scale;
        const dh = rec.img.height * p.scale;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(ang);
        ctx.drawImage(rec.img, -dw / 2, -dh / 2, dw, dh);
        ctx.restore();
      }
    }

    for (const sp of this.sparks) {
      const t = (now - sp.bornAt) / 1000;
      const p = (now - sp.bornAt) / sp.dur;
      const sx = sp.x + sp.vx * t;
      const sy = sp.y + sp.vy * t + 160 * t * t;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - p);
      ctx.fillStyle = sp.color;
      ctx.beginPath();
      ctx.arc(sx, sy, sp.size * (1 - p * 0.5), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    for (const pop of this.popups) {
      if (now < pop.bornAt) continue;
      const p = (now - pop.bornAt) / pop.dur;
      const py = pop.y - p * 40;
      const alpha = p > 0.62 ? Math.max(0, 1 - (p - 0.62) / 0.38) : 1;
      const sc = p < 0.16 ? (1.36 - (p / 0.16) * 0.36) : 1.0;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(pop.x, py);
      ctx.scale(sc, sc);
      ctx.font = `900 ${pop.size}px "Noto Sans TC", "Segoe UI", sans-serif`;
      ctx.textAlign = 'center';
      ctx.lineWidth = pop.isCrit ? 6 : 5;
      ctx.strokeStyle = '#000000';
      ctx.strokeText(pop.text, 0, 0);
      ctx.fillStyle = pop.color;
      ctx.fillText(pop.text, 0, 0);
      ctx.restore();
    }
  }
}
