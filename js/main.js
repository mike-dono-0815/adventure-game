Game.Main = (function () {

  function boot() {
    console.log('The Separation Agreement — Booting...');

    // Init renderer (sets up canvas)
    Game.Renderer.init();

    // Start loading assets — draw loading screen while waiting
    var loadingInterval = setInterval(function () {
      var canvas = document.getElementById('gameCanvas');
      var ctx = canvas.getContext('2d');
      var scale = Game.Renderer.getScale();
      ctx.save();
      ctx.scale(scale, scale);
      Game.Loader.drawLoadingScreen(ctx);
      ctx.restore();
    }, 50);

    Game.Loader.loadAll()
      .then(function () {
        clearInterval(loadingInterval);
        initGame();
      })
      .catch(function (err) {
        clearInterval(loadingInterval);
        console.error('Failed to load assets:', err);
        // Still try to start with what we have
        initGame();
      });
  }

  function initGame() {
    var gameData = Game.Loader.getData('game') || {};

    // Check for debug scenario via ?scenario=<name>
    var scenario = null;
    var params = window.location.search.slice(1).split('&').reduce(function (acc, pair) {
      var parts = pair.split('=');
      if (parts[0]) acc[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1] || '');
      return acc;
    }, {});
    if (params.scenario) {
      var debugData = Game.Loader.getData('debug') || {};
      scenario = (debugData.scenarios || {})[params.scenario] || null;
      if (scenario) console.log('[DEBUG] Loading scenario:', params.scenario, scenario.label);
      else console.warn('[DEBUG] Unknown scenario:', params.scenario);
    }

    // Merge flags: base flags + scenario overrides
    var startingFlags = {};
    var baseFlags = gameData.starting_flags || {};
    for (var k in baseFlags) startingFlags[k] = baseFlags[k];
    if (scenario && scenario.flags) {
      for (var k in scenario.flags) startingFlags[k] = scenario.flags[k];
    }

    // Init state with merged flags
    Game.State.init(startingFlags);

    // Init subsystems
    Game.Player.init();
    Game.Verbs.init();
    Game.Inventory.init();

    // Add inventory (scenario overrides base if provided)
    var startingInventory = (scenario && scenario.inventory) || gameData.starting_inventory || [];
    for (var i = 0; i < startingInventory.length; i++) {
      Game.Inventory.add(startingInventory[i]);
    }

    // Starting room and position
    var startRoom = (scenario && scenario.room) || gameData.start_room || 'lobby';
    var startX    = (scenario && scenario.player_x) || gameData.start_x || 400;
    var startY    = (scenario && scenario.player_y) || gameData.start_y || 650;
    var startDir  = (scenario && scenario.player_dir) || 'right';

    Game.Room.load(startRoom, function () {
      Game.Player.setPosition(startX, startY);
      Game.Player.setDirection(startDir);

      // Start game loop
      Game.Renderer.start();

      console.log('Game initialized. Room:', startRoom);
      console.log('Controls: Click to interact, Right-click to cancel, Escape for save/load, F5/F9 quick save/load, Ctrl+D debug mode');
    });
  }

  return {
    boot: boot,
  };
})();

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', Game.Main.boot);
} else {
  Game.Main.boot();
}
