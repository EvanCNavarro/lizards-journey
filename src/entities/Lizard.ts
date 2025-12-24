import Phaser from 'phaser';
import { LIZARD } from '../config/constants';

export class Lizard extends Phaser.GameObjects.Container {
  declare body: Phaser.Physics.Arcade.Body;
  private bodySprite: Phaser.GameObjects.Ellipse;
  private head: Phaser.GameObjects.Ellipse;
  private tail: Phaser.GameObjects.Ellipse;
  private eyeLeft: Phaser.GameObjects.Arc;
  private eyeRight: Phaser.GameObjects.Arc;
  private legs: Phaser.GameObjects.Rectangle[] = [];

  private speed: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.speed = LIZARD.speed;

    // Create lizard body parts (geometric shapes)
    // Main body (ellipse)
    this.bodySprite = scene.add.ellipse(0, 0, LIZARD.size, LIZARD.size * 0.6, LIZARD.color);
    this.add(this.bodySprite);

    // Head (smaller ellipse)
    this.head = scene.add.ellipse(LIZARD.size * 0.4, 0, LIZARD.size * 0.5, LIZARD.size * 0.4, LIZARD.color);
    this.add(this.head);

    // Tail (thin ellipse)
    this.tail = scene.add.ellipse(-LIZARD.size * 0.5, 0, LIZARD.size * 0.6, LIZARD.size * 0.15, LIZARD.color);
    this.add(this.tail);

    // Eyes
    this.eyeLeft = scene.add.circle(LIZARD.size * 0.5, -4, 3, 0x000000);
    this.eyeRight = scene.add.circle(LIZARD.size * 0.5, 4, 3, 0x000000);
    this.add(this.eyeLeft);
    this.add(this.eyeRight);

    // Legs (4 small rectangles)
    const legPositions = [
      { x: -8, y: -10 },
      { x: -8, y: 10 },
      { x: 8, y: -10 },
      { x: 8, y: 10 },
    ];

    legPositions.forEach((pos) => {
      const leg = scene.add.rectangle(pos.x, pos.y, 8, 4, LIZARD.color);
      this.legs.push(leg);
      this.add(leg);
    });

    // Add to scene
    scene.add.existing(this);

    // Enable physics
    scene.physics.add.existing(this);
    this.body = this.body as Phaser.Physics.Arcade.Body;
    this.body.setCircle(LIZARD.size / 2);
    this.body.setOffset(-LIZARD.size / 2, -LIZARD.size / 2);
    this.body.setCollideWorldBounds(true);

    this.setDepth(50);
  }

  setSwimming(swimming: boolean) {
    this.speed = swimming ? LIZARD.swimSpeed : LIZARD.speed;

    // Visual change for swimming (slightly squished)
    if (swimming) {
      this.bodySprite.setFillStyle(LIZARD.color, 0.8);
    } else {
      this.bodySprite.setFillStyle(LIZARD.color, 1);
    }
  }

  move(dx: number, dy: number) {
    // Normalize diagonal movement
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length > 0) {
      const normalizedX = dx / length;
      const normalizedY = dy / length;

      this.body.setVelocity(normalizedX * this.speed, normalizedY * this.speed);

      // Rotate to face movement direction
      const angle = Math.atan2(dy, dx);
      this.setRotation(angle);

      // Animate legs
      this.animateLegs();
    } else {
      this.body.setVelocity(0, 0);
    }
  }

  private animateLegs() {
    const time = this.scene.time.now;
    const legOffset = Math.sin(time * 0.02) * 3;

    this.legs[0].y = -10 + legOffset;
    this.legs[1].y = 10 - legOffset;
    this.legs[2].y = -10 - legOffset;
    this.legs[3].y = 10 + legOffset;
  }

  getCollisionCircle(): Phaser.Geom.Circle {
    return new Phaser.Geom.Circle(this.x, this.y, LIZARD.size / 2);
  }

  stop() {
    this.body.setVelocity(0, 0);
  }
}
