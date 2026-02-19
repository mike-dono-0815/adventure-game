Game.State = (function () {
  var flags = {};
  var seenDialogues = {};

  function init(startingFlags) {
    flags = {};
    seenDialogues = {};
    if (startingFlags) {
      for (var k in startingFlags) {
        flags[k] = startingFlags[k];
      }
    }
  }

  function get(key) {
    return flags[key];
  }

  function set(key, value) {
    flags[key] = value;
  }

  function check(key) {
    return !!flags[key];
  }

  function toggle(key) {
    flags[key] = !flags[key];
  }

  function markSeen(dialogueId, choiceId) {
    var k = dialogueId + '::' + choiceId;
    seenDialogues[k] = true;
  }

  function hasSeen(dialogueId, choiceId) {
    return !!seenDialogues[dialogueId + '::' + choiceId];
  }

  // Evaluate a condition object: { "flag": true/false } or { "has_item": "x" } etc.
  function evaluate(condition) {
    if (!condition) return true;

    for (var key in condition) {
      var expected = condition[key];

      if (key === 'has_item') {
        if (!Game.Inventory.has(expected)) return false;
      } else if (key === 'not_has_item') {
        if (Game.Inventory.has(expected)) return false;
      } else if (key === 'seen') {
        if (!hasSeen(expected.dialogue, expected.choice)) return false;
      } else {
        // Flag check
        if (check(key) !== expected) return false;
      }
    }
    return true;
  }

  function serialize() {
    return {
      flags: JSON.parse(JSON.stringify(flags)),
      seenDialogues: JSON.parse(JSON.stringify(seenDialogues)),
    };
  }

  function deserialize(data) {
    flags = data.flags || {};
    seenDialogues = data.seenDialogues || {};
  }

  return {
    init: init,
    get: get,
    set: set,
    check: check,
    toggle: toggle,
    markSeen: markSeen,
    hasSeen: hasSeen,
    evaluate: evaluate,
    serialize: serialize,
    deserialize: deserialize,
  };
})();
