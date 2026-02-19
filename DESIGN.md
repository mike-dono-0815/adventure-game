# The Separation Agreement
## Game Design Document v1.0

---

## 1. High Concept

A classic point-and-click adventure game set in the labyrinthine offices of **MegaCorp Inc.**, a soulless corporate behemoth. The player controls **Alex Deskworth**, a mid-level employee who has finally negotiated a Mutual Separation Agreement — their ticket to freedom — only for the signed contract to vanish into the bureaucratic abyss. Alex must navigate office politics, absurd corporate procedures, and passive-aggressive coworkers to recover the document before HR "loses" it permanently.

**Genre:** Comedy/Satire Point-and-Click Adventure
**Tone:** Dry humor, corporate satire (think Office Space meets Monkey Island)
**Scope:** 2-room demo (expandable)
**Death/Dead-ends:** None. The player can never die or reach an unwinnable state.

---

## 2. Technology Stack

### 2.1 Recommended Primary: Godot 4 (GDScript)

| Criteria              | Rating | Notes |
|-----------------------|--------|-------|
| Portability           | A+     | Exports to Windows, macOS, Linux natively |
| 2D Support            | A+     | Purpose-built 2D engine, pixel-perfect rendering |
| Non-programmer friendly | A    | Visual scene editor, GDScript is Python-like |
| Data-driven content   | A      | Native JSON parsing, resource system |
| Cost                  | Free   | MIT license, fully open source |
| Community             | A      | Large community, extensive docs, asset library |
| Save system           | A      | Built-in serialization, file I/O |

### 2.2 Alternative: Phaser 3 (JavaScript/TypeScript)

Would be the pick if browser deployment becomes a priority. Runs anywhere with a browser but requires Electron/Tauri wrapper for true desktop feel. Slightly harder for non-programmers to modify.

### 2.3 Decision: **Godot 4.x with GDScript**

Godot is the best fit because:
- The visual editor lets non-programmers place hotspots, adjust scenes visually
- GDScript reads like Python — approachable for content creators
- All game data (rooms, puzzles, dialogues) will live in **JSON files** editable with any text editor
- Single codebase exports to all desktop platforms with no changes
- No licensing fees, no royalties, no restrictions

---

## 3. Game Architecture

### 3.1 System Overview

```
+------------------------------------------------------------------+
|                         GAME WINDOW                               |
|  +------------------------------------------------------------+  |
|  |                                                            |  |
|  |                    ROOM VIEWPORT                           |  |
|  |              (Background + Hotspots +                      |  |
|  |               Characters + Walkable Area)                  |  |
|  |                                                            |  |
|  |                        [Alex]                              |  |
|  |                                                            |  |
|  +------------------------------------------------------------+  |
|  +------------------------------------------------------------+  |
|  |  VERB PANEL          |  INVENTORY BAR                      |  |
|  |                      |                                     |  |
|  |  Give    Pick Up     |  [item1] [item2] [item3] ...       |  |
|  |  Open    Look At     |                                     |  |
|  |  Close   Talk To     |  [<] scroll left  scroll right [>]  |  |
|  |  Use     Push        |                                     |  |
|  |  Pull                |                                     |  |
|  +------------------------------------------------------------+  |
|  [ Action Line: "Use stapler with filing cabinet"              ]  |
+------------------------------------------------------------------+
```

### 3.2 Screen Layout (1920x1080 target resolution)

| Region        | Position         | Size        | Purpose |
|---------------|-----------------|-------------|---------|
| Room Viewport | Top             | 1920 x 810  | Main game scene with background, characters, hotspots |
| Action Line   | Below viewport  | 1920 x 40   | Displays current action sentence (e.g., "Look at coffee mug") |
| Verb Panel    | Bottom-left     | 480 x 230   | 3x3 grid of verb buttons |
| Inventory     | Bottom-right    | 1440 x 230  | Scrollable row of inventory item thumbnails |

### 3.3 Resolution & Scaling

- **Design resolution:** 1920 x 1080
- **Scaling mode:** Maintain aspect ratio, letterbox on mismatch
- **Minimum supported:** 1280 x 720 (UI scales down proportionally)

---

## 4. Core Systems

### 4.1 Verb System

Nine verbs arranged in a 3-column, 3-row grid:

