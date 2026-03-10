Game.FakeDeath = (function () {

  var active      = false;
  var clickCount  = 0;
  var itemId      = null;
  var endCallback = null;
  var finished    = false;

  // 5 messages. clickCount 0..4 maps to each one.
  // On click 4 (showing last message) the item is added and finished=true.
  // One further click closes the overlay and fires the callback.
  var MESSAGES = [
    {
      header: null,
      body:   'You snatch the headphones.\nThe Amazonian spins around with the fury of someone\nwhose flow state was just destroyed.\n\nEverything goes red.',
      bg:     'rgba(140,0,0,0.95)',
      color:  '#e0e0e0'
    },
    {
      header: 'YOU ARE DEAD.',
      body:   'The Amazonian filed an HR complaint, a security report,\nand a LinkedIn post about you simultaneously.\n\nYou are terminated. Literally.',
      bg:     'rgba(8,0,0,0.97)',
      color:  '#e0e0e0'
    },
    {
      header: 'GAME OVER.',
      body:   "You thought you can't die in a point-and-click?\n\nHa. This is not that kind of game.\nPlease restart from your last save.",
      bg:     'rgba(8,0,0,0.97)',
      color:  '#e0e0e0'
    },
    {
      header: null,
      body:   "No, really. Close the tab. It's over.\n\nWe'll wait.",
      bg:     'rgba(8,0,0,0.97)',
      color:  '#aaaaaa'
    },
    {
      header: null,
      body:   "...okay. Fine. You got us.\n\nThe Amazonian looks up, pulls off the headphones,\nand hands them to you without drama.\n\n'It's Amazon's anyway.'\n\nThey pack up their things and leave.\nYou have the headphones.",
      bg:     'rgba(0,25,0,0.95)',
      color:  '#88cc88'
    }
  ];

  // ─── Public entry ─────────────────────────────────────────────────────────────

  function start(item, callback) {
    active      = true;
    clickCount  = 0;
    finished    = false;
    itemId      = item;
    endCallback = callback;
  }

  // ─── Input ────────────────────────────────────────────────────────────────────

  function handleClick() {
    if (!active) return false;

    if (finished) {
      // Final message already shown — close overlay and continue
      active      = false;
      var cb      = endCallback;
      endCallback = null;
      if (cb) cb();
      return true;
    }

    clickCount++;
    if (clickCount >= MESSAGES.length - 1) {
      // Now on the final message — add item to inventory
      Game.Inventory.add(itemId);
      finished = true;
    }

    return true;
  }

  function isActive() { return active; }

  // ─── Drawing ─────────────────────────────────────────────────────────────────

  function draw(ctx) {
    if (!active) return;

    var cfg = Game.Config;
    var msg = MESSAGES[Math.min(clickCount, MESSAGES.length - 1)];

    // Full-screen overlay — covers viewport and bottom bar
    ctx.fillStyle = msg.bg;
    ctx.fillRect(0, 0, cfg.WIDTH, cfg.HEIGHT);

    var cx = cfg.WIDTH  / 2;
    var cy = cfg.HEIGHT / 2;

    ctx.save();
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';

    // Header (death/game-over title)
    if (msg.header) {
      ctx.fillStyle   = '#ff2020';
      ctx.font        = 'bold 88px ' + cfg.FONT_FAMILY;
      ctx.shadowColor = 'rgba(255,0,0,0.85)';
      ctx.shadowBlur  = 40;
      ctx.fillText(msg.header, cx, cy - 130);
      ctx.shadowBlur  = 0;
    }

    // Body — split on \n, blank lines become half-height spacers
    ctx.fillStyle = msg.color;
    ctx.font      = '24px ' + cfg.FONT_FAMILY;

    var lines   = msg.body.split('\n');
    var lineH   = 38;
    var bodyOffY = msg.header ? 40 : 0;

    // Count non-empty lines to vertically centre the block
    var nonEmpty = 0;
    for (var i = 0; i < lines.length; i++) {
      if (lines[i]) nonEmpty++;
    }
    var totalH = nonEmpty * lineH;
    var startY = cy + bodyOffY - totalH / 2;

    var li = 0;
    for (var j = 0; j < lines.length; j++) {
      if (lines[j]) {
        ctx.fillText(lines[j], cx, startY + li * lineH);
        li++;
      } else {
        startY += lineH * 0.4; // blank line gap
      }
    }

    // Footer hint
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.font      = '17px ' + cfg.FONT_FAMILY;
    ctx.fillText('(click to continue)', cx, cfg.HEIGHT - 48);

    ctx.restore();
  }

  // ─── Public API ───────────────────────────────────────────────────────────────

  return {
    start:       start,
    handleClick: handleClick,
    isActive:    isActive,
    draw:        draw,
  };

})();
