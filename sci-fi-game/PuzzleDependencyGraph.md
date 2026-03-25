# Puzzle Dependency Graph — Escape the Jail

---

## Win Condition

> The knight escapes the cell by unlocking the cell door with the guard's key.

---

## Critical Path

```
START
  │
  ├─ Search hay_pile ──────────────────────────► rusty_nail
  │                                                   │
  │                                          Use rusty_nail
  │                                          on loose_stone
  │                                                   │
  │                                                   ▼
  │                                          stone_open = true
  │                                                   │
  │                                          metal_file found
  │                                          in cavity
  │                                                   │
  │                                          Use metal_file
  │                                          on iron_bars
  │                                          (file consumed)
  │                                                   │
  │                                                   ▼
  ├─ Search bucket ────────────────────────► bone     bar_filed = true
  │                                           │            │
  │                                           └────────────┘
  │                                           Use bone on sleeping_guard
  │                                           (requires bar_filed)
  │                                           (bone consumed)
  │                                                   │
  │                                                   ▼
  │                                           guards_key acquired
  │                                                   │
  │                                          Use guards_key
  │                                          on cell_door
  │                                                   │
  │                                                   ▼
  └──────────────────────────────────────────────── WIN
```

**Minimum steps to escape: 6 actions**
1. Search hay pile → get nail
2. Use nail on loose stone → get file
3. Use file on bars → bar bent (file gone)
4. Search bucket → get bone
5. Use bone on guard through gap → get key (bone gone)
6. Use key on cell door → escape

---

## Item Reference

| Item | Source | Required for | Notes |
|---|---|---|---|
| `rusty_nail` | Search hay pile | Prying loose stone | Critical path |
| `metal_file` | Loose stone cavity (after nail) | Filing iron bar | Critical path; consumed on use |
| `bone` | Search bucket | Hooking guard's key ring | Critical path; consumed on use; requires bar_filed |
| `guards_key` | Sleeping guard (after bone+bar_filed) | Unlocking cell door | Critical path |
| `bread` | Bench | Nothing (flavour only) | Can be thrown at guard — he doesn't wake |
| `tin_cup` | Tin cup hotspot | Nothing (flavour only) | Can be clanged on bars — guard still doesn't wake |
| `rope` | Wall hook | Nothing (flavour only) | Can be looped on bar — too strong to pull |
| `torch` | Torch sconce | Nothing (flavour only) | Can be waved at guard — heat doesn't reach |

---

## State Flags

| Flag | Set when | Effect |
|---|---|---|
| `nail_taken` | Hay pile searched | Prevents duplicate nail pickup |
| `bread_taken` | Bench searched | Removes bread from scene (patch) |
| `bone_taken` | Bucket searched | Prevents duplicate bone pickup |
| `cup_taken` | Tin cup taken | Removes cup from scene (patch) |
| `rope_taken` | Wall hook taken | Removes rope from scene (patch) |
| `torch_taken` | Torch sconce taken | Removes torch from scene (patch); room darkens |
| `file_taken` | Stone cavity opened | Prevents duplicate file pickup |
| `stone_open` | Nail used on loose stone | Switches background to `Jail_StoneOpen.png` |
| `bar_filed` | File used on iron bars | Switches background to `Jail_BarFiled.png`; enables bone→key step |
| `guard_key_taken` | Bone used on guard through gap | Guard keeps sleeping; player has key |

---

## Background State Priority

```
bar_filed = true  →  Jail_BarFiled.png   (highest priority)
stone_open = true →  Jail_StoneOpen.png
(default)         →  Jail_Base.png
```

Pickable-object patches (`patch_bread`, `patch_tin_cup`, `patch_torch`, `patch_rope`)
are overlaid on top of whichever background is active, independent of background state.

---

## Flavour Interactions (wrong-tool responses)

These teach the player what tools are and aren't useful, without being solvable paths.

| Item | Used on | Response hint |
|---|---|---|
| `rusty_nail` | iron_bars | "I need a proper file" — points toward file |
| `rope` | iron_bars | "That one bar looks slightly less certain of itself" — hints at the weak bar |
| `tin_cup` | iron_bars | Guard doesn't wake — establishes guard is a deep sleeper |
| `bread` | sleeping_guard | Guard doesn't wake — reinforces deep sleep |
| `tin_cup` | sleeping_guard | Guard doesn't wake — same |
| `torch` | sleeping_guard | Heat doesn't reach — establishes distance |
| `bone` | sleeping_guard (no bar_filed) | "I can't reach through the bars" — hints at needing the gap first |
| `rusty_nail` | cell_door | "Too thick to pick this lock" — points toward the key |

---

## Dead-Man-Walking Analysis

No dead-man-walking states are possible:
- `rusty_nail` is consumed by prying the stone, but is never needed again after that
- `metal_file` is consumed by filing the bar, but is never needed again after that
- `bone` is consumed by hooking the key, but is never needed again after that
- All other items (`bread`, `tin_cup`, `rope`, `torch`) are flavour-only and never consumed
- The nail, file, and bone are all single-pickup items in fixed locations — they cannot be
  discarded or missed once the corresponding scene hotspot has been searched
