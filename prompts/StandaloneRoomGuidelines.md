# Standalone Room Guidelines

A new room is built as a self-contained `index.html` inside `./new-content/` (or a
sub-folder per room). It replicates the main game's UI and mechanics exactly.
See `./new-content/index.html` as the reference implementation.

> ⚠️ **Prerequisite — approve the puzzle design before writing any code.**
> Generate a `PuzzleDependencyGraph.md` in the game's folder (see
> `RiddleDesignGuidelines.md` section 6 for the required structure and template),
> present it to the user, and wait for explicit approval or change requests.
> Do not start implementing `executeVerb` logic until the PDG is signed off.

---

## UI Layout

The canvas is always **1376 × 1038** logical pixels:

| Zone | Y | Height | Notes |
|---|---|---|---|
| Viewport (scene) | 0 | 768 | Background + player + hotspots |
| Action line | 768 | 46 | Centred bold text |
| Bottom bar | 814 | 224 | Verb panel (left) + inventory (right) |

- **Verb panel**: x=0, w=563, 3×3 grid of 9 verbs
- **Inventory**: x=563, w=813, 6×2 grid, 98 px thumbnails

---

## Text Colors

Three colors distinguish who is speaking/narrating. Always use the right one.

| Type | Color | Constant | When to use |
|---|---|---|---|
| Narrator | `#c9a0e8` (purple) | `CFG.C.NARRATOR` | Room entry descriptions, scene-setting narration |
| Player speech | `#7EC8E3` (blue) | `CFG.C.TEXT_PLAYER` | Everything the player character says or thinks during an interaction |
| NPC | `#FEBD69` (amber) | `CFG.C.TEXT_NPC` | Lines spoken by other characters |

`showText(text)` defaults to `TEXT_PLAYER`. Pass the color explicitly only when
using `NARRATOR` or `TEXT_NPC`.

```javascript
showText('I take the chalk.', );                         // TEXT_PLAYER (default)
showText('You enter the Wellness Suite.', CFG.C.NARRATOR); // narrator
```

---

## Talk Animation

The player sprite alternates between the **stand** and **talk** frames while player
text is on screen, using a randomised cadence (0.20–0.80 s per phase) matching the
main game. Do NOT hold the talk frame continuously — it looks unnatural.

Add to game state:
```javascript
talkPhase: 0, talkTimer: 0, talkInterval: 0.5,
```

Tick in the game loop:
```javascript
if (gs.textTimer > 0) {
  gs.textTimer -= dt;
  if (gs.textColor === CFG.C.TEXT_PLAYER) {
    gs.talkTimer += dt;
    if (gs.talkTimer >= gs.talkInterval) {
      gs.talkTimer    = 0;
      gs.talkPhase    = 1 - gs.talkPhase;              // toggle 0 ↔ 1
      gs.talkInterval = 0.20 + Math.random() * 0.60;  // next interval 0.20–0.80 s
    }
  }
} else {
  gs.talkPhase = 0; gs.talkTimer = 0;                  // reset when text clears
}
```

Use `talkPhase` in `playerDraw`:
```javascript
const talking = gs.textTimer > 0 && gs.textColor === CFG.C.TEXT_PLAYER && gs.talkPhase === 1;
const state   = talking ? 'talk' : pl.walking ? (pl.animFrame===0 ? 'stand' : 'walk') : 'stand';
```

Consequence: always use `TEXT_PLAYER` for interaction responses (not NARRATOR), so
the character animates while "speaking". Reserve NARRATOR for text that the player
character is not saying aloud (room descriptions, scene transitions).

---

## Input Blocking During Text

While any text is on screen (`gs.textTimer > 0`), the player must not be able to
interact with the scene. This matches the main game's behaviour exactly.

**Two changes are required:**

### 1. Suppress hover in `mousemove`

Check at the top of the mousemove handler, before any hotspot/verb logic:

```javascript
if (gs.textTimer > 0) {
  gs.hoverTarget = null;
  gs.hoverVerb   = null;
  canvas.style.cursor = 'wait';
  return;
}
```

This hides the action line, removes hotspot highlight, and shows the wait cursor.

### 2. Set cursor immediately in `showText`

The `mousemove` handler only fires when the mouse moves. If text appears while the
mouse is stationary the cursor stays `default` until the next movement. Fix: set
`wait` directly in `showText` and restore `default` in both exit paths.

