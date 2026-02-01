(function() {
  var canvas = document.getElementById('gameCanvas');
  var ctx = canvas.getContext('2d');
  var scoreEl = document.getElementById('scoreEl');
  var finalScoreEl = document.getElementById('finalScore');
  var startPanel = document.getElementById('startPanel');
  var gameOverPanel = document.getElementById('gameOverPanel');
  var startBtn = document.getElementById('startBtn');
  var replayBtn = document.getElementById('replayBtn');

  var W, H, scale;
  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    scale = Math.min(W / 320, H / 480);
  }
  window.addEventListener('resize', resize);
  resize();

  var player = { x: 0, y: 0, vy: 0, w: 24 * scale, h: 32 * scale, lane: 1, grounded: true };
  var lanes = 3;
  var laneHeight;
  var obstacles = [];
  var score = 0;
  var gameTime = 0;
  var running = false;
  var gameOver = false;
  var animId;

  function getLaneY(lane) {
    if (!laneHeight) laneHeight = H / (lanes + 1);
    return lane * laneHeight;
  }

  function initGame() {
    laneHeight = H / (lanes + 1);
    player.lane = 1;
    player.y = getLaneY(player.lane) - player.h / 2;
    player.vy = 0;
    player.grounded = true;
    player.x = W * 0.2;
    obstacles = [];
    score = 0;
    gameTime = 0;
    gameOver = false;
    scoreEl.textContent = '0';
    gameOverPanel.classList.remove('show');
  }

  function spawnObstacle() {
    var lane = Math.floor(Math.random() * lanes) + 1;
    var size = 20 * scale;
    obstacles.push({
      x: W + size,
      y: getLaneY(lane) - size / 2,
      w: size,
      h: size,
      lane: lane,
    });
  }

  function jump() {
    if (!player.grounded || gameOver) return;
    player.grounded = false;
    player.vy = -12 * scale;
  }

  function moveToLane(up) {
    if (gameOver) return;
    var next = player.lane + (up ? -1 : 1);
    if (next < 1 || next > lanes) return;
    player.lane = next;
    player.targetY = getLaneY(player.lane) - player.h / 2;
  }

  function update(dt) {
    if (gameOver) return;
    gameTime += dt;
    score = Math.floor(gameTime / 100);
    scoreEl.textContent = score;

    if (player.targetY !== undefined) {
      var dy = player.targetY - player.y;
      player.y += dy * Math.min(1, dt * 0.01);
      if (Math.abs(dy) < 2) player.targetY = undefined;
    } else {
      player.vy += 30 * scale * (dt / 1000);
      player.y += player.vy * (dt / 1000) * 60;
      var groundY = getLaneY(player.lane) - player.h / 2;
      if (player.y >= groundY) {
        player.y = groundY;
        player.vy = 0;
        player.grounded = true;
      }
    }

    var speed = 0.15 * scale * (dt / 1);
    obstacles.forEach(function(o) {
      o.x -= speed * 120;
    });
    obstacles = obstacles.filter(function(o) { return o.x + o.w > 0; });

    if (gameTime > 0 && Math.random() < 0.015) spawnObstacle();

    obstacles.forEach(function(o) {
      if (player.x < o.x + o.w && player.x + player.w > o.x &&
          player.y < o.y + o.h && player.y + player.h > o.y) {
        gameOver = true;
        finalScoreEl.textContent = score;
        gameOverPanel.classList.add('show');
      }
    });
  }

  function draw() {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    for (var l = 1; l <= lanes; l++) {
      var ly = getLaneY(l);
      ctx.beginPath();
      ctx.moveTo(0, ly);
      ctx.lineTo(W, ly);
      ctx.stroke();
    }

    ctx.fillStyle = '#4ade80';
    ctx.fillRect(player.x, player.y, player.w, player.h);

    ctx.fillStyle = '#f87171';
    obstacles.forEach(function(o) {
      ctx.fillRect(o.x, o.y, o.w, o.h);
    });
  }

  function loop(t) {
    if (!running) return;
    var dt = t - (loop.last || t);
    loop.last = t;
    update(dt);
    draw();
    animId = requestAnimationFrame(loop);
  }

  function start() {
    initGame();
    startPanel.classList.add('hide');
    running = true;
    loop.last = performance.now();
    requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    if (animId) cancelAnimationFrame(animId);
  }

  startBtn.addEventListener('click', start);
  replayBtn.addEventListener('click', function() {
    gameOverPanel.classList.remove('show');
    start();
  });

  document.addEventListener('keydown', function(e) {
    if (e.code === 'Space') {
      e.preventDefault();
      if (startPanel.classList.contains('hide') && !gameOverPanel.classList.contains('show')) jump();
      else if (!startPanel.classList.contains('hide')) start();
    }
    if (e.code === 'ArrowUp') { e.preventDefault(); moveToLane(true); }
    if (e.code === 'ArrowDown') { e.preventDefault(); moveToLane(false); }
  });

  canvas.addEventListener('touchstart', function(e) {
    e.preventDefault();
    if (startPanel.classList.contains('hide') && !gameOverPanel.classList.contains('show')) {
      var touch = e.changedTouches[0];
      if (touch.clientX < W / 2) jump();
      else moveToLane(touch.clientY < H / 2);
    } else if (!startPanel.classList.contains('hide')) start();
  }, { passive: false });

  canvas.addEventListener('click', function(e) {
    if (startPanel.classList.contains('hide') && !gameOverPanel.classList.contains('show')) {
      if (e.offsetX < W / 2) jump();
      else moveToLane(e.offsetY < H / 2);
    }
  });
})();
