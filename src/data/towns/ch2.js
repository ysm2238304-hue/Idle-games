// v279: 第 2 章主城「幽暗菌林河港」— S 型地下螢光河與雙橋木棧道非對稱重構（4096x2560）
export const TOWN_CH2 = {
  "chapterIdx": 1,
  "id": "town_ch2",
  "name": "地下菌菇黑市",
  "subtitle": "第 2 章主城・地精蒸汽與深淵棧道",
  "styleTag": "S型地下螢光河・雙拱橋木棧道",
  "mapWidth": 4096,
  "mapHeight": 2560,
  "bgKey": "town_bg_ch2_v279",
  "bgUrl": "./assets/bg/town_ch2.webp?v=279",
  "atlasKey": "town_atlas_ch2",
  "atlasPng": "./assets/towns/atlas_town_ch2.png",
  "atlasJson": "./assets/towns/atlas_town_ch2.json",
  "ambientColor": 11032055,
  "particleColor": 3462041,
  "spawn": {
    "x": 2060,
    "y": 1180
  },
  "walkableZones": [
    {
      "x1": 320,
      "y1": 420,
      "x2": 3860,
      "y2": 2360
    }
  ],
  "landmark": {
    "id": "spore_fountain",
    "name": "螢光孢子噴泉",
    "frame": "ch2_lm_fountain",
    "x": 1680,
    "y": 950,
    "scale": 0.86,
    "imgKey": "ch2_lm_fountain_v268",
    "imgUrl": "./assets/towns/ch2_lm_fountain.webp?v=268",
    "radius": 105,
    "action": "gimmick_spore_fountain",
    "tip": "觸發螢光孢子噴泉（5 分鐘 攻速+20% / 爆擊+15% / 金幣+20%）"
  },
  "facilities": [
    {
      "id": "smith",
      "name": "地精蒸汽鍛造鍋爐",
      "frame": "ch2_bld_smith",
      "x": 560,
      "y": 1060,
      "scale": 0.98,
      "imgKey": "ch2_bld_smith_v268",
      "imgUrl": "./assets/towns/ch2_bld_smith.webp?v=268",
      "workStyle": "forge",
      "radius": 115,
      "npc": {
        "frame": "ch2_npc_smith",
        "name": "巴克",
        "title": "蒸汽鐵匠",
        "x": 800,
        "y": 1180,
        "scale": 0.62,
        "workStyle": "forge",
        "greeting": "加壓到三百磅的蒸汽鐵錘，敲出來的裝備絕對比地面上那群老古董更猛！"
      },
      "action": "drawer_upgrade",
      "actionLabel": "開啟蒸汽鍛造"
    },
    {
      "id": "guild",
      "name": "地精金庫與贓物倉庫",
      "frame": "ch2_bld_guild",
      "x": 3620,
      "y": 1060,
      "scale": 1.02,
      "imgKey": "ch2_bld_guild_v268",
      "imgUrl": "./assets/towns/ch2_bld_guild.webp?v=268",
      "workStyle": "guild",
      "radius": 112,
      "npc": {
        "frame": "ch2_npc_guild",
        "name": "葛林",
        "title": "金庫總管",
        "x": 3380,
        "y": 1180,
        "scale": 0.62,
        "workStyle": "guild",
        "greeting": "只要付得起保管費，整個地底最安全的大鐵門都為你的戰利品敞開。"
      },
      "action": "drawer_bag",
      "actionLabel": "打開金庫背包"
    },
    {
      "id": "bounty",
      "name": "洞窟懸賞石柱",
      "frame": "ch2_bld_bounty",
      "x": 1140,
      "y": 1520,
      "scale": 0.94,
      "imgKey": "ch2_bld_bounty_v268",
      "imgUrl": "./assets/towns/ch2_bld_bounty.webp?v=268",
      "workStyle": "bounty",
      "radius": 75,
      "npc": {
        "frame": "ch2_npc_bounty",
        "name": "維克斯",
        "title": "暗影通緝官",
        "x": 1320,
        "y": 1480,
        "scale": 0.62,
        "workStyle": "bounty",
        "greeting": "巢穴深處的巨蛛和薩滿最近很囂張，替我們清理乾淨就有賞金。"
      },
      "action": "modal_bounty",
      "actionLabel": "接取洞窟懸賞"
    },
    {
      "id": "market",
      "name": "哥布林黑市拍賣棚",
      "frame": "ch2_bld_market",
      "x": 1620,
      "y": 2020,
      "scale": 0.98,
      "imgKey": "ch2_bld_market_v268",
      "imgUrl": "./assets/towns/ch2_bld_market.webp?v=268",
      "workStyle": "market",
      "radius": 108,
      "npc": {
        "frame": "ch2_npc_market",
        "name": "金牙",
        "title": "黑市拍賣師",
        "x": 1760,
        "y": 1840,
        "scale": 0.62,
        "workStyle": "market",
        "greeting": "歡迎光臨地底最大拍賣場！今天算你八折優惠，要不要賭一把傳奇盲盒？"
      },
      "action": "modal_market",
      "actionLabel": "進入黑市（八折優惠）"
    },
    {
      "id": "altar",
      "name": "地下菌絲輪迴石陣",
      "frame": "ch2_bld_altar",
      "x": 1180,
      "y": 620,
      "scale": 0.98,
      "imgKey": "ch2_bld_altar_v268",
      "imgUrl": "./assets/towns/ch2_bld_altar.webp?v=268",
      "workStyle": "prayer",
      "radius": 102,
      "npc": {
        "frame": "ch2_npc_altar",
        "name": "烏爾",
        "title": "盲眼菌語先知",
        "x": 1360,
        "y": 780,
        "scale": 0.62,
        "workStyle": "prayer",
        "greeting": "地底菌絲連結萬物生死，在此輪迴將讓你的靈魂與孢子共生。"
      },
      "action": "drawer_rebirth",
      "actionLabel": "開啟菌絲輪迴"
    },
    {
      "id": "alchemy",
      "name": "螢光孢子煉金菇屋",
      "frame": "ch2_bld_alchemy",
      "x": 2740,
      "y": 680,
      "scale": 0.98,
      "imgKey": "ch2_bld_alchemy_v268",
      "imgUrl": "./assets/towns/ch2_bld_alchemy.webp?v=268",
      "workStyle": "alchemy",
      "radius": 115,
      "npc": {
        "frame": "ch2_npc_alchemy",
        "name": "莫拉",
        "title": "孢子調劑師",
        "x": 2640,
        "y": 920,
        "scale": 0.62,
        "workStyle": "alchemy",
        "greeting": "紫光蘑菇萃取的精華可比地面草藥強效多了，來一瓶嗎？"
      },
      "action": "modal_alchemy",
      "actionLabel": "調配孢子藥水"
    },
    {
      "id": "temple",
      "name": "地下角鬥士訓練坑",
      "frame": "ch2_bld_temple",
      "x": 3060,
      "y": 1820,
      "scale": 0.94,
      "imgKey": "ch2_bld_temple_v268",
      "imgUrl": "./assets/towns/ch2_bld_temple.webp?v=268",
      "workStyle": "prayer",
      "radius": 118,
      "npc": {
        "frame": "ch2_npc_temple",
        "name": "斯卡",
        "title": "獨眼角鬥教頭",
        "x": 2880,
        "y": 1680,
        "scale": 0.62,
        "workStyle": "prayer",
        "greeting": "在地底活下去靠的不是禮貌，是更狠的技能連招！去旁邊打打靶子熱身吧！"
      },
      "action": "drawer_skills",
      "actionLabel": "配置職業技能"
    },
    {
      "id": "portal",
      "name": "地下礦車軌道升降梯",
      "frame": "ch2_bld_portal",
      "x": 1040,
      "y": 2240,
      "scale": 0.92,
      "radius": 110,
      "npc": {
        "frame": "ch2_npc_portal",
        "name": "托比",
        "title": "礦車調度員",
        "x": 1220,
        "y": 2120,
        "scale": 0.62,
        "greeting": "軌道已上油、蒸汽已滿壓！隨時可以搭礦車直衝巢穴前線！"
      },
      "action": "modal_portal",
      "actionLabel": "搭乘礦車出征"
    }
  ],
  "extraNpcs": [
    {
      "id": "smuggler",
      "frame": "ch2_npc_smuggler",
      "name": "尼克",
      "title": "洞窟走私客",
      "x": 1560,
      "y": 1520,
      "scale": 0.62,
      "greeting": "噓……我剛從哥布林酋長金庫順手摸了一批貨，這份見面禮拿去用吧！",
      "action": "modal_smuggler",
      "actionLabel": "領取走私客見面禮"
    },
    {
      "id": "steam_valve",
      "frame": "ch2_prop_pipes",
      "name": "高壓蒸汽閥門",
      "title": "洞窟機關",
      "x": 2540,
      "y": 1520,
      "scale": 0.72,
      "greeting": "轉動生鏽的紅鐵閥門釋放地底高壓蒸汽！",
      "action": "gimmick_steam_valve",
      "actionLabel": "轉動蒸汽閥門（回滿能量）"
    }
  ],
  "trainingDummy": {
    "id": "dummy",
    "name": "地精鐵皮靶人",
    "frame": "ch2_prop_dummy",
    "x": 4301,
    "y": 1657,
    "scale": 0.72,
    "radius": 42
  },
  "neighborhood": [],
  "props": [],
  "patrols": [
    {
      "frame": "ch2_npc_guard",
      "name": "哥布林長矛衛兵",
      "scale": 0.56,
      "speed": 78,
      "waypoints": [
        {
          "x": 940,
          "y": 1220
        },
        {
          "x": 1660,
          "y": 920
        },
        {
          "x": 2520,
          "y": 980
        },
        {
          "x": 2140,
          "y": 1380
        },
        {
          "x": 1420,
          "y": 1760
        }
      ]
    },
    {
      "frame": "ch2_npc_miner",
      "name": "洞窟採礦工",
      "scale": 0.54,
      "speed": 65,
      "waypoints": [
        {
          "x": 2680,
          "y": 1120
        },
        {
          "x": 3320,
          "y": 1260
        },
        {
          "x": 3120,
          "y": 1780
        },
        {
          "x": 2760,
          "y": 1660
        }
      ]
    },
    {
      "frame": "ch2_npc_miner",
      "name": "東區運礦工",
      "scale": 0.54,
      "speed": 65,
      "waypoints": [
        {
          "x": 2999,
          "y": 1024
        },
        {
          "x": 2999,
          "y": 1792
        }
      ]
    }
  ]
};
