# The Separation Agreement — Game Design

## Concept

You are an Amazon employee who has negotiated a Mutual Separation Agreement (MSA), but HR can't locate it. Goal: find the agreement and escape the office without being fired, while interacting with quirky coworkers and solving puzzles.

**Tone:** Satirical, absurd, slightly surreal office humor.
**Puzzle focus:** Inventory-based and lateral thinking / misdirection.

---

## Room Structure & Flow

```
LOBBY (reception)
  └─ Fire alarm puzzle → enter building
       │
       ▼
  ┌─────────────────────────────────────────┐
  │           BUILDING INTERIOR              │
  │                                          │
  │  KITCHEN ── OFFICE SPACE ── IT DEPT     │
  │                                          │
  │              AISLE                       │
  │           ┌────┴────┐                   │
  │        LAB DOOR   ELEVATOR              │
  └─────────────────────────────────────────┘
               │             │
              LAB         (floor 28)
                               │
                          OPEN OFFICE
                          (Wordfight)
                               │
                          BOB'S OFFICE
                             (WIN)
```

---

## Room 1: Lobby (Reception) ✅ IMPLEMENTED

**Puzzle chain:**
1. Talk to receptionist (Karen) — learn you need authorization to enter
2. Use coffee machine — order a cappuccino via dialogue
3. Give cappuccino to Karen — she's distracted
4. Pull fire alarm — emergency protocol forces her to escort you inside
5. Enter building

**Note:** The security camera monitor already seeds the IT department: *"the IT department — extension 204. Looks quiet in there."*

---

## Room 2: Kitchen

**Key hotspots:** Fridge, microwave, coffee machine.

**Fridge contents:**
- Leftovers with passive-aggressive note: *"DO NOT EAT — Karen — Day 47"*
- A sad desk salad
- A frozen egg (fridge set too cold — note on door: *"I LIKE IT COLD — Dave"*)

**Puzzle chain:**
1. Open fridge → pick up frozen egg
   - `Look at egg`: *"It's frozen solid. If I put this in the microwave it'll just sit there. I need to thaw it first."*
2. Use coffee machine → get **cup of terrible filter coffee** (inventory item)
3. **Combine: frozen egg + hot coffee** → **thawed egg**
   - *"You lower the egg into the coffee. It's not dignified. After a moment, the egg bobs to the surface, thawed and ready for its destiny. The coffee is now undrinkable. Not that it was before."*
4. Use thawed egg in microwave → **explosion**
   - *"BOOM. The microwave door blows open. The kitchen fills with the smell of existential dread and sulphur. Thirty seconds later, an HR person marches in."*
5. HR person enters — brisk, lanyard-heavy, thousand-yard stare
   - `Look at HR person`: *"Their business card is clipped to their lanyard: 'Amazon HR — Floor 2_' — the second digit is smudged with what might be egg."*
   - `Talk to HR person`: *"'I have nothing to say to you without a union rep present.' They leave."*
   - `Take business card`: *"They notice and pull back. 'That's mine.' They pocket it."*
   - Player learns: **HR floor starts with "2"** — second digit unknown

**First digit of HR floor: 2**

---

## Room 3: Office Space

**Key hotspots:** Desks, cupboard, whiteboard, printer.

### The Headphone Puzzle

A coworker sits at their desk wearing headphones — deeply in focus mode. No dialogue option available while headphones are on.

**Action: `Take` / `Pick Up` headphones → fake death sequence (5 clicks):**

| Click | Message |
|---|---|
| 1 | *"You snatch the headphones. The Amazonian spins around with the fury of someone whose flow state was just destroyed. Everything goes red."* |
| 2 | *"YOU ARE DEAD. The Amazonian filed an HR complaint, a security report, and a LinkedIn post about you simultaneously. You are terminated. Literally."* |
| 3 | *"You thought you can't die in a point-and-click? Ha. This is not that kind of game. Please restart from your last save."* |
| 4 | *"No, really. Close the tab. It's over. We'll wait."* |
| 5 | *"...okay. Fine. You got us. You're right — you cannot die in this game. The Amazonian puts their headphones back and somehow doesn't notice anything happened. You have the headphones."* → **headphones added to inventory** |

After the fake death sequence, the coworker is headphone-free and talkable.

**`Talk to` coworker (after headphones taken):**
> *"Oh, hey. You need to get into the lab? The door needs a 4-digit code. It's the CVNA cost center number. Don't ask me what it is though — I'm not in that org."*

Player learns: **lab code = CVNA cost center number**

### The Cupboard

`Open cupboard`:
> *"Mostly old printer cartridges and a fire warden vest. And one book, spine-out: **'Winning Ugly: Psychological Tactics for the Desperately Outmatched'**."*

`Pick up book` → **"Winning Ugly" added to inventory** (kept for entire game).

