// v304-4: 第 9 章主城「聖血薔薇修道院」— 全新開闊底圖＋建築／NPC／巡邏點重校
export const TOWN_CH9 = {
  "chapterIdx": 8,
  "id": "town_ch9",
  "name": "聖血薔薇修道院",
  "subtitle": "第 9 章主城・文藝復興大理石四方迴廊與薔薇中庭",
  "styleTag": "v304開闊環形廣場・聖血薔薇哥德石砌中庭",
  "mapWidth": 4096,
  "mapHeight": 2560,
  "bgKey": "town_bg_ch9_v304",
  "bgUrl": "./assets/bg/town_ch9.webp?v=304",
  "atlasKey": "town_atlas_ch9",
  "atlasPng": "./assets/towns/atlas_town_ch9.png",
  "atlasJson": "./assets/towns/atlas_town_ch9.json",
  "ambientColor": 16281969,
  "particleColor": 16007006,
  "spawn": {
    "x": 2048,
    "y": 1440
  },
  "walkableZones": [
    {
      "poly": [
        [
          2048,
          280
        ],
        [
          3620,
          1200
        ],
        [
          2048,
          2240
        ],
        [
          480,
          1200
        ]
      ]
    }
  ],
  "landmark": {
    "id": "blood_fountain",
    "name": "垂淚聖母血泉",
    "frame": "ch9_lm_fountain",
    "x": 2048,
    "y": 1080,
    "scale": 0.84,
    "imgKey": "ch9_b_beacon_v297",
    "imgUrl": "./assets/towns/ch9_b_beacon.webp?v=297",
    "radius": 65,
    "action": "gimmick_blood_fountain",
    "tip": "沐浴垂淚聖母血泉（5 分鐘 攻擊+35% / 爆傷+25% / 吸血+5%）"
  },
  "facilities": [
    {
      "id": "smith",
      "name": "聖光黃金錘洗煉聖台",
      "frame": "ch9_bld_smith",
      "x": 1460,
      "y": 880,
      "scale": 1.08,
      "imgKey": "ch9_b_smith_v297",
      "imgUrl": "./assets/towns/ch9_b_smith.webp?v=297",
      "workStyle": "forge",
      "radius": 102,
      "npc": {
        "frame": "ch9_npc_smith",
        "name": "奧古斯",
        "title": "聖光鍛造修士",
        "scale": 0.62,
        "workStyle": "forge",
        "greeting": "以黃金聖錘與聖殿聖火洗煉的武器，能直接斬斷異端與惡魔的詛咒！"
      },
      "action": "drawer_upgrade",
      "actionLabel": "開啟聖光洗煉",
      "doorOffset": {
        "x": 0,
        "y": 82
      }
    },
    {
      "id": "alchemy",
      "name": "血薔薇蒸餾聖藥房",
      "frame": "ch9_bld_alchemy",
      "x": 2640,
      "y": 880,
      "scale": 1.08,
      "imgKey": "ch9_b_alchemy_v297",
      "imgUrl": "./assets/towns/ch9_b_alchemy.webp?v=297",
      "workStyle": "alchemy",
      "radius": 102,
      "npc": {
        "frame": "ch9_npc_alchemy",
        "name": "克萊兒",
        "title": "薔薇藥劑修女",
        "scale": 0.62,
        "workStyle": "alchemy",
        "greeting": "用紅薔薇晨露與聖水蒸餾的秘藥，能讓你在血戰中立於不敗之地。"
      },
      "action": "modal_alchemy",
      "actionLabel": "調配薔薇聖藥",
      "doorOffset": {
        "x": 0,
        "y": 82
      }
    },
    {
      "id": "guild",
      "name": "修道院聖典珍寶庫",
      "frame": "ch9_bld_guild",
      "x": 2048,
      "y": 580,
      "scale": 1.08,
      "imgKey": "ch9_b_guild_v297",
      "imgUrl": "./assets/towns/ch9_b_guild.webp?v=297",
      "workStyle": "guild",
      "radius": 102,
      "npc": {
        "frame": "ch9_npc_guild",
        "name": "格里高利",
        "title": "典藏院長",
        "scale": 0.62,
        "workStyle": "guild",
        "greeting": "修道院地窖珍藏著歷代聖騎士的裝備聖典，請隨時整理你的背包。"
      },
      "action": "drawer_bag",
      "actionLabel": "打開聖典珍寶庫",
      "doorOffset": {
        "x": 0,
        "y": 82
      }
    },
    {
      "id": "temple",
      "name": "聖殿十字軍演武迴廊",
      "frame": "ch9_bld_temple",
      "x": 3080,
      "y": 1220,
      "scale": 1.06,
      "imgKey": "ch9_b_temple_v297",
      "imgUrl": "./assets/towns/ch9_b_temple.webp?v=297",
      "workStyle": "prayer",
      "radius": 102,
      "npc": {
        "frame": "ch9_npc_temple",
        "name": "羅蘭",
        "title": "血色聖騎士長",
        "scale": 0.62,
        "workStyle": "prayer",
        "greeting": "聖戰士！踏入廢墟之前先在此調整好神聖戰技與天賦樹吧！"
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
      "name": "審判庭紅蠟懸賞聖碑",
      "frame": "ch9_bld_bounty",
      "x": 1020,
      "y": 1220,
      "scale": 0.82,
      "imgKey": "ch9_b_bounty_v297",
      "imgUrl": "./assets/towns/ch9_b_bounty.webp?v=297",
      "workStyle": "bounty",
      "radius": 65,
      "npc": {
        "frame": "ch9_npc_bounty",
        "name": "託馬斯",
        "title": "紅衣審判官",
        "scale": 0.62,
        "workStyle": "bounty",
        "greeting": "背叛聖光的墮落修女與審判劊子手正在廢墟徘徊，奉命將他們淨化！"
      },
      "action": "modal_bounty",
      "actionLabel": "接取審判懸賞",
      "doorOffset": {
        "x": 0,
        "y": 82
      }
    },
    {
      "id": "market",
      "name": "聖物贖罪券黑市攤",
      "frame": "ch9_bld_market",
      "x": 2640,
      "y": 1620,
      "scale": 1.06,
      "imgKey": "ch9_b_market_v297",
      "imgUrl": "./assets/towns/ch9_b_market.webp?v=297",
      "workStyle": "market",
      "radius": 102,
      "npc": {
        "frame": "ch9_npc_market",
        "name": "盧卡",
        "title": "贖罪行商",
        "scale": 0.62,
        "workStyle": "market",
        "greeting": "只要捐獻一點金幣購買聖物盲盒，聖光便會賜予你神話級的奇蹟！"
      },
      "action": "modal_market",
      "actionLabel": "進入聖物黑市",
      "doorOffset": {
        "x": 0,
        "y": 82
      }
    },
    {
      "id": "altar",
      "name": "垂淚聖母輪迴祭壇",
      "frame": "ch9_bld_altar",
      "x": 2048,
      "y": 1920,
      "scale": 0.95,
      "imgKey": "ch9_b_temple_v297",
      "imgUrl": "./assets/towns/ch9_b_temple.webp?v=297",
      "workStyle": "prayer",
      "radius": 102,
      "npc": {
        "frame": "ch9_npc_altar",
        "name": "賽巴斯",
        "title": "血色大主教",
        "scale": 0.62,
        "workStyle": "prayer",
        "greeting": "在聖母的垂淚注視下洗去塵埃，完成神聖的靈魂輪迴昇華。"
      },
      "action": "drawer_rebirth",
      "actionLabel": "開啟聖母輪迴",
      "doorOffset": {
        "x": 0,
        "y": 82
      }
    },
    {
      "id": "portal",
      "name": "玫瑰花窗神聖光門",
      "frame": "ch9_bld_portal",
      "x": 1460,
      "y": 1620,
      "scale": 0.82,
      "radius": 65,
      "npc": {
        "frame": "ch9_npc_portal",
        "name": "米迦勒",
        "title": "黃金聖門守衛",
        "scale": 0.62,
        "greeting": "金色光門直通血色修道院廢墟深處，願聖薔薇之光護佑你凱旋！"
      },
      "action": "modal_portal",
      "actionLabel": "傳送出征廢墟",
      "imgKey": "ch9_b_portal_v297",
      "imgUrl": "./assets/towns/ch9_b_portal.webp?v=297",
      "doorOffset": {
        "x": 0,
        "y": 82
      }
    }
  ],
  "extraNpcs": [
    {
      "id": "penitent",
      "frame": "ch9_npc_penitent",
      "name": "特蕾莎",
      "title": "苦行聖女",
      "x": 1660,
      "y": 1260,
      "scale": 0.64,
      "greeting": "願這串薔薇念珠與 80,000 金幣聖糧，支撐你渡過最黑暗的修道院長夜。",
      "action": "modal_penitent",
      "actionLabel": "領取聖女賜福補給"
    },
    {
      "id": "abbey_bell",
      "frame": "ch9_prop_bell",
      "name": "聖血修道院黃金大鐘",
      "title": "聖光機關",
      "x": 2380,
      "y": 1500,
      "scale": 0.78,
      "greeting": "敲響修道院黃金大鐘降下聖光洗禮，瞬間恢復全部生命與能量！",
      "action": "gimmick_abbey_bell",
      "actionLabel": "敲響黃金大鐘（回滿狀態）"
    }
  ],
  "trainingDummy": {
    "id": "dummy",
    "name": "審判庭聖鎧靶偶",
    "frame": "ch9_prop_dummy",
    "x": 2620,
    "y": 1240,
    "scale": 0.72,
    "radius": 42
  },
  "neighborhood": [],
  "props": [],
  "patrols": [
    {
      "frame": "ch9_npc_guard",
      "name": "血色聖殿騎士衛兵",
      "scale": 0.56,
      "speed": 74,
      "waypoints": [
        {
          "x": 1480,
          "y": 1200
        },
        {
          "x": 2520,
          "y": 1200
        },
        {
          "x": 2520,
          "y": 1480
        },
        {
          "x": 1480,
          "y": 1480
        }
      ]
    },
    {
      "frame": "ch9_npc_nun",
      "name": "採花修女",
      "scale": 0.54,
      "speed": 62,
      "waypoints": [
        {
          "x": 1720,
          "y": 940
        },
        {
          "x": 2380,
          "y": 940
        },
        {
          "x": 2380,
          "y": 1620
        },
        {
          "x": 1720,
          "y": 1620
        }
      ]
    },
    {
      "frame": "ch9_npc_nun",
      "name": "南廊修女",
      "scale": 0.54,
      "speed": 62,
      "waypoints": [
        {
          "x": 1360,
          "y": 1320
        },
        {
          "x": 2048,
          "y": 1620
        },
        {
          "x": 2740,
          "y": 1320
        },
        {
          "x": 2048,
          "y": 920
        }
      ]
    }
  ],
  "integratedBuildings": false,
  "modularBuildings": true,
  "portal": {
    "x": 1460,
    "y": 1620,
    "imgKey": "ch9_b_portal_v297",
    "imgUrl": "./assets/towns/ch9_b_portal.webp?v=297",
    "scale": 0.82,
    "name": "出城戰鬥傳送門",
    "action": "exit_battle"
  }
};
