# Riddle Design Guidelines for Point-and-Click Adventures

---

## 1. Puzzle Types

### Inventory Puzzles
The most common type. The player picks up an object and uses it with something else in the scene or combines it with another inventory item.

- **Simple use**: Use the key on the locked door.
- **Non-obvious use**: Use the rubber chicken with a pulley in the middle of nowhere *(Monkey Island 1)* — the object's function is absurd but internally consistent with the world's logic.
- **Combination**: Combine two items to create a third. Mix the "grog" ingredients to get something drinkable *(Monkey Island 1)*.
- **Indirect use**: The item doesn't solve the problem directly — it enables another step. E.g. the item impresses an NPC who then gives you the real item you need.

### Conversation / Dialogue Puzzles
Information is the reward. The player must ask the right person the right thing, or exhaust all dialogue options, to learn a fact needed elsewhere.

- **The Insult Sword-fighting system** *(Monkey Island 1)*: learning insults and their correct comebacks by losing fights, then winning by applying what you learned.
- **Talking your way in**: Convincing a guard, receptionist, or shopkeeper by saying the right thing or having the right item to show them.
- **Learning a code or password**: An NPC drops a clue in conversation that unlocks a puzzle elsewhere.

### Observation / Pixel-Hunt Puzzles
A small object is hidden in the scene. The player must look carefully — or try "Look at" on everything — to find it.

- Best when the object is visually motivated (it belongs in the scene) rather than random.
- Works well combined with a prior clue: a character mentions a key is "on a hook by the door" before you enter the room.

### Environment / Interaction Puzzles
Manipulating the scene itself — switches, levers, machines, doors — without necessarily using an inventory item.

- **Chain reaction**: Push the button → the machine drops a coin → the coin rolls into a slot → a door opens.
- **Timed interaction**: Do things in the right order before something changes (less common in classic games, more frustrating when used).

### Knowledge / Meta Puzzles
The answer comes from something the player knows, not the character.

- **The three-headed monkey gag** *(Monkey Island 1)*: "Look behind you, a three-headed monkey!" — the solution is knowing the joke.
- **Reading the room**: Morse code on a blinking light, a phone number on a poster, a combination hidden in a painting's title initials.

### NPC / Social Puzzles
Getting an NPC to do something or move out of the way.

- Distract, bribe, frighten, or impress them.
- *Maniac Mansion*: The tentacle blocking the basement only moves if you give it a specific gift — different characters have different items available, so the solution path varies.

### Multi-character Puzzles *(Maniac Mansion style)*
Different party members have different skills and starting items, creating branching solution paths for the same obstacle. This adds replayability and reduces the "one true path" problem.

---

## 2. Classic Examples

### Monkey Island 1 — *The Secret of Monkey Island* (1990)

| Puzzle | Setup | Solution | What makes it work |
|---|---|---|---|
| Rubber chicken + pulley | Need to cross a ravine | Use rubber chicken with a pulley in the middle of the rope | Absurdist logic — the object clearly looks like it could hook onto something |
| Insult sword-fighting | Pirates insult you; wrong responses lose the fight | Learn correct comeback for each insult by losing; defeat the Sword Master | Teaches via failure; feels fair in retrospect |
| Grog combination | Need to get drunk / distract cook | Mix ingredients from various sources to recreate grog | Inventory chain with clear intermediate steps |
| Idol weight replacement | Stone idol on a pressure plate; taking it triggers a trap | Replace idol with a bag of dirt of the same weight | Classic adventure logic — player feels clever |
| The Circus performers | Need a cannon to cross the sea | Convince circus folk to lend their human cannonball outfit | Conversation + item chain |
| LeChuck's ghost | Boss is ghost, nothing hurts him | Use root beer (anti-ghost grog) found earlier in the game | Planted early in the game; payoff feels earned |

### Monkey Island 2 — *LeChuck's Revenge* (1991)

| Puzzle | Setup | Solution | What makes it work |
|---|---|---|---|
| The Voodoo doll | Need to defeat LeChuck | Collect four personal items (something of his head, hands, heart, and body) from different islands | Parallel puzzle structure — all four sub-tasks can be done in any order |
| Getting the map piece from the Phatt Island library | Map piece is checked out | Find who has it (Governor Phatt) → get into his mansion → steal it from his sleeping body | Long chain with multiple rooms and NPCs |
| Winning the spitting contest | Need a ticket from the contest | Use a prosthetic arm to extend reach when spitting | Inventory used in unexpected physical way |
| The Janitor's bucket | Janitor won't leave the floor | Pull the fire alarm to call him away | Environment interaction as distraction |

### Maniac Mansion (1987)

| Puzzle | Notes |
|---|---|
| Sending the game demo to the game company | A meta-puzzle: find a demo tape, mail it, wait, receive a prize. Teaches cause-and-effect across time. |
| The different endings per character | Edison family members react differently depending on which teens you chose — encourages replaying |
| The hamster in the microwave | Famous/infamous: you can microwave the hamster. The game lets you but it's never the solution. Demonstrates that wrong actions should have consequences, not silent failure. |
| Getting past Edna | Different characters have different social solutions (charm, distract, sneak). One-size-fits-all solutions are avoided. |

---

## 3. Ron Gilbert's Puzzle Dependency Graph (PDG)

Ron Gilbert introduced the PDG in his 1989 essay **"Why Adventure Games Suck"** as a design tool for building fair, completable adventure games.

