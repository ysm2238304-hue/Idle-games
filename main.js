/**
 * 全域狀態數據（玩家等級與金幣）
 */
const GameState = {
    level: 1,
    gold: 0,
    maxMonsterHp: 100
};

/**
 * 更新頂部 HTML UI 狀態列
 */
function updateTopUI() {
    const levelEl = document.getElementById('player-level');
    const goldEl = document.getElementById('player-gold');

    if (levelEl) {
        levelEl.textContent = `Lv.${GameState.level}`;
    }
    if (goldEl) {
        goldEl.textContent = `金幣: ${GameState.gold}`;
    }
}

/**
 * 獲取當前時間戳字串，格式為 [HH:MM:SS]
 */
function getTimeString() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `[${hours}:${minutes}:${seconds}]`;
}

/**
 * 追加戰鬥日誌至底部並自動滾動
 */
function addLog(text, type = 'normal') {
    const logContainer = document.getElementById('log-content');
    if (!logContainer) return;

    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;

    const timeSpan = document.createElement('span');
    timeSpan.className = 'timestamp';
    timeSpan.textContent = getTimeString();

    const messageSpan = document.createElement('span');
    messageSpan.textContent = text;

    entry.appendChild(timeSpan);
    entry.appendChild(messageSpan);
    logContainer.appendChild(entry);

    // 限制日誌最大行數
    while (logContainer.children.length > 150) {
        logContainer.removeChild(logContainer.firstChild);
    }

    logContainer.scrollTop = logContainer.scrollHeight;
}

/**
 * Phaser 3 主戰鬥場景類別
 */
