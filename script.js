const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreDisplay = document.getElementById("score");
const coinsDisplay = document.getElementById("coins");

const restartBtn = document.getElementById("restartBtn");
const leaderboardBtn = document.getElementById("leaderboardBtn");

const leaderboardOverlay = document.getElementById("leaderboardOverlay");
const nameOverlay = document.getElementById("nameOverlay");

const closeLeaderboard = document.getElementById("closeLeaderboard");
const clearScoresBtn = document.getElementById("clearScoresBtn");

const leaderboardList = document.getElementById("leaderboardList");

const playerName = document.getElementById("playerName");
const saveScoreBtn = document.getElementById("saveScoreBtn");

const finalScore = document.getElementById("finalScore");

canvas.width = 700;
canvas.height = 400;

const gravity = 0.6;
const acceleration = 0.6;
const friction = 0.8;
const maxSpeed = 6;
const jumpPower = -11;

let score = 0;
let collectedCoins = 0;
let gameOver = false;
let gameWon = false;
let cameraX = 0;

let audioContext = null;

function startAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (audioContext.state === "suspended") {
        audioContext.resume();
    }
}

function playSound(type) {
    startAudio();

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    if (type === "jump") {
        oscillator.frequency.value = 500;
        gain.gain.value = 0.08;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.12);
    }

    if (type === "coin") {
        oscillator.frequency.value = 800;
        gain.gain.value = 0.1;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
    }

    if (type === "gameover") {
        oscillator.frequency.value = 150;
        gain.gain.value = 0.1;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);
    }

    if (type === "win") {
        oscillator.frequency.value = 900;
        gain.gain.value = 0.1;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);
    }
}

const player = {
    x: 60,
    y: 280,
    width: 35,
    height: 45,
    velocityX: 0,
    velocityY: 0,
    onGround: false,
    jumps: 0,
    maxJumps: 2
};

const keys = {
    left: false,
    right: false
};

const platforms = [
    { x: 0, y: 350, width: 600, height: 50 },
    { x: 700, y: 300, width: 180, height: 20 },
    { x: 950, y: 250, width: 170, height: 20 },
    { x: 1200, y: 310, width: 200, height: 20 },
    { x: 1500, y: 250, width: 180, height: 20 },
    { x: 1780, y: 310, width: 200, height: 20 },
    { x: 2050, y: 240, width: 200, height: 20 },
    { x: 2300, y: 320, width: 400, height: 80 }
];

const coins = [
    { x: 180, y: 300, collected: false },
    { x: 300, y: 300, collected: false },
    { x: 450, y: 300, collected: false },
    { x: 750, y: 250, collected: false },
    { x: 830, y: 250, collected: false },
    { x: 1000, y: 200, collected: false },
    { x: 1080, y: 200, collected: false },
    { x: 1260, y: 260, collected: false },
    { x: 1360, y: 260, collected: false },
    { x: 1550, y: 200, collected: false },
    { x: 1630, y: 200, collected: false },
    { x: 1840, y: 260, collected: false },
    { x: 1930, y: 260, collected: false },
    { x: 2100, y: 190, collected: false },
    { x: 2200, y: 190, collected: false }
];

const spikes = [
    { x: 520, y: 320, width: 35, height: 30 },
    { x: 850, y: 270, width: 30, height: 30 },
    { x: 1120, y: 320, width: 35, height: 30 },
    { x: 1400, y: 320, width: 35, height: 30 },
    { x: 1680, y: 320, width: 35, height: 30 },
    { x: 1980, y: 320, width: 35, height: 30 }
];

const enemy = {
    x: 1300,
    y: 270,
    width: 35,
    height: 40,
    speed: 2,
    direction: 1,
    minX: 1250,
    maxX: 1450
};

const finish = {
    x: 2600,
    y: 240,
    width: 10,
    height: 80
};

