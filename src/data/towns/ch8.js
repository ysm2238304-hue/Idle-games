// v312: 第 8 章主城「蒼穹電弧浮空城」— 演武場重構與 NPC 門口精準校準
export const TOWN_CH8 = {
  "chapterIdx": 7,
  "id": "town_ch8",
  "name": "蒼穹電弧浮空城",
  "subtitle": "第 8 章主城・奧術黃銅龐克與雲端浮島神殿",
  "styleTag": "v304開闊四象限十字・蒼穹電弧白金大理石廣場",
  "mapWidth": 4096,
  "mapHeight": 2560,
  "bgKey": "town_bg_ch8_v304",
  "bgUrl": "./assets/bg/town_ch8.webp?v=304",
  "atlasKey": "town_atlas_ch8",
  "atlasPng": "./assets/towns/atlas_town_ch8.png",
  "atlasJson": "./assets/towns/atlas_town_ch8.json",
  "ambientColor": 3718648,
  "particleColor": 16436245,
  "spawn": {
    "x": 2048,
    "y": 1220
  },
  "walkableZones": [
    {
      "poly": [
        [
          2048,
          240
        ],
        [
          3560,
          990
        ],
        [
          2048,
          2100
        ],
        [
          536,
          990
        ]
      ]
    }
  ],
  "landmark": {
    "id": "storm_core",
    "name": "聚雷磁能核心球",
    "frame": "ch8_lm_core",
    "x": 2048,
    "y": 920,
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
      "x": 1540,
      "y": 740,
      "scale": 1.08,
      "imgKey": "ch8_b_smith_v297",
      "imgUrl": "./assets/towns/ch8_b_smith.webp?v=297",
      "workStyle": "forge",
      "radius": 102,
      "npc": {
        "frame": "ch8_npc_smith",
        "name": "特斯拉",
        "title": "電弧鍛造技師",
        "scale": 0.62,
        "workStyle": "forge",
        "greeting": "用百萬伏特蒼穹雷電淬火出的黃銅秘銀裝備，揮動時還會帶起電弧！",
        "x": 1540,
        "y": 824
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
      "x": 3020,
      "y": 1020,
      "scale": 1.08,
      "imgKey": "ch8_b_guild_v297",
      "imgUrl": "./assets/towns/ch8_b_guild.webp?v=297",
      "workStyle": "guild",
      "radius": 102,
      "npc": {
        "frame": "ch8_npc_guild",
        "name": "巴洛",
        "title": "飛艇船長",
        "scale": 0.62,
        "workStyle": "guild",
        "greeting": "浮空艦隊剛運回一批雲端戰利品，你的裝備全鎖在防雷金庫裡。",
        "x": 3020,
        "y": 1104
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
      "x": 2560,
      "y": 740,
      "scale": 1.08,
      "imgKey": "ch8_b_alchemy_v297",
      "imgUrl": "./assets/towns/ch8_b_alchemy.webp?v=297",
      "workStyle": "alchemy",
      "radius": 102,
      "npc": {
        "frame": "ch8_npc_alchemy",
        "name": "賽琳",
        "title": "雲端鍊金學者",
        "scale": 0.62,
        "workStyle": "alchemy",
        "greeting": "這瓶高純度雷雲凝露能讓你的反應速度像閃電一樣快！",
        "x": 2560,
        "y": 824
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
      "x": 2048,
      "y": 520,
      "scale": 1.06,
      "imgKey": "ch8_b_temple_v297",
      "imgUrl": "./assets/towns/ch8_b_temple.webp?v=297",
      "workStyle": "prayer",
      "radius": 102,
      "npc": {
        "frame": "ch8_npc_temple",
        "name": "伊莉絲",
        "title": "雷霆女武神",
        "scale": 0.62,
        "workStyle": "prayer",
        "greeting": "在雷鳴高塔前必須擁有閃電般的連招節奏，來調整你的技能配置吧！",
        "x": 2048,
        "y": 604
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
      "x": 1080,
      "y": 1020,
      "scale": 0.82,
      "imgKey": "ch8_b_bounty_v297",
      "imgUrl": "./assets/towns/ch8_b_bounty.webp?v=297",
      "workStyle": "bounty",
      "radius": 65,
      "npc": {
        "frame": "ch8_npc_bounty",
        "name": "艾克",
        "title": "風暴獵鷹隊長",
        "scale": 0.62,
        "workStyle": "bounty",
        "greeting": "雷鳴高塔頂端的風暴泰坦與電弧飛龍正在集結，接下懸賞去攔截它們！",
        "x": 1080,
        "y": 1104
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
      "x": 2620,
      "y": 1460,
      "scale": 1.06,
      "imgKey": "ch8_b_market_v297",
      "imgUrl": "./assets/towns/ch8_b_market.webp?v=297",
      "workStyle": "market",
      "radius": 102,
      "npc": {
        "frame": "ch8_npc_market",
        "name": "吉茲",
        "title": "機械地精商人",
        "scale": 0.62,
        "workStyle": "market",
        "greeting": "嘻嘻！我從高塔廢墟撿到一堆發光奧術盲盒，敢不敢賭一把神話？",
        "x": 2620,
        "y": 1544
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
      "x": 2048,
      "y": 1780,
      "scale": 0.95,
      "imgKey": "ch8_b_temple_v297",
      "imgUrl": "./assets/towns/ch8_b_temple.webp?v=297",
      "workStyle": "prayer",
      "radius": 102,
      "npc": {
        "frame": "ch8_npc_altar",
        "name": "宙斯頓",
        "title": "蒼穹大祭司",
        "scale": 0.62,
        "workStyle": "prayer",
        "greeting": "在萬雷轟鳴之上重塑靈魂，讓蒼穹電弧化為你永恆輪迴的烙印。",
        "x": 2048,
        "y": 1864
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
      "x": 1460,
      "y": 1460,
      "scale": 0.82,
      "radius": 65,
      "npc": {
        "frame": "ch8_npc_portal",
        "name": "洛克",
        "title": "傳送塔工程師",
        "scale": 0.62,
        "greeting": "線圈電壓已達滿載，隨時可以將你瞬間彈射至雷鳴風暴高塔前線！",
        "x": 1460,
        "y": 1544
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
      "x": 1660,
      "y": 1140,
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
      "x": 2380,
      "y": 1280,
      "scale": 0.76,
      "greeting": "釋放線圈內的高壓奧術電流，瞬間恢復全部生命與能量！",
      "action": "gimmick_tesla_coil",
      "actionLabel": "啟動線圈充能（回滿狀態）"
    }
  ],
  "trainingDummy": {
    "id": "dummy",
    "name": "蒼穹電弧演武穹台",
    "frame": "ch8_prop_dummy",
    "x": 2620,
    "y": 1080,
    "scale": 0.76,
    "radius": 84,
    "imgKey": "ch8_arena_v312",
    "imgUrl": "./assets/towns/ch8_arena.webp?v=312"
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
          "x": 1460,
          "y": 1080
        },
        {
          "x": 2520,
          "y": 1080
        },
        {
          "x": 2520,
          "y": 1340
        },
        {
          "x": 1460,
          "y": 1340
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
          "x": 1680,
          "y": 860
        },
        {
          "x": 2420,
          "y": 860
        },
        {
          "x": 2420,
          "y": 1480
        },
        {
          "x": 1680,
          "y": 1480
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
          "x": 2048,
          "y": 720
        },
        {
          "x": 2048,
          "y": 1520
        }
      ]
    }
  ],
  "integratedBuildings": false,
  "modularBuildings": true,
  "portal": {
    "x": 1460,
    "y": 1460,
    "imgKey": "ch8_b_portal_v297",
    "imgUrl": "./assets/towns/ch8_b_portal.webp?v=297",
    "scale": 0.82,
    "name": "出城戰鬥傳送門",
    "action": "exit_battle"
  }
};
