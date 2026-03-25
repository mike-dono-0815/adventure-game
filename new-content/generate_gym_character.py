#!/usr/bin/env python3
"""
Generate GymUser sprite sheet using the CharacterAnimationGeneration.md template.

Strategy for consistency:
  1. Generate the IDLE frame (1:1 aspect ratio)
  2. Edit the idle frame → WALK frame  (same character, mid-stride)
  3. Edit the idle frame → TALK frame  (same character, mouth open only)
  4. Stitch all 3 frames into GymUser_Right.png (3072×1024)
  5. Flip horizontally → GymUser_Left.png
"""

import sys
import time
from pathlib import Path
from PIL import Image

SCRIPT_DIR = Path(__file__).parent
sys.path.insert(0, str(SCRIPT_DIR.parent.parent / "gemini-api"))

from generate_image import generate_image
from google import genai
from google.genai import types

CHAR_DIR    = SCRIPT_DIR / "characters"
FRAMES_DIR  = CHAR_DIR / "frames"

# ---------------------------------------------------------------------------
# Character design  (replaces [ADD CHARACTER DESIGN] in the template)
# ---------------------------------------------------------------------------
CHARACTER_DESIGN = """\
A young adult gym-goer, gender-neutral athletic build. Medium height, lean and sporty.
Wearing: grey fitted athletic shorts (knee-length), a bright cobalt-blue sleeveless
athletic tank top with a small white logo on the chest, white ankle socks, and white
trainers/sneakers with a blue sole.
Short, slightly tousled dark brown hair. Warm light-brown skin tone.
Friendly, slightly wry smile. Big expressive eyes. Casual, confident stance.
No accessories. No gym equipment in hand.
"""

# ---------------------------------------------------------------------------
# Frame generation prompts (template text from CharacterAnimationGeneration.md)
# ---------------------------------------------------------------------------
STYLE_HEADER = """\
Pixel art sprite sheet for a classic 1990s point-and-click adventure game.

CRITICAL BACKGROUND REQUIREMENT: The entire background MUST be filled with solid,
uniform magenta (#FF00FF, RGB 255,0,255). No white, no grey, no gradient — pure
flat magenta everywhere outside the character. This is a chroma-key background for
easy removal in the game engine.

No text, no UI, no background elements, no shadows outside the character.
No anti-aliasing. No motion blur. Crisp pixel edges. Even neutral lighting.
Consistent light source. The character must NOT use magenta anywhere in their
clothing, skin, eyes, or hair.

All frames must share:
-- Identical pixel size and sprite dimensions
-- Identical color palette (no new colors across frames)
-- Identical shading technique and number of colors
-- Identical lighting and level of detail
-- The same artist, same session feel

"""

IDLE_PROMPT = (
    STYLE_HEADER
    + "Draw ONLY a single IDLE/STAND frame:\n"
    + "Character stands upright facing right, neutral relaxed posture, arms loosely at "
    + "sides. Friendly, cheerful expression. Mouth closed. Centered on a square canvas "
    + "with generous magenta (#FF00FF) padding on all sides.\n\n"
    + "CHARACTER:\n" + CHARACTER_DESIGN
)

WALK_EDIT_PROMPT = (
    "This is a pixel-art character sprite on a magenta (#FF00FF) background. "
    "Keep EVERY detail -- proportions, clothing colours, hairstyle, face, pixel palette "
    "-- EXACTLY the same. The background MUST remain solid flat magenta (#FF00FF). "
    "Do NOT change the background to any other colour.\n\n"
    "Apply ONE change only: convert the stance to a mid-stride WALK pose facing right. "
    "One leg forward, one leg back. The opposite arm swings forward naturally. Movement "
    "should be subtle and readable at small sizes. All other details are identical."
)

TALK_EDIT_PROMPT = (
    "This is a pixel-art character sprite on a magenta (#FF00FF) background. "
    "Keep EVERY detail -- proportions, clothing colours, hairstyle, face, body position, "
    "pixel palette -- EXACTLY the same. The background MUST remain solid flat magenta "
    "(#FF00FF). Do NOT change the background to any other colour.\n\n"
    "Apply ONE change only: open the mouth slightly in a natural talking position, using "
    "only the existing palette colours. No other change -- not even 1 pixel -- should "
    "differ from the input."
)

