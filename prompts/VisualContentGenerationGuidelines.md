# Visual Content Generation Guidelines

Visual content for the game is generated via the Gemini API. The `../gemini-api/` directory contains three functions:

- **`generate_image.py`** — generates a new image from a text prompt (`generate_image`)
- **`analyze_image.py`** — analyzes an existing image with a text prompt (`analyze_image`); supports vision queries, bounding box extraction, and structured JSON output
- **`generate_text.py`** — generates text from a prompt (`generate_text`); useful for scripting dialogue, descriptions, and content ideas

Prompt templates are in `./prompts/`:

- **`BackgroundGeneration.md`** — room backgrounds (two style variants) + variant edit prompts
- **`CharacterAnimationGeneration.md`** — character sprite sheets (3 frames: idle / walk / talk)
- **`InventoryObjectGeneration.md`** — inventory item sprites (single or 2×2 sheet)

---

## Content Types and How to Generate Them

### 1. New Room Background

Use `generate_image` with the prompt template in `BackgroundGeneration.md`.
Two style variants are documented there — pick the one matching existing rooms in the area.

Key requirements in all templates:
- 16:9 aspect ratio
- Bottom 30–40% completely clear walkable floor area
- No characters, no UI

### 2. Background Variants

Always generate variants by **editing the base image**, not regenerating from scratch.
This preserves colours, perspective, and lighting perfectly.

See `BackgroundGeneration.md` for the full edit prompt table. Common patterns:

> "Remove the [object] from the image. Keep everything else exactly the same."
> "Show locker number 4's door open. Keep everything else exactly the same."
> "Make the whiteboard clearly read: '[text]'. Keep everything else exactly the same."

For NPC talking animation, generate two variants (mouth closed / open) and alternate
in JS with a timer.

### 3. New Character Sprite

Follow the three-step process in `CharacterAnimationGeneration.md`:

1. Generate the **IDLE frame** (1:1) with a magenta chroma-key background
2. **Edit** the idle frame → WALK frame (same character, mid-stride pose)
3. **Edit** the idle frame → TALK frame (same character, mouth open only)
4. **Stitch** all three 1:1 frames into a 3072×1024 sheet with PIL
5. **Flip** horizontally for the Left sheet

**Why not generate all three at once?** The API does not support aspect ratios wider
than 16:9. A 3-frame horizontal sheet (3:1) is rejected. Generating all three frames
independently produces an inconsistent character (clothing, palette and face change
between calls). The idle-then-edit approach guarantees consistency.

Output files:
- `CharacterName_Right.png` — 3072×1024 (frames: idle | walk | talk)
- `CharacterName_Left.png` — horizontal flip of Right sheet

The engine reads frame columns as: right `{stand:0, walk:1, talk:2}`, left `{stand:2, walk:1, talk:0}`.

#### Chroma-key background removal

Sprites use a **magenta chroma-key background** (`#FF00FF`). The model does not
produce exact #FF00FF — the actual generated colour varies per run (e.g. RGB ≈ 233, 21, 140).
**Do not hard-code the background colour** — detect it automatically at runtime.

**Step 1 — Detect background colour from the border pixels.**
Sample the outer 20 px of the image, quantise each channel to 16 levels, and take the
most common bucket. This finds the actual generated background regardless of the exact shade.

```javascript
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
const br = ((bestKey >> 8) & 0xF) * 16 + 8;   // centre of winning bucket
const bg = ((bestKey >> 4) & 0xF) * 16 + 8;
const bb =  (bestKey & 0xF)        * 16 + 8;
```

**Step 2 — Remove by colour distance, with separate FULL and SOFT thresholds.**

```javascript
const FULL = 60, SOFT = 110;
for (let i = 0; i < d.length; i += 4) {
  const dist = Math.sqrt((d[i]-br)**2 + (d[i+1]-bg)**2 + (d[i+2]-bb)**2);
  if (dist < FULL) {
    d[i+3] = 0;                                         // fully transparent
  } else if (dist < SOFT) {
    const strength = (SOFT - dist) / (SOFT - FULL);
    d[i+3] = Math.round(d[i+3] * (1 - strength));      // soft edge
  }
}
```

