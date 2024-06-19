class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    preload() {
        this.load.image('map_blur', '/assets/mapablur.png');
    }

    create() {
        let map = this.add.image(400, 300, 'map_blur');
        map.setDisplaySize(800, 600);

        let playButton = this.add.text(350, 250, 'Jogar', { fontSize: '48px', fill: '#fff' })
            .setInteractive()
            .on('pointerdown', () => this.startGame());

        let exitButton = this.add.text(350, 350, 'Sair', { fontSize: '48px', fill: '#fff' })
            .setInteractive()
            .on('pointerdown', () => this.exitGame());
    }

    startGame() {
        this.scene.start('MainScene');
    }

    exitGame() {
        console.log('Sair do Jogo');
    }
}

class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    preload() {
        this.load.image('bullet', '/assets/bullet.webp');
        this.load.image('soldier1', '/assets/soldier1.png');
        this.load.image('soldier2', '/assets/soldier2.png');
        this.load.image('soldier3', '/assets/soldier3.png');
        this.load.image('soldier4', '/assets/soldier4.png');
        this.load.image('shield', '/assets/shield.png');
        this.load.image('tower1', '/assets/tower.png');
        this.load.image('tower2', '/assets/tower2.png');
        this.load.image('map', '/assets/mapa.webp');
        this.load.image('enemy1', '/assets/enemy1.png');
        this.load.image('enemy2', '/assets/enemy2.png');
        this.load.image('enemy3', '/assets/enemy3.png');
        this.load.image('bomb', '/assets/bomb.webp');
        this.load.image('heart', '/assets/heart.png');
        this.load.image('green_heart', '/assets/green_heart.png');
        this.load.image('coin', '/assets/coin.png');
        this.load.image('timer', '/assets/timer.png');
        this.load.image('explosion', '/assets/explosao.png');
        this.load.image('molduraazul', '/assets/molduraazul.png');
        this.load.image('molduraroxa', '/assets/molduraroxa.png');
        this.load.image('fundopreto', '/assets/fundopreto.png');
    }

    create() {
        let map = this.add.image(400, 300, 'map');
        map.setDisplaySize(800, 600);

        spawnRandomTowers.call(this);

        bullets = this.physics.add.group({
            classType: Phaser.Physics.Arcade.Sprite,
            createCallback: function (bullet) {
                bullet.setActive(false).setVisible(false);
            }
        });

        enemies = this.physics.add.group({
            classType: Phaser.Physics.Arcade.Sprite,
            immovable: true
        });

        this.enemyCount = 0;
        this.enemiesToSpawn = 1; //n inicial de enimigos

        this.scheduleNextEnemySpawn();
        this.time.addEvent({ //Aumentar numero de spawn a cada 30 seg
            delay: 30000,
            callback: () => {
                this.enemiesToSpawn += 1;
            },
            callbackScope: this,
            loop: true
        });

        this.physics.add.collider(bullets, enemies, function (bullet, enemy) {
            bullet.destroy();
            enemy.health -= bullet.damage;
            if (enemy.health <= 0) {
                coins += enemy.coinReward; //Aumentar moedas conforme inimigo
                coinText.setText(coins);
                enemy.healthBar.destroy();
                enemy.heartIcon.destroy();
                enemy.destroy();
            }
        }, null, this);

        coinIcon = this.add.image(20, 70, 'coin').setScale(0.15);
        coinText = this.add.text(40, 60, coins, { fontSize: '32px', fill: '#fff' });

        let timerIcon = this.add.image(20, 20, 'timer').setScale(0.10);
        timeText = this.add.text(50, 20, '0 Seconds', { fontSize: '24px', fill: '#fff' });

        let shopBackground = this.add.image(850, 200, 'fundopreto').setScale(1.1, 3);
        shopBackground.setAlpha(0.5);

        //espaço entre itens
        const shopItems = soldierConfigs.length + 2; //soldados, bomba e shield
        const spacing = 95;

        soldierConfigs.forEach((config, index) => {
            let yPosition = 48 + (index) * spacing;
            let frame = this.add.image(727, yPosition, 'molduraazul').setScale(1.5, 0.8);
            let button = this.add.image(690, yPosition, config.texture).setScale(config.scale).setInteractive();
            button.on('pointerdown', () => {
                selectSoldier(index);
            });

            this.add.image(740, yPosition, 'coin').setScale(0.15);
            this.add.text(760, yPosition - 10, config.price, { fontSize: '16px', fill: '#fff' });
        });

        let bombYPosition = 50 + (soldierConfigs.length) * spacing;
        let bombFrame = this.add.image(875, bombYPosition, 'molduraroxa').setScale(1.5, 0.3);
        let bombButton = this.add.image(690, bombYPosition, 'bomb').setScale(0.15).setInteractive();
        bombButton.on('pointerdown', () => {
            selectBomb();
        });
        this.add.image(740, bombYPosition, 'coin').setScale(0.15);
        this.add.text(760, bombYPosition - 10, 1000, { fontSize: '16px', fill: '#fff' });

        let shieldYPosition = 54 + (soldierConfigs.length + 1) * spacing;
        let shieldFrame = this.add.image(875, shieldYPosition, 'molduraroxa').setScale(1.5, 0.3);
        let shieldButton = this.add.image(690, shieldYPosition, 'shield').setScale(0.25).setInteractive();
        shieldButton.on('pointerdown', () => {
            selectShield();
            // Chamar função applyShieldToTower quando o botão de escudo for clicado
            applyShieldToTower(getTowerAtPointer.call(this, this.input.activePointer));
        });

        this.add.image(750, shieldYPosition, 'coin').setScale(0.15);
        this.add.text(770, shieldYPosition - 10, 500, { fontSize: '16px', fill: '#fff' });

        this.input.on('pointerdown', function (pointer) {
            if (selectedSoldier !== null) {
                let config = soldierConfigs[selectedSoldier];
                if (!this.draggedSoldier) {
                    this.draggedSoldier = this.add.sprite(pointer.x, pointer.y, config.texture).setScale(config.scale).setInteractive();
                    this.input.setDraggable(this.draggedSoldier);
                    this.draggedSoldier.on('drag', (pointer, dragX, dragY) => {
                        this.draggedSoldier.x = dragX;
                        this.draggedSoldier.y = dragY;
                    });

                    this.draggedSoldier.on('dragend', (pointer) => {
                        placeSoldier.call(this, this.draggedSoldier.x, this.draggedSoldier.y);
                        this.draggedSoldier.destroy(); //Remover depois de colocar
                        this.draggedSoldier = null;
                    }, this);
                }
            } else if (selectedBomb) {
                if (!this.draggedBomb) {
                    this.draggedBomb = this.add.sprite(pointer.x, pointer.y, 'bomb').setScale(0.15).setInteractive();
                    this.input.setDraggable(this.draggedBomb);
                    this.draggedBomb.on('drag', (pointer, dragX, dragY) => {
                        this.draggedBomb.x = dragX;
                        this.draggedBomb.y = dragY;
                    });

                    this.draggedBomb.on('dragend', (pointer) => {
                        placeBomb.call(this, this.draggedBomb.x, this.draggedBomb.y);
                        this.draggedBomb.destroy();
                        this.draggedBomb = null;
                    }, this);
                }
            } else if (selectedShield) {
                let tower = getTowerAtPointer.call(this, pointer);
                if (tower) {
                    applyShieldToTower.call(this, tower);
                }
            }
        }, this);

        this.fireBullet = fireBullet.bind(this);

        recordIcon = this.add.image(20, 580, 'timer').setScale(0.10);
        recordText = this.add.text(50, 570, 'Session Record: ' + sessionRecord + ' Seconds', { fontSize: '24px', fill: '#fff' });
    }

    update(time, delta) {
        gameTime += delta / 1000;
        timeText.setText('- ' + Math.floor(gameTime) + ' Seconds');

        //Reduzir o tempo de spawn inimigos
        if (gameTime % 45 === 0) {
            if (this.time.delay > 1000) {
                this.time.delay -= 1000; //diminuir 1 seg até chegar a 1 seg
            } else if (this.time.delay == 1000) {
                this.time.delay = 500; // Minimo 0.5 seg
            }
        }

        Phaser.Actions.Call(enemies.getChildren(), function (enemy) {
            moveEnemyAlongPath(enemy);
            updateHealthBar(enemy);
        }, this);

        soldiers.forEach(soldier => {
            if (soldier.bullets > 0) {
                let closestEnemy = null;
                let closestDistance = Infinity;

                Phaser.Actions.Call(enemies.getChildren(), function (enemy) {
                    let distance = Phaser.Math.Distance.Between(soldier.x, soldier.y, enemy.x, enemy.y);
                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestEnemy = enemy;
                    }
                }, this);

                if (closestEnemy && closestDistance <= 150 && time > soldier.lastFired) {
                    this.fireBullet(soldier, closestEnemy);
                    soldier.lastFired = time + soldier.fireDelay;
                    if (closestEnemy.x < soldier.x) {
                        soldier.setFlipX(true);
                    } else {
                        soldier.setFlipX(false);
                    }
                    soldier.bullets--;
                    updateBulletBar(soldier);
                }
            } else {
                soldier.bulletBar.destroy();
                soldier.bulletIcon.destroy();
                soldier.destroy();
            }
        });

        //remover soldados com 0 balas
        soldiers = soldiers.filter(soldier => soldier.active);
        checkGameOver.call(this);
    }

    scheduleNextEnemySpawn() {
        const minSpawnTime = 2000;
        const maxSpawnTime = 7000;
        const nextSpawnTime = Phaser.Math.Between(minSpawnTime, maxSpawnTime);

        this.time.delayedCall(nextSpawnTime, () => {
            spawnEnemy.call(this);
            this.scheduleNextEnemySpawn();
        }, null, this);
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 }
        }
    },
    scene: [MenuScene, MainScene]
};

