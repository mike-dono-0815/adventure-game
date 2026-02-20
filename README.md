# The Separation Agreement

A classic point-and-click adventure game set in the soul-crushing offices of **Amazon Inc.**

You play as **Alex Deskworth**, a mid-level employee who has finally negotiated a Mutual Separation Agreement — their ticket to freedom — only for the signed contract to vanish into the bureaucratic abyss. Navigate office politics, absurd corporate procedures, and passive-aggressive coworkers to recover the document before HR "loses" it permanently.

**Genre:** Comedy/Satire Point-and-Click Adventure
**Tone:** Dry humor and corporate satire (think *Office Space* meets *Monkey Island*)
**Scope:** 2-room demo (expandable)

---

## How to Play

### Requirements

- Python 3 (to run the local web server)
- A modern browser (Chrome, Firefox, Edge)

### Starting the Game

The game loads assets via `fetch()`, which browsers block when opening files directly. You must serve the game from a local HTTP server.

**1. Open a terminal in the project folder:**

```bash
cd path/to/adventure-game
```

**2. Start the Python server:**

```bash
python -m http.server 8080
```

**3. Open your browser and go to:**

```
http://localhost:8080
```

The game will start in the building lobby. Keep the terminal open while playing.

---

## Controls

| Input | Action |
|---|---|
| Left-click (scene) | Walk to point / interact with hotspot |
| Left-click (verb panel) | Select a verb |
| Left-click (inventory) | Select an item |
| Right-click | Cancel current action |
| Scroll wheel | Scroll inventory |
| Escape | Pause / save menu |
| F5 | Quick save |
| F9 | Quick load |

---

## Verb System

Nine verbs are available in the bottom-left panel:

```
Give    |  Open    |  Use
Pick Up |  Close   |  Push
Look At |  Talk To |  Pull
```

Click a verb, then click a hotspot or inventory item to act. Two-object verbs (Use, Give) require a second click. The **Action Line** shows the forming sentence in real time.

---

## Rooms

### Room 1 — Building Entrance (Lobby)

A sterile corporate lobby with a reception desk, a Barista Pro coffee machine, a security monitor, and an emergency fire alarm. The receptionist guards the only door inside.

**Puzzle goal:** Get past the receptionist and through the locked personnel door.

### Room 2 — Open-Plan Office

A soul-crushing open-plan office with cubicles, a filing cabinet, and Bob from Accounting at his desk.

**Puzzle goal:** Talk to Bob, retrieve the Separation Agreement from the filing cabinet, find a pen, sign it, and hand it over.

---

## Inventory Items

| Item | Description |
|---|---|
| Cappuccino | Brewed from the lobby coffee machine. The receptionist has opinions about her coffee. |
| Visitor Badge | Grants access through secured doors. |
| Cup of Coffee | Black, no sugar. Just how Bob likes it. |
| Separation Agreement | The document. Just needs a signature. |
| Pen | Found in the filing cabinet. Perfect for signing legal documents. |
| Signed Agreement | The finished document. Time to make it official. |

---

## Project Structure

```
adventure-game/
├── index.html              # Entry point
├── css/
│   └── style.css
├── js/                     # Game engine (Vanilla JS, ES5)
│   ├── main.js             # Game loop
│   ├── loader.js           # Asset loading
│   ├── renderer.js         # Canvas rendering
│   ├── input.js            # Mouse/keyboard input
│   ├── room.js             # Room management
│   ├── player.js           # Player character
│   ├── interaction.js      # Verb + hotspot logic
│   ├── dialogue.js         # Dialogue tree system
│   ├── inventory.js        # Inventory system
│   ├── pathfinding.js      # A* walkable area pathfinding
│   ├── effects.js          # Effect runner (say, transition, flags, items)
│   ├── state.js            # Game flag state
│   ├── saveload.js         # Save/load system
│   └── ...
├── content/                # All game data — edit here to author content
│   ├── game.json           # Global settings and starting flags
│   ├── rooms/
│   │   ├── lobby.json
│   │   └── office.json
│   ├── dialogues/
│   │   ├── karen.json
│   │   ├── bob.json
│   │   └── coffee_machine.json
│   └── items/
│       └── items.json
└── assets/
    └── backgrounds/
        └── Reception.png
```

---

## Technology

- **Pure HTML5 Canvas + Vanilla JavaScript (ES5)** — no frameworks, no build tools
- **Data-driven content** — all rooms, dialogues, puzzles, and items are defined in JSON files
- **Branching dialogue trees** with conditional choices based on game flags
- **Flag-based state system** for tracking puzzle progress
- **8-slot save system** using browser `localStorage`
- **No-walk room mode** for fixed-camera scenes (lobby uses this)

---

## Content Authoring

All game content lives in `content/`. No programming knowledge required to add or edit:

- **New room:** add `content/rooms/<id>.json` and register it in `js/loader.js`
- **New dialogue:** add `content/dialogues/<id>.json` and register it in `js/loader.js`
- **New item:** add an entry to `content/items/items.json`
- **New flags:** initialise them in `content/game.json` → `starting_flags`

See `DESIGN.md` for the full content format specification.
