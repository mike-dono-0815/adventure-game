Game.Inventory = (function () {
  var items = [];
  var scrollOffset = 0;
  var hoverIndex = -1;
  var selectedItem = null;
  var itemData = {};

  function init() {
    items = [];
    scrollOffset = 0;
    selectedItem = null;
    var allItems = Game.Loader.getData('items');
    if (allItems && allItems.items) {
      for (var i = 0; i < allItems.items.length; i++) {
        var it = allItems.items[i];
        itemData[it.id] = it;
      }
    }
  }

  function add(itemId) {
    if (items.indexOf(itemId) === -1) {
      items.push(itemId);
    }
  }

  function remove(itemId) {
    var idx = items.indexOf(itemId);
    if (idx !== -1) items.splice(idx, 1);
    if (selectedItem === itemId) selectedItem = null;
  }

  function replace(oldId, newId) {
    var idx = items.indexOf(oldId);
    if (idx !== -1) {
      items[idx] = newId;
    } else {
      add(newId);
    }
    if (selectedItem === oldId) selectedItem = newId;
  }

  function has(itemId) {
    return items.indexOf(itemId) !== -1;
  }

  function getSelected() {
    return selectedItem;
  }

  function clearSelection() {
    selectedItem = null;
  }

  function getItemInfo(itemId) {
    return itemData[itemId] || { id: itemId, name: itemId, description: 'An item.' };
  }

  function handleClick(gx, gy) {
    var cfg = Game.Config;
    var invX = cfg.INVENTORY_X;
    var invY = cfg.BOTTOM_BAR_Y;
    var invW = cfg.INVENTORY_WIDTH;
    var invH = cfg.BOTTOM_BAR_HEIGHT;

    if (gx < invX || gx > invX + invW || gy < invY || gy > invY + invH) return false;

    // Scroll arrows
    var arrowW = 40;
    if (gx < invX + arrowW) {
      scrollOffset = Math.max(0, scrollOffset - 1);
      return true;
    }
    if (gx > invX + invW - arrowW) {
      scrollOffset = Math.min(Math.max(0, items.length - cfg.INVENTORY_COLS * cfg.INVENTORY_ROWS), scrollOffset + 1);
      return true;
    }

    // Item grid
    var gridX = invX + arrowW + 10;
    var thumbSX = cfg.ITEM_THUMB_SIZE + cfg.ITEM_PADDING_X;
    var thumbSY = cfg.ITEM_THUMB_SIZE + cfg.ITEM_PADDING;
    var col = Math.floor((gx - gridX) / thumbSX);
    var row = Math.floor((gy - invY - 10) / thumbSY);

    if (col >= 0 && col < cfg.INVENTORY_COLS && row >= 0 && row < cfg.INVENTORY_ROWS) {
      var idx = scrollOffset + row * cfg.INVENTORY_COLS + col;
      if (idx < items.length) {
        var verb = Game.Verbs.getCurrent();
        var prep = cfg.TWO_OBJECT_VERBS[verb];

        if (prep && Game.ActionLine.getObject1()) {
          // Second object for two-object verb
          selectedItem = null;
          Game.ActionLine.setObject2(items[idx]);
          Game.Interaction.executeTwoObject(verb, Game.ActionLine.getObject1(), items[idx]);
        } else if (verb) {
          // Use verb on inventory item
          Game.ActionLine.setObject1(items[idx]);
          if (prep) {
            selectedItem = items[idx];
          } else {
            Game.Interaction.executeOnItem(verb, items[idx]);
          }
        } else {
          // No verb — select for look
          selectedItem = items[idx];
          Game.Verbs.setCurrent('Look at');
          Game.ActionLine.setVerb('Look at');
          Game.ActionLine.setObject1(items[idx]);
          Game.Interaction.executeOnItem('Look at', items[idx]);
        }
        return true;
      }
    }
    return false;
  }

  function handleHover(gx, gy) {
    var cfg = Game.Config;
    var invX = cfg.INVENTORY_X;
    var invY = cfg.BOTTOM_BAR_Y;
    var arrowW = 40;
    var gridX = invX + arrowW + 10;
    var thumbSX = cfg.ITEM_THUMB_SIZE + cfg.ITEM_PADDING_X;
    var thumbSY = cfg.ITEM_THUMB_SIZE + cfg.ITEM_PADDING;

    var col = Math.floor((gx - gridX) / thumbSX);
    var row = Math.floor((gy - invY - 10) / thumbSY);

    if (col >= 0 && col < cfg.INVENTORY_COLS && row >= 0 && row < cfg.INVENTORY_ROWS) {
      var idx = scrollOffset + row * cfg.INVENTORY_COLS + col;
      if (idx < items.length) {
        hoverIndex = idx;
        return items[idx];
      }
    }
    hoverIndex = -1;
    return null;
  }

  function draw(ctx) {
    var cfg = Game.Config;
    var invX = cfg.INVENTORY_X;
    var invY = cfg.BOTTOM_BAR_Y;
    var invW = cfg.INVENTORY_WIDTH;
    var invH = cfg.BOTTOM_BAR_HEIGHT;

    // Background
    ctx.fillStyle = cfg.COLORS.INVENTORY_BG;
    ctx.fillRect(invX, invY, invW, invH);

    // Border
    ctx.strokeStyle = cfg.COLORS.INVENTORY_BORDER;
    ctx.lineWidth = 2;
    ctx.strokeRect(invX, invY, invW, invH);

    // Scroll arrows
    var arrowW = 40;
    ctx.fillStyle = '#e0e0e0';
    ctx.font = '28px ' + cfg.FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('\u25C0', invX + arrowW / 2, invY + invH / 2);
    ctx.fillText('\u25B6', invX + invW - arrowW / 2, invY + invH / 2);

    // Item grid
    var gridX = invX + arrowW + 10;
    var thumbSX = cfg.ITEM_THUMB_SIZE + cfg.ITEM_PADDING_X;
    var thumbSY = cfg.ITEM_THUMB_SIZE + cfg.ITEM_PADDING;

    for (var row = 0; row < cfg.INVENTORY_ROWS; row++) {
      for (var col = 0; col < cfg.INVENTORY_COLS; col++) {
        var idx = scrollOffset + row * cfg.INVENTORY_COLS + col;
        var dx = gridX + col * thumbSX;
        var dy = invY + 10 + row * thumbSY;

        // Slot background
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(dx, dy, cfg.ITEM_THUMB_SIZE, cfg.ITEM_THUMB_SIZE);

        if (idx < items.length) {
          var info = getItemInfo(items[idx]);
          var img = Game.Loader.getImage('item_' + items[idx]);

          if (img) {
            ctx.drawImage(img, dx, dy, cfg.ITEM_THUMB_SIZE, cfg.ITEM_THUMB_SIZE);
          } else {
            // Draw placeholder icon
            drawItemPlaceholder(ctx, dx, dy, cfg.ITEM_THUMB_SIZE, info);
          }

          // Highlight selected
          if (items[idx] === selectedItem) {
            ctx.strokeStyle = cfg.COLORS.VERB_ACTIVE;
            ctx.lineWidth = 3;
            ctx.strokeRect(dx - 1, dy - 1, cfg.ITEM_THUMB_SIZE + 2, cfg.ITEM_THUMB_SIZE + 2);
          }
          // Hover
          if (idx === hoverIndex) {
            ctx.strokeStyle = cfg.COLORS.VERB_HOVER;
            ctx.lineWidth = 2;
            ctx.strokeRect(dx - 1, dy - 1, cfg.ITEM_THUMB_SIZE + 2, cfg.ITEM_THUMB_SIZE + 2);
          }
        }
      }
    }

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  function drawItemPlaceholder(ctx, dx, dy, size, info) {
    // Colored square with icon and label
    ctx.fillStyle = info.color || '#4a90d9';
    ctx.fillRect(dx + 4, dy + 4, size - 8, size - 8);

    ctx.fillStyle = '#fff';
    ctx.font = '10px ' + Game.Config.FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.fillText(info.name || info.id, dx + size / 2, dy + size / 2 + 4);
    ctx.textAlign = 'left';

    // Simple icon
    if (info.icon) {
      ctx.font = '28px ' + Game.Config.FONT_FAMILY;
      ctx.textAlign = 'center';
      ctx.fillText(info.icon, dx + size / 2, dy + size / 2 - 4);
      ctx.textAlign = 'left';
    }
  }

  function getItems() { return items.slice(); }

  function serialize() {
    return { items: items.slice(), scrollOffset: scrollOffset };
  }

  function deserialize(data) {
    items = data.items || [];
    scrollOffset = data.scrollOffset || 0;
    selectedItem = null;
  }

  return {
    init: init,
    add: add,
    remove: remove,
    replace: replace,
    has: has,
    getSelected: getSelected,
    clearSelection: clearSelection,
    getItemInfo: getItemInfo,
    handleClick: handleClick,
    handleHover: handleHover,
    draw: draw,
    getItems: getItems,
    serialize: serialize,
    deserialize: deserialize,
  };
})();
