Game.Renderer = (function () {
  var canvas, ctx;
  var scale = 1;
  var offsetX = 0, offsetY = 0;
  var lastTime = 0;
  var fadeAlpha = 0;
  var fadeDirection = 0; // 0=none, 1=fading out, -1=fading in
  var fadeCallback = null;
  var victoryShown = false;

  function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    Game.Input.init(canvas);
  }

  function resize() {
    var cfg = Game.Config;
    var winW = window.innerWidth;
    var winH = window.innerHeight;

    var scaleX = winW / cfg.WIDTH;
    var scaleY = winH / cfg.HEIGHT;
    scale = Math.min(scaleX, scaleY);

    canvas.width = Math.floor(cfg.WIDTH * scale);
    canvas.height = Math.floor(cfg.HEIGHT * scale);
    offsetX = 0;
    offsetY = 0;
  }

  function getScale() { return scale; }
  function getOffset() { return { x: offsetX, y: offsetY }; }

  function fadeOut(callback) {
    fadeDirection = 1;
    fadeAlpha = 0;
    fadeCallback = callback;
  }

  function fadeIn(callback) {
    fadeDirection = -1;
    fadeAlpha = 1;
    fadeCallback = callback;
  }

  function showVictory() {
    victoryShown = true;
  }

  function loop(timestamp) {
    var dt = lastTime ? (timestamp - lastTime) / 1000 : 1 / 60;
    if (dt > 0.1) dt = 0.1;
    lastTime = timestamp;

    update(dt);
    render();
    requestAnimationFrame(loop);
  }

  function start() {
    requestAnimationFrame(loop);
  }

  function update(dt) {
    // Fade
    if (fadeDirection !== 0) {
      fadeAlpha += fadeDirection * dt * 3;
      if (fadeDirection === 1 && fadeAlpha >= 1) {
        fadeAlpha = 1;
        fadeDirection = 0;
        if (fadeCallback) { var cb = fadeCallback; fadeCallback = null; cb(); }
      } else if (fadeDirection === -1 && fadeAlpha <= 0) {
        fadeAlpha = 0;
        fadeDirection = 0;
        if (fadeCallback) { var cb = fadeCallback; fadeCallback = null; cb(); }
      }
      return; // Skip game updates during fade
    }

    Game.Player.update(dt);
    Game.TextBox.update(dt);
    Game.Dialogue.update(dt);
  }

  function render() {
    var cfg = Game.Config;

    ctx.save();
    ctx.scale(scale, scale);

    // Clear
    ctx.fillStyle = cfg.COLORS.BG;
    ctx.fillRect(0, 0, cfg.WIDTH, cfg.HEIGHT);

    // Viewport
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, cfg.WIDTH, cfg.VIEWPORT_HEIGHT);
    ctx.clip();

    Game.Room.draw(ctx);
    if (!Game.Room.isNoWalk()) Game.Player.draw(ctx);
    Game.TextBox.draw(ctx);

    ctx.restore();

    // Action line
    Game.ActionLine.draw(ctx);

    // Bottom bar
    if (Game.Dialogue.isActive()) {
      Game.Dialogue.draw(ctx);
    } else {
      Game.Verbs.draw(ctx);
      Game.Inventory.draw(ctx);
    }

    // Hotspot tooltip near cursor
    drawTooltip(ctx);

    // Fade overlay
    if (fadeAlpha > 0) {
      ctx.fillStyle = 'rgba(0,0,0,' + fadeAlpha + ')';
      ctx.fillRect(0, 0, cfg.WIDTH, cfg.HEIGHT);
    }

    // Victory screen
    if (victoryShown) {
      drawVictory(ctx);
    }

    // Save/Load menu
    Game.SaveLoad.draw(ctx);

    ctx.restore();

    // Cursor style
    canvas.style.cursor = Game.Input.getCursorStyle();
  }

  function drawTooltip(ctx) {
    var pos = Game.Input.getGamePos();
    if (pos.y >= Game.Config.VIEWPORT_HEIGHT) return;

    var hs = Game.Room.getHotspotAt(pos.x, pos.y);
    if (!hs) return;

    var name = hs.name;
    ctx.font = '16px ' + Game.Config.FONT_FAMILY;
    var tw = ctx.measureText(name).width;
    var tx = Math.min(pos.x + 15, Game.Config.WIDTH - tw - 10);
    var ty = Math.max(pos.y - 10, 20);

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(tx - 4, ty - 16, tw + 8, 22);
    ctx.fillStyle = '#ffdd57';
    ctx.fillText(name, tx, ty);
  }

  function drawVictory(ctx) {
    var cfg = Game.Config;
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, cfg.WIDTH, cfg.HEIGHT);

    ctx.fillStyle = '#ffdd57';
    ctx.font = 'bold 48px ' + cfg.FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.fillText('CONGRATULATIONS!', cfg.WIDTH / 2, cfg.HEIGHT / 2 - 80);

    ctx.fillStyle = '#e0e0e0';
    ctx.font = '28px ' + cfg.FONT_FAMILY;
    ctx.fillText('You obtained the Separation Agreement!', cfg.WIDTH / 2, cfg.HEIGHT / 2 - 20);

    ctx.font = '22px ' + cfg.FONT_FAMILY;
    ctx.fillText('Alex can finally move on with their life.', cfg.WIDTH / 2, cfg.HEIGHT / 2 + 30);

    ctx.fillStyle = '#7ec8e3';
    ctx.font = '20px ' + cfg.FONT_FAMILY;
    ctx.fillText('Thank you for playing this demo!', cfg.WIDTH / 2, cfg.HEIGHT / 2 + 90);

    ctx.fillStyle = '#888';
    ctx.font = '16px ' + cfg.FONT_FAMILY;
    ctx.fillText('The Separation Agreement — A Point & Click Adventure', cfg.WIDTH / 2, cfg.HEIGHT / 2 + 140);

    ctx.textAlign = 'left';
  }

  return {
    init: init,
    start: start,
    getScale: getScale,
    getOffset: getOffset,
    fadeOut: fadeOut,
    fadeIn: fadeIn,
    showVictory: showVictory,
  };
})();
