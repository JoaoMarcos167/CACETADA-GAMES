const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const startScreen = document.getElementById('start-screen');
const hpBar = document.getElementById('hp-bar');
const hpText = document.getElementById('hp-text');
const waveEl = document.getElementById('wave');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');

let score = 0;
let currentWave = 1;
let gameOver = false;
let gameWon = false;
let gameStarted = false;

// Jogador
const player = {
    x: canvas.width / 2 - 15,
    y: canvas.height - 70,
    width: 30,
    height: 30,
    speed: 5,
    hp: 100,
    lives: 3
};

// Controles
const keys = {};
let mouseShooting = false;

window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
canvas.addEventListener('mousedown', () => mouseShooting = true);
canvas.addEventListener('mouseup', () => mouseShooting = false);

// Fundo Estrelado
const stars = Array.from({ length: 60 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 2 + 1,
    speed: Math.random() * 2 + 1
}));

let playerBullets = [];
let enemyBullets = [];
let enemies = [];
let lastShot = 0;

function startGame(selectedLevel) {
    currentWave = selectedLevel;
    waveEl.innerText = currentWave;
    score = 0;
    scoreEl.innerText = score;
    player.hp = 100;
    player.lives = 3;
    livesEl.innerText = player.lives;
    hpBar.style.width = '100%';
    hpText.innerText = '100%';
    
    gameOver = false;
    gameWon = false;
    gameStarted = true;

    startScreen.style.display = 'none';
    spawnWave(currentWave);
}

function spawnWave(wave) {
    enemies = [];
    enemyBullets = [];

    if (wave === 1) {
        for (let r = 0; r < 2; r++) {
            for (let c = 0; c < 5; c++) createEnemy('chaser', 60 + c * 60, 50 + r * 40);
        }
    } else if (wave === 2) {
        for (let c = 0; c < 6; c++) createEnemy('shooter', 40 + c * 60, 60);
        for (let c = 0; c < 4; c++) createEnemy('chaser', 70 + c * 70, 110);
    } else if (wave === 3) {
        for (let c = 0; c < 4; c++) createEnemy('splitter', 50 + c * 80, 70);
        for (let c = 0; c < 4; c++) createEnemy('chaser', 50 + c * 80, 130);
    } else if (wave === 4) {
        for (let c = 0; c < 5; c++) createEnemy('shooter', 40 + c * 70, 50);
        for (let c = 0; c < 4; c++) createEnemy('splitter', 60 + c * 70, 100);
    } else if (wave === 5) {
        createEnemy('boss', canvas.width / 2 - 40, 60);
    }
}

function createEnemy(type, x, y) {
    let e = {
        x: x, y: y, type: type,
        width: 28, height: 25,
        hp: 20, maxHp: 20,
        speedX: 1.5, speedY: 0.3,
        color: '#00ffff',
        shootTimer: Math.random() * 60
    };

    if (type === 'chaser') { e.color = '#00ff66'; e.hp = 20; }
    else if (type === 'shooter') { e.color = '#ff00ff'; e.hp = 30; }
    else if (type === 'splitter') { e.color = '#ffaa00'; e.hp = 40; e.width = 34; }
    else if (type === 'mini-splitter') { e.color = '#ffff00'; e.hp = 15; e.width = 18; e.height = 18; }
    else if (type === 'boss') { e.color = '#ff0055'; e.hp = 400; e.maxHp = 400; e.width = 80; e.height = 60; e.speedX = 2; }

    enemies.push(e);
}