```
 Give    |  Open    |  Use
 Pick Up |  Close   |  Push
 Look At |  Talk To |  Pull
```

**Interaction Flow:**
1. Player clicks a verb (it highlights; default verb is "Walk To" which is implicit — clicking the scene without selecting a verb walks there)
2. Player clicks an object/hotspot in the scene OR an inventory item
3. For two-object verbs ("Use X with Y", "Give X to Y"), a second click target is required
4. The **Action Line** updates in real-time to show the forming sentence:
   - Click "Use" → `"Use ..."`
   - Hover over stapler → `"Use stapler with ..."`
   - Click filing cabinet → `"Use stapler with filing cabinet"`
5. Action executes, verb resets to default

**Two-Object Verbs:** Use, Give
**Single-Object Verbs:** Open, Close, Pick Up, Look At, Talk To, Push, Pull

**Fallback Responses:**
Every verb+object combination must produce *something*. If no specific response is scripted, a pool of generic humorous fallbacks plays:
- *Look At* (default): "It's a thing. In an office. How exciting."
- *Pick Up* (default): "Alex considers it, then remembers their back problems."
- *Talk To* (inanimate): "Alex whispers to it. It doesn't whisper back."
- *Push/Pull* (default): "It doesn't budge. Like Alex's career prospects."
- *Use* (nonsensical): "That makes about as much sense as the company org chart."

### 4.2 Inventory System

- Items displayed as **96x96 pixel thumbnails** in the bottom-right panel
- Scrollable left/right if more items than visible slots (~12 visible at once)
- **Left-click** an inventory item: selects it for use with the current verb
- Items can be **combined**: select "Use", click item A in inventory, click item B in inventory
- Inventory items have: `id`, `name`, `description`, `thumbnail_path`, `combinable_with[]`

### 4.3 Walking & Pathfinding

- Each room defines a **walkable area polygon** (or multiple polygons)
- Clicking in the room (with no verb selected) makes Alex walk to the clicked point
- Simple **A* or navigation polygon** pathfinding (Godot's NavigationRegion2D)
- Alex walks around obstacles, not through them
- Walking speed: ~200 pixels/second (adjustable per room in data)
- **Walk-to points:** Each hotspot defines a "stand here" position so Alex walks to a sensible spot before interacting

### 4.4 Dialogue System

Triggered by "Talk To" + a character. Dialogue is:
- **Branching tree** with multiple player choices
- Displayed as a **list of clickable options** replacing the bottom panel temporarily
- NPC response shown as text above their head or in a dialogue box
- Choices can be:
  - Always available
  - Conditionally shown (based on flags, inventory items, puzzle state)
  - One-time (disappear after selected)
  - "Exit conversation" always present

**Dialogue UI Layout (replaces bottom bar during conversation):**
```
+------------------------------------------------------------------+
|  NPC: "Have you tried turning it off and on again?"              |
|                                                                    |
|  > "I'm looking for my separation agreement."                     |
|  > "Who handles document filing around here?"                     |
|  > "Nice stapler. Is that a Swingline?"           [conditional]   |
|  > "Never mind."                                   [exit]         |
+------------------------------------------------------------------+
```

### 4.5 Puzzle & State System

The game tracks state through a **flag dictionary** — a flat key-value store:

```json
{
  "talked_to_receptionist": true,
  "has_keycard": true,
  "filing_cabinet_unlocked": false,
  "printer_jammed": true,
  "coffee_given_to_bob": false
}
```

Puzzles are defined by **preconditions** (flags/inventory that must be true) and **effects** (flags set, items given/removed, room changes). This system is entirely data-driven (see Section 6).

### 4.6 Save/Load System

- **8 save slots** with:
  - Slot name (player-editable)
  - Timestamp
  - Thumbnail (screenshot of current room)
  - Current room ID
  - All flags
  - Inventory contents
  - Dialogue state (which lines have been seen)
- Saved as **JSON files** in user data directory
- Save/Load accessible via top menu bar or keyboard shortcut (F5 save, F9 load, Escape menu)

---

## 5. Demo Content — Two Rooms

### 5.1 Room 1: The Reception Lobby

**Description:** A sterile corporate lobby with motivational posters ("Synergy!", "Think Outside the Box... But Stay Inside the Building"), a reception desk, uncomfortable chairs, a water cooler, and a locked door leading to the office floor.

**Background:** High-res photograph/illustration of a modern corporate lobby.

**Hotspots:**

| Hotspot            | Look At | Pick Up | Use | Talk To | Open | Other |
|--------------------|---------|---------|-----|---------|------|-------|
| Reception Desk     | "A fortress of bureaucracy." | — | — | — | "There's nothing to open here." | — |
| Receptionist (Karen) | "She looks like she's had enough of everyone." | — | — | *Starts dialogue tree* | — | — |
| Motivational Poster | "Synergy: because none of us is as dumb as all of us." | "It's screwed to the wall. Like Alex." | — | — | — | — |
| Water Cooler       | "The heart of office gossip." | — | Use with empty mug → fills mug | — | — | — |
| Visitor Badge (on desk) | "A visitor badge. It says 'HELLO MY NAME IS... irrelevant.'" | *Pick up → inventory* | — | — | — | — |
| Office Door        | "A door to the office floor. It needs a keycard." | — | Use keycard → unlocks & transitions to Room 2 | — | "It's locked." | — |
| Uncomfortable Chair | "Designed to make you leave faster." | "It's bolted down. Like morale." | Sit → "Alex sits. Nothing happens. Classic." | — | — | Push: "It's bolted to the floor." |
| Coffee Mug (on side table) | "An empty mug that says 'I Survived Another Meeting That Could Have Been An Email.'" | *Pick up → inventory* | — | — | — | — |

**Characters:**
- **Karen the Receptionist** — guards the lobby, won't let Alex through without proper authorization. Dialogue reveals that Alex needs a visitor badge (even though they're an employee) because "the system shows you as already separated."

