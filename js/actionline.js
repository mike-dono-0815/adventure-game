Game.ActionLine = (function () {
  var verb = null;
  var object1 = null;
  var object2 = null;
  var hoverTarget = null;

  function setVerb(v) { verb = v; }
  function setObject1(o) { object1 = o; }
  function setObject2(o) { object2 = o; }
  function setHoverTarget(name) { hoverTarget = name; }

  function getObject1() { return object1; }
  function getObject2() { return object2; }

  function getText() {
    var parts = [];
    var v = verb || Game.Config.DEFAULT_VERB;
    parts.push(v);

    if (object1) {
      var info1 = getDisplayName(object1);
      parts.push(info1);
    }

    var prep = Game.Config.TWO_OBJECT_VERBS[verb];
    if (prep && object1) {
      parts.push(prep);
      if (object2) {
        parts.push(getDisplayName(object2));
      } else if (hoverTarget && hoverTarget !== object1) {
        parts.push(getDisplayName(hoverTarget));
      }
    } else if (!object1 && hoverTarget) {
      parts.push(getDisplayName(hoverTarget));
    }

    return parts.join(' ');
  }

  function getDisplayName(id) {
    // Check if it's an inventory item
    var info = Game.Inventory.getItemInfo(id);
    if (info && info.name && info.name !== id) return info.name;

    // Check if it's a hotspot
    var hotspots = Game.Room.getHotspots();
    for (var i = 0; i < hotspots.length; i++) {
      if (hotspots[i].id === id) return hotspots[i].name;
    }

    return id;
  }

  function reset() {
    verb = null;
    object1 = null;
    object2 = null;
    hoverTarget = null;
  }

  function draw(ctx) {
    var cfg = Game.Config;
    var y = cfg.ACTION_LINE_Y;
    var h = cfg.ACTION_LINE_HEIGHT;

    // Background
    ctx.fillStyle = cfg.COLORS.ACTION_LINE_BG;
    ctx.fillRect(0, y, cfg.WIDTH, h);

    // Text
    var text = getText();
    ctx.fillStyle = cfg.COLORS.ACTION_LINE_TEXT;
    ctx.font = 'bold 26px ' + cfg.FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, cfg.WIDTH / 2, y + h / 2);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  return {
    setVerb: setVerb,
    setObject1: setObject1,
    setObject2: setObject2,
    setHoverTarget: setHoverTarget,
    getObject1: getObject1,
    getObject2: getObject2,
    getText: getText,
    reset: reset,
    draw: draw,
  };
})();
