Game.Input = (function () {
  var mouseX = 0, mouseY = 0;
  var gameX = 0, gameY = 0;
  var cursorStyle = 'default';
  var locked = false;

  function init(canvas) {
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup',   onMouseUp);
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

  function onMouseDown(e) {
    var gp = screenToGame(e.offsetX, e.offsetY);
    Game.DebugEditor.onMouseDown(gp.x, gp.y);
  }

  function onMouseUp(e) {
    var gp = screenToGame(e.offsetX, e.offsetY);
    Game.DebugEditor.onMouseUp(gp.x, gp.y);
  }

  function onMouseMove(e) {
    mouseX = e.offsetX;
    mouseY = e.offsetY;
    var gp = screenToGame(mouseX, mouseY);
    gameX = gp.x;
    gameY = gp.y;

    // Debug editor drag takes priority
    if (Game.DebugEditor.onMouseMove(gameX, gameY)) {
      var dc = Game.DebugEditor.getCursorStyle();
      if (dc) cursorStyle = dc;
      return;
    }

    // Route hover
    var cfg = Game.Config;
    cursorStyle = 'default';

    if (Game.SaveLoad.isOpen()) {
      Game.SaveLoad.handleHover(gameX, gameY);
      return;
    }

    if (Game.Wordfight.isActive()) {
      Game.Wordfight.handleHover(gameX, gameY);
      cursorStyle = Game.Wordfight.getCursorStyle();
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
    // Ignore all clicks until the game loop is running (title screen)
    if (!Game.Renderer.isStarted()) return;

    // Suppress click if the debug editor just finished a drag
    if (Game.DebugEditor.consumedDrag()) return;

    var gp = screenToGame(e.offsetX, e.offsetY);
    var gx = gp.x, gy = gp.y;
    var cfg = Game.Config;

    // Save/Load menu absorbs all clicks
    if (Game.SaveLoad.isOpen()) {
      Game.SaveLoad.handleClick(gx, gy);
      return;
    }

    // FakeDeath overlay absorbs all clicks (before lock/busy checks)
    if (Game.FakeDeath.isActive()) {
      Game.FakeDeath.handleClick(gx, gy);
      return;
    }

    // TitleCard overlay absorbs all clicks
    if (Game.TitleCard.isActive()) {
      Game.TitleCard.handleClick();
      return;
    }

    // Text box dismiss
    if (Game.TextBox.isBlocking()) {
      Game.TextBox.dismiss();
      return;
    }

    // Wordfight absorbs (before lock check — wordfight runs during locked cutscene)
    if (Game.Wordfight.isActive()) {
      Game.Wordfight.handleClick(gx, gy);
      return;
    }

    // Dialogue absorbs
    if (Game.Dialogue.isActive()) {
      Game.Dialogue.handleClick(gx, gy);
      return;
    }

    // Verb panel — always reachable, even during walks/interactions
    if (gy >= cfg.BOTTOM_BAR_Y && gx < cfg.VERB_PANEL_WIDTH) {
      Game.Verbs.handleClick(gx, gy);
      return;
    }

    // Input locked during cutscene
    if (locked) return;

    // Interaction busy — ignore
    if (Game.Interaction.isBusy()) return;

    // Victory screen
    if (Game.State.check('game_won')) return;

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
          // No verb selected — auto Look at on hotspot click
          Game.ActionLine.setObject1(hotspot.id);
          Game.Interaction.executeOnHotspot('Look at', hotspot);
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

  function lock()   { locked = true; }
  function unlock() { locked = false; }

  function getCursorStyle() { return cursorStyle; }
  function getGamePos() { return { x: gameX, y: gameY }; }

  return {
    init: init,
    lock: lock,
    unlock: unlock,
    getCursorStyle: getCursorStyle,
    getGamePos: getGamePos,
  };
})();
