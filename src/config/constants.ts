// Game dimensions
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

// Colors
export const COLORS = {
  ocean: 0x2d6a9f,
  oceanLight: 0x4a90c2,
  sand: 0xf4d58d,
  grass: 0x5a9f5a,
  grassDark: 0x3d7a3d,
  treeTrunk: 0x8b4513,
  treeLeaves: 0x228b22,
  sky: 0x87ceeb,
  shadow: 0x000000,
};

// Level 1 - Bug Catching
export const LEVEL1 = {
  timeLimit: 60, // seconds
  bugsToWin: 10,
  islandRadius: 250, // Increased for more play area
};

// Lizard settings
export const LIZARD = {
  speed: 180,
  swimSpeed: 120,
  size: 32,
  color: 0x4ca64c, // Green
  bellyColor: 0xc8e6c8, // Light green belly
};

// Bug types with different behaviors
export const BUG_TYPES = {
  fly: {
    speed: 60,
    points: 1,
    color: 0x333333,
    size: 8,
    jitter: 0.8,
  },
  beetle: {
    speed: 30,
    points: 2,
    color: 0x654321,
    size: 12,
    jitter: 0.3,
  },
  cricket: {
    speed: 80,
    points: 2,
    color: 0x556b2f,
    size: 10,
    jitter: 0.5,
  },
  dragonfly: {
    speed: 100,
    points: 3,
    color: 0x4169e1,
    size: 14,
    jitter: 0.9,
  },
};

// Bird (hazard) settings
export const BIRD = {
  shadowGrowthRate: 0.5, // How fast shadow grows as bird approaches
  minShadowSize: 20,
  maxShadowSize: 70,
  attackDuration: 4500, // Slightly slower attack (4.5 seconds)
  cooldownMin: 6000,
  cooldownMax: 14000,
};

// World map islands
export const ISLANDS = [
  {
    id: 1,
    name: 'Starter Grove',
    x: 150,
    y: 300,
    unlocked: true,
    description: 'A small island with one tree. Catch 10 bugs to advance!'
  },
  {
    id: 2,
    name: 'Rocky Shore',
    x: 400,
    y: 200,
    unlocked: false,
    description: 'Navigate around rocks to catch 15 bugs. Watch out for the bird!'
  },
  {
    id: 3,
    name: 'Dense Jungle',
    x: 650,
    y: 350,
    unlocked: false,
    description: 'Coming soon...'
  },
];

// Swimming world map
export const WORLD_MAP = {
  lizardSwimSpeed: 100,
  interactionRadius: 50, // How close to trigger island modal
};