document.addEventListener("keydown", function(event) {

    startAudio();

    if (event.key === "ArrowLeft" || event.key === "a") {
        keys.left = true;
    }

    if (event.key === "ArrowRight" || event.key === "d") {
        keys.right = true;
    }

    if (
        (event.key === "ArrowUp" ||
        event.key === "w" ||
        event.key === " ") &&
        player.jumps < player.maxJumps &&
        !gameOver &&
        !gameWon
    ) {
        player.velocityY = jumpPower;
        player.jumps++;
        player.onGround = false;

        playSound("jump");
    }
});

document.addEventListener("keyup", function(event) {

    if (event.key === "ArrowLeft" || event.key === "a") {
        keys.left = false;
    }

    if (event.key === "ArrowRight" || event.key === "d") {
        keys.right = false;
    }

    if (
        event.key === "ArrowUp" ||
        event.key === "w" ||
        event.key === " "
    ) {
        if (player.velocityY < -4) {
            player.velocityY = -4;
        }
    }
});

function updatePlayer() {

    if (keys.left) {
        player.velocityX -= acceleration;
    }

    if (keys.right) {
        player.velocityX += acceleration;
    }

    player.velocityX *= friction;

    if (player.velocityX > maxSpeed) {
        player.velocityX = maxSpeed;
    }

    if (player.velocityX < -maxSpeed) {
        player.velocityX = -maxSpeed;
    }

    player.velocityY += gravity;

    player.x += player.velocityX;
    player.y += player.velocityY;

    player.onGround = false;

    checkPlatformCollision();

    if (player.x < 0) {
        player.x = 0;
        player.velocityX = 0;
    }

    if (player.y > canvas.height + 50) {
        endGame();
    }

    updateCamera();
}

function checkPlatformCollision() {

    for (let platform of platforms) {

        if (
            player.x < platform.x + platform.width &&
            player.x + player.width > platform.x &&
            player.y + player.height > platform.y &&
            player.y + player.height <
            platform.y + platform.height + 20 &&
            player.velocityY >= 0
        ) {
            player.y = platform.y - player.height;
            player.velocityY = 0;
            player.onGround = true;
            player.jumps = 0;
        }
    }
}

function checkSpikes() {

    for (let spike of spikes) {

        const spikeLeft = spike.x + 5;
        const spikeRight = spike.x + spike.width - 5;
        const spikeTop = spike.y + 5;
        const spikeBottom = spike.y + spike.height;

        if (
            player.x + player.width > spikeLeft &&
            player.x < spikeRight &&
            player.y + player.height > spikeTop &&
            player.y < spikeBottom
        ) {
            endGame();
        }
    }
}

function updateEnemy() {

    enemy.x += enemy.speed * enemy.direction;

    if (enemy.x >= enemy.maxX) {
        enemy.direction = -1;
    }

    if (enemy.x <= enemy.minX) {
        enemy.direction = 1;
    }
}

function checkEnemy() {

    if (
        player.x + player.width > enemy.x + 3 &&
        player.x < enemy.x + enemy.width - 3 &&
        player.y + player.height > enemy.y + 3 &&
        player.y < enemy.y + enemy.height - 3
    ) {
        endGame();
    }
}

function checkCoins() {

    for (let coin of coins) {

        if (!coin.collected) {

            const distanceX =
                player.x + player.width / 2 - coin.x;

            const distanceY =
                player.y + player.height / 2 - coin.y;

            const distance =
                Math.sqrt(
                    distanceX * distanceX +
                    distanceY * distanceY
                );

            if (distance < 30) {

                coin.collected = true;

                score += 10;
                collectedCoins++;

                scoreDisplay.textContent = score;
                coinsDisplay.textContent = collectedCoins;

                playSound("coin");
            }
        }
    }
}

function checkFinish() {

    if (
        player.x < finish.x + finish.width &&
        player.x + player.width > finish.x &&
        player.y < finish.y + finish.height &&
        player.y + player.height > finish.y
    ) {
        winGame();
    }
}

function endGame() {

    if (gameOver || gameWon) {
        return;
    }

    gameOver = true;

    playSound("gameover");

    finalScore.textContent = score;

    nameOverlay.style.display = "flex";
}

function winGame() {

    if (gameWon || gameOver) {
        return;
    }

    gameWon = true;

    playSound("win");

    finalScore.textContent = score;

    nameOverlay.style.display = "flex";
}