```javascript
function showText(text, color) {
  gs.text = text;
  gs.textColor = color || CFG.C.TEXT_PLAYER;
  gs.textTimer = Math.max(2.5, text.length * 0.06); // scale with text length
  canvas.style.cursor = 'wait';          // immediate — no mouse move required
}
```

**Never use a fixed duration.** Short lines (e.g. "No.") would hang for 5 s; long lines
would vanish before the player finishes reading. The formula `Math.max(2.5, len * 0.06)`
matches the main game's blocking-text timing.

Restore in the game loop when the timer expires:

```javascript
} else {
  gs.talkPhase = 0; gs.talkTimer = 0;
  if (canvas.style.cursor === 'wait') canvas.style.cursor = 'default';
}
```

### 3. Dismiss on click — no scene interaction

At the top of the click handler (before verb/inventory/viewport logic), intercept any
click and dismiss the text without triggering anything else:

```javascript
if (gs.textTimer > 0) { gs.textTimer = 0; canvas.style.cursor = 'default'; return; }
```

The `return` is critical — without it the click falls through and triggers a walk or
hotspot interaction on the same frame the text is dismissed.

### 4. Right-click resets all hover state

Right-click cancels the current verb and selected item. It must also clear
`hoverTarget`, otherwise the action line keeps showing the previously hovered name
even after the verb is deselected.

```javascript
function resetVerb() {
  gs.currentVerb  = null;
  gs.selectedItem = null;
  gs.hoverTarget  = null;   // clears action line too
}

canvas.addEventListener('contextmenu', e => { e.preventDefault(); resetVerb(); });
```

---

## Walk-to-Hotspot

When the player clicks a hotspot, the character walks to a position beside it first,
then executes the interaction. This matches the main game behaviour.

### How it works

1. `walkToPoint(hs)` computes the destination:
   - Hotspot in left half of screen → stand to its **right** (player faces left)
   - Hotspot in right half → stand to its **left** (player faces right)
   - Y = bottom edge of hotspot rect, clamped to the walk polygon
2. `playerWalkTo(wx, wy, callback)` walks the player there
3. On arrival, the callback faces the player toward the hotspot and calls `executeVerb`

```javascript
const wp = walkToPoint(hs);
playerWalkTo(wp.x, wp.y, () => {
  gs.pl.dir = gs.pl.x < hsCenterX ? 'right' : 'left';
  executeVerb(verb, hs.id, savedItem);
});
```

`playerWalkTo` stores the callback in `pl.arriveCallback`; `playerUpdate` fires it
when the path empties (both at the end of a walk step and at the top of the loop).

### Walk area

Defined as a polygon (not a rectangle) for perspective-correct floor shapes:

```javascript
const WALK_AREA = [[360,611],[1032,618],[1233,741],[153,738]]; // example
```

Perspective scaling: player height scales linearly between `min_scale` (top of walk
area) and `max_scale` (bottom). Typical values: `{ min_scale: 0.75, max_scale: 1.0 }`.

---

## Action Line — "Use X with Y"

When a two-object verb is active (`Use`, `Give`) and the player has selected an item,
hovering over a second target shows the full action text:

> **Use Chalk Block with Whiteboard**

This is handled in `actionText()`:

```javascript
if (gs.selectedItem) {
  parts.push(ITEM_DEFS[gs.selectedItem].name);
  if (prep) {
    if (gs.hoverTarget && gs.hoverTarget !== gs.selectedItem) {
      parts.push(prep + ' ' + nameOf(gs.hoverTarget));  // "with Whiteboard"
    } else {
      parts.push(prep + ' ...');                         // no target yet
    }
  }
}
```

No verb is shown if `gs.currentVerb` is null AND there is no `gs.hoverTarget`
(default "Walk to"). If there is a hoverTarget but no verb, it shows "Look at
[target]" — unless the target is an exit hotspot, which shows "Walk to".

---

## Debug Editor (Ctrl+D)

Toggled with **Ctrl+D**. Shows two kinds of draggable handles:

| Handle color | What it controls |
|---|---|
| Yellow | Hotspot rect corners (tl / tr / bl / br) |
| Cyan | Walk area polygon vertices |

After any drag, the export panel appears with updated `const HOTSPOTS = [...]` and
`const WALK_AREA = [...]` — copy and paste directly into the source.

