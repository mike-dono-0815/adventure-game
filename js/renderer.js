Game.Renderer = (function () {
  var canvas, ctx;
  var scale = 1;
  var offsetX = 0, offsetY = 0;
  var lastTime = 0;
  var fadeAlpha = 0;
  var fadeDirection = 0; // 0=none, 1=fading out, -1=fading in
  var fadeCallback = null;
  var victoryShown = false;
  var started = false;

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
    started = true;
    requestAnimationFrame(loop);
  }

  function isStarted() { return started; }

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
    Game.Actors.update(dt);
    Game.Room.checkTriggers();
    Game.TextBox.update(dt);
    Game.Dialogue.update(dt);
    Game.Wordfight.update(dt);
    Game.TitleCard.update(dt);
    // FakeDeath has no per-frame update — driven entirely by clicks
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
    Game.DebugEditor.draw(ctx);
    if (!Game.Room.isNoWalk()) Game.Player.draw(ctx);
    Game.Wordfight.drawOverlay(ctx);
    Game.TextBox.draw(ctx);

    ctx.restore();

    // Action line
    Game.ActionLine.draw(ctx);

    // Bottom bar
    if (Game.Wordfight.isActive()) {
      Game.Wordfight.draw(ctx);
    } else if (Game.Dialogue.isActive()) {
      Game.Dialogue.draw(ctx);
    } else {
      Game.Verbs.draw(ctx);
      Game.Inventory.draw(ctx);
    }

    // Hotspot tooltip near cursor
    drawTooltip(ctx);

    // TitleCard — full-screen overlay
    if (Game.TitleCard.isActive()) {
      Game.TitleCard.draw(ctx);
    }

    // FakeDeath — full-screen overlay, drawn above everything except save menu
    if (Game.FakeDeath.isActive()) {
      Game.FakeDeath.draw(ctx);
    }

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

    // Cursor style — debug editor takes priority
    canvas.style.cursor = Game.DebugEditor.getCursorStyle() || Game.Input.getCursorStyle();
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
    var endImg = Game.Loader.getImage('bg_end');

    // Draw end page image in viewport
    if (endImg) {
      ctx.drawImage(endImg, 0, 0, cfg.WIDTH, cfg.VIEWPORT_HEIGHT);
    } else {
      ctx.fillStyle = '#0a2a4a';
      ctx.fillRect(0, 0, cfg.WIDTH, cfg.VIEWPORT_HEIGHT);
    }

    // Action line bar
    ctx.fillStyle = cfg.COLORS.ACTION_LINE_BG;
    ctx.fillRect(0, cfg.ACTION_LINE_Y, cfg.WIDTH, cfg.ACTION_LINE_HEIGHT);

    // Bottom bar
    ctx.fillStyle = cfg.COLORS.BOTTOM_BAR_BG;
    ctx.fillRect(0, cfg.BOTTOM_BAR_Y, cfg.WIDTH, cfg.BOTTOM_BAR_HEIGHT);

    var endLines = [
      'Six weeks later. A beach somewhere between Barbados and not-Amazon.',
      'The agreement is framed on the wall of a rented villa. Bob sent a postcard.',
      'Chip won the FIFA league. HR relocated to floor 28. Nobody noticed you left.',
      'You order another coconut drink and watch the horizon. It is, somehow, enough.',
    ];
    ctx.fillStyle = cfg.COLORS.TEXT_DEFAULT;
    ctx.font = cfg.FONT_SIZE + 'px ' + cfg.FONT_FAMILY;
    ctx.textAlign = 'left';
    var lineH = 36;
    var textX = 60;
    var textY = cfg.BOTTOM_BAR_Y + 34;
    for (var li = 0; li < endLines.length; li++) {
      ctx.fillText(endLines[li], textX, textY + li * lineH);
    }

    ctx.fillStyle = cfg.COLORS.VERB_HOVER;
    ctx.font = 'bold 32px ' + cfg.FONT_FAMILY;
    ctx.textAlign = 'right';
    ctx.fillText('THE END', cfg.WIDTH - 60, cfg.BOTTOM_BAR_Y + cfg.BOTTOM_BAR_HEIGHT - 28);
    ctx.textAlign = 'left';
  }

  return {
    init: init,
    start: start,
    isStarted: isStarted,
    getScale: getScale,
    getOffset: getOffset,
    fadeOut: fadeOut,
    fadeIn: fadeIn,
    showVictory: showVictory,
  };
})();
