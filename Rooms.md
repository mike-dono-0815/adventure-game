# Room Backgrounds — Image Reference

All rooms listed in order of appearance. Each needs a background image at **1344×768px** (game viewport resolution).

Bounding boxes use game coordinates: `[x, y, width, height]` — origin top-left, (0,0) is top-left of the viewport.

---

## `lobby` — Reception Lobby

A sterile, modern corporate lobby. Marble-effect floor, a large reception desk center-left with a computer and badge printer. A sleek coffee machine to the left. Fire alarm on the wall. Two large potted plants flanking a heavy security door on the left marked "AUTHORIZED PERSONNEL ONLY" with a card reader. An emergency procedure poster on the right wall. Security camera monitor mounted above the desk. Cool white lighting, the kind that makes everyone look slightly unwell. Amazon branding subtle but omnipresent.

| Object / Person | Bounding Box `[x, y, w, h]` |
|---|---|
| Security door (AUTHORIZED PERSONNEL ONLY) | `[48, 108, 294, 516]` |
| Potted plant — left | `[0, 392, 71, 263]` |
| Potted plant — right | `[1281, 392, 63, 259]` |
| Coffee machine (Barista Pro) | `[370, 260, 118, 200]` |
| Fire alarm (pull station) | `[527, 184, 104, 104]` |
| Security camera monitor | `[700, 72, 333, 150]` |
| Reception desk (full) | `[507, 307, 678, 174]` |
| Badge printer (on desk, left side) | `[507, 307, 130, 146]` |
| Papers on desk | `[656, 406, 69, 75]` |
| Reception computer (on desk, right side) | `[1044, 426, 141, 48]` |
| Emergency procedure poster | `[1094, 144, 164, 179]` |
| **Receptionist** (NPC, standing behind desk) | `[812, 323, 137, 151]` |

---

## `kitchen` — Office Kitchen

A utilitarian break room. Long counter along the back wall with a microwave, a drip coffee machine, and a kettle. A large fridge covered in passive-aggressive sticky notes. A small table with chairs nobody sits in comfortably. Overhead fluorescent lighting, one tube flickering. A whiteboard on the side wall reading "DAYS SINCE LAST KITCHEN INCIDENT: 0". Faint smell of reheated fish implied by the general atmosphere.

| Object / Person | Bounding Box `[x, y, w, h]` |
|---|---|
| Whiteboard ("DAYS SINCE INCIDENT: 0") | `[32, 118, 237, 263]` |
| Drip coffee machine | `[67, 270, 157, 159]` |
| Kitchen counter / base cabinets | `[392, 372, 438, 126]` |
| Microwave (on counter) | `[417, 266, 157, 94]` |
| Fridge (large, right wall) | `[1055, 140, 299, 381]` |
| Sticky notes on fridge | `[1061, 146, 179, 157]` |
| Frozen egg (inside fridge, visible when open) | `[1201, 377, 58, 40]` |
| Door to office (bottom centre) | `[304, 381, 335, 123]` |
| **HR Person** (NPC — appears after egg explosion) | `[790, 380, 90, 220]` |

---

## `office_space` — Open Plan Office

A wide open-plan office with rows of low-walled cubicles stretching back. Desks cluttered with monitors, coffee mugs, and the debris of corporate life. A cupboard against the right wall, slightly ajar. One motivational poster: "THINK OUTSIDE THE BOX — but stay inside the building." A printer station in the far-right corner. One desk occupied, one cleared and empty. Harsh overhead lighting. A general sense that nobody here has seen natural light in weeks.

