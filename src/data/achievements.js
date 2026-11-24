// 24 項分階段成就里程碑與專屬稱號系統 (v97)
import { getPetCodexInfo } from './pets.js?v=99';

export const ACHIEVEMENTS = [
  // === 狩獵征途 (6) ===
  { id: 'kill_50',    cat: '狩獵征途', name: '初入深淵',     desc: '累計擊殺 50 隻怪物',          goal: 50,   val: (s) => s.kills || 0, reward: { dust: 60, crystals: 1, title: '深淵新手' } },
  { id: 'kill_300',   cat: '狩獵征途', name: '暗夜獵手',     desc: '累計擊殺 300 隻怪物',         goal: 300,  val: (s) => s.kills || 0, reward: { dust: 150, crystals: 2, protectStones: 1 } },
  { id: 'kill_1000',  cat: '狩獵征途', name: '千人斬魔煞',   desc: '累計擊殺 1,000 隻怪物',       goal: 1000, val: (s) => s.kills || 0, reward: { dust: 350, crystals: 4, protectStones: 2, title: '千斬煞星' } },
  { id: 'kill_5000',  cat: '狩獵征途', name: '深淵收割者',   desc: '累計擊殺 5,000 隻怪物',       goal: 5000, val: (s) => s.kills || 0, reward: { dust: 800, crystals: 8, protectStones: 4, title: '深淵收割者' } },
  { id: 'boss_5',     cat: '狩獵征途', name: '首領討伐者',   desc: '累計擊破 5 隻首領',           goal: 5,    val: (s) => s.bountyProgress?.bossKills || 0, reward: { crystals: 2, petEssence: 20 } },
  { id: 'boss_25',    cat: '狩獵征途', name: '屠龍裁決官',   desc: '累計擊破 25 隻首領',          goal: 25,   val: (s) => s.bountyProgress?.bossKills || 0, reward: { crystals: 6, protectStones: 3, title: '首領終結者' } },

  // === 神裝鍛造 (6) ===
  { id: 'enh_5',      cat: '神裝鍛造', name: '千錘百鍊',     desc: '任意裝備強化達 +5',           goal: 5,    val: (s) => maxEquipLv(s), reward: { dust: 120, protectStones: 1 } },
  { id: 'enh_7',      cat: '神裝鍛造', name: '神匠之手',     desc: '任意裝備強化達 +7',           goal: 7,    val: (s) => maxEquipLv(s), reward: { dust: 260, protectStones: 2, crystals: 3 } },
  { id: 'enh_9',      cat: '神裝鍛造', name: '傳奇鍛造師',   desc: '任意裝備強化達 +9',           goal: 9,    val: (s) => maxEquipLv(s), reward: { dust: 500, protectStones: 4, crystals: 6, title: '神鍛宗師' } },
  { id: 'enh_10',     cat: '神裝鍛造', name: '太古神兵',     desc: '任意裝備強化達 +10 滿階',     goal: 10,   val: (s) => maxEquipLv(s), reward: { crystals: 15, protectStones: 5, title: '太古神兵主' } },
  { id: 'set_2',      cat: '神裝鍛造', name: '套裝共鳴',     desc: '同時穿戴 2 件綠色套裝裝備',   goal: 2,    val: (s) => countWornSet(s), reward: { dust: 200, crystals: 3 } },
  { id: 'set_4',      cat: '神裝鍛造', name: '完全體神裝',   desc: '同時穿戴 4 件綠色套裝裝備',   goal: 4,    val: (s) => countWornSet(s), reward: { crystals: 10, protectStones: 3, title: '翠綠神裝王' } },

  // === 靈獸收藏 (6) ===
  { id: 'pet_3',      cat: '靈獸收藏', name: '靈獸契約師',   desc: '圖鑑解鎖 3 隻不同寵物',       goal: 3,    val: (s) => getPetCodexInfo(s.pets, s.petCodex).count, reward: { petEssence: 25, crystals: 2 } },
  { id: 'pet_10',     cat: '靈獸收藏', name: '萬獸之友',     desc: '圖鑑解鎖 10 隻不同寵物',      goal: 10,   val: (s) => getPetCodexInfo(s.pets, s.petCodex).count, reward: { petEssence: 60, crystals: 5, title: '萬獸之友' } },
  { id: 'pet_20',     cat: '靈獸收藏', name: '深淵馴獸王',   desc: '圖鑑解鎖 20 隻不同寵物',      goal: 20,   val: (s) => getPetCodexInfo(s.pets, s.petCodex).count, reward: { petEssence: 120, crystals: 10, title: '深淵馴獸王' } },
  { id: 'pet_30',     cat: '靈獸收藏', name: '全靈獸制霸',   desc: '集齊全部 30 隻寵物圖鑑',      goal: 30,   val: (s) => getPetCodexInfo(s.pets, s.petCodex).count, reward: { crystals: 25, protectStones: 6, title: '創世靈獸皇' } },
  { id: 'pet_enh_6',  cat: '靈獸收藏', name: '覺醒靈獸',     desc: '任意寵物強化達 +6',           goal: 6,    val: (s) => maxPetLv(s), reward: { petEssence: 45, protectStones: 2 } },
  { id: 'pet_enh_10', cat: '靈獸收藏', name: '神話夥伴',     desc: '任意寵物強化達 +10 滿階',     goal: 10,   val: (s) => maxPetLv(s), reward: { petEssence: 150, crystals: 15, title: '神話馴獸師' } },

  // === 秘境遠征 (6) ===
  { id: 'st_10',      cat: '秘境遠征', name: '邊境征服者',   desc: '通關至第 10 關（第一章破關）', goal: 10,  val: (s) => s.maxStageReached || 1, reward: { crystals: 2, dust: 100 } },
  { id: 'st_30',      cat: '秘境遠征', name: '暗黑先鋒',     desc: '通關至第 30 關（第三章破關）', goal: 30,  val: (s) => s.maxStageReached || 1, reward: { crystals: 5, protectStones: 2, title: '暗黑先鋒' } },
  { id: 'st_60',      cat: '秘境遠征', name: '極光遠征軍',   desc: '通關至第 60 關（第六章破關）', goal: 60,  val: (s) => s.maxStageReached || 1, reward: { crystals: 10, protectStones: 3 } },
  { id: 'st_100',     cat: '秘境遠征', name: '深淵救世主',   desc: '通關全部 100 關',             goal: 100,  val: (s) => s.maxStageReached || 1, reward: { crystals: 30, protectStones: 6, title: '深淵救世主' } },
  { id: 'tw_5',       cat: '秘境遠征', name: '爬塔挑戰者',   desc: '無盡深淵塔突破第 5 層',       goal: 5,    val: (s) => s.maxTowerFloor || 0, reward: { crystals: 4, petEssence: 40, title: '深淵攀登者' } },
  { id: 'tw_15',      cat: '秘境遠征', name: '無盡霸主',     desc: '無盡深淵塔突破第 15 層',      goal: 15,   val: (s) => s.maxTowerFloor || 0, reward: { crystals: 15, protectStones: 5, title: '無盡塔霸主' } },
];

function maxEquipLv(s) {
  let mx = 0;
  for (const it of Object.values(s.equipment || {})) if (it) mx = Math.max(mx, it.upgradeLevel || 0);
  for (const it of (s.inventory || [])) if (it) mx = Math.max(mx, it.upgradeLevel || 0);
  return mx;
}

function countWornSet(s) {
  let c = 0;
  for (const it of Object.values(s.equipment || {})) if (it && it.rarity === 'set') c++;
  return c;
}

function maxPetLv(s) {
  let mx = 0;
  for (const p of (s.pets || [])) if (p) mx = Math.max(mx, p.upgradeLevel || 0);
  return mx;
}

export function getClaimableAchievementCount(state) {
  if (!state) return 0;
  const claimed = state.claimedAchievements || {};
  let cnt = 0;
  for (const a of ACHIEVEMENTS) {
    if (!claimed[a.id] && a.val(state) >= a.goal) cnt++;
  }
  return cnt;
}
