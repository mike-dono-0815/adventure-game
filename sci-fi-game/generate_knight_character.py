#!/usr/bin/env python3
"""
Generate Knight character sprite sheets for "Escape the Jail".
Strategy: generate IDLE (1:1, magenta bg), edit -> WALK, edit -> TALK,
stitch into 3072x1024 Knight_Right.png, flip -> Knight_Left.png.
"""
import sys, time
from pathlib import Path
from PIL import Image

SCRIPT_DIR = Path(__file__).parent
sys.path.insert(0, str(SCRIPT_DIR.parent.parent / "gemini-api"))

from generate_image import generate_image
from google import genai
from google.genai import types

CHAR_DIR   = SCRIPT_DIR / "characters"
FRAMES_DIR = CHAR_DIR / "frames"
CHAR_DIR.mkdir(parents=True, exist_ok=True)
FRAMES_DIR.mkdir(parents=True, exist_ok=True)

CHARACTER_DESIGN = """\
A medieval prisoner, formerly a knight. Medium compact athletic build.
Wearing: a torn grey linen tunic with a frayed brown leather belt,
dark brown breeches tucked into worn knee-high leather boots with tarnished buckles.
A small faded lion-rampant emblem on the chest of the tunic.
Short dark brown hair, 3-4 days of stubble on a strong jaw.
Determined, slightly defiant expression. No armour, no weapons. Facing RIGHT.\
"""

STYLE_HEADER = """\
Character sprite for a point-and-click adventure game in the style of
Day of the Tentacle / Thimbleweed Park:
- Clean flat cartoon illustration with bold dark outlines
- Smooth cel-shaded colours, NO pixel art, NO pixel grid
- Rich saturated palette, slightly exaggerated proportions
- Warm torchlight from upper-left, cool shadow on the right
- Consistent with a medieval dungeon painted background

CRITICAL BACKGROUND: The ENTIRE background MUST be solid flat magenta
(#FF00FF, RGB 255 0 255). No white, no grey, no gradient anywhere outside the
character. This is a chroma-key colour for background removal.
The character must NOT use magenta or hot-pink anywhere in clothing, skin, eyes, or hair.

No text, no UI, no background elements, no cast shadows outside the character silhouette.

"""

IDLE_PROMPT = (
    STYLE_HEADER
    + "Draw ONE single IDLE/STAND frame:\n"
    + "Character stands upright facing right, arms loosely at sides, "
    + "determined expression, mouth closed. Centered on a square canvas "
    + "with generous magenta padding on all sides.\n\n"
    + "CHARACTER:\n" + CHARACTER_DESIGN
)

WALK_EDIT = (
    "This is a pixel-art character sprite on a magenta (#FF00FF) background. "
    "Keep EVERY detail -- proportions, clothing colours, hairstyle, face, "
    "pixel palette -- EXACTLY the same. Background MUST stay solid flat magenta. "
    "Do NOT change it.\n\n"
    "ONE change only: convert to a mid-stride WALK pose facing right. "
    "One leg forward, one back. Opposite arm swings forward. Subtle movement. "
    "All other details identical."
)

TALK_EDIT = (
    "This is a pixel-art character sprite on a magenta (#FF00FF) background. "
    "Keep EVERY detail -- proportions, clothing, hairstyle, face, body position, "
    "pixel palette -- EXACTLY the same. Background MUST stay solid flat magenta. "
    "Do NOT change it.\n\n"
    "ONE change only: open the mouth slightly in a natural talking position "
    "using only existing palette colours. Nothing else changes."
)


def edit_image(prompt, source, dest):
    client = genai.Client()
    parts = [
        types.Part(inline_data=types.Blob(mime_type="image/png", data=source.read_bytes())),
        types.Part(text=prompt),
    ]
    config = types.GenerateContentConfig(
        response_modalities=["TEXT", "IMAGE"],
        image_config=types.ImageConfig(aspect_ratio="1:1"),
    )
    resp = client.models.generate_content(
        model="gemini-2.5-flash-image",
        contents=[types.Content(role="user", parts=parts)],
        config=config,
    )
    for cand in resp.candidates:
        for part in cand.content.parts:
            if part.inline_data and part.inline_data.mime_type.startswith("image/"):
                dest.write_bytes(part.inline_data.data)
                print(f"  Saved: {dest}")
                return dest
    print("  WARNING: no image returned")
    return None


def main():
    print("\n[1/5] Generating IDLE frame ...")
    result = generate_image(
        prompt=IDLE_PROMPT, aspect_ratio="1:1",
        output_dir=str(FRAMES_DIR), output_filename="knight_idle",
    )
    idle_path = next(FRAMES_DIR.glob("knight_idle*.png"), None)
    if not idle_path:
        print("ERROR: idle frame failed.")
        return
    print(f"  Idle: {idle_path}")
    time.sleep(4)

    print("\n[2/5] Editing idle -> WALK ...")
    walk_path = FRAMES_DIR / "knight_walk.png"
    if not edit_image(WALK_EDIT, idle_path, walk_path):
        time.sleep(6)
        edit_image(WALK_EDIT, idle_path, walk_path)
    time.sleep(4)

    print("\n[3/5] Editing idle -> TALK ...")
    talk_path = FRAMES_DIR / "knight_talk.png"
    if not edit_image(TALK_EDIT, idle_path, talk_path):
        time.sleep(6)
        edit_image(TALK_EDIT, idle_path, talk_path)

    print("\n[4/5] Stitching -> Knight_Right.png ...")
    frames = []
    for p in [idle_path, walk_path, talk_path]:
        if Path(p).exists():
            frames.append(Image.open(p).convert("RGBA").resize((1024, 1024), Image.LANCZOS))
        else:
            print(f"  Missing {p}, using blank")
            frames.append(Image.new("RGBA", (1024, 1024), (255, 0, 255, 255)))
    sheet = Image.new("RGBA", (3072, 1024), (255, 0, 255, 255))
    for i, f in enumerate(frames):
        sheet.paste(f, (i * 1024, 0))
    right_path = CHAR_DIR / "Knight_Right.png"
    sheet.save(right_path)
    print(f"  Saved: {right_path}")

    print("\n[5/5] Flipping -> Knight_Left.png ...")
    left_path = CHAR_DIR / "Knight_Left.png"
    sheet.transpose(Image.FLIP_LEFT_RIGHT).save(left_path)
    print(f"  Saved: {left_path}")

    print("\n=== Knight sprites generated ===")

if __name__ == "__main__":
    main()
