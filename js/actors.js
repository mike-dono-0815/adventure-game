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
    });
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
  }

  function draw(ctx) {
    var perspective = Game.Room.getPerspective();
    var walkArea    = Game.Room.getWalkArea();
    var baseH = Game.Config.PLAYER_HEIGHT;

    var FRAME_COLS = { right: { stand: 0, walk: 1, talk: 2 }, left: { stand: 2, walk: 1, talk: 0 } };

    for (var i = 0; i < actors.length; i++) {
      var actor    = actors[i];
      var npcColor = Game.Config.COLORS.TEXT_NPC;
      var isTalking = (actor.multiFile || actor.dualSheet) && Game.TextBox.getTalkPhase() === 1 && Game.TextBox.getSpeakerColor() === npcColor;

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
  }

  return {
    spawn:        spawn,
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
