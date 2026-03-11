Game.Dialogue = (function () {
  var active = false;
  var dialogueData = null;
  var dialogueId = null;
  var currentNode = null;
  var endCallback = null;
  var choices = [];
  var hoverChoice = -1;

  function start(dialogueName, callback) {
    dialogueData = Game.Loader.getData('dialogues/' + dialogueName);
    if (!dialogueData) {
      console.error('Dialogue not found:', dialogueName);
      if (callback) callback();
      return;
    }
    dialogueId = dialogueName;
    endCallback = callback;
    active = true;

    var seenFlag = 'dialogue_seen_' + dialogueName;
    var startNode;
    if (Game.State.check(seenFlag) && dialogueData.start_repeat) {
      startNode = dialogueData.start_repeat;
    } else {
      startNode = dialogueData.start || 'start';
      Game.State.set(seenFlag, true);
    }
    goToNode(startNode);
  }

  function goToNode(nodeId) {
    if (!dialogueData || !dialogueData.nodes) {
      end();
      return;
    }

    var node = dialogueData.nodes[nodeId];
    if (!node) {
      end();
      return;
    }

    currentNode = node;
    choices = [];
    hoverChoice = -1;

    if (node.npc_text) {
      // NPC speaks above their character in the viewport
      var sx   = dialogueData.speaker_x || Game.Config.WIDTH / 2;
      var sy   = dialogueData.speaker_y || 300;
      var text = node.npc_text.replace(/\n/g, ' ');
      Game.TextBox.showBlocking(text, sx, sy,
        Game.Config.COLORS.TEXT_NPC, function () {
          buildChoices(node);
        });
    } else if (node.narrator_text) {
      var text = node.narrator_text.replace(/\n/g, ' ');
      Game.TextBox.showBlocking(text, Game.Config.WIDTH / 2, 200,
        Game.Config.COLORS.TEXT_NARRATOR, function () {
          buildChoices(node);
        });
    } else {
      buildChoices(node);
    }
  }

  function buildChoices(node) {
    choices = [];

    function doChoices() {
      if (!node.choices) {
        if (node.next) { goToNode(node.next); } else { end(); }
        return;
      }

      for (var i = 0; i < node.choices.length; i++) {
        var ch = node.choices[i];

        if (ch.condition && !Game.State.evaluate(ch.condition)) continue;
        if (ch.show_once && Game.State.hasSeen(dialogueId, ch.id || ('c' + i))) continue;

        choices.push({
          index: i,
          id:     ch.id || ('c' + i),
          text:   ch.text,
          next:   ch.next,
          effects: ch.effects,
        });
      }

      if (choices.length === 0 || node.allow_exit) {
        choices.push({
          index:   -1,
          id:      '_exit',
          text:    'End conversation',
          next:    null,
          effects: null,
        });
      }
    }

    if (node.effects) {
      Game.Effects.execute(node.effects, doChoices);
    } else {
      doChoices();
    }
  }

  function handleClick(gx, gy) {
    if (!active) return false;

    // NPC text is now handled by TextBox in input.js — only handle choice clicks here
    if (hoverChoice >= 0 && hoverChoice < choices.length) {
      selectChoice(hoverChoice);
      return true;
    }

    return true; // absorb
  }

  function selectChoice(idx) {
    var choice = choices[idx];
    choices = [];     // clear list while player is speaking
    hoverChoice = -1;

    Game.State.markSeen(dialogueId, choice.id);

    function proceed() {
      if (choice.effects) {
        Game.Effects.execute(choice.effects, function () {
          navigateAfterChoice(choice);
        });
      } else {
        navigateAfterChoice(choice);
      }
    }

    // Show player reply above player in walk rooms; skip for synthetic exit choice
    if (!Game.Room.isNoWalk() && choice.id !== '_exit') {
      var px = Game.Player.getX();
      var py = Game.Player.getHeadY();
      Game.TextBox.showBlocking(choice.text, px, py,
        Game.Config.COLORS.TEXT_PLAYER_CHOICE, proceed);
    } else {
      proceed();
    }
  }

  function navigateAfterChoice(choice) {
    if (choice.next) {
      goToNode(choice.next);
    } else {
      end();
    }
  }

  function end() {
    active = false;
    dialogueData = null;
    currentNode = null;
    choices = [];
    hoverChoice = -1;
    if (endCallback) {
      var cb = endCallback;
      endCallback = null;
      cb();
    }
  }

  function handleHover(gx, gy) {
    if (!active) {
      hoverChoice = -1;
      return;
    }

    var cfg    = Game.Config;
    var panelY = cfg.BOTTOM_BAR_Y;
    var lineH  = 46;
    var startY = panelY + 2;

    for (var i = 0; i < choices.length; i++) {
      var cy = startY + i * lineH;
      if (gy >= cy && gy < cy + lineH && gx > 50 && gx < cfg.WIDTH - 50) {
        hoverChoice = i;
        return;
      }
    }
    hoverChoice = -1;
  }

  function update(dt) {
  }

  function draw(ctx) {
    if (!active) return;

    var cfg    = Game.Config;
    var panelY = cfg.BOTTOM_BAR_Y;
    var panelH = cfg.BOTTOM_BAR_HEIGHT;

    // Dark panel always shown while dialogue is active
    ctx.fillStyle = cfg.COLORS.DIALOGUE_BG;
    ctx.fillRect(0, panelY, cfg.WIDTH, panelH);

    if (choices.length === 0) return; // NPC or player is speaking via TextBox above

    var lineH  = 46;
    var startY = panelY + 2;

    ctx.font         = cfg.DIALOGUE_FONT_SIZE + 'px ' + cfg.FONT_FAMILY;
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'top';

    for (var i = 0; i < choices.length; i++) {
      var cy = startY + i * lineH;
      ctx.fillStyle = (i === hoverChoice) ? cfg.COLORS.VERB_HOVER : cfg.COLORS.TEXT_PLAYER_CHOICE;
      ctx.fillText((i + 1) + '. ' + choices[i].text, 80, cy + 4);
    }

    ctx.textBaseline = 'alphabetic';
  }

  function isActive() { return active; }

  return {
    start:        start,
    handleClick:  handleClick,
    handleHover:  handleHover,
    update:       update,
    draw:         draw,
    isActive:     isActive,
    end:          end,
  };
})();
