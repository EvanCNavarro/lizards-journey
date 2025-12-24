# Lizard's Journey - Development Status

> Last updated: December 23, 2024

## Live Links
- **Play**: https://lizards-journey.vercel.app
- **GitHub**: https://github.com/EvanCNavarro/lizards-journey
- **Vercel Dashboard**: https://vercel.com/evan-c-navarros-projects/lizards-journey

---

## Current State: MVP Phase 1 - FUNCTIONAL

### What's Working ✅

**World Map Scene:**
- Ocean with animated waves
- 3 islands (Starter Grove, Rocky Shore, Dense Jungle)
- Lizard spawns middle-left, swims between islands
- Modal triggers when approaching island (with 1s cooldown after dismissing)
- Island 1 unlocked by default, others locked until previous completed

**Level 1 - Starter Grove:**
- Larger island (radius 250)
- Central tree with grass/sand areas
- 4 bug types: fly, beetle, cricket, dragonfly (different speeds/points/behaviors)
- 60-second timer to catch 10 bugs
- Bugs respawn to maintain 8+ on screen
- Smooth boundary sliding (no getting stuck)

**Bird Hazard:**
- Always-visible shadow with 🦅 emoji circling overhead
- Attack sequence: shadow grows, red+white rings, "⚠️🦅 DANGER!" label
- 4.5 second attack duration (gives time to escape)
- 6-14 second cooldown between attacks
- Red flash on swoop, instant death if caught

**Controls:**
- Desktop: WASD or Arrow keys, ESC to pause
- Mobile: Virtual joystick (left side of screen)
- Both work simultaneously

**UI:**
- HUD: Timer, bug count, score
- Modals: Island entry, pause, win/lose
- Warning text: Red background with white text (accessible)

**Persistence:**
- localStorage saves unlocked islands and best scores
- Winning Level 1 unlocks Level 2 (Rocky Shore)

---

## Known Issues / Polish Needed

1. **Levels 2 & 3** - Not implemented yet (show "Coming Soon")
2. **Assets** - Using geometric shapes, no real sprites
3. **Audio** - No sound effects or music
4. **Mobile joystick** - Works but could be more polished
5. **3D look** - User wants eventual 3D/isometric visuals

---

## Tech Stack

```
Game Engine:    Phaser 3.90.0
Language:       TypeScript 5.9.3
Build Tool:     Vite 7.2.4
Hosting:        Vercel
Backend:        None yet (localStorage only)
                Supabase planned for Phase 2
```

---

## File Structure

```
src/
├── main.ts                 # Entry point
├── style.css               # Game container styles
├── config/
│   ├── constants.ts        # All game balance values
│   └── gameConfig.ts       # Phaser configuration
├── scenes/
│   ├── BootScene.ts        # Asset loading
│   ├── WorldMapScene.ts    # Island selection/swimming
│   └── Level1Scene.ts      # Bug-catching gameplay
├── entities/
│   ├── Lizard.ts           # Player character
│   ├── Bug.ts              # Collectible bugs (4 types)
│   └── Bird.ts             # Predator hazard
├── ui/
│   ├── Modal.ts            # Reusable modal system
│   ├── HUD.ts              # In-game UI
│   └── Joystick.ts         # Mobile touch controls
└── lib/
    └── storage.ts          # localStorage wrapper
```

---

## Key Constants (src/config/constants.ts)

```typescript
GAME: 800x600
LEVEL1: 60 seconds, 10 bugs to win, radius 250
LIZARD: speed 180, swim 120, size 32
BIRD: 4.5s attack, 6-14s cooldown, max shadow 70
```

---

## Roadmap

### Phase 1 (MVP) - MOSTLY DONE
- [x] World map with 3 islands
- [x] Swimming navigation
- [x] Island entry modals
- [x] Level 1 complete gameplay
- [x] All 4 bug types
- [x] Bird hazard system
- [x] Win/lose conditions
- [x] localStorage saves
- [x] Desktop + mobile controls
- [ ] Level 2 & 3 gameplay

### Phase 2 (Polish)
- [ ] Proper sprite art (replace shapes)
- [ ] Sound effects
- [ ] Supabase integration (auth, leaderboards)
- [ ] Level 2: Rocky Shore
- [ ] Level 3: Dense Jungle

### Phase 3 (Features)
- [ ] Power-ups
- [ ] Different lizard skins
- [ ] Achievements
- [ ] Background music
- [ ] 3D/isometric visuals

---

## Commands

```bash
# Development
npm run dev

# Build
npm run build

# Deploy to Vercel
vercel --prod --yes

# Git workflow
git add -A && git commit -m "message" && git push
```

---

## Session Notes

### Testing Feedback Addressed:
1. ✅ Lizard spawn position (away from joystick)
2. ✅ Modal cooldown (doesn't re-trigger immediately)
3. ✅ Island size increased
4. ✅ Boundary sliding (no stuck on edges)
5. ✅ Bird shadow always visible
6. ✅ Attack warning accessible (red bg, white text)
7. ✅ Attack timing comfortable (4.5s)

### User Preferences Noted:
- Wants 3D/isometric look eventually
- Prefers flat UI elements (solid backgrounds vs outlines)
- Values accessibility in warning indicators

---

## To Resume Development

1. Open project: `cd /Users/evancnavarro/Downloads/BBB_Lizards_Journey`
2. Run dev server: `npm run dev`
3. Read this file and GAME_SPEC.md for context
4. Check LESSONS_LEARNED.md for architecture guidance

**Next logical tasks:**
- Implement Level 2 (Rocky Shore) with new layout/difficulty
- Implement Level 3 (Dense Jungle)
- Add sound effects
- Replace geometric shapes with sprites
