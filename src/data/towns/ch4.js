// v312: 第 4 章主城「黑曜石熔爐要塞」— 演武場重構與 NPC 門口精準校準
export const TOWN_CH4 = {
  "chapterIdx": 3,
  "id": "town_ch4",
  "name": "黑曜石熔爐要塞",
  "subtitle": "第 4 章主城・矮人火山重工業雙岸堡壘",
  "styleTag": "三層建築重構・三層火山階梯鍛造平台",
  "mapWidth": 4096,
  "mapHeight": 2560,
  "bgKey": "town_bg_ch4_v304",
  "bgUrl": "./assets/bg/town_ch4.webp?v=304",
  "atlasKey": "town_atlas_ch4",
  "atlasPng": "./assets/towns/atlas_town_ch4.png",
  "atlasJson": "./assets/towns/atlas_town_ch4.json",
  "ambientColor": 16347926,
  "particleColor": 16486972,
  "spawn": {
    "x": 2048,
    "y": 1320
  },
  "walkableZones": [
    {
      "poly": [
        [
          440,
          620
        ],
        [
          1100,
          380
        ],
        [
          2980,
          380
        ],
        [
          3640,
          620
        ],
        [
          3640,
          1960
        ],
        [
          2980,
          2180
        ],
        [
          1100,
          2180
        ],
        [
          440,
          1960
        ]
      ]
    }
  ],
  "landmark": {
    "id": "lava_fountain",
    "name": "雙頭巨龍熔岩噴泉",
    "frame": "ch4_lm_fountain",
    "x": 2048,
    "y": 1020,
    "scale": 0.82,
    "imgKey": "ch4_b_beacon_v295",
    "imgUrl": "./assets/towns/ch4_b_beacon.webp?v=295",
    "radius": 65,
    "action": "gimmick_lava_fountain",
    "tip": "觸發巨龍熔岩噴泉（5 分鐘 攻擊+25% / 爆傷+20% / 技能傷+20%）"
  },
  "facilities": [
    {
      "id": "smith",
      "name": "巨龍吐息岩漿鍛造巨砧",
      "frame": "ch4_bld_smith",
      "x": 980,
      "y": 720,
      "scale": 1.11,
      "imgKey": "ch4_b_smith_v295",
      "imgUrl": "./assets/towns/ch4_b_smith.webp?v=295",
      "workStyle": "forge",
      "radius": 102,
      "npc": {
        "frame": "ch4_npc_smith",
        "name": "伊格納",
        "title": "火元素鍛造師",
        "x": 980,
        "y": 804,
        "scale": 0.62,
        "workStyle": "forge",
        "greeting": "只有龍息般的熔岩才能將神兵淬鍊至極限，把你的裝備放上巨砧吧！"
      },
      "action": "drawer_upgrade",
      "actionLabel": "開啟熔岩鍛造",
      "doorOffset": {
        "x": 0,
        "y": 82
      }
    },
    {
      "id": "guild",
      "name": "矮人黑曜石金庫",
      "frame": "ch4_bld_guild",
      "x": 3140,
      "y": 720,
      "scale": 1.11,
      "imgKey": "ch4_b_guild_v295",
      "imgUrl": "./assets/towns/ch4_b_guild.webp?v=295",
      "workStyle": "guild",
      "radius": 102,
      "npc": {
        "frame": "ch4_npc_guild",
        "name": "索林",
        "title": "鐵鬍倉庫長",
        "x": 3140,
        "y": 804,
        "scale": 0.62,
        "workStyle": "guild",
        "greeting": "黑曜石鐵門連火龍都撞不開，你的戰利品在這裡絕對萬無一失。"
      },
      "action": "drawer_bag",
      "actionLabel": "打開黑曜石金庫",
      "doorOffset": {
        "x": 0,
        "y": 82
      }
    },
    {
      "id": "bounty",
      "name": "焦土戰功鐵碑",
      "frame": "ch4_bld_bounty",
      "x": 1560,
      "y": 1920,
      "scale": 0.82,
      "imgKey": "ch4_b_bounty_v295",
      "imgUrl": "./assets/towns/ch4_b_bounty.webp?v=295",
      "workStyle": "bounty",
      "radius": 65,
      "npc": {
        "frame": "ch4_npc_bounty",
        "name": "卡爾",
        "title": "屠龍獵團長",
        "x": 1560,
        "y": 2004,
        "scale": 0.62,
        "workStyle": "bounty",
        "greeting": "裂谷裡的炎魔與熔岩巨人正準備集結，去砍下它們的頭顱領賞！"
      },
      "action": "modal_bounty",
      "actionLabel": "接取裂谷懸賞",
      "doorOffset": {
        "x": 0,
        "y": 82
      }
    },
    {
      "id": "altar",
      "name": "火山灰燼輪迴聖壇",
      "frame": "ch4_bld_altar",
      "x": 2160,
      "y": 1920,
      "scale": 0.95,
      "imgKey": "ch4_b_temple_v295",
      "imgUrl": "./assets/towns/ch4_b_temple.webp?v=295",
      "workStyle": "prayer",
      "radius": 102,
      "npc": {
        "frame": "ch4_npc_altar",
        "name": "卡珊卓",
        "title": "餘燼先知",
        "x": 2160,
        "y": 2004,
        "scale": 0.62,
        "workStyle": "prayer",
        "greeting": "萬物皆於烈焰中化為灰燼，亦於灰燼中浴火重生。"
      },
      "action": "drawer_rebirth",
      "actionLabel": "開啟灰燼輪迴",
      "doorOffset": {
        "x": 0,
        "y": 82
      }
    },
    {
      "id": "alchemy",
      "name": "火山硫磺煉金鍋爐房",
      "frame": "ch4_bld_alchemy",
      "x": 1620,
      "y": 680,
      "scale": 1.06,
      "imgKey": "ch4_b_alchemy_v295",
      "imgUrl": "./assets/towns/ch4_b_alchemy.webp?v=295",
      "workStyle": "alchemy",
      "radius": 102,
      "npc": {
        "frame": "ch4_npc_alchemy",
        "name": "貝爾",
        "title": "灰燼煉金師",
        "x": 1620,
        "y": 764,
        "scale": 0.62,
        "workStyle": "alchemy",
        "greeting": "這鍋高純度火蜥蜴精華能讓你的戰鬥狂暴到連炎魔都害怕！"
      },
      "action": "modal_alchemy",
      "actionLabel": "調配火山藥劑",
      "doorOffset": {
        "x": 0,
        "y": 82
      }
    },
    {
      "id": "temple",
      "name": "熔岩戰鎚演武場",
      "frame": "ch4_bld_temple",
      "x": 2480,
      "y": 680,
      "scale": 1.06,
      "imgKey": "ch4_b_temple_v295",
      "imgUrl": "./assets/towns/ch4_b_temple.webp?v=295",
      "workStyle": "prayer",
      "radius": 102,
      "npc": {
        "frame": "ch4_npc_temple",
        "name": "布洛克",
        "title": "熔爐狂戰教頭",
        "x": 2480,
        "y": 764,
        "scale": 0.62,
        "workStyle": "prayer",
        "greeting": "戰士的熱血必須比岩漿更滾燙！來調整你的技能配置再去劈開敵人！"
      },
      "action": "drawer_skills",
      "actionLabel": "配置職業技能",
      "doorOffset": {
        "x": 0,
        "y": 82
      }
    },
    {
      "id": "market",
      "name": "走私熔火軍火帳",
      "frame": "ch4_bld_market",
      "x": 2760,
      "y": 1920,
      "scale": 1.08,
      "imgKey": "ch4_b_market_v295",
      "imgUrl": "./assets/towns/ch4_b_market.webp?v=295",
      "workStyle": "market",
      "radius": 102,
      "npc": {
        "frame": "ch4_npc_market",
        "name": "拉茲",
        "title": "炎魔軍火商",
        "x": 2760,
        "y": 2004,
        "scale": 0.62,
        "workStyle": "market",
        "greeting": "嘿嘿……這批黑曜石軍火箱裡可藏著不少好貨，要賭一發嗎？"
      },
      "action": "modal_market",
      "actionLabel": "進入軍火黑市",
      "doorOffset": {
        "x": 0,
        "y": 82
      }
    },
    {
      "id": "portal",
      "name": "黑曜石熔岩傳送閘門",
      "frame": "ch4_bld_portal",
      "x": 920,
      "y": 1920,
      "scale": 0.82,
      "radius": 65,
      "npc": {
        "frame": "ch4_npc_portal",
        "name": "泰坦",
        "title": "閘門守衛長",
        "x": 920,
        "y": 2004,
        "scale": 0.62,
        "greeting": "烈焰傳送門已穩定開啟，踏過去便是焦土熔岩裂谷的最前線！"
      },
      "action": "modal_portal",
      "actionLabel": "傳送出征裂谷",
      "imgKey": "ch4_b_portal_v295",
      "imgUrl": "./assets/towns/ch4_b_portal.webp?v=295",
      "doorOffset": {
        "x": 0,
        "y": 82
      }
    }
  ],
  "extraNpcs": [
    {
      "id": "forgemaster",
      "frame": "ch4_npc_forgemaster",
      "name": "赫菲斯",
      "title": "火元素鍛造宗師",
      "x": 1380,
      "y": 1280,
      "scale": 0.64,
      "greeting": "凡人，你的勇氣堪比純淨的赤炎。收下這份熔爐宗師的贈禮吧！",
      "action": "modal_forgemaster",
      "actionLabel": "領取宗師贈禮"
    },
    {
      "id": "lava_sluice",
      "frame": "ch4_prop_sluice",
      "name": "熔岩閘門壓力閥",
      "title": "冷卻機關",
      "x": 2540,
      "y": 1340,
      "scale": 0.72,
      "greeting": "釋放高壓冷卻蒸汽，瞬間撫平熱傷並回復全部生命與能量！",
      "action": "gimmick_lava_sluice",
      "actionLabel": "轉動冷卻閥門（回滿狀態）"
    }
  ],
  "trainingDummy": {
    "id": "dummy",
    "name": "黑曜石熔岩演武場",
    "frame": "ch4_prop_dummy",
    "x": 2920,
    "y": 1320,
    "scale": 0.76,
    "radius": 84,
    "imgKey": "ch4_arena_v312",
    "imgUrl": "./assets/towns/ch4_arena.webp?v=312"
  },
  "neighborhood": [],
  "props": [],
  "patrols": [
    {
      "frame": "ch4_npc_guard",
      "name": "黑曜石重甲矮人衛兵",
      "scale": 0.56,
      "speed": 74,
      "waypoints": [
        {
          "x": 860,
          "y": 1260
        },
        {
          "x": 3240,
          "y": 1260
        },
        {
          "x": 3240,
          "y": 1460
        },
        {
          "x": 860,
          "y": 1460
        }
      ]
    },
    {
      "frame": "ch4_npc_worker",
      "name": "熔岩運礦矮人",
      "scale": 0.55,
      "speed": 62,
      "waypoints": [
        {
          "x": 1260,
          "y": 1160
        },
        {
          "x": 2760,
          "y": 1160
        },
        {
          "x": 2760,
          "y": 1520
        },
        {
          "x": 1260,
          "y": 1520
        }
      ]
    },
    {
      "frame": "ch4_npc_worker",
      "name": "東岸煉礦工",
      "scale": 0.55,
      "speed": 62,
      "waypoints": [
        {
          "x": 1520,
          "y": 1340
        },
        {
          "x": 2580,
          "y": 1340
        }
      ]
    }
  ],
  "integratedBuildings": false,
  "modularBuildings": true,
  "portal": {
    "x": 920,
    "y": 1920,
    "imgKey": "ch4_b_portal_v295",
    "imgUrl": "./assets/towns/ch4_b_portal.webp?v=295",
    "scale": 0.82,
    "name": "出城戰鬥傳送門",
    "action": "exit_battle"
  },
  "blockedZones": [],
  "bridgeZones": []
};