const game = new Phaser.Game(config);

let player;
let enemies;
let bullets;
let path;
let soldiers = [];
let bombs = [];
let coins = 2000;
let coinText;
let coinIcon;
let gameTime = 0;
let skeletonSpawnRate = 5000;
let timeText;
let sessionRecord = 0;
let longestSurvivalTime = 0;
let recordText;
let recordIcon;

let selectedSoldier = null;
let selectedBomb = false;
let selectedShield = false;

let soldierConfigs = [
    { texture: 'soldier1', scale: 0.5, damage: 20, fireDelay: 100, bullets: 250, price: 150 },
    { texture: 'soldier2', scale: 0.2, damage: 10, fireDelay: 300, bullets: 1500, price: 100 },
    { texture: 'soldier3', scale: 0.2, damage: 50, fireDelay: 50, bullets: 750, price: 200 },
    { texture: 'soldier4', scale: 0.2, damage: 30, fireDelay: 200, bullets: 3000, price: 175 }
];

// organizar soldados por preco naloja
soldierConfigs.sort((a, b) => a.price - b.price);

let enemyConfigs = [
    { texture: 'enemy1', scale: 0.2, health: 500, coinReward: 20, spawnRate: 1, damage: 5 },
    { texture: 'enemy2', scale: 0.2, health: 1000, coinReward: 50, spawnRate: 5, damage: 10 },
    { texture: 'enemy3', scale: 0.35, health: 2000, coinReward: 80, spawnRate: 10, damage: 20 }
];

