Game.FifaResult = (function () {

  var active      = false;
  var outcome     = null;   // 'win' or 'loss'
  var elapsed     = 0;
  var fadingOut   = false;
  var timer       = 0;
  var callback    = null;
  var currentData = null;

  var FADE_IN  = 0.55;
  var FADE_OUT = 0.45;
  var MIN_SHOW = 0.7;

  // ─── Scorer pools ─────────────────────────────────────────────────────────────

  var NOODLER_SCORERS = ['Noodler Striker', 'Noodler Midfielder', 'Noodler Defender'];
  var ALEX_SCORERS    = ['Alex Striker', 'Alex Midfielder', 'Alex Defender'];

  var NOODLER_NOTES = [
    '(You Pressed Too High)',
    '(You Dribbled Into The Box)',
    '(Same Corner Routine)',
    '(Penalty. You Know Why.)',
    '(FIFA Champ Signature Move)',
    '(xG 0.94, Your Fault)',
    '(You Stood Still)',
    '(Deflection. Still Counts.)',
    '(You Had One Job)',
    '(Completely Unopposed)',
    '(Tap-In. The Worst Kind.)',
    "(He's Done This Before)",
    '(You Were Watching The Ball, Not The Run)',
    '(Classic High-Line Exploit)',
  ];

  var ALEX_NOTES = [
    '(Lucky Deflection)',
    '(Winning Ugly, p. 47)',
    '(Actually Planned)',
    '(He Was On His Phone)',
    '(Genuinely Not Sure)',
    '(FIFA Champ Disputes This)',
    '(Clean Finish, Somehow)',
    '(Against The Run Of Play)',
    "(He Wasn't Ready)",
    '(Research Pays Off)',
    '(Aggregate Pressure)',
    '(FIFA Champ Still Processing)',
    '(Held The Line)',
    '(The 70% Press Worked)',
  ];

  // Possible scores: [homeGoals, awayGoals] where home = Noodler, away = Alex
  var LOSS_SCORES = [[1,0], [2,0], [2,1], [3,0], [3,1], [3,2]];
  var WIN_SCORES  = [[0,1], [0,2], [1,2], [0,3], [1,3], [2,3]];

  var STADIUMS = [
    "Monitor 4, Dave's Workstation  —  Facing Southeast",
    "Monitor 3, FIFA Champ's Setup  —  Turned 12° Left",
    "Beanbag Arena, CVNA Lab  —  Standing Room Only",
    "Monitor 4  —  The Good Screen",
    "The Rolling Chair Oval  —  Disputed Boundaries",
  ];

  var ATTENDANCES_LOSS = [
    '3  (two monitors, one plant; the plant looked neutral)',
    '4  (FIFA Champ counted himself twice)',
    '2  (one monitor asleep, one paying attention)',
    '5  (two plants, two monitors, one ambient hum)',
    '3  (all of them expressionless)',
  ];

  var ATTENDANCES_WIN = [
    '4  (FIFA Champ refused to count himself; the plant was relieved)',
    '3  (one monitor looked away at the final whistle)',
    '5  (one plant, two monitors, two people who will not discuss it)',
    '4  (FIFA Champ contests the attendance figure)',
    '6  (three monitors, two plants, one person who won)',
  ];

  var REFEREES = [
    'Nobody. FIFA Champ disputes the final score, the attendance, and this summary.',
    'Nobody. There were no rules. FIFA Champ would like to add some retroactively.',
    'Nobody. The plant abstained.',
    'Nobody. FIFA Champ has filed a protest with himself.',
    "Nobody. Rules are for people who didn't already have a league table.",
  ];

  // ─── Generator ────────────────────────────────────────────────────────────────

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function shuffleArr(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  function randomTimes(n) {
    var times = [];
    while (times.length < n) {
      var t = Math.floor(Math.random() * 90) + 1;
      if (times.indexOf(t) === -1) times.push(t);
    }
    return times.sort(function (a, b) { return a - b; });
  }

  function generateData(isWin) {
    var score     = pick(isWin ? WIN_SCORES : LOSS_SCORES);
    var homeScore = score[0];
    var awayScore = score[1];
    var total     = homeScore + awayScore;

    // Distribute goal times randomly between the two teams
    var allTimes     = randomTimes(total);
    var shuffled     = shuffleArr(allTimes.slice());
    var homeTimes    = shuffled.slice(0, homeScore).sort(function (a, b) { return a - b; });
    var awayTimes    = shuffled.slice(homeScore).sort(function (a, b) { return a - b; });

    var homeGoals = homeTimes.map(function (t) {
      return pick(NOODLER_SCORERS) + "  " + t + "'  " + pick(NOODLER_NOTES);
    });
    var awayGoals = awayTimes.map(function (t) {
      return pick(ALEX_SCORERS) + "  " + t + "'  " + pick(ALEX_NOTES);
    });

    var motm = isWin
      ? pick(ALEX_SCORERS)    + '  (FIFA Champ did not participate in the vote)'
      : pick(NOODLER_SCORERS) + '  (unanimous; you were not considered eligible)';

    return {
      competition : 'CVNA CORPORATE CUP  ·  SEASON 2026',
      status      : 'F U L L  T I M E',
      home        : 'FC CVNA NOODLER',
      away        : 'FC ALEX',
      homeScore   : homeScore,
      awayScore   : awayScore,
      homeGoals   : homeGoals,
      awayGoals   : awayGoals,
      stadium     : pick(STADIUMS),
      attendance  : pick(isWin ? ATTENDANCES_WIN : ATTENDANCES_LOSS),
      motm        : motm,
      referee     : pick(REFEREES),
    };
  }

  // ─── Public API ───────────────────────────────────────────────────────────────

  function show(opts, cb) {
    active      = true;
    fadingOut   = false;
    outcome     = opts.outcome || 'loss';
    elapsed     = 0;
    timer       = 0;
    callback    = cb || null;
    currentData = generateData(outcome === 'win');
    Game.Input.lock();
  }

  function handleClick() {
    if (!active || fadingOut) return;
    if (elapsed < MIN_SHOW) return;
    fadingOut = true;
    timer     = FADE_OUT;
  }

  function update(dt) {
    if (!active) return;
    if (fadingOut) {
      timer -= dt;
      if (timer <= 0) {
        active    = false;
        fadingOut = false;
        Game.Input.unlock();
        var cb = callback;
        callback = null;
        if (cb) cb();
      }
    } else {
      elapsed += dt;
    }
  }

  function alpha() {
    if (fadingOut) return Math.max(0, timer / FADE_OUT);
    if (elapsed < FADE_IN) return elapsed / FADE_IN;
    return 1;
  }

  function isActive() { return active; }

  // ─── Drawing ─────────────────────────────────────────────────────────────────

  function draw(ctx) {
    if (!active || !currentData) return;

    var cfg   = Game.Config;
    var a     = alpha();
    var data  = currentData;
    var isWin = outcome === 'win';
    var cx    = cfg.WIDTH / 2;
    var W     = cfg.WIDTH;
    var H     = cfg.HEIGHT;

    ctx.save();
    ctx.globalAlpha  = a;
    ctx.textBaseline = 'alphabetic';

    // ── Background ──────────────────────────────────────────────────────────────
    ctx.fillStyle = '#071a07';
    ctx.fillRect(0, 0, W, H);

    // Subtle pitch markings
    ctx.globalAlpha = a * 0.05;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth   = 2;
    ctx.beginPath(); ctx.arc(cx, H / 2, 150, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
    ctx.globalAlpha = a;

    // ── Competition header band ─────────────────────────────────────────────────
    var bandH = 96;
    var grad  = ctx.createLinearGradient(0, 0, 0, bandH);
    grad.addColorStop(0, 'rgba(12, 45, 12, 0.98)');
    grad.addColorStop(1, 'rgba(6, 26, 6, 0.96)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, bandH);

    // Gold rule at base of band
    ctx.globalAlpha = a * 0.8;
    ctx.strokeStyle = '#FEBD69';
    ctx.lineWidth   = 2.5;
    ctx.beginPath(); ctx.moveTo(0, bandH); ctx.lineTo(W, bandH); ctx.stroke();
    ctx.globalAlpha = a;

    // Competition title
    ctx.font         = 'bold 34px ' + cfg.FONT_FAMILY;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle    = '#FEBD69';
    ctx.shadowColor  = 'rgba(254,189,105,0.55)';
    ctx.shadowBlur   = 16;
    ctx.fillText('🏆  ' + data.competition + '  🏆', cx, bandH / 2);
    ctx.shadowBlur   = 0;
    ctx.textBaseline = 'alphabetic';

    // ── Status badge ────────────────────────────────────────────────────────────
    var statusEmoji = isWin ? '🏆' : '⏱️';
    ctx.font      = 'bold 22px ' + cfg.FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.fillStyle = isWin ? '#4CAF50' : '#E53935';
    ctx.fillText(statusEmoji + '  ' + data.status + '  ' + statusEmoji, cx, 134);

    // ── Score block ─────────────────────────────────────────────────────────────
    // Subtle team plate backgrounds
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    roundRect(ctx, cx - 620, 142, 500, 72, 6);
    roundRect(ctx, cx + 120, 142, 500, 72, 6);

    // Team names
    ctx.font      = 'bold 26px ' + cfg.FONT_FAMILY;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign    = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(data.home, cx - 130, 178);
    ctx.textAlign = 'left';
    ctx.fillText(data.away, cx + 130, 178);
    ctx.textBaseline = 'alphabetic';

    // Score numbers
    ctx.font        = 'bold 104px Georgia, "Times New Roman", serif';
    ctx.textAlign   = 'right';
    ctx.fillStyle   = isWin ? '#E53935' : '#FEBD69';
    ctx.shadowColor = isWin ? 'rgba(229,57,53,0.55)' : 'rgba(254,189,105,0.5)';
    ctx.shadowBlur  = 28;
    ctx.fillText(data.homeScore, cx - 24, 274);

    ctx.textAlign   = 'left';
    ctx.fillStyle   = isWin ? '#4CAF50' : 'rgba(200,200,200,0.35)';
    ctx.shadowColor = isWin ? 'rgba(76,175,80,0.55)' : 'transparent';
    ctx.fillText(data.awayScore, cx + 24, 274);
    ctx.shadowBlur  = 0;

    // Centre dash
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.font      = 'bold 52px Georgia, serif';
    ctx.fillText('–', cx, 260);

    rule(ctx, cx, 294, 760, a, 0.22);

    // ── Goal scorers ────────────────────────────────────────────────────────────
    ctx.font      = 'bold 15px ' + cfg.FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.48)';
    ctx.fillText('⚽  GOAL SCORERS  ⚽', cx, 340);

    var maxGoals = Math.max(data.homeGoals.length, data.awayGoals.length, 1);
    ctx.globalAlpha = a * 0.15;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(cx, 350);
    ctx.lineTo(cx, 354 + maxGoals * 32);
    ctx.stroke();
    ctx.globalAlpha = a;

    ctx.font     = '17px ' + cfg.FONT_FAMILY;
    var goalsTop = 372;
    var lineH    = 32;

    ctx.fillStyle = 'rgba(255,255,255,0.84)';
    for (var i = 0; i < data.homeGoals.length; i++) {
      ctx.textAlign = 'right';
      ctx.fillText('⚽  ' + data.homeGoals[i], cx - 22, goalsTop + i * lineH);
    }
    for (var i = 0; i < data.awayGoals.length; i++) {
      ctx.textAlign = 'left';
      ctx.fillText(data.awayGoals[i] + '  ⚽', cx + 22, goalsTop + i * lineH);
    }
    if (data.homeGoals.length === 0) {
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillText('—', cx - 22, goalsTop);
    }
    if (data.awayGoals.length === 0) {
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillText('—', cx + 22, goalsTop);
    }

    var afterGoals = goalsTop + maxGoals * lineH + 22;
    rule(ctx, cx, afterGoals, 760, a, 0.22);

    // ── Match info — 2×2 card grid ─────────────────────────────────────────────
    var infos = [
      { icon: '🏟️',  label: 'STADIUM',          value: data.stadium    },
      { icon: '👥',  label: 'ATTENDANCE',        value: data.attendance },
      { icon: '⭐',  label: 'MAN OF THE MATCH',  value: data.motm       },
      { icon: '🟨',  label: 'REFEREE',           value: data.referee    },
    ];

    var gridTop = afterGoals + 28;
    var margin  = 80;
    var gap     = 18;
    var colW    = (W - margin * 2 - gap) / 2;
    var cardH   = 78;
    var rowH    = cardH + 14;

    for (var i = 0; i < infos.length; i++) {
      var col   = i % 2;
      var row   = Math.floor(i / 2);
      var cardX = margin + col * (colW + gap);
      var cardY = gridTop + row * rowH;
      var info  = infos[i];

      // Card fill
      infoCard(ctx, cardX, cardY, colW, cardH, 8, a);

      // Label
      ctx.font      = 'bold 15px ' + cfg.FONT_FAMILY;
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(255,255,255,0.42)';
      ctx.fillText(info.icon + '  ' + info.label, cardX + 16, cardY + 26);

      // Value
      ctx.font      = '18px ' + cfg.FONT_FAMILY;
      ctx.fillStyle = 'rgba(255,255,255,0.90)';
      ctx.fillText(info.value, cardX + 16, cardY + 52);
    }

    // ── "You Won / You Lost" banner ─────────────────────────────────────────────
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.font         = 'italic bold 96px Georgia, "Times New Roman", serif';
    ctx.fillStyle    = isWin ? '#4CAF50' : '#E53935';
    ctx.shadowColor  = isWin ? 'rgba(76,175,80,0.6)' : 'rgba(229,57,53,0.6)';
    ctx.shadowBlur   = 36;
    ctx.globalAlpha  = a * 0.18;
    ctx.fillText(isWin ? 'You Won' : 'You Lost', cx, H - 188);
    ctx.globalAlpha  = a;
    ctx.fillText(isWin ? 'You Won' : 'You Lost', cx, H - 188);
    ctx.shadowBlur   = 0;

    // ── Click to continue ───────────────────────────────────────────────────────
    if (!fadingOut && elapsed > FADE_IN) {
      var hint = Math.min(1, (elapsed - FADE_IN) / 0.4);
      ctx.globalAlpha  = a * hint * 0.4;
      ctx.font         = '15px ' + cfg.FONT_FAMILY;
      ctx.fillStyle    = '#ffffff';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('click anywhere to continue', cx, H - 38);
    }

    ctx.shadowBlur   = 0;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign    = 'left';
    ctx.restore();
  }

  function rule(ctx, cx, y, w, a, opacity) {
    ctx.save();
    ctx.globalAlpha = a * (opacity || 0.2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(cx - w / 2, y);
    ctx.lineTo(cx + w / 2, y);
    ctx.stroke();
    ctx.restore();
  }

  function infoCard(ctx, x, y, w, h, r, a) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y,     x + w, y + r,     r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x,     y + h, x,       y + h - r, r);
    ctx.lineTo(x,     y + r);
    ctx.arcTo(x,     y,     x + r,   y,         r);
    ctx.closePath();
    ctx.globalAlpha = a * 0.18;
    ctx.fillStyle   = 'rgba(255,255,255,0.08)';
    ctx.fill();
    ctx.globalAlpha = a * 0.28;
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth   = 1;
    ctx.stroke();
    ctx.restore();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
    ctx.fill();
  }

  return { show: show, handleClick: handleClick, update: update, draw: draw, isActive: isActive };
})();
