Game.Input = (function () {
  var mouseX = 0, mouseY = 0;
  var gameX = 0, gameY = 0;
  var cursorStyle = 'default';

  function init(canvas) {
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('contextmenu', onRightClick);
    window.addEventListener('keydown', onKeyDown);
  }

  function screenToGame(sx, sy) {
    var scale = Game.Renderer.getScale();
    var offset = Game.Renderer.getOffset();
    return {
      x: (sx - offset.x) / scale,
      y: (sy - offset.y) / scale,
    };
  }

  function onMouseMove(e) {
    mouseX = e.offsetX;
    mouseY = e.offsetY;
    var gp = screenToGame(mouseX, mouseY);
    gameX = gp.x;
    gameY = gp.y;

    // Route hover
    var cfg = Game.Config;
    cursorStyle = 'default';

    if (Game.SaveLoad.isOpen()) {
      Game.SaveLoad.handleHover(gameX, gameY);
      return;
    }

    if (Game.Dialogue.isActive()) {
      Game.Dialogue.handleHover(gameX, gameY);
      return;
    }

    // Verb panel hover
    if (gameY >= cfg.BOTTOM_BAR_Y && gameX < cfg.VERB_PANEL_WIDTH) {
      Game.Verbs.handleHover(gameX, gameY);
      Game.ActionLine.setHoverTarget(null);
      return;
    }

    // Inventory hover
    if (gameY >= cfg.BOTTOM_BAR_Y && gameX >= cfg.INVENTORY_X) {
      var item = Game.Inventory.handleHover(gameX, gameY);
      if (item) {
        var info = Game.Inventory.getItemInfo(item);
        Game.ActionLine.setHoverTarget(item);
        cursorStyle = 'pointer';
      } else {
        Game.ActionLine.setHoverTarget(null);
      }
      return;
    }

    // Viewport hover — check hotspots
    if (gameY < cfg.VIEWPORT_HEIGHT) {
      var hs = Game.Room.getHotspotAt(gameX, gameY);
      if (hs) {
        Game.ActionLine.setHoverTarget(hs.id);
        cursorStyle = 'pointer';
      } else {
        Game.ActionLine.setHoverTarget(null);
      }
    }
  }

  function onClick(e) {
    var gp = screenToGame(e.offsetX, e.offsetY);
    var gx = gp.x, gy = gp.y;
    var cfg = Game.Config;

    // Save/Load menu absorbs all clicks
    if (Game.SaveLoad.isOpen()) {
      Game.SaveLoad.handleClick(gx, gy);
      return;
    }

    // Text box dismiss
    if (Game.TextBox.isBlocking()) {
      Game.TextBox.dismiss();
      return;
    }

    // Dialogue absorbs
    if (Game.Dialogue.isActive()) {
      Game.Dialogue.handleClick(gx, gy);
      return;
    }

    // Interaction busy — ignore
    if (Game.Interaction.isBusy()) return;

    // Victory screen
    if (Game.State.check('game_won')) return;

    // Verb panel
    if (gy >= cfg.BOTTOM_BAR_Y && gx < cfg.VERB_PANEL_WIDTH) {
      Game.Verbs.handleClick(gx, gy);
      return;
    }

    // Inventory
    if (gy >= cfg.BOTTOM_BAR_Y && gx >= cfg.INVENTORY_X) {
      Game.Inventory.handleClick(gx, gy);
      return;
    }

    // Viewport click
    if (gy < cfg.VIEWPORT_HEIGHT) {
      var hotspot = Game.Room.getHotspotAt(gx, gy);
      var verb = Game.Verbs.getCurrent();
      var selectedItem = Game.Inventory.getSelected();

      if (hotspot) {
        if (selectedItem && verb && cfg.TWO_OBJECT_VERBS[verb]) {
          // Two-object: Use item with hotspot
          Game.Interaction.executeOnHotspotWithItem(verb, hotspot, selectedItem);
        } else if (verb) {
          Game.ActionLine.setObject1(hotspot.id);
          Game.Interaction.executeOnHotspot(verb, hotspot);
        } else if (Game.Room.isNoWalk()) {
          // No-walk room: auto Look at on hotspot click
          Game.ActionLine.setObject1(hotspot.id);
          Game.Interaction.executeOnHotspot('Look at', hotspot);
        } else {
          // No verb selected — walk to
          var wp = Game.Room.getWalkToPoint(hotspot);
          Game.Player.cancelWalk();
          Game.Player.walkTo(wp.x, wp.y);
        }
      } else {
        if (Game.Room.isNoWalk()) {
          // No-walk room: ignore floor clicks
          return;
        }
        // Click empty space — walk to
        Game.Player.cancelWalk();
        Game.Player.walkTo(gx, gy);
        Game.Verbs.reset();
        Game.ActionLine.reset();
        Game.Inventory.clearSelection();
      }
    }
  }

  function onRightClick(e) {
    e.preventDefault();
    Game.Verbs.reset();
    Game.ActionLine.reset();
    Game.Inventory.clearSelection();
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      if (Game.SaveLoad.isOpen()) {
        Game.SaveLoad.close();
      } else {
        Game.SaveLoad.open('save');
      }
      e.preventDefault();
    }
    if (e.key === 'F5') {
      Game.SaveLoad.quickSave();
      Game.TextBox.show('Game saved!', Game.Config.WIDTH / 2, 50, '#00ff00', 1.5);
      e.preventDefault();
    }
    if (e.key === 'F9') {
      if (Game.SaveLoad.quickLoad()) {
        Game.TextBox.show('Game loaded!', Game.Config.WIDTH / 2, 50, '#00ff00', 1.5);
      } else {
        Game.TextBox.show('No quick save found.', Game.Config.WIDTH / 2, 50, '#ff6b6b', 1.5);
      }
      e.preventDefault();
    }
    if (e.key === 'F12' || (e.key === 'd' && e.ctrlKey)) {
      // Don't prevent F12 (dev tools), but toggle debug on ctrl+d
      if (e.key === 'd') {
        Game.Config.DEBUG = !Game.Config.DEBUG;
        e.preventDefault();
      }
    }
  }

  function getCursorStyle() { return cursorStyle; }
  function getGamePos() { return { x: gameX, y: gameY }; }

  return {
    init: init,
    getCursorStyle: getCursorStyle,
    getGamePos: getGamePos,
  };
})();