let towerConfigs = [
    { texture: 'tower1', scale: 0.35, health: 5000, shield: 2000 },
    { texture: 'tower2', scale: 0.35, health: 7500, shield: 2000 }
];

let points = [
    { x: 0, y: 220 },
    { x: 400, y: 220 },
    { x: 400, y: 80 },
    { x: 260, y: 80 },
    { x: 260, y: 450 },
    { x: 140, y: 450 },
    { x: 140, y: 300 },
    { x: 520, y: 300 },
    { x: 520, y: 150 },
    { x: 600, y: 150 },
    { x: 600, y: 400 },
    { x: 360, y: 400 },
    { x: 360, y: 600 },
];

let pointsTowerSpawn = [
    { x: 400, y: 220 },
    { x: 400, y: 80 },
    { x: 260, y: 80 },
    { x: 140, y: 450 },
    { x: 140, y: 300 },
    { x: 520, y: 300 },
    { x: 520, y: 150 },
    { x: 600, y: 150 },
    { x: 600, y: 400 },
    { x: 360, y: 400 },
];

function selectSoldier(index) {
    selectedSoldier = index;
    selectedBomb = false;
    selectedShield = false;
}

function selectBomb() {
    selectedSoldier = null;
    selectedBomb = true;
    selectedShield = false;
}

