Game.SaveLoad = (function () {
  var SAVE_KEY = 'separation_agreement_saves';
  var NUM_SLOTS = 8;
  var menuOpen = false;
  var mode = 'save'; // 'save' or 'load'
  var hoverSlot = -1;

  function open(m) {
    mode = m || 'save';
    menuOpen = true;
    hoverSlot = -1;
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

  function saveToSlot(slot) {
    var saves = getSaves();
    saves[slot] = {
      timestamp: new Date().toLocaleString(),
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
    close();
    return true;
  }

  function quickSave() {
    saveToSlot('quick');
  }

  function quickLoad() {
    return loadFromSlot('quick');
  }

  function handleClick(gx, gy) {
    if (!menuOpen) return false;

    var cfg = Game.Config;
    var menuW = 600;
    var menuH = 500;
    var menuX = (cfg.WIDTH - menuW) / 2;
    var menuY = (cfg.HEIGHT - menuH) / 2;

    // Close button
    if (gx >= menuX + menuW - 40 && gx <= menuX + menuW && gy >= menuY && gy <= menuY + 40) {
      close();
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
    ctx.fillText(mode === 'save' ? 'SAVE GAME' : 'LOAD GAME', cfg.WIDTH / 2, menuY + 45);

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
        ctx.fillText('Slot ' + (i + 1) + ':  ' + save.room + '  —  ' + save.timestamp, menuX + 35, sy + 30);
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
