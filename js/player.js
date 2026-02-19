Game.Player = (function () {
  var x = 960, y = 600;
  var targetPath = [];
  var walking = false;
  var direction = 'front'; // front, back, left, right
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

    // Direction detection
    if (Math.abs(dx) > Math.abs(dy)) {
      direction = dx > 0 ? 'right' : 'left';
    } else {
      direction = dy > 0 ? 'front' : 'back';
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
      animFrame = (animFrame + 1) % 4;
    }
  }

  function draw(ctx) {
    var pw = Game.Config.PLAYER_WIDTH;
    var ph = Game.Config.PLAYER_HEIGHT;
    var drawX = Math.round(x - pw / 2);
    var drawY = Math.round(y - ph);

    // Draw character as colored rectangle with simple details
    ctx.fillStyle = Game.Config.COLORS.PLAYER;
    ctx.fillRect(drawX, drawY, pw, ph);

    // Head
    ctx.fillStyle = '#ffd5b4';
    ctx.beginPath();
    ctx.arc(x, drawY + 18, 16, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = '#4a3728';
    ctx.beginPath();
    ctx.arc(x, drawY + 12, 16, Math.PI, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = '#3b5998';
    ctx.fillRect(drawX + 8, drawY + 34, pw - 16, 50);

    // Legs
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(drawX + 12, drawY + 84, 16, 44);
    ctx.fillRect(drawX + pw - 28, drawY + 84, 16, 44);

    // Walk animation - leg movement
    if (walking) {
      var legOff = Math.sin(animFrame * Math.PI / 2) * 6;
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(drawX + 12, drawY + 84 + legOff, 16, 44);
      ctx.fillRect(drawX + pw - 28, drawY + 84 - legOff, 16, 44);
    }

    // Direction indicator (eyes)
    ctx.fillStyle = '#333';
    var eyeOff = { front: [0, 2], back: [0, -5], left: [-4, 0], right: [4, 0] };
    var eo = eyeOff[direction] || [0, 2];
    ctx.fillRect(x - 6 + eo[0], drawY + 16 + eo[1], 3, 3);
    ctx.fillRect(x + 3 + eo[0], drawY + 16 + eo[1], 3, 3);
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
    direction = data.direction || 'front';
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
