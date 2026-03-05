Game.Wordfight = (function () {

  var active          = false;
  var allDuels        = [];
  var currentDuel     = null;
  var shuffledReplies = [];
  var duelIndex       = 0;
  var netScore      = 0;  // cumulative: +1 correct, -1 wrong — never resets
  var STREAK_NEEDED = 3;  // fill the whole meter to win or lose

  // States: idle | title | moving | choosing | win | loss
  // Speech is handled by TextBox.showBlocking; 'moving' = any busy/transition state
  var state      = 'idle';
  var hoverChoice  = -1;
  var introText    = '';
  var titleTimer   = 0;
  var TITLE_DURATION = 5.0; // seconds
  var titleSeen    = false; // credibility meter only appears once title card begins
  var endCallback  = null;
  var lossOptions  = null;
  var movementDone = 0;

  // Character positions — updated each round
  var playerX      = 768;
  var stakeholderX = 570;
  var PLAYER_Y     = 680;
  var STAKE_Y      = 680;
  var STEP         = 160;

  // ─── Public entry ────────────────────────────────────────────────────────────

  function start(effect, callback) {
    var data = Game.Loader.getData('wordfight');
    if (!data || !data.duels || data.duels.length === 0) {
      console.error('Wordfight data not found');
      if (callback) callback();
      return;
    }

    allDuels  = shuffleArray(data.duels.slice());
    duelIndex = 0;
    netScore  = 0;
    active        = true;
    endCallback   = callback;
    hoverChoice   = -1;

    lossOptions = {
      reset_trigger: effect.on_loss_reset_trigger || null,
      player_x:      effect.on_loss_player_x !== undefined ? effect.on_loss_player_x : 900,
      player_y:      effect.on_loss_player_y !== undefined ? effect.on_loss_player_y : PLAYER_Y,
    };

    playerX      = Game.Player.getX();
    stakeholderX = Game.Actors.getX('stakeholder');

    introText  = effect.intro_text || '';
    titleSeen  = false;
    Game.ActionLine.setOverride('Talking to Amazonian');

    if (introText) {
      // Stakeholder speaks first, then title card appears
      state = 'moving';
      Game.TextBox.showBlocking(
        introText,
        stakeholderX, Game.Actors.getHeadY('stakeholder'),
        Game.Config.COLORS.TEXT_NPC,
        function () {
          Game.TextBox.showBlocking(
            'Alright — go ahead. I know my Leadership Principles. At least, most of them.',
            playerX, Game.Player.getHeadY(),
            Game.Config.COLORS.TEXT_PLAYER,
            function () {
              titleSeen  = true;
              state      = 'title';
              titleTimer = TITLE_DURATION;
            }
          );
        }
      );
    } else {
      titleSeen  = true;
      state      = 'title';
      titleTimer = TITLE_DURATION;
    }
  }

  // ─── Duel flow ────────────────────────────────────────────────────────────────

  function nextDuel() {
    // Cycle infinitely — reshuffle when the pool is exhausted
    if (duelIndex >= allDuels.length) {
      allDuels  = shuffleArray(allDuels);
      duelIndex = 0;
    }
    currentDuel     = allDuels[duelIndex++];
    shuffledReplies = shuffleArray(currentDuel.replies.slice());
    hoverChoice     = -1;
    state           = 'moving'; // busy while stakeholder speaks

    Game.TextBox.showBlocking(
      currentDuel.objection,
      stakeholderX, Game.Actors.getHeadY('stakeholder'),
      Game.Config.COLORS.TEXT_NPC,
      function () { state = 'choosing'; }
    );
  }

  function selectReply(idx) {
    var reply = shuffledReplies[idx];
    state = 'moving';

    // Show player's chosen reply above the player, then process outcome
    Game.TextBox.showBlocking(
      reply.text,
      playerX, Game.Player.getHeadY(),
      Game.Config.COLORS.TEXT_PLAYER_CHOICE,
      function () { processReply(reply); }
    );
  }

  var CORRECT_REACTIONS = [
    'Sounds Amazonian.',
    'Leadership would approve.',
    'Correct!',
    "Now that's a Leadership Principle.",
    'Well said.',
    'I cannot argue with that.',
    'Exactly right.',
  ];

  var WIN_STATEMENTS = [
    'Wow, you clearly are an Amazonian.',
    'Impressive. You truly understand our principles.',
    'I stand corrected. You belong here.',
    'Well played. You know your Leadership Principles.',
    'I have to hand it to you — you are the real deal.',
  ];

  var LOSS_STATEMENTS = [
    'Wow, that was bad. You clearly are no Amazonian. But I have a lunch break — escort yourself out, please.',
    'That was painful to watch. The exit is that way.',
    "I've seen better Leadership Principles from the office ficus. Goodbye.",
    'Not Amazonian at all. Please leave before I file a report.',
    'That settles it. You do not belong here. Off you go.',
  ];

  var WRONG_OPENERS = [
    'So wrong!', 'So off!', 'Not even close!', 'Oh please!',
    'Ha! Absolutely not!', 'Nice try!', 'Yikes!', "That's a stretch!",
    'Not quite!', 'Way off base!',
  ];

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function walkStakeholderOff(callback) {
    Game.Actors.walkTo('stakeholder', -200, STAKE_Y, callback);
  }

  function processReply(reply) {
    if (reply.correct) {
      netScore++;
      playerX      -= STEP;
      stakeholderX -= STEP;
      var isWin = netScore >= STREAK_NEEDED;
      startMoving(function () {
        Game.TextBox.showBlocking(
          pick(CORRECT_REACTIONS),
          stakeholderX, Game.Actors.getHeadY('stakeholder'),
          Game.Config.COLORS.TEXT_NPC,
          function () {
            if (isWin) {
              Game.TextBox.showBlocking(
                pick(WIN_STATEMENTS),
                stakeholderX, Game.Actors.getHeadY('stakeholder'),
                Game.Config.COLORS.TEXT_NPC,
                function () { walkStakeholderOff(function () { state = 'win'; }); }
              );
            } else {
              nextDuel();
            }
          }
        );
      });
    } else {
      netScore--;
      playerX      += STEP;
      stakeholderX += STEP;
      var isLoss       = netScore <= -STREAK_NEEDED;
      var comebackText = nl(pick(WRONG_OPENERS) + ' ' + (reply.comeback || '...'));
      startMoving(function () {
        Game.TextBox.showBlocking(
          comebackText,
          stakeholderX, Game.Actors.getHeadY('stakeholder'),
          Game.Config.COLORS.TEXT_NPC,
          function () {
            if (isLoss) {
              Game.TextBox.showBlocking(
                pick(LOSS_STATEMENTS),
                stakeholderX, Game.Actors.getHeadY('stakeholder'),
                Game.Config.COLORS.TEXT_NPC,
                function () { walkStakeholderOff(function () { state = 'loss'; }); }
              );
            } else {
              nextDuel();
            }
          }
        );
      });
    }
  }

  function startMoving(callback) {
    state        = 'moving';
    movementDone = 0;

    var pTarget = playerX;
    var sTarget = stakeholderX;

    Game.Actors.walkTo('stakeholder', sTarget, STAKE_Y, function () {
      movementDone++;
      checkMovementDone(callback);
    });

    Game.Player.walkTo(pTarget, PLAYER_Y, function () {
      playerX = Game.Player.getX(); // sync in case clamped by walk area
      movementDone++;
      checkMovementDone(callback);
    });
  }

  function checkMovementDone(callback) {
    if (movementDone < 2) return;

    var TURN = 12;
    var px = Game.Player.getX();
    var sx = Game.Actors.getX('stakeholder');
    var turnDone = 0;

    function onTurnDone() {
      turnDone++;
      if (turnDone >= 2 && callback) callback();
    }

    // Player turns to face left: step right, then step back left
    Game.Player.walkTo(px + TURN, PLAYER_Y, function () {
      Game.Player.walkTo(px, PLAYER_Y, onTurnDone);
    });

    // Stakeholder turns to face right: step left, then step back right
    Game.Actors.walkTo('stakeholder', sx - TURN, STAKE_Y, function () {
      Game.Actors.walkTo('stakeholder', sx, STAKE_Y, onTurnDone);
    });
  }

  // ─── Input ────────────────────────────────────────────────────────────────────

  function handleClick(gx, gy) {
    if (!active) return false;

    // Speech states are handled by TextBox in input.js
    if (state === 'title' || state === 'moving') {
      return true; // absorb
    }

    if (state === 'choosing') {
      if (hoverChoice >= 0 && hoverChoice < shuffledReplies.length) {
        selectReply(hoverChoice);
      }
      return true;
    }

    if (state === 'win') {
      var cb = endCallback;
      Game.ActionLine.clearOverride();
      active      = false;
      endCallback = null;
      state       = 'idle';
      if (cb) cb();
      return true;
    }

    if (state === 'loss') {
      handleLoss();
      return true;
    }

    return true;
  }

  function handleLoss() {
    Game.ActionLine.clearOverride();
    Game.Actors.remove('stakeholder');
    Game.Input.unlock();
    if (lossOptions && lossOptions.reset_trigger) {
      Game.Room.resetTrigger(lossOptions.reset_trigger);
    }
    active      = false;
    endCallback = null;
    state       = 'idle';
  }

  function handleHover(gx, gy) {
    if (!active || state !== 'choosing') {
      hoverChoice = -1;
      return;
    }
    var cfg    = Game.Config;
    var panelY = cfg.BOTTOM_BAR_Y;
    var lineH  = 46;
    var startY = panelY + 30;

    for (var i = 0; i < shuffledReplies.length; i++) {
      var cy = startY + i * lineH;
      if (gy >= cy && gy < cy + lineH && gx > 50 && gx < cfg.WIDTH - 50) {
        hoverChoice = i;
        return;
      }
    }
    hoverChoice = -1;
  }

  function getCursorStyle() {
    return (active && state === 'choosing' && hoverChoice >= 0) ? 'pointer' : 'default';
  }

  function isActive() { return active; }

  function update(dt) {
    if (state === 'title') {
      titleTimer -= dt;
      if (titleTimer <= 0) {
        nextDuel();
      }
    }
  }

  // ─── Drawing ─────────────────────────────────────────────────────────────────

  function draw(ctx) {
    if (!active) return;

    var cfg    = Game.Config;
    var panelY = cfg.BOTTOM_BAR_Y;
    var panelH = cfg.BOTTOM_BAR_HEIGHT;

    ctx.fillStyle = cfg.COLORS.DIALOGUE_BG;
    ctx.fillRect(0, panelY, cfg.WIDTH, panelH);

    if (state === 'title') {
      drawTitleCard(ctx);
      return; // leave bottom bar empty during title
    }

    if (state === 'choosing') {
      drawChoices(ctx);
    } else if (state === 'win') {
      drawEndScreen(ctx, true);
    } else if (state === 'loss') {
      drawEndScreen(ctx, false);
    }
    // state === 'moving': just the meter bar — speech appears in viewport via TextBox
  }

  function titleAlpha() {
    var FADE = 0.55; // seconds to fade in / fade out
    var elapsed = TITLE_DURATION - titleTimer;
    if (elapsed < FADE)      return elapsed / FADE;       // fade in
    if (titleTimer < FADE)   return titleTimer / FADE;    // fade out
    return 1;
  }

  function drawTitleCard(ctx) {
    var cfg   = Game.Config;
    var alpha = titleAlpha();

    ctx.save();
    ctx.globalAlpha = alpha;

    // Dark scrim over the whole viewport
    ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
    ctx.fillRect(0, 0, cfg.WIDTH, cfg.VIEWPORT_HEIGHT);

    var cx = cfg.WIDTH / 2;
    var cy = cfg.VIEWPORT_HEIGHT / 2;

    // Decorative horizontal rules
    var ruleW = 560;
    var ruleY1 = cy - 72;
    var ruleY2 = cy + 60;
    ctx.strokeStyle = '#FEBD69';
    ctx.lineWidth   = 1.5;
    ctx.globalAlpha = alpha * 0.6;
    ctx.beginPath(); ctx.moveTo(cx - ruleW / 2, ruleY1); ctx.lineTo(cx + ruleW / 2, ruleY1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - ruleW / 2, ruleY2); ctx.lineTo(cx + ruleW / 2, ruleY2); ctx.stroke();
    ctx.globalAlpha = alpha;

    // Main title — fancy serif italic
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor  = 'rgba(255, 153, 0, 0.9)';
    ctx.shadowBlur   = 28;
    ctx.fillStyle    = '#FEBD69';
    ctx.font         = 'italic bold 76px Georgia, "Times New Roman", serif';
    ctx.fillText('Stakeholder Wordfight', cx, cy - 10);

    // Subtitle
    ctx.shadowBlur = 0;
    ctx.fillStyle  = 'rgba(255,255,255,0.75)';
    ctx.font       = '22px ' + cfg.FONT_FAMILY;
    ctx.fillText('⚔   Prove your Leadership Principles   ⚔', cx, cy + 38);

    ctx.shadowBlur   = 0;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign    = 'left';
    ctx.restore();
  }

  function drawOverlay(ctx) {
    if (!active || !titleSeen) return;

    var cfg  = Game.Config;
    var segW = 96;                              // width of one segment
    var gap  = 4;                               // gap between segments
    var barH = 32;                              // bar height
    var n    = STREAK_NEEDED * 2 + 1;           // 7 segments total
    var totW = n * segW + (n - 1) * gap;        // 696 px
    var mX   = Math.round((cfg.WIDTH - totW) / 2);
    var mY   = cfg.VIEWPORT_HEIGHT - 62;        // bar top, near viewport bottom

    ctx.save();

    // Semi-transparent backing panel
    var bpad = 20;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.60)';
    ctx.fillRect(mX - bpad, mY - 24, totW + bpad * 2, barH + 42);

    // "Credibility" label above bar
    ctx.font      = 'bold 17px ' + cfg.FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillText('Credibility', mX + totW / 2, mY - 7);

    // Segments: index 0 = far-left (loss 3) … 3 = tie … 6 = far-right (win 3)
    for (var i = 0; i < n; i++) {
      var segX   = mX + i * (segW + gap);
      var offset = i - STREAK_NEEDED;  // -3 … +3

      if (offset === 0) {
        // Centre tie bar — neutral grey, always filled
        ctx.fillStyle = '#888888';
      } else if (offset > 0) {
        // Win (right) side — green when earned
        ctx.fillStyle = (netScore >= offset) ? '#4CAF50' : 'rgba(255,255,255,0.07)';
      } else {
        // Loss (left) side — red when earned
        ctx.fillStyle = (netScore <= offset) ? '#E53935' : 'rgba(255,255,255,0.07)';
      }

      ctx.fillRect(segX, mY, segW, barH);
    }

    // Labels beneath bar
    var lY     = mY + barH + 16;
    var tieX   = mX + STREAK_NEEDED * (segW + gap) + Math.round(segW / 2);

    ctx.font = 'bold 17px ' + cfg.FONT_FAMILY;

    ctx.textAlign = 'left';
    ctx.fillStyle = '#E53935';
    ctx.fillText('LOSE', mX, lY);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#4CAF50';
    ctx.fillText('WIN', mX + totW, lY);

    ctx.textAlign = 'center';
    ctx.fillStyle = netScore === 0 ? '#ffffff' : '#888888';
    ctx.fillText('TIE', tieX, lY);

    ctx.textAlign = 'left';
    ctx.restore();
  }

  function drawChoices(ctx) {
    var cfg    = Game.Config;
    var panelY = cfg.BOTTOM_BAR_Y;
    var lineH  = 46;
    var startY = panelY + 30;

    ctx.font         = '22px ' + cfg.FONT_FAMILY;
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'top';

    for (var i = 0; i < shuffledReplies.length; i++) {
      var reply = shuffledReplies[i];
      var cy    = startY + i * lineH;

      ctx.fillStyle = (i === hoverChoice) ? cfg.COLORS.VERB_HOVER : cfg.COLORS.TEXT_PLAYER_CHOICE;
      ctx.fillText((i + 1) + '. ' + nl(reply.text), 60, cy + 4);
    }

    ctx.textBaseline = 'alphabetic';
  }

  function drawEndScreen(ctx, won) {
    var cfg    = Game.Config;
    var panelY = cfg.BOTTOM_BAR_Y;
    var panelH = cfg.BOTTOM_BAR_HEIGHT;
    var midY   = panelY + panelH / 2;

    ctx.font      = 'bold 28px ' + cfg.FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.fillStyle = won ? '#4CAF50' : '#E53935';
    ctx.fillText(
      won ? 'You out-argued the stakeholder! The meeting proceeds.'
          : 'The stakeholder wins. Your credibility is in tatters.',
      cfg.WIDTH / 2, midY - 10
    );

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font      = '18px ' + cfg.FONT_FAMILY;
    ctx.fillText(won ? '(click to continue)' : '(click to try again)', cfg.WIDTH / 2, midY + 30);
    ctx.textAlign = 'left';
  }

  // ─── Utility ─────────────────────────────────────────────────────────────────

  // Join couplet lines for the choice panel — lowercase the second line's first letter
  function nl(text) {
    return text.replace(/\n(.)/g, function (_, c) { return ' ' + c.toLowerCase(); });
  }

  function shuffleArray(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j   = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i];
      arr[i]  = arr[j];
      arr[j]  = tmp;
    }
    return arr;
  }

  // ─── Public API ───────────────────────────────────────────────────────────────

  return {
    start:          start,
    handleClick:    handleClick,
    handleHover:    handleHover,
    getCursorStyle: getCursorStyle,
    isActive:       isActive,
    update:         update,
    draw:           draw,
    drawOverlay:    drawOverlay,
  };
})();
