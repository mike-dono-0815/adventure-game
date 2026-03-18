Game.SaveLoad = (function () {
  var SAVE_KEY = 'corporate_adventure_saves' + (window.GAME_VARIANT === 'b' ? '_b' : '');
  var NUM_SLOTS = 8;
  var menuOpen = false;
  var mode = 'select'; // 'select' | 'save' | 'load'
  var hoverSlot = -1;
  var hoverBtn = -1; // for select screen: 0 = save, 1 = load

  function open(m) {
    mode = m || 'select';
    menuOpen = true;
    hoverSlot = -1;
    hoverBtn = -1;
  }

  function close() {
    menuOpen = false;
  }

  function isOpen() { return menuOpen; }

  function getSaves() {
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveToSlot(slot, isQuick) {
    var saves = getSaves();
    saves[slot] = {
      timestamp: new Date().toLocaleString(),
      savedAt: Date.now(),
      quicksave: isQuick || false,
      room: Game.Room.getCurrentId(),
      state: Game.State.serialize(),
      player: Game.Player.serialize(),
      inventory: Game.Inventory.serialize(),
      room_state: Game.Room.serialize(),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saves));
    close();
  }

  function loadFromSlot(slot) {
    var saves = getSaves();
    if (!saves[slot]) return false;

    var data = saves[slot];
    Game.State.deserialize(data.state);
    Game.Inventory.deserialize(data.inventory);
    Game.Room.deserialize(data.room_state);
    Game.Player.deserialize(data.player);
    Game.TextBox.clear();
    Game.Dialogue.end();
    Game.Interaction.finishInteraction();
    if (!Game.Renderer.isStarted()) Game.Renderer.start();
    close();
    return true;
  }

  function quickSave() {
    var saves = getSaves();
    var targetSlot = -1;
    for (var i = 0; i < NUM_SLOTS; i++) {
      if (!saves[i]) { targetSlot = i; break; }
    }
    if (targetSlot === -1) {
      // All slots full — overwrite the oldest
      var oldestTime = Infinity;
      for (var i = 0; i < NUM_SLOTS; i++) {
        var t = saves[i] ? (saves[i].savedAt || 0) : 0;
        if (t < oldestTime) { oldestTime = t; targetSlot = i; }
      }
    }
    saveToSlot(targetSlot, true);
  }

  function quickLoad() {
    var saves = getSaves();
    var latestSlot = null;
    var latestTime = -1;
    for (var i = 0; i < NUM_SLOTS; i++) {
      if (saves[i]) {
        var t = saves[i].savedAt || 0;
        if (t > latestTime) { latestTime = t; latestSlot = i; }
      }
    }
    if (latestSlot === null) return false;
    return loadFromSlot(latestSlot);
  }

  function handleClick(gx, gy) {
    if (!menuOpen) return false;

    var cfg = Game.Config;
    var menuW = 600;
    var menuH = 500;
    var menuX = (cfg.WIDTH - menuW) / 2;
    var menuY = (cfg.HEIGHT - menuH) / 2;

    // Close button (all screens)
    if (gx >= menuX + menuW - 40 && gx <= menuX + menuW && gy >= menuY && gy <= menuY + 40) {
      close();
      return true;
    }

    // Select screen
    if (mode === 'select') {
      var btnW = 200, btnH = 60;
      var saveX = menuX + menuW / 2 - btnW - 20;
      var loadX = menuX + menuW / 2 + 20;
      var btnY  = menuY + menuH / 2 - btnH / 2;
      if (gy >= btnY && gy <= btnY + btnH) {
        if (gx >= saveX && gx <= saveX + btnW) { mode = 'save'; hoverSlot = -1; return true; }
        if (gx >= loadX && gx <= loadX + btnW) { mode = 'load'; hoverSlot = -1; return true; }
      }
      return true;
    }

    // Slot clicks
    var slotH = 50;
    var startY = menuY + 70;
    var saves = getSaves();

    for (var i = 0; i < NUM_SLOTS; i++) {
      var sy = startY + i * slotH;
      if (gx >= menuX + 20 && gx <= menuX + menuW - 20 && gy >= sy && gy <= sy + slotH - 5) {
        if (mode === 'save') {
          saveToSlot(i);
        } else {
          if (saves[i]) loadFromSlot(i);
        }
        return true;
      }
    }

    return true; // Absorb click
  }

  function handleHover(gx, gy) {
    if (!menuOpen) return;

    var cfg = Game.Config;
    var menuW = 600;
    var menuH = 500;
    var menuX = (cfg.WIDTH - menuW) / 2;
    var menuY = (cfg.HEIGHT - menuH) / 2;

    if (mode === 'select') {
      var btnW = 200, btnH = 60;
      var saveX = menuX + menuW / 2 - btnW - 20;
      var loadX = menuX + menuW / 2 + 20;
      var btnY  = menuY + menuH / 2 - btnH / 2;
      hoverBtn = -1;
      if (gy >= btnY && gy <= btnY + btnH) {
        if (gx >= saveX && gx <= saveX + btnW) hoverBtn = 0;
        if (gx >= loadX && gx <= loadX + btnW) hoverBtn = 1;
      }
      return;
    }

    var slotH = 50;
    var startY = menuY + 70;
    hoverSlot = -1;
    for (var i = 0; i < NUM_SLOTS; i++) {
      var sy = startY + i * slotH;
      if (gx >= menuX + 20 && gx <= menuX + menuW - 20 && gy >= sy && gy <= sy + slotH - 5) {
        hoverSlot = i;
        return;
      }
    }
  }

  function draw(ctx) {
    if (!menuOpen) return;

    var cfg = Game.Config;
    var menuW = 600;
    var menuH = 500;
    var menuX = (cfg.WIDTH - menuW) / 2;
    var menuY = (cfg.HEIGHT - menuH) / 2;

    // Backdrop
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, cfg.WIDTH, cfg.HEIGHT);

    // Menu panel
    ctx.fillStyle = cfg.COLORS.SAVE_MENU_BG;
    ctx.fillRect(menuX, menuY, menuW, menuH);
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    ctx.strokeRect(menuX, menuY, menuW, menuH);

    // Title
    ctx.fillStyle = '#e0e0e0';
    ctx.font = 'bold 28px ' + cfg.FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.fillText(mode === 'save' ? 'SAVE GAME' : mode === 'load' ? 'LOAD GAME' : 'SAVE / LOAD', cfg.WIDTH / 2, menuY + 45);

    // Select screen — two big buttons
    if (mode === 'select') {
      var btnW = 200, btnH = 60;
      var saveX = menuX + menuW / 2 - btnW - 20;
      var loadX = menuX + menuW / 2 + 20;
      var btnY  = menuY + menuH / 2 - btnH / 2;

      ctx.fillStyle = hoverBtn === 0 ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)';
      ctx.fillRect(saveX, btnY, btnW, btnH);
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 1;
      ctx.strokeRect(saveX, btnY, btnW, btnH);

      ctx.fillStyle = hoverBtn === 1 ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)';
      ctx.fillRect(loadX, btnY, btnW, btnH);
      ctx.strokeRect(loadX, btnY, btnW, btnH);

      ctx.fillStyle = '#e0e0e0';
      ctx.font = 'bold 22px ' + cfg.FONT_FAMILY;
      ctx.textAlign = 'center';
      ctx.fillText('SAVE GAME', saveX + btnW / 2, btnY + btnH / 2 + 8);
      ctx.fillText('LOAD GAME', loadX + btnW / 2, btnY + btnH / 2 + 8);
      ctx.textAlign = 'left';
      return;
    }

    // Close button
    ctx.fillStyle = '#ff6b6b';
    ctx.font = '24px ' + cfg.FONT_FAMILY;
    ctx.fillText('X', menuX + menuW - 20, menuY + 28);

    // Slots
    var slotH = 50;
    var startY = menuY + 70;
    var saves = getSaves();

    ctx.font = '18px ' + cfg.FONT_FAMILY;
    ctx.textAlign = 'left';

    for (var i = 0; i < NUM_SLOTS; i++) {
      var sy = startY + i * slotH;
      var save = saves[i];

      ctx.fillStyle = i === hoverSlot ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)';
      ctx.fillRect(menuX + 20, sy, menuW - 40, slotH - 5);

      ctx.fillStyle = '#e0e0e0';
      if (save) {
        var label = 'Slot ' + (i + 1) + ':  ' + (save.quicksave ? '[Quicksave]  ' : '') + save.room + '  —  ' + save.timestamp;
        ctx.fillText(label, menuX + 35, sy + 30);
      } else {
        ctx.fillStyle = '#888';
        ctx.fillText('Slot ' + (i + 1) + ':  (empty)', menuX + 35, sy + 30);
      }
    }

    ctx.textAlign = 'left';
  }

  return {
    open: open,
    close: close,
    isOpen: isOpen,
    quickSave: quickSave,
    quickLoad: quickLoad,
    handleClick: handleClick,
    handleHover: handleHover,
    draw: draw,
  };
})();
