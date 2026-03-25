# Inventory Object Generation

## Generating a single item (recommended)

Generate each item individually with `generate_image`, aspect_ratio="1:1".
This avoids the need to crop a sheet and gives cleaner results per item.

**Prompt template:**

```
STYLE:
- Single inventory icon for a classic point-and-click adventure game
- Clean flat cartoon illustration with bold outlines (Day of the Tentacle / Monkey Island style)
- Limited, saturated colour palette
- Slightly exaggerated proportions for readability at small sizes
- Warm lighting from the upper-left
- Plain white or very light neutral background (no drop shadow, no gradient)
- Object centred on a square canvas with generous padding
- Humorous, slightly cartoonish feel
- Office-themed adventure game aesthetic
- No text, no UI frame — just the object

OBJECT TO DRAW:
[ADD OBJECT DESCRIPTION]
```

Save output as `item_[id].png` in `./assets/items/` (or `./new-content/items/` for
new-room content). The engine displays items at 98×98 px, so keep designs bold and
readable at that size.

---

## Generating four items as a 2×2 sheet (alternative)

Use `generate_image` with aspect_ratio="1:1". Crop the four cells with PIL afterward.

```
Create a pixel-art sprite sheet showing four inventory objects for a classic 1990s
point-and-click adventure game (in the style of old LucasArts adventures).
The image should contain a 2×2 grid, with one object per cell. Each object should
be centered and clearly visible.

Style: retro pixel-art, clean outlines, limited colour palette, slightly exaggerated
shapes for readability at small sizes, plain neutral background, consistent lighting
and perspective, humorous and slightly cartoonish, crisp pixels (no smoothing).

Objects to include: [ADD 4 OBJECTS]
```

> **Note:** Individual generation (above) is preferred — the 2×2 approach sometimes
> produces uneven sizing or the model merges objects across cells.

---

## Known issues

- The model may occasionally return no image on the first attempt. Re-run the call;
  it usually succeeds on a second try.
- Output filenames from `generate_image` include a numeric suffix (e.g. `item_key_0_0.png`).
  Rename after generation if an exact filename is required.