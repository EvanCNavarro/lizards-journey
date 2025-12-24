import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, LIZARD } from '../config/constants';
import { Lizard } from '../entities/Lizard';
import { Bug } from '../entities/Bug';
import type { BugType } from '../entities/Bug';
import { Bird } from '../entities/Bird';
import { HUD } from '../ui/HUD';
import { Modal } from '../ui/Modal';
import { Joystick } from '../ui/Joystick';
import { saveBestScore, getBestScore, unlockIsland } from '../lib/storage';

// Level 2 specific settings
const LEVEL2 = {
  timeLimit: 75, // More time, but harder
  bugsToWin: 15, // More bugs needed
  islandRadius: 230, // Slightly smaller - more cramped with rocks
};

export class Level2Scene extends Phaser.Scene {
  private lizard!: Lizard;
  private bugs: Bug[] = [];
  private bird!: Bird;
  private hud!: HUD;
  private modal!: Modal;
  private joystick!: Joystick;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };

  private islandCenterX: number = GAME_WIDTH / 2;
  private islandCenterY: number = GAME_HEIGHT / 2 + 20;
  private islandRadius: number = LEVEL2.islandRadius;

  private gameTimer!: Phaser.Time.TimerEvent;
  private timeRemaining: number = LEVEL2.timeLimit;
  private isGameOver: boolean = false;
  private isPaused: boolean = false;

  // Rock obstacles (lizard and bugs avoid these)
  private rocks: { x: number; y: number; radiusX: number; radiusY: number }[] = [];

  private readonly MIN_BUGS = 10;

  constructor() {
    super({ key: 'Level2Scene' });
  }

  create() {
    this.isGameOver = false;
    this.isPaused = false;
    this.timeRemaining = LEVEL2.timeLimit;
    this.bugs = [];
    this.rocks = [];

    // Create ocean background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.ocean);

    // Create island with rocks
    this.createIsland();

    // Create lizard at center
    this.lizard = new Lizard(this, this.islandCenterX, this.islandCenterY + 50);
    this.lizard.setSwimming(false);

    // Create bugs (more beetles and crickets for rocky terrain)
    this.spawnInitialBugs();

    // Create bird hazard
    this.bird = new Bird(this);
    this.bird.onAttack((x, y, radius) => {
      this.checkBirdAttack(x, y, radius);
    });

    // Create UI
    this.hud = new HUD(this);
    this.hud.setTarget(LEVEL2.bugsToWin);
    this.hud.setTime(this.timeRemaining);

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

    // Pause with ESC
    this.input.keyboard!.on('keydown-ESC', () => {
      this.togglePause();
    });

    // Start game timer
    this.gameTimer = this.time.addEvent({
      delay: 1000,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true,
    });

    // Level title
    const title = this.add.text(GAME_WIDTH / 2, 70, 'Rocky Shore', {
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    });
    title.setOrigin(0.5, 0.5);
    title.setDepth(90);
    title.setAlpha(0.7);
  }

  private createIsland() {
    // Island - tan/brown rocky sand
    const sand = this.add.graphics();
    sand.fillStyle(0xc2b280, 1); // Darker sandy color
    sand.fillEllipse(this.islandCenterX, this.islandCenterY, this.islandRadius * 2, this.islandRadius * 1.6);
    sand.setDepth(1);

    // Darker patches
    for (let i = 0; i < 5; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * this.islandRadius * 0.6;
      const x = this.islandCenterX + Math.cos(angle) * dist;
      const y = this.islandCenterY + Math.sin(angle) * dist * 0.8;
      const patch = this.add.ellipse(x, y, 35 + Math.random() * 25, 20 + Math.random() * 15, 0xa89060, 0.5);
      patch.setDepth(2);
    }

    // Create rock obstacles
    const rockPositions = [
      { x: -80, y: -40, rx: 45, ry: 30 },
      { x: 70, y: -60, rx: 35, ry: 25 },
      { x: -50, y: 50, rx: 30, ry: 22 },
      { x: 90, y: 30, rx: 40, ry: 28 },
      { x: 0, y: -80, rx: 50, ry: 35 },
    ];

    rockPositions.forEach((rock) => {
      const rockX = this.islandCenterX + rock.x;
      const rockY = this.islandCenterY + rock.y;

      // Store rock for collision
      this.rocks.push({ x: rockX, y: rockY, radiusX: rock.rx, radiusY: rock.ry });

      // Draw rock (layered for 3D effect)
      const baseRock = this.add.ellipse(rockX, rockY + 5, rock.rx, rock.ry * 0.8, 0x505050);
      baseRock.setDepth(18);

      const mainRock = this.add.ellipse(rockX, rockY, rock.rx, rock.ry, 0x696969);
      mainRock.setDepth(19);

      const highlight = this.add.ellipse(rockX - rock.rx * 0.2, rockY - rock.ry * 0.2, rock.rx * 0.6, rock.ry * 0.5, 0x888888, 0.5);
      highlight.setDepth(20);
    });

    // Small pebbles scattered around
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 50 + Math.random() * (this.islandRadius - 70);
      const x = this.islandCenterX + Math.cos(angle) * dist;
      const y = this.islandCenterY + Math.sin(angle) * dist * 0.8;

      // Check not inside a rock
      let insideRock = false;
      for (const rock of this.rocks) {
        const dx = x - rock.x;
        const dy = y - rock.y;
        if ((dx * dx) / (rock.radiusX * rock.radiusX) + (dy * dy) / (rock.radiusY * rock.radiusY) < 1.2) {
          insideRock = true;
          break;
        }
      }

      if (!insideRock) {
        const pebble = this.add.circle(x, y, 3 + Math.random() * 4, 0x777777);
        pebble.setDepth(3);
      }
    }
  }

  private spawnInitialBugs() {
    // More beetles and crickets (rocky terrain bugs)
    const bugTypes: BugType[] = [
      'beetle', 'beetle', 'beetle', 'beetle',
      'cricket', 'cricket', 'cricket',
      'fly', 'fly',
      'dragonfly'
    ];

    bugTypes.forEach((type) => {
      this.spawnBug(type);
    });
  }

  private spawnBug(type?: BugType) {
    let x: number, y: number;
    let attempts = 0;
    let valid = false;

    while (!valid && attempts < 30) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 50 + Math.random() * (this.islandRadius - 70);
      x = this.islandCenterX + Math.cos(angle) * distance;
      y = this.islandCenterY + Math.sin(angle) * distance * 0.8;

      // Check not inside any rock
      valid = true;
      for (const rock of this.rocks) {
        const dx = x! - rock.x;
        const dy = y! - rock.y;
        if ((dx * dx) / (rock.radiusX * rock.radiusX) + (dy * dy) / (rock.radiusY * rock.radiusY) < 1.3) {
          valid = false;
          break;
        }
      }
      attempts++;
    }

    if (!valid) {
      x = this.islandCenterX;
      y = this.islandCenterY + 60;
    }

    // Random type if not specified (favor beetles/crickets)
    if (!type) {
      const types: BugType[] = ['beetle', 'beetle', 'cricket', 'cricket', 'fly', 'dragonfly'];
      type = types[Math.floor(Math.random() * types.length)];
    }

    const bug = new Bug(this, x!, y!, type, this.islandRadius, this.islandCenterX, this.islandCenterY);
    this.bugs.push(bug);
  }

  private updateTimer() {
    if (this.isGameOver || this.isPaused) return;

    this.timeRemaining--;
    this.hud.setTime(this.timeRemaining);

    if (this.timeRemaining <= 0) {
      this.gameOver(false);
    }
  }

  update(_time: number, delta: number) {
    if (this.isGameOver || this.isPaused || this.modal.getIsVisible()) {
      this.lizard.stop();
      return;
    }

    // Handle input
    let dx = 0;
    let dy = 0;

    if (this.cursors.left.isDown || this.wasd.A.isDown) dx -= 1;
    if (this.cursors.right.isDown || this.wasd.D.isDown) dx += 1;
    if (this.cursors.up.isDown || this.wasd.W.isDown) dy -= 1;
    if (this.cursors.down.isDown || this.wasd.S.isDown) dy += 1;

    if (this.joystick.input.isActive) {
      dx = this.joystick.input.x;
      dy = this.joystick.input.y;
    }

    this.lizard.move(dx, dy);

    // Constrain to island and avoid rocks
    this.constrainToIsland();
    this.avoidRocks();

    // Update bugs
    this.bugs.forEach((bug) => bug.update(delta));

    // Check bug collisions
    this.checkBugCollisions();

    // Update bird
    this.bird.update(delta, this.lizard.x, this.lizard.y, this.islandRadius, this.islandCenterX, this.islandCenterY);

    // Maintain bug count
    if (this.bugs.length < this.MIN_BUGS) {
      this.spawnBug();
    }

    // Check win condition
    if (this.hud.getBugsCollected() >= LEVEL2.bugsToWin) {
      this.gameOver(true);
    }
  }

  private constrainToIsland() {
    const dx = this.lizard.x - this.islandCenterX;
    const dy = this.lizard.y - this.islandCenterY;

    const a = this.islandRadius - LIZARD.size / 2;
    const b = a * 0.8;

    const ellipseDistance = (dx * dx) / (a * a) + (dy * dy) / (b * b);

    if (ellipseDistance > 1) {
      const angle = Math.atan2(dy * a, dx * b);
      const newX = this.islandCenterX + a * Math.cos(angle);
      const newY = this.islandCenterY + b * Math.sin(angle);

      this.lizard.x = newX;
      this.lizard.y = newY;

      const normalX = dx / (a * a);
      const normalY = dy / (b * b);
      const normalLen = Math.sqrt(normalX * normalX + normalY * normalY);

      if (normalLen > 0) {
        const nx = normalX / normalLen;
        const ny = normalY / normalLen;

        const body = this.lizard.body as Phaser.Physics.Arcade.Body;
        const vx = body.velocity.x;
        const vy = body.velocity.y;

        const outwardSpeed = vx * nx + vy * ny;

        if (outwardSpeed > 0) {
          body.setVelocity(vx - outwardSpeed * nx, vy - outwardSpeed * ny);
        }
      }
    }
  }

  private avoidRocks() {
    for (const rock of this.rocks) {
      const dx = this.lizard.x - rock.x;
      const dy = this.lizard.y - rock.y;
      const rx = rock.radiusX + LIZARD.size / 2;
      const ry = rock.radiusY + LIZARD.size / 2;

      const ellipseDist = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);

      if (ellipseDist < 1) {
        // Push out of rock
        const angle = Math.atan2(dy * rx, dx * ry);
        this.lizard.x = rock.x + rx * Math.cos(angle);
        this.lizard.y = rock.y + ry * Math.sin(angle);

        // Stop velocity toward rock
        const body = this.lizard.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(0, 0);
      }
    }
  }

  private checkBugCollisions() {
    const lizardCircle = this.lizard.getCollisionCircle();

    for (let i = this.bugs.length - 1; i >= 0; i--) {
      const bug = this.bugs[i];
      const bugCircle = new Phaser.Geom.Circle(bug.x, bug.y, bug.getRadius());

      if (Phaser.Geom.Intersects.CircleToCircle(lizardCircle, bugCircle)) {
        this.hud.addBug(bug.points);

        const text = this.add.text(bug.x, bug.y, `+${bug.points}`, {
          fontSize: '20px',
          fontStyle: 'bold',
          color: '#ffff00',
          stroke: '#000000',
          strokeThickness: 3,
        });
        text.setOrigin(0.5, 0.5);
        text.setDepth(200);

        this.tweens.add({
          targets: text,
          y: bug.y - 40,
          alpha: 0,
          duration: 600,
          ease: 'Power2',
          onComplete: () => text.destroy(),
        });

        bug.destroy();
        this.bugs.splice(i, 1);
      }
    }
  }

  private checkBirdAttack(x: number, y: number, radius: number) {
    const distance = Phaser.Math.Distance.Between(this.lizard.x, this.lizard.y, x, y);

    if (distance < radius + LIZARD.size / 2) {
      this.gameOver(false);
    }
  }

  private togglePause() {
    if (this.isGameOver) return;

    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      this.gameTimer.paused = true;
      this.modal.show({
        title: 'Paused',
        content: ['Game paused'],
        buttons: [
          {
            text: 'Resume',
            primary: true,
            callback: () => {
              this.isPaused = false;
              this.gameTimer.paused = false;
            },
          },
          {
            text: 'Quit',
            callback: () => {
              this.scene.start('WorldMapScene');
            },
          },
        ],
      });
    }
  }

  private gameOver(won: boolean) {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.gameTimer.paused = true;

    const bugsCollected = this.hud.getBugsCollected();
    const score = this.hud.getScore();
    const timeRemaining = this.hud.getTimeRemaining();

    const timeBonus = won ? timeRemaining * 10 : 0;
    const totalScore = score + timeBonus;

    const isNewBest = saveBestScore(2, bugsCollected, timeRemaining, totalScore);
    const best = getBestScore(2);

    if (won) {
      unlockIsland(3);

      const content = [
        `Time remaining: ${Math.floor(timeRemaining / 60)}:${(timeRemaining % 60).toString().padStart(2, '0')}`,
        `Bugs collected: ${bugsCollected}`,
        `Time bonus: +${timeBonus}`,
        '',
        `Total Score: ${totalScore}${isNewBest ? ' NEW BEST!' : ''}`,
      ];

      if (!isNewBest && best) {
        content.push(`Your best: ${best.score}`);
      }

      content.push('', 'Dense Jungle unlocked!');

      this.modal.show({
        title: 'Level Complete!',
        content,
        buttons: [
          {
            text: 'Continue',
            primary: true,
            callback: () => {
              this.scene.start('WorldMapScene');
            },
          },
        ],
      });
    } else {
      const content = [`Bugs collected: ${bugsCollected}`];

      if (best) {
        content.push(`Your best: ${best.bugs}`);
      }

      this.modal.show({
        title: 'Game Over',
        content,
        buttons: [
          {
            text: 'Retry',
            primary: true,
            callback: () => {
              this.scene.restart();
            },
          },
          {
            text: 'Exit',
            callback: () => {
              this.scene.start('WorldMapScene');
            },
          },
        ],
      });

      this.cameras.main.flash(500, 255, 0, 0);
    }
  }
}
