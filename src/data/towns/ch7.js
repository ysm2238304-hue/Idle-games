// v304-3: 第 7 章主城「翠玉樹冠水寨」— 全新開闊底圖＋建築／NPC／巡邏點重校
export const TOWN_CH7 = {
  "chapterIdx": 6,
  "id": "town_ch7",
  "name": "翠玉樹冠水寨",
  "subtitle": "第 7 章主城・沼澤高腳樹屋群島與木棧道水寨",
  "styleTag": "v304開闊四象限十字・翠玉巨木樹冠廣場",
  "mapWidth": 4096,
  "mapHeight": 2560,
  "bgKey": "town_bg_ch7_v304",
  "bgUrl": "./assets/bg/town_ch7.webp?v=304",
  "atlasKey": "town_atlas_ch7",
  "atlasPng": "./assets/towns/atlas_town_ch7.png",
  "atlasJson": "./assets/towns/atlas_town_ch7.json",
  "ambientColor": 4906624,
  "particleColor": 8843180,
  "spawn": {
    "x": 2048,
    "y": 1460
  },
  "walkableZones": [
    {
      "poly": [
        [
          1280,
          580
        ],
        [
          2820,
          580
        ],
        [
          3520,
          1240
        ],
        [
          3000,
          2200
        ],
        [
          1100,
          2200
        ],
        [
          580,
          1240
        ]
      ]
    }
  ],
  "landmark": {
    "id": "emerald_waterfall",
    "name": "翡翠毒液瀑布池",
    "frame": "ch7_lm_waterfall",
    "x": 2048,
    "y": 1080,
    "scale": 0.84,
    "imgKey": "ch7_b_beacon_v296",
    "imgUrl": "./assets/towns/ch7_b_beacon.webp?v=296",
    "radius": 65,
    "action": "gimmick_emerald_waterfall",
    "tip": "共鳴翡翠毒液瀑布（5 分鐘 攻擊+25% / 攻速+25% / 掉寶+30%）"
  },
  "facilities": [
    {
      "id": "smith",
      "name": "巨龜甲殼煉鐵工作台",
      "frame": "ch7_bld_smith",
      "x": 1380,
      "y": 880,
      "scale": 1.08,
      "imgKey": "ch7_b_smith_v296",
      "imgUrl": "./assets/towns/ch7_b_smith.webp?v=296",
      "workStyle": "forge",
      "radius": 102,
      "npc": {
        "frame": "ch7_npc_smith",
        "name": "卡巴",
        "title": "沼澤甲殼匠",
        "scale": 0.62,
        "workStyle": "forge",
        "greeting": "用沼澤巨龜甲殼跟毒牙淬鍊出來的護甲，連腐蝕酸液都咬不穿！"
      },
      "action": "drawer_upgrade",
      "actionLabel": "開啟甲殼鍛造",
      "doorOffset": {
        "x": 0,
        "y": 82
      }
    },
    {
      "id": "alchemy",
      "name": "劇毒草藥樹冠煉藥屋",
      "frame": "ch7_bld_alchemy",
      "x": 2680,
      "y": 880,
      "scale": 1.06,
      "imgKey": "ch7_b_alchemy_v296",
      "imgUrl": "./assets/towns/ch7_b_alchemy.webp?v=296",
      "workStyle": "alchemy",
      "radius": 102,
      "npc": {
        "frame": "ch7_npc_alchemy",
        "name": "薇拉莉",
        "title": "巫醫草藥師",
        "scale": 0.62,
        "workStyle": "alchemy",
        "greeting": "以毒攻毒才是沼澤的生存之道，來一瓶剛熬煮好的翡翠秘藥吧。"
      },
      "action": "modal_alchemy",
      "actionLabel": "調配劇毒藥劑",
      "doorOffset": {
        "x": 0,
        "y": 82
      }
    },
    {
      "id": "guild",
      "name": "高腳竹屋贓物倉庫",
      "frame": "ch7_bld_guild",
      "x": 3060,
      "y": 1220,
      "scale": 1.08,
      "imgKey": "ch7_b_guild_v296",
      "imgUrl": "./assets/towns/ch7_b_guild.webp?v=296",
      "workStyle": "guild",
      "radius": 102,
      "npc": {
        "frame": "ch7_npc_guild",
        "name": "巴圖",
        "title": "水寨倉管長",
        "scale": 0.62,
        "workStyle": "guild",
        "greeting": "東西全架在高腳竹屋上頭，沼澤水再怎麼漲也淹不到你的寶貝！"
      },
      "action": "drawer_bag",
      "actionLabel": "打開水寨倉庫",
      "doorOffset": {
        "x": 0,
        "y": 82
      }
    },
    {
      "id": "temple",
      "name": "毒藤狩獵訓練樹台",
      "frame": "ch7_bld_temple",
      "x": 2940,
      "y": 1600,
      "scale": 1.06,
      "imgKey": "ch7_b_temple_v296",
      "imgUrl": "./assets/towns/ch7_b_temple.webp?v=296",
      "workStyle": "prayer",
      "radius": 102,
      "npc": {
        "frame": "ch7_npc_temple",
        "name": "佐拉",
        "title": "吹箭獵手教頭",
        "scale": 0.62,
        "workStyle": "prayer",
        "greeting": "在沼澤裡出手一定要又快又準！快調整好技能去實戰試試吧！"
      },
      "action": "drawer_skills",
      "actionLabel": "配置職業技能",
      "doorOffset": {
        "x": 0,
        "y": 82
      }
    },
    {
      "id": "bounty",
      "name": "巫毒圖騰懸賞柱",
      "frame": "ch7_bld_bounty",
      "x": 980,
      "y": 1300,
      "scale": 0.82,
      "imgKey": "ch7_b_bounty_v296",
      "imgUrl": "./assets/towns/ch7_b_bounty.webp?v=296",
      "workStyle": "bounty",
      "radius": 65,
      "npc": {
        "frame": "ch7_npc_bounty",
        "name": "莫格",
        "title": "毒沼賞金獵人",
        "scale": 0.62,
        "workStyle": "bounty",
        "greeting": "沼澤深處的多頭蛇九頭龍最近很不安分，替部族解決它們吧！"
      },
      "action": "modal_bounty",
      "actionLabel": "接取沼澤懸賞",
      "doorOffset": {
        "x": 0,
        "y": 82
      }
    },
    {
      "id": "market",
      "name": "水上竹筏黑市攤",
      "frame": "ch7_bld_market",
      "x": 2680,
      "y": 1880,
      "scale": 1.06,
      "imgKey": "ch7_b_market_v296",
      "imgUrl": "./assets/towns/ch7_b_market.webp?v=296",
      "workStyle": "market",
      "radius": 102,
      "npc": {
        "frame": "ch7_npc_market",
        "name": "斯萊",
        "title": "沼澤行商",
        "scale": 0.62,
        "workStyle": "market",
        "greeting": "嘶嘶……我用竹筏從沈船裡撈上來一堆寶箱，要賭一把手氣嗎？"
      },
      "action": "modal_market",
      "actionLabel": "進入竹筏黑市",
      "doorOffset": {
        "x": 0,
        "y": 82
      }
    },
    {
      "id": "altar",
      "name": "翡翠毒藤輪迴樹壇",
      "frame": "ch7_bld_altar",
      "x": 1980,
      "y": 1940,
      "scale": 0.95,
      "imgKey": "ch7_b_temple_v296",
      "imgUrl": "./assets/towns/ch7_b_temple.webp?v=296",
      "workStyle": "prayer",
      "radius": 102,
      "npc": {
        "frame": "ch7_npc_altar",
        "name": "納茲",
        "title": "樹語大薩滿",
        "scale": 0.62,
        "workStyle": "prayer",
        "greeting": "古樹根脈見證萬物枯榮，踏入翡翠法陣完成你的輪迴蛻變吧。"
      },
      "action": "drawer_rebirth",
      "actionLabel": "開啟樹壇輪迴",
      "doorOffset": {
        "x": 0,
        "y": 82
      }
    },
    {
      "id": "portal",
      "name": "發光蓮花木筏渡口",
      "frame": "ch7_bld_portal",
      "x": 1320,
      "y": 1880,
      "scale": 0.82,
      "radius": 65,
      "npc": {
        "frame": "ch7_npc_portal",
        "name": "卡隆",
        "title": "渡口擺渡人",
        "scale": 0.62,
        "greeting": "蓮花木筏已經靠岸，隨時都能載你直衝劇毒腐蝕沼澤前線！"
      },
      "action": "modal_portal",
      "actionLabel": "乘筏出征沼澤",
      "imgKey": "ch7_b_portal_v296",
      "imgUrl": "./assets/towns/ch7_b_portal.webp?v=296",
      "doorOffset": {
        "x": 0,
        "y": 82
      }
    }
  ],
  "extraNpcs": [
    {
      "id": "witchdoctor",
      "frame": "ch7_npc_witchdoctor",
      "name": "祖爾",
      "title": "沼澤巫醫長",
      "x": 1620,
      "y": 1280,
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
      "x": 2420,
      "y": 1540,
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
    "x": 2640,
    "y": 1300,
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
          "x": 1420,
          "y": 1260
        },
        {
          "x": 2520,
          "y": 1260
        },
        {
          "x": 2520,
          "y": 1560
        },
        {
          "x": 1420,
          "y": 1560
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
          "x": 2048,
          "y": 780
        },
        {
          "x": 2048,
          "y": 1680
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
          "x": 1640,
          "y": 1060
        },
        {
          "x": 2440,
          "y": 1060
        },
        {
          "x": 2440,
          "y": 1640
        },
        {
          "x": 1640,
          "y": 1640
        }
      ]
    }
  ],
  "integratedBuildings": false,
  "modularBuildings": true,
  "portal": {
    "x": 1320,
    "y": 1880,
    "imgKey": "ch7_b_portal_v296",
    "imgUrl": "./assets/towns/ch7_b_portal.webp?v=296",
    "scale": 0.82,
    "name": "出城戰鬥傳送門",
    "action": "exit_battle"
  }
};
