// v285: 第 5 章主城「緋紅魔獄王庭」— 三層建築重構（純淨底圖＋8棟專屬風格2.5D建築）
export const TOWN_CH5 = {
  "chapterIdx": 4,
  "id": "town_ch5",
  "name": "緋紅魔獄王庭",
  "subtitle": "第 5 章主城・巴洛克惡魔血宮三層皇庭",
  "styleTag": "三層建築重構・斜向緋紅長廊鎖鏈懸崖",
  "mapWidth": 4096,
  "mapHeight": 2560,
  "bgKey": "town_bg_ch5_v296",
  "bgUrl": "./assets/bg/town_ch5.webp?v=296",
  "atlasKey": "town_atlas_ch5",
  "atlasPng": "./assets/towns/atlas_town_ch5.png",
  "atlasJson": "./assets/towns/atlas_town_ch5.json",
  "ambientColor": 15235577,
  "particleColor": 16007006,
  "spawn": {
    "x": 1920,
    "y": 1360
  },
  "walkableZones": [
    {
      "x1": 260,
      "y1": 280,
      "x2": 3880,
      "y2": 2380
    }
  ],
  "landmark": {
    "id": "abyss_sigil",
    "name": "深淵召喚巨陣",
    "frame": "ch5_lm_sigil",
    "x": 2340,
    "y": 1060,
    "scale": 0.84,
    "imgKey": "ch5_b_beacon_v296",
    "imgUrl": "./assets/towns/ch5_b_beacon.webp?v=296",
    "radius": 65,
    "action": "gimmick_abyss_sigil",
    "tip": "啟動深淵召喚巨陣（5 分鐘 攻擊+30% / 爆傷+20% / 掉寶+25%）"
  },
  "facilities": [
    {
      "id": "smith",
      "name": "血魔骨鑄鍛造殿",
      "frame": "ch5_bld_smith",
      "x": 1240,
      "y": 680,
      "scale": 1.08,
      "imgKey": "ch5_b_smith_v296",
      "imgUrl": "./assets/towns/ch5_b_smith.webp?v=296",
      "workStyle": "forge",
      "radius": 102,
      "npc": {
        "frame": "ch5_npc_smith",
        "name": "瑪門",
        "title": "血焰魔匠",
        "x": 1264,
        "y": 754,
        "scale": 0.62,
        "workStyle": "forge",
        "greeting": "以魔王之骨與紫獄冥火鍛出的神兵，連聖殿天使都會畏懼三分！"
      },
      "action": "drawer_upgrade",
      "actionLabel": "開啟魔火鍛造",
      "doorOffset": {
        "x": 24,
        "y": 87
      }
    },
    {
      "id": "alchemy",
      "name": "魅魔猩紅魔藥沙龍",
      "frame": "ch5_bld_alchemy",
      "x": 2060,
      "y": 420,
      "scale": 1.03,
      "imgKey": "ch5_b_alchemy_v296",
      "imgUrl": "./assets/towns/ch5_b_alchemy.webp?v=296",
      "workStyle": "alchemy",
      "radius": 102,
      "npc": {
        "frame": "ch5_npc_alchemy",
        "name": "莉莉絲",
        "title": "猩紅魅魔調劑師",
        "x": 2075,
        "y": 494,
        "scale": 0.62,
        "workStyle": "alchemy",
        "greeting": "小可愛，進聖殿前先喝一口我親手調配的猩紅秘藥吧～"
      },
      "action": "modal_alchemy",
      "actionLabel": "調配猩紅魔藥",
      "doorOffset": {
        "x": 15,
        "y": 87
      }
    },
    {
      "id": "guild",
      "name": "深淵魔契珍寶庫",
      "frame": "ch5_bld_guild",
      "x": 3520,
      "y": 1120,
      "scale": 1.08,
      "imgKey": "ch5_b_guild_v296",
      "imgUrl": "./assets/towns/ch5_b_guild.webp?v=296",
      "workStyle": "guild",
      "radius": 102,
      "npc": {
        "frame": "ch5_npc_guild",
        "name": "貝利亞",
        "title": "魔契典獄官",
        "x": 3500,
        "y": 1194,
        "scale": 0.62,
        "workStyle": "guild",
        "greeting": "每一份戰利品都受黃金鎖鏈封印保護，隨時清點你的庫存。"
      },
      "action": "drawer_bag",
      "actionLabel": "打開珍寶背包",
      "doorOffset": {
        "x": -20,
        "y": 87
      }
    },
    {
      "id": "temple",
      "name": "角魔血鬥演武場",
      "frame": "ch5_bld_temple",
      "x": 2960,
      "y": 560,
      "scale": 1.08,
      "imgKey": "ch5_b_temple_v296",
      "imgUrl": "./assets/towns/ch5_b_temple.webp?v=296",
      "workStyle": "prayer",
      "radius": 102,
      "npc": {
        "frame": "ch5_npc_temple",
        "name": "巴爾",
        "title": "深淵角魔統帥",
        "x": 2945,
        "y": 634,
        "scale": 0.62,
        "workStyle": "prayer",
        "greeting": "弱者在王庭連一秒都活不下來！調整好你的技能連段再上吧！"
      },
      "action": "drawer_skills",
      "actionLabel": "配置職業技能",
      "doorOffset": {
        "x": -15,
        "y": 87
      }
    },
    {
      "id": "bounty",
      "name": "魔王通緝血契柱",
      "frame": "ch5_bld_bounty",
      "x": 1540,
      "y": 1620,
      "scale": 0.82,
      "imgKey": "ch5_b_bounty_v296",
      "imgUrl": "./assets/towns/ch5_b_bounty.webp?v=296",
      "workStyle": "bounty",
      "radius": 65,
      "npc": {
        "frame": "ch5_npc_bounty",
        "name": "凱恩",
        "title": "暗夜血獵手",
        "x": 1555,
        "y": 1684,
        "scale": 0.62,
        "workStyle": "bounty",
        "greeting": "聖殿深處的叛逆惡魔與深淵將軍正等著被獵殺，賞金豐厚得很。"
      },
      "action": "modal_bounty",
      "actionLabel": "接取血契懸賞",
      "doorOffset": {
        "x": 15,
        "y": 76
      }
    },
    {
      "id": "market",
      "name": "深淵黑市拍賣寶座",
      "frame": "ch5_bld_market",
      "x": 3140,
      "y": 1760,
      "scale": 1.08,
      "imgKey": "ch5_b_market_v296",
      "imgUrl": "./assets/towns/ch5_b_market.webp?v=296",
      "workStyle": "market",
      "radius": 102,
      "npc": {
        "frame": "ch5_npc_market",
        "name": "阿斯莫德",
        "title": "貪婪魔商",
        "x": 3120,
        "y": 1834,
        "scale": 0.62,
        "workStyle": "market",
        "greeting": "金幣堆得越高，我的盲盒裡開出的神話奇珍就越亮眼，來賭一把？"
      },
      "action": "modal_market",
      "actionLabel": "進入魔王黑市",
      "doorOffset": {
        "x": -20,
        "y": 87
      }
    },
    {
      "id": "altar",
      "name": "魔獄血祭輪迴巨陣",
      "frame": "ch5_bld_altar",
      "x": 2540,
      "y": 880,
      "scale": 0.95,
      "imgKey": "ch5_b_temple_v296",
      "imgUrl": "./assets/towns/ch5_b_temple.webp?v=296",
      "workStyle": "prayer",
      "radius": 102,
      "npc": {
        "frame": "ch5_npc_altar",
        "name": "馬拉基",
        "title": "深淵大祭司",
        "x": 2525,
        "y": 952,
        "scale": 0.62,
        "workStyle": "prayer",
        "greeting": "踏入五芒星血陣，獻祭過往的羈絆，換取超越凡俗的深淵轉生。"
      },
      "action": "drawer_rebirth",
      "actionLabel": "開啟血祭輪迴",
      "doorOffset": {
        "x": -15,
        "y": 85
      }
    },
    {
      "id": "portal",
      "name": "懸浮鎖鏈深淵裂隙門",
      "frame": "ch5_bld_portal",
      "x": 740,
      "y": 2120,
      "scale": 0.82,
      "radius": 65,
      "npc": {
        "frame": "ch5_npc_portal",
        "name": "阿撒茲勒",
        "title": "裂隙守衛長",
        "x": 760,
        "y": 2188,
        "scale": 0.62,
        "greeting": "穿過紫焰裂隙便是深淵魔王聖殿戰場，願血獄之力隨行。"
      },
      "action": "modal_portal",
      "actionLabel": "傳送出征聖殿",
      "imgKey": "ch5_b_portal_v296",
      "imgUrl": "./assets/towns/ch5_b_portal.webp?v=296",
      "doorOffset": {
        "x": 20,
        "y": 80
      }
    }
  ],
  "extraNpcs": [
    {
      "id": "contractor",
      "frame": "ch5_npc_contractor",
      "name": "墨菲斯托",
      "title": "墮落契約官",
      "x": 1760,
      "y": 1480,
      "scale": 0.64,
      "greeting": "與我簽下這份黃金魔契吧，這 10,000 金幣與秘藥算是王庭的誠意！",
      "action": "modal_contractor",
      "actionLabel": "簽訂王庭魔契（領補給）"
    },
    {
      "id": "blood_chalice",
      "frame": "ch5_prop_chalice",
      "name": "猩紅聖血聖杯座",
      "title": "王庭聖物",
      "x": 2760,
      "y": 760,
      "scale": 0.76,
      "greeting": "飲下聖杯中的不朽紅液，瞬間回復全部生命與能量！",
      "action": "gimmick_blood_chalice",
      "actionLabel": "飲用聖血聖杯（回滿狀態）"
    }
  ],
  "trainingDummy": {
    "id": "dummy",
    "name": "石像鬼魔鎧靶",
    "frame": "ch5_prop_dummy",
    "x": 3120,
    "y": 1940,
    "scale": 0.72,
    "radius": 42
  },
  "neighborhood": [],
  "props": [],
  "patrols": [
    {
      "frame": "ch5_npc_guard",
      "name": "緋紅王庭長戟衛兵",
      "scale": 0.56,
      "speed": 76,
      "waypoints": [
        {
          "x": 920,
          "y": 1980
        },
        {
          "x": 1680,
          "y": 1520
        },
        {
          "x": 2460,
          "y": 1020
        },
        {
          "x": 2840,
          "y": 780
        },
        {
          "x": 1980,
          "y": 1360
        }
      ]
    },
    {
      "frame": "ch5_npc_imp",
      "name": "信使小惡魔",
      "scale": 0.48,
      "speed": 88,
      "waypoints": [
        {
          "x": 3040,
          "y": 1920
        },
        {
          "x": 3380,
          "y": 1860
        },
        {
          "x": 3520,
          "y": 2080
        },
        {
          "x": 3180,
          "y": 2120
        }
      ]
    },
    {
      "frame": "ch5_npc_imp",
      "name": "王座傳令魔",
      "scale": 0.48,
      "speed": 84,
      "waypoints": [
        {
          "x": 1380,
          "y": 1680
        },
        {
          "x": 1840,
          "y": 1420
        },
        {
          "x": 2220,
          "y": 1180
        },
        {
          "x": 1740,
          "y": 1520
        }
      ]
    }
  ],
  "integratedBuildings": false,
  "modularBuildings": true,
  "portal": {
    "x": 740,
    "y": 2120,
    "imgKey": "ch5_b_portal_v296",
    "imgUrl": "./assets/towns/ch5_b_portal.webp?v=296",
    "scale": 0.82,
    "name": "出城戰鬥傳送門",
    "action": "exit_battle"
  }
};