**Puzzle Chain (Room 1):**
1. Talk to Karen → learn you need a badge AND a signed form
2. Pick up visitor badge from desk (Karen is distracted by phone)
3. Pick up empty coffee mug
4. Use mug with water cooler → get full mug (inventory item changes)
5. Give full mug to Karen → she steps away to microwave it (wants it hot)
6. While Karen is away, pick up the keycard from behind the desk (newly accessible hotspot)
7. Use keycard on office door → transition to Room 2

### 5.2 Room 2: The Open-Plan Office

**Description:** A soul-crushing open-plan office with cubicles, a printer/copier station, a filing cabinet wall, Bob from Accounting at his desk, and a shredder ominously humming in the corner. Alex's old desk is here too, already cleared out with a sad empty nameplate.

**Background:** High-res photograph/illustration of a modern open-plan office.

**Hotspots:**

| Hotspot              | Look At | Pick Up | Use | Other |
|----------------------|---------|---------|-----|-------|
| Alex's Old Desk      | "Already cleared out. That was fast." | "There's nothing left." | — | Open drawer → find sticky note with filing code |
| Bob from Accounting  | "Bob. He knows where everything is filed." | — | — | Talk To → dialogue tree |
| Printer/Copier       | "It's jammed. As is tradition." | — | Use → "It's jammed." / Use paperclip → unjam it | — |
| Filing Cabinet (locked) | "Rows and rows of employee files." | — | Use filing code → opens specific drawer | Open: "It's locked with a combination." |
| Shredder             | "It hums menacingly. How many dreams has it eaten?" | — | Use separation agreement → BAD ENDING (comic, not death) / Use junk mail → shreds it | — |
| Junk Mail (on desk)  | "An invitation to the company picnic. Hard pass." | *Pick up* | — | — |
| Paperclip (floor)    | "A paperclip. The universal office tool." | *Pick up* | — | — |
| Whiteboard           | "It says 'DAYS SINCE LAST INCIDENT: 0'. Concerning." | — | — | — |
| Exit Door            | "Back to the lobby." | — | → transitions to Room 1 | — |

**Characters:**
- **Bob from Accounting** — friendly but scatterbrained. Knows the filing system but will only help if Alex fixes the printer (he needs to print something urgently).

**Puzzle Chain (Room 2):**
1. Look at Alex's old desk → open drawer → find sticky note with partial filing code
2. Talk to Bob → he knows the rest of the code, but needs the printer fixed first
3. Pick up paperclip from floor
4. Use paperclip on printer → unjams it
5. Talk to Bob again → he gives the full filing code
6. Use filing code on filing cabinet → cabinet opens, Alex retrieves the Separation Agreement
7. **DEMO ENDS** — Victory screen: "Alex clutches the agreement triumphantly. Freedom is just an HR approval away... in the full game."

