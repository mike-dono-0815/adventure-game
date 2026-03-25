#!/usr/bin/env python3
"""
Generate all visual assets for the Wellness Suite (gym) room.

Outputs:
  new-content/backgrounds/Gym.*                   — base background
  new-content/backgrounds/Gym_LockerOpen.*        — locker #4 open variant
  new-content/backgrounds/Gym_WhiteboardRevealed.*— whiteboard chalk-reveal variant
  new-content/items/item_locker_key.*             — key on "4" fob
  new-content/items/item_chalk_block.*            — chalk cube
  new-content/items/item_torn_note.*              — half a torn sticky note
"""

import sys
import time
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
sys.path.insert(0, str(SCRIPT_DIR.parent.parent / "gemini-api"))

from generate_image import generate_image
from google import genai
from google.genai import types

BG_DIR   = SCRIPT_DIR / "backgrounds"
ITEM_DIR = SCRIPT_DIR / "items"

# ---------------------------------------------------------------------------
# Style preamble (matches the existing game's actual art style)
# ---------------------------------------------------------------------------
STYLE = """
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
"""

# ---------------------------------------------------------------------------
# Base scene description
# ---------------------------------------------------------------------------
BASE_SCENE = """
SCENE: The "Obscura Corp Wellness Suite" — a depressing, underfunded corporate gym.

LAYOUT (described left → right):

LEFT WALL:
  - Exit door with a small numeric keypad mounted on the wall beside it (right of the door)
  - A small hook next to the door; hanging from it is a key on a plastic numbered fob
    showing "4"

LEFT FLOOR AREA:
  - A weight rack holding mismatched dumbbells
  - A small cube of white chalk sitting on the weight rack's shelf

BACK WALL (centre-left):
  - Three treadmills in a row against the back wall
  - The middle treadmill has a paper "OUT OF ORDER" note taped to its display screen

CENTRE (ceiling):
  - A heavy punching bag hanging from a ceiling mount
  - The punching bag has a faded "OBSCURA CORP" logo printed on it

BACK WALL (centre-right):
  - A whiteboard; the text on it is worn and barely legible — smudged and faded,
    clearly once said something but is now unreadable

RIGHT WALL:
  - A row of six numbered metal gym lockers
  - Locker number 4 is clearly labeled; all lockers are closed

RIGHT CORNER:
  - A water cooler
  - A bench with a gym bag resting on it

WALLS:
  - Motivational corporate posters; one clearly reads "PERFORMANCE IS A CHOICE"

CEILING:
  - Harsh fluorescent strip lights; one tube is slightly darker / dim

FLOOR:
  - Scuffed linoleum tiles
  - The bottom 30% of the image must be a COMPLETELY CLEAR open floor area —
    absolutely no objects, furniture, or clutter in this zone
"""

# ---------------------------------------------------------------------------
# Helper: edit an existing image
# ---------------------------------------------------------------------------
def edit_image(prompt: str, source: Path, dest_stem: Path) -> Path | None:
    client = genai.Client()
    mime  = "image/jpeg" if source.suffix.lower() in (".jpg", ".jpeg") else "image/png"
    parts = [
        types.Part(inline_data=types.Blob(mime_type=mime, data=source.read_bytes())),
        types.Part(text=prompt),
    ]
    config = types.GenerateContentConfig(
        response_modalities=["TEXT", "IMAGE"],
        image_config=types.ImageConfig(aspect_ratio="16:9"),
    )
    response = client.models.generate_content(
        model="gemini-2.5-flash-image",
        contents=[types.Content(role="user", parts=parts)],
        config=config,
    )
    for candidate in response.candidates:
        for part in candidate.content.parts:
            if part.inline_data and part.inline_data.mime_type.startswith("image/"):
                ext  = part.inline_data.mime_type.split("/")[-1]
                out  = dest_stem.with_suffix(f".{ext}")
                out.parent.mkdir(parents=True, exist_ok=True)
                out.write_bytes(part.inline_data.data)
                print(f"  Saved: {out}")
                return out
    print(f"  WARNING: no image returned for {dest_stem.name}")
    return None


