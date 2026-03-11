Game.Loader = (function () {
  var data = {};
  var images = {};
  var pads = {};
  var topPads = {};
  var frameBounds = {};
  var totalAssets = 0;
  var loadedAssets = 0;
  var loadingComplete = false;

  var CACHE_BUST = '?v=' + Date.now();

  function loadJSON(url) {
    return fetch(url + CACHE_BUST)
      .then(function (r) {
        if (!r.ok) throw new Error('Failed to load ' + url);
        return r.json();
      })
      .then(function (json) {
        loadedAssets++;
        return json;
      });
  }

  function erodeAlpha(data, width, height) {
    // Copy alpha channel before mutating
    var alpha = new Uint8Array(width * height);
    for (var i = 0; i < width * height; i++) alpha[i] = data[i * 4 + 3];
    // Any opaque pixel adjacent to a transparent neighbour becomes transparent
    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        if (alpha[y * width + x] === 0) continue;
        var erode = false;
        for (var dy = -1; dy <= 1 && !erode; dy++) {
          for (var dx = -1; dx <= 1 && !erode; dx++) {
            if (dx === 0 && dy === 0) continue;
            var nx = x + dx, ny = y + dy;
            if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
            if (alpha[ny * width + nx] === 0) erode = true;
          }
        }
        if (erode) data[(y * width + x) * 4 + 3] = 0;
      }
    }
  }

  function removeWhiteBackground(img, threshold) {
    return new Promise(function (resolve) {
      var offscreen = document.createElement('canvas');
      offscreen.width  = img.naturalWidth;
      offscreen.height = img.naturalHeight;
      var octx = offscreen.getContext('2d');
      octx.drawImage(img, 0, 0);
      var imageData = octx.getImageData(0, 0, offscreen.width, offscreen.height);
      var data = imageData.data;
      for (var i = 0; i < data.length; i += 4) {
        if (data[i] >= threshold && data[i+1] >= threshold && data[i+2] >= threshold) {
          data[i+3] = 0;
        }
      }
      erodeAlpha(data, offscreen.width, offscreen.height);
      octx.putImageData(imageData, 0, 0);
      var result = new Image();
      result.onload = function () { resolve(result); };
      result.src = offscreen.toDataURL('image/png');
    });
  }

  function analyzeFrameBoundsForSheet(img, cols) {
    var offscreen = document.createElement('canvas');
    offscreen.width  = img.naturalWidth;
    offscreen.height = img.naturalHeight;
    var octx = offscreen.getContext('2d');
    octx.drawImage(img, 0, 0);
    var fw = img.naturalWidth / cols;
    var fh = img.naturalHeight;
    var bounds = [];
    for (var c = 0; c < cols; c++) {
      var imageData = octx.getImageData(Math.round(c * fw), 0, Math.round(fw), fh);
      var d = imageData.data;
      var w = Math.round(fw);
      var minX = w, maxX = -1, sumX = 0, count = 0;
      for (var y = 0; y < fh; y++) {
        for (var x = 0; x < w; x++) {
          if (d[(y * w + x) * 4 + 3] > 10) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            sumX += x;
            count++;
          }
        }
      }
      var cx = count > 0 ? sumX / count / fw : 0.5;
      bounds.push(maxX >= minX ? { left: minX / fw, right: maxX / fw, cx: cx } : { left: 0, right: 1, cx: 0.5 });
    }
    return bounds;
  }

  function erodeImage(img) {
    return new Promise(function (resolve) {
      var offscreen = document.createElement('canvas');
      offscreen.width  = img.naturalWidth;
      offscreen.height = img.naturalHeight;
      var octx = offscreen.getContext('2d');
      octx.drawImage(img, 0, 0);
      var id = octx.getImageData(0, 0, offscreen.width, offscreen.height);
      erodeAlpha(id.data, offscreen.width, offscreen.height);
      octx.putImageData(id, 0, 0);
      var result = new Image();
      result.onload = function () { resolve(result); };
      result.src = offscreen.toDataURL('image/png');
    });
  }

  function loadDualSheet(charKey, rightUrl, leftUrl) {
    var dirs = [{ dir: 'right', url: rightUrl }, { dir: 'left', url: leftUrl }];
    return Promise.all(dirs.map(function (d) {
      return loadImage(d.url).then(function (img) {
        if (!img) return;
        return erodeImage(img).then(function (processed) {
          var sheetKey = charKey + '_sheet_' + d.dir;
          images[sheetKey] = processed;
          frameBounds[sheetKey] = analyzeFrameBoundsForSheet(processed, 3);
        });
      }).catch(function (err) {
        console.warn('Failed to load character sheet:', charKey, d.dir, err);
      });
    }));
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

  function sliceItemSheets() {
    var itemOrder = [
      'business_card', 'stress_ball', 'cappuccino_cup', 'visitor_badge',
      'terrible_filter_coffee', 'frozen_egg', 'thawed_egg', 'headphones',
      'winning_ugly', 'mystery_package', 'usb_stick', 'coffee_cup',
      'separation_agreement', 'pen', 'signed_agreement', 'co_signed_agreement'
    ];
    var sheetKeys = ['items_sheet_01', 'items_sheet_02', 'items_sheet_03', 'items_sheet_04'];
    // col/row positions for upper-left, upper-right, lower-left, lower-right
    var positions = [[0, 0], [1, 0], [0, 1], [1, 1]];

    var promises = [];
    sheetKeys.forEach(function (sheetKey, si) {
      var img = images[sheetKey];
      if (!img) return;
      var fw = img.naturalWidth / 2;
      var fh = img.naturalHeight / 2;
      positions.forEach(function (pos, pi) {
        var itemId = itemOrder[si * 4 + pi];
        if (!itemId) return;
        var offscreen = document.createElement('canvas');
        offscreen.width = fw;
        offscreen.height = fh;
        var octx = offscreen.getContext('2d');
        octx.drawImage(img, pos[0] * fw, pos[1] * fh, fw, fh, 0, 0, fw, fh);
        promises.push(new Promise(function (resolve) {
          var result = new Image();
          result.onload = function () {
            images['item_' + itemId] = result;
            resolve();
          };
          result.src = offscreen.toDataURL('image/png');
        }));
      });
    });
    return Promise.all(promises);
  }

  function loadAll() {
    var jsonFiles = [
      { key: 'game',                    url: 'content/game.json' },
      // Rooms
      { key: 'rooms/lobby',             url: 'content/rooms/lobby.json' },
      { key: 'rooms/kitchen',           url: 'content/rooms/kitchen.json' },
      { key: 'rooms/office_space',      url: 'content/rooms/office_space.json' },
      { key: 'rooms/it_department',     url: 'content/rooms/it_department.json' },
      { key: 'rooms/aisle',             url: 'content/rooms/aisle.json' },
      { key: 'rooms/lab',               url: 'content/rooms/lab.json' },
      { key: 'rooms/hr_floor',          url: 'content/rooms/hr_floor.json' },
      { key: 'rooms/bobs_office',       url: 'content/rooms/bobs_office.json' },
      // Dialogues
      { key: 'dialogues/karen',         url: 'content/dialogues/karen.json' },
      { key: 'dialogues/bob',           url: 'content/dialogues/bob.json' },
      { key: 'dialogues/coffee_machine',url: 'content/dialogues/coffee_machine.json' },
      { key: 'dialogues/stakeholder_intro', url: 'content/dialogues/stakeholder_intro.json' },
      { key: 'dialogues/keypad_lab',    url: 'content/dialogues/keypad_lab.json' },
      { key: 'dialogues/elevator',      url: 'content/dialogues/elevator.json' },
      { key: 'dialogues/coworker',      url: 'content/dialogues/coworker.json' },
      { key: 'dialogues/chip',          url: 'content/dialogues/chip.json' },
      { key: 'dialogues/fifa_players',  url: 'content/dialogues/fifa_players.json' },
      // Other
      { key: 'wordfight',               url: 'content/wordfight.json' },
      { key: 'items',                   url: 'content/items/items.json' },
      { key: 'debug',                   url: 'content/debug.json' },
    ];

    var imageFiles = [
      // Backgrounds (existing)
      { key: 'bg_title',         url: 'assets/backgrounds/Start2.png' },
      { key: 'bg_lobby',       url: 'assets/backgrounds/Reception.png' },
      { key: 'bg_bobs_office', url: 'assets/backgrounds/BobsOffice.png' },
      { key: 'bg_hr_floor',    url: 'assets/backgrounds/office.png' },
      { key: 'bg_kitchen',        url: 'assets/backgrounds/Kitchen.jpg' },
      { key: 'bg_kitchen_egg',    url: 'assets/backgrounds/Kitchen_Egg.jpg' },
      { key: 'bg_office_space',  url: 'assets/backgrounds/OfficeSpace.jpg' },
      { key: 'bg_office_space2', url: 'assets/backgrounds/OfficeSpace2.jpg' },
      { key: 'bg_it_department', url: 'assets/backgrounds/ITDepartment.jpg' },
      { key: 'bg_aisle',         url: 'assets/backgrounds/Aisle.jpg' },
      { key: 'bg_aisle2',        url: 'assets/backgrounds/Aisle2.jpg' },
      { key: 'bg_lab_empty',        url: 'assets/backgrounds/LabEmpty.jpg' },
      { key: 'bg_lab_full',         url: 'assets/backgrounds/Lab_Full.jpg' },
      { key: 'bg_lab_full_nousb',   url: 'assets/backgrounds/Lab_Full_NoUSB.png' },
      { key: 'bg_lab_empty_nousb',  url: 'assets/backgrounds/LabEmpty_NoUSB.png' },
      { key: 'bg_it_department_headphones', url: 'assets/backgrounds/ITDepartment_HeadPhones.jpg' },
      { key: 'bg_end',              url: 'assets/backgrounds/EndPage.jpg' },
      { key: 'bg_bobs_office_talk', url: 'assets/backgrounds/BobOffice2.jpg' },
      // Item sprite sheets (2x2 grid, 4 items each)
      { key: 'items_sheet_01', url: 'assets/items/Objects_01.png' },
      { key: 'items_sheet_02', url: 'assets/items/Objects_02.png' },
      { key: 'items_sheet_03', url: 'assets/items/Objects_03.png' },
      { key: 'items_sheet_04', url: 'assets/items/Objects_04.png' },
    ];

    var dualSheetChars = [
      { key: 'player',      rightUrl: 'assets/characters/User_Right.png',        leftUrl: 'assets/characters/User_Left.png' },
      { key: 'stakeholder', rightUrl: 'assets/characters/StakeHolder_Right.png', leftUrl: 'assets/characters/StakeHolder_Left.png' },
      { key: 'girl',        rightUrl: 'assets/characters/Girl_Right.png',        leftUrl: 'assets/characters/Girl_Left.png' },
      { key: 'hr',          rightUrl: 'assets/characters/HRM_Right.png',         leftUrl: 'assets/characters/HRM_Left.png' },
    ];

    // 2 images per dualSheet character
    totalAssets = jsonFiles.length + imageFiles.length + dualSheetChars.length * 2;

    var jsonPromises = jsonFiles.map(function (f) {
      return loadJSON(f.url).then(function (json) {
        data[f.key] = json;
      });
    });

    var imagePromises = imageFiles.map(function (f) {
      if (f.padFrac)    pads[f.key]    = f.padFrac;
      if (f.topPadFrac) topPads[f.key] = f.topPadFrac;
      return loadImage(f.url).then(function (img) {
        images[f.key] = img;
      });
    });

    var dualSheetPromises = dualSheetChars.map(function (c) {
      return loadDualSheet(c.key, c.rightUrl, c.leftUrl);
    });

    var itemOverrides = [
      { key: 'item_pen', url: 'assets/items/Pen.png' },
    ];

    function applyItemOverrides() {
      return Promise.all(itemOverrides.map(function (o) {
        return loadImage(o.url).then(function (img) {
          if (img) images[o.key] = img;
        });
      }));
    }

    return Promise.all(jsonPromises.concat(imagePromises).concat(dualSheetPromises))
      .then(sliceItemSheets)
      .catch(function (err) {
        console.warn('Error during asset processing, retrying item sheets:', err);
        return sliceItemSheets();
      })
      .then(applyItemOverrides)
      .then(function () {
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

  function getImagePad(key) {
    return pads[key] || 0;
  }

  function getImageTopPad(key) {
    return topPads[key] || 0;
  }

  function addImage(key, img) {
    images[key] = img;
  }

  function getFrameBounds(sheetKey, col) {
    var b = frameBounds[sheetKey];
    return b ? b[col] : null;
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
    getImagePad: getImagePad,
    getImageTopPad: getImageTopPad,
    getFrameBounds: getFrameBounds,
    addImage: addImage,
    drawLoadingScreen: drawLoadingScreen,
  };
})();
