// v285: 第 6 章主城「極光冰晶堡」— 三層建築重構（純淨底圖＋8棟專屬風格2.5D建築）
export const TOWN_CH6 = {
  "chapterIdx": 5,
  "id": "town_ch6",
  "name": "極光冰晶堡",
  "subtitle": "第 6 章主城・北歐維京長屋與同心圓冰雕堡壘",
  "styleTag": "三層建築重構・冰封峽灣維京長船雪村",
  "mapWidth": 4096,
  "mapHeight": 2560,
  "bgKey": "town_bg_ch6_v285",
  "bgUrl": "./assets/bg/town_ch6.webp?v=285",
  "atlasKey": "town_atlas_ch6",
  "atlasPng": "./assets/towns/atlas_town_ch6.png",
  "atlasJson": "./assets/towns/atlas_town_ch6.json",
  "ambientColor": 3718648,
  "particleColor": 14742270,
  "spawn": {
    "x": 2120,
    "y": 1240
  },
  "walkableZones": [
    {
      "x1": 340,
      "y1": 300,
      "x2": 3880,
      "y2": 2380
    }
  ],
  "landmark": {
    "id": "aurora_spire",
    "name": "永凍極光水晶塔",
    "frame": "ch6_lm_spire",
    "x": 2180,
    "y": 1020,
    "scale": 0.64,
    "imgKey": "ch6_b_beacon_v285",
    "imgUrl": "./assets/towns/ch6_b_beacon.webp?v=285",
    "radius": 52,
    "action": "gimmick_aurora_spire",
    "tip": "共鳴永凍極光水晶塔（5 分鐘 防禦+25% / 攻速+25% / 減傷+10%）"
  },
  "facilities": [
    {
      "id": "smith",
      "name": "永凍藍冰符文鍛造柱",
      "frame": "ch6_bld_smith",
      "x": 1740,
      "y": 1040,
      "scale": 0.82,
      "imgKey": "ch6_b_smith_v285",
      "imgUrl": "./assets/towns/ch6_b_smith.webp?v=285",
      "workStyle": "forge",
      "radius": 82,
      "npc": {
        "frame": "ch6_npc_smith",
        "name": "布羅恩",
        "title": "冰霜符文鐵匠",
        "x": 1760,
        "y": 1114,
        "scale": 0.62,
        "workStyle": "forge",
        "greeting": "極地永凍冰鐵比鋼鐵更堅硬，刻上北歐符文後連冰龍都能劈開！"
      },
      "action": "drawer_upgrade",
      "actionLabel": "開啟符文鍛造",
      "doorOffset": {
        "x": 20,
        "y": 74
      }
    },
    {
      "id": "alchemy",
      "name": "雪松草藥與冰晶蒸餾屋",
      "frame": "ch6_bld_alchemy",
      "x": 2060,
      "y": 440,
      "scale": 0.78,
      "imgKey": "ch6_b_alchemy_v285",
      "imgUrl": "./assets/towns/ch6_b_alchemy.webp?v=285",
      "workStyle": "alchemy",
      "radius": 82,
      "npc": {
        "frame": "ch6_npc_alchemy",
        "name": "芙蕾雅",
        "title": "雪域草藥師",
        "x": 2075,
        "y": 514,
        "scale": 0.62,
        "workStyle": "alchemy",
        "greeting": "喝下這瓶極光雪蓮暖身藥劑，暴風雪就再也凍傷不了你。"
      },
      "action": "modal_alchemy",
      "actionLabel": "調配冰晶藥劑",
      "doorOffset": {
        "x": 15,
        "y": 74
      }
    },
    {
      "id": "guild",
      "name": "維京毛皮與秘寶長屋",
      "frame": "ch6_bld_guild",
      "x": 3380,
      "y": 920,
      "scale": 0.82,
      "imgKey": "ch6_b_guild_v285",
      "imgUrl": "./assets/towns/ch6_b_guild.webp?v=285",
      "workStyle": "guild",
      "radius": 82,
      "npc": {
        "frame": "ch6_npc_guild",
        "name": "哈康",
        "title": "長屋大管家",
        "x": 3360,
        "y": 994,
        "scale": 0.62,
        "workStyle": "guild",
        "greeting": "所有戰利品與毛皮補給都妥善存放在龍首長屋裡，隨時取用！"
      },
      "action": "drawer_bag",
      "actionLabel": "打開長屋倉庫",
      "doorOffset": {
        "x": -20,
        "y": 74
      }
    },
    {
      "id": "temple",
      "name": "英靈殿狂戰訓練場",
      "frame": "ch6_bld_temple",
      "x": 2660,
      "y": 480,
      "scale": 0.8,
      "imgKey": "ch6_b_temple_v285",
      "imgUrl": "./assets/towns/ch6_b_temple.webp?v=285",
      "workStyle": "prayer",
      "radius": 82,
      "npc": {
        "frame": "ch6_npc_temple",
        "name": "布倫希爾",
        "title": "女武神教頭",
        "x": 2645,
        "y": 554,
        "scale": 0.62,
        "workStyle": "prayer",
        "greeting": "戰士！展現讓英靈殿都為之震顫的戰技吧，調整好天賦再出發！"
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
      "name": "北歐符文懸賞巨石",
      "frame": "ch6_bld_bounty",
      "x": 1620,
      "y": 440,
      "scale": 0.62,
      "imgKey": "ch6_b_bounty_v285",
      "imgUrl": "./assets/towns/ch6_b_bounty.webp?v=285",
      "workStyle": "bounty",
      "radius": 52,
      "npc": {
        "frame": "ch6_npc_bounty",
        "name": "芬里爾",
        "title": "雪原獵狼隊長",
        "x": 1630,
        "y": 504,
        "scale": 0.62,
        "workStyle": "bounty",
        "greeting": "雪原冰原狼與雪怪最近太囂張了，去獵殺它們領取北境賞金！"
      },
      "action": "modal_bounty",
      "actionLabel": "接取雪原懸賞",
      "doorOffset": {
        "x": 10,
        "y": 64
      }
    },
    {
      "id": "market",
      "name": "極地毛皮雪橇黑市",
      "frame": "ch6_bld_market",
      "x": 2620,
      "y": 1420,
      "scale": 0.82,
      "imgKey": "ch6_b_market_v285",
      "imgUrl": "./assets/towns/ch6_b_market.webp?v=285",
      "workStyle": "market",
      "radius": 82,
      "npc": {
        "frame": "ch6_npc_market",
        "name": "史文",
        "title": "極地行商",
        "x": 2600,
        "y": 1494,
        "scale": 0.62,
        "workStyle": "market",
        "greeting": "剛從冰川裂縫撈出來的稀有寶箱，附帶極光結晶，想賭一發嗎？"
      },
      "action": "modal_market",
      "actionLabel": "進入極地黑市",
      "doorOffset": {
        "x": -20,
        "y": 74
      }
    },
    {
      "id": "altar",
      "name": "極光世界樹輪迴聖壇",
      "frame": "ch6_bld_altar",
      "x": 3480,
      "y": 1480,
      "scale": 0.72,
      "imgKey": "ch6_b_temple_v285",
      "imgUrl": "./assets/towns/ch6_b_temple.webp?v=285",
      "workStyle": "prayer",
      "radius": 82,
      "npc": {
        "frame": "ch6_npc_altar",
        "name": "阿斯特麗",
        "title": "霜語薩滿",
        "x": 3465,
        "y": 1552,
        "scale": 0.62,
        "workStyle": "prayer",
        "greeting": "在世界樹枯根與極光的見證下，重塑你的魂魄迎向新生。"
      },
      "action": "drawer_rebirth",
      "actionLabel": "開啟世界樹輪迴",
      "doorOffset": {
        "x": -15,
        "y": 72
      }
    },
    {
      "id": "portal",
      "name": "北歐巨石陣傳送冰門",
      "frame": "ch6_bld_portal",
      "x": 1120,
      "y": 1640,
      "scale": 0.62,
      "radius": 52,
      "npc": {
        "frame": "ch6_npc_portal",
        "name": "海姆達爾",
        "title": "彩虹冰門守衛",
        "x": 1138,
        "y": 1708,
        "scale": 0.62,
        "greeting": "極光傳送門已對準永凍冰霜凍原深處，隨時準備出征！"
      },
      "action": "modal_portal",
      "actionLabel": "傳送出征凍原",
      "imgKey": "ch6_b_portal_v285",
      "imgUrl": "./assets/towns/ch6_b_portal.webp?v=285",
      "doorOffset": {
        "x": 18,
        "y": 68
      }
    }
  ],
  "extraNpcs": [
    {
      "id": "shaman",
      "frame": "ch6_npc_shaman",
      "name": "奧丁森",
      "title": "極地先知長老",
      "x": 2340,
      "y": 740,
      "scale": 0.64,
      "greeting": "遠道而來的勇者，極地的風雪考驗著每一位戰士，這份先知贈禮收下吧。",
      "action": "modal_shaman",
      "actionLabel": "領取極地先知贈禮"
    },
    {
      "id": "runic_brazier",
      "frame": "ch6_prop_brazier",
      "name": "北歐符文暖火盆",
      "title": "禦寒聖火",
      "x": 1380,
      "y": 980,
      "scale": 0.78,
      "greeting": "靠近符文暖火盆驅散寒霜，瞬間回復全部生命與能量！",
      "action": "gimmick_runic_brazier",
      "actionLabel": "烤火驅寒（回滿狀態）"
    }
  ],
  "trainingDummy": {
    "id": "dummy",
    "name": "冰霜巨人木偶靶",
    "frame": "ch6_prop_dummy",
    "x": 3520,
    "y": 1180,
    "scale": 0.72,
    "radius": 42
  },
  "neighborhood": [],
  "props": [],
  "patrols": [
    {
      "frame": "ch6_npc_guard",
      "name": "維京女武神盾衛",
      "scale": 0.56,
      "speed": 74,
      "waypoints": [
        {
          "x": 1220,
          "y": 720
        },
        {
          "x": 1960,
          "y": 760
        },
        {
          "x": 2860,
          "y": 880
        },
        {
          "x": 3320,
          "y": 1140
        },
        {
          "x": 2580,
          "y": 1040
        }
      ]
    },
    {
      "frame": "ch6_npc_hunter",
      "name": "雪原毛皮獵人",
      "scale": 0.55,
      "speed": 66,
      "waypoints": [
        {
          "x": 1520,
          "y": 1580
        },
        {
          "x": 2180,
          "y": 1520
        },
        {
          "x": 2740,
          "y": 1960
        },
        {
          "x": 2240,
          "y": 1860
        }
      ]
    },
    {
      "frame": "ch6_npc_guard",
      "name": "北環冰牆巡邏兵",
      "scale": 0.56,
      "speed": 70,
      "waypoints": [
        {
          "x": 1840,
          "y": 1180
        },
        {
          "x": 2360,
          "y": 1240
        },
        {
          "x": 2680,
          "y": 1620
        },
        {
          "x": 2060,
          "y": 1480
        }
      ]
    }
  ],
  "integratedBuildings": false,
  "modularBuildings": true,
  "portal": {
    "x": 1120,
    "y": 1640,
    "imgKey": "ch6_b_portal_v285",
    "imgUrl": "./assets/towns/ch6_b_portal.webp?v=285",
    "scale": 0.62,
    "name": "出城戰鬥傳送門",
    "action": "exit_battle"
  }
};