### 5.3 Puzzle Dependency Graph

```
Room 1:                          Room 2:

Pick up mug ──┐                  Open desk drawer ──── Get partial code
              v                                              |
Fill at cooler                   Pick up paperclip           |
    │                                │                       |
    v                                v                       |
Give to Karen                    Fix printer                 |
    │                                │                       |
    v                                v                       |
Pick up keycard                  Talk to Bob ────────────────┘
    │                                │
    v                                v
Open office door ──────────>     Use code on cabinet
                                     │
                                     v
                                 GET AGREEMENT → WIN
```

---

## 6. Data-Driven Content Format

All game content is defined in JSON files. Non-programmers edit these files to create rooms, puzzles, and dialogue. The game engine reads them at startup.

### 6.1 Directory Structure

```
project/
├── game/                        # Godot project
│   ├── engine/                  # Game engine scripts (programmers only)
│   │   ├── room_loader.gd
│   │   ├── verb_system.gd
│   │   ├── inventory_system.gd
│   │   ├── dialogue_system.gd
│   │   ├── save_system.gd
│   │   ├── state_manager.gd
│   │   └── pathfinding.gd
│   ├── scenes/                  # Godot scene files
│   └── ui/                      # UI scenes and themes
│
├── content/                     # ALL GAME CONTENT (non-programmers edit here)
│   ├── game.json                # Global settings, starting state
│   ├── rooms/
│   │   ├── lobby.json           # Room 1 definition
│   │   └── office.json          # Room 2 definition
│   ├── dialogues/
│   │   ├── karen.json           # Karen's dialogue tree
│   │   └── bob.json             # Bob's dialogue tree
│   ├── items/
│   │   └── items.json           # All inventory item definitions
│   ├── puzzles/
│   │   └── interactions.json    # All verb+object interactions & combinations
│   └── assets/
│       ├── backgrounds/         # Room background images (1920x810 PNG/JPG)
│       ├── characters/          # Character sprites/spritesheets
│       ├── items/               # Inventory thumbnails (96x96 PNG)
│       └── ui/                  # UI elements, verb icons
│
├── docs/
│   ├── DESIGN.md                # This document
│   └── CONTENT_GUIDE.md         # How to author content (for non-programmers)
│
└── saves/                       # Player save files (generated at runtime)
```

### 6.2 Room Definition Format

```json
// content/rooms/lobby.json
{
  "id": "lobby",
  "name": "Reception Lobby",
  "background": "assets/backgrounds/lobby.jpg",
  "music": null,
  "walk_area": {
    "polygons": [
      [[100, 500], [1800, 500], [1800, 780], [100, 780]]
    ]
  },
  "player_start": { "x": 960, "y": 700 },
  "hotspots": [
    {
      "id": "reception_desk",
      "name": "reception desk",
      "region": { "type": "rect", "x": 800, "y": 200, "w": 320, "h": 250 },
      "walk_to": { "x": 900, "y": 500 },
      "interactions": {
        "look_at": {
          "response": "A fortress of bureaucracy."
        },
        "pick_up": {
          "response": "It's way too heavy and Alex isn't paid enough for manual labor."
        }
      }
    },
    {
      "id": "office_door",
      "name": "office door",
      "region": { "type": "rect", "x": 1600, "y": 150, "w": 200, "h": 400 },
      "walk_to": { "x": 1550, "y": 500 },
      "interactions": {
        "look_at": {
          "response": "A door to the office floor. It needs a keycard."
        },
        "open": {
          "conditions": [{ "flag": "has_keycard", "value": false }],
          "response": "It's locked. A keycard reader blinks red mockingly."
        },
        "use_item": {
          "keycard": {
            "conditions": [],
            "response": "The light turns green. Freedom! Well, more office. But still.",
            "effects": [
              { "type": "set_flag", "flag": "office_unlocked", "value": true },
              { "type": "transition", "room": "office", "entry_point": "from_lobby" }
            ]
          }
        }
      }
    },
    {
      "id": "visitor_badge",
      "name": "visitor badge",
      "region": { "type": "rect", "x": 850, "y": 280, "w": 60, "h": 40 },
      "walk_to": { "x": 870, "y": 500 },
      "visible_when": [{ "flag": "karen_away", "value": false }],
      "interactions": {
        "look_at": {
          "response": "A visitor badge. It says 'HELLO MY NAME IS... irrelevant.'"
        },
        "pick_up": {
          "response": "Alex pockets the badge. Employee for 5 years and now a 'visitor.'",
          "effects": [
            { "type": "add_item", "item": "visitor_badge" },
            { "type": "remove_hotspot", "hotspot": "visitor_badge" }
          ]
        }
      }
    }
  ],
  "characters": [
    {
      "id": "karen",
      "name": "Karen",
      "position": { "x": 960, "y": 450 },
      "sprite": "assets/characters/karen.png",
      "dialogue": "dialogues/karen.json",
      "interactions": {
        "look_at": {
          "response": "She looks like she's had enough of everyone. Fair."
        },
        "talk_to": {
          "action": "start_dialogue",
          "dialogue_id": "karen"
        },
        "give_item": {
          "mug_full": {
            "response": "\"Oh, thanks! Let me go microwave this. Don't touch anything.\"",
            "effects": [
              { "type": "remove_item", "item": "mug_full" },
              { "type": "set_flag", "flag": "karen_away", "value": true },
              { "type": "show_hotspot", "hotspot": "keycard_behind_desk" }
            ]
          }
        }
      }
    }
  ],
  "entry_points": {
    "default": { "x": 200, "y": 700 },
    "from_office": { "x": 1550, "y": 500 }
  }
}
```

