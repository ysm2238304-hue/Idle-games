// v284: 第 2 章主城「地下菌菇黑市」— 三層建築重構（純淨底圖＋8棟專屬風格2.5D建築）
export const TOWN_CH2 = {
  "chapterIdx": 1,
  "id": "town_ch2",
  "name": "地下菌菇黑市",
  "subtitle": "第 2 章主城・地精蒸汽與深淵棧道",
  "styleTag": "三層建築重構・S型地下螢光河雙拱橋",
  "mapWidth": 4096,
  "mapHeight": 2560,
  "bgKey": "town_bg_ch2_v284",
  "bgUrl": "./assets/bg/town_ch2.webp?v=284",
  "atlasKey": "town_atlas_ch2",
  "atlasPng": "./assets/towns/atlas_town_ch2.png",
  "atlasJson": "./assets/towns/atlas_town_ch2.json",
  "ambientColor": 11032055,
  "particleColor": 3462041,
  "spawn": {
    "x": 1520,
    "y": 1120
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
    "x": 1240,
    "y": 920,
    "scale": 0.62,
    "imgKey": "ch2_b_beacon_v284",
    "imgUrl": "./assets/towns/ch2_b_beacon.webp?v=284",
    "radius": 52,
    "action": "gimmick_spore_fountain",
    "tip": "觸發螢光孢子噴泉（5 分鐘 攻速+20% / 爆擊+15% / 金幣+20%）"
  },
  "facilities": [
    {
      "id": "smith",
      "name": "地精蒸汽鍛造鍋爐",
      "frame": "ch2_bld_smith",
      "x": 720,
      "y": 1020,
      "scale": 0.82,
      "imgKey": "ch2_b_smith_v284",
      "imgUrl": "./assets/towns/ch2_b_smith.webp?v=284",
      "workStyle": "forge",
      "radius": 82,
      "npc": {
        "frame": "ch2_npc_smith",
        "name": "巴克",
        "title": "蒸汽鐵匠",
        "x": 744,
        "y": 1092,
        "scale": 0.62,
        "workStyle": "forge",
        "greeting": "加壓到三百磅的蒸汽鐵錘，敲出來的裝備絕對比地面上那群老古董更猛！"
      },
      "action": "drawer_upgrade",
      "actionLabel": "開啟蒸汽鍛造",
      "doorOffset": {
        "x": 24,
        "y": 72
      }
    },
    {
      "id": "guild",
      "name": "地精金庫與贓物倉庫",
      "frame": "ch2_bld_guild",
      "x": 3340,
      "y": 1840,
      "scale": 0.84,
      "imgKey": "ch2_b_guild_v284",
      "imgUrl": "./assets/towns/ch2_b_guild.webp?v=284",
      "workStyle": "guild",
      "radius": 82,
      "npc": {
        "frame": "ch2_npc_guild",
        "name": "葛林",
        "title": "金庫總管",
        "x": 3320,
        "y": 1914,
        "scale": 0.62,
        "workStyle": "guild",
        "greeting": "只要付得起保管費，整個地底最安全的大鐵門都為你的戰利品敞開。"
      },
      "action": "drawer_bag",
      "actionLabel": "打開金庫背包",
      "doorOffset": {
        "x": -20,
        "y": 74
      }
    },
    {
      "id": "bounty",
      "name": "洞窟懸賞石柱",
      "frame": "ch2_bld_bounty",
      "x": 1140,
      "y": 1340,
      "scale": 0.64,
      "imgKey": "ch2_b_bounty_v284",
      "imgUrl": "./assets/towns/ch2_b_bounty.webp?v=284",
      "workStyle": "bounty",
      "radius": 52,
      "npc": {
        "frame": "ch2_npc_bounty",
        "name": "維克斯",
        "title": "暗影通緝官",
        "x": 1152,
        "y": 1404,
        "scale": 0.62,
        "workStyle": "bounty",
        "greeting": "巢穴深處的巨蛛和薩滿最近很囂張，替我們清理乾淨就有賞金。"
      },
      "action": "modal_bounty",
      "actionLabel": "接取洞窟懸賞",
      "doorOffset": {
        "x": 12,
        "y": 64
      }
    },
    {
      "id": "market",
      "name": "哥布林黑市拍賣棚",
      "frame": "ch2_bld_market",
      "x": 1420,
      "y": 1680,
      "scale": 0.82,
      "imgKey": "ch2_b_market_v284",
      "imgUrl": "./assets/towns/ch2_b_market.webp?v=284",
      "workStyle": "market",
      "radius": 82,
      "npc": {
        "frame": "ch2_npc_market",
        "name": "金牙",
        "title": "黑市拍賣師",
        "x": 1435,
        "y": 1754,
        "scale": 0.62,
        "workStyle": "market",
        "greeting": "歡迎光臨地底最大拍賣場！今天算你八折優惠，要不要賭一把傳奇盲盒？"
      },
      "action": "modal_market",
      "actionLabel": "進入黑市（八折優惠）",
      "doorOffset": {
        "x": 15,
        "y": 74
      }
    },
    {
      "id": "altar",
      "name": "地下菌絲輪迴石陣",
      "frame": "ch2_bld_altar",
      "x": 1080,
      "y": 720,
      "scale": 0.74,
      "imgKey": "ch2_b_temple_v284",
      "imgUrl": "./assets/towns/ch2_b_temple.webp?v=284",
      "workStyle": "prayer",
      "radius": 82,
      "npc": {
        "frame": "ch2_npc_altar",
        "name": "烏爾",
        "title": "盲眼菌語先知",
        "x": 1095,
        "y": 792,
        "scale": 0.62,
        "workStyle": "prayer",
        "greeting": "地底菌絲連結萬物生死，在此輪迴將讓你的靈魂與孢子共生。"
      },
      "action": "drawer_rebirth",
      "actionLabel": "開啟菌絲輪迴",
      "doorOffset": {
        "x": 15,
        "y": 72
      }
    },
    {
      "id": "alchemy",
      "name": "螢光孢子煉金菇屋",
      "frame": "ch2_bld_alchemy",
      "x": 3120,
      "y": 1040,
      "scale": 0.82,
      "imgKey": "ch2_b_alchemy_v284",
      "imgUrl": "./assets/towns/ch2_b_alchemy.webp?v=284",
      "workStyle": "alchemy",
      "radius": 82,
      "npc": {
        "frame": "ch2_npc_alchemy",
        "name": "莫拉",
        "title": "孢子調劑師",
        "x": 3100,
        "y": 1112,
        "scale": 0.62,
        "workStyle": "alchemy",
        "greeting": "紫光蘑菇萃取的精華可比地面草藥強效多了，來一瓶嗎？"
      },
      "action": "modal_alchemy",
      "actionLabel": "調配孢子藥水",
      "doorOffset": {
        "x": -20,
        "y": 72
      }
    },
    {
      "id": "temple",
      "name": "地下角鬥士訓練坑",
      "frame": "ch2_bld_temple",
      "x": 2720,
      "y": 1120,
      "scale": 0.82,
      "imgKey": "ch2_b_temple_v284",
      "imgUrl": "./assets/towns/ch2_b_temple.webp?v=284",
      "workStyle": "prayer",
      "radius": 82,
      "npc": {
        "frame": "ch2_npc_temple",
        "name": "斯卡",
        "title": "獨眼角鬥教頭",
        "x": 2720,
        "y": 1194,
        "scale": 0.62,
        "workStyle": "prayer",
        "greeting": "在地底活下去靠的不是禮貌，是更狠的技能連招！去旁邊打打靶子熱身吧！"
      },
      "action": "drawer_skills",
      "actionLabel": "配置職業技能",
      "doorOffset": {
        "x": 0,
        "y": 74
      }
    },
    {
      "id": "portal",
      "name": "地下礦車軌道升降梯",
      "frame": "ch2_bld_portal",
      "x": 940,
      "y": 2060,
      "scale": 0.62,
      "radius": 52,
      "npc": {
        "frame": "ch2_npc_portal",
        "name": "托比",
        "title": "礦車調度員",
        "x": 960,
        "y": 2128,
        "scale": 0.62,
        "greeting": "軌道已上油、蒸汽已滿壓！隨時可以搭礦車直衝巢穴前線！"
      },
      "action": "modal_portal",
      "actionLabel": "搭乘礦車出征",
      "imgKey": "ch2_b_portal_v284",
      "imgUrl": "./assets/towns/ch2_b_portal.webp?v=284",
      "doorOffset": {
        "x": 20,
        "y": 68
      }
    }
  ],
  "extraNpcs": [
    {
      "id": "smuggler",
      "frame": "ch2_npc_smuggler",
      "name": "尼克",
      "title": "洞窟走私客",
      "x": 1320,
      "y": 1940,
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
      "x": 920,
      "y": 1240,
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
    "x": 3520,
    "y": 1240,
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
          "y": 940
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
          "x": 2860,
          "y": 1520
        },
        {
          "x": 3240,
          "y": 1640
        },
        {
          "x": 3460,
          "y": 1980
        },
        {
          "x": 2980,
          "y": 1940
        }
      ]
    }
  ],
  "integratedBuildings": false,
  "modularBuildings": true,
  "portal": {
    "x": 940,
    "y": 2060,
    "imgKey": "ch2_b_portal_v284",
    "imgUrl": "./assets/towns/ch2_b_portal.webp?v=284",
    "scale": 0.62,
    "name": "出城戰鬥傳送門",
    "action": "exit_battle"
  }
};