| Object / Person | Bounding Box `[x, y, w, h]` |
|---|---|
| Whiteboard (Amazon buzzwords) | `[51, 91, 275, 180]` |
| Motivational poster ("THINK OUTSIDE THE BOX") | `[1024, 91, 107, 138]` |
| **Coworker** (NPC, seated at desk, headphones on) | `[140, 346, 165, 230]` |
| Headphones (on coworker's head) | `[168, 280, 67, 67]` |
| Coworker's desk | `[0, 483, 438, 235]` |
| Coffee mug (on empty desk) | `[336, 370, 36, 39]` |
| Printer / Photocopier | `[1036, 253, 169, 215]` |
| Empty desk (cleared nameplate) | `[431, 377, 384, 170]` |
| Cupboard / cabinet (right wall) | `[1267, 121, 62, 390]` |
| Winning Ugly book (auto-added to inventory when cupboard opened) | *(no hotspot)* |
| Door to kitchen (left wall) | `[256, 289, 56, 172]` |
| Door to IT department (right wall) | `[682, 251, 56, 172]` |
| Door to aisle (bottom centre) | `[304, 381, 335, 123]` |

---

## `it_department` — IT Department

A contained, slightly chaotic room carved out of the office floor. Server racks along the right wall, blinking with green and orange lights. Cables everywhere, loosely managed with zip ties. A wall of shame corkboard on the left — printed screenshots of terrible support tickets, each rated with a star. Chip's desk dominates the centre foreground, buried under three monitors. The glow of multiple screens. A pile of old CRT monitors stacked in the far-right corner.

| Object / Person | Bounding Box `[x, y, w, h]` |
|---|---|
| Wall of Shame (corkboard, left wall) | `[35, 90, 385, 305]` |
| **Chip** (NPC, seated at desk, intense) | `[610, 325, 170, 395]` |
| Chip's headphones (hanging on monitor, unused) | `[420, 235, 70, 90]` |
| Chip's monitor (top screen, 3-monitor workstation) | `[590, 140, 190, 105]` |
| Energy drink pyramid (desk) | `[505, 300, 85, 135]` |
| Server rack (right wall) | `[960, 85, 185, 500]` |
| Pile of old CRT monitors (far right) | `[1205, 255, 170, 420]` |
| Door to office (left wall) | `[0, 390, 70, 230]` |

---

## `aisle` — Office Aisle

A narrow corridor connecting the main office to the lab and elevator. Bare walls with a single overhead strip light. A heavy lab door with a keypad on the left, marked "CVNA Lab — Authorized Access Only". An elevator with brushed steel doors on the right. A small wall-mounted notice board with outdated announcements in the centre. The mystery package sits on the floor beneath the notice board.

| Object / Person | Bounding Box `[x, y, w, h]` |
|---|---|
| Lab door + keypad + sign (left wall) | `[56, 119, 318, 580]` |
| Notice board (centre wall) | `[575, 273, 220, 157]` |
| Amazon mystery package (floor) | `[790, 523, 122, 85]` |
| Door back to office (floor-level centre) | `[510, 590, 220, 60]` |
| Elevator (right wall, brushed steel) | `[1013, 141, 243, 586]` |

---

## `lab` — CVNA Lab

A large open lab space, brighter than the rest of the building. Long workbenches with equipment on the left. A large whiteboard on the right back wall, covered in sprint charts and an org diagram. To the centre, an unmistakable setup: a big monitor, two controllers on a desk, bean bags pulled up close — the FIFA station. A USB stick sits on the left workstation. Fluorescent lighting but cleaner than the office. An unlabeled experiment running in the corner that nobody acknowledges.

| Object / Person | Bounding Box `[x, y, w, h]` |
|---|---|
| Lab workstations (left side) | `[68, 380, 320, 280]` |
| USB stick (on left workstation) | `[155, 490, 80, 50]` |
| FIFA setup (large monitor + controllers, centre) | `[380, 200, 520, 380]` |
| Lab whiteboard (right wall) | `[870, 80, 300, 380]` |
| Beanbags (right area) | `[870, 520, 180, 200]` |
| Door to aisle (left wall) | `[0, 390, 70, 230]` |
| **FIFA Player 1** (NPC, seated at FIFA setup) | `[472, 448, 56, 112]` |
| **FIFA Player 2 / Chip** (NPC, seated, appears after distraction) | `[692, 448, 56, 112]` |

---

## `open_office` — HR Floor — Open Office

The HR department floor, floor 28. Identical in layout to a standard open-plan office but somehow more oppressive. Neutral colours, no personality. Motivational posters every few metres: "PEOPLE ARE OUR GREATEST ASSET." Rows of desks, most occupied by people who do not make eye contact. The stakeholder encounter triggers when the player walks left into the left zone. A corridor leads toward Bob's office beyond.

| Object / Person | Bounding Box `[x, y, w, h]` |
|---|---|
| Stakeholder encounter zone (left half, player walks into) | `[68, 570, 650, 190]` |
| **Stakeholder** (NPC, spawns from left, walks to centre) | *(spawned dynamically — positions ~x:560, y:680)* |

---

## `office` — Bob's Office

A private corner office, a rare thing in this building. A large desk with a computer, stacks of papers, and a nameplate: "BOB JOHNSON". A tall grey filing cabinet against the left wall. A bookshelf lined with Amazon internal frameworks. A large window behind the desk with a view of the city — the only natural light in the entire game. The room feels calmer than everywhere else, which is suspicious. A stress ball sits visibly on the desk.

| Object / Person | Bounding Box `[x, y, w, h]` |
|---|---|
| Bookshelf (left-centre wall) | `[210, 142, 140, 285]` |
| Filing cabinet (far left wall) | `[70, 332, 84, 237]` |
| Window (behind desk, city view) | `[560, 76, 224, 237]` |
| Bob's desk | `[420, 379, 420, 95]` |
| Computer (on desk) | `[595, 322, 84, 57]` |
| Nameplate "BOB JOHNSON" (on desk) | `[595, 370, 84, 19]` |
| Stress ball (on desk, left of computer) | `[560, 390, 55, 45]` |
| Pen (in open filing cabinet drawer — visible when open) | `[84, 417, 56, 19]` |
| Door out (right wall) | `[1120, 237, 112, 332]` |
| **Bob** (NPC, seated behind desk) | `[609, 415, 42, 106]` |
