Game.Dialogue = (function () {
  var active = false;
  var dialogueData = null;
  var dialogueId = null;
  var currentNode = null;
  var endCallback = null;
  var npcText = '';
  var choices = [];
  var hoverChoice = -1;
  var npcTextTimer = 0;
  var showingNpcText = false;

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
    goToNode(dialogueData.start || 'start');
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

    if (node.npc_text) {
      npcText = node.npc_text;
      showingNpcText = true;
      npcTextTimer = Math.max(2.5, npcText.length * 0.06);
      choices = [];
    } else {
      showingNpcText = false;
      buildChoices(node);
    }
  }

  function buildChoices(node) {
    choices = [];
    if (!node.choices) {
      end();
      return;
    }

    for (var i = 0; i < node.choices.length; i++) {
      var ch = node.choices[i];

      // Check condition
      if (ch.condition && !Game.State.evaluate(ch.condition)) continue;

      // Check show_once
      if (ch.show_once && Game.State.hasSeen(dialogueId, ch.id || ('c' + i))) continue;

      choices.push({
        index: i,
        id: ch.id || ('c' + i),
        text: ch.text,
        next: ch.next,
        effects: ch.effects,
      });
    }

    // Add "end conversation" if no choices or if node has allow_exit
    if (choices.length === 0 || node.allow_exit) {
      choices.push({
        index: -1,
        id: '_exit',
        text: 'End conversation',
        next: null,
        effects: null,
      });
    }
  }

  function handleClick(gx, gy) {
    if (!active) return false;

    if (showingNpcText) {
      // Click to dismiss NPC text
      showingNpcText = false;
      buildChoices(currentNode);
      return true;
    }

    // Check choice click
    if (hoverChoice >= 0 && hoverChoice < choices.length) {
      selectChoice(hoverChoice);
      return true;
    }

    return true; // Absorb click even if nothing hit
  }

  function selectChoice(idx) {
    var choice = choices[idx];

    // Mark as seen
    Game.State.markSeen(dialogueId, choice.id);

    if (choice.effects) {
      Game.Effects.execute(choice.effects, function () {
        navigateAfterChoice(choice);
      });
    } else {
      navigateAfterChoice(choice);
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
    npcText = '';
    if (endCallback) {
      var cb = endCallback;
      endCallback = null;
      cb();
    }
  }

  function handleHover(gx, gy) {
    if (!active || showingNpcText) {
      hoverChoice = -1;
      return;
    }

    var cfg = Game.Config;
    var panelY = cfg.BOTTOM_BAR_Y;
    var lineH = 36;
    var startY = panelY + 20;

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
    if (!active) return;

    if (showingNpcText) {
      npcTextTimer -= dt;
      if (npcTextTimer <= 0) {
        showingNpcText = false;
        buildChoices(currentNode);
      }
    }
  }

  function draw(ctx) {
    if (!active) return;

    var cfg = Game.Config;
    var panelY = cfg.BOTTOM_BAR_Y;
    var panelH = cfg.BOTTOM_BAR_HEIGHT;

    // Background overlay on bottom bar
    ctx.fillStyle = cfg.COLORS.DIALOGUE_BG;
    ctx.fillRect(0, panelY, cfg.WIDTH, panelH);

    if (showingNpcText) {
      // NPC text
      ctx.fillStyle = cfg.COLORS.TEXT_NPC;
      ctx.font = cfg.DIALOGUE_FONT_SIZE + 'px ' + cfg.FONT_FAMILY;
      ctx.textAlign = 'center';
      ctx.fillText(npcText, cfg.WIDTH / 2, panelY + panelH / 2 + 8);

      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '14px ' + cfg.FONT_FAMILY;
      ctx.fillText('(click to continue)', cfg.WIDTH / 2, panelY + panelH - 20);
      ctx.textAlign = 'left';
    } else {
      // Player choices
      var lineH = 36;
      var startY = panelY + 20;

      ctx.font = (cfg.DIALOGUE_FONT_SIZE - 2) + 'px ' + cfg.FONT_FAMILY;
      ctx.textAlign = 'left';

      for (var i = 0; i < choices.length; i++) {
        var cy = startY + i * lineH;
        if (i === hoverChoice) {
          ctx.fillStyle = cfg.COLORS.VERB_HOVER;
        } else {
          ctx.fillStyle = cfg.COLORS.TEXT_PLAYER_CHOICE;
        }
        ctx.fillText((i + 1) + '. ' + choices[i].text, 80, cy + cfg.DIALOGUE_FONT_SIZE);
      }
    }
  }

  function isActive() { return active; }

  return {
    start: start,
    handleClick: handleClick,
    handleHover: handleHover,
    update: update,
    draw: draw,
    isActive: isActive,
    end: end,
  };
})();
