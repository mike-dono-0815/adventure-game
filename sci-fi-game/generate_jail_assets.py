#!/usr/bin/env python3
"""
Generate all visual assets for "Escape the Jail".

Backgrounds:
  Jail.png           — base scene
  Jail_StoneOpen.png — loose stone pushed aside (dark cavity visible)
  Jail_BarFiled.png  — one iron bar bent outward creating a gap

Items (8):
  item_bread, item_rusty_nail, item_bone, item_metal_file,
  item_rope, item_tin_cup, item_torch, item_guards_key
"""
import sys, time
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
sys.path.insert(0, str(SCRIPT_DIR.parent.parent / "gemini-api"))

from generate_image import generate_image
from google import genai
from google.genai import types

BG_DIR   = SCRIPT_DIR / "backgrounds"
ITEM_DIR = SCRIPT_DIR / "items"
BG_DIR.mkdir(parents=True, exist_ok=True)
ITEM_DIR.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# Background prompts
# ---------------------------------------------------------------------------

BASE_BG_PROMPT = """\
STYLE:
- Clean flat cartoon illustration with bold outlines, like Day of the Tentacle
  remastered or Thimbleweed Park — modern LucasArts point-and-click style
- Flat colours with minimal shading; no painterly or photorealistic effects
- Rich saturated palette; strong contrast between every object
- Warm orange torchlight from the RIGHT, cool blue shadow on the LEFT near the bars
- Fixed side-on perspective with a slight top-down angle, camera is static
- 16:9 aspect ratio
- No characters, no UI, no text overlays
- THE BOTTOM 30% OF THE IMAGE IS COMPLETELY CLEAR OPEN STONE FLOOR — absolutely
  no objects, clutter, or furniture in this zone

SCENE — interior of a medieval stone prison cell, viewed from INSIDE the cell:

LEFT 20% OF IMAGE (x 0-275px): Heavy iron prison bars running from ceiling to
  floor. A large iron-barred CELL DOOR is set into the bars (with a padlock visible).
  Beyond the bars, a dimly lit stone corridor is visible. A FAT SLEEPING GUARD
  is slumped in a wooden chair just outside the bars — helmet askew, mouth open,
  snoring. A large iron KEY RING hangs visibly from his belt buckle.

BACK WALL (centre, x 30-90%): Rough grey stone blocks. A sturdy WOODEN BENCH
  is fixed to the wall at x ~45-60%. A round stale BREAD LOAF sits on the bench.

LOOSE STONE: At approximately x=55%, y=38% from top — one stone block in the
  back wall looks slightly different: lighter colour, newer mortar edges. Subtle
  but visible.

RIGHT BACK WALL (x 72-82%, mid-height): An iron TORCH SCONCE holding a burning
  torch with warm flame. This is the main light source on the right side.

RIGHT BACK WALL (x 78-88%, just below torch): An iron WALL HOOK with a coil of
  rough ROPE hanging from it.

RIGHT SIDE (x 85-95%, near back wall, above floor): A wooden BUCKET on the floor
  against the wall. Next to it on the floor: a battered TIN CUP.

LEFT-CENTRE (x 18-30%, against left wall near bars): A small pile of DAMP HAY
  against the wall — slightly above the walkable floor zone.

FLOOR: Worn dark stone cobbles. The bottom 30% is completely clear.\
"""

STONE_OPEN_EDIT = """\
This is a medieval prison cell illustration. Make ONE change only:

Show the LOOSE STONE (the slightly-different stone block at approximately x=55%,
y=38% from top in the back wall) pushed to one side, revealing a small dark
rectangular CAVITY in the wall. The cavity is dark inside. The displaced stone
can be seen leaning beside the hole.

Keep EVERYTHING ELSE pixel-perfect identical: the sleeping guard, key ring, bread,
bench, torch, rope hook, bucket, tin cup, hay pile, iron bars, all colours,
all lighting.\
"""

BAR_FILED_EDIT = """\
This is a medieval prison cell illustration. Make ONE change only:

Show ONE iron bar in the left cell door bent outward at mid-height, creating a
narrow gap — just wide enough to reach an arm through. The bar is clearly bent
and shows bright metal where it was filed. The bend is obvious and readable.

Keep EVERYTHING ELSE pixel-perfect identical: the sleeping guard, key ring, bread,
bench, torch, rope hook, bucket, tin cup, hay pile, all other bars, all colours,
all lighting.\
"""

# ---------------------------------------------------------------------------
# Item prompts
# ---------------------------------------------------------------------------

ITEM_STYLE = """\
STYLE:
- Single inventory icon for a classic point-and-click adventure game
- Clean flat cartoon illustration with bold dark outlines (Day of the Tentacle style)
- Limited, saturated colour palette, slightly exaggerated proportions
- Warm torchlight from upper-left (medieval dungeon aesthetic)
- PLAIN PURE WHITE background — no shadows, no gradients, no other objects
- Object centred on a square canvas, generous white padding on all sides
- Worn, medieval feel — nothing is pristine or modern
- No text, no UI frame, no extra objects — just the ONE item

OBJECT TO DRAW:
"""

