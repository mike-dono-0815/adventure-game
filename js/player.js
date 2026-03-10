Game.Player = (function () {
  var x = 960, y = 600;
  var targetPath = [];
  var walking = false;
  var direction = 'right'; // left, right
  var animFrame = 0;
  var animTimer = 0;
  var arriveCallback = null;

  var cfg = null;

  function init() {
    cfg = Game.Config;
  }

  function setPosition(nx, ny) {
    x = nx;
    y = ny;
    targetPath = [];
    walking = false;
  }

  function setDirection(dir) {
    if (dir === 'left' || dir === 'right') direction = dir;
    // 'back', 'front', etc. have no sprite sheet — keep current direction
  }

  function walkTo(tx, ty, callback) {
    var walkArea = Game.Room.getWalkArea();
    if (!walkArea) {
      setPosition(tx, ty);
      if (callback) callback();
      return;
    }

    var clamped = Game.Pathfinding.clampToPolygon(tx, ty, walkArea);
    var path = Game.Pathfinding.findPath(x, y, clamped.x, clamped.y, walkArea);

    targetPath = path;
    walking = true;
    arriveCallback = callback || null;
  }

  function cancelWalk() {
    targetPath = [];
    walking = false;
    arriveCallback = null;
  }

  function update(dt) {
    if (!walking) {
      animFrame = 0;
      return;
    }
    if (targetPath.length === 0) {
      walking = false;
      animFrame = 0;
      var cb = arriveCallback;
      arriveCallback = null;
      if (cb) cb();
      return;
    }

    var target = targetPath[0];
    var dx = target.x - x;
    var dy = target.y - y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var speed = Game.Config.PLAYER_SPEED * dt;

    // Direction detection — only left/right; keep last direction for vertical movement
    if (Math.abs(dx) > Math.abs(dy)) {
      direction = dx > 0 ? 'right' : 'left';
    }

    if (dist <= speed) {
      x = target.x;
      y = target.y;
      targetPath.shift();
      if (targetPath.length === 0) {
        walking = false;
        var cb = arriveCallback;
        arriveCallback = null;
        if (cb) cb();
      }
    } else {
      x += (dx / dist) * speed;
      y += (dy / dist) * speed;
    }

    // Animate
    animTimer += dt;
    if (animTimer >= 0.15) {
      animTimer = 0;
      animFrame = (animFrame + 1) % 2;
    }
  }

  function draw(ctx) {
    var ph = Game.Config.PLAYER_HEIGHT;

    var perspective = Game.Room.getPerspective();
    var walkArea    = Game.Room.getWalkArea();
    if (perspective && walkArea) {
      var ys = walkArea.map(function (p) { return p[1]; });
      var y1 = Math.min.apply(null, ys);
      var y2 = Math.max.apply(null, ys);
      var t  = (y - y1) / (y2 - y1);
      var s  = perspective.min_scale + t * (perspective.max_scale - perspective.min_scale);
      ph = Math.round(ph * s);
    }

    var FRAME_COLS = { right: { stand: 0, walk: 1, talk: 2 }, left: { stand: 2, walk: 1, talk: 0 } };

    var playerColor = Game.Config.COLORS.TEXT_PLAYER;
    var isTalking   = Game.TextBox.getTalkPhase() === 1 && Game.TextBox.getSpeakerColor() === playerColor;
    var statePrefix = isTalking ? 'talk'
                    : walking   ? (animFrame === 0 ? 'stand' : 'walk')
                    : 'stand';

    var sheetKey  = 'player_sheet_' + direction;
    var sheet     = Game.Loader.getImage(sheetKey);
    if (!sheet) return;

    var col         = FRAME_COLS[direction][statePrefix];
    var frameW      = sheet.naturalWidth / 3;
    var frameH      = sheet.naturalHeight;
    var pw          = Math.round(ph * (frameW / frameH)) || Math.round(ph * 0.9);
    var drawY       = Math.round(y - ph);

    // Anchor to the centre of mass of the current frame's non-transparent pixels
    var fb         = Game.Loader.getFrameBounds(sheetKey, col);
    var anchorFrac = fb ? fb.cx : 0.5;
    var drawX      = Math.round(x - anchorFrac * pw);

    ctx.drawImage(sheet, col * frameW, 0, frameW, frameH, drawX, drawY, pw, ph);
  }

  function getX() { return x; }
  function getY() { return y; }

  function getHeadY() {
    var ph = cfg.PLAYER_HEIGHT;
    var perspective = Game.Room.getPerspective();
    var walkArea    = Game.Room.getWalkArea();
    if (perspective && walkArea) {
      var ys = walkArea.map(function (p) { return p[1]; });
      var y1 = Math.min.apply(null, ys);
      var y2 = Math.max.apply(null, ys);
      var t  = (y - y1) / (y2 - y1);
      var s  = perspective.min_scale + t * (perspective.max_scale - perspective.min_scale);
      ph = Math.round(ph * s);
    }
    return Math.round(y - ph);
  }
  function isWalking() { return walking; }
  function getDirection() { return direction; }

  function serialize() {
    return { x: x, y: y, direction: direction };
  }

  function deserialize(data) {
    x = data.x;
    y = data.y;
    direction = data.direction || 'right';
    targetPath = [];
    walking = false;
  }

  return {
    init: init,
    setPosition: setPosition,
    setDirection: setDirection,
    walkTo: walkTo,
    cancelWalk: cancelWalk,
    update: update,
    draw: draw,
    getX: getX,
    getY: getY,
    getHeadY: getHeadY,
    isWalking: isWalking,
    getDirection: getDirection,
    serialize: serialize,
    deserialize: deserialize,
  };
})();