### 6.3 Dialogue Definition Format

```json
// content/dialogues/karen.json
{
  "id": "karen",
  "start_node": "greeting",
  "nodes": {
    "greeting": {
      "npc_text": "Welcome to MegaCorp. Do you have an appointment?",
      "choices": [
        {
          "text": "I work here. Or... worked here. It's complicated.",
          "next": "work_here",
          "show_once": false
        },
        {
          "text": "I'm looking for my Mutual Separation Agreement.",
          "next": "agreement",
          "conditions": []
        },
        {
          "text": "Nice weather we're having.",
          "next": "weather",
          "show_once": true
        },
        {
          "text": "Never mind.",
          "next": null
        }
      ]
    },
    "work_here": {
      "npc_text": "The system says you've already been separated. So technically, you're a visitor. Do you have a visitor badge?",
      "effects": [
        { "type": "set_flag", "flag": "knows_needs_badge", "value": true }
      ],
      "choices": [
        {
          "text": "That's absurd. I just need to get to my desk.",
          "next": "absurd"
        },
        {
          "text": "Fine. Where do I get a badge?",
          "next": "badge_info"
        },
        {
          "text": "Never mind.",
          "next": null
        }
      ]
    },
    "agreement": {
      "npc_text": "A separation agreement? Those go through Filing. Which is past the office door. Which you need a keycard for. Which you don't have because you've been separated. Catch-22. Gotta love corporate.",
      "effects": [
        { "type": "set_flag", "flag": "talked_to_receptionist", "value": true }
      ],
      "choices": [
        {
          "text": "There has to be another way.",
          "next": "another_way"
        },
        {
          "text": "Never mind.",
          "next": null
        }
      ]
    },
    "weather": {
      "npc_text": "I wouldn't know. This building doesn't have windows. 'Open floor plan' they said. 'Natural light' they said.",
      "choices": [
        {
          "text": "Back to business...",
          "next": "greeting"
        }
      ]
    }
  }
}
```

### 6.4 Inventory Item Definition Format

