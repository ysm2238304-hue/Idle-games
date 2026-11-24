/**
 * integrate_v102.mjs
 * 在專案根目錄執行 `node integrate_v102.mjs`，即可自動將三批更新整合進 DashboardUI.js 與 index.html。
 */

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dashPath = path.join(root, 'src', 'ui', 'DashboardUI.js');
const htmlPath = path.join(root, 'index.html');

function patchDashboardUI() {
  if (!fs.existsSync(dashPath)) {
    throw new Error(`找不到 ${dashPath}，請確認是在專案根目錄執行。`);
  }
  let src = fs.readFileSync(dashPath, 'utf8');
  fs.writeFileSync(`${dashPath}.bak`, src, 'utf8');

  const importLine = `import { renderTownFacilityModal } from './NpcModalRenderer.js?v=102';`;
  if (/import\s*\{\s*renderTownFacilityModal\s*\}\s*from\s*['"]\.\/NpcModalRenderer\.js(?:\?v=\d+)?['"];?/.test(src)) {
    src = src.replace(
      /import\s*\{\s*renderTownFacilityModal\s*\}\s*from\s*['"]\.\/NpcModalRenderer\.js(?:\?v=\d+)?['"];?/,
      importLine
    );
  } else {
    src = `${importLine}\n${src}`;
  }

  const fnSignature = /openTownFacilityModal\s*\(\s*action\s*,\s*data\s*,\s*ctx\s*\)\s*\{/;
  const match = fnSignature.exec(src);
  if (!match) {
    throw new Error('在 DashboardUI.js 中找不到 openTownFacilityModal(action, data, ctx) {');
  }

  const startIdx = match.index;
  let braceIdx = src.indexOf('{', startIdx);
  let depth = 0;
  let endIdx = -1;
  for (let i = braceIdx; i < src.length; i++) {
    const ch = src[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        endIdx = i;
        break;
      }
    }
  }
  if (endIdx === -1) {
    throw new Error('無法正確匹配 openTownFacilityModal 的大括號範圍。');
  }

  const replacement = `openTownFacilityModal(action, data, ctx) {
    renderTownFacilityModal(this, action, data, ctx, {
      getChapterIdx,
      ZONE_POOLS,
      MONSTER_TEMPLATES,
    });
  }`;

  src = src.slice(0, startIdx) + replacement + src.slice(endIdx + 1);
  fs.writeFileSync(dashPath, src, 'utf8');
  console.log('[OK] 已更新 src/ui/DashboardUI.js（備份於 DashboardUI.js.bak）');
}

function patchIndexHtml() {
  if (!fs.existsSync(htmlPath)) {
    console.log('[SKIP] 找不到 index.html，略過樣式表預載入。');
    return;
  }
  let html = fs.readFileSync(htmlPath, 'utf8');
  fs.writeFileSync(`${htmlPath}.bak`, html, 'utf8');

  // 移除舊版 v100/v101/v102 連結避免重複
  html = html.replace(/\s*<link[^>]+href=["']\.\/src\/ui\/(?:npcModal|secondaryModals)\.css(?:\?v=\d+)?["'][^>]*\/?>/g, '');

  const cssTags = [
    `  <link rel="stylesheet" href="./src/ui/npcModal.css?v=102" />`,
    `  <link rel="stylesheet" href="./src/ui/secondaryModals.css?v=102" />`,
  ].join('\n');

  const styleRegex = /(<link[^>]+href=["']\.\/style\.css(?:\?v=\d+)?["'][^>]*\/?>)/i;
  if (styleRegex.test(html)) {
    html = html.replace(styleRegex, `$1\n${cssTags}`);
  } else {
    html = html.replace(/<\/head>/i, `${cssTags}\n</head>`);
  }

  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log('[OK] 已更新 index.html（備份於 index.html.bak）');
}

patchDashboardUI();
patchIndexHtml();
console.log('[DONE] v102 三批整合完成！');
