# Background Generation

## Style variants

The game uses two visual styles depending on the room. Pick the one that matches
existing rooms in the same area.

### Style A — Pixel art (original rooms)

```
Generate a 2D point-and-click pixel-art adventure game background in the style of
Maniac Mansion and Monkey Island.

GAME DESIGN REQUIREMENTS (IMPORTANT):
- Fixed side-on perspective with slight top-down angle (classic adventure game viewpoint)
- Camera is static
- Scene uses clear foreground, midground, and background layering
- The bottom 30–40% of the image is a completely open walkable area
- NO objects, furniture, decorations, shadows, or visual clutter in the bottom walkable area
- All interactive objects must be placed in the midground or background only
- Clean silhouette separation between objects
- Objects clearly readable at game resolution
- No extreme perspective distortion
- No dynamic lighting effects
- Even, soft ambient lighting
- 16:9 aspect ratio
- Highly detailed pixel art, but visually clean
- Inspired by classic LucasArts and Sierra adventure games
- No characters included — No UI elements — No text overlays

SCENE DESCRIPTION: [ADD SCENE DESCRIPTION]
```

### Style B — Flat cartoon (newer rooms, e.g. Wellness Suite)

```
STYLE:
- Clean flat cartoon illustration with bold, clear outlines — exactly like a modern
  LucasArts-style point-and-click adventure game (think Day of the Tentacle remastered,
  Thimbleweed Park)
- Flat colours with minimal shading; no painterly or photorealistic effects
- Rich, saturated palette with strong contrast between objects
- Every object is clearly readable and silhouette-distinct
- Fixed side-on perspective with a very slight top-down angle
- Consistent cool-tinted overhead fluorescent lighting
- 16:9 aspect ratio
- No characters, no UI elements
- In-scene text (signs, posters) is allowed and should be legible
- The bottom 30% of the image must be a COMPLETELY CLEAR open floor area —
  absolutely no objects, furniture, or clutter in this zone

SCENE DESCRIPTION: [ADD SCENE DESCRIPTION]
```

---

## Background variants

Always generate variants by **editing the base image** rather than regenerating from
scratch. This preserves visual consistency (colours, perspective, lighting).

Use `edit_image` (pass the base PNG + edit prompt):

| State change | Edit prompt |
|---|---|
| Remove pickable object | "Remove the [object] from the image. Keep everything else exactly the same." |
| Add object | "Add a [object] on [location]. Keep everything else exactly the same." |
| Open door / drawer | "Show the [door/drawer] open. Keep everything else exactly the same." |
| Reveal hidden content | "Make the [surface] clearly show [text/content]. Keep everything else exactly the same." |
| NPC mouth open | "Open the mouth of the character slightly, as if mid-speech. Keep everything else exactly the same." |

> **Tip:** The more specific the edit instruction, the better. Name the object
> precisely (e.g. "locker number 4" not "the locker") and describe the resulting
> state in detail.

---

## Hotspot coordinates

After generating a background, use `analyze_image` to get bounding boxes rather
than measuring manually:

```
Return the bounding box coordinates (x, y, width, height) of the following objects
in this image: [list of objects]. Return the result as JSON.
```

Use `response_mime_type="application/json"` with a `response_schema` for clean output.

> **Important:** The coordinates are relative to the image's native resolution, which
> may differ from the game's logical resolution (1376×768). Scale x and width by
> `game_width / image_width` before using them in code.