Workflow for a new room:
1. **Read the background PNG** with the `Read` tool — Claude renders it visually.
   Estimate object positions as fractions of the image (`game_x = fraction × 1376`,
   `game_y = fraction × 768`). **Never guess from the generation prompt** — the AI
   places objects differently from what was described.
2. Paste estimated coordinates into `HOTSPOTS`
3. Open debug mode, drag yellow handles to fine-tune rects
4. Adjust `WALK_AREA` cyan vertices to match the visible floor perspective
5. Copy the exported JS from the panel and paste back into the source
6. **Only after rects are verified in-game:** generate inpainted background variants
   (see `VisualContentGenerationGuidelines.md` section 6)

---

## Pickable Objects — Patch Overlay System

**Problem:** if N objects can be picked up, naively creating one background image per
state requires 2ᴺ files (and multiplies again for each background variant like
stone-open or bar-filed).

**Solution:** keep a single clean base background with all pickable objects removed
(generated via inpainting), then overlay small patch images for each item that is
still present in the scene.

```
frame = base_background + patch_A (if not taken) + patch_B (if not taken) + player
```

### Data structure

```javascript
const BG_PATCHES = [
  // x, y = top-left of the EXPANDED crop (not the raw hotspot rect)
  { id: 'bread',   src: 'backgrounds/patch_bread.png',   x: 743,  y: 435, flag: 'bread_taken'  },
  { id: 'tin_cup', src: 'backgrounds/patch_tin_cup.png', x: 1135, y: 547, flag: 'cup_taken'    },
];
const patchImgs = {};
```

`x` and `y` are the top-left corner of the item's hotspot rect in game coordinates.
`flag` is the game-state boolean that becomes `true` when the item is taken.

### Loading

Add to the `preload` Promise array:
```javascript
...BG_PATCHES.map(p => loadImg(p.src).then(i => { patchImgs[p.id] = i; })),
```

### Rendering

In `draw()`, between the background and the player:
```javascript
if (bg) ctx.drawImage(bg, 0, 0, CFG.W, CFG.VP_H);
for (const p of BG_PATCHES)
  if (!gs.flags[p.flag] && patchImgs[p.id]) ctx.drawImage(patchImgs[p.id], p.x, p.y);
playerDraw(ctx);
```

### Generating patch images

Crop from the *original* background (with all objects present), resized to game
resolution first so pixels align with the scaled rendering:

```python
from PIL import Image
img = Image.open('backgrounds/Room.png').resize((1376, 768), Image.LANCZOS)
W, H = 1376, 768

def expanded_crop(x, y, w, h, pct=0.10):
    """Expand BB by 10% on each side (20% total) to cover inpainting edge bleed."""
    dx, dy = int(w * pct), int(h * pct)
    return max(0, x-dx), max(0, y-dy), min(W, x+w+dx), min(H, y+h+dy)

# Crop each patch with expanded bounds; use x1,y1 as the draw position in BG_PATCHES
for name, x, y, w, h in [('patch_bread', 755, 443, 128, 83), ('patch_tin_cup', 1142, 555, 70, 80)]:
    x1, y1, x2, y2 = expanded_crop(x, y, w, h)
    img.crop((x1, y1, x2, y2)).save(f'backgrounds/{name}.png')
    print(f'{name}: x={x1}, y={y1}')  # use these values in BG_PATCHES
```

**Always expand by 20% total.** The inpainting boundary is never pixel-perfect —
without the expansion, a 1–2 px seam of the inpainted fill may show through at the
patch edge when the item disappears. The `x`/`y` in `BG_PATCHES` must use the
expanded top-left, not the original hotspot origin.

This works correctly with every combination of taken/present items, and composes
automatically with all background state variants (stone open, bar filed, etc.).

---

## Character Sprite Columns

Sprite sheets are 3072 × 1024 (three 1024 × 1024 frames side by side):

| Column | Right sheet | Left sheet |
|---|---|---|
| 0 | stand (idle) | talk |
| 1 | walk | walk |
| 2 | talk | stand (idle) |

`FRAME_COLS = { right: {stand:0, walk:1, talk:2}, left: {stand:2, walk:1, talk:0} }`

The left sheet is a horizontal flip of the right sheet.
See `CharacterAnimationGeneration.md` for how to generate the sprites.

---

