import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, LEVEL1, LIZARD } from '../config/constants';
import { Lizard } from '../entities/Lizard';
import { Bug } from '../entities/Bug';
import type { BugType } from '../entities/Bug';
import { Bird } from '../entities/Bird';
import { HUD } from '../ui/HUD';
import { Modal } from '../ui/Modal';
import { Joystick } from '../ui/Joystick';
import { saveBestScore, getBestScore, unlockIsland } from '../lib/storage';

export class Level1Scene extends Phaser.Scene {
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
  private islandRadius: number = LEVEL1.islandRadius;

  private gameTimer!: Phaser.Time.TimerEvent;
  private timeRemaining: number = LEVEL1.timeLimit;
  private isGameOver: boolean = false;
  private isPaused: boolean = false;

  private readonly MIN_BUGS = 8;

  constructor() {
    super({ key: 'Level1Scene' });
  }

  create() {
    this.isGameOver = false;
    this.isPaused = false;
    this.timeRemaining = LEVEL1.timeLimit;
    this.bugs = [];

    // Create ocean background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.ocean);

    // Create island
    this.createIsland();

    // Create lizard at center
    this.lizard = new Lizard(this, this.islandCenterX, this.islandCenterY);
    this.lizard.setSwimming(false);

    // Create bugs
    this.spawnInitialBugs();

    // Create bird hazard
    this.bird = new Bird(this);
    this.bird.onAttack((x, y, radius) => {
      this.checkBirdAttack(x, y, radius);
    });

    // Create UI
    this.hud = new HUD(this);
    this.hud.setTarget(LEVEL1.bugsToWin);
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
    const title = this.add.text(GAME_WIDTH / 2, 70, 'Starter Grove', {
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
    // Island - all sand
    const sand = this.add.graphics();
    sand.fillStyle(COLORS.sand, 1);
    sand.fillEllipse(this.islandCenterX, this.islandCenterY, this.islandRadius * 2, this.islandRadius * 1.6);
    sand.setDepth(1);

    // Lighter sand patches for texture
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * this.islandRadius * 0.7;
      const x = this.islandCenterX + Math.cos(angle) * dist;
      const y = this.islandCenterY + Math.sin(angle) * dist * 0.8;
      const patch = this.add.ellipse(x, y, 40 + Math.random() * 30, 25 + Math.random() * 20, 0xf9e4a6, 0.4);
      patch.setDepth(2);
    }

    // Palm tree
    const treeX = this.islandCenterX;
    const treeY = this.islandCenterY - 20;

    // Curved palm trunk (using multiple segments)
    const trunkGraphics = this.add.graphics();
    trunkGraphics.fillStyle(0x8b6914, 1); // Darker brown for palm

    // Draw trunk as curved shape
    trunkGraphics.beginPath();
    trunkGraphics.moveTo(treeX - 8, treeY + 50);
    trunkGraphics.lineTo(treeX + 8, treeY + 50);
    trunkGraphics.lineTo(treeX + 12, treeY + 20);
    trunkGraphics.lineTo(treeX + 6, treeY - 20);
    trunkGraphics.lineTo(treeX - 6, treeY - 20);
    trunkGraphics.lineTo(treeX - 12, treeY + 20);
    trunkGraphics.closePath();
    trunkGraphics.fillPath();
    trunkGraphics.setDepth(20);

    // Trunk rings/texture
    trunkGraphics.lineStyle(2, 0x6b4f0a, 0.5);
    for (let i = 0; i < 5; i++) {
      const ringY = treeY + 40 - i * 15;
      const ringWidth = 10 - i * 1;
      trunkGraphics.strokeEllipse(treeX, ringY, ringWidth * 2, 6);
    }

    // Palm fronds (leaf shapes radiating from top)
    const frondGraphics = this.add.graphics();
    frondGraphics.setDepth(21);

    const frondAngles = [-150, -120, -80, -40, 0, 40, 80, 120, 150];
    frondAngles.forEach((angleDeg) => {
      const angle = (angleDeg * Math.PI) / 180;
      const length = 50 + Math.random() * 15;

      // Frond stem
      const endX = treeX + Math.cos(angle) * length;
      const endY = treeY - 25 + Math.sin(angle) * length * 0.6;

      // Draw frond as elongated leaf shape
      frondGraphics.fillStyle(0x228b22, 1);
      frondGraphics.beginPath();
      frondGraphics.moveTo(treeX, treeY - 25);

      // Control points for curved frond
      const midX = treeX + Math.cos(angle) * length * 0.5;
      const midY = treeY - 25 + Math.sin(angle) * length * 0.3;

      // Draw leaf shape
      frondGraphics.lineTo(midX - Math.sin(angle) * 8, midY + Math.cos(angle) * 8);
      frondGraphics.lineTo(endX, endY);
      frondGraphics.lineTo(midX + Math.sin(angle) * 8, midY - Math.cos(angle) * 8);
      frondGraphics.closePath();
      frondGraphics.fillPath();
    });

    // Coconuts at top of trunk
    const coconutColor = 0x5c4033;
    this.add.circle(treeX - 6, treeY - 18, 6, coconutColor).setDepth(22);
    this.add.circle(treeX + 6, treeY - 18, 6, coconutColor).setDepth(22);
    this.add.circle(treeX, treeY - 22, 5, coconutColor).setDepth(22);
  }

  private spawnInitialBugs() {
    const bugTypes: BugType[] = ['fly', 'fly', 'fly', 'beetle', 'beetle', 'cricket', 'cricket', 'dragonfly'];

    bugTypes.forEach((type) => {
      this.spawnBug(type);
    });
  }

  private spawnBug(type?: BugType) {
    // Random position within island bounds (avoiding center tree area)
    let x: number, y: number;
    let attempts = 0;

    do {
      const angle = Math.random() * Math.PI * 2;
      const distance = 60 + Math.random() * (this.islandRadius - 80);
      x = this.islandCenterX + Math.cos(angle) * distance;
      y = this.islandCenterY + Math.sin(angle) * distance * 0.8;
      attempts++;
    } while (
      Phaser.Math.Distance.Between(x, y, this.islandCenterX, this.islandCenterY - 30) < 60 &&
      attempts < 20
    );

    // Random type if not specified
    if (!type) {
      const types: BugType[] = ['fly', 'fly', 'beetle', 'cricket', 'dragonfly'];
      type = types[Math.floor(Math.random() * types.length)];
    }

    const bug = new Bug(this, x, y, type, this.islandRadius, this.islandCenterX, this.islandCenterY);
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

    // Keyboard input
    if (this.cursors.left.isDown || this.wasd.A.isDown) dx -= 1;
    if (this.cursors.right.isDown || this.wasd.D.isDown) dx += 1;
    if (this.cursors.up.isDown || this.wasd.W.isDown) dy -= 1;
    if (this.cursors.down.isDown || this.wasd.S.isDown) dy += 1;

    // Joystick input
    if (this.joystick.input.isActive) {
      dx = this.joystick.input.x;
      dy = this.joystick.input.y;
    }

    // Move lizard
    this.lizard.move(dx, dy);

    // Constrain lizard to island
    this.constrainToIsland();

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
    if (this.hud.getBugsCollected() >= LEVEL1.bugsToWin) {
      this.gameOver(true);
    }
  }

  private constrainToIsland() {
    // Use ellipse equation: (x/a)^2 + (y/b)^2 = 1
    const dx = this.lizard.x - this.islandCenterX;
    const dy = this.lizard.y - this.islandCenterY;

    const a = this.islandRadius - LIZARD.size / 2; // horizontal radius
    const b = a * 0.8; // vertical radius (ellipse is squished)

    // Check if outside ellipse: (dx/a)^2 + (dy/b)^2 > 1
    const ellipseDistance = (dx * dx) / (a * a) + (dy * dy) / (b * b);

    if (ellipseDistance > 1) {
      // Project back onto ellipse edge
      const angle = Math.atan2(dy * a, dx * b); // Correct angle for ellipse
      const newX = this.islandCenterX + a * Math.cos(angle);
      const newY = this.islandCenterY + b * Math.sin(angle);

      // Move lizard back to edge
      this.lizard.x = newX;
      this.lizard.y = newY;

      // Calculate tangent direction at this point on ellipse
      // Tangent is perpendicular to normal. Normal at (x,y) on ellipse is (x/a², y/b²)
      const normalX = dx / (a * a);
      const normalY = dy / (b * b);
      const normalLen = Math.sqrt(normalX * normalX + normalY * normalY);

      if (normalLen > 0) {
        const nx = normalX / normalLen;
        const ny = normalY / normalLen;

        // Get current velocity
        const body = this.lizard.body as Phaser.Physics.Arcade.Body;
        const vx = body.velocity.x;
        const vy = body.velocity.y;

        // Remove the component of velocity pointing outward (dot product with normal)
        const outwardSpeed = vx * nx + vy * ny;

        if (outwardSpeed > 0) {
          // Only remove outward component, keep tangential movement
          body.setVelocity(vx - outwardSpeed * nx, vy - outwardSpeed * ny);
        }
      }
    }
  }

  private checkBugCollisions() {
    const lizardCircle = this.lizard.getCollisionCircle();

    for (let i = this.bugs.length - 1; i >= 0; i--) {
      const bug = this.bugs[i];
      const bugCircle = new Phaser.Geom.Circle(bug.x, bug.y, bug.getRadius());

      if (Phaser.Geom.Intersects.CircleToCircle(lizardCircle, bugCircle)) {
        // Collect bug
        this.hud.addBug(bug.points);

        // Visual feedback
        this.createCollectEffect(bug.x, bug.y, bug.points);

        // Remove bug
        bug.destroy();
        this.bugs.splice(i, 1);
      }
    }
  }

  private createCollectEffect(x: number, y: number, points: number) {
    const text = this.add.text(x, y, `+${points}`, {
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
      y: y - 40,
      alpha: 0,
      duration: 600,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    });
  }

  private checkBirdAttack(x: number, y: number, radius: number) {
    const distance = Phaser.Math.Distance.Between(this.lizard.x, this.lizard.y, x, y);

    if (distance < radius + LIZARD.size / 2) {
      // Player caught!
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
              this.scene.start('WorldMapScene', { fromLevel: 1 });
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

    // Calculate bonus for remaining time if won
    const timeBonus = won ? timeRemaining * 10 : 0;
    const totalScore = score + timeBonus;

    // Save score and check for new best
    const isNewBest = saveBestScore(1, bugsCollected, timeRemaining, totalScore);
    const best = getBestScore(1);

    if (won) {
      // Unlock next island
      unlockIsland(2);

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

      content.push('', 'Rocky Shore unlocked!');

      this.modal.show({
        title: 'Level Complete!',
        content,
        buttons: [
          {
            text: 'Continue',
            primary: true,
            callback: () => {
              this.scene.start('WorldMapScene', { fromLevel: 1 });
            },
          },
        ],
      });
    } else {
      // Game over - lost
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
              this.scene.start('WorldMapScene', { fromLevel: 1 });
            },
          },
        ],
      });

      // Red flash effect
      this.cameras.main.flash(500, 255, 0, 0);
    }
  }
}
