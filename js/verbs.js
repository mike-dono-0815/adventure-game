Game.Verbs = (function () {
  var currentVerb = null;
  var hoverVerb = null;
  var cfg = null;

  function init() {
    cfg = Game.Config;
    currentVerb = null;
  }

  function getCurrent() {
    return currentVerb;
  }

  function setCurrent(verb) {
    currentVerb = verb;
  }

  function reset() {
    currentVerb = null;
    Game.ActionLine.setObject1(null);
    Game.ActionLine.setObject2(null);
  }

  function getActiveVerbs() {
    var verbs = cfg.VERBS;
    if (Game.Room && Game.Room.isNoWalk && Game.Room.isNoWalk()) {
      verbs = verbs.filter(function (v) { return v !== 'Walk to'; });
    }
    return verbs;
  }

  function handleClick(gx, gy) {
    var verbs = getActiveVerbs();
    var panelX = cfg.VERB_PANEL_X;
    var panelY = cfg.BOTTOM_BAR_Y;
    var cellW = cfg.VERB_PANEL_WIDTH / 3;
    var cellH = cfg.BOTTOM_BAR_HEIGHT / 3;

    var col = Math.floor((gx - panelX) / cellW);
    var row = Math.floor((gy - panelY) / cellH);

    if (col >= 0 && col < 3 && row >= 0 && row < 3) {
      var idx = row * 3 + col;
      if (idx < verbs.length) {
        currentVerb = verbs[idx];
        Game.ActionLine.setVerb(currentVerb);
        Game.ActionLine.setObject1(null);
        Game.ActionLine.setObject2(null);
        return true;
      }
    }
    return false;
  }

  function handleHover(gx, gy) {
    var verbs = getActiveVerbs();
    var cellW = cfg.VERB_PANEL_WIDTH / 3;
    var cellH = cfg.BOTTOM_BAR_HEIGHT / 3;

    var col = Math.floor((gx - cfg.VERB_PANEL_X) / cellW);
    var row = Math.floor((gy - cfg.BOTTOM_BAR_Y) / cellH);

    if (col >= 0 && col < 3 && row >= 0 && row < 3) {
      var idx = row * 3 + col;
      if (idx < verbs.length) {
        hoverVerb = verbs[idx];
        return;
      }
    }
    hoverVerb = null;
  }

  function draw(ctx) {
    var verbs = getActiveVerbs();
    var panelX = cfg.VERB_PANEL_X;
    var panelY = cfg.BOTTOM_BAR_Y;
    var cellW = cfg.VERB_PANEL_WIDTH / 3;
    var cellH = cfg.BOTTOM_BAR_HEIGHT / 3;

    // Background
    ctx.fillStyle = cfg.COLORS.BOTTOM_BAR_BG;
    ctx.fillRect(panelX, panelY, cfg.VERB_PANEL_WIDTH, cfg.BOTTOM_BAR_HEIGHT);

    ctx.font = '600 28px "Cinzel", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (var i = 0; i < verbs.length; i++) {
      var col = i % 3;
      var row = Math.floor(i / 3);
      var cx = panelX + col * cellW + cellW / 2;
      var cy = panelY + row * cellH + cellH / 2;

      if (verbs[i] === currentVerb) {
        ctx.fillStyle = cfg.COLORS.VERB_ACTIVE;
      } else if (verbs[i] === hoverVerb) {
        ctx.fillStyle = cfg.COLORS.VERB_HOVER;
      } else {
        ctx.fillStyle = cfg.COLORS.VERB_NORMAL;
      }

      ctx.fillText(verbs[i], cx, cy);

      // Subtle grid lines
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 3;
      ctx.strokeRect(panelX + col * cellW, panelY + row * cellH, cellW, cellH);
    }

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  return {
    init: init,
    getCurrent: getCurrent,
    setCurrent: setCurrent,
    reset: reset,
    handleClick: handleClick,
    handleHover: handleHover,
    draw: draw,
  };
})();
