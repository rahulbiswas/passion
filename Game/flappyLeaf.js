document.body.style.cssText = `
  margin: 0;
  padding: 0;
  overflow: hidden;
  background-color: #e9fbe4;
  height: 100vh;
  width: 100vw;
`;

// Clear body
while (document.body.firstChild) {
  document.body.removeChild(document.body.firstChild);
}

const container = document.createElement("div");
Object.assign(container.style, {
  display: "flex",
  flexDirection: "row",
  alignItems: "stretch",
  justifyContent: "center",
  width: "100vw",
  height: "100vh",
  boxSizing: "border-box"
});

const canvasWrapper = document.createElement("div");
Object.assign(canvasWrapper.style, {
  flex: "1 1 auto",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0",
  boxSizing: "border-box",
  height: "100%",
  width: "100%"
});

const canvas = document.getElementById("gameCanvas") || document.createElement("canvas");
canvas.id = "gameCanvas";
Object.assign(canvas.style, {
  display: "block",
  backgroundColor: "#e9fbe4",
  boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
  objectFit: "contain"
});
canvasWrapper.appendChild(canvas);

const ctx = canvas.getContext("2d", { alpha: false });

const sidebarWidth = 300;
function resizeCanvas() {
  let maxWidth = window.innerWidth - sidebarWidth;
  let maxHeight = window.innerHeight;
  let aspectRatio = 16 / 9;
  let width = maxWidth;
  let height = width / aspectRatio;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }

  canvas.width = width;
  canvas.height = height;
  if (ctx) {
    ctx.fillStyle = "#e9fbe4";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (showInstructions && bgImg?.loaded) drawInstructions();
  }
}

let showInstructions = true;

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
bgImg.onload = () => {
  bgImg.loaded = true;
  resizeCanvas();
};

resizeCanvas();

new ResizeObserver(resizeCanvas).observe(document.body);
window.addEventListener("resize", resizeCanvas);

const sidebar = document.createElement("div");
Object.assign(sidebar.style, {
  flex: `0 0 ${sidebarWidth}px`,
  fontFamily: "Arial, sans-serif",
  padding: "20px",
  backgroundColor: "#e9fbe4",
  boxSizing: "border-box",
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between"
});

sidebar.innerHTML = `
    <div>
        <h2 style="text-align: center;">🌿 Flappy Leaf: The Transpiration Game 🌿</h2>
        <p style="text-align: center;"><strong>By:</strong> The Greenhouse Gang</p>
        <p style="text-align: center;"><em>Avoid natural disasters and get water however you can!</em></p>
        <hr>
        <h3>Cool Plant Facts</h3>
        <ul style="text-align: left; padding-left: 20px;">
            <li><strong>Evapotranspiration:</strong> The sum of evaporation and plant transpiration from the Earth's surface.</li>
            <li><strong>Hydraulic Conductance:</strong> A plant's ability to transport water; it decreases with water stress.</li>
            <li><strong>Global Warming:</strong> Increases stress on plants and reduces water availability.</li>
            <li><strong>Water Potential:</strong> Describes the energy status of water in plants and soil.</li>
        </ul>
        <hr>
    </div>
    <div style="text-align: center;">
        <p><strong>Zones Flown Through:</strong> <span id="score">0</span></p>
        <p><strong>High Score:</strong> <span id="highScore">0</span></p>
    </div>
`;

container.appendChild(canvasWrapper);
container.appendChild(sidebar);
document.body.appendChild(container);

localStorage.setItem("flappyLeafHighScore", 0);

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
  obstacleSpeed = 3;
  const minutesElapsed = Math.floor(frame / (60 * 60));
  const damageBonus = minutesElapsed * 5;
  const spawnRate = Math.max(60, 240 - frame / 60);

  if (frame > 0) {
    leaf.velocity += gravity;
    leaf.y += leaf.velocity;
  }

  const groundLevel = canvas.height - groundOffset;

  if (leaf.y + leaf.height > groundLevel) {
    leaf.velocity = -10;
    leaf.y -= 50;
    waterLevel -= 20;
    return;
  }

  if (leaf.y < 0) {
    leaf.y = 0;
    leaf.velocity = 0;
  }

  if (frame % Math.floor(spawnRate) === 0) {
    let type = Math.random() < 0.05 ? "instantDeath" : ["drought", "tornado", "fire"][Math.floor(Math.random() * 3)];
    obstacles.push({
      x: canvas.width,
      y: Math.random() * (groundLevel - 200),
      width: 100,
      height: 200,
      type: type,
      damage: 10 + damageBonus
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
      waterLevel -= 2.5;
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
  restartTimeout = true;
  showInstructions = true;
  gameRunning = false;
  drawInstructions(`${deathReason} Final Score: ${score}`);
  score = 0;
  frame = 0;
  setTimeout(() => {
    restartTimeout = false;
  }, 3000);
}

function drawBackground() {
  if (bgImg.loaded) {
    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = '#e9fbe4';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.font = "24px Arial";
  ctx.fillStyle = "#000";
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
    ctx.fillText(`You died! Reason: ${reason}`, 330, 230);
  }
  ctx.fillStyle = "#000";
  ctx.fillText("Click to flap your leaf and fly through the obstacles.", 330, 280);
  ctx.fillText("Avoid hazards like drought, tornado, and fire.", 370, 320);
  ctx.fillText("Collect clouds, roots, and water to stay hydrated.", 340, 360);
  ctx.fillText("Hitting the ground also drains your water.", 370, 400);
  ctx.fillText("The axe is an insta-kill, avoid it to stay alive", 360, 440);
  ctx.fillText("Press any key or click to start!", 420, 500);
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
  }
});

document.addEventListener("keydown", () => {
  if (!gameRunning) {
    startGame();
  } else {
    leaf.velocity = -9;
  }
});
