import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, LIZARD } from '../config/constants';
import { Lizard } from '../entities/Lizard';
import { Bug } from '../entities/Bug';
import type { BugType } from '../entities/Bug';
import { HUD } from '../ui/HUD';
import { Modal } from '../ui/Modal';
import { Joystick } from '../ui/Joystick';
import { saveBestScore, getBestScore } from '../lib/storage';

// Tree difficulty progression
const TREE_CONFIG = [
  { bugsNeeded: 3, types: ['fly', 'beetle'] as BugType[], speedMult: 0.8 },
  { bugsNeeded: 3, types: ['fly', 'beetle', 'cricket'] as BugType[], speedMult: 0.9 },
  { bugsNeeded: 4, types: ['fly', 'beetle', 'cricket'] as BugType[], speedMult: 1.0 },
  { bugsNeeded: 4, types: ['beetle', 'cricket', 'dragonfly'] as BugType[], speedMult: 1.0 },
  { bugsNeeded: 5, types: ['cricket', 'dragonfly'] as BugType[], speedMult: 1.1 },
  { bugsNeeded: 5, types: ['fly', 'cricket', 'dragonfly'] as BugType[], speedMult: 1.2 },
  { bugsNeeded: 6, types: ['cricket', 'dragonfly'] as BugType[], speedMult: 1.3 },
  { bugsNeeded: 6, types: ['dragonfly', 'dragonfly', 'cricket'] as BugType[], speedMult: 1.4 },
];

type GamePhase = 'ground' | 'climbing' | 'canopy';

