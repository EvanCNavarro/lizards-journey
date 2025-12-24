// localStorage wrapper for game saves

export interface GameSave {
  unlockedIslands: number[];
  bestScores: {
    [levelId: number]: {
      bugs: number;
      time: number;
      score: number;
    };
  };
}

const STORAGE_KEY = 'lizards_journey_save';

const defaultSave: GameSave = {
  unlockedIslands: [1], // Island 1 unlocked by default
  bestScores: {},
};

export function loadGame(): GameSave {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load game save:', e);
  }
  return { ...defaultSave };
}

export function saveGame(data: GameSave): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save game:', e);
  }
}

export function unlockIsland(islandId: number): void {
  const save = loadGame();
  if (!save.unlockedIslands.includes(islandId)) {
    save.unlockedIslands.push(islandId);
    saveGame(save);
  }
}

export function isIslandUnlocked(islandId: number): boolean {
  const save = loadGame();
  return save.unlockedIslands.includes(islandId);
}

export function saveBestScore(levelId: number, bugs: number, time: number, score: number): boolean {
  const save = loadGame();
  const existing = save.bestScores[levelId];

  // Check if this is a new best
  if (!existing || score > existing.score) {
    save.bestScores[levelId] = { bugs, time, score };
    saveGame(save);
    return true; // New best!
  }
  return false;
}

export function getBestScore(levelId: number): { bugs: number; time: number; score: number } | null {
  const save = loadGame();
  return save.bestScores[levelId] || null;
}

export function resetSave(): void {
  saveGame({ ...defaultSave });
}