**Critical bug to avoid:** Do NOT use the formula `strength = 1 - dist/SOFT` without a
separate FULL threshold. That formula never reaches exactly 0 — a background pixel at
dist=5 would still have alpha ≈ 16 (6% opaque), creating a visible translucent overlay
across the entire background area. Always use a hard-zero zone (dist < FULL) and a
separate fade zone (FULL ≤ dist < SOFT).

After removal, erode 1 px inward to clean up residual fringing.

Do **not** use white backgrounds for character sprites — white removal bleeds into
eyes, dark hair, and other features that happen to be near-white.

### 4. Inventory Object Sprites

Use `generate_image` with aspect_ratio="1:1". Generate items individually (not as a
sheet) — results are cleaner and no cropping is needed.

See `InventoryObjectGeneration.md` for the full prompt template.

Save as `item_[id].png`. Items are displayed at 98×98 px in the inventory — keep
designs bold and readable at small sizes.

### 5. Hotspot Coordinates

**Never guess hotspot coordinates from the generation prompt.** The AI places objects
differently from what the prompt describes. Always derive coordinates from the actual
generated image.

#### Method 1 — Claude vision (recommended, no API call needed)

Read the background PNG with the `Read` tool. Claude will render it visually and you
can estimate bounding boxes directly by inspection. Convert from the image as displayed
to game coordinates using percentage fractions:

```
game_x = fraction_x * 1376
game_y = fraction_y * 768
```

This is fast and does not consume an extra API call. Use it for the initial placement,
then fine-tune with the debug editor.

#### Method 2 — `analyze_image` API call

If you need precise machine-readable coordinates, use `analyze_image`:

> "Return the bounding box coordinates (x, y, width, height) of the following objects
> in this image: [list]. Return the result as JSON."

Use `response_mime_type="application/json"` with a `response_schema`.

> **Important:** Coordinates are relative to the image's native resolution.
> Scale to game coordinates: `game_x = image_x * (1376 / image_width)`.

#### Fine-tuning with the debug editor

After applying initial coordinates (from either method), open the game and press
**Ctrl+D** to enter debug mode. Drag the yellow corner handles to resize hotspot rects;
drag the cyan vertex handles to adjust the walk area polygon. The export panel shows
updated JS arrays ready to paste directly into the source.

### 6. Pickable Objects in Backgrounds — Inpainting + Patch Overlay

When an object can be picked up by the player, the background must look correct
whether the object is present or absent, and in every combination (e.g. bread taken
but cup still there). The two-part solution:

#### Part A — Generate a clean base background with inpainting

Use `inpaint_image` from `../gemini-api/inpaint_image.py` to erase each pickable
object from the base background, producing a single "empty" image.

> ⚠️ **Do this AFTER hotspot calibration.** Inpainting uses the exact bounding box
> coordinates from the calibrated game hotspots. Never inpaint before the first
> playable prototype is running and the rects have been verified in-game with Ctrl+D.
> Generating inpainted variants with wrong coordinates wastes API calls and produces
> unusable results.

Workflow:
1. Build the room and calibrate all hotspots with the debug editor
2. For each pickable scene object, call `inpaint_image` with its bounding box,
   chaining calls so each subsequent inpaint uses the already-cleaned image:

```python
import sys
sys.path.insert(0, '../gemini-api')
from inpaint_image import inpaint_image
from pathlib import Path

# Remove object 1
r1 = inpaint_image(
    image_bytes=Path('backgrounds/Room.png').read_bytes(),
    bbox=(x1, y1, x2, y2),           # rect [x,y,w,h] → (x, y, x+w, y+h)
    prompt='Fill with the [surface description]. Match colour and lighting exactly.',
    output_dir='backgrounds', output_filename='Room_Step1',
)
step1 = Path(r1['images'][0])

# Remove object 2 (build on the already-cleaned image)
r2 = inpaint_image(
    image_bytes=step1.read_bytes(),
    bbox=(x1, y1, x2, y2),
    prompt='Fill with the [surface description].',
    output_dir='backgrounds', output_filename='Room_Base',
)
```

The final output (`Room_Base.png`) has all pickable objects removed. This is the
background always rendered in the game.

