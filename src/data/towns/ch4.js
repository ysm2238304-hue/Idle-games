// v280: 第 4 章主城「熔火鍛造堡壘」— 三層火山階梯平台與鐵鍊吊橋非對稱重構（4096x2560）
export const TOWN_CH4 = {
  "chapterIdx": 3,
  "id": "town_ch4",
  "name": "黑曜石熔爐要塞",
  "subtitle": "第 4 章主城・矮人火山重工業雙岸堡壘",
  "styleTag": "三層火山階梯鍛城・熔岩鐵鍊吊橋",
  "mapWidth": 4096,
  "mapHeight": 2560,
  "bgKey": "town_bg_ch4_v280",
  "bgUrl": "./assets/bg/town_ch4.webp?v=280",
  "atlasKey": "town_atlas_ch4",
  "atlasPng": "./assets/towns/atlas_town_ch4.png",
  "atlasJson": "./assets/towns/atlas_town_ch4.json",
  "ambientColor": 16347926,
  "particleColor": 16486972,
  "spawn": {
    "x": 2180,
    "y": 1420
  },
  "walkableZones": [
    {
      "x1": 300,
      "y1": 320,
      "x2": 3860,
      "y2": 2380
    }
  ],
  "landmark": {
    "id": "lava_fountain",
    "name": "雙頭巨龍熔岩噴泉",
    "frame": "ch4_lm_fountain",
    "x": 1220,
    "y": 640,
    "scale": 0.88,
    "imgKey": "ch4_lm_fountain_v268",
    "imgUrl": "./assets/towns/ch4_lm_fountain.webp?v=268",
    "radius": 95,
    "action": "gimmick_lava_fountain",
    "tip": "觸發巨龍熔岩噴泉（5 分鐘 攻擊+25% / 爆傷+20% / 技能傷+20%）"
  },
  "facilities": [
    {
      "id": "smith",
      "name": "巨龍吐息岩漿鍛造巨砧",
      "frame": "ch4_bld_smith",
      "x": 1480,
      "y": 780,
      "scale": 1.04,
      "imgKey": "ch4_bld_smith_v268",
      "imgUrl": "./assets/towns/ch4_bld_smith.webp?v=268",
      "workStyle": "forge",
      "radius": 118,
      "npc": {
        "frame": "ch4_npc_smith",
        "name": "伊格納",
        "title": "火元素鍛造師",
        "x": 1660,
        "y": 920,
        "scale": 0.62,
        "workStyle": "forge",
        "greeting": "只有龍息般的熔岩才能將神兵淬鍊至極限，把你的裝備放上巨砧吧！"
      },
      "action": "drawer_upgrade",
      "actionLabel": "開啟熔岩鍛造"
    },
    {
      "id": "guild",
      "name": "矮人黑曜石金庫",
      "frame": "ch4_bld_guild",
      "x": 3360,
      "y": 1960,
      "scale": 1.02,
      "imgKey": "ch4_bld_guild_v268",
      "imgUrl": "./assets/towns/ch4_bld_guild.webp?v=268",
      "workStyle": "guild",
      "radius": 112,
      "npc": {
        "frame": "ch4_npc_guild",
        "name": "索林",
        "title": "鐵鬍倉庫長",
        "x": 3140,
        "y": 1940,
        "scale": 0.62,
        "workStyle": "guild",
        "greeting": "黑曜石鐵門連火龍都撞不開，你的戰利品在這裡絕對萬無一失。"
      },
      "action": "drawer_bag",
      "actionLabel": "打開黑曜石金庫"
    },
    {
      "id": "bounty",
      "name": "焦土戰功鐵碑",
      "frame": "ch4_bld_bounty",
      "x": 2660,
      "y": 1340,
      "scale": 0.92,
      "imgKey": "ch4_bld_bounty_v268",
      "imgUrl": "./assets/towns/ch4_bld_bounty.webp?v=268",
      "workStyle": "bounty",
      "radius": 85,
      "npc": {
        "frame": "ch4_npc_bounty",
        "name": "卡爾",
        "title": "屠龍獵團長",
        "x": 2560,
        "y": 1460,
        "scale": 0.62,
        "workStyle": "bounty",
        "greeting": "裂谷裡的炎魔與熔岩巨人正準備集結，去砍下它們的頭顱領賞！"
      },
      "action": "modal_bounty",
      "actionLabel": "接取裂谷懸賞"
    },
    {
      "id": "altar",
      "name": "火山灰燼輪迴聖壇",
      "frame": "ch4_bld_altar",
      "x": 3620,
      "y": 1320,
      "scale": 1,
      "imgKey": "ch4_bld_altar_v268",
      "imgUrl": "./assets/towns/ch4_bld_altar.webp?v=268",
      "workStyle": "prayer",
      "radius": 102,
      "npc": {
        "frame": "ch4_npc_altar",
        "name": "卡珊卓",
        "title": "餘燼先知",
        "x": 3440,
        "y": 1380,
        "scale": 0.62,
        "workStyle": "prayer",
        "greeting": "萬物皆於烈焰中化為灰燼，亦於灰燼中浴火重生。"
      },
      "action": "drawer_rebirth",
      "actionLabel": "開啟灰燼輪迴"
    },
    {
      "id": "alchemy",
      "name": "火山硫磺煉金鍋爐房",
      "frame": "ch4_bld_alchemy",
      "x": 3140,
      "y": 980,
      "scale": 1,
      "imgKey": "ch4_bld_alchemy_v268",
      "imgUrl": "./assets/towns/ch4_bld_alchemy.webp?v=268",
      "workStyle": "alchemy",
      "radius": 118,
      "npc": {
        "frame": "ch4_npc_alchemy",
        "name": "貝爾",
        "title": "灰燼煉金師",
        "x": 2940,
        "y": 1160,
        "scale": 0.62,
        "workStyle": "alchemy",
        "greeting": "這鍋高純度火蜥蜴精華能讓你的戰鬥狂暴到連炎魔都害怕！"
      },
      "action": "modal_alchemy",
      "actionLabel": "調配火山藥劑"
    },
    {
      "id": "temple",
      "name": "熔岩戰鎚演武場",
      "frame": "ch4_bld_temple",
      "x": 1960,
      "y": 760,
      "scale": 0.98,
      "imgKey": "ch4_bld_temple_v268",
      "imgUrl": "./assets/towns/ch4_bld_temple.webp?v=268",
      "workStyle": "prayer",
      "radius": 118,
      "npc": {
        "frame": "ch4_npc_temple",
        "name": "布洛克",
        "title": "熔爐狂戰教頭",
        "x": 1980,
        "y": 940,
        "scale": 0.62,
        "workStyle": "prayer",
        "greeting": "戰士的熱血必須比岩漿更滾燙！來調整你的技能配置再去劈開敵人！"
      },
      "action": "drawer_skills",
      "actionLabel": "配置職業技能"
    },
    {
      "id": "market",
      "name": "走私熔火軍火帳",
      "frame": "ch4_bld_market",
      "x": 920,
      "y": 1940,
      "scale": 0.96,
      "imgKey": "ch4_bld_market_v268",
      "imgUrl": "./assets/towns/ch4_bld_market.webp?v=268",
      "workStyle": "market",
      "radius": 98,
      "npc": {
        "frame": "ch4_npc_market",
        "name": "拉茲",
        "title": "炎魔軍火商",
        "x": 1140,
        "y": 1960,
        "scale": 0.62,
        "workStyle": "market",
        "greeting": "嘿嘿……這批黑曜石軍火箱裡可藏著不少好貨，要賭一發嗎？"
      },
      "action": "modal_market",
      "actionLabel": "進入軍火黑市"
    },
    {
      "id": "portal",
      "name": "黑曜石熔岩傳送閘門",
      "frame": "ch4_bld_portal",
      "x": 2020,
      "y": 2240,
      "scale": 0.92,
      "radius": 108,
      "npc": {
        "frame": "ch4_npc_portal",
        "name": "泰坦",
        "title": "閘門守衛長",
        "x": 2160,
        "y": 2120,
        "scale": 0.62,
        "greeting": "烈焰傳送門已穩定開啟，踏過去便是焦土熔岩裂谷的最前線！"
      },
      "action": "modal_portal",
      "actionLabel": "傳送出征裂谷"
    }
  ],
  "extraNpcs": [
    {
      "id": "forgemaster",
      "frame": "ch4_npc_forgemaster",
      "name": "赫菲斯",
      "title": "火元素鍛造宗師",
      "x": 1560,
      "y": 1520,
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
      "y": 1520,
      "scale": 0.72,
      "greeting": "釋放高壓冷卻蒸汽，瞬間撫平熱傷並回復全部生命與能量！",
      "action": "gimmick_lava_sluice",
      "actionLabel": "轉動冷卻閥門（回滿狀態）"
    }
  ],
  "trainingDummy": {
    "id": "dummy",
    "name": "黑曜石重甲靶人",
    "frame": "ch4_prop_dummy",
    "x": 4365,
    "y": 1593,
    "scale": 0.74,
    "radius": 44
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
          "x": 1480,
          "y": 980
        },
        {
          "x": 2140,
          "y": 1420
        },
        {
          "x": 2860,
          "y": 1220
        },
        {
          "x": 2340,
          "y": 1620
        },
        {
          "x": 3140,
          "y": 1940
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
          "x": 1160,
          "y": 1980
        },
        {
          "x": 1980,
          "y": 2200
        },
        {
          "x": 2860,
          "y": 2080
        },
        {
          "x": 2040,
          "y": 2180
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
          "x": 2984,
          "y": 939
        },
        {
          "x": 2984,
          "y": 1764
        }
      ]
    }
  ]
};
