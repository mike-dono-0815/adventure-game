Game.TextBox = (function () {
  var activeTexts = [];
  var blocking = false;
  var blockCallback = null;
  var talkPhase    = 0;
  var talkTimer    = 0;
  var talkInterval = 0.50;

  function randomTalkInterval() {
    return 0.20 + Math.random() * 0.60; // 0.20 – 0.80 s
  }

  function show(text, x, y, color, duration, callback) {
    activeTexts.push({
      text: text,
      x: x,
      y: y,
      color: color || Game.Config.COLORS.TEXT_DEFAULT,
      timer: duration || Math.max(2, text.length * 0.05),
      alpha: 1,
      callback: callback || null,
    });
  }

  function showBlocking(text, x, y, color, callback) {
    var duration = Math.max(2.5, text.length * 0.06);
    blocking = true;
    blockCallback = function () {
      blocking = false;
      if (callback) callback();
    };
    activeTexts = [{
      text: text,
      x: x,
      y: y,
      color: color || Game.Config.COLORS.TEXT_DEFAULT,
      timer: duration,
      alpha: 1,
      callback: blockCallback,
    }];
  }

  function dismiss() {
    if (blocking && activeTexts.length > 0) {
      var cb = activeTexts[0].callback;
      activeTexts = [];
      blocking = false;
      if (cb) cb();
      return true;
    }
    return false;
  }

  function isBlocking() {
    return blocking;
  }

  function update(dt) {
    if (activeTexts.length > 0) {
      talkTimer += dt;
      if (talkTimer >= talkInterval) {
        talkTimer    = 0;
        talkPhase    = 1 - talkPhase;
        talkInterval = randomTalkInterval();
      }
    } else {
      talkPhase    = 0;
      talkTimer    = 0;
      talkInterval = randomTalkInterval();
    }

    for (var i = activeTexts.length - 1; i >= 0; i--) {
      activeTexts[i].timer -= dt;
      if (activeTexts[i].timer <= 0.3) {
        activeTexts[i].alpha = Math.max(0, activeTexts[i].timer / 0.3);
      }
      if (activeTexts[i].timer <= 0) {
        var cb = activeTexts[i].callback;
        activeTexts.splice(i, 1);
        if (cb) cb();
      }
    }
  }

  function draw(ctx) {
    var cfg = Game.Config;
    ctx.font = cfg.FONT_SIZE + 'px ' + cfg.FONT_FAMILY;
    ctx.textAlign = 'center';

    for (var i = 0; i < activeTexts.length; i++) {
      var t = activeTexts[i];
      var lines = wordWrap(ctx, t.text, 600);
      var lineH = cfg.FONT_SIZE + 6;
      var totalH = lines.length * lineH;

      // Position above the given point, clamped to viewport
      var drawY = t.y - totalH - 10;
      if (drawY < 10) drawY = 10;
      var drawX = Math.max(310, Math.min(t.x, cfg.WIDTH - 310));

      // Background
      var maxW = 0;
      for (var j = 0; j < lines.length; j++) {
        var w = ctx.measureText(lines[j]).width;
        if (w > maxW) maxW = w;
      }

      ctx.save();
      ctx.globalAlpha = t.alpha * 0.75;
      ctx.fillStyle = '#000000';
      var pad = 10;
      ctx.fillRect(drawX - maxW / 2 - pad, drawY - pad, maxW + pad * 2, totalH + pad * 2);
      ctx.globalAlpha = t.alpha;
      ctx.fillStyle = t.color;
      for (var j = 0; j < lines.length; j++) {
        ctx.fillText(lines[j], drawX, drawY + j * lineH + cfg.FONT_SIZE);
      }
      ctx.restore();
    }

    ctx.textAlign = 'left';
  }

  function wordWrap(ctx, text, maxWidth) {
    var paragraphs = text.split('\n');
    var lines = [];
    for (var p = 0; p < paragraphs.length; p++) {
      var words = paragraphs[p].split(' ');
      var current = '';
      for (var i = 0; i < words.length; i++) {
        var test = current ? current + ' ' + words[i] : words[i];
        if (ctx.measureText(test).width > maxWidth && current) {
          lines.push(current);
          current = words[i];
        } else {
          current = test;
        }
      }
      if (current) lines.push(current);
    }
    return lines;
  }

  function clear() {
    activeTexts = [];
    blocking = false;
    blockCallback = null;
  }

  function getTalkPhase()    { return talkPhase; }
  function getSpeakerColor() { return activeTexts.length > 0 ? activeTexts[0].color : null; }

  return {
    show: show,
    showBlocking: showBlocking,
    dismiss: dismiss,
    isBlocking: isBlocking,
    update: update,
    draw: draw,
    clear: clear,
    getTalkPhase: getTalkPhase,
    getSpeakerColor: getSpeakerColor,
  };
})();
