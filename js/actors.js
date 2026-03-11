Game.Actors = (function () {
  var actors = [];

  function spawn(id, x, y, spriteKey, cols, rows, dir, multiFile, dualSheet) {
    remove(id); // avoid duplicates
    actors.push({
      id:             id,
      x:              x,
      y:              y,
      tx:             x,
      ty:             y,
      walking:        false,
      direction:      dir || 'right',
      spriteKey:      spriteKey,
      cols:           cols,
      rows:           rows,
      multiFile:      multiFile || false,
      dualSheet:      dualSheet || false,
      animFrame:      0,
      animTimer:      0,
      arriveCallback: null,
      // rant mode
      ranting:        false,
      rantTexts:      [],
      rantIndex:      0,
      rantTimer:      0,
      rantInterval:   2.0,
      rantTalkPhase:  0,
      rantTalkTimer:  0,
      rantTalkSpeed:  0.07,
    });
  }

  function pauseRant(id) {
    var actor = find(id);
    if (actor) actor.ranting = false;
  }

  function resumeRant(id) {
    var actor = find(id);
    if (actor && actor.rantTexts && actor.rantTexts.length) actor.ranting = true;
  }

  function startRant(id, texts, interval, speed) {
    var actor = find(id);
    if (!actor) return;
    actor.ranting       = true;
    actor.rantTexts     = texts || [];
    actor.rantIndex     = 0;
    actor.rantTimer     = 0;
    actor.rantInterval  = interval || 2.0;
    actor.rantTalkSpeed = speed || 0.07;
    actor.rantTalkPhase = 1;
    actor.rantTalkTimer = 0;
  }

  function walkTo(id, tx, ty, callback) {
    var actor = find(id);
    if (!actor) {
      if (callback) callback();
      return;
    }
    actor.tx             = tx;
    actor.ty             = ty;
    actor.walking        = true;
    actor.arriveCallback = callback || null;
  }

  function setDirection(id, dir) {
    var actor = find(id);
    if (actor) actor.direction = dir;
  }

  function remove(id) {
    actors = actors.filter(function (a) { return a.id !== id; });
  }

  function clear() {
    actors = [];
  }

  function getHeadY(id) {
    var actor = find(id);
    if (!actor) return 0;
    var ph = Game.Config.PLAYER_HEIGHT;
    var perspective = Game.Room.getPerspective();
    var walkArea    = Game.Room.getWalkArea();
    if (perspective && walkArea) {
      var ys = walkArea.map(function (p) { return p[1]; });
      var y1 = Math.min.apply(null, ys);
      var y2 = Math.max.apply(null, ys);
      var t  = (actor.y - y1) / (y2 - y1);
      var s  = perspective.min_scale + t * (perspective.max_scale - perspective.min_scale);
      ph = Math.round(ph * s);
    }
    return Math.round(actor.y - ph);
  }

  function getX(id) {
    var actor = find(id);
    return actor ? actor.x : 0;
  }

  function find(id) {
    for (var i = 0; i < actors.length; i++) {
      if (actors[i].id === id) return actors[i];
    }
    return null;
  }

  function update(dt) {
    var speed = Game.Config.PLAYER_SPEED;
    for (var i = 0; i < actors.length; i++) {
      var actor = actors[i];
      if (!actor.walking) {
        actor.animFrame = 0;
        actor.animTimer = 0;
        continue;
      }

      var dx   = actor.tx - actor.x;
      var dy   = actor.ty - actor.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var step = speed * dt;

      if (Math.abs(dx) > Math.abs(dy)) {
        actor.direction = dx > 0 ? 'right' : 'left';
      }

      if (dist <= step) {
        actor.x = actor.tx;
        actor.y = actor.ty;
        actor.walking = false;
        var cb = actor.arriveCallback;
        actor.arriveCallback = null;
        if (cb) cb();
      } else {
        actor.x += (dx / dist) * step;
        actor.y += (dy / dist) * step;
      }

      actor.animTimer += dt;
      if (actor.animTimer >= 0.15) {
        actor.animTimer = 0;
        actor.animFrame = (actor.animFrame + 1) % 2;
      }
    }

    // Rant mode — independent of walking
    for (var j = 0; j < actors.length; j++) {
      var ra = actors[j];
      if (!ra.ranting) continue;
      ra.rantTimer += dt;
      if (ra.rantTimer >= ra.rantInterval) {
        ra.rantTimer = 0;
        ra.rantIndex = (ra.rantIndex + 1) % ra.rantTexts.length;
      }
      ra.rantTalkTimer += dt;
      if (ra.rantTalkTimer >= ra.rantTalkSpeed) {
        ra.rantTalkTimer = 0;
        ra.rantTalkPhase = 1 - ra.rantTalkPhase;
      }
    }
  }

  function draw(ctx) {
    var perspective = Game.Room.getPerspective();
    var walkArea    = Game.Room.getWalkArea();
    var baseH = Game.Config.PLAYER_HEIGHT;

    var FRAME_COLS = { right: { stand: 0, walk: 1, talk: 2 }, left: { stand: 2, walk: 1, talk: 0 } };

    for (var i = 0; i < actors.length; i++) {
      var actor    = actors[i];
      var npcColor = Game.Config.COLORS.TEXT_NPC;
      var isTalking = actor.ranting
        ? actor.rantTalkPhase === 1
        : (actor.multiFile || actor.dualSheet) && Game.TextBox.getTalkPhase() === 1 && Game.TextBox.getSpeakerColor() === npcColor;

      var ph = baseH;
      if (perspective && walkArea) {
        var ys = walkArea.map(function (p) { return p[1]; });
        var y1 = Math.min.apply(null, ys);
        var y2 = Math.max.apply(null, ys);
        var t  = (actor.y - y1) / (y2 - y1);
        var s  = perspective.min_scale + t * (perspective.max_scale - perspective.min_scale);
        ph = Math.round(ph * s);
      }

      if (actor.dualSheet) {
        var statePrefix = isTalking ? 'talk' : (actor.walking ? (actor.animFrame === 0 ? 'stand' : 'walk') : 'stand');
        var sheetKey    = actor.spriteKey + '_sheet_' + actor.direction;
        var sheet       = Game.Loader.getImage(sheetKey);
        if (!sheet) continue;

        var col         = FRAME_COLS[actor.direction][statePrefix];
        var frameW      = sheet.naturalWidth / 3;
        var frameH      = sheet.naturalHeight;
        var pw          = Math.round(ph * (frameW / frameH)) || Math.round(ph * 0.9);
        var drawY       = Math.round(actor.y - ph);

        // Anchor to the centre of mass of the current frame's non-transparent pixels
        var fb         = Game.Loader.getFrameBounds(sheetKey, col);
        var anchorFrac = fb ? fb.cx : 0.5;
        var drawX      = Math.round(actor.x - anchorFrac * pw);

        ctx.drawImage(sheet, col * frameW, 0, frameW, frameH, drawX, drawY, pw, ph);
        continue;
      }

      var spriteKey = actor.multiFile
        ? actor.spriteKey + '_' + (isTalking ? 'talk' : actor.walking ? (actor.animFrame === 0 ? 'stand' : 'walk') : 'stand') + '_' + actor.direction
        : actor.spriteKey;
      var sprite = Game.Loader.getImage(spriteKey);
      if (!sprite) continue;

      var padFrac = Game.Loader.getImagePad(spriteKey);
      var pw      = Math.round(ph * (sprite.width / sprite.height)) || Math.round(ph * 0.9);
      var drawX   = Math.round(actor.x - pw / 2);
      var drawY   = Math.round(actor.y - ph * (1 - padFrac));

      ctx.drawImage(sprite, drawX, drawY, pw, ph);
    }

    // Draw rant text above ranting actors
    for (var r = 0; r < actors.length; r++) {
      var ra = actors[r];
      if (!ra.ranting || !ra.rantTexts.length) continue;
      var line = ra.rantTexts[ra.rantIndex];
      var cfg  = Game.Config;
      ctx.save();
      ctx.font = cfg.FONT_SIZE + 'px ' + cfg.FONT_FAMILY;
      ctx.textAlign = 'center';
      var tw   = ctx.measureText(line).width;
      var pad  = 10;
      var tx   = Math.max(tw / 2 + pad, Math.min(ra.x, cfg.WIDTH - tw / 2 - pad));
      var ty   = ra.y - baseH - 20;
      if (ty < cfg.FONT_SIZE + pad) ty = cfg.FONT_SIZE + pad;
      ctx.fillStyle = 'rgba(0,0,0,0.78)';
      ctx.fillRect(tx - tw / 2 - pad, ty - cfg.FONT_SIZE - pad, tw + pad * 2, cfg.FONT_SIZE + pad * 2);
      ctx.fillStyle = npcColor;
      ctx.fillText(line, tx, ty);
      ctx.restore();
    }
  }

  return {
    spawn:        spawn,
    startRant:    startRant,
    pauseRant:    pauseRant,
    resumeRant:   resumeRant,
    walkTo:       walkTo,
    setDirection: setDirection,
    remove:       remove,
    clear:        clear,
    getX:         getX,
    getHeadY:     getHeadY,
    update:       update,
    draw:         draw,
  };
})();