### What it is
A directed acyclic graph where:
- **Nodes** are puzzle states — either a goal the player must reach or an item/fact the player must obtain.
- **Edges** represent dependencies — "you cannot reach node B until you have completed node A."
- The graph starts at the **start state** and ends at the **win state**.

### How to draw one
1. Write the win condition at the right.
2. Work backwards: what does the player need immediately before winning?
3. For each requirement, ask: what does the player need to achieve that?
4. Continue until you reach things the player has at the start (no dependencies).

```
START
  └─ has_crowbar ──────────────────────────────────────────────────┐
  └─ found_map_piece_A                                             │
       └─ entered_library ──── has_library_card                   │
            └─ talked_to_librarian                                │
  └─ found_map_piece_B ─── defeated_pirate ─── learned_insult ───┘
                                                                   ▼
                                                              WIN: opened_vault
```

### Key principles derived from the PDG

**Avoid long single-track chains**
If every puzzle has exactly one dependency, a single wrong turn or missed item blocks everything. Prefer a graph that is **wide and shallow** rather than narrow and deep.

**Parallel tracks reduce frustration**
Multiple branches leading to the same goal (the Voodoo doll in MI2 is the model example). The player feels free to work on whichever branch is most approachable.

**No hidden dependencies**
Every dependency should be visible to the player in the world. If you need item X to complete puzzle Y, there must be a clue in the scene or in dialogue that hints at this connection.

**Identify bottlenecks**
A bottleneck node is one that all paths must pass through. These are acceptable as long as the bottleneck itself is not frustrating to solve. In a PDG, bottlenecks are easy to spot — they are nodes with many incoming edges.

**"Dead man walking" problem**
If the player can reach the win state from the current state, but cannot because they discarded a required item earlier, the game is broken. The PDG helps catch these: trace all paths from every terminal node back to the start and verify the required items are still acquirable.

---

## 4. Puzzle Design Principles

### Telegraph before you require
Introduce an item or fact before the player needs it. If the solution to a puzzle is "use the fire extinguisher", the fire extinguisher should be visible — and ideally commented on — long before the fire appears.

### The puzzle should feel inevitable in hindsight
When the player solves it, the reaction should be "of course!" not "how was I supposed to know that?" The clues were there; the player just had to notice them.

### Comedy and context make puzzles memorable
Absurd solutions are acceptable *if* they are internally consistent with the world's rules. Guybrush using a rubber chicken as a zip-line hook works because the world has established its own cartoon physics. The puzzle must fit the tone.

### Reward curiosity
Players who examine everything and talk to everyone should find hints. "Look at" should always return useful flavour or clues, never just "It's a thing."

### Avoid pixel hunts as the only solution
If a puzzle is only solvable by clicking on a 3×3 pixel object with no hint it exists, it's unfair. Use dialogue, narration, or visual design to direct attention.

### Give wrong actions a response
If the player tries the wrong item, the character should comment on why it doesn't work — ideally a funny line. Silent failure ("nothing happens") is demoralizing. *Maniac Mansion*'s "I don't want to do that" variants are a good model.

### Puzzle density per room
Avoid rooms that are purely decorative. Every room should have at least one interactive hotspot that moves the story or teaches the player something. Equally, avoid rooms with so many objects that the player is overwhelmed.

---

## 5. Checklist for Designing a New Room's Puzzles

- [ ] Draw the PDG: map every item and state from start to exit
- [ ] Check for single-chain bottlenecks — can any path be parallelised?
- [ ] Every required item has a visible presence in the room or is mentioned by an NPC
- [ ] Every "use X with Y" combination has at least one in-world hint
- [ ] Wrong attempts return a descriptive, preferably funny, response
- [ ] The room can be completed without re-entering (no backtracking to get a forgotten item) — or backtracking is clearly motivated
- [ ] At least one puzzle has a comic or unexpected-but-logical solution

---

## 6. PDG Markdown — Write First, Build Second

**Before writing any game code**, generate the puzzle design as a markdown file
(e.g. `PuzzleDependencyGraph.md` in the game's folder) and present it to the user
for review. Only proceed to implementation once the user has approved the design
or requested changes.

### Why

- Puzzle logic bugs are cheap to fix in a markdown, expensive to fix in code
- The user may want a different critical path, more flavour items, or a different
  win condition — better to discover this before the `executeVerb` switch is written
- The PDG doubles as living documentation for the finished game

### What the file must contain

1. **Win condition** — one sentence stating what the player must achieve
2. **Critical path** — ASCII dependency graph from START → WIN
3. **Minimum step count** — fewest actions needed to escape/win
4. **Item reference table** — every item, its source, what it unlocks, critical or flavour
5. **State flags table** — every boolean flag, when it's set, what it changes
6. **Background state priority** — which flag drives which background variant
7. **Flavour interactions** — wrong-tool responses and what hint they give
8. **Dead-man-walking analysis** — proof that no item can be permanently missed

### Template

```markdown
# Puzzle Dependency Graph — [Game Title]

## Win Condition
> [one sentence]

## Critical Path
[ASCII graph]

## Minimum Steps: N

## Item Reference
| Item | Source | Required for | Notes |
|------|--------|--------------|-------|

## State Flags
| Flag | Set when | Effect |
|------|----------|--------|

## Background State Priority
[priority order]

## Flavour Interactions
| Item | Used on | Hint given |
|------|---------|------------|

## Dead-Man-Walking Analysis
[confirm no item can be missed or permanently lost]
```

See `sci-fi-game/PuzzleDependencyGraph.md` for a complete worked example.
