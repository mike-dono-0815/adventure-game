Game.Loader = (function () {
  var data = {};
  var images = {};
  var totalAssets = 0;
  var loadedAssets = 0;
  var loadingComplete = false;

  function loadJSON(url) {
    return fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error('Failed to load ' + url);
        return r.json();
      })
      .then(function (json) {
        loadedAssets++;
        return json;
      });
  }

  function loadImage(url) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        loadedAssets++;
        resolve(img);
      };
      img.onerror = function () {
        console.warn('Image not found: ' + url + ', using placeholder');
        loadedAssets++;
        resolve(null);
      };
      img.src = url;
    });
  }

  function loadAll() {
    var jsonFiles = [
      { key: 'game', url: 'content/game.json' },
      { key: 'rooms/lobby', url: 'content/rooms/lobby.json' },
      { key: 'rooms/office', url: 'content/rooms/office.json' },
      { key: 'dialogues/karen', url: 'content/dialogues/karen.json' },
      { key: 'dialogues/bob', url: 'content/dialogues/bob.json' },
      { key: 'dialogues/coffee_machine', url: 'content/dialogues/coffee_machine.json' },
      { key: 'items', url: 'content/items/items.json' },
    ];

    var imageFiles = [
      { key: 'bg_lobby', url: 'assets/backgrounds/Reception.png' },
      { key: 'bg_office', url: 'assets/backgrounds/office.png' },
      { key: 'item_business_card',        url: 'assets/items/thumbs/business_card.png' },
      { key: 'item_stress_ball',          url: 'assets/items/thumbs/stress_ball.png' },
      { key: 'item_cappuccino_cup',       url: 'assets/items/thumbs/cappuccino_cup.png' },
      { key: 'item_visitor_badge',        url: 'assets/items/thumbs/visitor_badge.png' },
      { key: 'item_coffee_cup',           url: 'assets/items/thumbs/coffee_cup.png' },
      { key: 'item_separation_agreement', url: 'assets/items/thumbs/separation_agreement.png' },
      { key: 'item_pen',                  url: 'assets/items/thumbs/pen.png' },
      { key: 'item_signed_agreement',     url: 'assets/items/thumbs/signed_agreement.png' },
    ];

    totalAssets = jsonFiles.length + imageFiles.length;

    var jsonPromises = jsonFiles.map(function (f) {
      return loadJSON(f.url).then(function (json) {
        data[f.key] = json;
      });
    });

    var imagePromises = imageFiles.map(function (f) {
      return loadImage(f.url).then(function (img) {
        images[f.key] = img;
      });
    });

    return Promise.all(jsonPromises.concat(imagePromises)).then(function () {
      loadingComplete = true;
      console.log('All assets loaded');
    });
  }

  function getProgress() {
    if (totalAssets === 0) return 0;
    return loadedAssets / totalAssets;
  }

  function isComplete() {
    return loadingComplete;
  }

  function getData(key) {
    return data[key];
  }

  function getImage(key) {
    return images[key];
  }

  function addImage(key, img) {
    images[key] = img;
  }

  function drawLoadingScreen(ctx) {
    var W = Game.Config.WIDTH;
    var H = Game.Config.HEIGHT;
    var progress = getProgress();

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#e0e0e0';
    ctx.font = '36px ' + Game.Config.FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.fillText('The Separation Agreement', W / 2, H / 2 - 60);

    ctx.font = '20px ' + Game.Config.FONT_FAMILY;
    ctx.fillText('Loading...', W / 2, H / 2 - 10);

    // Progress bar
    var barW = 400;
    var barH = 20;
    var barX = (W - barW) / 2;
    var barY = H / 2 + 20;

    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barW, barH);

    ctx.fillStyle = '#e94560';
    ctx.fillRect(barX + 2, barY + 2, (barW - 4) * progress, barH - 4);

    ctx.textAlign = 'left';
  }

  return {
    loadAll: loadAll,
    getProgress: getProgress,
    isComplete: isComplete,
    getData: getData,
    getImage: getImage,
    addImage: addImage,
    drawLoadingScreen: drawLoadingScreen,
  };
})();
