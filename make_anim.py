"""
Generate a side-by-side animated GIF of the player character,
using the same per-frame centre-of-mass alignment as the game engine.

Left column  : talking animation  (stand ↔ talk frame)
Right column : walking animation  (stand ↔ walk frame)
"""

from PIL import Image
import numpy as np

SPRITE = "assets/characters/User_Right.png"
OUT    = "player_animation.gif"

sheet = Image.open(SPRITE).convert("RGBA")
W, H  = sheet.size       # 1380 x 752
fw    = W // 3           # 460  — one frame width

# ── Extract the three source frames ──────────────────────────────────────────
stand = sheet.crop((0,      0, fw,     H))
walk  = sheet.crop((fw,     0, fw * 2, H))
talk  = sheet.crop((fw * 2, 0, W,      H))

# ── Centre-of-mass alignment (mirrors loader.js analyzeFrameBoundsForSheet) ──
# cx = (mean x of non-transparent pixels) / fw   → fraction [0, 1]
def get_cx(frame):
    arr   = np.array(frame)           # H × fw × 4
    alpha = arr[:, :, 3]              # alpha channel
    mask  = alpha > 10
    xs    = np.where(mask)[1]         # x-coords of visible pixels
    return float(xs.mean()) / fw if len(xs) else 0.5

cx_stand = get_cx(stand)
cx_walk  = get_cx(walk)
cx_talk  = get_cx(talk)

# ── Per-column canvas sizing ──────────────────────────────────────────────────
# Each frame is drawn so its cx lands on a shared anchor_x:
#   paste_x = anchor_x - cx * fw
# We need enough space on both sides for every frame in that column.
def column_layout(cx_list):
    """Return (canvas_width, anchor_x) for a set of frames with given cx values."""
    left  = max(cx * fw for cx in cx_list)        # max space needed left of anchor
    right = max((1 - cx) * fw for cx in cx_list)  # max space needed right of anchor
    w     = int(np.ceil(left + right))
    return w, int(np.round(left))

col_w_talk, anchor_talk = column_layout([cx_stand, cx_talk])
col_w_walk, anchor_walk = column_layout([cx_stand, cx_walk])

GAP      = 40
canvas_w = col_w_talk + GAP + col_w_walk
canvas_h = H

# ── Frame sequence (150 ms / frame) ──────────────────────────────────────────
# Walk alternates every frame (150 ms).
# Talk alternates every 3 frames (~450 ms ≈ in-game ~500 ms).
#
# frame : talk-col   walk-col
#   0   :  stand      stand
#   1   :  stand      walk
#   2   :  stand      stand
#   3   :  talk       walk
#   4   :  talk       stand
#   5   :  talk       walk

sequence = [
    (stand, cx_stand,  stand, cx_stand),
    (stand, cx_stand,  walk,  cx_walk),
    (stand, cx_stand,  stand, cx_stand),
    (talk,  cx_talk,   walk,  cx_walk),
    (talk,  cx_talk,   stand, cx_stand),
    (talk,  cx_talk,   walk,  cx_walk),
]

DURATION_MS = 150
BG          = (255, 255, 255, 255)   # white

frames = []
for talk_img, t_cx, walk_img, w_cx in sequence:
    canvas = Image.new("RGBA", (canvas_w, canvas_h), BG)

    # Left column — talking
    px_talk = int(anchor_talk - t_cx * fw)
    canvas.paste(talk_img, (px_talk, 0), talk_img)

    # Right column — walking
    px_walk = col_w_talk + GAP + int(anchor_walk - w_cx * fw)
    canvas.paste(walk_img, (px_walk, 0), walk_img)

    frames.append(canvas.convert("RGB"))

frames[0].save(
    OUT,
    save_all=True,
    append_images=frames[1:],
    duration=DURATION_MS,
    loop=0,
    optimize=False,
)
print(f"Saved {OUT}  ({canvas_w}×{canvas_h} px, {len(frames)} frames @ {DURATION_MS} ms)")
print(f"cx — stand: {cx_stand:.3f}  walk: {cx_walk:.3f}  talk: {cx_talk:.3f}")
print(f"Talk col: {col_w_talk}px (anchor {anchor_talk})  Walk col: {col_w_walk}px (anchor {anchor_walk})")
