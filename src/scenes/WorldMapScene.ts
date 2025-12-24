import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, ISLANDS, WORLD_MAP } from '../config/constants';
import { Lizard } from '../entities/Lizard';
import { Modal } from '../ui/Modal';
import { Joystick } from '../ui/Joystick';
import { isIslandUnlocked } from '../lib/storage';

interface Island {
  id: number;
  name: string;
  x: number;
  y: number;
  unlocked: boolean;
  description: string;
  sprite?: Phaser.GameObjects.Container;
}

export class WorldMapScene extends Phaser.Scene {
  private lizard!: Lizard;
  private modal!: Modal;
  private joystick!: Joystick;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private islands: Island[] = [];
  private waveOffset: number = 0;
  private waveGraphics!: Phaser.GameObjects.Graphics;
  private modalCooldown: number = 0; // Prevent modal from re-triggering immediately

  constructor() {
    super({ key: 'WorldMapScene' });
  }

  create() {
    // Create ocean background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.ocean);

    // Wave effect graphics
    this.waveGraphics = this.add.graphics();
    this.waveGraphics.setDepth(5);

    // Create islands
    this.createIslands();

    // Create dotted paths between islands
    this.createPaths();

    // Create lizard (swimming mode) - spawn middle-left, away from islands and joystick
    this.lizard = new Lizard(this, 60, GAME_HEIGHT / 2);
    this.lizard.setSwimming(true);

    // Reset modal cooldown
    this.modalCooldown = 0;

    // Set world bounds
    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Create UI
    this.modal = new Modal(this);
    this.joystick = new Joystick(this, 80, GAME_HEIGHT - 80);

    // Set up keyboard input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    // Title text
    const title = this.add.text(GAME_WIDTH / 2, 30, "Lizard's Journey", {
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    });
    title.setOrigin(0.5, 0.5);
    title.setDepth(100);

    // Instructions
    const instructions = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30, 'Swim to an island to enter', {
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    });
    instructions.setOrigin(0.5, 0.5);
    instructions.setDepth(100);
  }

  private createIslands() {
    ISLANDS.forEach((islandData) => {
      const isUnlocked = isIslandUnlocked(islandData.id);

      const container = this.add.container(islandData.x, islandData.y);

      // Island base (sand)
      const base = this.add.ellipse(0, 0, 80, 60, COLORS.sand);
      container.add(base);

      // Grass on top
      const grass = this.add.ellipse(0, -5, 60, 40, isUnlocked ? COLORS.grass : 0x666666);
      container.add(grass);

      // Tree
      if (islandData.id === 1) {
        const trunk = this.add.rectangle(0, -10, 8, 20, COLORS.treeTrunk);
        const leaves = this.add.circle(0, -25, 18, isUnlocked ? COLORS.treeLeaves : 0x444444);
        container.add(trunk);
        container.add(leaves);
      } else if (islandData.id === 2) {
        // Rocky shore - add rocks
        for (let i = 0; i < 3; i++) {
          const rock = this.add.circle(-15 + i * 15, -5, 8, isUnlocked ? 0x888888 : 0x555555);
          container.add(rock);
        }
      } else if (islandData.id === 3) {
        // Dense jungle - multiple trees
        for (let i = 0; i < 2; i++) {
          const trunk = this.add.rectangle(-12 + i * 24, -8, 6, 16, COLORS.treeTrunk);
          const leaves = this.add.circle(-12 + i * 24, -20, 14, isUnlocked ? COLORS.treeLeaves : 0x444444);
          container.add(trunk);
          container.add(leaves);
        }
      }

      // Island name label
      const label = this.add.text(0, 40, islandData.name, {
        fontSize: '14px',
        color: isUnlocked ? '#ffffff' : '#888888',
        stroke: '#000000',
        strokeThickness: 2,
      });
      label.setOrigin(0.5, 0.5);
      container.add(label);

      // Lock icon if locked
      if (!isUnlocked) {
        const lock = this.add.text(0, -40, '🔒', { fontSize: '20px' });
        lock.setOrigin(0.5, 0.5);
        container.add(lock);
      }

      container.setDepth(10);

      const island: Island = {
        ...islandData,
        unlocked: isUnlocked,
        sprite: container,
      };

      this.islands.push(island);
    });
  }

  private createPaths() {
    const graphics = this.add.graphics();
    graphics.lineStyle(2, 0xffffff, 0.3);
    graphics.setDepth(1);

    // Draw dotted lines between islands
    for (let i = 0; i < this.islands.length - 1; i++) {
      const from = this.islands[i];
      const to = this.islands[i + 1];

      const distance = Phaser.Math.Distance.Between(from.x, from.y, to.x, to.y);
      const steps = Math.floor(distance / 15);

      for (let j = 0; j < steps; j++) {
        if (j % 2 === 0) {
          const t = j / steps;
          const x = Phaser.Math.Linear(from.x, to.x, t);
          const y = Phaser.Math.Linear(from.y, to.y, t);
          graphics.fillStyle(0xffffff, 0.3);
          graphics.fillCircle(x, y, 3);
        }
      }
    }
  }

  update(time: number, delta: number) {
    // Decrease modal cooldown
    if (this.modalCooldown > 0) {
      this.modalCooldown -= delta;
    }

    if (this.modal.getIsVisible()) {
      this.lizard.stop();
      return;
    }

    // Handle input
    let dx = 0;
    let dy = 0;

    // Keyboard input
    if (this.cursors.left.isDown || this.wasd.A.isDown) dx -= 1;
    if (this.cursors.right.isDown || this.wasd.D.isDown) dx += 1;
    if (this.cursors.up.isDown || this.wasd.W.isDown) dy -= 1;
    if (this.cursors.down.isDown || this.wasd.S.isDown) dy += 1;

    // Joystick input (if active, overrides keyboard)
    if (this.joystick.input.isActive) {
      dx = this.joystick.input.x;
      dy = this.joystick.input.y;
    }

    // Move lizard
    this.lizard.move(dx, dy);

    // Check proximity to islands (only if cooldown expired)
    if (this.modalCooldown <= 0) {
      for (const island of this.islands) {
        const distance = Phaser.Math.Distance.Between(this.lizard.x, this.lizard.y, island.x, island.y);
        if (distance < WORLD_MAP.interactionRadius + 40) {
          this.showIslandModal(island);
          break;
        }
      }
    }

    // Update wave animation
    this.updateWaves(time);
  }

  private updateWaves(time: number) {
    this.waveOffset = time * 0.001;
    this.waveGraphics.clear();
    this.waveGraphics.lineStyle(2, COLORS.oceanLight, 0.3);

    // Draw wavy lines
    for (let y = 50; y < GAME_HEIGHT; y += 80) {
      this.waveGraphics.beginPath();
      for (let x = 0; x <= GAME_WIDTH; x += 10) {
        const waveY = y + Math.sin((x * 0.02) + this.waveOffset + (y * 0.01)) * 8;
        if (x === 0) {
          this.waveGraphics.moveTo(x, waveY);
        } else {
          this.waveGraphics.lineTo(x, waveY);
        }
      }
      this.waveGraphics.strokePath();
    }
  }

  private showIslandModal(island: Island) {
    if (this.modal.getIsVisible()) return;

    if (island.unlocked) {
      this.modal.show({
        title: `🏝️ ${island.name}`,
        content: [island.description],
        buttons: [
          {
            text: 'Enter',
            primary: true,
            callback: () => {
              this.enterIsland(island);
            },
          },
          {
            text: 'Back',
            callback: () => {
              // Set cooldown so modal doesn't immediately re-trigger
              this.modalCooldown = 1000; // 1 second cooldown
            },
          },
        ],
      });
    } else {
      this.modal.show({
        title: `🔒 ${island.name}`,
        content: ['Complete the previous island to unlock!'],
        buttons: [
          {
            text: 'OK',
            primary: true,
            callback: () => {
              // Set cooldown so modal doesn't immediately re-trigger
              this.modalCooldown = 1000; // 1 second cooldown
            },
          },
        ],
      });
    }
  }

  private enterIsland(island: Island) {
    // For now, only Island 1 has gameplay
    if (island.id === 1) {
      this.scene.start('Level1Scene');
    } else {
      // Coming soon
      this.modal.show({
        title: 'Coming Soon',
        content: ['This level is not yet available.'],
        buttons: [
          {
            text: 'OK',
            primary: true,
            callback: () => {},
          },
        ],
      });
    }
  }
}