function updateCamera() {

    const targetCamera = player.x - 200;

    cameraX +=
        (targetCamera - cameraX) * 0.08;

    if (cameraX < 0) {
        cameraX = 0;
    }

    const maxCamera = 2700 - canvas.width;

    if (cameraX > maxCamera) {
        cameraX = maxCamera;
    }
}

function drawBackground() {

    const gradient =
        ctx.createLinearGradient(
            0,
            0,
            0,
            canvas.height
        );

    gradient.addColorStop(0, "#172554");
    gradient.addColorStop(1, "#6d28d9");

    ctx.fillStyle = gradient;

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.fillStyle = "white";

    for (let i = 0; i < 30; i++) {

        const x =
            (i * 120) -
            cameraX * 0.3;

        const y =
            (i * 53) % 180;

        ctx.fillRect(x, y, 2, 2);
    }

    ctx.fillStyle = "#312e81";

    ctx.beginPath();

    ctx.arc(
        150 - cameraX * 0.2,
        350,
        130,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.beginPath();

    ctx.arc(
        500 - cameraX * 0.2,
        360,
        160,
        0,
        Math.PI * 2
    );

    ctx.fill();
}

function drawPlayer() {

    const x = player.x - cameraX;

    ctx.fillStyle = "#facc15";

    ctx.fillRect(
        x,
        player.y,
        player.width,
        player.height
    );

    ctx.fillStyle = "#111827";

    ctx.fillRect(
        x + 23,
        player.y + 10,
        6,
        6
    );
}

function drawPlatforms() {

    for (let platform of platforms) {

        const x =
            platform.x - cameraX;

        ctx.fillStyle = "#22c55e";

        ctx.fillRect(
            x,
            platform.y,
            platform.width,
            platform.height
        );

        ctx.fillStyle = "#86efac";

        ctx.fillRect(
            x,
            platform.y,
            platform.width,
            5
        );
    }
}

function drawCoins() {

    for (let coin of coins) {

        if (!coin.collected) {

            const x =
                coin.x - cameraX;

            ctx.beginPath();

            ctx.arc(
                x,
                coin.y,
                10,
                0,
                Math.PI * 2
            );

            ctx.fillStyle = "#facc15";

            ctx.fill();

            ctx.strokeStyle = "#f59e0b";

            ctx.lineWidth = 2;

            ctx.stroke();
        }
    }
}

function drawSpikes() {

    for (let spike of spikes) {

        const x =
            spike.x - cameraX;

        ctx.fillStyle = "#ef4444";

        ctx.beginPath();

        ctx.moveTo(
            x,
            spike.y + spike.height
        );

        ctx.lineTo(
            x + spike.width / 2,
            spike.y
        );

        ctx.lineTo(
            x + spike.width,
            spike.y + spike.height
        );

        ctx.closePath();

        ctx.fill();
    }
}

function drawEnemy() {

    const x =
        enemy.x - cameraX;

    ctx.fillStyle = "#f97316";

    ctx.fillRect(
        x,
        enemy.y,
        enemy.width,
        enemy.height
    );

    ctx.fillStyle = "white";

    ctx.fillRect(
        x + 7,
        enemy.y + 8,
        7,
        7
    );

    ctx.fillRect(
        x + 21,
        enemy.y + 8,
        7,
        7
    );
}

function drawFinish() {

    const x =
        finish.x - cameraX;

    ctx.fillStyle = "white";

    ctx.fillRect(
        x,
        finish.y,
        finish.width,
        finish.height
    );

    ctx.fillStyle = "#22c55e";

    ctx.fillRect(
        x + 10,
        finish.y,
        45,
        30
    );

    ctx.fillStyle = "white";

    ctx.font = "14px Arial";

    ctx.fillText(
        "FINISH",
        x + 13,
        finish.y + 20
    );
}

function drawGameOver() {

    if (!gameOver) {
        return;
    }

    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.textAlign = "center";

    ctx.fillStyle = "#ef4444";

    ctx.font = "bold 42px Arial";

    ctx.fillText(
        "GAME OVER",
        canvas.width / 2,
        160
    );

    ctx.fillStyle = "white";

    ctx.font = "22px Arial";

    ctx.fillText(
        "Score: " + score,
        canvas.width / 2,
        205
    );

    ctx.font = "18px Arial";

    ctx.fillText(
        "Save your score below",
        canvas.width / 2,
        245
    );

    ctx.textAlign = "left";
}

function drawWin() {

    if (!gameWon) {
        return;
    }

    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.textAlign = "center";

    ctx.fillStyle = "#22c55e";

    ctx.font = "bold 38px Arial";

    ctx.fillText(
        "LEVEL COMPLETE!",
        canvas.width / 2,
        160
    );

    ctx.fillStyle = "white";

    ctx.font = "22px Arial";

    ctx.fillText(
        "Score: " + score,
        canvas.width / 2,
        205
    );

    ctx.font = "18px Arial";

    ctx.fillText(
        "Save your score below",
        canvas.width / 2,
        245
    );

    ctx.textAlign = "left";
}

function draw() {

    drawBackground();
    drawPlatforms();
    drawCoins();
    drawSpikes();
    drawEnemy();
    drawFinish();
    drawPlayer();

    drawGameOver();
    drawWin();
}

function gameLoop() {

    if (!gameOver && !gameWon) {

        updatePlayer();
        updateEnemy();
        checkSpikes();
        checkEnemy();
        checkCoins();
        checkFinish();
    }

    draw();

    requestAnimationFrame(gameLoop);
}

function restartGame() {

    player.x = 60;
    player.y = 280;

    player.velocityX = 0;
    player.velocityY = 0;

    player.onGround = false;
    player.jumps = 0;

    score = 0;
    collectedCoins = 0;

    gameOver = false;
    gameWon = false;

    cameraX = 0;

    enemy.x = 1300;
    enemy.direction = 1;

    for (let coin of coins) {
        coin.collected = false;
    }

    scoreDisplay.textContent = 0;
    coinsDisplay.textContent = 0;

    nameOverlay.style.display = "none";
}

function saveScore() {

    let name = playerName.value.trim();

    if (name === "") {
        name = "Player";
    }

    let leaderboard =
        JSON.parse(
            localStorage.getItem("skyboundLeaderboard")
        ) || [];

    leaderboard.push({
        name: name,
        score: score
    });

    leaderboard.sort(function(a, b) {
        return b.score - a.score;
    });

    leaderboard = leaderboard.slice(0, 5);

    localStorage.setItem(
        "skyboundLeaderboard",
        JSON.stringify(leaderboard)
    );

    playerName.value = "";

    nameOverlay.style.display = "none";

    showLeaderboard();
}

function showLeaderboard() {

    let leaderboard =
        JSON.parse(
            localStorage.getItem("skyboundLeaderboard")
        ) || [];

    leaderboard.sort(function(a, b) {
        return b.score - a.score;
    });

    leaderboard = leaderboard.slice(0, 5);

    leaderboardList.innerHTML = "";

    if (leaderboard.length === 0) {

        const message = document.createElement("li");

        message.textContent = "No scores yet.";

        leaderboardList.appendChild(message);

        return;
    }

    leaderboard.forEach(function(player, index) {

        const item = document.createElement("li");

        item.textContent =
            `${index + 1}. ${player.name} - ${player.score}`;

        leaderboardList.appendChild(item);
    });
}

leaderboardBtn.addEventListener(
    "click",
    function() {

        showLeaderboard();

        leaderboardOverlay.style.display = "flex";
    }
);

closeLeaderboard.addEventListener(
    "click",
    function() {

        leaderboardOverlay.style.display = "none";
    }
);

saveScoreBtn.addEventListener(
    "click",
    saveScore
);

clearScoresBtn.addEventListener(
    "click",
    function() {

        localStorage.removeItem(
            "skyboundLeaderboard"
        );

        showLeaderboard();
    }
);

restartBtn.addEventListener(
    "click",
    restartGame
);

gameLoop();