**Known fixes required in `inpaint_image.py`** (apply once to the shared utility):
- `output_mime_type` must only be passed when not `None` (the Gemini API rejects it otherwise)
- Default model must be `gemini-2.5-flash-image` (not the old `gemini-2.5-flash-preview-05-20`)

#### Part B — Patch overlay for correct per-combination rendering

**Do not** create a separate background image per combination — N pickable objects
would require 2ᴺ background files, and state-change variants (stone moved, bar bent, etc.)
would each need the same set.

Instead, keep a single clean base and draw small **patch images** on top of it:

```
base background (always)  +  patch_item_A (if not taken)  +  patch_item_B (if not taken)  →  frame
```

**Generate patch images** by cropping the *original* background (with all objects
present) at the item's bounding box, scaled to game coordinates (1376 × 768).
**Expand the bounding box by 10% on each side (20% total)** — the inpainting
boundary is never pixel-perfect, so a slightly larger patch fully covers any edge
bleed where the inpainted fill meets the original image.

```python
from PIL import Image
img = Image.open('backgrounds/Room.png').resize((1376, 768), Image.LANCZOS)
W, H = 1376, 768

def expanded_crop(x, y, w, h, pct=0.10):
    dx, dy = int(w * pct), int(h * pct)
    return max(0, x-dx), max(0, y-dy), min(W, x+w+dx), min(H, y+h+dy)

# For each item: expand, crop, save; use x1,y1 as the patch position in BG_PATCHES
x1, y1, x2, y2 = expanded_crop(x, y, w, h)
img.crop((x1, y1, x2, y2)).save(f'backgrounds/patch_item_name.png')
```

**Important:** resize to game resolution before cropping so the patch pixels align
perfectly with the game's scaled rendering of the background.

The `x`/`y` values in `BG_PATCHES` must use the **expanded** top-left (`x1`, `y1`),
not the original hotspot origin.

Declare patches in the JS alongside the background sources:

```javascript
const BG_PATCHES = [
  // x, y are the top-left of the EXPANDED crop, not the raw hotspot rect
  { id: 'bread',   src: 'backgrounds/patch_bread.png',   x: 743,  y: 435, flag: 'bread_taken'  },
  { id: 'tin_cup', src: 'backgrounds/patch_tin_cup.png', x: 1135, y: 547, flag: 'cup_taken'    },
];
const patchImgs = {};
```

Load in `preload`:
```javascript
...BG_PATCHES.map(p => loadImg(p.src).then(i => { patchImgs[p.id] = i; })),
```

Render in `draw()` immediately after the background, before the player:
```javascript
if (bg) ctx.drawImage(bg, 0, 0, CFG.W, CFG.VP_H);
for (const p of BG_PATCHES)
  if (!gs.flags[p.flag] && patchImgs[p.id]) ctx.drawImage(patchImgs[p.id], p.x, p.y);
playerDraw(ctx);
```

This automatically handles every combination of taken/present items with no extra
background files. It also composes correctly with state-change variants (stone open,
bar filed, etc.) because patches overlay whatever background is currently active.

---

## Known API Limitations

| Limitation | Workaround |
|---|---|
| No aspect ratios wider than 16:9 | Generate frames individually as 1:1, stitch with PIL |
| Model ignores exact colour specs | Use tolerant threshold ranges when keying, not exact hex matches |
| `generate_image` may return no image | Retry the call; usually succeeds on second attempt |
| Output filenames include numeric suffix | Rename after generation (e.g. `Gym_0_0.png` → `Gym.png`) |
| Edit calls may subtly change character details | Always edit from the same base image; never chain edit→edit |

---

## Summary Table

| Content needed | Function | Prompt source |
|---|---|---|
| New room background | `generate_image` | `BackgroundGeneration.md` |
| Background variant (state change) | `generate_image` (edit) | `BackgroundGeneration.md` edit table |
| New character sprite sheet | `generate_image` × 3 + PIL stitch | `CharacterAnimationGeneration.md` |
| Inventory item sprite | `generate_image` | `InventoryObjectGeneration.md` |
| Hotspot bounding boxes | `analyze_image` | Bounding box query prompt |
| Style matching for new assets | `analyze_image` | Style description query |