```json
// content/items/items.json
{
  "items": [
    {
      "id": "mug_empty",
      "name": "empty coffee mug",
      "description": "A mug that says 'I Survived Another Meeting That Could Have Been An Email.' Currently empty, like Alex's soul.",
      "thumbnail": "assets/items/mug_empty.png"
    },
    {
      "id": "mug_full",
      "name": "full coffee mug",
      "description": "A mug full of water cooler water. Lukewarm, like management's support.",
      "thumbnail": "assets/items/mug_full.png"
    },
    {
      "id": "keycard",
      "name": "office keycard",
      "description": "Karen's keycard. It has a photo of her cat on it.",
      "thumbnail": "assets/items/keycard.png"
    },
    {
      "id": "visitor_badge",
      "name": "visitor badge",
      "description": "A badge that says VISITOR. Alex's new identity.",
      "thumbnail": "assets/items/visitor_badge.png"
    },
    {
      "id": "paperclip",
      "name": "paperclip",
      "description": "A humble paperclip. The Swiss Army knife of the office world.",
      "thumbnail": "assets/items/paperclip.png"
    },
    {
      "id": "sticky_note",
      "name": "sticky note",
      "description": "A sticky note with '4-7-...' written on it. The rest is smudged.",
      "thumbnail": "assets/items/sticky_note.png"
    },
    {
      "id": "separation_agreement",
      "name": "Mutual Separation Agreement",
      "description": "THE document. Signed, sealed, and almost delivered.",
      "thumbnail": "assets/items/agreement.png"
    }
  ],
  "combinations": [
    {
      "item_a": "mug_empty",
      "use_with": "water_cooler_hotspot",
      "type": "item_on_hotspot",
      "result_text": "Alex fills the mug. The water is exactly room temperature. Depressing.",
      "effects": [
        { "type": "replace_item", "remove": "mug_empty", "add": "mug_full" }
      ]
    }
  ]
}
```

### 6.5 Global Game Configuration

```json
// content/game.json
{
  "title": "The Separation Agreement",
  "version": "0.1.0-demo",
  "resolution": { "width": 1920, "height": 1080 },
  "starting_room": "lobby",
  "starting_inventory": [],
  "starting_flags": {
    "talked_to_receptionist": false,
    "knows_needs_badge": false,
    "karen_away": false,
    "has_keycard": false,
    "printer_fixed": false,
    "has_filing_code": false,
    "office_unlocked": false,
    "game_complete": false
  },
  "default_responses": {
    "look_at": [
      "It's a thing. In an office. How exciting.",
      "Alex stares at it. It doesn't stare back.",
      "Remarkably unremarkable."
    ],
    "pick_up": [
      "Alex considers it, then remembers their back problems.",
      "That seems like it belongs where it is.",
      "Alex's pockets aren't that big."
    ],
    "use": [
      "That makes about as much sense as the company org chart.",
      "Nothing happens. Much like Alex's last performance review.",
      "Nope."
    ],
    "open": [
      "It doesn't open.",
      "That's not something that opens. Or closes. It just... is."
    ],
    "close": [
      "It's not open. Like Alex's career options.",
      "Can't close what isn't open."
    ],
    "talk_to": [
      "Alex whispers to it. It doesn't whisper back.",
      "It's not much of a conversationalist.",
      "The silence is deafening. And expected."
    ],
    "give": [
      "Alex isn't feeling that generous.",
      "Nobody wants that."
    ],
    "push": [
      "It doesn't budge. Like Alex's career prospects.",
      "Pushing things around won't solve anything. HR said that too."
    ],
    "pull": [
      "It stays put. Some things just can't be moved.",
      "Alex pulls. Nothing happens. Story of their life."
    ]
  },
  "save_slots": 8
}
```

---

## 7. Player Character

### 7.1 Alex Deskworth

- **Appearance:** Business casual. Slightly rumpled. Carries a messenger bag.
- **Sprite:** Side-view, ~150px tall. Idle animation (breathing/shifting weight). Walk cycle (8 frames). 4 directions (left, right, toward camera, away).
- **Personality:** Dry wit, resigned but determined. Comments on everything with quiet sarcasm. Not mean — just tired.

### 7.2 Character Rendering

- Alex is rendered as a **sprite overlay** on top of the background
- Y-sorting ensures Alex appears behind/in front of objects correctly
- Scale factor can vary per room (closer = larger for perspective)

---

## 8. UI Design

### 8.1 Verb Panel

