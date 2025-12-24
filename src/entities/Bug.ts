import Phaser from 'phaser';
import { BUG_TYPES } from '../config/constants';

export type BugType = keyof typeof BUG_TYPES;

export class Bug extends Phaser.GameObjects.Container {
  declare body: Phaser.Physics.Arcade.Body;
  public bugType: BugType;
  public points: number;

  private bodySprite: Phaser.GameObjects.Arc;
  private wings: Phaser.GameObjects.Arc[] = [];
  private config: typeof BUG_TYPES.fly;
  private direction: Phaser.Math.Vector2;
  private jitterTimer: number = 0;
  private boundaryRadius: number;
  private centerX: number;
  private centerY: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    type: BugType,
    boundaryRadius: number,
    centerX: number,
    centerY: number
  ) {
    super(scene, x, y);

    this.bugType = type;
    this.config = BUG_TYPES[type];
    this.points = this.config.points;
    this.boundaryRadius = boundaryRadius;
    this.centerX = centerX;
    this.centerY = centerY;

    // Random initial direction
    const angle = Math.random() * Math.PI * 2;
    this.direction = new Phaser.Math.Vector2(Math.cos(angle), Math.sin(angle));

    // Create bug body
    this.bodySprite = scene.add.circle(0, 0, this.config.size / 2, this.config.color);
    this.add(this.bodySprite);

    // Add wings for flies and dragonflies
    if (type === 'fly' || type === 'dragonfly') {
      const wingSize = this.config.size * 0.4;
      const wingLeft = scene.add.circle(-wingSize, -wingSize * 0.5, wingSize, 0xcccccc, 0.6);
      const wingRight = scene.add.circle(-wingSize, wingSize * 0.5, wingSize, 0xcccccc, 0.6);
      this.wings.push(wingLeft, wingRight);
      this.add(wingLeft);
      this.add(wingRight);
    }

    // Add legs for beetles and crickets
    if (type === 'beetle' || type === 'cricket') {
      for (let i = 0; i < 3; i++) {
        const legY = (i - 1) * (this.config.size * 0.3);
        const legLeft = scene.add.rectangle(-this.config.size * 0.4, legY, 4, 2, this.config.color);
        const legRight = scene.add.rectangle(this.config.size * 0.4, legY, 4, 2, this.config.color);
        this.add(legLeft);
        this.add(legRight);
      }
    }

    // Add to scene
    scene.add.existing(this);

    // Enable physics
    scene.physics.add.existing(this);
    this.body = this.body as Phaser.Physics.Arcade.Body;
    this.body.setCircle(this.config.size / 2);
    this.body.setOffset(-this.config.size / 2, -this.config.size / 2);

    this.setDepth(40);
  }

  update(delta: number) {
    // Jitter - random direction changes based on jitter value
    this.jitterTimer += delta;
    const jitterInterval = 500 / this.config.jitter; // Higher jitter = more frequent changes

    if (this.jitterTimer >= jitterInterval) {
      this.jitterTimer = 0;

      // Random direction adjustment
      const angleChange = (Math.random() - 0.5) * Math.PI * this.config.jitter;
      const currentAngle = Math.atan2(this.direction.y, this.direction.x);
      const newAngle = currentAngle + angleChange;
      this.direction.set(Math.cos(newAngle), Math.sin(newAngle));
    }

    // Check boundary and redirect toward center if needed
    const distFromCenter = Phaser.Math.Distance.Between(this.x, this.y, this.centerX, this.centerY);
    if (distFromCenter > this.boundaryRadius * 0.8) {
      // Turn back toward center
      const angleToCenter = Phaser.Math.Angle.Between(this.x, this.y, this.centerX, this.centerY);
      this.direction.set(Math.cos(angleToCenter), Math.sin(angleToCenter));
    }

    // Apply movement
    this.body.setVelocity(
      this.direction.x * this.config.speed,
      this.direction.y * this.config.speed
    );

    // Face movement direction
    const angle = Math.atan2(this.direction.y, this.direction.x);
    this.setRotation(angle);

    // Animate wings
    if (this.wings.length > 0) {
      const wingFlutter = Math.sin(this.scene.time.now * 0.05) * 2;
      this.wings[0].y = -this.config.size * 0.3 + wingFlutter;
      this.wings[1].y = this.config.size * 0.3 - wingFlutter;
    }
  }

  getRadius(): number {
    return this.config.size / 2;
  }
}
