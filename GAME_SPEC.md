# Lizard's Journey - Game Specification

> A top-down island-hopping adventure where a lizard catches bugs and avoids predators.

---

## Overview

**Genre:** Top-down arcade / collection game
**Platform:** Web browser (desktop + mobile)
**Tech Stack:** Phaser 3 + TypeScript + Vite + Supabase + Vercel
**Art Style:** Realistic yet cartoonish (GEICO gecko aesthetic)

---

## Core Game Loop

```
┌─────────────────────────────────────────────────────────────┐
│                      WORLD MAP                               │
│  - Free movement swimming between islands                    │
│  - Approach island → Modal: "Enter? Yes/No"                 │
│  - Can backtrack to previous islands                         │
└─────────────────────┬───────────────────────────────────────┘
                      │ Enter Island
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    ISLAND LEVEL                              │
│  - Top-down free movement (8-directional)                   │
│  - Collect bugs by walking over them                        │
│  - Avoid bird predator (instant death)                      │
│  - Beat target within time limit → Unlock next island       │
└─────────────────────┬───────────────────────────────────────┘
                      │ Win/Lose
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   RESULT MODAL                               │
│  WIN: "Level Complete!" → Continue to World Map             │
│  LOSE: "Game Over" → Retry / Return to Map                  │
│  Shows: Score, Personal Best, Time                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Scenes

### 1. World Map Scene (Swimming)

**Purpose:** Navigate between islands, select levels

**Gameplay:**
- Free movement swimming in ocean
- Lizard swims with 8-directional input (WASD/arrows/touch joystick)
- Water has subtle wave animation
- Islands visible as destinations with paths/dotted lines between them

**Island Interaction:**
- When lizard approaches island (within ~50px radius)
- Modal appears: "[Island Name] - Enter? [Yes] [No]"
- If locked: "Complete previous island to unlock"
- Yes → Transition to level scene
- No → Close modal, continue swimming

**Visual Elements:**
- Blue ocean background with animated waves
- Islands shown as small landmasses with trees/rocks
- Unlocked islands: Full color, glowing outline
- Locked islands: Grayscale, padlock icon
- Dotted swim path connecting islands
- Lizard swimming animation (legs paddling)

**Islands (MVP - 3 total):**
| ID | Name | Position | Status |
|----|------|----------|--------|
| 1 | Starter Grove | Left side | Unlocked by default |
| 2 | Rocky Shore | Center-top | Locked |
| 3 | Dense Jungle | Right side | Locked |

---

### 2. Level 1: Starter Grove (Bug Catching)

**Setting:** Small island with one large tree in center, grass ground

**Objective:** Collect 10 bugs in 60 seconds

**Win Condition:** Reach 10 bugs before timer hits 0
**Lose Condition:** Timer reaches 0 OR bird catches lizard

**Player (Lizard):**
- GEICO gecko style - green, realistic proportions, cartoonish charm
- 8-directional free movement
- Speed: 180 units/sec (faster than all bugs)
- Collision circle for bug collection
- Walk animation (4 frames)
- Eating animation when catching bug (quick tongue flick visual feedback)

**Collectibles (Bugs):**

| Type | Speed | Points | Size | Behavior |
|------|-------|--------|------|----------|
| Fly | 60 | 1 | 8px | High jitter, erratic |
| Beetle | 30 | 2 | 12px | Slow, steady path |
| Cricket | 80 | 2 | 10px | Medium jitter, hops |
| Dragonfly | 100 | 3 | 14px | Fast, smooth curves |

**Bug Behavior:**
- Spawn at random positions on island (not in tree, not at edges)
- Move with random direction changes
- "Jitter" = frequency of direction changes (0-1 scale)
- Stay within island bounds
- Respawn when collected (maintain ~8-12 bugs on screen)

**Hazard (Bird):**

```
Bird Attack Sequence:
1. Shadow appears at random position near lizard
2. Shadow starts small (20px), grows over 3 seconds to 80px
3. Shadow tracks toward lizard position (slowly)
4. At max size: Bird swoops down (instant)
5. If lizard in shadow zone: DEATH → Game Over
6. Cooldown: 5-12 seconds before next attack
```

**Visual Cues:**
- Shadow is dark oval, opacity increases as bird approaches
- Optional: Bird silhouette in sky, getting larger
- Warning sound when shadow appears
- Screen flash red on death

**UI Elements:**
- Timer: Top center "0:45" countdown
- Bug count: Top left "Bugs: 7/10"
- Score: Top right "Score: 12"
- Pause button: Top right corner

**Level Layout:**
```
┌────────────────────────────────────────┐
│  Bugs: 3/10      0:45      Score: 6   │
│                                        │
│     🪲                                 │
│           ┌─────────┐                  │
│   🪰      │  TREE   │      🦗         │
│           │         │                  │
│           └─────────┘                  │
│                          🪰            │
│       🦎                               │
│              🪲              🪰        │
│  ~~~~~~ water edge ~~~~~~              │
└────────────────────────────────────────┘
```

---

## UI Components

### Modal System

**Island Entry Modal:**
```
┌─────────────────────────────────┐
│       🏝️ Starter Grove          │
│                                 │
│  A small island with one tree.  │
│  Catch 10 bugs to advance!     │
│                                 │
│    [ Enter ]    [ Back ]       │
└─────────────────────────────────┘
```

**Game Over Modal:**
```
┌─────────────────────────────────┐
│         💀 Game Over            │
│                                 │
│  The bird caught you!          │
│                                 │
│  Bugs collected: 7             │
│  Your best: 9                  │
│                                 │
│    [ Retry ]    [ Exit ]       │
└─────────────────────────────────┘
```

**Level Complete Modal:**
```
┌─────────────────────────────────┐
│       🎉 Level Complete!        │
│                                 │
│  Time remaining: 0:23          │
│  Bugs collected: 10            │
│  Bonus points: +230            │
│                                 │
│  Total Score: 15               │
│  Your best: 15 ⭐ NEW!         │
│                                 │
│  🔓 Rocky Shore unlocked!      │
│                                 │
│        [ Continue ]            │
└─────────────────────────────────┘
```

---

## Controls

**Desktop:**
- WASD or Arrow Keys: Move lizard
- ESC: Pause
- Enter/Space: Confirm in modals

**Mobile:**
- Virtual joystick (left side): Movement
- Tap: Confirm in modals

---

## Progression System

**Island Unlocking:**
- Complete Level 1 → Unlock Level 2
- Complete Level 2 → Unlock Level 3
- Simple linear progression for MVP

**Score Tracking:**
- Per-level personal best stored locally (localStorage)
- Future: Supabase leaderboard

**Persistence (localStorage):**
```typescript
interface GameSave {
  unlockedIslands: number[];  // [1, 2] means islands 1 & 2 unlocked
  bestScores: {
    [levelId: number]: {
      bugs: number;
      time: number;  // seconds remaining
      score: number;
    }
  };
}
```

---

## Technical Architecture

### File Structure
```
lizards-journey/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .env.example
├── .gitignore
│
├── src/
│   ├── main.ts                 # Entry point
│   │
│   ├── scenes/
│   │   ├── BootScene.ts        # Asset loading
│   │   ├── WorldMapScene.ts    # Island selection
│   │   └── Level1Scene.ts      # Bug catching gameplay
│   │
│   ├── entities/
│   │   ├── Lizard.ts           # Player character
│   │   ├── Bug.ts              # Collectible bugs
│   │   └── Bird.ts             # Predator hazard
│   │
│   ├── ui/
│   │   ├── Modal.ts            # Reusable modal component
│   │   ├── HUD.ts              # In-game UI (timer, score)
│   │   └── Joystick.ts         # Mobile touch controls
│   │
│   ├── config/
│   │   ├── constants.ts        # Game balance values
│   │   └── gameConfig.ts       # Phaser configuration
│   │
│   └── lib/
│       ├── storage.ts          # localStorage wrapper
│       └── supabase.ts         # Backend client (future)
│
└── public/
    └── assets/
        ├── sprites/            # Character/bug sprites
        ├── audio/              # Sound effects
        └── fonts/              # Custom fonts (if any)
