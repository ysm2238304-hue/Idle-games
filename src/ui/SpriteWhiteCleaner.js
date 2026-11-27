/**
 * SpriteWhiteCleaner.js (v224)
 * 全域 Phaser 紋理白色破圖／封閉白塊／邊緣白暈淨化引擎
 * 涵蓋：10 章主城建築與 NPC、6 大職業英雄、召喚物、10 章怪物、30 隻寵物、地圖擺設、攻擊與技能特效
 */

let installed = false;

function classifyTexture(key) {
  if (!key || key.startsWith('__') || key === 'fx_glow') return 'skip';
  // v311: 新版離線精細去背資產（v299/v303/v305/v306/v307+）無白底，跳過 CPU 掃描避免掉幀與誤傷高光
  if (/_v(299|30[0-9]|31[0-9])/.test(key)) return 'skip';
  if (key.startsWith('town_bg_') || key.startsWith('map_zone_') || key.startsWith('worldmap')) return 'skip';
  if (key.startsWith('town_atlas_') || key.startsWith('obs_')) return 'building';
  if (
    key.startsWith('town_npc_atlas_') ||
    key.startsWith('atlas_warrior') || key.startsWith('atlas_ranger') ||
    key.startsWith('atlas_mage') || key.startsWith('atlas_paladin') ||
    key.startsWith('atlas_necro') || key.startsWith('atlas_assassin') ||
    key.startsWith('atlas_summons') || key.startsWith('atlas_ch') ||
    key === 'atlas_legacy' || key.startsWith('pet_')
  ) return 'actor';
  if (/^(sfx_|wfx_|rfx_|mfx_|pfx_|nfx_|afx_)/.test(key)) return 'fx';
  return 'skip';
}

function isNearWhite(r, g, b, minVal, maxSat) {
  if (r < minVal || g < minVal || b < minVal) return false;
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  return (mx - mn) <= maxSat;
}