function selectShield() {
    selectedSoldier = null;
    selectedBomb = false;
    selectedShield = true;
}

function placeSoldier(x, y) {
    if (selectedSoldier !== null && coins >= soldierConfigs[selectedSoldier].price) {
        coins -= soldierConfigs[selectedSoldier].price;
        coinText.setText(coins);
        let config = soldierConfigs[selectedSoldier];
        let soldier = this.physics.add.sprite(x, y, config.texture)
            .setScale(config.scale)
            .setCollideWorldBounds(true);
        soldier.damage = config.damage;
        soldier.fireDelay = config.fireDelay;
        soldier.bullets = config.bullets;
        soldier.lastFired = 0;
        soldiers.push(soldier);
        selectedSoldier = null;

        soldier.bulletBar = this.add.graphics();
        soldier.bulletIcon = this.add.image(soldier.x - 20, soldier.y - 50, 'bullet').setScale(0.02).setAngle(90);
        updateBulletBar(soldier);
    }
}

function updateBulletBar(soldier) {
    soldier.bulletBar.clear();
    const barWidth = 40;
    const barHeight = 6;
    const offsetX = barWidth / 2;
    const offsetY = 50;

    soldier.bulletBar.fillStyle(0xffffff, 1);
    soldier.bulletBar.fillRect(soldier.x - offsetX, soldier.y - offsetY, barWidth * (soldier.bullets / soldierConfigs.find(config => config.texture === soldier.texture.key).bullets), barHeight);

    soldier.bulletIcon.setPosition(soldier.x - offsetX - 10, soldier.y - offsetY);
}

function placeBomb(x, y) {
    if (selectedBomb && coins >= 1000) {
        coins -= 1000;
        coinText.setText(coins);
        let bomb = this.physics.add.sprite(x, y, 'bomb').setScale(0.15);
        bombs.push(bomb);
        selectedBomb = false;

        // adicionar explosao
        this.time.delayedCall(3000, () => {
            bombExplode.call(this, bomb.x, bomb.y);
            bomb.destroy();
        }, null, this);
    }
}

function bombExplode(x, y) {
    let explosionRadius = 150;
    let explosion = this.add.sprite(x, y, 'explosion').setScale(0.2); //efeito explosao
    this.time.delayedCall(500, () => {
        explosion.destroy();
    }, null, this);

    Phaser.Actions.Call(enemies.getChildren(), function (enemy) {
        if (Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y) <= explosionRadius) {
            enemy.health -= 500;
            if (enemy.health <= 0) {
                coins += enemy.coinReward;
                coinText.setText(coins);
                enemy.healthBar.destroy();
                enemy.heartIcon.destroy();
                enemy.destroy();
            }
        }
    }, this);
}

function spawnRandomTowers() {
    towerConfigs.forEach(config => {
        if (pointsTowerSpawn.length > 0) {
            let position = Phaser.Utils.Array.RemoveRandomElement(pointsTowerSpawn);
            let tower = this.physics.add.sprite(position.x, position.y, config.texture)
                .setScale(config.scale)
                .setCollideWorldBounds(true);

            tower.health = config.health;
            tower.shield = 0;
            tower.maxHealth = config.health;

            tower.healthBar = this.add.graphics();
            tower.shieldBar = this.add.graphics();

            tower.heartIcon = this.add.image(tower.x - 50, tower.y - 60, 'green_heart').setScale(0.07);

            updateTowerHealthBar(tower);
        } else {
            console.warn('No more available points to spawn towers.');
        }
    });
}

Phaser.Utils.Array.RemoveRandomElement = function (array) {
    if (array.length === 0) return null;
    let index = Phaser.Math.Between(0, array.length - 1);
    return array.splice(index, 1)[0];
};