```

### Key Constants
```typescript
// Game dimensions
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

// Level 1
const LEVEL1_TIME = 60;        // seconds
const LEVEL1_TARGET = 10;      // bugs to collect

// Lizard
const LIZARD_SPEED = 180;      // units/sec
const LIZARD_SWIM_SPEED = 100; // slower in water

// Bugs
const BUG_TYPES = {
  fly:       { speed: 60,  points: 1, jitter: 0.8 },
  beetle:    { speed: 30,  points: 2, jitter: 0.3 },
  cricket:   { speed: 80,  points: 2, jitter: 0.5 },
  dragonfly: { speed: 100, points: 3, jitter: 0.9 },
};

// Bird hazard
const BIRD_ATTACK_DURATION = 3000;  // ms
const BIRD_COOLDOWN_MIN = 5000;     // ms
const BIRD_COOLDOWN_MAX = 12000;    // ms
```

---

## Art Direction

### Lizard Character
- **Reference:** GEICO gecko - friendly, expressive eyes
- **Color:** Bright green body, lighter belly
- **Style:** Semi-realistic proportions, smooth curves
- **Animations needed:**
  - Idle (subtle breathing)
  - Walk (4-direction or 8-direction)
  - Swim (paddling legs)
  - Eat (quick tongue flick)
  - Death (flatten/squish)

### Environment
- **Islands:** Tropical feel, bright greens and sandy edges
- **Ocean:** Deep blue with lighter wave patterns
- **Tree:** Large, friendly-looking (could have face like reference image 2)
- **Grass:** Varied green patches, maybe some flowers

### Bugs
- **Style:** Simple but recognizable silhouettes
- **Size:** Small relative to lizard (1/4 to 1/2 lizard size)
- **Animation:** Simple wing flutter / leg movement

### Bird
- **Shown as:** Shadow only (mystery/threat)
- **Shadow:** Dark oval, grows and follows
- **Optional:** Hawk silhouette visible in "sky" layer

---

## Audio (Future Enhancement)

**Sound Effects:**
- Bug collected: Quick "chomp" / satisfying crunch
- Swimming: Gentle splashing
- Bird shadow appears: Ominous whoosh / warning tone
- Bird attack: Sharp screech
- Level complete: Victory jingle
- Game over: Sad trombone / thud

**Music:**
- World map: Calm, tropical ambience
- Level 1: Upbeat but tense, builds as timer decreases

---

## MVP Scope

**Phase 1 (MVP):**
- [x] World map with 3 islands (only Island 1 playable)
- [x] Swimming navigation
- [x] Island entry modal
- [x] Level 1 complete gameplay
- [x] All 4 bug types
- [x] Bird hazard system
- [x] Win/lose conditions
- [x] Basic score tracking (localStorage)
- [x] Desktop controls (keyboard)

**Phase 2:**
- [ ] Mobile touch controls
- [ ] Level 2 & 3 gameplay
- [ ] Supabase integration (auth, leaderboards)
- [ ] Sound effects
- [ ] Proper sprite art (replace primitives)

**Phase 3:**
- [ ] More levels/islands
- [ ] Power-ups (speed boost, shield, etc.)
- [ ] Different lizard skins
- [ ] Achievements
- [ ] Background music

---

## Reference Images

1. **Real anole catching dragonfly** - Character movement/pose inspiration
2. **Arcade tree with face** - Whimsical environment style
3. **Stylized 3D bugs** - Cute bug character designs
4. **GEICO gecko** - Primary character aesthetic
5. **Mario world map** - Level selection UI pattern

---

## Getting Started

```bash
# Clone the repo
git clone <repo-url>
cd lizards-journey

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

---

*Spec created: December 2024*
*Based on lessons learned from BBB (Banana Runner) project*