function update() {
    // Atualizar estrelas de fundo sempre
    stars.forEach(s => {
        s.y += s.speed;
        if (s.y > canvas.height) s.y = 0;
    });

    if (!gameStarted || gameOver || gameWon) return;

    // Movimentação
    if ((keys['w'] || keys['arrowup']) && player.y > 0) player.y -= player.speed;
    if ((keys['s'] || keys['arrowdown']) && player.y < canvas.height - player.height) player.y += player.speed;
    if ((keys['a'] || keys['arrowleft']) && player.x > 0) player.x -= player.speed;
    if ((keys['d'] || keys['arrowright']) && player.x < canvas.width - player.width) player.x += player.speed;

    // Disparo
    const now = Date.now();
    if ((keys[' '] || mouseShooting) && now - lastShot > 140) {
        playerBullets.push({ x: player.x + 4, y: player.y, speed: 9 });
        playerBullets.push({ x: player.x + player.width - 8, y: player.y, speed: 9 });
        lastShot = now;
    }

    // Tiros do Jogador
    for (let i = playerBullets.length - 1; i >= 0; i--) {
        let b = playerBullets[i];
        b.y -= b.speed;
        if (b.y < -10) playerBullets.splice(i, 1);
    }

    // Tiros Inimigos
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        let eb = enemyBullets[i];
        eb.y += eb.speedY;
        eb.x += eb.speedX || 0;

        if (eb.x > player.x && eb.x < player.x + player.width && eb.y > player.y && eb.y < player.y + player.height) {
            takeDamage(15);
            enemyBullets.splice(i, 1);
            continue;
        }

        if (eb.y > canvas.height + 10) enemyBullets.splice(i, 1);
    }

    // Inimigos
    for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i];
        e.x += e.speedX;
        if (e.x <= 10 || e.x + e.width >= canvas.width - 10) e.speedX *= -1;
        e.y += e.speedY;

        e.shootTimer++;
        if (e.type === 'shooter' && e.shootTimer > 90) {
            enemyBullets.push({ x: e.x + e.width / 2, y: e.y + e.height, speedY: 4 });
            e.shootTimer = 0;
        } else if (e.type === 'boss' && e.shootTimer > 45) {
            enemyBullets.push({ x: e.x + 15, y: e.y + e.height, speedY: 4, speedX: -1 });
            enemyBullets.push({ x: e.x + e.width / 2, y: e.y + e.height, speedY: 5, speedX: 0 });
            enemyBullets.push({ x: e.x + e.width - 15, y: e.y + e.height, speedY: 4, speedX: 1 });
            e.shootTimer = 0;
        }

        for (let j = playerBullets.length - 1; j >= 0; j--) {
            let b = playerBullets[j];
            if (b.x > e.x && b.x < e.x + e.width && b.y > e.y && b.y < e.y + e.height) {
                e.hp -= 10;
                playerBullets.splice(j, 1);

                if (e.hp <= 0) {
                    if (e.type === 'splitter') {
                        createEnemy('mini-splitter', e.x - 10, e.y);
                        createEnemy('mini-splitter', e.x + e.width + 5, e.y);
                    }
                    score += e.type === 'boss' ? 1000 : 50;
                    scoreEl.innerText = score;
                    enemies.splice(i, 1);
                    break;
                }
            }
        }
    }

    if (enemies.length === 0) {
        if (currentWave < 5) {
            currentWave++;
            waveEl.innerText = currentWave;
            spawnWave(currentWave);
        } else {
            gameWon = true;
        }
    }
}

function takeDamage(amount) {
    player.hp -= amount;
    if (player.hp <= 0) {
        player.lives--;
        livesEl.innerText = player.lives;
        if (player.lives > 0) player.hp = 100;
        else gameOver = true;
    }
    hpBar.style.width = Math.max(0, player.hp) + '%';
    hpText.innerText = Math.max(0, player.hp) + '%';
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Estrelas
    ctx.fillStyle = '#ffffff';
    stars.forEach(s => ctx.fillRect(s.x, s.y, s.size, s.size));

    if (!gameStarted) return;

    // Jogador (Nave)
    const px = player.x, py = player.y;
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px + player.width / 2, py + player.height / 2, 24, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ff2233';
    ctx.beginPath();
    ctx.moveTo(px + player.width / 2, py);
    ctx.lineTo(px + player.width, py + player.height);
    ctx.lineTo(px + player.width / 2, py + player.height - 6);
    ctx.lineTo(px, py + player.height);
    ctx.closePath();
    ctx.fill();

    // Tiros Jogador
    ctx.fillStyle = '#ffee00';
    playerBullets.forEach(b => ctx.fillRect(b.x, b.y, 4, 10));

    // Tiros Inimigos
    ctx.fillStyle = '#ff0033';
    enemyBullets.forEach(eb => {
        ctx.beginPath();
        ctx.arc(eb.x, eb.y, 4, 0, Math.PI * 2);
        ctx.fill();
    });

    // Inimigos
    enemies.forEach(e => {
        ctx.fillStyle = e.color;
        if (e.type === 'boss') {
            ctx.fillRect(e.x, e.y, e.width, e.height);
            ctx.fillStyle = '#333';
            ctx.fillRect(e.x, e.y - 12, e.width, 6);
            ctx.fillStyle = '#ff0055';
            ctx.fillRect(e.x, e.y - 12, (e.hp / e.maxHp) * e.width, 6);
        } else {
            ctx.fillRect(e.x, e.y, e.width, e.height);
        }
    });

    // Mensagens Finais
    if (gameOver) {
        ctx.fillStyle = '#ff0055';
        ctx.font = 'bold 22px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
    } else if (gameWon) {
        ctx.fillStyle = '#00ff66';
        ctx.font = 'bold 20px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('VITÓRIA! BOSS DESTRUÍDO!', canvas.width / 2, canvas.height / 2);
    }
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();