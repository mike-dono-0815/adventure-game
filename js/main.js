Game.Main = (function () {

  function boot() {
    console.log('The Separation Agreement — Booting...');

    // Init renderer (sets up canvas)
    Game.Renderer.init();

    // Start loading assets — draw loading screen while waiting
    var loadingInterval = setInterval(function () {
      var canvas = document.getElementById('gameCanvas');
      var ctx = canvas.getContext('2d');
      var scale = Game.Renderer.getScale();
      ctx.save();
      ctx.scale(scale, scale);
      Game.Loader.drawLoadingScreen(ctx);
      ctx.restore();
    }, 50);

    Game.Loader.loadAll()
      .then(function () {
        clearInterval(loadingInterval);
        initGame();
      })
      .catch(function (err) {
        clearInterval(loadingInterval);
        console.error('Failed to load assets:', err);
        // Still try to start with what we have
        initGame();
      });
  }

  function initGame() {
    var gameData = Game.Loader.getData('game') || {};

    // Check for debug scenario via ?scenario=<name>
    var scenario = null;
    var params = window.location.search.slice(1).split('&').reduce(function (acc, pair) {
      var parts = pair.split('=');
      if (parts[0]) acc[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1] || '');
      return acc;
    }, {});
    if (params.debug) {
      Game.Config.DEBUG = true;
      console.log('[DEBUG] Debug mode enabled via URL parameter');
    }
    if (params.scenario) {
      var debugData = Game.Loader.getData('debug') || {};
      scenario = (debugData.scenarios || {})[params.scenario] || null;
      if (scenario) console.log('[DEBUG] Loading scenario:', params.scenario, scenario.label);
      else console.warn('[DEBUG] Unknown scenario:', params.scenario);
    }

    // Merge flags: base flags + scenario overrides
    var startingFlags = {};
    var baseFlags = gameData.starting_flags || {};
    for (var k in baseFlags) startingFlags[k] = baseFlags[k];
    if (scenario && scenario.flags) {
      for (var k in scenario.flags) startingFlags[k] = scenario.flags[k];
    }

    // Init state with merged flags
    Game.State.init(startingFlags);

    // Init subsystems
    Game.Player.init();
    Game.Verbs.init();
    Game.Inventory.init();

    // Add inventory (scenario overrides base if provided)
    var startingInventory = (scenario && scenario.inventory) || gameData.starting_inventory || [];
    for (var i = 0; i < startingInventory.length; i++) {
      Game.Inventory.add(startingInventory[i]);
    }

    // Starting room and position
    var startRoom = (scenario && scenario.room) || gameData.start_room || 'lobby';
    var startX    = (scenario && scenario.player_x) || gameData.start_x || 400;
    var startY    = (scenario && scenario.player_y) || gameData.start_y || 650;
    var startDir  = (scenario && scenario.player_dir) || 'right';

    Game.Room.load(startRoom, function () {
      Game.Player.setPosition(startX, startY);
      Game.Player.setDirection(startDir);

      console.log('Game initialized. Room:', startRoom);
      console.log('Controls: Click to interact, Right-click to cancel, Escape for save/load, F5/F9 quick save/load, Ctrl+D debug mode');

      // Skip title screen for debug scenarios
      if (scenario) {
        Game.Renderer.start();
        return;
      }

      // Show title screen with Start / Options hotspots
      var canvas   = document.getElementById('gameCanvas');
      var titleImg = Game.Loader.getImage('bg_title');
      var scale    = Game.Renderer.getScale();
      var offset   = Game.Renderer.getOffset();

      // Button rects as [x, y, w, h] arrays — mutable in-place for debug dragging
      var START_BTN   = [484, 687, 193, 68];
      var OPTIONS_BTN = [700, 686, 190, 72];

      var titleState  = 'title'; // 'title' | 'options'
      var HANDLE_R    = 6;
      var tdDragging  = null;   // { rect, corner, label }
      var tdHovered   = null;
      var tdDidDrag   = false;
      var tdHoverBtn  = null;   // START_BTN | OPTIONS_BTN | null

      function stg(sx, sy) { return { x: sx / scale, y: sy / scale }; }

      function inRect(gx, gy, r) {
        return gx >= r[0] && gx <= r[0] + r[2] && gy >= r[1] && gy <= r[1] + r[3];
      }

      function tdCorners(r, label) {
        return [
          { corner: 'tl', x: r[0],        y: r[1],        rect: r, label: label },
          { corner: 'tr', x: r[0] + r[2], y: r[1],        rect: r, label: label },
          { corner: 'bl', x: r[0],        y: r[1] + r[3], rect: r, label: label },
          { corner: 'br', x: r[0] + r[2], y: r[1] + r[3], rect: r, label: label },
        ];
      }

      function tdAllHandles() {
        return tdCorners(START_BTN, 'Start').concat(tdCorners(OPTIONS_BTN, 'Options'));
      }

      function tdFindHandle(gx, gy) {
        var best = null, bestD = HANDLE_R + 3;
        tdAllHandles().forEach(function (h) {
          var d = Math.sqrt((gx - h.x) * (gx - h.x) + (gy - h.y) * (gy - h.y));
          if (d < bestD) { bestD = d; best = h; }
        });
        return best;
      }

      function tdApplyMove(h, gx, gy) {
        gx = Math.round(gx); gy = Math.round(gy);
        var r = h.rect;
        var x1 = r[0], y1 = r[1], x2 = r[0] + r[2], y2 = r[1] + r[3];
        if      (h.corner === 'tl') { x1 = gx; y1 = gy; }
        else if (h.corner === 'tr') { x2 = gx; y1 = gy; }
        else if (h.corner === 'bl') { x1 = gx; y2 = gy; }
        else                        { x2 = gx; y2 = gy; }
        r[0] = Math.min(x1, x2); r[1] = Math.min(y1, y2);
        r[2] = Math.abs(x2 - x1); r[3] = Math.abs(y2 - y1);
      }

      function tdExport() {
        var txt = 'START_BTN:   [' + START_BTN.join(', ') + ']\nOPTIONS_BTN: [' + OPTIONS_BTN.join(', ') + ']';
        console.log('[Title Debug]\n' + txt);
        var panel = document.getElementById('td-export-panel');
        if (!panel) {
          panel = document.createElement('div');
          panel.id = 'td-export-panel';
          panel.style.cssText = 'position:fixed;top:10px;right:10px;width:340px;background:#1a1a2e;border:2px solid #e94560;border-radius:6px;padding:10px;z-index:9999;font-family:monospace;font-size:12px;color:#e0e0e0;box-shadow:0 4px 20px rgba(0,0,0,0.7)';
          document.body.appendChild(panel);
        }
        panel.innerHTML =
          '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">' +
            '<strong style="color:#ffdd57;flex:1">Title Screen Rects</strong>' +
            '<button id="td-copy" style="background:#e94560;color:#fff;border:none;padding:3px 10px;cursor:pointer;border-radius:3px;font-size:11px">Copy</button>' +
            '<button id="td-close" style="background:#444;color:#fff;border:none;padding:3px 8px;cursor:pointer;border-radius:3px;font-size:11px">✕</button>' +
          '</div>' +
          '<pre style="margin:0;color:#b0d0ff">' + txt + '</pre>';
        panel.style.display = 'block';
        document.getElementById('td-copy').onclick = function () {
          navigator.clipboard.writeText(txt);
          this.textContent = 'Copied!';
          var btn = this;
          setTimeout(function () { btn.textContent = 'Copy'; }, 1500);
        };
        document.getElementById('td-close').onclick = function () {
          panel.style.display = 'none';
        };
      }

      function drawTitle() {
        var cfg = Game.Config;
        var ctx = canvas.getContext('2d');
        ctx.save();
        ctx.setTransform(scale, 0, 0, scale, offset.x, offset.y);

        // Title image fills the viewport
        if (titleImg) {
          ctx.drawImage(titleImg, 0, 0, cfg.WIDTH, cfg.VIEWPORT_HEIGHT);
        } else {
          ctx.fillStyle = cfg.COLORS.VIEWPORT_BG;
          ctx.fillRect(0, 0, cfg.WIDTH, cfg.VIEWPORT_HEIGHT);
        }

        // Action line bar
        ctx.fillStyle = cfg.COLORS.ACTION_LINE_BG;
        ctx.fillRect(0, cfg.ACTION_LINE_Y, cfg.WIDTH, cfg.ACTION_LINE_HEIGHT);

        // Bottom bar
        ctx.fillStyle = cfg.COLORS.BOTTOM_BAR_BG;
        ctx.fillRect(0, cfg.BOTTOM_BAR_Y, cfg.WIDTH, cfg.BOTTOM_BAR_HEIGHT);

        // Story description
        var storyLines = [
          'You are Alex. After months of corporate drift inside Amazon\'s peculiar environment,',
          'you\'ve finally gained clarity: it is enough. You need Bob in HR to co-sign your Mutual Separation',
          'Agreement - your ticket out. There\'s just one problem: you lost your badge,',
          'and you have no idea where to find Bob - but you are willing to find out and optimistically enter your office.',
        ];
        ctx.fillStyle = cfg.COLORS.TEXT_DEFAULT;
        ctx.font = cfg.FONT_SIZE + 'px ' + cfg.FONT_FAMILY;
        ctx.textAlign = 'left';
        var lineH = 36, textX = 60, textY = cfg.BOTTOM_BAR_Y + 34;
        for (var li = 0; li < storyLines.length; li++) {
          ctx.fillText(storyLines[li], textX, textY + li * lineH);
        }

        // Hover highlight — thick border on hovered button
        if (tdHoverBtn && titleState !== 'options') {
          var hb = tdHoverBtn;
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.lineWidth   = 4;
          ctx.strokeRect(hb[0], hb[1], hb[2], hb[3]);
        }

        // Debug: draggable corner handles
        if (cfg.DEBUG) {
          var handles = tdAllHandles();
          [{ r: START_BTN, label: 'Start' }, { r: OPTIONS_BTN, label: 'Options' }].forEach(function (b) {
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth   = 2;
            ctx.fillStyle   = 'rgba(0,255,0,0.12)';
            ctx.fillRect(b.r[0], b.r[1], b.r[2], b.r[3]);
            ctx.strokeRect(b.r[0], b.r[1], b.r[2], b.r[3]);
            ctx.fillStyle = '#00ff00';
            ctx.font      = '14px ' + cfg.FONT_FAMILY;
            ctx.textAlign = 'left';
            ctx.fillText(b.label, b.r[0] + 4, b.r[1] + 16);
          });
          handles.forEach(function (h) {
            var hot = tdDragging && tdDragging.corner === h.corner && tdDragging.rect === h.rect;
            var hov = tdHovered  && tdHovered.corner  === h.corner && tdHovered.rect  === h.rect;
            ctx.fillStyle   = (hot || hov) ? '#ffffff' : '#ffdd57';
            ctx.strokeStyle = 'rgba(0,0,0,0.6)';
            ctx.lineWidth   = 1;
            ctx.fillRect  (h.x - HANDLE_R, h.y - HANDLE_R, HANDLE_R * 2, HANDLE_R * 2);
            ctx.strokeRect(h.x - HANDLE_R, h.y - HANDLE_R, HANDLE_R * 2, HANDLE_R * 2);
            if (hot) {
              var lbl = h.x + ', ' + h.y;
              ctx.font = '11px ' + cfg.FONT_FAMILY;
              var tw = ctx.measureText(lbl).width;
              ctx.fillStyle = 'rgba(0,0,0,0.75)';
              ctx.fillRect(h.x + 10, h.y - 18, tw + 6, 16);
              ctx.fillStyle = '#ffffff';
              ctx.textAlign = 'left';
              ctx.fillText(lbl, h.x + 13, h.y - 6);
            }
          });
        }

        if (titleState === 'options') {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
          ctx.fillRect(0, 0, cfg.WIDTH, cfg.VIEWPORT_HEIGHT);
          var cx = cfg.WIDTH / 2, cy = cfg.VIEWPORT_HEIGHT / 2;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.shadowColor = 'rgba(255,153,0,0.9)'; ctx.shadowBlur = 24;
          ctx.fillStyle = '#FEBD69';
          ctx.font = 'italic bold 58px Georgia, "Times New Roman", serif';
          ctx.fillText('Options', cx, cy - 100);
          ctx.shadowBlur = 0;
          ctx.fillStyle = 'rgba(255,255,255,0.85)';
          ctx.font = '24px ' + cfg.FONT_FAMILY;
          ctx.fillText('You think this is a Triple-A production?', cx, cy - 20);
          ctx.fillText('One guy. No budget. Mostly coffee and regret.', cx, cy + 22);
          ctx.fillText('There are no options. What you see is what you get.', cx, cy + 64);
          ctx.fillStyle = 'rgba(255,255,255,0.38)';
          ctx.font = '17px ' + cfg.FONT_FAMILY;
          ctx.fillText('click anywhere to go back', cx, cy + 140);
          ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.shadowBlur = 0;
        }

        ctx.restore();
      }

      drawTitle();

      canvas.addEventListener('mousedown', function (e) {
        if (!Game.Config.DEBUG) return;
        var gp = stg(e.offsetX, e.offsetY);
        var h = tdFindHandle(gp.x, gp.y);
        if (h) { tdDragging = h; tdDidDrag = false; }
      });

      canvas.addEventListener('mousemove', function (e) {
        var gp = stg(e.offsetX, e.offsetY);
        var gx = gp.x, gy = gp.y;

        // Hover highlight for buttons (always active, not just debug)
        var newHoverBtn = inRect(gx, gy, START_BTN) ? START_BTN
                        : inRect(gx, gy, OPTIONS_BTN) ? OPTIONS_BTN
                        : null;
        var hoverBtnChanged = newHoverBtn !== tdHoverBtn;
        tdHoverBtn = newHoverBtn;

        if (Game.Config.DEBUG) {
          if (tdDragging) {
            tdApplyMove(tdDragging, gx, gy);
            tdDragging.x = Math.round(gx);
            tdDragging.y = Math.round(gy);
            tdDidDrag = true;
            drawTitle();
          } else {
            var prev = tdHovered;
            tdHovered = tdFindHandle(gx, gy);
            if (tdHovered !== prev || hoverBtnChanged) drawTitle();
          }
          canvas.style.cursor = tdDragging ? 'move' : (tdHovered ? 'crosshair' : (tdHoverBtn ? 'pointer' : 'default'));
        } else {
          if (hoverBtnChanged) drawTitle();
          canvas.style.cursor = tdHoverBtn ? 'pointer' : 'default';
        }
      });

      canvas.addEventListener('mouseup', function () {
        if (!Game.Config.DEBUG || !tdDragging) return;
        var wasDrag = tdDidDrag;
        tdDragging = null;
        if (wasDrag) { tdExport(); drawTitle(); }
      });

      canvas.addEventListener('click', function onTitleClick(e) {
        if (Game.Config.DEBUG && tdDidDrag) { tdDidDrag = false; return; }

        var gp = stg(e.offsetX, e.offsetY);
        var gx = gp.x, gy = gp.y;

        if (titleState === 'options') {
          titleState = 'title';
          drawTitle();
          return;
        }

        if (inRect(gx, gy, OPTIONS_BTN)) {
          titleState = 'options';
          drawTitle();
          return;
        }

        if (inRect(gx, gy, START_BTN)) {
          canvas.removeEventListener('click', onTitleClick);
          Game.Renderer.start();
        }
      });
    });
  }

  return {
    boot: boot,
  };
})();

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', Game.Main.boot);
} else {
  Game.Main.boot();
}
