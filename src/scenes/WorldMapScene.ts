import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, ISLANDS } from '../config/constants';
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

  create(data?: { fromLevel?: number }) {
    // Reset islands array (important when scene restarts!)
    this.islands = [];

    // Create ocean background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.ocean);

    // Wave effect graphics
    this.waveGraphics = this.add.graphics();
    this.waveGraphics.setDepth(5);

    // Create islands
    this.createIslands();

    // Create dotted paths between islands
    this.createPaths();

    // Determine spawn position based on where player came from
    let spawnX = 60;
    let spawnY = GAME_HEIGHT / 2;

    if (data?.fromLevel) {
      // Spawn to the RIGHT of the completed island so they don't re-trigger modal
      const completedIsland = this.islands.find(i => i.id === data.fromLevel);
      if (completedIsland) {
        spawnX = completedIsland.x + 100; // Right of the island
        spawnY = completedIsland.y;
        // Keep in bounds
        spawnX = Math.min(spawnX, GAME_WIDTH - 50);
      }
    }

    // Create lizard (swimming mode)
    this.lizard = new Lizard(this, spawnX, spawnY);
    this.lizard.setSwimming(true);

    // Set initial cooldown when coming from a level to prevent immediate re-trigger
    this.modalCooldown = data?.fromLevel ? 1500 : 0;

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

      // Island 1: Starter Grove - Sandy beach with palm tree
      if (islandData.id === 1) {
        const base = this.add.ellipse(0, 0, 80, 60, COLORS.sand);
        container.add(base);

        // Palm trunk
        const trunk = this.add.rectangle(0, -5, 6, 25, isUnlocked ? 0x8b6914 : 0x555555);
        container.add(trunk);

        // Palm fronds (simple triangles)
        const frondColor = isUnlocked ? 0x228b22 : 0x444444;
        const frond1 = this.add.triangle(-15, -22, 0, 10, 20, 0, 10, -5, frondColor);
        const frond2 = this.add.triangle(15, -22, 0, 10, -20, 0, -10, -5, frondColor);
        const frond3 = this.add.triangle(0, -28, -5, 8, 5, 8, 0, -8, frondColor);
        container.add(frond1);
        container.add(frond2);
        container.add(frond3);

        // Coconuts
        if (isUnlocked) {
          this.add.circle(0, -15, 3, 0x5c4033);
        }
      }
      // Island 2: Rocky Shore - Gray rocks on sand
      else if (islandData.id === 2) {
        const base = this.add.ellipse(0, 0, 80, 60, isUnlocked ? 0xc2b280 : 0x666666);
        container.add(base);

        // Rocks
        const rockColor = isUnlocked ? 0x696969 : 0x555555;
        const rock1 = this.add.ellipse(-15, -5, 20, 15, rockColor);
        const rock2 = this.add.ellipse(10, 0, 25, 18, rockColor);
        const rock3 = this.add.ellipse(0, -15, 15, 12, isUnlocked ? 0x808080 : 0x555555);
        container.add(rock1);
        container.add(rock2);
        container.add(rock3);
      }
      // Island 3: Dense Jungle - Green with multiple trees
      else if (islandData.id === 3) {
        const base = this.add.ellipse(0, 0, 80, 60, COLORS.sand);
        container.add(base);
        const grass = this.add.ellipse(0, -3, 65, 45, isUnlocked ? COLORS.grass : 0x555555);
        container.add(grass);

        // Multiple palm trees
        for (let i = 0; i < 2; i++) {
          const tx = -12 + i * 24;
          const trunk = this.add.rectangle(tx, -5, 5, 20, isUnlocked ? 0x8b6914 : 0x444444);
          container.add(trunk);

          const frondColor = isUnlocked ? 0x228b22 : 0x444444;
          const f1 = this.add.triangle(tx - 10, -18, 0, 8, 15, 0, 8, -4, frondColor);
          const f2 = this.add.triangle(tx + 10, -18, 0, 8, -15, 0, -8, -4, frondColor);
          container.add(f1);
          container.add(f2);
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
    // Require lizard to be closer to island center before triggering
    if (this.modalCooldown <= 0) {
      for (const island of this.islands) {
        const distance = Phaser.Math.Distance.Between(this.lizard.x, this.lizard.y, island.x, island.y);
        // Only trigger when within 60px of island center (was 90px before)
        if (distance < 60) {
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
    if (island.id === 1) {
      this.scene.start('Level1Scene');
    } else if (island.id === 2) {
      this.scene.start('Level2Scene');
    } else if (island.id === 3) {
      this.scene.start('Level3Scene');
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
