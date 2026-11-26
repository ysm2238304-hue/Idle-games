// v279: 第 1 章主城「曙光哨站堡壘」— L 型邊境要塞與閱兵大道非對稱重構（4096x2560）
export const TOWN_CH1 = {
  "chapterIdx": 0,
  "id": "town_ch1",
  "name": "曙光哨站堡壘",
  "subtitle": "第 1 章主城・邊境防線多人共享安全區",
  "styleTag": "L型邊境石砌堡壘・閱兵大道",
  "mapWidth": 4096,
  "mapHeight": 2560,
  "bgKey": "town_bg_ch1_v279",
  "bgUrl": "./assets/bg/town_ch1.webp?v=279",
  "atlasKey": "town_atlas_ch1",
  "atlasPng": "./assets/towns/atlas_town_ch1.png",
  "atlasJson": "./assets/towns/atlas_town_ch1.json",
  "ambientColor": 16096779,
  "particleColor": 16486972,
  "spawn": {
    "x": 2420,
    "y": 1580
  },
  "walkableZones": [
    {
      "x1": 560,
      "y1": 440,
      "x2": 3820,
      "y2": 2340
    }
  ],
  "landmark": {
    "id": "beacon_fire",
    "name": "曙光烽火台",
    "frame": "ch1_lm_beacon",
    "imgKey": "ch1_lm_beacon_v267",
    "imgUrl": "./assets/towns/ch1_lm_beacon.webp?v=267",
    "x": 2860,
    "y": 1290,
    "scale": 0.78,
    "radius": 122,
    "action": "gimmick_beacon",
    "tip": "點燃曙光烽火台（全城共享曙光祝福 5 分鐘）"
  },
  "facilities": [
    {
      "id": "guild",
      "name": "冒險者公會大廳",
      "frame": "ch1_bld_guild",
      "imgKey": "ch1_bld_guild_v267",
      "imgUrl": "./assets/towns/ch1_bld_guild.webp?v=267",
      "x": 3240,
      "y": 560,
      "scale": 0.98,
      "radius": 145,
      "workStyle": "guild",
      "npc": {
        "frame": "ch1_npc_guild",
        "name": "指揮官・加雷斯",
        "title": "邊境公會長",
        "x": 3120,
        "y": 780,
        "scale": 0.66,
        "workStyle": "guild",
        "greeting": "邊境戰況吃緊，先整頓好流派技能再帶隊出征！"
      },
      "action": "drawer_skills",
      "actionLabel": "技能樹與流派配置"
    },
    {
      "id": "smith",
      "name": "熾焰鐵匠鋪",
      "frame": "ch1_bld_smith",
      "imgKey": "ch1_bld_smith_v267",
      "imgUrl": "./assets/towns/ch1_bld_smith.webp?v=267",
      "x": 1340,
      "y": 860,
      "scale": 0.96,
      "radius": 142,
      "workStyle": "forge",
      "npc": {
        "frame": "ch1_npc_smith",
        "name": "鐵砧・布魯",
        "title": "鍛造大師",
        "x": 1510,
        "y": 1020,
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
      "imgKey": "ch1_bld_alchemy_v267",
      "imgUrl": "./assets/towns/ch1_bld_alchemy.webp?v=267",
      "x": 2120,
      "y": 1180,
      "scale": 0.94,
      "radius": 138,
      "workStyle": "alchemy",
      "npc": {
        "frame": "ch1_npc_alchemy",
        "name": "艾莉絲",
        "title": "祕法煉金師",
        "x": 2240,
        "y": 1420,
        "scale": 0.64,
        "workStyle": "alchemy",
        "greeting": "剛熬好的深淵抗性秘藥，出城前記得帶幾瓶！"
      },
      "action": "modal_alchemy",
      "actionLabel": "開啟煉金秘藥"
    },
    {
      "id": "temple",
      "name": "聖光禮拜堂",
      "frame": "ch1_bld_temple",
      "imgKey": "ch1_bld_temple_v267",
      "imgUrl": "./assets/towns/ch1_bld_temple.webp?v=267",
      "x": 2480,
      "y": 2180,
      "scale": 0.98,
      "radius": 145,
      "workStyle": "prayer",
      "npc": {
        "frame": "ch1_npc_temple",
        "name": "修女・賽琳娜",
        "title": "聖光祭司",
        "x": 2460,
        "y": 1960,
        "scale": 0.64,
        "workStyle": "prayer",
        "greeting": "願聖光洗去你的疲憊，在此可進行輪迴轉生。"
      },
      "action": "drawer_rebirth",
      "actionLabel": "開啟聖殿轉生"
    },
    {
      "id": "bounty",
      "name": "懸賞告示亭",
      "frame": "ch1_bld_bounty",
      "imgKey": "ch1_bld_bounty_v267",
      "imgUrl": "./assets/towns/ch1_bld_bounty.webp?v=267",
      "x": 1560,
      "y": 1860,
      "scale": 0.88,
      "radius": 128,
      "workStyle": "bounty",
      "npc": {
        "frame": "ch1_npc_bounty",
        "name": "斥候・羅恩",
        "title": "懸賞管理官",
        "x": 1740,
        "y": 1760,
        "scale": 0.64,
        "workStyle": "bounty",
        "greeting": "今日懸賞名單更新了，擊殺目標賞金豐厚！"
      },
      "action": "modal_bounty",
      "actionLabel": "查看懸賞委託"
    },
    {
      "id": "market",
      "name": "邊境商隊市集",
      "frame": "ch1_bld_market",
      "imgKey": "ch1_bld_market_v267",
      "imgUrl": "./assets/towns/ch1_bld_market.webp?v=267",
      "x": 3560,
      "y": 1940,
      "scale": 0.94,
      "radius": 138,
      "workStyle": "market",
      "npc": {
        "frame": "ch1_npc_market",
        "name": "行商・馬爾科",
        "title": "黑市珍寶商",
        "x": 3320,
        "y": 1850,
        "scale": 0.64,
        "workStyle": "market",
        "greeting": "遠道而來的稀世奇珍，來賭一把手氣吧！"
      },
      "action": "modal_market",
      "actionLabel": "開啟黑市商隊"
    }
  ],
  "portal": {
    "x": 960,
    "y": 2140,
    "name": "出城戰鬥傳送門",
    "action": "exit_battle"
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
          "x": 1220,
          "y": 1940
        },
        {
          "x": 2320,
          "y": 1740
        },
        {
          "x": 2940,
          "y": 1420
        },
        {
          "x": 3080,
          "y": 840
        },
        {
          "x": 2660,
          "y": 1320
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
          "x": 1540,
          "y": 1120
        },
        {
          "x": 1920,
          "y": 1560
        },
        {
          "x": 2860,
          "y": 1680
        },
        {
          "x": 3240,
          "y": 1820
        },
        {
          "x": 2440,
          "y": 1880
        }
      ]
    }
  ]
};
