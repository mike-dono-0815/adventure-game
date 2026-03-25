#!/usr/bin/env python3
"""Generate remaining item sprites (skips already-existing files)."""
import sys, time
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
sys.path.insert(0, str(SCRIPT_DIR.parent.parent / "gemini-api"))
from generate_image import generate_image

ITEM_DIR = SCRIPT_DIR / "items"
ITEM_DIR.mkdir(exist_ok=True)

ITEM_STYLE = """\
STYLE:
- Single inventory icon for a classic point-and-click adventure game
- Clean flat cartoon illustration with bold dark outlines (Day of the Tentacle style)
- Limited, saturated colour palette, slightly exaggerated proportions
- Warm torchlight from upper-left (medieval dungeon aesthetic)
- PLAIN PURE WHITE background no shadows, no gradients, no other objects
- Object centred on a square canvas, generous white padding on all sides
- Worn, medieval feel
- No text, no UI frame, no extra objects -- just the ONE item

OBJECT TO DRAW:
"""

ITEMS = [
    ("rusty_nail",  "A single large iron nail, heavily rusted and corroded, rough orange-brown surface. Long, thick, and old."),
    ("bone",        "A single large animal leg bone (ham-hock style), cleanly gnawed, ivory-white with brown ends."),
    ("metal_file",  "A single flat metal hand-file tool -- rectangular, ridged grooves on the face, short wooden handle. Steel grey."),
    ("rope",        "A single coil of rough medieval hemp rope, loosely looped, natural tan-brown colour."),
    ("tin_cup",     "A single battered tin/metal cup, dented, old and worn, dull grey metal."),
    ("torch",       "A single medieval handheld torch -- wooden handle, burning cloth-and-tar head with bright orange-yellow flames."),
    ("guards_key",  "A single large ornate medieval iron key on a small iron ring. Heavy, black iron, decorative bow end."),
]

for item_id, description in ITEMS:
    target = ITEM_DIR / f"item_{item_id}.png"
    if target.exists():
        print(f"  Skipping {item_id} (exists)")
        continue
    print(f"  Generating {item_id} ...")
    for attempt in range(2):
        try:
            result = generate_image(prompt=ITEM_STYLE + description, aspect_ratio="1:1",
                                    output_dir=str(ITEM_DIR), output_filename=f"item_{item_id}")
            imgs = result.get("images", [])
            if imgs:
                p = Path(imgs[0])
                if p != target and p.exists():
                    p.rename(target)
                print(f"    -> {target}")
                break
        except Exception as e:
            print(f"    Error ({e}), retrying...")
            time.sleep(8)
    time.sleep(3)

print("Done.")
