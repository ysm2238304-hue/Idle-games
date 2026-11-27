// v286: 第 8 章主城「蒼穹電弧浮空城」— 三層建築重構（純淨底圖＋8棟專屬風格2.5D建築）
export const TOWN_CH8 = {
  "chapterIdx": 7,
  "id": "town_ch8",
  "name": "蒼穹電弧浮空城",
  "subtitle": "第 8 章主城・奧術黃銅龐克與雲端浮島神殿",
  "styleTag": "三層建築重構・四座錯落浮空島奧術群島",
  "mapWidth": 4096,
  "mapHeight": 2560,
  "bgKey": "town_bg_ch8_v297",
  "bgUrl": "./assets/bg/town_ch8.webp?v=297",
  "atlasKey": "town_atlas_ch8",
  "atlasPng": "./assets/towns/atlas_town_ch8.png",
  "atlasJson": "./assets/towns/atlas_town_ch8.json",
  "ambientColor": 3718648,
  "particleColor": 16436245,
  "spawn": {
    "x": 2020,
    "y": 1780
  },
  "walkableZones": [
    {
      "poly": [
        [
          220,
          920
        ],
        [
          840,
          740
        ],
        [
          1380,
          960
        ],
        [
          1320,
          1440
        ],
        [
          720,
          1560
        ],
        [
          220,
          1280
        ]
      ]
    },
    {
      "poly": [
        [
          1540,
          320
        ],
        [
          2060,
          180
        ],
        [
          2540,
          380
        ],
        [
          2480,
          760
        ],
        [
          1980,
          820
        ],
        [
          1540,
          640
        ]
      ]
    },
    {
      "poly": [
        [
          2720,
          860
        ],
        [
          3320,
          700
        ],
        [
          3860,
          920
        ],
        [
          3800,
          1380
        ],
        [
          3220,
          1480
        ],
        [
          2720,
          1240
        ]
      ]
    },
    {
      "poly": [
        [
          1520,
          1600
        ],
        [
          2060,
          1460
        ],
        [
          2580,
          1660
        ],
        [
          2520,
          2140
        ],
        [
          1980,
          2240
        ],
        [
          1520,
          1980
        ]
      ]
    },
    {
      "poly": [
        [
          1080,
          880
        ],
        [
          1740,
          520
        ],
        [
          1860,
          720
        ],
        [
          1200,
          1080
        ]
      ]
    },
    {
      "poly": [
        [
          2280,
          540
        ],
        [
          3020,
          820
        ],
        [
          2920,
          1020
        ],
        [
          2180,
          740
        ]
      ]
    },
    {
      "poly": [
        [
          2920,
          1180
        ],
        [
          3060,
          1340
        ],
        [
          2440,
          1780
        ],
        [
          2280,
          1620
        ]
      ]
    },
    {
      "poly": [
        [
          1120,
          1260
        ],
        [
          1760,
          1580
        ],
        [
          1640,
          1780
        ],
        [
          1000,
          1460
        ]
      ]
    }
  ],
  "landmark": {
    "id": "storm_core",
    "name": "聚雷磁能核心球",
    "frame": "ch8_lm_core",
    "x": 2040,
    "y": 1640,
    "scale": 0.84,
    "imgKey": "ch8_b_beacon_v297",
    "imgUrl": "./assets/towns/ch8_b_beacon.webp?v=297",
    "radius": 65,
    "action": "gimmick_storm_core",
    "tip": "共鳴聚雷磁能核心（5 分鐘 攻速+30% / 技能傷+25% / 爆擊+20%）"
  },
  "facilities": [
    {
      "id": "smith",
      "name": "奧術黃銅避雷針鍛造台",
      "frame": "ch8_bld_smith",
      "x": 680,
      "y": 1020,
      "scale": 1.08,
      "imgKey": "ch8_b_smith_v297",
      "imgUrl": "./assets/towns/ch8_b_smith.webp?v=297",
      "workStyle": "forge",
      "radius": 102,
      "npc": {
        "frame": "ch8_npc_smith",
        "name": "特斯拉",
        "title": "電弧鍛造技師",
        "x": 760,
        "y": 634,
        "scale": 0.62,
        "workStyle": "forge",
        "greeting": "用百萬伏特蒼穹雷電淬火出的黃銅秘銀裝備，揮動時還會帶起電弧！"
      },
      "action": "drawer_upgrade",
      "actionLabel": "開啟電弧鍛造",
      "doorOffset": {
        "x": 0,
        "y": 82
      }
    },
    {
      "id": "guild",
      "name": "風暴飛艇貨運金庫",
      "frame": "ch8_bld_guild",
      "x": 3180,
      "y": 1280,
      "scale": 1.08,
      "imgKey": "ch8_b_guild_v297",
      "imgUrl": "./assets/towns/ch8_b_guild.webp?v=297",
      "workStyle": "guild",
      "radius": 102,
      "npc": {
        "frame": "ch8_npc_guild",
        "name": "巴洛",
        "title": "飛艇船長",
        "x": 2920,
        "y": 1734,
        "scale": 0.62,
        "workStyle": "guild",
        "greeting": "浮空艦隊剛運回一批雲端戰利品，你的裝備全鎖在防雷金庫裡。"
      },
      "action": "drawer_bag",
      "actionLabel": "打開飛艇金庫",
      "doorOffset": {
        "x": 0,
        "y": 82
      }
    },
    {
      "id": "alchemy",
      "name": "雲端星露蒸餾玻璃塔",
      "frame": "ch8_bld_alchemy",
      "x": 1820,
      "y": 480,
      "scale": 1.08,
      "imgKey": "ch8_b_alchemy_v297",
      "imgUrl": "./assets/towns/ch8_b_alchemy.webp?v=297",
      "workStyle": "alchemy",
      "radius": 102,
      "npc": {
        "frame": "ch8_npc_alchemy",
        "name": "賽琳",
        "title": "雲端鍊金學者",
        "x": 2645,
        "y": 654,
        "scale": 0.62,
        "workStyle": "alchemy",
        "greeting": "這瓶高純度雷雲凝露能讓你的反應速度像閃電一樣快！"
      },
      "action": "modal_alchemy",
      "actionLabel": "調配雲端藥劑",
      "doorOffset": {
        "x": 0,
        "y": 82
      }
    },
    {
      "id": "temple",
      "name": "蒼穹翼騎兵演武神殿",
      "frame": "ch8_bld_temple",
      "x": 3160,
      "y": 960,
      "scale": 1.06,
      "imgKey": "ch8_b_temple_v297",
      "imgUrl": "./assets/towns/ch8_b_temple.webp?v=297",
      "workStyle": "prayer",
      "radius": 102,
      "npc": {
        "frame": "ch8_npc_temple",
        "name": "伊莉絲",
        "title": "雷霆女武神",
        "x": 2965,
        "y": 754,
        "scale": 0.62,
        "workStyle": "prayer",
        "greeting": "在雷鳴高塔前必須擁有閃電般的連招節奏，來調整你的技能配置吧！"
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
      "name": "黃銅電弧懸賞觀測塔",
      "frame": "ch8_bld_bounty",
      "x": 1040,
      "y": 1240,
      "scale": 0.82,
      "imgKey": "ch8_b_bounty_v297",
      "imgUrl": "./assets/towns/ch8_b_bounty.webp?v=297",
      "workStyle": "bounty",
      "radius": 65,
      "npc": {
        "frame": "ch8_npc_bounty",
        "name": "艾克",
        "title": "風暴獵鷹隊長",
        "x": 1032,
        "y": 704,
        "scale": 0.62,
        "workStyle": "bounty",
        "greeting": "雷鳴高塔頂端的風暴泰坦與電弧飛龍正在集結，接下懸賞去攔截它們！"
      },
      "action": "modal_bounty",
      "actionLabel": "接取蒼穹懸賞",
      "doorOffset": {
        "x": 0,
        "y": 82
      }
    },
    {
      "id": "market",
      "name": "浮空飛艇零件黑市攤",
      "frame": "ch8_bld_market",
      "x": 2340,
      "y": 1820,
      "scale": 1.06,
      "imgKey": "ch8_b_market_v297",
      "imgUrl": "./assets/towns/ch8_b_market.webp?v=297",
      "workStyle": "market",
      "radius": 102,
      "npc": {
        "frame": "ch8_npc_market",
        "name": "吉茲",
        "title": "機械地精商人",
        "x": 2495,
        "y": 1694,
        "scale": 0.62,
        "workStyle": "market",
        "greeting": "嘻嘻！我從高塔廢墟撿到一堆發光奧術盲盒，敢不敢賭一把神話？"
      },
      "action": "modal_market",
      "actionLabel": "進入飛艇黑市",
      "doorOffset": {
        "x": 0,
        "y": 82
      }
    },
    {
      "id": "altar",
      "name": "雷鳴雲端輪迴聖殿",
      "frame": "ch8_bld_altar",
      "x": 2280,
      "y": 520,
      "scale": 0.95,
      "imgKey": "ch8_b_temple_v297",
      "imgUrl": "./assets/towns/ch8_b_temple.webp?v=297",
      "workStyle": "prayer",
      "radius": 102,
      "npc": {
        "frame": "ch8_npc_altar",
        "name": "宙斯頓",
        "title": "蒼穹大祭司",
        "x": 1395,
        "y": 1152,
        "scale": 0.62,
        "workStyle": "prayer",
        "greeting": "在萬雷轟鳴之上重塑靈魂，讓蒼穹電弧化為你永恆輪迴的烙印。"
      },
      "action": "drawer_rebirth",
      "actionLabel": "開啟蒼穹輪迴",
      "doorOffset": {
        "x": 0,
        "y": 82
      }
    },
    {
      "id": "portal",
      "name": "高壓電弧跳躍傳送塔",
      "frame": "ch8_bld_portal",
      "x": 1980,
      "y": 2060,
      "scale": 0.82,
      "radius": 65,
      "npc": {
        "frame": "ch8_npc_portal",
        "name": "洛克",
        "title": "傳送塔工程師",
        "x": 1775,
        "y": 2308,
        "scale": 0.62,
        "greeting": "線圈電壓已達滿載，隨時可以將你瞬間彈射至雷鳴風暴高塔前線！"
      },
      "action": "modal_portal",
      "actionLabel": "電弧彈射出征",
      "imgKey": "ch8_b_portal_v297",
      "imgUrl": "./assets/towns/ch8_b_portal.webp?v=297",
      "doorOffset": {
        "x": 0,
        "y": 82
      }
    }
  ],
  "extraNpcs": [
    {
      "id": "engineer",
      "frame": "ch8_npc_engineer",
      "name": "艾迪生",
      "title": "風暴首席工程師",
      "x": 2720,
      "y": 1760,
      "scale": 0.64,
      "greeting": "這是我最新設計的蒼穹電弧補給包，拿著這 50,000 金幣和秘藥去大展身手吧！",
      "action": "modal_engineer",
      "actionLabel": "領取首席工程師補給"
    },
    {
      "id": "tesla_coil",
      "frame": "ch8_prop_coil",
      "name": "蓄電共鳴特斯拉線圈",
      "title": "充能機關",
      "x": 2820,
      "y": 760,
      "scale": 0.76,
      "greeting": "釋放線圈內的高壓奧術電流，瞬間恢復全部生命與能量！",
      "action": "gimmick_tesla_coil",
      "actionLabel": "啟動線圈充能（回滿狀態）"
    }
  ],
  "trainingDummy": {
    "id": "dummy",
    "name": "黃銅發條電弧靶偶",
    "frame": "ch8_prop_dummy",
    "x": 3560,
    "y": 1180,
    "scale": 0.72,
    "radius": 42
  },
  "neighborhood": [],
  "props": [],
  "patrols": [
    {
      "frame": "ch8_npc_guard",
      "name": "蒼穹白金盾衛",
      "scale": 0.56,
      "speed": 78,
      "waypoints": [
        {
          "x": 1160,
          "y": 780
        },
        {
          "x": 2120,
          "y": 740
        },
        {
          "x": 2940,
          "y": 820
        },
        {
          "x": 2240,
          "y": 1180
        },
        {
          "x": 1560,
          "y": 1680
        }
      ]
    },
    {
      "frame": "ch8_npc_mechanic",
      "name": "西島飛艇技師",
      "scale": 0.55,
      "speed": 68,
      "waypoints": [
        {
          "x": 1620,
          "y": 1840
        },
        {
          "x": 2340,
          "y": 1860
        },
        {
          "x": 3060,
          "y": 1860
        },
        {
          "x": 3140,
          "y": 1240
        }
      ]
    },
    {
      "frame": "ch8_npc_mechanic",
      "name": "東島線圈技師",
      "scale": 0.55,
      "speed": 68,
      "waypoints": [
        {
          "x": 1220,
          "y": 820
        },
        {
          "x": 1260,
          "y": 1320
        },
        {
          "x": 1440,
          "y": 1720
        },
        {
          "x": 1240,
          "y": 1280
        }
      ]
    }
  ],
  "integratedBuildings": false,
  "modularBuildings": true,
  "portal": {
    "x": 1980,
    "y": 2060,
    "imgKey": "ch8_b_portal_v297",
    "imgUrl": "./assets/towns/ch8_b_portal.webp?v=297",
    "scale": 0.82,
    "name": "出城戰鬥傳送門",
    "action": "exit_battle"
  },
  "blockedZones": [],
  "bridgeZones": []
};