**Fun interactions with the book on other characters:**
- **Karen:** *"I have a copy in my drawer. It's how I got this job."*
- **Chip (IT):** *"Oh yeah, classic. Chapter 3 is why I never answer support tickets before noon."*
- **The Stakeholder:** *"I wrote the foreword."*
- **Bob:** *"We use this in performance reviews."*

---

## Room 4: IT Department

**Key hotspots:** Chip's desk, computer screen (Phone Tool), server rack, ticket queue display.

**Setup:** Chip is at his desk. The computer screen shows a Phone Tool entry — readable as a hotspot. Chip won't let you look at it unprompted.

**`Look at` screen (before distraction):**
> *"Hey! That's confidential employee data. GDPR, CCPA, and about six internal Amazon policies say you can't just read someone's screen. Eyes forward."*

**`Give headphones` to Chip:**
> *"Oh — are these... are those the lo-fi beats? The uninterrupted three-hour mix?"*
> He puts them on. His eyes glaze over. He's gone.

Headphones are **consumed** — removed from inventory, Chip permanently distracted.

**`Look at` screen (after headphones given):**

Chip is completely checked out. Player reads the full Phone Tool entry:

```
Name:          Dave Llorente
Job Title:     Principal Scientist
Manager:       Sarah K.
Location:      BER21 — Floor 1
Badge Access:  L4+
Department:    Computer Vision North America (CVNA)
Cost Center:   2847
Reports To:    VP, Everything
...
```

Player learns: **lab code = 2847**

**Design note:** The Phone Tool entry has many fields (badge level, location, manager) that look equally important — the player has to remember they're looking for "cost center" from the office coworker's hint. Players who visit IT before Office Space see the screen first but have no context; the coworker conversation makes it click retroactively.

---

## Room 5: Aisle (Corridor)

**Layout:** Narrow corridor connecting the building interior to the lab and elevator.

**Hotspots:**

**Lab door:**
- `Look at`: *"A heavy door with a keypad. A small plaque reads: 'CVNA Lab — Authorized Access Only'."*
- `Use keypad` (without code): *"I need a 4-digit code. I don't know it yet."*
- `Use keypad` (with code 2847): door opens → transition to Lab

**Elevator:**
- `Look at`: *"A standard office elevator. The floor panel is blank except for a sticky note: 'For HR, use 2-digit floor code'."*
- `Use elevator` (without floor number): *"I know I need HR, but I don't know which floor yet."*
- `Use elevator` (knowing floor 28): transition to Open Office / Wordfight

**Distraction item:** *(to be decided — a fun object with flavor interactions)*

---

## Room 6: The Lab

**Key hotspots:** FIFA setup, whiteboard, shelves with unexplained experiment.

### The FIFA Puzzle

Three people are huddled around a monitor playing FIFA, blocking the whiteboard.

**`Talk to` FIFA players:** *"'Not now.' 'Shh.' 'It's extra time.'"*

**`Look at` whiteboard (blocked):** *"I can see there's something written on it, but the FIFA crowd is in the way."*

**Challenging them without the book:**
> *"You play. You lose. Badly. They don't even look up from the screen."*
> *(Repeatable, always fails.)*

**Challenging them with `read_winning_ugly = true`:**

A scene plays out — no mini-game needed:
> *"You praise their first goal. They look confused.*
> *You whimper about your controller. You swap it twice.*
> *You ask if pigeons have feelings. A half-second pause. You score.*
> *In the 89th minute, you win 2–1. Nobody is sure what just happened."*

FIFA players file out, baffled and vaguely upset. Whiteboard is now accessible.

### The "Winning Ugly" Book — 5 Readings

Each `Use`/`Look at` on the book reveals a new chapter:

| Read | Chapter | Tactic |
|------|---------|--------|
| 1st | *Chapter 1: The Art of Praise* | *"Tell your opponent they're incredible. Repeatedly. Watch their confidence curdle into self-doubt."* |
| 2nd | *Chapter 3: Strategic Whimpering* | *"Announce loudly that you are terrible at this. That you've never won anything. That your hands don't work. Plant the seed of sympathy — then exploit it."* |
| 3rd | *Chapter 5: The Irrelevant Question* | *"Mid-game, ask something completely unrelated. 'Do you think pigeons have feelings?' The opponent's brain will stutter. Strike in that moment."* |
| 4th | *Chapter 7: Blaming the Controller* | *"Always have a bad controller. Inspect it. Shake it. Blow into it. Swap it twice. The opponent grows impatient. Impatience is your ally."* |
| 5th | *Chapter 9: The Inevitable Victory* | *"You are ready. You were always going to win. They just don't know it yet."* → **flag: `read_winning_ugly` = true** |

After 5th read: *"You close the book. You feel different. Worse, somehow, as a person — but strategically superior."*

### The Whiteboard

```
...ering          _4
...nce             _1
...n Resources     _8
...keting          _2
```

> *"A list of departments and floors. Most of the left side has been wiped — someone's sleeve caught it. You can make out the right column. HR is on floor _8."*

Player learns: **second digit of HR floor = 8** → combined with "2" from kitchen → **floor 28**