- 3x3 grid of text buttons styled as retro terminal/monospace text
- Colors: Dark background (#1a1a2e), highlighted verb in cyan (#00d4ff), default text in light gray (#cccccc)
- Selected verb stays highlighted until action completes or is cancelled
- Right-click anywhere = cancel current action, reset to default

### 8.2 Inventory Panel

- Dark background matching verb panel
- Items shown as 96x96 thumbnails in a horizontal row
- Left/right arrow buttons for scrolling when >12 items
- Hovering an item shows its name in the Action Line
- Selected item gets a glowing border

### 8.3 Action Line

- Single line of text between viewport and bottom panels
- Shows the constructed sentence in real-time: `"Use [paperclip] with [printer]"`
- Font: Monospace or pixel-style, ~20px, white on dark background

### 8.4 Dialogue UI

- Replaces the entire bottom bar when in conversation
- NPC text at top of the dialogue area, player choices listed below
- Choices are clickable text lines with hover highlight
- "Never mind" / exit option always at bottom

### 8.5 Save/Load Menu

- Accessible via Escape key or menu button
- Shows 8 save slots in a grid
- Each slot shows: thumbnail, slot name, timestamp
- Empty slots show "Empty Slot"
- Buttons: Save, Load, Delete, Cancel

---

## 9. Art Direction & Asset Strategy

### 9.1 Visual Style

- **Backgrounds:** High-resolution photographs or realistic illustrations of office environments
- **Characters:** Illustrated/stylized sprites that contrast slightly with photographic backgrounds (gives a charming, slightly surreal quality — like the character doesn't quite belong in this corporate world, which fits the theme)
- **UI:** Clean, dark theme with monospace fonts. Subtle corporate aesthetic (think internal company app design)

### 9.2 Free Asset Sources

| Asset Type     | Recommended Sources |
|----------------|-------------------|
| Backgrounds    | Unsplash, Pexels, Pixabay (free high-res photos of offices, lobbies) — composite/edit as needed |
| Character Sprites | OpenGameArt.org, itch.io free assets, or generate with AI tools |
| Item Icons     | Game-icons.net (CC BY 3.0), Flaticon (free tier with attribution) |
| UI Elements    | Kenney.nl (CC0 UI packs), custom-made in Godot |
| Fonts          | Google Fonts (Press Start 2P for retro, or IBM Plex Mono for corporate) |

### 9.3 Asset Pipeline

1. Source free images from above sites (respect licenses — document in CREDITS.md)
2. Edit backgrounds to add/remove elements as needed for hotspot placement
3. Create character sprites (or use a character generator tool)
4. Create item thumbnails at 96x96 from found icons
5. All assets stored in `content/assets/` and referenced by relative path in JSON

---

## 10. Controls

| Input              | Action |
|--------------------|--------|
| Left-click (scene) | Walk to point / interact with hotspot (if verb selected) |
| Left-click (verb)  | Select verb |
| Left-click (inventory item) | Select item for current verb |
| Right-click        | Cancel current action, reset to Walk mode |
| Escape             | Open pause/save menu |
| F5                 | Quick save (slot 1) |
| F9                 | Quick load (slot 1) |
| Scroll wheel       | Scroll inventory left/right |
| Double-click (scene exit) | Skip walk animation, instant room transition |

---

## 11. Future Expansion (Post-Demo)

These features are **not** in the demo but the architecture should support them:

- **Additional rooms:** HR office, break room, server room, parking garage, CEO's suite
- **More characters:** IT guy, passive-aggressive HR rep, mysterious janitor who knows everything
- **Cutscenes:** Simple animated sequences between acts
- **Sound:** Background music, sound effects, voice acting
- **Multiple endings:** Depending on choices and puzzle solutions
- **Timed events:** Optional "Karen returns in 60 seconds" pressure moments
- **Localization:** All text in JSON → easy to add translation files

---

## 12. Development Milestones

### Milestone 1: Engine Core
- Room rendering (background + hotspots)
- Player character walking + pathfinding
- Verb panel UI + action line
- Click detection on hotspots

### Milestone 2: Interaction System
- Verb + object interaction processing
- JSON content loading
- Default fallback responses
- Inventory system (add, remove, display, scroll)
- Item combination logic

### Milestone 3: Dialogue & State
- Dialogue tree system
- Flag/state management
- Conditional hotspot visibility
- Room transitions

### Milestone 4: Save/Load & Polish
- Save/load system (8 slots)
- Pause menu
- Action line sentence building
- Edge cases and QA

### Milestone 5: Content — Demo Rooms
- Room 1 (Lobby) — background, hotspots, Karen dialogue, puzzles
- Room 2 (Office) — background, hotspots, Bob dialogue, puzzles
- All inventory items and thumbnails
- Victory screen
- Playtesting and puzzle balance

---

*Document version: 1.0*
*Last updated: 2026-02-13*