function getTowerAtPointer(pointer) {
    let closestTower = null;
    let closestDistance = Infinity;

    Phaser.Actions.Call(this.physics.world.bodies.entries, function (body) {
        if (body.gameObject.texture.key.startsWith('tower')) {
            let distance = Phaser.Math.Distance.Between(pointer.x, pointer.y, body.gameObject.x, body.gameObject.y);
            if (distance < closestDistance && distance < 50) {
                closestDistance = distance;
                closestTower = body.gameObject;
            }
        }
    }, this);

    return closestTower;
}

function applyShieldToTower(tower) {
    if (coins >= 500) {
        coins -= 500;
        coinText.setText(coins);
        tower.shield = 2000;
        updateTowerHealthBar(tower);
        selectedShield = false;
    }
}

function updateTowerHealthBar(tower) {
    tower.healthBar.clear();
    tower.shieldBar.clear();

    const barWidth = 40;
    const barHeight = 6;
    const offsetX = barWidth / 2;
    const offsetY = 50;

    // Barra de saúde
    tower.healthBar.fillStyle(0x00ff00, 1);
    tower.healthBar.fillRect(tower.x - offsetX, tower.y - offsetY, barWidth * (tower.health / tower.maxHealth), barHeight);

    // Barra de escudo, se houver
    if (tower.shield > 0) {
        tower.shieldBar.fillStyle(0xffffff, 1);
        tower.shieldBar.fillRect(tower.x - offsetX, tower.y - offsetY - 20, barWidth * (tower.shield / 2000), barHeight);

        // Ícone de escudo
        if (!tower.shieldIcon) {
            tower.shieldIcon = tower.scene.add.image(tower.x - offsetX - 20, tower.y - offsetY - 30, 'shield').setScale(0.12);
        } else {
            tower.shieldIcon.setPosition(tower.x - offsetX - 20, tower.y - offsetY - 30);
        }
    } else if (tower.shieldIcon) {
        tower.shieldIcon.destroy();
        tower.shieldIcon = null;
    }

    // Ícone de coração
    tower.heartIcon.setPosition(tower.x - offsetX - 10, tower.y - offsetY);
}


function attackTower(enemy, tower) {
    // Reduz a vida ou escudo da torre
    if (tower.shield > 0) {
        tower.shield -= enemy.damage;
        if (tower.shield < 0) {
            tower.health += tower.shield; // Subtrair o valor negativo do escudo da saúde
            tower.shield = 0;
        }
    } else {
        tower.health -= enemy.damage;
    }

    updateTowerHealthBar(tower);

    // Verifica se a torre foi destruída
    if (tower.health <= 0) {
        let explosion = enemy.scene.add.sprite(tower.x, tower.y, 'explosion').setScale(0.2);
        enemy.scene.time.delayedCall(500, () => {
            explosion.destroy();
        }, null, enemy.scene);
        tower.healthBar.destroy();
        tower.shieldBar.destroy();
        tower.heartIcon.destroy();
        if (tower.shieldIcon) {
            tower.shieldIcon.destroy();
        }
        tower.destroy();
        checkGameOver.call(enemy.scene);
    }
}

function moveEnemyAlongPath(enemy) {
    let scene = enemy.scene;
    let targetPoint = points[enemy.pathIndex];
    let distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, targetPoint.x, targetPoint.y);

    let closestTower = null;
    let closestDistance = Infinity;

    Phaser.Actions.Call(scene.physics.world.bodies.entries, function (body) {
        if (body.gameObject.texture.key.startsWith('tower')) {
            let tower = body.gameObject;
            let towerDistance = Phaser.Math.Distance.Between(enemy.x, enemy.y, tower.x, tower.y);
            if (towerDistance < closestDistance && towerDistance < 50) {
                closestDistance = towerDistance;
                closestTower = tower;
            }
        }
    }, scene);

    if (closestTower) {
        enemy.body.setVelocity(0, 0);
        attackTower(enemy, closestTower);
    } else if (distance < 10) {
        enemy.pathIndex++;
        if (enemy.pathIndex >= points.length) {
            enemy.healthBar.destroy();
            enemy.heartIcon.destroy();
            enemy.destroy();
        } else {
            targetPoint = points[enemy.pathIndex]; // Atualiza targetPoint para o próximo ponto
            scene.physics.moveTo(enemy, targetPoint.x, targetPoint.y, 100);
        }
    } else {
        scene.physics.moveTo(enemy, targetPoint.x, targetPoint.y, 100);
    }

    // Verifica a direção e inverte a imagem se necessário
    if (targetPoint.x < enemy.x) {
        enemy.setFlipX(true); // Inverte a imagem horizontalmente
    } else if (targetPoint.x > enemy.x) {
        enemy.setFlipX(false); // Mantém a imagem normal
    }
}


