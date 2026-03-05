Game.Effects = (function () {

  // Execute an array of effect objects sequentially
  function execute(effects, callback) {
    if (!effects || effects.length === 0) {
      if (callback) callback();
      return;
    }

    var index = 0;

    function next() {
      if (index >= effects.length) {
        if (callback) callback();
        return;
      }
      var effect = effects[index];
      index++;
      runOne(effect, next);
    }

    next();
  }

  function runOne(effect, done) {
    switch (effect.type) {
      case 'set_flag':
        Game.State.set(effect.flag, effect.value !== undefined ? effect.value : true);
        done();
        break;

      case 'add_item':
        Game.Inventory.add(effect.item);
        done();
        break;

      case 'remove_item':
        Game.Inventory.remove(effect.item);
        done();
        break;

      case 'replace_item':
        Game.Inventory.replace(effect.old_item, effect.new_item);
        done();
        break;

      case 'remove_hotspot':
        Game.Room.removeHotspot(effect.id);
        done();
        break;

      case 'show_hotspot':
        Game.Room.showHotspot(effect.id);
        done();
        break;

      case 'transition':
        Game.Renderer.fadeOut(function () {
          Game.Room.load(effect.room, function () {
            if (effect.player_x !== undefined) {
              Game.Player.setPosition(effect.player_x, effect.player_y);
            }
            if (effect.player_dir) {
              Game.Player.setDirection(effect.player_dir);
            }
            Game.Renderer.fadeIn(done);
          });
        });
        break;

      case 'say':
        Game.TextBox.showBlocking(
          effect.text,
          effect.x || Game.Config.WIDTH / 2,
          effect.y || 200,
          effect.color || Game.Config.COLORS.TEXT_NPC,
          done
        );
        break;

      case 'dialogue':
        Game.Dialogue.start(effect.dialogue, done);
        break;

      case 'lock_input':
        Game.Player.cancelWalk();
        Game.Input.lock();
        done();
        break;

      case 'unlock_input':
        Game.Input.unlock();
        done();
        break;

      case 'spawn_npc':
        Game.Actors.spawn(effect.id, effect.x, effect.y, effect.sprite, effect.cols, effect.rows, effect.dir || 'right', effect.multiFile || false, effect.dualSheet || false);
        done();
        break;

      case 'walk_player':
        Game.Player.walkTo(effect.to_x, effect.to_y, done);
        break;

      case 'set_player_dir':
        Game.Player.setDirection(effect.dir);
        done();
        break;

      case 'walk_npc':
        Game.Actors.walkTo(effect.id, effect.to_x, effect.to_y, done);
        break;

      case 'parallel':
        var subEffects = effect.effects;
        if (!subEffects || subEffects.length === 0) { done(); break; }
        var remaining = subEffects.length;
        var oneDone = function () { if (--remaining === 0) done(); };
        for (var pi = 0; pi < subEffects.length; pi++) {
          runOne(subEffects[pi], oneDone);
        }
        break;

      case 'remove_npc':
        Game.Actors.remove(effect.id);
        done();
        break;

      case 'wordfight':
        Game.Wordfight.start(effect, done);
        break;

      case 'victory':
        Game.State.set('game_won', true);
        Game.Renderer.showVictory();
        done();
        break;

      default:
        console.warn('Unknown effect type:', effect.type);
        done();
    }
  }

  return {
    execute: execute,
  };
})();
