// v282: 第 6 章主城「極光冰晶堡」— 全主城場景一體化建築重構＋全座標越界修正（4096x2560）
export const TOWN_CH6 = {
  "chapterIdx": 5,
  "id": "town_ch6",
  "name": "極光冰晶堡",
  "subtitle": "第 6 章主城・北歐維京長屋與同心圓冰雕堡壘",
  "styleTag": "冰封峽灣維京港・半月山坡雪村",
  "mapWidth": 4096,
  "mapHeight": 2560,
  "bgKey": "town_bg_ch6_v280",
  "bgUrl": "./assets/bg/town_ch6.webp?v=280",
  "atlasKey": "town_atlas_ch6",
  "atlasPng": "./assets/towns/atlas_town_ch6.png",
  "atlasJson": "./assets/towns/atlas_town_ch6.json",
  "ambientColor": 3718648,
  "particleColor": 14742270,
  "spawn": {
    "x": 2080,
    "y": 1220
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
    "x": 1980,
    "y": 760,
    "scale": 0.88,
    "imgKey": "ch6_lm_spire_v269",
    "imgUrl": "./assets/towns/ch6_lm_spire.webp?v=269",
    "radius": 95,
    "action": "gimmick_aurora_spire",
    "tip": "共鳴永凍極光水晶塔（5 分鐘 防禦+25% / 攻速+25% / 減傷+10%）"
  },
  "facilities": [
    {
      "id": "smith",
      "name": "永凍藍冰符文鍛造柱",
      "frame": "ch6_bld_smith",
      "x": 940,
      "y": 580,
      "scale": 1,
      "imgKey": "ch6_bld_smith_v269",
      "imgUrl": "./assets/towns/ch6_bld_smith.webp?v=269",
      "workStyle": "forge",
      "radius": 112,
      "npc": {
        "frame": "ch6_npc_smith",
        "name": "布羅恩",
        "title": "冰霜符文鐵匠",
        "x": 1120,
        "y": 720,
        "scale": 0.62,
        "workStyle": "forge",
        "greeting": "極地永凍冰鐵比鋼鐵更堅硬，刻上北歐符文後連冰龍都能劈開！"
      },
      "action": "drawer_upgrade",
      "actionLabel": "開啟符文鍛造"
    },
    {
      "id": "alchemy",
      "name": "雪松草藥與冰晶蒸餾屋",
      "frame": "ch6_bld_alchemy",
      "x": 1960,
      "y": 500,
      "scale": 1,
      "imgKey": "ch6_bld_alchemy_v269",
      "imgUrl": "./assets/towns/ch6_bld_alchemy.webp?v=269",
      "workStyle": "alchemy",
      "radius": 112,
      "npc": {
        "frame": "ch6_npc_alchemy",
        "name": "芙蕾雅",
        "title": "雪域草藥師",
        "x": 1960,
        "y": 680,
        "scale": 0.62,
        "workStyle": "alchemy",
        "greeting": "喝下這瓶極光雪蓮暖身藥劑，暴風雪就再也凍傷不了你。"
      },
      "action": "modal_alchemy",
      "actionLabel": "調配冰晶藥劑"
    },
    {
      "id": "guild",
      "name": "維京毛皮與秘寶長屋",
      "frame": "ch6_bld_guild",
      "x": 3460,
      "y": 1040,
      "scale": 0.96,
      "imgKey": "ch6_bld_guild_v269",
      "imgUrl": "./assets/towns/ch6_bld_guild.webp?v=269",
      "workStyle": "guild",
      "radius": 115,
      "npc": {
        "frame": "ch6_npc_guild",
        "name": "哈康",
        "title": "長屋大管家",
        "x": 3280,
        "y": 1120,
        "scale": 0.62,
        "workStyle": "guild",
        "greeting": "所有戰利品與毛皮補給都妥善存放在龍首長屋裡，隨時取用！"
      },
      "action": "drawer_bag",
      "actionLabel": "打開長屋倉庫"
    },
    {
      "id": "temple",
      "name": "英靈殿狂戰訓練場",
      "frame": "ch6_bld_temple",
      "x": 2940,
      "y": 580,
      "scale": 1.04,
      "imgKey": "ch6_bld_temple_v269",
      "imgUrl": "./assets/towns/ch6_bld_temple.webp?v=269",
      "workStyle": "prayer",
      "radius": 115,
      "npc": {
        "frame": "ch6_npc_temple",
        "name": "布倫希爾",
        "title": "女武神教頭",
        "x": 2860,
        "y": 780,
        "scale": 0.62,
        "workStyle": "prayer",
        "greeting": "戰士！展現讓英靈殿都為之震顫的戰技吧，調整好天賦再出發！"
      },
      "action": "drawer_skills",
      "actionLabel": "配置職業技能"
    },
    {
      "id": "bounty",
      "name": "北歐符文懸賞巨石",
      "frame": "ch6_bld_bounty",
      "x": 1640,
      "y": 1220,
      "scale": 0.94,
      "imgKey": "ch6_bld_bounty_v269",
      "imgUrl": "./assets/towns/ch6_bld_bounty.webp?v=269",
      "workStyle": "bounty",
      "radius": 82,
      "npc": {
        "frame": "ch6_npc_bounty",
        "name": "芬里爾",
        "title": "雪原獵狼隊長",
        "x": 1780,
        "y": 1280,
        "scale": 0.62,
        "workStyle": "bounty",
        "greeting": "雪原冰原狼與雪怪最近太囂張了，去獵殺它們領取北境賞金！"
      },
      "action": "modal_bounty",
      "actionLabel": "接取雪原懸賞"
    },
    {
      "id": "market",
      "name": "極地毛皮雪橇黑市",
      "frame": "ch6_bld_market",
      "x": 2960,
      "y": 2020,
      "scale": 0.96,
      "imgKey": "ch6_bld_market_v269",
      "imgUrl": "./assets/towns/ch6_bld_market.webp?v=269",
      "workStyle": "market",
      "radius": 95,
      "npc": {
        "frame": "ch6_npc_market",
        "name": "史文",
        "title": "極地行商",
        "x": 2780,
        "y": 1920,
        "scale": 0.62,
        "workStyle": "market",
        "greeting": "剛從冰川裂縫撈出來的稀有寶箱，附帶極光結晶，想賭一發嗎？"
      },
      "action": "modal_market",
      "actionLabel": "進入極地黑市"
    },
    {
      "id": "altar",
      "name": "極光世界樹輪迴聖壇",
      "frame": "ch6_bld_altar",
      "x": 2560,
      "y": 1420,
      "scale": 0.98,
      "imgKey": "ch6_bld_altar_v269",
      "imgUrl": "./assets/towns/ch6_bld_altar.webp?v=269",
      "workStyle": "prayer",
      "radius": 105,
      "npc": {
        "frame": "ch6_npc_altar",
        "name": "阿斯特麗",
        "title": "霜語薩滿",
        "x": 2420,
        "y": 1460,
        "scale": 0.62,
        "workStyle": "prayer",
        "greeting": "在世界樹枯根與極光的見證下，重塑你的魂魄迎向新生。"
      },
      "action": "drawer_rebirth",
      "actionLabel": "開啟世界樹輪迴"
    },
    {
      "id": "portal",
      "name": "北歐巨石陣傳送冰門",
      "frame": "ch6_bld_portal",
      "x": 1260,
      "y": 1740,
      "scale": 0.92,
      "radius": 105,
      "npc": {
        "frame": "ch6_npc_portal",
        "name": "海姆達爾",
        "title": "彩虹冰門守衛",
        "x": 1440,
        "y": 1660,
        "scale": 0.62,
        "greeting": "極光傳送門已對準永凍冰霜凍原深處，隨時準備出征！"
      },
      "action": "modal_portal",
      "actionLabel": "傳送出征凍原"
    }
  ],
  "extraNpcs": [
    {
      "id": "shaman",
      "frame": "ch6_npc_shaman",
      "name": "奧丁森",
      "title": "極地先知長老",
      "x": 2360,
      "y": 840,
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
      "x": 1240,
      "y": 740,
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
    "x": 3580,
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
  "integratedBuildings": true
};