export class Level3Scene extends Phaser.Scene {
  private lizard!: Lizard;
  private bugs: Bug[] = [];
  private hud!: HUD;
  private modal!: Modal;
  private joystick!: Joystick;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };

  private phase: GamePhase = 'ground';
  private currentTree: number = 0;
  private treeBugsCaught: number = 0;
  private totalBugsCaught: number = 0;
  private totalScore: number = 0;

  private isGameOver: boolean = false;
  private isPaused: boolean = false;

  // Ground phase visuals
  private groundContainer!: Phaser.GameObjects.Container;
  private treeSprites: Phaser.GameObjects.Container[] = [];
  private treePositions: { x: number; y: number; scale: number }[] = [];

  // Canopy phase visuals
  private canopyContainer!: Phaser.GameObjects.Container;
  private canopyRadius: number = 180;
  private canopyCenterX: number = GAME_WIDTH / 2;
  private canopyCenterY: number = GAME_HEIGHT / 2 + 30;

  // Climbing animation
  private isClimbing: boolean = false;

  constructor() {
    super({ key: 'Level3Scene' });
  }

  create() {
    this.isGameOver = false;
    this.isPaused = false;
    this.phase = 'ground';
    this.currentTree = 0;
    this.treeBugsCaught = 0;
    this.totalBugsCaught = 0;
    this.totalScore = 0;
    this.bugs = [];
    this.treeSprites = [];
    this.treePositions = [];
    this.isClimbing = false;

    // Create both view containers
    this.createGroundView();
    this.createCanopyView();

    // Start in ground view
    this.showGroundView();

    // Create lizard (will be repositioned based on phase)
    this.lizard = new Lizard(this, 100, GAME_HEIGHT - 150);
    this.lizard.setSwimming(false);
    this.lizard.setDepth(50);

    // Create UI
    this.hud = new HUD(this);
    this.hud.setTarget(this.getTotalBugsNeeded());
    this.hud.hideTimer(); // No timer for this level

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

    // Show intro modal
    this.showTreeIntro();
  }

  private getTotalBugsNeeded(): number {
    return TREE_CONFIG.reduce((sum, tree) => sum + tree.bugsNeeded, 0);
  }

  private createGroundView() {
    this.groundContainer = this.add.container(0, 0);

    // Sky gradient background
    const sky = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x87ceeb);
    this.groundContainer.add(sky);

    // Ground (grass)
    const ground = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 60, GAME_WIDTH, 120, COLORS.grass);
    this.groundContainer.add(ground);

    // Darker grass stripe
    const grassStripe = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 30, GAME_WIDTH, 40, COLORS.grassDark);
    this.groundContainer.add(grassStripe);

    // Create 8 trees in perspective (back to front)
    // Index 0 = Tree 1 (closest/first to climb), Index 7 = Tree 8 (farthest/last)
    this.treePositions = [
      { x: 150, y: GAME_HEIGHT - 140, scale: 1.0 },  // Tree 1 (closest - first to climb)
      { x: 220, y: GAME_HEIGHT - 150, scale: 0.9 },  // Tree 2
      { x: 300, y: GAME_HEIGHT - 160, scale: 0.8 },  // Tree 3
      { x: 380, y: GAME_HEIGHT - 170, scale: 0.7 },  // Tree 4
      { x: 460, y: GAME_HEIGHT - 180, scale: 0.6 },  // Tree 5
      { x: 540, y: GAME_HEIGHT - 190, scale: 0.55 }, // Tree 6
      { x: 620, y: GAME_HEIGHT - 200, scale: 0.5 },  // Tree 7
      { x: 700, y: GAME_HEIGHT - 210, scale: 0.4 },  // Tree 8 (farthest - last to climb)
    ];

    // Draw trees from back to front (farthest first for proper depth)
    for (let i = 7; i >= 0; i--) {
      const pos = this.treePositions[i];
      const tree = this.createTree(pos.x, pos.y, pos.scale, i);
      tree.setDepth(10 + (7 - i)); // Closer trees have higher depth
      this.treeSprites.push(tree);
      this.groundContainer.add(tree);
    }

    // Level title
    const title = this.add.text(GAME_WIDTH / 2, 30, 'Dense Jungle', {
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    });
    title.setOrigin(0.5, 0.5);
    title.setDepth(100);
    this.groundContainer.add(title);

    // Instructions
    const instructions = this.add.text(GAME_WIDTH / 2, 70, 'Walk to a tree and climb up!', {
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    });
    instructions.setOrigin(0.5, 0.5);
    instructions.setDepth(100);
    this.groundContainer.add(instructions);
  }

  private createTree(x: number, y: number, scale: number, index: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    // Trunk
    const trunkHeight = 200 * scale;
    const trunkWidth = 20 * scale;
    const trunk = this.add.rectangle(0, -trunkHeight / 2, trunkWidth, trunkHeight, 0x8b4513);
    container.add(trunk);

    // Trunk texture lines
    for (let i = 0; i < 4; i++) {
      const lineY = -trunkHeight + (i + 1) * (trunkHeight / 5);
      const line = this.add.rectangle(0, lineY, trunkWidth * 0.6, 2 * scale, 0x654321);
      container.add(line);
    }

    // Canopy (bushel) at top
    const canopySize = 80 * scale;
    const canopy = this.add.ellipse(0, -trunkHeight - canopySize * 0.3, canopySize, canopySize * 0.8, 0x228b22);
    container.add(canopy);

    // Lighter leaf highlights
    const highlight1 = this.add.ellipse(-canopySize * 0.2, -trunkHeight - canopySize * 0.4, canopySize * 0.4, canopySize * 0.3, 0x32cd32, 0.6);
    container.add(highlight1);

    // Tree number label (shows which tree it is)
    const completed = index < this.currentTree;
    const current = index === this.currentTree;

    const labelColor = completed ? '#00ff00' : (current ? '#ffff00' : '#ffffff');
    const labelText = completed ? '✓' : `${index + 1}`;

    const label = this.add.text(0, -trunkHeight - canopySize * 0.3, labelText, {
      fontSize: `${20 * scale}px`,
      fontStyle: 'bold',
      color: labelColor,
      stroke: '#000000',
      strokeThickness: 3,
    });
    label.setOrigin(0.5, 0.5);
    container.add(label);

    // Dim completed trees
    if (completed) {
      container.setAlpha(0.6);
    }

    return container;
  }

  private createCanopyView() {
    this.canopyContainer = this.add.container(0, 0);
    this.canopyContainer.setVisible(false);

    // Leafy green background
    const bg = this.add.ellipse(this.canopyCenterX, this.canopyCenterY, this.canopyRadius * 2.2, this.canopyRadius * 2, 0x228b22);
    this.canopyContainer.add(bg);

    // Inner lighter area
    const inner = this.add.ellipse(this.canopyCenterX, this.canopyCenterY, this.canopyRadius * 2, this.canopyRadius * 1.8, 0x32cd32);
    this.canopyContainer.add(inner);

    // Leaf texture (random darker patches)
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * this.canopyRadius * 0.8;
      const leafX = this.canopyCenterX + Math.cos(angle) * dist;
      const leafY = this.canopyCenterY + Math.sin(angle) * dist * 0.9;
      const leaf = this.add.ellipse(leafX, leafY, 30 + Math.random() * 20, 20 + Math.random() * 15, 0x228b22, 0.5);
      this.canopyContainer.add(leaf);
    }

    // Branch hints at edges
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const branchX = this.canopyCenterX + Math.cos(angle) * this.canopyRadius * 0.9;
      const branchY = this.canopyCenterY + Math.sin(angle) * this.canopyRadius * 0.8;
      const branch = this.add.rectangle(branchX, branchY, 8, 25, 0x8b4513);
      branch.setRotation(angle + Math.PI / 2);
      this.canopyContainer.add(branch);
    }

    this.canopyContainer.setDepth(1);
  }

  private showGroundView() {
    this.phase = 'ground';
    this.groundContainer.setVisible(true);
    this.canopyContainer.setVisible(false);

    // Position lizard on ground
    this.lizard.x = 80;
    this.lizard.y = GAME_HEIGHT - 120;
    this.lizard.setDepth(50);

    // Refresh tree visuals to show progress
    this.refreshTreeVisuals();
  }

  private refreshTreeVisuals() {
    // Recreate ground view to update tree states
    this.groundContainer.destroy();
    this.treeSprites = [];
    this.createGroundView();
    this.groundContainer.setVisible(this.phase === 'ground');
  }

  private showCanopyView() {
    this.phase = 'canopy';
    this.groundContainer.setVisible(false);
    this.canopyContainer.setVisible(true);

    // Position lizard in center of canopy
    this.lizard.x = this.canopyCenterX;
    this.lizard.y = this.canopyCenterY + 50;
    this.lizard.setDepth(50);

    // Clear old bugs and spawn new ones for this tree
    this.bugs.forEach(bug => bug.destroy());
    this.bugs = [];
    this.treeBugsCaught = 0;

    this.spawnCanopyBugs();

    // Update HUD to show current tree progress
    this.updateTreeHUD();
  }

  private updateTreeHUD() {
    const config = TREE_CONFIG[this.currentTree];
    // Show tree-specific target
    const treeLabel = this.add.text(GAME_WIDTH / 2, 100, `Tree ${this.currentTree + 1} of 8`, {
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    });
    treeLabel.setOrigin(0.5, 0.5);
    treeLabel.setDepth(200);
    this.canopyContainer.add(treeLabel);

    const bugTarget = this.add.text(GAME_WIDTH / 2, 125, `Catch ${config.bugsNeeded} bugs!`, {
      fontSize: '16px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 2,
    });
    bugTarget.setOrigin(0.5, 0.5);
    bugTarget.setDepth(200);
    this.canopyContainer.add(bugTarget);
  }

  private spawnCanopyBugs() {
    const config = TREE_CONFIG[this.currentTree];
    const bugCount = config.bugsNeeded + 2; // Spawn a few extra

    for (let i = 0; i < bugCount; i++) {
      const type = config.types[Math.floor(Math.random() * config.types.length)];
      this.spawnBug(type, config.speedMult);
    }
  }

  private spawnBug(type: BugType, speedMult: number) {
    // Spawn within canopy bounds
    const angle = Math.random() * Math.PI * 2;
    const dist = 30 + Math.random() * (this.canopyRadius - 50);
    const x = this.canopyCenterX + Math.cos(angle) * dist;
    const y = this.canopyCenterY + Math.sin(angle) * dist * 0.9;

    const bug = new Bug(this, x, y, type, this.canopyRadius, this.canopyCenterX, this.canopyCenterY);

    // Apply speed multiplier for difficulty
    bug.setSpeedMultiplier(speedMult);

    this.bugs.push(bug);
  }

  private showTreeIntro() {
    this.modal.show({
      title: '🌳 Dense Jungle',
      content: [
        'Climb 8 trees and catch bugs in each canopy!',
        '',
        'Each tree gets harder.',
        'Walk to tree 1 to begin.',
      ],
      buttons: [
        {
          text: 'Start',
          primary: true,
          callback: () => {},
        },
      ],
    });
  }

  private startClimbing(direction: 'up' | 'down') {
    this.isClimbing = true;
    this.phase = 'climbing';

    // Show climbing animation
    const climbText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2,
      direction === 'up' ? '🦎 Climbing up...' : '🦎 Climbing down...', {
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    });
    climbText.setOrigin(0.5, 0.5);
    climbText.setDepth(200);

    // Animate climb
    this.tweens.add({
      targets: climbText,
      y: direction === 'up' ? GAME_HEIGHT / 2 - 50 : GAME_HEIGHT / 2 + 50,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        climbText.destroy();
        this.isClimbing = false;
        if (direction === 'up') {
          this.showCanopyView();
        } else {
          this.currentTree++;
          if (this.currentTree >= 8) {
            this.gameOver(true);
          } else {
            this.showGroundView();
          }
        }
      },
    });
  }

  private checkTreeProximity() {
    if (this.currentTree >= 8) return;
    if (this.modal.getIsVisible()) return;

    // Get the current tree's position
    const treePos = this.treePositions[this.currentTree];
    if (!treePos) return;

    const distance = Phaser.Math.Distance.Between(this.lizard.x, this.lizard.y, treePos.x, treePos.y);

    // Larger detection radius for easier interaction
    if (distance < 60) {
      // Show prompt to climb
      this.modal.show({
        title: `🌳 Tree ${this.currentTree + 1}`,
        content: [`Ready to climb and catch ${TREE_CONFIG[this.currentTree].bugsNeeded} bugs?`],
        buttons: [
          {
            text: 'Climb Up',
            primary: true,
            callback: () => {
              this.startClimbing('up');
            },
          },
          {
            text: 'Not Yet',
            callback: () => {},
          },
        ],
      });
    }
  }

  update(_time: number, delta: number) {
    if (this.isGameOver || this.isPaused || this.modal.getIsVisible() || this.isClimbing) {
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

    if (this.phase === 'ground') {
      // Constrain to ground area (allow reaching all trees)
      // Trees range from y=GAME_HEIGHT-140 (tree 1) to y=GAME_HEIGHT-210 (tree 8)
      this.lizard.x = Phaser.Math.Clamp(this.lizard.x, 50, GAME_WIDTH - 50);
      this.lizard.y = Phaser.Math.Clamp(this.lizard.y, GAME_HEIGHT - 250, GAME_HEIGHT - 100);

      // Check if near current tree
      this.checkTreeProximity();

    } else if (this.phase === 'canopy') {
      // Constrain to canopy
      this.constrainToCanopy();

      // Update bugs
      this.bugs.forEach((bug) => bug.update(delta));

      // Check bug collisions
      this.checkBugCollisions();

      // Check if tree cleared
      const config = TREE_CONFIG[this.currentTree];
      if (this.treeBugsCaught >= config.bugsNeeded) {
        this.treeCleared();
      }
    }
  }

  private constrainToCanopy() {
    const dx = this.lizard.x - this.canopyCenterX;
    const dy = this.lizard.y - this.canopyCenterY;

    const a = this.canopyRadius - LIZARD.size / 2;
    const b = a * 0.9;

    const ellipseDistance = (dx * dx) / (a * a) + (dy * dy) / (b * b);

    if (ellipseDistance > 1) {
      const angle = Math.atan2(dy * a, dx * b);
      this.lizard.x = this.canopyCenterX + a * Math.cos(angle);
      this.lizard.y = this.canopyCenterY + b * Math.sin(angle);

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

  private checkBugCollisions() {
    const lizardCircle = this.lizard.getCollisionCircle();

    for (let i = this.bugs.length - 1; i >= 0; i--) {
      const bug = this.bugs[i];
      const bugCircle = new Phaser.Geom.Circle(bug.x, bug.y, bug.getRadius());

      if (Phaser.Geom.Intersects.CircleToCircle(lizardCircle, bugCircle)) {
        this.treeBugsCaught++;
        this.totalBugsCaught++;
        this.totalScore += bug.points;
        this.hud.addBug(bug.points);

        // Pop-up text
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

  private treeCleared() {
    // Clear remaining bugs
    this.bugs.forEach(bug => bug.destroy());
    this.bugs = [];

    const isLastTree = this.currentTree === 7;

    this.modal.show({
      title: '🌿 Tree Cleared!',
      content: [
        `Tree ${this.currentTree + 1} complete!`,
        `Bugs caught: ${this.treeBugsCaught}`,
        '',
        isLastTree ? 'All trees cleared!' : `${7 - this.currentTree} trees remaining...`,
      ],
      buttons: [
        {
          text: isLastTree ? 'Victory!' : 'Climb Down',
          primary: true,
          callback: () => {
            if (isLastTree) {
              this.gameOver(true);
            } else {
              this.startClimbing('down');
            }
          },
        },
      ],
    });
  }

  private togglePause() {
    if (this.isGameOver) return;

    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      this.modal.show({
        title: 'Paused',
        content: [`Trees cleared: ${this.currentTree}/8`, `Total bugs: ${this.totalBugsCaught}`],
        buttons: [
          {
            text: 'Resume',
            primary: true,
            callback: () => {
              this.isPaused = false;
            },
          },
          {
            text: 'Quit',
            callback: () => {
              this.scene.start('WorldMapScene', { fromLevel: 3 });
            },
          },
        ],
      });
    }
  }

  private gameOver(won: boolean) {
    if (this.isGameOver) return;
    this.isGameOver = true;

    const isNewBest = saveBestScore(3, this.totalBugsCaught, 0, this.totalScore);
    const best = getBestScore(3);

    if (won) {
      const content = [
        'All 8 trees cleared!',
        '',
        `Total bugs caught: ${this.totalBugsCaught}`,
        `Total Score: ${this.totalScore}${isNewBest ? ' NEW BEST!' : ''}`,
      ];

      if (!isNewBest && best) {
        content.push(`Your best: ${best.score}`);
      }

      this.modal.show({
        title: '🎉 Jungle Conquered!',
        content,
        buttons: [
          {
            text: 'Continue',
            primary: true,
            callback: () => {
              this.scene.start('WorldMapScene', { fromLevel: 3 });
            },
          },
        ],
      });
    } else {
      this.modal.show({
        title: 'Game Over',
        content: [
          `Trees cleared: ${this.currentTree}/8`,
          `Bugs caught: ${this.totalBugsCaught}`,
        ],
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
              this.scene.start('WorldMapScene', { fromLevel: 3 });
            },
          },
        ],
      });
    }
  }
}
