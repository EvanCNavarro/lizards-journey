import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from './constants';
import { BootScene } from '../scenes/BootScene';
import { WorldMapScene } from '../scenes/WorldMapScene';
import { Level1Scene } from '../scenes/Level1Scene';
import { Level2Scene } from '../scenes/Level2Scene';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: COLORS.ocean,
  pixelArt: false,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 }, // Top-down, no gravity
      debug: false,
    },
  },
  scene: [BootScene, WorldMapScene, Level1Scene, Level2Scene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};