---

## Room 7: Open Office / HR Floor ✅ IMPLEMENTED

Wordfight with the Stakeholder. Win to proceed to Bob's office.

---

## Room 8: Bob's Office

**The problem:** Bob is too stressed to function. The agreement is in the filing cabinet but he's forgotten the code. There's no pen. And he won't accept the document without proper authorization.

**Puzzle chain:**

1. **Give stress ball to Bob**
   > *"Bob squeezes it rhythmically. Something shifts behind his eyes. 'Okay. Okay. Let me try to find that agreement.'"*
   He walks to the filing cabinet — but it's locked and he can't remember the code.

2. **Use USB stick on Bob's computer**
   Phone Tool loads showing Bob's own employee profile, including his department cost center. Same mechanic as the IT room, different data.
   > *"...that's my own profile. I forgot my own cost center. Don't tell anyone."*
   **Use cost center on filing cabinet** → opens → Bob hands you the agreement.

3. **Give mystery package to Bob** — it's addressed to him, never delivered.
   He opens it:
   > *"Oh! I've been waiting for this. It's a novelty pen shaped like a tiny rocket ship."*
   He keeps the pen but hands you a spare from inside the package. **Pen added to inventory.**
   **Use pen on agreement → signed agreement.**

4. **Make it official** — Bob won't accept it without a counter-signature from someone senior.
   **Combine business card + signed agreement → co-signed agreement**
   > *"You sign Jeff Bezos's name confidently. It's probably fine."*
   **Give co-signed agreement to Bob**
   > *"He reads it. He sees the name. He sets it down slowly. 'I'm going to choose not to ask any questions about this.' He stamps it APPROVED."*

**Items used in Bob's office:**

| Item | Use |
|---|---|
| Stress ball | Calm Bob → he attempts the cabinet |
| USB stick | Unlock Phone Tool → find cabinet code |
| Mystery package | Give to Bob → yields the pen |
| Business card | Co-sign the agreement |

---

## Full Puzzle Dependency Graph

```
LOBBY
 └─ Cappuccino → Karen distracted → fire alarm → enter building

KITCHEN
 └─ Frozen egg + hot coffee (combine) → thawed egg → microwave → BOOM
 └─ HR person enters → look at lanyard → floor digit "2"

OFFICE SPACE
 └─ Take headphones (5-click fake death gag) → coworker talkable
 └─ Coworker → "lab code = CVNA cost center"
 └─ Open cupboard → get "Winning Ugly"
 └─ Read book 5 times → read_winning_ugly = true

IT DEPARTMENT
 └─ Give headphones → Chip checks out
 └─ Look at screen → Cost Center: 2847

AISLE
 └─ Pick up mystery package
 └─ Use keypad with 2847 → enter lab
 └─ Use elevator with floor 28 → HR floor

LAB
 └─ Pick up USB stick
 └─ Challenge FIFA players (requires read_winning_ugly) → they leave
 └─ Read whiteboard → floor digit "8"
 └─ Combine "2" + "8" → floor 28

OPEN OFFICE → Wordfight → WIN

BOB'S OFFICE
 └─ Give stress ball → Bob calms, attempts filing cabinet
 └─ Use USB stick on computer → Phone Tool → cabinet code
 └─ Use code on filing cabinet → Bob gets agreement
 └─ Give mystery package to Bob → yields pen
 └─ Use pen on agreement → signed agreement
 └─ Combine business card + signed agreement → co-signed agreement
 └─ Give co-signed agreement to Bob → VICTORY
```

---

## Key Items

| Item | Obtained | Consumed? | Used for |
|------|----------|-----------|---------|
| Business card | Starting inventory | Yes — combined with signed agreement | Co-sign agreement as Jeff Bezos |
| Stress ball | Starting inventory | Yes — given to Bob | Calm Bob so he attempts the filing cabinet |
| Cappuccino | Coffee machine (lobby) | Yes — given to Karen | Distract Karen in lobby |
| Frozen egg | Kitchen fridge | Yes — combined with coffee | Combine with coffee → thawed egg |
| Hot coffee | Kitchen coffee machine | Yes — combined with egg | Combine with egg → thawed egg |
| Thawed egg | Combine: frozen egg + hot coffee | Yes — used in microwave | Microwave explosion → summon HR person |
| Headphones | Office space coworker (fake death gag) | Yes — given to Chip | Distract Chip so you can read screen |
| Winning Ugly | Office space cupboard | No — kept all game | Beat FIFA players (read 5 times first) |
| Mystery package | Aisle | Yes — given to Bob | Bob opens it → yields pen |
| USB stick | Lab | Yes — used on Bob's computer | Load Phone Tool → find filing cabinet code |

---

## Meta Joke: You Cannot Die

When the player tries to take the headphones from the coworker, the game pretends to kill them across 5 clicks before admitting it was a joke. This is the only instance of the mechanic — one-time gag that players will want to show others.