# ---------------------------------------------------------------------------
# Helper: generate a single inventory item sprite
# ---------------------------------------------------------------------------
ITEM_STYLE = """
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
"""

def generate_item(description: str, filename: str) -> None:
    prompt = f"{ITEM_STYLE}\nOBJECT TO DRAW:\n{description}"
    result = generate_image(
        prompt=prompt,
        aspect_ratio="1:1",
        output_dir=str(ITEM_DIR),
        output_filename=filename,
    )
    if result["images"]:
        print(f"  Saved: {result['images'][0]}")
    else:
        print(f"  WARNING: no image returned for {filename}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    BG_DIR.mkdir(parents=True, exist_ok=True)
    ITEM_DIR.mkdir(parents=True, exist_ok=True)

    # ------------------------------------------------------------------
    # 1. Base background
    # ------------------------------------------------------------------
    print("\n[1/6] Base background — Gym")
    result = generate_image(
        prompt=STYLE + BASE_SCENE,
        aspect_ratio="16:9",
        output_dir=str(BG_DIR),
        output_filename="Gym",
    )
    base = result["images"][0] if result["images"] else None
    if not base:
        print("ERROR: base background failed — aborting variants.")
        return
    time.sleep(3)

    # ------------------------------------------------------------------
    # 2. Locker open variant
    # ------------------------------------------------------------------
    print("\n[2/6] Background variant — Gym_LockerOpen")
    edit_image(
        prompt=(
            "Swing locker #4's door open so the interior is visible. "
            "Inside the locker place a small gym bag; a torn sticky note is "
            "visible sticking out of the bag's side pocket — only the left half "
            "of the note is shown, the right edge is ripped off. "
            "Keep everything else in the image exactly the same."
        ),
        source=base,
        dest_stem=BG_DIR / "Gym_LockerOpen",
    )
    time.sleep(3)

    # ------------------------------------------------------------------
    # 3. Whiteboard revealed variant
    # ------------------------------------------------------------------
    print("\n[3/6] Background variant — Gym_WhiteboardRevealed")
    edit_image(
        prompt=(
            "Make the whiteboard text fully legible, as though chalk dust has "
            "been rubbed across it to reveal the worn writing underneath. "
            "The whiteboard should now clearly read: "
            "\"DAVE'S SQUAT PB: 225 kg — absolute unit\" "
            "in faded dry-erase marker. "
            "Keep everything else in the image exactly the same."
        ),
        source=base,
        dest_stem=BG_DIR / "Gym_WhiteboardRevealed",
    )
    time.sleep(3)

    # ------------------------------------------------------------------
    # 4. Item: locker_key
    # ------------------------------------------------------------------
    print("\n[4/6] Item sprite — item_locker_key")
    generate_item(
        description=(
            "A small, slightly worn metal gym locker key attached to a rectangular "
            "plastic key fob. The fob is dark grey and has the number '4' printed "
            "on it in white. The key hangs from a short metal ring."
        ),
        filename="item_locker_key",
    )
    time.sleep(3)

    # ------------------------------------------------------------------
    # 5. Item: chalk_block
    # ------------------------------------------------------------------
    print("\n[5/6] Item sprite — item_chalk_block")
    generate_item(
        description=(
            "A small cube of white weightlifting / gymnastics chalk. "
            "Slightly dusty and chalky, with a few crumbles broken off one corner. "
            "Powdery white texture, faintly off-white in the shadows."
        ),
        filename="item_chalk_block",
    )
    time.sleep(3)

    # ------------------------------------------------------------------
    # 6. Item: torn_note
    # ------------------------------------------------------------------
    print("\n[6/6] Item sprite — item_torn_note")
    generate_item(
        description=(
            "Half of a torn yellow sticky note (Post-it). The right edge is "
            "cleanly ripped away. The remaining left half shows handwritten text "
            "in messy blue biro: '...code is my squat PB. I wrote it on the...' "
            "— the sentence trails off at the torn edge. "
            "Slightly crumpled, faint ruled lines on the paper."
        ),
        filename="item_torn_note",
    )

    print("\n=== All assets generated. ===")
    print(f"  Backgrounds : {BG_DIR}")
    print(f"  Items       : {ITEM_DIR}")


if __name__ == "__main__":
    main()
