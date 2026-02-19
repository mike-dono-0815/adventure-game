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

    // Init state with starting flags
    Game.State.init(gameData.starting_flags || {});

    // Init subsystems
    Game.Player.init();
    Game.Verbs.init();
    Game.Inventory.init();

    // Load starting room
    var startRoom = gameData.start_room || 'lobby';
    var startX = gameData.start_x || 400;
    var startY = gameData.start_y || 650;

    Game.Room.load(startRoom, function () {
      Game.Player.setPosition(startX, startY);
      Game.Player.setDirection('right');

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
