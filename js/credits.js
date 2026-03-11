Game.Credits = (function () {
  var active   = false;
  var scrollY  = 0;
  var callback = null;
  var done     = false;
  var SPEED    = 48;   // px per second

  var ENTRIES = [
    { role: null, name: 'THE SEPARATION AGREEMENT', style: 'title' },
    { role: null, name: null },
    { role: null, name: 'A completely original production', style: 'sub' },
    { role: null, name: null },
    { role: null, name: null },

    { role: 'Executive Producer',           name: 'Michael Donoser' },
    { role: 'Director',                     name: 'Michael Donoser' },
    { role: 'Creative Director',            name: 'Michael Donoser' },
    { role: 'Narrative Designer',           name: 'Michael Donoser' },
    { role: 'Game Designer',                name: 'Michael Donoser' },
    { role: null, name: null },

    { role: 'Art Director',                 name: 'Michael Donoser' },
    { role: 'Character Artist',             name: 'Michael Donoser' },
    { role: 'Background Painter',           name: 'Michael Donoser' },
    { role: 'UI / UX Designer',             name: 'Michael Donoser' },
    { role: 'Sprite Wrangler',              name: 'Michael Donoser' },
    { role: null, name: null },

    { role: 'Lead Developer',               name: 'Michael Donoser' },
    { role: 'Senior Engineer',              name: 'Michael Donoser' },
    { role: 'Junior Engineer',              name: 'Michael Donoser' },
    { role: 'QA Lead',                      name: 'Michael Donoser' },
    { role: 'QA Engineer',                  name: 'Michael Donoser' },
    { role: 'QA Intern',                    name: 'Michael Donoser (unpaid)' },
    { role: null, name: null },

    { role: 'Scrum Master',                 name: 'Michael Donoser' },
    { role: 'Product Owner',                name: 'Michael Donoser' },
    { role: 'Project Manager',              name: 'Michael Donoser' },
    { role: 'Business Analyst',             name: 'Michael Donoser' },
    { role: 'Executive Assistant',          name: 'Michael Donoser' },
    { role: 'Office Manager',               name: 'Michael Donoser' },
    { role: null, name: null },

    { role: 'Stunt Coordinator',            name: 'Michael Donoser' },
    { role: 'Stunt Double',                 name: 'Michael Donoser' },
    { role: "Stunt Double's Stunt Double",  name: 'Michael Donoser' },
    { role: 'Special Effects Supervisor',   name: 'Michael Donoser' },
    { role: 'Practical Effects',            name: 'Michael Donoser' },
    { role: 'Digital Effects',              name: 'Michael Donoser' },
    { role: 'Explosion Wrangler',           name: 'Michael Donoser' },
    { role: 'No Explosions Were Used',      name: 'Michael Donoser (apologises)' },
    { role: null, name: null },

    { role: 'Sound Designer',               name: 'Michael Donoser' },
    { role: 'Composer',                     name: 'Michael Donoser' },
    { role: 'Foley Artist',                 name: 'Michael Donoser' },
    { role: 'Music Supervisor',             name: 'Michael Donoser' },
    { role: null, name: null },

    { role: 'Marketing Director',           name: 'Michael Donoser' },
    { role: 'PR Manager',                   name: 'Michael Donoser' },
    { role: 'Social Media Manager',         name: 'Michael Donoser' },
    { role: 'Influencer Liaison',           name: 'Nobody' },
    { role: null, name: null },

    { role: 'Legal Counsel',                name: 'Michael Donoser' },
    { role: 'Compliance Officer',           name: 'Michael Donoser' },
    { role: 'GDPR Consultant',              name: 'Michael Donoser (probably fine)' },
    { role: null, name: null },

    { role: 'HR Consultant',                name: 'Not HR. Never HR.' },
    { role: 'Separation Agreement Drafter', name: 'Michael Donoser' },
    { role: 'Stress Ball Coordinator',      name: 'Michael Donoser' },
    { role: 'IT Support',                   name: 'Unresponsive' },
    { role: null, name: null },

    { role: 'FIFA Strategy Consultant',     name: 'Chip (forced)' },
    { role: 'Winning Ugly Grandmaster',     name: 'Michael Donoser' },
    { role: 'Tactical Football Advisor',    name: 'Michael Donoser' },
    { role: 'Noodling Prevention Officer',  name: 'Michael Donoser' },
    { role: null, name: null },

    { role: 'Coffee Machine Technician',    name: 'Michael Donoser' },
    { role: 'Ficus Care Technician',        name: 'The Ficus' },
    { role: 'Egg Microwave Supervisor',     name: 'Nobody. That was the problem.' },
    { role: null, name: null },

    { role: 'Catering',                     name: 'Michael Donoser' },
    { role: 'Transport',                    name: 'Michael Donoser' },
    { role: 'Accommodation',               name: 'A rented villa. Barbados. You earned it.' },
    { role: null, name: null },
    { role: null, name: null },

    { role: null, name: 'Special Thanks', style: 'section' },
    { role: null, name: null },
    { role: null, name: 'Everyone who has ever had to navigate corporate bureaucracy', style: 'thanks' },
    { role: null, name: 'Everyone who ever had to go through a layoff', style: 'thanks' },
    { role: null, name: 'Everyone who is secretly hoping for being laid off', style: 'thanks' },
    { role: null, name: 'Bob, for his surprisingly human farewell', style: 'thanks' },
    { role: null, name: 'Chip, who is still looking for the new FIFA champ', style: 'thanks' },
    { role: null, name: 'All microwaves, for repeated distraction in games', style: 'thanks' },
    { role: null, name: null },
    { role: null, name: null },
    { role: null, name: null },

    { role: null, name: '...', style: 'pause' },
    { role: null, name: null },
    { role: null, name: null },
    { role: null, name: 'Actually, none of that is true.', style: 'reveal' },
    { role: null, name: null },
    { role: null, name: 'Claude Code wrote every single line of this game.', style: 'reveal' },
    { role: null, name: 'The dialogue. The logic. The bugs. The fixes for the bugs.', style: 'reveal' },
    { role: null, name: 'The bug fixes that introduced new bugs.', style: 'reveal' },
    { role: null, name: null },
    { role: null, name: 'Michael Donoser had the ideas.', style: 'reveal' },
    { role: null, name: 'Claude Code did the rest.', style: 'reveal' },
    { role: null, name: null },
    { role: null, name: null },
    { role: null, name: 'claude.ai/claude-code', style: 'sub' },
    { role: null, name: null },
    { role: null, name: null },
  ];

  // Height of each entry type
  function entryHeight(e) {
    if (!e.role && !e.name) return 44;           // blank spacer
    if (e.role)             return 82;           // stacked: role + name
    var s = e.style || 'normal';
    if (s === 'title')   return 100;
    if (s === 'section') return 72;
    if (s === 'thanks')  return 50;
    if (s === 'reveal')  return 52;
    if (s === 'pause')   return 70;
    if (s === 'sub')     return 50;
    return 50;
  }

  // Pre-compute cumulative offsets
  var offsets = [];
  var totalH  = 0;

  function buildOffsets(cfg) {
    offsets = [];
    var y = cfg.VIEWPORT_HEIGHT; // start below screen
    for (var i = 0; i < ENTRIES.length; i++) {
      offsets.push(y);
      y += entryHeight(ENTRIES[i]);
    }
    totalH = y + cfg.VIEWPORT_HEIGHT * 0.4;
  }

  function start(cb) {
    active   = true;
    done     = false;
    callback = cb || null;
    var cfg  = Game.Config;
    buildOffsets(cfg);
    scrollY  = 0;
    Game.Input.lock();
  }

  function update(dt) {
    if (!active) return;
    scrollY += SPEED * dt;
    if (!done && scrollY >= totalH) {
      done   = true;
      active = false;
      Game.Input.unlock();
      if (callback) { var cb = callback; callback = null; cb(); }
    }
  }

  function handleClick() {
    if (!active) return;
    if (done) {
      // Credits already finished scrolling — go straight to callback
      active = false;
      Game.Input.unlock();
      if (callback) { var cb = callback; callback = null; cb(); }
      return;
    }
    scrollY = totalH + 1;
  }

  function draw(ctx) {
    if (!active) return;
    var cfg = Game.Config;
    var cx  = cfg.WIDTH / 2;

    // Background image + dark scrim
    var endImg = Game.Loader.getImage('bg_end');
    if (endImg) {
      ctx.drawImage(endImg, 0, 0, cfg.WIDTH, cfg.VIEWPORT_HEIGHT);
    } else {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, cfg.WIDTH, cfg.VIEWPORT_HEIGHT);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.62)';
    ctx.fillRect(0, 0, cfg.WIDTH, cfg.VIEWPORT_HEIGHT);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, cfg.WIDTH, cfg.VIEWPORT_HEIGHT);
    ctx.clip();
    ctx.textBaseline = 'alphabetic';

    for (var i = 0; i < ENTRIES.length; i++) {
      var e = ENTRIES[i];
      var y = offsets[i] - scrollY;
      var h = entryHeight(e);

      if (y + h < -10 || y > cfg.VIEWPORT_HEIGHT + 10) continue;
      if (!e.role && !e.name) continue;

      var style = e.style || 'normal';

      if (e.role) {
        // Role label — small, italic, muted
        ctx.font      = 'italic 20px Georgia, "Times New Roman", serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(200,200,200,0.65)';
        ctx.fillText(e.role, cx, y + 26);
        // Name — large, bold, white
        ctx.font      = 'bold 42px Georgia, "Times New Roman", serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(e.name, cx, y + 70);

      } else if (style === 'title') {
        ctx.font        = 'italic bold 72px Georgia, "Times New Roman", serif';
        ctx.textAlign   = 'center';
        ctx.fillStyle   = '#FEBD69';
        ctx.shadowColor = 'rgba(255,153,0,0.8)';
        ctx.shadowBlur  = 28;
        ctx.fillText(e.name, cx, y + 74);
        ctx.shadowBlur  = 0;

      } else if (style === 'section') {
        ctx.font      = 'bold 32px Georgia, "Times New Roman", serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FEBD69';
        ctx.fillText(e.name, cx, y + 44);

      } else if (style === 'sub') {
        ctx.font      = 'italic 22px Georgia, "Times New Roman", serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillText(e.name, cx, y + 34);

      } else if (style === 'thanks') {
        ctx.font      = '24px Georgia, "Times New Roman", serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillText(e.name, cx, y + 34);

      } else if (style === 'pause') {
        ctx.font      = 'bold 48px Georgia, "Times New Roman", serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillText(e.name, cx, y + 50);

      } else if (style === 'reveal') {
        ctx.font      = '26px Georgia, "Times New Roman", serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(e.name, cx, y + 36);
      }
    }

    ctx.restore();

    // Skip hint
    if (!done) {
      ctx.font      = '16px ' + cfg.FONT_FAMILY;
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillText('click to skip', cx, cfg.VIEWPORT_HEIGHT - 16);
    }
  }

  function isActive() { return active; }

  return { start: start, update: update, draw: draw, handleClick: handleClick, isActive: isActive };
})();
