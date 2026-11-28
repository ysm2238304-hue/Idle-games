// v317: 主城 NPC 朝向共用規則
// 預設假設 NPC 圖「原本朝右」：往左走就水平翻轉。
// 若某個 NPC 的原圖明顯朝左，把它的圖集前綴（例如 'ch2_npc_guard'）加進下表並設為 'left'，
// 翻轉規則會自動反向，不需要改其他程式。
export const NPC_NATIVE_FACING = {
  // 'ch2_npc_guard': 'left',
};

// wantLeft = true 表示希望角色看起來朝左。回傳 setFlipX 該傳的值。
export function npcFlipX(frame, wantLeft) {
  return NPC_NATIVE_FACING[frame] === 'left' ? !wantLeft : !!wantLeft;
}
