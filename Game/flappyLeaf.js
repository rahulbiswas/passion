document.body.style.backgroundColor = "#e9fbe4"; // eco-friendly light green

const container = document.createElement("div");
container.style.display = "flex";

const canvas = document.getElementById("gameCanvas");
canvas.width = 1200;
canvas.height = 800;
canvas.style.border = "2px solid #ccc";
container.appendChild(canvas);

document.body.innerHTML = "";
document.body.appendChild(container);

const sidebar = document.createElement("div");
sidebar.style.marginLeft = "20px";
sidebar.style.width = "350px";
sidebar.style.fontFamily = "Arial, sans-serif";
sidebar.innerHTML = `
    <h2>🌿 Flappy Leaf: The Transpiration Game 🌿</h2>
    <p><strong>By:</strong> The Greenhouse Gang</p>
    <p><em>Avoid natural disasters and get water however you can!</em></p>
    <hr>
    <h3>Cool Plant Facts</h3>
    <ul>
        <li><strong>Evapotranspiration:</strong> The sum of evaporation and plant transpiration from the Earth's surface.</li>
        <li><strong>Hydraulic Conductance:</strong> A plant's ability to transport water; it decreases with water stress.</li>
        <li><strong>Global Warming:</strong> Increases stress on plants and reduces water availability.</li>
        <li><strong>Water Potential:</strong> Describes the energy status of water in plants and soil.</li>
    </ul>
    <hr>
    <p><strong>Zones Flown Through:</strong> <span id="score">0</span></p>
    <p><strong>High Score:</strong> <span id="highScore">0</span></p>
`;
container.appendChild(sidebar);

const ctx = canvas.getContext("2d");

let leafImg = new Image();
leafImg.src = "leaf.webp";

let cloudImg = new Image();
cloudImg.src = "cloud.webp";

let rootImg = new Image();
rootImg.src = "roots.webp";

let waterImg = new Image();
waterImg.src = "raindrop.webp";

let droughtImg = new Image();
droughtImg.src = "drought.jpg";

let tornadoImg = new Image();
tornadoImg.src = "tornado.webp";

let fireImg = new Image();
fireImg.src = "fire.jpg";

let axeImg = new Image();
axeImg.src = "axe.jpg";

let bgImg = new Image();
bgImg.src = "Flappybird.jpg";

const gravity = 0.25;
const groundOffset = 70;
let obstacleSpeed = 3;
let leaf = {
    x: 150,
    y: 300,
    width: 80,
    height: 80,
    velocity: 0
};

let obstacles = [];
let powerUps = [];
let frame = 0;
let score = 0;
let waterLevel = 100;
let highScore = localStorage.getItem("flappyLeafHighScore") || 0;
let showInstructions = true;
let deathReason = "";
let gameRunning = false;
let restartTimeout = false;

function drawLeaf() {
    ctx.drawImage(leafImg, leaf.x, leaf.y, leaf.width, leaf.height);
}

function drawObstacles() {
    obstacles.forEach(obs => {
        let img = obs.type === 'drought' ? droughtImg : obs.type === 'tornado' ? tornadoImg : obs.type === 'fire' ? fireImg : axeImg;
        ctx.drawImage(img, obs.x, obs.y, obs.width, obs.height);
    });
}

function drawPowerUps() {
    powerUps.forEach(pu => {
        let img = pu.type === 'cloud' ? cloudImg : pu.type === 'roots' ? rootImg : waterImg;
        ctx.drawImage(img, pu.x, pu.y, pu.width * 2, pu.height * 2);
    });
}

