# Game Development Lessons Learned

> A comprehensive handoff document for starting new game projects.
> Contains credentials, setup instructions, and architectural learnings.
> Validated by multiple AI sources (Claude, Grok) for best practices.

---

## Table of Contents
1. [Recommended Tech Stack (Start Here)](#recommended-tech-stack)
2. [What Worked Well](#what-worked-well)
3. [What Went Wrong](#what-went-wrong)
4. [Credentials & Services](#credentials--services)
5. [New Project Setup Guide](#new-project-setup-guide)
6. [Architecture Recommendations](#architecture-recommendations)
7. [Database Schema Patterns](#database-schema-patterns)
8. [Multiplayer Learnings](#multiplayer-learnings)
9. [Deployment Checklist](#deployment-checklist)

---

## Recommended Tech Stack

> **Consensus recommendation from Claude + Grok for 2D browser games.**
> This stack is validated, well-documented, and scales from prototypes to full games.

### The Stack (Copy This)

```
┌─────────────────────────────────────────────────────────┐
│  RECOMMENDED 2D WEB GAME STACK                          │
├─────────────────────────────────────────────────────────┤
│  Game Engine:    Phaser 3                               │
│  Language:       TypeScript                             │
│  Build Tool:     Vite                                   │
│  Backend:        Supabase (Auth + Database + Realtime)  │
│  Hosting:        Vercel                                 │
│  Pixel Art:      Aseprite ($20) or Piskel (free)        │
│  State:          Zustand (optional, for complex games)  │
│  Testing:        Vitest (optional)                      │
│  Code Quality:   ESLint + Prettier                      │
└─────────────────────────────────────────────────────────┘
```

### Why Each Choice

| Tool | What It Does | Why It's Better Than Vanilla |
|------|--------------|------------------------------|
| **Phaser 3** | Game framework: sprites, physics, input, scenes, animations | Automates game loop, collisions, spawning. Write 70% less code. Handles WebGL/Canvas automatically |
| **TypeScript** | Typed JavaScript - catches errors at compile time | No more "undefined is not a function". Better autocomplete. Easier refactoring |
| **Vite** | Fast dev server + bundler with hot reload | See changes instantly. No manual refresh. 10x faster than Webpack. Works with TS out of box |
| **Supabase** | Backend-as-a-service: auth, PostgreSQL, realtime | Zero backend code. Free tier generous. Auth just works. RLS for security |
| **Vercel** | Static hosting with CDN | One command deploy. Auto HTTPS. Preview URLs. Free |
| **Aseprite** | Pixel art editor with animation support | Layers, onion skinning, export to sprite sheets. Worth the $20 |
| **Zustand** | Lightweight state management | Simple API, no boilerplate. Good for complex game state |
| **Vitest** | Testing framework (works with Vite) | Fast, simple, same config as Vite |

### Setup Time Estimate

| Task | Time |
|------|------|
| Vite + TypeScript + Phaser setup | 30 min |
| Supabase project creation | 10 min |
| Basic game scene working | 1-2 hours |
| First deploy to Vercel | 10 min |
| **Total to "Hello World" game** | **2-3 hours** |

### Key Documentation Links

```
Phaser 3:      https://phaser.io/docs
               Start: "Making Your First Phaser 3 Game" tutorial

TypeScript:    https://www.typescriptlang.org/docs/handbook/intro.html

Vite:          https://vitejs.dev/guide/

Supabase:      https://supabase.com/docs
               Key sections: Auth, Database, Realtime

Aseprite:      https://www.aseprite.org/docs/

Zustand:       https://github.com/pmndrs/zustand
```

### Starter Prompts for Claude

Use these to bootstrap a new project:

```
"Set up a Phaser 3 + TypeScript + Vite project for a 2D game"

"Generate a Phaser.js endless runner template with jumping and collectibles"

"Integrate Supabase auth with a Phaser game for user accounts"

"Create a Phaser scene that loads sprite sheets from Aseprite export"

"Add Zustand state management to a Phaser TypeScript game"
```

### When NOT to Use This Stack

| Situation | Alternative |
|-----------|-------------|
| Game jam (48 hours) | Vanilla JS + Canvas is faster to start |
| 3D game | Three.js, Babylon.js, or PlayCanvas |
| Mobile-first native | Unity, Godot, or React Native |
| MMO / large scale | Dedicated game servers (Colyseus, Nakama) |
| Learning basics | Vanilla JS first, then graduate to Phaser |

### Multiplayer Considerations

**Supabase Realtime is good for:**
- Lobby systems (join/leave)
- Turn-based games
- Leaderboards (live updates)
- Presence (who's online)
- Chat

**Supabase Realtime is NOT good for:**
- Real-time action (needs >30 updates/sec)
- Competitive multiplayer (latency matters)
- Physics sync (too slow)

**For action multiplayer, add:**
```
PartyKit:  https://partykit.io     (recommended - edge deployed, easy)
Colyseus:  https://colyseus.io     (self-hosted, more control)
Liveblocks: https://liveblocks.io  (good for collaborative features)
```

---

## What Worked Well

### 1. Supabase as Backend
**Why it worked:**
- Zero backend code needed for auth, database, realtime
- Generous free tier (500MB database, 2GB bandwidth)
- Built-in Row Level Security (RLS) for data protection
- Realtime subscriptions work out of the box
- Auth with email/password just works
- PostgreSQL means real SQL power (views, triggers, indexes)

**Keep doing:**
- Use Supabase for indie/small games
- RLS policies from day one
- Database triggers for auto-profile creation
- Realtime for lobby/presence features

### 2. Vercel for Hosting
**Why it worked:**
- Deploy with one command: `vercel --prod`
- Automatic HTTPS
- Global CDN (fast everywhere)
- Preview deployments for testing
- Free tier handles significant traffic

**Keep doing:**
- Use Vercel for static/frontend hosting
- Push-to-deploy workflow
- Preview URLs for testing before production

### 3. GitHub for Version Control
**Why it worked:**
- Easy collaboration
- Version history saved our bacon multiple times
- Releases/tags for versioning
- Issues for bug tracking (if needed)

**Keep doing:**
- Commit often with clear messages
- Tag releases (v1.0.0, v1.1.0, etc.)
- Use branches for experimental features

### 4. Vanilla JS for Prototyping
**Why it worked (initially):**
- Zero setup, just write code
- No build step friction
- Easy to iterate fast
- Works everywhere

**When to use:**
- Game jams
- Quick prototypes
- Learning projects
- Games under 2,000 lines of code

### 5. HTML5 Canvas
**Why it worked:**
- Simple 2D rendering API
- No dependencies
- Pixel-perfect control
- Good performance for 2D games

**Keep doing:**
- Canvas for 2D games
- `imageSmoothingEnabled = false` for pixel art
- RequestAnimationFrame for game loop
- Delta time for consistent physics

---

## What Went Wrong

### 1. Monolithic index.html (CRITICAL)
**The problem:**
- Started with one file, ended with 9,871 lines
- Impossible to navigate
- Can't test individual parts
- Hard for multiple people to work on
- No code reuse

**The fix for next time:**
```
DO NOT put game logic in HTML files.
Start with proper file structure from day one.
Even a 500-line game should be modular.
```

**Recommended structure from the start:**
```
src/
├── main.js           # Entry point only
├── game/
│   ├── Game.js       # Game class
│   ├── Player.js     # Player class
│   ├── Entity.js     # Base entity
│   └── Physics.js    # Physics logic
├── scenes/
│   ├── Menu.js
│   ├── Play.js
│   └── GameOver.js
├── ui/
│   └── UI.js
├── data/
│   ├── sprites.js    # Sprite data
│   ├── levels.js     # Level data
│   └── config.js     # Constants
└── services/
    ├── supabase.js
    └── auth.js
```

### 2. No TypeScript (HIGH)
**The problem:**
- Typos cause runtime errors
- No autocomplete for game objects
- Refactoring is scary
- Hard to understand data shapes

**The fix for next time:**
```
Use TypeScript from day one.
Even basic types help enormously.
```

**Minimum viable TypeScript:**
```typescript
// types.ts
interface Player {
  x: number;
  y: number;
  vy: number;
  isJumping: boolean;
}

interface Entity {
  type: 'obstacle' | 'banana' | 'powerup';
  x: number;
  y: number;
}

interface GameState {
  score: number;
  player: Player;
  entities: Entity[];
}
```

### 3. No Build System (MEDIUM)
**The problem:**
- Can't bundle/minify code
- No tree-shaking (dead code elimination)
- Can't use npm packages easily
- No hot module replacement for dev

**The fix for next time:**
```bash
# Use Vite from the start
npm create vite@latest my-game -- --template vanilla-ts
```

**Vite benefits:**
- 10x faster than Webpack
- Works with vanilla JS or any framework
- Built-in TypeScript support
- Hot reload in development
- Optimized production builds

### 4. Sprites as Arrays in Code (MEDIUM)
**The problem:**
- 2,800+ lines just for sprite data
- Hard to edit sprites
- No visual editor
- Bloats the main file

**The fix for next time:**
```
Use actual image files (PNG/WebP).
Use a sprite sheet generator.
Load assets asynchronously.
```

**Tools:**
- Aseprite (pixel art editor, $20)
- TexturePacker (sprite sheets)
- Piskel (free, web-based)

### 5. Achievement System Afterthought (HIGH)
**The problem:**
- Added achievements late
- Tracking scattered across codebase
- Many achievements don't actually work
- No proper testing

**The fix for next time:**
```
Design achievement system upfront.
Create tracking from day one.
Test each achievement individually.
```

**Achievement checklist:**
- [ ] Define all achievements in one file
- [ ] Create tracking hooks for each metric
- [ ] Write tests for unlock conditions
- [ ] Add debug mode to test achievements
- [ ] Verify retroactive unlocks work

### 6. Multiplayer Added Late (CRITICAL)
**The problem:**
- Solo game logic assumed one player
- Had to retrofit networking
- State sync is fragile
- Can't properly test locally

**The fix for next time:**
```
If multiplayer is planned, design for it from the start.
Even if building solo first, structure code for multiple players.
```

**Multiplayer-ready patterns:**
```javascript
// BAD: Assumes single player
let player = { x: 100, y: 200 };

// GOOD: Supports multiple players from start
let players = new Map();
players.set('local', { id: 'local', x: 100, y: 200 });
```

---

## Credentials & Services

### Supabase (Banana Runner Project)
```
Project Name: banana-runner
Project URL: https://cwolgatnphccqvunihav.supabase.co
Region: US East

# Public (safe for client-side)
SUPABASE_URL=https://cwolgatnphccqvunihav.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3b2xnYXRucGhjY3F2dW5paGF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0Mjc2NTksImV4cCI6MjA4MjAwMzY1OX0.IyhyEfc1OWnXYJ5FADPtIdpzRWBn2EXKlIt85l2_xLc

# Dashboard Access
Dashboard: https://supabase.com/dashboard/project/cwolgatnphccqvunihav
```

### Vercel
```
Project: banana-jump
Team: evan-c-navarros-projects
Production URL: https://banana-jump-phi.vercel.app

# Deploy commands
vercel          # Preview deploy
vercel --prod   # Production deploy
```

### GitHub
```
Repo: https://github.com/EvanCNavarro/bbb-banana-runner
User: EvanCNavarro

# Auth (already configured via `gh auth login`)
gh auth status  # Check login status
```

---

## New Project Setup Guide

### Step 1: Create Project with Phaser + TypeScript + Vite

```bash
# Create new game directory
mkdir my-new-game
cd my-new-game

# Initialize with Vite + TypeScript
npm create vite@latest . -- --template vanilla-ts

# Install core dependencies
npm install phaser @supabase/supabase-js

# Install dev dependencies (optional but recommended)
npm install -D eslint prettier eslint-config-prettier @typescript-eslint/parser
```

### Step 1b: Alternative - Use Phaser Template (Faster)

```bash
# Clone official Phaser + Vite template
npx degit phaserjs/template-vite-ts my-new-game
cd my-new-game
npm install

# Add Supabase
npm install @supabase/supabase-js
```

### Step 2: Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Choose organization, name, password, region
4. Wait for project to initialize (~2 minutes)
5. Go to Settings → API to get keys

### Step 3: Environment Variables

Create `.env` file (gitignored):
```bash
# .env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-anon-key
```

Create `.env.example` (committed):
```bash
# .env.example
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Add to `.gitignore`:
```
# .gitignore
node_modules/
dist/
.env
.env.local
.env.*.local
.vercel/
.DS_Store
```

### Step 4: Supabase Client Setup

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Step 5: Database Schema

Create `supabase/schema.sql`:
```sql
-- Profiles table (auto-created on signup)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    high_score INTEGER DEFAULT 0,
    total_games INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, username)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', 'player'))
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

Run in Supabase SQL Editor or via CLI:
```bash
# If using Supabase CLI
supabase db push
```

### Step 6: Initialize Git & GitHub

```bash
# Initialize git
git init

# Create initial commit
git add .
git commit -m "Initial project setup"

# Create GitHub repo and push
gh repo create my-new-game --public --source=. --remote=origin --push
```

### Step 7: Deploy to Vercel

```bash
# First deploy (will prompt for settings)
vercel

# Production deploy
vercel --prod
```

### Step 8: Set Vercel Environment Variables

```bash
# Add env vars to Vercel
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# Redeploy with env vars
vercel --prod
```

---

## Architecture Recommendations

### File Size Limits
```
Single file: MAX 500 lines
If approaching 500, split immediately
Game logic files: MAX 300 lines
```

### Module Pattern
```typescript
// Each module exports a single function or class
// src/game/Player.ts
export class Player {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  update(delta: number) {
    // Physics
  }

  draw(ctx: CanvasRenderingContext2D) {
    // Rendering
  }
}
```

### State Management
```typescript
// src/store/gameStore.ts
interface GameStore {
  // State
  score: number;
  isPlaying: boolean;

  // Actions
  startGame(): void;
  endGame(): void;
  addScore(points: number): void;
}

// Simple implementation (no library needed for small games)
export const gameStore: GameStore = {
  score: 0,
  isPlaying: false,

  startGame() {
    this.score = 0;
    this.isPlaying = true;
  },

  endGame() {
    this.isPlaying = false;
  },

  addScore(points: number) {
    this.score += points;
  }
};
```

### Game Loop Pattern
```typescript
// src/game/Game.ts
export class Game {
  private lastTime = 0;
  private isRunning = false;

  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  stop() {
    this.isRunning = false;
  }

  private loop(currentTime: number) {
    if (!this.isRunning) return;

    const deltaTime = currentTime - this.lastTime;
    const delta = deltaTime / 16.67; // Normalize to 60fps

    this.update(delta);
    this.draw();

    this.lastTime = currentTime;
    requestAnimationFrame((t) => this.loop(t));
  }

  private update(delta: number) {
    // Game logic here
  }

  private draw() {
    // Rendering here
  }
}
```

---

## Database Schema Patterns

### Minimum Viable Schema
```sql
-- For any game with users and scores
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    username TEXT UNIQUE NOT NULL,
    high_score INTEGER DEFAULT 0,
    total_games INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID REFERENCES profiles(id),
    score INTEGER NOT NULL,
    duration INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Always add indexes for queries
CREATE INDEX idx_profiles_high_score ON profiles(high_score DESC);
CREATE INDEX idx_sessions_player ON game_sessions(player_id);
```

### Leaderboard View
```sql
CREATE VIEW leaderboard AS
SELECT
    id,
    username,
    high_score,
    total_games,
    RANK() OVER (ORDER BY high_score DESC) as rank
FROM profiles
WHERE high_score > 0
ORDER BY high_score DESC;
```

### RLS Policy Template
```sql
-- Enable RLS
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Anyone can read" ON my_table
FOR SELECT USING (true);

-- Owner write
CREATE POLICY "Users can insert own data" ON my_table
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own data" ON my_table
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own data" ON my_table
FOR DELETE USING (auth.uid() = user_id);
```

---

## Multiplayer Learnings

### When to Add Multiplayer
```
✅ Design for multiplayer from start if:
   - Multiplayer is a core feature
   - Competitive gameplay planned
   - Social features important

❌ Don't retrofit multiplayer if:
   - Game works fine solo
   - Adding multiplayer doubles complexity
   - No clear multiplayer value prop
```

### Supabase Realtime Limits
```
Good for:
  - Lobby systems (player joins/leaves)
  - Turn-based games
  - Presence (who's online)
  - Chat

Bad for:
  - Real-time action games (>30 updates/sec needed)
  - Competitive multiplayer (latency matters)
  - Large player counts (>10 per room)

Update rate: ~10-15 updates/sec practical max
Latency: 50-200ms depending on region
```

### Better Multiplayer Options
```
PartyKit (recommended for indie)
  - Edge-deployed WebSocket rooms
  - <50ms latency globally
  - Pay-per-use pricing
  - https://partykit.io

Colyseus (self-hosted)
  - Full game server framework
  - State synchronization built-in
  - Need to manage servers
  - https://colyseus.io

Photon (enterprise)
  - Battle-tested at scale
  - More expensive
  - https://photonengine.com
```

### Multiplayer Architecture Pattern
```typescript
// Shared types between client and server
interface PlayerState {
  id: string;
  x: number;
  y: number;
  score: number;
  isAlive: boolean;
}

interface GameState {
  tick: number;
  players: Map<string, PlayerState>;
  entities: Entity[];
}

// Client sends inputs, not state
interface ClientInput {
  type: 'jump' | 'move';
  timestamp: number;
}

// Server sends authoritative state
interface ServerUpdate {
  state: GameState;
  yourLastProcessedInput: number;
}
```

---

## Deployment Checklist

### Before First Deploy
- [ ] Environment variables set in Vercel
- [ ] Supabase project created and configured
- [ ] Database schema applied
- [ ] RLS policies enabled
- [ ] Test locally with production env vars

### For Each Release
- [ ] All tests passing
- [ ] Tested on mobile devices
- [ ] No console errors
- [ ] Performance acceptable (60fps)
- [ ] Database migrations applied
- [ ] Git tag created (vX.Y.Z)
- [ ] GitHub release created

### Vercel Commands
```bash
# Development
vercel dev          # Run locally with Vercel env

# Deployment
vercel              # Preview deploy
vercel --prod       # Production deploy

# Environment
vercel env ls       # List env vars
vercel env add      # Add env var
vercel env rm       # Remove env var

# Domains
vercel domains      # List domains
vercel domains add  # Add custom domain
```

### GitHub Commands
```bash
# Tagging releases
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# Creating releases
gh release create v1.0.0 --title "v1.0.0" --notes "Release notes here"

# View releases
gh release list
```

---

## Quick Reference

### New Game Checklist
```bash
# 1. Create project (choose one)
npx degit phaserjs/template-vite-ts game-name  # Option A: Phaser template
# OR
npm create vite@latest game-name -- --template vanilla-ts  # Option B: Plain Vite

# 2. Install dependencies
cd game-name
npm install
npm install phaser @supabase/supabase-js
npm install -D eslint prettier

# 3. Create Supabase project
# → Go to https://supabase.com/dashboard → New Project

# 4. Create environment files
# → Create .env with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
# → Create .env.example (template, committed to git)

# 5. Set up file structure
# → Create src/scenes/, src/entities/, src/lib/, src/config/

# 6. Create database schema
# → Write supabase/schema.sql
# → Run in Supabase SQL Editor

# 7. Initialize Git
git init
git add .
git commit -m "Initial project setup with Phaser + TypeScript"

# 8. Create GitHub repo
gh repo create game-name --public --source=. --remote=origin --push

# 9. Deploy to Vercel
vercel                    # First deploy (creates project)
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel --prod             # Production deploy

# 10. Verify everything works
# → Open Vercel URL
# → Check Supabase connection
# → Test auth flow
```

### File Structure Template (Phaser + TypeScript)
```
my-game/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .env                 # gitignored - contains SUPABASE keys
├── .env.example         # committed - template for .env
├── .gitignore
├── README.md
│
├── src/
│   ├── main.ts          # Entry point - creates Phaser.Game
│   │
│   ├── scenes/          # Phaser scenes (game screens)
│   │   ├── BootScene.ts     # Asset loading
│   │   ├── MenuScene.ts     # Main menu
│   │   ├── PlayScene.ts     # Gameplay
│   │   └── GameOverScene.ts # Results
│   │
│   ├── entities/        # Game objects (extend Phaser.GameObjects)
│   │   ├── Player.ts
│   │   ├── Obstacle.ts
│   │   └── Collectible.ts
│   │
│   ├── lib/             # External service connections
│   │   └── supabase.ts      # Supabase client
│   │
│   ├── store/           # State management (if using Zustand)
│   │   ├── gameStore.ts
│   │   └── userStore.ts
│   │
│   ├── config/          # Game configuration
│   │   ├── constants.ts     # Physics, speeds, etc.
│   │   └── assets.ts        # Asset paths manifest
│   │
│   └── types/           # TypeScript type definitions
│       └── index.ts
│
├── public/
│   └── assets/
│       ├── sprites/     # PNG/WebP sprite sheets (from Aseprite)
│       │   ├── player.png
│       │   ├── player.json  # Aseprite JSON export
│       │   └── obstacles.png
│       ├── audio/       # Sound effects
│       │   ├── jump.wav
│       │   └── collect.wav
│       └── fonts/       # Custom fonts (if any)
│
└── supabase/
    └── schema.sql       # Database schema
```

### Example main.ts (Phaser Entry Point)
```typescript
// src/main.ts
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { PlayScene } from './scenes/PlayScene';
import { GameOverScene } from './scenes/GameOverScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,  // WebGL with Canvas fallback
  width: 800,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 800 },
      debug: false
    }
  },
  scene: [BootScene, MenuScene, PlayScene, GameOverScene]
};

new Phaser.Game(config);
```

### Example PlayScene.ts
```typescript
// src/scenes/PlayScene.ts
import Phaser from 'phaser';
import { Player } from '../entities/Player';

export class PlayScene extends Phaser.Scene {
  private player!: Player;
  private score = 0;
  private scoreText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'PlayScene' });
  }

  create() {
    // Create player
    this.player = new Player(this, 100, 300);

    // Create score display
    this.scoreText = this.add.text(16, 16, 'Score: 0', {
      fontSize: '32px',
      color: '#fff'
    });

    // Input
    this.input.on('pointerdown', () => this.player.jump());

    // Keyboard
    this.input.keyboard?.on('keydown-SPACE', () => this.player.jump());
  }

  update(time: number, delta: number) {
    this.player.update(delta);
  }

  addScore(points: number) {
    this.score += points;
    this.scoreText.setText(`Score: ${this.score}`);
  }
}
```

### Key Lessons Summary

**Architecture:**
1. **Use Phaser 3** - Don't reinvent physics, collisions, game loop
2. **TypeScript always** - Catches bugs before runtime
3. **Modular from day one** - Never let a file exceed 500 lines
4. **Use Vite** - Fast builds, hot reload, works with everything

**Backend:**
5. **Supabase for backend** - Auth + DB + Realtime in one
6. **Vercel for hosting** - One command deploys
7. **RLS from day one** - Security shouldn't be an afterthought

**Assets:**
8. **Use Aseprite** - $20 well spent for sprite sheets
9. **Real image files** - Not sprite arrays in code
10. **Lazy load audio** - Don't block game start

**Process:**
11. **Plan multiplayer upfront** - Or don't add it at all
12. **Test achievements individually** - Each one can break silently
13. **Commit often** - Small, focused commits
14. **Tag releases** - Makes rollback possible

**Don't Repeat These Mistakes:**
- 9,871 lines in one file
- No types = mystery bugs
- Retrofitting multiplayer
- Achievements as afterthought
- Manual game loop when Phaser handles it

---

## Handoff Instructions

To start a new game project in a new Claude session:

1. **Share this file** with the new session
2. **State the game concept** (e.g., "puzzle platformer" or "tower defense")
3. **Use this prompt:**

```
I want to build a new 2D browser game. Here's my lessons learned document
from a previous project. Please:

1. Set up a Phaser 3 + TypeScript + Vite project
2. Create a new Supabase project (I'll provide the keys)
3. Set up the file structure from the template
4. Create a basic playable prototype

The game concept is: [YOUR GAME IDEA]
```

---

*Created from Banana Runner (bbb-banana-runner) development experience.*
*Validated by Claude + Grok for best practices.*
*Use this document to bootstrap new game projects.*
