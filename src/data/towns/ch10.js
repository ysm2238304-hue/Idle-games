// v286: 第 10 章主城「永恆星辰聖域」— 三層建築重構（純淨底圖＋8棟專屬風格2.5D建築）
export const TOWN_CH10 = {
  "chapterIdx": 9,
  "id": "town_ch10",
  "name": "永恆星辰聖域",
  "subtitle": "第 10 章終極主城・宇宙星象儀與星軌懸浮聖域",
  "styleTag": "三層建築重構・雙螺旋星光天橋宇宙聖域",
  "mapWidth": 4096,
  "mapHeight": 2560,
  "bgKey": "town_bg_ch10_v286",
  "bgUrl": "./assets/bg/town_ch10.webp?v=286",
  "atlasKey": "town_atlas_ch10",
  "atlasPng": "./assets/towns/atlas_town_ch10.png",
  "atlasJson": "./assets/towns/atlas_town_ch10.json",
  "ambientColor": 12616956,
  "particleColor": 16638023,
  "spawn": {
    "x": 1540,
    "y": 1540
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
    "id": "astral_orrery",
    "name": "旋轉黑洞星象儀",
    "frame": "ch10_lm_orrery",
    "x": 2640,
    "y": 840,
    "scale": 0.66,
    "imgKey": "ch10_b_beacon_v286",
    "imgUrl": "./assets/towns/ch10_b_beacon.webp?v=286",
    "radius": 52,
    "action": "gimmick_astral_orrery",
    "tip": "校準黑洞星象儀（5 分鐘 攻擊+45% / 爆傷+35% / 攻速+30% / 掉寶+40%）"
  },
  "facilities": [
    {
      "id": "smith",
      "name": "黑洞重力星辰重鑄儀",
      "frame": "ch10_bld_smith",
      "x": 1240,
      "y": 1720,
      "scale": 0.8,
      "imgKey": "ch10_b_smith_v286",
      "imgUrl": "./assets/towns/ch10_b_smith.webp?v=286",
      "workStyle": "forge",
      "radius": 82,
      "npc": {
        "frame": "ch10_npc_smith",
        "name": "奧利安",
        "title": "星辰鑄造師",
        "x": 1260,
        "y": 1794,
        "scale": 0.62,
        "workStyle": "forge",
        "greeting": "以奇異點黑洞的重力與恆星碎片重鑄的神話裝備，足以撼動宇宙法則！"
      },
      "action": "drawer_upgrade",
      "actionLabel": "開啟星辰重鑄",
      "doorOffset": {
        "x": 20,
        "y": 74
      }
    },
    {
      "id": "guild",
      "name": "永恆星庫與神話秘藏殿",
      "frame": "ch10_bld_guild",
      "x": 3580,
      "y": 360,
      "scale": 0.8,
      "imgKey": "ch10_b_guild_v286",
      "imgUrl": "./assets/towns/ch10_b_guild.webp?v=286",
      "workStyle": "guild",
      "radius": 82,
      "npc": {
        "frame": "ch10_npc_guild",
        "name": "阿斯特拉",
        "title": "星界典藏官",
        "x": 3560,
        "y": 434,
        "scale": 0.62,
        "workStyle": "guild",
        "greeting": "所有星際征戰得來的神話遺物皆已收錄於此，請隨時檢視你的星庫。"
      },
      "action": "drawer_bag",
      "actionLabel": "打開永恆星庫",
      "doorOffset": {
        "x": -20,
        "y": 74
      }
    },
    {
      "id": "alchemy",
      "name": "星雲銀河蒸餾水晶殿",
      "frame": "ch10_bld_alchemy",
      "x": 1760,
      "y": 740,
      "scale": 0.78,
      "imgKey": "ch10_b_alchemy_v286",
      "imgUrl": "./assets/towns/ch10_b_alchemy.webp?v=286",
      "workStyle": "alchemy",
      "radius": 82,
      "npc": {
        "frame": "ch10_npc_alchemy",
        "name": "賽萊斯特",
        "title": "星露煉金師",
        "x": 1775,
        "y": 814,
        "scale": 0.62,
        "workStyle": "alchemy",
        "greeting": "這瓶濃縮了超新星餘暉的星露靈藥，將帶給你超越極限的力量。"
      },
      "action": "modal_alchemy",
      "actionLabel": "調配星雲靈藥",
      "doorOffset": {
        "x": 15,
        "y": 74
      }
    },
    {
      "id": "temple",
      "name": "星界熾天使演武神壇",
      "frame": "ch10_bld_temple",
      "x": 2980,
      "y": 680,
      "scale": 0.8,
      "imgKey": "ch10_b_temple_v286",
      "imgUrl": "./assets/towns/ch10_b_temple.webp?v=286",
      "workStyle": "prayer",
      "radius": 82,
      "npc": {
        "frame": "ch10_npc_temple",
        "name": "索拉里斯",
        "title": "星界戰神",
        "x": 2965,
        "y": 754,
        "scale": 0.62,
        "workStyle": "prayer",
        "greeting": "迎接混沌星界虛空的最終決戰前，將你的技能與天賦調整至完美吧！"
      },
      "action": "drawer_skills",
      "actionLabel": "配置終極技能",
      "doorOffset": {
        "x": -15,
        "y": 74
      }
    },
    {
      "id": "bounty",
      "name": "星圖天命懸賞羅盤",
      "frame": "ch10_bld_bounty",
      "x": 1420,
      "y": 1580,
      "scale": 0.6,
      "imgKey": "ch10_b_bounty_v286",
      "imgUrl": "./assets/towns/ch10_b_bounty.webp?v=286",
      "workStyle": "bounty",
      "radius": 52,
      "npc": {
        "frame": "ch10_npc_bounty",
        "name": "奧羅拉",
        "title": "星界獵手",
        "x": 1432,
        "y": 1644,
        "scale": 0.62,
        "workStyle": "bounty",
        "greeting": "混沌虛空裡的星界吞噬者與墮落熾天使正在擴張，完成天命懸賞吧！"
      },
      "action": "modal_bounty",
      "actionLabel": "接取星圖懸賞",
      "doorOffset": {
        "x": 12,
        "y": 64
      }
    },
    {
      "id": "market",
      "name": "虛空星塵奇珍拍賣閣",
      "frame": "ch10_bld_market",
      "x": 2340,
      "y": 1240,
      "scale": 0.8,
      "imgKey": "ch10_b_market_v286",
      "imgUrl": "./assets/towns/ch10_b_market.webp?v=286",
      "workStyle": "market",
      "radius": 82,
      "npc": {
        "frame": "ch10_npc_market",
        "name": "維加",
        "title": "星界奇珍商",
        "x": 2325,
        "y": 1314,
        "scale": 0.62,
        "workStyle": "market",
        "greeting": "來自平行宇宙的神秘星塵寶箱，這裡是神話裝備出現率最高的黑市！"
      },
      "action": "modal_market",
      "actionLabel": "進入星塵黑市",
      "doorOffset": {
        "x": -15,
        "y": 74
      }
    },
    {
      "id": "altar",
      "name": "永恆輪迴星辰轉生陣",
      "frame": "ch10_bld_altar",
      "x": 2120,
      "y": 1020,
      "scale": 0.72,
      "imgKey": "ch10_b_temple_v286",
      "imgUrl": "./assets/towns/ch10_b_temple.webp?v=286",
      "workStyle": "prayer",
      "radius": 82,
      "npc": {
        "frame": "ch10_npc_altar",
        "name": "克羅諾斯",
        "title": "時間與星界大先知",
        "x": 2135,
        "y": 1092,
        "scale": 0.62,
        "workStyle": "prayer",
        "greeting": "時間在此靜止、宇宙在此重啟，踏入星陣完成你的永恆輪迴超越。"
      },
      "action": "drawer_rebirth",
      "actionLabel": "開啟永恆輪迴",
      "doorOffset": {
        "x": 15,
        "y": 72
      }
    },
    {
      "id": "portal",
      "name": "宇宙星門蟲洞羅盤",
      "frame": "ch10_bld_portal",
      "x": 640,
      "y": 2220,
      "scale": 0.64,
      "radius": 52,
      "npc": {
        "frame": "ch10_npc_portal",
        "name": "諾瓦",
        "title": "星門守護神",
        "x": 660,
        "y": 2288,
        "scale": 0.62,
        "greeting": "宇宙蟲洞已鎖定混沌星界虛空終點，隨時準備展開最後一戰！"
      },
      "action": "modal_portal",
      "actionLabel": "穿越蟲洞出征",
      "imgKey": "ch10_b_portal_v286",
      "imgUrl": "./assets/towns/ch10_b_portal.webp?v=286",
      "doorOffset": {
        "x": 20,
        "y": 68
      }
    }
  ],
  "extraNpcs": [
    {
      "id": "weaver",
      "frame": "ch10_npc_weaver",
      "name": "伊莉雅",
      "title": "星界編織者",
      "x": 1980,
      "y": 1340,
      "scale": 0.64,
      "greeting": "偉大的旅者，你已走完十界征途！收下這份星界編織者的終極贈禮吧！",
      "action": "modal_weaver",
      "actionLabel": "領取星界終極贈禮"
    },
    {
      "id": "star_well",
      "frame": "ch10_prop_starwell",
      "name": "星界銀河許願泉",
      "title": "星辰聖泉",
      "x": 2840,
      "y": 920,
      "scale": 0.78,
      "greeting": "沐浴於流淌星塵的銀河許願泉，瞬間恢復全部生命與能量！",
      "action": "gimmick_star_well",
      "actionLabel": "許願回春（回滿狀態）"
    }
  ],
  "trainingDummy": {
    "id": "dummy",
    "name": "星界黃金構造體靶",
    "frame": "ch10_prop_dummy",
    "x": 3680,
    "y": 420,
    "scale": 0.74,
    "radius": 42
  },
  "neighborhood": [],
  "props": [],
  "patrols": [
    {
      "frame": "ch10_npc_guard",
      "name": "星界熾天使衛兵",
      "scale": 0.56,
      "speed": 78,
      "waypoints": [
        {
          "x": 960,
          "y": 1940
        },
        {
          "x": 1920,
          "y": 1320
        },
        {
          "x": 2860,
          "y": 880
        },
        {
          "x": 2120,
          "y": 740
        },
        {
          "x": 1920,
          "y": 1260
        }
      ]
    },
    {
      "frame": "ch10_npc_scholar",
      "name": "西島觀星學者",
      "scale": 0.54,
      "speed": 64,
      "waypoints": [
        {
          "x": 2040,
          "y": 1380
        },
        {
          "x": 2580,
          "y": 1860
        },
        {
          "x": 3360,
          "y": 1540
        },
        {
          "x": 2740,
          "y": 1260
        }
      ]
    },
    {
      "frame": "ch10_npc_scholar",
      "name": "東島星象學者",
      "scale": 0.54,
      "speed": 64,
      "waypoints": [
        {
          "x": 1380,
          "y": 1160
        },
        {
          "x": 1920,
          "y": 1260
        },
        {
          "x": 2440,
          "y": 1040
        },
        {
          "x": 1880,
          "y": 1220
        }
      ]
    }
  ],
  "integratedBuildings": false,
  "modularBuildings": true,
  "portal": {
    "x": 640,
    "y": 2220,
    "imgKey": "ch10_b_portal_v286",
    "imgUrl": "./assets/towns/ch10_b_portal.webp?v=286",
    "scale": 0.64,
    "name": "出城戰鬥傳送門",
    "action": "exit_battle"
  }
};
