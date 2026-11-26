// v287: 第 1 章主城「曙光哨站堡壘」— 無空台寫實底圖＋Flood-Fill 100%不透明建築＋寫實木人樁
export const TOWN_CH1 = {
  "chapterIdx": 0,
  "id": "town_ch1",
  "name": "曙光哨站堡壘",
  "subtitle": "第 1 章主城・邊境防線多人共享安全區",
  "styleTag": "三層建築重構・L型邊境石木堡壘",
  "mapWidth": 4096,
  "mapHeight": 2560,
  "bgKey": "town_bg_ch1_v287",
  "bgUrl": "./assets/bg/town_ch1.webp?v=287",
  "atlasKey": "town_atlas_ch1",
  "atlasPng": "./assets/towns/atlas_town_ch1.png",
  "atlasJson": "./assets/towns/atlas_town_ch1.json",
  "ambientColor": 16096779,
  "particleColor": 16486972,
  "modularBuildings": true,
  "integratedBuildings": false,
  "spawn": {
    "x": 2120,
    "y": 1460
  },
  "walkableZones": [
    {
      "x1": 440,
      "y1": 420,
      "x2": 3760,
      "y2": 2280
    }
  ],
  "landmark": {
    "id": "beacon_fire",
    "name": "曙光烽火台",
    "frame": "ch1_lm_beacon",
    "imgKey": "ch1_b_beacon_v287",
    "imgUrl": "./assets/towns/ch1_b_beacon.webp?v=287",
    "x": 2080,
    "y": 1220,
    "scale": 0.62,
    "radius": 52,
    "action": "gimmick_beacon",
    "tip": "點燃曙光烽火台（全城共享曙光祝福 5 分鐘）"
  },
  "facilities": [
    {
      "id": "smith",
      "name": "熾焰鐵匠鋪",
      "frame": "ch1_bld_smith",
      "imgKey": "ch1_b_smith_v287",
      "imgUrl": "./assets/towns/ch1_b_smith.webp?v=287",
      "x": 1560,
      "y": 760,
      "scale": 0.84,
      "radius": 86,
      "doorOffset": {
        "x": 20,
        "y": 72
      },
      "workStyle": "forge",
      "npc": {
        "frame": "ch1_npc_smith",
        "name": "鐵砧・布魯",
        "title": "鍛造大師",
        "x": 1580,
        "y": 832,
        "scale": 0.66,
        "workStyle": "forge",
        "greeting": "只要金幣和材料夠，再破的廢鐵都能敲成神兵！"
      },
      "action": "drawer_upgrade",
      "actionLabel": "開啟強化鍛造"
    },
    {
      "id": "alchemy",
      "name": "祕法煉金工坊",
      "frame": "ch1_bld_alchemy",
      "imgKey": "ch1_b_alchemy_v287",
      "imgUrl": "./assets/towns/ch1_b_alchemy.webp?v=287",
      "x": 1120,
      "y": 1020,
      "scale": 0.82,
      "radius": 82,
      "doorOffset": {
        "x": 15,
        "y": 72
      },
      "workStyle": "alchemy",
      "npc": {
        "frame": "ch1_npc_alchemy",
        "name": "艾莉絲",
        "title": "祕法煉金師",
        "x": 1135,
        "y": 1092,
        "scale": 0.64,
        "workStyle": "alchemy",
        "greeting": "剛熬好的深淵抗性秘藥，出城前記得帶幾瓶！"
      },
      "action": "modal_alchemy",
      "actionLabel": "開啟煉金秘藥"
    },
    {
      "id": "guild",
      "name": "冒險者公會兵營",
      "frame": "ch1_bld_guild",
      "imgKey": "ch1_b_guild_v287",
      "imgUrl": "./assets/towns/ch1_b_guild.webp?v=287",
      "x": 2360,
      "y": 640,
      "scale": 0.86,
      "radius": 88,
      "doorOffset": {
        "x": 0,
        "y": 74
      },
      "workStyle": "guild",
      "npc": {
        "frame": "ch1_npc_guild",
        "name": "指揮官・加雷斯",
        "title": "邊境公會長",
        "x": 2360,
        "y": 714,
        "scale": 0.66,
        "workStyle": "guild",
        "greeting": "邊境戰況吃緊，先整頓好流派技能再帶隊出征！"
      },
      "action": "drawer_skills",
      "actionLabel": "技能樹與流派配置"
    },
    {
      "id": "temple",
      "name": "聖光禮拜堂",
      "frame": "ch1_bld_temple",
      "imgKey": "ch1_b_temple_v287",
      "imgUrl": "./assets/towns/ch1_b_temple.webp?v=287",
      "x": 3180,
      "y": 1440,
      "scale": 0.84,
      "radius": 86,
      "doorOffset": {
        "x": -10,
        "y": 74
      },
      "workStyle": "prayer",
      "npc": {
        "frame": "ch1_npc_temple",
        "name": "修女・賽琳娜",
        "title": "聖光祭司",
        "x": 3170,
        "y": 1514,
        "scale": 0.64,
        "workStyle": "prayer",
        "greeting": "願聖光洗去你的疲憊，在此可進行輪迴轉生。"
      },
      "action": "drawer_rebirth",
      "actionLabel": "開啟聖殿轉生"
    },
    {
      "id": "market",
      "name": "邊境黑市商篷",
      "frame": "ch1_bld_market",
      "imgKey": "ch1_b_market_v287",
      "imgUrl": "./assets/towns/ch1_b_market.webp?v=287",
      "x": 3240,
      "y": 1820,
      "scale": 0.84,
      "radius": 84,
      "doorOffset": {
        "x": -18,
        "y": 74
      },
      "workStyle": "market",
      "npc": {
        "frame": "ch1_npc_market",
        "name": "行商・馬爾科",
        "title": "黑市珍寶商",
        "x": 3222,
        "y": 1894,
        "scale": 0.64,
        "workStyle": "market",
        "greeting": "遠道而來的稀世奇珍，來賭一把手氣吧！"
      },
      "action": "modal_market",
      "actionLabel": "開啟黑市商隊"
    },
    {
      "id": "bounty",
      "name": "懸賞告示欄",
      "frame": "ch1_bld_bounty",
      "imgKey": "ch1_b_bounty_v287",
      "imgUrl": "./assets/towns/ch1_b_bounty.webp?v=287",
      "x": 1520,
      "y": 1220,
      "scale": 0.62,
      "radius": 52,
      "doorOffset": {
        "x": 10,
        "y": 64
      },
      "workStyle": "bounty",
      "npc": {
        "frame": "ch1_npc_bounty",
        "name": "斥候・羅恩",
        "title": "懸賞管理官",
        "x": 1530,
        "y": 1284,
        "scale": 0.64,
        "workStyle": "bounty",
        "greeting": "今日懸賞名單更新了，擊殺目標賞金豐厚！"
      },
      "action": "modal_bounty",
      "actionLabel": "查看懸賞委託"
    }
  ],
  "portal": {
    "x": 1180,
    "y": 1760,
    "name": "出城戰鬥傳送門",
    "imgKey": "ch1_b_portal_v287",
    "imgUrl": "./assets/towns/ch1_b_portal.webp?v=287",
    "scale": 0.62,
    "action": "exit_battle"
  },
  "trainingDummy": {
    "name": "邊境演武木人樁",
    "frame": "ch1_prop_crate",
    "x": 2660,
    "y": 1240,
    "scale": 0.62,
    "radius": 34
  },
  "decorations": [],
  "patrols": [
    {
      "name": "曙光城防衛兵",
      "frame": "ch1_npc_guard",
      "speed": 74,
      "scale": 0.62,
      "waypoints": [
        {
          "x": 1260,
          "y": 1660
        },
        {
          "x": 2120,
          "y": 1460
        },
        {
          "x": 2740,
          "y": 1060
        },
        {
          "x": 3180,
          "y": 780
        },
        {
          "x": 2180,
          "y": 1340
        }
      ]
    },
    {
      "name": "邊境巡邏斥候",
      "frame": "ch1_npc_bounty",
      "speed": 82,
      "scale": 0.62,
      "waypoints": [
        {
          "x": 1560,
          "y": 960
        },
        {
          "x": 1880,
          "y": 1360
        },
        {
          "x": 2580,
          "y": 1620
        },
        {
          "x": 2980,
          "y": 1740
        },
        {
          "x": 2360,
          "y": 1480
        }
      ]
    }
  ]
};
