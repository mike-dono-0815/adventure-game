# Character Animation Generation

## Generation Strategy

> **Important:** The Gemini API does not support aspect ratios wider than 16:9. A 3-frame
> horizontal sheet (3:1) cannot be generated in a single call. Always generate the three
> frames separately as 1:1 images and stitch them with PIL.
>
> **Consistency rule:** Generate the IDLE frame first, then edit it to produce WALK and
> TALK. Never generate all three independently — the character's appearance will drift
> (clothes, face, palette) between calls.

### Step 1 — IDLE frame prompt (use with `generate_image`, aspect_ratio="1:1")

Pixel art character sprite for a classic 1990s point-and-click adventure game.

CRITICAL BACKGROUND: The entire background MUST be solid flat magenta (#FF00FF /
RGB 255,0,255) — no white, no grey, no gradient. This is a chroma-key background.
The character must NOT use magenta, hot-pink, or any similar hue in clothing, skin,
eyes, or hair.

No text, no UI, no background elements, no shadows outside the character.
No anti-aliasing. No motion blur. Crisp pixel edges. Even neutral lighting.
Consistent light source from upper-left.

Draw ONE single IDLE/STAND frame:
Character stands upright facing right, neutral relaxed posture, arms loosely at
sides. Friendly, cheerful expression. Mouth closed. Centered on a square canvas
with generous magenta padding on all sides.

CHARACTER: [ADD CHARACTER DESIGN]

---

### Step 2 — WALK frame edit prompt (use with `edit_image` on the idle frame)

This is a pixel-art character sprite on a magenta (#FF00FF) background.
Keep EVERY detail — proportions, clothing colours, hairstyle, face, pixel palette —
EXACTLY the same. The background MUST remain solid flat magenta. Do NOT change it.

Apply ONE change only: convert the stance to a mid-stride WALK pose facing right.
One leg forward, one leg back. The opposite arm swings forward naturally. Movement
subtle and readable at small sizes. All other details are identical.

---

### Step 3 — TALK frame edit prompt (use with `edit_image` on the idle frame)

This is a pixel-art character sprite on a magenta (#FF00FF) background.
Keep EVERY detail — proportions, clothing colours, hairstyle, face, body position,
pixel palette — EXACTLY the same. The background MUST remain solid flat magenta.
Do NOT change it.

Apply ONE change only: open the mouth slightly in a natural talking position, using
only the existing palette colours. No other change — not even 1 pixel — should
differ from the input.

---

### Step 4 — Stitching (Python / PIL)

Resize all three frames to 1024×1024 and paste side by side into a 3072×1024 canvas.
Save as `CharacterName_Right.png`. Flip horizontally to produce `CharacterName_Left.png`.

```python
from PIL import Image
frames = [Image.open(p).convert("RGBA").resize((1024,1024)) for p in [idle, walk, talk]]
sheet = Image.new("RGBA", (3072, 1024), (255, 0, 255, 255))
for i, f in enumerate(frames): sheet.paste(f, (i*1024, 0))
sheet.save("CharacterName_Right.png")
sheet.transpose(Image.FLIP_LEFT_RIGHT).save("CharacterName_Left.png")
```

---

## Background Removal in the Engine

The game engine removes the chroma-key background at load time. The actual colour
produced by the model is **not** pure #FF00FF — it is closer to hot-pink
**RGB ≈ (233, 21, 140)**. Use these tolerant thresholds:

```
R >= 200  AND  G <= 50  AND  B >= 100
```

After keying, erode 1 px inward to eliminate residual fringing.