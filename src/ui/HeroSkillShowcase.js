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
      w_iron_skin:         { style: 'dash', seq: 'seq16_w_warcry',      decal: 'decal_w_rune',   scale: 1.24, trail: '#94a3b8' },
      warcry:              { style: 'dash', seq: 'seq16_w_warcry',      decal: 'decal_w_rune',   scale: 1.28, trail: '#f59e0b' },
      w_challenging_shout: { style: 'dash', seq: 'seq16_w_warcry',      decal: 'decal_w_rune',   scale: 1.28, trail: '#fb923c' },
      w_rallying_cry:      { style: 'dash', seq: 'seq16_w_warcry',      decal: 'decal_w_rune',   scale: 1.26, trail: '#fde047' },
      bloodcharge:         { style: 'dash', seq: 'seq16_w_earth_stomp', decal: 'decal_w_blood',  scale: 1.28, trail: '#ef4444' },
      earth_stomp:         { style: 'dash', seq: 'seq16_w_earth_stomp', decal: 'decal_w_crater', scale: 1.30, trail: '#f97316' },
      w_chain_grasp:       { style: 'proj', proj: 'proj_w_chain_hook',  decal: 'decal_w_crater', multiProj: 2, trail: '#94a3b8' },
      w_leap_slam:         { style: 'dash', seq: 'seq16_w_hammer_slam', decal: 'decal_w_crater', scale: 1.34, trail: '#f97316' },
      bladestorm:          { style: 'proj', proj: 'proj_w_flame_wave',  decal: 'decal_w_lava',   multiProj: 3, trail: '#f97316' },
      w_rupture_impale:    { style: 'dash', seq: 'seq16_w_rend_burst',  decal: 'decal_w_blood',  scale: 1.32, trail: '#ef4444' },
      volcano_totem:       { style: 'aoe',  seq: 'seq16_w_fissure',     decal: 'decal_w_lava',   scale: 1.34, trail: '#f97316' },
      w_seismic_fissure:   { style: 'aoe',  seq: 'seq16_w_fissure',     decal: 'decal_w_lava',   scale: 1.36, trail: '#f97316' },
      w_call_ancients:     { style: 'aoe',  seq: 'seq16_w_hammer_slam', decal: 'decal_w_rune',   scale: 1.36, trail: '#fde047' },
      w_wrath_berserker:   { style: 'dash', seq: 'seq16_w_maelstrom',   decal: 'decal_w_lava',   scale: 1.38, trail: '#ef4444' },
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
      r_shadow_imbue:  { style: 'proj', proj: 'proj_r_shadow_arrow',  decal: 'decal_r_shadow', seq: 'seq16_r_shadow_boom',  multiProj: 3, trail: '#a855f7', scale: 1.26 },
      shadowstep:      { style: 'dash', seq: 'seq16_r_smoke_bomb',    decal: 'decal_r_shadow', scale: 1.24, trail: '#a855f7' },
      windwalk:        { style: 'proj', proj: 'proj_r_emerald_arrow', decal: 'decal_r_arrows', multiProj: 3, trail: '#34d399', burstColor: '#6ee7b7' },
      shadow_clones:   { style: 'proj', proj: 'proj_r_shadow_arrow',  decal: 'decal_r_shadow', seq: 'seq16_r_shadow_boom',  multiProj: 4, trail: '#a855f7', scale: 1.28 },
      death_mark:      { style: 'aoe',  seq: 'seq16_r_void_rift',     decal: 'decal_r_shadow', scale: 1.32, trail: '#c084fc' },
      r_void_hunter:   { style: 'aoe',  seq: 'seq16_r_void_rift',     decal: 'decal_r_shadow', scale: 1.36, trail: '#a855f7' },
      r_death_trap:    { style: 'aoe',  seq: 'seq16_r_death_trap',    decal: 'decal_r_trap',   scale: 1.32, trail: '#f87171' },
      r_razor_snare:   { style: 'aoe',  seq: 'seq16_r_death_trap',    decal: 'decal_r_trap',   scale: 1.26, trail: '#f87171' },
      r_smoke_decoy:   { style: 'aoe',  seq: 'seq16_r_smoke_bomb',    decal: 'decal_r_shadow', scale: 1.26, trail: '#94a3b8' },
      r_dark_shroud:   { style: 'aoe',  seq: 'seq16_r_shadow_boom',   decal: 'decal_r_shadow', scale: 1.28, trail: '#a855f7' },
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
      m_flame_shield:     { style: 'dash', seq: 'seq16_m_fireball_blast', decal: 'decal_m_scorch', scale: 1.26, trail: '#fb923c' },
      m_ice_armor:        { style: 'dash', seq: 'seq16_m_frost_nova', decal: 'decal_m_frost',     scale: 1.26, trail: '#38bdf8' },
      m_arcane_blink:     { style: 'dash', seq: 'seq16_m_supernova',  decal: 'decal_m_void',      scale: 1.26, trail: '#c084fc' },
      frost_nova:         { style: 'dash', seq: 'seq16_m_frost_nova', decal: 'decal_m_frost',     scale: 1.34, trail: '#38bdf8' },
      m_flame_hydra:      { style: 'aoe',  seq: 'seq16_m_firewall',   decal: 'decal_m_scorch',    scale: 1.32, trail: '#f97316' },
      m_ice_blades:       { style: 'proj', proj: 'proj_m_ice_lance',  decal: 'decal_m_frost',     multiProj: 4, trail: '#38bdf8', burstColor: '#7dd3fc' },
      m_lightning_spear:  { style: 'aoe',  seq: 'seq16_m_lightning_strike', decal: 'decal_m_lightning', scale: 1.32, trail: '#facc15' },
      m_familiar:         { style: 'proj', proj: 'proj_m_fire_bolt',  decal: 'decal_m_void',      multiProj: 3, trail: '#c084fc', burstColor: '#e9d5ff' },
      meteor:             { style: 'aoe',  seq: 'seq16_m_meteor',     decal: 'decal_m_scorch',    scale: 1.40, trail: '#f97316' },
      m_firewall:         { style: 'aoe',  seq: 'seq16_m_firewall',   decal: 'decal_m_scorch',    scale: 1.34, trail: '#f97316' },
      m_blizzard_field:   { style: 'aoe',  seq: 'seq16_m_blizzard',   decal: 'decal_m_frost',     scale: 1.38, trail: '#38bdf8' },
      m_ball_lightning:   { style: 'aoe',  seq: 'seq16_m_ball_lightning', decal: 'decal_m_lightning', scale: 1.34, trail: '#facc15' },
      black_hole:         { style: 'aoe',  seq: 'seq16_m_supernova',  decal: 'decal_m_void',      scale: 1.38, trail: '#a855f7' },
      m_inferno:          { style: 'aoe',  seq: 'seq16_m_inferno',    decal: 'decal_m_scorch',    scale: 1.40, trail: '#f97316' },
      m_deep_freeze:      { style: 'aoe',  seq: 'seq16_m_blizzard',   decal: 'decal_m_frost',     scale: 1.38, trail: '#38bdf8' },
      m_unstable_currents:{ style: 'aoe',  seq: 'seq16_m_ball_lightning', decal: 'decal_m_lightning', scale: 1.38, trail: '#fde047' },
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
      holy_aegis:         { style: 'dash', seq: 'seq16_p_thorns_burst',   decal: 'decal_p_aegis_ring',   scale: 1.28, trail: '#fde047' },
      p_redemption_prayer:{ style: 'aoe',  seq: 'seq16_p_condemn_vortex', decal: 'decal_p_sanctuary',    scale: 1.30, trail: '#fde047' },
      shield_bash:        { style: 'dash', seq: 'seq16_p_shield_bash',    decal: 'decal_p_aegis_ring',   scale: 1.28, trail: '#fbbf24' },
      p_sanctuary_ward:   { style: 'aoe',  seq: 'seq16_p_thorns_burst',   decal: 'decal_p_sanctuary',    scale: 1.30, trail: '#fde047' },
      p_crusader_charge:  { style: 'dash', seq: 'seq16_p_shield_bash',    decal: 'decal_p_cross_crater', scale: 1.32, trail: '#fde047' },
      judgment:           { style: 'aoe',  seq: 'seq16_p_judgment_cross', decal: 'decal_p_cross_crater', scale: 1.36, trail: '#fde047' },
      p_condemn_pull:     { style: 'aoe',  seq: 'seq16_p_condemn_vortex', decal: 'decal_p_consecration', scale: 1.34, trail: '#fde047' },
      p_falling_sword:    { style: 'aoe',  seq: 'seq16_p_verdict_sword',  decal: 'decal_p_cross_crater', scale: 1.38, trail: '#fde047' },
      consecration:       { style: 'aoe',  seq: 'seq16_p_condemn_vortex', decal: 'decal_p_consecration', scale: 1.34, trail: '#fde047' },
      radiant_aura:       { style: 'aoe',  seq: 'seq16_p_divine_storm',   decal: 'decal_p_sanctuary',    scale: 1.30, trail: '#fde047' },
      p_thorns_aura:      { style: 'aoe',  seq: 'seq16_p_thorns_burst',   decal: 'decal_p_aegis_ring',   scale: 1.30, trail: '#fbbf24' },
      p_solar_beacon:     { style: 'aoe',  seq: 'seq16_p_heaven_pillar',  decal: 'decal_p_consecration', scale: 1.34, trail: '#fde047' },
      p_seraph_descent:   { style: 'aoe',  seq: 'seq16_p_heaven_pillar',  decal: 'decal_p_cross_crater', scale: 1.38, trail: '#fde047' },
      p_heavens_verdict:  { style: 'aoe',  seq: 'seq16_p_verdict_sword',  decal: 'decal_p_cross_crater', scale: 1.40, trail: '#fde047' },
      p_valkyrie_avatar:  { style: 'aoe',  seq: 'seq16_p_divine_storm',   decal: 'decal_p_sanctuary',    scale: 1.36, trail: '#fde047' },
      p_akarats_wrath:    { style: 'aoe',  seq: 'seq16_p_judgment_cross', decal: 'decal_p_cross_crater', scale: 1.38, trail: '#fde047' },
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
      n_blood_mist:      { style: 'dash',   seq: 'seq16_n_blood_surge', decal: 'decal_n_blood',  scale: 1.28, trail: '#ef4444' },
      n_bone_shield:     { style: 'aoe',    seq: 'seq16_n_bone_burst',  decal: 'decal_n_bone',   scale: 1.26, trail: '#cbd5e1' },
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
      smoke_veil:        { style: 'dash', seq: 'seq16_a_smoke_veil',   decal: 'decal_a_eclipse',     scale: 1.30, trail: '#94a3b8' },
      a_blood_cloak:     { style: 'dash', seq: 'seq16_a_eclipse',      decal: 'decal_a_blood_cross', scale: 1.30, trail: '#f43f5e' },
      venom_burst:       { style: 'aoe',  seq: 'seq16_a_venom_nova',   decal: 'decal_a_venom_pool',  scale: 1.34, trail: '#22c55e' },
      a_crimson_mist:    { style: 'aoe',  seq: 'seq16_a_venom_nova',   decal: 'decal_a_venom_pool',  scale: 1.32, trail: '#f43f5e' },
      a_garrote_bind:    { style: 'dash', seq: 'seq16_a_garrote',      decal: 'decal_a_blood_cross', scale: 1.30, trail: '#ef4444' },
      a_shadow_decoy_bomb:{ style: 'aoe', seq: 'seq16_a_smoke_veil',   decal: 'decal_a_eclipse',     scale: 1.32, trail: '#a855f7' },
      shadow_clones:     { style: 'dash', seq: 'seq16_a_reaper_dance', decal: 'decal_a_eclipse',     scale: 1.34, trail: '#c084fc' },
      a_death_lotus:     { style: 'aoe',  seq: 'seq16_a_reaper_dance', decal: 'decal_a_blood_cross', scale: 1.36, trail: '#f43f5e' },
      a_venom_imbue:     { style: 'dash', seq: 'seq16_a_venom_nova',   decal: 'decal_a_venom_pool',  scale: 1.28, trail: '#22c55e' },
      lethal_fangs:      { style: 'dash', seq: 'seq16_a_venom_nova',   decal: 'decal_a_venom_pool',  scale: 1.32, trail: '#22c55e' },
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
        rec.img.onload = () => { rec.ready = true; };
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
    const cfg = CLASS_V301_VFX[cid] || CLASS_V301_VFX.warrior;
    cfg.seqs.forEach((k) => this._loadImg(`./assets/fx/${k}.webp`));
    cfg.decals.forEach((k) => this._loadImg(`./assets/fx/${k}.webp`));
    cfg.projs.forEach((k) => this._loadImg(`./assets/fx/${k}.webp`));
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
    if (this._impactTimer) {
      clearTimeout(this._impactTimer);
      this._impactTimer = null;
    }
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
      const kind = spec.summonKind || 'skel';
      const cnt = kind === 'golem' ? 1 : 3;
      for (let i = 0; i < cnt; i++) {
        this.summons.push({
          kind,
          x: this.heroBaseX + 35 + i * 18,
          y: this.heroBaseY - 12 + (i - 1) * 28,
          tx: mainTgt.x - 42 + (i % 2) * 20,
          ty: mainTgt.y - 10 + (i - 1) * 22,
          bornAt: now,
          dur: 1700,
        });
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

    if (this._impactTimer) {
      clearTimeout(this._impactTimer);
      this._impactTimer = null;
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
      if (sRec.ready && sRec.frames && sRec.img.complete && sRec.img.naturalWidth > 0) {
        const fKeys = Object.keys(sRec.frames);
        for (const sm of this.summons) {
          const p = Math.min(1, (now - sm.bornAt) / 650);
          const sx = sm.x + (sm.tx - sm.x) * p;
          const sy = sm.y + (sm.ty - sm.y) * p;
          const fIdx = Math.floor((now / 110) % 4);
          const pref = sm.kind === 'golem' ? 'golem' : (sm.kind === 'wraith' ? 'wraith' : 'skel');
          const key = [`${pref}_right_atk_${fIdx}`, `${pref}_right_walk_${fIdx}`, `${pref}_walk_${fIdx}`, fKeys.find((k) => k.includes(pref)) || fKeys[0]].find((k) => sRec.frames[k]);
          const fr = key ? sRec.frames[key].frame : null;
          if (fr && fr.w > 0 && fr.h > 0) {
            const sc = (sm.kind === 'golem' ? 88 : 66) / Math.max(32, fr.h);
            const dw = fr.w * sc, dh = fr.h * sc;
            ctx.drawImage(sRec.img, fr.x, fr.y, fr.w, fr.h, sx - dw / 2, sy - dh + 8, dw, dh);
          }
        }
      }
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
        ctx.drawImage(hRec.img, fr.x, fr.y, fr.w, fr.h, this.heroX - dw / 2, this.heroY - dh + 10, dw, dh);
        ctx.restore();
      }
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
