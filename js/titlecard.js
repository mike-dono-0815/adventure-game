Game.TitleCard = (function () {

  var active   = false;
  var title    = '';
  var lines    = [];
  var elapsed  = 0;   // time since shown — used for fade-in
  var timer    = 0;   // counts down during fade-out only
  var fadingOut = false;
  var callback = null;

  var FADE_IN  = 0.6;
  var FADE_OUT = 0.5;
  var MIN_SHOW = 0.8; // earliest a click is accepted (after fade-in)

  function show(opts, cb) {
    active    = true;
    fadingOut = false;
    title     = opts.title || '';
    lines     = opts.lines || [];
    elapsed   = 0;
    timer     = 0;
    callback  = cb || null;
    Game.Input.lock();
  }

  function handleClick() {
    if (!active || fadingOut) return;
    if (elapsed < MIN_SHOW) return; // too early — absorb but don't dismiss
    fadingOut = true;
    timer     = FADE_OUT;
  }

  function update(dt) {
    if (!active) return;
    if (fadingOut) {
      timer -= dt;
      if (timer <= 0) {
        active    = false;
        fadingOut = false;
        Game.Input.unlock();
        var cb = callback;
        callback = null;
        if (cb) cb();
      }
    } else {
      elapsed += dt;
    }
  }

  function alpha() {
    if (fadingOut) return Math.max(0, timer / FADE_OUT);
    if (elapsed < FADE_IN) return elapsed / FADE_IN;
    return 1;
  }

  function draw(ctx) {
    if (!active) return;

    var cfg = Game.Config;
    var a   = alpha();

    ctx.save();
    ctx.globalAlpha = a;

    // Dark scrim
    ctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
    ctx.fillRect(0, 0, cfg.WIDTH, cfg.VIEWPORT_HEIGHT);

    var cx = cfg.WIDTH / 2;
    var cy = cfg.VIEWPORT_HEIGHT / 2;

    // Decorative horizontal rules
    var ruleW = 560;
    var ruleY1 = cy - 68;
    var ruleY2 = cy + 56 + (lines.length - 1) * 32;
    ctx.strokeStyle = '#FEBD69';
    ctx.lineWidth   = 1.5;
    ctx.globalAlpha = a * 0.6;
    ctx.beginPath(); ctx.moveTo(cx - ruleW / 2, ruleY1); ctx.lineTo(cx + ruleW / 2, ruleY1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - ruleW / 2, ruleY2); ctx.lineTo(cx + ruleW / 2, ruleY2); ctx.stroke();
    ctx.globalAlpha = a;

    // Title
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor  = 'rgba(255, 153, 0, 0.9)';
    ctx.shadowBlur   = 28;
    ctx.fillStyle    = '#FEBD69';
    ctx.font         = 'italic bold 72px Georgia, "Times New Roman", serif';
    ctx.fillText(title, cx, cy - 14);

    // Subtitle lines
    ctx.shadowBlur = 0;
    ctx.fillStyle  = 'rgba(255,255,255,0.75)';
    ctx.font       = '22px ' + cfg.FONT_FAMILY;
    for (var i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], cx, cy + 36 + i * 32);
    }

    // "Click to continue" hint — only visible after fade-in
    if (!fadingOut && elapsed > FADE_IN) {
      var hintAlpha = Math.min(1, (elapsed - FADE_IN) / 0.4);
      ctx.globalAlpha = a * hintAlpha * 0.5;
      ctx.font        = '17px ' + cfg.FONT_FAMILY;
      ctx.fillStyle   = '#ffffff';
      ctx.fillText('click anywhere to continue', cx, cfg.VIEWPORT_HEIGHT - 36);
    }

    ctx.shadowBlur   = 0;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign    = 'left';
    ctx.restore();
  }

  function isActive() { return active; }

  return { show: show, handleClick: handleClick, update: update, draw: draw, isActive: isActive };
})();