## Sprite Frame Anchoring — Center of Mass + Visual Foot

After background removal, analyze each frame's non-transparent pixels to compute two
anchor fractions. Use these instead of hardcoded `0.5` / `1.0` so that:

- The character doesn't jump sideways when switching between stand/walk/talk frames
  (frames may have different horizontal extents)
- The character's **visual feet** land exactly on `pl.y` (the walk polygon coordinate),
  not the canvas bottom of the sprite which often has transparent padding

```javascript
const playerFrameBounds = {}; // { right: [{cx, bottomFrac}, …], left: […] }

function analyzeFrameBounds(img, cols) {
  const c = document.createElement('canvas');
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const fw = img.naturalWidth / cols, fh = img.naturalHeight;
  const bounds = [];
  for (let col = 0; col < cols; col++) {
    const id = ctx.getImageData(Math.round(col * fw), 0, Math.round(fw), fh);
    const d = id.data, w = Math.round(fw);
    let sumX = 0, count = 0, bottomRow = 0;
    for (let y = 0; y < fh; y++) {
      for (let x = 0; x < w; x++) {
        if (d[(y * w + x) * 4 + 3] > 10) { sumX += x; count++; bottomRow = y; }
      }
    }
    bounds.push({
      cx:         count > 0 ? (sumX / count) / fw : 0.5,
      bottomFrac: count > 0 ? (bottomRow + 1) / fh : 1.0,
    });
  }
  return bounds;
}
```

Call immediately after background removal for each direction sheet:

```javascript
playerImgs.right = p; playerFrameBounds.right = analyzeFrameBounds(p, 3);
playerImgs.left  = p; playerFrameBounds.left  = analyzeFrameBounds(p, 3);
```

Use in `playerDraw`:

```javascript
const bounds   = playerFrameBounds[pl.dir];
const anchorX  = bounds ? bounds[col].cx         : 0.5;
const anchorY  = bounds ? bounds[col].bottomFrac  : 1.0;
ctx.drawImage(img, col*fw, 0, fw, fh,
  Math.round(pl.x - anchorX * pw), Math.round(pl.y - anchorY * ph), pw, ph);
```

`anchorY * ph` is the pixel distance from the sprite top to the visual foot, so
`pl.y - anchorY * ph` places the sprite such that the feet sit on `pl.y` exactly.
Any transparent padding below the feet is drawn past `pl.y` and is invisible.

---

## Background Removal

Character sprites use a **magenta chroma-key background**. The model never produces
exact #FF00FF — the actual colour varies per generation run. Detect it at runtime by
sampling the 20 px border, then remove by Euclidean colour distance using **separate
FULL and SOFT thresholds**:

```javascript
// 1. Detect background: find dominant colour in the outer 20px border
const BORDER = 20;
const counts = new Map();
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    if (x >= BORDER && x < W-BORDER && y >= BORDER && y < H-BORDER) continue;
    const i = (y*W+x)*4;
    const key = ((d[i]>>4)<<8) | ((d[i+1]>>4)<<4) | (d[i+2]>>4);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
}
let bestKey = 0, bestCount = 0;
for (const [k, v] of counts) { if (v > bestCount) { bestCount = v; bestKey = k; } }
const br = ((bestKey >> 8) & 0xF) * 16 + 8;
const bg = ((bestKey >> 4) & 0xF) * 16 + 8;
const bb =  (bestKey & 0xF)        * 16 + 8;

// 2. Remove by distance — hard zero within FULL, soft fade FULL→SOFT
const FULL = 60, SOFT = 110;
for (let i = 0; i < d.length; i += 4) {
  const dist = Math.sqrt((d[i]-br)**2 + (d[i+1]-bg)**2 + (d[i+2]-bb)**2);
  if (dist < FULL) {
    d[i+3] = 0;
  } else if (dist < SOFT) {
    const strength = (SOFT - dist) / (SOFT - FULL);
    d[i+3] = Math.round(d[i+3] * (1 - strength));
  }
}
// 3. Erode 1px inward to remove residual fringing
erodeAlpha(d, W, H);
```

**Common bug:** using `strength = 1 - dist/SOFT` without a separate FULL threshold
leaves every background pixel with a small non-zero alpha (e.g. dist=5 → alpha=16),
producing a visible translucent magenta overlay. Always hard-zero everything below FULL.

See `VisualContentGenerationGuidelines.md` for full rationale.