class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });

        this.player = null;
        this.playerLabel = null;
        this.monster = null;
        this.monsterHpText = null;
        this.attackTimer = null;
        this.respawnTimer = null;
        this.isMonsterAlive = false;
        this.monsterBaseX = 0;
        this.monsterBaseY = 0;
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // 1. 生成玩家
        const playerX = width * 0.25;
        const playerY = height * 0.5;
        this.player = this.add.rectangle(playerX, playerY, 60, 80, 0x3498db);
        this.player.setStrokeStyle(2, 0xffffff, 0.8);

        this.playerLabel = this.add.text(playerX, playerY - 58, 'Player', {
            fontFamily: 'sans-serif', fontSize: '14px', color: '#66ccff', fontStyle: 'bold'
        }).setOrigin(0.5);

        // 2. 生成怪物
        this.monsterBaseX = width * 0.75;
        this.monsterBaseY = height * 0.5;
        this.monster = this.add.rectangle(this.monsterBaseX, this.monsterBaseY, 60, 80, 0xe74c3c);
        this.monster.setStrokeStyle(2, 0xffffff, 0.8);
        this.monster.hp = GameState.maxMonsterHp;
        this.isMonsterAlive = true;

        this.monsterHpText = this.add.text(
            this.monsterBaseX, this.monsterBaseY - 58,
            `HP: ${this.monster.hp}/${GameState.maxMonsterHp}`,
            { fontFamily: 'sans-serif', fontSize: '14px', color: '#ff9999', fontStyle: 'bold' }
        ).setOrigin(0.5);

        // 3. 監聽視窗尺寸變化
        this.scale.on('resize', this.handleResize, this);

        // 4. 戰鬥循環定時器
        this.attackTimer = this.time.addEvent({
            delay: 1500,
            callback: this.performAttack,
            callbackScope: this,
            loop: true
        });

        // 5. 初始 UI
        updateTopUI();
        addLog('戰鬥開始！自動掛機系統已啟動。', 'system');
    }

    handleResize(gameSize) {
        const width = gameSize.width;
        const height = gameSize.height;

        if (this.player) {
            const playerX = width * 0.25;
            const playerY = height * 0.5;
            this.player.setPosition(playerX, playerY);
            if (this.playerLabel) this.playerLabel.setPosition(playerX, playerY - 58);
        }

        this.monsterBaseX = width * 0.75;
        this.monsterBaseY = height * 0.5;

        if (this.monster) this.monster.setPosition(this.monsterBaseX, this.monsterBaseY);
        if (this.monsterHpText) this.monsterHpText.setPosition(this.monsterBaseX, this.monsterBaseY - 58);
    }

    performAttack() {
        if (!this.isMonsterAlive || !this.monster || !this.monster.active) return;

        const damage = Phaser.Math.Between(10, 20);
        this.monster.hp = Math.max(0, this.monster.hp - damage);

        if (this.monsterHpText) {
            this.monsterHpText.setText(`HP: ${this.monster.hp}/${GameState.maxMonsterHp}`);
        }

        addLog(`對 Lv.1 怪物造成 ${damage} 點傷害！`);

        this.tweens.add({
            targets: this.player,
            x: (this.scale.width * 0.25) + 12,
            duration: 70,
            yoyo: true,
            ease: 'Power1'
        });

        this.playMonsterHitEffect();
        this.spawnDamageText(damage);

        if (this.monster.hp <= 0) {
            this.handleMonsterDefeat();
        }
    }

    playMonsterHitEffect() {
        if (!this.monster || !this.monster.active) return;

        this.tweens.killTweensOf(this.monster);
        this.monster.x = this.monsterBaseX;

        this.tweens.add({
            targets: this.monster,
            x: { from: this.monsterBaseX - 8, to: this.monsterBaseX + 8 },
            duration: 45,
            repeat: 3,
            yoyo: true,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                if (this.monster) this.monster.x = this.monsterBaseX;
            }
        });
    }

    spawnDamageText(damage) {
        const startX = this.monsterBaseX;
        const startY = this.monsterBaseY - (this.monster.height / 2) - 15;

        const dmgText = this.add.text(startX, startY, `-${damage}`, {
            fontFamily: 'sans-serif', fontSize: '24px', fontStyle: 'bold',
            color: '#ff3333', stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5);

        this.tweens.add({
            targets: dmgText,
            y: startY - 50,
            alpha: { from: 1, to: 0 },
            duration: 1000,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                if (dmgText && dmgText.scene) dmgText.destroy();
            }
        });
    }

    handleMonsterDefeat() {
        this.isMonsterAlive = false;

        this.tweens.killTweensOf(this.monster);
        this.monster.setPosition(this.monsterBaseX, this.monsterBaseY);
        this.monster.setVisible(false);
        this.monster.setActive(false);

        if (this.monsterHpText) this.monsterHpText.setVisible(false);

        GameState.gold += 5;
        updateTopUI();

        addLog('擊敗 Lv.1 怪物，獲得金幣 +5！', 'victory');

        this.respawnTimer = this.time.delayedCall(2000, this.respawnMonster, [], this);
    }

    respawnMonster() {
        if (!this.monster) return;

        this.monster.hp = GameState.maxMonsterHp;
        this.monster.setPosition(this.monsterBaseX, this.monsterBaseY);
        this.monster.setAlpha(0);
        this.monster.setVisible(true);
        this.monster.setActive(true);

        if (this.monsterHpText) {
            this.monsterHpText.setText(`HP: ${this.monster.hp}/${GameState.maxMonsterHp}`);
            this.monsterHpText.setPosition(this.monsterBaseX, this.monsterBaseY - 58);
            this.monsterHpText.setVisible(true);
        }

        this.tweens.add({
            targets: this.monster,
            alpha: { from: 0, to: 1 },
            duration: 250,
            ease: 'Quad.easeOut',
            onComplete: () => {
                this.isMonsterAlive = true;
                addLog('新的 Lv.1 怪物出現了！(HP: 100)', 'system');
            }
        });
    }
}

/**
 * Phaser 3 遊戲實例配置與啟動
 */
window.addEventListener('DOMContentLoaded', () => {
    const config = {
        type: Phaser.AUTO,
        parent: 'game-container',
        backgroundColor: '#333333',
        scale: {
            mode: Phaser.Scale.RESIZE,
            width: '100%',
            height: '100%',
            autoCenter: Phaser.Scale.NO_CENTER
        },
        scene: [MainScene]
    };

    window.game = new Phaser.Game(config);
});