// v284: 第 3 章主城「守夜人聖骨禮拜堂」— 三層建築重構（純淨底圖＋8棟專屬風格2.5D建築）
export const TOWN_CH3 = {
  "chapterIdx": 2,
  "id": "town_ch3",
  "name": "守夜人聖骨禮拜堂",
  "subtitle": "第 3 章主城・暗黑哥德大教堂墓園",
  "styleTag": "三層建築重構・南北哥德教堂中殿雙翼",
  "mapWidth": 4096,
  "mapHeight": 2560,
  "bgKey": "town_bg_ch3_v284",
  "bgUrl": "./assets/bg/town_ch3.webp?v=284",
  "atlasKey": "town_atlas_ch3",
  "atlasPng": "./assets/towns/atlas_town_ch3.png",
  "atlasJson": "./assets/towns/atlas_town_ch3.json",
  "ambientColor": 3718648,
  "particleColor": 8246268,
  "spawn": {
    "x": 2048,
    "y": 1540
  },
  "walkableZones": [
    {
      "x1": 340,
      "y1": 360,
      "x2": 3820,
      "y2": 2360
    }
  ],
  "landmark": {
    "id": "soul_brazier",
    "name": "靈魂永恆火盆",
    "frame": "ch3_lm_brazier",
    "x": 2048,
    "y": 640,
    "scale": 0.64,
    "imgKey": "ch3_b_beacon_v284",
    "imgUrl": "./assets/towns/ch3_b_beacon.webp?v=284",
    "radius": 52,
    "action": "gimmick_soul_brazier",
    "tip": "點燃靈魂永恆火盆（5 分鐘 攻擊+18% / 爆傷+25% / 掉寶+15%）"
  },
  "facilities": [
    {
      "id": "smith",
      "name": "魂火附魔鍛造石台",
      "frame": "ch3_bld_smith",
      "x": 1060,
      "y": 820,
      "scale": 0.82,
      "imgKey": "ch3_b_smith_v284",
      "imgUrl": "./assets/towns/ch3_b_smith.webp?v=284",
      "workStyle": "forge",
      "radius": 82,
      "npc": {
        "frame": "ch3_npc_smith",
        "name": "莫德",
        "title": "魂火鍛匠",
        "x": 1080,
        "y": 894,
        "scale": 0.62,
        "workStyle": "forge",
        "greeting": "唯有幽藍魂火能淬鍊白骨與秘銀，把你的武器交給我重鑄吧。"
      },
      "action": "drawer_upgrade",
      "actionLabel": "開啟魂火鍛造",
      "doorOffset": {
        "x": 20,
        "y": 74
      }
    },
    {
      "id": "alchemy",
      "name": "骨灰聖水煉金室",
      "frame": "ch3_bld_alchemy",
      "x": 880,
      "y": 1760,
      "scale": 0.82,
      "imgKey": "ch3_b_alchemy_v284",
      "imgUrl": "./assets/towns/ch3_b_alchemy.webp?v=284",
      "workStyle": "alchemy",
      "radius": 82,
      "npc": {
        "frame": "ch3_npc_alchemy",
        "name": "薇拉",
        "title": "守墓煉金修女",
        "x": 900,
        "y": 1834,
        "scale": 0.62,
        "workStyle": "alchemy",
        "greeting": "墓穴深處瀰漫著腐屍毒霧，這瓶祝福聖水能保你性命。"
      },
      "action": "modal_alchemy",
      "actionLabel": "調配聖水藥劑",
      "doorOffset": {
        "x": 20,
        "y": 74
      }
    },
    {
      "id": "guild",
      "name": "守夜人聖物保管庫",
      "frame": "ch3_bld_guild",
      "x": 3040,
      "y": 820,
      "scale": 0.84,
      "imgKey": "ch3_b_guild_v284",
      "imgUrl": "./assets/towns/ch3_b_guild.webp?v=284",
      "workStyle": "guild",
      "radius": 82,
      "npc": {
        "frame": "ch3_npc_guild",
        "name": "賽拉斯",
        "title": "聖物書記官",
        "x": 3025,
        "y": 894,
        "scale": 0.62,
        "workStyle": "guild",
        "greeting": "每一件從墓穴回收的遺物都已登記造冊，請妥善整理你的背包。"
      },
      "action": "drawer_bag",
      "actionLabel": "打開聖物背包",
      "doorOffset": {
        "x": -15,
        "y": 74
      }
    },
    {
      "id": "temple",
      "name": "聖骨騎士演武殿",
      "frame": "ch3_bld_temple",
      "x": 2048,
      "y": 920,
      "scale": 0.84,
      "imgKey": "ch3_b_temple_v284",
      "imgUrl": "./assets/towns/ch3_b_temple.webp?v=284",
      "workStyle": "prayer",
      "radius": 82,
      "npc": {
        "frame": "ch3_npc_temple",
        "name": "亞瑟",
        "title": "聖骨騎士團長",
        "x": 2048,
        "y": 994,
        "scale": 0.62,
        "workStyle": "prayer",
        "greeting": "面對不死大軍，猶豫便意味著死亡。磨練你的戰技與天賦吧！"
      },
      "action": "drawer_skills",
      "actionLabel": "配置職業技能",
      "doorOffset": {
        "x": 0,
        "y": 74
      }
    },
    {
      "id": "bounty",
      "name": "墓園亡靈通緝碑",
      "frame": "ch3_bld_bounty",
      "x": 1540,
      "y": 1680,
      "scale": 0.62,
      "imgKey": "ch3_b_bounty_v284",
      "imgUrl": "./assets/towns/ch3_b_bounty.webp?v=284",
      "workStyle": "bounty",
      "radius": 52,
      "npc": {
        "frame": "ch3_npc_bounty",
        "name": "范倫鐵",
        "title": "獵魔守夜人",
        "x": 1550,
        "y": 1744,
        "scale": 0.62,
        "workStyle": "bounty",
        "greeting": "墓穴裡的死靈法師與食屍鬼越來越猖狂，拿下它們的頭顱來領賞。"
      },
      "action": "modal_bounty",
      "actionLabel": "查看亡靈懸賞",
      "doorOffset": {
        "x": 10,
        "y": 64
      }
    },
    {
      "id": "market",
      "name": "午夜棺槨黑市攤",
      "frame": "ch3_bld_market",
      "x": 3120,
      "y": 1740,
      "scale": 0.82,
      "imgKey": "ch3_b_market_v284",
      "imgUrl": "./assets/towns/ch3_b_market.webp?v=284",
      "workStyle": "market",
      "radius": 82,
      "npc": {
        "frame": "ch3_npc_market",
        "name": "卡隆",
        "title": "掘墓走私商",
        "x": 3100,
        "y": 1814,
        "scale": 0.62,
        "workStyle": "market",
        "greeting": "死人可帶不走陪葬品……付點金幣，我就讓你開棺挑一件寶貝。"
      },
      "action": "modal_market",
      "actionLabel": "開棺賭裝黑市",
      "doorOffset": {
        "x": -20,
        "y": 74
      }
    },
    {
      "id": "altar",
      "name": "大教堂永恆輪迴聖壇",
      "frame": "ch3_bld_altar",
      "x": 1140,
      "y": 1180,
      "scale": 0.74,
      "imgKey": "ch3_b_temple_v284",
      "imgUrl": "./assets/towns/ch3_b_temple.webp?v=284",
      "workStyle": "prayer",
      "radius": 82,
      "npc": {
        "frame": "ch3_npc_altar",
        "name": "伊萊亞斯",
        "title": "大教堂主教",
        "x": 1155,
        "y": 1252,
        "scale": 0.62,
        "workStyle": "prayer",
        "greeting": "在天使聖像的見證下重塑靈魂，讓聖光賦予你超越生死的輪迴之力。"
      },
      "action": "drawer_rebirth",
      "actionLabel": "開啟聖壇輪迴",
      "doorOffset": {
        "x": 15,
        "y": 72
      }
    },
    {
      "id": "portal",
      "name": "哥德刻文傳送墓碑門",
      "frame": "ch3_bld_portal",
      "x": 2048,
      "y": 2180,
      "scale": 0.64,
      "radius": 52,
      "npc": {
        "frame": "ch3_npc_portal",
        "name": "加百列",
        "title": "墓門守衛",
        "x": 2048,
        "y": 2248,
        "scale": 0.62,
        "greeting": "穿過這道幽藍墓門便能直抵白骨墓穴前線，願守夜人榮光與你同在。"
      },
      "action": "modal_portal",
      "actionLabel": "傳送出征前線",
      "imgKey": "ch3_b_portal_v284",
      "imgUrl": "./assets/towns/ch3_b_portal.webp?v=284",
      "doorOffset": {
        "x": 0,
        "y": 68
      }
    }
  ],
  "extraNpcs": [
    {
      "id": "chronicler",
      "frame": "ch3_npc_chronicler",
      "name": "阿爾文",
      "title": "亡靈記錄者",
      "x": 2340,
      "y": 1340,
      "scale": 0.62,
      "greeting": "我用魂羽筆記錄了每一位踏入墓穴的勇者，這份聖骨補給請收下。",
      "action": "modal_chronicler",
      "actionLabel": "領取記錄者補給"
    },
    {
      "id": "candle_shrine",
      "frame": "ch3_prop_candle",
      "name": "祈禱幽藍燭台",
      "title": "教堂聖壇",
      "x": 1680,
      "y": 1240,
      "scale": 0.72,
      "greeting": "點燃守夜人的藍蠟禱告燭台，撫平傷痛並回復全部狀態。",
      "action": "gimmick_candle_shrine",
      "actionLabel": "點燃禱告燭台（回滿生命與能量）"
    }
  ],
  "trainingDummy": {
    "id": "dummy",
    "name": "骸骨騎士盔甲靶",
    "frame": "ch3_prop_dummy",
    "x": 3360,
    "y": 1840,
    "scale": 0.72,
    "radius": 42
  },
  "neighborhood": [],
  "props": [],
  "patrols": [
    {
      "frame": "ch3_npc_guard",
      "name": "守夜人提燈騎士",
      "scale": 0.56,
      "speed": 74,
      "waypoints": [
        {
          "x": 2048,
          "y": 780
        },
        {
          "x": 2048,
          "y": 1360
        },
        {
          "x": 2048,
          "y": 2020
        },
        {
          "x": 2048,
          "y": 1360
        }
      ]
    },
    {
      "frame": "ch3_npc_monk",
      "name": "巡夜香爐修士",
      "scale": 0.55,
      "speed": 62,
      "waypoints": [
        {
          "x": 1280,
          "y": 1420
        },
        {
          "x": 940,
          "y": 1720
        },
        {
          "x": 1580,
          "y": 1860
        },
        {
          "x": 1820,
          "y": 1640
        }
      ]
    },
    {
      "frame": "ch3_npc_monk",
      "name": "聖壇誦經修士",
      "scale": 0.55,
      "speed": 58,
      "waypoints": [
        {
          "x": 2860,
          "y": 1280
        },
        {
          "x": 3180,
          "y": 1520
        },
        {
          "x": 3080,
          "y": 1840
        },
        {
          "x": 2560,
          "y": 1660
        }
      ]
    }
  ],
  "integratedBuildings": false,
  "modularBuildings": true,
  "portal": {
    "x": 2048,
    "y": 2180,
    "imgKey": "ch3_b_portal_v284",
    "imgUrl": "./assets/towns/ch3_b_portal.webp?v=284",
    "scale": 0.64,
    "name": "出城戰鬥傳送門",
    "action": "exit_battle"
  }
};
