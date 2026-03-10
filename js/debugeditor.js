Game.DebugEditor = (function () {
  var HANDLE_R = 6;
  var dragging = null;   // { handle, origX, origY }
  var hovered  = null;
  var exportPanel = null;
  var didDrag = false;   // suppresses the click event after a drag

  // ── Handle enumeration ──────────────────────────────────────────────────────

  function getHandles() {
    var handles = [];

    // Hotspot rect corners
    var hotspots = Game.Room.getHotspots();
    for (var i = 0; i < hotspots.length; i++) {
      var h = hotspots[i];
      if (!h.rect) continue;
      var r = h.rect;
      var corners = [
        { corner: 'tl', x: r[0],        y: r[1]        },
        { corner: 'tr', x: r[0] + r[2], y: r[1]        },
        { corner: 'bl', x: r[0],        y: r[1] + r[3] },
        { corner: 'br', x: r[0] + r[2], y: r[1] + r[3] },
      ];
      for (var c = 0; c < corners.length; c++) {
        handles.push({
          type: 'hotspot',
          hotspotId: h.id,
          corner: corners[c].corner,
          x: corners[c].x,
          y: corners[c].y,
          rect: r,
        });
      }
    }

    // Walk area vertices
    var wa = Game.Room.getWalkArea();
    if (wa) {
      for (var j = 0; j < wa.length; j++) {
        handles.push({
          type: 'walkarea',
          index: j,
          x: wa[j][0],
          y: wa[j][1],
          point: wa[j],
        });
      }
    }

    return handles;
  }

  function findHandleAt(gx, gy) {
    var handles = getHandles();
    var best = null, bestDist = HANDLE_R + 3;
    for (var i = 0; i < handles.length; i++) {
      var h = handles[i];
      var d = Math.sqrt((gx - h.x) * (gx - h.x) + (gy - h.y) * (gy - h.y));
      if (d < bestDist) { bestDist = d; best = h; }
    }
    return best;
  }

  function sameHandle(a, b) {
    if (!a || !b) return false;
    if (a.type !== b.type) return false;
    if (a.type === 'walkarea') return a.index === b.index;
    return a.hotspotId === b.hotspotId && a.corner === b.corner;
  }

  // ── Mutation ─────────────────────────────────────────────────────────────────

  function applyMove(handle, newGX, newGY) {
    newGX = Math.round(newGX);
    newGY = Math.round(newGY);

    if (handle.type === 'walkarea') {
      handle.point[0] = newGX;
      handle.point[1] = newGY;
      return;
    }

    // Rect — recalculate [x, y, w, h] from moved corner
    var r  = handle.rect;
    var x1 = r[0], y1 = r[1];
    var x2 = r[0] + r[2], y2 = r[1] + r[3];

    if      (handle.corner === 'tl') { x1 = newGX; y1 = newGY; }
    else if (handle.corner === 'tr') { x2 = newGX; y1 = newGY; }
    else if (handle.corner === 'bl') { x1 = newGX; y2 = newGY; }
    else if (handle.corner === 'br') { x2 = newGX; y2 = newGY; }

    r[0] = Math.min(x1, x2);
    r[1] = Math.min(y1, y2);
    r[2] = Math.abs(x2 - x1);
    r[3] = Math.abs(y2 - y1);
  }

  // ── Input handlers (called from input.js) ───────────────────────────────────

  function onMouseDown(gx, gy) {
    if (!Game.Config.DEBUG) return false;
    var h = findHandleAt(gx, gy);
    if (!h) return false;
    dragging = { handle: h, gx: gx, gy: gy };
    didDrag  = false;
    return true;
  }

  function onMouseMove(gx, gy) {
    if (!Game.Config.DEBUG) return false;

    if (dragging) {
      applyMove(dragging.handle, gx, gy);
      // Refresh the handle's own position so it follows the cursor
      if (dragging.handle.type === 'walkarea') {
        dragging.handle.x = Math.round(gx);
        dragging.handle.y = Math.round(gy);
      } else {
        // Recompute corner position from updated rect
        var r = dragging.handle.rect;
        var pos = cornerPos(r, dragging.handle.corner);
        dragging.handle.x = pos.x;
        dragging.handle.y = pos.y;
      }
      didDrag = true;
      return true;
    }

    hovered = findHandleAt(gx, gy);
    return hovered !== null;
  }

  function cornerPos(r, corner) {
    if (corner === 'tl') return { x: r[0],        y: r[1]        };
    if (corner === 'tr') return { x: r[0] + r[2], y: r[1]        };
    if (corner === 'bl') return { x: r[0],        y: r[1] + r[3] };
                         return { x: r[0] + r[2], y: r[1] + r[3] };
  }

  function onMouseUp() {
    if (!Game.Config.DEBUG || !dragging) return false;
    var wasDragging = didDrag;
    dragging = null;
    if (wasDragging) {
      showExport();
      return true; // consumed — prevents click
    }
    return false;
  }

  function consumedDrag() {
    // Called by input.js onClick to check whether to suppress the click
    if (didDrag) { didDrag = false; return true; }
    return false;
  }

  // ── Export panel ─────────────────────────────────────────────────────────────

  function showExport() {
    var roomData = Game.Room.getData();
    var json = JSON.stringify(roomData, null, 2);

    console.log('=== UPDATED ROOM JSON [' + Game.Room.getCurrentId() + '] ===\n' + json);

    if (!exportPanel) {
      exportPanel = document.createElement('div');
      exportPanel.style.cssText = [
        'position:fixed', 'top:10px', 'right:10px', 'width:420px',
        'max-height:55vh', 'background:#1a1a2e', 'border:2px solid #e94560',
        'border-radius:6px', 'padding:10px', 'z-index:9999',
        'font-family:monospace', 'font-size:11px', 'color:#e0e0e0',
        'overflow:auto', 'box-shadow:0 4px 20px rgba(0,0,0,0.7)',
      ].join(';');
      document.body.appendChild(exportPanel);
    }

    exportPanel.innerHTML =
      '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">' +
        '<strong style="color:#ffdd57;flex:1">Debug Export — ' + Game.Room.getCurrentId() + '</strong>' +
        '<button id="dbg-copy" style="background:#e94560;color:#fff;border:none;padding:3px 10px;cursor:pointer;border-radius:3px;font-size:11px">Copy JSON</button>' +
        '<button id="dbg-close" style="background:#444;color:#fff;border:none;padding:3px 8px;cursor:pointer;border-radius:3px;font-size:11px">✕</button>' +
      '</div>' +
      '<pre style="margin:0;white-space:pre-wrap;word-break:break-all;color:#b0d0ff">' +
        escapeHTML(json) +
      '</pre>';

    exportPanel.style.display = 'block';

    document.getElementById('dbg-copy').addEventListener('click', function () {
      navigator.clipboard.writeText(json).then(function () {
        var btn = document.getElementById('dbg-copy');
        if (btn) { btn.textContent = 'Copied!'; }
        setTimeout(function () {
          var b = document.getElementById('dbg-copy');
          if (b) b.textContent = 'Copy JSON';
        }, 1500);
      });
    });

    document.getElementById('dbg-close').addEventListener('click', function () {
      exportPanel.style.display = 'none';
    });
  }

  function escapeHTML(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ── Draw ─────────────────────────────────────────────────────────────────────

  function draw(ctx) {
    if (!Game.Config.DEBUG) return;

    var handles = getHandles();
    for (var i = 0; i < handles.length; i++) {
      var h = handles[i];
      var isHot = sameHandle(h, hovered) || (dragging && sameHandle(h, dragging.handle));

      // Colour by type
      ctx.fillStyle   = isHot ? '#ffffff' : (h.type === 'walkarea' ? '#00ffcc' : '#ffdd57');
      ctx.strokeStyle = isHot ? '#000'    : 'rgba(0,0,0,0.6)';
      ctx.lineWidth   = 1;

      ctx.fillRect  (h.x - HANDLE_R, h.y - HANDLE_R, HANDLE_R * 2, HANDLE_R * 2);
      ctx.strokeRect(h.x - HANDLE_R, h.y - HANDLE_R, HANDLE_R * 2, HANDLE_R * 2);

      // Show live coordinates while dragging this handle
      if (dragging && sameHandle(h, dragging.handle)) {
        var label = h.x + ', ' + h.y;
        ctx.font = '11px ' + Game.Config.FONT_FAMILY;
        var tw = ctx.measureText(label).width;
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(h.x + 10, h.y - 18, tw + 6, 16);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(label, h.x + 13, h.y - 6);
      }
    }
  }

  function getCursorStyle() {
    if (!Game.Config.DEBUG) return null;
    if (dragging) return 'move';
    if (hovered)  return 'crosshair';
    return null;
  }

  return {
    onMouseDown:  onMouseDown,
    onMouseMove:  onMouseMove,
    onMouseUp:    onMouseUp,
    consumedDrag: consumedDrag,
    draw:         draw,
    getCursorStyle: getCursorStyle,
  };
})();