function spawnEnemy() {
    for (let i = 0; i < this.enemiesToSpawn; i++) {
        let enemyConfig = getEnemyConfig(this.enemyCount);
        let enemy = this.physics.add.sprite(points[0].x, points[0].y, enemyConfig.texture);
        enemy.health = enemyConfig.health;
        enemy.maxHealth = enemyConfig.health;
        enemy.setScale(enemyConfig.scale);
        enemy.coinReward = enemyConfig.coinReward;
        enemy.damage = enemyConfig.damage;

        enemies.add(enemy);
        enemy.pathIndex = 0;
        enemy.healthBar = this.add.graphics();
        enemy.heartIcon = this.add.image(enemy.x - 30, enemy.y - 40, 'heart').setScale(0.1);
        updateHealthBar(enemy);

        this.enemyCount++;
    }
}

function getEnemyConfig(enemyCount) {
    if (enemyCount < 5) {
        return enemyConfigs[0]; //inimigo 1 para os primeiros 5
    } else if (enemyCount < 6) {
        return enemyConfigs[1]; // inimigo 2 depois de 5
    } else if (enemyCount % 10 === 0) {
        return enemyConfigs[2]; // inimigo 3 depois de 10
    } else {
        return enemyConfigs[0];
    }
}

function updateHealthBar(enemy) {
    enemy.healthBar.clear();
    enemy.healthBar.fillStyle(0xff0000, 1);
    enemy.healthBar.fillRect(enemy.x - 15, enemy.y - 45, 40 * (enemy.health / enemy.maxHealth), 5);
    enemy.heartIcon.setPosition(enemy.x - 40, enemy.y - 40);
    enemy.heartIcon.setScale(0.1);
}

function fireBullet(from, target) {
    let bullet = bullets.get(from.x, from.y, 'bullet');
    if (bullet) {
        bullet.setActive(true);
        bullet.setVisible(true);
        bullet.setScale(0.01);
        bullet.damage = from.damage;
        bullet.origin = from;
        this.physics.moveToObject(bullet, target, 500);
    }
}

function checkGameOver() {
    let towersRemaining = this.physics.world.bodies.entries.filter(body => body.gameObject.texture.key.startsWith('tower') && body.gameObject.active);
    if (towersRemaining.length === 0) {
        gameOver.call(this);
    }
}

function gameOver() {
    this.add.text(300, 250, 'Game Over', { fontSize: '64px', fill: '#ff0000' });

    //atualizar se o tempo for superior ao atual
    if (gameTime > longestSurvivalTime) {
        longestSurvivalTime = Math.floor(gameTime);
        console.log('New longest survival time: ' + longestSurvivalTime + ' seconds');
    }

    // Verificar se o tempo de sobrevivência atual é maior que o recorde da sessão
    if (Math.floor(gameTime) > sessionRecord) {
        sessionRecord = Math.floor(gameTime);
    }

    let restartButton = this.add.text(300, 350, 'Restart', { fontSize: '32px', fill: '#ffffff' })
        .setInteractive()
        .on('pointerdown', () => {
            resetGameVariables.call(this); //reset as variaveis
            this.scene.restart();
        });
}

function resetGameVariables() {
    coins = 2000;
    this.enemyCount = 0;
    gameTime = 0;
    soldiers = [];
    bombs = [];
    selectedSoldier = null;
    selectedBomb = false;
    selectedShield = false;
    if (bullets) bullets.clear(true, true);
    if (enemies) enemies.clear(true, true);

    timeText.setText('0 Seconds');

    recordText.setText('Session Record: ' + sessionRecord + ' Seconds');
}

Phaser.Utils.Array.RemoveRandomElement = function (array) {
    if (array.length === 0) return null;
    let index = Phaser.Math.Between(0, array.length - 1);
    return array.splice(index, 1)[0];
};
