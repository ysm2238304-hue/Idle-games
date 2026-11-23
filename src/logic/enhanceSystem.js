// 裝備與寵物統一 +10 強化系統 (v86)
// 成功率：+1~+5 (100%)、+6 (40%)、+7 (30%)、+8 (20%)、+9 (10%)、+10 (1%)
export const ENHANCE_RATES = [100, 100, 100, 100, 100, 40, 30, 20, 10, 1];
export const MAX_ENHANCE_LEVEL = 10;

export function getEnhanceRate(currentLv = 0) {
  if (currentLv >= MAX_ENHANCE_LEVEL) return 0;
  return ENHANCE_RATES[Math.max(0, currentLv)] ?? 1;
}

export function getEquipEnhanceCost(item) {
  const lv = item?.upgradeLevel || 0;
  const gold = Math.round(180 * Math.pow(1.55, lv) + (item?.level || 1) * 25);
  const dust = lv >= 5 ? Math.round(12 * Math.pow(1.45, lv - 4)) : 0;
  return { gold, dust };
}

export function getPetEnhanceCost(pet) {
  const lv = pet?.upgradeLevel || 0;
  const rarMult = { common: 1, magic: 1.2, rare: 1.5, legendary: 1.9, set: 2.3 }[pet?.rarity] || 1;
  const gold = Math.round(250 * Math.pow(1.5, lv) * rarMult);
  const essence = Math.round(4 + lv * 3 * rarMult);
  return { gold, essence };
}

export function rollEnhance(entity, useProtectStone, gameState) {
  const lv = entity.upgradeLevel || 0;
  if (lv >= MAX_ENHANCE_LEVEL) return { maxed: true };
  const rate = getEnhanceRate(lv);
  let protectedUsed = false;
  if (lv >= 5 && useProtectStone && (gameState.protectStones || 0) > 0) {
    gameState.protectStones -= 1;
    protectedUsed = true;
  }
  const ok = Math.random() * 100 < rate;
  if (ok) {
    entity.upgradeLevel = lv + 1;
    return { ok: true, prevLv: lv, newLv: entity.upgradeLevel, rate, protectedUsed, demoted: false };
  }
  let demoted = false;
  if (lv >= 6 && !protectedUsed && Math.random() < 0.5) {
    entity.upgradeLevel = Math.max(5, lv - 1);
    demoted = true;
  }
  return { ok: false, prevLv: lv, newLv: entity.upgradeLevel || 0, rate, protectedUsed, demoted };
}
