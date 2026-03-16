Game.Room = (function () {
  var currentRoom = null;
  var roomData = null;
  var hotspots = [];
  var removedHotspots = {};
  var shownHotspots = {};
  var firedTriggers = {};

  function load(roomId, callback) {
    currentRoom = roomId;
    roomData = Game.Loader.getData('rooms/' + roomId);
    if (!roomData) {
      console.error('Room not found:', roomId);
      if (callback) callback();
      return;
    }

    // Clear NPC actors from previous room
    Game.Actors.clear();

    // Build active hotspot list
    rebuildHotspots();

    // Fire on_enter effects
    if (roomData.on_enter && roomData.on_enter.length) {
      Game.Effects.execute(roomData.on_enter, null);
    }

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
    if (!roomData) return null;
    if (roomData.walk_areas) {
      for (var i = 0; i < roomData.walk_areas.length; i++) {
        var def = roomData.walk_areas[i];
        if (!def.condition || Game.State.evaluate(def.condition)) {
          return def.area;
        }
      }
    }
    return roomData.walk_area;
  }

  function getPerspective() {
    return roomData ? roomData.perspective : null;
  }

  function checkTriggers() {
    if (!roomData || !roomData.trigger_zones) return;
    var px = Game.Player.getX();
    var py = Game.Player.getY();
    for (var i = 0; i < roomData.trigger_zones.length; i++) {
      var zone = roomData.trigger_zones[i];
      var key  = currentRoom + '::' + zone.id;
      if (zone.once && firedTriggers[key]) continue;
      if (zone.condition && !Game.State.evaluate(zone.condition)) continue;
      var r = zone.rect;
      if (px >= r[0] && px <= r[0] + r[2] && py >= r[1] && py <= r[1] + r[3]) {
        if (zone.once) firedTriggers[key] = true;
        Game.Effects.execute(zone.effects, null);
        break;
      }
    }
  }

  function getHotspotCenter(hotspot) {
    if (hotspot.rect) {
      return { x: hotspot.rect[0] + hotspot.rect[2] / 2, y: hotspot.rect[1] + hotspot.rect[3] / 2 };
    }
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

  var SIDE_OFFSET = 70; // px to stand beside an object

  function getWalkToPoint(hotspot) {
    // Exit hotspots: use walk_to as-is (floor position, no offset needed)
    if (hotspot.cursor === 'exit') {
      return hotspot.walk_to
        ? { x: hotspot.walk_to[0], y: hotspot.walk_to[1] }
        : getHotspotCenter(hotspot);
    }

    // All other hotspots: stand to one side so the player faces the object.
    // Use walk_to x as the base when defined (it was manually placed in a valid
    // spot); fall back to hotspot edge only when there is no walk_to.
    var c = getHotspotCenter(hotspot);
    var halfW = hotspot.rect ? hotspot.rect[2] / 2 : 0;
    var baseX, baseY;
    if (hotspot.walk_to) {
      baseX = hotspot.walk_to[0];
      baseY = hotspot.walk_to[1];
    } else {
      baseY = c.y;
      baseX = c.x + (c.x < Game.Config.WIDTH / 2 ? halfW : -halfW);
    }
    if (c.x < Game.Config.WIDTH / 2) {
      return { x: baseX + SIDE_OFFSET, y: baseY }; // stand right, face left
    } else {
      return { x: baseX - SIDE_OFFSET, y: baseY }; // stand left, face right
    }
  }

  function draw(ctx) {
    if (!roomData) return;

    // Rebuild hotspots each frame so flag changes are picked up immediately
    rebuildHotspots();

    // Draw background — support conditional backgrounds array
    var bgKey = 'bg_' + currentRoom;
    if (roomData.backgrounds) {
      for (var bi = 0; bi < roomData.backgrounds.length; bi++) {
        var bgDef = roomData.backgrounds[bi];
        if (!bgDef.condition || Game.State.evaluate(bgDef.condition)) {
          bgKey = 'bg_' + bgDef.image;
          break;
        }
      }
    }
    // Animate talk background: alternate when NPC is speaking
    if (roomData.talk_background &&
        Game.TextBox.getSpeakerColor() === Game.Config.COLORS.TEXT_NPC &&
        Game.TextBox.getTalkPhase() === 1) {
      bgKey = 'bg_' + roomData.talk_background;
    }
    var bg = Game.Loader.getImage(bgKey);
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

    // Draw animated NPC actors (cutscene characters)
    Game.Actors.draw(ctx);

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

    // Generic fallback for rooms without a background image yet
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, W, VH);
    ctx.fillStyle = '#2a2a3e';
    ctx.fillRect(0, VH * 0.55, W, VH * 0.45);

  }

  function drawRoomOverlays(ctx) {
    if (currentRoom === 'lobby') {
      // Blinking badge printer error light
      // Badge printer rect: [507, 307, 130, 146] — dot near bottom-left of printer face
      var blinkOn = Math.floor(Date.now() / 500) % 2 === 0;
      ctx.fillStyle = blinkOn ? '#ff2200' : '#660000';
      ctx.beginPath();
      ctx.arc(542, 358, 7, 0, Math.PI * 2);
      ctx.fill();

    }
  }

  function drawNPC(ctx, ch) {
    var nx = ch.x, ny = ch.y;

    // Perspective scaling — match player logic
    var ph = Game.Config.PLAYER_HEIGHT;
    var perspective = roomData ? roomData.perspective : null;
    var walkArea    = getWalkArea();
    if (perspective && walkArea) {
      var ys = walkArea.map(function (p) { return p[1]; });
      var y1 = Math.min.apply(null, ys);
      var y2 = Math.max.apply(null, ys);
      var t  = (ny - y1) / (y2 - y1);
      var s  = perspective.min_scale + t * (perspective.max_scale - perspective.min_scale);
      ph = Math.round(ph * s);
    }

    // Sprite-sheet character
    if (ch.key) {
      var dir      = ch.dir || 'left';
      var sheetKey = ch.key + '_sheet_' + dir;
      var sheet    = Game.Loader.getImage(sheetKey);
      if (sheet) {
        var STAND_COL = { right: 0, left: 2 };
        var col    = STAND_COL[dir] !== undefined ? STAND_COL[dir] : 0;
        var frameW = sheet.naturalWidth / 3;
        var frameH = sheet.naturalHeight;
        var pw     = Math.round(ph * (frameW / frameH));
        var fb     = Game.Loader.getFrameBounds(sheetKey, col);
        var cx     = fb ? fb.cx : 0.5;
        ctx.drawImage(sheet, col * frameW, 0, frameW, frameH,
                      Math.round(nx - cx * pw), Math.round(ny - ph), pw, ph);
        return;
      }
    }

    // Procedural fallback
    var pw = 56, phf = 112;
    ctx.fillStyle = ch.color || '#4a90d9';
    ctx.fillRect(nx - pw / 2, ny - phf, pw, phf);
    ctx.fillStyle = '#ffd5b4';
    ctx.beginPath();
    ctx.arc(nx, ny - phf + 16, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = ch.hair_color || '#333';
    ctx.beginPath();
    ctx.arc(nx, ny - phf + 10, 14, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = ch.shirt_color || '#ffffff';
    ctx.fillRect(nx - pw / 2 + 6, ny - phf + 30, pw - 12, 42);
    ctx.fillStyle = ch.pants_color || '#2c3e50';
    ctx.fillRect(nx - pw / 2 + 8, ny - 40, 16, 40);
    ctx.fillRect(nx + pw / 2 - 24, ny - 40, 16, 40);
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px ' + Game.Config.FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.fillText(ch.name, nx, ny - phf - 8);
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

  function resetTrigger(triggerId) {
    delete firedTriggers[currentRoom + '::' + triggerId];
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
      firedTriggers: JSON.parse(JSON.stringify(firedTriggers)),
    };
  }

  function deserialize(data) {
    removedHotspots = data.removedHotspots || {};
    shownHotspots   = data.shownHotspots   || {};
    firedTriggers   = data.firedTriggers   || {};
    load(data.currentRoom);
  }

  return {
    load: load,
    draw: draw,
    getHotspotAt: getHotspotAt,
    getWalkArea: getWalkArea,
    getPerspective: getPerspective,
    checkTriggers: checkTriggers,
    getWalkToPoint: getWalkToPoint,
    getHotspotCenter: getHotspotCenter,
    removeHotspot: removeHotspot,
    showHotspot: showHotspot,
    resetTrigger: resetTrigger,
    isNoWalk: isNoWalk,
    getCurrentId: getCurrentId,
    getData: getData,
    getHotspots: getHotspots,
    rebuildHotspots: rebuildHotspots,
    serialize: serialize,
    deserialize: deserialize,
  };
})();