// 針對單一影格矩形區域進行連通純白塊清除 + 邊緣去白暈
function cleanRect(data, imgW, rx, ry, rw, rh, mode) {
  if (rw <= 2 || rh <= 2) return false;
  let changed = false;

  const minVal = mode === 'building' ? 228 : (mode === 'actor' ? 236 : 242);
  const maxSat = mode === 'building' ? 22 : (mode === 'actor' ? 16 : 12);
  const minInteriorArea = mode === 'building' ? 14 : 18;

  const size = rw * rh;
  const visited = new Uint8Array(size);
  const q = new Int32Array(size);

  const idxOf = (lx, ly) => ((ry + ly) * imgW + (rx + lx)) * 4;

  // FX 模式：僅在四角存在不透明純白底時，從外圍做氾濫清除（保護內部發光核心）
  if (mode === 'fx') {
    const corners = [[0, 0], [rw - 1, 0], [0, rh - 1], [rw - 1, rh - 1]];
    let hasWhiteCorner = false;
    for (const [cx, cy] of corners) {
      const pi = idxOf(cx, cy);
      if (data[pi + 3] > 180 && isNearWhite(data[pi], data[pi + 1], data[pi + 2], 238, 16)) {
        hasWhiteCorner = true;
        break;
      }
    }
    if (!hasWhiteCorner) return false;
  }

  for (let ly = 0; ly < rh; ly++) {
    for (let lx = 0; lx < rw; lx++) {
      const cell = ly * rw + lx;
      if (visited[cell]) continue;
      const pi = idxOf(lx, ly);
      const a = data[pi + 3];
      if (a < 25 || !isNearWhite(data[pi], data[pi + 1], data[pi + 2], minVal, maxSat)) {
        visited[cell] = 1;
        continue;
      }

      // BFS 收集整個低飽和近白連通塊
      let head = 0, tail = 0;
      q[tail++] = cell;
      visited[cell] = 1;
      let touchesBorderOrAlpha = false;

      while (head < tail) {
        const cur = q[head++];
        const cx = cur % rw;
        const cy = (cur - cx) / rw;
        if (cx === 0 || cy === 0 || cx === rw - 1 || cy === rh - 1) touchesBorderOrAlpha = true;

        const nbrs = [
          cx > 0 ? cur - 1 : -1,
          cx < rw - 1 ? cur + 1 : -1,
          cy > 0 ? cur - rw : -1,
          cy < rh - 1 ? cur + rw : -1,
        ];
        for (let n = 0; n < 4; n++) {
          const nc = nbrs[n];
          if (nc < 0) continue;
          const nx = nc % rw;
          const ny = (nc - nx) / rw;
          const npi = idxOf(nx, ny);
          const na = data[npi + 3];
          if (na < 30) {
            touchesBorderOrAlpha = true;
            continue;
          }
          if (!visited[nc] && isNearWhite(data[npi], data[npi + 1], data[npi + 2], minVal - 6, maxSat + 4)) {
            visited[nc] = 1;
            q[tail++] = nc;
          }
        }
      }

      const shouldClear = mode === 'fx'
        ? touchesBorderOrAlpha
        : (touchesBorderOrAlpha || tail >= minInteriorArea);

      if (shouldClear) {
        for (let i = 0; i < tail; i++) {
          const c = q[i];
          const cx = c % rw;
          const cy = (c - cx) / rw;
          data[idxOf(cx, cy) + 3] = 0;
        }
        changed = true;
      }
    }
  }

  // 邊緣去白暈（Defringe）：柔化與透明像素相鄰的亮白／淺灰半透明毛邊
  if (mode === 'building' || mode === 'actor') {
    for (let ly = 1; ly < rh - 1; ly++) {
      for (let lx = 1; lx < rw - 1; lx++) {
        const pi = idxOf(lx, ly);
        const a = data[pi + 3];
        if (a === 0) continue;
        const r = data[pi], g = data[pi + 1], b = data[pi + 2];
        if (!isNearWhite(r, g, b, 195, 24)) continue;

        const adjZero =
          data[idxOf(lx - 1, ly) + 3] < 25 ||
          data[idxOf(lx + 1, ly) + 3] < 25 ||
          data[idxOf(lx, ly - 1) + 3] < 25 ||
          data[idxOf(lx, ly + 1) + 3] < 25;

        if (adjZero) {
          if (a < 215 || isNearWhite(r, g, b, 218, 20)) {
            data[pi + 3] = 0;
            changed = true;
          } else {
            // 壓暗極細白邊避免貼紙感
            data[pi] = Math.round(r * 0.45);
            data[pi + 1] = Math.round(g * 0.45);
            data[pi + 2] = Math.round(b * 0.45);
            data[pi + 3] = Math.round(a * 0.65);
            changed = true;
          }
        }
      }
    }
  }

  return changed;
}

export function cleanPhaserTextures(game) {
  if (!game?.textures?.list) return;
  const list = game.textures.list;
  for (const key of Object.keys(list)) {
    const tex = list[key];
    if (!tex || tex.__v224Cleaned) continue;
    const mode = classifyTexture(key);
    tex.__v224Cleaned = true;
    if (mode === 'skip') continue;

    try {
      const src = tex.source?.[0];
      const img = src?.image;
      if (!img) continue;
      const w = img.naturalWidth || img.width || 0;
      const h = img.naturalHeight || img.height || 0;
      if (w < 8 || h < 8 || w > 4096 || h > 4096) continue;

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;

      let anyChanged = false;
      const frameNames = tex.getFrameNames ? tex.getFrameNames(false) : [];
      if (frameNames.length > 0) {
        for (const fn of frameNames) {
          const fr = tex.frames[fn];
          if (!fr || fr.cutWidth <= 2 || fr.cutHeight <= 2) continue;
          if (cleanRect(data, w, fr.cutX, fr.cutY, fr.cutWidth, fr.cutHeight, mode)) {
            anyChanged = true;
          }
        }
      } else {
        anyChanged = cleanRect(data, w, 0, 0, w, h, mode);
      }

      if (anyChanged) {
        ctx.putImageData(imgData, 0, 0);
        src.image = canvas;
        src.isCanvas = true;
        src.update?.();
      }
    } catch {
      /* 略過跨域或尚未就緒紋理 */
    }
  }
}

export function initSpriteWhiteCleaner() {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  // 定期巡檢新動態載入的章節／職業／怪物圖集並執行一次性淨化
  setInterval(() => {
    const g = window.__idlePhaserGame;
    if (g) cleanPhaserTextures(g);
  }, 600);
}
