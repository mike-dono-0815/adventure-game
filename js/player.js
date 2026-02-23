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
    direction = dir;
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
    if (!walking || targetPath.length === 0) {
      walking = false;
      animFrame = 0;
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
    var pw = Game.Config.PLAYER_WIDTH;
    var ph = Game.Config.PLAYER_HEIGHT;
    var drawX = Math.round(x - pw / 2);
    var drawY = Math.round(y - ph);

    var sprite = Game.Loader.getImage('player_sprite');
    if (!sprite) return;

    var COLS = 4, ROWS = 2;
    var frameW = sprite.width / COLS;
    var frameH = sprite.height / ROWS;
    var crop = 4;

    // Right: row 0, cols 0-1 — Left: row 1, cols 2-3
    var row = direction === 'right' ? 0 : 1;
    var col = direction === 'right' ? animFrame : 2 + animFrame;

    ctx.drawImage(sprite,
      col * frameW + crop, row * frameH + crop, frameW - crop * 2, frameH - crop * 2,
      drawX, drawY, pw, ph);
  }

  function getX() { return x; }
  function getY() { return y; }
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
    isWalking: isWalking,
    getDirection: getDirection,
    serialize: serialize,
    deserialize: deserialize,
  };
})();
