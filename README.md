# 暗黑桌面掛機：深淵刷寶 ARPG（MVP 第一版）

## 專案結構
- `index.html` / `style.css`：電腦版雙欄介面（左側 Phaser 3 戰鬥舞台、右側裝備/背包/強化/日誌面板）
- `assets/heroes/`：狂戰士（`warrior.png`）、暗影遊俠（`ranger.png`）、秘法師（`mage.png`）透明去背精靈圖
- `assets/monsters/`：哥布林（`goblin.png`）、骸骨騎士（`skeleton.png`）、深淵魔王 BOSS（`boss_demon.png`）透明去背圖
- `src/data/`：職業、裝備詞條池、怪物與關卡波次資料
- `src/logic/`：裝備生成、屬性重算與本地存檔/離線收益
- `src/scenes/`：Phaser 3 戰鬥場景與掉寶光柱特效
- `src/ui/`：RPG 管理面板與職業選擇彈窗

## 部署與測試方式
1. 將資料夾內所有檔案覆蓋至 GitHub 儲存庫根目錄並推送，透過 GitHub Pages 網址即可直接遊玩。
2. 若在本地電腦測試，因使用了 ES Modules（`type="module"`），請在資料夾內執行 `python -m http.server 8080` 後以 `http://localhost:8080` 開啟（勿直接雙擊 `index.html`）。