---

## What the Standalone Room Does NOT Implement

A standalone room is intentionally simpler than the main game. The following systems
exist in the main game but are **absent by design** from standalone rooms. This section
documents each gap so you know what to build if a room ever needs it, and what not to
expect from the current architecture.

---

### NPC / Actor System

The main game has a full actor module (`actors.js`) that handles:
- Drawing named NPCs with their own sprite sheets and frame bounds
- Rant mode — an NPC talks with its own talk animation and speaker colour
- Cutscene sequencing — characters walk, turn, and speak in choreographed order

**Standalone rooms have no actor system.** All characters other than the player are
static hotspot-based sprites baked into the background, or absent entirely. If you
need a talking NPC, the simplest approach is to bake a closed-mouth and open-mouth
variant of the background and alternate them on a timer while `showText` is active.

---

### Dialogue Tree System

The main game has a branching dialogue system with topic trees, exhausted-topic
tracking, and per-branch state flags.

**Standalone rooms have no dialogue system.** All narrative is delivered through
`showText()` calls hardcoded inside `executeVerb`. For rooms that only need linear
story beats this is sufficient. If a room needs player-selectable dialogue choices,
you would need to implement a simple choice UI on top of the existing text system.

---

### Save / Load

The main game persists all flags, inventory, room position, and progress to
`localStorage` and supports multiple save slots.

**Standalone rooms have no persistence.** Refreshing the page resets all state.
This is acceptable for a single self-contained puzzle. If persistence is needed,
serialise `gs.flags` and `gs.inventory` to `localStorage` on every state change
and restore on load.

---

### State Flags — Flat Object, No Conditional Evaluation

The main game evaluates conditions dynamically (`visible_if`, `hidden_if` on
hotspots; `State.evaluate()` for arbitrary expressions).

**Standalone rooms use a plain flat `gs.flags` object.** Hotspot visibility is
handled manually inside `executeVerb` (e.g. removing a hotspot from the array or
checking a flag before acting). There is no declarative condition system. This is
fine for puzzles with a small, known number of states.

If a room grows complex enough that manual flag checks become hard to follow, convert
hotspot visibility to a small helper:

```javascript
// Example: hide a hotspot once it has been searched
function visibleHotspots() {
  return HOTSPOTS.filter(h => {
    if (h.id === 'hay_pile' && gs.flags.nail_taken) return false;
    return true;
  });
}
```

---

### Multi-Text Queue and Fade

The main game supports simultaneous overlapping text lines (e.g. two characters
speaking at once) and fades out the last 0.3 s of each line.

**Standalone rooms show one text line at a time** (`gs.text` is a single string).
A new `showText()` call immediately replaces the previous one. There is no fade —
text disappears instantly when the timer reaches zero.

If you need sequential lines (character speaks line 1, then line 2), chain them
via a callback or use a small queue helper:

```javascript
function showTextSequence(lines, idx = 0) {
  if (idx >= lines.length) return;
  showText(lines[idx]);
  // re-use the timer to schedule the next line
  const wait = gs.textTimer;
  const tick = setInterval(() => {
    if (gs.textTimer <= 0) {
      clearInterval(tick);
      showTextSequence(lines, idx + 1);
    }
  }, 100);
}
```

---

### Exit Hotspots and the `move` Cursor

The main game distinguishes **exit hotspots** (doors, portals leading to another
room) from regular hotspots. Exit hotspots show a `move` cursor on hover and use a
`walk_to` field to place the player at the threshold before transitioning.

**Standalone rooms do not implement room transitions.** There is only one room.
The `cell_door` in the escape game is a win-state trigger, not a true exit hotspot.
If you build a multi-room standalone, add the `move` cursor distinction:

```javascript
if (hs) { gs.hoverTarget = hs.id; canvas.style.cursor = hs.exit ? 'move' : 'pointer'; }
```

---

### Input Lock (Cutscene Mode)

The main game has an explicit `Input.lock()` / `Input.unlock()` mechanism used
during scripted cutscene sequences to suppress all player input.

**Standalone rooms have no lock flag.** Text-display blocking (`gs.textTimer > 0`)
is the only input suppression. If a room needs a multi-step cutscene where the
player cannot interrupt, add a `gs.cutscene` boolean and guard the click and
mousemove handlers the same way `gs.textTimer` is guarded.
