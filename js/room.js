Game.Room = (function () {
  var currentRoom = null;
  var roomData = null;
  var hotspots = [];
  var removedHotspots = {};
  var shownHotspots = {};

  function load(roomId, callback) {
    currentRoom = roomId;
    roomData = Game.Loader.getData('rooms/' + roomId);
    if (!roomData) {
      console.error('Room not found:', roomId);
      if (callback) callback();
      return;
    }

    // Build active hotspot list
    rebuildHotspots();

    // In no-walk rooms default to Look at instead of Walk to
    if (roomData && roomData.no_walk) {
      Game.Verbs.setCurrent('Look at');
      Game.ActionLine.setVerb('Look at');
    } else {
      Game.Verbs.reset();
      Game.ActionLine.reset();
    }

    if (callback) callback();
  }

  function rebuildHotspots() {
    hotspots = [];
    if (!roomData || !roomData.hotspots) return;

    for (var i = 0; i < roomData.hotspots.length; i++) {
      var h = roomData.hotspots[i];

      // Check if removed
      if (removedHotspots[currentRoom + '::' + h.id]) continue;

      // Check visibility condition
      if (h.visible_if && !Game.State.evaluate(h.visible_if)) {
        // But check if explicitly shown
        if (!shownHotspots[currentRoom + '::' + h.id]) continue;
      }

      // Check hidden_if
      if (h.hidden_if && Game.State.evaluate(h.hidden_if)) continue;

      hotspots.push(h);
    }
  }

  function removeHotspot(id) {
    removedHotspots[currentRoom + '::' + id] = true;
    rebuildHotspots();
  }

  function showHotspot(id) {
    shownHotspots[currentRoom + '::' + id] = true;
    // Also un-remove if it was removed
    delete removedHotspots[currentRoom + '::' + id];
    rebuildHotspots();
  }

  function getHotspotAt(gx, gy) {
    // Iterate in reverse (top hotspots drawn last = highest priority)
    for (var i = hotspots.length - 1; i >= 0; i--) {
      var h = hotspots[i];
      if (h.polygon) {
        if (Game.Pathfinding.pointInPolygon(gx, gy, h.polygon)) return h;
      } else if (h.rect) {
        var r = h.rect;
        if (gx >= r[0] && gx <= r[0] + r[2] && gy >= r[1] && gy <= r[1] + r[3]) return h;
      }
    }
    return null;
  }

  function getWalkArea() {
    return roomData ? roomData.walk_area : null;
  }

  function getWalkToPoint(hotspot) {
    if (hotspot.walk_to) return { x: hotspot.walk_to[0], y: hotspot.walk_to[1] };
    // Center of rect
    if (hotspot.rect) {
      return { x: hotspot.rect[0] + hotspot.rect[2] / 2, y: hotspot.rect[1] + hotspot.rect[3] / 2 };
    }
    // Center of polygon
    if (hotspot.polygon) {
      var sx = 0, sy = 0;
      for (var i = 0; i < hotspot.polygon.length; i++) {
        sx += hotspot.polygon[i][0];
        sy += hotspot.polygon[i][1];
      }
      return { x: sx / hotspot.polygon.length, y: sy / hotspot.polygon.length };
    }
    return { x: Game.Player.getX(), y: Game.Player.getY() };
  }

  function draw(ctx) {
    if (!roomData) return;

    // Rebuild hotspots each frame so flag changes are picked up immediately
    rebuildHotspots();

    // Draw background
    var bg = Game.Loader.getImage('bg_' + currentRoom);
    if (bg) {
      ctx.drawImage(bg, 0, 0, Game.Config.WIDTH, Game.Config.VIEWPORT_HEIGHT);
    } else {
      // Procedural background
      drawProceduralBG(ctx);
    }

    // Dynamic overlays on top of background
    drawRoomOverlays(ctx);

    // Draw dynamic objects (items on desks, etc.)
    drawDynamicObjects(ctx);

    // Draw NPC characters
    if (roomData.characters) {
      for (var i = 0; i < roomData.characters.length; i++) {
        var ch = roomData.characters[i];
        if (ch.visible_if && !Game.State.evaluate(ch.visible_if)) continue;
        if (ch.hidden_if && Game.State.evaluate(ch.hidden_if)) continue;
        drawNPC(ctx, ch);
      }
    }

    // Debug: draw hotspot outlines
    if (Game.Config.DEBUG) {
      drawDebugHotspots(ctx);
    }
  }

  function drawDynamicObjects(ctx) {
    // Draw visual representations for hotspots that appear/disappear with game state
    for (var i = 0; i < hotspots.length; i++) {
      var h = hotspots[i];
      if (!h.draw) continue;
      var d = h.draw;
      if (d.type === 'rect') {
        ctx.fillStyle = d.color || '#fff';
        ctx.fillRect(h.rect[0], h.rect[1], h.rect[2], h.rect[3]);
        if (d.label) {
          ctx.fillStyle = d.label_color || '#333';
          ctx.font = (d.font_size || 12) + 'px ' + Game.Config.FONT_FAMILY;
          ctx.textAlign = 'center';
          ctx.fillText(d.label, h.rect[0] + h.rect[2] / 2, h.rect[1] + h.rect[3] / 2 + 4);
          ctx.textAlign = 'left';
        }
        if (d.border) {
          ctx.strokeStyle = d.border;
          ctx.lineWidth = 2;
          ctx.strokeRect(h.rect[0], h.rect[1], h.rect[2], h.rect[3]);
        }
      }
    }
  }

  function drawProceduralBG(ctx) {
    var W = Game.Config.WIDTH;
    var VH = Game.Config.VIEWPORT_HEIGHT;

    if (currentRoom === 'office') {
      // Floor
      ctx.fillStyle = '#696969';
      ctx.fillRect(0, VH * 0.6, W, VH * 0.4);

      // Walls
      ctx.fillStyle = '#b8c4d0';
      ctx.fillRect(0, 0, W, VH * 0.6);

      // Window
      ctx.fillStyle = '#87ceeb';
      ctx.fillRect(560, 76, 224, 237);
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 4;
      ctx.strokeRect(560, 76, 224, 237);
      ctx.beginPath();
      ctx.moveTo(672, 76);
      ctx.lineTo(672, 313);
      ctx.stroke();

      // Desk
      ctx.fillStyle = '#5c4033';
      ctx.fillRect(420, 379, 420, 95);
      // Desk legs
      ctx.fillRect(434, 474, 14, 76);
      ctx.fillRect(812, 474, 14, 76);

      // Computer
      ctx.fillStyle = '#333';
      ctx.fillRect(595, 322, 84, 57);
      ctx.fillStyle = '#1a1a3e';
      ctx.fillRect(599, 327, 77, 47);

      // Filing cabinet
      ctx.fillStyle = '#777';
      ctx.fillRect(70, 332, 84, 237);
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 2;
      for (var fy = 0; fy < 4; fy++) {
        ctx.strokeRect(74, 337 + fy * 57, 77, 52);
      }

      // Door back to lobby
      ctx.fillStyle = '#4a3728';
      ctx.fillRect(1120, 237, 112, 332);
      ctx.fillStyle = '#c0a060';
      ctx.fillRect(1134, 398, 11, 14);

      // Bookshelf
      ctx.fillStyle = '#654321';
      ctx.fillRect(210, 142, 140, 285);
      for (var by = 0; by < 4; by++) {
        ctx.fillStyle = ['#8b0000', '#006400', '#00008b', '#8b8b00'][by];
        ctx.fillRect(217, 152 + by * 68, 126, 57);
      }

      // Bob's name plate
      ctx.fillStyle = '#c0a060';
      ctx.fillRect(595, 370, 84, 19);
      ctx.fillStyle = '#333';
      ctx.font = '14px ' + Game.Config.FONT_FAMILY;
      ctx.textAlign = 'center';
      ctx.fillText('BOB JOHNSON', 637, 384);
      ctx.textAlign = 'left';

      // Coffee machine table
      ctx.fillStyle = '#7a5c47';
      ctx.fillRect(938, 417, 84, 57);
      // Table legs
      ctx.fillRect(945, 474, 7, 76);
      ctx.fillRect(1008, 474, 7, 76);
      // Coffee machine body
      ctx.fillStyle = '#222';
      ctx.fillRect(949, 360, 63, 57);
      // Machine top
      ctx.fillStyle = '#333';
      ctx.fillRect(945, 351, 70, 14);
      // Drip area
      ctx.fillStyle = '#555';
      ctx.fillRect(959, 398, 35, 19);
      // Cup slot
      ctx.fillStyle = '#8b4513';
      ctx.fillRect(968, 403, 17, 14);
      // Label
      ctx.fillStyle = '#aaa';
      ctx.font = '10px ' + Game.Config.FONT_FAMILY;
      ctx.textAlign = 'center';
      ctx.fillText('COFFEE', 980, 384);
      ctx.textAlign = 'left';
    }
  }

  function drawRoomOverlays(ctx) {
    if (currentRoom === 'lobby') {
      // Blinking badge printer error light
      // Badge printer rect: [507, 307, 130, 146] — dot near bottom-left of printer face
      var blinkOn = Math.floor(Date.now() / 500) % 2 === 0;
      ctx.fillStyle = blinkOn ? '#ff2200' : '#660000';
      ctx.beginPath();
      ctx.arc(529, 358, 7, 0, Math.PI * 2);
      ctx.fill();

    }
  }

  function drawNPC(ctx, ch) {
    var nx = ch.x, ny = ch.y;
    var pw = 56, ph = 112;

    // Body
    ctx.fillStyle = ch.color || '#4a90d9';
    ctx.fillRect(nx - pw / 2, ny - ph, pw, ph);

    // Head
    ctx.fillStyle = '#ffd5b4';
    ctx.beginPath();
    ctx.arc(nx, ny - ph + 16, 14, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = ch.hair_color || '#333';
    ctx.beginPath();
    ctx.arc(nx, ny - ph + 10, 14, Math.PI, Math.PI * 2);
    ctx.fill();

    // Shirt
    ctx.fillStyle = ch.shirt_color || '#ffffff';
    ctx.fillRect(nx - pw / 2 + 6, ny - ph + 30, pw - 12, 42);

    // Pants
    ctx.fillStyle = ch.pants_color || '#2c3e50';
    ctx.fillRect(nx - pw / 2 + 8, ny - 40, 16, 40);
    ctx.fillRect(nx + pw / 2 - 24, ny - 40, 16, 40);

    // Name label
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px ' + Game.Config.FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.fillText(ch.name, nx, ny - ph - 8);
    ctx.textAlign = 'left';
  }

  function drawDebugHotspots(ctx) {
    ctx.strokeStyle = Game.Config.COLORS.HOTSPOT_DEBUG;
    ctx.lineWidth = 2;

    for (var i = 0; i < hotspots.length; i++) {
      var h = hotspots[i];
      ctx.fillStyle = Game.Config.COLORS.HOTSPOT_DEBUG;
      if (h.rect) {
        ctx.fillRect(h.rect[0], h.rect[1], h.rect[2], h.rect[3]);
        ctx.strokeRect(h.rect[0], h.rect[1], h.rect[2], h.rect[3]);
      } else if (h.polygon) {
        ctx.beginPath();
        ctx.moveTo(h.polygon[0][0], h.polygon[0][1]);
        for (var j = 1; j < h.polygon.length; j++) {
          ctx.lineTo(h.polygon[j][0], h.polygon[j][1]);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      // Label
      var cx = h.rect ? h.rect[0] + h.rect[2] / 2 : h.polygon[0][0];
      var cy = h.rect ? h.rect[1] + 14 : h.polygon[0][1];
      ctx.fillStyle = '#00ff00';
      ctx.font = '14px ' + Game.Config.FONT_FAMILY;
      ctx.textAlign = 'center';
      ctx.fillText(h.id + ': ' + h.name, cx, cy);
      ctx.textAlign = 'left';
    }

    // Draw walk area
    var wa = getWalkArea();
    if (wa) {
      ctx.fillStyle = Game.Config.COLORS.WALKAREA_DEBUG;
      ctx.beginPath();
      ctx.moveTo(wa[0][0], wa[0][1]);
      for (var k = 1; k < wa.length; k++) ctx.lineTo(wa[k][0], wa[k][1]);
      ctx.closePath();
      ctx.fill();
    }
  }

  function isNoWalk() { return !!(roomData && roomData.no_walk); }

  function getCurrentId() { return currentRoom; }
  function getData() { return roomData; }
  function getHotspots() { return hotspots; }

  function serialize() {
    return {
      currentRoom: currentRoom,
      removedHotspots: JSON.parse(JSON.stringify(removedHotspots)),
      shownHotspots: JSON.parse(JSON.stringify(shownHotspots)),
    };
  }

  function deserialize(data) {
    removedHotspots = data.removedHotspots || {};
    shownHotspots = data.shownHotspots || {};
    load(data.currentRoom);
  }

  return {
    load: load,
    draw: draw,
    getHotspotAt: getHotspotAt,
    getWalkArea: getWalkArea,
    getWalkToPoint: getWalkToPoint,
    removeHotspot: removeHotspot,
    showHotspot: showHotspot,
    isNoWalk: isNoWalk,
    getCurrentId: getCurrentId,
    getData: getData,
    getHotspots: getHotspots,
    rebuildHotspots: rebuildHotspots,
    serialize: serialize,
    deserialize: deserialize,
  };
})();