ITEMS = [
    ("bread",       "A single round stale medieval bread loaf, slightly crusty and misshapen. "
                    "Viewed from a slight angle above. Hard and dense."),
    ("rusty_nail",  "A single large iron nail, heavily rusted and corroded, rough orange-brown "
                    "surface. Long, thick, and old. Viewed from a slight angle."),
    ("bone",        "A single large animal leg bone (like a ham-hock), cleanly gnawed, "
                    "ivory-white with brown ends. Viewed from a slight angle."),
    ("metal_file",  "A single flat metal hand-file tool for filing metal — rectangular, "
                    "ridged parallel grooves on the face, wooden handle at one end. "
                    "Steel grey. Viewed from a slight angle."),
    ("rope",        "A single coil of rough medieval hemp rope, loosely looped, natural "
                    "tan-brown colour. Viewed from slightly above."),
    ("tin_cup",     "A single battered tin/metal cup, dented on one side, old and worn, "
                    "no handle or a small handle. Dull grey metal. Viewed from a slight angle."),
    ("torch",       "A single medieval handheld torch — short wooden handle, burning "
                    "cloth-and-tar wrapped head with bright orange-yellow flames and "
                    "dark smoke wisps. Viewed from a slight angle."),
    ("guards_key",  "A single large ornate medieval iron key on a small iron ring. "
                    "Heavy, black iron, with a decorative bow end. Viewed from a slight angle."),
]

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def edit_image(prompt, source, dest, aspect="16:9"):
    client = genai.Client()
    parts = [
        types.Part(inline_data=types.Blob(mime_type="image/png", data=source.read_bytes())),
        types.Part(text=prompt),
    ]
    config = types.GenerateContentConfig(
        response_modalities=["TEXT", "IMAGE"],
        image_config=types.ImageConfig(aspect_ratio=aspect),
    )
    response = client.models.generate_content(
        model="gemini-2.5-flash-image",
        contents=[types.Content(role="user", parts=parts)],
        config=config,
    )
    for candidate in response.candidates:
        for part in candidate.content.parts:
            if part.inline_data and part.inline_data.mime_type.startswith("image/"):
                dest.write_bytes(part.inline_data.data)
                print(f"  Saved: {dest}")
                return dest
    print(f"  WARNING: no image returned for {dest.name}")
    return None

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    # ── Base background ─────────────────────────────────────────────────────
    print("\n[BG 1/3] Generating base background Jail.png ...")
    result = generate_image(
        prompt=BASE_BG_PROMPT,
        aspect_ratio="16:9",
        output_dir=str(BG_DIR),
        output_filename="Jail",
    )
    imgs = result.get("images", [])
    if not imgs:
        print("ERROR: base background failed. Aborting.")
        return
    jail_path = Path(imgs[0])
    target = BG_DIR / "Jail.png"
    if jail_path != target and jail_path.exists():
        jail_path.rename(target)
    jail_path = target
    print(f"  Base: {jail_path}")
    time.sleep(5)

    # ── Stone-open variant ──────────────────────────────────────────────────
    print("\n[BG 2/3] Generating Jail_StoneOpen.png ...")
    stone_path = BG_DIR / "Jail_StoneOpen.png"
    r = edit_image(STONE_OPEN_EDIT, jail_path, stone_path)
    if not r:
        print("  Retrying ...")
        time.sleep(6)
        edit_image(STONE_OPEN_EDIT, jail_path, stone_path)
    time.sleep(5)

    # ── Bar-filed variant ───────────────────────────────────────────────────
    print("\n[BG 3/3] Generating Jail_BarFiled.png ...")
    bar_path = BG_DIR / "Jail_BarFiled.png"
    r = edit_image(BAR_FILED_EDIT, jail_path, bar_path)
    if not r:
        print("  Retrying ...")
        time.sleep(6)
        edit_image(BAR_FILED_EDIT, jail_path, bar_path)
    time.sleep(4)

    # ── Items ───────────────────────────────────────────────────────────────
    for i, (item_id, description) in enumerate(ITEMS):
        print(f"\n[Item {i+1}/{len(ITEMS)}] {item_id} ...")
        prompt = ITEM_STYLE + description
        result = generate_image(
            prompt=prompt,
            aspect_ratio="1:1",
            output_dir=str(ITEM_DIR),
            output_filename=f"item_{item_id}",
        )
        imgs = result.get("images", [])
        target = ITEM_DIR / f"item_{item_id}.png"
        if imgs:
            p = Path(imgs[0])
            if p != target and p.exists():
                p.rename(target)
            print(f"  Saved: {target}")
        else:
            print(f"  WARNING: no image, retrying ...")
            time.sleep(4)
            result2 = generate_image(
                prompt=prompt, aspect_ratio="1:1",
                output_dir=str(ITEM_DIR), output_filename=f"item_{item_id}",
            )
            imgs2 = result2.get("images", [])
            if imgs2:
                p = Path(imgs2[0])
                if p != target and p.exists():
                    p.rename(target)
                print(f"  Saved (retry): {target}")
        time.sleep(3)

    print("\n=== All assets generated ===")

if __name__ == "__main__":
    main()