# ---------------------------------------------------------------------------
# Helper: edit an existing image (returns saved Path or None)
# ---------------------------------------------------------------------------
def edit_image(prompt: str, source: Path, dest: Path) -> Path | None:
    client = genai.Client()
    mime   = "image/jpeg" if source.suffix.lower() in (".jpg", ".jpeg") else "image/png"
    parts  = [
        types.Part(inline_data=types.Blob(mime_type=mime, data=source.read_bytes())),
        types.Part(text=prompt),
    ]
    config = types.GenerateContentConfig(
        response_modalities=["TEXT", "IMAGE"],
        image_config=types.ImageConfig(aspect_ratio="1:1"),
    )
    response = client.models.generate_content(
        model="gemini-2.5-flash-image",
        contents=[types.Content(role="user", parts=parts)],
        config=config,
    )
    for candidate in response.candidates:
        for part in candidate.content.parts:
            if part.inline_data and part.inline_data.mime_type.startswith("image/"):
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_bytes(part.inline_data.data)
                print(f"  Saved: {dest}")
                return dest
    print(f"  WARNING: no image returned for {dest.name}")
    return None


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    CHAR_DIR.mkdir(parents=True, exist_ok=True)
    FRAMES_DIR.mkdir(parents=True, exist_ok=True)

    # ------------------------------------------------------------------
    # 1. Generate IDLE frame
    # ------------------------------------------------------------------
    print("\n[1/5] Generating IDLE frame …")
    result = generate_image(
        prompt=IDLE_PROMPT,
        aspect_ratio="1:1",
        output_dir=str(FRAMES_DIR),
        output_filename="gym_user_idle",
    )
    idle_path = Path(result["images"][0]) if result.get("images") else None
    if not idle_path or not idle_path.exists():
        print("ERROR: idle frame failed — aborting.")
        return
    print(f"  Idle frame: {idle_path}")
    time.sleep(4)

    # ------------------------------------------------------------------
    # 2. Edit idle → WALK frame
    # ------------------------------------------------------------------
    print("\n[2/5] Editing idle -> WALK frame ...")
    walk_path = FRAMES_DIR / "gym_user_walk.png"
    walk_result = edit_image(WALK_EDIT_PROMPT, idle_path, walk_path)
    if not walk_result:
        # Retry once
        print("  Retrying walk frame …")
        time.sleep(6)
        walk_result = edit_image(WALK_EDIT_PROMPT, idle_path, walk_path)
    time.sleep(4)

    # ------------------------------------------------------------------
    # 3. Edit idle → TALK frame
    # ------------------------------------------------------------------
    print("\n[3/5] Editing idle -> TALK frame ...")
    talk_path = FRAMES_DIR / "gym_user_talk.png"
    talk_result = edit_image(TALK_EDIT_PROMPT, idle_path, talk_path)
    if not talk_result:
        print("  Retrying talk frame …")
        time.sleep(6)
        talk_result = edit_image(TALK_EDIT_PROMPT, idle_path, talk_path)

    # ------------------------------------------------------------------
    # 4. Stitch frames into 3072×1024 sprite sheet (Right-facing)
    # ------------------------------------------------------------------
    print("\n[4/5] Stitching frames into GymUser_Right.png ...")
    frames = []
    for p in [idle_path, walk_result or walk_path, talk_result or talk_path]:
        if p and Path(p).exists():
            img = Image.open(p).convert("RGBA")
            frames.append(img.resize((1024, 1024), Image.LANCZOS))
        else:
            print(f"  WARNING: missing frame {p}, using blank")
            frames.append(Image.new("RGBA", (1024, 1024), (255, 255, 255, 255)))

    sheet_right = Image.new("RGBA", (3072, 1024), (255, 255, 255, 255))
    for i, frame in enumerate(frames):
        sheet_right.paste(frame, (i * 1024, 0))

    right_path = CHAR_DIR / "GymUser_Right.png"
    sheet_right.save(right_path)
    print(f"  Saved: {right_path}")

    # ------------------------------------------------------------------
    # 5. Flip horizontally → Left-facing sheet
    # ------------------------------------------------------------------
    print("\n[5/5] Flipping -> GymUser_Left.png ...")
    sheet_left = sheet_right.transpose(Image.FLIP_LEFT_RIGHT)
    left_path  = CHAR_DIR / "GymUser_Left.png"
    sheet_left.save(left_path)
    print(f"  Saved: {left_path}")

    print("\n=== Character sprites generated. ===")
    print(f"  Right sheet : {right_path}  ({sheet_right.width}×{sheet_right.height})")
    print(f"  Left  sheet : {left_path}   ({sheet_left.width}×{sheet_left.height})")


if __name__ == "__main__":
    main()
