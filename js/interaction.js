Game.Interaction = (function () {
  var busy = false;

  function isBusy() { return busy; }

  function autoFace(hotspot) {
    // Only respect explicit left/right face_dir; ignore "back" since the player
    // now always stands to the side and should face toward the object.
    if (hotspot.face_dir === 'left' || hotspot.face_dir === 'right') {
      Game.Player.setDirection(hotspot.face_dir);
    } else if (hotspot.cursor !== 'exit') {
      var c = Game.Room.getHotspotCenter(hotspot);
      Game.Player.setDirection(Game.Player.getX() < c.x ? 'right' : 'left');
    }
  }

  // Execute verb on a hotspot
  function executeOnHotspot(verb, hotspot) {
    if (busy) return;
    busy = true;

    function doExecute() {
      autoFace(hotspot);

      var response = findResponse(verb, hotspot);
      if (response) {
        executeResponse(response, function () {
          finishInteraction();
        });
      } else if (verb === 'Talk to' && hotspot.dialogue) {
        Game.Dialogue.start(hotspot.dialogue, function () {
          finishInteraction();
        });
      } else {
        var text = getDefaultResponse(verb, hotspot.name);
        Game.TextBox.showBlocking(text, Game.Player.getX(), Game.Player.getHeadY(), Game.Config.COLORS.TEXT_PLAYER, function () {
          finishInteraction();
        });
      }
    }

    if (Game.Room.isNoWalk()) {
      doExecute();
    } else {
      var walkPt = Game.Room.getWalkToPoint(hotspot);
      Game.Player.walkTo(walkPt.x, walkPt.y, doExecute);
    }
  }

  // Execute verb on an inventory item
  function executeOnItem(verb, itemId) {
    if (busy) return;
    busy = true;

    var info = Game.Inventory.getItemInfo(itemId);
    var response = findItemResponse(verb, itemId);

    if (response) {
      executeResponse(response, function () {
        finishInteraction();
      });
    } else {
      var text = getDefaultResponse(verb, info.name);
      Game.TextBox.showBlocking(text, Game.Player.getX(), Game.Player.getHeadY(), Game.Config.COLORS.TEXT_PLAYER, function () {
        finishInteraction();
      });
    }
  }

  // Two-object verb execution (Use X with Y, Give X to Y)
  function executeTwoObject(verb, obj1, obj2) {
    if (busy) return;
    busy = true;

    // Check hotspot for obj2 (if clicking on a hotspot)
    var hotspot = null;
    var hotspots = Game.Room.getHotspots();
    for (var i = 0; i < hotspots.length; i++) {
      if (hotspots[i].id === obj2) { hotspot = hotspots[i]; break; }
    }

    function doAction() {
      // Look up combination responses
      var response = findCombinationResponse(verb, obj1, obj2);
      if (!response) response = findCombinationResponse(verb, obj2, obj1);

      if (response) {
        executeResponse(response, function () { finishInteraction(); });
      } else {
        var name1 = Game.Inventory.getItemInfo(obj1).name;
        var name2 = getObjName(obj2);
        var text = "I can't " + verb.toLowerCase() + ' ' + name1 + ' with ' + name2 + '.';
        Game.TextBox.showBlocking(text, Game.Player.getX(), Game.Player.getHeadY(), Game.Config.COLORS.TEXT_PLAYER, function () {
          finishInteraction();
        });
      }
    }

    if (hotspot && !Game.Room.isNoWalk()) {
      var walkPt = Game.Room.getWalkToPoint(hotspot);
      Game.Player.walkTo(walkPt.x, walkPt.y, doAction);
    } else {
      doAction();
    }
  }

  function executeOnHotspotWithItem(verb, hotspot, itemId) {
    if (busy) return;
    busy = true;

    function doExecute() {
      autoFace(hotspot);

      var response = findCombinationResponse(verb, itemId, hotspot.id);
      if (!response) response = findCombinationResponse(verb, hotspot.id, itemId);

      if (response) {
        executeResponse(response, function () { finishInteraction(); });
      } else {
        var iName = Game.Inventory.getItemInfo(itemId).name;
        var text = "I can't use " + iName + ' with ' + hotspot.name + '.';
        Game.TextBox.showBlocking(text, Game.Player.getX(), Game.Player.getHeadY(), Game.Config.COLORS.TEXT_PLAYER, function () {
          finishInteraction();
        });
      }
    }

    if (Game.Room.isNoWalk()) {
      doExecute();
    } else {
      var walkPt = Game.Room.getWalkToPoint(hotspot);
      Game.Player.walkTo(walkPt.x, walkPt.y, doExecute);
    }
  }

  var VERB_KEY_MAP = { 'take': 'pick_up' };

  function verbToKey(verb) {
    var k = verb.toLowerCase().replace(/ /g, '_');
    return VERB_KEY_MAP[k] || k;
  }

  function findResponse(verb, hotspot) {
    var verbKey = verbToKey(verb);
    if (hotspot.interactions && hotspot.interactions[verbKey]) {
      var responses = hotspot.interactions[verbKey];
      // Array of conditional responses
      if (Array.isArray(responses)) {
        for (var i = 0; i < responses.length; i++) {
          if (!responses[i].condition || Game.State.evaluate(responses[i].condition)) {
            return responses[i];
          }
        }
      } else {
        return responses;
      }
    }
    return null;
  }

  function findItemResponse(verb, itemId) {
    var allItems = Game.Loader.getData('items');
    if (!allItems || !allItems.items) return null;

    var verbKey = verbToKey(verb);
    for (var i = 0; i < allItems.items.length; i++) {
      var item = allItems.items[i];
      if (item.id === itemId && item.interactions && item.interactions[verbKey]) {
        var responses = item.interactions[verbKey];
        if (Array.isArray(responses)) {
          for (var j = 0; j < responses.length; j++) {
            if (!responses[j].condition || Game.State.evaluate(responses[j].condition)) {
              return responses[j];
            }
          }
        } else {
          return responses;
        }
      }
    }
    return null;
  }

  function findCombinationResponse(verb, obj1, obj2) {
    // Check room hotspot combinations
    var hotspots = Game.Room.getHotspots();
    for (var i = 0; i < hotspots.length; i++) {
      var h = hotspots[i];
      if (h.id === obj2 && h.combinations) {
        for (var j = 0; j < h.combinations.length; j++) {
          var combo = h.combinations[j];
          if (combo.item === obj1 && combo.verb === verbToKey(verb)) {
            if (!combo.condition || Game.State.evaluate(combo.condition)) {
              return combo;
            }
          }
        }
      }
    }

    // Check items.json combinations
    var allItems = Game.Loader.getData('items');
    if (allItems && allItems.combinations) {
      for (var k = 0; k < allItems.combinations.length; k++) {
        var c = allItems.combinations[k];
        if ((c.item1 === obj1 && c.item2 === obj2) || (c.item1 === obj2 && c.item2 === obj1)) {
          if (!c.condition || Game.State.evaluate(c.condition)) {
            return c;
          }
        }
      }
    }

    return null;
  }

  function executeResponse(response, callback) {
    if (response.text) {
      var respColor = response.color;
      if (!respColor || respColor === 'player') respColor = Game.Config.COLORS.TEXT_PLAYER;
      else if (respColor === 'narrator') respColor = Game.Config.COLORS.TEXT_NARRATOR;
      else if (respColor === 'npc') respColor = Game.Config.COLORS.TEXT_NPC;
      Game.TextBox.showBlocking(
        response.text,
        Game.Player.getX(),
        Game.Player.getY() - 140,
        respColor,
        function () {
          if (response.effects) {
            Game.Effects.execute(response.effects, callback);
          } else {
            if (callback) callback();
          }
        }
      );
    } else if (response.effects) {
      Game.Effects.execute(response.effects, callback);
    } else {
      if (callback) callback();
    }
  }

  function getDefaultResponse(verb, name) {
    var gameData = Game.Loader.getData('game');
    if (gameData && gameData.default_responses) {
      var key = verbToKey(verb);
      var template = gameData.default_responses[key];
      if (template) return template.replace('{name}', name);
    }

    switch (verb) {
      case 'Look at': return "It's " + name + '. Nothing special.';
      case 'Take': return "I can't take that.";
      case 'Open': return "I can't open that.";
      case 'Close': return "I can't close that.";
      case 'Push': return "I can't push that.";
      case 'Pull': return "I can't pull that.";
      case 'Talk to': return "I don't think " + name + " wants to talk.";
      case 'Give': return "I can't give that.";
      case 'Use': return "I can't use that.";
      default: return "I can't do that.";
    }
  }

  function getObjName(id) {
    var info = Game.Inventory.getItemInfo(id);
    if (info && info.name !== id) return info.name;
    var hs = Game.Room.getHotspots();
    for (var i = 0; i < hs.length; i++) {
      if (hs[i].id === id) return hs[i].name;
    }
    return id;
  }

  function finishInteraction() {
    busy = false;
    Game.Verbs.reset();
    Game.ActionLine.reset();
    Game.Inventory.clearSelection();
  }

  return {
    isBusy: isBusy,
    executeOnHotspot: executeOnHotspot,
    executeOnItem: executeOnItem,
    executeTwoObject: executeTwoObject,
    executeOnHotspotWithItem: executeOnHotspotWithItem,
    finishInteraction: finishInteraction,
  };
})();
