// v285: 第 7 章主城「翠玉樹冠水寨」— 三層建築重構（純淨底圖＋8棟專屬風格2.5D建築）
export const TOWN_CH7 = {
  "chapterIdx": 6,
  "id": "town_ch7",
  "name": "翠玉樹冠水寨",
  "subtitle": "第 7 章主城・沼澤高腳樹屋群島與木棧道水寨",
  "styleTag": "三層建築重構・左錨巨樹螺旋橋翡翠瀑",
  "mapWidth": 4096,
  "mapHeight": 2560,
  "bgKey": "town_bg_ch7_v296",
  "bgUrl": "./assets/bg/town_ch7.webp?v=296",
  "atlasKey": "town_atlas_ch7",
  "atlasPng": "./assets/towns/atlas_town_ch7.png",
  "atlasJson": "./assets/towns/atlas_town_ch7.json",
  "ambientColor": 4906624,
  "particleColor": 8843180,
  "spawn": {
    "x": 1620,
    "y": 1440
  },
  "walkableZones": [
    {
      "x1": 260,
      "y1": 260,
      "x2": 3880,
      "y2": 2380
    }
  ],
  "landmark": {
    "id": "emerald_waterfall",
    "name": "翡翠毒液瀑布池",
    "frame": "ch7_lm_waterfall",
    "x": 3080,
    "y": 2040,
    "scale": 0.64,
    "imgKey": "ch7_b_beacon_v296",
    "imgUrl": "./assets/towns/ch7_b_beacon.webp?v=296",
    "radius": 52,
    "action": "gimmick_emerald_waterfall",
    "tip": "共鳴翡翠毒液瀑布（5 分鐘 攻擊+25% / 攻速+25% / 掉寶+30%）"
  },
  "facilities": [
    {
      "id": "smith",
      "name": "巨龜甲殼煉鐵工作台",
      "frame": "ch7_bld_smith",
      "x": 720,
      "y": 1680,
      "scale": 0.82,
      "imgKey": "ch7_b_smith_v296",
      "imgUrl": "./assets/towns/ch7_b_smith.webp?v=296",
      "workStyle": "forge",
      "radius": 82,
      "npc": {
        "frame": "ch7_npc_smith",
        "name": "卡巴",
        "title": "沼澤甲殼匠",
        "x": 744,
        "y": 1754,
        "scale": 0.62,
        "workStyle": "forge",
        "greeting": "用沼澤巨龜甲殼跟毒牙淬鍊出來的護甲，連腐蝕酸液都咬不穿！"
      },
      "action": "drawer_upgrade",
      "actionLabel": "開啟甲殼鍛造",
      "doorOffset": {
        "x": 24,
        "y": 74
      }
    },
    {
      "id": "alchemy",
      "name": "劇毒草藥樹冠煉藥屋",
      "frame": "ch7_bld_alchemy",
      "x": 1680,
      "y": 940,
      "scale": 0.8,
      "imgKey": "ch7_b_alchemy_v296",
      "imgUrl": "./assets/towns/ch7_b_alchemy.webp?v=296",
      "workStyle": "alchemy",
      "radius": 82,
      "npc": {
        "frame": "ch7_npc_alchemy",
        "name": "薇拉莉",
        "title": "巫醫草藥師",
        "x": 1695,
        "y": 1014,
        "scale": 0.62,
        "workStyle": "alchemy",
        "greeting": "以毒攻毒才是沼澤的生存之道，來一瓶剛熬煮好的翡翠秘藥吧。"
      },
      "action": "modal_alchemy",
      "actionLabel": "調配劇毒藥劑",
      "doorOffset": {
        "x": 15,
        "y": 74
      }
    },
    {
      "id": "guild",
      "name": "高腳竹屋贓物倉庫",
      "frame": "ch7_bld_guild",
      "x": 3460,
      "y": 760,
      "scale": 0.82,
      "imgKey": "ch7_b_guild_v296",
      "imgUrl": "./assets/towns/ch7_b_guild.webp?v=296",
      "workStyle": "guild",
      "radius": 82,
      "npc": {
        "frame": "ch7_npc_guild",
        "name": "巴圖",
        "title": "水寨倉管長",
        "x": 3440,
        "y": 834,
        "scale": 0.62,
        "workStyle": "guild",
        "greeting": "東西全架在高腳竹屋上頭，沼澤水再怎麼漲也淹不到你的寶貝！"
      },
      "action": "drawer_bag",
      "actionLabel": "打開水寨倉庫",
      "doorOffset": {
        "x": -20,
        "y": 74
      }
    },
    {
      "id": "temple",
      "name": "毒藤狩獵訓練樹台",
      "frame": "ch7_bld_temple",
      "x": 2980,
      "y": 640,
      "scale": 0.8,
      "imgKey": "ch7_b_temple_v296",
      "imgUrl": "./assets/towns/ch7_b_temple.webp?v=296",
      "workStyle": "prayer",
      "radius": 82,
      "npc": {
        "frame": "ch7_npc_temple",
        "name": "佐拉",
        "title": "吹箭獵手教頭",
        "x": 2965,
        "y": 714,
        "scale": 0.62,
        "workStyle": "prayer",
        "greeting": "在沼澤裡出手一定要又快又準！快調整好技能去實戰試試吧！"
      },
      "action": "drawer_skills",
      "actionLabel": "配置職業技能",
      "doorOffset": {
        "x": -15,
        "y": 74
      }
    },
    {
      "id": "bounty",
      "name": "巫毒圖騰懸賞柱",
      "frame": "ch7_bld_bounty",
      "x": 1460,
      "y": 1160,
      "scale": 0.62,
      "imgKey": "ch7_b_bounty_v296",
      "imgUrl": "./assets/towns/ch7_b_bounty.webp?v=296",
      "workStyle": "bounty",
      "radius": 52,
      "npc": {
        "frame": "ch7_npc_bounty",
        "name": "莫格",
        "title": "毒沼賞金獵人",
        "x": 1472,
        "y": 1224,
        "scale": 0.62,
        "workStyle": "bounty",
        "greeting": "沼澤深處的多頭蛇九頭龍最近很不安分，替部族解決它們吧！"
      },
      "action": "modal_bounty",
      "actionLabel": "接取沼澤懸賞",
      "doorOffset": {
        "x": 12,
        "y": 64
      }
    },
    {
      "id": "market",
      "name": "水上竹筏黑市攤",
      "frame": "ch7_bld_market",
      "x": 1140,
      "y": 1440,
      "scale": 0.8,
      "imgKey": "ch7_b_market_v296",
      "imgUrl": "./assets/towns/ch7_b_market.webp?v=296",
      "workStyle": "market",
      "radius": 82,
      "npc": {
        "frame": "ch7_npc_market",
        "name": "斯萊",
        "title": "沼澤行商",
        "x": 1158,
        "y": 1514,
        "scale": 0.62,
        "workStyle": "market",
        "greeting": "嘶嘶……我用竹筏從沈船裡撈上來一堆寶箱，要賭一把手氣嗎？"
      },
      "action": "modal_market",
      "actionLabel": "進入竹筏黑市",
      "doorOffset": {
        "x": 18,
        "y": 74
      }
    },
    {
      "id": "altar",
      "name": "翡翠毒藤輪迴樹壇",
      "frame": "ch7_bld_altar",
      "x": 2760,
      "y": 1880,
      "scale": 0.72,
      "imgKey": "ch7_b_temple_v296",
      "imgUrl": "./assets/towns/ch7_b_temple.webp?v=296",
      "workStyle": "prayer",
      "radius": 82,
      "npc": {
        "frame": "ch7_npc_altar",
        "name": "納茲",
        "title": "樹語大薩滿",
        "x": 2775,
        "y": 1952,
        "scale": 0.62,
        "workStyle": "prayer",
        "greeting": "古樹根脈見證萬物枯榮，踏入翡翠法陣完成你的輪迴蛻變吧。"
      },
      "action": "drawer_rebirth",
      "actionLabel": "開啟樹壇輪迴",
      "doorOffset": {
        "x": 15,
        "y": 72
      }
    },
    {
      "id": "portal",
      "name": "發光蓮花木筏渡口",
      "frame": "ch7_bld_portal",
      "x": 640,
      "y": 2120,
      "scale": 0.62,
      "radius": 52,
      "npc": {
        "frame": "ch7_npc_portal",
        "name": "卡隆",
        "title": "渡口擺渡人",
        "x": 660,
        "y": 2188,
        "scale": 0.62,
        "greeting": "蓮花木筏已經靠岸，隨時都能載你直衝劇毒腐蝕沼澤前線！"
      },
      "action": "modal_portal",
      "actionLabel": "乘筏出征沼澤",
      "imgKey": "ch7_b_portal_v296",
      "imgUrl": "./assets/towns/ch7_b_portal.webp?v=296",
      "doorOffset": {
        "x": 20,
        "y": 68
      }
    }
  ],
  "extraNpcs": [
    {
      "id": "witchdoctor",
      "frame": "ch7_npc_witchdoctor",
      "name": "祖爾",
      "title": "沼澤巫醫長",
      "x": 1920,
      "y": 980,
      "scale": 0.64,
      "greeting": "歡迎來到翠玉樹冠水寨！收下這份部族的巫醫聖禮，願螢火蟲指引你的道路。",
      "action": "modal_witchdoctor",
      "actionLabel": "領取巫醫長贈禮"
    },
    {
      "id": "voodoo_horn",
      "frame": "ch7_prop_horn",
      "name": "沼澤巫毒號角柱",
      "title": "部族機關",
      "x": 980,
      "y": 1640,
      "scale": 0.74,
      "greeting": "吹響沼澤巫毒號角招來治癒螢火蟲群，瞬間回復全部生命與能量！",
      "action": "gimmick_voodoo_horn",
      "actionLabel": "吹響號角（回滿狀態）"
    }
  ],
  "trainingDummy": {
    "id": "dummy",
    "name": "藤蔓稻草巫毒靶",
    "frame": "ch7_prop_dummy",
    "x": 3460,
    "y": 960,
    "scale": 0.72,
    "radius": 42
  },
  "neighborhood": [],
  "props": [],
  "patrols": [
    {
      "frame": "ch7_npc_guard",
      "name": "沼澤面具吹箭衛兵",
      "scale": 0.56,
      "speed": 74,
      "waypoints": [
        {
          "x": 1040,
          "y": 1240
        },
        {
          "x": 1820,
          "y": 1380
        },
        {
          "x": 2540,
          "y": 1320
        },
        {
          "x": 2140,
          "y": 760
        },
        {
          "x": 1420,
          "y": 920
        }
      ]
    },
    {
      "frame": "ch7_npc_fisher",
      "name": "沼澤採藥村民",
      "scale": 0.54,
      "speed": 62,
      "waypoints": [
        {
          "x": 1040,
          "y": 2040
        },
        {
          "x": 1960,
          "y": 2100
        },
        {
          "x": 2680,
          "y": 1760
        },
        {
          "x": 3220,
          "y": 1920
        }
      ]
    },
    {
      "frame": "ch7_npc_fisher",
      "name": "東島採藥師",
      "scale": 0.54,
      "speed": 62,
      "waypoints": [
        {
          "x": 2580,
          "y": 1380
        },
        {
          "x": 2860,
          "y": 1560
        },
        {
          "x": 2720,
          "y": 1820
        },
        {
          "x": 2440,
          "y": 1620
        }
      ]
    }
  ],
  "integratedBuildings": false,
  "modularBuildings": true,
  "portal": {
    "x": 640,
    "y": 2120,
    "imgKey": "ch7_b_portal_v296",
    "imgUrl": "./assets/towns/ch7_b_portal.webp?v=296",
    "scale": 0.62,
    "name": "出城戰鬥傳送門",
    "action": "exit_battle"
  }
};