function updateGame() {
    frame++;
    obstacleSpeed = 3 + Math.floor(frame / 1200);

    if (frame > 0) {
        leaf.velocity += gravity;
        leaf.y += leaf.velocity;
    }

    const groundLevel = canvas.height - groundOffset;

    if (leaf.y + leaf.height > groundLevel) {
		leaf.velocity = -10;
		leaf.y -= 50;
		waterLevel -= 20
		return;
    }

    if (leaf.y < 0) {
        leaf.y = 0;
        leaf.velocity = 0;
    }

    if (frame % 180 === 0) {
        let type = Math.random() < 0.05 ? "instantDeath" : ["drought", "tornado", "fire"][Math.floor(Math.random() * 3)];
        obstacles.push({
            x: canvas.width,
            y: Math.random() * (groundLevel - 200),
            width: 100,
            height: 200,
            type: type
        });
    }

    if (frame % 300 === 0) {
        let type = ["cloud", "roots", "water"][Math.floor(Math.random() * 3)];
        powerUps.push({
            x: canvas.width,
            y: Math.random() * (groundLevel - 80),
            width: 40,
            height: 40,
            type: type
        });
    }

    obstacles.forEach((obs, i) => {
        obs.x -= obstacleSpeed;
        if (checkCollision(leaf, obs)) {
            if (!obs.hit) {
                if (obs.type === "instantDeath") {
                    deathReason = "You hit a killer obstacle!";
                    resetGame();
                    return;
                } else {
                    leaf.x = Math.max(20, leaf.x - 20);
                    waterLevel -= 10;
                    obs.hit = true;
                    deathReason = `Hit a ${obs.type} obstacle!`;
                }
            }
        } else if (obs.x + obs.width < leaf.x && !obs.passed) {
            score++;
            waterLevel -= 5;
            obs.passed = true;
        }
    });

    powerUps.forEach((pu, i) => {
        pu.x -= 2;
        if (checkCollision(leaf, pu)) {
            waterLevel += 20;
            powerUps.splice(i, 1);
        }
    });

    if (waterLevel <= 0) {
        deathReason = "You ran out of water!";
        resetGame();
        return;
    }

    updateDisplay();
}

function checkCollision(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

function updateDisplay() {
    document.getElementById("score").innerText = score;
    document.getElementById("highScore").innerText = highScore;
}

function resetGame() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem("flappyLeafHighScore", highScore);
    }
    leaf.y = canvas.height / 2 - leaf.height / 2;
    leaf.velocity = -9;
    leaf.x = 150;
    obstacles = [];
    powerUps = [];
    waterLevel = 100;
    score = 0;
    frame = 0;
    restartTimeout = true;
    showInstructions = true;
    gameRunning = false;
    drawInstructions(deathReason);
    setTimeout(() => {
        restartTimeout = false;
    }, 3000);
}

function drawBackground() {
    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
	ctx.font = "24px Arial";
	ctx.fillStyle = "#000"
	ctx.fillText(`💧 Water: ${waterLevel}`, canvas.width - 200, 40);
}

function drawInstructions(reason = "") {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fillRect(200, 100, 800, 600);
    ctx.fillStyle = "#000";
    ctx.font = "32px Arial";
    ctx.fillText("🌿 Welcome to Flappy Leaf! 🌿", 370, 180);
    ctx.font = "20px Arial";
    if (reason) {
        ctx.fillStyle = "red";
        ctx.fillText(`You died! Reason: ${reason}`, 400, 230);
    }
    ctx.fillStyle = "#000";
    ctx.fillText("Click to flap your leaf and fly through the obstacles.", 330, 280);
    ctx.fillText("Avoid hazards like drought, tornado, and fire.", 370, 320);
    ctx.fillText("Collect clouds, roots, and water to stay hydrated.", 340, 360);
    ctx.fillText("Be careful! Clicking uses water too.", 380, 400);
	ctx.fillText("Hitting the ground also drains your water.", 370, 440);
    ctx.fillText("Press any key or click to start!", 390, 500);
}

function gameLoop() {
    if (!gameRunning) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawLeaf();
    drawObstacles();
    drawPowerUps();
    updateGame();
    requestAnimationFrame(gameLoop);
}

drawInstructions();

function startGame() {
    if (showInstructions && !restartTimeout) {
        showInstructions = false;
        gameRunning = true;
        gameLoop();
    }
}

canvas.addEventListener("click", () => {
    if (!gameRunning) {
        startGame();
    } else {
        leaf.velocity = -9;
        waterLevel -= 0.5;
    }
});

document.addEventListener("keydown", () => {
    if (!gameRunning) {
        startGame();
    } else {
        leaf.velocity = -9;
        waterLevel -= 0.5;
    }
});
